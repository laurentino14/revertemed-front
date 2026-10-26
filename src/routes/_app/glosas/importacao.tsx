import { createFileRoute } from '@tanstack/react-router'
import { RotateCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Boundary } from '#/components/app/states'
import { PageHeader } from '#/components/app/shell'
import { TissUploader } from '#/features/glosas/uploader'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  Table,
  Td,
  Th,
} from '#/components/ui'
import { OperatorSelect } from '#/features/glosas/shared'
import { api } from '#/lib/api'
import { dateTime, importSummary } from '#/lib/format'
import type { Tone } from '#/components/ui'
import { fileKind } from '#/lib/labels'
import { useAct, useGet } from '#/lib/query'
import { toast } from '#/stores/ui'
import type { ImportResult, List, TissFile } from '#/lib/types'

export const Route = createFileRoute('/_app/glosas/importacao')({
  head: () => ({ meta: [{ title: 'Importação TISS · ReverteMed' }] }),
  component: Page,
})

const statusTone: Record<TissFile['status'], [string, Tone]> = {
  processed: ['Conciliado', 'success'],
  processing: ['Processando', 'info'],
  error: ['Erro de leitura', 'danger'],
}

function Page() {
  return (
    <>
      <PageHeader
        title="Importação de arquivos TISS"
        sub="Lotes enviados, demonstrativos de análise e de pagamento"
      />
      <TissUploader />
      <Card title="Arquivos recentes" flat>
        <Boundary>
          <Files />
        </Boundary>
      </Card>
      <Alert tone="info">
        Muitas operadoras só disponibilizam o demonstrativo no portal. Por
        enquanto, baixe o arquivo e envie aqui; a automação dos portais entra
        numa fase posterior.
      </Alert>
    </>
  )
}

function Files() {
  const files = useGet<List<TissFile>>('/glosas/files').items
  const [retry, setRetry] = useState<TissFile | null>(null)
  const del = useAct(
    (f: TissFile) => api(`/glosas/files/${f.id}`, { method: 'DELETE' }),
    { invalidate: ['/glosas/files'], success: 'Arquivo excluído' },
  )
  if (!files.length)
    return (
      <EmptyState title="Nenhum arquivo importado">
        Envie um XML TISS para começar a conciliação.
      </EmptyState>
    )
  return (
    <>
      <Table>
        <thead>
          <tr>
            <Th>Arquivo</Th>
            <Th>Tipo</Th>
            <Th>Operadora</Th>
            <Th>Lote</Th>
            <Th right>Itens</Th>
            <Th>Status</Th>
            <Th>Enviado por</Th>
            <Th>Quando</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.id}>
              <Td strong wrap className="min-w-64 whitespace-normal">
                {f.file_name}
                {f.status === 'error' && (
                  <div className="mt-1 text-xs font-normal text-danger">
                    {f.error_line > 0 && `Linha ${f.error_line}: `}
                    {f.error_message}
                  </div>
                )}
              </Td>
              <Td>{fileKind[f.kind] ?? f.kind}</Td>
              <Td>{f.operator_name ?? '—'}</Td>
              <Td>{f.batch_number ?? '—'}</Td>
              <Td right>{f.items_count}</Td>
              <Td>
                <Badge tone={statusTone[f.status][1]}>
                  {statusTone[f.status][0]}
                </Badge>
              </Td>
              <Td>{f.uploaded_by ?? '—'}</Td>
              <Td>{dateTime(f.created_at)}</Td>
              <Td right>
                {f.status === 'error' && (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setRetry(f)}
                    >
                      <RotateCw className="size-4" />
                      Ler novamente
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Excluir ${f.file_name}`}
                      loading={del.isPending && del.variables.id === f.id}
                      onClick={() => del.mutate(f)}
                    >
                      <Trash2 className="size-4 text-danger" />
                      <span className="text-danger">Excluir</span>
                    </Button>
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <RetryModal file={retry} onClose={() => setRetry(null)} />
    </>
  )
}

function RetryModal({
  file,
  onClose,
}: {
  file: TissFile | null
  onClose: () => void
}) {
  const [operator, setOperator] = useState<string | null>(null)
  const [error, setError] = useState('')
  const retry = useAct(
    (f: TissFile) =>
      api<ImportResult>(`/glosas/files/${f.id}/reprocess`, {
        body: { operator_id: operator },
      }),
    {
      invalidate: ['/glosas', '/receivables'],
      onSuccess: (r) => {
        setError('')
        toast.success(`Arquivo lido: ${importSummary(r)}`)
        onClose()
      },
    },
  )
  return (
    <Modal open={!!file} onClose={onClose} title="Ler arquivo novamente">
      {file && (
        <>
          <p className="text-[13px] text-ink-500">
            O arquivo original de{' '}
            <b className="text-ink-900">{file.file_name}</b> está guardado. Se o
            erro foi por operadora não cadastrada, escolha a operadora abaixo
            (ou cadastre-a em Configurações) e tente de novo.
          </p>
          {file.error_message && (
            <Alert tone="danger">{file.error_message}</Alert>
          )}
          <OperatorSelect
            value={operator}
            onChange={setOperator}
            placeholder="Identificar pelo ANS do arquivo"
          />
          {error && <Alert tone="danger">{error}</Alert>}
          <Button
            loading={retry.isPending}
            onClick={() =>
              retry.mutate(file, { onError: (e) => setError(e.message) })
            }
          >
            <RotateCw className="size-4" />
            Ler novamente
          </Button>
        </>
      )}
    </Modal>
  )
}
