import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { z } from 'zod'
import { AuthLayout, AuthTitle } from '#/components/app/auth-layout'
import { Alert, Button, Checkbox, Field, Input } from '#/components/ui'
import { loginFn, verifyMfaFn } from '#/server/auth'
import type { SessionResult } from '#/server/auth'
import { useAuth } from '#/stores/auth'
import { ensureSession } from '#/lib/session'
import { toast } from '#/stores/ui'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: async () => {
    if (typeof window !== 'undefined' && (await ensureSession()))
      throw redirect({ to: '/home' })
  },
  head: () => ({ meta: [{ title: 'Entrar · ReverteMed' }] }),
  component: LoginPage,
})

function LoginPage() {
  const { redirect: to } = Route.useSearch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [mfaToken, setMfaToken] = useState<string | null>(null)

  async function finish(r: SessionResult) {
    if (!r.ok || !r.accessToken || !r.expiresAt)
      throw new Error(r.error?.message ?? 'Não foi possível entrar')
    useAuth.getState().setSession(r.accessToken, r.expiresAt)
    const me = await ensureSession()
    if (!me) throw new Error('Não foi possível carregar sua conta')
    if (r.mfaEnrollmentRequired)
      toast.info(
        'Ative a verificação em duas etapas em Configurações > Segurança.',
      )
    void navigate({ to: to && to.startsWith('/') ? to : '/home' })
  }

  const login = useMutation({
    mutationFn: async () => {
      const r = await loginFn({ data: { email, password } })
      if (r.ok && r.mfaRequired && r.mfaToken) {
        setMfaToken(r.mfaToken)
        return
      }
      await finish(r)
    },
  })
  const verify = useMutation({
    mutationFn: async () =>
      finish(await verifyMfaFn({ data: { mfaToken: mfaToken!, code } })),
  })
  const err = (mfaToken ? verify.error : login.error)?.message

  return (
    <AuthLayout
      title="Recupere o dinheiro que é seu."
      text="Acompanhe glosas, recursos e prazos em um só lugar."
      bullets={[
        'Valor glosado e recuperado em reais',
        'Recursos prontos para revisar',
        'Alertas antes do vencimento',
      ]}
    >
      {mfaToken ? (
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            verify.mutate()
          }}
        >
          <AuthTitle
            title="Verificação em duas etapas"
            sub="Digite o código de 6 dígitos do seu aplicativo autenticador."
          />
          <Field label="Código">
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              className="text-center font-display text-2xl tracking-[0.4em]"
            />
          </Field>
          {err && <Alert tone="danger">{err}</Alert>}
          <Button
            type="submit"
            size="lg"
            block
            loading={verify.isPending}
            disabled={code.length !== 6}
          >
            Verificar e entrar
          </Button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            login.mutate()
          }}
        >
          <AuthTitle
            title="Entrar no ReverteMed"
            sub="Use seu e-mail profissional para acessar o painel."
          />
          <Field label="E-mail">
            <Input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@clinica.com.br"
            />
          </Field>
          <Field label="Senha">
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
            />
          </Field>
          <div className="flex items-center justify-between text-[13px]">
            <Checkbox checked disabled>
              Manter conectado
            </Checkbox>
            <Link
              to="/recuperar-senha"
              className="font-semibold text-brand-600"
            >
              Esqueci minha senha
            </Link>
          </div>
          {err && <Alert tone="danger">{err}</Alert>}
          <Button type="submit" size="lg" block loading={login.isPending}>
            Entrar
          </Button>
          <p className="text-center text-sm text-ink-500">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="font-semibold text-brand-600">
              Criar conta grátis
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}
