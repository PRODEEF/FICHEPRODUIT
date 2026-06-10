import { TableOfContents } from 'lucide-react';
import { NavLink } from 'react-router';
import type { ReactNode } from 'react';

import { CreditBalanceBadge } from '../../billing/components/CreditBalanceBadge';
import { cn } from '@shared/lib/cn';
import { Badge, Button } from '@shared/ui';

export interface NavbarProps {
  userEmail: string | null;
  userLabel: string | null;
  loading?: boolean;
  drawerOpen: boolean;
  onDrawerToggle: () => void;
  onLogout: () => void | Promise<void>;
  center?: ReactNode;
}

const drawerItemClass =
  'block rounded-lg px-3.5 py-2.5 text-sm font-semibold text-text-primary no-underline transition-[background,color] duration-150 hover:bg-purple-50 hover:text-purple-700';

export function Navbar({
  userEmail,
  userLabel,
  loading = false,
  drawerOpen,
  onDrawerToggle,
  onLogout,
  center,
}: NavbarProps) {
  const authed = Boolean(userEmail);
  const navTitle = userLabel ?? userEmail ?? undefined;
  const drawerId = 'nav-user-drawer';
  const logoClassName =
    'border-0 bg-gradient-to-br from-purple-600 to-purple-400 bg-clip-text font-sans text-[1.3rem] font-extrabold text-transparent';

  return (
    <>
      <nav
        className="fixed left-0 right-0 top-0 z-[100] flex h-16 items-center justify-between border-b border-soft bg-white/90 px-8 backdrop-blur-xl"
        aria-label="Main"
      >
        <div className="flex shrink-0 items-center gap-2">
          {authed ? (
            <Button
              type="button"
              variant="neutral-outline"
              size="sm"
              className="relative h-11 w-11 min-w-11 shrink-0 rounded-[10px] p-2.5 shadow-sm aria-expanded:border-purple-400 aria-expanded:shadow-[0_0_0_2px_rgba(139,92,246,0.15)]"
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
            </Button>
          ) : null}

          {authed ? (
            <span className={logoClassName}>FicheProduct</span>
          ) : (
            <NavLink to="/" className={cn(logoClassName, 'no-underline hover:opacity-90')}>
              FicheProduct
            </NavLink>
          )}
          <Badge className="ml-2 shrink-0">BETA</Badge>
        </div>
        {center ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {center}
          </div>
        ) : null}
        <div className="flex shrink-0 items-center gap-4" style={{ flexShrink: 0 }}>
          {authed ? <CreditBalanceBadge /> : null}
          {loading ? (
            <span
              className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-text-secondary"
              aria-busy="true"
            >
              …
            </span>
          ) : authed ? (
            <span
              className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-text-secondary"
              title={userEmail ?? undefined}
            >
              {navTitle}
            </span>
          ) : (
            <>
              <Button href="/login" variant="primary" size="sm">
                Se connecter
              </Button>
              <Button href="/signup" variant="primary" size="sm" glow>
                S&apos;inscrire gratuitement
              </Button>
            </>
          )}
        </div>
      </nav>

      {authed ? (
        <aside
          id={drawerId}
          className={`fixed bottom-0 left-0 top-16 z-50 w-[260px] border-r border-soft bg-white/[0.98] shadow-[4px_0_24px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-[transform,visibility] duration-[220ms] ease-[ease] ${drawerOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}
          aria-hidden={!drawerOpen}
        >
          <nav className="box-border flex h-full flex-col py-4" aria-label="Account">
            <div className="flex flex-col gap-0.5 px-3">
              <NavLink
                to="/catalog"
                className={({ isActive }) =>
                  cn(drawerItemClass, isActive && 'bg-purple-50 text-black')
                }
              >
                Mon catalogue
              </NavLink>
              <NavLink
                to="/product-sheet"
                className={({ isActive }) =>
                  cn(drawerItemClass, isActive && 'bg-purple-50 text-black')
                }
              >
                Ma fiche produit
              </NavLink>
              <NavLink
                to="/store"
                className={({ isActive }) =>
                  cn(drawerItemClass, isActive && 'bg-purple-50 text-black')
                }
              >
                Mon magasin
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  cn(drawerItemClass, isActive && 'bg-purple-50 text-black')
                }
              >
                Mon profil
              </NavLink>
            </div>
            <div className="mt-auto border-t border-border px-3 pt-4">
              <Button
                type="button"
                variant="danger-outline"
                size="sm"
                className="w-full font-semibold"
                onClick={() => void onLogout()}
              >
                Déconnexion
              </Button>
            </div>
          </nav>
        </aside>
      ) : null}
    </>
  );
}
