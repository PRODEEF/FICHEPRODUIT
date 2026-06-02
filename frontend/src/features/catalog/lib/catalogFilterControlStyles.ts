import { cn } from '@shared/lib/cn';

/** Hauteur commune des champs de filtre catalogue (input, select, bouton reset). */
export const CATALOG_FILTER_CONTROL_HEIGHT_CLASS =
  'h-10 min-h-10 max-h-10 box-border py-0 leading-normal';

export const catalogFilterControlClassName = cn(
  CATALOG_FILTER_CONTROL_HEIGHT_CLASS,
  'w-full rounded-xl border border-soft bg-bg-white px-3 text-sm text-text-primary outline-none transition focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]',
);

export const catalogFilterInputClassName = cn(
  catalogFilterControlClassName,
  'placeholder:text-text-muted focus:ring-2 focus:ring-purple-100',
);

export const catalogFilterSelectClassName = cn(
  catalogFilterControlClassName,
  'appearance-none pr-9 pl-3',
);
