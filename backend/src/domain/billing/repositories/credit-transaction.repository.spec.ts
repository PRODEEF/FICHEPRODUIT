import { InternalServerErrorException } from "@nestjs/common";

import { CreditTransactionRepository } from "./credit-transaction.repository";
import type { SupabaseService } from "../../../core/supabase/supabase.service";

describe("CreditTransactionRepository", () => {
  const selectMock = jest.fn();
  const fromMock = jest.fn(() => ({
    select: selectMock,
  }));
  const insertMock = jest.fn();
  const adminFromMock = jest.fn(() => ({
    insert: insertMock,
  }));

  const supabaseMock = {
    forUser: jest.fn(() => ({ from: fromMock })),
    admin: { from: adminFromMock },
  } as unknown as SupabaseService;

  const repository = new CreditTransactionRepository(supabaseMock);

  beforeEach(() => {
    jest.clearAllMocks();
    selectMock.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
  });

  it("retourne une liste vide si aucune transaction", async () => {
    const result = await repository.findRecentByUser("user-1", "jwt", 5);

    expect(result).toEqual([]);
    expect(supabaseMock.forUser).toHaveBeenCalledWith("jwt");
  });

  it("propage les erreurs Supabase en InternalServerErrorException", async () => {
    selectMock.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: null, error: { message: "fail" } }),
        }),
      }),
    });

    await expect(repository.findRecentByUser("user-1", "jwt")).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
