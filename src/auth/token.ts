import type { Role } from '@/api/types'

const KEY = 'simit.auth'

export interface StoredAuth {
  token: string
  id_user: string
  user_name: string
  role: Role
}

export function readAuth(): StoredAuth | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredAuth
  } catch {
    localStorage.removeItem(KEY)
    return null
  }
}

export function writeAuth(auth: StoredAuth): void {
  localStorage.setItem(KEY, JSON.stringify(auth))
}

export function clearAuth(): void {
  localStorage.removeItem(KEY)
}
