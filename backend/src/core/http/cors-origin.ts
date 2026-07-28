import type { FastifyCorsOptions } from "@fastify/cors";

/** Parse `CORS_ORIGIN` (liste séparée par des virgules). */
export function parseCorsOriginList(corsOrigin: string): string[] {
  if (!corsOrigin || corsOrigin === "*") {
    return [];
  }
  return corsOrigin
    .split(",")
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

/**
 * Mode CORS strict : uniquement les origines listées dans `CORS_ORIGIN`.
 * Hors strict (dev local, preview Vercel) : autorise aussi `localhost` et `*.vercel.app`.
 */
export function isStrictCorsMode(nodeEnv: string, vercelEnv?: string): boolean {
  if (vercelEnv === "preview" || vercelEnv === "development") {
    return false;
  }
  return nodeEnv === "production";
}

/**
 * Vérifie si une origine est autorisée pour les requêtes cross-origin avec credentials.
 */
export function isAllowedCorsOrigin(
  origin: string,
  allowedOrigins: string[],
  strict: boolean,
): boolean {
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  if (strict) {
    return false;
  }
  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }
    if (hostname.endsWith(".vercel.app")) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export type CorsConfigInput = {
  corsOrigin: string;
  nodeEnv: string;
  vercelEnv?: string;
};

/** Options CORS partagées entre bootstrap Nest et tests e2e. */
export function buildCorsOptions(config: CorsConfigInput): FastifyCorsOptions {
  const allowedOrigins = parseCorsOriginList(config.corsOrigin);
  const strict = isStrictCorsMode(config.nodeEnv, config.vercelEnv);

  if (!strict && allowedOrigins.length === 0) {
    return {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }

  return {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (isAllowedCorsOrigin(origin, allowedOrigins, strict)) {
        callback(null, origin);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
}
