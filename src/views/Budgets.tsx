import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, OctagonX, Plus, Trash2, Wallet } from 'lucide-react'
import { useExpense } from '../store/ExpenseContext'
import { budgetUsage, currentMonth, spentInMonth } from '../lib/calculations'
import { formatMoney } from '../lib/currency'
import { allCategoryNames } from '../lib/categories'
import { CURRENCIES, type CurrencyCode } from '../types'
import { Badge, Card, EmptyState, MonthPicker, ProgressBar, SectionTitle, btnPrimary, btnSecondary, inputCls, labelCls } from '../components/ui'

export default function Budgets() {
  const { transactions, budgets, updateBudgets, settings } = useExpense()
  const [month, setMonth] = useState(currentMonth())

  const [monthlyAmount, setMonthlyAmount] = useState(budgets.monthly ? String(budgets.monthly.amount) : '')
  const [monthlyCurrency, setMonthlyCurrency] = useState<CurrencyCode>(budgets.monthly?.currency ?? settings.defaultCurrency)
  const [monthlyMsg, setMonthlyMsg] = useState('')

  const [newCategory, setNewCategory] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newCurrency, setNewCurrency] = useState<CurrencyCode>(settings.defaultCurrency)
  const [catMsg, setCatMsg] = useState('')

  const categories = allCategoryNames(settings.customCategories)
  const categoryBudgets = Object.values(budgets.categories).sort((a, b) => a.category.localeCompare(b.category))

  const monthlyUsage = useMemo(() => {
    if (!budgets.monthly) return null
    const spent = spentInMonth(transactions, month, { currency: budgets.monthly.currency })
    return budgetUsage(spent, budgets.monthly.amount)
  }, [transactions, budgets.monthly, month])

  function saveMonthly(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(monthlyAmount)
    if (!Number.isFinite(amount) || amount <= 0) { setMonthlyMsg('Enter an amount greater than zero.'); return }
    updateBudgets({ ...budgets, monthly: { amount, currency: monthlyCurrency } })
    setMonthlyMsg('Monthly budget saved.')
  }

  function removeMonthly() {
    updateBudgets({ ...budgets, monthly: null })
    setMonthlyAmount('')
    setMonthlyMsg('Monthly budget removed.')
  }

  function addCategoryBudget(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(newAmount)
    if (!newCategory) { setCatMsg('Choose a category.'); return }
    if (!Number.isFinite(amount) || amount <= 0) { setCatMsg('Enter an amount greater than zero.'); return }
    updateBudgets({
      ...budgets,
      categories: { ...budgets.categories, [newCategory]: { category: newCategory, amount, currency: newCurrency } },
    })
    setNewAmount('')
    setCatMsg('Category budget saved.')
  }

  function removeCategoryBudget(category: string) {
    const next = { ...budgets.categories }
    delete next[category]
    updateBudgets({ ...budgets, categories: next })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Budgets</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Monthly and category budgets. Warnings appear at 80% of the limit; over-budget is flagged in red.</p>
        </div>
        <MonthPicker month={month} onChange={setMonth} />
      </header>

      {/* Monthly budget */}
      <Card>
        <SectionTitle title="Monthly budget" subtitle="Applies to every month. Spending is counted in the budget's currency only." />
        <form onSubmit={saveMonthly} className="grid gap-3 sm:grid-cols-[1fr_140px_auto_auto]">
          <div>
            <label htmlFor="monthly-amount" className={labelCls}>Amount</label>
            <input id="monthly-amount" type="number" inputMode="decimal" min="0" step="0.01" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} placeholder="e.g. 1800" className={inputCls} />
          </div>
          <div>
            <label htmlFor="monthly-currency" className={labelCls}>Currency</label>
            <select id="monthly-currency" value={monthlyCurrency} onChange={(e) => setMonthlyCurrency(e.target.value as CurrencyCode)} className={inputCls}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end"><button type="submit" className={btnPrimary}>Save budget</button></div>
          {budgets.monthly && <div className="flex items-end"><button type="button" onClick={removeMonthly} className={btnSecondary}>Remove</button></div>}
        </form>
        {monthlyMsg && <p className="mt-3 text-sm font-medium text-teal-700 dark:text-teal-400" role="status">{monthlyMsg}</p>}

        {monthlyUsage && budgets.monthly && (
          <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{month} · spent <strong>{formatMoney(monthlyUsage.spent, budgets.monthly.currency)}</strong> of <strong>{formatMoney(monthlyUsage.budget, budgets.monthly.currency)}</strong></span>
              <span className="flex items-center gap-2">
                <span className="text-slate-500">{monthlyUsage.percent.toFixed(1)}% · {formatMoney(monthlyUsage.remaining, budgets.monthly.currency)} remaining</span>
                {monthlyUsage.status === 'exceeded' && <Badge tone="exceeded"><OctagonX className="h-3 w-3" /> Exceeded</Badge>}
                {monthlyUsage.status === 'warning' && <Badge tone="warning"><AlertTriangle className="h-3 w-3" /> Approaching limit</Badge>}
                {monthlyUsage.status === 'ok' && <Badge tone="ok"><CheckCircle2 className="h-3 w-3" /> On track</Badge>}
              </span>
            </div>
            <ProgressBar percent={monthlyUsage.percent} status={monthlyUsage.status} />
          </div>
        )}
      </Card>

      {/* Category budgets */}
      <Card>
        <SectionTitle title="Category budgets" subtitle="Track spending per category for the selected month." />
        <form onSubmit={addCategoryBudget} className="grid gap-3 sm:grid-cols-[1fr_1fr_140px_auto]">
          <div>
            <label htmlFor="cat-select" className={labelCls}>Category</label>
            <select id="cat-select" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className={inputCls}>
              <option value="">Choose category…</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="cat-amount" className={labelCls}>Monthly amount</label>
            <input id="cat-amount" type="number" inputMode="decimal" min="0" step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="e.g. 300" className={inputCls} />
          </div>
          <div>
            <label htmlFor="cat-currency" className={labelCls}>Currency</label>
            <select id="cat-currency" value={newCurrency} onChange={(e) => setNewCurrency(e.target.value as CurrencyCode)} className={inputCls}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end"><button type="submit" className={btnPrimary}><Plus className="h-4 w-4" /> Add</button></div>
        </form>
        {catMsg && <p className="mt-3 text-sm font-medium text-teal-700 dark:text-teal-400" role="status">{catMsg}</p>}

        {categoryBudgets.length === 0 ? (
          <div className="mt-5">
            <EmptyState icon={<Wallet className="h-7 w-7" />} title="No category budgets yet" description="Add a budget for a category above — for example, Food & Dining — to get warnings before you overspend." />
          </div>
        ) : (
          <ul className="mt-5 space-y-4">
            {categoryBudgets.map((b) => {
              const spent = spentInMonth(transactions, month, { category: b.category, currency: b.currency })
              const usage = budgetUsage(spent, b.amount)
              return (
                <li key={b.category} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{b.category} <span className="ml-1 text-xs font-normal text-slate-400">{b.currency}</span></p>
                    <div className="flex items-center gap-2">
                      {usage.status === 'exceeded' && <Badge tone="exceeded"><OctagonX className="h-3 w-3" /> Exceeded</Badge>}
                      {usage.status === 'warning' && <Badge tone="warning"><AlertTriangle className="h-3 w-3" /> Approaching limit</Badge>}
                      {usage.status === 'ok' && <Badge tone="ok"><CheckCircle2 className="h-3 w-3" /> On track</Badge>}
                      <button type="button" onClick={() => removeCategoryBudget(b.category)} aria-label={`Remove ${b.category} budget`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>Spent <strong className="text-slate-800 dark:text-slate-100">{formatMoney(usage.spent, b.currency)}</strong> of {formatMoney(usage.budget, b.currency)}</span>
                    <span>{usage.percent.toFixed(1)}% · {formatMoney(usage.remaining, b.currency)} remaining</span>
                  </div>
                  <ProgressBar percent={usage.percent} status={usage.status} />
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
