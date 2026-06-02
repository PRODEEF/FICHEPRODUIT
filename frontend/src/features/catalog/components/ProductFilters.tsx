import { RefreshCcw } from 'lucide-react';

import { SHOP_SECTOR_LABELS } from '@shared/lib/shopSectors';
import { Button, InputField } from '@shared/ui';
import { cn } from '@shared/lib/cn';

import type { ProductFilter } from '../types';
import {
  CATALOG_FILTER_CONTROL_HEIGHT_CLASS,
  catalogFilterInputClassName,
} from '../lib/catalogFilterControlStyles';
import { CatalogFilterSelect } from './CatalogFilterSelect';

interface ProductFiltersProps {
  filters: ProductFilter;
  onFilterChange: <K extends keyof ProductFilter>(key: K, value: ProductFilter[K]) => void;
  onReset?: (() => void) | undefined;
  canReset?: boolean | undefined;
  brandOptions: string[];
  categoryOptions: string[];
  subCategoryOptions: string[];
  yearOptions: string[];
}

export function ProductFilters({
  filters,
  onFilterChange,
  onReset,
  canReset = false,
  brandOptions,
  categoryOptions,
  subCategoryOptions,
  yearOptions,
}: ProductFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3" role="search" aria-label="Filtrer les produits">
      <InputField
        id="catalog-filter-search"
        label="Recherche"
        labelClassName="text-text-muted"
        containerClassName="min-w-[12rem] max-w-md flex-1"
        inputClassName={catalogFilterInputClassName}
        type="search"
        placeholder="Marque, catégorie, titre…"
        value={filters.search}
        onChange={(e) => void onFilterChange('search', e.target.value)}
        autoComplete="off"
      />

      <CatalogFilterSelect
        id="catalog-filter-sector"
        label="Secteur"
        value={filters.sector}
        onChange={(value) => void onFilterChange('sector', value)}
      >
        <option value="">Tous</option>
        {SHOP_SECTOR_LABELS.map((sector) => (
          <option key={sector} value={sector}>
            {sector}
          </option>
        ))}
      </CatalogFilterSelect>

      <CatalogFilterSelect
        id="catalog-filter-category"
        label="Catégorie"
        value={filters.category}
        onChange={(value) => void onFilterChange('category', value)}
      >
        <option value="">Toutes</option>
        {categoryOptions.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </CatalogFilterSelect>

      <CatalogFilterSelect
        id="catalog-filter-subcategory"
        label="Sous-catégorie"
        value={filters.subCategory}
        onChange={(value) => void onFilterChange('subCategory', value)}
      >
        <option value="">Toutes</option>
        {subCategoryOptions.map((sc) => (
          <option key={sc} value={sc}>
            {sc}
          </option>
        ))}
      </CatalogFilterSelect>

      <CatalogFilterSelect
        id="catalog-filter-brand"
        label="Marque"
        value={filters.brand}
        onChange={(value) => void onFilterChange('brand', value)}
      >
        <option value="">Toutes</option>
        {brandOptions.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </CatalogFilterSelect>

      <CatalogFilterSelect
        id="catalog-filter-year"
        label="Année"
        value={filters.year}
        onChange={(value) => void onFilterChange('year', value)}
      >
        <option value="">Toutes</option>
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </CatalogFilterSelect>

      {onReset ? (
        <Button
          type="button"
          variant="primary"
          size="sm"
          className={cn(CATALOG_FILTER_CONTROL_HEIGHT_CLASS, 'w-10 shrink-0 p-0')}
          onClick={onReset}
          disabled={!canReset}
          tooltip="Réinitialiser les filtres"
          aria-label="Réinitialiser les filtres"
        >
          <RefreshCcw className="h-5 w-5" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
