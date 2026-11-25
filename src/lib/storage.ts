import {
  CURRENCIES,
  DEFAULT_BUDGETS,
  DEFAULT_SETTINGS,
  EMPTY_DATA,
  type AppData,
  type Budgets,
  type CurrencyCode,
  type Settings,
  type Transaction,
} from '../types'
import { isCurrencyCode } from './currency'
import { isValidDateISO, round2 } from './calculations'

export const STORAGE_KEY = 'mini-expense-tracker:v1'

/* ------------------------------------------------------------------ */
/* Persistence (localStorage — data never leaves the browser)          */
/* ------------------------------------------------------------------ */

export function loadData(storage: Storage | null = defaultStorage()): AppData {
  if (!storage) return structuredClone(EMPTY_DATA)
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(EMPTY_DATA)
    const parsed = JSON.parse(raw) as Partial<AppData>
    const validated = validateBackup(parsed)
    if (!validated.valid) return structuredClone(EMPTY_DATA)
    return validated.data
  } catch {
    return structuredClone(EMPTY_DATA)
  }
}

export function saveData(data: AppData, storage: Storage | null = defaultStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function clearStoredData(storage: Storage | null = defaultStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable — nothing to clear */
  }
}

function defaultStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/* CSV export                                                          */
/* ------------------------------------------------------------------ */

const CSV_HEADERS = ['id', 'type', 'amount', 'currency', 'category', 'description', 'date', 'createdAt', 'updatedAt']

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function transactionsToCSV(txs: Transaction[]): string {
  const rows = txs.map((t) =>
    [t.id, t.type, String(t.amount), t.currency, t.category, t.description, t.date, t.createdAt, t.updatedAt]
      .map((v) => csvEscape(String(v)))
      .join(','),
  )
  return [CSV_HEADERS.join(','), ...rows].join('\n') + '\n'
}

/* ------------------------------------------------------------------ */
/* JSON backup: serialise + validated import                           */
/* ------------------------------------------------------------------ */

export function serializeBackup(data: AppData): string {
  return JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  data: AppData
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function validateTransaction(raw: unknown, index: number, errors: string[]): Transaction | null {
  if (!isRecord(raw)) {
    errors.push(`Transaction #${index + 1}: not an object`)
    return null
  }
  const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : null
  const type = raw.type === 'income' || raw.type === 'expense' ? raw.type : null
  const amount = typeof raw.amount === 'number' && Number.isFinite(raw.amount) && raw.amount > 0 ? round2(raw.amount) : null
  const currency: CurrencyCode | null = isCurrencyCode(raw.currency) ? raw.currency : null
  const category = typeof raw.category === 'string' && raw.category.trim().length > 0 ? raw.category.trim() : null
  const description = typeof raw.description === 'string' ? raw.description : ''
  const date = isValidDateISO(raw.date) ? (raw.date as string) : null
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString()
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt

  const problems: string[] = []
  if (!id) problems.push('missing/invalid id')
  if (!type) problems.push('type must be "income" or "expense"')
  if (amount === null) problems.push('amount must be a positive number')
  if (!currency) problems.push(`currency must be one of ${CURRENCIES.join(', ')}`)
  if (!category) problems.push('missing category')
  if (!date) problems.push('date must be a valid yyyy-mm-dd date')
  if (problems.length > 0) {
    errors.push(`Transaction #${index + 1}: ${problems.join('; ')}`)
    return null
  }
  return { id: id!, type: type!, amount: amount!, currency: currency!, category: category!, description, date: date!, createdAt, updatedAt }
}

function validateSettings(raw: unknown, errors: string[]): Settings {
  const base: Settings = structuredClone(DEFAULT_SETTINGS)
  if (raw === undefined) return base
  if (!isRecord(raw)) {
    errors.push('Settings: not an object — defaults used')
    return base
  }
  if (isCurrencyCode(raw.defaultCurrency)) base.defaultCurrency = raw.defaultCurrency
  else if (raw.defaultCurrency !== undefined) errors.push('Settings: invalid defaultCurrency — EUR used')
  if (raw.theme === 'light' || raw.theme === 'dark') base.theme = raw.theme
  if (Array.isArray(raw.customCategories)) {
    base.customCategories = raw.customCategories.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
  }
  if (isRecord(raw.conversionRates)) {
    const rates: Partial<Record<CurrencyCode, number>> = {}
    for (const code of CURRENCIES) {
      const r = raw.conversionRates[code]
      if (typeof r === 'number' && Number.isFinite(r) && r > 0) rates[code] = r
    }
    base.conversionRates = rates
  }
  return base
}

function validateBudgets(raw: unknown, errors: string[]): Budgets {
  const base: Budgets = structuredClone(DEFAULT_BUDGETS)
  if (raw === undefined) return base
  if (!isRecord(raw)) {
    errors.push('Budgets: not an object — defaults used')
    return base
  }
  if (isRecord(raw.monthly)) {
    const amount = raw.monthly.amount
    if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0 && isCurrencyCode(raw.monthly.currency)) {
      base.monthly = { amount: round2(amount), currency: raw.monthly.currency }
    } else {
      errors.push('Budgets.monthly: invalid amount/currency — ignored')
    }
  }
  if (isRecord(raw.categories)) {
    for (const [category, value] of Object.entries(raw.categories)) {
      if (isRecord(value) && typeof value.amount === 'number' && Number.isFinite(value.amount) && value.amount > 0 && isCurrencyCode(value.currency)) {
        base.categories[category] = { category, amount: round2(value.amount), currency: value.currency }
      } else {
        errors.push(`Budgets.categories["${category}"]: invalid — ignored`)
      }
    }
  }
  return base
}

/**
 * Validate an imported backup (parsed JSON or raw text).
 * Strict about transactions (any invalid row fails the import),
 * lenient about settings/budgets (defaults fill gaps, problems reported).
 */
export function validateBackup(input: unknown): ValidationResult {
  const errors: string[] = []
  let raw: unknown = input
  if (typeof input === 'string') {
    try {
      raw = JSON.parse(input)
    } catch {
      return { valid: false, errors: ['File is not valid JSON'], data: structuredClone(EMPTY_DATA) }
    }
  }
  if (!isRecord(raw)) {
    return { valid: false, errors: ['Backup root must be a JSON object'], data: structuredClone(EMPTY_DATA) }
  }
  if (raw.version !== undefined && raw.version !== 1) {
    return { valid: false, errors: ['Unsupported backup version'], data: structuredClone(EMPTY_DATA) }
  }
  if (!Array.isArray(raw.transactions)) {
    return { valid: false, errors: ['Backup must contain a "transactions" array'], data: structuredClone(EMPTY_DATA) }
  }
  const transactions: Transaction[] = []
  const seenIds = new Set<string>()
  raw.transactions.forEach((item, i) => {
    const tx = validateTransaction(item, i, errors)
    if (tx) {
      if (seenIds.has(tx.id)) {
        errors.push(`Transaction #${i + 1}: duplicate id "${tx.id}"`)
        return
      }
      seenIds.add(tx.id)
      transactions.push(tx)
    }
  })
  if (errors.some((e) => e.startsWith('Transaction #'))) {
    return { valid: false, errors, data: structuredClone(EMPTY_DATA) }
  }
  const data: AppData = {
    version: 1,
    transactions,
    budgets: validateBudgets(raw.budgets, errors),
    settings: validateSettings(raw.settings, errors),
  }
  return { valid: true, errors, data }
}

/* ------------------------------------------------------------------ */
/* Download helper (browser only)                                      */
/* ------------------------------------------------------------------ */

export function downloadFile(filename: string, content: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
