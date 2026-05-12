import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Outlet, Route, Routes, useNavigate } from 'react-router';
import { Toaster } from 'sonner';

import { useAuth } from '@shared/hooks/useAuth';

import { AuthProvider } from '../features/auth/AuthContext';
import { RequireAuthRoute } from '../features/auth/components/RequireAuthRoute';
import { BackgroundGlow } from '../features/layout/components/BackgroundGlow';
import { Navbar } from '../features/layout/components/Navbar';
import { bootCrisp } from './crisp';

const Home = lazy(async () => {
  const m = await import('../features/landing/pages/Home');
  return { default: m.Home };
});
const PublicCatalog = lazy(async () => {
  const m = await import('../features/catalog/pages/PublicCatalog');
  return { default: m.PublicCatalog };
});
const Login = lazy(async () => {
  const m = await import('../features/auth/pages/Login');
  return { default: m.Login };
});
const Signup = lazy(async () => {
  const m = await import('../features/auth/pages/Signup');
  return { default: m.Signup };
});
const ForgotPassword = lazy(async () => {
  const m = await import('../features/auth/pages/ForgotPassword');
  return { default: m.ForgotPassword };
});
const ResetPassword = lazy(async () => {
  const m = await import('../features/auth/pages/ResetPassword');
  return { default: m.ResetPassword };
});
const Catalog = lazy(async () => {
  const m = await import('../features/catalog/pages/Catalog');
  return { default: m.Catalog };
});
const ProductSheet = lazy(async () => {
  const m = await import('../features/product-sheet/pages/ProductSheet');
  return { default: m.ProductSheet };
});
const Profile = lazy(async () => {
  const m = await import('../features/auth/pages/Profile');
  return { default: m.Profile };
});
const MyStore = lazy(async () => {
  const m = await import('../features/store/pages/Store');
  return { default: m.MyStore };
});

function RouteFallback() {
  return (
    <div className="flex flex-1 items-center justify-center py-16 text-sm text-gray-600" role="status">
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

  return (
    <Navbar
      userEmail={userEmail}
      userLabel={displayLabel}
      loading={loading || profileLoading}
      drawerOpen={drawerOpen}
      onDrawerToggle={onDrawerToggle}
      onLogout={async () => {
        void navigate('/', { replace: true });
        try {
          await signOut();
        } catch {
          window.alert('Une erreur est survenue lors de la déconnexion.');
        }
      }}
    />
  );
}

function AppShellLayout({ userEmail }: { userEmail: string | null }) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const drawerExpanded = drawerOpen && Boolean(userEmail);

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
        <Outlet />
      </main>
    </div>
  );
}

function AppShell() {
  const { userEmail } = useAuth();
  return <AppShellLayout key={userEmail ?? 'guest'} userEmail={userEmail} />;
}

export function App() {
  useEffect(() => {
    bootCrisp();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster richColors position="bottom-right" />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Home />} />
              <Route path="/catalog/public/:analysisId" element={<PublicCatalog />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />

              <Route element={<RequireAuthRoute />}>
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/catalog/:analysisId" element={<Catalog />} />
                <Route path="/product-sheet" element={<ProductSheet />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/store" element={<MyStore />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
