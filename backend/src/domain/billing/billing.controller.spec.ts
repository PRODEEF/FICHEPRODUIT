import { CanActivate } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { EmailVerifiedGuard } from "../../core/auth/guards/email-verified.guard";
import { JwtGuard } from "../../core/auth/guards/jwt.guard";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";

const passthroughGuard: CanActivate = { canActivate: () => true };

describe("BillingController", () => {
  let controller: BillingController;

  const billingServiceMock = {
    getPlans: jest.fn(),
    getMe: jest.fn(),
    createCheckoutSession: jest.fn(),
  };

  const user: AuthenticatedUser = {
    id: "user-1",
    email: "user@test.com",
    accessToken: "jwt",
    emailConfirmedAt: "2026-08-01T10:00:00Z",
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [{ provide: BillingService, useValue: billingServiceMock }],
    })
      .overrideGuard(JwtGuard)
      .useValue(passthroughGuard)
      .overrideGuard(EmailVerifiedGuard)
      .useValue(passthroughGuard)
      .compile();

    controller = moduleRef.get(BillingController);
  });

  it("délègue getPlans au service", () => {
    billingServiceMock.getPlans.mockReturnValue({ sector: "Glisse", multiplier: 1, plans: [] });

    const result = controller.getPlans({ sector: "Glisse" });

    expect(billingServiceMock.getPlans).toHaveBeenCalledWith("Glisse");
    expect(result).toEqual({ sector: "Glisse", multiplier: 1, plans: [] });
  });

  it("délègue getMe au service", async () => {
    billingServiceMock.getMe.mockResolvedValue({ balance: 3, hasUnlimitedExports: false });

    await expect(controller.getMe(user)).resolves.toEqual({
      balance: 3,
      hasUnlimitedExports: false,
    });
  });

  it("délègue createCheckout au service", async () => {
    billingServiceMock.createCheckoutSession.mockResolvedValue({ url: "https://stripe.test" });

    await expect(
      controller.createCheckout(user, { planId: "starter", sector: "Glisse" }),
    ).resolves.toEqual({ url: "https://stripe.test" });
  });
});
