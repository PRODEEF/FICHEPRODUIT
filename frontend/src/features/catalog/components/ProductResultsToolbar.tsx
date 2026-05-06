type ProductResultsToolbarProps = {
  totalCount: number;
  selectedCount: number;
  onImport: () => void;
  onDelete: () => void;
};

export function ProductResultsToolbar({
  totalCount,
  selectedCount,
  onImport,
  onDelete,
}: ProductResultsToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-gray-900">{totalCount}</span> produit{totalCount !== 1 ? 's' : ''}
        {hasSelection ? (
          <>
            {' — '}
            <span className="font-semibold text-purple-600">{selectedCount}</span> sélectionné{selectedCount !== 1 ? 's' : ''}
          </>
        ) : null}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!hasSelection}
          onClick={onImport}
          className="rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Importer la sélection
        </button>
        <button
          type="button"
          disabled={!hasSelection}
          onClick={onDelete}
          className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Supprimer de la vue
        </button>
      </div>
    </div>
  );
}
