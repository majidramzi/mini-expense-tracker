import { format, parseISO, isValid, addMonths, startOfMonth } from 'date-fns'
import type { CurrencyCode, Transaction, TransactionType } from '../types'
import { convertAmount } from './currency'

/* ------------------------------------------------------------------ */
/* Date helpers (all local-calendar, yyyy-mm-dd strings)               */
/* ------------------------------------------------------------------ */

export function todayISO(d = new Date()): string {
  return format(d, 'yyyy-MM-dd')
}

export function currentMonth(d = new Date()): string {
  return format(d, 'yyyy-MM')
}

/** 'yyyy-MM-dd' → 'yyyy-MM' */
export function monthOf(dateISO: string): string {
  return dateISO.slice(0, 7)
}

export function isValidDateISO(s: unknown): s is string {
  if (typeof s !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  return isValid(parseISO(s))
}

export function shiftMonth(month: string, delta: number): string {
  const d = addMonths(parseISO(`${month}-01`), delta)
  return format(d, 'yyyy-MM')
}

export function monthLabel(month: string): string {
  try {
    return format(parseISO(`${month}-01`), 'MMMM yyyy')
  } catch {
    return month
  }
}

/* ------------------------------------------------------------------ */
/* Core sums — always per-currency unless explicitly converted         */
/* ------------------------------------------------------------------ */

export function sumByType(
  txs: Transaction[],
  type: TransactionType,
  currency?: CurrencyCode,
): number {
  return txs
    .filter((t) => t.type === type && (currency === undefined || t.currency === currency))
    .reduce((s, t) => s + t.amount, 0)
}

export interface CurrencyTotals {
  currency: CurrencyCode
  income: number
  expense: number
  balance: number
  count: number
}

/** Totals kept strictly separate per currency (no silent conversion). */
export function totalsByCurrency(txs: Transaction[]): CurrencyTotals[] {
  const map = new Map<CurrencyCode, CurrencyTotals>()
  for (const t of txs) {
    let row = map.get(t.currency)
    if (!row) {
      row = { currency: t.currency, income: 0, expense: 0, balance: 0, count: 0 }
      map.set(t.currency, row)
    }
    if (t.type === 'income') row.income += t.amount
    else row.expense += t.amount
    row.count += 1
  }
  for (const row of map.values()) row.balance = row.income - row.expense
  return [...map.values()].sort((a, b) => a.currency.localeCompare(b.currency))
}

export interface MonthlySummary {
  month: string
  income: number
  expense: number
  balance: number
  /** income − expense for the month (positive = saved) */
  savings: number
  count: number
}

export function monthlySummary(
  txs: Transaction[],
  month: string,
  currency?: CurrencyCode,
): MonthlySummary {
  const inMonth = txs.filter(
    (t) => monthOf(t.date) === month && (currency === undefined || t.currency === currency),
  )
  const income = sumByType(inMonth, 'income')
  const expense = sumByType(inMonth, 'expense')
  return { month, income, expense, balance: income - expense, savings: income - expense, count: inMonth.length }
}

/** Overall balance (all time), per currency. */
export function balanceByCurrency(txs: Transaction[]): CurrencyTotals[] {
  return totalsByCurrency(txs)
}

/* ------------------------------------------------------------------ */
/* Groupings for charts / reports                                      */
/* ------------------------------------------------------------------ */

export interface CategorySlice {
  category: string
  amount: number
  percent: number
}

export function expensesByCategory(
  txs: Transaction[],
  opts: { month?: string; currency?: CurrencyCode } = {},
): CategorySlice[] {
  const map = new Map<string, number>()
  for (const t of txs) {
    if (t.type !== 'expense') continue
    if (opts.month && monthOf(t.date) !== opts.month) continue
    if (opts.currency && t.currency !== opts.currency) continue
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
  }
  const total = [...map.values()].reduce((a, b) => a + b, 0)
  return [...map.entries()]
    .map(([category, amount]) => ({
      category,
      amount: round2(amount),
      percent: total > 0 ? round2((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export interface MonthPoint {
  month: string
  label: string
  income: number
  expense: number
  balance: number
}

/** Last N months ending at `endMonth` (inclusive), oldest → newest. */
export function monthlyTrend(
  txs: Transaction[],
  months = 6,
  endMonth: string = currentMonth(),
  currency?: CurrencyCode,
): MonthPoint[] {
  const points: MonthPoint[] = []
  for (let i = months - 1; i >= 0; i--) {
    const m = shiftMonth(endMonth, -i)
    const s = monthlySummary(txs, m, currency)
    points.push({
      month: m,
      label: format(parseISO(`${m}-01`), 'MMM'),
      income: round2(s.income),
      expense: round2(s.expense),
      balance: round2(s.balance),
    })
  }
  return points
}

export interface DayPoint {
  date: string
  label: string
  expense: number
  income: number
}

/** Daily income/expense for the last N days ending at `end` (inclusive). */
export function dailyTrend(
  txs: Transaction[],
  days = 14,
  end: Date = new Date(),
  currency?: CurrencyCode,
): DayPoint[] {
  const points: DayPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i)
    const iso = format(d, 'yyyy-MM-dd')
    const day = txs.filter((t) => t.date === iso && (currency === undefined || t.currency === currency))
    points.push({
      date: iso,
      label: format(d, 'd MMM'),
      expense: round2(sumByType(day, 'expense')),
      income: round2(sumByType(day, 'income')),
    })
  }
  return points
}

export interface WeekPoint {
  label: string
  expense: number
  income: number
}

/** Weekly buckets (Mon–Sun) for the last N weeks ending at `end`. */
export function weeklyTrend(
  txs: Transaction[],
  weeks = 8,
  end: Date = new Date(),
  currency?: CurrencyCode,
): WeekPoint[] {
  const points: WeekPoint[] = []
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  for (let w = weeks - 1; w >= 0; w--) {
    const weekEnd = new Date(endDay)
    weekEnd.setDate(endDay.getDate() - w * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6)
    const startISO = format(weekStart, 'yyyy-MM-dd')
    const endISO = format(weekEnd, 'yyyy-MM-dd')
    const inWeek = txs.filter(
      (t) => t.date >= startISO && t.date <= endISO && (currency === undefined || t.currency === currency),
    )
    points.push({
      label: `${format(weekStart, 'd MMM')}–${format(weekEnd, 'd MMM')}`,
      expense: round2(sumByType(inWeek, 'expense')),
      income: round2(sumByType(inWeek, 'income')),
    })
  }
  return points
}

/* ------------------------------------------------------------------ */
/* Budgets                                                             */
/* ------------------------------------------------------------------ */

export type BudgetStatus = 'ok' | 'warning' | 'exceeded' | 'none'

export interface BudgetUsage {
  budget: number
  spent: number
  remaining: number
  percent: number
  status: BudgetStatus
}

export const BUDGET_WARNING_THRESHOLD = 80

export function budgetUsage(spent: number, budget: number | null | undefined): BudgetUsage {
  if (budget === null || budget === undefined || budget <= 0) {
    return { budget: 0, spent: round2(spent), remaining: round2(spent), percent: 0, status: 'none' }
  }
  const percent = (spent / budget) * 100
  const status: BudgetStatus = percent > 100 ? 'exceeded' : percent >= BUDGET_WARNING_THRESHOLD ? 'warning' : 'ok'
  return {
    budget: round2(budget),
    spent: round2(spent),
    remaining: round2(budget - spent),
    percent: round2(percent),
    status,
  }
}

/** Expenses in a month, optionally restricted to one category + currency. */
export function spentInMonth(
  txs: Transaction[],
  month: string,
  opts: { category?: string; currency?: CurrencyCode } = {},
): number {
  return txs
    .filter(
      (t) =>
        t.type === 'expense' &&
        monthOf(t.date) === month &&
        (opts.category === undefined || t.category === opts.category) &&
        (opts.currency === undefined || t.currency === opts.currency),
    )
    .reduce((s, t) => s + t.amount, 0)
}

/* ------------------------------------------------------------------ */
/* Optional conversion (user-configured rates only)                    */
/* ------------------------------------------------------------------ */

export interface ConvertedTotals {
  income: number
  expense: number
  balance: number
  included: number
  excluded: number
  excludedCurrencies: CurrencyCode[]
  hasRates: boolean
}

export function convertedTotals(
  txs: Transaction[],
  defaultCurrency: CurrencyCode,
  rates: Partial<Record<CurrencyCode, number>>,
): ConvertedTotals {
  let income = 0
  let expense = 0
  let included = 0
  let excluded = 0
  const excludedSet = new Set<CurrencyCode>()
  for (const t of txs) {
    const converted = convertAmount(t.amount, t.currency, defaultCurrency, rates, defaultCurrency)
    if (converted === null) {
      excluded += 1
      excludedSet.add(t.currency)
      continue
    }
    included += 1
    if (t.type === 'income') income += converted
    else expense += converted
  }
  return {
    income: round2(income),
    expense: round2(expense),
    balance: round2(income - expense),
    included,
    excluded,
    excludedCurrencies: [...excludedSet].sort(),
    hasRates: Object.values(rates).some((r) => typeof r === 'number' && r > 0),
  }
}

/* ------------------------------------------------------------------ */
/* Filtering / search                                                  */
/* ------------------------------------------------------------------ */

export interface TxFilter {
  search?: string
  type?: TransactionType | 'all'
  category?: string | 'all'
  currency?: CurrencyCode | 'all'
  month?: string | 'all'
}

export function filterTransactions(txs: Transaction[], f: TxFilter): Transaction[] {
  const q = (f.search ?? '').trim().toLowerCase()
  return txs
    .filter((t) => {
      if (f.type && f.type !== 'all' && t.type !== f.type) return false
      if (f.category && f.category !== 'all' && t.category !== f.category) return false
      if (f.currency && f.currency !== 'all' && t.currency !== f.currency) return false
      if (f.month && f.month !== 'all' && monthOf(t.date) !== f.month) return false
      if (q) {
        const hay = `${t.description} ${t.category} ${t.amount} ${t.currency}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)))
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function startOfMonthISO(month: string): string {
  return `${month}-01`
}

export { startOfMonth }
