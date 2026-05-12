import { useState } from 'react';

import type { CatalogProduct } from '@types-api';
import { Button, Modal } from '@shared/ui';
import { cn } from '@shared/lib/cn';

import { formatPrice } from '../lib/productUtils';

export interface ProductPreviewProps {
  shopName: string;
  product: CatalogProduct | null;
  onClose: () => void;
  open: boolean;
}

function sortedAttributeEntries(attributes: Record<string, string>): [string, string][] {
  return Object.entries(attributes).sort(([a], [b]) => a.localeCompare(b, 'fr'));
}

export function ProductPreview({ shopName, product, open, onClose }: ProductPreviewProps) {
  const [mainImageIndex, setMainImageIndex] = useState(0);

  if (!product) return null;

  const images = product.images ?? [];
  const safeIndex = images.length > 0 ? Math.min(mainImageIndex, images.length - 1) : 0;
  const mainSrc = images[safeIndex];
  const attrRows = sortedAttributeEntries(product.attributes ?? {});

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product.name}
      className="p-4 sm:p-6"
      panelClassName={cn(
        'flex max-h-[80vh] w-[60vw] min-w-[min(100%,20rem)] max-w-[90vw] flex-col overflow-hidden rounded-2xl border border-soft bg-bg-white p-0 shadow-[0_4px_24px_rgba(0,0,0,0.12)]',
      )}
    >
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-soft px-5 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold leading-snug text-text-primary sm:text-xl">
            {shopName}
          </h2>

          <p className="mt-1 text-sm text-text-muted">
            {product.sector} - {product.brand} - {product.category} - {product.subCategory}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {product.url ? (
            <p className="m-0 flex items-center text-sm">
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-purple-600 no-underline hover:underline"
              >
                Ouvrir la page produit
              </a>
            </p>
          ) : null}
          <Button
            type="button"
            variant="neutral-outline"
            size="sm"
            onClick={onClose}
            aria-label="Fermer l’aperçu"
          >
            Fermer
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="space-y-3">
            <div className="aspect-square w-full overflow-hidden rounded-xl border border-soft bg-bg-main">
              {mainSrc ? (
                <img src={mainSrc} alt="" className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-text-muted">
                  Aucune image
                </div>
              )}
            </div>
            {images.length > 1 ? (
              <ul className="flex flex-wrap gap-2" aria-label="Miniatures">
                {images.map((src, i) => (
                  <li key={`${src}-${i}`}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-14 w-14 shrink-0 rounded-lg border p-0.5',
                        i === safeIndex
                          ? 'border-purple-600 ring-2 ring-purple-500/30'
                          : 'border-soft',
                      )}
                      onClick={() => setMainImageIndex(i)}
                      aria-label={`Afficher l’image ${i + 1}`}
                      aria-current={i === safeIndex ? 'true' : undefined}
                    >
                      <img src={src} alt="" className="h-full w-full rounded-md object-cover" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <span className="text-2xl font-bold text-text-primary">{product.name}</span>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-2xl font-bold text-text-primary">
                {formatPrice(product.price)}
              </span>
              {product.year ? (
                <span className="inline-flex rounded-md bg-bg-main px-2 py-0.5 text-xs font-bold text-text-secondary">
                  {product.year}
                </span>
              ) : null}
            </div>

            <div>
              <h3 className="mb-1.5 text-sm font-bold text-text-secondary">Description</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                {product.description?.trim() ? product.description : '—'}
              </p>
            </div>

            {attrRows.length > 0 ? (
              <div>
                <h3 className="mb-2 text-sm font-bold text-text-secondary">Attributs</h3>
                <div className="overflow-hidden rounded-xl border border-soft">
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      {attrRows.map(([key, value]) => (
                        <tr key={key} className="border-b border-soft last:border-b-0">
                          <th
                            scope="row"
                            className="w-[40%] bg-bg-main px-3 py-2 text-left font-semibold text-text-secondary"
                          >
                            {key}
                          </th>
                          <td className="px-3 py-2 text-text-primary">{value || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-8 border-t border-soft pt-6">
          <h3 className="mb-1.5 text-sm font-bold text-text-secondary">Description détaillée</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
            {product.detailedDescription}
          </p>
        </div>
      </div>
    </Modal>
  );
}
