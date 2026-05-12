import type { Analysis, CreateAnalysis } from "./analysis.types";

export interface IAnalysisRepository {
  findById(id: string, accessToken: string): Promise<Analysis | null>;
  findByIdForGuest(id: string, sessionId: string): Promise<Analysis | null>;
  findAllByUser(userId: string, accessToken: string): Promise<Analysis[]>;
  create(data: CreateAnalysis, accessToken: string): Promise<Analysis>;
  updateStatus(
    id: string,
    patch: Partial<Pick<Analysis, "status" | "errorCode" | "errorMessage" | "shopId">>,
    accessToken: string,
  ): Promise<void>;
  transferToUser(sessionId: string, userId: string): Promise<void>; // admin
}

export const ANALYSIS_REPOSITORY = Symbol("IAnalysisRepository");
