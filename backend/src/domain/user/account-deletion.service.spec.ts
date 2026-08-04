import {
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";

import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import type { SupabaseService } from "../../core/supabase/supabase.service";
import type { StripeService } from "../billing/stripe.service";
import { AccountDeletionService } from "./account-deletion.service";

type PostgrestResult = { data: unknown; error: unknown };

/**
 * Construit un client PostgREST factice `from(...).select().eq().maybeSingle()` et
 * `from(...).insert()` / `.delete().eq()` avec un scénario par table. Chaque appel
 * `from("<table>")` retourne un builder qui se termine sur la valeur résolue passée.
 */
function buildAdminClient(scenario: {
  billing?: PostgrestResult;
  creditLots?: PostgrestResult;
  archiveInsert?: PostgrestResult;
  transactionsDelete?: PostgrestResult;
  deleteUser?: { error: unknown };
}) {
  const billing: PostgrestResult = scenario.billing ?? { data: null, error: null };
  const creditLots: PostgrestResult = scenario.creditLots ?? { data: [], error: null };
  const archiveInsert: PostgrestResult = scenario.archiveInsert ?? { data: null, error: null };
  const transactionsDelete: PostgrestResult = scenario.transactionsDelete ?? {
    data: null,
    error: null,
  };
  const deleteUserResult = scenario.deleteUser ?? { error: null };

  const spies = {
    fromBilling: jest.fn(),
    fromCreditLots: jest.fn(),
    insertArchive: jest.fn(),
    deleteTransactions: jest.fn(),
    deleteAuthUser: jest.fn(),
  };

  const admin = {
    from: jest.fn((table: string) => {
      if (table === "user_billing") {
        spies.fromBilling(table);
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue(billing),
            }),
          }),
        };
      }
      if (table === "credit_lots") {
        spies.fromCreditLots(table);
        // `.select("*").eq("user_id", ...)` doit résoudre directement (pas de maybeSingle).
        const selectResult = Promise.resolve(creditLots);
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(selectResult),
          }),
        };
      }
      if (table === "billing_invoice_archive") {
        return {
          insert: jest.fn((payload: unknown) => {
            spies.insertArchive(payload);
            return Promise.resolve(archiveInsert);
          }),
        };
      }
      if (table === "credit_transactions") {
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn((column: string, value: string) => {
              spies.deleteTransactions(column, value);
              return Promise.resolve(transactionsDelete);
            }),
          }),
        };
      }
      throw new Error(`table inattendue : ${table}`);
    }),
    auth: {
      admin: {
        deleteUser: jest.fn(async (userId: string) => {
          spies.deleteAuthUser(userId);
          return deleteUserResult;
        }),
      },
    },
  };

  return { admin, spies };
}

