import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SupabaseService } from "../../core/supabase/supabase.service";
import type { HealthResponse } from "./health.types";

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

  async getHealth(): Promise<HealthResponse> {
    const dbStatus = await this.checkDatabase();

    return {
      status: dbStatus === "ok" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      environment: this.config.get<string>("nodeEnv", "development"),
      services: {
        database: dbStatus,
      },
    };
  }

  private async checkDatabase(): Promise<"ok" | "error"> {
    try {
      // Requête légère — table du schéma typé
      const { error } = await this.supabase.admin.from("users").select("id").limit(1);

      // PGRST116 = table vide, connexion OK quand même
      if (error && error.code !== "PGRST116" && error.code !== "42P01") {
        this.logger.warn("Database health check failed", error.message);
        return "error";
      }
      return "ok";
    } catch {
      return "error";
    }
  }
}
