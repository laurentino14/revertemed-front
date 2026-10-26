import { createFileRoute } from '@tanstack/react-router'
import { parseAsString, useQueryState } from 'nuqs'
import { Check, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import { OperatorSelect, useOperators } from '#/features/glosas/shared'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Table,
  Td,
  Textarea,
  Th,
} from '#/components/ui'
import { api } from '#/lib/api'
import { date, money, parseMoneyInput, toApiDate } from '#/lib/format'
import { ruleKind } from '#/lib/labels'
import { useAct, useGet } from '#/lib/query'
import type { ContractSummary, List, Rule, RuleKind } from '#/lib/types'

export const Route = createFileRoute('/_app/glosas/contratos')({
  head: () => ({ meta: [{ title: 'Contratos · ReverteMed' }] }),
  component: Page,
})

function Page() {
  const [newContract, setNewContract] = useState(false)
  return (
    <>
      <PageHeader
        title="Base de contratos"
        sub="Regras de cada operadora, consultadas pelos módulos de Glosas e Autorizações"
        actions={
          <Button onClick={() => setNewContract(true)}>
            <Plus className="size-4" />
            Novo contrato
          </Button>
        }
      />
      <Alert tone="brand">
        Um recurso que cita a cláusula do contrato ou o valor da tabela acordada
        tem muito mais chance de ser aceito. <b>Somente regras confirmadas</b>{' '}
        são usadas nas decisões.
      </Alert>
      <Boundary fallback={<div className="skeleton h-80" />}>
        <Contracts />
      </Boundary>
      <Boundary fallback={null}>
        <NewContract open={newContract} onClose={() => setNewContract(false)} />
      </Boundary>
    </>
  )
}

function Contracts() {
  const [selected, setSelected] = useQueryState('contrato', parseAsString)
  const [operator, setOperator] = useQueryState('operadora', parseAsString)
  const contracts = useGet<List<ContractSummary>>('/contracts', {
    operator_id: operator,
  }).items
  const current = contracts.find((c) => c.id === selected) ?? contracts[0]
  return (
    <>
      <div className="flex items-center gap-3">
        <Boundary fallback={<div className="skeleton h-11 w-56" />}>
          <OperatorSelect
            value={operator}
            onChange={(v) => void setOperator(v)}
            className="w-full sm:w-56"
          />
        </Boundary>
      </div>
      <Card title="Contratos por operadora" flat>
        {contracts.length === 0 ? (
          <EmptyState title="Nenhum contrato cadastrado">
            Cadastre o contrato de cada operadora para fundamentar recursos e
            checar exigências de autorização.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Operadora</Th>
                <Th>Vigência</Th>
                <Th>Arquivo</Th>
                <Th right>Regras</Th>
                <Th>Revisão</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr
                  key={c.id}
                  className={
                    c.id === current?.id ? 'bg-brand-50' : 'hover:bg-ink-50'
                  }
                >
                  <Td strong>{c.operator_name}</Td>
                  <Td>
                    {date(c.valid_from)} –{' '}
                    {c.valid_to ? date(c.valid_to) : 'indeterminada'}
                  </Td>
                  <Td>{c.file_name || '—'}</Td>
                  <Td right>{c.rules_count}</Td>
                  <Td>
                    {c.pending_rules ? (
                      <Badge tone="warning">
                        {c.pending_rules} para revisar
                      </Badge>
                    ) : (
                      <Badge tone="success">Confirmadas</Badge>
                    )}
                  </Td>
                  <Td right>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void setSelected(c.id)}
                    >
                      Ver regras
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {current && (
        <Boundary key={current.id} fallback={<div className="skeleton h-64" />}>
          <Rules contract={current} />
        </Boundary>
      )}
    </>
  )
}

function Rules({ contract }: { contract: ContractSummary }) {
  const path = `/contracts/${contract.id}/rules`
  const rules = useGet<List<Rule>>(path).items
  const [open, setOpen] = useState(false)
  const inv = ['/contracts', '/contract-rules']
  const confirm = useAct(
    (id: string) => api(`/contract-rules/${id}/confirm`, { method: 'POST' }),
    { invalidate: inv, success: 'Regra confirmada' },
  )
  const del = useAct(
    (id: string) => api(`/contract-rules/${id}`, { method: 'DELETE' }),
    { invalidate: inv, success: 'Regra removida' },
  )
  const describe = (r: Rule) =>
    r.kind === 'value' && r.value_cents !== null
      ? money(r.value_cents)
      : r.limit_qty
        ? `Máx. ${r.limit_qty}${r.limit_period ? `/${r.limit_period}` : ''}`
        : r.deadline_days
          ? `${r.deadline_days} dias`
          : '—'
  return (
    <Card
      title={`Regras · ${contract.operator_name}`}
      flat
      right={
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Nova regra
        </Button>
      }
    >
      {rules.length === 0 ? (
        <EmptyState title="Sem regras neste contrato">
          Adicione valores acordados, exigências de autorização, limites e
          documentos obrigatórios.
        </EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Tipo</Th>
              <Th>Procedimento</Th>
              <Th>Valor / limite</Th>
              <Th>Exigência</Th>
              <Th>Origem</Th>
              <Th>Situação</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id}>
                <Td>
                  <Badge tone="brand">{ruleKind[r.kind]}</Badge>
                </Td>
                <Td strong>{r.procedure_code || 'Todos'}</Td>
                <Td>{describe(r)}</Td>
                <Td>{r.requirement || '—'}</Td>
                <Td>{r.source_excerpt || '—'}</Td>
                <Td>
                  {r.confirmed_at ? (
                    <Badge tone="success">Confirmada</Badge>
                  ) : (
                    <Badge tone="warning">Pendente</Badge>
                  )}
                </Td>
                <Td right>
                  <div className="flex justify-end gap-2">
                    {!r.confirmed_at && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => confirm.mutate(r.id)}
                      >
                        <Check className="size-4" />
                        Confirmar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Remover regra"
                      onClick={() => del.mutate(r.id)}
                    >
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <RuleModal
        open={open}
        onClose={() => setOpen(false)}
        contractId={contract.id}
      />
    </Card>
  )
}

function RuleModal({
  open,
  onClose,
  contractId,
}: {
  open: boolean
  onClose: () => void
  contractId: string
}) {
  const empty = {
    kind: 'authorization' as RuleKind,
    procedure_code: '',
    value: '',
    limit_qty: '',
    limit_period: 'month',
    requirement: '',
    deadline_days: '',
    source_excerpt: '',
  }
  const [f, setF] = useState(empty)
  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }))
  const add = useAct(
    () =>
      api(`/contracts/${contractId}/rules`, {
        body: {
          kind: f.kind,
          procedure_code: f.procedure_code,
          value_cents:
            f.kind === 'value' ? parseMoneyInput(f.value) : undefined,
          limit_qty: f.kind === 'quantity' ? Number(f.limit_qty) : undefined,
          limit_period: f.kind === 'quantity' ? f.limit_period : undefined,
          requirement: f.requirement,
          deadline_days: f.deadline_days ? Number(f.deadline_days) : undefined,
          source_excerpt: f.source_excerpt,
        },
      }),
    {
      invalidate: ['/contracts'],
      success: 'Regra adicionada. Confirme para que ela passe a valer.',
      onSuccess: () => {
        setF(empty)
        onClose()
      },
    },
  )
  return (
    <Modal open={open} onClose={onClose} title="Nova regra" wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          <Select value={f.kind} onChange={set('kind')}>
            {Object.entries(ruleKind).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Procedimento (TUSS)"
          hint="Vazio = todos os procedimentos"
        >
          <Input
            value={f.procedure_code}
            onChange={set('procedure_code')}
            placeholder="40304361"
          />
        </Field>
        {f.kind === 'value' && (
          <Field label="Valor acordado (R$)">
            <Input
              inputMode="decimal"
              value={f.value}
              onChange={set('value')}
              placeholder="780,00"
            />
          </Field>
        )}
        {f.kind === 'quantity' && (
          <>
            <Field label="Quantidade máxima">
              <Input
                type="number"
                min={1}
                value={f.limit_qty}
                onChange={set('limit_qty')}
              />
            </Field>
            <Field label="Por período">
              <Select value={f.limit_period} onChange={set('limit_period')}>
                <option value="month">Mês</option>
                <option value="day">Dia</option>
                <option value="">Total</option>
              </Select>
            </Field>
          </>
        )}
        {(f.kind === 'appeal' || f.kind === 'authorization') && (
          <Field
            label="Prazo (dias)"
            hint={
              f.kind === 'appeal'
                ? 'Prazo para recorrer após o demonstrativo'
                : 'Validade da senha'
            }
          >
            <Input
              type="number"
              min={1}
              value={f.deadline_days}
              onChange={set('deadline_days')}
            />
          </Field>
        )}
      </div>
      <Field label="Exigência / descrição">
        <Textarea
          className="min-h-20"
          value={f.requirement}
          onChange={set('requirement')}
          placeholder="Ex.: Relatório médico anexo; Senha válida por 30 dias"
        />
      </Field>
      <Field
        label="Trecho de origem"
        hint="Cláusula ou página do contrato; é citado nos recursos"
      >
        <Input
          value={f.source_excerpt}
          onChange={set('source_excerpt')}
          placeholder="Cláusula 7.2"
        />
      </Field>
      <Button loading={add.isPending} onClick={() => add.mutate(undefined)}>
        Adicionar regra
      </Button>
    </Modal>
  )
}

