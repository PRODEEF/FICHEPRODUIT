import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCcw } from 'lucide-react';

import { Button, InputField } from '@shared/ui';
import { cn } from '@shared/lib/cn';

import type { ProductFilter } from '../types';
import {
  CATALOG_SELECT_FILTER_DEFINITIONS,
  resolveCatalogFilterOptions,
} from '../lib/catalogFilterDefinitions';
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
  const [isResetAnimating, setIsResetAnimating] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleResetClick = useCallback(() => {
    if (!canReset || !onReset) return;
    setIsResetAnimating(true);
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => {
      setIsResetAnimating(false);
      resetTimerRef.current = null;
    }, 500);
    onReset();
  }, [canReset, onReset]);

  const dynamicOptions = {
    brandOptions,
    categoryOptions,
    subCategoryOptions,
    yearOptions,
  };

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

      {CATALOG_SELECT_FILTER_DEFINITIONS.map((definition) => {
        const options = resolveCatalogFilterOptions(definition.optionsSource, dynamicOptions);
        return (
          <CatalogFilterSelect
            key={definition.key}
            id={definition.id}
            label={definition.label}
            value={filters[definition.key]}
            onChange={(value) => void onFilterChange(definition.key, value)}
          >
            <option value="">{definition.emptyLabel}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </CatalogFilterSelect>
        );
      })}

      {onReset ? (
        <Button
          type="button"
          variant="primary"
          size="sm"
          className={cn(
            CATALOG_FILTER_CONTROL_HEIGHT_CLASS,
            'inline-flex shrink-0 items-center gap-2 px-3',
          )}
          onClick={handleResetClick}
          disabled={!canReset}
          aria-label="Réinitialiser les filtres"
        >
          <RefreshCcw
            className={cn('h-5 w-5', isResetAnimating && 'animate-spin motion-reduce:animate-none')}
            aria-hidden
          />
          Réinitialiser les filtres
        </Button>
      ) : null}
    </div>
  );
}
