interface BrandChipsProps {
  brands: string[];
  activeBrand: string;
  onToggle: (brand: string) => void;
}

function brandsMatchCaseInsensitive(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function BrandChips({ brands, activeBrand, onToggle }: BrandChipsProps) {
  if (brands.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" aria-label="Marques principales">
      {brands.map((brand) => {
        const isActive = brandsMatchCaseInsensitive(activeBrand, brand);
        return (
          <button
            key={brand}
            type="button"
            title={brand}
            onClick={() => void onToggle(brand)}
            className={[
              'max-w-[12rem] truncate rounded-full border px-3 py-1 text-xs font-medium transition-colors',
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
