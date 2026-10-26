import { createFileRoute } from '@tanstack/react-router'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { useState } from 'react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import {
  Alert,
  Badge,
  Button,
  Card,
  Chip,
  Dropzone,
  EmptyState,
  Field,
  Input,
  Kpi,
  Modal,
  Select,
  Table,
  Td,
  Th,
} from '#/components/ui'
import type { Tone } from '#/components/ui'
import { api } from '#/lib/api'
import { date, money } from '#/lib/format'
import { useAct, useGet } from '#/lib/query'
import type {
  BankAccount,
  BankEntry,
  BankImportSummary,
  List,
  ReceivableView,
} from '#/lib/types'

export const Route = createFileRoute('/_app/recebiveis/conciliacao-bancaria')({
  head: () => ({ meta: [{ title: 'Conciliação bancária · ReverteMed' }] }),
  component: Page,
})

const st: Record<BankEntry['status'], [string, Tone]> = {
  matched: ['Conciliado', 'success'],
  underpaid: ['Pagamento menor', 'warning'],
  unidentified: ['Não identificado', 'danger'],
  unmatched: ['Pendente', 'neutral'],
}

function Page() {
  return (
    <>
      <PageHeader
        title="Conciliação bancária"
        sub="Cada crédito associado ao demonstrativo e ao lote correspondente"
      />
      <Boundary fallback={<div className="skeleton h-96" />}>
        <Bank />
      </Boundary>
    </>
  )
}

const filters = ['todos', 'pendencias', 'matched'] as const

function Bank() {
  const accounts = useGet<List<BankAccount>>('/receivables/bank/accounts').items
  const [accountId, setAccountId] = useState<string>('')
  const [newAcc, setNewAcc] = useState(false)
  const [summary, setSummary] = useState<BankImportSummary | null>(null)
  const account = accountId || accounts[0]?.id
  const importOfx = useAct(
    (file: File) => {
      const form = new FormData()
      form.set('file', file)
      return api<BankImportSummary>(
        `/receivables/bank/accounts/${account}/import`,
        { form },
      )
    },
    {
      invalidate: ['/receivables'],
      onSuccess: setSummary,
      success: 'Extrato importado',
    },
  )
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        {account ? (
          <Dropzone
            accept=".ofx,.OFX"
            busy={importOfx.isPending}
            onFiles={(f) => importOfx.mutate(f[0])}
            title="Importe o extrato (OFX)"
            hint="Somente créditos são lidos. Lançamentos repetidos são ignorados. Acesso sempre somente leitura."
          />
        ) : (
          <Card>
            <EmptyState
              title="Cadastre uma conta bancária"
              action={
                <Button
                  variant="module"
                  size="sm"
                  onClick={() => setNewAcc(true)}
                >
                  Nova conta
                </Button>
              }
            >
              Depois é só enviar o extrato OFX do banco.
            </EmptyState>
          </Card>
        )}
        <Card
          title="Contas"
          right={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setNewAcc(true)}
            >
              Nova conta
            </Button>
          }
        >
          {accounts.length > 0 && (
            <Select
              value={account}
              onChange={(e) => setAccountId(e.target.value)}
              aria-label="Conta"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.bank ? ` · ${a.bank}` : ''}
                </option>
              ))}
            </Select>
          )}
          <p className="text-xs text-ink-500">
            Integração Open Finance por agregador autorizado é uma evolução
            prevista; hoje a importação é por OFX.
          </p>
        </Card>
      </div>
      {summary && (
        <Alert tone="success">
          {summary.read} créditos lidos · <b>{summary.new} novos</b> ·{' '}
          {summary.matched} conciliados ({money(summary.matched_cents)}) ·{' '}
          {summary.underpaid} com pagamento menor · {summary.unidentified} não
          identificados · {summary.duplicates} repetidos ignorados.
        </Alert>
      )}
      <Boundary fallback={<div className="skeleton h-64" />}>
        <Entries />
      </Boundary>
      <NewAccount open={newAcc} onClose={() => setNewAcc(false)} />
    </>
  )
}

