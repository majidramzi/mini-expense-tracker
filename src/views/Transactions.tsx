import { useMemo, useState } from 'react'
import { Plus, Search, SearchX, Trash2 } from 'lucide-react'
import { useExpense } from '../store/ExpenseContext'
import { filterTransactions, totalsByCurrency } from '../lib/calculations'
import { formatMoney } from '../lib/currency'
import { allCategoryNames } from '../lib/categories'
import { CURRENCIES, type CurrencyCode, type Transaction, type TransactionType } from '../types'
import { Card, EmptyState, Modal, btnDanger, btnPrimary, btnSecondary, inputCls } from '../components/ui'
import TransactionRow from '../components/TransactionRow'

interface Props {
  onAdd: () => void
  onEdit: (tx: Transaction) => void
}

export default function Transactions({ onAdd, onEdit }: Props) {
  const { transactions, settings, deleteTransaction } = useExpense()
  const [search, setSearch] = useState('')
  const [type, setType] = useState<TransactionType | 'all'>('all')
  const [category, setCategory] = useState('all')
  const [currency, setCurrency] = useState<CurrencyCode | 'all'>('all')
  const [month, setMonth] = useState('all')
  const [toDelete, setToDelete] = useState<Transaction | null>(null)

  const categories = allCategoryNames(settings.customCategories)
  const months = useMemo(() => [...new Set(transactions.map((t) => t.date.slice(0, 7)))].sort().reverse(), [transactions])

  const filtered = useMemo(
    () => filterTransactions(transactions, { search, type, category, currency, month }),
    [transactions, search, type, category, currency, month],
  )

  const filteredTotals = totalsByCurrency(filtered)
  const hasFilters = search || type !== 'all' || category !== 'all' || currency !== 'all' || month !== 'all'
  const clearFilters = () => { setSearch(''); setType('all'); setCategory('all'); setCurrency('all'); setMonth('all') }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Transactions</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{transactions.length} total · {filtered.length} shown</p>
        </div>
        <button type="button" onClick={onAdd} className={btnPrimary}><Plus className="h-4 w-4" /> Add transaction</button>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description, category, amount…" aria-label="Search transactions" className={`${inputCls} pl-9`} />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value as TransactionType | 'all')} aria-label="Filter by type" className={inputCls}>
            <option value="all">All types</option><option value="income">Income</option><option value="expense">Expense</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" className={inputCls}>
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode | 'all')} aria-label="Filter by currency" className={inputCls}>
            <option value="all">All currencies</option>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Filter by month" className={inputCls}>
            <option value="all">All months</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              Filtered totals: {filteredTotals.map((r) => `${r.currency}: income ${formatMoney(r.income, r.currency)}, expenses ${formatMoney(r.expense, r.currency)}`).join(" · ")}
            </span>
            <button type="button" onClick={clearFilters} className="font-semibold text-teal-700 hover:underline dark:text-teal-400">Clear filters</button>
          </div>
        )}
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-7 w-7" />}
          title={transactions.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
          description={transactions.length === 0 ? 'Add your first income or expense to get started.' : 'Try a different search term or clear the filters.'}
          action={transactions.length === 0 ? <button type="button" onClick={onAdd} className={btnPrimary}><Plus className="h-4 w-4" /> Add transaction</button> : <button type="button" onClick={clearFilters} className={btnSecondary}>Clear filters</button>}
        />
      ) : (
        <Card className="!p-2 sm:!p-3">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onEdit={onEdit} onDelete={setToDelete} />
            ))}
          </ul>
        </Card>
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete transaction?">
        {toDelete && (
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              This will permanently delete <strong>{toDelete.description || toDelete.category}</strong> ({formatMoney(toDelete.amount, toDelete.currency)}) dated {toDelete.date}. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => { deleteTransaction(toDelete.id); setToDelete(null) }} className={btnDanger}><Trash2 className="h-4 w-4" /> Delete</button>
              <button type="button" onClick={() => setToDelete(null)} className={btnSecondary}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
