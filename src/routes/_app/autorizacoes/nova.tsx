import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import { useOperators } from '#/features/glosas/shared'
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from '#/components/ui'
import { api } from '#/lib/api'
import { complexity } from '#/lib/labels'
import { useAct, useGet } from '#/lib/query'
import type { Complexity, PatientView, Requirements, List } from '#/lib/types'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/_app/autorizacoes/nova')({
  head: () => ({ meta: [{ title: 'Nova solicitação · ReverteMed' }] }),
  component: () => (
    <>
      <PageHeader
        title="Nova solicitação"
        sub="Confira os dados do pedido médico, as exigências do contrato e monte o pedido"
      />
      <Boundary fallback={<div className="skeleton h-96" />}>
        <Form />
      </Boundary>
    </>
  ),
})

function Form() {
  const navigate = useNavigate()
  const ops = useOperators()
  const patients = useGet<List<PatientView>>('/authorizations/patients').items
  const [newPatient, setNewPatient] = useState(false)
  const [f, setF] = useState({
    patient_pseudonym: '',
    operator_id: '',
    complexity: 'normal' as Complexity,
    procedure_code: '',
    procedure_desc: '',
    quantity: 1,
    cid: '',
    doctor_name: '',
    doctor_crm: '',
    justification: '',
  })
  const set = <TKey extends keyof typeof f>(k: TKey, v: (typeof f)[TKey]) =>
    setF((s) => ({ ...s, [k]: v }))
  const operator = f.operator_id || ops[0]?.id || ''
  const req = useQuery({
    queryKey: ['/authorizations/requirements', operator, f.procedure_code],
    enabled: !!operator && f.procedure_code.length >= 4,
    queryFn: () =>
      api<Requirements>('/authorizations/requirements', {
        query: { operator_id: operator, procedure_code: f.procedure_code },
      }),
  })
  const create = useAct(
    () =>
      api<{ request: { id: string } }>('/authorizations/requests', {
        body: {
          ...f,
          operator_id: operator,
          patient_pseudonym: f.patient_pseudonym || patients[0]?.pseudonym,
        },
      }),
    {
      invalidate: ['/authorizations'],
      success: 'Solicitação criada. Confira o checklist e envie.',
      onSuccess: (r) =>
        void navigate({
          to: '/autorizacoes/solicitacoes/$id',
          params: { id: r.request.id },
        }),
    },
  )
  if (!ops.length)
    return (
      <Alert tone="warning">
        Cadastre ao menos uma operadora em Configurações para criar
        solicitações.
      </Alert>
    )
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1fr_380px]">
      <Card title="Pedido médico">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Paciente">
            <div className="flex gap-2">
              <Select
                value={f.patient_pseudonym || patients[0]?.pseudonym || ''}
                onChange={(e) => set('patient_pseudonym', e.target.value)}
              >
                {patients.length === 0 && (
                  <option value="">Cadastre um paciente</option>
                )}
                {patients.map((p) => (
                  <option key={p.pseudonym} value={p.pseudonym}>
                    {p.pseudonym} · {p.name}
                  </option>
                ))}
              </Select>
              <Button
                variant="secondary"
                aria-label="Novo paciente"
                onClick={() => setNewPatient(true)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </Field>
          <Field label="Operadora">
            <Select
              value={operator}
              onChange={(e) => set('operator_id', e.target.value)}
            >
              {ops.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Procedimento (TUSS)">
            <Input
              value={f.procedure_code}
              onChange={(e) => set('procedure_code', e.target.value.trim())}
              placeholder="40304361"
            />
          </Field>
          <Field label="Descrição">
            <Input
              value={f.procedure_desc}
              onChange={(e) => set('procedure_desc', e.target.value)}
              placeholder="Ressonância magnética de joelho"
            />
          </Field>
          <Field label="Quantidade">
            <Input
              type="number"
              min={1}
              value={f.quantity}
              onChange={(e) => set('quantity', Number(e.target.value))}
            />
          </Field>
          <Field label="CID">
            <Input
              value={f.cid}
              onChange={(e) => set('cid', e.target.value)}
              placeholder="M23.2"
            />
          </Field>
          <Field
            label="Complexidade (define o prazo da operadora)"
            className="sm:col-span-2"
          >
            <Select
              value={f.complexity}
              onChange={(e) => set('complexity', e.target.value as Complexity)}
            >
              {Object.entries(complexity).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Médico solicitante">
            <Input
              value={f.doctor_name}
              onChange={(e) => set('doctor_name', e.target.value)}
            />
          </Field>
          <Field label="CRM">
            <Input
              value={f.doctor_crm}
              onChange={(e) => set('doctor_crm', e.target.value)}
            />
          </Field>
        </div>
        <Field
          label="Justificativa escrita pelo médico"
          hint="Transcreva o que o médico escreveu. O sistema não redige nem complementa informação clínica; se faltar, peça ao médico."
        >
          <Textarea
            className="min-h-24"
            value={f.justification}
            onChange={(e) => set('justification', e.target.value)}
          />
        </Field>
        <div className="flex justify-end">
          <Button
            variant="module"
            size="lg"
            loading={create.isPending}
            disabled={
              !f.procedure_code || !(f.patient_pseudonym || patients[0])
            }
            onClick={() => create.mutate(undefined)}
          >
            Criar solicitação
          </Button>
        </div>
      </Card>
      <Card title="Exigências do contrato">
        {!req.data ? (
          <p className="text-[13px] text-ink-500">
            Informe o código TUSS para ver o que a operadora exige.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between text-[13px]">
              <span>Autorização prévia</span>
              <Badge
                tone={req.data.authorization_required ? 'warning' : 'neutral'}
              >
                {req.data.authorization_required
                  ? 'Obrigatória'
                  : 'Não consta no contrato'}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              <b className="text-[13px]">Documentos exigidos</b>
              {[
                'Pedido médico',
                'Guia de solicitação',
                ...req.data.documents,
              ].map((d) => (
                <Checkbox key={d} checked disabled>
                  {d}
                </Checkbox>
              ))}
            </div>
            {req.data.quantity_limit && (
              <Alert tone="warning">
                Limite contratual: {req.data.quantity_limit} por{' '}
                {req.data.limit_period === 'month'
                  ? 'mês'
                  : req.data.limit_period || 'período'}
                .
              </Alert>
            )}
            {req.data.sources.length > 0 && (
              <p className="text-xs text-ink-500">
                Fonte: {req.data.sources.join(' · ')}
              </p>
            )}
          </>
        )}
        <Alert tone="indigo">
          A lista vem das regras <b>confirmadas</b> em Contratos e aprende com
          os pedidos devolvidos.
        </Alert>
      </Card>
      <PatientModal
        open={newPatient}
        onClose={() => setNewPatient(false)}
        onCreated={(p) => set('patient_pseudonym', p)}
      />
    </div>
  )
}

function PatientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (pseudonym: string) => void
}) {
  const [p, setP] = useState({
    name: '',
    cpf: '',
    phone: '',
    whatsapp_consent: false,
  })
  const create = useAct(
    () => api<PatientView>('/authorizations/patients', { body: p }),
    {
      invalidate: ['/authorizations/patients'],
      success: 'Paciente cadastrado',
      onSuccess: (v) => {
        onCreated(v.pseudonym)
        setP({ name: '', cpf: '', phone: '', whatsapp_consent: false })
        onClose()
      },
    },
  )
  return (
    <Modal open={open} onClose={onClose} title="Novo paciente">
      <Alert tone="indigo">
        Nome, CPF e telefone ficam criptografados e isolados. O restante do
        sistema trabalha só com o identificador pseudonimizado.
      </Alert>
      <Field label="Nome completo">
        <Input
          value={p.name}
          onChange={(e) => setP({ ...p, name: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="CPF">
          <Input
            value={p.cpf}
            onChange={(e) => setP({ ...p, cpf: e.target.value })}
            inputMode="numeric"
          />
        </Field>
        <Field label="WhatsApp">
          <Input
            value={p.phone}
            onChange={(e) => setP({ ...p, phone: e.target.value })}
            placeholder="+55 11 99999-9999"
          />
        </Field>
      </div>
      <Checkbox
        checked={p.whatsapp_consent}
        onChange={(v) => setP({ ...p, whatsapp_consent: v })}
      >
        O paciente consentiu em receber mensagens sobre o andamento do pedido
        por WhatsApp.
      </Checkbox>
      <Button
        loading={create.isPending}
        disabled={!p.name.trim()}
        onClick={() => create.mutate(undefined)}
      >
        Cadastrar paciente
      </Button>
    </Modal>
  )
}
