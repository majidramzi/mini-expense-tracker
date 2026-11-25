import { describe, expect, it } from 'vitest'
import { convertAmount, formatMoney, isCurrencyCode } from './currency'

describe('currency handling', () => {
  it('recognises supported currencies only', () => {
    expect(isCurrencyCode('EUR')).toBe(true)
    expect(isCurrencyCode('IRR')).toBe(true)
    expect(isCurrencyCode('BTC')).toBe(false)
    expect(isCurrencyCode('')).toBe(false)
    expect(isCurrencyCode(undefined)).toBe(false)
  })

  it('formats money in its own currency without converting', () => {
    expect(formatMoney(1234.5, 'EUR')).toContain('1,234.50')
    expect(formatMoney(100, 'IRR')).not.toContain('.00') // IRR has 0 decimals
    expect(formatMoney(0, 'USD')).toContain('0.00')
  })

  it('never invents an exchange rate', () => {
    expect(convertAmount(100, 'USD', 'EUR', {}, 'EUR')).toBeNull()
    expect(convertAmount(100, 'USD', 'EUR', { USD: 0 }, 'EUR')).toBeNull()
    expect(convertAmount(100, 'USD', 'EUR', { USD: -1 }, 'EUR')).toBeNull()
  })

  it('converts with a user-configured rate', () => {
    expect(convertAmount(100, 'USD', 'EUR', { USD: 0.9 }, 'EUR')).toBeCloseTo(90)
    expect(convertAmount(90, 'EUR', 'USD', { USD: 0.9 }, 'EUR')).toBeCloseTo(100)
  })

  it('identity conversion needs no rate', () => {
    expect(convertAmount(42, 'SEK', 'SEK', {}, 'EUR')).toBe(42)
  })

  it('converts between two non-default currencies via the default', () => {
    // 1 USD = 0.9 EUR, 1 GBP = 1.1 EUR → 100 USD = 90 EUR = 81.81 GBP
    expect(convertAmount(100, 'USD', 'GBP', { USD: 0.9, GBP: 1.1 }, 'EUR')).toBeCloseTo(81.82, 1)
  })
})
