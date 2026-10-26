import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { AuthLayout, AuthTitle } from '#/components/app/auth-layout'
import { Alert, Button, Checkbox, Field, Input, Select } from '#/components/ui'
import { api } from '#/lib/api'

export const Route = createFileRoute('/cadastro')({
  head: () => ({ meta: [{ title: 'Criar conta · ReverteMed' }] }),
  component: SignUpPage,
})

function SignUpPage() {
  const [f, setF] = useState({
    name: '',
    email: '',
    password: '',
    organization_name: '',
    cnpj: '',
    kind: 'clinic',
  })
  const [accepted, setAccepted] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }))
  const signUp = useMutation({
    mutationFn: () => api('/auth/register', { body: f, auth: false }),
  })

  if (signUp.isSuccess)
    return (
      <AuthLayout
        title="Comece com um diagnóstico gratuito."
        text="Crie sua conta e descubra quanto sua clínica deixou de receber."
        bullets={[
          'Sem cartão de crédito',
          'Implantação em dias',
          'Pague por êxito sobre o que recuperar',
        ]}
      >
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-100 text-brand-600">
          <MailCheck className="size-7" />
        </span>
        <AuthTitle
          title="Confirme seu e-mail"
          sub={`Enviamos um link para ${f.email}. Depois de confirmar, é só entrar.`}
        />
        {import.meta.env.DEV && (
          <Alert tone="info">
            Em desenvolvimento, sem chave do Resend, o link aparece no log da
            API.
          </Alert>
        )}
        <Link to="/login" search={{}} className="font-semibold text-brand-600">
          Ir para o login
        </Link>
      </AuthLayout>
    )

  return (
    <AuthLayout
      title="Comece com um diagnóstico gratuito."
      text="Crie sua conta e descubra quanto sua clínica deixou de receber nos últimos 6 meses."
      bullets={[
        'Sem cartão de crédito',
        'Implantação em dias',
        'Pague por êxito sobre o que recuperar',
      ]}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          signUp.mutate()
        }}
      >
        <AuthTitle title="Crie sua conta" sub="Leva menos de 2 minutos." />
        <Field label="Seu nome">
          <Input
            required
            value={f.name}
            onChange={set('name')}
            autoComplete="name"
            placeholder="Maria Souza"
          />
        </Field>
        <Field label="E-mail profissional">
          <Input
            type="email"
            required
            value={f.email}
            onChange={set('email')}
            autoComplete="email"
            placeholder="voce@clinica.com.br"
          />
        </Field>
        <Field label="Clínica / razão social">
          <Input
            required
            value={f.organization_name}
            onChange={set('organization_name')}
            placeholder="Clínica Aurora Ltda."
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="CNPJ">
            <Input
              required
              value={f.cnpj}
              onChange={set('cnpj')}
              inputMode="numeric"
              placeholder="00.000.000/0001-00"
            />
          </Field>
          <Field label="Tipo">
            <Select value={f.kind} onChange={set('kind')}>
              <option value="clinic">Clínica / prestador</option>
              <option value="billing_company">
                Terceirizada de faturamento
              </option>
            </Select>
          </Field>
        </div>
        <Field
          label="Senha"
          hint="Mínimo de 10 caracteres, com letras e números."
        >
          <Input
            type="password"
            required
            minLength={10}
            value={f.password}
            onChange={set('password')}
            autoComplete="new-password"
          />
        </Field>
        <Checkbox checked={accepted} onChange={setAccepted}>
          Li e aceito os Termos de uso e a Política de privacidade. Estou ciente
          de que o ReverteMed atua como operador e minha clínica como
          controladora dos dados (LGPD).
        </Checkbox>
        {signUp.error && <Alert tone="danger">{signUp.error.message}</Alert>}
        <Button
          type="submit"
          size="lg"
          block
          loading={signUp.isPending}
          disabled={!accepted}
        >
          Criar conta
        </Button>
        <p className="text-center text-sm text-ink-500">
          Já tem conta?{' '}
          <Link
            to="/login"
            search={{}}
            className="font-semibold text-brand-600"
          >
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
