import type { Dataset, Filters } from '../types'
import { useI18n } from '../lib/i18n'

type Props = { data: Dataset; filters: Filters; setFilters: (filters: Filters) => void }

export function FiltersBar({ data, filters, setFilters }: Props) {
  const { t } = useI18n()
  const incomes = Array.from(new Set(data.countries.map(c => c.income).filter(Boolean))) as string[]
  const set = (key: keyof Filters, value: string) => setFilters({ ...filters, [key]: value })
  return <section className="filters" aria-label={t.filters.ariaLabel}>
    <label>{t.filters.income}<select value={filters.income} onChange={e => set('income', e.target.value)}><option value="all">{t.filters.all}</option>{incomes.map(x => <option key={x}>{x}</option>)}</select></label>
    <label>{t.filters.conflict}<select value={filters.conflict} onChange={e => set('conflict', e.target.value)}><option value="all">{t.filters.all}</option><option value="conflict">{t.filters.conflictAffected}</option><option value="stable">{t.filters.otherSettings}</option></select></label>
    <button className="reset" onClick={() => setFilters({ income: 'all', conflict: 'all' })}>{t.filters.reset}</button>
  </section>
}
