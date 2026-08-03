/**
 * Helpers de lecture défensive pour les réponses JSON Nest.
 */

export function asRecord(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== 'object' || raw === null) return null;
  return raw as Record<string, unknown>;
}

export function readString(o: Record<string, unknown>, key: string): string | null {
  const value = o[key];
  return typeof value === 'string' ? value : null;
}

export function readNumber(o: Record<string, unknown>, key: string): number | null {
  const value = o[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function readStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string');
}

export function readStringRecord(raw: unknown): Record<string, string> {
  const o = asRecord(raw);
  if (!o) return {};
  return Object.fromEntries(
    Object.entries(o).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}
