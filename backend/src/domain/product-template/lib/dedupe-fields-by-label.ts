import type { ProductTemplateField } from "../types/product-template.types";
import {
  fieldTypeMergePriority,
  normalizeFieldLabelForDedup,
  sanitizeFieldDisplayLabel,
} from "./normalize-field-label";

type FieldDraft = Omit<ProductTemplateField, "order">;

export type LabelDedupeMerge = {
  keptName: string;
  droppedName: string;
};

export type LabelDedupeResult = {
  fields: FieldDraft[];
  merges: LabelDedupeMerge[];
};

function pickBetterField(
  current: FieldDraft,
  candidate: FieldDraft,
  currentSample?: string,
  candidateSample?: string,
): FieldDraft {
  const currentScore = fieldTypeMergePriority(current.type);
  const candidateScore = fieldTypeMergePriority(candidate.type);
  const currentHasSample = Boolean(currentSample?.trim());
  const candidateHasSample = Boolean(candidateSample?.trim());

  if (candidateHasSample && !currentHasSample) return candidate;
  if (currentHasSample && !candidateHasSample) return current;
  if (candidateScore > currentScore) return candidate;
  if (currentScore > candidateScore) return current;

  const currentClean = sanitizeFieldDisplayLabel(current.name);
  const candidateClean = sanitizeFieldDisplayLabel(candidate.name);
  if (currentClean.endsWith(":") && !candidateClean.endsWith(":")) return candidate;
  if (!currentClean.endsWith(":") && candidateClean.endsWith(":")) return current;
  if (candidateClean.length < currentClean.length) return candidate;
  return current;
}

/**
 * Fusionne les champs dont la clé normalisée est identique (ex. « Couleur » et « Couleur : »).
 * Ne fusionne pas des libellés métier distincts.
 */
/** Libellé fusionné à mentionner dans l’avertissement (souvent la variante avec « : » en fin). */
function labelDroppedForMergeWarning(rawLabels: string[]): string {
  const withSuffix = rawLabels.find((l) => /[:*]\s*$/.test(l.trim()));
  if (withSuffix) return withSuffix.trim();
  const unique = [...new Set(rawLabels.map((l) => l.trim()))];
  if (unique.length < 2) return unique[0] ?? "";
  return unique.sort((a, b) => b.length - a.length)[0] ?? "";
}

type DedupeEntry = {
  field: FieldDraft;
  rawLabels: string[];
};

export function dedupeFieldsByNormalizedLabel(
  fields: FieldDraft[],
  samples: Record<string, string>,
): LabelDedupeResult {
  const order: string[] = [];
  const byKey = new Map<string, DedupeEntry>();
  const merges: LabelDedupeMerge[] = [];

  for (const field of fields) {
    const key = normalizeFieldLabelForDedup(field.name);
    if (!key) continue;

    const rawLabel = field.name.trim();
    const entry = byKey.get(key);
    if (!entry) {
      byKey.set(key, {
        field: { ...field, name: sanitizeFieldDisplayLabel(field.name) },
        rawLabels: [rawLabel],
      });
      order.push(key);
      continue;
    }

    entry.rawLabels.push(rawLabel);
    const candidate = { ...field, name: sanitizeFieldDisplayLabel(field.name) };
    const winner = pickBetterField(
      entry.field,
      candidate,
      samples[entry.field.name],
      samples[field.name],
    );
    const droppedName = labelDroppedForMergeWarning(entry.rawLabels);
    if (droppedName !== winner.name) {
      merges.push({ keptName: winner.name, droppedName });
    }

    const winnerSample = samples[winner.name] ?? samples[field.name] ?? samples[entry.field.name];
    if (winnerSample) {
      samples[winner.name] = winnerSample;
      for (const sampleKey of [field.name, entry.field.name]) {
        if (sampleKey !== winner.name) {
          delete samples[sampleKey];
        }
      }
    }

    entry.field = winner;
  }

  return {
    fields: order.map((key) => byKey.get(key)!.field),
    merges,
  };
}
