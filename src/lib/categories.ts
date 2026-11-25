import type { TransactionType } from '../types'

export interface CategoryDef {
  name: string
  type: TransactionType | 'both'
  /** Lucide icon key resolved in the UI layer */
  icon: string
  color: string
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { name: 'Food & Dining', type: 'expense', icon: 'UtensilsCrossed', color: '#f97316' },
  { name: 'Groceries', type: 'expense', icon: 'ShoppingBasket', color: '#84cc16' },
  { name: 'Transport', type: 'expense', icon: 'Car', color: '#0ea5e9' },
  { name: 'Housing', type: 'expense', icon: 'Home', color: '#6366f1' },
  { name: 'Utilities', type: 'expense', icon: 'Zap', color: '#eab308' },
  { name: 'Health', type: 'expense', icon: 'HeartPulse', color: '#ec4899' },
  { name: 'Entertainment', type: 'expense', icon: 'Clapperboard', color: '#a855f7' },
  { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#14b8a6' },
  { name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#3b82f6' },
  { name: 'Travel', type: 'expense', icon: 'Plane', color: '#06b6d4' },
  { name: 'Subscriptions', type: 'expense', icon: 'Repeat', color: '#f43f5e' },
  { name: 'Other Expense', type: 'expense', icon: 'CircleDot', color: '#64748b' },
]

export const INCOME_CATEGORIES: CategoryDef[] = [
  { name: 'Salary', type: 'income', icon: 'Briefcase', color: '#059669' },
  { name: 'Freelance', type: 'income', icon: 'Laptop', color: '#0d9488' },
  { name: 'Business', type: 'income', icon: 'Store', color: '#65a30d' },
  { name: 'Investment', type: 'income', icon: 'TrendingUp', color: '#16a34a' },
  { name: 'Gift', type: 'income', icon: 'Gift', color: '#db2777' },
  { name: 'Refund', type: 'income', icon: 'Undo2', color: '#0891b2' },
  { name: 'Other Income', type: 'income', icon: 'CircleDot', color: '#64748b' },
]

export const ALL_CATEGORIES: CategoryDef[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]

export function categoryColor(name: string): string {
  const found = ALL_CATEGORIES.find((c) => c.name === name)
  if (found) return found.color
  // Deterministic colour for custom categories (stable hash → palette)
  const palette = ['#f97316', '#0ea5e9', '#6366f1', '#ec4899', '#14b8a6', '#eab308', '#a855f7', '#f43f5e', '#84cc16', '#06b6d4']
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

export function categoriesForType(type: TransactionType, custom: string[]): string[] {
  const base = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const names = base.map((c) => c.name)
  for (const c of custom) if (!names.includes(c)) names.push(c)
  return names
}

export function allCategoryNames(custom: string[]): string[] {
  const names = ALL_CATEGORIES.map((c) => c.name)
  for (const c of custom) if (!names.includes(c)) names.push(c)
  return names
}
