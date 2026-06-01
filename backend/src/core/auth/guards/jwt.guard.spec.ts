import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtGuard } from "./jwt.guard";
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

describe("JwtGuard", () => {
  const getUser = jest.fn();
  const supabase = { getUser } as unknown as SupabaseService;
  const guard = new JwtGuard(supabase);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejette sans token", async () => {
    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejette si le token est invalide", async () => {
    getUser.mockResolvedValue(null);
    await expect(guard.canActivate(createContext("Bearer bad"))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("autorise et attache req.user si le token est valide", async () => {
    getUser.mockResolvedValue({ id: "u1", email: "demo@test.com" });
    const ctx = createContext("Bearer ok");
    const req = ctx.switchToHttp().getRequest<{ user?: { accessToken: string } }>();

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user?.accessToken).toBe("ok");
  });
});
