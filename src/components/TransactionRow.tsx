import { ArrowDownCircle, ArrowUpCircle, Pencil, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { Transaction } from '../types'
import { formatMoney } from '../lib/currency'
import { categoryColor } from '../lib/categories'

interface Props {
  tx: Transaction
  onEdit?: (tx: Transaction) => void
  onDelete?: (tx: Transaction) => void
}

export default function TransactionRow({ tx, onEdit, onDelete }: Props) {
  const isIncome = tx.type === 'income'
  let dateLabel = tx.date
  try {
    dateLabel = format(parseISO(tx.date), 'd MMM yyyy')
  } catch { /* keep raw */ }
  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${categoryColor(tx.category)}22`, color: categoryColor(tx.category) }} aria-hidden>
        {isIncome ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{tx.description || tx.category}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {tx.category} · {dateLabel} · {tx.currency}
        </p>
      </div>
      <p className={`shrink-0 text-sm font-bold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {isIncome ? '+' : '−'}{formatMoney(tx.amount, tx.currency)}
      </p>
      {(onEdit || onDelete) && (
        <div className="flex shrink-0 gap-1">
          {onEdit && (
            <button type="button" onClick={() => onEdit(tx)} aria-label={`Edit ${tx.description || tx.category}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-100">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={() => onDelete(tx)} aria-label={`Delete ${tx.description || tx.category}`} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </li>
  )
}
