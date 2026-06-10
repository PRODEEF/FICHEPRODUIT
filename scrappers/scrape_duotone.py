"""
Scraper Duotone Kiteboarding → CSV (compatible catalog_products)

Setup:
    pip install -r requirements.txt
    playwright install chromium

Usage:
    python scrape_duotone.py              # headless
    python scrape_duotone.py --headed     # visible (plus fiable si anti-bot)
    python scrape_duotone.py --dry-run    # liste les URLs sans scraper les fiches
"""

from __future__ import annotations

import asyncio
import csv
import json
import re
import sys
from dataclasses import dataclass, field

from playwright.async_api import BrowserContext, Page, async_playwright

BASE = "https://www.duotonesports.com"
LOCALE = "fr"
BRAND = "Duotone"
SECTOR = "Glisse"
OUTPUT = "duotone_catalog.csv"
DELAY = 1500
CONCUR = 2

CATEGORIES = {
    "kites": ("Kitesurf", "Ailes kitesurf"),
    "planches/twintips": ("Kitesurf", "Planches kitesurf"),
    "planches/surfboards": ("Kitesurf", "Surfboards"),
    "foils": ("Kitesurf", "Foils kitesurf"),
    "bares": ("Kitesurf", "Barres kitesurf"),
    "equipement": ("Kitesurf", "Accessoires kitesurf"),
}

BLOCKED_PATH_SEGMENTS = frozenset(
    {
        "beginner-kites",
        "foil-kites",
        "freeride-kites",
        "freestyle-kites",
        "wave-kites",
        "sale",
        "stories",
        "plus",
        "pieces-detachees",
        "sets",
        "athletes",
        "durabilite",
        "lines-of-freedom",
        "all-stories-overview",
    }
)

PRODUCT_URL_RE = re.compile(
    r"^https://www\.duotonesports\.com/(?:[a-z]{2}/)?products/duotone-.+-\d{5}-\d{4}$",
    re.I,
)


@dataclass
class Product:
    name: str = ""
    brand: str = BRAND
    sector: str = SECTOR
    category: str = ""
    sub_category: str = ""
    year: int | None = None
    price: float = 0.0
    description: str = ""
    detailed_description: str = ""
    images: list[str] = field(default_factory=list)
    url: str = ""
    attributes: dict[str, str] = field(default_factory=dict)


def configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass


def log(msg: str) -> None:
    print(msg, flush=True)


def year_from(s: str) -> int | None:
    m = re.search(r"20(2[4-9]|3\d)", s)
    return int(m.group()) if m else None


def ref_from(url: str) -> str:
    m = re.search(r"(\d{5}-\d{4})$", url)
    return m.group(1) if m else ""


def clean(t: str) -> str:
    return re.sub(r"\s+", " ", t).strip()


def normalize_product_url(href: str) -> str:
    href = href.split("?")[0].rstrip("/")
    return re.sub(
        rf"^{re.escape(BASE)}/(de|en|it|es)(?=/)",
        f"{BASE}/{LOCALE}",
        href,
        count=1,
    )


def is_product_url(href: str) -> bool:
    return bool(PRODUCT_URL_RE.match(normalize_product_url(href)))


def parse_price(raw: str) -> float:
    cleaned = re.sub(r"[^\d,.]", "", raw).replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


async def make_context(pw, headed: bool) -> tuple:
    browser = await pw.chromium.launch(
        headless=not headed,
        args=["--disable-blink-features=AutomationControlled"],
    )
    ctx = await browser.new_context(
        user_agent=(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/125.0.0.0 Safari/537.36"
        ),
        viewport={"width": 1280, "height": 900},
        locale="fr-FR",
    )
    await ctx.add_init_script("""
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        delete navigator.__proto__.webdriver;
        window.chrome = { runtime: {} };
    """)
    try:
        from playwright_stealth import Stealth

        await Stealth(navigator_languages_override=("fr-FR", "fr")).apply_stealth_async(
            ctx
        )
    except ImportError:
        pass
    return browser, ctx


async def dismiss_cookie_banner(page: Page) -> None:
    for pattern in (r"Compris", r"Ne plus afficher", r"Accept", r"Accepter"):
        try:
            btn = page.get_by_role("button", name=re.compile(pattern, re.I))
            if await btn.count() > 0:
                await btn.first.click(timeout=2500)
                await page.wait_for_timeout(400)
                return
        except Exception:
            continue


EXTRACT_LINKS_JS = """(blockedList) => {
    const blocked = new Set(blockedList);
    const seen = new Set();
    const out = [];
    const push = (raw) => {
        if (!raw) return;
        const href = raw.split('?')[0].replace(/\\/$/, '');
        if (!href.includes('/products/duotone-')) return;
        const slug = href.split('/').pop() || '';
        for (const p of slug.split('-')) {
            if (blocked.has(p)) return;
        }
        if (!/\\d{5}-\\d{4}$/.test(href)) return;
        if (seen.has(href)) return;
        seen.add(href);
        out.push(href);
    };
    for (const sel of ['a[href*="/products/duotone-"]', 'a[href*="/products/"]']) {
        for (const a of document.querySelectorAll(sel)) {
            push(a.href || a.getAttribute('href') || '');
        }
    }
    return out;
}"""


