import { createFileRoute, Link } from '@tanstack/react-router'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { Sparkles } from 'lucide-react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  Table,
  Tabs,
  Td,
  Th,
} from '#/components/ui'
import { money } from '#/lib/format'
import { appealStatus, category } from '#/lib/labels'
import { useGet } from '#/lib/query'
import type { AppealStatus, AppealView, List } from '#/lib/types'

export const Route = createFileRoute('/_app/glosas/recursos/')({
  head: () => ({ meta: [{ title: 'Recursos · ReverteMed' }] }),
  component: Page,
})

const tabs = [
  'pendentes',
  'aprovados',
  'enviados',
  'resultados',
  'descartados',
] as const
const groups: Record<(typeof tabs)[number], AppealStatus[]> = {
  pendentes: ['draft', 'awaiting_approval'],
  aprovados: ['approved'],
  enviados: ['submitted'],
  resultados: ['recovered', 'partially_recovered', 'denied'],
  descartados: ['discarded'],
}
const tabLabel = {
  pendentes: 'Para revisar',
  aprovados: 'Aprovados',
  enviados: 'Enviados',
  resultados: 'Resultados',
  descartados: 'Descartados',
}

function Page() {
  return (
    <>
      <PageHeader
        title="Recursos de glosa"
        sub="Fila de trabalho do faturista"
      />
      <Alert tone="brand">
        <Sparkles className="mr-1 inline size-4" />
        Todo recurso passa por <b>revisão e aprovação humana</b> antes de ser
        marcado como enviado. Os rascunhos usam apenas dados do item e as regras
        confirmadas do contrato.
      </Alert>
      <Boundary
        fallback={
          <Card>
            <div className="skeleton h-72" />
          </Card>
        }
      >
        <Queue />
      </Boundary>
    </>
  )
}

function Queue() {
  const [tab, setTab] = useQueryState(
    'aba',
    parseAsStringLiteral(tabs).withDefault('pendentes'),
  )
  const all = useGet<List<AppealView>>('/glosas/appeals').items
  const rows = all.filter((a) => groups[tab].includes(a.status))
  const count = (t: (typeof tabs)[number]) =>
    all.filter((a) => groups[t].includes(a.status)).length
  return (
    <>
      <Tabs
        value={tab}
        onChange={(v) => void setTab(v)}
        items={tabs.map((t) => ({
          value: t,
          label: tabLabel[t],
          count: count(t),
        }))}
      />
      <Card flat>
        {rows.length === 0 ? (
          <EmptyState title="Nada por aqui">
            Abra recursos a partir da{' '}
            <Link
              to="/glosas/conciliacao"
              className="font-semibold text-brand-600"
            >
              Conciliação
            </Link>
            .
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Item glosado</Th>
                <Th>Operadora</Th>
                <Th>Motivo</Th>
                <Th right>Valor</Th>
                <Th>Prazo</Th>
                <Th>Origem</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-ink-50">
                  <Td strong>
                    <Link
                      to="/glosas/recursos/$id"
                      params={{ id: a.id }}
                      className="text-ink-900 hover:text-brand-700"
                    >
                      Guia {a.guide_number} · {a.description || a.tuss_code}
                    </Link>
                  </Td>
                  <Td>{a.operator_name}</Td>
                  <Td>{category[a.classification] ?? a.gloss_reason}</Td>
                  <Td right>{money(a.glossed_cents)}</Td>
                  <Td>
                    {a.due_on
                      ? new Date(a.due_on).toLocaleDateString('pt-BR', {
                          timeZone: 'UTC',
                        })
                      : '—'}
                  </Td>
                  <Td>
                    {a.ai_generated ? (
                      <Badge tone="info">IA</Badge>
                    ) : (
                      <Badge tone="neutral">Modelo</Badge>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={appealStatus[a.status].tone}>
                      {appealStatus[a.status].label}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}
