import type { FastifyInstance, FastifyRequest } from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

// Exception documentée : process.env utilisé ici avant que ConfigService soit disponible,
// cohérent avec l'usage de process.env.NODE_ENV dans allowList ci-dessous.
// Activer uniquement derrière un reverse-proxy de confiance (ex. Vercel, nginx configuré).
const TRUST_PROXY = process.env["TRUST_PROXY"] === "true";

function clientIp(req: FastifyRequest): string {
  if (TRUST_PROXY) {
    const xf = req.headers["x-forwarded-for"];
    if (typeof xf === "string") {
      const first = xf.split(",")[0];
      if (first?.trim()) return first.trim();
    }
    if (Array.isArray(xf) && xf[0]) {
      const first = String(xf[0]).split(",")[0];
      if (first?.trim()) return first.trim();
    }
  }
  return req.socket.remoteAddress ?? "unknown";
}

/**
 * En-têtes de sécurité (Helmet) et limitation de débit globale avec plafonds plus bas
 * sur les routes coûteuses (analyse, suggestions, export).
 * La clé de rate-limit est toujours l'IP cliente — jamais le token Bearer.
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
      if (path.startsWith("/api/suggest-urls")) return 10;
      if (req.method === "GET" && path.startsWith("/api/export")) return 15;
      return 300;
    },
    timeWindow: "1 minute",
    keyGenerator: (req) => {
      const path = (req.url ?? "").split("?")[0] ?? "";
      return `${clientIp(req)}:${req.method}:${path}`;
    },
    allowList: (req) => {
      if (process.env.NODE_ENV === "test") return true;
      const path = (req.url ?? "").split("?")[0] ?? "";
      return req.method === "GET" && (path === "/health" || path === "/");
    },
  });
}
