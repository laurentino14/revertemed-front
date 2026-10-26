import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Plus, Send } from 'lucide-react'
import { useState } from 'react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Modal,
  Textarea,
} from '#/components/ui'
import { api } from '#/lib/api'
import { date, daysLabel, toApiDate, toInputDate } from '#/lib/format'
import { complexity, requestStatus } from '#/lib/labels'
import { useAct, useGet } from '#/lib/query'
import type { AuthDocument, AuthRequestDetail } from '#/lib/types'

export const Route = createFileRoute('/_app/autorizacoes/solicitacoes/$id')({
  head: () => ({ meta: [{ title: 'Solicitação · ReverteMed' }] }),
  component: Page,
})

function Page() {
  const { id } = Route.useParams()
  return (
    <>
      <Link
        to="/autorizacoes/solicitacoes"
        className="flex items-center gap-2 text-[13px] font-semibold text-aut"
      >
        <ArrowLeft className="size-4" />
        Voltar para as solicitações
      </Link>
      <Boundary fallback={<div className="skeleton h-96" />}>
        <Detail id={id} />
      </Boundary>
    </>
  )
}

const messages = [
  ['request_sent', 'Pedido enviado'],
  ['document_pending', 'Documento pendente'],
  ['authorized', 'Autorização liberada'],
  ['denied_guidance', 'Negativa com orientação'],
] as const

function Detail({ id }: { id: string }) {
  const d = useGet<AuthRequestDetail>(`/authorizations/requests/${id}`)
  const r = d.request
  const inv = ['/authorizations']
  const [modal, setModal] = useState<
    null | 'authorize' | 'deny' | 'return' | 'send' | 'doc'
  >(null)
  const toggle = useAct(
    (doc: AuthDocument) =>
      api(`/authorizations/documents/${doc.id}`, {
        method: 'PATCH',
        body: { delivered: !doc.delivered, file_name: doc.file_name },
      }),
    { invalidate: inv },
  )
  const review = useAct(
    () => api(`/authorizations/requests/${id}/in-review`, { method: 'POST' }),
    { invalidate: inv, success: 'Marcada como em análise' },
  )
  const message = useAct(
    (template: string) =>
      api(`/authorizations/requests/${id}/messages`, { body: { template } }),
    { invalidate: inv, success: 'Mensagem enfileirada' },
  )
  const canSend = r.status === 'draft' || r.status === 'returned'
  const open = r.status === 'sent' || r.status === 'in_review'
  return (
    <>
      <PageHeader
        title={`Solicitação #${r.number}`}
        sub={`${r.procedure_desc || r.procedure_code} · ${r.patient_pseudonym}`}
        actions={
          <Badge tone={requestStatus[r.status].tone}>
            {requestStatus[r.status].label}
          </Badge>
        }
      />
      {d.overdue && (
        <Alert tone="danger">
          A operadora <b>descumpriu o prazo</b> ({date(r.due_on)}). Cobre pelo
          protocolo {r.protocol || '(informe o protocolo)'}.
        </Alert>
      )}
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-5">
          <Card title="Dados do pedido">
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              {[
                ['Procedimento', `${r.procedure_code} · ${r.procedure_desc}`],
                ['Quantidade', String(r.quantity)],
                ['CID', r.cid || '—'],
                ['Complexidade', complexity[r.complexity]],
                [
                  'Médico',
                  r.doctor_name
                    ? `${r.doctor_name} ${r.doctor_crm ? `· CRM ${r.doctor_crm}` : ''}`
                    : '—',
                ],
                ['Protocolo', r.protocol || '—'],
                ['Enviada em', date(r.sent_on)],
                [
                  'Prazo da operadora',
                  r.due_on
                    ? `${date(r.due_on)}${d.business_days_left !== null ? ` (${daysLabel(d.business_days_left)})` : ''}`
                    : '—',
                ],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-ink-500">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <div>
              <div className="text-xs text-ink-500">
                Justificativa do médico (transcrita)
              </div>
              <p className="mt-1 rounded-xl bg-ink-50 p-3 text-sm">
                {r.justification || (
                  <i className="text-ink-500">
                    Faltando. Peça ao médico antes de enviar.
                  </i>
                )}
              </p>
            </div>
          </Card>
          <Card
            title="Lista de conferência"
            right={
              canSend && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setModal('doc')}
                >
                  <Plus className="size-4" />
                  Documento
                </Button>
              )
            }
          >
            <div className="flex flex-col gap-3">
              {d.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 border-t border-ink-100 pt-3 first:border-0 first:pt-0"
                >
                  <Checkbox
                    checked={doc.delivered}
                    disabled={!canSend}
                    onChange={() => toggle.mutate(doc)}
                  >
                    {doc.kind}
                  </Checkbox>
                  {!doc.delivered && doc.required ? (
                    <Badge tone="danger">Falta anexar</Badge>
                  ) : (
                    <Badge tone="success">Entregue</Badge>
                  )}
                </div>
              ))}
            </div>
            {d.missing_documents.length > 0 && canSend && (
              <Alert tone="warning">
                Faltam: {d.missing_documents.join(', ')}.
              </Alert>
            )}
          </Card>
        </div>
        <div className="flex flex-col gap-5">
          <Card title="Ações">
            <div className="flex flex-col gap-2.5">
              {canSend && (
                <Button variant="module" onClick={() => setModal('send')}>
                  <Send className="size-4" />
                  Enviar à operadora
                </Button>
              )}
              {r.status === 'sent' && (
                <Button
                  variant="secondary"
                  loading={review.isPending}
                  onClick={() => review.mutate(undefined)}
                >
                  Marcar em análise
                </Button>
              )}
              {open && (
                <>
                  <Button onClick={() => setModal('authorize')}>
                    Registrar autorização
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setModal('return')}
                  >
                    Registrar devolução
                  </Button>
                  <Button variant="danger" onClick={() => setModal('deny')}>
                    Registrar negativa
                  </Button>
                </>
              )}
              {r.status === 'denied' && (
                <Button onClick={() => setModal('authorize')}>
                  Reanálise aceita: registrar autorização
                </Button>
              )}
              {r.status === 'authorized' && (
                <Alert tone="success">
                  Autorizada. Veja a senha em{' '}
                  <Link
                    to="/autorizacoes/senhas"
                    className="font-semibold underline"
                  >
                    Senhas
                  </Link>
                  .
                </Alert>
              )}
            </div>
          </Card>
          <Card title="Avisar o paciente">
            <p className="text-xs text-ink-500">
              Mensagens por WhatsApp só com o status do pedido e com
              consentimento registrado.
            </p>
            {messages.map(([k, label]) => (
              <Button
                key={k}
                size="sm"
                variant="secondary"
                loading={message.isPending && message.variables === k}
                onClick={() => message.mutate(k)}
              >
                {label}
              </Button>
            ))}
          </Card>
        </div>
      </div>
      <SendModal
        open={modal === 'send'}
        onClose={() => setModal(null)}
        id={id}
      />
      <AuthorizeModal
        open={modal === 'authorize'}
        onClose={() => setModal(null)}
        id={id}
        qty={r.quantity}
      />
      <DenyModal
        open={modal === 'deny'}
        onClose={() => setModal(null)}
        id={id}
      />
      <ReturnModal
        open={modal === 'return'}
        onClose={() => setModal(null)}
        id={id}
      />
      <DocModal open={modal === 'doc'} onClose={() => setModal(null)} id={id} />
    </>
  )
}

