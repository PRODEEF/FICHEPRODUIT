import type {
  ProductTemplateField,
  ProductTemplateFieldType,
  RefineFieldsSource,
} from '@types-api';

import { requestNestJson } from './nestHttpClient';

interface ProductTemplateInputField {
  name: string;
  type: ProductTemplateFieldType;
  required: boolean;
}

export interface RefineTemplateFieldsRequest {
  source: RefineFieldsSource;
  fields: ProductTemplateInputField[];
  sampleValues?: Record<string, string>;
}

export interface RefineTemplateFieldsResponse {
  fields: ProductTemplateField[];
  refinedWithAi?: boolean;
  message?: string;
}

export interface ScrapeProductResponse {
  fields: ProductTemplateField[];
  warnings: { code: string; message: string }[];
}

export function refineTemplateFields(
  body: RefineTemplateFieldsRequest,
  accessToken: string,
): Promise<RefineTemplateFieldsResponse> {
  return requestNestJson({
    method: 'POST',
    path: '/refine-template-fields',
    body,
    bearerToken: accessToken,
  });
}

export function scrapeProductPage(
  url: string,
  accessToken: string,
): Promise<ScrapeProductResponse> {
  return requestNestJson({
    method: 'POST',
    path: '/scrape-product',
    body: { url },
    bearerToken: accessToken,
  });
}
