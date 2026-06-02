import { useCallback, useState } from 'react';

import { refineFields } from '@api/template';
import type { RefineFieldsSource } from '@types-api';

import { applyRefinedFieldsToRows } from '../lib/templateFieldMappers';
import type { TemplateFieldRow } from '../types';

export interface UseRefineTemplateFieldsResult {
  refiningAi: boolean;
  aiRefineHint: string | null;
  clearAiRefineHint: () => void;
  refineRows: (
    rows: TemplateFieldRow[],
    source: RefineFieldsSource,
    sampleValues?: Record<string, string> | null,
  ) => Promise<TemplateFieldRow[]>;
}

export function useRefineTemplateFields(shopId: string | undefined): UseRefineTemplateFieldsResult {
  const [refiningAi, setRefiningAi] = useState(false);
  const [aiRefineHint, setAiRefineHint] = useState<string | null>(null);

  const clearAiRefineHint = useCallback(() => {
    setAiRefineHint(null);
  }, []);

  const refineRows = useCallback(
    async (
      rows: TemplateFieldRow[],
      source: RefineFieldsSource,
      sampleValues?: Record<string, string> | null,
    ): Promise<TemplateFieldRow[]> => {
      if (!shopId) {
        throw new Error('Boutique introuvable. Analysez d’abord votre site.');
      }
      if (rows.some((r) => !r.name.trim())) {
        throw new Error('Renseignez un nom pour chaque champ avant d’utiliser l’IA.');
      }

      setRefiningAi(true);
      setAiRefineHint(null);
      try {
        const res = await refineFields(shopId, {
          source,
          fields: rows.map((r, order) => ({
            name: r.name.trim(),
            type: r.type,
            required: r.required,
            order,
          })),
          ...(sampleValues && Object.keys(sampleValues).length > 0 ? { sampleValues } : {}),
        });

        if (res.refinedWithAi) {
          setAiRefineHint(
            res.message?.trim() ? res.message.trim() : 'Champs affinés par l’IA.',
          );
        } else if (res.message?.trim()) {
          setAiRefineHint(res.message.trim());
        }

        return applyRefinedFieldsToRows(rows, res.fields);
      } finally {
        setRefiningAi(false);
      }
    },
    [shopId],
  );

  return { refiningAi, aiRefineHint, clearAiRefineHint, refineRows };
}
