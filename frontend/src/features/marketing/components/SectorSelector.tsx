import { cn } from '@shared/lib/cn';
import { SHOP_SECTOR_LABELS, type ShopSectorLabel } from '@shared/lib/shopSectors';
import { shopSectorUiList } from '@shared/lib/shopSectorUi';
import { Card } from '@shared/ui';

interface SectorSelectorProps {
  sector: ShopSectorLabel;
  onSelectSector: (sector: ShopSectorLabel) => void;
  /** Affiche le secteur en lecture seule (utilisateur connecté). */
  readOnly?: boolean;
  /** État de chargement du secteur boutique (lecture seule uniquement). */
  loading?: boolean;
}

const sectorUiByLabel = new Map(shopSectorUiList.map((item) => [item.label, item]));

function SectorSelectorLoading() {
  return (
    <div
      className="flex justify-center py-2"
      aria-busy="true"
      aria-label="Chargement du secteur produit"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600 motion-reduce:animate-none"
        role="status"
      />
    </div>
  );
}

function SectorSelectorReadOnly({ sector }: { sector: ShopSectorLabel }) {
  const sectorUi = sectorUiByLabel.get(sector);
  const SectorIcon = sectorUi?.icon;

  return (
    <section className="mx-auto mb-10 max-w-4xl px-3 sm:px-4">
      <Card className="p-6 sm:p-8">
        <div
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
          aria-label={`Secteur produit : ${sector}`}
        >
          <p className="text-sm text-text-muted">Votre secteur produit :</p>
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full border border-purple-500 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 shadow-[0_0_0_2px_rgba(139,92,246,0.12)]',
            )}
          >
            {SectorIcon ? (
              <SectorIcon size={14} className="text-purple-700" strokeWidth={2} aria-hidden />
            ) : null}
            <span>{sector}</span>
          </span>
        </div>
      </Card>
    </section>
  );
}

export function SectorSelector({
  sector,
  onSelectSector,
  readOnly = false,
  loading = false,
}: SectorSelectorProps) {
  if (loading) {
    return <SectorSelectorLoading />;
  }

  if (readOnly) {
    return <SectorSelectorReadOnly sector={sector} />;
  }

  return (
    <section className="mx-auto mb-10 max-w-4xl px-3 sm:px-4">
      <Card className="p-6 sm:p-8">
        <p className="mb-5 text-sm text-text-muted">Quel type de produits vendez-vous ?</p>
        <div
          role="group"
          aria-label="Secteur produit"
          className="flex flex-wrap justify-center gap-2 sm:gap-3"
        >
          {SHOP_SECTOR_LABELS.map((sectorLabel) => {
            const isSelected = sector === sectorLabel;
            const sectorUi = sectorUiByLabel.get(sectorLabel);
            const SectorIcon = sectorUi?.icon;

            return (
              <button
                key={sectorLabel}
                type="button"
                aria-pressed={isSelected}
                onClick={() => void onSelectSector(sectorLabel)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200',
                  isSelected
                    ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-[0_0_0_2px_rgba(139,92,246,0.12)]'
                    : 'border-purple-200 bg-white text-purple-700 hover:border-purple-400 hover:bg-purple-50',
                )}
              >
                {SectorIcon ? (
                  <SectorIcon size={14} className="text-purple-700" strokeWidth={2} aria-hidden />
                ) : null}
                <span>{sectorLabel}</span>
              </button>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