function Entries() {
  const [filter, setFilter] = useQueryState(
    'ver',
    parseAsStringLiteral(filters).withDefault('todos'),
  )
  const all = useGet<List<BankEntry>>('/receivables/bank/entries').items
  const [match, setMatch] = useState<BankEntry | null>(null)
  const rows = all.filter((e) =>
    filter === 'todos'
      ? true
      : filter === 'matched'
        ? e.status === 'matched'
        : e.status !== 'matched',
  )
  const count = (s: BankEntry['status']) =>
    all.filter((e) => e.status === s).length
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Lançamentos"
          value={String(all.length)}
          detail="créditos importados"
        />
        <Kpi
          tone="success"
          label="Conciliados"
          value={String(count('matched'))}
          detail={
            all.length
              ? `${Math.round((count('matched') / all.length) * 100)}% automático`
              : ''
          }
        />
        <Kpi
          tone="warning"
          label="Pagamento menor"
          value={String(count('underpaid'))}
          detail="menos que o demonstrativo"
        />
        <Kpi
          tone="danger"
          label="Não identificados"
          value={String(count('unidentified') + count('unmatched'))}
          detail="exigem ação"
        />
      </div>
      <div className="flex gap-2">
        {filters.map((f) => (
          <Chip key={f} active={filter === f} onClick={() => void setFilter(f)}>
            {
              {
                todos: 'Todos',
                pendencias: 'Pendências',
                matched: 'Conciliados',
              }[f]
            }
          </Chip>
        ))}
      </div>
      <Card flat>
        {rows.length === 0 ? (
          <EmptyState title="Nenhum lançamento">
            Importe um extrato OFX para conciliar.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Data</Th>
                <Th>Lançamento</Th>
                <Th right>Valor</Th>
                <Th>Associado a</Th>
                <Th>Situação</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <Td>{date(e.posted_on)}</Td>
                  <Td strong>{e.description}</Td>
                  <Td right>{money(e.amount_cents)}</Td>
                  <Td>
                    {e.batch_number
                      ? `Lote ${e.batch_number} · ${e.operator_name}${e.status === 'underpaid' && e.expected_cents ? ` (esperado ${money(e.expected_cents)})` : ''}`
                      : '—'}
                  </Td>
                  <Td>
                    <Badge tone={st[e.status][1]}>{st[e.status][0]}</Badge>
                  </Td>
                  <Td right>
                    {e.status !== 'matched' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setMatch(e)}
                      >
                        Resolver
                      </Button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <MatchModal entry={match} onClose={() => setMatch(null)} />
    </>
  )
}

function MatchModal({
  entry,
  onClose,
}: {
  entry: BankEntry | null
  onClose: () => void
}) {
  const open = useGet<List<ReceivableView>>('/receivables', {
    status: undefined,
  }).items.filter((r) => r.status !== 'paid')
  const [rid, setRid] = useState('')
  const match = useAct(
    () =>
      api(`/receivables/bank/entries/${entry!.id}/match`, {
        body: { receivable_id: rid || open[0]?.id },
      }),
    {
      invalidate: ['/receivables'],
      success: 'Lançamento conciliado',
      onSuccess: onClose,
    },
  )
  return (
    <Modal open={!!entry} onClose={onClose} title="Conciliar manualmente">
      {entry && (
        <>
          <p className="text-[13px] text-ink-500">
            {entry.description} · <b>{money(entry.amount_cents)}</b> em{' '}
            {date(entry.posted_on)}
          </p>
          <Field label="Recebível em aberto">
            <Select
              value={rid || open[0]?.id}
              onChange={(e) => setRid(e.target.value)}
            >
              {open.map((r) => (
                <option key={r.id} value={r.id}>
                  Lote {r.batch_number} · {r.operator_name} · esperado{' '}
                  {money(r.expected_cents)}
                </option>
              ))}
            </Select>
          </Field>
          <Button
            variant="module"
            loading={match.isPending}
            disabled={!open.length}
            onClick={() => match.mutate(undefined)}
          >
            Conciliar
          </Button>
        </>
      )}
    </Modal>
  )
}

function NewAccount({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [f, setF] = useState({ name: '', bank: '', agency: '', account: '' })
  const create = useAct(() => api('/receivables/bank/accounts', { body: f }), {
    invalidate: ['/receivables/bank'],
    success: 'Conta cadastrada',
    onSuccess: () => {
      setF({ name: '', bank: '', agency: '', account: '' })
      onClose()
    },
  })
  return (
    <Modal open={open} onClose={onClose} title="Nova conta bancária">
      <Field label="Apelido da conta">
        <Input
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          placeholder="Conta principal"
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Banco">
          <Input
            value={f.bank}
            onChange={(e) => setF({ ...f, bank: e.target.value })}
          />
        </Field>
        <Field label="Agência">
          <Input
            value={f.agency}
            onChange={(e) => setF({ ...f, agency: e.target.value })}
          />
        </Field>
        <Field label="Conta">
          <Input
            value={f.account}
            onChange={(e) => setF({ ...f, account: e.target.value })}
          />
        </Field>
      </div>
      <Button
        variant="module"
        loading={create.isPending}
        disabled={!f.name.trim()}
        onClick={() => create.mutate(undefined)}
      >
        Cadastrar
      </Button>
    </Modal>
  )
}
