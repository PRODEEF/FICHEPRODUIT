import { useState } from 'react';

import { Button, Modal } from '@shared/ui';

import { useSuggestSectorBrands } from '../hooks/useSuggestSectorBrands';

interface SuggestBrandsProps {
  sector: string;
  existingBrands: string[];
  disabled?: boolean;
  onAddBrands: (brands: string[]) => void | Promise<void>;
}

/**
 * Bouton « Suggérer »
 * Ouvre une modale listant les marques du catalogue pour ce secteur.
 */
export function SuggestBrands({
  sector,
  existingBrands,
  disabled = false,
  onAddBrands,
}: SuggestBrandsProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => new Set<string>());
  const [busy, setBusy] = useState(false);

  const { suggestions, loading, load } = useSuggestSectorBrands({ sector, existingBrands });

  const handleOpen = async () => {
    setSelected(new Set());
    await load();
    setOpen(true);
  };

  const handleClose = () => {
    if (!busy) setOpen(false);
  };

  const toggleBrand = (brand: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) {
        next.delete(brand);
      } else {
        next.add(brand);
      }
      return next;
    });
  };

  const handleAddSelected = async () => {
    const brands = Array.from(selected);
    if (brands.length === 0) return;
    setBusy(true);
    try {
      await onAddBrands(brands);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const handleAddAll = async () => {
    if (suggestions.length === 0) return;
    setBusy(true);
    try {
      await onAddBrands(suggestions);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="neutral-outline"
        size="sm"
        disabled={disabled || loading}
        className="h-[42px]"
        onClick={() => void handleOpen()}
      >
        {loading ? 'Chargement…' : 'Suggérer'}
      </Button>

      <Modal open={open} title="Marques suggérées" onClose={handleClose}>
        <h2 className="m-0 text-lg font-semibold text-text-primary">Marques suggérées</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Marques présentes dans notre catalogue pour le secteur{' '}
          <span className="font-medium text-text-primary">« {sector} »</span>.
        </p>

        {suggestions.length === 0 ? (
          <p className="mt-4 text-sm text-text-secondary">
            Aucune suggestion disponible pour ce secteur.
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  disabled={busy}
                  onClick={() => void toggleBrand(brand)}
                  className={
                    selected.has(brand)
                      ? 'rounded-full border border-purple-400 bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400'
                      : 'rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700 transition-colors hover:border-purple-300 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-400'
                  }
                  aria-pressed={selected.has(brand)}
                >
                  {brand}
                </button>
              ))}
            </div>

            <p className="mt-2 text-xs text-text-secondary">
              {selected.size > 0
                ? `${selected.size} sélectionnée${selected.size > 1 ? 's' : ''}`
                : 'Cliquez sur les marques pour les sélectionner.'}
            </p>
          </>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="neutral-outline"
            size="sm"
            disabled={busy}
            onClick={handleClose}
          >
            Annuler
          </Button>
          {suggestions.length > 0 ? (
            <>
              <Button
                type="button"
                variant="neutral-outline"
                size="sm"
                disabled={busy || selected.size === 0}
                onClick={() => void handleAddSelected()}
              >
                {busy ? 'Ajout…' : `Ajouter la sélection`}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={busy}
                onClick={() => void handleAddAll()}
              >
                {busy ? 'Ajout…' : 'Ajouter toutes'}
              </Button>
            </>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
