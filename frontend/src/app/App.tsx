import { useEffect, useState } from 'react';
import { BrowserRouter, Outlet, Route, Routes, useNavigate } from 'react-router';
import { AuthProvider, useAuth } from '../features/auth/useAuth';
import { RequireAuthRoute } from '../features/auth/components/RequireAuthRoute';
import { BackgroundGlow } from '../features/layout/components/BackgroundGlow';
import { Navbar } from '../features/layout/components/Navbar';
import { Catalog } from '../features/catalog/pages/Catalog';
import { PublicCatalog } from '../features/catalog/pages/PublicCatalog';
import { ProductSheet } from '../features/product-sheet/pages/ProductSheet';
import { Home } from '../features/landing/pages/Home';
import { MyStore } from '../features/store/pages/Store';
import { clearLastAnalysisId, getLastAnalysisId } from '@lib/analysis/analysisStorage';
import { ForgotPassword } from '../features/auth/pages/ForgotPassword';
import { Login } from '../features/auth/pages/Login';
import { ResetPassword } from '../features/auth/pages/ResetPassword';
import { Signup } from '../features/auth/pages/Signup';
import { Profile } from '../features/auth/pages/Profile';
import { bootCrisp } from './crisp';
import { Toaster } from 'sonner';

type AppHeaderProps = {
  drawerOpen: boolean;
  onDrawerToggle: () => void;
  onHomeClick: () => void;
};

function AppHeader({ drawerOpen, onDrawerToggle, onHomeClick }: AppHeaderProps) {
  const navigate = useNavigate();
  const { userEmail, displayLabel, loading, signOut } = useAuth();
  const lastAnalysisId = getLastAnalysisId();

  return (
    <Navbar
      userEmail={userEmail}
      userLabel={displayLabel}
      loading={loading}
      lastAnalysisId={lastAnalysisId}
      drawerOpen={drawerOpen}
      onDrawerToggle={onDrawerToggle}
      onLogoClick={onHomeClick}
      onLogout={async () => {
        try {
          await signOut();
        } finally {
          clearLastAnalysisId();
        }
        navigate('/');
      }}
    />
  );
}

function AppShellLayout({ userEmail }: { userEmail: string | null }) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const drawerExpanded = drawerOpen && Boolean(userEmail);

  return (
    <div
      className="flex min-h-screen flex-col bg-bg-main"
      data-drawer-open={drawerExpanded ? 'true' : undefined}
    >
      <BackgroundGlow />
      <AppHeader
        drawerOpen={drawerOpen}
        onDrawerToggle={() => setDrawerOpen((o) => !o)}
        onHomeClick={() => {
          setDrawerOpen(false);
          navigate('/');
        }}
      />
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
      </BrowserRouter>
    </AuthProvider>
  );
}
