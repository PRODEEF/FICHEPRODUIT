import { TableOfContents } from 'lucide-react';
import { Link } from 'react-router';
import type { ReactNode } from 'react';

export type NavbarProps = {
  userEmail: string | null;
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
      <nav
        className="fixed top-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-b border-soft h-16 flex items-center justify-between px-8"
        aria-label="Main"
      >
        <div className="flex items-center shrink-0 gap-2">
          {/* Menu button */}
          {authed ? (
            <button
              type="button"
              className="relative inline-flex items-center justify-center w-11 h-11 p-2.5 border border-soft rounded-[10px] bg-bg-white cursor-pointer font-sans shadow-sm hover:border-border-purple aria-expanded:border-purple-400 aria-expanded:shadow-[0_0_0_2px_rgba(139,92,246,0.15)]"
              aria-label="Menu"
              aria-expanded={drawerOpen}
              aria-controls={drawerId}
              onClick={onDrawerToggle}
            >
              <TableOfContents
                aria-hidden
                className="text-text-primary"
                size={22}
                strokeWidth={2}
              />
            </button>
          ) : null}

          <button
            type="button"
            className="text-[1.3rem] font-extrabold bg-gradient-to-br from-purple-600 to-purple-400 bg-clip-text text-transparent cursor-pointer border-0 font-sans"
            onClick={onLogoClick}
          >
            FicheProduct
          </button>
          <span className="text-[0.65rem] font-bold px-2 py-0.5 bg-gradient-to-br from-purple-600 to-purple-400 rounded-full text-white ml-2">
            BETA
          </span>
        </div>
        {center ?? null}
        <div className="flex items-center gap-4 shrink-0" style={{ flexShrink: 0 }}>
          {loading ? (
            <span
              className="text-sm text-text-secondary max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
              aria-busy="true"
            >
              …
            </span>
          ) : authed ? (
            <span
              className="text-sm text-text-secondary max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
              title={userEmail ?? undefined}
            >
              {navTitle}
            </span>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-br from-purple-600 to-purple-500 text-white border-0 cursor-pointer font-sans no-underline inline-block text-center"
              >
                Se connecter
              </Link>
              <Link
                to="/signup"
                className="ml-2 bg-purple-600 text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-purple-700 transition-colors duration-200"
              >
                S'inscrire gratuitement
              </Link>
            </>
          )}
        </div>
      </nav>

      {authed ? (
        <aside
          id={drawerId}
          className={`fixed top-16 left-0 bottom-0 w-[260px] z-50 bg-white/[0.98] backdrop-blur-xl border-r border-soft shadow-[4px_0_24px_rgba(0,0,0,0.06)] transition-[transform,visibility] duration-[220ms] ease-[ease] ${drawerOpen ? 'translate-x-0 visible' : '-translate-x-full invisible'}`}
          aria-hidden={!drawerOpen}
        >
          <nav className="flex flex-col h-full py-4 box-border" aria-label="Account">
            <div className="flex flex-col gap-0.5 px-3">
              <Link
                to={
                  lastAnalysisId
                    ? `/catalog/${lastAnalysisId}?tab=catalog`
                    : '/catalog?tab=catalog'
                }
                className="block px-3.5 py-2.5 rounded-lg text-sm font-semibold text-text-primary no-underline transition-[background,color] duration-150 hover:bg-purple-50 hover:text-purple-700"
              >
                Mon catalogue
              </Link>
              <Link
                to="/product-sheet"
                className="block px-3.5 py-2.5 rounded-lg text-sm font-semibold text-text-primary no-underline transition-[background,color] duration-150 hover:bg-purple-50 hover:text-purple-700"
              >
                Ma fiche produit
              </Link>
              <Link
                to="/my-store"
                className="block px-3.5 py-2.5 rounded-lg text-sm font-semibold text-text-primary no-underline transition-[background,color] duration-150 hover:bg-purple-50 hover:text-purple-700"
              >
                Mon magasin
              </Link>
              <Link
                to="/profile"
                className="block px-3.5 py-2.5 rounded-lg text-sm font-semibold text-text-primary no-underline transition-[background,color] duration-150 hover:bg-purple-50 hover:text-purple-700"
              >
                Mon profil
              </Link>
            </div>
            <div className="mt-auto pt-4 px-3 border-t border-border">
              <button
                type="button"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm font-semibold font-sans text-red-500 bg-transparent border border-border cursor-pointer transition-[background,border-color] duration-150 hover:bg-red-50 hover:border-red-500/35"
                onClick={() => void onLogout()}
              >
                Déconnexion
              </button>
            </div>
          </nav>
        </aside>
      ) : null}
    </>
  );
}
