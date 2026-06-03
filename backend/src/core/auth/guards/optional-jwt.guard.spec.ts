import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { OptionalJwtGuard } from "./optional-jwt.guard";
import type { SupabaseService } from "../../supabase/supabase.service";

function createContext(authHeader?: string): ExecutionContext {
  const req: { headers: Record<string, string>; user?: unknown } = {
    headers: {},
  };
  if (authHeader) req.headers.authorization = authHeader;
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as ExecutionContext;
}

describe("OptionalJwtGuard", () => {
  const getUser = jest.fn();
  const supabase = { getUser } as unknown as SupabaseService;
  const guard = new OptionalJwtGuard(supabase);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("autorise sans en-tête Authorization", async () => {
    await expect(guard.canActivate(createContext())).resolves.toBe(true);
    expect(getUser).not.toHaveBeenCalled();
  });

  it("peuple req.user si le token est valide", async () => {
    getUser.mockResolvedValue({ id: "u1", email: "a@b.com" });
    const ctx = createContext("Bearer valid-token");
    const req = ctx.switchToHttp().getRequest<{ user?: { id: string } }>();

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(getUser).toHaveBeenCalledWith("valid-token");
    expect(req.user?.id).toBe("u1");
  });

  it("rejette avec 401 si Bearer présent mais token invalide", async () => {
    getUser.mockResolvedValue(null);
    await expect(guard.canActivate(createContext("Bearer expired"))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