async def collect_urls(ctx: BrowserContext) -> list[dict]:
    page = await ctx.new_page()
    items: list[dict] = []
    seen: set[str] = set()
    cookies_done = False

    for slug, (cat, sub) in CATEGORIES.items():
        url = f"{BASE}/{LOCALE}/kiteboarding/{slug}"
        log(f"  [cat] {slug}")
        try:
            await page.goto(url, wait_until="networkidle", timeout=45_000)
            if not cookies_done:
                await dismiss_cookie_banner(page)
                cookies_done = True
            await page.wait_for_timeout(2000)
            for _ in range(10):
                await page.evaluate("window.scrollBy(0, 700)")
                await page.wait_for_timeout(350)

            raw_links = await page.evaluate(EXTRACT_LINKS_JS, list(BLOCKED_PATH_SEGMENTS))
            for href in raw_links:
                norm = normalize_product_url(href)
                if not is_product_url(norm) or norm in seen:
                    continue
                seen.add(norm)
                items.append({"url": norm, "category": cat, "sub_category": sub})
        except Exception as e:
            log(f"    [warn] {slug}: {e}")

    await page.close()
    return items


EXTRACT_PRODUCT_JS = """() => {
    const $ = s => document.querySelector(s);
    const $$ = s => Array.from(document.querySelectorAll(s));
    const name = $('h1')?.textContent?.trim() || '';
    let price = '';
    for (const el of $$('[class*="price"], [class*="Price"]')) {
        const t = el.textContent.replace(/\\s/g, '');
        const m = t.match(/(\\d[\\d.,]+)/);
        if (m && !el.className.includes('old') && !el.className.includes('crossed')) {
            price = m[1];
            break;
        }
    }
    const metaDesc = ($('meta[name="description"]') || $('meta[property="og:description"]'))?.content || '';
    const descBlocks = $$('h4, [class*="description"], [class*="product-text"], [id="description"]');
    const detailed = descBlocks.map(b => b.textContent.trim()).join('\\n').substring(0, 3000);
    const pickImgUrl = (img) => {
        const src = (img.src || '').split('?')[0];
        if (src.includes('/original/') || src.includes('product_picture')) return src;
        const ss = img.getAttribute('srcset') || '';
        if (!ss) return '';
        const first = ss.split(',')[0].trim().split(/\\s+/)[0].split('?')[0];
        if (first.includes('/original/') || first.includes('product_picture')) return first;
        return '';
    };
    const imgs = $$('img[src*="product_picture_gallery"], img[src*="/original/"], img[srcset*="/original/"]');
    const imgUrls = [...new Set(imgs.map(pickImgUrl).filter(Boolean))];
    const sizes = $$('button, [role="option"]').map(b => b.textContent.trim()).filter(s => /^\\d{1,2}\\.\\d$/.test(s));
    const badgeSrc = $$('img[alt*="SLS"], img[alt*="dlab"], img[src*="SLS"], img[src*="dlab"]').map(b => b.src || b.alt || '')[0] || '';
    let construction = '';
    if (/dlab|d-lab|d_lab/i.test(badgeSrc)) construction = 'D/LAB';
    else if (/sls/i.test(badgeSrc)) construction = 'SLS';
    const subtitle = $('h1 + *')?.textContent?.trim() || '';
    let itemNo = '';
    for (const el of $$('*')) {
        if (el.children.length === 0 && /Item-no\\./i.test(el.textContent)) {
            itemNo = el.textContent.replace(/.*Item-no\\.\\s*/i, '').trim();
            break;
        }
    }
    return { name, price, metaDesc, detailed, imgUrls, sizes, construction, subtitle, itemNo };
}"""

EXTRACT_JSONLD_JS = """() => {
    const flatten = (node) => {
        if (!node) return [];
        if (Array.isArray(node)) return node.flatMap(flatten);
        if (typeof node === 'object' && node['@graph']) return flatten(node['@graph']);
        return [node];
    };
    const isProduct = (n) => {
        const t = n && n['@type'];
        return t === 'Product' || (Array.isArray(t) && t.includes('Product'));
    };
    const firstImage = (img) => {
        if (!img) return '';
        if (typeof img === 'string') return img.split('?')[0];
        if (Array.isArray(img) && img.length) return firstImage(img[0]);
        if (typeof img === 'object' && img.url) return String(img.url).split('?')[0];
        return '';
    };
    const offerPrice = (offers) => {
        const o = Array.isArray(offers) ? offers[0] : offers;
        if (!o) return '';
        const p = o.price ?? o.lowPrice ?? '';
        return p !== '' ? String(p) : '';
    };
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
        let data;
        try { data = JSON.parse(script.textContent || ''); } catch { continue; }
        for (const node of flatten(data)) {
            if (!isProduct(node)) continue;
            return {
                name: (node.name || '').trim(),
                metaDesc: (node.description || '').trim().substring(0, 500),
                detailed: (node.description || '').trim().substring(0, 3000),
                price: offerPrice(node.offers),
                imgUrls: [firstImage(node.image)].filter(Boolean),
            };
        }
    }
    return null;
}"""


