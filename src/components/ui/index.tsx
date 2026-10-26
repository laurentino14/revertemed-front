import { Link } from '@tanstack/react-router'
import clsx from 'clsx'
import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  Check,
  CheckCircle2,
  CircleAlert,
  Info,
  Loader2,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { money as formatBRL } from '#/lib/format'
import { useUI } from '#/stores/ui'

export const cn = (...v: ClassValue[]) => twMerge(clsx(v))

/* ---------------- Brand ---------------- */

export function RevertGlyph({
  className = 'size-5',
  stroke = 'currentColor',
}: {
  className?: string
  stroke?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 9v6M9 12h6" />
    </svg>
  )
}

export function Logo({
  dark = false,
  size = 36,
  className,
}: {
  dark?: boolean
  size?: number
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-[9px]', className)}>
      <span
        className={cn(
          'grid place-items-center rounded-[10px]',
          dark ? 'bg-mint text-brand-900' : 'bg-brand-600 text-white',
        )}
        style={{ width: size, height: size }}
      >
        <RevertGlyph className="size-[60%]" />
      </span>
      <span
        className={cn(
          'font-display font-extrabold tracking-[-0.04em]',
          dark ? 'text-white' : 'text-ink-900',
        )}
        style={{ fontSize: size * 0.62 }}
      >
        Reverte
        <span className={dark ? 'text-mint' : 'text-brand-600'}>Med</span>
      </span>
    </span>
  )
}

export type ModuleKey = 'glosas' | 'aut' | 'rec'

export const MODULES: Record<
  ModuleKey,
  { name: string; color: string; bg: string; to: string }
> = {
  glosas: {
    name: 'Glosas',
    color: 'bg-glosas',
    bg: 'bg-glosas-bg',
    to: '/glosas/painel',
  },
  aut: {
    name: 'Autorizações',
    color: 'bg-aut',
    bg: 'bg-aut-bg',
    to: '/autorizacoes/painel',
  },
  rec: {
    name: 'Recebíveis',
    color: 'bg-rec',
    bg: 'bg-rec-bg',
    to: '/recebiveis/caixa',
  },
}

export function ModuleIcon({
  module,
  className = 'size-5',
}: {
  module: ModuleKey
  className?: string
}) {
  if (module === 'glosas') return <RevertGlyph className={className} />
  if (module === 'aut') return <ShieldCheck className={className} />
  return <TrendingUp className={className} />
}

export function ModuleMark({
  module,
  size = 48,
}: {
  module: ModuleKey
  size?: number
}) {
  return (
    <span
      className={cn(
        'grid place-items-center rounded-[14px] text-white',
        MODULES[module].color,
      )}
      style={{ width: size, height: size }}
    >
      <ModuleIcon module={module} className="size-1/2" />
    </span>
  )
}

/* ---------------- Buttons ---------------- */

const btnVariants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'bg-white text-ink-900 border-ink-300 hover:bg-ink-50',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'bg-danger text-white hover:bg-red-700',
  accent: 'bg-mint text-brand-900 hover:brightness-95',
  module: 'bg-(--m) text-white hover:brightness-95',
}
const btnSizes = {
  sm: 'px-3 py-2 text-[13px]',
  md: 'px-5 py-3 text-[15px]',
  lg: 'px-6 py-4 text-base',
}

export function btn(
  variant: keyof typeof btnVariants = 'primary',
  size: keyof typeof btnSizes = 'md',
  extra?: ClassValue,
) {
  return cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-transparent font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
    btnVariants[variant],
    btnSizes[size],
    extra,
  )
}

interface ButtonProps extends ComponentProps<'button'> {
  variant?: keyof typeof btnVariants
  size?: keyof typeof btnSizes
  loading?: boolean
  block?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  block,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={btn(variant, size, [block && 'w-full', className])}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ComponentProps<typeof Link> & {
  variant?: keyof typeof btnVariants
  size?: keyof typeof btnSizes
}) {
  return <Link className={btn(variant, size, className)} {...rest} />
}

/* ---------------- Badge / Chip / Alert ---------------- */

const tones = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  neutral: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-100 text-brand-700',
  indigo: 'bg-aut-bg text-aut',
  amber: 'bg-rec-bg text-rec',
}
export type Tone = keyof typeof tones

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-[7px] text-[13px] font-medium transition',
        active
          ? 'border-ink-900 bg-ink-900 text-white'
          : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
        className,
      )}
    >
      {children}
    </button>
  )
}

