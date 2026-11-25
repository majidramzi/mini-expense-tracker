import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import type { CurrencyCode, Transaction } from '../types'
import { CURRENCIES } from '../types'
import { categoriesForType } from '../lib/categories'
import { todayISO } from '../lib/calculations'
import { useExpense } from '../store/ExpenseContext'
import { Modal, btnPrimary, btnSecondary, inputCls, labelCls } from './ui'
import { cn } from '../lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  editing: Transaction | null
}

export default function TransactionModal({ open, onClose, editing }: Props) {
  const { settings, addTransaction, updateTransaction } = useExpense()
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>(settings.defaultCurrency)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO())
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (editing) {
      setType(editing.type)
      setAmount(String(editing.amount))
      setCurrency(editing.currency)
      setCategory(editing.category)
      setDescription(editing.description)
      setDate(editing.date)
    } else {
      setType('expense')
      setAmount('')
      setCurrency(settings.defaultCurrency)
      setCategory('')
      setDescription('')
      setDate(todayISO())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  const baseCategories = categoriesForType(type, settings.customCategories)
  const categories = editing && editing.type === type && !baseCategories.includes(editing.category) ? [...baseCategories, editing.category] : baseCategories
  const effectiveCategory = categories.includes(category) ? category : categories[0] ?? ''

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = Number(amount)
    if (!Number.isFinite(parsed) || parsed < 0.01) {
      setError('Enter an amount of at least 0.01.')
      return
    }
    if (!effectiveCategory) {
      setError('Choose a category.')
      return
    }
    if (!date) {
      setError('Choose a date.')
      return
    }
    const input = { type, amount: parsed, currency, category: effectiveCategory, description, date }
    if (editing) updateTransaction(editing.id, input)
    else addTransaction(input)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit transaction' : 'Add transaction'}>
      <form onSubmit={submit} noValidate>
        {/* Type toggle */}
        <div className="mb-5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Transaction type">
          <button
            type="button"
            role="radio"
            aria-checked={type === 'expense'}
            onClick={() => setType('expense')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition',
              type === 'expense'
                ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                : 'border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
            )}
          >
            <ArrowDownCircle className="h-5 w-5" /> Expense
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={type === 'income'}
            onClick={() => setType('income')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition',
              type === 'income'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
            )}
          >
            <ArrowUpCircle className="h-5 w-5" /> Income
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tx-amount" className={labelCls}>Amount</label>
            <input id="tx-amount" type="number" inputMode="decimal" min="0" step="0.01" required autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={inputCls} />
          </div>
          <div>
            <label htmlFor="tx-currency" className={labelCls}>Currency</label>
            <select id="tx-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className={inputCls}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tx-category" className={labelCls}>Category</label>
            <select id="tx-category" value={effectiveCategory} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tx-date" className={labelCls}>Date</label>
            <input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="tx-desc" className={labelCls}>Description <span className="font-normal text-slate-400">(optional)</span></label>
            <input id="tx-desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Weekly groceries" maxLength={200} className={inputCls} />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">{error}</p>
        )}

        <div className="mt-6 flex gap-3">
          <button type="submit" className={cn(btnPrimary, 'flex-1')}>{editing ? 'Save changes' : 'Add transaction'}</button>
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
        </div>
      </form>
    </Modal>
  )
}
