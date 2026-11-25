import { useEffect, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { monthLabel, shiftMonth } from '../lib/calculations'
import { cn } from '../lib/utils'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5', className)}>
      {children}
    </section>
  )
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function MonthPicker({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900" role="group" aria-label="Select month">
      <button type="button" aria-label="Previous month" onClick={() => onChange(shiftMonth(month, -1))} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-32 text-center text-sm font-semibold" aria-live="polite">{monthLabel(month)}</span>
      <button type="button" aria-label="Next month" onClick={() => onChange(shiftMonth(month, 1))} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
        <ChevronRight className="h-4 w-4" />
      </button>
      <input
        type="month"
        value={month}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        aria-label="Jump to month"
        className="w-0 opacity-0 focus:w-auto focus:opacity-100 focus:transition-all"
      />
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-slate-700">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

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
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div
        className={cn('max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl', wide ? 'max-w-2xl' : 'max-w-lg')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

export function ProgressBar({ percent, status }: { percent: number; status: string }) {
  const color =
    status === 'exceeded'
      ? 'bg-rose-500'
      : status === 'warning'
        ? 'bg-amber-500'
        : 'bg-teal-600'
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  )
}

export function Badge({ children, tone }: { children: ReactNode; tone: 'ok' | 'warning' | 'exceeded' | 'neutral' }) {
  const styles = {
    ok: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900',
    warning: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900',
    exceeded: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-900',
    neutral: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  }[tone]
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1', styles)}>{children}</span>
}

export const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-teal-500'

export const labelCls = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300'

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600/40 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500'

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600/30 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'

export const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/40'
