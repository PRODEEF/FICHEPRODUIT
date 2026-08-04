import { ExecutionContext, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { EmailVerifiedGuard } from "./email-verified.guard";
import type { AuthenticatedUser } from "../types/jwt-payload.types";

function createContext(user?: Partial<AuthenticatedUser>): ExecutionContext {
  const req: { user?: Partial<AuthenticatedUser> } = {};
  if (user) req.user = user;
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as ExecutionContext;
}

describe("EmailVerifiedGuard", () => {
  const guard = new EmailVerifiedGuard();

  it("rejette si req.user est absent (guard mal composé)", () => {
    expect(() => guard.canActivate(createContext())).toThrow(UnauthorizedException);
  });

  it("rejette avec 403 si emailConfirmedAt est null", () => {
    const ctx = createContext({
      id: "u1",
      email: "a@b.com",
      accessToken: "tok",
      emailConfirmedAt: null,
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("autorise si emailConfirmedAt est défini", () => {
    const ctx = createContext({
      id: "u1",
      email: "a@b.com",
      accessToken: "tok",
      emailConfirmedAt: "2026-08-01T10:00:00Z",
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
