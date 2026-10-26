import { useId } from 'react'
import { moneyCompact } from '#/lib/format'

interface Series {
  points: number[]
  color: string
  area?: boolean
  label: string
}

/** Dependency-free responsive line chart (values in cents). */
export function LineChart({
  series,
  labels,
  height = 220,
}: {
  series: Series[]
  labels: string[]
  height?: number
}) {
  const w = 640
  const h = height
  const max = Math.max(1, ...series.flatMap((s) => s.points))
  const x = (i: number, n: number) => (n <= 1 ? w / 2 : (i * w) / (n - 1))
  const y = (v: number) => h - 14 - (v / max) * (h - 28)
  const id = useId()
  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={series.map((s) => s.label).join(' e ')}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={0}
            x2={w}
            y1={14 + (i * (h - 28)) / 4}
            y2={14 + (i * (h - 28)) / 4}
            stroke="#E2E8F0"
          />
        ))}
        {series.map((s, si) => {
          const pts = s.points.map(
            (v, i) => [x(i, s.points.length), y(v)] as const,
          )
          const d = pts
            .map(
              ([px, py], i) =>
                `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`,
            )
            .join(' ')
          return (
            <g key={si}>
              {s.area && (
                <path
                  d={`${d} L${w} ${h - 14} L0 ${h - 14}Z`}
                  fill={s.color}
                  fillOpacity={0.12}
                  id={`${id}-${si}`}
                />
              )}
              <path
                d={d}
                fill="none"
                stroke={s.color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {pts.map(([px, py], i) => (
                <circle
                  key={i}
                  cx={px}
                  cy={py}
                  r={4}
                  fill="#fff"
                  stroke={s.color}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          )
        })}
      </svg>
      <div className="flex justify-between text-xs text-ink-500">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <figcaption className="flex gap-4 text-xs font-medium text-ink-500">
        {series.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <i
              className="inline-block size-2 rounded-full"
              style={{ background: s.color }}
            />
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

export function WeekBars({
  weeks,
}: {
  weeks: { label: string; value: number; low: number; high: number }[]
}) {
  const max = Math.max(1, ...weeks.map((w) => w.high))
  return (
    <div className="overflow-x-auto">
      <div
        className="flex min-w-[520px] items-end gap-3.5"
        role="img"
        aria-label="Previsão de entrada de caixa por semana (barra) com margem de erro (linha)"
      >
        {weeks.map((w, i) => (
          <div
            key={w.label}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <span className="num text-[11px] text-ink-500">
              {moneyCompact(w.value)}
            </span>
            <div className="relative h-44 w-full max-w-14">
              <div
                className="absolute inset-x-0 bottom-0 rounded-t-lg bg-rec"
                style={{
                  height: `${(w.value / max) * 100}%`,
                  opacity: i < 4 ? 1 : 0.55,
                }}
              />
              <div
                className="absolute left-1/2 w-0.5 -translate-x-1/2 bg-ink-900/70"
                style={{
                  bottom: `${(w.low / max) * 100}%`,
                  height: `${((w.high - w.low) / max) * 100}%`,
                }}
                title="margem de erro"
              />
            </div>
            <span className="text-xs text-ink-500">{w.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
