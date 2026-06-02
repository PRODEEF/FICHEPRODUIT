import { useCallback, useRef } from 'react';

import {
  inferProductTemplateFieldTypeFromCsvHeader,
  parseCsvHeadersAndFirstDataRow,
} from '../lib/csvHeaders';
import { defaultNewTemplateName, newRowId } from '../lib/templateFieldMappers';
import type { TemplateDraftState } from '../types';

export interface CsvImportResult {
  draft: TemplateDraftState;
  sampleValues: Record<string, string> | null;
}

export interface UseCsvTemplateImportResult {
  csvInputRef: React.RefObject<HTMLInputElement | null>;
  openFilePicker: () => void;
  importFromFile: (
    file: File,
    existingTemplateCount: number,
  ) => Promise<CsvImportResult | { error: string }>;
}

export function useCsvTemplateImport(): UseCsvTemplateImportResult {
  const csvInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = useCallback(() => {
    csvInputRef.current?.click();
  }, []);

  const importFromFile = useCallback(
    (file: File, existingTemplateCount: number): Promise<CsvImportResult | { error: string }> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const text = typeof reader.result === 'string' ? reader.result : '';
          const parsed = parseCsvHeadersAndFirstDataRow(text);
          if (!parsed || parsed.headers.length === 0) {
            resolve({ error: 'Impossible de lire les en-têtes du CSV.' });
            return;
          }
          const { headers, sampleByHeader } = parsed;
          const sampleValues = Object.keys(sampleByHeader).length > 0 ? sampleByHeader : null;
          resolve({
            draft: {
              templateName: defaultNewTemplateName(existingTemplateCount),
              fieldRows: headers.map((name) => ({
                id: newRowId(),
                name,
                type: inferProductTemplateFieldTypeFromCsvHeader(name),
                required: false,
              })),
            },
            sampleValues,
          });
        };
        reader.onerror = () => {
          resolve({ error: 'Impossible de lire le fichier CSV.' });
        };
        reader.readAsText(file, 'UTF-8');
        if (csvInputRef.current) {
          csvInputRef.current.value = '';
        }
      });
    },
    [],
  );

  return { csvInputRef, openFilePicker, importFromFile };
}
