import type { Country, Dataset, Filters } from '../types'
import { capacityCoverage, distribution, formatCompact, hostedPopulation, hostedPopulationShare, median, peerCountries, tiedRanks, trendDelta, yearRange } from '../lib/analytics'
import type { PeerMode } from '../lib/navigation'
import type { View } from '../components/Shell'
import { contextIndicators, indicatorDefinition } from '../lib/indicators'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { PdfBriefing, pdfFilename } from './PdfBriefing'
import type { ReactNode } from 'react'

type Props = {
  view: View
  data: Dataset
  countries: Country[]
  country: Country
  filters: Filters
  peerMode: PeerMode
  onClose: () => void
  renderActions?: ReactNode
}

export function BriefingView({ view, data, countries, country, filters, peerMode, onClose, renderActions }: Props) {
  const title = viewTitle(view)
  const filterLabel = filters.income === 'all' && filters.conflict === 'all'
    ? 'All 21 countries'
    : [filters.income !== 'all' ? filters.income : null, filters.conflict === 'conflict' ? 'Conflict-affected' : filters.conflict === 'stable' ? 'Other settings' : null].filter(Boolean).join(' · ')
  return <div className="briefing-overlay" role="dialog" aria-modal="true" aria-label={`${title} briefing`}>
    <div className="briefing-toolbar">
      <div><b>Briefing preview</b><span>{title} · {view === 'country' ? country.name : filterLabel}</span></div>
      <div>{renderActions ?? <PDFDownloadLink className="primary-button" document={<PdfBriefing view={view} data={data} countries={countries} country={country} filters={filters} peerMode={peerMode} />} fileName={pdfFilename(view, country)}>{({ loading }) => loading ? 'Preparing PDF' : 'Export PDF'}</PDFDownloadLink>}<button onClick={onClose}>Close</button></div>
    </div>
    <article className="briefing-document">
      <BriefingHeader title={title} generated={data.meta.generated} context={view === 'country' ? country.name : filterLabel} />
      {view === 'overview' && <OverviewBrief data={data} countries={countries} />}
      {view === 'context' && <ContextBrief data={data} countries={countries} />}
      {view === 'country' && <CountryBrief data={data} country={country} peerMode={peerMode} />}
      {view === 'about' && <AboutBrief data={data} />}
      {view === 'methodology' && <MethodologyBrief data={data} />}
      <footer className="briefing-footnote">AUB-GHI EPaPP · WHO SPAR is self-reported · mixed reference years are shown where available · validate findings through national processes.</footer>
    </article>
  </div>
}

function BriefingHeader({ title, generated, context }: { title: string; generated: string; context: string }) {
  return <header className="briefing-title">
    <div><strong>PREPARE MENA</strong><span>Hosted at AUB-GHI under the Epidemic and Pandemic Preparedness Program (EPaPP)</span></div>
    <div><b>{title}</b><span>{context}</span><span>Data refreshed {formatDate(generated)}</span><span>Brief generated {formatDate(new Date().toISOString())}</span></div>
  </header>
}

function OverviewBrief({ data, countries }: { data: Dataset; countries: Country[] }) {
  const scored = countries.filter(country => country.ihr_composite != null)
  const ranks = tiedRanks(scored)
  const ranking = [...scored].sort((a, b) => (a.ihr_composite ?? 999) - (b.ihr_composite ?? 999))
  const capacityRows = capacityDistributions(data, countries)
  const agenda = capacityRows.slice(0, 3)
  return <>
    <section className="briefing-page">
      <h1>Regional overview</h1>
      <MetricGrid items={[
        ['Regional median', `${fmt(median(scored.map(c => c.ihr_composite)))}/100`, `${scored.length} reporting countries`],
        ['Below 60', String(scored.filter(c => (c.ihr_composite ?? 100) < 60).length), 'reported SPAR composite'],
        ['Conflict-affected', String(countries.filter(c => c.conflict).length), data.meta.fcs_note],
        ['Displaced people present', formatCompact(countries.reduce((sum, c) => sum + hostedPopulation(c), 0)), `UNHCR ${data.meta.displacement_year ?? 'year unavailable'}`],
      ]} />
      <div className="briefing-two">
        <section className="briefing-card"><h2>Country priority view</h2><p>Lowest reported scores first; ties share rank.</p><RankTable countries={ranking.slice(0, 10)} ranks={ranks} /></section>
        <section className="briefing-card"><h2>Regional action agenda</h2><div className="briefing-agenda compact">{agenda.map((row, index) => <article key={row.capacity}><span>{index + 1}</span><div><b>{row.capacity}</b><p>{row.stats.median.toFixed(1)}/100 median · {row.below}/{row.stats.count} below 60 · {row.years}</p><small>Signal for joint review, not a prescription.</small></div></article>)}</div></section>
      </div>
      <section className="briefing-card"><h2>Regional capacity blind spots</h2><CapacityBriefTable rows={capacityRows.slice(0, 8)} total={countries.length} /></section>
    </section>
    <section className="briefing-page">
      <h1>Capacity appendix</h1>
      <section className="briefing-card"><h2>All reported capacity domains</h2><CapacityBriefTable rows={capacityRows} total={countries.length} /></section>
    </section>
  </>
}

