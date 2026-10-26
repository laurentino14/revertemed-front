import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Table,
  Tabs,
  Td,
  Th,
  Toggle,
} from '#/components/ui'
import { api } from '#/lib/api'
import { date, toApiDate } from '#/lib/format'
import { useAct, useGet } from '#/lib/query'
import { useAuth } from '#/stores/auth'
import type { List, Me, Operator, Provider, User } from '#/lib/types'

export const Route = createFileRoute('/_app/configuracoes')({
  head: () => ({ meta: [{ title: 'Configurações · ReverteMed' }] }),
  component: Page,
})

const tabs = [
  'operadoras',
  'equipe',
  'seguranca',
  'prestadores',
  'feriados',
] as const
const labels = {
  operadoras: 'Operadoras',
  equipe: 'Equipe',
  seguranca: 'Segurança',
  prestadores: 'Prestadores',
  feriados: 'Feriados',
}

function Page() {
  const [tab, setTab] = useQueryState(
    'aba',
    parseAsStringLiteral(tabs).withDefault('operadoras'),
  )
  return (
    <>
      <PageHeader
        title="Configurações"
        sub="Cadastros, equipe e segurança da conta"
      />
      <Tabs
        value={tab}
        onChange={(v) => void setTab(v)}
        items={tabs.map((t) => ({ value: t, label: labels[t] }))}
      />
      <Boundary fallback={<div className="skeleton h-64" />}>
        {tab === 'operadoras' && <Operators />}
        {tab === 'equipe' && <Team />}
        {tab === 'seguranca' && <Security />}
        {tab === 'prestadores' && <Providers />}
        {tab === 'feriados' && <Holidays />}
      </Boundary>
    </>
  )
}

