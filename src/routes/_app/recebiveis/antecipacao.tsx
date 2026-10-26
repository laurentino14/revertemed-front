import { createFileRoute } from '@tanstack/react-router'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import { ShieldAlert } from 'lucide-react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Table,
  Td,
  Th,
} from '#/components/ui'
import { api } from '#/lib/api'
import { date, money, pct } from '#/lib/format'
import { useAct, useGet } from '#/lib/query'
import { useAuth } from '#/stores/auth'
import type { Advance, List, ReceivableView, Simulation } from '#/lib/types'
import { useSuspenseQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/_app/recebiveis/antecipacao')({
  head: () => ({ meta: [{ title: 'Antecipação · ReverteMed' }] }),
  component: Page,
})

const statusLabel: Record<
  Advance['status'],
  [string, 'info' | 'success' | 'warning' | 'neutral' | 'brand']
> = {
  proposed: ['Proposta', 'brand'],
  accepted: ['Aceita', 'info'],
  paid: ['Paga', 'success'],
  settled: ['Liquidada', 'success'],
  cancelled: ['Cancelada', 'neutral'],
}

function Page() {
  return (
    <>
      <PageHeader
        title="Antecipação de recebíveis"
        sub="Fase B · propostas de parceiros financeiros autorizados"
      />
      <Alert tone="info">
        <ShieldAlert className="mr-1 inline size-4" />O ReverteMed organiza os
        dados e origina a operação.{' '}
        <b>Não empresta dinheiro nem assume risco de crédito</b>: o pagamento é
        feito pelo parceiro financeiro e a plataforma recebe uma comissão.
        Aceitar uma antecipação exige verificação em duas etapas.
      </Alert>
      <Boundary fallback={<div className="skeleton h-96" />}>
        <Selection />
      </Boundary>
      <Boundary fallback={<div className="skeleton h-40" />}>
        <History />
      </Boundary>
    </>
  )
}

