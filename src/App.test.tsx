import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import { STORAGE_KEY } from './lib/storage'

describe('App smoke test', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the empty-state dashboard with privacy messaging', () => {
    render(<App />)
    expect(screen.getByText('Welcome to Mini Expense Tracker')).toBeInTheDocument()
    expect(screen.getByText(/No transactions yet/)).toBeInTheDocument()
    expect(screen.getByText(/Private by design/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add transaction/i })).toBeInTheDocument()
  })

  it('opens the add-transaction form and persists a new transaction', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: /Add transaction/i })[0])
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '42.50' } })
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Test groceries' } })
    fireEvent.click(screen.getAllByRole('button', { name: /^Add transaction$/i }).find((button) => button.getAttribute('type') === 'submit')!)
    // Persisted to localStorage under the app key
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toContain('Test groceries')
    expect(raw).toContain('42.5')
  })
})
