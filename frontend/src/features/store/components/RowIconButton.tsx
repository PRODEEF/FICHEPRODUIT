import type { ReactNode } from 'react';

export interface RowIconButtonProps {
  tooltipId: string;
  activeTooltipId: string | null;
  onActiveTooltipChange: (id: string | null) => void;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

/**
 * Bouton icône avec infobulle contextuelle pour les actions d'une ligne de l'arbre.
 * L'infobulle est gérée via un identifiant actif partagé afin d'éviter plusieurs
 * infobulles simultanées.
 */
export function RowIconButton({
  tooltipId,
  activeTooltipId,
  onActiveTooltipChange,
  label,
  disabled = false,
  onClick,
  children,
}: RowIconButtonProps) {
  const showTooltip = activeTooltipId === tooltipId;

  const clearTooltip = () => {
    onActiveTooltipChange(null);
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        onClick={onClick}
        onMouseEnter={() => {
          onActiveTooltipChange(tooltipId);
        }}
        onMouseLeave={clearTooltip}
        onFocus={() => {
          onActiveTooltipChange(tooltipId);
        }}
        onBlur={clearTooltip}
        className="inline-flex h-[26px] w-[26px] items-center justify-center rounded text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </button>
      {showTooltip ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 w-max max-w-[min(14rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-center text-xs leading-snug text-white shadow-md"
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
