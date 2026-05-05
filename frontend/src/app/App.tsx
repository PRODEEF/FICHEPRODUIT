import { useEffect, useState } from 'react';
import { BrowserRouter, Outlet, Route, Routes, useNavigate } from 'react-router';
import { AuthProvider, useAuth } from '../features/auth/useAuth';
import { BackgroundGlow } from '../features/layout/components/BackgroundGlow';
import { Navbar } from '../features/layout/components/Navbar';
import { Analyses } from '../pages/Analyses';
import { ProductSheet } from '../pages/ProductSheet';
import { Home } from '../features/landing/pages/Home';
import { MyStore } from '../features/store/pages/Store';
import { getLastAnalysisId } from '../lib/lastAnalysisIdStorage';
import { ForgotPassword } from '../features/auth/pages/ForgotPassword';
import { Login } from '../features/auth/pages/Login';
import { ResetPassword } from '../features/auth/pages/ResetPassword';
import { Signup } from '../features/auth/pages/Signup';
import { Profile } from '../features/auth/pages/Profile';
import { bootCrisp } from '../lib/crisp';

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
        await signOut();
        navigate('/');
      }}
    />
  );
}

function AppShellLayout({ userEmail }: { userEmail: string | null }) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(true);

  return (
    <div className="app-shell" data-drawer-open={drawerOpen && userEmail ? 'true' : undefined}>
      <BackgroundGlow />
      <AppHeader
        drawerOpen={drawerOpen}
        onDrawerToggle={() => setDrawerOpen((o) => !o)}
        onHomeClick={() => {
          setDrawerOpen(false);
          navigate('/');
        }}
      />
      <main className="app-main">
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
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/analyses" element={<Analyses />} />
            <Route path="/analyses/:analysisId" element={<Analyses />} />
            <Route path="/product-sheet" element={<ProductSheet />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-store" element={<MyStore />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
