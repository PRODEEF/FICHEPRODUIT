import type { FastifyRequest } from "fastify";
import {
  GUEST_SESSION_COOKIE_NAME,
  readGuestSessionCookie,
  readGuestSessionId,
  resolveClaimGuestSessionId,
} from "./guest-session";

const SESSION_ID = "550e8400-e29b-41d4-a716-446655440000";

function reqWithCookie(cookieValue?: string): FastifyRequest {
  const cookies: Record<string, string> = {};
  if (cookieValue) cookies[GUEST_SESSION_COOKIE_NAME] = cookieValue;
  return { cookies, headers: {} } as unknown as FastifyRequest;
}

describe("readGuestSessionCookie", () => {
  it("lit uniquement le cookie httpOnly", () => {
    expect(readGuestSessionCookie(reqWithCookie(SESSION_ID))).toBe(SESSION_ID);
  });

  it("retourne undefined sans cookie", () => {
    expect(readGuestSessionCookie(reqWithCookie())).toBeUndefined();
  });
});

describe("readGuestSessionId", () => {
  it("retourne l'ID depuis le cookie", () => {
    expect(readGuestSessionId(reqWithCookie(SESSION_ID))).toBe(SESSION_ID);
  });

  it("retourne undefined sans cookie", () => {
    expect(readGuestSessionId(reqWithCookie())).toBeUndefined();
  });
});

describe("resolveClaimGuestSessionId", () => {
  it("retourne le cookie si présent", () => {
    expect(resolveClaimGuestSessionId(reqWithCookie(SESSION_ID))).toBe(SESSION_ID);
  });

  it("retourne null si le cookie est absent", () => {
    expect(resolveClaimGuestSessionId(reqWithCookie())).toBeNull();
  });
});
