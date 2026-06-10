export default () => {
  const required = (key: string): string => {
    const val = process.env[key];
    if (!val?.trim()) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return val.trim();
  };

  const optional = (key: string, fallback: string): string => process.env[key]?.trim() || fallback;

  const nodeEnv = optional("NODE_ENV", "preview");
  const corsOriginRaw = process.env["CORS_ORIGIN"]?.trim();
  let corsOrigin: string;
  if (nodeEnv === "production") {
    if (!corsOriginRaw || corsOriginRaw === "*") {
      throw new Error("CORS_ORIGIN doit être défini explicitement en production.");
    }
    corsOrigin = corsOriginRaw;
  } else {
    corsOrigin = corsOriginRaw || "*";
  }
  corsOrigin = "*"; // TODO: remove this

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
    /** Active la génération de traces scrape-fields (désactivée en production). */
    scrapeFieldsTraceEnabled: nodeEnv !== "production",
    /** Dossier local des traces scrape-fields (relatif au backend). */
    scrapeFieldsTraceDir: optional("SCRAPE_FIELDS_TRACE_DIR", "logs/scrape-fields"),

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

    // Stripe (optionnel en dev — checkout indisponible si vide)
    stripeSecretKey: optional("STRIPE_SECRET_KEY", ""),
    stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET", ""),
    stripeSuccessUrl: optional("STRIPE_SUCCESS_URL", "http://localhost:5173/billing/success"),
    stripeCancelUrl: optional("STRIPE_CANCEL_URL", "http://localhost:5173/billing/cancel"),
    stripePricePlatinum: optional("STRIPE_PRICE_PLATINUM", ""),
  };
};

function parseTavilyCountry(): string {
  const raw = process.env["TAVILY_COUNTRY"]?.trim();
  if (!raw || raw.toLowerCase() === "none" || raw.toLowerCase() === "off") return "";
  return raw;
}
