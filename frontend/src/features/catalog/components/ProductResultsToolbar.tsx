import { Button } from '@shared/ui';

interface ProductResultsToolbarProps {
  isConnected: boolean;
  totalCount: number;
  /** Nombre de fiches chargées (marques boutique) avant filtres UI. */
  loadedCount?: number | undefined;
  selectedCount: number;
  onDelete: () => void;
  onExport?: () => void;
}

const EXPORT_AUTH_TOOLTIP =
  'L’export est réservé aux comptes connectés. Connectez-vous pour exporter vos fiches produits.';

function buildExportTooltip(isConnected: boolean, hasSelection: boolean): string | undefined {
  if (!isConnected && hasSelection) return EXPORT_AUTH_TOOLTIP;
  return undefined;
}

export function ProductResultsToolbar({
  isConnected,
  totalCount,
  loadedCount,
  selectedCount,
  onDelete,
  onExport,
}: ProductResultsToolbarProps) {
  const hasSelection = selectedCount > 0;
  const exportDisabled = !isConnected || !hasSelection;
  const exportTooltip = buildExportTooltip(isConnected, hasSelection);
  const showLoadedHint = typeof loadedCount === 'number' && loadedCount > totalCount;

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-gray-900">{totalCount}</span> fiche
        {totalCount !== 1 ? 's' : ''} produit{totalCount !== 1 ? 's' : ''}
        {showLoadedHint ? (
          <span className="text-text-secondary">
            {' '}
            sur {loadedCount} correspondant à vos marques
          </span>
        ) : null}
        {hasSelection ? (
          <>
            {' — '}
            <span className="font-semibold text-purple-600">{selectedCount}</span> sélectionnée
            {selectedCount !== 1 ? 's' : ''}
          </>
        ) : null}
      </p>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="py-1.5 font-medium"
          disabled={exportDisabled}
          tooltip={exportTooltip}
          onClick={() => {
            if (!isConnected || !hasSelection) return;
            onExport?.();
          }}
        >
          Exporter
        </Button>
        <Button
          type="button"
          variant="neutral-outline"
          size="sm"
          className="py-1.5 font-medium"
          disabled={!hasSelection}
          onClick={onDelete}
        >
          Supprimer de la vue
        </Button>
      </div>
    </div>
  );
}
