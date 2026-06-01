import { BadRequestException, Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import {
  assertUrlSafeForServerFetch,
  fetchHtmlSafeForServer,
} from "../../../core/scraper/scrape-url-policy";
import type {
  ProductTemplateField,
  ProductTemplateFieldType,
  ScrapeFieldsResult,
} from "../types/product-template.types";

/** Champs enrichis hors JSON-LD : pas d’index `order` tant qu’ils ne sont pas fusionnés. */
type FieldDraft = Omit<ProductTemplateField, "order">;

type ScrapeFieldWarning = ScrapeFieldsResult["warnings"][number];

const FETCH_TIMEOUT_MS = 18_000;
const USER_AGENT = "Mozilla/5.0 (compatible; FicheProduit/1.0; +https://example.com/bot)";

@Injectable()
export class ScrapeFieldsService {
  async scrape(rawUrl: string): Promise<ScrapeFieldsResult> {
    const normalized = rawUrl.trim();
    if (!normalized) {
      throw new BadRequestException("URL invalide");
    }
    const safe = await assertUrlSafeForServerFetch(normalized);
    if (!safe.ok) {
      throw new BadRequestException(safe.reason);
    }
    return this.fetchAndExtract(normalized);
  }

  private async fetchAndExtract(url: string): Promise<ScrapeFieldsResult> {
    const warnings: ScrapeFieldWarning[] = [];
    const fetched = await fetchHtmlSafeForServer(url, {
      timeoutMs: FETCH_TIMEOUT_MS,
      userAgent: USER_AGENT,
    });

    if (!fetched.ok) {
      warnings.push({ code: "FETCH_FAILED", message: fetched.error });
      return { fields: [], warnings };
    }

    const html = fetched.html;

    const $ = cheerio.load(html);
    const ldBundle = this.extractFieldsFromJsonLd($, warnings);
    const fromVariants = this.extractPrestaShopVariantFields($);
    const fromDetails = this.extractProductDetailFields($);
    const fromFeat = this.extractFeatureFields($, warnings);
    const merged = this.mergeFields([
      ...ldBundle.fields,
      ...fromVariants,
      ...fromDetails,
      ...fromFeat,
    ]);
    const fields: ProductTemplateField[] = merged.map((f, i) => ({
      ...f,
      order: i,
    }));
    return { fields, warnings };
  }

  private extractFieldsFromJsonLd(
    $: cheerio.CheerioAPI,
    warnings: ScrapeFieldWarning[],
  ): { fields: FieldDraft[] } {
    const scripts = $('script[type="application/ld+json"]');
    if (scripts.length === 0) {
      warnings.push({
        code: "NO_JSONLD",
        message: "No application/ld+json scripts found on the page",
      });
      return { fields: [] };
    }

    const productNodes: Record<string, unknown>[] = [];
    scripts.each((_i, el) => {
      const text = $(el).text().trim();
      if (!text) return;
      let data: unknown;
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        warnings.push({
          code: "JSONLD_PARSE_ERROR",
          message: "Failed to parse a JSON-LD block",
        });
        return;
      }
      for (const node of this.flattenJsonLd(data)) {
        if (this.isProductLikeNode(node)) {
          productNodes.push(node);
        }
      }
    });

    if (productNodes.length === 0) {
      warnings.push({
        code: "NO_PRODUCT_IN_SCHEMA",
        message: "No Product or ProductGroup node found in JSON-LD",
      });
      return { fields: [] };
    }

    const node = productNodes[0]!;
    const fields: FieldDraft[] = [];
    const name = this.asNonEmptyString(node["name"]);
    if (name) fields.push({ name: "Product name", type: "text", required: false });

    const sku = this.asNonEmptyString(node["sku"]);
    if (sku) fields.push({ name: "SKU", type: "reference", required: false });

    const { price, currency } = this.pickOfferPrice(node["offers"]);
    if (price !== undefined && !Number.isNaN(price)) {
      fields.push({
        name: currency ? `Price (${currency})` : "Price",
        type: "price",
        required: false,
      });
    }

    const desc = this.asNonEmptyString(node["description"]);
    if (desc) {
      fields.push({
        name: "Description",
        type: desc.includes("<") ? "rich_text" : "long_text",
        required: false,
      });
    }

    const imageUrl = this.firstImageUrl(node["image"]);
    if (imageUrl) {
      fields.push({ name: "Image URL", type: "image", required: false });
    }

    fields.push(...this.extractJsonLdVariantsAndProperties(productNodes));

    return { fields };
  }

  /**
   * Schema.org: hasVariant, additionalProperty (PropertyValue), color/size on variants.
   */
  private extractJsonLdVariantsAndProperties(
    productNodes: Record<string, unknown>[],
  ): FieldDraft[] {
    const out: FieldDraft[] = [];
    const seen = new Set<string>();
    const add = (label: string, type: ProductTemplateFieldType) => {
      const k = label.trim().toLowerCase();
      if (!k || seen.has(k)) return;
      seen.add(k);
      out.push({ name: label.trim(), type, required: false });
    };

    const walkAdditionalProperty = (ap: unknown): void => {
      if (ap === null || ap === undefined) return;
      const list = Array.isArray(ap) ? ap : [ap];
      for (const item of list) {
        if (!item || typeof item !== "object") continue;
        const o = item as Record<string, unknown>;
        const propName = this.asNonEmptyString(o["name"]);
        if (propName) {
          add(propName, "text");
          continue;
        }
        if (this.isPropertyValueNode(o)) {
          const n = this.asNonEmptyString(o["propertyID"]);
          if (n) add(n, "text");
        }
      }
    };

    const walkVariant = (v: unknown): void => {
      if (!v || typeof v !== "object") return;
      const vo = v as Record<string, unknown>;
      walkAdditionalProperty(vo["additionalProperty"]);
      const color = this.asNonEmptyString(vo["color"]);
      if (color) add("Couleur", "color");
      const size = this.asNonEmptyString(vo["size"]);
      if (size) add("Taille", "size");
      if (this.asNonEmptyString(vo["sku"])) {
        add("SKU (variante)", "reference");
      }
    };

    for (const node of productNodes) {
      walkAdditionalProperty(node["additionalProperty"]);
      const variants = node["hasVariant"];
      if (Array.isArray(variants)) {
        for (const v of variants) walkVariant(v);
      } else if (variants) {
        walkVariant(variants);
      }
    }

    return out;
  }

  private isPropertyValueNode(o: Record<string, unknown>): boolean {
    const types = this.typesOf(o).map((s) => s.toLowerCase());
    return types.includes("propertyvalue");
  }

  /**
   * PrestaShop Classic: .product-variants, group[n] selects, color/radio lists.
   */
  private extractPrestaShopVariantFields($: cheerio.CheerioAPI): FieldDraft[] {
    const labels: string[] = [];
    const seen = new Set<string>();
    const push = (raw: string) => {
      const t = raw.replace(/\s+/g, " ").trim();
      if (!t || t.length > 120) return;
      if (/^[\d.,]+$/.test(t)) return;
      const k = t.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      labels.push(t);
    };

    $(
      ".product-variants .product-variants-item, div.product-variants-item, .js-product-variants .product-variants-item",
    ).each((_i, el) => {
      const $el = $(el);
      let label = $el.find(".control-label").first().text();
      if (!label.trim()) {
        label = $el.find("label.control-label, > label").first().text();
      }
      if (!label.trim()) {
        label = $el.find("span.control-label").first().text();
      }
      push(label);
    });

    const groupFieldSeen = new Set<string>();
    const pushGroupLabel = ($ctx: cheerio.Cheerio<Element>, groupName: string) => {
      if (!groupName || groupFieldSeen.has(groupName)) return;
      groupFieldSeen.add(groupName);
      let label = "";
      const id = $ctx.attr("id");
      if (id) {
        label = $("label")
          .filter((_i, el) => $(el).attr("for") === id)
          .first()
          .text();
      }
      if (!label.trim()) {
        label = $ctx
          .closest(".product-variants-item, .form-group, .attribute_fieldset")
          .find(".control-label, label")
          .first()
          .text();
      }
      if (!label.trim() && $ctx.attr("aria-label")) {
        label = String($ctx.attr("aria-label"));
      }
      push(label);
    };

    $('select[name^="group["], select[name^="group_"]').each((_i, sel) => {
      const $sel = $(sel);
      const gName = $sel.attr("name") ?? "";
      pushGroupLabel($sel, gName);
    });

    $(
      '.product-variants input[type="radio"][name^="group["], #product input[type="radio"][name^="group["]',
    ).each((_i, inp) => {
      const $inp = $(inp);
      const gName = $inp.attr("name") ?? "";
      if (!gName || groupFieldSeen.has(gName)) return;
      groupFieldSeen.add(gName);
      let label = $inp
        .closest(".product-variants-item, .input-container, li, .js-input-color, .color-group")
        .find(".control-label, .attribute-label, .radio-label, label")
        .first()
        .text();
      if (!label.trim()) {
        label = $inp.closest("fieldset, .form-group").find("legend, .control-label").first().text();
      }
      push(label);
    });

    $("fieldset.attribute_fieldset, .attribute_fieldset").each((_i, fs) => {
      const legend = $(fs).find("legend").first().text();
      push(legend);
    });

    $("#attributes fieldset, .attributes fieldset").each((_i, fs) => {
      const legend = $(fs).find("legend").first().text();
      push(legend);
    });

    $("ul.product-variants-list li .attribute-name, .variant-label").each((_i, el) => {
      push($(el).text());
    });

    return labels.map((name) => ({
      name,
      type: "text" as const,
      required: false,
    }));
  }

  /**
   * Long description, tabs, accordions — "détails" beyond the short JSON-LD blurb.
   */
  private extractProductDetailFields($: cheerio.CheerioAPI): FieldDraft[] {
    const fields: FieldDraft[] = [];
    const seen = new Set<string>();
    const add = (name: string, type: ProductTemplateFieldType) => {
      const k = name.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      fields.push({ name, type, required: false });
    };

    const longDesc = $(
      "#description .product-description, #product-description, .product-description:not(.short-description), .rte.product-description",
    ).first();
    if (longDesc.length && longDesc.text().replace(/\s+/g, " ").trim().length > 40) {
      add("Détails produit (description)", "rich_text");
    }

    $("#description, section#description").each((_i, sec) => {
      const $sec = $(sec);
      if ($sec.find(".product-description, .rte").length && $sec.text().trim().length > 40) {
        add("Détails produit (description)", "rich_text");
      }
    });

    $(".product-tabs .nav-tabs .nav-link, ul.nav-tabs li .nav-link").each((_i, a) => {
      const t = $(a).text().replace(/\s+/g, " ").trim();
      if (!t || t.length > 60) return;
      if (/^(avis|reviews|commentaires|accessories|accessoires)\b/i.test(t)) {
        return;
      }
      if (/description|détail|caractéristiques|composition|livr|entretien|guide/i.test(t)) {
        add(`Onglet : ${t}`, "rich_text");
      }
    });

    $(
      "#product-details .card-header .btn, #product-details .accordion-button, .product-information .accordion-header",
    ).each((_i, btn) => {
      const t = $(btn).text().replace(/\s+/g, " ").trim();
      if (!t || t.length > 80) return;
      if (/description|détail|caract|composition|livr|entretien|guide|taille|couleur/i.test(t)) {
        add(`Section : ${t}`, "rich_text");
      }
    });

    const shortBlock = $(".product-description-short, #product-description-short");
    if (shortBlock.length && shortBlock.text().replace(/\s+/g, " ").trim().length > 20) {
      add("Résumé / accroche", "rich_text");
    }

    $(".product-information .tab-pane, #product .tab-pane, .tabs .tab-pane").each((_i, pane) => {
      const $pane = $(pane);
      const id = ($pane.attr("id") ?? "").toLowerCase();
      const textLen = $pane.text().replace(/\s+/g, " ").trim().length;
      if (textLen < 40) return;
      if (
        /description|detail|more|supplement|product|caracteristique/i.test(id) ||
        $pane.find(".rte, .product-description").length > 0
      ) {
        add("Détails produit (description)", "rich_text");
      }
    });

    return fields;
  }

  private extractFeatureFields(
    $: cheerio.CheerioAPI,
    warnings: ScrapeFieldWarning[],
  ): FieldDraft[] {
    const labels = new Set<string>();
    const rowSelectors = [
      ".product-features tr",
      "table.table-product tr",
      "#product-details table tr",
      ".product-information table tr",
      "table.data-sheet tr",
      "section.product-features tr",
    ];

    for (const sel of rowSelectors) {
      $(sel).each((_i, tr) => {
        const cells = $(tr).find("th, td");
        if (cells.length < 2) return;
        const label = $(cells[0]).text().replace(/\s+/g, " ").trim();
        if (!label || label.length > 120) return;
        if (/^[\d.,]+$/.test(label)) return;
        labels.add(label);
      });
    }

    $("dl").each((_i, dl) => {
      const root = $(dl);
      if (
        root.closest(".product-features, #product-details, .product-information").length === 0 &&
        !root.is(".product-features dl, .data-sheet")
      ) {
        return;
      }
      root.find("dt").each((_j, dt) => {
        const label = $(dt).text().replace(/\s+/g, " ").trim();
        if (!label || label.length > 120) return;
        labels.add(label);
      });
    });

    if (labels.size === 0) {
      warnings.push({
        code: "NO_FEATURES_TABLE",
        message: "No PrestaShop-style feature rows detected (table/dl heuristics)",
      });
      return [];
    }

    return [...labels].map((name) => ({
      name,
      type: "text" as const,
      required: false,
    }));
  }

  private mergeFields(rows: FieldDraft[]): FieldDraft[] {
    const seen = new Set<string>();
    const out: FieldDraft[] = [];
    for (const f of rows) {
      const key = f.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ ...f, name: f.name.trim() });
    }
    return out;
  }

  private flattenJsonLd(data: unknown): Record<string, unknown>[] {
    const items: Record<string, unknown>[] = [];
    const walk = (x: unknown): void => {
      if (x === null || x === undefined) return;
      if (Array.isArray(x)) {
        x.forEach(walk);
        return;
      }
      if (typeof x !== "object") return;
      const o = x as Record<string, unknown>;
      if ("@graph" in o && Array.isArray(o["@graph"])) {
        o["@graph"].forEach(walk);
        return;
      }
      items.push(o);
    };
    walk(data);
    return items;
  }

  private typesOf(node: Record<string, unknown>): string[] {
    const t = node["@type"];
    if (typeof t === "string") return [t];
    if (Array.isArray(t)) {
      return t.filter((x): x is string => typeof x === "string");
    }
    return [];
  }

  private isProductLikeNode(node: Record<string, unknown>): boolean {
    const types = this.typesOf(node).map((s) => s.toLowerCase());
    return types.includes("product") || types.includes("productgroup");
  }

  private asNonEmptyString(v: unknown): string | undefined {
    if (typeof v !== "string") return undefined;
    const s = v.trim();
    return s.length ? s : undefined;
  }

  private pickOfferPrice(offers: unknown): {
    price?: number;
    currency?: string;
  } {
    const first = Array.isArray(offers) ? offers[0] : offers;
    if (!first || typeof first !== "object") return {};
    const o = first as Record<string, unknown>;
    let price: number | undefined;
    if (typeof o.price === "number") price = o.price;
    else if (typeof o.price === "string") price = parseFloat(o.price);
    const currency = typeof o.priceCurrency === "string" ? o.priceCurrency : undefined;
    return { price, currency };
  }

  private firstImageUrl(image: unknown): string | undefined {
    if (typeof image === "string") {
      const s = image.trim();
      return s || undefined;
    }
    if (Array.isArray(image)) {
      for (const item of image) {
        const u = this.firstImageUrl(item);
        if (u) return u;
      }
      return undefined;
    }
    if (image && typeof image === "object") {
      const o = image as Record<string, unknown>;
      if (typeof o.url === "string") return o.url.trim() || undefined;
    }
    return undefined;
  }
}
