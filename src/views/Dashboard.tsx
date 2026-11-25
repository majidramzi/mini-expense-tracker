import { useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, PiggyBank, Plus, Sparkles, Wallet, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useExpense } from '../store/ExpenseContext'
import { budgetUsage, convertedTotals, currentMonth, dailyTrend, expensesByCategory, monthlySummary, monthlyTrend, spentInMonth, totalsByCurrency, weeklyTrend } from '../lib/calculations'
import { formatMoney } from '../lib/currency'
import { CURRENCIES, type CurrencyCode } from '../types'
import { Badge, Card, EmptyState, MonthPicker, ProgressBar, SectionTitle, btnPrimary } from '../components/ui'
import { CategoryPie, IncomeExpenseBars, SpendingBars, TrendArea } from '../components/Charts'
import TransactionRow from '../components/TransactionRow'
import type { Transaction } from '../types'

interface Props {
  onAdd: () => void
  onEdit: (tx: Transaction) => void
  onOpenTransactions: () => void
  onLoadSample: () => void
}

export default function Dashboard({ onAdd, onEdit, onOpenTransactions, onLoadSample }: Props) {
  const { transactions, settings, budgets } = useExpense()
  const [month, setMonth] = useState(currentMonth())
  const [focusCurrency, setFocusCurrency] = useState<CurrencyCode>(settings.defaultCurrency)
  const [spendingMode, setSpendingMode] = useState<'daily' | 'weekly'>('daily')

  const summary = useMemo(() => monthlySummary(transactions, month, focusCurrency), [transactions, month, focusCurrency])
  const allTime = useMemo(() => totalsByCurrency(transactions), [transactions])
  const focusAllTime = useMemo(() => allTime.find((r) => r.currency === focusCurrency), [allTime, focusCurrency])
  const categoryData = useMemo(() => expensesByCategory(transactions, { month, currency: focusCurrency }), [transactions, month, focusCurrency])
  const trend = useMemo(() => monthlyTrend(transactions, 6, month, focusCurrency), [transactions, month, focusCurrency])
  const daily = useMemo(() => dailyTrend(transactions, 14, undefined, focusCurrency), [transactions, focusCurrency])
  const weekly = useMemo(() => weeklyTrend(transactions, 8, undefined, focusCurrency), [transactions, focusCurrency])
  const converted = useMemo(() => convertedTotals(transactions, settings.defaultCurrency, settings.conversionRates), [transactions, settings])
  const recent = useMemo(() => [...transactions].sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date))).slice(0, 6), [transactions])

  const monthlyBudgetUsage = budgets.monthly && budgets.monthly.currency === focusCurrency
    ? budgetUsage(spentInMonth(transactions, month, { currency: focusCurrency }), budgets.monthly.amount)
    : null

  const stats = [
    { label: 'Monthly income', value: formatMoney(summary.income, focusCurrency), icon: <ArrowUpCircle className="h-5 w-5" />, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400' },
    { label: 'Monthly spending', value: formatMoney(summary.expense, focusCurrency), icon: <ArrowDownCircle className="h-5 w-5" />, tone: 'text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-400' },
    { label: 'Monthly savings', value: formatMoney(summary.savings, focusCurrency), icon: <PiggyBank className="h-5 w-5" />, tone: summary.savings >= 0 ? 'text-teal-700 bg-teal-50 dark:bg-teal-950 dark:text-teal-300' : 'text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-400' },
    { label: 'Current balance', value: formatMoney(focusAllTime?.balance ?? 0, focusCurrency), icon: <Wallet className="h-5 w-5" />, tone: 'text-sky-700 bg-sky-50 dark:bg-sky-950 dark:text-sky-300' },
  ]

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome to Mini Expense Tracker</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Track income and expenses privately — everything stays in your browser.</p>
        </header>
        <EmptyState
          icon={<Wallet className="h-7 w-7" />}
          title="No transactions yet"
          description="Add your first income or expense to see your dashboard, charts and budgets come to life. Or load clearly-labelled sample data to explore first."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={onAdd} className={btnPrimary}><Plus className="h-4 w-4" /> Add transaction</button>
              <button type="button" onClick={onLoadSample} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                <Sparkles className="h-4 w-4" /> Load sample data
              </button>
            </div>
          }
        />
        <Card>
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-teal-700 dark:text-teal-400" />
            <div className="text-sm text-slate-600 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-white">Private by design</p>
              <p className="mt-1">No accounts, no server, no analytics. Data is stored only in this browser's local storage. Clearing browser data will remove your records — export a JSON backup regularly from Settings.</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">All figures are calculated from your stored transactions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="focus-currency">Focus currency</label>
          <select id="focus-currency" value={focusCurrency} onChange={(e) => setFocusCurrency(e.target.value as CurrencyCode)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-900" aria-label="Focus currency for dashboard">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <MonthPicker month={month} onChange={setMonth} />
          <button type="button" onClick={onAdd} className={btnPrimary}><Plus className="h-4 w-4" /> Add</button>
        </div>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="!p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.tone}`}>{s.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight">{s.value}</p>
            <p className="mt-0.5 text-xs text-slate-400">{month === currentMonth() ? 'This month' : 'Selected month'} · {focusCurrency}</p>
          </Card>
        ))}
      </div>

      {/* Budget usage */}
      <Card>
        <SectionTitle title="Budget usage" subtitle={budgets.monthly ? `Monthly budget in ${budgets.monthly.currency}` : 'Set a monthly budget in Budgets to track usage here.'} />
        {monthlyBudgetUsage ? (
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>Spent <strong>{formatMoney(monthlyBudgetUsage.spent, focusCurrency)}</strong> of <strong>{formatMoney(monthlyBudgetUsage.budget, focusCurrency)}</strong></span>
              <span className="flex items-center gap-2">
                <span className="text-slate-500">{monthlyBudgetUsage.percent.toFixed(0)}% used · {formatMoney(monthlyBudgetUsage.remaining, focusCurrency)} remaining</span>
                {monthlyBudgetUsage.status === 'exceeded' && <Badge tone="exceeded">Exceeded</Badge>}
                {monthlyBudgetUsage.status === 'warning' && <Badge tone="warning"><AlertTriangle className="h-3 w-3" /> Approaching limit</Badge>}
                {monthlyBudgetUsage.status === 'ok' && <Badge tone="ok">On track</Badge>}
              </span>
            </div>
            <ProgressBar percent={monthlyBudgetUsage.percent} status={monthlyBudgetUsage.status} />
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {budgets.monthly
              ? `Your monthly budget is in ${budgets.monthly.currency}. Switch the focus currency above to ${budgets.monthly.currency} to see usage, or edit the budget in the Budgets tab.`
              : 'No monthly budget set yet. Head to Budgets to set one.'}
          </p>
        )}
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <SectionTitle title="Expenses by category" subtitle={`${month} · ${focusCurrency}`} />
          <CategoryPie data={categoryData} currency={focusCurrency} />
        </Card>
        <Card>
          <SectionTitle title="Income vs expenses" subtitle="Last 6 months" />
          <IncomeExpenseBars data={trend} currency={focusCurrency} />
        </Card>
        <Card>
          <SectionTitle title="Monthly spending trend" subtitle="Income, expenses and balance over time" />
          <TrendArea data={trend} currency={focusCurrency} />
        </Card>
        <Card>
          <SectionTitle
            title="Daily / weekly spending"
            subtitle="Recent activity"
            action={
              <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700" role="group" aria-label="Spending period">
                {(['daily', 'weekly'] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setSpendingMode(m)} aria-pressed={spendingMode === m} className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${spendingMode === m ? 'bg-teal-700 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{m}</button>
                ))}
              </div>
            }
          />
          <SpendingBars data={spendingMode === 'daily' ? daily : weekly} currency={focusCurrency} />
        </Card>
      </div>

      {/* Per-currency + converted + recent */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <SectionTitle title="Totals by currency" subtitle="Kept separate — never silently converted" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-2 font-semibold">Currency</th><th className="pb-2 pr-2 text-right font-semibold">Income</th><th className="pb-2 pr-2 text-right font-semibold">Expenses</th><th className="pb-2 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {allTime.map((r) => (
                  <tr key={r.currency} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-2 font-semibold">{r.currency}</td>
                    <td className="py-2 pr-2 text-right text-emerald-600 dark:text-emerald-400">{formatMoney(r.income, r.currency)}</td>
                    <td className="py-2 pr-2 text-right text-rose-600 dark:text-rose-400">{formatMoney(r.expense, r.currency)}</td>
                    <td className="py-2 text-right font-semibold">{formatMoney(r.balance, r.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {converted.hasRates && (
            <div className="mt-4 rounded-xl bg-teal-50 p-3 text-sm dark:bg-teal-950/40">
              <p className="font-semibold">Converted totals (in {settings.defaultCurrency})</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Income {formatMoney(converted.income, settings.defaultCurrency)} · Expenses {formatMoney(converted.expense, settings.defaultCurrency)} · Balance {formatMoney(converted.balance, settings.defaultCurrency)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Based on {converted.included} transaction(s) using your configured rates.
                {converted.excluded > 0 && <> {converted.excluded} excluded (no rate for {converted.excludedCurrencies.join(', ')}).</>}
              </p>
            </div>
          )}
        </Card>

        <Card className="xl:col-span-2">
          <SectionTitle title="Recent transactions" subtitle="Latest activity across all currencies" action={<button type="button" onClick={onOpenTransactions} className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400">View all →</button>} />
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {recent.map((tx) => <TransactionRow key={tx.id} tx={tx} onEdit={onEdit} />)}
          </ul>
        </Card>
      </div>
    </div>
  )
}
