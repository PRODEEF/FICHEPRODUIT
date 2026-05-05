import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import type { Product, ProductListResponse, SiteAnalysis } from '../../lib/analysisApi';
const STATUS_LABELS: Record<SiteAnalysis['status'], string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminée',
  failed: 'Échec',
};

function formatPrice(price: number | undefined, currency: string) {
  if (price == null || Number.isNaN(price)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(price);
}

function formatCmsLabel(cms: SiteAnalysis['cmsType'] | undefined): string {
  if (!cms || cms === 'unknown') return 'Inconnu';
  const map: Record<string, string> = {
    prestashop: 'PrestaShop',
    shopify: 'Shopify',
    woocommerce: 'WooCommerce',
  };
  return map[cms] ?? cms;
}

function uniqueSorted(values: Iterable<string>): string[] {
  const s = new Set<string>();
  for (const v of values) {
    const t = v.trim();
    if (t) s.add(t);
  }
  return [...s].sort((a, b) => a.localeCompare(b, 'fr'));
}

export type ResultTab = 'catalog' | 'template';

export type AnalyseResultProps = {
  loading: boolean;
  error: string | null;
  analysis: SiteAnalysis | null;
  productPayload: ProductListResponse | null;
  activeTab: ResultTab;
  onActiveTabChange: (tab: ResultTab) => void;
};

export function AnalyseResult(props: AnalyseResultProps) {
  const stableKey = props.analysis?.id ?? 'none';
  return <AnalyseResultInner key={stableKey} {...props} />;
}

function AnalyseResultInner({
  loading,
  error,
  analysis,
  productPayload,
  activeTab,
  onActiveTabChange,
}: AnalyseResultProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubCategory, setFilterSubCategory] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    queueMicrotask(() => setSelectedIds(new Set()));
  }, [searchQuery, filterBrand, filterCategory, filterSubCategory, filterYear]);

  const products = useMemo(() => {
    const raw = productPayload?.products ?? [];
    return raw.filter((p) => !removedIds.has(p.id));
  }, [productPayload?.products, removedIds]);

  const brandOptions = useMemo(() => {
    const fromApi = productPayload?.brands ?? [];
    if (fromApi.length) return uniqueSorted(fromApi);
    return uniqueSorted(products.map((p) => p.brand).filter(Boolean) as string[]);
  }, [productPayload?.brands, products]);

  const categoryOptions = useMemo(() => {
    const fromApi = productPayload?.categories ?? [];
    if (fromApi.length) return uniqueSorted(fromApi);
    return uniqueSorted(products.map((p) => p.category).filter(Boolean) as string[]);
  }, [productPayload?.categories, products]);

  const subCategoryOptions = useMemo(() => {
    const fromApi = productPayload?.subCategories ?? [];
    if (fromApi.length) return uniqueSorted(fromApi);
    return uniqueSorted(products.map((p) => p.subCategory).filter(Boolean) as string[]);
  }, [productPayload?.subCategories, products]);

  const yearOptions = useMemo(() => {
    const fromApi = productPayload?.years ?? [];
    if (fromApi.length) return uniqueSorted(fromApi);
    return uniqueSorted(products.map((p) => p.year).filter(Boolean) as string[]);
  }, [productPayload?.years, products]);

  const brandsForChips = useMemo(() => {
    const fromAnalysis =
      analysis?.brandsList && analysis.brandsList.length > 0 ? analysis.brandsList : null;
    if (fromAnalysis) return [...fromAnalysis];
    return brandOptions;
  }, [analysis, brandOptions]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p: Product) => {
      if (filterBrand && p.brand !== filterBrand) return false;
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterSubCategory && p.subCategory !== filterSubCategory) return false;
      if (filterYear && p.year !== filterYear) return false;
      if (q) {
        const searchText = [
          p.brand,
          p.category,
          p.subCategory,
          p.title,
          p.description,
          p.commercialDescription,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchText.includes(q)) return false;
      }
      return true;
    });
  }, [products, searchQuery, filterBrand, filterCategory, filterSubCategory, filterYear]);

  const allFilteredSelected =
    filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id));

  const someFilteredSelected = filteredProducts.some((p) => selectedIds.has(p.id));

  const toggleOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const p of filteredProducts) next.delete(p.id);
      } else {
        for (const p of filteredProducts) next.add(p.id);
      }
      return next;
    });
  }, [allFilteredSelected, filteredProducts]);

  const selectedInViewCount = useMemo(
    () => filteredProducts.filter((p) => selectedIds.has(p.id)).length,
    [filteredProducts, selectedIds],
  );

  const importSelected = useCallback(() => {
    window.alert(`${selectedInViewCount} fiche(s) importée(s) avec succès !`);
  }, [selectedInViewCount]);

  const deleteSelected = useCallback(() => {
    const toRemove = filteredProducts.filter((p) => selectedIds.has(p.id));
    if (toRemove.length === 0) return;
    if (!window.confirm(`Supprimer ${toRemove.length} fiche(s) de la vue ?`)) {
      return;
    }
    setRemovedIds((prev) => {
      const next = new Set(prev);
      for (const p of toRemove) next.add(p.id);
      return next;
    });
    setSelectedIds(new Set());
  }, [filteredProducts, selectedIds]);

  const productCountDisplay =
    analysis?.productCount != null && analysis.productCount > 0
      ? analysis.productCount
      : products.length;

  const brandCountDisplay =
    analysis?.brandsList && analysis.brandsList.length > 0
      ? analysis.brandsList.length
      : brandOptions.length;

  if (loading) {
    return (
      <p className="analyses-status" aria-busy="true">
        Chargement…
      </p>
    );
  }

  if (error) {
    return (
      <div className="analyses-alert" role="alert">
        {error}
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const vertical = analysis.verticalSummary?.trim();
  const sellsLine = vertical ? `Vous vendez ${vertical}.` : null;

  return (
    <>
      {analysis.status === 'failed' && analysis.errorMessage ? (
        <div className="analyses-alert analyses-alert--error" role="alert">
          {analysis.errorMessage}
        </div>
      ) : null}

      {analysis.status === 'completed' ? (
        <>
          <div className="analyses-site-tag-wrap">
            <p className="analyses-site-tag" title={analysis.url}>
              🔗 {analysis.url} — {formatCmsLabel(analysis.cmsType)} — {brandCountDisplay} marques —{' '}
              {productCountDisplay} produits
            </p>
            {sellsLine ? <p className="analyses-site-tag-sub">{sellsLine}</p> : null}
          </div>

          <div className="analyses-tabs" role="tablist" aria-label="Sections">
            <button
              type="button"
              role="tab"
              id="tab-catalog"
              aria-selected={activeTab === 'catalog'}
              aria-controls="panel-catalog"
              className={`analyses-tab-btn${activeTab === 'catalog' ? ' analyses-tab-btn--active' : ''}`}
              onClick={() => onActiveTabChange('catalog')}
            >
              Recherche &amp; catalogue
            </button>
            <button
              type="button"
              role="tab"
              id="tab-template"
              aria-selected={activeTab === 'template'}
              aria-controls="panel-template"
              className={`analyses-tab-btn${activeTab === 'template' ? ' analyses-tab-btn--active' : ''}`}
              onClick={() => onActiveTabChange('template')}
            >
              Ma fiche produit
            </button>
            <Link to="/product-sheet" className="analyses-tab-link">
              Ouvrir la fiche type en pleine page →
            </Link>
          </div>

          <div
            role="tabpanel"
            id="panel-catalog"
            aria-labelledby="tab-catalog"
            hidden={activeTab !== 'catalog'}
            className="analyses-tab-panel"
          >
            <section
              className="analyses-products-section"
              aria-labelledby="analyses-products-heading"
            >
              <h2 id="analyses-products-heading" className="analyses-section-title">
                Produits proposés
              </h2>

              {brandsForChips.length > 0 ? (
                <div className="analyses-brand-chips" aria-label="Marques principales">
                  {brandsForChips.map((b) => (
                    <button
                      key={b}
                      type="button"
                      className={`analyses-chip${filterBrand === b ? ' analyses-chip--active' : ''}`}
                      onClick={() => setFilterBrand(filterBrand === b ? '' : b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="analyses-filters" role="search" aria-label="Filtrer les produits">
                <label className="analyses-field">
                  <span className="analyses-field-label">Recherche</span>
                  <input
                    type="search"
                    className="analyses-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Marque, catégorie, titre, description…"
                  />
                </label>
                <label className="analyses-field">
                  <span className="analyses-field-label">Marque</span>
                  <select
                    className="analyses-select"
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                  >
                    <option value="">Toutes</option>
                    {brandOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="analyses-field">
                  <span className="analyses-field-label">Année</span>
                  <select
                    className="analyses-select"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                  >
                    <option value="">Toutes</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="analyses-field">
                  <span className="analyses-field-label">Catégorie</span>
                  <select
                    className="analyses-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">Toutes</option>
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="analyses-field">
                  <span className="analyses-field-label">Sous-catégorie</span>
                  <select
                    className="analyses-select"
                    value={filterSubCategory}
                    onChange={(e) => setFilterSubCategory(e.target.value)}
                  >
                    <option value="">Toutes</option>
                    {subCategoryOptions.map((sc) => (
                      <option key={sc} value={sc}>
                        {sc}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="analyses-results-toolbar">
                <p className="analyses-results-count">
                  <span id="total-count">{filteredProducts.length}</span> produit(s) —{' '}
                  <span id="selected-count">{selectedInViewCount}</span> sélectionné(s)
                </p>
                <div className="analyses-results-actions">
                  <button
                    type="button"
                    className="analyses-action-btn analyses-action-btn--primary"
                    id="import-btn"
                    disabled={selectedInViewCount === 0}
                    onClick={importSelected}
                  >
                    Importer la sélection
                  </button>
                  <button
                    type="button"
                    className="analyses-action-btn"
                    id="delete-btn"
                    disabled={selectedInViewCount === 0}
                    onClick={deleteSelected}
                  >
                    Supprimer de la vue
                  </button>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <p className="analyses-empty">
                  {products.length === 0
                    ? 'Aucun produit pour cette analyse.'
                    : 'Aucun produit ne correspond aux filtres.'}
                </p>
              ) : (
                <div className="analyses-table-wrap analyses-table-wrap--wide">
                  <table className="analyses-table analyses-table--products">
                    <thead>
                      <tr>
                        <th scope="col" className="analyses-table-col-check">
                          <input
                            type="checkbox"
                            aria-label="Tout sélectionner"
                            checked={allFilteredSelected}
                            ref={(el) => {
                              if (el)
                                el.indeterminate = someFilteredSelected && !allFilteredSelected;
                            }}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th scope="col">Visuel</th>
                        <th scope="col">Année</th>
                        <th scope="col">Marque</th>
                        <th scope="col">Catégorie</th>
                        <th scope="col">Sous-cat.</th>
                        <th scope="col">Titre</th>
                        <th scope="col">Description</th>
                        <th scope="col">Commercial</th>
                        <th scope="col">Prix</th>
                        <th scope="col">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p: Product) => (
                        <tr
                          key={p.id}
                          className={
                            selectedIds.has(p.id) ? 'analyses-table-row--selected' : undefined
                          }
                        >
                          <td className="analyses-table-col-check">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(p.id)}
                              onChange={(e) => toggleOne(p.id, e.target.checked)}
                              aria-label={`Sélectionner ${p.title}`}
                            />
                          </td>
                          <td className="analyses-table-cell-thumb">
                            {p.imageUrl ? (
                              <img className="analyses-product-thumb" src={p.imageUrl} alt="" />
                            ) : (
                              <span className="analyses-thumb-placeholder">—</span>
                            )}
                          </td>
                          <td>
                            {p.year ? <span className="analyses-year-tag">{p.year}</span> : '—'}
                          </td>
                          <td>{p.brand ?? '—'}</td>
                          <td>{p.category ?? '—'}</td>
                          <td>{p.subCategory ?? '—'}</td>
                          <td className="analyses-table-cell-title">{p.title}</td>
                          <td className="analyses-table-cell-clamp">{p.description ?? '—'}</td>
                          <td className="analyses-table-cell-clamp analyses-table-cell-commercial">
                            {p.commercialDescription ?? '—'}
                          </td>
                          <td>
                            <strong>{formatPrice(p.price, p.currency)}</strong>
                          </td>
                          <td>
                            {p.sourceUrl ? (
                              <a
                                href={p.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="analyses-table-link"
                              >
                                Voir
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <div
            role="tabpanel"
            id="panel-template"
            aria-labelledby="tab-template"
            hidden={activeTab !== 'template'}
            className="analyses-tab-panel"
          >
            <p className="product-sheet-intro">
              Configure la structure des champs (fiches type PrestaShop) sur la page dédiée.
            </p>
            <Link to="/product-sheet" className="product-sheet-save-btn">
              Ouvrir la fiche produit type
            </Link>
          </div>
        </>
      ) : analysis.status !== 'failed' ? (
        <p className="analyses-status">Statut&nbsp;: {STATUS_LABELS[analysis.status]}</p>
      ) : null}
    </>
  );
}
