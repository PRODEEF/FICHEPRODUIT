type BrandChipsProps = {
  brands: string[];
  activeBrand: string;
  onToggle: (brand: string) => void;
};

export function BrandChips({ brands, activeBrand, onToggle }: BrandChipsProps) {
  if (brands.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" aria-label="Marques principales">
      {brands.map((brand) => {
        const isActive = activeBrand === brand;
        return (
          <button
            key={brand}
            type="button"
            onClick={() => onToggle(brand)}
            className={[
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              isActive
                ? 'border-purple-600 bg-purple-600 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-600',
            ].join(' ')}
          >
            {brand}
          </button>
        );
      })}
    </div>
  );
}
