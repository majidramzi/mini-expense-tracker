import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppData, Budgets, Settings, Transaction } from '../types'
import { EMPTY_DATA } from '../types'
import { clearStoredData, loadData, saveData, validateBackup, type ValidationResult } from '../lib/storage'
import { uid, todayISO } from '../lib/calculations'
import { buildSampleData } from '../lib/sampleData'

export interface TransactionInput {
  type: Transaction['type']
  amount: number
  currency: Transaction['currency']
  category: string
  description: string
  date: string
}

interface ExpenseContextValue {
  data: AppData
  transactions: Transaction[]
  settings: Settings
  budgets: Budgets
  addTransaction: (input: TransactionInput) => void
  updateTransaction: (id: string, input: TransactionInput) => void
  deleteTransaction: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  updateBudgets: (budgets: Budgets) => void
  importBackup: (text: string) => ValidationResult
  loadSampleData: () => void
  clearAll: () => void
  storageOk: boolean
}

const Ctx = createContext<ExpenseContextValue | null>(null)

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())
  const [storageOk, setStorageOk] = useState(true)
  const [storageLocked, setStorageLocked] = useState(() => {
    try { const raw = window.localStorage.getItem('mini-expense-tracker:v1'); return !!raw && !validateBackup(raw).valid } catch { return true }
  })

  // Persist on every change + apply theme class
  useEffect(() => {
    if (storageLocked) { setStorageOk(false); return }
    const ok = saveData(data)
    setStorageOk(ok)
  }, [data, storageLocked])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', data.settings.theme === 'dark')
    root.style.colorScheme = data.settings.theme
  }, [data.settings.theme])

  const addTransaction = useCallback((input: TransactionInput) => {
    const now = new Date().toISOString()
    const tx: Transaction = {
      id: uid(),
      ...input,
      amount: Math.round(input.amount * 100) / 100,
      description: input.description.trim(),
      date: input.date || todayISO(),
      createdAt: now,
      updatedAt: now,
    }
    setData((d) => ({ ...d, transactions: [tx, ...d.transactions] }))
  }, [])

  const updateTransaction = useCallback((id: string, input: TransactionInput) => {
    setData((d) => ({
      ...d,
      transactions: d.transactions.map((t) =>
        t.id === id
          ? { ...t, ...input, amount: Math.round(input.amount * 100) / 100, description: input.description.trim(), updatedAt: new Date().toISOString() }
          : t,
      ),
    }))
  }, [])

  const deleteTransaction = useCallback((id: string) => {
    setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }))
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }))
  }, [])

  const updateBudgets = useCallback((budgets: Budgets) => {
    setData((d) => ({ ...d, budgets }))
  }, [])

  const importBackup = useCallback((text: string): ValidationResult => {
    const result = validateBackup(text)
    if (result.valid) { setData(result.data); setStorageLocked(false) }
    return result
  }, [])

  const loadSampleData = useCallback(() => {
    setData((d) => buildSampleData(d))
  }, [])

  const clearAll = useCallback(() => {
    clearStoredData()
    setStorageLocked(false)
    setData(structuredClone(EMPTY_DATA))
  }, [])

  const value = useMemo<ExpenseContextValue>(
    () => ({
      data,
      transactions: data.transactions,
      settings: data.settings,
      budgets: data.budgets,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      updateSettings,
      updateBudgets,
      importBackup,
      loadSampleData,
      clearAll,
      storageOk,
    }),
    [data, addTransaction, updateTransaction, deleteTransaction, updateSettings, updateBudgets, importBackup, loadSampleData, clearAll, storageOk],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useExpense(): ExpenseContextValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useExpense must be used within ExpenseProvider')
  return ctx
}
