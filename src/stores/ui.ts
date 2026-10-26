import { create } from 'zustand'

export interface Toast {
  id: number
  tone: 'success' | 'error' | 'info'
  message: string
}

interface UIState {
  toasts: Toast[]
  push: (tone: Toast['tone'], message: string) => void
  dismiss: (id: number) => void
}

let seq = 1

export const useUI = create<UIState>((set, get) => ({
  toasts: [],
  push: (tone, message) => {
    const id = seq++
    set({ toasts: [...get().toasts, { id, tone, message }] })
    setTimeout(() => get().dismiss(id), 5000)
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

export const toast = {
  success: (m: string) => useUI.getState().push('success', m),
  error: (m: string) => useUI.getState().push('error', m),
  info: (m: string) => useUI.getState().push('info', m),
}
