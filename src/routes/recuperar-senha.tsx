import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { useState } from 'react'
import { AuthLayout, AuthTitle } from '#/components/app/auth-layout'
import { Alert, Button, Field, Input } from '#/components/ui'
import { api } from '#/lib/api'

export const Route = createFileRoute('/recuperar-senha')({
  head: () => ({ meta: [{ title: 'Recuperar senha · ReverteMed' }] }),
  component: ForgotPage,
})

function ForgotPage() {
  const [email, setEmail] = useState('')
  const send = useMutation({
    mutationFn: () =>
      api('/auth/password/forgot', { body: { email }, auth: false }),
  })
  return (
    <AuthLayout
      title="Acesso seguro aos dados da sua clínica."
      text="Dados de saúde são sensíveis: protegemos o acesso com verificação em duas etapas."
      bullets={[
        'Criptografia em trânsito e em repouso',
        'Auditoria de todos os acessos',
      ]}
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-brand-100 text-brand-600">
        <Mail className="size-7" />
      </span>
      <AuthTitle
        title="Esqueceu a senha?"
        sub="Informe seu e-mail e enviaremos um link para criar uma nova senha. O link expira em 30 minutos."
      />
      {send.isSuccess ? (
        <Alert tone="success">
          Se o e-mail existir, enviamos as instruções. Confira também a caixa de
          spam.
        </Alert>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            send.mutate()
          }}
        >
          <Field label="E-mail">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@clinica.com.br"
            />
          </Field>
          {send.error && <Alert tone="danger">{send.error.message}</Alert>}
          <Button type="submit" size="lg" block loading={send.isPending}>
            Enviar link de recuperação
          </Button>
        </form>
      )}
      <Link
        to="/login"
        search={{}}
        className="text-center font-semibold text-brand-600"
      >
        Voltar para o login
      </Link>
    </AuthLayout>
  )
}
