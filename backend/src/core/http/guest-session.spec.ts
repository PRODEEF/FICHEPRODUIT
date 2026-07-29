import type { FastifyRequest } from "fastify";
import {
  GUEST_SESSION_COOKIE_NAME,
  readGuestSessionCookie,
  readGuestSessionHeader,
  readGuestSessionId,
  resolveClaimGuestSessionId,
} from "./guest-session";

const SESSION_ID = "550e8400-e29b-41d4-a716-446655440000";

function reqWith(
  options: { cookie?: string; header?: string } = {},
): FastifyRequest {
  const cookies: Record<string, string> = {};
  if (options.cookie) cookies[GUEST_SESSION_COOKIE_NAME] = options.cookie;
  const headers: Record<string, string> = {};
  if (options.header) headers["x-session-id"] = options.header;
  return { cookies, headers } as unknown as FastifyRequest;
}

describe("readGuestSessionCookie", () => {
  it("lit le cookie httpOnly", () => {
    expect(readGuestSessionCookie(reqWith({ cookie: SESSION_ID }))).toBe(SESSION_ID);
  });

  it("retourne undefined sans cookie", () => {
    expect(readGuestSessionCookie(reqWith())).toBeUndefined();
  });

  it("ignore un cookie non-UUID", () => {
    expect(readGuestSessionCookie(reqWith({ cookie: "not-a-uuid" }))).toBeUndefined();
  });
});

describe("readGuestSessionHeader", () => {
  it("lit l'en-tête x-session-id", () => {
    expect(readGuestSessionHeader(reqWith({ header: SESSION_ID }))).toBe(SESSION_ID);
  });

  it("retourne undefined sans en-tête", () => {
    expect(readGuestSessionHeader(reqWith())).toBeUndefined();
  });
});

describe("readGuestSessionId", () => {
  it("priorise le cookie sur l'en-tête", () => {
    const cookieId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    expect(readGuestSessionId(reqWith({ cookie: cookieId, header: SESSION_ID }))).toBe(cookieId);
  });

  it("retombe sur l'en-tête si le cookie est absent", () => {
    expect(readGuestSessionId(reqWith({ header: SESSION_ID }))).toBe(SESSION_ID);
  });

  it("retourne undefined sans cookie ni en-tête", () => {
    expect(readGuestSessionId(reqWith())).toBeUndefined();
  });
});

describe("resolveClaimGuestSessionId", () => {
  it("retourne le cookie si présent", () => {
    expect(resolveClaimGuestSessionId(reqWith({ cookie: SESSION_ID }))).toBe(SESSION_ID);
  });

  it("accepte l'en-tête en secours", () => {
    expect(resolveClaimGuestSessionId(reqWith({ header: SESSION_ID }))).toBe(SESSION_ID);
  });

  it("retourne null si absents", () => {
    expect(resolveClaimGuestSessionId(reqWith())).toBeNull();
  });
});
