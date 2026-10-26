import { createFileRoute, Link } from '@tanstack/react-router'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import { Alert, Badge, Kpi, LinkButton } from '#/components/ui'
import { money, pct } from '#/lib/format'
import { appealStatus } from '#/lib/labels'
import { useGet } from '#/lib/query'
import type { AppealView, Tracking } from '#/lib/types'

export const Route = createFileRoute('/_app/glosas/acompanhamento')({
  head: () => ({ meta: [{ title: 'Acompanhamento · ReverteMed' }] }),
  component: Page,
})

function Page() {
  return (
    <>
      <PageHeader
        title="Acompanhamento dos recursos"
        sub="Do rascunho ao desfecho, com prazos e protocolo"
      />
      <Boundary fallback={<div className="skeleton h-96" />}>
        <Board />
      </Boundary>
    </>
  )
}

function Board() {
  const t = useGet<Tracking>('/glosas/tracking')
  const s = t.summary
  const cols: { title: string; items: AppealView[]; hint: string }[] = [
    {
      title: 'Para revisar',
      items: t.drafts,
      hint: 'Rascunhos aguardando você',
    },
    { title: 'Aprovados', items: t.approved, hint: 'Prontos para enviar' },
    { title: 'Enviados', items: t.sent, hint: 'Aguardando a operadora' },
    {
      title: 'Resultados',
      items: t.results,
      hint: 'Recuperado, parcial ou negado',
    },
  ]
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          tone="success"
          label="Valor efetivamente recuperado"
          value={money(s.recovered_cents)}
          detail="base da cobrança por êxito"
        />
        <Kpi
          label="Taxa de sucesso"
          value={pct(s.success_rate_pct, 0)}
          detail="recursos aceitos total ou parcialmente"
        />
        <Kpi
          label="Tempo até o recurso"
          value={`${s.avg_days_to_appeal.toFixed(1).replace('.', ',')} dias`}
          detail="do demonstrativo ao primeiro recurso"
        />
        <Kpi
          tone="danger"
          label="Prescreveram sem recurso"
          value={String(s.prescribed_items)}
          detail={money(s.prescribed_cents)}
        />
      </div>
      {t.second_appeal_suggestions.length > 0 && (
        <Alert tone="brand">
          <b>{t.second_appeal_suggestions.length} recurso(s) negado(s)</b> podem
          ter um segundo recurso: abra o item e use “Abrir 2º recurso”.
        </Alert>
      )}
      <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cols.map((c) => (
          <section
            key={c.title}
            className="flex flex-col gap-2.5 rounded-2xl bg-ink-100 p-3"
          >
            <h3 className="flex items-center justify-between px-1.5 py-1 font-sans text-[13px] font-bold">
              {c.title}
              <span className="text-ink-500">{c.items.length}</span>
            </h3>
            {c.items.length === 0 && (
              <p className="px-2 pb-3 text-xs text-ink-500">{c.hint}</p>
            )}
            {c.items.map((a) => (
              <Link
                key={a.id}
                to="/glosas/recursos/$id"
                params={{ id: a.id }}
                className="flex flex-col gap-2 rounded-xl border border-ink-200 bg-white p-3.5 hover:border-brand-500"
              >
                <div className="flex items-center justify-between gap-2">
                  <b className="text-[13px]">Guia {a.guide_number}</b>
                  <Badge tone={appealStatus[a.status].tone}>
                    {appealStatus[a.status].label}
                  </Badge>
                </div>
                <span className="truncate text-xs text-ink-500">
                  {a.operator_name} · {a.description || a.tuss_code}
                </span>
                <div className="flex items-center justify-between">
                  <b className="num text-[13px]">
                    {money(
                      a.status === 'recovered' ||
                        a.status === 'partially_recovered'
                        ? a.recovered_cents
                        : a.glossed_cents,
                    )}
                  </b>
                  <span className="text-xs text-ink-500">
                    {a.protocol
                      ? `Protocolo ${a.protocol}`
                      : a.due_on
                        ? `Prazo ${new Date(a.due_on).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`
                        : ''}
                  </span>
                </div>
              </Link>
            ))}
          </section>
        ))}
      </div>
      <LinkButton
        to="/glosas/conciliacao"
        variant="secondary"
        className="self-start"
      >
        Abrir novos recursos na conciliação
      </LinkButton>
    </>
  )
}