async def scrape_product(page: Page, info: dict) -> Product | None:
    url = normalize_product_url(info["url"])
    try:
        resp = await page.goto(url, wait_until="networkidle", timeout=45_000)
        if resp and resp.status >= 400:
            log(f"    [warn] HTTP {resp.status} — {url}")
            return None
        await dismiss_cookie_banner(page)
        await page.wait_for_timeout(DELAY)
    except Exception as e:
        log(f"    [warn] {url}: {e}")
        return None

    data = await page.evaluate(EXTRACT_PRODUCT_JS) or {}
    if not data.get("name"):
        ld = await page.evaluate(EXTRACT_JSONLD_JS)
        if ld:
            for key, value in ld.items():
                if not value:
                    continue
                if key == "imgUrls" and data.get("imgUrls"):
                    data["imgUrls"] = list(dict.fromkeys([*data["imgUrls"], *value]))
                elif not data.get(key):
                    data[key] = value

    if not data.get("name"):
        return None

    price = parse_price(data.get("price", ""))
    year = year_from(url) or year_from(data["name"])
    ref = data.get("itemNo") or ref_from(url)
    sizes = data.get("sizes", [])
    taille = ", ".join(f"{s}m²" for s in sizes) if sizes else "Taille unique"

    attrs: dict[str, str] = {
        "statut": "Nouveauté",
        "taille": taille,
        "condition": "Neuf",
        "reference": ref,
    }
    if data.get("construction"):
        attrs["construction"] = data["construction"]
    if data.get("subtitle"):
        attrs["discipline"] = data["subtitle"]

    display = data["name"]
    if year and str(year) not in display:
        display += f" {year}"

    return Product(
        name=display,
        category=info["category"],
        sub_category=info["sub_category"],
        year=year,
        price=price,
        description=clean(data.get("metaDesc", ""))[:500],
        detailed_description=clean(data.get("detailed", ""))[:3000],
        images=(data.get("imgUrls") or [])[:8],
        url=url,
        attributes=attrs,
    )


FIELDS = [
    "name", "brand", "sector", "category", "sub_category", "year",
    "price", "description", "images", "url", "attributes", "detailed_description",
]


def write_csv(products: list[Product]) -> None:
    with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, quoting=csv.QUOTE_MINIMAL)
        w.writeheader()
        for p in sorted(products, key=lambda x: (x.category, x.sub_category, x.name)):
            w.writerow({
                "name": p.name,
                "brand": p.brand,
                "sector": p.sector,
                "category": p.category,
                "sub_category": p.sub_category,
                "year": p.year or "",
                "price": f"{p.price:.2f}",
                "description": p.description,
                "images": json.dumps(p.images, ensure_ascii=False),
                "url": p.url,
                "attributes": json.dumps(p.attributes, ensure_ascii=False),
                "detailed_description": p.detailed_description,
            })


async def main() -> None:
    configure_stdout()
    headed = "--headed" in sys.argv
    dry_run = "--dry-run" in sys.argv

    async with async_playwright() as pw:
        browser, ctx = await make_context(pw, headed)
        log("[1/3] Collecte des URLs…")
        items = await collect_urls(ctx)
        log(f"\n{len(items)} produits trouves\n")

        if dry_run:
            for it in items:
                log(f"  {it['sub_category']:25s} {it['url']}")
            await browser.close()
            return

        log("[2/3] Scraping des fiches produits…")
        sem = asyncio.Semaphore(CONCUR)
        results: list[Product] = []

        async def do(info: dict) -> None:
            async with sem:
                p = await ctx.new_page()
                try:
                    prod = await scrape_product(p, info)
                    if prod:
                        results.append(prod)
                        tag = f"{prod.price} EUR" if prod.price else "prix —"
                        log(f"    [ok] {prod.name} [{tag}]")
                    else:
                        log(f"    [skip] {info['url'].split('/')[-1]}")
                finally:
                    await p.close()

        await asyncio.gather(*(do(i) for i in items))
        await browser.close()

    write_csv(results)
    log(f"\n[3/3] {len(results)} produits -> {OUTPUT}")
    missing = len(items) - len(results)
    if missing:
        log(f"   ({missing} fiches sans donnees)")


if __name__ == "__main__":
    asyncio.run(main())
