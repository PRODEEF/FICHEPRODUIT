import type { KeyboardEvent } from 'react';
import { X } from 'lucide-react';

import { Button, InputField } from '@shared/ui';

import { SHOP_CATEGORY_NAME_MAX_LENGTH } from '../lib/categoryTreeSchemas';
import { DepthGuides } from './DepthGuides';

/** Nombre de caractères à partir duquel le compteur devient visible. */
const CHAR_COUNT_VISIBLE_FROM = 50;

export interface CategoryInlineAddFormProps {
  id: string;
  depth: number;
  value: string;
  error: string | null;
  locked: boolean;
  onChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * Formulaire inline d'ajout d'une catégorie, affiché directement dans la liste
 * à la position correspondant au parent sélectionné.
 */
export function CategoryInlineAddForm({
  id,
  depth,
  value,
  error,
  locked,
  onChange,
  onKeyDown,
  onSubmit,
  onCancel,
}: CategoryInlineAddFormProps) {
  return (
    <li className="list-none" role="none">
      <div className="flex h-auto min-h-9 items-center gap-1.5 border-b border-gray-100 py-1.5">
        <DepthGuides depth={depth} />
        <span className="inline-block w-[18px] shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <InputField
            id={id}
            label="Nom de la catégorie"
            labelClassName="sr-only"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            onKeyDown={onKeyDown}
            placeholder="Nom de la catégorie"
            disabled={locked}
            maxLength={SHOP_CATEGORY_NAME_MAX_LENGTH}
            error={error ?? undefined}
            errorId={`${id}-error`}
            autoFocus
            containerClassName="min-w-[12rem] flex-1 gap-1"
            inputClassName="h-[30px] rounded-lg py-0"
          />
          {value.length >= CHAR_COUNT_VISIBLE_FROM ? (
            <span className="text-xs tabular-nums text-text-muted" aria-live="polite">
              {value.length}/{SHOP_CATEGORY_NAME_MAX_LENGTH}
            </span>
          ) : null}
          <Button
            type="button"
            variant="neutral-outline"
            size="sm"
            disabled={locked || value.trim() === ''}
            onClick={onSubmit}
            className="h-[30px] !px-3 !py-0 text-sm"
          >
            Ajouter
          </Button>
          <button
            type="button"
            disabled={locked}
            onClick={onCancel}
            aria-label="Annuler"
            className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
