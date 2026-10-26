import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
  BadgeAlert,
  Banknote,
  CalendarDays,
  ClipboardList,
  Clock,
  FilePlus2,
  FileText,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Logo, MODULES, ModuleIcon, cn } from '#/components/ui'
import type { ModuleKey } from '#/components/ui'
import { logoutFn } from '#/server/auth'
import { useAuth } from '#/stores/auth'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const NAV: Record<ModuleKey, NavItem[]> = {
  glosas: [
    { to: '/glosas/painel', label: 'Painel', icon: LayoutDashboard },
    { to: '/glosas/importacao', label: 'Importação', icon: Upload },
    { to: '/glosas/conciliacao', label: 'Conciliação', icon: ListChecks },
    { to: '/glosas/recursos', label: 'Recursos', icon: Sparkles },
    { to: '/glosas/contratos', label: 'Contratos', icon: FileText },
    { to: '/glosas/acompanhamento', label: 'Acompanhamento', icon: Clock },
    { to: '/glosas/prevencao', label: 'Prevenção', icon: ShieldCheck },
  ],
  aut: [
    { to: '/autorizacoes/painel', label: 'Painel', icon: LayoutDashboard },
    {
      to: '/autorizacoes/solicitacoes',
      label: 'Solicitações',
      icon: ClipboardList,
    },
    { to: '/autorizacoes/nova', label: 'Nova solicitação', icon: FilePlus2 },
    { to: '/autorizacoes/senhas', label: 'Senhas', icon: KeyRound },
    { to: '/autorizacoes/negativas', label: 'Negativas', icon: BadgeAlert },
    { to: '/autorizacoes/mensagens', label: 'Mensagens', icon: MessageSquare },
  ],
  rec: [
    { to: '/recebiveis/caixa', label: 'Caixa', icon: LayoutDashboard },
    { to: '/recebiveis/agenda', label: 'Agenda', icon: CalendarDays },
    {
      to: '/recebiveis/conciliacao-bancaria',
      label: 'Conciliação bancária',
      icon: Scale,
    },
    { to: '/recebiveis/cobrancas', label: 'Cobranças', icon: Banknote },
    { to: '/recebiveis/antecipacao', label: 'Antecipação', icon: Zap },
  ],
}

const CORE: NavItem[] = [
  { to: '/home', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/diagnostico', label: 'Diagnóstico gratuito', icon: Upload },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function moduleOf(pathname: string): ModuleKey | null {
  if (pathname.startsWith('/glosas')) return 'glosas'
  if (pathname.startsWith('/autorizacoes')) return 'aut'
  if (pathname.startsWith('/recebiveis')) return 'rec'
  return null
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const module = moduleOf(pathname)
  const me = useAuth((s) => s.me)
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [pathname])
  const items = module ? NAV[module] : CORE
  const initials = (me?.user.name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div data-module={module ?? 'core'} className="flex min-h-screen">
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-62 shrink-0 -translate-x-full flex-col gap-5 overflow-y-auto border-r border-ink-200 bg-white px-4 py-5 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open && 'translate-x-0',
        )}
      >
        <Link to="/home" aria-label="ReverteMed">
          <Logo />
        </Link>
        <nav
          aria-label="Módulos"
          className="flex gap-1.5 rounded-xl bg-ink-100 p-1"
        >
          {(Object.keys(MODULES) as ModuleKey[]).map((k) => (
            <Link
              key={k}
              to={MODULES[k].to}
              title={MODULES[k].name}
              className={cn(
                'grid flex-1 place-items-center rounded-[9px] px-2.5 py-1.5 transition',
                module === k
                  ? 'bg-white text-(--m) shadow-sm'
                  : 'text-ink-400 hover:text-ink-700',
              )}
            >
              <ModuleIcon module={k} className="size-[18px]" />
            </Link>
          ))}
        </nav>
        {module && (
          <div className="text-[11px] font-bold tracking-[0.08em] text-ink-400 uppercase">
            {MODULES[module].name}
          </div>
        )}
        <nav aria-label="Navegação" className="flex flex-col gap-0.5">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={{ exact: false }}
              className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 font-medium text-ink-700 transition hover:bg-ink-50 [&.active]:bg-(--m-bg) [&.active]:font-semibold [&.active]:text-ink-900 [&.active_svg]:text-(--m)"
            >
              <it.icon className="size-[18px] text-ink-500" />
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2.5 rounded-xl px-2 py-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">
              {me?.user.name}
            </div>
            <div className="truncate text-xs text-ink-500">
              {me?.organization.name}
            </div>
          </div>
          <button
            title="Sair"
            aria-label="Sair"
            className="cursor-pointer rounded-lg p-2 text-ink-500 hover:bg-ink-100"
            onClick={async () => {
              await logoutFn()
              useAuth.getState().clear()
              void navigate({ to: '/login', search: {} })
            }}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-ink-200 bg-white px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
          <button
            type="button"
            aria-label="Abrir menu"
            className="cursor-pointer rounded-lg p-2 text-ink-700 hover:bg-ink-100 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <form
            role="search"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-ink-100 px-3.5 py-2.5 text-[13px] text-ink-500 lg:max-w-sm lg:flex-none lg:basis-90"
            onSubmit={(e) => {
              e.preventDefault()
              void navigate({
                to: '/glosas/conciliacao',
                search: { q: q || undefined },
              })
            }}
          >
            <Search className="size-4" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar guia, TUSS ou procedimento"
              className="w-full bg-transparent outline-none placeholder:text-ink-400"
              aria-label="Buscar"
            />
          </form>
          <span className="hidden rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-700 xl:inline">
            {me?.organization.name} · CNPJ {formatCnpj(me?.organization.cnpj)}
          </span>
        </header>
        <main className="mx-auto flex w-full max-w-[1600px] min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function formatCnpj(v?: string) {
  if (!v || v.length !== 14) return v ?? ''
  return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`
}

export function PageHeader({
  title,
  sub,
  actions,
}: {
  title: string
  sub?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] leading-tight font-extrabold tracking-[-0.03em]">
          {title}
        </h1>
        {sub && <p className="mt-1 text-ink-500">{sub}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </div>
  )
}
