import { createFileRoute } from '@tanstack/react-router'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import { OperatorSelect } from '#/features/glosas/shared'
import {
  Alert,
  Badge,
  Card,
  Chip,
  EmptyState,
  Table,
  Td,
  Th,
} from '#/components/ui'
import { date, money } from '#/lib/format'
import { receivableStatus } from '#/lib/labels'
import { useGet } from '#/lib/query'
import type { List, ReceivableView } from '#/lib/types'

export const Route = createFileRoute('/_app/recebiveis/agenda')({
  head: () => ({ meta: [{ title: 'Agenda de recebíveis · ReverteMed' }] }),
  component: Page,
})

const statuses = [
  'todos',
  'in_review',
  'with_statement',
  'overdue',
  'partial',
  'paid',
] as const

function Page() {
  const [f, setF] = useQueryStates({
    status: parseAsStringLiteral(statuses).withDefault('todos'),
    operator: parseAsString,
  })
  return (
    <>
      <PageHeader
        title="Agenda de recebíveis"
        sub="Cada lote enviado, com prazo e valor previsto"
      />
      <div className="flex flex-wrap items-center gap-2">
        {statuses.map((s) => (
          <Chip
            key={s}
            active={f.status === s}
            onClick={() => void setF({ status: s })}
          >
            {s === 'todos' ? 'Todos' : receivableStatus[s].label}
          </Chip>
        ))}
        <Boundary fallback={<div className="skeleton h-10 w-48" />}>
          <OperatorSelect
            value={f.operator}
            onChange={(v) => void setF({ operator: v })}
            className="w-full py-2 text-[13px] sm:w-52"
          />
        </Boundary>
      </div>
      <Boundary
        fallback={
          <Card>
            <div className="skeleton h-72" />
          </Card>
        }
      >
        <Rows status={f.status} operator={f.operator} />
      </Boundary>
      <Alert tone="brand">
        Os dados vêm direto dos módulos de <b>Glosas</b> e <b>Autorizações</b>,
        sem digitação extra.
      </Alert>
    </>
  )
}

function Rows({
  status,
  operator,
}: {
  status: (typeof statuses)[number]
  operator: string | null
}) {
  const rows = useGet<List<ReceivableView>>('/receivables', {
    status: status === 'todos' ? undefined : status,
    operator_id: operator,
  }).items
  return (
    <Card flat>
      {rows.length === 0 ? (
        <EmptyState title="Nenhum recebível">
          Importe lotes TISS para gerar a agenda.
        </EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Lote</Th>
              <Th>Operadora</Th>
              <Th>Enviado em</Th>
              <Th right>Faturado</Th>
              <Th right>Prazo</Th>
              <Th>Previsto</Th>
              <Th right>Recebido</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-ink-50">
                <Td strong>{r.batch_number}</Td>
                <Td>{r.operator_name}</Td>
                <Td>{date(r.sent_on)}</Td>
                <Td right>{money(r.billed_cents)}</Td>
                <Td right>{r.term_days} dias</Td>
                <Td>
                  ~{date(r.expected_on)} · {money(r.expected_cents)}
                </Td>
                <Td right>{r.paid_cents ? money(r.paid_cents) : '—'}</Td>
                <Td>
                  <Badge tone={receivableStatus[r.status].tone}>
                    {receivableStatus[r.status].label}
                  </Badge>
                  {r.days_overdue > 0 && (
                    <span className="ml-2 text-xs font-semibold text-danger">
                      +{r.days_overdue} d
                    </span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  )
}
