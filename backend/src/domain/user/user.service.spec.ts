import { UserService } from "./user.service";
import type { IUserRepository } from "./user.repository.interface";
import type { AnalysisService } from "../analysis/analysis.service";
import type { ShopService } from "../shop/shop.service";

describe("UserService", () => {
  const userRepoMock: jest.Mocked<IUserRepository> = {
    findById: jest.fn(),
    ensureRow: jest.fn(),
    update: jest.fn(),
  };

  const analysisServiceMock = {
    transferGuestAnalyses: jest.fn(),
  } as unknown as jest.Mocked<AnalysisService>;

  const shopServiceMock = {
    transferGuestShops: jest.fn(),
  } as unknown as jest.Mocked<ShopService>;

  const service = new UserService(userRepoMock, analysisServiceMock, shopServiceMock);

  beforeEach(() => {
    jest.clearAllMocks();
    userRepoMock.ensureRow.mockResolvedValue({
      id: "user-1",
      username: "demo",
      websiteUrl: null,
      pendingAutoAnalyze: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it("transfère les shops puis les analyses guest lors du claim", async () => {
    await service.claimGuestSession(
      {
        id: "user-1",
        email: "demo@test.com",
        accessToken: "token",
      },
      "session-1",
    );

    expect(shopServiceMock.transferGuestShops).toHaveBeenCalledWith("session-1", "user-1");
    expect(analysisServiceMock.transferGuestAnalyses).toHaveBeenCalledWith("session-1", "user-1");
    expect(userRepoMock.ensureRow).toHaveBeenCalledWith("user-1", "token");
  });
});
