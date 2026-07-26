import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/auth/AuthContext'

type NavItem = { to: string; label: string }

export const NAV_BY_ROLE: Record<string, NavItem[]> = {
  public: [{ to: '/', label: 'Home' }],
  author: [
    { to: '/dashboard', label: 'My Submissions' },
    { to: '/submit', label: 'Submit Abstract' },
  ],
  SC: [{ to: '/review', label: 'Review Queue' }],
  EIC: [
    { to: '/editorial', label: 'Editorial' },
    { to: '/editorial/journals', label: 'Journals' },
    { to: '/editorial/timeline', label: 'Timeline' },
  ],
  admin: [
    { to: '/editorial', label: 'Editorial' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/topics', label: 'Topics' },
    { to: '/admin/audit', label: 'Audit Log' },
  ],
}

export function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const items = NAV_BY_ROLE[user?.role ?? 'public'] ?? NAV_BY_ROLE.public
  const [menuOpen, setMenuOpen] = useState(false)

  // A route change means a link was followed (or a redirect fired) — close
  // the mobile panel so it doesn't linger over the new page.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  function handleSignOut() {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-bold tracking-tight text-plum-600">SIMIT</span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + '/')
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  active
                    ? 'rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700'
                    : 'rounded-lg px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                }
              >
                {item.label}
              </Link>
            )
          })}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <span className="hidden text-sm font-medium text-ink-600 sm:inline">{user.user_name}</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Register
              </Link>
            </>
          )}
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-lg p-1.5 text-ink-600 hover:bg-ink-100 hover:text-ink-900 md:hidden"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {menuOpen ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>
      {menuOpen && items.length > 0 && (
        <div className="border-t border-ink-200 px-6 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {items.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + '/')
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={
                    active
                      ? 'rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700'
                      : 'rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                  }
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}
