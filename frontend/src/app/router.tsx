import { BrowserRouter, Outlet, Route, Routes, useNavigate } from 'react-router'
import { AuthProvider, useAuth } from '../auth/AuthContext'
import { Navbar } from '../components/layout/Navbar'
import { ForgotPassword } from '../pages/ForgotPassword'
import { Home } from '../pages/Home'
import { Login } from '../pages/Login'
import { ResetPassword } from '../pages/ResetPassword'
import { Signup } from '../pages/Signup'

function AppHeader() {
  const navigate = useNavigate()
  const { userEmail, loading, signOut } = useAuth()

  return (
    <Navbar
      userEmail={userEmail}
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
