import { createServerFn } from '@tanstack/react-start'
import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'

/**
 * Auth BFF: the API issues the refresh token in the response body; these server functions keep it
 * in an httpOnly cookie so JavaScript (and any XSS) can never read it. Only the short-lived access
 * token is returned to the browser, where it is kept in memory.
 */

const COOKIE = 'rm_refresh'
const API = () => process.env.API_URL ?? 'http://localhost:8080/api/v1'

interface TokenPair {
  access_token: string
  refresh_token: string
  expires_at: string
}
interface LoginResult {
  mfa_required: boolean
  mfa_token?: string
  mfa_enrollment_required: boolean
  tokens?: TokenPair
}
export interface SessionResult {
  ok: boolean
  error?: { code: string; message: string }
  mfaRequired?: boolean
  mfaToken?: string
  mfaEnrollmentRequired?: boolean
  accessToken?: string
  expiresAt?: string
}

function remember(refresh: string) {
  setCookie(COOKIE, refresh, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

async function post<T>(
  path: string,
  body: unknown,
): Promise<{ status: number; data: T & { code?: string; message?: string } }> {
  const res = await fetch(API() + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  return { status: res.status, data: text ? JSON.parse(text) : {} }
}

function fail(data: { code?: string; message?: string }): SessionResult {
  return {
    ok: false,
    error: {
      code: data.code ?? 'error',
      message: data.message ?? 'Não foi possível concluir a operação',
    },
  }
}

function success(
  t: TokenPair,
  extra: Partial<SessionResult> = {},
): SessionResult {
  remember(t.refresh_token)
  return {
    ok: true,
    accessToken: t.access_token,
    expiresAt: t.expires_at,
    ...extra,
  }
}

export const loginFn = createServerFn({ method: 'POST' })
  .validator((d: { email: string; password: string }) => d)
  .handler(async ({ data }): Promise<SessionResult> => {
    const { status, data: r } = await post<LoginResult>('/auth/login', data)
    if (status !== 200) return fail(r)
    if (r.mfa_required)
      return { ok: true, mfaRequired: true, mfaToken: r.mfa_token }
    return success(r.tokens!, {
      mfaEnrollmentRequired: r.mfa_enrollment_required,
    })
  })

export const verifyMfaFn = createServerFn({ method: 'POST' })
  .validator((d: { mfaToken: string; code: string }) => d)
  .handler(async ({ data }): Promise<SessionResult> => {
    const { status, data: r } = await post<TokenPair>('/auth/mfa/verify', {
      mfa_token: data.mfaToken,
      code: data.code,
    })
    return status === 200 ? success(r) : fail(r)
  })

/** Exchanges the httpOnly refresh cookie for a fresh access token (rotating the refresh token). */
export const refreshSessionFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<SessionResult> => {
    const refresh = getCookie(COOKIE)
    if (!refresh) return { ok: false }
    const { status, data: r } = await post<TokenPair>('/auth/refresh', {
      refresh_token: refresh,
    })
    if (status !== 200) {
      deleteCookie(COOKIE, { path: '/' })
      return fail(r)
    }
    return success(r)
  },
)

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const refresh = getCookie(COOKIE)
  if (refresh)
    await post('/auth/logout', { refresh_token: refresh }).catch(
      () => undefined,
    )
  deleteCookie(COOKIE, { path: '/' })
  return { ok: true }
})
