import { BrowserRouter, Outlet, Route, Routes, useNavigate } from 'react-router'
import { AuthProvider, useAuth } from '../auth/AuthContext'
import { BackgroundGlow } from '../components/layout/BackgroundGlow'
import { Navbar } from '../components/layout/Navbar'
import { Analyses } from '../pages/analyses/Analyses'
import { ProductSheet } from '../pages/analyses/ProductSheet'
import { Home } from '../pages/Home'
import { ForgotPassword } from '../pages/auth/ForgotPassword'
import { Login } from '../pages/auth/Login'
import { ResetPassword } from '../pages/auth/ResetPassword'
import { Signup } from '../pages/auth/Signup'
import { Profile } from '../pages/auth/Profile'

function AppHeader() {
  const navigate = useNavigate()
  const { userEmail, displayLabel, loading, signOut } = useAuth()

  return (
    <Navbar
      userEmail={userEmail}
      userLabel={displayLabel}
      loading={loading}
      onLogoClick={() => navigate('/')}
      onLogout={async () => {
        await signOut()
        navigate('/')
      }}
    />
  )
}

function AppShell() {
  return (
    <div className="app-shell">
      <BackgroundGlow />
      <AppHeader />
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
            <Route
              path="/analyses/:analysisId/product-sheet"
              element={<ProductSheet />}
            />
            <Route path="/profile" element={<Profile />} />
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
