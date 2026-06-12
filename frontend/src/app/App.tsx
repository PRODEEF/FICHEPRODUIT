import { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router';
import { Toaster } from 'sonner';

import { useAuth } from '@shared/hooks/useAuth';
import { BackgroundGlow } from '@shared/layout/BackgroundGlow';
import { MarketingNavLinks } from '@shared/layout/MarketingNavLinks';
import { Navbar } from '@shared/layout/Navbar';

import { AuthProvider } from '../features/auth/AuthContext';
import { BillingProvider } from '../features/billing/context/BillingContext';
import { appRouteElements } from './router';

function RouteFallback() {
  return (
    <div
      className="flex flex-1 items-center justify-center py-16 text-sm text-gray-600"
      role="status"
    >
      Chargement…
    </div>
  );
}

interface AppHeaderProps {
  drawerOpen: boolean;
  onDrawerToggle: () => void;
}

function AppHeader({ drawerOpen, onDrawerToggle }: AppHeaderProps) {
  const navigate = useNavigate();
  const { userEmail, displayLabel, loading, profileLoading, signOut } = useAuth();

  const handleLogout = async () => {
    if (drawerOpen) {
      onDrawerToggle();
    }
    navigate('/', { replace: true });
    try {
      await signOut();
    } catch {
      window.alert('Une erreur est survenue lors de la déconnexion.');
    }
  };

  return (
    <Navbar
      userEmail={userEmail}
      userLabel={displayLabel}
      loading={loading || profileLoading}
      drawerOpen={drawerOpen}
      onDrawerToggle={onDrawerToggle}
      center={<MarketingNavLinks />}
      onLogout={handleLogout}
    />
  );
}

function AppShellLayout({ userEmail }: { userEmail: string | null }) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const drawerExpanded = drawerOpen && Boolean(userEmail);

  useEffect(() => {
    if (userEmail) {
      setDrawerOpen(true);
    }
  }, [userEmail]);

  return (
    <div
      className="flex min-h-screen flex-col bg-bg-main"
      data-drawer-open={drawerExpanded ? 'true' : undefined}
    >
      <BackgroundGlow />
      <AppHeader drawerOpen={drawerOpen} onDrawerToggle={() => void setDrawerOpen((o) => !o)} />
      <main
        className={`relative z-[1] flex min-h-0 flex-1 flex-col pt-16 transition-[margin-left] duration-200 ${
          drawerExpanded ? 'ml-[260px]' : 'ml-0'
        }`}
      >
        <Suspense key={location.key} fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

/** Routes auth publiques : pas de sidebar même si une session recovery existe en arrière-plan. */
function isPasswordResetRoute(pathname: string): boolean {
  return pathname.endsWith('/auth/reset-password');
}

function AppShell() {
  const { userEmail } = useAuth();
  const { pathname } = useLocation();
  const layoutUserEmail = isPasswordResetRoute(pathname) ? null : userEmail;
  return <AppShellLayout userEmail={layoutUserEmail} />;
}

export function App() {
  return (
    <AuthProvider>
      <BillingProvider>
        <BrowserRouter>
          <Toaster richColors position="bottom-right" />
          <Routes>
            <Route element={<AppShell />}>
              {appRouteElements}
            </Route>
          </Routes>
        </BrowserRouter>
      </BillingProvider>
    </AuthProvider>
  );
}
