import type { ReactNode } from 'react';

import { SelectField } from '@shared/ui';

import { catalogFilterSelectClassName } from '../lib/catalogFilterControlStyles';

export interface CatalogFilterSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string | undefined;
  children: ReactNode;
}

/** Select catalogue avec option vide « Toutes » fournie par le parent. */
export function CatalogFilterSelect({
  id,
  label,
  value,
  onChange,
  containerClassName,
  children,
}: CatalogFilterSelectProps) {
  return (
    <SelectField
      id={id}
      label={label}
      labelClassName="text-text-muted"
      containerClassName={containerClassName}
      selectClassName={catalogFilterSelectClassName}
      value={value}
      onChange={(e) => void onChange(e.target.value)}
    >
      {children}
    </SelectField>
  );
}
