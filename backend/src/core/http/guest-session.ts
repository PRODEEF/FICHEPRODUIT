import type { FastifyReply, FastifyRequest } from "fastify";

type RequestWithCookies = FastifyRequest & { cookies?: Record<string, string | undefined> };
type ReplyWithCookies = FastifyReply & {
  setCookie(name: string, value: string, options?: Record<string, unknown>): FastifyReply;
  clearCookie(name: string, options?: Record<string, unknown>): FastifyReply;
};

export const GUEST_SESSION_COOKIE_NAME = "ficheproduct_guest_session";
export const GUEST_SESSION_HEADER_NAME = "x-session-id";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeSessionId(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed || !UUID_RE.test(trimmed)) return undefined;
  return trimmed;
}

/** Lit l'identifiant de session invité depuis le cookie httpOnly uniquement. */
export function readGuestSessionCookie(req: FastifyRequest): string | undefined {
  const fromCookie = (req as RequestWithCookies).cookies?.[GUEST_SESSION_COOKIE_NAME];
  return normalizeSessionId(fromCookie);
}

/** Lit l'identifiant depuis l'en-tête `x-session-id` (fallback cross-origin). */
export function readGuestSessionHeader(req: FastifyRequest): string | undefined {
  const raw = req.headers[GUEST_SESSION_HEADER_NAME];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return normalizeSessionId(typeof value === "string" ? value : undefined);
}

/**
 * Lit l'identifiant de session invité.
 * Cookie httpOnly en priorité, puis en-tête `x-session-id` (dev / preview cross-origin
 * où SameSite=Lax ne transmet pas le cookie entre localhost et 127.0.0.1, ou domaines distincts).
 */
export function readGuestSessionId(req: FastifyRequest): string | undefined {
  return readGuestSessionCookie(req) ?? readGuestSessionHeader(req);
}

/**
 * Résout l'ID de session pour le claim post-auth (JWT requis).
 * Cookie ou en-tête `x-session-id` — pas de body.
 */
export function resolveClaimGuestSessionId(req: FastifyRequest): string | null {
  return readGuestSessionId(req) ?? null;
}

export function setGuestSessionCookie(
  reply: FastifyReply,
  sessionId: string,
  options: { maxAgeSec: number; secure: boolean },
): void {
  // Cross-origin (front ≠ API) : SameSite=None exige Secure (HTTPS prod / preview).
  // En local HTTP : Lax (fonctionne via proxy Vite même origine, ou même hostname).
  (reply as ReplyWithCookies).setCookie(GUEST_SESSION_COOKIE_NAME, sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: options.secure ? "none" : "lax",
    secure: options.secure,
    maxAge: options.maxAgeSec,
  });
}

export function clearGuestSessionCookie(reply: FastifyReply, secure: boolean): void {
  (reply as ReplyWithCookies).clearCookie(GUEST_SESSION_COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
  });
}
