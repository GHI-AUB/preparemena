import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import type { Dataset, Filters } from './types'
import { EmptyState, Shell, type View } from './components/Shell'
import { FiltersBar } from './components/Filters'
import { parseFilters, parsePeerMode, parseView, type PeerMode } from './lib/navigation'
import { WorkspaceSkeleton } from './components/Skeleton'
import { applyLang, dictionaries, I18nContext, resolveInitialLang, type Lang } from './lib/i18n'
import { resolveInitialTheme, applyTheme as applyChartTheme, type Theme } from './lib/chartTheme'

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
  const [theme, setThemeState] = useState<Theme>(() => { const initial = resolveInitialTheme(); document.documentElement.dataset.theme = initial; return initial })
  const [lang, setLangState] = useState<Lang>(() => resolveInitialLang())
  useEffect(() => { applyLang(lang) }, [lang])
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}data.json`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }).then(setData).catch(e => setError(String(e))) }, [])
  useEffect(() => {
    const url = new URL(location.href)
    const raw = url.searchParams.get('view')
    if (raw === 'compare') url.searchParams.set('view', 'context')
    if (raw === 'situation' || raw == null) url.searchParams.set('view', 'overview')
    history.replaceState({}, '', url)
  }, [])
  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(location.search)
      setViewState(parseView(params.get('view')))
      setSelected(params.get('country') || 'LBN')
      setFilters(parseFilters(params))
      setPeerMode(parsePeerMode(params.get('peers')))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
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
  const pushUrl = (mutate: (url: URL) => void) => { const url = new URL(location.href); mutate(url); if (url.href !== location.href) history.pushState({}, '', url) }
  const setView = (next: View) => { setViewState(next); pushUrl(url => url.searchParams.set('view', next)) }
  const setCountry = (iso: string) => { setSelected(iso); setViewState('country'); pushUrl(url => { url.searchParams.set('view', 'country'); url.searchParams.set('country', iso) }) }
  const setTheme = (next: Theme) => { applyChartTheme(next); setThemeState(next) }
  const setLang = (next: Lang) => { setLangState(next) }
  const i18n = useMemo(() => ({ lang, t: dictionaries[lang] }), [lang])
  const filtered = useMemo(() => data?.countries.filter(c => (filters.income === 'all' || c.income === filters.income) && (filters.conflict === 'all' || (filters.conflict === 'conflict') === c.conflict) && (filters.capacity === 'all' || c.capacities?.[filters.capacity] != null)) ?? [], [data, filters])
  if (error) return <div className="fatal"><h1>Dataset unavailable</h1><p>{error}</p><p>The last valid dataset could not be loaded. No values have been fabricated.</p></div>
  if (!data) return <WorkspaceSkeleton label={dictionaries[lang].common.loadingData} />
  const country = data.countries.find(c => c.iso3 === selected) ?? data.countries[0]
  const filteredView = view === 'overview' || view === 'context'
  return <I18nContext.Provider value={i18n}>
    <Shell view={view} setView={setView} generated={data.meta.generated} onBriefing={() => window.print()} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang}>
      {filteredView && <FiltersBar data={data} filters={filters} setFilters={setFilters} />}
      {filteredView && filtered.length === 0 && <EmptyState title={i18n.t.empty.title}>{i18n.t.empty.body}</EmptyState>}
      <Suspense fallback={<WorkspaceSkeleton />}>
        {view === 'overview' && filtered.length > 0 && <RegionalOverview data={data} countries={filtered} onCountry={setCountry} />}
        {view === 'country' && <CountryProfile data={data} country={country} setCountry={setCountry} peerMode={peerMode} setPeerMode={setPeerMode} />}
        {view === 'context' && filtered.length > 0 && <ContextPressures data={data} countries={filtered} onCountry={setCountry} />}
        {view === 'about' && <About data={data} />}
        {view === 'methodology' && <Methodology data={data} />}
      </Suspense>
    </Shell>
  </I18nContext.Provider>
}
