import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Logo } from '#/components/ui'

export function AuthLayout({
  title,
  text,
  bullets,
  children,
}: {
  title: string
  text: string
  bullets: string[]
  children: ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[560px_1fr]">
      <aside className="hidden flex-col justify-between gap-6 bg-brand-900 px-18 py-16 text-white lg:flex">
        <Link to="/" aria-label="ReverteMed">
          <Logo dark />
        </Link>
        <div>
          <h2 className="mb-4 font-display text-[40px] leading-[1.15] font-extrabold tracking-[-0.03em]">
            {title}
          </h2>
          <p className="text-[17px] leading-relaxed text-brand-100">{text}</p>
          <ul className="mt-5 flex flex-col gap-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-[15px]">
                <Check
                  className="size-[18px] shrink-0 text-mint"
                  strokeWidth={2.5}
                />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <span className="text-xs text-brand-200">
          © 2026 ReverteMed · LGPD · Padrão TISS
        </span>
      </aside>
      <main className="flex items-center justify-center bg-white px-6 py-16 lg:px-24">
        <div className="flex w-full max-w-110 flex-col gap-5">
          <Link to="/" className="lg:hidden" aria-label="ReverteMed">
            <Logo />
          </Link>
          {children}
        </div>
      </main>
    </div>
  )
}

export function AuthTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h1 className="font-display text-[32px] leading-tight font-extrabold tracking-[-0.03em]">
        {title}
      </h1>
      {sub && <p className="mt-2 text-[15px] text-ink-500">{sub}</p>}
    </div>
  )
}