describe("AccountDeletionService", () => {
  const user: AuthenticatedUser = {
    id: "user-1",
    email: "user@test.com",
    accessToken: "jwt",
    emailConfirmedAt: "2026-08-01T10:00:00Z",
  };

  const stripeMock = {
    cancelSubscription: jest.fn().mockResolvedValue(undefined),
    anonymizeCustomer: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<StripeService>;

  const verifyEmailPasswordMock = jest.fn();

  function createService(scenario: Parameters<typeof buildAdminClient>[0]) {
    const built = buildAdminClient(scenario);
    const supabase = {
      admin: built.admin,
      verifyEmailPassword: verifyEmailPasswordMock,
    } as unknown as SupabaseService;
    const service = new AccountDeletionService(supabase, stripeMock);
    return { service, spies: built.spies };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    verifyEmailPasswordMock.mockResolvedValue(true);
    (stripeMock.cancelSubscription as jest.Mock).mockResolvedValue(undefined);
    (stripeMock.anonymizeCustomer as jest.Mock).mockResolvedValue(undefined);
  });

  it("lève UnauthorizedException si le mot de passe est invalide", async () => {
    verifyEmailPasswordMock.mockResolvedValue(false);
    const { service } = createService({});

    await expect(service.deleteAccount(user, "mauvais")).rejects.toThrow(UnauthorizedException);
  });

  it("orchestre toutes les étapes dans l'ordre attendu", async () => {
    const { service, spies } = createService({
      billing: {
        data: {
          user_id: user.id,
          stripe_customer_id: "cus_1",
          active_subscription_id: "sub_1",
          subscription_status: "active",
          subscription_period_end: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
        error: null,
      },
      creditLots: {
        data: [
          {
            id: "lot-1",
            user_id: user.id,
            amount_initial: 3,
            amount_remaining: 3,
            source: "signup_grant",
            plan_id: null,
            sector: null,
            expires_at: null,
            stripe_checkout_session_id: null,
            stripe_invoice_id: null,
            created_at: "2026-01-02T00:00:00Z",
          },
          {
            id: "lot-2",
            user_id: user.id,
            amount_initial: 10,
            amount_remaining: 4,
            source: "pack_purchase",
            plan_id: "starter",
            sector: "Glisse",
            expires_at: null,
            stripe_checkout_session_id: "cs_1",
            stripe_invoice_id: null,
            created_at: "2026-01-03T00:00:00Z",
          },
        ],
        error: null,
      },
    });

    await service.deleteAccount(user, "hunter2");

    expect(verifyEmailPasswordMock).toHaveBeenCalledWith(user.email, "hunter2");
    expect(stripeMock.cancelSubscription).toHaveBeenCalledWith("sub_1");
    // Seul le lot avec Stripe metadata / source facturée doit être archivé.
    expect(spies.insertArchive).toHaveBeenCalledWith([
      expect.objectContaining({
        stripe_checkout_session_id: "cs_1",
        credits_amount: 10,
        source: "pack_purchase",
        plan_id: "starter",
        sector: "Glisse",
        purchased_at: "2026-01-03T00:00:00Z",
      }),
    ]);
    expect(spies.deleteTransactions).toHaveBeenCalledWith("user_id", user.id);
    expect(stripeMock.anonymizeCustomer).toHaveBeenCalledWith("cus_1");
    expect(spies.deleteAuthUser).toHaveBeenCalledWith(user.id);
  });

  it("ne tente pas d'annuler l'abonnement s'il n'existe pas", async () => {
    const { service, spies } = createService({
      billing: {
        data: {
          user_id: user.id,
          stripe_customer_id: null,
          active_subscription_id: null,
          subscription_status: null,
          subscription_period_end: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
        error: null,
      },
      creditLots: { data: [], error: null },
    });

    await service.deleteAccount(user, "hunter2");

    expect(stripeMock.cancelSubscription).not.toHaveBeenCalled();
    expect(stripeMock.anonymizeCustomer).not.toHaveBeenCalled();
    expect(spies.insertArchive).not.toHaveBeenCalled();
    expect(spies.deleteAuthUser).toHaveBeenCalledWith(user.id);
  });

  it("supprime le compte même sans ligne user_billing", async () => {
    const { service, spies } = createService({
      billing: { data: null, error: null },
      creditLots: { data: [], error: null },
    });

    await service.deleteAccount(user, "hunter2");

    expect(stripeMock.cancelSubscription).not.toHaveBeenCalled();
    expect(stripeMock.anonymizeCustomer).not.toHaveBeenCalled();
    expect(spies.deleteAuthUser).toHaveBeenCalledWith(user.id);
  });

  it("propage ServiceUnavailableException si Stripe échoue à annuler l'abonnement", async () => {
    (stripeMock.cancelSubscription as jest.Mock).mockRejectedValueOnce(
      new ServiceUnavailableException("Stripe indispo"),
    );
    const { service, spies } = createService({
      billing: {
        data: {
          user_id: user.id,
          stripe_customer_id: "cus_1",
          active_subscription_id: "sub_1",
          subscription_status: "active",
          subscription_period_end: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
        error: null,
      },
    });

    await expect(service.deleteAccount(user, "hunter2")).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(spies.deleteAuthUser).not.toHaveBeenCalled();
  });

  it("emballe les erreurs Postgres en InternalServerErrorException", async () => {
    const { service } = createService({
      billing: { data: null, error: { message: "db down" } },
    });

    await expect(service.deleteAccount(user, "hunter2")).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
