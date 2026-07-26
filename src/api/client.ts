import { clearAuth, readAuth } from '@/auth/token'

const BASE = '/v1/api'

// `erasableSyntaxOnly` forbids TS parameter properties (they emit runtime
// assignments, not just erased types), so fields are declared explicitly.
export class ApiError extends Error {
  status: number
  detail?: unknown

  constructor(status: number, message: string, detail?: unknown) {
    super(message)
    this.status = status
    this.detail = detail
  }
}

/** Pulls a human-readable message out of FastAPI's several error shapes. */
function messageFrom(status: number, body: unknown): string {
  if (body && typeof body === 'object' && 'detail' in body) {
    const d = (body as { detail: unknown }).detail
    if (typeof d === 'string') return d
    if (Array.isArray(d)) {
      // 422 validation envelope: [{ loc, msg, ... }]
      const first = d[0] as { msg?: string; loc?: unknown[] } | undefined
      if (first?.msg) {
        const field = Array.isArray(first.loc) ? first.loc.filter((p) => p !== 'body').join('.') : ''
        return field ? `${field}: ${first.msg}` : first.msg
      }
    }
  }
  return `Request failed (${status})`
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = readAuth()
  const headers = new Headers(init.headers)
  if (auth) headers.set('Authorization', `Bearer ${auth.token}`)
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers })

  if (res.status === 401) {
    // The backend revokes archived users mid-session, so any request can
    // start failing. Drop the session rather than sitting half-authenticated.
    clearAuth()
    if (!location.pathname.startsWith('/login')) {
      location.assign('/login?expired=1')
    }
    throw new ApiError(401, 'Your session has ended. Please sign in again.')
  }

  if (res.status === 204) return undefined as T

  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, messageFrom(res.status, body), body)
  return body as T
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<T>(path, { method: 'POST', body: form })
  },
}
