import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { parseAsStringLiteral, useQueryStates } from 'nuqs'
import { useState } from 'react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import {
  Alert,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Input,
  Kpi,
  Progress,
  Table,
  Td,
  Th,
} from '#/components/ui'
import { api } from '#/lib/api'
import { date, toInputDate } from '#/lib/format'
import { useAct, useGet } from '#/lib/query'
import type { List, PasswordView } from '#/lib/types'

export const Route = createFileRoute('/_app/autorizacoes/senhas')({
  head: () => ({ meta: [{ title: 'Senhas · ReverteMed' }] }),
  component: Page,
})

const views = ['ativas', 'vencendo', 'todas'] as const

function Page() {
  const [f, setF] = useQueryStates({
    ver: parseAsStringLiteral(views).withDefault('ativas'),
  })
  return (
    <>
      <PageHeader
        title="Gestão de senhas"
        sub="Validade, quantidades autorizadas e sessões realizadas"
      />
      <div className="flex gap-2">
        {views.map((v) => (
          <Chip
            key={v}
            active={f.ver === v}
            onClick={() => void setF({ ver: v })}
          >
            {
              {
                ativas: 'Vigentes',
                vencendo: 'Vencem em 7 dias',
                todas: 'Todas',
              }[v]
            }
          </Chip>
        ))}
      </div>
      <Boundary fallback={<div className="skeleton h-80" />}>
        <Passwords view={f.ver} />
      </Boundary>
      <Boundary fallback={null}>
        <Checker />
      </Boundary>
    </>
  )
}

function Passwords({ view }: { view: (typeof views)[number] }) {
  const navigate = useNavigate()
  const rows = useGet<List<PasswordView>>('/authorizations/passwords', {
    only_active: view === 'ativas',
    expiring_in_days: view === 'vencendo' ? 7 : undefined,
  }).items
  const today = new Date(new Date().toDateString()).getTime()
  const usage = useAct(
    (p: PasswordView) =>
      api(`/authorizations/passwords/${p.id}/usage`, { body: { quantity: 1 } }),
    { invalidate: ['/authorizations'], success: 'Sessão registrada' },
  )
  const ext = useAct(
    (p: PasswordView) =>
      api<{ id: string }>(`/authorizations/passwords/${p.id}/extension`, {
        method: 'POST',
      }),
    {
      invalidate: ['/authorizations'],
      success: 'Rascunho de prorrogação criado',
      onSuccess: (r) =>
        void navigate({
          to: '/autorizacoes/solicitacoes/$id',
          params: { id: r.id },
        }),
    },
  )
  const expiring = rows.filter(
    (r) =>
      new Date(r.valid_until).getTime() - today <= 7 * 864e5 &&
      new Date(r.valid_until).getTime() >= today,
  ).length
  const nearLimit = rows.filter(
    (r) =>
      r.qty_used / r.qty_authorized >= 0.9 && r.qty_used < r.qty_authorized,
  ).length
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi
          label="Senhas listadas"
          value={String(rows.length)}
          detail="no filtro atual"
          tone="aut"
        />
        <Kpi
          tone="danger"
          label="Vencem em 7 dias"
          value={String(expiring)}
          detail="avise o paciente"
        />
        <Kpi
          tone="warning"
          label="Quase no limite"
          value={String(nearLimit)}
          detail="90% das sessões usadas"
        />
      </div>
      <Card flat>
        {rows.length === 0 ? (
          <EmptyState title="Nenhuma senha neste filtro">
            As senhas aparecem quando você registra uma autorização em uma
            solicitação.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Senha</Th>
                <Th>Paciente</Th>
                <Th>Procedimento</Th>
                <Th>Operadora</Th>
                <Th>Sessões</Th>
                <Th>Validade</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const left = Math.round(
                  (new Date(p.valid_until).getTime() - today) / 864e5,
                )
                const expired = left < 0
                const used = p.qty_used >= p.qty_authorized
                return (
                  <tr key={p.id}>
                    <Td strong>{p.password}</Td>
                    <Td>{p.patient_pseudonym}</Td>
                    <Td>{p.procedure_desc}</Td>
                    <Td>{p.operator_name}</Td>
                    <Td className="min-w-40">
                      <div className="mb-1 text-xs font-semibold">
                        {p.qty_used} de {p.qty_authorized}
                      </div>
                      <Progress
                        value={(p.qty_used / p.qty_authorized) * 100}
                        color="bg-aut"
                      />
                    </Td>
                    <Td>
                      {date(p.valid_until)}{' '}
                      {expired ? (
                        <Badge tone="danger">Vencida</Badge>
                      ) : used ? (
                        <Badge tone="neutral">Concluída</Badge>
                      ) : left <= 7 ? (
                        <Badge tone="warning">{left} dias</Badge>
                      ) : null}
                    </Td>
                    <Td right>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={expired || used}
                          loading={
                            usage.isPending && usage.variables?.id === p.id
                          }
                          onClick={() => usage.mutate(p)}
                        >
                          + 1 sessão
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={ext.isPending && ext.variables?.id === p.id}
                          onClick={() => ext.mutate(p)}
                        >
                          Prorrogar
                        </Button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}

function Checker() {
  const [q, setQ] = useState({
    password: '',
    date: toInputDate(new Date()),
    quantity: 1,
  })
  const [res, setRes] = useState<{
    allowed: boolean
    reason: string
    remaining: number
  } | null>(null)
  const check = useAct(
    () =>
      api<{ allowed: boolean; reason: string; remaining: number }>(
        '/authorizations/passwords/check',
        { query: q },
      ),
    {
      onSuccess: setRes,
    },
  )
  return (
    <Card title="Conferir antes de agendar">
      <p className="text-[13px] text-ink-500">
        Use ao marcar o paciente: o sistema impede agendamentos fora da validade
        da senha ou além das sessões autorizadas.
      </p>
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_180px_120px_auto]">
        <Field label="Senha">
          <Input
            value={q.password}
            onChange={(e) => setQ({ ...q, password: e.target.value })}
          />
        </Field>
        <Field label="Data">
          <Input
            type="date"
            value={q.date}
            onChange={(e) => setQ({ ...q, date: e.target.value })}
          />
        </Field>
        <Field label="Sessões">
          <Input
            type="number"
            min={1}
            value={q.quantity}
            onChange={(e) => setQ({ ...q, quantity: Number(e.target.value) })}
          />
        </Field>
        <Button
          variant="module"
          loading={check.isPending}
          disabled={!q.password}
          onClick={() => {
            setRes(null)
            check.mutate(undefined)
          }}
        >
          Conferir
        </Button>
      </div>
      {res && (
        <Alert tone={res.allowed ? 'success' : 'danger'}>
          {res.allowed
            ? `Pode agendar. Restam ${res.remaining} sessões.`
            : res.reason}
        </Alert>
      )}
    </Card>
  )
}
