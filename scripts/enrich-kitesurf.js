#!/usr/bin/env node
/**
 * Enrichissement catalogue kitesurf : fetch des pages catalogue des marques
 * configurées dans catalogs/kitesurf/brands.json et génération de
 * catalogs/kitesurf/products.json (format attendu par l'app).
 *
 * Usage : npm run enrich:kitesurf   ou   node scripts/enrich-kitesurf.js
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BRANDS_CONFIG = join(ROOT, 'catalogs', 'kitesurf', 'brands.json');
const OUTPUT_FILE = join(ROOT, 'catalogs', 'kitesurf', 'products.json');

const USER_AGENT = 'FicheProduct-Enricher/1.0 (catalogue kitesurf)';

function loadBrandsConfig() {
  const raw = readFileSync(BRANDS_CONFIG, 'utf-8');
  return JSON.parse(raw);
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'follow'
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

/**
 * Infère sous-catégorie à partir de l'URL (ex. /kites/ → Ailes, /boards/ → Planches).
 */
function inferSubcategory(url) {
  const u = (url || '').toLowerCase();
  if (u.includes('/kites') || u.includes('/ailes')) return 'Ailes';
  if (u.includes('/boards') || u.includes('/planches')) return 'Planches';
  if (u.includes('/kitefoil') || u.includes('/foil')) return 'Foil';
  if (u.includes('/accessories') || u.includes('/accessoires')) return 'Accessoires';
  return 'Produits';
}

/**
 * Infère l'année depuis le titre ou l'URL (ex. "2026", "2025").
 */
function inferYear(title, url) {
  const text = `${title || ''} ${url || ''}`;
  const m = text.match(/\b(20[2-3][0-9])\b/);
  return m ? m[1] : '2026';
}

/**
 * Parse une page HTML de listing produits (structure générique : liens + titres + images).
 * Retourne un tableau d'objets { title, link, image, subcategory }.
 */
function parseListingHtml(html, baseUrl, subcategoryHint) {
  const $ = cheerio.load(html);
  const items = [];
  const base = new URL(baseUrl).origin;

  $('a[href*="/"]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr('href');
    if (!href || href === '#' || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    const link = href.startsWith('http') ? href : new URL(href, base).href;
    if (link === baseUrl) return;
    const title = $a.attr('title') || $a.find('h2, h3, .title, .product-title, [class*="product"]').first().text().trim() || $a.text().trim();
    if (!title || title.length < 3) return;
    const img = $a.find('img').first();
    const image = img.attr('src') || img.attr('data-src') || '';
    const imgUrl = image.startsWith('http') ? image : image ? new URL(image, base).href : '';

    if (title.length > 2 && title.length < 200) {
      items.push({
        title: title.replace(/\s+/g, ' ').trim(),
        link,
        image: imgUrl,
        subcategory: subcategoryHint || inferSubcategory(link)
      });
    }
  });

  return items;
}

/**
 * Déduplique et normalise vers le format attendu par l'app.
 */
function toAppFormat(items, brandName, category = 'Kitesurf') {
  const seen = new Set();
  return items
    .filter((p) => {
      const key = `${brandName}|${p.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((p) => ({
      year: inferYear(p.title, p.link),
      brand: brandName,
      category,
      subcategory: p.subcategory || 'Produits',
      title: p.title,
      desc: '',
      commercial: '',
      price: '',
      image: p.image || `https://placehold.co/100x100/7c3aed/fff?text=${encodeURIComponent(p.title.slice(0, 10))}`
    }));
}

async function main() {
  const config = loadBrandsConfig();
  const allProducts = [];
  const sector = config.sector || 'kitesurf';

  for (const brand of config.brands || []) {
    const name = brand.name || brand.id || 'Inconnu';
    const urls = brand.catalogUrls || [];
    if (urls.length === 0) continue;

    console.log(`[${name}] ${urls.length} URL(s)`);
    for (const url of urls) {
      try {
        const html = await fetchHtml(url);
        const subcategory = inferSubcategory(url);
        const items = parseListingHtml(html, url, subcategory);
        const normalized = toAppFormat(items, name, 'Kitesurf');
        normalized.forEach((p) => allProducts.push(p));
        console.log(`  ${url} → ${normalized.length} produits`);
      } catch (e) {
        console.warn(`  ${url} → erreur: ${e.message}`);
      }
    }
  }

  const outDir = dirname(OUTPUT_FILE);
  mkdirSync(outDir, { recursive: true });
  const output = {
    sector,
    updated: new Date().toISOString(),
    count: allProducts.length,
    products: allProducts
  };
  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n→ ${output.count} produits écrits dans ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
