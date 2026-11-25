import { useMemo, useState } from 'react'
import { BarChart3, Download, FileJson } from 'lucide-react'
import { useExpense } from '../store/ExpenseContext'
import { currentMonth, expensesByCategory, monthlySummary, monthlyTrend, totalsByCurrency } from '../lib/calculations'
import { formatMoney } from '../lib/currency'
import { downloadFile, serializeBackup, transactionsToCSV } from '../lib/storage'
import { CURRENCIES, type CurrencyCode } from '../types'
import { Card, EmptyState, MonthPicker, SectionTitle, btnSecondary } from '../components/ui'
import { CategoryPie, IncomeExpenseBars, TrendArea } from '../components/Charts'

export default function Reports() {
  const { data, transactions, settings } = useExpense()
  const [month, setMonth] = useState(currentMonth())
  const [currency, setCurrency] = useState<CurrencyCode>(settings.defaultCurrency)

  const summary = useMemo(() => monthlySummary(transactions, month, currency), [transactions, month, currency])
  const byCurrency = useMemo(() => totalsByCurrency(transactions), [transactions])
  const categories = useMemo(() => expensesByCategory(transactions, { month, currency }), [transactions, month, currency])
  const trend = useMemo(() => monthlyTrend(transactions, 6, month, currency), [transactions, month, currency])
  const history = useMemo(() => monthlyTrend(transactions, 6, month, currency), [transactions, month, currency])

  function exportCSV() {
    downloadFile(`mini-expense-tracker-${month}.csv`, transactionsToCSV(transactions), 'text/csv;charset=utf-8')
  }
  function exportJSON() {
    downloadFile('mini-expense-tracker-backup.json', serializeBackup(data), 'application/json;charset=utf-8')
  }

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Reports</h1>
        <EmptyState icon={<BarChart3 className="h-7 w-7" />} title="No data to report yet" description="Add transactions first — reports are calculated entirely from your stored records." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Reports</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Calculated from stored transactions. No data leaves your browser.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} aria-label="Report currency" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-900">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <MonthPicker month={month} onChange={setMonth} />
          <button type="button" onClick={exportCSV} className={btnSecondary}><Download className="h-4 w-4" /> CSV</button>
          <button type="button" onClick={exportJSON} className={btnSecondary}><FileJson className="h-4 w-4" /> JSON backup</button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-slate-500">Income ({month})</p><p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatMoney(summary.income, currency)}</p></Card>
        <Card><p className="text-sm text-slate-500">Expenses ({month})</p><p className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400">{formatMoney(summary.expense, currency)}</p></Card>
        <Card><p className="text-sm text-slate-500">Net savings ({month})</p><p className={`mt-1 text-2xl font-extrabold ${summary.savings >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-rose-600'}`}>{formatMoney(summary.savings, currency)}</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card><SectionTitle title="Expenses by category" subtitle={`${month} · ${currency}`} /><CategoryPie data={categories} currency={currency} /></Card>
        <Card><SectionTitle title="Income vs expenses" subtitle="Last 6 months" /><IncomeExpenseBars data={trend} currency={currency} /></Card>
        <Card><SectionTitle title="Monthly trend" subtitle="Income, expenses and balance" /><TrendArea data={trend} currency={currency} /></Card>

        <Card>
          <SectionTitle title="Category breakdown" subtitle={`${month} · ${currency}`} />
          {categories.length === 0 ? (
            <p className="text-sm text-slate-500">No expenses in this month/currency.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-400"><th className="pb-2 pr-2 font-semibold">Category</th><th className="pb-2 pr-2 text-right font-semibold">Amount</th><th className="pb-2 text-right font-semibold">Share</th></tr></thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.category} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-2 font-medium">{c.category}</td>
                      <td className="py-2 pr-2 text-right">{formatMoney(c.amount, currency)}</td>
                      <td className="py-2 text-right text-slate-500">{c.percent.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle title="All currencies (all time)" subtitle="Totals are kept separate per currency — no silent conversion" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-400"><th className="pb-2 pr-2 font-semibold">Currency</th><th className="pb-2 pr-2 text-right font-semibold">Income</th><th className="pb-2 pr-2 text-right font-semibold">Expenses</th><th className="pb-2 pr-2 text-right font-semibold">Balance</th><th className="pb-2 text-right font-semibold">Transactions</th></tr></thead>
            <tbody>
              {byCurrency.map((r) => (
                <tr key={r.currency} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 pr-2 font-semibold">{r.currency}</td>
                  <td className="py-2 pr-2 text-right text-emerald-600 dark:text-emerald-400">{formatMoney(r.income, r.currency)}</td>
                  <td className="py-2 pr-2 text-right text-rose-600 dark:text-rose-400">{formatMoney(r.expense, r.currency)}</td>
                  <td className="py-2 pr-2 text-right font-semibold">{formatMoney(r.balance, r.currency)}</td>
                  <td className="py-2 text-right text-slate-500">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Monthly history" subtitle={`Last 6 months · ${currency}`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-400"><th className="pb-2 pr-2 font-semibold">Month</th><th className="pb-2 pr-2 text-right font-semibold">Income</th><th className="pb-2 pr-2 text-right font-semibold">Expenses</th><th className="pb-2 text-right font-semibold">Balance</th></tr></thead>
            <tbody>
              {[...history].reverse().map((h) => (
                <tr key={h.month} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 pr-2 font-medium">{h.month}</td>
                  <td className="py-2 pr-2 text-right text-emerald-600 dark:text-emerald-400">{formatMoney(h.income, currency)}</td>
                  <td className="py-2 pr-2 text-right text-rose-600 dark:text-rose-400">{formatMoney(h.expense, currency)}</td>
                  <td className="py-2 text-right font-semibold">{formatMoney(h.balance, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
