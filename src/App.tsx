import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import type { Dataset, Filters } from './types'
import { EmptyState, Shell, type View } from './components/Shell'
import { FiltersBar } from './components/Filters'
import { parseFilters, parsePeerMode, parseView, type PeerMode } from './lib/navigation'

const RegionalOverview = lazy(() => import('./features/SituationRoom').then(module => ({ default: module.SituationRoom })))
const CountryProfile = lazy(() => import('./features/CountryProfile').then(module => ({ default: module.CountryProfile })))
const ContextPressures = lazy(() => import('./features/ContextPressures').then(module => ({ default: module.ContextPressures })))
const Methodology = lazy(() => import('./features/Methodology').then(module => ({ default: module.Methodology })))
const About = lazy(() => import('./features/About').then(module => ({ default: module.About })))

export default function App() {
  const [data, setData] = useState<Dataset | null>(null)
  const [error, setError] = useState('')
  const [view, setViewState] = useState<View>(() => parseView(new URLSearchParams(location.search).get('view')))
  const [selected, setSelected] = useState(() => new URLSearchParams(location.search).get('country') || 'LBN')
  const [filters, setFilters] = useState<Filters>(() => parseFilters(new URLSearchParams(location.search)))
  const [peerMode, setPeerMode] = useState<PeerMode>(() => parsePeerMode(new URLSearchParams(location.search).get('peers')))
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}data.json`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }).then(setData).catch(e => setError(String(e))) }, [])
  useEffect(() => {
    const url = new URL(location.href)
    const raw = url.searchParams.get('view')
    if (raw === 'compare') url.searchParams.set('view', 'context')
    if (raw === 'situation' || raw == null) url.searchParams.set('view', 'overview')
    history.replaceState({}, '', url)
  }, [])
  useEffect(() => {
    const url = new URL(location.href)
    for (const [key, value] of Object.entries(filters)) {
      if (value === 'all') url.searchParams.delete(key)
      else url.searchParams.set(key, value)
    }
    url.searchParams.delete('foundation')
    url.searchParams.set('peers', peerMode)
    history.replaceState({}, '', url)
  }, [filters, peerMode])
  useEffect(() => {
    if (!data) return
    const incomes = new Set(data.countries.map(c => c.income).filter(Boolean))
    const capacities = new Set(data.meta.capacity_order)
    const income = filters.income === 'all' || incomes.has(filters.income) ? filters.income : 'all'
    const capacity = filters.capacity === 'all' || capacities.has(filters.capacity) ? filters.capacity : 'all'
    if (income !== filters.income || capacity !== filters.capacity) setFilters({ ...filters, income, capacity })
  }, [data, filters])
  const setView = (next: View) => { setViewState(next); const url = new URL(location.href); url.searchParams.set('view', next); history.replaceState({}, '', url) }
  const setCountry = (iso: string) => { setSelected(iso); setView('country'); const url = new URL(location.href); url.searchParams.set('country', iso); history.replaceState({}, '', url) }
  const filtered = useMemo(() => data?.countries.filter(c => (filters.income === 'all' || c.income === filters.income) && (filters.conflict === 'all' || (filters.conflict === 'conflict') === c.conflict) && (filters.capacity === 'all' || c.capacities?.[filters.capacity] != null)) ?? [], [data, filters])
  if (error) return <div className="fatal"><h1>Dataset unavailable</h1><p>{error}</p><p>The last valid dataset could not be loaded. No values have been fabricated.</p></div>
  if (!data) return <div className="loading">Loading validated preparedness data…</div>
  const country = data.countries.find(c => c.iso3 === selected) ?? data.countries[0]
  const filteredView = view === 'overview' || view === 'context'
  return <Shell view={view} setView={setView} generated={data.meta.generated} onBriefing={() => window.print()}>
    {filteredView && <FiltersBar data={data} filters={filters} setFilters={setFilters} />}
    {filteredView && filtered.length === 0 && <EmptyState title="No countries match these filters">Reset or broaden the filters. No missing observation has been substituted with zero.</EmptyState>}
    <Suspense fallback={<div className="loading">Loading workspace…</div>}>
      {view === 'overview' && filtered.length > 0 && <RegionalOverview data={data} countries={filtered} onCountry={setCountry} />}
      {view === 'country' && <CountryProfile data={data} country={country} setCountry={setCountry} peerMode={peerMode} setPeerMode={setPeerMode} />}
      {view === 'context' && filtered.length > 0 && <ContextPressures data={data} countries={filtered} onCountry={setCountry} />}
      {view === 'about' && <About data={data} />}
      {view === 'methodology' && <Methodology data={data} />}
    </Suspense>
  </Shell>
}
