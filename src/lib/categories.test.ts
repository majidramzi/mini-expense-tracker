import { describe, expect, it } from 'vitest'
import { allCategoryNames, categoriesForType, categoryColor } from './categories'

describe('categories', () => {
  it('provides predefined income and expense categories', () => {
    expect(categoriesForType('expense', [])).toContain('Groceries')
    expect(categoriesForType('income', [])).toContain('Salary')
    expect(categoriesForType('expense', [])).not.toContain('Salary')
  })
  it('merges custom categories without duplicates', () => {
    const names = categoriesForType('expense', ['Pets', 'Groceries'])
    expect(names).toContain('Pets')
    expect(names.filter((n) => n === 'Groceries')).toHaveLength(1)
    expect(allCategoryNames(['Pets'])).toContain('Pets')
  })
  it('gives stable colours', () => {
    expect(categoryColor('Groceries')).toBe(categoryColor('Groceries'))
    expect(categoryColor('Some Custom Thing')).toBe(categoryColor('Some Custom Thing'))
  })
})
