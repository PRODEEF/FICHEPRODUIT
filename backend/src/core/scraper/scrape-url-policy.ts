import { lookup } from "node:dns/promises";
import { isIPv4, isIPv6 } from "node:net";

const BLOCKED_HOSTNAMES = new Set(
  ["localhost", "metadata.google.internal", "metadata.goog"].map((h) => h.toLowerCase()),
);

/**
 * Refuse les URL non HTTP(S), les IP / plages privées et quelques hôtes sensibles
 * avant un fetch serveur (mitigation SSRF de base).
 */
export async function assertUrlSafeForServerFetch(url: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { ok: false, reason: "URL invalide" };
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, reason: "Protocole non autorisé (http/https uniquement)" };
  }

  if (u.username || u.password) {
    return { ok: false, reason: "Identifiants dans l’URL non autorisés" };
  }

  const host = u.hostname.toLowerCase();
  if (!host) {
    return { ok: false, reason: "Hôte manquant" };
  }

  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost") || host.endsWith(".local")) {
    return { ok: false, reason: "Hôte non autorisé" };
  }

  const literalFamily = isIPv4(host) ? 4 : isIPv6(host) ? 6 : 0;
  if (literalFamily === 4 || literalFamily === 6) {
    return isBlockedIpLiteral(host) ? { ok: false, reason: "Adresse IP non autorisée" } : { ok: true };
  }

  try {
    const results = await lookup(host, { all: true, verbatim: true });
    if (!results.length) {
      return { ok: false, reason: "Résolution DNS vide" };
    }
    for (const r of results) {
      if (isBlockedIpLiteral(r.address)) {
        return { ok: false, reason: "La résolution DNS pointe vers une adresse privée ou locale" };
      }
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "DNS indisponible";
    return { ok: false, reason: `DNS: ${msg}` };
  }
}

function isBlockedIpLiteral(addr: string): boolean {
  if (isIPv4(addr)) {
    return isPrivateOrReservedIpv4(addr);
  }
  if (isIPv6(addr)) {
    return isPrivateOrReservedIpv6(addr);
  }
  return true;
}

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;

  if (a === 0 || a === 127) return true;
  if (a === 10) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateOrReservedIpv6(addr: string): boolean {
  const lower = addr.toLowerCase().split("%")[0] ?? "";

  if (lower === "::1") return true;

  if (lower.startsWith("fe80:") || lower.startsWith("fec0:")) return true;

  const firstHextet = lower.split(":").find((s) => s.length > 0) ?? "";
  if (firstHextet.startsWith("fc") || firstHextet.startsWith("fd")) return true;
  if (firstHextet.startsWith("ff")) return true;

  const v4mapped = extractIpv4FromIpv6Mapped(lower);
  if (v4mapped) return isPrivateOrReservedIpv4(v4mapped);

  return false;
}
/** Extrait l’IPv4 pour les formes ::ffff:a.b.c.d ou ::ffff:0:a.b.c.d */
function extractIpv4FromIpv6Mapped(addr: string): string | null {
  const marker = "::ffff:";
  const idx = addr.toLowerCase().indexOf(marker);
  if (idx === -1) return null;
  const tail = addr.slice(idx + marker.length);
  if (isIPv4(tail)) return tail;
  const colon = tail.lastIndexOf(":");
  if (colon >= 0) {
    const maybe = tail.slice(colon + 1);
    if (isIPv4(maybe)) return maybe;
  }
  return null;
}
