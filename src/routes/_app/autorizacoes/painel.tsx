import { createFileRoute, Link } from '@tanstack/react-router'
import { Clock } from 'lucide-react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  HBar,
  Kpi,
  LinkButton,
} from '#/components/ui'
import { date } from '#/lib/format'
import { useGet } from '#/lib/query'
import type { AuthDashboard } from '#/lib/types'

export const Route = createFileRoute('/_app/autorizacoes/painel')({
  head: () => ({ meta: [{ title: 'Autorizações · ReverteMed' }] }),
  component: Page,
})

function Page() {
  return (
    <>
      <PageHeader
        title="Painel de autorizações"
        sub="Prazos da operadora, devoluções e senhas"
        actions={
          <LinkButton to="/autorizacoes/nova" variant="module">
            Nova solicitação
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
  const d = useGet<AuthDashboard>('/authorizations/dashboard')
  const max = Math.max(1, ...d.by_operator.map((o) => o.avg_response_days))
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Tempo médio de resposta"
          value={`${d.avg_response_days.toFixed(1).replace('.', ',')} dias`}
          detail="meta regulatória: até 5 dias úteis"
          tone={d.avg_response_days > 5 ? 'danger' : undefined}
        />
        <Kpi
          tone="warning"
          label="Pedidos devolvidos"
          value={`${d.returned_pct.toFixed(0)}%`}
          detail="por documentação incompleta"
        />
        <Kpi
          tone="danger"
          label="Senhas a vencer"
          value={String(d.expiring_passwords_7d)}
          detail="nos próximos 7 dias"
        />
        <Kpi
          tone="aut"
          label="Autorizados sem agenda"
          value={String(d.authorized_not_scheduled)}
          detail="pacientes aguardando contato"
        />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_400px]">
        <Card title="Prazos em risco">
          {d.deadlines_at_risk.length === 0 ? (
            <EmptyState title="Nenhum prazo em risco">
              Todas as solicitações enviadas estão dentro do prazo da operadora.
            </EmptyState>
          ) : (
            d.deadlines_at_risk.map((r) => {
              const overdue =
                r.due_on &&
                new Date(r.due_on) < new Date(new Date().toDateString())
              return (
                <Link
                  key={r.id}
                  to="/autorizacoes/solicitacoes/$id"
                  params={{ id: r.id }}
                  className="flex items-center gap-3 border-t border-ink-100 py-3 first:border-0 hover:bg-ink-50"
                >
                  <span className="grid size-9 place-items-center rounded-[10px] bg-aut-bg">
                    <Clock className="size-[18px] text-aut" />
                  </span>
                  <div className="flex-1">
                    <b className="text-[13px]">
                      #{r.number} · {r.procedure_desc || r.procedure_code}
                    </b>
                    <div className="text-xs text-ink-500">
                      {r.operator_name} · prazo da operadora {date(r.due_on)}
                    </div>
                  </div>
                  <Badge tone={overdue ? 'danger' : 'warning'}>
                    {overdue ? 'Vencido' : 'Perto do prazo'}
                  </Badge>
                </Link>
              )
            })
          )}
        </Card>
        <Card title="Resposta média por operadora">
          {d.by_operator.length === 0 ? (
            <p className="text-ink-500">Sem respostas registradas ainda.</p>
          ) : (
            d.by_operator.map((o) => (
              <HBar
                key={o.operator_id}
                label={o.operator_name}
                value={`${o.avg_response_days.toFixed(1).replace('.', ',')} dias`}
                pct={(o.avg_response_days / max) * 100}
                color={o.avg_response_days > 5 ? 'bg-danger' : 'bg-aut'}
              />
            ))
          )}
        </Card>
      </div>
      <Alert tone="indigo">
        Prazos calculados em{' '}
        <b>
          dias úteis, com feriados nacionais e os cadastrados em Configurações
        </b>
        . Regra da RN 395: até 5 dias úteis; alta complexidade e internação
        eletiva, até 10; urgência e emergência, resposta imediata.
      </Alert>
    </>
  )
}
