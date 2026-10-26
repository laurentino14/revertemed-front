import { useState } from 'react'
import { Boundary } from '#/components/app/states'
import { Alert, Card, Dropzone } from '#/components/ui'
import { api, errorMessage } from '#/lib/api'
import { importSummary } from '#/lib/format'
import { useAct } from '#/lib/query'
import type { ImportResult } from '#/lib/types'
import { OperatorSelect } from './shared'

/** Upload of TISS XML files with per-file results (shared by the import page and the free diagnostic). */
export function TissUploader({ onDone }: { onDone?: () => void }) {
  const [operator, setOperator] = useState<string | null>(null)
  const [results, setResults] = useState<
    { name: string; ok: boolean; text: string }[]
  >([])
  const upload = useAct(
    async (files: File[]) => {
      const out: typeof results = []
      for (const f of files) {
        const form = new FormData()
        form.set('file', f)
        if (operator) form.set('operator_id', operator)
        try {
          const r = await api<ImportResult>('/glosas/files', { form })
          out.push({
            name: f.name,
            ok: true,
            text: importSummary(r),
          })
        } catch (e) {
          out.push({ name: f.name, ok: false, text: errorMessage(e) })
        }
      }
      setResults(out)
      return out
    },
    { invalidate: ['/glosas', '/receivables'], onSuccess: () => onDone?.() },
  )
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Dropzone
          accept=".xml,text/xml,application/xml"
          multiple
          busy={upload.isPending}
          onFiles={(f) => upload.mutate(f)}
          title="Arraste XMLs TISS aqui"
          hint="Validação contra o schema, duplicidades ignoradas (lote + protocolo + guia). O arquivo original fica armazenado para auditoria."
        />
        <Card title="Operadora do arquivo">
          <p className="text-[13px] text-ink-500">
            Normalmente identificada pelo registro ANS do XML. Se a operadora
            ainda não estiver cadastrada, escolha aqui.
          </p>
          <Boundary fallback={<div className="skeleton h-12" />}>
            <OperatorSelect
              value={operator}
              onChange={setOperator}
              placeholder="Identificar pelo ANS do arquivo"
            />
          </Boundary>
        </Card>
      </div>
      {results.map((r) => (
        <Alert key={r.name} tone={r.ok ? 'success' : 'danger'}>
          <b>{r.name}</b>: {r.text}
        </Alert>
      ))}
    </>
  )
}
