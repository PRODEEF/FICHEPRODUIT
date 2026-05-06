import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/useAuth';
import { getSupabaseClient } from '@lib/api/supabase';
import {
  normalizeProductTemplateFieldType,
  productTemplateFieldTypeLabel,
  type ProductTemplateField,
  type ProductTemplateRow,
} from '../lib/productTemplates';
import {
  inferProductTemplateFieldTypeFromCsvHeader,
  parseCsvHeadersAndFirstDataRow,
} from '../lib/csvHeaders';
import { refineTemplateFields, scrapeProductPage } from '../lib/productSheetApi';
import {
  getCachedProductTemplatesList,
  setCachedProductTemplatesList,
} from '../lib/productTemplatesCache';
import {
  TemplateFieldsEditor,
  type TemplateFieldRow,
} from './TemplateFieldsEditor';

type View = { kind: 'list' } | { kind: 'edit'; templateId: string };

type DraftState = {
  templateName: string;
  fieldRows: TemplateFieldRow[];
};

function newRowId(): string {
  return crypto.randomUUID();
}

function fieldsToRows(fields: ProductTemplateField[]): TemplateFieldRow[] {
  return fields.map((f) => ({
    id: newRowId(),
    name: f.name,
    type: normalizeProductTemplateFieldType(String(f.type)),
    required: f.required ?? false,
  }));
}

function rowsToFields(rows: TemplateFieldRow[]): ProductTemplateField[] {
  return rows
    .map((r) => ({
      name: r.name.trim(),
      type: r.type,
      required: r.required,
    }))
    .filter((f) => f.name.length > 0);
}

function applyRefinedFieldsToRows(
  previous: TemplateFieldRow[],
  refined: ProductTemplateField[],
): TemplateFieldRow[] {
  return refined.map((f, i) => ({
    id: previous[i]?.id ?? newRowId(),
    name: f.name,
    type: f.type,
    required: f.required ?? false,
  }));
}

function defaultNewTemplateName(existingCount: number): string {
  return existingCount === 0 ? 'Fiche par défaut' : `Fiche ${existingCount + 1}`;
}

export type ProductSheetMainTab = 'mes-fiches' | 'nouvelle';

export type ProductTemplatesWorkspaceProps = {
  sheetTab: ProductSheetMainTab;
  onSheetTabChange: (tab: ProductSheetMainTab) => void;
  onEditModeChange?: (editing: boolean) => void;
};

