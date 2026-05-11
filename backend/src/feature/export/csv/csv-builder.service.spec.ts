import { CsvBuilderService } from './csv-builder.service';
import type { MappedProduct } from '../types/export.types';
import type { ProductTemplateField } from '@/domain/product-template/types/product-template.types';

const field = (
  name: string,
  overrides: Partial<ProductTemplateField> = {},
): ProductTemplateField => ({
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  templateId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  name,
  type: 'text',
  required: false,
  order: 0,
  ...overrides,
});

describe('CsvBuilderService', () => {
  let service: CsvBuilderService;

  beforeEach(() => {
    service = new CsvBuilderService();
  });

  it('construit une ligne d’en-tête et une ligne par produit', () => {
    const templateFields = [field('Nom'), field('Prix')];
    const products: MappedProduct[] = [
      {
        productId: 'p1',
        fields: [
          { templateFieldName: 'Nom', value: 'Chaise', source: 'direct' },
          { templateFieldName: 'Prix', value: '49', source: 'direct' },
        ],
      },
    ];
    expect(service.build(products, templateFields)).toBe('Nom,Prix\nChaise,49');
  });

  it('échappe les guillemets et entoure les champs avec métacharactères CSV', () => {
    const templateFields = [field('A')];
    const products: MappedProduct[] = [
      { productId: 'p1', fields: [{ templateFieldName: 'A', value: 'dites "oui"', source: 'direct' }] },
    ];
    expect(service.build(products, templateFields)).toBe('A\n"dites ""oui"""');
  });

  it('quotes les cellules contenant une virgule ou un saut de ligne', () => {
    const templateFields = [field('Col')];
    const products: MappedProduct[] = [
      { productId: 'p1', fields: [{ templateFieldName: 'Col', value: 'a,b', source: 'direct' }] },
    ];
    expect(service.build(products, templateFields)).toBe('Col\n"a,b"');
  });

  it('utilise une chaîne vide pour une colonne sans valeur mappée', () => {
    const templateFields = [field('X'), field('Y')];
    const products: MappedProduct[] = [
      { productId: 'p1', fields: [{ templateFieldName: 'X', value: 'un', source: 'direct' }] },
    ];
    expect(service.build(products, templateFields)).toBe('X,Y\nun,');
  });
});
