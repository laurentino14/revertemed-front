import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { parseAsString, useQueryState } from 'nuqs'
import { ShieldCheck } from 'lucide-react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Kpi,
  Select,
  Table,
  Td,
  Th,
} from '#/components/ui'
import type { Tone } from '#/components/ui'
import { api, ApiError } from '#/lib/api'
import { date, money } from '#/lib/format'
import { useAct, useGet } from '#/lib/query'
import type { BatchView, List, PreventionReport } from '#/lib/types'

export const Route = createFileRoute('/_app/glosas/prevencao')({
  head: () => ({ meta: [{ title: 'Prevenção · ReverteMed' }] }),
  component: Page,
})

const sev: Record<string, [string, Tone]> = {
  high: ['Alto', 'danger'],
  medium: ['Médio', 'warning'],
  low: ['Baixo', 'success'],
}

function Page() {
  return (
    <>
      <PageHeader
        title="Prevenção antes do envio"
        sub="Analise cada lote com as regras dos contratos e o histórico da operadora"
      />
      <Boundary fallback={<div className="skeleton h-96" />}>
        <Prevention />
      </Boundary>
    </>
  )
}

function Prevention() {
  const batches = useGet<List<BatchView>>('/glosas/batches').items
  const [batch, setBatch] = useQueryState('lote', parseAsString)
  const selected = batch ?? batches[0]?.id ?? null
  if (!batches.length)
    return (
      <Card>
        <EmptyState title="Nenhum lote importado">
          Importe um lote de guias (XML TISS) para analisá-lo.
        </EmptyState>
      </Card>
    )
  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            className="w-full sm:w-96"
            value={selected ?? ''}
            onChange={(e) => void setBatch(e.target.value)}
            aria-label="Lote"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                Lote {b.number} · {b.operator_name} · {date(b.sent_on)} ·{' '}
                {money(b.billed_cents)}
              </option>
            ))}
          </Select>
        </div>
      </Card>
      {selected && (
        <Boundary key={selected} fallback={<div className="skeleton h-64" />}>
          <Report batchId={selected} />
        </Boundary>
      )}
    </>
  )
}

function Report({ batchId }: { batchId: string }) {
  const qc = useQueryClient()
  const path = `/glosas/batches/${batchId}/prevention`
  const latest = useLatestReport(path)
  const analyze = useAct(
    () => api<PreventionReport>(path, { method: 'POST' }),
    {
      success: 'Análise concluída',
      onSuccess: (r) => qc.setQueryData([path, {}], r),
    },
  )
  const resolve = useAct(
    (id: string) =>
      api(`/glosas/prevention-alerts/${id}/resolve`, { method: 'POST' }),
    {
      onSuccess: () => void qc.invalidateQueries({ queryKey: [path] }),
      success: 'Alerta resolvido',
    },
  )
  const r = latest
  return (
    <>
      <Card
        title={
          r
            ? `Análise de ${new Date(r.run.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`
            : 'Ainda não analisado'
        }
        right={
          <Button
            size="sm"
            loading={analyze.isPending}
            onClick={() => analyze.mutate(undefined)}
          >
            <ShieldCheck className="size-4" />
            {r ? 'Analisar novamente' : 'Analisar lote'}
          </Button>
        }
      >
        {r ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Guias analisadas"
              value={String(r.run.guides_analyzed)}
              detail=""
            />
            <Kpi
              tone="warning"
              label="Guias com alerta"
              value={String(r.guides_with_alerts)}
              detail={`${r.high} alto · ${r.medium} médio`}
            />
            <Kpi
              tone="danger"
              label="Valor em risco"
              value={money(r.run.at_risk_cents)}
              detail="se enviado como está"
            />
            <Kpi
              tone="success"
              label="Resolvidos"
              value={String(r.alerts.filter((a) => a.resolved_at).length)}
              detail={`de ${r.alerts.length} alertas`}
            />
          </div>
        ) : (
          <p className="text-ink-500">
            Rode a análise para ver, antes do envio, quais guias têm risco de
            glosa.
          </p>
        )}
      </Card>
      {r && (
        <Card title="Alertas" flat>
          {r.alerts.length === 0 ? (
            <EmptyState title="Nenhum risco encontrado">
              As regras confirmadas dos contratos e o histórico não apontaram
              problemas neste lote.
            </EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Guia</Th>
                  <Th>Procedimento</Th>
                  <Th>Alerta</Th>
                  <Th>Risco</Th>
                  <Th right>Valor em risco</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {r.alerts.map((a) => (
                  <tr key={a.id} className={a.resolved_at ? 'opacity-50' : ''}>
                    <Td strong>{a.guide_number}</Td>
                    <Td>
                      {a.tuss_code
                        ? `${a.tuss_code} · ${a.description ?? ''}`
                        : 'Guia inteira'}
                    </Td>
                    <Td>{a.message}</Td>
                    <Td>
                      <Badge tone={sev[a.severity][1]}>
                        {sev[a.severity][0]}
                      </Badge>
                    </Td>
                    <Td right>{money(a.at_risk_cents)}</Td>
                    <Td right>
                      {a.resolved_at ? (
                        <Badge tone="success">Resolvido</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => resolve.mutate(a.id)}
                        >
                          Marcar como corrigido
                        </Button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}
      <Alert tone="info">
        As regras vêm dos contratos e das glosas mais frequentes da operadora.
        Com histórico suficiente, o sistema evolui para estimar a probabilidade
        de glosa por operadora e procedimento.
      </Alert>
    </>
  )
}

/** Reads a report that may not exist yet (404) without throwing. */
function useLatestReport(path: string) {
  return useSuspenseQuery({
    queryKey: [path, {}],
    queryFn: async () => {
      try {
        return await api<PreventionReport>(path)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      }
    },
  }).data
}