const alertStyles = {
  info: ['bg-info-bg', Info, 'text-info'],
  success: ['bg-success-bg', CheckCircle2, 'text-success'],
  warning: ['bg-warning-bg', TriangleAlert, 'text-warning'],
  danger: ['bg-danger-bg', CircleAlert, 'text-danger'],
  brand: ['bg-brand-50', Info, 'text-brand-600'],
  indigo: ['bg-aut-bg', Info, 'text-aut'],
} as const

export function Alert({
  tone = 'info',
  children,
  action,
  className,
}: {
  tone?: keyof typeof alertStyles
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  const [bg, Icon, ic] = alertStyles[tone]
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl p-4 text-[13px]',
        bg,
        className,
      )}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', ic)} />
      <div className="min-w-0 flex-1 text-ink-700">{children}</div>
      {action}
    </div>
  )
}

/* ---------------- Cards ---------------- */

export function Card({
  title,
  right,
  children,
  className,
  flat,
}: {
  title?: ReactNode
  right?: ReactNode
  children?: ReactNode
  className?: string
  flat?: boolean
}) {
  return (
    <section
      className={cn(
        'flex flex-col rounded-2xl border border-ink-200 bg-white',
        flat ? 'overflow-hidden' : 'gap-4 p-5',
        className,
      )}
    >
      {title && (
        <div
          className={cn(
            'flex items-center justify-between gap-3',
            flat && 'p-5 pb-4',
          )}
        >
          <h3 className="font-display text-[17px] font-bold">{title}</h3>
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

export function Kpi({
  label,
  value,
  detail,
  tone,
  loading,
}: {
  label: string
  value: ReactNode
  detail?: ReactNode
  tone?: 'danger' | 'success' | 'warning' | 'aut' | 'rec'
  loading?: boolean
}) {
  const color = {
    danger: 'text-danger',
    success: 'text-success',
    warning: 'text-warning',
    aut: 'text-aut',
    rec: 'text-rec',
  }[tone ?? 'success']
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-ink-200 bg-white p-5">
      <span className="text-[13px] font-medium text-ink-500">{label}</span>
      {loading ? (
        <div className="skeleton h-9 w-32" />
      ) : (
        <span
          className={cn(
            'num font-display text-[28px] font-extrabold tracking-[-0.03em]',
            tone ? color : 'text-ink-900',
          )}
        >
          {value}
        </span>
      )}
      {detail && (
        <span className="text-xs font-medium text-ink-500">{detail}</span>
      )}
    </div>
  )
}

export function Progress({
  value,
  className,
  color = 'bg-brand-600',
}: {
  value: number
  className?: string
  color?: string
}) {
  return (
    <div
      className={cn('h-2 overflow-hidden rounded bg-ink-100', className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded', color)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export function HBar({
  label,
  value,
  pct,
  color,
}: {
  label: string
  value: string
  pct: number
  color?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between gap-3 text-[13px]">
        <span className="font-medium text-ink-700">{label}</span>
        <b className="num font-semibold">{value}</b>
      </div>
      <Progress value={pct} color={color} />
    </div>
  )
}

/* ---------------- Forms ---------------- */

export function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label?: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-[13px] font-medium text-ink-700">{label}</span>
      )}
      {children}
      {error ? (
        <span className="text-xs font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-500">{hint}</span>
      ) : null}
    </label>
  )
}

const control =
  'w-full rounded-[10px] border border-ink-300 bg-white px-3.5 py-3 text-[15px] text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-2 focus:-outline-offset-1 focus:outline-brand-600 disabled:bg-ink-50'

export function Input({
  className,
  invalid,
  ...rest
}: ComponentProps<'input'> & { invalid?: boolean }) {
  return (
    <input
      className={cn(control, invalid && 'border-2 border-danger', className)}
      {...rest}
    />
  )
}
export function Select({
  className,
  children,
  ...rest
}: ComponentProps<'select'>) {
  return (
    <select className={cn(control, 'cursor-pointer pr-8', className)} {...rest}>
      {children}
    </select>
  )
}
export function Textarea({ className, ...rest }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(control, 'min-h-28 resize-y leading-relaxed', className)}
      {...rest}
    />
  )
}

export function Checkbox({
  checked,
  onChange,
  children,
  disabled,
}: {
  checked: boolean
  onChange?: (v: boolean) => void
  children?: ReactNode
  disabled?: boolean
}) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-start gap-2.5 text-[13px] leading-snug text-ink-700',
        disabled ? 'opacity-60' : 'cursor-pointer',
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span className="mt-px grid size-5 shrink-0 place-items-center rounded-[5px] border-[1.5px] border-ink-300 bg-white text-white peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-brand-600">
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      {children && <span>{children}</span>}
    </label>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[22px] w-10 shrink-0 cursor-pointer rounded-full transition',
        checked ? 'bg-brand-600' : 'bg-ink-300',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-[18px] rounded-full bg-white transition-all',
          checked ? 'left-5' : 'left-0.5',
        )}
      />
    </button>
  )
}

