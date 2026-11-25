import { useRef, useState } from 'react'
import { AlertTriangle, Download, FileJson, Moon, Plus, ShieldCheck, Sparkles, Sun, Trash2, Upload } from 'lucide-react'
import { useExpense } from '../store/ExpenseContext'
import { downloadFile, serializeBackup, transactionsToCSV } from '../lib/storage'
import { CURRENCIES, type CurrencyCode } from '../types'
import { Card, Modal, SectionTitle, btnDanger, btnPrimary, btnSecondary, inputCls, labelCls } from '../components/ui'

export default function Settings() {
  const { data, settings, updateSettings, importBackup, loadSampleData, clearAll, storageOk } = useExpense()
  const [newCategory, setNewCategory] = useState('')
  const [catMsg, setCatMsg] = useState('')
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearText, setClearText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function addCustomCategory(e: React.FormEvent) {
    e.preventDefault()
    const name = newCategory.trim()
    if (!name) { setCatMsg('Enter a category name.'); return }
    if (settings.customCategories.includes(name)) { setCatMsg('That category already exists.'); return }
    updateSettings({ customCategories: [...settings.customCategories, name] })
    setNewCategory('')
    setCatMsg(`Added "${name}".`)
  }

  function removeCustomCategory(name: string) {
    updateSettings({ customCategories: settings.customCategories.filter((c) => c !== name) })
  }

  async function onImportFile(file: File) {
    if (!window.confirm("Importing will replace all current data. Export a JSON backup first. Continue?")) return
    const text = await file.text()
    const result = importBackup(text)
    if (result.valid) {
      setImportMsg({ ok: true, text: `Import successful: ${result.data.transactions.length} transaction(s) restored.${result.errors.length ? ` Notes: ${result.errors.join(' ')}` : ''}` })
    } else {
      setImportMsg({ ok: false, text: `Import failed — nothing was changed. ${result.errors.join(' ')}` })
    }
  }

  function setRate(code: CurrencyCode, raw: string) {
    const value = raw.trim() === '' ? undefined : Number(raw)
    const next = { ...settings.conversionRates }
    if (value === undefined || !Number.isFinite(value) || value <= 0) delete next[code]
    else next[code] = value
    updateSettings({ conversionRates: next })
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Preferences, currencies, categories and your data.</p>
      </header>

      {!storageOk && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Browser storage appears unavailable or full, so changes may not persist. Export a backup now, then free up space or allow site storage.</p>
        </div>
      )}

      {/* Preferences */}
      <Card>
        <SectionTitle title="Preferences" subtitle="Default currency and appearance" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="default-currency" className={labelCls}>Default currency</label>
            <select id="default-currency" value={settings.defaultCurrency} onChange={(e) => updateSettings({ defaultCurrency: e.target.value as CurrencyCode, conversionRates: {} })} className={inputCls}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <p className="mt-1 text-xs text-slate-500">Used for new transactions and headline figures. Existing transactions keep their own currency. Changing this clears configured conversion rates.</p>
          </div>
          <div>
            <span className={labelCls}>Theme</span>
            <div className="flex gap-2" role="group" aria-label="Theme">
              <button type="button" onClick={() => updateSettings({ theme: 'light' })} aria-pressed={settings.theme === 'light'} className={`${btnSecondary} flex-1 ${settings.theme === 'light' ? '!border-teal-600 !text-teal-700 dark:!text-teal-300' : ''}`}><Sun className="h-4 w-4" /> Light</button>
              <button type="button" onClick={() => updateSettings({ theme: 'dark' })} aria-pressed={settings.theme === 'dark'} className={`${btnSecondary} flex-1 ${settings.theme === 'dark' ? '!border-teal-600 !text-teal-700 dark:!text-teal-300' : ''}`}><Moon className="h-4 w-4" /> Dark</button>
            </div>
          </div>
        </div>
      </Card>

      {/* Conversion rates */}
      <Card>
        <SectionTitle title="Conversion rates (optional)" subtitle={`How many ${settings.defaultCurrency} units 1 unit of each currency is worth. Leave blank if you don't want conversion — totals stay separate per currency. The app never invents rates.`} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CURRENCIES.filter((c) => c !== settings.defaultCurrency).map((code) => (
            <div key={code}>
              <label htmlFor={`rate-${code}`} className={labelCls}>1 {code} = ? {settings.defaultCurrency}</label>
              <input
                id={`rate-${code}`}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={settings.conversionRates[code] ?? ''}
                onChange={(e) => setRate(code, e.target.value)}
                placeholder="No rate"
                className={inputCls}
              />
            </div>
          ))}
        </div>
        {Object.keys(settings.conversionRates).length > 0 && (
          <button type="button" onClick={() => updateSettings({ conversionRates: {} })} className="mt-3 text-sm font-semibold text-rose-600 hover:underline">Clear all rates</button>
        )}
      </Card>

      {/* Custom categories */}
      <Card>
        <SectionTitle title="Custom categories" subtitle="Add your own categories — they appear in the transaction form for both income and expenses." />
        <form onSubmit={addCustomCategory} className="flex flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1">
            <label htmlFor="new-category" className={labelCls}>New category name</label>
            <input id="new-category" type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Pets" maxLength={40} className={inputCls} />
          </div>
          <button type="submit" className={btnPrimary}><Plus className="h-4 w-4" /> Add category</button>
        </form>
        {catMsg && <p className="mt-3 text-sm font-medium text-teal-700 dark:text-teal-400" role="status">{catMsg}</p>}
        {settings.customCategories.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {settings.customCategories.map((c) => (
              <li key={c} className="inline-flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-sm font-medium dark:bg-slate-800">
                {c}
                <button type="button" onClick={() => removeCustomCategory(c)} aria-label={`Remove custom category ${c}`} className="rounded-full p-1 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950"><Trash2 className="h-3.5 w-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Data management */}
      <Card>
        <SectionTitle title="Data management" subtitle="Export backups regularly — clearing browser data permanently removes local records." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button type="button" onClick={() => downloadFile('mini-expense-tracker-transactions.csv', transactionsToCSV(data.transactions), 'text/csv;charset=utf-8')} className={btnSecondary}><Download className="h-4 w-4" /> Export CSV</button>
          <button type="button" onClick={() => downloadFile('mini-expense-tracker-backup.json', serializeBackup(data), 'application/json;charset=utf-8')} className={btnSecondary}><FileJson className="h-4 w-4" /> Export JSON backup</button>
          <button type="button" onClick={() => fileRef.current?.click()} className={btnSecondary}><Upload className="h-4 w-4" /> Import JSON backup</button>
          <button type="button" onClick={() => { if (window.confirm("Loading sample data replaces current data. Export a backup first. Continue?")) loadSampleData() }} className={btnSecondary}><Sparkles className="h-4 w-4" /> Load sample data</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" aria-label="Choose backup file to import" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onImportFile(f); e.target.value = '' }} />
        </div>
        {importMsg && (
          <p role="status" className={`mt-4 rounded-xl px-3 py-2 text-sm font-medium ${importMsg.ok ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'}`}>{importMsg.text}</p>
        )}
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Import replaces all current data after validation. Invalid files are rejected without changing anything. Sample data replaces current data too.</p>

        <div className="mt-6 border-t border-rose-200 pt-5 dark:border-rose-900">
          <h3 className="font-semibold text-rose-700 dark:text-rose-400">Danger zone</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Permanently delete all transactions, budgets and settings stored in this browser.</p>
          <button type="button" onClick={() => { setConfirmClear(true); setClearText('') }} className={`${btnDanger} mt-3`}><Trash2 className="h-4 w-4" /> Clear all data…</button>
        </div>
      </Card>

      {/* Privacy */}
      <Card>
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-teal-700 dark:text-teal-400" />
          <div className="text-sm text-slate-600 dark:text-slate-300">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Privacy &amp; storage</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>No server-side financial storage — there is no backend and no account.</li>
              <li>No third-party analytics or tracking. No external API is required.</li>
              <li>All data lives in this browser's <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">localStorage</code> under the key <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">mini-expense-tracker:v1</code>.</li>
              <li><strong>Clearing browser data (site data / history) will remove your records.</strong> Export a JSON backup regularly and keep it somewhere safe.</li>
              <li>Use the app on a private device if you share a computer.</li>
            </ul>
          </div>
        </div>
      </Card>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="Clear all data?">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This permanently deletes <strong>{data.transactions.length} transaction(s)</strong>, all budgets and settings from this browser. There is no undo. Type <strong>CLEAR</strong> to confirm.
          </p>
          <label htmlFor="clear-confirm" className={labelCls}>Type CLEAR to confirm</label>
          <input id="clear-confirm" type="text" value={clearText} onChange={(e) => setClearText(e.target.value)} placeholder="CLEAR" className={inputCls} autoComplete="off" />
          <div className="mt-6 flex gap-3">
            <button type="button" disabled={clearText !== 'CLEAR'} onClick={() => { clearAll(); setConfirmClear(false) }} className={btnDanger}><Trash2 className="h-4 w-4" /> Clear everything</button>
            <button type="button" onClick={() => setConfirmClear(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
