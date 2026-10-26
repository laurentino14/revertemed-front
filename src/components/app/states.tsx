import { Link, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { Component, Suspense } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Alert, Button, Skeleton, Spinner, btn } from '#/components/ui'
import { ApiError } from '#/lib/api'

export function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="font-display text-6xl font-extrabold text-brand-600">
          404
        </span>
        <h1 className="font-display text-2xl font-extrabold">
          Página não encontrada
        </h1>
        <p className="text-ink-500">
          O endereço pode ter mudado ou não existir mais.
        </p>
        <Link to="/" className={btn('primary')}>
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <div className="mx-auto max-w-xl p-8">
      <Alert
        tone="danger"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              reset()
              void router.invalidate()
            }}
          >
            Tentar de novo
          </Button>
        }
      >
        <b>Algo deu errado.</b>{' '}
        {error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar esta página.'}
      </Alert>
    </div>
  )
}

interface BoundaryState {
  error: Error | null
}

class ErrorBoundary extends Component<
  { children: ReactNode; label?: string },
  BoundaryState
> {
  state: BoundaryState = { error: null }
  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <Alert
        tone="danger"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => this.setState({ error: null })}
          >
            Tentar de novo
          </Button>
        }
      >
        {this.state.error instanceof ApiError
          ? this.state.error.message
          : `Não foi possível carregar ${this.props.label ?? 'esta seção'}.`}
      </Alert>
    )
  }
}

export function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ink-200 bg-white p-5">
      <Skeleton className="h-5 w-48" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

/** Suspense + error boundary for a section that reads data with useSuspenseQuery. */
export function Boundary({
  children,
  fallback,
  label,
}: {
  children: ReactNode
  fallback?: ReactNode
  label?: string
}) {
  return (
    <ErrorBoundary label={label}>
      <Suspense fallback={fallback ?? <CardSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

export function PageLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <Spinner className="size-8" />
    </div>
  )
}
