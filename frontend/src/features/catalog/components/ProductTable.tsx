import { useState } from 'react';

import type { CatalogProduct } from '@types-api';
import { Button } from '@shared/ui';

import { formatPrice } from '../lib/productUtils';
import { ProductPreview } from './ProductPreview';

interface ProductTableProps {
  shopName: string;
  products: CatalogProduct[];
  selectedIds: Set<string>;
  allSelected: boolean;
  someSelected: boolean;
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleAll: () => void;
}

export function ProductTable({
  shopName,
  products,
  selectedIds,
  allSelected,
  someSelected,
  onToggleOne,
  onToggleAll,
}: ProductTableProps) {
  const [previewProduct, setPreviewProduct] = useState<CatalogProduct | null>(null);

  if (products.length === 0) return null;

  return (
    <>
      <div className="max-w-none overflow-x-auto rounded-xl border border-soft bg-bg-white">
        <table className="min-w-[920px] w-full border-collapse text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="w-9 text-center align-middle bg-bg-main px-3 py-2 text-left font-bold text-text-secondary border-b border-soft"
              >
                <input
                  type="checkbox"
                  aria-label="Tout sélectionner"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={onToggleAll}
                />
              </th>
              {[
                'Visuel',
                'Titre',
                'Année',
                'Marque',
                'Catégorie',
                'Sous-cat.',
                'Description',
                'Prix',
                'Aperçu',
              ].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="whitespace-nowrap bg-bg-main px-3 py-2 text-left font-bold text-text-secondary border-b border-soft"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className={selectedIds.has(p.id) ? '[&>td]:bg-purple-600/5' : undefined}
              >
                <td className="w-9 text-center align-middle px-3 py-2 border-b border-soft">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={(e) => void onToggleOne(p.id, e.target.checked)}
                    aria-label={`Sélectionner ${p.name}`}
                  />
                </td>
                <td className="w-14 align-middle px-2 py-2 border-b border-soft">
                  {p.images[0] ? (
                    <img
                      className="block h-11 w-11 rounded-lg border border-soft object-cover"
                      src={p.images[0]}
                      alt=""
                    />
                  ) : (
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-bg-main text-xs text-text-muted">
                      —
                    </span>
                  )}
                </td>
                <td className="max-w-56 px-3 py-2 font-semibold text-text-primary border-b border-soft">
                  {p.name}
                </td>
                <td className="px-3 py-2 border-b border-soft">
                  {p.year ? (
                    <span className="inline-block rounded-md bg-bg-main px-2 py-0.5 text-xs font-bold text-text-secondary">
                      {p.year}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2 border-b border-soft">{p.brand}</td>
                <td className="px-3 py-2 border-b border-soft">{p.category}</td>
                <td className="px-3 py-2 border-b border-soft">{p.subCategory ?? '—'}</td>
                <td className="max-w-48 line-clamp-3 break-words px-3 py-2 border-b border-soft">
                  {p.description || '—'}
                </td>
                <td className="px-3 py-2 border-b border-soft">
                  <strong>{formatPrice(p.price)}</strong>
                </td>
                <td className="px-3 py-2 border-b border-soft">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPreviewProduct(p)}
                  >
                    Voir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ProductPreview
        shopName={shopName}
        product={previewProduct}
        open={previewProduct !== null}
        onClose={() => setPreviewProduct(null)}
      />
    </>
  );
}
