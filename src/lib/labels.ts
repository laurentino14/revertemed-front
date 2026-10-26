import type { Tone } from '#/components/ui'
import type {
  AppealStatus,
  Complexity,
  ItemStatus,
  ReceivableStatus,
  RequestStatus,
} from './types'

export const itemStatus: Record<ItemStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pendente', tone: 'neutral' },
  paid: { label: 'Pago', tone: 'success' },
  partial: { label: 'Glosa parcial', tone: 'warning' },
  total: { label: 'Glosa total', tone: 'danger' },
}

export const appealStatus: Record<AppealStatus, { label: string; tone: Tone }> =
  {
    draft: { label: 'Rascunho', tone: 'neutral' },
    awaiting_approval: { label: 'Aguardando aprovação', tone: 'brand' },
    approved: { label: 'Aprovado', tone: 'info' },
    submitted: { label: 'Enviado', tone: 'info' },
    recovered: { label: 'Recuperado', tone: 'success' },
    partially_recovered: { label: 'Parcial', tone: 'warning' },
    denied: { label: 'Negado', tone: 'danger' },
    discarded: { label: 'Descartado', tone: 'neutral' },
  }

export const category: Record<string, string> = {
  authorization: 'Autorização',
  value: 'Valor divergente',
  documentation: 'Documentação',
  quantity: 'Quantidade',
  duplicate: 'Duplicidade',
  code: 'Código TUSS',
  other: 'Outros',
}

export const requestStatus: Record<
  RequestStatus,
  { label: string; tone: Tone }
> = {
  draft: { label: 'Rascunho', tone: 'neutral' },
  sent: { label: 'Enviada', tone: 'info' },
  in_review: { label: 'Em análise', tone: 'info' },
  returned: { label: 'Devolvida', tone: 'warning' },
  authorized: { label: 'Autorizada', tone: 'success' },
  denied: { label: 'Negada', tone: 'danger' },
}

export const complexity: Record<Complexity, string> = {
  normal: 'Padrão (até 5 d.u.)',
  high: 'Alta complexidade (até 10 d.u.)',
  elective_admission: 'Internação eletiva (até 10 d.u.)',
  urgent: 'Urgência/emergência (imediata)',
}

export const receivableStatus: Record<
  ReceivableStatus,
  { label: string; tone: Tone }
> = {
  in_review: { label: 'Em análise', tone: 'info' },
  with_statement: { label: 'Com demonstrativo', tone: 'brand' },
  paid: { label: 'Pago', tone: 'success' },
  partial: { label: 'Pago parcialmente', tone: 'warning' },
  overdue: { label: 'Atrasado', tone: 'danger' },
}

export const fileKind: Record<string, string> = {
  batch: 'Lote de guias',
  analysis_statement: 'Demonstrativo de análise',
  payment_statement: 'Demonstrativo de pagamento',
  appeal_request: 'Recurso de glosa',
  appeal_response: 'Resposta de recurso',
  unknown: 'Não identificado',
}

export const ruleKind: Record<string, string> = {
  value: 'Valor',
  authorization: 'Autorização',
  appeal: 'Recurso',
  quantity: 'Quantidade',
  document: 'Documento',
  code: 'Código',
}
