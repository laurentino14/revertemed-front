import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Download, Send, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
  cn,
} from '#/components/ui'
import { api } from '#/lib/api'
import { daysLabel, money, parseMoneyInput } from '#/lib/format'
import { appealStatus, category, ruleKind } from '#/lib/labels'
import { useAct, useGet } from '#/lib/query'
import type { Appeal, AppealDetail, AppealStatus, Rule } from '#/lib/types'

export const Route = createFileRoute('/_app/glosas/recursos/$id')({
  head: () => ({ meta: [{ title: 'Revisão do recurso · ReverteMed' }] }),
  component: Page,
})

function Page() {
  const { id } = Route.useParams()
  return (
    <>
      <Link
        to="/glosas/recursos"
        className="flex items-center gap-2 text-[13px] font-semibold text-brand-600"
      >
        <ArrowLeft className="size-4" />
        Voltar para a fila
      </Link>
      <Boundary
        fallback={
          <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
            <div className="skeleton h-96" />
            <div className="skeleton h-96" />
          </div>
        }
      >
        <Detail id={id} />
      </Boundary>
    </>
  )
}

const steps: {
  key: string
  label: string
  detail: (d: AppealDetail) => string
}[] = [
  {
    key: 'class',
    label: 'Classificação',
    detail: (d) => category[d.appeal.classification] ?? d.item.gloss_reason,
  },
  {
    key: 'evid',
    label: 'Evidências',
    detail: (d) =>
      d.appeal.evidence?.length
        ? `${d.appeal.evidence.length} evidência(s) e ${(d.matching_rules ?? []).length} regra(s) do contrato`
        : 'Anexe laudos e a senha de autorização',
  },
  {
    key: 'draft',
    label: 'Redação',
    detail: (d) =>
      d.appeal.ai_generated
        ? `Rascunho IA (${'modelo registrado'})`
        : 'Rascunho por modelo, editável',
  },
  {
    key: 'review',
    label: 'Revisão e aprovação',
    detail: () => 'Etapa humana obrigatória',
  },
  {
    key: 'send',
    label: 'Envio',
    detail: (d) =>
      d.appeal.protocol
        ? `Protocolo ${d.appeal.protocol}`
        : 'Registre o protocolo após enviar',
  },
  {
    key: 'result',
    label: 'Resultado',
    detail: (d) =>
      d.appeal.recovered_cents
        ? `Recuperado ${money(d.appeal.recovered_cents)}`
        : 'Aguardando a operadora',
  },
]

const progress: Record<AppealStatus, number> = {
  draft: 3,
  awaiting_approval: 3,
  approved: 4,
  submitted: 5,
  recovered: 6,
  partially_recovered: 6,
  denied: 6,
  discarded: 0,
}

function useAppealPost(
  id: string,
  path: string,
  success: string,
  onSuccess?: () => void,
) {
  return useAct(
    () => api<Appeal>(`/glosas/appeals/${id}/${path}`, { method: 'POST' }),
    { invalidate: ['/glosas'], success, onSuccess },
  )
}

