import { BadRequestException, Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";
import {
  assertUrlSafeForServerFetch,
  fetchHtmlSafeForServer,
} from "../../../core/scraper/scrape-url-policy";
import type {
  ProductTemplateField,
  ProductTemplateFieldType,
  ScrapeFieldsResult,
} from "../types/product-template.types";
import { dedupeFieldsByNormalizedLabel } from "../lib/dedupe-fields-by-label";
import { JSON_LD_FIELD_LABELS, jsonLdPriceFieldLabel } from "../lib/json-ld-field-labels-fr";
import {
  formatFieldDisplayLabel,
  inferVariantFieldType,
  isLikelyVariantOptionValue,
} from "../lib/normalize-field-label";
import { ScrapeFieldsTraceService } from "./scrape-fields-trace.service";
import type {
  ScrapeFieldExtractorId,
  ScrapeFieldMapping,
} from "../types/scrape-fields-trace.types";

/** Champs enrichis hors JSON-LD : pas d’index `order` tant qu’ils ne sont pas fusionnés. */
type FieldDraft = Omit<ProductTemplateField, "order">;

type ScrapeFieldWarning = ScrapeFieldsResult["warnings"][number];

type SampleValues = Record<string, string>;
type TracedFieldDraft = FieldDraft & {
  extractor: ScrapeFieldExtractorId;
  sitePath?: string;
  siteLabel?: string;
  domHint?: string;
};

const SAMPLE_VALUE_MAX_LEN = 500;

const FETCH_TIMEOUT_MS = 18_000;
const USER_AGENT = "Mozilla/5.0 (compatible; FicheProduit/1.0; +https://example.com/bot)";

@Injectable()
export class ScrapeFieldsService {
  constructor(private readonly traceService: ScrapeFieldsTraceService) {}

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
      return { fields: [], sampleValues: {}, warnings };
    }

    const html = fetched.html;

    const $ = cheerio.load(html);
    const ldBundle = this.extractFieldsFromJsonLd($, warnings);
    const variantBundle = this.extractPrestaShopVariantFields($);
    const detailBundle = this.extractProductDetailFields($);
    const featBundle = this.extractFeatureFields($, warnings);

    const tracedRows: TracedFieldDraft[] = [
      ...ldBundle.fields.map((field) => ({
        ...field,
        extractor: "json_ld" as const,
        sitePath: this.jsonLdSitePathForFieldName(field.name),
      })),
      ...variantBundle.fields.map((field) => ({
        ...field,
        extractor: "prestashop_variants" as const,
        siteLabel: field.name,
        domHint: ".product-variants",
      })),
      ...detailBundle.fields.map((field) => ({
        ...field,
        extractor: "prestashop_details" as const,
        siteLabel: field.name,
        domHint: "#description,.product-tabs,#product-details",
      })),
      ...featBundle.fields.map((field) => ({
        ...field,
        extractor: "prestashop_features" as const,
        siteLabel: field.name,
        domHint: ".product-features tr, table.data-sheet tr, dl dt",
      })),
    ];

    const merged = this.mergeFieldsWithTrace(tracedRows);
    const allSamples = this.mergeSampleMaps(
      ldBundle.samples,
      variantBundle.samples,
      detailBundle.samples,
      featBundle.samples,
    );
    const deduped = dedupeFieldsByNormalizedLabel(merged.fields, allSamples);
    const fields: ProductTemplateField[] = deduped.fields.map((f, i) => ({
      ...f,
      order: i,
    }));
    const sampleValues = this.pickSamplesForFields(fields, allSamples);
    const result: ScrapeFieldsResult = { fields, sampleValues, warnings };
    await this.traceService.emitTrace(
      url,
      fetched.finalUrl,
      result,
      this.buildMappings(merged.traceRows, sampleValues),
      this.countByExtractor(merged.traceRows),
    );
    return result;
  }

  private extractFieldsFromJsonLd(
    $: cheerio.CheerioAPI,
    warnings: ScrapeFieldWarning[],
  ): { fields: FieldDraft[]; samples: SampleValues } {
    const scripts = $('script[type="application/ld+json"]');
    if (scripts.length === 0) {
      warnings.push({
        code: "NO_JSONLD",
        message: "Aucun script application/ld+json trouvé sur la page",
      });
      return { fields: [], samples: {} };
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
          message: "Échec du parsing d’un bloc JSON-LD",
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
        message: "Aucun nœud Product ou ProductGroup trouvé dans le JSON-LD",
      });
      return { fields: [], samples: {} };
    }

    const node = productNodes[0]!;
    const fields: FieldDraft[] = [];
    const samples: SampleValues = {};
    const putSample = (fieldName: string, value: string | undefined): void => {
      if (!value) return;
      samples[fieldName] = this.trimSampleValue(value);
    };

    const name = this.asNonEmptyString(node["name"]);
    if (name) {
      fields.push({
        name: JSON_LD_FIELD_LABELS.productName,
        type: "text",
        required: false,
      });
      putSample(JSON_LD_FIELD_LABELS.productName, name);
    }

    const sku = this.asNonEmptyString(node["sku"]);
    if (sku) {
      fields.push({
        name: JSON_LD_FIELD_LABELS.sku,
        type: "reference",
        required: false,
      });
      putSample(JSON_LD_FIELD_LABELS.sku, sku);
    }

    const { price, currency } = this.pickOfferPrice(node["offers"]);
    if (price !== undefined && !Number.isNaN(price)) {
      const priceFieldName = jsonLdPriceFieldLabel(currency);
      fields.push({
        name: priceFieldName,
        type: "price",
        required: false,
      });
      putSample(priceFieldName, String(price));
    }

    const desc = this.asNonEmptyString(node["description"]);
    if (desc) {
      fields.push({
        name: JSON_LD_FIELD_LABELS.shortDescription,
        type: desc.includes("<") ? "rich_text" : "long_text",
        required: false,
      });
      putSample(JSON_LD_FIELD_LABELS.shortDescription, desc);
    }

    const imageUrl = this.firstImageUrl(node["image"]);
    if (imageUrl) {
      fields.push({
        name: JSON_LD_FIELD_LABELS.imageUrl,
        type: "image",
        required: false,
      });
      putSample(JSON_LD_FIELD_LABELS.imageUrl, imageUrl);
    }

    const variantBundle = this.extractJsonLdVariantsAndProperties(productNodes);
    fields.push(...variantBundle.fields);
    Object.assign(samples, variantBundle.samples);

    return { fields, samples };
  }

  /**
   * Schema.org: hasVariant, additionalProperty (PropertyValue), color/size on variants.
   */
  private extractJsonLdVariantsAndProperties(productNodes: Record<string, unknown>[]): {
    fields: FieldDraft[];
    samples: SampleValues;
  } {
    const out: FieldDraft[] = [];
    const samples: SampleValues = {};
    const seen = new Set<string>();
    const add = (label: string, type: ProductTemplateFieldType, sample?: string) => {
      const trimmed = label.trim();
      const k = trimmed.toLowerCase();
      if (!k || seen.has(k)) return;
      seen.add(k);
      out.push({ name: trimmed, type, required: false });
      if (sample) {
        samples[trimmed] = this.trimSampleValue(sample);
      }
    };

    const walkAdditionalProperty = (ap: unknown): void => {
      if (ap === null || ap === undefined) return;
      const list = Array.isArray(ap) ? ap : [ap];
      for (const item of list) {
        if (!item || typeof item !== "object") continue;
        const o = item as Record<string, unknown>;
        const propName = this.asNonEmptyString(o["name"]);
        const propValue = this.propertyValueToString(o["value"]);
        if (propName) {
          add(propName, "text", propValue);
          continue;
        }
        if (this.isPropertyValueNode(o)) {
          const n = this.asNonEmptyString(o["propertyID"]);
          const v = this.propertyValueToString(o["value"]);
          if (n) add(n, "text", v);
        }
      }
    };

    const walkVariant = (v: unknown): void => {
      if (!v || typeof v !== "object") return;
      const vo = v as Record<string, unknown>;
      walkAdditionalProperty(vo["additionalProperty"]);
      const color = this.asNonEmptyString(vo["color"]);
      if (color) add("Couleur", "color", color);
      const size = this.asNonEmptyString(vo["size"]);
      if (size) add("Taille", "size", size);
      const variantSku = this.asNonEmptyString(vo["sku"]);
      if (variantSku) {
        add(JSON_LD_FIELD_LABELS.variantSku, "reference", variantSku);
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

    return { fields: out, samples };
  }

  private isPropertyValueNode(o: Record<string, unknown>): boolean {
    const types = this.typesOf(o).map((s) => s.toLowerCase());
    return types.includes("propertyvalue");
  }

  /**
   * PrestaShop Classic: .product-variants, group[n] selects, color/radio lists.
   */
  private extractPrestaShopVariantFields($: cheerio.CheerioAPI): {
    fields: FieldDraft[];
    samples: SampleValues;
  } {
    type VariantEntry = { name: string; type: ProductTemplateFieldType; sample?: string };
    const entries: VariantEntry[] = [];
    const seen = new Set<string>();

    const push = (raw: string, sample?: string) => {
      const trimmed = raw.replace(/\s+/g, " ").trim();
      if (!trimmed || trimmed.length > 120) return;
      if (isLikelyVariantOptionValue(trimmed)) return;
      const name = formatFieldDisplayLabel(trimmed);
      if (!name || isLikelyVariantOptionValue(name)) return;
      const k = name.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      entries.push({
        name,
        type: inferVariantFieldType(name),
        sample: sample?.trim() ? sample : undefined,
      });
    };

    const sampleFromSelect = ($sel: cheerio.Cheerio<Element>): string | undefined => {
      const selected = $sel.find("option[selected]").first();
      if (selected.length) {
        const t = selected.text().replace(/\s+/g, " ").trim();
        if (t) return t;
      }
      const first = $sel
        .find("option")
        .filter((_i, opt) => {
          const v = $(opt).attr("value") ?? "";
          return v !== "" && v !== "0";
        })
        .first();
      const t = first.text().replace(/\s+/g, " ").trim();
      return t || undefined;
    };

    const sampleFromVariantItem = ($el: cheerio.Cheerio<Element>): string | undefined => {
      const checked = $el.find('input[type="radio"]:checked, input[type="radio"][checked]').first();
      if (checked.length) {
        const aria = checked.attr("aria-label")?.trim();
        if (aria) return aria;
        const title = checked.attr("title")?.trim();
        if (title) return title;
        const sibling = checked
          .closest("li, label, .input-container")
          .text()
          .replace(/\s+/g, " ")
          .trim();
        if (sibling && sibling.length < 80) return sibling;
      }
      const select = $el.find('select[name^="group["], select[name^="group_"]').first();
      if (select.length) return sampleFromSelect(select);
      return undefined;
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
      push(label, sampleFromVariantItem($el));
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
      if (!label.trim() || isLikelyVariantOptionValue(label)) return;
      const sample = $ctx.is("select") ? sampleFromSelect($ctx) : undefined;
      push(label, sample);
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
      let sample: string | undefined;
      if ($inp.is(":checked") || $inp.attr("checked") !== undefined) {
        sample = $inp.attr("aria-label")?.trim() ?? $inp.attr("title")?.trim();
      }
      if (label.trim() && !isLikelyVariantOptionValue(label)) {
        push(label, sample);
      }
    });

    $("fieldset.attribute_fieldset, .attribute_fieldset").each((_i, fs) => {
      const legend = $(fs).find("legend").first().text();
      push(legend);
    });

    $("#attributes fieldset, .attributes fieldset").each((_i, fs) => {
      const legend = $(fs).find("legend").first().text();
      push(legend);
    });

    const fields: FieldDraft[] = entries.map((e) => ({
      name: e.name,
      type: e.type,
      required: false,
    }));
    const samples: SampleValues = {};
    for (const e of entries) {
      if (e.sample) {
        samples[e.name] = this.trimSampleValue(e.sample);
      }
    }
    return { fields, samples };
  }

  /**
   * Long description, tabs, accordions — "détails" beyond the short JSON-LD blurb.
   */
  private extractProductDetailFields($: cheerio.CheerioAPI): {
    fields: FieldDraft[];
    samples: SampleValues;
  } {
    const fields: FieldDraft[] = [];
    const samples: SampleValues = {};
    const seen = new Set<string>();

    const add = (
      name: string,
      type: ProductTemplateFieldType,
      $content?: cheerio.Cheerio<AnyNode>,
    ) => {
      const displayName = formatFieldDisplayLabel(name);
      const k = displayName.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      fields.push({ name: displayName, type, required: false });
      if ($content?.length) {
        const html = $content.html()?.trim();
        const text = $content.text().replace(/\s+/g, " ").trim();
        const raw = html && html.includes("<") ? html : text;
        if (raw.length > 0) {
          samples[displayName] = this.trimSampleValue(raw);
        }
      }
    };

    const longDesc = $(
      "#description .product-description, #product-description, .product-description:not(.short-description), .rte.product-description",
    ).first();
    if (longDesc.length && longDesc.text().replace(/\s+/g, " ").trim().length > 40) {
      add("Détails produit (description)", "rich_text", longDesc);
    }

    $("#description, section#description").each((_i, sec) => {
      const $sec = $(sec);
      if ($sec.find(".product-description, .rte").length && $sec.text().trim().length > 40) {
        const inner = $sec.find(".product-description, .rte").first();
        add("Détails produit (description)", "rich_text", inner.length ? inner : $sec);
      }
    });

    $(".product-tabs .nav-tabs .nav-link, ul.nav-tabs li .nav-link").each((_i, a) => {
      const t = $(a).text().replace(/\s+/g, " ").trim();
      if (!t || t.length > 60) return;
      if (/^(avis|reviews|commentaires|accessories|accessoires)\b/i.test(t)) {
        return;
      }
      if (/description|détail|caractéristiques|composition|livr|entretien|guide/i.test(t)) {
        const href = $(a).attr("href") ?? "";
        const paneId = href.startsWith("#") ? href.slice(1) : "";
        const $pane = paneId ? $(`#${paneId}`).first() : $("");
        add(`Onglet : ${t}`, "rich_text", $pane.length ? $pane : undefined);
      }
    });

    $(
      "#product-details .card-header .btn, #product-details .accordion-button, .product-information .accordion-header",
    ).each((_i, btn) => {
      const t = $(btn).text().replace(/\s+/g, " ").trim();
      if (!t || t.length > 80) return;
      if (/description|détail|caract|composition|livr|entretien|guide|taille|couleur/i.test(t)) {
        const target = $(btn).attr("data-bs-target") ?? $(btn).attr("data-target") ?? "";
        const paneId = target.replace(/^#/, "");
        const $pane = paneId
          ? $(paneId).first()
          : $(btn).next(".collapse, .accordion-collapse").first();
        add(`Section : ${t}`, "rich_text", $pane.length ? $pane : undefined);
      }
    });

    const shortBlock = $(".product-description-short, #product-description-short");
    if (shortBlock.length && shortBlock.text().replace(/\s+/g, " ").trim().length > 20) {
      add("Résumé / accroche", "rich_text", shortBlock);
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
        add("Détails produit (description)", "rich_text", $pane);
      }
    });

    return { fields, samples };
  }

  private extractFeatureFields(
    $: cheerio.CheerioAPI,
    warnings: ScrapeFieldWarning[],
  ): { fields: FieldDraft[]; samples: SampleValues } {
    const labels = new Set<string>();
    const samples: SampleValues = {};
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
        const rawLabel = $(cells[0]).text().replace(/\s+/g, " ").trim();
        if (!rawLabel || rawLabel.length > 120) return;
        if (isLikelyVariantOptionValue(rawLabel)) return;
        const label = formatFieldDisplayLabel(rawLabel);
        if (!label) return;
        labels.add(label);
        const value = $(cells[1]).text().replace(/\s+/g, " ").trim();
        if (value) {
          samples[label] = this.trimSampleValue(value);
        }
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
        const rawLabel = $(dt).text().replace(/\s+/g, " ").trim();
        if (!rawLabel || rawLabel.length > 120) return;
        if (isLikelyVariantOptionValue(rawLabel)) return;
        const label = formatFieldDisplayLabel(rawLabel);
        if (!label) return;
        labels.add(label);
        const dd = $(dt).next("dd");
        if (dd.length) {
          const value = dd.text().replace(/\s+/g, " ").trim();
          if (value) {
            samples[label] = this.trimSampleValue(value);
          }
        }
      });
    });

    if (labels.size === 0) {
      warnings.push({
        code: "NO_FEATURES_TABLE",
        message: "Aucune caractéristique PrestaShop détectée (tableau ou liste dl)",
      });
      return { fields: [], samples: {} };
    }

    const fields = [...labels].map((name) => ({
      name,
      type: "text" as const,
      required: false,
    }));
    return { fields, samples };
  }

  private mergeSampleMaps(...maps: SampleValues[]): SampleValues {
    const out: SampleValues = {};
    for (const map of maps) {
      for (const [key, value] of Object.entries(map)) {
        if (!out[key]) {
          out[key] = value;
        }
      }
    }
    return out;
  }

  private pickSamplesForFields(
    fields: ProductTemplateField[],
    samples: SampleValues,
  ): SampleValues {
    const out: SampleValues = {};
    for (const field of fields) {
      const value = samples[field.name];
      if (value) {
        out[field.name] = value;
      }
    }
    return out;
  }

  private trimSampleValue(value: string): string {
    const s = value.replace(/\s+/g, " ").trim();
    if (s.length <= SAMPLE_VALUE_MAX_LEN) return s;
    return `${s.slice(0, SAMPLE_VALUE_MAX_LEN)}…`;
  }

  private propertyValueToString(value: unknown): string | undefined {
    if (typeof value === "string") {
      return this.asNonEmptyString(value);
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (value && typeof value === "object") {
      const o = value as Record<string, unknown>;
      const nested = this.asNonEmptyString(o["value"]) ?? this.asNonEmptyString(o["name"]);
      return nested;
    }
    return undefined;
  }

  private mergeFieldsWithTrace(rows: TracedFieldDraft[]): {
    fields: FieldDraft[];
    traceRows: Array<
      TracedFieldDraft & {
        mergeStatus: "kept" | "dropped_duplicate";
        keptBy?: ScrapeFieldExtractorId;
      }
    >;
  } {
    const seen = new Set<string>();
    const out: FieldDraft[] = [];
    const traceRows: Array<
      TracedFieldDraft & {
        mergeStatus: "kept" | "dropped_duplicate";
        keptBy?: ScrapeFieldExtractorId;
      }
    > = [];
    const winners = new Map<string, ScrapeFieldExtractorId>();

    for (const f of rows) {
      const key = f.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ ...f, name: f.name.trim() });
      winners.set(key, f.extractor);
      traceRows.push({ ...f, name: f.name.trim(), mergeStatus: "kept" });
    }

    for (const f of rows) {
      const key = f.name.trim().toLowerCase();
      if (!key) continue;
      const winner = winners.get(key);
      if (!winner || winner === f.extractor) continue;
      traceRows.push({
        ...f,
        name: f.name.trim(),
        mergeStatus: "dropped_duplicate",
        keptBy: winner,
      });
    }
    return { fields: out, traceRows };
  }

  private buildMappings(
    traceRows: Array<
      TracedFieldDraft & {
        mergeStatus: "kept" | "dropped_duplicate";
        keptBy?: ScrapeFieldExtractorId;
      }
    >,
    sampleValues: SampleValues,
  ): ScrapeFieldMapping[] {
    return traceRows.map((row) => ({
      fieldName: row.name,
      fieldType: row.type,
      extractor: row.extractor,
      sitePath: row.sitePath,
      siteLabel: row.siteLabel,
      domHint: row.domHint,
      sampleValue: sampleValues[row.name],
      mergeStatus: row.mergeStatus,
      keptBy: row.keptBy,
    }));
  }

  private countByExtractor(
    traceRows: Array<
      TracedFieldDraft & {
        mergeStatus: "kept" | "dropped_duplicate";
        keptBy?: ScrapeFieldExtractorId;
      }
    >,
  ): Record<ScrapeFieldExtractorId, number> {
    const counts: Record<ScrapeFieldExtractorId, number> = {
      json_ld: 0,
      prestashop_features: 0,
      prestashop_variants: 0,
      prestashop_details: 0,
    };
    for (const row of traceRows) {
      if (row.mergeStatus === "kept") {
        counts[row.extractor] += 1;
      }
    }
    return counts;
  }

  private jsonLdSitePathForFieldName(fieldName: string): string {
    const key = fieldName.toLowerCase();
    if (key === JSON_LD_FIELD_LABELS.productName.toLowerCase()) return "Product.name";
    if (key === JSON_LD_FIELD_LABELS.sku.toLowerCase()) return "Product.sku";
    if (key.startsWith("prix")) return "Product.offers.price";
    if (key === JSON_LD_FIELD_LABELS.shortDescription.toLowerCase()) return "Product.description";
    if (key === JSON_LD_FIELD_LABELS.imageUrl.toLowerCase()) return "Product.image";
    return "Product.additionalProperty";
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
