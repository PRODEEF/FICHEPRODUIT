import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { CatalogProduct } from "@/domain/catalog/types/catalog.types";
import type { ProductTemplateField } from "@/domain/product-template/types/product-template.types";
import type { MappedField } from "../types/export.types";

/**
 * Complète les champs template non mappables localement via l’API OpenAI (chat completions).
 * En cas d’échec réseau ou de parse JSON, renvoie des valeurs vides avec `source: 'ai'`.
 */
@Injectable()
export class AiContentService {
  private readonly logger = new Logger(AiContentService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * @param unresolvedFields Champs restant après `FieldMapperService.mapDirectFields`
   */
  async generateFields(
    product: CatalogProduct,
    unresolvedFields: ProductTemplateField[],
  ): Promise<MappedField[]> {
    if (unresolvedFields.length === 0) return [];

    const prompt = this.buildPrompt(product, unresolvedFields);

    try {
      const raw = await this.callOpenAI(prompt);
      return this.parseAiResponse(raw, unresolvedFields);
    } catch (err) {
      this.logger.warn(`AI generation failed for product ${product.id}`, err);
      return unresolvedFields.map((f) => ({
        templateFieldName: f.name,
        value: "",
        source: "ai" as const,
      }));
    }
  }

  private buildPrompt(product: CatalogProduct, fields: ProductTemplateField[]): string {
    const fieldList = fields
      .map((f) => `- "${f.name}" (type: ${f.type}${f.required ? ", requis" : ""})`)
      .join("\n");

    return `Tu es un rédacteur e-commerce expert. Génère le contenu des champs suivants pour ce produit.
Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.
Format : { "champ1": "valeur1", "champ2": "valeur2" }

Produit :
- Nom : ${product.name}
- Marque : ${product.brand}
- Catégorie : ${product.category}
- Description fabricant : ${product.description}
- Prix : ${product.price}€
- Attributs : ${JSON.stringify(product.attributes)}

Champs à générer :
${fieldList}

Règles :
- Les champs de type "rich_text" peuvent contenir du HTML simple (<p>, <ul>, <strong>)
- Les champs de type "text" doivent être courts (max 150 caractères)
- Adapte le ton au secteur : ${product.sector}
- Si un champ est inconnu ou impossible à déduire, retourne une chaîne vide ""`;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const apiKey = this.config.getOrThrow<string>("openaiApiKey");
    const model = this.config.get<string>("openaiModel", "gpt-4o-mini");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content ?? "";
  }

  private parseAiResponse(raw: string, fields: ProductTemplateField[]): MappedField[] {
    try {
      const clean = raw
        .trim()
        .replace(/^```json|```$/g, "")
        .trim();
      const parsed = JSON.parse(clean) as Record<string, string>;
      return fields.map((f) => ({
        templateFieldName: f.name,
        value: String(parsed[f.name] ?? ""),
        source: "ai" as const,
      }));
    } catch {
      return fields.map((f) => ({
        templateFieldName: f.name,
        value: "",
        source: "ai" as const,
      }));
    }
  }
}
