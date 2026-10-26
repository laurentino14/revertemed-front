import { createFileRoute, Link } from '@tanstack/react-router'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import { OperatorSelect } from '#/features/glosas/shared'
import {
  Badge,
  Card,
  Chip,
  EmptyState,
  LinkButton,
  Table,
  Td,
  Th,
} from '#/components/ui'
import { date, daysLabel } from '#/lib/format'
import { requestStatus } from '#/lib/labels'
import { useGet } from '#/lib/query'
import type { AuthRequestView, List } from '#/lib/types'

export const Route = createFileRoute('/_app/autorizacoes/solicitacoes/')({
  head: () => ({ meta: [{ title: 'Solicitações · ReverteMed' }] }),
  component: Page,
})

const statuses = [
  'todas',
  'draft',
  'sent',
  'in_review',
  'returned',
  'authorized',
  'denied',
] as const

function Page() {
  const [f, setF] = useQueryStates({
    status: parseAsStringLiteral(statuses).withDefault('todas'),
    operator: parseAsString,
  })
  return (
    <>
      <PageHeader
        title="Solicitações de autorização"
        sub="Acompanhe cada pedido até a senha ou a negativa"
        actions={
          <LinkButton to="/autorizacoes/nova" variant="module">
            Nova solicitação
          </LinkButton>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        {statuses.map((s) => (
          <Chip
            key={s}
            active={f.status === s}
            onClick={() => void setF({ status: s })}
          >
            {s === 'todas' ? 'Todas' : requestStatus[s].label}
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
            <div className="skeleton h-64" />
          </Card>
        }
      >
        <Rows status={f.status} operator={f.operator} />
      </Boundary>
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
  const rows = useGet<List<AuthRequestView>>('/authorizations/requests', {
    status: status === 'todas' ? undefined : status,
    operator_id: operator,
  }).items
  const today = new Date(new Date().toDateString()).getTime()
  return (
    <Card flat>
      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma solicitação"
          action={
            <LinkButton to="/autorizacoes/nova" variant="module" size="sm">
              Criar a primeira
            </LinkButton>
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Pedido</Th>
              <Th>Paciente</Th>
              <Th>Procedimento</Th>
              <Th>Operadora</Th>
              <Th>Enviada em</Th>
              <Th>Prazo da operadora</Th>
              <Th>Checklist</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const open = r.status === 'sent' || r.status === 'in_review'
              const left = r.due_on
                ? Math.round((new Date(r.due_on).getTime() - today) / 86400000)
                : null
              return (
                <tr key={r.id} className="hover:bg-ink-50">
                  <Td strong>
                    <Link
                      to="/autorizacoes/solicitacoes/$id"
                      params={{ id: r.id }}
                      className="hover:text-aut"
                    >
                      #{r.number}
                    </Link>
                  </Td>
                  <Td>{r.patient_pseudonym}</Td>
                  <Td>{r.procedure_desc || r.procedure_code}</Td>
                  <Td>{r.operator_name}</Td>
                  <Td>{date(r.sent_on)}</Td>
                  <Td
                    className={
                      open && left !== null && left < 0
                        ? 'font-semibold text-danger'
                        : ''
                    }
                  >
                    {open ? `${date(r.due_on)} (${daysLabel(left)})` : '—'}
                  </Td>
                  <Td>
                    {r.docs_delivered}/{r.docs_total}
                  </Td>
                  <Td>
                    <Badge tone={requestStatus[r.status].tone}>
                      {requestStatus[r.status].label}
                    </Badge>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
    </Card>
  )
}
