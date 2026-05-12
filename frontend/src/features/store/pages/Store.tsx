import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { patchMyShop } from '@api/shop';
import type { PatchMyShopBody } from '@types-api';
import { Banner } from '@shared/ui';

import type { Shop } from '../types';
import { ShopInfoSection } from '../components/ShopInfoSection';
import { TagListEditor } from '../components/TagListEditor';
import { useShop } from '../hooks/useShop';

function LoadingState() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-12 pt-9">
      <span
        className="h-10 w-10 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600"
        aria-hidden
      />
      <p className="text-sm text-gray-600">Chargement du magasin…</p>
    </div>
  );
}

interface StoreLoadedProps {
  shop: Shop;
  refetch: () => Promise<void>;
}

function StoreLoaded({ shop, refetch }: StoreLoadedProps) {
  const [patching, setPatching] = useState(false);

  const patchShop = useCallback(
    async (partial: PatchMyShopBody) => {
      setPatching(true);
      try {
        await patchMyShop(partial);
        await refetch();
      } finally {
        setPatching(false);
      }
    },
    [refetch],
  );

  return (
    <>
      <ShopInfoSection shop={shop} onSavePartial={patchShop} saving={patching} />

      <TagListEditor
        label="Marques"
        tags={shop.brands}
        disabled={patching}
        onAdd={async (tag) => {
          if (shop.brands.includes(tag)) return;
          await patchShop({ brands: [...shop.brands, tag] });
        }}
        onRemove={async (tag) => {
          await patchShop({ brands: shop.brands.filter((t) => t !== tag) });
        }}
      />
      <TagListEditor
        label="Catégories"
        tags={shop.categories}
        disabled={patching}
        onAdd={async (tag) => {
          if (shop.categories.includes(tag)) return;
          await patchShop({ categories: [...shop.categories, tag] });
        }}
        onRemove={async (tag) => {
          await patchShop({ categories: shop.categories.filter((t) => t !== tag) });
        }}
      />
    </>
  );
}

export function MyStore() {
  const navigate = useNavigate();
  const { shop, loading, error, refetch } = useShop();

  useEffect(() => {
    if (!loading && shop === null && !error) {
      void navigate('/', { replace: true });
    }
  }, [loading, shop, error, navigate]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="relative z-[1] w-full px-12 pb-12 pt-9">
        <h1 className="m-0 text-[1.75rem] font-extrabold text-text-primary">Mon magasin</h1>
        <p className="mt-4 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!shop) {
    return null;
  }

  return (
    <div className="relative z-[1] w-full px-12 pb-12 pt-9">
      <header className="mb-6 text-left">
        <h1 className="m-0 text-[1.75rem] font-extrabold text-text-primary">Mon magasin</h1>
      </header>

      {!shop.url.trim() ? (
        <Banner variant="neutral" className="mb-6" role="status">
          Indiquez l&apos;URL de votre boutique ci-dessous pour lier vos analyses et enrichir votre
          fiche magasin.
        </Banner>
      ) : null}

      <StoreLoaded shop={shop} refetch={refetch} />
    </div>
  );
}
