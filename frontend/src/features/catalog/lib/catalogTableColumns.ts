export interface CatalogTableColumn {
  label: string;
  className: string;
}

export const CATALOG_TABLE_COLUMNS: readonly CatalogTableColumn[] = [
  { label: 'Visuel', className: 'w-14' },
  { label: 'Titre', className: 'w-56' },
  { label: 'Année', className: 'w-16' },
  { label: 'Marque', className: 'w-28' },
  { label: 'Catégorie', className: 'w-28' },
  { label: 'Sous-cat.', className: 'w-28' },
  { label: 'Description', className: 'w-64' },
  { label: 'Prix', className: 'w-24 text-right' },
  { label: 'Aperçu', className: 'w-24' },
] as const;

export const CATALOG_TABLE_HEAD_CLASS =
  'align-middle bg-bg-main px-3 py-2 font-bold text-text-secondary border-b border-soft';
