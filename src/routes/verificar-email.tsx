import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { AuthLayout, AuthTitle } from '#/components/app/auth-layout'
import { Alert, Spinner } from '#/components/ui'
import { api } from '#/lib/api'

export const Route = createFileRoute('/verificar-email')({
  validateSearch: z.object({ token: z.string().optional() }),
  head: () => ({ meta: [{ title: 'Confirmar e-mail · ReverteMed' }] }),
  component: VerifyPage,
})

function VerifyPage() {
  const { token } = Route.useSearch()
  const verify = useQuery({
    queryKey: ['verify-email', token],
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
    queryFn: () => api('/auth/email/verify', { body: { token }, auth: false }),
  })
  return (
    <AuthLayout
      title="Quase lá."
      text="Confirmar o e-mail garante que só você acessa os dados da clínica."
      bullets={['Conta protegida', 'Alertas enviados ao e-mail certo']}
    >
      <AuthTitle title="Confirmação de e-mail" />
      {!token || verify.isError ? (
        <Alert tone="danger">
          {verify.error?.message ?? 'Link inválido ou expirado.'}
        </Alert>
      ) : verify.isSuccess ? (
        <Alert tone="success">
          E-mail confirmado! Agora você já pode entrar.
        </Alert>
      ) : (
        <div className="flex items-center gap-3 text-ink-500">
          <Spinner /> Confirmando…
        </div>
      )}
      <Link to="/login" search={{}} className="font-semibold text-brand-600">
        Ir para o login
      </Link>
    </AuthLayout>
  )
}
