import { Link } from 'react-router'
import type { ReactNode } from 'react'

export type NavbarProps = {
  userEmail: string | null
  /** Shown in the nav when authenticated (e.g. username). */
  userLabel: string | null
  loading?: boolean
  onLogoClick: () => void
  onLogout: () => void | Promise<void>
  center?: ReactNode
}

export function Navbar({
  userEmail,
  userLabel,
  loading = false,
  onLogoClick,
  onLogout,
  center,
}: NavbarProps) {
  const authed = Boolean(userEmail)
  const navTitle = userLabel ?? userEmail ?? undefined

  return (
    <nav className="app-nav" aria-label="Main">
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
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
          <>
            <Link
              to="/profile"
              className="nav-user-email nav-user-profile-link"
              title={userEmail ?? undefined}
            >
              {navTitle}
            </Link>
            <button
              type="button"
              className="btn-nav"
              onClick={() => void onLogout()}
            >
              Déconnexion
            </button>
          </>
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
  )
}
