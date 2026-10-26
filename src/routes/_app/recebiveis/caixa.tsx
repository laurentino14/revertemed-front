import { createFileRoute, Link } from '@tanstack/react-router'
import { Boundary } from '#/components/app/states'
import { WeekBars } from '#/components/app/charts'
import { PageHeader } from '#/components/app/shell'
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  Kpi,
  LinkButton,
  Table,
  Td,
  Th,
} from '#/components/ui'
import { money, pct } from '#/lib/format'
import { useGet } from '#/lib/query'
import type { RecvDashboard } from '#/lib/types'

export const Route = createFileRoute('/_app/recebiveis/caixa')({
  head: () => ({ meta: [{ title: 'Caixa · ReverteMed' }] }),
  component: Page,
})

function Page() {
  return (
    <>
      <PageHeader
        title="Painel de caixa"
        sub="Quanto e quando você vai receber de cada operadora"
        actions={
          <LinkButton to="/recebiveis/antecipacao" variant="module">
            Simular antecipação
          </LinkButton>
        }
      />
      <Boundary fallback={<div className="skeleton h-96" />}>
        <Dashboard />
      </Boundary>
    </>
  )
}

function Dashboard() {
  const d = useGet<RecvDashboard>('/receivables/dashboard')
  const empty =
    d.weeks.every((w) => w.expected_cents === 0) && d.overdue_cents === 0
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          tone="rec"
          label="Previsto · 30 dias"
          value={money(d.forecast_30d_cents)}
          detail={`margem de erro ±${pct(d.margin_pct, 0)}`}
        />
        <Kpi
          tone="danger"
          label="Em atraso"
          value={money(d.overdue_cents)}
          detail={`${d.overdue_operators} operadora(s)`}
        />
        <Kpi
          label="Prazo médio real"
          value={
            d.avg_real_lag_days ? `${d.avg_real_lag_days.toFixed(0)} dias` : '—'
          }
          detail={
            d.avg_contract_term_days
              ? `contratual: ${d.avg_contract_term_days.toFixed(0)} dias`
              : 'sem histórico de pagamentos'
          }
        />
        <Kpi
          tone="success"
          label="Antecipável"
          value={money(d.advanceable_cents)}
          detail="sem atraso nem pagamento parcial"
        />
      </div>
      <Card
        title="Previsão de caixa · próximas 8 semanas"
        right={<Badge tone="amber">Média por operadora</Badge>}
      >
        {empty ? (
          <EmptyState
            title="Sem recebíveis em aberto"
            action={
              <LinkButton to="/glosas/importacao" variant="module" size="sm">
                Importar lotes TISS
              </LinkButton>
            }
          >
            Os recebíveis nascem dos lotes importados no módulo de Glosas, sem
            digitação extra.
          </EmptyState>
        ) : (
          <WeekBars
            weeks={d.weeks.map((w) => ({
              label: new Date(w.week_start).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                timeZone: 'UTC',
              }),
              value: w.expected_cents,
              low: w.low_cents,
              high: w.high_cents,
            }))}
          />
        )}
        <Alert tone="info">
          A previsão usa o prazo real e o percentual pago de cada operadora
          (histórico de pagamentos). Sem histórico suficiente, usa o prazo
          contratual e mostra uma margem de erro maior. A linha vertical indica
          a margem de erro.
        </Alert>
      </Card>
      <Card
        title="Atrasos por operadora"
        flat
        right={
          <Link
            to="/recebiveis/cobrancas"
            className="text-[13px] font-semibold text-rec"
          >
            Ver cobranças
          </Link>
        }
      >
        {d.overdue_by_operator.length === 0 ? (
          <EmptyState title="Nada em atraso" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Operadora</Th>
                <Th right>Em atraso</Th>
                <Th right>Maior atraso</Th>
                <Th right>Prazo contratual</Th>
                <Th right>Prazo real médio</Th>
              </tr>
            </thead>
            <tbody>
              {d.overdue_by_operator.map((o) => (
                <tr key={o.operator_id}>
                  <Td strong>{o.operator_name}</Td>
                  <Td right className="font-semibold text-danger">
                    {money(o.overdue_cents)}
                  </Td>
                  <Td right>+{o.max_days_late} dias</Td>
                  <Td right>{o.term_days} dias</Td>
                  <Td right>
                    {o.avg_real_lag_days
                      ? `${o.avg_real_lag_days.toFixed(0)} dias`
                      : '—'}
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
