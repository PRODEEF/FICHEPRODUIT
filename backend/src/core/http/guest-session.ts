import type { FastifyReply, FastifyRequest } from "fastify";

type RequestWithCookies = FastifyRequest & { cookies?: Record<string, string | undefined> };
type ReplyWithCookies = FastifyReply & {
  setCookie(name: string, value: string, options?: Record<string, unknown>): FastifyReply;
  clearCookie(name: string, options?: Record<string, unknown>): FastifyReply;
};

export const GUEST_SESSION_COOKIE_NAME = "ficheproduct_guest_session";

/**
 * Lit l’identifiant de session invité : cookie httpOnly en priorité, puis en-tête `x-session-id` (tests / outils).
 */
/** Cookie httpOnly uniquement (pas d’en-tête `x-session-id`). */
export function readGuestSessionCookie(req: FastifyRequest): string | undefined {
  const fromCookie = (req as RequestWithCookies).cookies?.[GUEST_SESSION_COOKIE_NAME];
  if (fromCookie?.trim()) return fromCookie.trim();
  return undefined;
}

/**
 * Lit l’identifiant de session invité : cookie httpOnly en priorité, puis en-tête `x-session-id` (tests / outils).
 */
export function readGuestSessionId(req: FastifyRequest): string | undefined {
  const fromCookie = readGuestSessionCookie(req);
  if (fromCookie) return fromCookie;
  const h = req.headers["x-session-id"];
  if (typeof h === "string" && h.trim()) return h.trim();
  if (Array.isArray(h) && h[0]?.trim()) return h[0].trim();
  return undefined;
}

/**
 * Résout l’ID de session pour le claim post-auth : cookie obligatoire ; body optionnel mais doit correspondre au cookie.
 */
export function resolveClaimGuestSessionId(
  req: FastifyRequest,
  bodySessionId?: string,
): string | null {
  const fromCookie = readGuestSessionCookie(req);
  if (!fromCookie) return null;
  const fromBody = bodySessionId?.trim();
  if (fromBody && fromBody !== fromCookie) return null;
  return fromCookie;
}

export function setGuestSessionCookie(
  reply: FastifyReply,
  sessionId: string,
  options: { maxAgeSec: number; secure: boolean },
): void {
  (reply as ReplyWithCookies).setCookie(GUEST_SESSION_COOKIE_NAME, sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: options.secure,
    maxAge: options.maxAgeSec,
  });
}

export function clearGuestSessionCookie(reply: FastifyReply, secure: boolean): void {
  (reply as ReplyWithCookies).clearCookie(GUEST_SESSION_COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
  });
}
