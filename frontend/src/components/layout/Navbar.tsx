import { AlignStartVertical } from 'lucide-react';
import { Link } from 'react-router';
import type { ReactNode } from 'react';

const DISABLED_ANALYSIS_HINT = 'Lance une analyse depuis l’accueil pour activer ce lien.';

export type NavbarProps = {
  userEmail: string | null;
  /** Libellé affiché dans la barre lorsque l’utilisateur est connecté (ex. nom d’utilisateur). */
  userLabel: string | null;
  loading?: boolean;
  lastAnalysisId: string | null;
  drawerOpen: boolean;
  onDrawerToggle: () => void;
  onLogoClick: () => void;
  onLogout: () => void | Promise<void>;
  center?: ReactNode;
};

export function Navbar({
  userEmail,
  userLabel,
  loading = false,
  lastAnalysisId,
  drawerOpen,
  onDrawerToggle,
  onLogoClick,
  onLogout,
  center,
}: NavbarProps) {
  const authed = Boolean(userEmail);
  const navTitle = userLabel ?? userEmail ?? undefined;
  const drawerId = 'nav-user-drawer';

  return (
    <>
      <nav className="app-nav" aria-label="Main">
        <div className="nav-brand-cluster">
          {authed ? (
            <button
              type="button"
              className="nav-burger"
              aria-label="Menu"
              aria-expanded={drawerOpen}
              aria-controls={drawerId}
              onClick={onDrawerToggle}
            >
              <AlignStartVertical
                aria-hidden
                className="nav-burger-icon"
                size={22}
                strokeWidth={2}
              />
            </button>
          ) : null}
          <button type="button" className="logo" onClick={onLogoClick}>
            FicheProduct
          </button>
          <span className="badge-beta">BETA</span>
        </div>
        {center ?? null}
        <div className="nav-user" style={{ flexShrink: 0 }}>
          {loading ? (
            <span className="nav-user-email" aria-busy="true">
              …
            </span>
          ) : authed ? (
            <span className="nav-user-email" title={userEmail ?? undefined}>
              {navTitle}
            </span>
          ) : (
            <>
              <Link to="/login" className="btn-nav nav-auth-link">
                Se connecter
              </Link>
              <Link to="/signup" className="btn-nav nav-auth-link">
                {"S'inscrire"}
              </Link>
            </>
          )}
        </div>
      </nav>

      {authed ? (
        <aside
          id={drawerId}
          className={`nav-drawer${drawerOpen ? ' nav-drawer--open' : ''}`}
          aria-hidden={!drawerOpen}
        >
          <nav className="nav-drawer-inner" aria-label="Account">
            <div className="nav-drawer-links">
              {lastAnalysisId ? (
                <Link to={`/analyses/${lastAnalysisId}?tab=catalog`} className="nav-drawer-link">
                  Mon catalogue
                </Link>
              ) : (
                <span
                  className="nav-drawer-link nav-drawer-link--disabled"
                  title={DISABLED_ANALYSIS_HINT}
                >
                  Mon catalogue
                </span>
              )}
              <Link to="/product-sheet" className="nav-drawer-link">
                Ma fiche produit
              </Link>
              <Link to="/my-store" className="nav-drawer-link">
                Mon magasin
              </Link>
              <Link to="/profile" className="nav-drawer-link">
                Mon profil
              </Link>
            </div>
            <div className="nav-drawer-footer">
              <button type="button" className="nav-drawer-logout" onClick={() => void onLogout()}>
                Déconnexion
              </button>
            </div>
          </nav>
        </aside>
      ) : null}
    </>
  );
}
