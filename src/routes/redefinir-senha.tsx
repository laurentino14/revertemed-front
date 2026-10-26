import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { z } from 'zod'
import { AuthLayout, AuthTitle } from '#/components/app/auth-layout'
import { Alert, Button, Field, Input } from '#/components/ui'
import { api } from '#/lib/api'
import { toast } from '#/stores/ui'

export const Route = createFileRoute('/redefinir-senha')({
  validateSearch: z.object({ token: z.string().optional() }),
  head: () => ({ meta: [{ title: 'Nova senha · ReverteMed' }] }),
  component: ResetPage,
})

function ResetPage() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const reset = useMutation({
    mutationFn: () =>
      api('/auth/password/reset', { body: { token, password }, auth: false }),
    onSuccess: () => {
      toast.success('Senha definida. Entre com a nova senha.')
      void navigate({ to: '/login', search: {} })
    },
  })
  return (
    <AuthLayout
      title="Defina uma senha forte."
      text="Use pelo menos 10 caracteres, com letras e números."
      bullets={[
        'Todas as sessões antigas são encerradas',
        'O link só funciona uma vez',
      ]}
    >
      <AuthTitle title="Criar nova senha" />
      {!token ? (
        <Alert tone="danger">
          Link inválido.{' '}
          <Link to="/recuperar-senha" className="font-semibold underline">
            Peça um novo
          </Link>
          .
        </Alert>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            reset.mutate()
          }}
        >
          <Field label="Nova senha">
            <Input
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field
            label="Confirmar senha"
            error={
              confirm && confirm !== password
                ? 'As senhas não conferem'
                : undefined
            }
          >
            <Input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          {reset.error && <Alert tone="danger">{reset.error.message}</Alert>}
          <Button
            type="submit"
            size="lg"
            block
            loading={reset.isPending}
            disabled={password !== confirm || password.length < 10}
          >
            Salvar senha
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
