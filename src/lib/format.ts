const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** Formats cents as R$ 1.234,56 */
export const money = (cents: number | null | undefined) =>
  brl.format((cents ?? 0) / 100)
export const moneyCompact = (cents: number | null | undefined) =>
  brlCompact.format((cents ?? 0) / 100)

export const pct = (v: number | null | undefined, digits = 1) =>
  `${(v ?? 0).toFixed(digits).replace('.', ',')}%`

export function date(v: string | Date | null | undefined) {
  if (!v) return '—'
  const d = typeof v === 'string' ? new Date(v) : v
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export function dateTime(v: string | null | undefined) {
  if (!v) return '—'
  return new Date(v).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

/** Date input value (YYYY-MM-DD) -> ISO string at UTC midnight for the API. */
export const toApiDate = (v: string) => (v ? `${v}T00:00:00Z` : '')
export const toInputDate = (d: Date) => d.toISOString().slice(0, 10)

export function daysLabel(n: number | null | undefined) {
  if (n === null || n === undefined) return '—'
  if (n < 0) return `${Math.abs(n)} d.u. em atraso`
  if (n === 0) return 'vence hoje'
  return `${n} d.u.`
}

export const monthLabel = (ym: string) =>
  new Date(`${ym}-01T00:00:00Z`)
    .toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' })
    .replace('.', '')

/** Parses a "1.234,56" or "1234.56" style input into cents. */
export function parseMoneyInput(v: string): number {
  const n = Number(v.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

export const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`

/** Human summary of what an imported TISS file contributed. */
export function importSummary(r: {
  kind: string
  items: number
  guides: number
  glossed_items: number
  glossed_cents: number
  appeals: number
  recovered_cents: number
  unmatched_items: number
}) {
  if (r.kind === 'appeal_request')
    return `${plural(r.appeals, 'recurso registrado', 'recursos registrados')} como enviado${r.unmatched_items ? ` · ${plural(r.unmatched_items, 'item sem correspondência', 'itens sem correspondência')}` : ''}`
  if (r.kind === 'appeal_response')
    return `${plural(r.appeals, 'resposta aplicada', 'respostas aplicadas')} · recuperado ${money(r.recovered_cents)}${r.unmatched_items ? ` · ${plural(r.unmatched_items, 'item sem correspondência', 'itens sem correspondência')}` : ''}`
  return `${r.items} itens em ${r.guides} guias${r.glossed_items ? ` · ${r.glossed_items} glosados (${money(r.glossed_cents)})` : ''}`
}