function ContextBrief({ data, countries }: { data: Dataset; countries: Country[] }) {
  const scored = countries.filter(country => country.ihr_composite != null)
  const conflictGroups = [
    ['Conflict-affected', scored.filter(c => c.conflict)],
    ['Other settings', scored.filter(c => !c.conflict)],
  ] as const
  const sanitation = scored.flatMap(country => country.context?.sanitation ? [{ country, value: country.context.sanitation.value, year: country.context.sanitation.year }] : [])
  const spending = scored.flatMap(country => country.context?.health_exp_pc ? [{ country, value: country.context.health_exp_pc.value, year: country.context.health_exp_pc.year }] : [])
  const displacement = scored.map(country => ({ country, hosted: hostedPopulation(country), share: hostedPopulationShare(country) })).filter(row => row.hosted > 0 || row.share != null)
  return <>
    <section className="briefing-page">
      <h1>Context & pressures</h1>
      <div className="briefing-two">
        <section className="briefing-card"><h2>Conflict-affected and other settings</h2><p>{data.meta.fcs_note}. Descriptive distribution only.</p><MiniStats rows={conflictGroups.map(([label, rows]) => ({ label, value: median(rows.map(c => c.ihr_composite)), detail: `${rows.length} countries` }))} /></section>
        <section className="briefing-card"><h2>Displacement pressure and preparedness</h2><p>Reported displaced people present, UNHCR {data.meta.displacement_year ?? 'year unavailable'}.</p><BriefingTable headers={['Country', 'People present', '% population', 'SPAR']} rows={displacement.sort((a, b) => b.hosted - a.hosted).slice(0, 10).map(row => [row.country.name, row.hosted.toLocaleString(), row.share == null ? '—' : `${row.share.toFixed(1)}%`, `${row.country.ihr_composite}/100`])} /></section>
      </div>
      <div className="briefing-two">
        <section className="briefing-card"><h2>Safely managed sanitation and preparedness</h2><p>{indicatorDefinition('sanitation', data.meta.indicator_definitions)?.direction}</p><BriefingTable headers={['Country', 'Sanitation', 'Year', 'SPAR']} rows={sanitation.sort((a, b) => a.value - b.value).slice(0, 10).map(row => [row.country.name, `${row.value}%`, row.year, `${row.country.ihr_composite}/100`])} /></section>
        <section className="briefing-card"><h2>Preparedness relative to reported health spending</h2><p>Reported spending is shown descriptively and is not an efficiency measure.</p><BriefingTable headers={['Country', 'US$ per person', 'Year', 'SPAR']} rows={spending.sort((a, b) => a.value - b.value).slice(0, 10).map(row => [row.country.name, `$${Math.round(row.value).toLocaleString()}`, row.year, `${row.country.ihr_composite}/100`])} /></section>
      </div>
    </section>
    <section className="briefing-page">
      <h1>Income and preparedness</h1>
      <section className="briefing-card"><h2>World Bank income group</h2><MiniStats rows={['Low income', 'Lower middle income', 'Upper middle income', 'High income'].map(label => {
        const rows = scored.filter(country => country.income === label)
        return { label, value: median(rows.map(country => country.ihr_composite)), detail: `${rows.length} countries` }
      })} /></section>
    </section>
  </>
}

