import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../features/auth/useAuth';
import {
  ProductTemplatesWorkspace,
  type ProductSheetMainTab,
} from '../components/product-templates/ProductTemplatesWorkspace';

export function ProductSheet() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [sheetTab, setSheetTab] = useState<ProductSheetMainTab>('mes-fiches');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      void navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="app-content analyses-page">
        <p className="analyses-status" aria-busy="true">
          Chargement…
        </p>
      </div>
    );
  }

  return (
    <div className="app-content analyses-page">
      <header className="analyses-header">
        <div>
          <h1 className="analyses-title">Fiche produit type</h1>
          <p className="analyses-subtitle">
            Structure des champs pour imports PrestaShop (CSV à venir)
          </p>
        </div>
      </header>
      {!editMode ? (
        <div className="product-sheet-tablist" role="tablist" aria-label="Fiches type">
          <button
            type="button"
            role="tab"
            id="tab-mes-fiches"
            aria-selected={sheetTab === 'mes-fiches'}
            aria-controls="panel-mes-fiches"
            className={`product-sheet-tab${sheetTab === 'mes-fiches' ? ' product-sheet-tab--selected' : ''}`}
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
            className={`product-sheet-tab${sheetTab === 'nouvelle' ? ' product-sheet-tab--selected' : ''}`}
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
