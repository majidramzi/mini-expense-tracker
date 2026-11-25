export const CURRENCIES = ['EUR', 'USD', 'GBP', 'SEK', 'NOK', 'IRR'] as const
export type CurrencyCode = (typeof CURRENCIES)[number]

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TransactionType
  /** Always a positive number; direction is given by `type`. */
  amount: number
  currency: CurrencyCode
  category: string
  description: string
  /** ISO date, yyyy-mm-dd (local calendar day, no timezone shift) */
  date: string
  createdAt: string
  updatedAt: string
}

export interface CategoryBudget {
  category: string
  amount: number
  currency: CurrencyCode
}

export interface Budgets {
  /** Recurring monthly budget (applies to every month). Null = not set. */
  monthly: { amount: number; currency: CurrencyCode } | null
  /** Per-category monthly budgets, keyed by category name. */
  categories: Record<string, CategoryBudget>
}

export interface Settings {
  defaultCurrency: CurrencyCode
  theme: 'light' | 'dark'
  customCategories: string[]
  /**
   * Optional, user-configured conversion rates.
   * `conversionRates[X] = how many units of the DEFAULT currency 1 unit of X buys`.
   * Example: default EUR, USD rate 0.92 means 1 USD = 0.92 EUR.
   * The default currency itself is implicitly 1 and never needs an entry.
   * No rates are ever invented by the app.
   */
  conversionRates: Partial<Record<CurrencyCode, number>>
}

export interface AppData {
  version: 1
  transactions: Transaction[]
  budgets: Budgets
  settings: Settings
  exportedAt?: string
}

export type View = 'dashboard' | 'transactions' | 'budgets' | 'reports' | 'settings'

export const DEFAULT_SETTINGS: Settings = {
  defaultCurrency: 'EUR',
  theme: 'light',
  customCategories: [],
  conversionRates: {},
}

export const DEFAULT_BUDGETS: Budgets = { monthly: null, categories: {} }

export const EMPTY_DATA: AppData = {
  version: 1,
  transactions: [],
  budgets: DEFAULT_BUDGETS,
  settings: DEFAULT_SETTINGS,
}
