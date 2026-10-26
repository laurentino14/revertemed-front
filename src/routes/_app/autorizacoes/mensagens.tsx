import { createFileRoute } from '@tanstack/react-router'
import { MessageSquare } from 'lucide-react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Table,
  Td,
  Th,
} from '#/components/ui'
import type { Tone } from '#/components/ui'
import { api } from '#/lib/api'
import { dateTime } from '#/lib/format'
import { useAct, useGet } from '#/lib/query'
import type { List, PatientMessage } from '#/lib/types'

export const Route = createFileRoute('/_app/autorizacoes/mensagens')({
  head: () => ({ meta: [{ title: 'Mensagens · ReverteMed' }] }),
  component: Page,
})

const tone: Record<string, [string, Tone]> = {
  queued: ['Na fila', 'neutral'],
  sent: ['Enviada', 'info'],
  delivered: ['Entregue', 'info'],
  read: ['Lida', 'success'],
  failed: ['Falhou', 'danger'],
}

function Page() {
  const dispatch = useAct(
    () =>
      api<{ message: string }>('/authorizations/messages/dispatch', {
        method: 'POST',
      }),
    { invalidate: ['/authorizations/messages'], onSuccess: (r) => void r },
  )
  return (
    <>
      <PageHeader
        title="Comunicação com o paciente"
        sub="Avisos automáticos pelo WhatsApp: só o status do pedido, nunca detalhe clínico"
        actions={
          <Button
            variant="module"
            loading={dispatch.isPending}
            onClick={() => dispatch.mutate(undefined)}
          >
            Despachar fila agora
          </Button>
        }
      />
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_360px]">
        <Boundary fallback={<div className="skeleton h-80" />}>
          <History />
        </Boundary>
        <div className="flex flex-col gap-5">
          <Boundary fallback={<div className="skeleton h-64" />}>
            <Templates />
          </Boundary>
          <Alert tone="indigo">
            As mensagens são enfileiradas só para pacientes com{' '}
            <b>consentimento registrado</b>. Em produção, um worker despacha a
            fila pela API oficial do WhatsApp Business.
          </Alert>
        </div>
      </div>
    </>
  )
}

function History() {
  const rows = useGet<List<PatientMessage>>('/authorizations/messages').items
  return (
    <Card title="Histórico" flat>
      {rows.length === 0 ? (
        <EmptyState title="Nenhuma mensagem ainda">
          Elas são geradas quando você envia, autoriza ou nega um pedido (e o
          paciente consentiu).
        </EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Paciente</Th>
              <Th>Modelo</Th>
              <Th>Mensagem</Th>
              <Th>Status</Th>
              <Th>Quando</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <Td strong>{m.patient_pseudonym}</Td>
                <Td>{m.template}</Td>
                <Td className="max-w-80 truncate">{m.content}</Td>
                <Td>
                  <Badge tone={tone[m.status]?.[1] ?? 'neutral'}>
                    {tone[m.status]?.[0] ?? m.status}
                  </Badge>
                </Td>
                <Td>{dateTime(m.created_at)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  )
}

function Templates() {
  const t = useGet<Record<string, string>>('/authorizations/message-templates')
  return (
    <Card title="Modelos automáticos">
      {Object.entries(t).map(([k, v]) => (
        <div
          key={k}
          className="flex gap-3 border-t border-ink-100 pt-3 first:border-0 first:pt-0"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-aut-bg">
            <MessageSquare className="size-[18px] text-aut" />
          </span>
          <div>
            <b className="text-[13px]">{k}</b>
            <p className="text-xs text-ink-500">“{v}”</p>
          </div>
        </div>
      ))}
    </Card>
  )
}
