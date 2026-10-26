import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ChevronRight,
  Clock,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import { LineChart } from '#/components/app/charts'
import { Badge, Card, LinkButton, MODULES, ModuleMark } from '#/components/ui'
import type { ModuleKey } from '#/components/ui'
import { money, monthLabel, plural } from '#/lib/format'
import { useGet } from '#/lib/query'
import type { AuthDashboard, GlosasDashboard, RecvDashboard } from '#/lib/types'
import { useAuth } from '#/stores/auth'

export const Route = createFileRoute('/_app/home')({
  head: () => ({ meta: [{ title: 'Visão geral · ReverteMed' }] }),
  component: Home,
})

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

function Home() {
  const me = useAuth((s) => s.me)
  return (
    <>
      <PageHeader
        title={`${greeting()}, ${me?.user.name.split(' ')[0]}`}
        sub={`Resumo do mês · ${me?.organization.name}`}
        actions={
          <LinkButton to="/glosas/importacao">
            <Upload className="size-4" />
            Importar arquivos
          </LinkButton>
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Boundary>
          <GlosasCard />
        </Boundary>
        <Boundary>
          <AuthCard />
        </Boundary>
        <Boundary>
          <RecvCard />
        </Boundary>
      </div>
      <Boundary>
        <Priorities />
      </Boundary>
    </>
  )
}

function ModuleCard({
  module,
  value,
  caption,
  alert,
  tone,
  to,
  valueClass,
}: {
  module: ModuleKey
  value: string
  caption: string
  alert: string
  tone: 'warning' | 'danger' | 'neutral'
  to: string
  valueClass?: string
}) {
  return (
    <article className="flex flex-col gap-3.5 rounded-[20px] border border-ink-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <ModuleMark module={module} />
        <Badge tone="success">Ativo</Badge>
      </div>
      <h2 className="font-display text-xl font-extrabold">
        {MODULES[module].name}
      </h2>
      <span
        className={`num font-display text-[34px] font-extrabold tracking-[-0.04em] ${valueClass ?? ''}`}
      >
        {value}
      </span>
      <span className="text-[13px] text-ink-500">{caption}</span>
      <div
        className={`flex items-center gap-2 rounded-[10px] p-3 text-xs font-medium ${tone === 'neutral' ? 'bg-ink-100' : tone === 'danger' ? 'bg-danger-bg' : 'bg-warning-bg'}`}
      >
        <Clock className="size-4" />
        {alert}
      </div>
      <LinkButton to={to}>Abrir módulo</LinkButton>
    </article>
  )
}

function GlosasCard() {
  const d = useGet<GlosasDashboard>('/glosas/dashboard')
  return (
    <ModuleCard
      module="glosas"
      value={money(d.recovered_cents)}
      valueClass="text-success"
      caption="recuperados no mês"
      alert={
        d.to_prescribe_items > 0
          ? `${plural(d.to_prescribe_items, 'item', 'itens')} (${money(d.to_prescribe_cents)}) ${d.to_prescribe_items === 1 ? 'prescreve' : 'prescrevem'} em 14 dias`
          : `${plural(d.in_appeal_count, 'recurso', 'recursos')} em andamento`
      }
      tone={d.to_prescribe_items > 0 ? 'warning' : 'neutral'}
      to="/glosas/painel"
    />
  )
}
function AuthCard() {
  const d = useGet<AuthDashboard>('/authorizations/dashboard')
  return (
    <ModuleCard
      module="aut"
      value={String(d.open_requests)}
      caption="solicitações em análise"
      alert={
        d.expiring_passwords_7d > 0
          ? d.expiring_passwords_7d === 1
            ? '1 senha vence em 7 dias'
            : `${d.expiring_passwords_7d} senhas vencem em 7 dias`
          : 'Nenhuma senha vencendo esta semana'
      }
      tone={d.expiring_passwords_7d > 0 ? 'warning' : 'neutral'}
      to="/autorizacoes/painel"
    />
  )
}
function RecvCard() {
  const d = useGet<RecvDashboard>('/receivables/dashboard')
  return (
    <ModuleCard
      module="rec"
      value={money(d.forecast_30d_cents)}
      caption="previstos nos próximos 30 dias"
      alert={
        d.overdue_cents > 0
          ? `${money(d.overdue_cents)} em atraso`
          : 'Nada em atraso'
      }
      tone={d.overdue_cents > 0 ? 'danger' : 'neutral'}
      to="/recebiveis/caixa"
    />
  )
}

function Priorities() {
  const g = useGet<GlosasDashboard>('/glosas/dashboard')
  const a = useGet<AuthDashboard>('/authorizations/dashboard')
  const r = useGet<RecvDashboard>('/receivables/dashboard')
  const items: {
    icon: typeof Clock
    text: string
    tag: string
    tone: 'warning' | 'info' | 'brand' | 'danger'
    to: string
  }[] = []
  if (g.to_prescribe_items)
    items.push({
      icon: Clock,
      text: `${g.to_prescribe_items} itens glosados prescrevem em até 14 dias`,
      tag: 'Glosas',
      tone: 'warning',
      to: '/glosas/conciliacao',
    })
  if (g.in_appeal_count)
    items.push({
      icon: Sparkles,
      text: `${g.in_appeal_count} recursos aguardando andamento`,
      tag: 'Glosas',
      tone: 'brand',
      to: '/glosas/recursos',
    })
  if (a.deadlines_at_risk.length)
    items.push({
      icon: ShieldCheck,
      text: `${a.deadlines_at_risk.length} autorizações com prazo da operadora em risco`,
      tag: 'Autorizações',
      tone: 'danger',
      to: '/autorizacoes/solicitacoes',
    })
  if (a.expiring_passwords_7d)
    items.push({
      icon: Clock,
      text:
        a.expiring_passwords_7d === 1
          ? '1 senha vence em 7 dias'
          : `${a.expiring_passwords_7d} senhas vencem em 7 dias`,
      tag: 'Autorizações',
      tone: 'warning',
      to: '/autorizacoes/senhas',
    })
  if (r.overdue_cents)
    items.push({
      icon: Clock,
      text: `${money(r.overdue_cents)} em atraso em ${r.overdue_operators} operadora(s)`,
      tag: 'Recebíveis',
      tone: 'danger',
      to: '/recebiveis/cobrancas',
    })
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <Card title="Prioridades de hoje">
        {items.length === 0 ? (
          <p className="py-6 text-center text-ink-500">
            Tudo em dia. Importe novos arquivos para atualizar o painel.
          </p>
        ) : (
          <ul className="flex flex-col">
            {items.map((it) => (
              <li
                key={it.text}
                className="border-t border-ink-100 first:border-0"
              >
                <Link
                  to={it.to}
                  className="flex items-center gap-3 py-3 hover:bg-ink-50"
                >
                  <span className="grid size-9 place-items-center rounded-[10px] bg-ink-100">
                    <it.icon className="size-[18px] text-ink-700" />
                  </span>
                  <span className="flex-1 font-medium">{it.text}</span>
                  <Badge tone={it.tone}>{it.tag}</Badge>
                  <ChevronRight className="size-4 text-ink-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Valor recuperado">
        <span className="num font-display text-[40px] font-extrabold tracking-[-0.04em] text-success">
          {money(g.recovered_cents)}
        </span>
        <span className="text-[13px] text-ink-500">
          {g.glossed_cents
            ? `${Math.round((g.recovered_cents / g.glossed_cents) * 100)}% do valor glosado no período`
            : 'Sem glosas no período'}
        </span>
        <LineChart
          height={120}
          labels={g.series.map((s) => monthLabel(s.month))}
          series={[
            {
              label: 'Recuperado',
              color: '#16A34A',
              area: true,
              points: g.series.map((s) => s.recovered_cents),
            },
          ]}
        />
      </Card>
    </div>
  )
}
