import { createFileRoute, Link } from '@tanstack/react-router'
import { parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Select,
  Textarea,
} from '#/components/ui'
import type { Tone } from '#/components/ui'
import { api } from '#/lib/api'
import { date } from '#/lib/format'
import { useAct, useGet } from '#/lib/query'
import type { DenialView, List } from '#/lib/types'

export const Route = createFileRoute('/_app/autorizacoes/negativas')({
  head: () => ({ meta: [{ title: 'Negativas · ReverteMed' }] }),
  component: Page,
})

const st: Record<DenialView['reanalysis_status'], [string, Tone]> = {
  none: ['Sem reanálise', 'neutral'],
  draft: ['Rascunho', 'warning'],
  sent: ['Enviada', 'info'],
  reverted: ['Revertida', 'success'],
  upheld: ['Mantida', 'danger'],
}

function Page() {
  return (
    <>
      <PageHeader
        title="Negativas e reanálise"
        sub="Organize o motivo e prepare o pedido de reanálise (apreciado pela ouvidoria da operadora)"
      />
      <Boundary fallback={<div className="skeleton h-96" />}>
        <Denials />
      </Boundary>
    </>
  )
}

function Denials() {
  const rows = useGet<List<DenialView>>('/authorizations/denials').items
  const [sel, setSel] = useQueryState('negativa', parseAsString)
  const current = rows.find((r) => r.id === sel) ?? rows[0]
  if (!rows.length)
    return (
      <Card>
        <EmptyState title="Nenhuma negativa registrada">
          Quando a operadora negar um pedido, registre na solicitação para
          preparar a reanálise.
        </EmptyState>
      </Card>
    )
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[400px_1fr]">
      <Card title="Negativas">
        {rows.map((r) => (
          <button
            key={r.id}
            onClick={() => void setSel(r.id)}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left ${r.id === current?.id ? 'border-aut bg-aut-bg/40' : 'border-ink-100 hover:bg-ink-50'}`}
          >
            <div className="flex-1">
              <b className="text-[13px]">
                #{r.request_number} · {r.procedure_desc || 'Procedimento'}
              </b>
              <div className="text-xs text-ink-500">
                {r.operator_name} · {date(r.received_on)}
              </div>
            </div>
            <Badge tone={st[r.reanalysis_status][1]}>
              {st[r.reanalysis_status][0]}
            </Badge>
          </button>
        ))}
      </Card>
      {current && <Detail key={current.id} d={current} />}
    </div>
  )
}

function Detail({ d }: { d: DenialView }) {
  const [text, setText] = useState(d.reanalysis_text)
  const save = useAct(
    (status?: string) =>
      api(`/authorizations/denials/${d.id}/reanalysis`, {
        method: 'PUT',
        body: { text: status ? '' : text, status: status ?? '' },
      }),
    {
      invalidate: ['/authorizations/denials'],
      success: 'Reanálise atualizada',
    },
  )
  const locked =
    d.reanalysis_status === 'sent' ||
    d.reanalysis_status === 'reverted' ||
    d.reanalysis_status === 'upheld'
  return (
    <div className="flex flex-col gap-5">
      <Card
        title={`Negativa · pedido #${d.request_number}`}
        right={
          d.complex ? <Badge tone="danger">Caso complexo</Badge> : undefined
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-ink-500">Motivo informado</div>
            <b>{d.reason}</b>
          </div>
          <div>
            <div className="text-xs text-ink-500">
              Cláusula/dispositivo citado
            </div>
            <b>{d.clause || 'Não informado (a operadora deve citar)'}</b>
          </div>
        </div>
        {d.complex && (
          <Alert tone="warning">
            <b>Caso complexo.</b> Sinalizado para avaliação do médico ou de um
            advogado antes do envio.
          </Alert>
        )}
        <Link
          to="/autorizacoes/solicitacoes/$id"
          params={{ id: d.request_id }}
          className="text-[13px] font-semibold text-aut"
        >
          Abrir a solicitação
        </Link>
      </Card>
      <Card
        title="Pedido de reanálise"
        right={
          <Badge tone={st[d.reanalysis_status][1]}>
            {st[d.reanalysis_status][0]}
          </Badge>
        }
      >
        <Textarea
          className="min-h-48 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          readOnly={locked}
          aria-label="Pedido de reanálise"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-ink-500">
            O beneficiário pode pedir reanálise; o prestador pode apresentá-la
            em nome dele (RN 395).
          </span>
          <div className="flex flex-wrap gap-2">
            {!locked && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={text === d.reanalysis_text}
                  loading={save.isPending && !save.variables}
                  onClick={() => save.mutate(undefined)}
                >
                  Salvar texto
                </Button>
                <Button
                  size="sm"
                  variant="module"
                  disabled={text !== d.reanalysis_text}
                  onClick={() => save.mutate('sent')}
                >
                  Marcar como enviada
                </Button>
              </>
            )}
            {d.reanalysis_status === 'sent' && (
              <Select
                className="w-full py-2 text-[13px] sm:w-48"
                value=""
                onChange={(e) => e.target.value && save.mutate(e.target.value)}
                aria-label="Resultado da reanálise"
              >
                <option value="">Registrar resultado…</option>
                <option value="reverted">Negativa revertida</option>
                <option value="upheld">Negativa mantida</option>
              </Select>
            )}
          </div>
        </div>
        {d.reanalysis_status === 'reverted' && (
          <Alert tone="success">
            Negativa revertida. Registre a autorização na solicitação (botão
            “Reanálise aceita”).
          </Alert>
        )}
      </Card>
    </div>
  )
}
