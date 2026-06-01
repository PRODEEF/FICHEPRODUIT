export default () => {
  const required = (key: string): string => {
    const val = process.env[key];
    if (!val?.trim()) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return val.trim();
  };

  const optional = (key: string, fallback: string): string => process.env[key]?.trim() || fallback;

  const nodeEnv = optional("NODE_ENV", "development");
  const corsOriginRaw = process.env["CORS_ORIGIN"]?.trim();
  let corsOrigin: string;
  if (nodeEnv === "production") {
    if (!corsOriginRaw || corsOriginRaw === "*") {
      throw new Error(
        "CORS_ORIGIN doit être défini explicitement en production (origines séparées par des virgules, pas *).",
      );
    }
    corsOrigin = corsOriginRaw;
  } else {
    corsOrigin = corsOriginRaw || "*";
  }

  return {
    port: parseInt(optional("PORT", "3000"), 10),
    nodeEnv,

    /** Origines CORS séparées par des virgules, ou `*` en dev uniquement. */
    corsOrigin,

    /** Durée de vie du cookie de session invité (secondes). */
    guestSessionCookieMaxAgeSec: parseInt(
      optional("GUEST_SESSION_COOKIE_MAX_AGE_SEC", String(60 * 60 * 24 * 30)),
      10,
    ),

    // Supabase
    supabaseUrl: required("SUPABASE_URL"),
    supabaseAnonKey: required("SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),

    // IA
    openaiApiKey: required("OPENAI_API_KEY"),
    openaiModel: optional("OPENAI_MODEL", "gpt-4o-mini"),

    // Tavily (suggest-urls)
    tavilyApiKey: required("TAVILY_API_KEY"),
    tavilySearchDepth: optional("TAVILY_SEARCH_DEPTH", "basic"),
    tavilyCountry: parseTavilyCountry(),
  };
};

function parseTavilyCountry(): string {
  const raw = process.env["TAVILY_COUNTRY"]?.trim();
  if (!raw || raw.toLowerCase() === "none" || raw.toLowerCase() === "off") return "";
  return raw;
}
