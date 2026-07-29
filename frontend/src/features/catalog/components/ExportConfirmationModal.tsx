import { useMemo, useState } from 'react';

import { Badge, Button, Modal, SelectField } from '@shared/ui';
import { cn } from '@shared/lib/cn';

import { splitPairsByReviewStatus } from '../lib/splitPairsByReviewStatus';

import type {
  CategoryExportMatchKind,
  CategoryExportPreviewPair,
  CategoryExportTreeOption,
} from '@types-api';

export interface ExportConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: () => void;
  isExporting?: boolean;
  previewLoading: boolean;
  previewError: string | null;
  pairs: CategoryExportPreviewPair[];
  treeOptions: CategoryExportTreeOption[];
  selections: Record<string, string>;
  manufacturerValue: string;
  onSelectionChange: (sourceKey: string, value: string) => void;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count > 1 ? plural : singular;
}

function matchKindBadge(kind: CategoryExportMatchKind): {
  variant: 'success' | 'warning' | 'error';
  label: string;
} {
  switch (kind) {
    case 'exact':
      return { variant: 'success', label: 'Exacte' };
    case 'token':
      return { variant: 'warning', label: 'Approximative' };
    case 'none':
      return { variant: 'error', label: 'À mapper' };
  }
}

interface MappingRowProps {
  pair: CategoryExportPreviewPair;
  value: string;
  manufacturerValue: string;
  treeOptions: CategoryExportTreeOption[];
  disabled: boolean;
  onSelectionChange: (sourceKey: string, value: string) => void;
}

function MappingRow({
  pair,
  value,
  manufacturerValue,
  treeOptions,
  disabled,
  onSelectionChange,
}: MappingRowProps) {
  const selectId = `export-cat-${pair.sourceKey}`;
  const badge = matchKindBadge(pair.matchKind);

  return (
    <div className="grid grid-cols-1 items-center gap-2 border-b border-gray-100 py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)] sm:gap-3">
      <div className="min-w-0">
        <p
          className="m-0 truncate text-sm font-medium text-text-primary"
          title={pair.manufacturerPath}
        >
          {pair.manufacturerPath}
          <span className="ml-1.5 font-normal text-text-secondary">({pair.productCount})</span>
        </p>
      </div>

      <div className="flex items-center gap-2 sm:justify-center">
        <span className="hidden text-text-secondary sm:inline" aria-hidden>
          →
        </span>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      <SelectField
        id={selectId}
        label={`Catégorie magasin pour ${pair.manufacturerPath}`}
        labelClassName="sr-only"
        containerClassName="min-w-0"
        selectClassName="py-2 text-sm"
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onSelectionChange(pair.sourceKey, event.target.value);
        }}
      >
        <option value={manufacturerValue}>Fabricant : {pair.manufacturerPath}</option>
        {treeOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.path}
          </option>
        ))}
      </SelectField>
    </div>
  );
}

interface MappingSectionProps {
  title: string;
  count: number;
  pairs: CategoryExportPreviewPair[];
  collapsible?: boolean;
  defaultOpen?: boolean;
  selections: Record<string, string>;
  manufacturerValue: string;
  treeOptions: CategoryExportTreeOption[];
  disabled: boolean;
  onSelectionChange: (sourceKey: string, value: string) => void;
}

function MappingSection({
  title,
  count,
  pairs,
  collapsible = false,
  defaultOpen = true,
  selections,
  manufacturerValue,
  treeOptions,
  disabled,
  onSelectionChange,
}: MappingSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (pairs.length === 0) return null;

  const heading = (
    <span className="text-sm font-semibold text-text-primary">
      {title} <span className="font-normal text-text-secondary">({count})</span>
    </span>
  );

  const rows = (
    <div className="mt-1">
      <div className="mb-1 hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)] gap-3 px-0.5 sm:grid">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
          Fabricant
        </span>
        <span className="text-center text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
          Statut
        </span>
        <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
          Catégorie magasin
        </span>
      </div>
      {pairs.map((pair) => (
        <MappingRow
          key={pair.sourceKey}
          pair={pair}
          value={selections[pair.sourceKey] ?? manufacturerValue}
          manufacturerValue={manufacturerValue}
          treeOptions={treeOptions}
          disabled={disabled}
          onSelectionChange={onSelectionChange}
        />
      ))}
    </div>
  );

  if (collapsible) {
    return (
      <details
        className="group mb-4"
        open={isOpen}
        onToggle={(event) => {
          setIsOpen(event.currentTarget.open);
        }}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg py-1.5 marker:content-none [&::-webkit-details-marker]:hidden">
          <span
            className={cn(
              'inline-block text-text-secondary transition-transform',
              isOpen && 'rotate-90',
            )}
            aria-hidden
          >
            ▸
          </span>
          {heading}
        </summary>
        {rows}
      </details>
    );
  }

  return (
    <section className="mb-4">
      <h3 className="m-0 mb-1">{heading}</h3>
      {rows}
    </section>
  );
}

