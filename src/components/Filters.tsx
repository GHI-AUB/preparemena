import type { Dataset, Filters } from '../types'

type Props = { data: Dataset; filters: Filters; setFilters: (filters: Filters) => void }

export function FiltersBar({ data, filters, setFilters }: Props) {
  const incomes = Array.from(new Set(data.countries.map(c => c.income).filter(Boolean))) as string[]
  const set = (key: keyof Filters, value: string) => setFilters({ ...filters, [key]: value })
  return <section className="filters" aria-label="Dashboard filters">
    <label>Income group<select value={filters.income} onChange={e => set('income', e.target.value)}><option value="all">All</option>{incomes.map(x => <option key={x}>{x}</option>)}</select></label>
    <label>Conflict status<select value={filters.conflict} onChange={e => set('conflict', e.target.value)}><option value="all">All</option><option value="conflict">Conflict-affected</option><option value="stable">Other settings</option></select></label>
    <label>Capacity domain<select value={filters.capacity} onChange={e => set('capacity', e.target.value)}><option value="all">All capacities</option>{data.meta.capacity_order.map(x => <option key={x}>{x}</option>)}</select></label>
    <button className="reset" onClick={() => setFilters({ income: 'all', conflict: 'all', capacity: 'all' })}>Reset filters</button>
  </section>
}
