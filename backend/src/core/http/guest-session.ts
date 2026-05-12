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
export function readGuestSessionId(req: FastifyRequest): string | undefined {
  const fromCookie = (req as RequestWithCookies).cookies?.[GUEST_SESSION_COOKIE_NAME];
  if (fromCookie?.trim()) return fromCookie.trim();
  const h = req.headers["x-session-id"];
  if (typeof h === "string" && h.trim()) return h.trim();
  if (Array.isArray(h) && h[0]?.trim()) return h[0].trim();
  return undefined;
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
