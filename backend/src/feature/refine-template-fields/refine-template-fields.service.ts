import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { components } from '../../generated/api';
import {
  PRODUCT_TEMPLATE_FIELD_TYPES,
  RefineTemplateFieldsDto,
} from './dto/refine-template-fields.dto';

type ProductTemplateField = components['schemas']['ProductTemplateField'];
type ProductTemplateFieldType = components['schemas']['ProductTemplateFieldType'];
type RefineTemplateFieldsResponse =
  components['schemas']['RefineTemplateFieldsResponse'];

const ALLOWED_TYPES = new Set<string>(PRODUCT_TEMPLATE_FIELD_TYPES);

/** Map legacy type strings the model may still emit. */
const NORMALIZE_TYPE_FROM_MODEL: Record<string, ProductTemplateFieldType> = {
  html: 'rich_text',
};

const TYPE_ENUM_FOR_PROMPT = PRODUCT_TEMPLATE_FIELD_TYPES.join('|');

@Injectable()
export class RefineTemplateFieldsService {
  constructor(private readonly configService: ConfigService) {}

  async refine(dto: RefineTemplateFieldsDto): Promise<RefineTemplateFieldsResponse> {
    const normalized = dto.fields.map((f) => ({
      name: f.name,
      type: f.type as ProductTemplateFieldType,
      required: f.required ?? false,
    }));

    const key = this.configService.get<string>('openaiApiKey', '');
    if (!key) {
      return {
        fields: normalized,
        refinedWithAi: false,
        message:
          'Clé OpenAI non configurée (OPENAI_API_KEY). Les champs n’ont pas été modifiés.',
      };
    }

    const fromModel = await this.refineWithOpenAi(dto.source, normalized, dto.sampleValues);
    if (!fromModel) {
      return {
        fields: normalized,
        refinedWithAi: false,
        message:
          "L'IA n'a pas pu affiner la liste (erreur ou réponse invalide). Les champs n’ont pas été modifiés.",
      };
    }

    const merged = this.mergeRefinement(normalized, fromModel);
    return { fields: merged, refinedWithAi: true };
  }

  private mergeRefinement(
    original: ProductTemplateField[],
    model: ProductTemplateField[],
  ): ProductTemplateField[] {
    if (model.length !== original.length) {
      return original;
    }
    return original.map((orig, i) => {
      const m = model[i]!;
      const name =
        typeof m.name === 'string' && m.name.trim().length > 0
          ? m.name.trim().slice(0, 2048)
          : orig.name;
      const type =
        m.type && ALLOWED_TYPES.has(m.type) ? m.type : orig.type;
      const required =
        typeof m.required === 'boolean' ? m.required : orig.required;
      return { name, type, required };
    });
  }

  private async refineWithOpenAi(
    source: string,
    fields: ProductTemplateField[],
    sampleValues: Record<string, string> | undefined,
  ): Promise<ProductTemplateField[] | null> {
    const key = this.configService.get<string>('openaiApiKey', '');
    const model = this.configService.get<string>('openaiModel', 'gpt-4o-mini');
    if (!key) return null;

    const sourceHint =
      source === 'csv_import'
        ? 'CSV import (e.g. PrestaShop export). Column headers may include asterisks or French labels.'
        : source === 'product_page'
          ? 'Fields inferred from scraping an HTML product page (labels may be verbose).'
          : 'Manually edited field list in the app.';

    const userPayload = {
      source,
      sourceHint,
      fields,
      sampleValues:
        sampleValues && Object.keys(sampleValues).length > 0
          ? sampleValues
          : undefined,
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.15,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You improve ecommerce product template field definitions. Reply with JSON only: {"fields":[...]}.

Each item must be: {"name":"string","type":"one of ${TYPE_ENUM_FOR_PROMPT}","required":boolean}.

Rules:
- Keep the SAME number of fields and SAME order as the input.
- Types: use "rich_text" for HTML; "long_text" for long plain text; "price" for money amounts; "percentage" for discount %; "weight" for mass; "reference" for SKU/EAN/barcode; "image" for image URL/path; "url" for generic links; "boolean" for 0/1; "date" / "datetime" as appropriate; "color" / "size" for variants; "country" / "currency" when clearly ISO country or currency code; "enum" / "multi_enum" for closed lists or multi-value tags; "number" for other counts/IDs; "text" for short labels; "json" only for truly structured blobs. Prefer "reference" over "text" for SKUs/EANs.
- You may normalize names slightly: trim, remove trailing "*" from required markers, fix spacing, keep them recognizable for merchants (French UI is OK).
- Set required true only when clearly mandatory (asterisk in original name, or critical identifier like main product name/SKU when obvious).
- Do not invent new columns or drop any.`,
          },
          {
            role: 'user',
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
      const out: ProductTemplateField[] = [];
      for (const item of parsed.fields) {
        if (!item || typeof item !== 'object') return null;
        const o = item as Record<string, unknown>;
        if (typeof o.name !== 'string' || typeof o.type !== 'string') {
          return null;
        }
        const normalizedType =
          NORMALIZE_TYPE_FROM_MODEL[o.type] ??
          (ALLOWED_TYPES.has(o.type) ? o.type : null);
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
    if (!data || typeof data !== 'object') return null;
    const choices = (data as { choices?: unknown }).choices;
    if (!Array.isArray(choices) || choices.length === 0) return null;
    const first = choices[0];
    if (!first || typeof first !== 'object') return null;
    const message = (first as { message?: unknown }).message;
    if (!message || typeof message !== 'object') return null;
    const content = (message as { content?: unknown }).content;
    if (typeof content !== 'string') return null;
    return content;
  }
}
