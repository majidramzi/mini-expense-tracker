import { format, subDays } from 'date-fns'
import type { AppData, Transaction } from '../types'
import { uid } from './calculations'

/** Clearly-labelled demo data, only loaded when the user asks for it. */
export function buildSampleData(base: AppData): AppData {
  const now = new Date()
  const d = (daysAgo: number) => format(subDays(now, daysAgo), 'yyyy-MM-dd')
  const mk = (partial: Partial<Transaction> & Pick<Transaction, 'type' | 'amount' | 'category' | 'date'>): Transaction => ({
    id: uid(),
    currency: 'EUR',
    description: '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...partial,
  })
  const transactions: Transaction[] = [
    mk({ type: 'income', amount: 3200, category: 'Salary', description: 'Monthly salary', date: d(2) }),
    mk({ type: 'income', amount: 450, category: 'Freelance', description: 'Design project invoice', date: d(9) }),
    mk({ type: 'expense', amount: 86.4, category: 'Groceries', description: 'Weekly supermarket run', date: d(1) }),
    mk({ type: 'expense', amount: 42.9, category: 'Food & Dining', description: 'Lunch with colleagues', date: d(3) }),
    mk({ type: 'expense', amount: 65, category: 'Transport', description: 'Monthly transit pass', date: d(5) }),
    mk({ type: 'expense', amount: 950, category: 'Housing', description: 'Rent', date: d(4) }),
    mk({ type: 'expense', amount: 58.2, category: 'Utilities', description: 'Electricity & internet', date: d(6) }),
    mk({ type: 'expense', amount: 24.99, category: 'Subscriptions', description: 'Music streaming', date: d(7) }),
    mk({ type: 'expense', amount: 120, category: 'Shopping', description: 'New running shoes', date: d(10) }),
    mk({ type: 'expense', amount: 35, category: 'Health', description: 'Pharmacy', date: d(12) }),
    mk({ type: 'expense', amount: 210, category: 'Travel', description: 'Train tickets', date: d(15) }),
    mk({ type: 'income', amount: 3200, category: 'Salary', description: 'Monthly salary', date: d(32) }),
    mk({ type: 'expense', amount: 940, category: 'Housing', description: 'Rent', date: d(33) }),
    mk({ type: 'expense', amount: 310, category: 'Groceries', description: 'Groceries (last month)', date: d(34) }),
  ]
  return {
    ...base,
    transactions,
    budgets: {
      monthly: { amount: 1800, currency: 'EUR' },
      categories: {
        'Food & Dining': { category: 'Food & Dining', amount: 300, currency: 'EUR' },
        Groceries: { category: 'Groceries', amount: 400, currency: 'EUR' },
        Transport: { category: 'Transport', amount: 100, currency: 'EUR' },
      },
    },
  }
}
