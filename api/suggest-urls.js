/**
 * Suggest ecommerce site URLs from a free-text hint (store name, etc.).
 * Uses Tavily Search when TAVILY_API_KEY (or TAVILY_SEARCH_API_KEY) is set; otherwise heuristics.
 * GET or POST: ?q=... or body { q: "..." }
 */

const SOCIAL_HOST_SUFFIXES = [
  "facebook.com",
  "fb.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "linkedin.com",
  "pinterest.com",
  "youtube.com",
  "youtu.be",
  "snapchat.com",
  "reddit.com",
  "threads.net",
  "tumblr.com",
  "discord.com",
  "discord.gg",
  "vk.com",
  "t.me",
  "telegram.me",
  "telegram.org",
  "whatsapp.com",
  "weibo.com",
  "bsky.app",
  "t.co",
  "line.me",
  "messenger.com",
];

const SUGGEST_URL_LIMIT = 6;
const TAVILY_MAX_RESULTS = 20;

function isSocialMediaHostname(hostname) {
  const h = hostname.toLowerCase();
  for (const suffix of SOCIAL_HOST_SUFFIXES) {
    if (h === suffix || h.endsWith(`.${suffix}`)) return true;
  }
  return false;
}

function extractBrandTokensFromHint(q) {
  const s = String(q).toLowerCase().trim();
  const tokens = new Set();
  for (const m of s.match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? []) {
    if (m.length >= 2) tokens.add(m);
  }
  const compact = s.replace(/[^a-z0-9]/g, "");
  if (compact.length >= 3) tokens.add(compact);
  return [...tokens];
}

function prioritizeBrandRelevantUrls(urls, q) {
  const tokens = extractBrandTokensFromHint(q);
  if (tokens.length === 0) return [...urls];

  const match = [];
  const rest = [];
  for (const u of urls) {
    let host;
    try {
      host = new URL(u).hostname.toLowerCase();
    } catch (_) {
      rest.push(u);
      continue;
    }
    const relevant = tokens.some((t) => t.length >= 2 && host.includes(t));
    if (relevant) match.push(u);
    else rest.push(u);
  }
  return [...match, ...rest];
}

function buildTavilySuggestQuery(raw) {
  const q = raw.trim();
  if (!q) return q;
  if (/^https?:\/\//i.test(q)) return q;
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(q)) return q;
  return `${q} site officiel`;
}

function resolveTavilyCountry() {
  const raw = process.env.TAVILY_COUNTRY;
  if (raw === undefined || raw.trim() === "") return "france";
  const t = raw.trim().toLowerCase();
  if (t === "none" || t === "off") return "";
  return raw.trim();
}

function heuristicUrls(q) {
  const s = String(q).toLowerCase().trim();
  const slug = s
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/gi, "")
    .replace(/^-+|-+$/g, "");
  if (!slug) return [];
  const out = [];
  const add = (u) => {
    if (!out.includes(u)) out.push(u);
  };
  add(`https://www.${slug}.fr`);
  add(`https://${slug}.fr`);
  add(`https://www.${slug}.com`);
  add(`https://${slug}.com`);
  return out.slice(0, SUGGEST_URL_LIMIT);
}

/** Homepage only: origin (no path, query, fragment) — drops srsltid etc. */
function normalizeResultLink(link) {
  const u = String(link || "").trim();
  if (!/^https?:\/\//i.test(u)) return null;
  try {
    return new URL(u).origin;
  } catch (_) {
    return null;
  }
}

function tavilyApiKey() {
  return (
    process.env.TAVILY_API_KEY ||
    process.env.TAVILY_SEARCH_API_KEY ||
    ""
  ).trim();
}

async function suggestWithTavilySearch(q) {
  const key = tavilyApiKey();
  if (!key) return null;

  const searchDepth = (process.env.TAVILY_SEARCH_DEPTH || "basic").trim();
  const country = resolveTavilyCountry();
  const rawQuery = String(q).trim();
  if (!rawQuery) return null;
  const query = buildTavilySuggestQuery(rawQuery);

  const body = {
    query,
    search_depth: searchDepth || "basic",
    max_results: TAVILY_MAX_RESULTS,
    include_answer: false,
  };
  if (country) body.country = country;

  let res;
  try {
    res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
  } catch (_) {
    return null;
  }

  if (!res.ok) return null;

  const data = await res.json().catch(() => ({}));
  const results = data.results;
  if (!Array.isArray(results) || results.length === 0) return null;

  const candidates = [];
  const seen = new Set();

  for (const raw of results) {
    const link = raw?.url;
    if (typeof link !== "string") continue;

    let hostname;
    try {
      hostname = new URL(link).hostname;
    } catch (_) {
      continue;
    }

    if (isSocialMediaHostname(hostname)) continue;

    const normalized = normalizeResultLink(link);
    if (!normalized || seen.has(normalized)) continue;

    seen.add(normalized);
    candidates.push(normalized);
  }

  if (candidates.length === 0) return null;

  const collected = prioritizeBrandRelevantUrls(candidates, rawQuery).slice(
    0,
    SUGGEST_URL_LIMIT,
  );

  return collected.length ? collected : null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const q = (req.query?.q || req.body?.q || "").trim();
  if (!q) return res.status(400).json({ error: "Paramètre q manquant" });

  let urls = await suggestWithTavilySearch(q).catch(() => null);
  if (!urls || urls.length === 0) {
    urls = heuristicUrls(q);
  }

  return res.status(200).json({ urls });
}
