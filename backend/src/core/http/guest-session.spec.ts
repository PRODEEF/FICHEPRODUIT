import type { FastifyRequest } from "fastify";
import {
  GUEST_SESSION_COOKIE_NAME,
  readGuestSessionCookie,
  resolveClaimGuestSessionId,
} from "./guest-session";

const SESSION_ID = "550e8400-e29b-41d4-a716-446655440000";

function reqWithCookie(cookieValue?: string, headerSessionId?: string): FastifyRequest {
  const cookies: Record<string, string> = {};
  if (cookieValue) cookies[GUEST_SESSION_COOKIE_NAME] = cookieValue;
  const headers: Record<string, string> = {};
  if (headerSessionId) headers["x-session-id"] = headerSessionId;
  return { cookies, headers } as unknown as FastifyRequest;
}

describe("readGuestSessionCookie", () => {
  it("lit uniquement le cookie httpOnly", () => {
    expect(readGuestSessionCookie(reqWithCookie(SESSION_ID, "other-uuid"))).toBe(SESSION_ID);
  });

  it("retourne undefined sans cookie", () => {
    expect(readGuestSessionCookie(reqWithCookie(undefined, SESSION_ID))).toBeUndefined();
  });
});

describe("resolveClaimGuestSessionId", () => {
  it("retourne le cookie si le body est absent", () => {
    expect(resolveClaimGuestSessionId(reqWithCookie(SESSION_ID))).toBe(SESSION_ID);
  });

  it("retourne le cookie si le body correspond", () => {
    expect(resolveClaimGuestSessionId(reqWithCookie(SESSION_ID), SESSION_ID)).toBe(SESSION_ID);
  });

  it("retourne null si le body ne correspond pas au cookie", () => {
    expect(
      resolveClaimGuestSessionId(reqWithCookie(SESSION_ID), "660e8400-e29b-41d4-a716-446655440001"),
    ).toBeNull();
  });

  it("retourne null sans cookie même avec body", () => {
    expect(resolveClaimGuestSessionId(reqWithCookie(), SESSION_ID)).toBeNull();
  });
});
