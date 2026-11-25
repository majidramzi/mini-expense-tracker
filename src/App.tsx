import { useState } from 'react'
import { BarChart3, LayoutDashboard, ListOrdered, Moon, Settings as SettingsIcon, Sun, Wallet } from 'lucide-react'
import { ExpenseProvider, useExpense } from './store/ExpenseContext'
import type { Transaction, View } from './types'
import Dashboard from './views/Dashboard'
import Transactions from './views/Transactions'
import Budgets from './views/Budgets'
import Reports from './views/Reports'
import SettingsView from './views/Settings'
import TransactionModal from './components/TransactionModal'
import { cn } from './lib/utils'

const NAV: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ListOrdered },
  { id: 'budgets', label: 'Budgets', icon: Wallet },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

function Shell() {
  const [view, setView] = useState<View>('dashboard')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const { settings, updateSettings, loadSampleData, storageOk } = useExpense()

  const openAdd = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (tx: Transaction) => { setEditing(tx); setModalOpen(true) }
  const go = (v: View) => { setView(v); window.scrollTo({ top: 0 }) }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-7xl gap-6 px-3 py-4 sm:px-6 lg:px-8">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-4 hidden h-fit w-60 shrink-0 flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex" aria-label="Main navigation">
          <div className="mb-3 flex items-center gap-2.5 px-2 pt-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white"><Wallet className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-extrabold leading-tight">Mini Expense</p>
              <p className="text-xs leading-tight text-slate-500">Private tracker</p>
            </div>
          </div>
          <nav className="space-y-1">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                aria-current={view === item.id ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                  view === item.id ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                <item.icon className="h-5 w-5" /> {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-3 border-t border-slate-200 px-2 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {settings.theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {settings.theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </button>
            <p className="px-3 pb-1 pt-2 text-[11px] leading-relaxed text-slate-400">Data stays in this browser. Export backups regularly.</p>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 pb-24 md:pb-8">
          {!storageOk && <div role="alert" className="mb-4 rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-950">Storage is unavailable or contains invalid data. Changes may not persist; existing invalid data has not been overwritten. Check Settings and export a backup.</div>}
          {view === 'dashboard' && <Dashboard onAdd={openAdd} onEdit={openEdit} onOpenTransactions={() => go('transactions')} onLoadSample={() => { if (window.confirm("Loading sample data replaces current transactions and budgets. Continue?")) loadSampleData() }} />}
          {view === 'transactions' && <Transactions onAdd={openAdd} onEdit={openEdit} />}
          {view === 'budgets' && <Budgets />}
          {view === 'reports' && <Reports />}
          {view === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white"><Wallet className="h-4 w-4" /></span>
          <span className="font-extrabold">Mini Expense</span>
        </div>
        <button type="button" onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })} aria-label="Toggle theme" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          {settings.theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden" aria-label="Main navigation">
        <div className="grid grid-cols-5">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              aria-current={view === item.id ? 'page' : undefined}
              className={cn('flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold', view === item.id ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400')}
            >
              <item.icon className="h-5 w-5" /> {item.label}
            </button>
          ))}
        </div>
      </nav>

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
    </div>
  )
}

export default function App() {
  return (
    <ExpenseProvider>
      {/* Spacer so mobile content clears the fixed top bar */}
      <div className="pt-14 md:pt-0">
        <Shell />
      </div>
    </ExpenseProvider>
  )
}
