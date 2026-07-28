import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ANALYSIS_REPOSITORY, type IAnalysisRepository } from "./analysis.repository.interface";
import { AnalysisPipelineService } from "./analysis-pipeline.service";
import { toPublicAnalyses, toPublicAnalysis, type PublicAnalysis } from "./analysis-public.mapper";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";

@Injectable()
export class AnalysisService {
  constructor(
    @Inject(ANALYSIS_REPOSITORY)
    private readonly analysisRepo: IAnalysisRepository,
    private readonly pipeline: AnalysisPipelineService,
  ) {}

  // ─── User ─────────────────────────────────────────────────────

  async create(url: string, user: AuthenticatedUser): Promise<PublicAnalysis> {
    const analysis = await this.analysisRepo.create(
      { url, userId: user.id, sessionId: null },
      user.accessToken,
    );
    this.pipeline.runInBackground(analysis, user.accessToken);
    return toPublicAnalysis(analysis);
  }

  async listForUser(user: AuthenticatedUser): Promise<PublicAnalysis[]> {
    const analyses = await this.analysisRepo.findAllByUser(user.id, user.accessToken);
    return toPublicAnalyses(analyses);
  }

  async getForUser(id: string, user: AuthenticatedUser): Promise<PublicAnalysis> {
    const analysis = await this.analysisRepo.findById(id, user.accessToken);
    if (!analysis || analysis.userId !== user.id) {
      throw new NotFoundException("Analyse introuvable");
    }
    return toPublicAnalysis(analysis);
  }

  // ─── Guest ────────────────────────────────────────────────────

  async createForGuest(url: string, sessionId: string): Promise<PublicAnalysis> {
    const analysis = await this.analysisRepo.create(
      { url, userId: null, sessionId },
      "", // pas de JWT — le repo utilisera .admin
    );
    this.pipeline.runInBackground(analysis, "");
    return toPublicAnalysis(analysis);
  }

  async getForGuest(id: string, sessionId: string): Promise<PublicAnalysis> {
    const analysis = await this.analysisRepo.findByIdForGuest(id, sessionId);
    if (!analysis) throw new NotFoundException("Analyse introuvable");
    return toPublicAnalysis(analysis);
  }

  // ─── Transfert au signup ──────────────────────────────────────

  async transferGuestAnalyses(sessionId: string, userId: string): Promise<void> {
    return this.analysisRepo.transferToUser(sessionId, userId);
  }
}
