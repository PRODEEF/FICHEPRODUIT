import type { FastifyReply, FastifyRequest } from "fastify";

type RequestWithCookies = FastifyRequest & { cookies?: Record<string, string | undefined> };
type ReplyWithCookies = FastifyReply & {
  setCookie(name: string, value: string, options?: Record<string, unknown>): FastifyReply;
  clearCookie(name: string, options?: Record<string, unknown>): FastifyReply;
};

export const GUEST_SESSION_COOKIE_NAME = "ficheproduct_guest_session";

/** Lit l'identifiant de session invité depuis le cookie httpOnly uniquement. */
export function readGuestSessionCookie(req: FastifyRequest): string | undefined {
  const fromCookie = (req as RequestWithCookies).cookies?.[GUEST_SESSION_COOKIE_NAME];
  if (fromCookie?.trim()) return fromCookie.trim();
  return undefined;
}

/**
 * Lit l'identifiant de session invité.
 * Cookie httpOnly uniquement — l'en-tête `x-session-id` n'est plus accepté.
 */
export function readGuestSessionId(req: FastifyRequest): string | undefined {
  return readGuestSessionCookie(req);
}

/**
 * Résout l'ID de session pour le claim post-auth (JWT requis).
 * Cookie httpOnly uniquement — body et en-tête `x-session-id` sont rejetés.
 */
export function resolveClaimGuestSessionId(req: FastifyRequest): string | null {
  return readGuestSessionCookie(req) ?? null;
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
