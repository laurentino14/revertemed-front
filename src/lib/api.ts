import { refreshSessionFn } from '#/server/auth'
import { useAuth } from '#/stores/auth'
import type { ApiErrorBody } from './types'

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:8080/api/v1'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, body: Partial<ApiErrorBody>) {
    super(body.message ?? 'Erro inesperado. Tente novamente.')
    this.status = status
    this.code = body.code ?? 'error'
  }
}

let refreshing: Promise<boolean> | null = null

/** Refreshes the access token through the BFF; concurrent callers share one request. */
export function refreshAccessToken(): Promise<boolean> {
  refreshing ??= refreshSessionFn()
    .then((r) => {
      if (r.ok && r.accessToken && r.expiresAt) {
        useAuth.getState().setSession(r.accessToken, r.expiresAt)
        return true
      }
      useAuth.getState().clear()
      return false
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

interface Options {
  method?: string
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  form?: FormData
  auth?: boolean
  signal?: AbortSignal
  raw?: boolean
}

function url(path: string, query?: Options['query']) {
  const u = new URL(API_URL + path)
  for (const [k, v] of Object.entries(query ?? {}))
    if (v !== undefined && v !== null && v !== '')
      u.searchParams.set(k, String(v))
  return u.toString()
}

async function send(
  path: string,
  o: Options,
  retry: boolean,
): Promise<Response> {
  const headers: Record<string, string> = {}
  if (o.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = useAuth.getState().accessToken
  if (o.auth !== false && token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url(path, o.query), {
    method: o.method ?? (o.body !== undefined || o.form ? 'POST' : 'GET'),
    headers,
    body: o.form ?? (o.body !== undefined ? JSON.stringify(o.body) : undefined),
    signal: o.signal,
  })
  if (
    res.status === 401 &&
    o.auth !== false &&
    retry &&
    (await refreshAccessToken())
  )
    return send(path, o, false)
  return res
}

export async function api<T = unknown>(
  path: string,
  o: Options = {},
): Promise<T> {
  const res = await send(path, o, true)
  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!res.ok) {
    let body: Partial<ApiErrorBody> = {}
    try {
      body = JSON.parse(text)
    } catch {
      /* non-JSON error */
    }
    if (res.status === 401 && o.auth !== false) {
      useAuth.getState().clear()
      if (typeof window !== 'undefined') window.location.assign('/login')
    }
    throw new ApiError(res.status, body)
  }
  if (o.raw) return text as T
  return (text ? JSON.parse(text) : undefined) as T
}

export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Erro inesperado. Tente novamente.'
