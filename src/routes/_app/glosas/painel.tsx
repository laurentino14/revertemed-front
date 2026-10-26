import { createFileRoute, Link } from '@tanstack/react-router'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { Boundary } from '#/components/app/states'
import { LineChart } from '#/components/app/charts'
import { PageHeader } from '#/components/app/shell'
import {
  Badge,
  Card,
  EmptyState,
  HBar,
  Kpi,
  LinkButton,
  Select,
  Table,
  Td,
  Th,
} from '#/components/ui'
import { money, monthLabel, pct, toInputDate } from '#/lib/format'
import { useGet } from '#/lib/query'
import type { GlosasDashboard } from '#/lib/types'

export const Route = createFileRoute('/_app/glosas/painel')({
  head: () => ({ meta: [{ title: 'Painel de glosas · ReverteMed' }] }),
  component: Page,
})

const periods = ['mes', '30d', '90d', 'ano'] as const
const periodLabel = {
  mes: 'Mês atual',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  ano: 'Ano atual',
}

function range(p: (typeof periods)[number]) {
  const now = new Date()
  const to = toInputDate(now)
  const start = new Date(now)
  if (p === 'mes') start.setDate(1)
  if (p === '30d') start.setDate(start.getDate() - 30)
  if (p === '90d') start.setDate(start.getDate() - 90)
  if (p === 'ano') start.setMonth(0, 1)
  return { from: toInputDate(start), to }
}

function Page() {
  const [period, setPeriod] = useQueryState(
    'periodo',
    parseAsStringLiteral(periods).withDefault('90d'),
  )
  return (
    <>
      <PageHeader
        title="Painel de glosas"
        sub="Valores glosados, recuperados e prazos"
        actions={
          <Select
            value={period}
            onChange={(e) =>
              void setPeriod(e.target.value as (typeof periods)[number])
            }
            aria-label="Período"
            className="w-full sm:w-48"
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {periodLabel[p]}
              </option>
            ))}
          </Select>
        }
      />
      <Boundary
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Kpi key={i} label="…" value="" loading />
            ))}
          </div>
        }
      >
        <Dashboard period={period} />
      </Boundary>
    </>
  )
}

function Dashboard({ period }: { period: (typeof periods)[number] }) {
  const d = useGet<GlosasDashboard>('/glosas/dashboard', range(period))
  const maxReason = Math.max(1, ...d.top_reasons.map((r) => r.glossed_cents))
  const empty = d.billed_cents === 0
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          tone="danger"
          label="Valor glosado"
          value={money(d.glossed_cents)}
          detail={`${d.glossed_items} itens · taxa de glosa ${pct(d.gloss_rate_pct)}`}
        />
        <Kpi
          tone="success"
          label="Recuperado"
          value={money(d.recovered_cents)}
          detail={
            d.glossed_cents
              ? `${pct((d.recovered_cents / d.glossed_cents) * 100, 0)} do glosado`
              : 'Sem glosas'
          }
        />
        <Kpi
          tone="warning"
          label="Em recurso"
          value={money(d.in_appeal_cents)}
          detail={`${d.in_appeal_count} recursos em andamento`}
        />
        <Kpi
          label="A prescrever"
          value={money(d.to_prescribe_cents)}
          detail={`${d.to_prescribe_items} itens com prazo em até 14 dias`}
        />
      </div>
      {empty && (
        <Card>
          <EmptyState
            title="Ainda não há dados neste período"
            action={
              <LinkButton to="/glosas/importacao">
                Importar arquivos TISS
              </LinkButton>
            }
          >
            Importe os lotes e demonstrativos para ver quanto sua clínica está
            perdendo.
          </EmptyState>
        </Card>
      )}
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card title="Evolução mensal (R$)">
          <LineChart
            labels={d.series.map((s) => monthLabel(s.month))}
            series={[
              {
                label: 'Glosado',
                color: '#DC2626',
                points: d.series.map((s) => s.glossed_cents),
              },
              {
                label: 'Recuperado',
                color: '#16A34A',
                area: true,
                points: d.series.map((s) => s.recovered_cents),
              },
            ]}
          />
        </Card>
        <Card title="Principais motivos de glosa">
          {d.top_reasons.length === 0 ? (
            <p className="text-ink-500">Nenhuma glosa registrada.</p>
          ) : (
            d.top_reasons.map((r, i) => (
              <HBar
                key={r.reason}
                label={r.reason}
                value={money(r.glossed_cents)}
                pct={(r.glossed_cents / maxReason) * 100}
                color={
                  [
                    'bg-danger',
                    'bg-warning',
                    'bg-aut',
                    'bg-info',
                    'bg-ink-400',
                  ][i]
                }
              />
            ))
          )}
        </Card>
      </div>
      <Card
        title="Glosa por operadora"
        flat
        right={<Badge tone="success">Dados do período</Badge>}
      >
        <Table>
          <thead>
            <tr>
              <Th>Operadora</Th>
              <Th right>Faturado</Th>
              <Th right>Glosado</Th>
              <Th right>Taxa</Th>
              <Th right>Recuperado</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {d.by_operator.map((o) => (
              <tr key={o.operator_id}>
                <Td strong>{o.operator_name}</Td>
                <Td right>{money(o.billed_cents)}</Td>
                <Td right className="font-semibold text-danger">
                  {money(o.glossed_cents)}
                </Td>
                <Td right>
                  {pct(
                    o.billed_cents
                      ? (o.glossed_cents / o.billed_cents) * 100
                      : 0,
                  )}
                </Td>
                <Td right>{money(o.recovered_cents)}</Td>
                <Td right>
                  <Link
                    to="/glosas/conciliacao"
                    search={{ operator: o.operator_id } as never}
                    className="font-semibold text-brand-600"
                  >
                    Ver itens
                  </Link>
                </Td>
              </tr>
            ))}
            {d.by_operator.length === 0 && (
              <tr>
                <Td colSpan={6}>
                  <EmptyState title="Sem operadoras no período" />
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </>
  )
}
