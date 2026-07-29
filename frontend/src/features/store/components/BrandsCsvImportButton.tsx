import { useId, useRef, useState, type ChangeEvent } from 'react';

import { Button } from '@shared/ui';

import { mergeBrands, parsePrestashopBrandsCsv } from '../lib/parse-prestashop-brands-csv';

interface BrandsCsvImportButtonProps {
  existingBrands: string[];
  disabled?: boolean;
  onImportBrands: (brands: string[]) => void | Promise<void>;
}

function buildImportFeedback(params: {
  added: number;
  alreadyPresent: number;
  skippedInactive: number;
  skippedInvalid: number;
  skippedDuplicate: number;
}): string {
  const parts: string[] = [];

  if (params.added > 0) {
    parts.push(params.added === 1 ? '1 marque ajoutée' : `${params.added} marques ajoutées`);
  } else {
    parts.push('Aucune nouvelle marque');
  }

  if (params.alreadyPresent > 0) {
    parts.push(
      params.alreadyPresent === 1 ? '1 déjà présente' : `${params.alreadyPresent} déjà présentes`,
    );
  }

  const skipped = params.skippedInactive + params.skippedInvalid + params.skippedDuplicate;
  if (skipped > 0) {
    parts.push(skipped === 1 ? '1 ignorée' : `${skipped} ignorées`);
  }

  return parts.join(' · ');
}

/**
 * Bouton d’import d’un CSV marques PrestaShop (délimiteur `;`, colonne « Nom »).
 * Le message de retour passe en pleine largeur grâce à `basis-full` dans un flex parent.
 */
export function BrandsCsvImportButton({
  existingBrands,
  disabled = false,
  onImportBrands,
}: BrandsCsvImportButtonProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const locked = disabled || busy;

  const resetFileInput = () => {
    const input = fileInputRef.current;
    if (input) {
      input.value = '';
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    resetFileInput();
    if (!file || locked) return;

    setBusy(true);
    setError(null);
    setFeedback(null);

    try {
      const text = await file.text();
      const parsed = parsePrestashopBrandsCsv(text);
      const merged = mergeBrands(existingBrands, parsed.brands);

      if (merged.added > 0) {
        await onImportBrands(merged.brands);
      }

      setFeedback(
        buildImportFeedback({
          added: merged.added,
          alreadyPresent: merged.alreadyPresent,
          skippedInactive: parsed.skippedInactive,
          skippedInvalid: parsed.skippedInvalid,
          skippedDuplicate: parsed.skippedDuplicate,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible d’importer le fichier CSV.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        tabIndex={-1}
        disabled={locked}
        onChange={(e) => void handleFileChange(e)}
      />
      <Button
        type="button"
        variant="neutral-outline"
        size="sm"
        disabled={locked}
        className="h-[42px]"
        onClick={() => fileInputRef.current?.click()}
        aria-describedby={error ? `${inputId}-error` : feedback ? `${inputId}-feedback` : undefined}
      >
        {busy ? 'Import…' : 'Importer'}
      </Button>
      {error ? (
        <p id={`${inputId}-error`} className="m-0 basis-full text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {feedback && !error ? (
        <p id={`${inputId}-feedback`} className="m-0 basis-full text-xs text-text-secondary">
          {feedback}
        </p>
      ) : null}
    </>
  );
}
