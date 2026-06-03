import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { SupabaseService } from "../../core/supabase/supabase.service";
import type { IAnalysisRepository } from "./analysis.repository.interface";
import type { Analysis, CreateAnalysis } from "./analysis.types";

type AnalysisRow = {
  id: string;
  url: string;
  status: string;
  error_code: string | null;
  error_message: string | null;
  user_id: string | null;
  session_id: string | null;
  shop_id: string | null;
  created_at: string;
};

@Injectable()
export class AnalysisRepository implements IAnalysisRepository {
  private readonly logger = new Logger(AnalysisRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  async findById(id: string, accessToken: string): Promise<Analysis | null> {
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from("analyses")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      this.logger.error(`findById(${id}) failed`, error);
      throw new InternalServerErrorException("Échec de la récupération de l'analyse");
    }
    return data ? this.toEntity(data as AnalysisRow) : null;
  }

  async findByIdForGuest(id: string, sessionId: string): Promise<Analysis | null> {
    // Guest : pas de JWT, on utilise le client admin mais on filtre par sessionId
    const { data, error } = await this.supabase.admin
      .from("analyses")
      .select("*")
      .eq("id", id)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error) {
      this.logger.error(`findByIdForGuest(${id}) failed`, error);
      throw new InternalServerErrorException("Échec de la récupération de l'analyse");
    }
    return data ? this.toEntity(data as AnalysisRow) : null;
  }

  async findAllByUser(userId: string, accessToken: string): Promise<Analysis[]> {
    const { data, error } = await this.supabase
      .forUser(accessToken)
      .from("analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      this.logger.error(`findAllByUser(${userId}) failed`, error);
      throw new InternalServerErrorException("Échec de la récupération des analyses");
    }
    return (data ?? []).map((r) => this.toEntity(r as AnalysisRow));
  }

  async create(data: CreateAnalysis, accessToken: string): Promise<Analysis> {
    const client = accessToken ? this.supabase.forUser(accessToken) : this.supabase.admin; // guest : pas de JWT

    const { data: row, error } = await client
      .from("analyses")
      .insert({
        url: data.url,
        status: "pending",
        user_id: data.userId,
        session_id: data.sessionId,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(
        `create failed (${data.userId ? "authenticated" : "guest"})`,
        JSON.stringify({
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        }),
      );
      this.throwCreateException(error);
    }
    return this.toEntity(row as AnalysisRow);
  }

  async updateStatus(
    id: string,
    patch: Partial<Pick<Analysis, "status" | "errorCode" | "errorMessage" | "shopId">>,
    accessToken: string,
    guestSessionId?: string | null,
  ): Promise<void> {
    const client = accessToken ? this.supabase.forUser(accessToken) : this.supabase.admin;

    let query = client
      .from("analyses")
      .update({
        status: patch.status,
        error_code: patch.errorCode ?? null,
        error_message: patch.errorMessage ?? null,
        shop_id: patch.shopId ?? null,
      })
      .eq("id", id);

    if (!accessToken && guestSessionId) {
      query = query.eq("session_id", guestSessionId);
    }

    const { error } = await query;

    if (error) {
      this.logger.error(`updateStatus(${id}) failed`, error);
      throw new InternalServerErrorException("Échec de la mise à jour de l'analyse");
    }
  }

  // Admin : transfert guest → user au signup
  async transferToUser(sessionId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.admin
      .from("analyses")
      .update({ user_id: userId, session_id: null })
      .eq("session_id", sessionId);

    if (error) {
      this.logger.error(`transferToUser(${sessionId}) failed`, error);
      throw new InternalServerErrorException("Échec du transfert des analyses invité");
    }
  }

  // ─── Mappers ──────────────────────────────────────────────────

  private toEntity(row: AnalysisRow): Analysis {
    return {
      id: row.id,
      url: row.url,
      status: row.status as Analysis["status"],
      errorCode: (row.error_code as Analysis["errorCode"]) ?? null,
      errorMessage: row.error_message,
      userId: row.user_id,
      sessionId: row.session_id,
      shopId: row.shop_id,
      createdAt: row.created_at,
    };
  }

  private throwCreateException(error: {
    code?: string | null;
    message: string;
    details?: string | null;
    hint?: string | null;
  }): never {
    if (error.code === "42501") {
      throw new ForbiddenException(
        "Vous n'avez pas les permissions nécessaires pour créer une analyse.",
      );
    }

    if (error.code === "23505") {
      throw new ConflictException("Une analyse identique existe déjà.");
    }

    if (error.code === "22P02" || error.code === "23503" || error.code === "23514") {
      throw new BadRequestException("Les données d'analyse sont invalides.");
    }

    throw new InternalServerErrorException("Échec de la création de l'analyse");
  }
}
