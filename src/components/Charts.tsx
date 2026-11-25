import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'
import type { CategorySlice, DayPoint, MonthPoint, WeekPoint } from '../lib/calculations'
import { categoryColor } from '../lib/categories'
import { formatCompact, formatMoney } from '../lib/currency'
import type { CurrencyCode } from '../types'

const INCOME = '#059669'
const EXPENSE = '#e11d48'
const BALANCE = '#0ea5e9'

function moneyTooltip(currency: CurrencyCode) {
  return {
    formatter: (value: number | string | readonly (number | string)[] | undefined) => formatMoney(Number(value ?? 0), currency),
    contentStyle: { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 },
  }
}

export function CategoryPie({ data, currency }: { data: CategorySlice[]; currency: CurrencyCode }) {
  if (data.length === 0) return <ChartEmpty text="No expenses in this period." />
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="category" innerRadius={55} outerRadius={95} paddingAngle={2} strokeWidth={2} stroke="transparent">
            {data.map((d) => (
              <Cell key={d.category} fill={categoryColor(d.category)} />
            ))}
          </Pie>
          <Tooltip {...moneyTooltip(currency)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function IncomeExpenseBars({ data, currency }: { data: MonthPoint[]; currency: CurrencyCode }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.4} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v: number) => formatCompact(v)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
          <Tooltip {...moneyTooltip(currency)} cursor={{ fill: 'rgba(148,163,184,0.12)' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name="Income" fill={INCOME} radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" name="Expenses" fill={EXPENSE} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TrendArea({ data, currency }: { data: MonthPoint[]; currency: CurrencyCode }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.4} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v: number) => formatCompact(v)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
          <Tooltip {...moneyTooltip(currency)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="income" name="Income" stroke={INCOME} fill={INCOME} fillOpacity={0.15} strokeWidth={2} />
          <Area type="monotone" dataKey="expense" name="Expenses" stroke={EXPENSE} fill={EXPENSE} fillOpacity={0.15} strokeWidth={2} />
          <Area type="monotone" dataKey="balance" name="Balance" stroke={BALANCE} fill={BALANCE} fillOpacity={0.1} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SpendingBars({ data, currency, dataKey = 'expense' }: { data: Array<DayPoint | WeekPoint>; currency: CurrencyCode; dataKey?: 'expense' | 'income' }) {
  if (data.length === 0) return <ChartEmpty text="No data yet." />
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.4} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
          <YAxis tickFormatter={(v: number) => formatCompact(v)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
          <Tooltip {...moneyTooltip(currency)} cursor={{ fill: 'rgba(148,163,184,0.12)' }} />
          <Bar dataKey={dataKey} name={dataKey === 'expense' ? 'Expenses' : 'Income'} fill={dataKey === 'expense' ? EXPENSE : INCOME} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {text}
    </div>
  )
}
