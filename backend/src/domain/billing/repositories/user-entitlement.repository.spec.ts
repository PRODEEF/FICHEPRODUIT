import { InternalServerErrorException } from "@nestjs/common";

import { UserEntitlementRepository } from "./user-entitlement.repository";
import type { SupabaseService } from "../../../core/supabase/supabase.service";

describe("UserEntitlementRepository", () => {
  const gtMock = jest.fn();
  const isMock = jest.fn(() => ({ gt: gtMock }));
  const eqMock = jest.fn();
  eqMock.mockImplementation(() => ({ is: isMock, eq: eqMock }));
  const selectMock = jest.fn(() => ({ eq: eqMock }));
  const fromMock = jest.fn(() => ({ select: selectMock }));

  const supabaseMock = {
    forUser: jest.fn(() => ({ from: fromMock })),
    admin: { from: fromMock },
  } as unknown as SupabaseService;

  const repository = new UserEntitlementRepository(supabaseMock);

  beforeEach(() => {
    jest.clearAllMocks();
    gtMock.mockResolvedValue({ data: [], error: null });
  });

  it("retourne une liste vide si aucun avantage actif", async () => {
    const result = await repository.findActiveByUser("user-1", "jwt");

    expect(result).toEqual([]);
    expect(supabaseMock.forUser).toHaveBeenCalledWith("jwt");
  });

  it("propage les erreurs Supabase en InternalServerErrorException", async () => {
    gtMock.mockResolvedValue({ data: null, error: { message: "fail" } });

    await expect(repository.findActiveByUser("user-1", "jwt")).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
