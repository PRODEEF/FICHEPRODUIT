import { Inject, Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { AnalysisService } from "../analysis/analysis.service";
import { ShopService } from "../shop/shop.service";
import type { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { USER_REPOSITORY, type IUserRepository } from "./user.repository.interface";
import type { UpdateUserProfile, UserProfile } from "./types/user.types";

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly analysisService: AnalysisService,
    private readonly shopService: ShopService,
  ) {}

  async getMe(user: AuthenticatedUser) {
    const profile = await this.userRepo.ensureRow(user.id, user.accessToken);
    return this.composeMe(profile, user.email);
  }

  async updateMe(user: AuthenticatedUser, dto: UpdateUserProfileDto) {
    await this.userRepo.ensureRow(user.id, user.accessToken);
    const patch: UpdateUserProfile = {};
    if (dto.username !== undefined) {
      patch.username = dto.username;
    }
    if (dto.websiteUrl !== undefined) {
      patch.websiteUrl = dto.websiteUrl;
    }
    if (dto.pendingAutoAnalyze !== undefined) {
      patch.pendingAutoAnalyze = dto.pendingAutoAnalyze;
    }
    if (Object.keys(patch).length === 0) {
      return this.getMe(user);
    }
    const updated = await this.userRepo.update(user.id, patch, user.accessToken);
    return this.composeMe(updated, user.email);
  }

  async claimGuestSession(user: AuthenticatedUser, sessionId: string) {
    await this.shopService.transferGuestShops(sessionId, user.id);
    await this.analysisService.transferGuestAnalyses(sessionId, user.id);
    return this.getMe(user);
  }

  private composeMe(profile: UserProfile, email: string) {
    return {
      id: profile.id,
      email,
      username: profile.username,
      websiteUrl: profile.websiteUrl,
      pendingAutoAnalyze: profile.pendingAutoAnalyze,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
