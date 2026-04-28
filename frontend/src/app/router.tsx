import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from 'react-router'
import { AuthProvider, useAuth } from '../auth/AuthContext'
import { BackgroundGlow } from '../components/layout/BackgroundGlow'
import { Navbar } from '../components/layout/Navbar'
import { Analyses } from '../pages/Analyses'
import { ProductSheet } from '../pages/ProductSheet'
import { Home } from '../pages/Home'
import { MyStore } from '../pages/Store'
import { getLastAnalysisId } from '../lib/lastAnalysisIdStorage'
import { ForgotPassword } from '../pages/auth/ForgotPassword'
import { Login } from '../pages/auth/Login'
import { ResetPassword } from '../pages/auth/ResetPassword'
import { Signup } from '../pages/auth/Signup'
import { Profile } from '../pages/auth/Profile'

type AppHeaderProps = {
  drawerOpen: boolean
  onDrawerToggle: () => void
}

function AppHeader({ drawerOpen, onDrawerToggle }: AppHeaderProps) {
  const navigate = useNavigate()
  const { userEmail, displayLabel, loading, signOut } = useAuth()
  const lastAnalysisId = getLastAnalysisId()

  return (
    <Navbar
      userEmail={userEmail}
      userLabel={displayLabel}
      loading={loading}
      lastAnalysisId={lastAnalysisId}
      drawerOpen={drawerOpen}
      onDrawerToggle={onDrawerToggle}
      onLogoClick={() => navigate('/')}
      onLogout={async () => {
        await signOut()
        navigate('/')
      }}
    />
  )
}

function AppShell() {
  const { userEmail } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(true)

  useEffect(() => {
    if (userEmail) setDrawerOpen(true)
  }, [userEmail])

  return (
    <div
      className="app-shell"
      data-drawer-open={drawerOpen && userEmail ? 'true' : undefined}
    >
      <BackgroundGlow />
      <AppHeader
        drawerOpen={drawerOpen}
        onDrawerToggle={() => setDrawerOpen((o) => !o)}
      />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

export function App() {
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
  )
}