function CountryBrief({ data, country, peerMode }: { data: Dataset; country: Country; peerMode: PeerMode }) {
  const ranks = tiedRanks(data.countries)
  const delta = trendDelta(country)
  const capacityRows = data.meta.capacity_order.map(name => {
    const regional = median(data.countries.map(item => item.capacities?.[name]))
    const value = country.capacities?.[name] ?? null
    return { name, value, regional, gap: value != null && regional != null ? value - regional : null, year: country.capacity_years?.[name] ?? null, years: yearRange(data.countries.map(item => item.capacity_years?.[name])) }
  })
  const available = capacityRows.filter(row => row.value != null && row.regional != null)
  const peers = peerCountries(data.countries, country, peerMode)
  const peerRanks = tiedRanks(peers.countries)
  const contextRows = contextIndicators.flatMap(def => {
    const obs = country.context?.[def.key]
    const regional = data.meta.context_median?.[def.key] ?? median(data.countries.map(item => item.context?.[def.key]?.value))
    return obs && regional != null ? [[def.label, `${formatNumber(obs.value)} ${def.unit}`, String(obs.year), `${formatNumber(regional)} ${def.unit}`]] : []
  })
  return <>
    <section className="briefing-page">
      <h1>{country.name}</h1>
      <MetricGrid items={[
        ['Latest SPAR composite', country.ihr_composite == null ? '—' : `${country.ihr_composite}/100`, country.ihr_year ? `Reported ${country.ihr_year}` : 'Year unavailable'],
        ['Regional rank', `${ranks.get(country.iso3) ?? '—'} / ${data.countries.filter(c => c.ihr_composite != null).length}`, 'ties share rank'],
        ['Trajectory', delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(0)} points`, country.ihr_trend.length ? `${country.ihr_trend[0].year}–${country.ihr_trend.at(-1)!.year}` : 'insufficient observations'],
        ['Capacity coverage', `${capacityCoverage(country, data.meta.capacity_order)} / ${data.meta.capacity_order.length}`, 'available SPAR domains'],
      ]} />
      <div className="briefing-two">
        <section className="briefing-card"><h2>Capacity profile versus region</h2>{available.length ? <BriefingTable headers={['Domain', 'Country', 'Year', 'Regional median']} rows={available.map(row => [row.name, `${row.value}/100`, row.year ?? '—', `${row.regional?.toFixed(1)}/100`])} /> : <p>No detailed capacity observations are available. Missing values are not shown as zero.</p>}</section>
        <section className="briefing-card"><h2>Capacity gaps</h2>{available.length ? <Bars rows={[...available].sort((a, b) => (a.gap ?? 0) - (b.gap ?? 0)).slice(0, 10).map(row => [row.name, Math.abs(row.gap ?? 0), `${(row.gap ?? 0) > 0 ? '+' : ''}${row.gap?.toFixed(1)} SPAR points`])} max={50} /> : <p>No gap calculation is shown because detailed capacity data are unavailable.</p>}</section>
      </div>
    </section>
    <section className="briefing-page">
      <h1>Trend, peers and health-system context</h1>
      <div className="briefing-two">
        <section className="briefing-card"><h2>SPAR trend over time</h2><Bars rows={country.ihr_trend.map(point => [String(point.year), point.value, `${point.value}/100`])} /></section>
        <section className="briefing-card"><h2>Peer comparison</h2><p>{peers.label}{peers.fallback ? ' · fallback applied' : ''}</p><RankTable countries={[...peers.countries].sort((a, b) => (a.ihr_composite ?? 999) - (b.ihr_composite ?? 999)).slice(0, 12)} ranks={peerRanks} /></section>
      </div>
      <section className="briefing-card"><h2>Health-system context versus regional median</h2><BriefingTable headers={['Indicator', country.name, 'Year', 'Regional median']} rows={contextRows.slice(0, 12)} /></section>
    </section>
  </>
}

function AboutBrief({ data }: { data: Dataset }) {
  return <section className="briefing-page">
    <h1>About PREPARE MENA</h1>
    <section className="briefing-card"><h2>Host institution and programme</h2><p>PREPARE MENA is hosted and stewarded by the American University of Beirut Global Health Institute (AUB-GHI), specifically within the Epidemic and Pandemic Preparedness Program (EPaPP).</p></section>
    <section className="briefing-card"><h2>Purpose</h2><p>Evidence for country-owned epidemic and pandemic preparedness decisions. The product supports strategic review; it is not an outbreak alert, early-warning, operational command, or real-time surveillance system.</p></section>
    <section className="briefing-card"><h2>Scope</h2><p>{data.countries.length}-country MENA analytical scope. Designations do not express a position on legal status or borders.</p></section>
  </section>
}

function MethodologyBrief({ data }: { data: Dataset }) {
  const refresh = Object.entries(data.meta.source_refresh ?? {})
  return <section className="briefing-page">
    <h1>Methodology & data quality</h1>
    <section className="briefing-card"><h2>Calculation rules</h2><ul><li>Missing and non-finite values are excluded, never converted to zero.</li><li>Medians and quartiles use valid observations only.</li><li>Ranks are competition ranks; ties share rank.</li><li>Contextual relationships are descriptive and do not establish causality.</li></ul></section>
    <section className="briefing-card"><h2>Source registry</h2><BriefingTable headers={['Source', 'Status', 'Reference year', 'Coverage']} rows={refresh.map(([key, source]) => [sourceName(key), source.status, source.reference_year ?? '—', `${source.coverage}/${data.countries.length}`])} /></section>
    <section className="briefing-card"><h2>Core limitations</h2><ul><li>WHO SPAR is a State Party self-assessment, not an independent performance audit.</li><li>Indicators use mixed reference years.</li><li>{data.meta.fcs_note} is static and versioned.</li><li>occupied Palestinian territory has a 2025 SPAR composite but no queried detailed-capacity domain observations.</li></ul></section>
  </section>
}

function MetricGrid({ items }: { items: Array<[string, string, string]> }) {
  return <div className="briefing-metrics">{items.map(([label, value, detail]) => <div key={label}><span>{label}</span><b>{value}</b><small>{detail}</small></div>)}</div>
}

function RankTable({ countries, ranks }: { countries: Country[]; ranks: Map<string, number> }) {
  return <BriefingTable headers={['Rank', 'Country', 'Score', 'Year']} rows={countries.map(country => [ranks.get(country.iso3) ?? '—', country.name, country.ihr_composite == null ? '—' : `${country.ihr_composite}/100`, country.ihr_year ?? '—'])} />
}

function Bars({ rows, max = 100 }: { rows: Array<[string, number, string]>; max?: number }) {
  const actualMax = Math.max(max, ...rows.map(([, value]) => value))
  return <div className="briefing-bars">{rows.map(([label, value, detail]) => <div key={label}><span>{label}</span><i><b style={{ width: `${Math.max(2, Math.min(100, value / actualMax * 100))}%` }} /></i><em>{detail}</em></div>)}</div>
}

function MiniStats({ rows }: { rows: Array<{ label: string; value: number | null; detail: string }> }) {
  return <div className="briefing-mini-stats">{rows.map(row => <div key={row.label}><b>{row.label}</b><span>{row.value == null ? '—' : `${row.value.toFixed(1)}/100`}</span><small>{row.detail}</small></div>)}</div>
}

function BriefingTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number | null | undefined>> }) {
  return <table className="briefing-table"><thead><tr>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex}>{cell ?? '—'}</th> : <td key={cellIndex}>{cell ?? '—'}</td>)}</tr>)}</tbody></table>
}

function CapacityBriefTable({ rows, total }: { rows: ReturnType<typeof capacityDistributions>; total: number }) {
  return <BriefingTable headers={['Capacity domain', 'Median', 'IQR', 'Range', 'Years', 'Coverage', 'Below 60']} rows={rows.map(row => [row.capacity, `${row.stats.median.toFixed(1)}/100`, `${row.stats.q1.toFixed(1)}–${row.stats.q3.toFixed(1)}`, `${row.stats.min.toFixed(1)}–${row.stats.max.toFixed(1)}`, row.years, `${row.stats.count}/${total}`, row.below])} />
}

function capacityDistributions(data: Dataset, countries: Country[]) {
  return data.meta.capacity_order.flatMap(capacity => {
    const values = countries.map(country => country.capacities?.[capacity]).filter((value): value is number => Number.isFinite(value))
    const stats = distribution(values)
    return stats ? [{ capacity, stats, years: yearRange(countries.map(country => country.capacity_years?.[capacity])), below: values.filter(value => value < 60).length }] : []
  }).sort((a, b) => a.stats.median - b.stats.median)
}

function formatDate(value: string) { return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
function fmt(value: number | null) { return value == null ? '—' : value.toFixed(0) }
function formatNumber(value: number) { return new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value) }
function viewTitle(view: View) { return ({ overview: 'Regional overview', context: 'Context & pressures', country: 'Country profile', about: 'About', methodology: 'Methodology & data quality' } as Record<View, string>)[view] }
function sourceName(key: string) { return ({ who_composite: 'WHO SPAR composite', who_capacities: 'WHO SPAR capacities', world_bank: 'World Bank indicators', unhcr: 'UNHCR displacement', conflict_classification: 'Conflict classification' } as Record<string, string>)[key] ?? key }
