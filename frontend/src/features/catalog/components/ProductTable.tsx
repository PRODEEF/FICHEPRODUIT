import type { Product } from '@lib/analysis/analysisApi';

import { formatPrice } from '../lib/productUtils';

type ProductTableProps = {
  products: Product[];
  selectedIds: Set<string>;
  allSelected: boolean;
  someSelected: boolean;
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleAll: () => void;
};

export function ProductTable({
  products,
  selectedIds,
  allSelected,
  someSelected,
  onToggleOne,
  onToggleAll,
}: ProductTableProps) {
  if (products.length === 0) return null;

  return (
    <div className="max-w-none overflow-x-auto rounded-xl border border-soft bg-bg-white">
      <table className="min-w-[920px] w-full border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className="w-9 text-center align-middle bg-bg-main px-3 py-2 text-left font-bold text-text-secondary border-b border-soft">
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
            {['Visuel', 'Année', 'Marque', 'Catégorie', 'Sous-cat.', 'Titre', 'Description', 'Commercial', 'Prix', 'Source'].map((h) => (
              <th key={h} scope="col" className="whitespace-nowrap bg-bg-main px-3 py-2 text-left font-bold text-text-secondary border-b border-soft">
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
                  onChange={(e) => onToggleOne(p.id, e.target.checked)}
                  aria-label={`Sélectionner ${p.title}`}
                />
              </td>
              <td className="w-14 align-middle px-2 py-2 border-b border-soft">
                {p.imageUrl ? (
                  <img className="block h-11 w-11 rounded-lg border border-soft object-cover" src={p.imageUrl} alt="" />
                ) : (
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-bg-main text-xs text-text-muted">—</span>
                )}
              </td>
              <td className="px-3 py-2 border-b border-soft">
                {p.year ? <span className="inline-block rounded-md bg-bg-main px-2 py-0.5 text-xs font-bold text-text-secondary">{p.year}</span> : '—'}
              </td>
              <td className="px-3 py-2 border-b border-soft">{p.brand ?? '—'}</td>
              <td className="px-3 py-2 border-b border-soft">{p.category ?? '—'}</td>
              <td className="px-3 py-2 border-b border-soft">{p.subCategory ?? '—'}</td>
              <td className="max-w-56 px-3 py-2 font-semibold text-text-primary border-b border-soft">{p.title}</td>
              <td className="max-w-48 line-clamp-3 break-words px-3 py-2 border-b border-soft">{p.description ?? '—'}</td>
              <td className="max-w-56 line-clamp-3 break-words px-3 py-2 border-b border-soft">
                {p.commercialDescription ?? '—'}
              </td>
              <td className="px-3 py-2 border-b border-soft">
                <strong>{formatPrice(p.price, p.currency ?? 'EUR')}</strong>
              </td>
              <td className="px-3 py-2 border-b border-soft">
                {p.sourceUrl ? (
                  <a
                    href={p.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-purple-600 no-underline hover:underline"
                  >
                    Voir
                  </a>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
