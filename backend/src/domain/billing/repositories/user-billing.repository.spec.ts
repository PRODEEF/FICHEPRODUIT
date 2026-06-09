import { InternalServerErrorException } from "@nestjs/common";

import { UserBillingRepository } from "./user-billing.repository";
import type { SupabaseService } from "../../../core/supabase/supabase.service";

describe("UserBillingRepository", () => {
  const maybeSingleMock = jest.fn();
  const eqMock = jest.fn(() => ({ maybeSingle: maybeSingleMock }));
  const selectMock = jest.fn(() => ({ eq: eqMock }));
  const fromMock = jest.fn(() => ({ select: selectMock }));

  const supabaseMock = {
    forUser: jest.fn(() => ({ from: fromMock })),
    admin: { from: fromMock },
  } as unknown as SupabaseService;

  const repository = new UserBillingRepository(supabaseMock);

  beforeEach(() => {
    jest.clearAllMocks();
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
  });

  it("retourne null si l'utilisateur n'a pas de fiche facturation", async () => {
    const result = await repository.findByUserId("user-1", "jwt");

    expect(result).toBeNull();
    expect(supabaseMock.forUser).toHaveBeenCalledWith("jwt");
  });

  it("propage les erreurs Supabase en InternalServerErrorException", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: "fail" } });

    await expect(repository.findByUserId("user-1", "jwt")).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
