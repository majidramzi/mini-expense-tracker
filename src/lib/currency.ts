import { CURRENCIES, type CurrencyCode } from '../types'

export { CURRENCIES }
export type { CurrencyCode }

export const CURRENCY_META: Record<CurrencyCode, { symbol: string; label: string; decimals: number }> = {
  EUR: { symbol: '€', label: 'Euro', decimals: 2 },
  USD: { symbol: '$', label: 'US Dollar', decimals: 2 },
  GBP: { symbol: '£', label: 'British Pound', decimals: 2 },
  SEK: { symbol: 'kr', label: 'Swedish Krona', decimals: 2 },
  NOK: { symbol: 'kr', label: 'Norwegian Krone', decimals: 2 },
  IRR: { symbol: '﷼', label: 'Iranian Rial', decimals: 0 },
}

export function isCurrencyCode(v: unknown): v is CurrencyCode {
  return typeof v === 'string' && (CURRENCIES as readonly string[]).includes(v)
}

/** Format an amount in its own currency. Never converts. */
export function formatMoney(amount: number, currency: CurrencyCode): string {
  const meta = CURRENCY_META[currency]
  const n = Number.isFinite(amount) ? amount : 0
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    }).format(n)
  } catch {
    return `${meta.symbol}${n.toFixed(meta.decimals)} ${currency}`
  }
}

/** Compact axis formatting, e.g. 1.2k */
export function formatCompact(amount: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)
}

/**
 * Convert `amount` from `from` to `to` using ONLY user-configured rates.
 * rates[X] = units of the default currency per 1 unit of X.
 * Returns null when no rate is available — the app never invents a rate.
 */
export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Partial<Record<CurrencyCode, number>>,
  defaultCurrency: CurrencyCode,
): number | null {
  if (from === to) return amount
  // Express both in default-currency units, then divide.
  const rateOf = (c: CurrencyCode): number | null => {
    if (c === defaultCurrency) return 1
    const r = rates[c]
    return typeof r === 'number' && Number.isFinite(r) && r > 0 ? r : null
  }
  const fromRate = rateOf(from)
  const toRate = rateOf(to)
  if (fromRate === null || toRate === null) return null
  return (amount * fromRate) / toRate
}

export function hasAnyRate(rates: Partial<Record<CurrencyCode, number>>): boolean {
  return Object.values(rates).some((r) => typeof r === 'number' && r > 0)
}
