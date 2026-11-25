import { describe, expect, it } from 'vitest'
import {
  STORAGE_KEY, clearStoredData, loadData, saveData,
  serializeBackup, transactionsToCSV, validateBackup,
} from './storage'
import { EMPTY_DATA, type AppData } from '../types'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v) },
    removeItem: (k: string) => { map.delete(k) },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() { return map.size },
  } as Storage
}

const sample: AppData = {
  version: 1,
  transactions: [
    { id: 'a1', type: 'income', amount: 1000, currency: 'EUR', category: 'Salary', description: 'Pay, November', date: '2026-11-01', createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z' },
    { id: 'b2', type: 'expense', amount: 25.5, currency: 'USD', category: 'Transport', description: 'Taxi "airport"', date: '2026-11-02', createdAt: '2026-11-02T00:00:00Z', updatedAt: '2026-11-02T00:00:00Z' },
  ],
  budgets: { monthly: { amount: 500, currency: 'EUR' }, categories: { Transport: { category: 'Transport', amount: 80, currency: 'EUR' } } },
  settings: { defaultCurrency: 'EUR', theme: 'dark', customCategories: ['Pets'], conversionRates: { USD: 0.9 } },
}

describe('local persistence', () => {
  it('round-trips data through storage', () => {
    const store = memoryStorage()
    expect(saveData(sample, store)).toBe(true)
    expect(store.getItem(STORAGE_KEY)).toContain('Salary')
    const loaded = loadData(store)
    expect(loaded.transactions).toHaveLength(2)
    expect(loaded.settings.theme).toBe('dark')
    expect(loaded.budgets.monthly?.amount).toBe(500)
  })

  it('returns empty data when nothing is stored or data is corrupt', () => {
    const store = memoryStorage()
    expect(loadData(store).transactions).toHaveLength(0)
    store.setItem(STORAGE_KEY, '{not json')
    expect(loadData(store).transactions).toHaveLength(0)
    store.setItem(STORAGE_KEY, JSON.stringify({ transactions: [{ bogus: true }] }))
    expect(loadData(store).transactions).toHaveLength(0)
  })

  it('clears stored data', () => {
    const store = memoryStorage()
    saveData(sample, store)
    clearStoredData(store)
    expect(store.getItem(STORAGE_KEY)).toBeNull()
    expect(loadData(store)).toEqual(EMPTY_DATA)
  })
})

describe('CSV export', () => {
  it('produces a header plus one row per transaction with proper escaping', () => {
    const csv = transactionsToCSV(sample.transactions)
    const lines = csv.trim().split('\n')
    expect(lines[0]).toBe('id,type,amount,currency,category,description,date,createdAt,updatedAt')
    expect(lines).toHaveLength(3)
    expect(lines[2]).toContain('"Taxi ""airport"""')
  })
  it('handles an empty list', () => {
    expect(transactionsToCSV([]).trim().split('\n')).toHaveLength(1)
  })
})

describe('JSON backup import / export', () => {
  it('serialises and re-validates a backup (round-trip)', () => {
    const text = serializeBackup(sample)
    const result = validateBackup(text)
    expect(result.valid).toBe(true)
    expect(result.data.transactions).toHaveLength(2)
    expect(result.data.settings.customCategories).toEqual(['Pets'])
    expect(result.data.settings.conversionRates).toEqual({ USD: 0.9 })
  })

  it('rejects non-JSON and wrong shapes without throwing', () => {
    expect(validateBackup('not json').valid).toBe(false)
    expect(validateBackup('[]').valid).toBe(false)
    expect(validateBackup({}).valid).toBe(false)
    expect(validateBackup(null).valid).toBe(false)
  })

  it('rejects backups with invalid transactions', () => {
    const bad = { version: 1, transactions: [{ id: 'x', type: 'expense', amount: -5, currency: 'EUR', category: 'Food', date: '2026-11-01' }] }
    const r = validateBackup(bad)
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toContain('amount')
  })

  it('rejects unknown currencies and bad dates', () => {
    const bad = { transactions: [{ id: 'x', type: 'income', amount: 10, currency: 'BTC', category: 'Gift', date: '2026-13-40' }] }
    const r = validateBackup(bad)
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toMatch(/currency/)
    expect(r.errors.join(' ')).toMatch(/date/)
  })

  it('rejects duplicate ids', () => {
    const dup = { transactions: [sample.transactions[0], sample.transactions[0]] }
    expect(validateBackup(dup).valid).toBe(false)
  })

  it('fills defaults for missing settings/budgets and reports notes', () => {
    const r = validateBackup({ transactions: [] })
    expect(r.valid).toBe(true)
    expect(r.data.settings.defaultCurrency).toBe('EUR')
    expect(r.data.budgets.monthly).toBeNull()
  })
})
