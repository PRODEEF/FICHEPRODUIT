import { useState } from 'react';
import {
  ProductTemplatesWorkspace,
  type ProductSheetMainTab,
} from '../components/ProductTemplatesWorkspace';

export function ProductSheet() {
  const [sheetTab, setSheetTab] = useState<ProductSheetMainTab>('mes-fiches');
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="relative z-[1] w-full px-12 pb-12 pt-9">
      <header className="mb-5 flex flex-wrap items-center justify-start gap-4 text-left">
        <div>
          <h1 className="m-0 text-[1.75rem] font-extrabold text-text-primary">
            Fiche produit type
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Structure des champs pour imports PrestaShop (CSV à venir)
          </p>
        </div>
      </header>
      {!editMode ? (
        <div
          className="mb-5 grid grid-cols-2 border-b border-soft"
          role="tablist"
          aria-label="Fiches type"
        >
          <button
            type="button"
            role="tab"
            id="tab-mes-fiches"
            aria-selected={sheetTab === 'mes-fiches'}
            aria-controls="panel-mes-fiches"
            className={`cursor-pointer border-0 bg-transparent px-2 py-3 text-center text-base font-semibold ${
              sheetTab === 'mes-fiches'
                ? 'text-purple-700'
                : 'text-text-muted hover:text-purple-300'
            }`}
            onClick={() => setSheetTab('mes-fiches')}
          >
            Mes fiches
          </button>
          <button
            type="button"
            role="tab"
            id="tab-nouvelle-fiche"
            aria-selected={sheetTab === 'nouvelle'}
            aria-controls="panel-nouvelle-fiche"
            className={`cursor-pointer border-0 bg-transparent px-2 py-3 text-center text-base font-semibold ${
              sheetTab === 'nouvelle' ? 'text-purple-700' : 'text-text-muted hover:text-purple-300'
            }`}
            onClick={() => setSheetTab('nouvelle')}
          >
            Nouvelle fiche
          </button>
        </div>
      ) : null}
      <ProductTemplatesWorkspace
        sheetTab={sheetTab}
        onSheetTabChange={setSheetTab}
        onEditModeChange={setEditMode}
      />
    </div>
  );
}
