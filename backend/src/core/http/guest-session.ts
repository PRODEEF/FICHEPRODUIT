import type { FastifyReply, FastifyRequest } from "fastify";

type RequestWithCookies = FastifyRequest & { cookies?: Record<string, string | undefined> };
type ReplyWithCookies = FastifyReply & {
  setCookie(name: string, value: string, options?: Record<string, unknown>): FastifyReply;
  clearCookie(name: string, options?: Record<string, unknown>): FastifyReply;
};

export const GUEST_SESSION_COOKIE_NAME = "ficheproduct_guest_session";

/** Cookie httpOnly uniquement (pas d’en-tête `x-session-id`). */
export function readGuestSessionCookie(req: FastifyRequest): string | undefined {
  const fromCookie = (req as RequestWithCookies).cookies?.[GUEST_SESSION_COOKIE_NAME];
  if (fromCookie?.trim()) return fromCookie.trim();
  return undefined;
}

function readGuestSessionHeader(req: FastifyRequest): string | undefined {
  const h = req.headers["x-session-id"];
  if (typeof h === "string" && h.trim()) return h.trim();
  if (Array.isArray(h) && h[0]?.trim()) return h[0].trim();
  return undefined;
}

/**
 * Lit l’identifiant de session invité : cookie httpOnly en priorité, puis en-tête `x-session-id`.
 */
export function readGuestSessionId(req: FastifyRequest): string | undefined {
  return readGuestSessionCookie(req) ?? readGuestSessionHeader(req);
}

/**
 * Résout l’ID de session pour le claim post-auth (JWT requis) :
 * cookie en priorité ; sinon body ou en-tête `x-session-id` (cross-origin / nouvel onglet).
 */
export function resolveClaimGuestSessionId(
  req: FastifyRequest,
  bodySessionId?: string,
): string | null {
  const fromCookie = readGuestSessionCookie(req);
  const fromBody = bodySessionId?.trim();

  if (fromCookie) {
    if (fromBody && fromBody !== fromCookie) return null;
    return fromCookie;
  }

  if (fromBody) return fromBody;

  return readGuestSessionHeader(req) ?? null;
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
