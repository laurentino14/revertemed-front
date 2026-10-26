import { create } from 'zustand'
import type { Me } from '#/lib/types'

interface AuthState {
  accessToken: string | null
  expiresAt: number | null
  me: Me | null
  mfaDone: boolean
  setSession: (token: string, expiresAt: string) => void
  setMe: (me: Me) => void
  clear: () => void
}

/** In-memory session. The refresh token never reaches JS: it lives in an httpOnly cookie (see server/auth.ts). */
export const useAuth = create<AuthState>((set) => ({
  accessToken: null,
  expiresAt: null,
  me: null,
  mfaDone: false,
  setSession: (accessToken, expiresAt) =>
    set({ accessToken, expiresAt: new Date(expiresAt).getTime() }),
  setMe: (me) => set({ me, mfaDone: me.user.mfa_enabled }),
  clear: () =>
    set({ accessToken: null, expiresAt: null, me: null, mfaDone: false }),
}))
