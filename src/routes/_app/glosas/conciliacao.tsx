import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import { OperatorSelect } from '#/features/glosas/shared'
import {
  Alert,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Input,
  Kpi,
  Table,
  Td,
  Th,
} from '#/components/ui'
import { api } from '#/lib/api'
import { daysLabel, money } from '#/lib/format'
import { appealStatus, itemStatus } from '#/lib/labels'
import { useAct, useGet } from '#/lib/query'
import type { Appeal, AppealStatus, ItemRow } from '#/lib/types'

export const Route = createFileRoute('/_app/glosas/conciliacao')({
  head: () => ({ meta: [{ title: 'Conciliação · ReverteMed' }] }),
  component: Page,
})

const statuses = ['todos', 'paid', 'partial', 'total', 'pending'] as const
const statusLabel = {
  todos: 'Todos',
  paid: 'Pago',
  partial: 'Glosa parcial',
  total: 'Glosa total',
  pending: 'Pendente',
}
const PAGE = 25

function Page() {
  const [f, setF] = useQueryStates({
    status: parseAsStringLiteral(statuses).withDefault('todos'),
    q: parseAsString.withDefault(''),
    operator: parseAsString,
    page: parseAsInteger.withDefault(0),
  })
  return (
    <>
      <PageHeader
        title="Conciliação item a item"
        sub="O que foi cobrado × o que foi pago × o que foi glosado"
      />
      <div className="flex flex-wrap items-center gap-2">
        {statuses.map((s) => (
          <Chip
            key={s}
            active={f.status === s}
            onClick={() => void setF({ status: s, page: 0 })}
          >
            {statusLabel[s]}
          </Chip>
        ))}
        <Input
          value={f.q}
          onChange={(e) => void setF({ q: e.target.value || null, page: 0 })}
          placeholder="Guia, TUSS ou procedimento"
          className="w-full py-2 text-[13px] sm:w-64"
          aria-label="Buscar"
        />
        <Boundary fallback={<div className="skeleton h-10 w-48" />}>
          <OperatorSelect
            value={f.operator}
            onChange={(v) => void setF({ operator: v, page: 0 })}
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
        <Items
          status={f.status}
          q={f.q}
          operator={f.operator}
          page={f.page}
          setPage={(p) => void setF({ page: p })}
        />
      </Boundary>
      <Alert tone="brand">
        Itens glosados são ordenados por prazo e valor e alimentam a fila de{' '}
        <Link to="/glosas/recursos" className="font-semibold underline">
          Recursos
        </Link>
        .
      </Alert>
    </>
  )
}

function Items({
  status,
  q,
  operator,
  page,
  setPage,
}: {
  status: (typeof statuses)[number]
  q: string
  operator: string | null
  page: number
  setPage: (p: number) => void
}) {
  const navigate = useNavigate()
  const data = useGet<{ items: ItemRow[]; total: number }>('/glosas/items', {
    status: status === 'todos' ? undefined : status,
    q,
    operator_id: operator,
    limit: PAGE,
    offset: page * PAGE,
  })
  const open = useAct(
    (itemId: string) =>
      api<Appeal>('/glosas/appeals', { body: { item_id: itemId } }),
    {
      invalidate: ['/glosas'],
      success: 'Recurso criado. Revise o rascunho antes de aprovar.',
      onSuccess: (a) =>
        void navigate({ to: '/glosas/recursos/$id', params: { id: a.id } }),
    },
  )
  const cobrado = data.items.reduce((s, i) => s + i.billed_cents, 0)
  const pago = data.items.reduce((s, i) => s + (i.paid_cents ?? 0), 0)
  const glosado = data.items.reduce(
    (s, i) =>
      s +
      (i.status === 'partial' || i.status === 'total' ? i.glossed_cents : 0),
    0,
  )
  const pages = Math.ceil(data.total / PAGE)
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Itens"
          value={String(data.total)}
          detail="no filtro atual"
        />
        <Kpi
          tone="success"
          label="Cobrado (nesta página)"
          value={money(cobrado)}
          detail=""
        />
        <Kpi
          tone="success"
          label="Pago"
          value={money(pago)}
          detail={
            cobrado ? `${Math.round((pago / cobrado) * 100)}% do cobrado` : ''
          }
        />
        <Kpi
          tone="danger"
          label="Glosado"
          value={money(glosado)}
          detail="itens glosados"
        />
      </div>
      <Card flat>
        {data.items.length === 0 ? (
          <EmptyState title="Nenhum item encontrado">
            Ajuste os filtros ou importe novos arquivos TISS.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Guia</Th>
                <Th className="hidden 2xl:table-cell">TUSS</Th>
                <Th>Procedimento</Th>
                <Th className="hidden xl:table-cell">Operadora</Th>
                <Th right>Cobrado</Th>
                <Th right>Pago</Th>
                <Th right>Glosado</Th>
                <Th>Status</Th>
                <Th>Prazo recurso</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((i) => {
                const glossed = i.status === 'partial' || i.status === 'total'
                return (
                  <tr key={i.id} className="hover:bg-ink-50">
                    <Td strong>{i.guide_number}</Td>
                    <Td className="hidden 2xl:table-cell">{i.tuss_code}</Td>
                    <Td className="max-w-44 truncate">{i.description}</Td>
                    <Td className="hidden xl:table-cell">{i.operator_name}</Td>
                    <Td right>{money(i.billed_cents)}</Td>
                    <Td right>
                      {i.paid_cents === null ? '—' : money(i.paid_cents)}
                    </Td>
                    <Td
                      right
                      className={glossed ? 'font-semibold text-danger' : ''}
                    >
                      {glossed ? money(i.glossed_cents) : '—'}
                    </Td>
                    <Td>
                      <Badge tone={itemStatus[i.status].tone}>
                        {itemStatus[i.status].label}
                      </Badge>
                    </Td>
                    <Td>{glossed ? daysLabel(i.days_left) : '—'}</Td>
                    <Td right>
                      {glossed &&
                        (i.appeal_status ? (
                          <Badge
                            tone={
                              appealStatus[i.appeal_status as AppealStatus]
                                ?.tone ?? 'neutral'
                            }
                          >
                            {appealStatus[i.appeal_status as AppealStatus]
                              ?.label ?? i.appeal_status}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={open.isPending && open.variables === i.id}
                            onClick={() => open.mutate(i.id)}
                          >
                            Recorrer
                          </Button>
                        ))}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>
      {pages > 1 && (
        <div className="flex items-center justify-between text-[13px] text-ink-500">
          <span>
            Página {page + 1} de {pages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page + 1 >= pages}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
