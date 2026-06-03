import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  FIELD_TYPES,
  type ProductTemplateField,
  type ProductTemplateFieldType,
  type RefineFieldsResult,
} from "../types/product-template.types";

const ALLOWED_TYPES = new Set<string>(FIELD_TYPES);

/** Map legacy type strings the model may still emit. */
const NORMALIZE_TYPE_FROM_MODEL: Record<string, ProductTemplateFieldType> = {
  html: "rich_text",
};

const TYPE_ENUM_FOR_PROMPT = FIELD_TYPES.join("|");

@Injectable()
export class RefineFieldsService {
  constructor(private readonly configService: ConfigService) {}

  async refine(
    fields: ProductTemplateField[],
    source: "csv_import" | "product_page" | "manual",
    sampleValues?: Record<string, string>,
  ): Promise<RefineFieldsResult> {
    const normalized: ProductTemplateField[] = fields.map((f) => ({
      name: f.name,
      type: f.type,
      required: f.required ?? false,
      order: f.order,
    }));

    const key = this.configService.get<string>("openaiApiKey", "");
    if (!key) {
      return {
        fields: normalized,
        refinedWithAi: false,
        message: "Clé OpenAI non configurée : champs inchangés.",
      };
    }

    const fromModel = await this.refineWithOpenAi(source, normalized, sampleValues);
    if (!fromModel) {
      return {
        fields: normalized,
        refinedWithAi: false,
        message: "Affinage IA indisponible : champs inchangés.",
      };
    }

    if (fromModel.length !== normalized.length) {
      return {
        fields: normalized,
        refinedWithAi: false,
        message: "Réponse IA invalide (nombre de champs) : champs inchangés.",
      };
    }

    const merged = this.mergeRefinement(normalized, fromModel);
    return {
      fields: merged,
      refinedWithAi: true,
      message: "Champs affinés par l’IA.",
    };
  }

  private mergeRefinement(
    original: ProductTemplateField[],
    model: Omit<ProductTemplateField, "order">[],
  ): ProductTemplateField[] {
    if (model.length !== original.length) {
      return original;
    }
    return original.map((orig, i) => {
      const m = model[i]!;
      const name =
        typeof m.name === "string" && m.name.trim().length > 0
          ? m.name.trim().slice(0, 2048)
          : orig.name;
      const type = m.type && ALLOWED_TYPES.has(m.type) ? m.type : orig.type;
      const required = typeof m.required === "boolean" ? m.required : orig.required;
      return { name, type, required, order: orig.order };
    });
  }

  private async refineWithOpenAi(
    source: string,
    fields: ProductTemplateField[],
    sampleValues: Record<string, string> | undefined,
  ): Promise<Omit<ProductTemplateField, "order">[] | null> {
    const key = this.configService.get<string>("openaiApiKey", "");
    const model = this.configService.get<string>("openaiModel", "gpt-4o-mini");
    if (!key) return null;

    const sourceHint =
      source === "csv_import"
        ? "Import CSV (ex. export PrestaShop). En-têtes possibles avec astérisques ou libellés français."
        : source === "product_page"
          ? "Champs détectés par analyse HTML d’une fiche produit."
          : "Liste de champs saisie manuellement dans l’application.";

    const userPayload = {
      source,
      sourceHint,
      fields,
      sampleValues: sampleValues && Object.keys(sampleValues).length > 0 ? sampleValues : undefined,
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.15,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Tu améliores des définitions de champs pour une fiche produit e-commerce. Réponds uniquement en JSON : {"fields":[...]}.

Chaque élément : {"name":"string","type":"un parmi ${TYPE_ENUM_FOR_PROMPT}","required":boolean}.

Règles :
- Conserver le MÊME nombre de champs et le MÊME ordre que l’entrée.
- Libellés en français, reconnaissables pour un marchand.
- Ne pas fusionner ni rapprocher des champs distincts (ex. « Description courte » et « Détails produit (description) » restent séparés).
- Types : "rich_text" pour HTML ; "long_text" pour texte long sans HTML ; "price" pour montants ; "reference" pour SKU/EAN ; "image" pour URL image ; "color" / "size" pour variantes ; "enum" pour listes fermées ; "text" pour libellés courts. Utiliser sampleValues pour choisir le type quand c’est utile.
- required true seulement si clairement obligatoire (astérisque dans le nom d’origine, ou identifiant critique évident).
- Ne pas inventer de colonnes ni en supprimer.`,
          },
          {
            role: "user",
            content: JSON.stringify(userPayload),
          },
        ],
      }),
    });

    if (!res.ok) {
      return null;
    }
    const data: unknown = await res.json().catch(() => ({}));
    const text = this.extractOpenAiMessageContent(data);
    if (!text) return null;
    try {
      const parsed = JSON.parse(text) as { fields?: unknown };
      if (!Array.isArray(parsed.fields)) return null;
      const out: Omit<ProductTemplateField, "order">[] = [];
      for (const item of parsed.fields) {
        if (!item || typeof item !== "object") return null;
        const o = item as Record<string, unknown>;
        if (typeof o.name !== "string" || typeof o.type !== "string") {
          return null;
        }
        const normalizedType =
          NORMALIZE_TYPE_FROM_MODEL[o.type] ?? (ALLOWED_TYPES.has(o.type) ? o.type : null);
        if (!normalizedType) return null;
        out.push({
          name: o.name,
          type: normalizedType as ProductTemplateFieldType,
          required: o.required === true,
        });
      }
      return out;
    } catch {
      return null;
    }
  }

  private extractOpenAiMessageContent(data: unknown): string | null {
    if (!data || typeof data !== "object") return null;
    const choices = (data as { choices?: unknown }).choices;
    if (!Array.isArray(choices) || choices.length === 0) return null;
    const first = choices[0];
    if (!first || typeof first !== "object") return null;
    const message = (first as { message?: unknown }).message;
    if (!message || typeof message !== "object") return null;
    const content = (message as { content?: unknown }).content;
    if (typeof content !== "string") return null;
    return content;
  }
}
