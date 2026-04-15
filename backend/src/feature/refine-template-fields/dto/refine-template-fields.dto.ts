import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayMinSize,
  IsBoolean,
  IsEnum,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Allowed product template field types (keep in sync with OpenAPI ProductTemplateFieldType). */
export const PRODUCT_TEMPLATE_FIELD_TYPES = [
  'text',
  'long_text',
  'rich_text',
  'number',
  'price',
  'percentage',
  'boolean',
  'date',
  'datetime',
  'url',
  'email',
  'phone',
  'enum',
  'multi_enum',
  'reference',
  'image',
  'file',
  'color',
  'size',
  'weight',
  'dimension',
  'country',
  'currency',
  'json',
] as const;

export class ProductTemplateFieldItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  name!: string;

  @IsIn(PRODUCT_TEMPLATE_FIELD_TYPES as unknown as string[])
  type!: (typeof PRODUCT_TEMPLATE_FIELD_TYPES)[number];

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

export enum RefineTemplateFieldsSource {
  csv_import = 'csv_import',
  product_page = 'product_page',
  manual = 'manual',
}

export class RefineTemplateFieldsDto {
  @IsEnum(RefineTemplateFieldsSource)
  source!: RefineTemplateFieldsSource;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductTemplateFieldItemDto)
  fields!: ProductTemplateFieldItemDto[];

  @IsOptional()
  @IsObject()
  sampleValues?: Record<string, string>;
}