/* ---------- Operadoras ---------- */
function Operators() {
  const ops = useGet<List<Operator>>('/operators').items
  const [edit, setEdit] = useState<Operator | 'new' | null>(null)
  return (
    <>
      <Card
        title="Operadoras"
        flat
        right={
          <Button size="sm" onClick={() => setEdit('new')}>
            Nova operadora
          </Button>
        }
      >
        {ops.length === 0 ? (
          <EmptyState title="Nenhuma operadora cadastrada">
            Cadastre as operadoras com o registro ANS: ele identifica
            automaticamente o dono de cada arquivo TISS importado.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Registro ANS</Th>
                <Th right>Prazo p/ recurso</Th>
                <Th right>Prazo de pagamento</Th>
                <Th right>Resposta de autorização</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {ops.map((o) => (
                <tr key={o.id}>
                  <Td strong>{o.name}</Td>
                  <Td>{o.ans_registry || '—'}</Td>
                  <Td right>{o.appeal_deadline_days} dias</Td>
                  <Td right>{o.payment_term_days} dias</Td>
                  <Td right>{o.auth_response_days} d.u.</Td>
                  <Td right>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEdit(o)}
                    >
                      Editar
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <OperatorModal
        key={edit === null ? 'none' : edit === 'new' ? 'new' : edit.id}
        edit={edit}
        onClose={() => setEdit(null)}
      />
    </>
  )
}

function OperatorModal({
  edit,
  onClose,
}: {
  edit: Operator | 'new' | null
  onClose: () => void
}) {
  const cur = edit && edit !== 'new' ? edit : null
  const [f, setF] = useState({
    name: cur?.name ?? '',
    ans_registry: cur?.ans_registry ?? '',
    appeal_deadline_days: cur?.appeal_deadline_days ?? 30,
    payment_term_days: cur?.payment_term_days ?? 45,
    auth_response_days: cur?.auth_response_days ?? 5,
  })
  const save = useAct(
    () =>
      cur
        ? api(`/operators/${cur.id}`, { method: 'PUT', body: f })
        : api('/operators', { body: f }),
    {
      invalidate: ['/operators'],
      success: 'Operadora salva',
      onSuccess: onClose,
    },
  )
  const num = (
    k: 'appeal_deadline_days' | 'payment_term_days' | 'auth_response_days',
  ) => ({
    type: 'number' as const,
    min: 0,
    value: f[k],
    onChange: (e: { target: { value: string } }) =>
      setF({ ...f, [k]: Number(e.target.value) }),
  })
  return (
    <Modal
      open={!!edit}
      onClose={onClose}
      title={cur ? 'Editar operadora' : 'Nova operadora'}
    >
      <Field label="Nome">
        <Input
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          autoFocus
        />
      </Field>
      <Field
        label="Registro ANS"
        hint="Identifica a operadora nos arquivos TISS"
      >
        <Input
          value={f.ans_registry}
          onChange={(e) => setF({ ...f, ans_registry: e.target.value })}
          inputMode="numeric"
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Prazo p/ recurso (dias)">
          <Input {...num('appeal_deadline_days')} />
        </Field>
        <Field label="Prazo de pagamento (dias)">
          <Input {...num('payment_term_days')} />
        </Field>
        <Field label="Resposta de autorização (d.u.)">
          <Input {...num('auth_response_days')} />
        </Field>
      </div>
      <Button
        loading={save.isPending}
        disabled={!f.name.trim()}
        onClick={() => save.mutate(undefined)}
      >
        Salvar
      </Button>
    </Modal>
  )
}

/* ---------- Equipe ---------- */
const roles = {
  owner: 'Proprietário',
  admin: 'Administrador',
  biller: 'Faturista',
  viewer: 'Somente leitura',
}

function Team() {
  const users = useGet<List<User>>('/team/users').items
  const me = useAuth((s) => s.me)
  const [open, setOpen] = useState(false)
  const toggle = useAct(
    (u: User) =>
      api(`/team/users/${u.id}/active`, {
        method: 'PATCH',
        body: { active: !u.active },
      }),
    { invalidate: ['/team'] },
  )
  const admin = me?.user.role === 'owner' || me?.user.role === 'admin'
  return (
    <>
      <Card
        title="Equipe"
        flat
        right={
          admin && (
            <Button size="sm" onClick={() => setOpen(true)}>
              Convidar
            </Button>
          )
        }
      >
        <Table>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>E-mail</Th>
              <Th>Perfil</Th>
              <Th>2FA</Th>
              <Th>Último acesso</Th>
              <Th>Ativo</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <Td strong>{u.name}</Td>
                <Td>{u.email}</Td>
                <Td>
                  <Badge tone="brand">{roles[u.role]}</Badge>
                </Td>
                <Td>
                  {u.mfa_enabled ? (
                    <Badge tone="success">Ativo</Badge>
                  ) : (
                    <Badge tone="neutral">Não</Badge>
                  )}
                </Td>
                <Td>
                  {u.last_login_at ? (
                    date(u.last_login_at)
                  ) : u.email_verified_at ? (
                    '—'
                  ) : (
                    <Badge tone="warning">Convite pendente</Badge>
                  )}
                </Td>
                <Td>
                  <Toggle
                    label={`Ativar ${u.name}`}
                    checked={u.active}
                    onChange={() =>
                      admin && u.id !== me?.user.id && toggle.mutate(u)
                    }
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <InviteModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function InviteModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [f, setF] = useState({ name: '', email: '', role: 'biller' })
  const invite = useAct(() => api('/team/users/invite', { body: f }), {
    invalidate: ['/team'],
    success: 'Convite enviado por e-mail',
    onSuccess: () => {
      setF({ name: '', email: '', role: 'biller' })
      onClose()
    },
  })
  return (
    <Modal open={open} onClose={onClose} title="Convidar usuário">
      <Field label="Nome">
        <Input
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
        />
      </Field>
      <Field label="E-mail">
        <Input
          type="email"
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
        />
      </Field>
      <Field label="Perfil">
        <Select
          value={f.role}
          onChange={(e) => setF({ ...f, role: e.target.value })}
        >
          <option value="admin">Administrador</option>
          <option value="biller">Faturista (edita e aprova recursos)</option>
          <option value="viewer">Somente leitura</option>
        </Select>
      </Field>
      <Button
        loading={invite.isPending}
        disabled={!f.name.trim() || !f.email.trim()}
        onClick={() => invite.mutate(undefined)}
      >
        Enviar convite
      </Button>
    </Modal>
  )
}

/* ---------- Segurança ---------- */
function Security() {
  const me = useAuth((s) => s.me)
  const qc = useQueryClient()
  const [setup, setSetup] = useState<{
    secret: string
    otpauth_url: string
  } | null>(null)
  const [code, setCode] = useState('')
  const start = useAct(
    () =>
      api<{ secret: string; otpauth_url: string }>('/me/mfa/setup', {
        method: 'POST',
      }),
    { onSuccess: setSetup },
  )
  const enable = useAct(() => api('/me/mfa/enable', { body: { code } }), {
    success:
      'Verificação em duas etapas ativada. No próximo login o código será pedido.',
    onSuccess: async () => {
      useAuth.getState().setMe(await api<Me>('/me'))
      setSetup(null)
      void qc.invalidateQueries({ queryKey: ['/team/users'] })
    },
  })
  return (
    <Card
      title="Verificação em duas etapas (2FA)"
      right={
        me?.user.mfa_enabled ? (
          <Badge tone="success">Ativa</Badge>
        ) : (
          <Badge tone="warning">Desativada</Badge>
        )
      }
    >
      {me?.user.mfa_enabled ? (
        <p className="text-ink-700">
          Sua conta está protegida. O código do aplicativo autenticador é pedido
          a cada login e para aceitar operações financeiras.
        </p>
      ) : setup ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-ink-700">
            Escaneie o QR code no aplicativo autenticador (Google Authenticator,
            1Password, Authy…) e digite o código de 6 dígitos.
          </p>
          <div className="rounded-2xl border border-ink-200 bg-white p-4">
            <QRCodeSVG value={setup.otpauth_url} size={176} />
          </div>
          <p className="text-xs text-ink-500">
            Sem câmera? Chave manual:{' '}
            <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-ink-900">
              {setup.secret}
            </code>
          </p>
          <div className="flex items-end gap-3">
            <Field label="Código">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                inputMode="numeric"
                className="w-40 text-center tracking-[0.3em]"
              />
            </Field>
            <Button
              loading={enable.isPending}
              disabled={code.length !== 6}
              onClick={() => enable.mutate(undefined)}
            >
              Ativar
            </Button>
          </div>
        </div>
      ) : (
        <>
          {(me?.user.role === 'owner' || me?.user.role === 'admin') && (
            <Alert tone="warning">
              Obrigatório para usuários administrativos. Ative agora para
              proteger os dados de saúde da clínica.
            </Alert>
          )}
          <Button
            className="self-start"
            loading={start.isPending}
            onClick={() => start.mutate(undefined)}
          >
            Configurar 2FA
          </Button>
        </>
      )}
    </Card>
  )
}

/* ---------- Prestadores / Feriados ---------- */
function Providers() {
  const rows = useGet<List<Provider>>('/providers').items
  const [f, setF] = useState({ name: '', cnpj: '', cnes: '' })
  const create = useAct(() => api('/providers', { body: f }), {
    invalidate: ['/providers'],
    success: 'Prestador cadastrado',
    onSuccess: () => setF({ name: '', cnpj: '', cnes: '' }),
  })
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1fr_360px]">
      <Card title="Prestadores" flat>
        {rows.length === 0 ? (
          <EmptyState title="Nenhum prestador">
            Os lotes importados são vinculados ao primeiro prestador cadastrado.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>CNPJ</Th>
                <Th>CNES</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <Td strong>{p.name}</Td>
                  <Td>{p.cnpj}</Td>
                  <Td>{p.cnes || '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <Card title="Novo prestador">
        <Field label="Nome">
          <Input
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
        </Field>
        <Field label="CNPJ">
          <Input
            value={f.cnpj}
            onChange={(e) => setF({ ...f, cnpj: e.target.value })}
            inputMode="numeric"
          />
        </Field>
        <Field label="CNES">
          <Input
            value={f.cnes}
            onChange={(e) => setF({ ...f, cnes: e.target.value })}
          />
        </Field>
        <Button
          loading={create.isPending}
          disabled={!f.name.trim() || !f.cnpj.trim()}
          onClick={() => create.mutate(undefined)}
        >
          Cadastrar
        </Button>
      </Card>
    </div>
  )
}

function Holidays() {
  const [f, setF] = useState({ day: '', name: '' })
  const add = useAct(
    () => api('/holidays', { body: { day: toApiDate(f.day), name: f.name } }),
    {
      success: 'Feriado cadastrado',
      onSuccess: () => setF({ day: '', name: '' }),
    },
  )
  return (
    <Card title="Feriados estaduais e municipais">
      <p className="text-[13px] text-ink-500">
        Os feriados nacionais já estão incluídos. Cadastre os locais para que os
        prazos em dias úteis (recursos e autorizações) sejam exatos.
      </p>
      <div className="grid items-end gap-3 sm:grid-cols-[180px_1fr_auto]">
        <Field label="Data">
          <Input
            type="date"
            value={f.day}
            onChange={(e) => setF({ ...f, day: e.target.value })}
          />
        </Field>
        <Field label="Nome">
          <Input
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            placeholder="Aniversário da cidade"
          />
        </Field>
        <Button
          loading={add.isPending}
          disabled={!f.day || !f.name.trim()}
          onClick={() => add.mutate(undefined)}
        >
          Adicionar
        </Button>
      </div>
    </Card>
  )
}