function SendModal({
  open,
  onClose,
  id,
}: {
  open: boolean
  onClose: () => void
  id: string
}) {
  const [protocol, setProtocol] = useState('')
  const send = useAct(
    () => api(`/authorizations/requests/${id}/send`, { body: { protocol } }),
    {
      invalidate: ['/authorizations'],
      success: 'Enviada. O prazo da operadora está sendo contado.',
      onSuccess: onClose,
    },
  )
  return (
    <Modal open={open} onClose={onClose} title="Enviar à operadora">
      <p className="text-[13px] text-ink-500">
        O envio confere a lista de documentos e a justificativa do médico, e
        calcula o prazo da operadora em dias úteis.
      </p>
      <Field label="Protocolo do portal (opcional)">
        <Input value={protocol} onChange={(e) => setProtocol(e.target.value)} />
      </Field>
      <Button
        variant="module"
        loading={send.isPending}
        onClick={() => send.mutate(undefined)}
      >
        Confirmar envio
      </Button>
    </Modal>
  )
}

function AuthorizeModal({
  open,
  onClose,
  id,
  qty,
}: {
  open: boolean
  onClose: () => void
  id: string
  qty: number
}) {
  const today = toInputDate(new Date())
  const [f, setF] = useState({
    password: '',
    valid_from: today,
    valid_until: toInputDate(new Date(Date.now() + 30 * 864e5)),
    qty,
  })
  const authorize = useAct(
    () =>
      api(`/authorizations/requests/${id}/authorize`, {
        body: {
          password: f.password,
          valid_from: toApiDate(f.valid_from),
          valid_until: toApiDate(f.valid_until),
          qty_authorized: f.qty,
        },
      }),
    {
      invalidate: ['/authorizations'],
      success: 'Autorização registrada',
      onSuccess: onClose,
    },
  )
  return (
    <Modal open={open} onClose={onClose} title="Registrar autorização">
      <Field label="Senha de autorização">
        <Input
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
          autoFocus
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Válida de">
          <Input
            type="date"
            value={f.valid_from}
            onChange={(e) => setF({ ...f, valid_from: e.target.value })}
          />
        </Field>
        <Field label="até">
          <Input
            type="date"
            value={f.valid_until}
            onChange={(e) => setF({ ...f, valid_until: e.target.value })}
          />
        </Field>
        <Field label="Quantidade">
          <Input
            type="number"
            min={1}
            value={f.qty}
            onChange={(e) => setF({ ...f, qty: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Button
        loading={authorize.isPending}
        disabled={!f.password.trim()}
        onClick={() => authorize.mutate(undefined)}
      >
        Salvar autorização
      </Button>
    </Modal>
  )
}

function DenyModal({
  open,
  onClose,
  id,
}: {
  open: boolean
  onClose: () => void
  id: string
}) {
  const [f, setF] = useState({ reason: '', clause: '', complex: false })
  const deny = useAct(
    () => api(`/authorizations/requests/${id}/deny`, { body: f }),
    {
      invalidate: ['/authorizations'],
      success:
        'Negativa registrada. O rascunho de reanálise está em Negativas.',
      onSuccess: onClose,
    },
  )
  return (
    <Modal open={open} onClose={onClose} title="Registrar negativa">
      <Field label="Motivo informado pela operadora">
        <Textarea
          className="min-h-20"
          value={f.reason}
          onChange={(e) => setF({ ...f, reason: e.target.value })}
        />
      </Field>
      <Field label="Cláusula ou dispositivo legal citado">
        <Input
          value={f.clause}
          onChange={(e) => setF({ ...f, clause: e.target.value })}
        />
      </Field>
      <Checkbox
        checked={f.complex}
        onChange={(v) => setF({ ...f, complex: v })}
      >
        Caso complexo: sinalizar para avaliação do médico ou de um advogado
      </Checkbox>
      <Button
        variant="danger"
        loading={deny.isPending}
        disabled={!f.reason.trim()}
        onClick={() => deny.mutate(undefined)}
      >
        Registrar negativa
      </Button>
    </Modal>
  )
}

function ReturnModal({
  open,
  onClose,
  id,
}: {
  open: boolean
  onClose: () => void
  id: string
}) {
  const [docs, setDocs] = useState('')
  const ret = useAct(
    () =>
      api(`/authorizations/requests/${id}/return`, {
        body: {
          document_kinds: docs
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
      }),
    {
      invalidate: ['/authorizations'],
      success: 'Devolução registrada. Reenvie após completar os documentos.',
      onSuccess: onClose,
    },
  )
  return (
    <Modal open={open} onClose={onClose} title="Registrar devolução">
      <Field
        label="Documentos pedidos pela operadora"
        hint="Separe por vírgula. Serão reabertos na lista de conferência."
      >
        <Input
          value={docs}
          onChange={(e) => setDocs(e.target.value)}
          placeholder="Relatório médico, Exames anteriores"
        />
      </Field>
      <Button loading={ret.isPending} onClick={() => ret.mutate(undefined)}>
        Registrar
      </Button>
    </Modal>
  )
}

function DocModal({
  open,
  onClose,
  id,
}: {
  open: boolean
  onClose: () => void
  id: string
}) {
  const [kind, setKind] = useState('')
  const add = useAct(
    () =>
      api(`/authorizations/requests/${id}/documents`, {
        body: { kind, required: true },
      }),
    {
      invalidate: ['/authorizations'],
      onSuccess: () => {
        setKind('')
        onClose()
      },
    },
  )
  return (
    <Modal open={open} onClose={onClose} title="Novo documento">
      <Field label="Tipo de documento">
        <Input
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          autoFocus
        />
      </Field>
      <Button
        loading={add.isPending}
        disabled={!kind.trim()}
        onClick={() => add.mutate(undefined)}
      >
        Adicionar
      </Button>
    </Modal>
  )
}
