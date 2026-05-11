import { InputField } from '@shared/ui';

import type { ProductFilter } from '../types';
import type { CatalogPriceFilterFieldKey } from '../lib/catalogFilterSchemas';

type ProductFiltersProps = {
  filters: ProductFilter;
  onFilterChange: <K extends keyof ProductFilter>(key: K, value: ProductFilter[K]) => void;
  brandOptions: string[];
  categoryOptions: string[];
  subCategoryOptions: string[];
  yearOptions: string[];
  priceFilterErrors?: Partial<Record<CatalogPriceFilterFieldKey, string>>;
};

export function ProductFilters({
  filters,
  onFilterChange,
  brandOptions,
  categoryOptions,
  subCategoryOptions,
  yearOptions,
  priceFilterErrors,
}: ProductFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3" role="search" aria-label="Filtrer les produits">
      <InputField
        id="catalog-filter-search"
        label="Recherche"
        labelClassName="text-text-muted"
        containerClassName="min-w-[12rem] max-w-md flex-1"
        inputClassName="border-soft bg-bg-white text-text-primary placeholder:text-text-muted focus:border-purple-400 focus:ring-purple-100"
        type="search"
        placeholder="Marque, catégorie, titre…"
        value={filters.search}
        onChange={(e) => onFilterChange('search', e.target.value)}
        autoComplete="off"
      />

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Marque
        </span>
        <select
          className="rounded-xl border border-soft bg-bg-white px-3 py-2 text-sm text-text-primary outline-none transition focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]"
          value={filters.brand}
          onChange={(e) => onFilterChange('brand', e.target.value)}
        >
          <option value="">Toutes</option>
          {brandOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
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
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Catégorie
        </span>
        <select
          className="rounded-xl border border-soft bg-bg-white px-3 py-2 text-sm text-text-primary outline-none transition focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]"
          value={filters.category}
          onChange={(e) => onFilterChange('category', e.target.value)}
        >
          <option value="">Toutes</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Sous-catégorie
        </span>
        <select
          className="rounded-xl border border-soft bg-bg-white px-3 py-2 text-sm text-text-primary outline-none transition focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]"
          value={filters.subCategory}
          onChange={(e) => onFilterChange('subCategory', e.target.value)}
        >
          <option value="">Toutes</option>
          {subCategoryOptions.map((sc) => (
            <option key={sc} value={sc}>
              {sc}
            </option>
          ))}
        </select>
      </label>

      <InputField
        id="catalog-filter-price-min"
        label="PRIX MIN"
        labelClassName="text-text-muted"
        containerClassName="w-[8.5rem]"
        inputClassName="border-soft bg-bg-white text-text-primary placeholder:text-text-muted focus:border-purple-400 focus:ring-purple-100"
        type="number"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0 €"
        value={filters.priceMin}
        onChange={(e) => onFilterChange('priceMin', e.target.value)}
        error={priceFilterErrors?.priceMin}
        errorId="catalog-filter-price-min-error"
      />

      <InputField
        id="catalog-filter-price-max"
        label="PRIX MAX"
        labelClassName="text-text-muted"
        containerClassName="w-[8.5rem]"
        inputClassName="border-soft bg-bg-white text-text-primary placeholder:text-text-muted focus:border-purple-400 focus:ring-purple-100"
        type="number"
        inputMode="decimal"
        autoComplete="off"
        placeholder="999 €"
        value={filters.priceMax}
        onChange={(e) => onFilterChange('priceMax', e.target.value)}
        error={priceFilterErrors?.priceMax}
        errorId="catalog-filter-price-max-error"
      />
    </div>
  );
}
