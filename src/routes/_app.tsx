import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppShell } from '#/components/app/shell'
import { PageLoader } from '#/components/app/states'
import { ensureSession } from '#/lib/session'

// Everything below this layout is behind authentication and rendered on the client only (ssr: false);
// public pages (landing, login, sign-up...) are server-rendered.
export const Route = createFileRoute('/_app')({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const me = await ensureSession()
    if (!me)
      throw redirect({ to: '/login', search: { redirect: location.href } })
    return { me }
  },
  pendingComponent: PageLoader,
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})
