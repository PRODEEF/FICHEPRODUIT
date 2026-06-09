import { cn } from '@shared/lib/cn';
import type { ShopSectorLabel } from '@shared/lib/shopSectors';
import { universes } from '@shared/lib/universes';
import { Card } from '@shared/ui';

import { PRICING_SECTOR_OPTIONS } from '../lib/pricingConfig';

interface UniverseSelectorProps {
  sector: ShopSectorLabel;
  onSelectSector: (sector: ShopSectorLabel) => void;
}

const universeBySector = new Map(universes.map((universe) => [universe.label, universe]));

export function UniverseSelector({ sector, onSelectSector }: UniverseSelectorProps) {
  return (
    <section className="mx-auto mb-10 max-w-4xl px-3 sm:px-4">
      <Card className="p-6 sm:p-8">
        <p className="mb-5 text-sm text-text-muted">Quel type de produits vendez-vous ?</p>
        <div
          role="group"
          aria-label="Secteur produit"
          className="flex flex-wrap justify-center gap-2 sm:gap-3"
        >
          {PRICING_SECTOR_OPTIONS.map((option) => {
            const isSelected = sector === option.sector;
            const universe = universeBySector.get(option.sector);

            return (
              <button
                key={option.sector}
                type="button"
                aria-pressed={isSelected}
                onClick={() => void onSelectSector(option.sector)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200',
                  isSelected
                    ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-[0_0_0_2px_rgba(139,92,246,0.12)]'
                    : 'border-purple-200 bg-white text-purple-700 hover:border-purple-400 hover:bg-purple-50',
                )}
              >
                {universe ? (
                  <universe.icon
                    size={14}
                    className="text-purple-700"
                    strokeWidth={2}
                    aria-hidden
                  />
                ) : null}
                <span>{option.displayLabel}</span>
              </button>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