export function ExportConfirmationModal({
  open,
  onClose,
  selectedCount,
  onConfirm,
  isExporting = false,
  previewLoading,
  previewError,
  pairs,
  treeOptions,
  selections,
  manufacturerValue,
  onSelectionChange,
}: ExportConfirmationModalProps) {
  const ficheLabel = pluralize(selectedCount, 'fiche', 'fiches');
  const confirmDisabled = isExporting || previewLoading || previewError !== null;

  const { toReview, ok } = useMemo(() => splitPairsByReviewStatus(pairs), [pairs]);
  const okDefaultOpen = toReview.length === 0;

  return (
    <Modal
      open={open}
      title="Confirmer l'export"
      onClose={onClose}
      panelClassName="flex max-h-[min(calc(100dvh-2rem),56rem)] max-w-3xl flex-col overflow-hidden p-6 sm:p-8"
    >
      <h2 className="m-0 mb-2 shrink-0 text-lg font-bold text-text-primary">
        Confirmer l&apos;export
      </h2>

      <p className="mb-4 shrink-0 text-sm text-text-secondary">
        {selectedCount} {ficheLabel}
        <span className="mx-1.5 text-gray-300" aria-hidden>
          ·
        </span>
        <strong>products.csv</strong> + <strong>combinations.csv</strong>
      </p>

      {previewLoading ? (
        <p className="mb-6 py-8 text-center text-sm text-text-secondary">
          Calcul des correspondances…
        </p>
      ) : null}

      {previewError !== null ? (
        <p className="mb-6 text-sm text-red-600" role="alert">
          {previewError}
        </p>
      ) : null}

      {!previewLoading && previewError === null && pairs.length > 0 ? (
        <>
          <p className="mb-3 shrink-0 text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">{toReview.length}</span> à vérifier
            <span className="mx-1.5 text-gray-300" aria-hidden>
              ·
            </span>
            <span className="font-semibold text-text-primary">{ok.length}</span> OK
          </p>

          <div className="mb-6 min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] pr-2">
            <MappingSection
              title="À vérifier"
              count={toReview.length}
              pairs={toReview}
              selections={selections}
              manufacturerValue={manufacturerValue}
              treeOptions={treeOptions}
              disabled={isExporting}
              onSelectionChange={onSelectionChange}
            />
            <MappingSection
              key={`ok-${ok.length}-${okDefaultOpen ? 'open' : 'closed'}`}
              title="OK"
              count={ok.length}
              pairs={ok}
              collapsible
              defaultOpen={okDefaultOpen}
              selections={selections}
              manufacturerValue={manufacturerValue}
              treeOptions={treeOptions}
              disabled={isExporting}
              onSelectionChange={onSelectionChange}
            />
          </div>
        </>
      ) : null}

      {!previewLoading && previewError === null && pairs.length === 0 ? (
        <p className="mb-6 text-sm text-text-secondary">
          Aucune catégorie à mapper pour cette sélection.
        </p>
      ) : null}

      <div className="flex shrink-0 flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="neutral-outline"
          size="sm"
          disabled={isExporting}
          onClick={onClose}
        >
          Annuler
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          glow
          disabled={confirmDisabled}
          onClick={onConfirm}
        >
          {isExporting ? 'Export en cours…' : "Confirmer l'export"}
        </Button>
      </div>
    </Modal>
  );
}
