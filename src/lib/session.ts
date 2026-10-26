import { api, refreshAccessToken } from './api'
import type { Me } from './types'
import { useAuth } from '#/stores/auth'

/** Restores the session from the httpOnly refresh cookie (via the BFF) and loads the current user. */
export async function ensureSession(): Promise<Me | null> {
  if (!useAuth.getState().accessToken && !(await refreshAccessToken()))
    return null
  if (!useAuth.getState().me) {
    try {
      useAuth.getState().setMe(await api<Me>('/me'))
    } catch {
      return null
    }
  }
  return useAuth.getState().me
}
