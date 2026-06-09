import { Card } from '@shared/ui';

import type { SavingsSimulationResult } from '../lib/pricingSimulator';
import { PRICING_EXCL_TAX_NOTICE } from '../lib/pricingConstants';
import { formatPriceEur, formatPriceEurExclTax } from '../lib/pricingFormat';

const RANGE_CLASS =
  'h-2 w-full min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-purple-100 accent-purple-600';

interface SimulatorSliderRowProps {
  id: string;
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}

function SimulatorSliderRow({
  id,
  label,
  valueLabel,
  min,
  max,
  step = 1,
  value,
  onChange,
}: SimulatorSliderRowProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
      <label htmlFor={id} className="shrink-0 text-sm text-text-secondary sm:w-52">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => void onChange(Number(e.target.value))}
        className={RANGE_CLASS}
      />
      <span className="shrink-0 text-right text-lg font-extrabold text-text-primary sm:w-28">
        {valueLabel}
      </span>
    </div>
  );
}

interface SavingsResultCardProps {
  label: string;
  value: string;
  valueClassName?: string;
}

function SavingsResultCard({ label, value, valueClassName }: SavingsResultCardProps) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-5 text-center">
      <p className="mb-2 text-xs text-text-muted">{label}</p>
      <p className={valueClassName ?? 'text-2xl font-extrabold text-text-primary'}>{value}</p>
    </div>
  );
}

interface SavingsSimulatorProps {
  ready: boolean;
  sheetCount: number;
  minSheetCount: number;
  maxSheetCount: number;
  onSheetCountChange: (value: number) => void;
  manualMinutes: number;
  minManualMinutes: number;
  maxManualMinutes: number;
  manualMinutesStep: number;
  onManualMinutesChange: (value: number) => void;
  savings: SavingsSimulationResult;
}

export function SavingsSimulator({
  ready,
  sheetCount,
  minSheetCount,
  maxSheetCount,
  onSheetCountChange,
  manualMinutes,
  minManualMinutes,
  maxManualMinutes,
  manualMinutesStep,
  onManualMinutesChange,
  savings,
}: SavingsSimulatorProps) {
  return (
    <section className="mx-auto mb-16 max-w-4xl px-3 sm:px-4">
      <h2 className="mb-6 text-center text-xs font-bold tracking-widest text-text-muted uppercase">
        Simulateur d&apos;économies
      </h2>
      <Card className="p-6 sm:p-8" aria-busy={!ready}>
        {!ready ? (
          <p className="text-center text-sm text-text-muted" role="status">
            Chargement des tarifs pour votre secteur…
          </p>
        ) : (
          <>
            <div className="space-y-8">
              <SimulatorSliderRow
                id="pricing-sheet-count"
                label="Fiches à générer par an"
                valueLabel={`${sheetCount} fiches`}
                min={minSheetCount}
                max={maxSheetCount}
                value={sheetCount}
                onChange={onSheetCountChange}
              />
              <SimulatorSliderRow
                id="pricing-manual-minutes"
                label="Temps de rédaction manuelle"
                valueLabel={`${manualMinutes} min`}
                min={minManualMinutes}
                max={maxManualMinutes}
                step={manualMinutesStep}
                value={manualMinutes}
                onChange={onManualMinutesChange}
              />
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <SavingsResultCard
                label="Coût rédaction manuelle"
                value={formatPriceEur(savings.manualCostEur, { decimals: 0 })}
              />
              <SavingsResultCard
                label="Coût ficheproduct (HT)"
                value={formatPriceEurExclTax(savings.ficheproductCostEur, { decimals: 0 })}
                valueClassName="text-2xl font-extrabold text-purple-600"
              />
              <SavingsResultCard
                label="Économie annuelle"
                value={formatPriceEur(savings.annualSavingsEur, { decimals: 0 })}
                valueClassName="text-2xl font-extrabold text-green-600"
              />
            </div>
            <p className="mt-4 text-center text-xs text-text-muted">{PRICING_EXCL_TAX_NOTICE}</p>
          </>
        )}
      </Card>
    </section>
  );
}