export function Dropzone({
  accept,
  onFiles,
  busy,
  title,
  hint,
  multiple,
}: {
  accept: string
  onFiles: (f: File[]) => void
  busy?: boolean
  title: string
  hint?: string
  multiple?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const files = [...e.dataTransfer.files]
        if (files.length) onFiles(files)
      }}
      className={cn(
        'flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition',
        over ? 'border-brand-600 bg-brand-100' : 'border-brand-500 bg-brand-50',
      )}
    >
      {busy ? (
        <Loader2 className="size-8 animate-spin text-brand-600" />
      ) : (
        <Upload className="size-8 text-brand-600" />
      )}
      <b className="font-display text-lg font-bold">{title}</b>
      {hint && <span className="text-[13px] text-ink-500">{hint}</span>}
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])]
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
      />
      <Button
        size="sm"
        className="mt-1"
        onClick={() => ref.current?.click()}
        disabled={busy}
      >
        Escolher arquivo{multiple ? 's' : ''}
      </Button>
    </div>
  )
}

/* ---------------- Tabs ---------------- */

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T
  onChange: (v: T) => void
  items: { value: T; label: string; count?: number }[]
}) {
  return (
    <div
      className="flex gap-1 overflow-x-auto border-b border-ink-200"
      role="tablist"
    >
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={cn(
            '-mb-px flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 font-medium transition',
            value === it.value
              ? 'border-(--m) font-semibold text-ink-900'
              : 'border-transparent text-ink-500 hover:text-ink-700',
          )}
        >
          {it.label}
          {it.count !== undefined && (
            <span className="rounded-full bg-(--m-bg) px-2 py-px text-xs font-semibold text-ink-900">
              {it.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ---------------- Table ---------------- */

export function Table({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  )
}
export function Th({
  children,
  right,
  className,
}: {
  children?: ReactNode
  right?: boolean
  className?: string
}) {
  return (
    <th
      className={cn(
        'bg-ink-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-500',
        right ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </th>
  )
}
export function Td({
  children,
  right,
  className,
  strong,
  colSpan,
  wrap,
}: {
  children?: ReactNode
  right?: boolean
  className?: string
  strong?: boolean
  colSpan?: number
  wrap?: boolean
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        'border-t border-ink-100 px-4 py-3.5 align-middle text-ink-700',
        !wrap && 'whitespace-nowrap',
        right && 'num text-right',
        strong && 'font-medium text-ink-900',
        className,
      )}
    >
      {children}
    </td>
  )
}

/* ---------------- States ---------------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn('size-5 animate-spin text-brand-600', className)} />
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <b className="font-display text-base font-bold">{title}</b>
      {children && (
        <p className="max-w-md text-[13px] text-ink-500">{children}</p>
      )}
      {action}
    </div>
  )
}

/* ---------------- Modal / Toasts ---------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        'm-auto w-full rounded-2xl p-0 backdrop:bg-ink-900/50',
        wide ? 'max-w-2xl' : 'max-w-lg',
      )}
    >
      {open && (
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-extrabold">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="cursor-pointer rounded-lg p-1 text-ink-500 hover:bg-ink-100"
            >
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}

export function Toaster() {
  const toasts = useUI((s) => s.toasts)
  const dismiss = useUI((s) => s.dismiss)
  return (
    <div
      className="fixed right-4 bottom-4 z-50 flex w-[calc(100vw-2rem)] max-w-80 flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cn(
            'cursor-pointer rounded-xl px-4 py-3 text-left text-[13px] font-medium shadow-lg',
            t.tone === 'success' && 'bg-brand-900 text-white',
            t.tone === 'error' && 'bg-danger text-white',
            t.tone === 'info' && 'bg-ink-900 text-white',
          )}
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}

/** Small colored status text used in tables. */
export function Money({
  cents,
  tone,
  className,
}: {
  cents: number | null | undefined
  tone?: 'danger' | 'success'
  className?: string
}) {
  return (
    <span
      className={cn(
        'num',
        tone === 'danger' && 'font-semibold text-danger',
        tone === 'success' && 'font-semibold text-success',
        className,
      )}
    >
      {formatBRL(cents)}
    </span>
  )
}
