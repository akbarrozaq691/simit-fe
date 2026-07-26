import { Navigate, Outlet } from 'react-router-dom'
import type { Role } from '@/api/types'
import { homeFor, useAuth } from './AuthContext'

/** Gate a route group by role. Admin passes everywhere — the API already
 *  permits it, so mirroring that here avoids confusing dead ends. */
export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin' && !roles.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />
  }
  return <Outlet />
}
