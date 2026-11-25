import { describe, expect, it } from 'vitest'
import {
  budgetUsage, convertedTotals, expensesByCategory, filterTransactions,
  monthlySummary, monthlyTrend, spentInMonth, sumByType, totalsByCurrency,
} from './calculations'
import type { Transaction } from '../types'

let n = 0
function tx(partial: Partial<Transaction> & Pick<Transaction, 'type' | 'amount' | 'date'>): Transaction {
  n += 1
  return {
    id: `tx-${n}`,
    currency: 'EUR',
    category: 'Groceries',
    description: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

const data: Transaction[] = [
  tx({ type: 'income', amount: 3000, date: '2026-11-01', category: 'Salary', description: 'Salary' }),
  tx({ type: 'income', amount: 500, date: '2026-11-10', category: 'Freelance', description: 'Invoice' }),
  tx({ type: 'expense', amount: 100, date: '2026-11-05', category: 'Groceries', description: 'Shop' }),
  tx({ type: 'expense', amount: 50, date: '2026-11-06', category: 'Groceries', description: 'Shop 2' }),
  tx({ type: 'expense', amount: 200, date: '2026-11-07', category: 'Housing', description: 'Rent' }),
  tx({ type: 'expense', amount: 999, date: '2026-10-15', category: 'Groceries', description: 'Last month' }),
  tx({ type: 'income', amount: 100, date: '2026-11-12', currency: 'USD', category: 'Gift', description: 'USD gift' }),
  tx({ type: 'expense', amount: 40, date: '2026-11-12', currency: 'USD', category: 'Transport', description: 'Taxi' }),
]

describe('income / expense / balance calculations', () => {
  it('sums income and expenses separately', () => {
    expect(sumByType(data, 'income')).toBe(3600)
    expect(sumByType(data, 'expense')).toBe(1389)
  })

  it('keeps currencies separate (no silent conversion)', () => {
    const rows = totalsByCurrency(data)
    expect(rows).toHaveLength(2)
    const eur = rows.find((r) => r.currency === 'EUR')!
    const usd = rows.find((r) => r.currency === 'USD')!
    expect(eur).toMatchObject({ income: 3500, expense: 1349, balance: 2151 })
    expect(usd).toMatchObject({ income: 100, expense: 40, balance: 60 })
  })

  it('filters sums by currency', () => {
    expect(sumByType(data, 'income', 'USD')).toBe(100)
    expect(sumByType(data, 'expense', 'EUR')).toBe(1349)
  })
})

describe('monthly aggregation', () => {
  it('aggregates a single month', () => {
    const s = monthlySummary(data, '2026-11')
    expect(s).toMatchObject({ income: 3600, expense: 390, savings: 3210, count: 7 })
  })

  it('aggregates a month in one currency only', () => {
    const s = monthlySummary(data, '2026-11', 'EUR')
    expect(s).toMatchObject({ income: 3500, expense: 350, savings: 3150 })
  })

  it('returns zeros for an empty month', () => {
    expect(monthlySummary(data, '2025-01')).toMatchObject({ income: 0, expense: 0, savings: 0, count: 0 })
  })

  it('builds a monthly trend ending at the requested month', () => {
    const trend = monthlyTrend(data, 3, '2026-11', 'EUR')
    expect(trend.map((p) => p.month)).toEqual(['2026-09', '2026-10', '2026-11'])
    expect(trend[2]).toMatchObject({ income: 3500, expense: 350, balance: 3150 })
    expect(trend[1].expense).toBe(999)
  })
})

describe('expenses by category', () => {
  it('groups and sorts expenses with percentages', () => {
    const rows = expensesByCategory(data, { month: '2026-11', currency: 'EUR' })
    expect(rows[0]).toMatchObject({ category: 'Housing', amount: 200 })
    expect(rows[1]).toMatchObject({ category: 'Groceries', amount: 150 })
    expect(rows.reduce((s, r) => s + r.percent, 0)).toBeCloseTo(100, 0)
  })
})

describe('budget thresholds', () => {
  it('is ok below 80%', () => {
    expect(budgetUsage(70, 100).status).toBe('ok')
    expect(budgetUsage(79.99, 100).status).toBe('ok')
  })
  it('warns at and above 80%', () => {
    expect(budgetUsage(80, 100).status).toBe('warning')
    expect(budgetUsage(95, 100).status).toBe('warning')
  })
  it('flags exceeded above 100%', () => {
    expect(budgetUsage(100.01, 100).status).toBe('exceeded')
    expect(budgetUsage(150, 100).remaining).toBe(-50)
  })
  it('handles missing budget', () => {
    expect(budgetUsage(50, null).status).toBe('none')
    expect(budgetUsage(50, 0).status).toBe('none')
  })
  it('counts spent per month/category/currency', () => {
    expect(spentInMonth(data, '2026-11', { category: 'Groceries', currency: 'EUR' })).toBe(150)
    expect(spentInMonth(data, '2026-11', { currency: 'USD' })).toBe(40)
  })
})

describe('optional conversion (user rates only)', () => {
  it('converts only when a rate is configured', () => {
    const noRates = convertedTotals(data, 'EUR', {})
    expect(noRates.included).toBe(data.filter((t) => t.currency === 'EUR').length)
    expect(noRates.excluded).toBe(2)
    expect(noRates.excludedCurrencies).toEqual(['USD'])
    expect(noRates.hasRates).toBe(false)
  })

  it('uses configured rates and reports exclusions', () => {
    const r = convertedTotals(data, 'EUR', { USD: 0.9 })
    expect(r.included).toBe(data.length)
    expect(r.excluded).toBe(0)
    // EUR income 3500 + USD 100*0.9 ; EUR expense 1349 + USD 40*0.9
    expect(r.income).toBeCloseTo(3590)
    expect(r.expense).toBeCloseTo(1385)
    expect(r.balance).toBeCloseTo(2205)
  })
})

describe('filtering & search', () => {
  it('searches description/category/amount', () => {
    expect(filterTransactions(data, { search: 'rent' })).toHaveLength(1)
    expect(filterTransactions(data, { search: 'shop' })).toHaveLength(2)
  })
  it('filters by type, category, currency and month', () => {
    expect(filterTransactions(data, { type: 'income' })).toHaveLength(3)
    expect(filterTransactions(data, { currency: 'USD' })).toHaveLength(2)
    expect(filterTransactions(data, { month: '2026-10' })).toHaveLength(1)
    expect(filterTransactions(data, { category: 'Groceries', month: '2026-11' })).toHaveLength(2)
  })
  it('sorts newest first', () => {
    const out = filterTransactions(data, {})
    expect(out[0].date >= out[out.length - 1].date).toBe(true)
  })
})
