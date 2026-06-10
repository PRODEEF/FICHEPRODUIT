import { Inject, Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { AnalysisService } from "../analysis/analysis.service";
import { CreditService } from "../billing/credit.service";
import { ShopService } from "../shop/shop.service";
import type { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { sanitizeSignupMetadata } from "./signup-metadata.validation";
import { USER_REPOSITORY, type IUserRepository } from "./user.repository.interface";
import type { UpdateUserProfile, UserProfile } from "./types/user.types";

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly analysisService: AnalysisService,
    private readonly creditService: CreditService,
    private readonly shopService: ShopService,
  ) {}

  async getMe(user: AuthenticatedUser) {
    let profile = await this.userRepo.ensureRow(user.id, user.accessToken);
    await this.creditService.grantSignupCredits(user.id);
    profile = await this.reconcileSignupMetadataIfNeeded(user, profile);
    return this.composeMe(profile, user.email);
  }

  async updateMe(user: AuthenticatedUser, dto: UpdateUserProfileDto) {
    const current = await this.userRepo.ensureRow(user.id, user.accessToken);
    const patch: UpdateUserProfile = {};
    if (dto.username !== undefined) {
      patch.username = dto.username;
    }

    const mergedWebsite = dto.websiteUrl !== undefined ? dto.websiteUrl : current.websiteUrl;
    const mergedPending =
      dto.pendingAutoAnalyze !== undefined ? dto.pendingAutoAnalyze : current.pendingAutoAnalyze;
    const sanitized = sanitizeSignupMetadata({
      websiteUrl: mergedWebsite,
      pendingAutoAnalyze: mergedPending,
    });

    if (dto.websiteUrl !== undefined) {
      patch.websiteUrl = sanitized.websiteUrl;
    }
    if (dto.pendingAutoAnalyze !== undefined || dto.websiteUrl !== undefined) {
      patch.pendingAutoAnalyze = sanitized.pendingAutoAnalyze;
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

  /** Corrige en base des métadonnées signup client invalides (URL / pending_auto_analyze). */
  private async reconcileSignupMetadataIfNeeded(
    user: AuthenticatedUser,
    profile: UserProfile,
  ): Promise<UserProfile> {
    const sanitized = sanitizeSignupMetadata({
      websiteUrl: profile.websiteUrl,
      pendingAutoAnalyze: profile.pendingAutoAnalyze,
    });
    if (
      sanitized.websiteUrl === profile.websiteUrl &&
      sanitized.pendingAutoAnalyze === profile.pendingAutoAnalyze
    ) {
      return profile;
    }
    return this.userRepo.update(
      user.id,
      {
        websiteUrl: sanitized.websiteUrl,
        pendingAutoAnalyze: sanitized.pendingAutoAnalyze,
      },
      user.accessToken,
    );
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
