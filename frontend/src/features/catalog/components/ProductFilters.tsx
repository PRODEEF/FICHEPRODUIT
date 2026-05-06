import type { ProductFilter } from '../types';

type ProductFiltersProps = {
  filters: ProductFilter;
  onFilterChange: <K extends keyof ProductFilter>(key: K, value: ProductFilter[K]) => void;
  brandOptions: string[];
  categoryOptions: string[];
  subCategoryOptions: string[];
  yearOptions: string[];
};

export function ProductFilters({
  filters,
  onFilterChange,
  brandOptions,
  categoryOptions,
  subCategoryOptions,
  yearOptions,
}: ProductFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3" role="search" aria-label="Filtrer les produits">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Recherche</span>
        <input
          type="search"
          className="rounded-xl border border-soft bg-bg-white px-3 py-2 text-sm text-text-primary outline-none transition focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          placeholder="Marque, catégorie, titre…"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Marque</span>
        <select
          className="rounded-xl border border-soft bg-bg-white px-3 py-2 text-sm text-text-primary outline-none transition focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]"
          value={filters.brand}
          onChange={(e) => onFilterChange('brand', e.target.value)}
        >
          <option value="">Toutes</option>
          {brandOptions.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Année</span>
        <select
          className="rounded-xl border border-soft bg-bg-white px-3 py-2 text-sm text-text-primary outline-none transition focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]"
          value={filters.year}
          onChange={(e) => onFilterChange('year', e.target.value)}
        >
          <option value="">Toutes</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Catégorie</span>
        <select
          className="rounded-xl border border-soft bg-bg-white px-3 py-2 text-sm text-text-primary outline-none transition focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]"
          value={filters.category}
          onChange={(e) => onFilterChange('category', e.target.value)}
        >
          <option value="">Toutes</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Sous-catégorie</span>
        <select
          className="rounded-xl border border-soft bg-bg-white px-3 py-2 text-sm text-text-primary outline-none transition focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]"
          value={filters.subCategory}
          onChange={(e) => onFilterChange('subCategory', e.target.value)}
        >
          <option value="">Toutes</option>
          {subCategoryOptions.map((sc) => (
            <option key={sc} value={sc}>{sc}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
