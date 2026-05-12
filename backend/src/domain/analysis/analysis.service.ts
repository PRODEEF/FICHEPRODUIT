import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ANALYSIS_REPOSITORY, type IAnalysisRepository } from "./analysis.repository.interface";
import { AnalysisPipelineService } from "./analysis-pipeline.service";
import type { Analysis } from "./analysis.types";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";

@Injectable()
export class AnalysisService {
  constructor(
    @Inject(ANALYSIS_REPOSITORY)
    private readonly analysisRepo: IAnalysisRepository,
    private readonly pipeline: AnalysisPipelineService,
  ) {}

  // ─── User ─────────────────────────────────────────────────────

  async create(url: string, user: AuthenticatedUser): Promise<Analysis> {
    const analysis = await this.analysisRepo.create(
      { url, userId: user.id, sessionId: null },
      user.accessToken,
    );
    this.pipeline.runInBackground(analysis, user.accessToken);
    return analysis;
  }

  async listForUser(user: AuthenticatedUser): Promise<Analysis[]> {
    return this.analysisRepo.findAllByUser(user.id, user.accessToken);
  }

  async getForUser(id: string, user: AuthenticatedUser): Promise<Analysis> {
    const analysis = await this.analysisRepo.findById(id, user.accessToken);
    if (!analysis || analysis.userId !== user.id) {
      throw new NotFoundException("Analysis not found");
    }
    return analysis;
  }

  // ─── Guest ────────────────────────────────────────────────────

  async createForGuest(url: string, sessionId: string): Promise<Analysis> {
    const analysis = await this.analysisRepo.create(
      { url, userId: null, sessionId },
      "", // pas de JWT — le repo utilisera .admin
    );
    this.pipeline.runInBackground(analysis, "");
    return analysis;
  }

  async getForGuest(id: string, sessionId: string): Promise<Analysis> {
    const analysis = await this.analysisRepo.findByIdForGuest(id, sessionId);
    if (!analysis) throw new NotFoundException("Analysis not found");
    return analysis;
  }

  // ─── Transfert au signup ──────────────────────────────────────

  async transferGuestAnalyses(sessionId: string, userId: string): Promise<void> {
    return this.analysisRepo.transferToUser(sessionId, userId);
  }
}