function NewContract({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const ops = useOperators()
  const [f, setF] = useState({
    operator_id: '',
    valid_from: '',
    valid_to: '',
    file_name: '',
    notes: '',
  })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }))
  const create = useAct(
    () =>
      api('/contracts', {
        body: {
          operator_id: f.operator_id || ops[0]?.id,
          valid_from: toApiDate(f.valid_from),
          valid_to: f.valid_to ? toApiDate(f.valid_to) : undefined,
          file_name: f.file_name,
          notes: f.notes,
        },
      }),
    {
      invalidate: ['/contracts'],
      success: 'Contrato cadastrado',
      onSuccess: onClose,
    },
  )
  return (
    <Modal open={open} onClose={onClose} title="Novo contrato">
      {ops.length === 0 ? (
        <Alert tone="warning">
          Cadastre uma operadora em Configurações antes de criar contratos.
        </Alert>
      ) : (
        <>
          <Field label="Operadora">
            <Select
              value={f.operator_id || ops[0]?.id}
              onChange={set('operator_id')}
            >
              {ops.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Início da vigência">
              <Input
                type="date"
                value={f.valid_from}
                onChange={set('valid_from')}
                required
              />
            </Field>
            <Field label="Fim (opcional)">
              <Input
                type="date"
                value={f.valid_to}
                onChange={set('valid_to')}
              />
            </Field>
          </div>
          <Field label="Nome do arquivo (referência)">
            <Input
              value={f.file_name}
              onChange={set('file_name')}
              placeholder="contrato-2026.pdf"
            />
          </Field>
          <Button
            loading={create.isPending}
            disabled={!f.valid_from}
            onClick={() => create.mutate(undefined)}
          >
            Cadastrar
          </Button>
        </>
      )}
    </Modal>
  )
}