function Selection() {
  const all = useGet<List<ReceivableView>>('/receivables').items
  const eligible = all.filter(
    (r) =>
      r.status !== 'paid' && r.status !== 'partial' && r.days_overdue === 0,
  )
  const [ids, setIds] = useQueryState(
    'lotes',
    parseAsArrayOf(parseAsString).withDefault([]),
  )
  const selected = ids.filter((i) => eligible.some((e) => e.id === i))
  const toggle = (id: string) =>
    void setIds(
      selected.includes(id)
        ? selected.filter((i) => i !== id)
        : [...selected, id],
    )
  return (
    <>
      <Card title="1. Selecione os lotes" flat>
        {eligible.length === 0 ? (
          <EmptyState title="Nenhum lote elegível">
            Lotes pagos, parciais ou em atraso não podem ser antecipados.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th />
                <Th>Lote</Th>
                <Th>Operadora</Th>
                <Th>Previsto</Th>
                <Th right>Valor</Th>
              </tr>
            </thead>
            <tbody>
              {eligible.map((r) => (
                <tr key={r.id}>
                  <Td>
                    <Checkbox
                      checked={selected.includes(r.id)}
                      onChange={() => toggle(r.id)}
                    />
                  </Td>
                  <Td strong>{r.batch_number}</Td>
                  <Td>{r.operator_name}</Td>
                  <Td>~{date(r.expected_on)}</Td>
                  <Td right>{money(r.expected_cents - r.paid_cents)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {selected.length > 0 && (
        <Boundary
          key={selected.join()}
          fallback={<div className="skeleton h-64" />}
        >
          <Quotes ids={selected} />
        </Boundary>
      )}
    </>
  )
}

function Quotes({ ids }: { ids: string[] }) {
  const mfa = useAuth((s) => s.me?.user.mfa_enabled)
  const sim = useSuspenseQuery({
    queryKey: ['/receivables/advances/simulate', ids],
    queryFn: () =>
      api<Simulation>('/receivables/advances/simulate', {
        body: { receivable_ids: ids },
      }),
  }).data
  const propose = useAct(
    (partnerId: string) =>
      api<Advance>('/receivables/advances', {
        body: { partner_id: partnerId, receivable_ids: ids },
      }),
    {
      invalidate: ['/receivables/advances'],
      success: 'Proposta criada. Revise abaixo e aceite.',
    },
  )
  return (
    <Card title={`2. Compare as propostas · ${money(sim.gross_cents)} bruto`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sim.quotes.map((q) => (
          <article
            key={q.partner.id}
            className={`flex flex-col gap-3 rounded-2xl border p-5 ${q.best_net ? 'border-2 border-rec' : 'border-ink-200'}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <b>{q.partner.name}</b>
                <div className="text-xs text-ink-500 capitalize">
                  {q.partner.kind}
                </div>
              </div>
              {q.best_net && <Badge tone="amber">Melhor líquido</Badge>}
            </div>
            <div>
              <div className="text-xs text-ink-500">Valor líquido</div>
              <div className="num font-display text-[32px] font-extrabold tracking-[-0.03em]">
                {money(q.net_cents)}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-xs text-ink-500">Taxa a.m.</div>
                <b>{pct(q.partner.monthly_rate_bp / 100, 2)}</b>
              </div>
              <div>
                <div className="text-xs text-ink-500">Custo</div>
                <b className="num">{money(q.fee_cents)}</b>
              </div>
              <div>
                <div className="text-xs text-ink-500">Liquidação</div>
                <b>{q.partner.settlement_days} d</b>
              </div>
            </div>
            {!q.eligible && (
              <Alert tone="warning">Não elegível: {q.reasons.join('; ')}</Alert>
            )}
            <Button
              variant={q.best_net ? 'module' : 'secondary'}
              disabled={!q.eligible}
              loading={propose.isPending && propose.variables === q.partner.id}
              onClick={() => propose.mutate(q.partner.id)}
            >
              Criar proposta
            </Button>
          </article>
        ))}
      </div>
      {!mfa && (
        <Alert tone="warning">
          Ative a verificação em duas etapas em Configurações para poder aceitar
          uma antecipação.
        </Alert>
      )}
    </Card>
  )
}

function History() {
  const adv = useGet<List<Advance>>('/receivables/advances').items
  const mfaDone = useAuth((s) => s.mfaDone)
  const accept = useAct(
    (id: string) =>
      api(`/receivables/advances/${id}/accept`, { method: 'POST' }),
    { invalidate: ['/receivables'], success: 'Antecipação aceita' },
  )
  const cancel = useAct(
    (id: string) =>
      api(`/receivables/advances/${id}/cancel`, { method: 'POST' }),
    { invalidate: ['/receivables/advances'], success: 'Antecipação cancelada' },
  )
  return (
    <Card title="Operações" flat>
      {adv.length === 0 ? (
        <EmptyState title="Nenhuma operação ainda" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Criada em</Th>
              <Th right>Bruto</Th>
              <Th right>Custo</Th>
              <Th right>Líquido</Th>
              <Th>Lotes</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {adv.map((a) => (
              <tr key={a.id}>
                <Td>{date(a.created_at)}</Td>
                <Td right>{money(a.gross_cents)}</Td>
                <Td right>{money(a.fee_cents)}</Td>
                <Td right className="font-semibold">
                  {money(a.net_cents)}
                </Td>
                <Td>{a.receivable_ids.length}</Td>
                <Td>
                  <Badge tone={statusLabel[a.status][1]}>
                    {statusLabel[a.status][0]}
                  </Badge>
                </Td>
                <Td right>
                  {a.status === 'proposed' && (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => cancel.mutate(a.id)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        variant="module"
                        disabled={!mfaDone}
                        title={
                          mfaDone ? undefined : 'Entre com 2FA para aceitar'
                        }
                        loading={accept.isPending && accept.variables === a.id}
                        onClick={() => accept.mutate(a.id)}
                      >
                        Aceitar
                      </Button>
                    </div>
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
