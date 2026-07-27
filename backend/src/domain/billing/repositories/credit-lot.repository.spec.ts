import { InternalServerErrorException } from "@nestjs/common";

import { InsufficientCreditsDebitError } from "../exceptions/insufficient-credits-debit.error";
import { CreditLotRepository } from "./credit-lot.repository";
import type { SupabaseService } from "../../../core/supabase/supabase.service";

describe("CreditLotRepository", () => {
  const rpcMock = jest.fn();

  const supabaseMock = {
    admin: { rpc: rpcMock },
    forUser: jest.fn(),
  } as unknown as SupabaseService;

  const repository = new CreditLotRepository(supabaseMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("appelle debit_credits_fifo via RPC admin", async () => {
    rpcMock.mockResolvedValue({ error: null });

    await repository.debitCreditsFifoAdmin("user-1", 2, { export_attempt_id: "abc" });

    expect(rpcMock).toHaveBeenCalledWith("debit_credits_fifo", {
      p_user_id: "user-1",
      p_amount: 2,
      p_metadata: { export_attempt_id: "abc" },
    });
  });

  it("traduit INSUFFICIENT_CREDITS Postgres en InsufficientCreditsDebitError", async () => {
    rpcMock.mockResolvedValue({
      error: { code: "P0001", message: "INSUFFICIENT_CREDITS", details: "1" },
    });

    await expect(repository.debitCreditsFifoAdmin("user-1", 2, {})).rejects.toBeInstanceOf(
      InsufficientCreditsDebitError,
    );
  });

  it("propage les autres erreurs RPC en InternalServerErrorException", async () => {
    rpcMock.mockResolvedValue({
      error: { code: "XX000", message: "unexpected" },
    });

    await expect(repository.debitCreditsFifoAdmin("user-1", 2, {})).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
