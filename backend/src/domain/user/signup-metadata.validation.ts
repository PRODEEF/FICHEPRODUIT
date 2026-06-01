import { z } from "zod";

export const SIGNUP_WEBSITE_URL_MAX_LENGTH = 2048;

const httpOrHttpsUrlSchema = z
  .string()
  .max(SIGNUP_WEBSITE_URL_MAX_LENGTH)
  .refine((value) => {
    try {
      const u = new URL(value);
      if (u.protocol !== "http:" && u.protocol !== "https:") return false;
      if (u.username || u.password) return false;
      return Boolean(u.hostname);
    } catch {
      return false;
    }
  }, "URL du site invalide (http ou https requis)");

/**
 * Normalise `website_url` issu du client ou de la base : null si vide, URL http(s) sinon.
 */
export function normalizeSignupWebsiteUrl(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = httpOrHttpsUrlSchema.safeParse(trimmed);
  return parsed.success ? trimmed : null;
}

/**
 * `pending_auto_analyze` n’est autorisé que lorsqu’une URL de site valide est présente.
 */
export function normalizePendingAutoAnalyze(
  pending: boolean | null | undefined,
  websiteUrl: string | null,
): boolean {
  if (!websiteUrl) return false;
  return pending === true;
}

export type SanitizedSignupMetadata = {
  websiteUrl: string | null;
  pendingAutoAnalyze: boolean;
};

/** Valide et corrige la paire métier website / pending auto-analyze. */
export function sanitizeSignupMetadata(input: {
  websiteUrl: string | null | undefined;
  pendingAutoAnalyze: boolean | null | undefined;
}): SanitizedSignupMetadata {
  const websiteUrl = normalizeSignupWebsiteUrl(input.websiteUrl ?? null);
  const pendingAutoAnalyze = normalizePendingAutoAnalyze(
    input.pendingAutoAnalyze ?? false,
    websiteUrl,
  );
  return { websiteUrl, pendingAutoAnalyze };
}
