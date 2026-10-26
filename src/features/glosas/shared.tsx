import { Select } from '#/components/ui'
import { useGet } from '#/lib/query'
import type { List, Operator } from '#/lib/types'

export function useOperators() {
  return useGet<List<Operator>>('/operators').items
}

export function OperatorSelect({
  value,
  onChange,
  placeholder = 'Todas as operadoras',
  className,
}: {
  value: string | null
  onChange: (v: string | null) => void
  placeholder?: string
  className?: string
}) {
  const ops = useOperators()
  return (
    <Select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={className}
      aria-label="Operadora"
    >
      <option value="">{placeholder}</option>
      {ops.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </Select>
  )
}