function Detail({ id }: { id: string }) {
  const navigate = useNavigate()
  const d = useGet<AppealDetail>(`/glosas/appeals/${id}`)
  const a = d.appeal
  const [text, setText] = useState(a.argument)
  const [sendOpen, setSendOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)
  const inv = ['/glosas']
  const edit = useAct(
    () =>
      api<Appeal>(`/glosas/appeals/${id}`, {
        method: 'PUT',
        body: { argument: text },
      }),
    { invalidate: inv, success: 'Rascunho salvo' },
  )
  const submit = useAppealPost(
    id,
    'submit-for-approval',
    'Enviado para aprovação',
  )
  const approve = useAppealPost(id, 'approve', 'Recurso aprovado')
  const discard = useAppealPost(
    id,
    'discard',
    'Recurso descartado',
    () => void navigate({ to: '/glosas/recursos' }),
  )
  const reopen = useAct(
    () => api<Appeal>('/glosas/appeals', { body: { item_id: a.item_id } }),
    {
      invalidate: inv,
      success: 'Segundo recurso aberto',
      onSuccess: (n) =>
        void navigate({ to: '/glosas/recursos/$id', params: { id: n.id } }),
    },
  )
  const dirty = text !== a.argument
  const editable = a.status === 'draft' || a.status === 'awaiting_approval'
  const done = progress[a.status]

  async function download() {
    const body = await api<string>(`/glosas/appeals/${id}/export`, {
      raw: true,
    })
    const url = URL.createObjectURL(
      new Blob([body], { type: 'text/plain;charset=utf-8' }),
    )
    const el = document.createElement('a')
    el.href = url
    el.download = `recurso-${d.item.guide_number}.txt`
    el.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader
        title="Revisão do recurso"
        sub={`Guia ${d.item.guide_number} · ${d.item.operator_name} · ${money(d.item.glossed_cents)}`}
        actions={
          <Badge tone={appealStatus[a.status].tone}>
            {appealStatus[a.status].label}
          </Badge>
        }
      />
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-5">
          <Card
            title="Glosa"
            right={
              <Badge tone="danger">
                {category[a.classification] ?? 'Glosa'}
              </Badge>
            }
          >
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              {[
                [
                  'Guia',
                  `${d.item.guide_number} (lote ${d.item.batch_number})`,
                ],
                ['Paciente', `${d.item.patient_pseudonym} (pseudonimizado)`],
                ['Operadora', d.item.operator_name],
                ['Procedimento', `${d.item.tuss_code} · ${d.item.description}`],
                ['Valor glosado', money(d.item.glossed_cents)],
                [
                  'Prazo de recurso',
                  d.item.appeal_due_on
                    ? `${new Date(d.item.appeal_due_on).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} (${daysLabel(d.days_left)})`
                    : '—',
                ],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-ink-500">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <Alert tone="warning">
              <b>
                Motivo informado pela operadora
                {d.item.gloss_code ? ` (${d.item.gloss_code})` : ''}:
              </b>{' '}
              {d.item.gloss_reason || 'não informado'}
            </Alert>
          </Card>

          <Card title="Argumento do recurso">
            <div className="flex items-center gap-2 rounded-[14px] border border-brand-200 bg-brand-50 px-4 py-3 text-[13px] font-semibold text-brand-700">
              <Sparkles className="size-4" />
              {a.ai_generated
                ? `Rascunho gerado por IA (${a.ai_model})`
                : 'Rascunho montado por modelo com os dados do item e do contrato'}
            </div>
            <Textarea
              className="min-h-56 text-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
              readOnly={!editable}
              aria-label="Argumento"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-ink-500">
                O texto cita só o que está nos documentos e no contrato. Revise
                antes de aprovar.
              </span>
              <div className="flex flex-wrap gap-2">
                {editable && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => discard.mutate(undefined)}
                      loading={discard.isPending}
                    >
                      Descartar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!dirty}
                      loading={edit.isPending}
                      onClick={() => edit.mutate(undefined)}
                    >
                      Salvar
                    </Button>
                    {a.status === 'draft' && !dirty && (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={submit.isPending}
                        onClick={() => submit.mutate(undefined)}
                      >
                        Pedir aprovação
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={dirty}
                      loading={approve.isPending}
                      onClick={() => approve.mutate(undefined)}
                    >
                      Aprovar
                    </Button>
                  </>
                )}
                {a.status === 'approved' && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void download()}
                    >
                      <Download className="size-4" />
                      Exportar texto
                    </Button>
                    <Button size="sm" onClick={() => setSendOpen(true)}>
                      <Send className="size-4" />
                      Registrar envio
                    </Button>
                  </>
                )}
                {a.status === 'submitted' && (
                  <Button size="sm" onClick={() => setResultOpen(true)}>
                    Registrar resultado
                  </Button>
                )}
                {a.status === 'denied' && (
                  <Button
                    size="sm"
                    loading={reopen.isPending}
                    onClick={() => reopen.mutate(undefined)}
                  >
                    Abrir 2º recurso
                  </Button>
                )}
              </div>
            </div>
            {dirty && editable && (
              <p className="text-xs font-medium text-warning">
                Você tem alterações não salvas. Salve antes de aprovar.
              </p>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card title="Etapas">
            <ol>
              {steps.map((s, i) => (
                <li key={s.key} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < steps.length - 1 && (
                    <span className="absolute top-4 bottom-0 left-[5px] w-0.5 bg-ink-200" />
                  )}
                  <span
                    className={cn(
                      'z-10 mt-1.5 size-3 shrink-0 rounded-full border-2 border-white ring-2',
                      i < done - 1
                        ? 'bg-success ring-success'
                        : i === done - 1
                          ? 'bg-(--m) ring-(--m)'
                          : 'bg-ink-300 ring-ink-300',
                    )}
                  />
                  <div>
                    <b className="text-[13px]">{s.label}</b>
                    <div className="text-xs text-ink-500">{s.detail(d)}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
          <Card title="Evidências usadas">
            {a.evidence?.length ? (
              a.evidence.map((e) => (
                <div
                  key={e.title + e.detail}
                  className="flex gap-3 border-t border-ink-100 pt-3 first:border-0 first:pt-0"
                >
                  <Badge tone={e.kind === 'contract' ? 'brand' : 'neutral'}>
                    {e.kind === 'contract' ? 'Contrato' : 'Documento'}
                  </Badge>
                  <div className="text-[13px]">
                    <b>{e.title}</b>
                    <div className="text-xs text-ink-500">{e.detail}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-ink-500">
                Nenhuma evidência registrada. Quando faltar evidência, o sistema
                sinaliza em vez de redigir um argumento fraco.
              </p>
            )}
          </Card>
          <Card title="Regras do contrato aplicáveis">
            {(d.matching_rules ?? []).length ? (
              (d.matching_rules ?? []).map((r: Rule) => (
                <div
                  key={r.id}
                  className="border-t border-ink-100 pt-3 text-[13px] first:border-0 first:pt-0"
                >
                  <Badge tone="brand">{ruleKind[r.kind]}</Badge>
                  <div className="mt-1 font-medium">
                    {r.requirement ||
                      (r.value_cents
                        ? money(r.value_cents)
                        : r.limit_qty
                          ? `Limite ${r.limit_qty}`
                          : '—')}
                  </div>
                  {r.source_excerpt && (
                    <div className="text-xs text-ink-500">
                      {r.source_excerpt}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-[13px] text-ink-500">
                Nenhuma regra confirmada para este procedimento. Cadastre e
                confirme regras em{' '}
                <Link
                  to="/glosas/contratos"
                  className="font-semibold text-brand-600"
                >
                  Contratos
                </Link>{' '}
                para fundamentar os recursos.
              </p>
            )}
          </Card>
        </div>
      </div>
      <SendModal open={sendOpen} onClose={() => setSendOpen(false)} id={id} />
      <ResultModal
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        id={id}
        glossed={d.item.glossed_cents}
      />
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
    () => api<Appeal>(`/glosas/appeals/${id}/send`, { body: { protocol } }),
    {
      invalidate: ['/glosas'],
      success: 'Envio registrado',
      onSuccess: onClose,
    },
  )
  return (
    <Modal open={open} onClose={onClose} title="Registrar envio">
      <p className="text-[13px] text-ink-500">
        Informe o protocolo recebido da operadora (portal ou XML da Guia de
        Recurso de Glosa).
      </p>
      <Field label="Protocolo">
        <Input
          value={protocol}
          onChange={(e) => setProtocol(e.target.value)}
          autoFocus
        />
      </Field>
      <Button
        loading={send.isPending}
        disabled={!protocol.trim()}
        onClick={() => send.mutate(undefined)}
      >
        Confirmar envio
      </Button>
    </Modal>
  )
}

function ResultModal({
  open,
  onClose,
  id,
  glossed,
}: {
  open: boolean
  onClose: () => void
  id: string
  glossed: number
}) {
  const [result, setResult] = useState('recovered')
  const [value, setValue] = useState('')
  const rec = useAct(
    () =>
      api(`/glosas/appeals/${id}/result`, {
        body: {
          result,
          recovered_cents: result === 'partial' ? parseMoneyInput(value) : 0,
        },
      }),
    {
      invalidate: ['/glosas', '/receivables'],
      success: 'Resultado registrado',
      onSuccess: onClose,
    },
  )
  return (
    <Modal open={open} onClose={onClose} title="Resultado do recurso">
      <Field label="Resposta da operadora">
        <Select value={result} onChange={(e) => setResult(e.target.value)}>
          <option value="recovered">
            Recuperado integralmente ({money(glossed)})
          </option>
          <option value="partial">Recuperado parcialmente</option>
          <option value="denied">Negado</option>
        </Select>
      </Field>
      {result === 'partial' && (
        <Field
          label="Valor recuperado (R$)"
          hint={`Entre 0 e ${money(glossed)}`}
        >
          <Input
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0,00"
          />
        </Field>
      )}
      <Button loading={rec.isPending} onClick={() => rec.mutate(undefined)}>
        Salvar resultado
      </Button>
    </Modal>
  )
}
