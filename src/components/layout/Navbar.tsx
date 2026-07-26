import { Link, useLocation } from 'react-router-dom'
import { Logo } from '@/components/Logo'

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

export function Navbar({ role = 'public', right }: { role?: string; right?: React.ReactNode }) {
  const { pathname } = useLocation()
  const items = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.public

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
        <div className="ml-auto flex items-center gap-3">{right}</div>
      </nav>
    </header>
  )
}
