import { useCallback, useEffect, useState } from 'react';

import {
  createTemplate,
  deleteTemplate as deleteTemplateApi,
  listTemplates,
  updateTemplate,
} from '@api/template';
import type { ProductTemplate } from '@types-api';

import { rowsToFields } from '../lib/templateFieldMappers';
import type { TemplateFieldRow } from '../types';

export interface UseProductTemplatesResult {
  templates: ProductTemplate[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  saveTemplate: (
    templateId: string | undefined,
    name: string,
    rows: TemplateFieldRow[],
  ) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
}

export function useProductTemplates(shopId: string | undefined): UseProductTemplatesResult {
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(Boolean(shopId));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!shopId) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const list = await listTemplates(shopId);
      setTemplates(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les fiches type.');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    queueMicrotask(() => {
      void refetch();
    });
  }, [refetch]);

  const saveTemplate = useCallback(
    async (templateId: string | undefined, name: string, rows: TemplateFieldRow[]) => {
      if (!shopId) {
        throw new Error('Boutique introuvable. Analysez d’abord votre site.');
      }
      const fields = rowsToFields(rows);
      if (fields.length === 0) {
        throw new Error('Ajoutez au moins un champ.');
      }
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Indiquez un nom pour la fiche type.');
      }

      if (templateId) {
        await updateTemplate(shopId, templateId, { name: trimmedName, fields });
      } else {
        await createTemplate(shopId, { name: trimmedName, fields });
      }
      await refetch();
    },
    [shopId, refetch],
  );

  const deleteTemplate = useCallback(
    async (templateId: string) => {
      if (!shopId) {
        throw new Error('Boutique introuvable. Analysez d’abord votre site.');
      }
      await deleteTemplateApi(shopId, templateId);
      await refetch();
    },
    [shopId, refetch],
  );

  return { templates, loading, error, refetch, saveTemplate, deleteTemplate };
}
