import { FieldMapperService } from './field-mapper.service';
import type { CatalogProduct } from '@/domain/catalog/types/catalog.types';
import type { ProductTemplateField } from '@/domain/product-template/types/product-template.types';

const sampleProduct = (): CatalogProduct => ({
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Produit X',
  brand: 'Marque Z',
  sector: 'sport',
  category: 'Chaussures',
  subCategory: null,
  year: 2024,
  price: 129.9,
  description: 'Description fabricant',
  detailedDescription: '',
  images: ['https://cdn.test/1.jpg', 'https://cdn.test/2.jpg'],
  url: 'https://shop.test/p/1',
  attributes: { Couleur: 'Rouge', ' poids ': '1kg' },
});

const tplField = (name: string): ProductTemplateField => ({
  name,
  type: 'text',
  required: false,
  order: 0,
});

describe('FieldMapperService', () => {
  let service: FieldMapperService;

  beforeEach(() => {
    service = new FieldMapperService();
  });

  it('mappe les synonymes canoniques (ex. prix → price)', () => {
    const product = sampleProduct();
    const { mapped, unresolved } = service.mapDirectFields(product, [tplField('prix')]);
    expect(mapped).toEqual([
      { templateFieldName: 'prix', value: '129.9', source: 'direct' },
    ]);
    expect(unresolved).toEqual([]);
  });

  it('résout une colonne depuis attributes avec clé insensible à la casse / espaces', () => {
    const product = sampleProduct();
    const { mapped, unresolved } = service.mapDirectFields(product, [tplField('Poids')]);
    expect(mapped).toEqual([{ templateFieldName: 'Poids', value: '1kg', source: 'direct' }]);
    expect(unresolved).toEqual([]);
  });

  it('laisse en "unresolved" les champs sans correspondance directe', () => {
    const product = sampleProduct();
    const f = tplField('Meta inconnu');
    const { mapped, unresolved } = service.mapDirectFields(product, [f]);
    expect(mapped).toEqual([]);
    expect(unresolved).toEqual([f]);
  });
});
