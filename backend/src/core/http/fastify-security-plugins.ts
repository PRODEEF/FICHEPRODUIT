import type { FastifyInstance, FastifyRequest } from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

function hasBearerAuth(req: FastifyRequest): boolean {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ");
}

function suggestUrlsRateLimitKey(req: FastifyRequest): string {
  if (hasBearerAuth(req)) {
    const token = String(req.headers.authorization).slice(7, 43);
    return `suggest-auth:${token}`;
  }
  return `suggest-anon:${clientIp(req)}`;
}

function clientIp(req: FastifyRequest): string {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) {
    return xf.split(",")[0]!.trim();
  }
  if (Array.isArray(xf) && xf[0]) {
    return String(xf[0]).split(",")[0]!.trim();
  }
  return req.socket.remoteAddress ?? "unknown";
}

/**
 * En-têtes de sécurité (Helmet) et limitation de débit globale avec plafonds plus bas
 * sur les routes coûteuses (analyse, suggestions, export).
 */
export async function registerHttpSecurityPlugins(fastify: FastifyInstance): Promise<void> {
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  await fastify.register(rateLimit, {
    global: true,
    max: (req) => {
      const path = (req.url ?? "").split("?")[0] ?? "";
      if (req.method === "POST" && path === "/api/analyses") return 20;
      if (path.startsWith("/api/suggest-urls")) {
        return hasBearerAuth(req) ? 25 : 5;
      }
      if (req.method === "POST" && path.startsWith("/api/export")) return 15;
      return 300;
    },
    timeWindow: "1 minute",
    keyGenerator: (req) => {
      const path = (req.url ?? "").split("?")[0] ?? "";
      if (path.startsWith("/api/suggest-urls")) {
        return `${suggestUrlsRateLimitKey(req)}:${req.method}:${path}`;
      }
      return `${clientIp(req)}:${req.method}:${path}`;
    },
    allowList: (req) => {
      if (process.env.NODE_ENV === "test") return true;
      const path = (req.url ?? "").split("?")[0] ?? "";
      return req.method === "GET" && (path === "/health" || path === "/");
    },
  });
}
