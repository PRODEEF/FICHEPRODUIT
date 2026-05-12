export type AnalysisStatus = "pending" | "running" | "done" | "failed";

export type AnalysisErrorCode =
  | "SITE_UNREACHABLE"
  | "UNANALYZABLE"
  | "UNKNOWN_SECTOR"
  | "INTERNAL_ERROR";

export type Analysis = {
  id: string;
  url: string;
  status: AnalysisStatus;
  errorCode: AnalysisErrorCode | null;
  errorMessage: string | null;
  userId: string | null; // null si guest
  sessionId: string | null; // null si connecté
  shopId: string | null; // défini quand status = done et utilisateur connecté (boutique créée)
  createdAt: string;
};

export type CreateAnalysis = {
  url: string;
  userId: string | null;
  sessionId: string | null;
};
