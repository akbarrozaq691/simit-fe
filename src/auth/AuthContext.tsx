import { createContext, useContext, useMemo, useState } from 'react'
import { api } from '@/api/endpoints'
import { clearAuth, readAuth, writeAuth, type StoredAuth } from './token'

interface AuthValue {
  user: StoredAuth | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<StoredAuth>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredAuth | null>(() => readAuth())

  const value = useMemo<AuthValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login: async (email, password) => {
        const res = await api.login(email, password)
        const stored: StoredAuth = {
          token: res.access_token,
          id_user: res.id_user,
          user_name: res.user_name,
          role: res.role,
        }
        writeAuth(stored)
        setUser(stored)
        return stored
      },
      logout: () => {
        clearAuth()
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

/** Where each role belongs after signing in. */
export function homeFor(role: string): string {
  if (role === 'author') return '/dashboard'
  if (role === 'SC') return '/review'
  return '/editorial' // EIC and admin
}
