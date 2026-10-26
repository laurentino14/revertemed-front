import { createFileRoute } from '@tanstack/react-router'
import { Copy } from 'lucide-react'
import { useState } from 'react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Table,
  Td,
  Textarea,
  Th,
} from '#/components/ui'
import { api } from '#/lib/api'
import { dateTime, money } from '#/lib/format'
import { useAct, useGet } from '#/lib/query'
import { toast } from '#/stores/ui'
import type { CollectionView, List, ReceivableView } from '#/lib/types'

export const Route = createFileRoute('/_app/recebiveis/cobrancas')({
  head: () => ({ meta: [{ title: 'Cobranças · ReverteMed' }] }),
  component: Page,
})

function Page() {
  return (
    <>
      <PageHeader
        title="Cobrança de atrasos"
        sub="Alertas, comunicação e resposta da operadora"
      />
      <Boundary fallback={<div className="skeleton h-96" />}>
        <Collections />
      </Boundary>
    </>
  )
}

function Collections() {
  const overdue = useGet<List<ReceivableView>>('/receivables/overdue').items
  const collections = useGet<List<CollectionView>>(
    '/receivables/collections',
  ).items
  const [open, setOpen] = useState<CollectionView | null>(null)
  const create = useAct(
    (r: ReceivableView) =>
      api<CollectionView>('/receivables/collections', {
        body: { receivable_id: r.id, channel: 'email' },
      }),
    {
      invalidate: ['/receivables'],
      success: 'Cobrança gerada',
      onSuccess: (c) => setOpen({ ...c, operator_name: '', batch_number: '' }),
    },
  )
  const byReceivable = new Set(collections.map((c) => c.receivable_id))
  return (
    <>
      {overdue.length > 0 ? (
        <Alert tone="warning">
          <b>{overdue.length} lote(s) venceram sem pagamento</b>, somando{' '}
          {money(
            overdue.reduce((s, r) => s + r.expected_cents - r.paid_cents, 0),
          )}
          . O sistema gera a comunicação de cobrança com lote, protocolo e
          valor.
        </Alert>
      ) : (
        <Alert tone="success">Nenhum recebível em atraso.</Alert>
      )}
      <Card title="Atrasos" flat>
        {overdue.length === 0 ? (
          <EmptyState title="Tudo em dia" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Operadora</Th>
                <Th>Lote</Th>
                <Th right>Valor</Th>
                <Th right>Atraso</Th>
                <Th>Cobrança</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {overdue.map((r) => (
                <tr key={r.id}>
                  <Td strong>{r.operator_name}</Td>
                  <Td>{r.batch_number}</Td>
                  <Td right>{money(r.expected_cents - r.paid_cents)}</Td>
                  <Td right className="font-semibold text-danger">
                    +{r.days_overdue} dias
                  </Td>
                  <Td>
                    {byReceivable.has(r.id) ? (
                      <Badge tone="info">Gerada</Badge>
                    ) : (
                      <Badge tone="warning">A cobrar</Badge>
                    )}
                  </Td>
                  <Td right>
                    <Button
                      size="sm"
                      variant="module"
                      loading={
                        create.isPending && create.variables?.id === r.id
                      }
                      onClick={() => create.mutate(r)}
                    >
                      Gerar cobrança
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <Card title="Cobranças geradas" flat>
        {collections.length === 0 ? (
          <EmptyState title="Nenhuma cobrança ainda" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Operadora</Th>
                <Th>Lote</Th>
                <Th>Gerada</Th>
                <Th>Enviada</Th>
                <Th>Resposta</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c.id}>
                  <Td strong>{c.operator_name}</Td>
                  <Td>{c.batch_number}</Td>
                  <Td>{dateTime(c.created_at)}</Td>
                  <Td>
                    {c.sent_at ? (
                      dateTime(c.sent_at)
                    ) : (
                      <Badge tone="warning">Não enviada</Badge>
                    )}
                  </Td>
                  <Td>{c.response ? c.response : '—'}</Td>
                  <Td right>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setOpen(c)}
                    >
                      Abrir
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <CollectionModal collection={open} onClose={() => setOpen(null)} />
    </>
  )
}

function CollectionModal({
  collection,
  onClose,
}: {
  collection: CollectionView | null
  onClose: () => void
}) {
  const [protocol, setProtocol] = useState('')
  const [response, setResponse] = useState('')
  const sent = useAct(
    () =>
      api(`/receivables/collections/${collection!.id}/sent`, {
        body: { protocol },
      }),
    {
      invalidate: ['/receivables/collections'],
      success: 'Marcada como enviada',
      onSuccess: onClose,
    },
  )
  const resp = useAct(
    () =>
      api(`/receivables/collections/${collection!.id}/response`, {
        body: { response },
      }),
    {
      invalidate: ['/receivables/collections'],
      success: 'Resposta registrada',
      onSuccess: onClose,
    },
  )
  return (
    <Modal open={!!collection} onClose={onClose} title="Cobrança" wide>
      {collection && (
        <>
          <Textarea
            className="min-h-48 text-sm"
            readOnly
            value={collection.message}
            aria-label="Mensagem de cobrança"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(collection.message)
                toast.success('Mensagem copiada')
              }}
            >
              <Copy className="size-4" />
              Copiar texto
            </Button>
          </div>
          {!collection.sent_at && (
            <div className="flex items-end gap-3">
              <Field label="Protocolo do envio (opcional)" className="flex-1">
                <Input
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                />
              </Field>
              <Button
                variant="module"
                loading={sent.isPending}
                onClick={() => sent.mutate(undefined)}
              >
                Marcar como enviada
              </Button>
            </div>
          )}
          {collection.sent_at && !collection.response && (
            <div className="flex items-end gap-3">
              <Field label="Resposta da operadora" className="flex-1">
                <Input
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
              </Field>
              <Button
                variant="module"
                loading={resp.isPending}
                disabled={!response.trim()}
                onClick={() => resp.mutate(undefined)}
              >
                Registrar resposta
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
