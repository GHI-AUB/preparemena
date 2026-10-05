import { Document, Page, StyleSheet, Text, View as PdfView } from '@react-pdf/renderer'
import type { Country, Dataset, Filters } from '../types'
import { capacityCoverage, distribution, formatCompact, hostedPopulation, hostedPopulationShare, median, peerCountries, tiedRanks, trendDelta, yearRange } from '../lib/analytics'
import type { PeerMode } from '../lib/navigation'
import type { View as AppView } from '../components/Shell'
import { contextIndicators, indicatorDefinition } from '../lib/indicators'

type PdfProps = {
  view: AppView
  data: Dataset
  countries: Country[]
  country: Country
  filters: Filters
  peerMode: PeerMode
}

const styles = StyleSheet.create({
  page: { padding: 34, fontFamily: 'Helvetica', color: '#102a43', fontSize: 8.5, lineHeight: 1.35 },
  header: { borderBottomWidth: 2, borderBottomColor: '#102a43', paddingBottom: 12, marginBottom: 18, flexDirection: 'row', justifyContent: 'space-between', gap: 18 },
  brand: { fontSize: 24, fontFamily: 'Helvetica-Bold', letterSpacing: .3 },
  host: { color: '#486581', marginTop: 4, maxWidth: 310 },
  meta: { textAlign: 'right', color: '#486581' },
  metaTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#102a43', marginBottom: 3 },
  h1: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 12 },
  h2: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', marginBottom: 7 },
  p: { color: '#486581', marginBottom: 7 },
  grid4: { flexDirection: 'row', gap: 7, marginBottom: 12 },
  metric: { flexGrow: 1, flexBasis: 0, borderTopWidth: 3, borderTopColor: '#087e8b', backgroundColor: '#f4f8fb', padding: 9, minHeight: 64 },
  metricLabel: { color: '#627d98', fontSize: 7.5, marginBottom: 4 },
  metricValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  metricDetail: { color: '#486581', fontSize: 7.2 },
  twoCol: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  card: { borderWidth: 1, borderColor: '#d9e2ec', padding: 10, marginBottom: 10, borderRadius: 3 },
  half: { flexGrow: 1, flexBasis: 0 },
  table: { width: '100%' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e8eef4' },
  th: { backgroundColor: '#f0f4f8', color: '#334e68', fontFamily: 'Helvetica-Bold' },
  cell: { paddingVertical: 4, paddingHorizontal: 4, flexGrow: 1, flexBasis: 0 },
  cellStrong: { paddingVertical: 4, paddingHorizontal: 4, flexGrow: 1.5, flexBasis: 0, fontFamily: 'Helvetica-Bold' },
  agendaItem: { flexDirection: 'row', gap: 8, paddingBottom: 8, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e8eef4' },
  agendaNumber: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#102a43', color: '#fff', textAlign: 'center', paddingTop: 4, fontFamily: 'Helvetica-Bold' },
  agendaText: { flexGrow: 1, flexBasis: 0 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  barLabel: { width: 86, fontFamily: 'Helvetica-Bold' },
  barTrack: { flexGrow: 1, height: 7, backgroundColor: '#e8eef4' },
  barFill: { height: 7, backgroundColor: '#087e8b' },
  barValue: { width: 58, color: '#486581' },
  footer: { position: 'absolute', left: 34, right: 34, bottom: 20, borderTopWidth: 1, borderTopColor: '#d9e2ec', paddingTop: 6, color: '#627d98', fontSize: 7, flexDirection: 'row', justifyContent: 'space-between' },
})

export function PdfBriefing(props: PdfProps) {
  return <Document title={`PREPARE MENA - ${viewTitle(props.view)}`} author="AUB-GHI EPaPP">
    {props.view === 'overview' && <OverviewPdf {...props} />}
    {props.view === 'context' && <ContextPdf {...props} />}
    {props.view === 'country' && <CountryPdf {...props} />}
    {props.view === 'about' && <AboutPdf {...props} />}
    {props.view === 'methodology' && <MethodologyPdf {...props} />}
  </Document>
}

function PageShell({ title, context, generated, children }: { title: string; context: string; generated: string; children: React.ReactNode }) {
  return <Page size="A4" style={styles.page}>
    <PdfView style={styles.header}>
      <PdfView><Text style={styles.brand}>PREPARE MENA</Text><Text style={styles.host}>Hosted at AUB-GHI under the Epidemic and Pandemic Preparedness Program (EPaPP)</Text></PdfView>
      <PdfView style={styles.meta}><Text style={styles.metaTitle}>{title}</Text><Text>{context}</Text><Text>Data refreshed {formatDate(generated)}</Text><Text>Brief generated {formatDate(new Date().toISOString())}</Text></PdfView>
    </PdfView>
    {children}
    <PdfView fixed style={styles.footer}><Text>AUB-GHI EPaPP · WHO SPAR is self-reported · validate findings nationally</Text><Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} /></PdfView>
  </Page>
}

function OverviewPdf({ data, countries, filters }: PdfProps) {
  const context = filterLabel(filters)
  const scored = countries.filter(country => country.ihr_composite != null)
  const ranks = tiedRanks(scored)
  const ranking = [...scored].sort((a, b) => (a.ihr_composite ?? 999) - (b.ihr_composite ?? 999))
  const capacityRows = capacityDistributions(data, countries)
  const agenda = capacityRows.slice(0, 3)
  return <>
    <PageShell title="Regional overview" context={context} generated={data.meta.generated}>
      <Text style={styles.h1}>Regional overview</Text>
      <MetricGrid items={[
        ['Regional median', `${num(median(scored.map(c => c.ihr_composite)))}/100`, `${scored.length} reporting countries`],
        ['Below 60', String(scored.filter(c => (c.ihr_composite ?? 100) < 60).length), 'reported SPAR composite'],
        ['Conflict-affected', String(countries.filter(c => c.conflict).length), data.meta.fcs_note],
        ['Displaced people present', formatCompact(countries.reduce((sum, c) => sum + hostedPopulation(c), 0)), `UNHCR ${data.meta.displacement_year ?? 'year unavailable'}`],
      ]} />
      <PdfView style={styles.twoCol}>
        <PdfView style={[styles.card, styles.half]}><Text style={styles.h2}>Country priority view</Text><Text style={styles.p}>Lowest reported scores first; ties share rank.</Text><RankTable countries={ranking.slice(0, 10)} ranks={ranks} /></PdfView>
        <PdfView style={[styles.card, styles.half]}><Text style={styles.h2}>Regional action agenda</Text>{agenda.map((row, index) => <AgendaItem key={row.capacity} index={index} title={row.capacity} detail={`${row.stats.median.toFixed(1)}/100 median · ${row.below}/${row.stats.count} below 60 · ${row.years}`} />)}</PdfView>
      </PdfView>
      <PdfView style={styles.card}><Text style={styles.h2}>Regional capacity blind spots</Text><CapacityTable rows={capacityRows.slice(0, 8)} total={countries.length} /></PdfView>
    </PageShell>
    <PageShell title="Capacity appendix" context={context} generated={data.meta.generated}>
      <Text style={styles.h1}>Capacity appendix</Text>
      <PdfView style={styles.card}><Text style={styles.h2}>All reported capacity domains</Text><CapacityTable rows={capacityRows} total={countries.length} /></PdfView>
    </PageShell>
  </>
}

function ContextPdf({ data, countries, filters }: PdfProps) {
  const scored = countries.filter(country => country.ihr_composite != null)
  const displacement = scored.map(country => ({ country, hosted: hostedPopulation(country), share: hostedPopulationShare(country) })).filter(row => row.hosted > 0 || row.share != null).sort((a, b) => b.hosted - a.hosted)
  const sanitation = scored.flatMap(country => country.context?.sanitation ? [{ country, value: country.context.sanitation.value, year: country.context.sanitation.year }] : []).sort((a, b) => a.value - b.value)
  const spending = scored.flatMap(country => country.context?.health_exp_pc ? [{ country, value: country.context.health_exp_pc.value, year: country.context.health_exp_pc.year }] : []).sort((a, b) => a.value - b.value)
  return <>
    <PageShell title="Context & Pressures" context={filterLabel(filters)} generated={data.meta.generated}>
      <Text style={styles.h1}>Context & Pressures</Text>
      <PdfView style={styles.twoCol}>
        <PdfView style={[styles.card, styles.half]}><Text style={styles.h2}>Conflict-affected and other settings</Text><MiniStats rows={[
          ['Conflict-affected', median(scored.filter(c => c.conflict).map(c => c.ihr_composite)), `${scored.filter(c => c.conflict).length} countries`],
          ['Other settings', median(scored.filter(c => !c.conflict).map(c => c.ihr_composite)), `${scored.filter(c => !c.conflict).length} countries`],
        ]} /></PdfView>
        <PdfView style={[styles.card, styles.half]}><Text style={styles.h2}>Displacement pressure and preparedness</Text><Table headers={['Country', 'People', '% pop.', 'SPAR']} rows={displacement.slice(0, 10).map(row => [row.country.name, row.hosted.toLocaleString(), row.share == null ? '-' : `${row.share.toFixed(1)}%`, `${row.country.ihr_composite}/100`])} /></PdfView>
      </PdfView>
      <PdfView style={styles.twoCol}>
        <PdfView style={[styles.card, styles.half]}><Text style={styles.h2}>Safely managed sanitation</Text><Text style={styles.p}>{indicatorDefinition('sanitation', data.meta.indicator_definitions)?.direction}</Text><Table headers={['Country', 'Sanitation', 'Year', 'SPAR']} rows={sanitation.slice(0, 10).map(row => [row.country.name, `${row.value}%`, row.year, `${row.country.ihr_composite}/100`])} /></PdfView>
        <PdfView style={[styles.card, styles.half]}><Text style={styles.h2}>Preparedness relative to health spending</Text><Text style={styles.p}>Descriptive only; not an efficiency measure.</Text><Table headers={['Country', 'US$/person', 'Year', 'SPAR']} rows={spending.slice(0, 10).map(row => [row.country.name, `$${Math.round(row.value).toLocaleString()}`, row.year, `${row.country.ihr_composite}/100`])} /></PdfView>
      </PdfView>
    </PageShell>
    <PageShell title="Income and preparedness" context={filterLabel(filters)} generated={data.meta.generated}>
      <Text style={styles.h1}>Income and preparedness</Text>
      <PdfView style={styles.card}><MiniStats rows={['Low income', 'Lower middle income', 'Upper middle income', 'High income'].map(label => {
        const rows = scored.filter(country => country.income === label)
        return [label, median(rows.map(country => country.ihr_composite)), `${rows.length} countries`] as [string, number | null, string]
      })} /></PdfView>
    </PageShell>
  </>
}

function CountryPdf({ data, country, peerMode }: PdfProps) {
  const ranks = tiedRanks(data.countries)
  const delta = trendDelta(country)
  const capacityRows = data.meta.capacity_order.map(name => {
    const regional = median(data.countries.map(item => item.capacities?.[name]))
    const value = country.capacities?.[name] ?? null
    return { name, value, regional, gap: value != null && regional != null ? value - regional : null, year: country.capacity_years?.[name] ?? null }
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
    <PageShell title="Country Profile " context={country.name} generated={data.meta.generated}>
      <Text style={styles.h1}>{country.name}</Text>
      <MetricGrid items={[
        ['Latest SPAR composite', country.ihr_composite == null ? '-' : `${country.ihr_composite}/100`, country.ihr_year ? `Reported ${country.ihr_year}` : 'Year unavailable'],
        ['Regional rank', `${ranks.get(country.iso3) ?? '-'} / ${data.countries.filter(c => c.ihr_composite != null).length}`, 'ties share rank'],
        ['Trajectory', delta == null ? '-' : `${delta > 0 ? '+' : ''}${delta.toFixed(0)} points`, country.ihr_trend.length ? `${country.ihr_trend[0].year}-${country.ihr_trend.at(-1)!.year}` : 'insufficient observations'],
        ['Capacity coverage', `${capacityCoverage(country, data.meta.capacity_order)} / ${data.meta.capacity_order.length}`, 'available SPAR domains'],
      ]} />
      <PdfView style={styles.twoCol}>
        <PdfView style={[styles.card, styles.half]}><Text style={styles.h2}>Capacity profile versus region</Text>{available.length ? <Table headers={['Domain', 'Country', 'Year', 'Regional']} rows={available.map(row => [row.name, `${row.value}/100`, row.year ?? '-', `${row.regional?.toFixed(1)}/100`])} /> : <Text style={styles.p}>No detailed capacity observations are available. Missing values are not shown as zero.</Text>}</PdfView>
        <PdfView style={[styles.card, styles.half]}><Text style={styles.h2}>Capacity gaps</Text>{available.length ? <Bars rows={[...available].sort((a, b) => (a.gap ?? 0) - (b.gap ?? 0)).slice(0, 10).map(row => [row.name, Math.abs(row.gap ?? 0), `${(row.gap ?? 0) > 0 ? '+' : ''}${row.gap?.toFixed(1)} points`])} max={50} /> : <Text style={styles.p}>No gap calculation is shown because detailed capacity data are unavailable.</Text>}</PdfView>
      </PdfView>
    </PageShell>
    <PageShell title="Country Profile " context={country.name} generated={data.meta.generated}>
      <Text style={styles.h1}>Trend, peers and health-system context</Text>
      <PdfView style={styles.twoCol}>
        <PdfView style={[styles.card, styles.half]}><Text style={styles.h2}>SPAR trend over time</Text><Bars rows={country.ihr_trend.map(point => [String(point.year), point.value, `${point.value}/100`])} /></PdfView>
        <PdfView style={[styles.card, styles.half]}><Text style={styles.h2}>Peer comparison</Text><Text style={styles.p}>{peers.label}{peers.fallback ? ' · fallback applied' : ''}</Text><RankTable countries={[...peers.countries].sort((a, b) => (a.ihr_composite ?? 999) - (b.ihr_composite ?? 999)).slice(0, 10)} ranks={peerRanks} /></PdfView>
      </PdfView>
      <PdfView style={styles.card}><Text style={styles.h2}>Health-system context versus regional median</Text><Table headers={['Indicator', country.name, 'Year', 'Regional median']} rows={contextRows.slice(0, 12)} /></PdfView>
    </PageShell>
  </>
}

function AboutPdf({ data }: PdfProps) {
  return <PageShell title="About" context={`${data.countries.length}-country scope`} generated={data.meta.generated}>
    <Text style={styles.h1}>About PREPARE MENA</Text>
    <PdfView style={styles.card}><Text style={styles.h2}>Host institution and programme</Text><Text style={styles.p}>PREPARE MENA is hosted and stewarded by the American University of Beirut Global Health Institute (AUB-GHI), specifically within the Epidemic and Pandemic Preparedness Program (EPaPP).</Text></PdfView>
    <PdfView style={styles.card}><Text style={styles.h2}>Purpose</Text><Text style={styles.p}>Evidence for country-owned epidemic and pandemic preparedness decisions. The product supports strategic review; it is not an outbreak alert, early-warning, operational command, or real-time surveillance system.</Text></PdfView>
    <PdfView style={styles.card}><Text style={styles.h2}>Scope</Text><Text style={styles.p}>{data.countries.length}-country MENA analytical scope. Designations do not express a position on legal status or borders.</Text></PdfView>
  </PageShell>
}

function MethodologyPdf({ data }: PdfProps) {
  const refresh = Object.entries(data.meta.source_refresh ?? {})
  return <PageShell title="Methodology & Data quality" context={`${data.countries.length}-country scope`} generated={data.meta.generated}>
    <Text style={styles.h1}>Methodology & Data quality</Text>
    <PdfView style={styles.card}><Text style={styles.h2}>Calculation rules</Text><Text style={styles.p}>Missing and non-finite values are excluded, never converted to zero. Medians and quartiles use valid observations only. Ranks are competition ranks; ties share rank. Contextual relationships are descriptive and do not establish causality.</Text></PdfView>
    <PdfView style={styles.card}><Text style={styles.h2}>Source registry</Text><Table headers={['Source', 'Status', 'Reference year', 'Coverage']} rows={refresh.map(([key, source]) => [sourceName(key), source.status, source.reference_year ?? '-', `${source.coverage}/${data.countries.length}`])} /></PdfView>
    <PdfView style={styles.card}><Text style={styles.h2}>Core limitations</Text><Text style={styles.p}>WHO SPAR is a State Party self-assessment, not an independent performance audit. Indicators use mixed reference years. {data.meta.fcs_note} is static and versioned. Occupied Palestinian territory has a 2025 SPAR composite but no queried detailed-capacity domain observations.</Text></PdfView>
  </PageShell>
}

function MetricGrid({ items }: { items: Array<[string, string, string]> }) {
  return <PdfView style={styles.grid4}>{items.map(([label, value, detail]) => <PdfView key={label} style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricDetail}>{detail}</Text></PdfView>)}</PdfView>
}

function RankTable({ countries, ranks }: { countries: Country[]; ranks: Map<string, number> }) {
  return <Table headers={['Rank', 'Country', 'Score', 'Year']} rows={countries.map(country => [ranks.get(country.iso3) ?? '-', country.name, country.ihr_composite == null ? '-' : `${country.ihr_composite}/100`, country.ihr_year ?? '-'])} />
}

function CapacityTable({ rows, total }: { rows: ReturnType<typeof capacityDistributions>; total: number }) {
  return <Table headers={['Capacity domain', 'Median', 'IQR', 'Range', 'Years', 'Coverage', 'Below 60']} rows={rows.map(row => [row.capacity, `${row.stats.median.toFixed(1)}/100`, `${row.stats.q1.toFixed(1)}-${row.stats.q3.toFixed(1)}`, `${row.stats.min.toFixed(1)}-${row.stats.max.toFixed(1)}`, row.years, `${row.stats.count}/${total}`, row.below])} />
}

function Table({ headers, rows }: { headers: string[]; rows: Array<Array<string | number | null | undefined>> }) {
  return <PdfView style={styles.table}>
    <PdfView style={[styles.tr, styles.th]}>{headers.map((header, index) => <Text key={header} style={index === 0 ? styles.cellStrong : styles.cell}>{header}</Text>)}</PdfView>
    {rows.map((row, rowIndex) => <PdfView key={rowIndex} style={styles.tr}>{row.map((cell, index) => <Text key={index} style={index === 0 ? styles.cellStrong : styles.cell}>{cell ?? '-'}</Text>)}</PdfView>)}
  </PdfView>
}

function AgendaItem({ index, title, detail }: { index: number; title: string; detail: string }) {
  return <PdfView style={styles.agendaItem}><Text style={styles.agendaNumber}>{index + 1}</Text><PdfView style={styles.agendaText}><Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>{title}</Text><Text style={styles.p}>{detail}</Text><Text style={{ color: '#627d98', fontSize: 7.5 }}>Signal for joint review, not a prescription.</Text></PdfView></PdfView>
}

function Bars({ rows, max = 100 }: { rows: Array<[string, number, string]>; max?: number }) {
  const actualMax = Math.max(max, ...rows.map(([, value]) => value))
  return <PdfView>{rows.map(([label, value, detail]) => <PdfView key={label} style={styles.barRow}><Text style={styles.barLabel}>{label}</Text><PdfView style={styles.barTrack}><PdfView style={[styles.barFill, { width: `${Math.max(2, Math.min(100, value / actualMax * 100))}%` }]} /></PdfView><Text style={styles.barValue}>{detail}</Text></PdfView>)}</PdfView>
}

function MiniStats({ rows }: { rows: Array<[string, number | null, string]> }) {
  return <PdfView>{rows.map(([label, value, detail]) => <PdfView key={label} style={[styles.tr, { paddingVertical: 5 }]}><Text style={styles.cellStrong}>{label}</Text><Text style={styles.cell}>{value == null ? '-' : `${value.toFixed(1)}/100`}</Text><Text style={styles.cell}>{detail}</Text></PdfView>)}</PdfView>
}

function capacityDistributions(data: Dataset, countries: Country[]) {
  return data.meta.capacity_order.flatMap(capacity => {
    const values = countries.map(country => country.capacities?.[capacity]).filter((value): value is number => Number.isFinite(value))
    const stats = distribution(values)
    return stats ? [{ capacity, stats, years: yearRange(countries.map(country => country.capacity_years?.[capacity])), below: values.filter(value => value < 60).length }] : []
  }).sort((a, b) => a.stats.median - b.stats.median)
}

export function pdfFilename(view: AppView, country: Country, date = new Date()) {
  const suffix = view === 'country' ? country.iso3.toLowerCase() : view
  return `prepare-mena-${suffix}-${date.toISOString().slice(0, 10)}.pdf`
}

function filterLabel(filters: Filters) {
  if (filters.income === 'all' && filters.conflict === 'all') return 'All 21 countries'
  return [filters.income !== 'all' ? filters.income : null, filters.conflict === 'conflict' ? 'Conflict-affected' : filters.conflict === 'stable' ? 'Other settings' : null].filter(Boolean).join(' · ')
}

function formatDate(value: string) { return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
function num(value: number | null) { return value == null ? '-' : value.toFixed(0) }
function formatNumber(value: number) { return new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value) }
function viewTitle(view: AppView) { return ({ overview: 'Regional overview', context: 'Context & Pressures', country: 'Country Profile ', about: 'About', methodology: 'Methodology & Data quality' } as Record<AppView, string>)[view] }
function sourceName(key: string) { return ({ who_composite: 'WHO SPAR composite', who_capacities: 'WHO SPAR capacities', world_bank: 'World Bank indicators', unhcr: 'UNHCR displacement', conflict_classification: 'Conflict classification' } as Record<string, string>)[key] ?? key }
