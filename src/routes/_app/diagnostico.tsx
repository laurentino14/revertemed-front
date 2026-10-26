import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import { TissUploader } from '#/features/glosas/uploader'
import { Alert, Card, HBar, Kpi, LinkButton } from '#/components/ui'
import { money, pct, toInputDate } from '#/lib/format'
import { useGet } from '#/lib/query'
import type { GlosasDashboard } from '#/lib/types'

export const Route = createFileRoute('/_app/diagnostico')({
  head: () => ({ meta: [{ title: 'Diagnóstico gratuito · ReverteMed' }] }),
  component: Page,
})

function Page() {
  const [uploaded, setUploaded] = useState(0)
  return (
    <>
      <PageHeader
        title="Diagnóstico gratuito"
        sub="Envie os demonstrativos dos últimos 6 meses e veja quanto sua clínica deixou de receber"
      />
      <TissUploader onDone={() => setUploaded((n) => n + 1)} />
      <Alert tone="indigo">
        Ao enviar, você autoriza o uso destes arquivos para gerar o diagnóstico
        (LGPD). Os dados do paciente são pseudonimizados antes de qualquer
        análise.
      </Alert>
      <Boundary key={uploaded} fallback={<div className="skeleton h-64" />}>
        <Report />
      </Boundary>
    </>
  )
}

function Report() {
  const to = new Date()
  const from = new Date()
  from.setMonth(from.getMonth() - 6)
  const d = useGet<GlosasDashboard>('/glosas/dashboard', {
    from: toInputDate(from),
    to: toInputDate(to),
  })
  if (!d.billed_cents) return null
  const max = Math.max(1, ...d.top_reasons.map((r) => r.glossed_cents))
  return (
    <Card title="Seu diagnóstico · últimos 6 meses">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          tone="danger"
          label="Valor glosado"
          value={money(d.glossed_cents)}
          detail={`${d.glossed_items} itens · ${pct(d.gloss_rate_pct)} do faturado`}
        />
        <Kpi
          label="Faturado"
          value={money(d.billed_cents)}
          detail="no período"
        />
        <Kpi
          tone="warning"
          label="Ainda recuperável"
          value={money(d.to_prescribe_cents)}
          detail={`${d.to_prescribe_items} itens dentro do prazo (14 dias)`}
        />
        <Kpi
          tone="success"
          label="Já recuperado"
          value={money(d.recovered_cents)}
          detail="com recursos pelo ReverteMed"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <b className="font-display">Motivos mais frequentes</b>
          {d.top_reasons.map((r) => (
            <HBar
              key={r.reason}
              label={r.reason}
              value={money(r.glossed_cents)}
              pct={(r.glossed_cents / max) * 100}
              color="bg-danger"
            />
          ))}
        </div>
        <div className="flex flex-col items-start justify-center gap-3">
          <p className="text-ink-700">
            Comece pelos itens com prazo mais curto: o sistema já os ordena por
            valor e proximidade do vencimento.
          </p>
          <LinkButton
            to="/glosas/conciliacao"
            search={{ status: 'total' } as never}
          >
            Ver itens glosados
          </LinkButton>
        </div>
      </div>
    </Card>
  )
}