export function ProductTemplatesWorkspace({
  sheetTab,
  onSheetTabChange,
  onEditModeChange,
}: ProductTemplatesWorkspaceProps) {
  const { user, session, profile, profileLoading } = useAuth();
  const [templates, setTemplates] = useState<ProductTemplateRow[]>(() => {
    const id = user?.id;
    if (!id) return [];
    return getCachedProductTemplatesList(id) ?? [];
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(() => {
    const id = user?.id;
    if (!id) return true;
    return getCachedProductTemplatesList(id) === undefined;
  });
  const [view, setView] = useState<View>({ kind: 'list' });

  const [templateName, setTemplateName] = useState('Fiche par défaut');
  const [fieldRows, setFieldRows] = useState<TemplateFieldRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeNotes, setScrapeNotes] = useState<string | null>(null);
  const [urlEmptyError, setUrlEmptyError] = useState(false);
  const [draftFieldSamples, setDraftFieldSamples] = useState<Record<string, string> | null>(null);
  const [draftSource, setDraftSource] = useState<'csv' | 'product_page' | null>(null);
  const [refiningAi, setRefiningAi] = useState(false);
  const [aiRefineHint, setAiRefineHint] = useState<string | null>(null);

  const [draft, setDraft] = useState<DraftState | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);

  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [modalTemplateName, setModalTemplateName] = useState('');
  const [modalFieldRows, setModalFieldRows] = useState<TemplateFieldRow[]>([]);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const csvInputRef = useRef<HTMLInputElement>(null);

  const refreshList = useCallback(async () => {
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoadError('Configuration Supabase manquante.');
      setLoadingList(false);
      return;
    }
    setLoadError(null);
    const { data, error } = await supabase
      .from('product_templates')
      .select('*')
      .eq('client_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      setLoadError(error.message);
      setTemplates([]);
    } else {
      const rows = (data ?? []) as ProductTemplateRow[];
      setTemplates(rows);
      setCachedProductTemplatesList(user.id, rows);
    }
    setLoadingList(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void refreshList();
  }, [user, refreshList]);

  useEffect(() => {
    if (profile?.website_url) {
      setScrapeUrl((prev) => (prev.trim() === '' ? profile.website_url! : prev));
    }
  }, [profile?.website_url]);

  const persistTemplate = async (
    templateId: string | undefined,
    name: string,
    rows: TemplateFieldRow[],
  ) => {
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Configuration Supabase manquante.');
    }
    const fields = rowsToFields(rows);
    if (fields.length === 0) {
      throw new Error('Ajoutez au moins un champ.');
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Indiquez un nom pour la fiche type.');
    }

    if (templateId) {
      const { error } = await supabase
        .from('product_templates')
        .update({
          name: trimmedName,
          fields,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId)
        .eq('client_id', user.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from('product_templates').insert({
        client_id: user.id,
        name: trimmedName,
        fields,
      });
      if (error) throw new Error(error.message);
    }
    await refreshList();
  };

  const openEdit = (t: ProductTemplateRow) => {
    setActionError(null);
    setAiRefineHint(null);
    setTemplateName(t.name);
    setFieldRows(fieldsToRows(t.fields));
    setView({ kind: 'edit', templateId: t.id });
    onEditModeChange?.(true);
  };

  const saveEdit = async () => {
    if (view.kind !== 'edit') return;
    setSaving(true);
    setActionError(null);
    try {
      await persistTemplate(view.templateId, templateName, fieldRows);
      setView({ kind: 'list' });
      onEditModeChange?.(false);
      onSheetTabChange('mes-fiches');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const onCsvFile = (file: File | null) => {
    if (!file) return;
    setActionError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setAiRefineHint(null);
      const parsed = parseCsvHeadersAndFirstDataRow(text);
      if (!parsed) {
        setActionError('Impossible de lire les en-têtes du CSV.');
        return;
      }
      const { headers, sampleByHeader } = parsed;
      if (headers.length === 0) {
        setActionError('Impossible de lire les en-têtes du CSV.');
        return;
      }
      setDraftFieldSamples(Object.keys(sampleByHeader).length > 0 ? sampleByHeader : null);
      setDraftSource('csv');
      setDraft({
        templateName: defaultNewTemplateName(templates.length),
        fieldRows: headers.map((name) => ({
          id: newRowId(),
          name,
          type: inferProductTemplateFieldTypeFromCsvHeader(name),
          required: false,
        })),
      });
      setScrapeNotes(null);
    };
    reader.readAsText(file, 'UTF-8');
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  const onUrlAnalyzeSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runScrape();
  };

  const runScrape = async () => {
    const token = session?.access_token;
    if (!token) {
      setActionError('Session expirée. Reconnectez-vous.');
      return;
    }
    const url = scrapeUrl.trim();
    if (!url) {
      setUrlEmptyError(true);
      return;
    }
    setUrlEmptyError(false);
    setScraping(true);
    setActionError(null);
    setScrapeNotes(null);
    setAiRefineHint(null);
    try {
      const res = await scrapeProductPage(url, token);
      setDraftFieldSamples(null);
      setDraftSource('product_page');
      setDraft({
        templateName: defaultNewTemplateName(templates.length),
        fieldRows: fieldsToRows(res.fields),
      });
      if (res.warnings.length > 0) {
        setScrapeNotes(res.warnings.map((w) => `${w.code}: ${w.message}`).join(' · '));
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Analyse URL impossible.');
    } finally {
      setScraping(false);
    }
  };

  const refineDraftWithAi = async () => {
    const token = session?.access_token;
    if (!draft || !token) return;
    const rows = draft.fieldRows;
    if (rows.some((r) => !r.name.trim())) {
      setActionError('Renseignez un nom pour chaque champ avant d’utiliser l’IA.');
      return;
    }
    setRefiningAi(true);
    setAiRefineHint(null);
    setActionError(null);
    try {
      const source =
        draftSource === 'csv'
          ? 'csv_import'
          : draftSource === 'product_page'
            ? 'product_page'
            : 'manual';
      const res = await refineTemplateFields(
        {
          source,
          fields: rows.map((r) => ({
            name: r.name.trim(),
            type: r.type,
            required: r.required,
          })),
          sampleValues:
            draftFieldSamples && Object.keys(draftFieldSamples).length > 0
              ? draftFieldSamples
              : undefined,
        },
        token,
      );
      setDraft((d) =>
        d
          ? {
              ...d,
              fieldRows: applyRefinedFieldsToRows(d.fieldRows, res.fields),
            }
          : d,
      );
      if (res.refinedWithAi) {
        setAiRefineHint(res.message?.trim() ? res.message.trim() : 'Champs affinés par l’IA.');
      } else if (res.message?.trim()) {
        setAiRefineHint(res.message.trim());
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Affinage IA impossible.');
    } finally {
      setRefiningAi(false);
    }
  };

  const refineEditWithAi = async () => {
    const token = session?.access_token;
    if (!token) return;
    if (fieldRows.some((r) => !r.name.trim())) {
      setActionError('Renseignez un nom pour chaque champ avant d’utiliser l’IA.');
      return;
    }
    setRefiningAi(true);
    setAiRefineHint(null);
    setActionError(null);
    try {
      const res = await refineTemplateFields(
        {
          source: 'manual',
          fields: fieldRows.map((r) => ({
            name: r.name.trim(),
            type: r.type,
            required: r.required,
          })),
        },
        token,
      );
      setFieldRows((prev) => applyRefinedFieldsToRows(prev, res.fields));
      if (res.refinedWithAi) {
        setAiRefineHint(res.message?.trim() ? res.message.trim() : 'Champs affinés par l’IA.');
      } else if (res.message?.trim()) {
        setAiRefineHint(res.message.trim());
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Affinage IA impossible.');
    } finally {
      setRefiningAi(false);
    }
  };

  const saveDraft = async () => {
    if (!draft) return;
    setDraftSaving(true);
    setActionError(null);
    try {
      await persistTemplate(undefined, draft.templateName, draft.fieldRows);
      setDraft(null);
      setDraftFieldSamples(null);
      setDraftSource(null);
      setAiRefineHint(null);
      setScrapeNotes(null);
      onSheetTabChange('mes-fiches');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setDraftSaving(false);
    }
  };

  const openManualModal = () => {
    setModalError(null);
    setModalTemplateName(defaultNewTemplateName(templates.length));
    setModalFieldRows([
      {
        id: newRowId(),
        name: '',
        type: 'text',
        required: false,
      },
    ]);
    setManualModalOpen(true);
  };

  const closeManualModal = () => {
    setManualModalOpen(false);
    setModalError(null);
  };

  const saveManualModal = async () => {
    setModalSaving(true);
    setModalError(null);
    try {
      await persistTemplate(undefined, modalTemplateName, modalFieldRows);
      closeManualModal();
      onSheetTabChange('mes-fiches');
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setModalSaving(false);
    }
  };

  if (profileLoading || loadingList) {
    return (
      <p className="analyses-status" aria-busy="true">
        Chargement des fiches type…
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="analyses-status analyses-status-error" role="alert">
        {loadError}
      </p>
    );
  }

  if (view.kind === 'list') {
    return (
      <div className="product-templates-workspace">
        <div
          role="tabpanel"
          id="panel-mes-fiches"
          aria-labelledby="tab-mes-fiches"
          hidden={sheetTab !== 'mes-fiches'}
          className="product-sheet-tab-panel"
        >
          {templates.length === 0 ? (
            <div className="product-templates-empty-mes-fiches">
              <p className="product-sheet-intro">
                Vous n&apos;avez pas encore de fiche type. Définissez la structure des champs (colonnes)
                pour vos imports PrestaShop.
              </p>
              <button
                type="button"
                className="product-sheet-save-btn"
                onClick={() => onSheetTabChange('nouvelle')}
              >
                Créer une fiche
              </button>
            </div>
          ) : (
            <ul className="product-templates-list">
              <p className="product-sheet-intro product-templates-new-fiche-intro">
                Retrouvez et gérez vos fiches produit types.
              </p>
              {templates.map((t) => (
                <li key={t.id} className="product-templates-card">
                  <div className="product-templates-card-head">
                    <div>
                      <h3 className="product-templates-card-title">{t.name}</h3>
                      <p className="product-templates-card-meta">
                        {t.fields.length} champ{t.fields.length > 1 ? 's' : ''} ·{' '}
                        {new Date(t.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="product-sheet-analyze-btn"
                      onClick={() => openEdit(t)}
                    >
                      Modifier
                    </button>
                  </div>
                  <div className="analyses-table-wrap product-templates-card-table">
                    <table className="analyses-table">
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Type</th>
                          <th>Requis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.fields.map((f, i) => (
                          <tr key={`${t.id}-${i}-${f.name}`}>
                            <td>{f.name}</td>
                            <td>{productTemplateFieldTypeLabel(f.type)}</td>
                            <td>{f.required ? 'Oui' : 'Non'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          role="tabpanel"
          id="panel-nouvelle-fiche"
          aria-labelledby="tab-nouvelle-fiche"
          hidden={sheetTab !== 'nouvelle'}
          className="product-sheet-tab-panel"
        >
          <section
            className="product-templates-new-fiche"
            aria-labelledby="product-templates-new-fiche-title"
          >
            <p className="product-sheet-intro product-templates-new-fiche-intro">
              Importez un CSV PrestaShop, analysez une URL produit, ou créez vos champs à la main.
            </p>

            <h2
              id="product-templates-new-fiche-title"
              className="product-templates-new-fiche-title"
            >
              Nouvelle fiche
            </h2>

            <div className="product-templates-new-fiche-toolbar">
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                className="product-templates-csv-input-hidden"
                aria-hidden
                tabIndex={-1}
                onChange={(e) => onCsvFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                className="product-templates-csv-btn"
                onClick={() => csvInputRef.current?.click()}
              >
                Importer CSV
              </button>

              <form
                className="search-container product-templates-url-search"
                onSubmit={onUrlAnalyzeSubmit}
              >
                <input
                  className="search-bar"
                  type="url"
                  placeholder="URL à analyser"
                  value={scrapeUrl}
                  onChange={(e) => {
                    setScrapeUrl(e.target.value);
                    setUrlEmptyError(false);
                  }}
                  disabled={scraping}
                  aria-busy={scraping}
                  aria-invalid={urlEmptyError}
                  aria-describedby={urlEmptyError ? 'product-template-url-empty' : undefined}
                />
                <button type="submit" className="search-btn" disabled={scraping}>
                  {scraping ? '…' : 'Analyser'}
                </button>
              </form>
            </div>

            {urlEmptyError ? (
              <p
                id="product-template-url-empty"
                className="landing-search-error product-templates-url-error"
                role="alert"
              >
                Indiquez une URL à analyser
              </p>
            ) : null}

            {scrapeNotes ? <p className="product-templates-scrape-notes">{scrapeNotes}</p> : null}

            <button
              type="button"
              className="product-templates-manual-cta"
              onClick={openManualModal}
            >
              Créer votre fiche à la main
            </button>

            {actionError ? (
              <p className="analyses-status analyses-status-error" role="alert">
                {actionError}
              </p>
            ) : null}

            {draft ? (
              <div className="product-templates-draft">
                <label className="analyses-field">
                  <span className="analyses-field-label">Nom de la fiche type</span>
                  <input
                    type="text"
                    className="analyses-input"
                    value={draft.templateName}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, templateName: e.target.value } : d))
                    }
                  />
                </label>
                <div className="product-templates-fields-header">
                  <h3 className="analyses-section-title">Champs</h3>
                  <div className="product-templates-fields-header-actions">
                    <button
                      type="button"
                      className="product-sheet-analyze-btn"
                      disabled={
                        refiningAi ||
                        draftSaving ||
                        !session?.access_token ||
                        draft.fieldRows.length === 0 ||
                        draft.fieldRows.some((r) => !r.name.trim())
                      }
                      onClick={() => void refineDraftWithAi()}
                    >
                      {refiningAi ? 'IA…' : 'Affiner avec l’IA'}
                    </button>
                    <button
                      type="button"
                      className="product-sheet-analyze-btn"
                      onClick={() =>
                        setDraft((d) =>
                          d
                            ? {
                                ...d,
                                fieldRows: [
                                  ...d.fieldRows,
                                  {
                                    id: newRowId(),
                                    name: '',
                                    type: 'text',
                                    required: false,
                                  },
                                ],
                              }
                            : d,
                        )
                      }
                    >
                      Ajouter un champ
                    </button>
                  </div>
                </div>
                {aiRefineHint ? (
                  <p className="product-templates-ai-hint" role="status">
                    {aiRefineHint}
                  </p>
                ) : null}
                <TemplateFieldsEditor
                  rows={draft.fieldRows}
                  onChange={(rows) => setDraft((d) => (d ? { ...d, fieldRows: rows } : d))}
                />
                <div className="product-templates-draft-actions">
                  <button
                    type="button"
                    className="product-sheet-save-btn"
                    disabled={draftSaving}
                    onClick={() => void saveDraft()}
                  >
                    {draftSaving ? 'Enregistrement…' : 'Enregistrer la fiche'}
                  </button>
                  <button
                    type="button"
                    className="product-templates-draft-cancel"
                    disabled={draftSaving}
                    onClick={() => {
                      setDraft(null);
                      setDraftFieldSamples(null);
                      setDraftSource(null);
                      setAiRefineHint(null);
                      setScrapeNotes(null);
                    }}
                  >
                    Abandonner
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        {manualModalOpen ? (
          <div
            className="product-template-modal-backdrop"
            role="presentation"
            onClick={closeManualModal}
          >
            <div
              className="product-template-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-template-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="product-template-modal-title" className="product-template-modal-title">
                Créer votre fiche à la main
              </h2>
              <label className="analyses-field">
                <span className="analyses-field-label">Nom de la fiche type</span>
                <input
                  type="text"
                  className="analyses-input"
                  value={modalTemplateName}
                  onChange={(e) => setModalTemplateName(e.target.value)}
                />
              </label>
              <div className="product-templates-fields-header">
                <h3 className="analyses-section-title">Champs</h3>
                <button
                  type="button"
                  className="product-sheet-analyze-btn"
                  onClick={() =>
                    setModalFieldRows((prev) => [
                      ...prev,
                      {
                        id: newRowId(),
                        name: '',
                        type: 'text',
                        required: false,
                      },
                    ])
                  }
                >
                  Ajouter un champ
                </button>
              </div>
              <TemplateFieldsEditor rows={modalFieldRows} onChange={setModalFieldRows} />
              {modalError ? (
                <p className="analyses-status analyses-status-error" role="alert">
                  {modalError}
                </p>
              ) : null}
              <div className="product-template-modal-actions">
                <button
                  type="button"
                  className="product-sheet-save-btn"
                  disabled={modalSaving}
                  onClick={() => void saveManualModal()}
                >
                  {modalSaving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  className="product-templates-draft-cancel"
                  disabled={modalSaving}
                  onClick={closeManualModal}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (view.kind === 'edit') {
    return (
      <div className="product-templates-workspace">
        <button
          type="button"
          className="product-templates-back"
          onClick={() => {
            setView({ kind: 'list' });
            setActionError(null);
            setAiRefineHint(null);
            onEditModeChange?.(false);
          }}
        >
          Annuler
        </button>

        <label className="analyses-field">
          <span className="analyses-field-label">Nom de la fiche type</span>
          <input
            type="text"
            className="analyses-input"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </label>

        <div className="product-templates-fields-header">
          <h3 className="analyses-section-title">Champs</h3>
          <div className="product-templates-fields-header-actions">
            <button
              type="button"
              className="product-sheet-analyze-btn"
              disabled={
                refiningAi ||
                saving ||
                !session?.access_token ||
                fieldRows.length === 0 ||
                fieldRows.some((r) => !r.name.trim())
              }
              onClick={() => void refineEditWithAi()}
            >
              {refiningAi ? 'IA…' : 'Affiner avec l’IA'}
            </button>
            <button
              type="button"
              className="product-sheet-analyze-btn"
              onClick={() =>
                setFieldRows((prev) => [
                  ...prev,
                  {
                    id: newRowId(),
                    name: '',
                    type: 'text',
                    required: false,
                  },
                ])
              }
            >
              Ajouter un champ
            </button>
          </div>
        </div>
        {aiRefineHint ? (
          <p className="product-templates-ai-hint" role="status">
            {aiRefineHint}
          </p>
        ) : null}
        <TemplateFieldsEditor rows={fieldRows} onChange={setFieldRows} />

        {actionError ? (
          <p className="analyses-status analyses-status-error" role="alert">
            {actionError}
          </p>
        ) : null}

        <div className="product-sheet-actions">
          <button
            type="button"
            className="product-sheet-save-btn"
            disabled={saving}
            onClick={() => void saveEdit()}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
