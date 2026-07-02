import { useEffect, useMemo, useState } from 'react'
import * as echarts from 'echarts/core'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { Country, Dataset } from '../types'
import { distribution, median, tiedRanks, trendDelta, hostedPopulation, formatCompact, yearRange } from '../lib/analytics'
import { Chart } from '../components/Chart'
import { Coverage } from '../components/Shell'
import { chartAxisTitles } from '../lib/chartLabels'
import type { CsvRow } from '../lib/downloads'
import { CsvLink } from '../components/ExportLink'

const axis = { axisLine: { lineStyle: { color: '#bcccdc' } }, axisLabel: { color: '#627d98', fontSize: 11 }, splitLine: { lineStyle: { color: '#e8eef4' } } }
const color = (score: number | null) => score == null ? '#bcccdc' : score < 50 ? '#c65d4b' : score < 70 ? '#d89b19' : score < 85 ? '#087e8b' : '#2f6b9a'

type Props = { data: Dataset; countries: Country[]; onCountry: (iso3: string) => void }

export function SituationRoom({ data, countries, onCountry }: Props) {
  const [mapReady, setMapReady] = useState(false)
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}mena.geo.json`).then(r => r.json()).then(geo => {
      echarts.registerMap('MENA', geo)
      setMapReady(true)
    }).catch(() => setMapReady(false))
  }, [])
  const ranks = useMemo(() => tiedRanks(countries), [countries])
  const scored = countries.filter(c => c.ihr_composite != null)
  const regional = median(scored.map(c => c.ihr_composite))
  const below60 = scored.filter(c => c.ihr_composite! < 60).length
  const conflict = countries.filter(c => c.conflict).length
  const hosted = countries.reduce((sum, c) => sum + hostedPopulation(c), 0)
  const capacities: CapacityDistributionRow[] = data.meta.capacity_order.flatMap(capacity => { const values = countries.map(c => c.capacities?.[capacity]).filter((value): value is number => Number.isFinite(value)); const stats = distribution(values); return stats ? [{ capacity, stats, years: yearRange(countries.map(c => c.capacity_years?.[capacity])), below: values.filter(value => value < 60).length, countries: countries.filter(c => Number.isFinite(c.capacities?.[capacity])).map(c => c.name) }] : [] }).sort((a, b) => a.stats.median - b.stats.median)

  const ranking = [...scored].sort((a, b) => a.ihr_composite! - b.ihr_composite!)
  const mapOption = { tooltip: { trigger: 'item', formatter: (p: any) => p?.data ? `<b>${p.data.name}</b><br/>SPAR composite: ${p.data.value}<br/>Reported ${p.data.year}` : p.name }, visualMap: { min: 30, max: 100, left: 12, bottom: 10, orient: 'horizontal', text: ['Higher', 'Lower'], inRange: { color: ['#c65d4b', '#d89b19', '#087e8b', '#2f6b9a'] }, textStyle: { color: '#627d98' } }, series: [{ type: 'map', map: 'MENA', roam: true, data: scored.map(c => ({ name: c.name, value: c.ihr_composite, year: c.ihr_year, iso3: c.iso3 })), itemStyle: { borderColor: '#fff', borderWidth: 1, areaColor: '#d9e2ec' }, emphasis: { itemStyle: { areaColor: '#174a73' }, label: { show: true } }, select: { itemStyle: { areaColor: '#102a43' } } }] }
  const rankOption = { animationDuration: 450, grid: { left: 122, right: 40, top: 18, bottom: 54 }, tooltip: { trigger: 'item' }, xAxis: { ...axis, max: 100, name: chartAxisTitles.spar, nameLocation: 'middle', nameGap: 34 }, yAxis: { ...axis, type: 'category', name: chartAxisTitles.country, nameLocation: 'middle', nameGap: 106, data: ranking.map(c => c.name), axisLabel: { color: '#334e68', fontSize: 11 } }, series: [{ type: 'bar', barWidth: 11, data: ranking.map(c => ({ value: c.ihr_composite, iso3: c.iso3, itemStyle: { color: color(c.ihr_composite), borderRadius: [0, 2, 2, 0] } })), label: { show: true, position: 'right', color: '#334e68' } }] }
  const capOption = { grid: { left: 190, right: 38, top: 18, bottom: 58 }, tooltip: { trigger: 'item' }, xAxis: { ...axis, min: 0, max: 100, name: chartAxisTitles.capacityScore, nameLocation: 'middle', nameGap: 34 }, yAxis: { ...axis, type: 'category', name: chartAxisTitles.capacityDomain, nameLocation: 'middle', nameGap: 176, data: capacities.map(row => row.capacity), axisLabel: { color: '#334e68', fontSize: 9 } }, series: [{ type: 'boxplot', data: capacities.map(row => [row.stats!.min, row.stats!.q1, row.stats!.median, row.stats!.q3, row.stats!.max]), itemStyle: { color: '#d9edf0', borderColor: '#087e8b' }, tooltip: { formatter: (point: any) => { const row = capacities[point.dataIndex]; return `<b>${row.capacity}</b><br/>Median: ${row.stats!.median.toFixed(1)}/100<br/>IQR: ${row.stats!.q1.toFixed(1)}–${row.stats!.q3.toFixed(1)}<br/>Range: ${row.stats!.min.toFixed(1)}–${row.stats!.max.toFixed(1)}<br/>Years: ${row.years}<br/>Coverage: ${row.stats!.count}/${countries.length}<br/>Below 60: ${row.below}` } } }] }
  const trendYears = Array.from(new Set(countries.flatMap(c => c.ihr_trend.map(t => t.year)))).sort()
  const trendOption = { grid: { left: 60, right: 20, top: 16, bottom: 56 }, tooltip: { trigger: 'axis' }, xAxis: { ...axis, type: 'category', name: chartAxisTitles.referenceYear, nameLocation: 'middle', nameGap: 34, data: trendYears }, yAxis: { ...axis, min: 20, max: 100, name: chartAxisTitles.regionalTrend, nameLocation: 'middle', nameGap: 44 }, series: [{ type: 'line', smooth: true, showSymbol: true, lineStyle: { color: '#087e8b', width: 2 }, itemStyle: { color: '#087e8b' }, data: trendYears.map(year => median(countries.map(c => c.ihr_trend.find(t => t.year === year)?.value))) }] }

  return <>
    <section className="finding-band">
      <div><h1>Regional overview</h1><p>{below60 ? `${below60} of ${scored.length} reporting countries score below 60.` : 'No reporting country scores below 60.'} Use this overview to identify where reported capacity warrants closer country-specific review.</p></div>
      <Metric label="Regional median" value={regional?.toFixed(0) ?? '—'} detail={`SPAR score · ${scored.length} countries`} tone="teal" />
      <Metric label="Below 60" value={`${below60}`} detail={`of ${scored.length} reporting`} tone="coral" />
      <Metric label="Conflict-affected" value={`${conflict}`} detail={`of ${countries.length} selected`} tone="amber" />
      <Metric label="Displaced people present" value={formatCompact(hosted)} detail="hosted refugees/asylum-seekers plus IDPs" tone="blue" />
    </section>
    <div className="situation-grid">
      <section className="panel ranking-panel"><PanelHead title="Preparedness across MENA" subtitle="Latest reported SPAR composite; select a country for its profile" count={scored.length} csvRows={scored.map(c => ({ country: c.name, spar_composite_0_100: c.ihr_composite, reference_year: c.ihr_year, conflict_classification: c.conflict ? 'Conflict-affected' : 'Other setting' }))} />{mapReady ? <Chart option={mapOption} height={430} ariaLabel="Interactive map of reported preparedness scores across MENA" onClick={(event: any) => event?.data?.iso3 && onCountry(event.data.iso3)} /> : <div className="map-loading">Loading geographic boundaries…</div>}<details className="chart-alternative"><summary>Accessible ranked chart</summary><Chart option={rankOption} height={430} ariaLabel="Ordered bar chart of preparedness scores by country" onClick={(event: any) => event?.data?.iso3 && onCountry(event.data.iso3)} /></details></section>
      <section className="panel priority-table"><PanelHead title="Country priority view" subtitle="Lowest reported scores first; ties share rank" count={scored.length} csvRows={ranking.map(c => ({ regional_rank: ranks.get(c.iso3), country: c.name, spar_composite_0_100: c.ihr_composite, reference_year: c.ihr_year, trend_points: trendDelta(c) }))} />
        <div className="table-wrap"><table><thead><tr><th>Rank</th><th>Country</th><th>Score</th><th>Year</th><th>Trend</th></tr></thead><tbody>{ranking.map(c => <tr key={c.iso3} tabIndex={0} role="link" aria-label={`Open ${c.name} country profile`} onClick={() => onCountry(c.iso3)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onCountry(c.iso3)}><td>{ranks.get(c.iso3)}</td><th>{c.name}</th><td><span className="score" style={{ background: color(c.ihr_composite) }}>{c.ihr_composite}</span></td><td>{c.ihr_year ?? '—'}</td><td><Trend value={trendDelta(c)} /></td></tr>)}</tbody></table></div>
      </section>
      <section className="panel capacities"><PanelHead title="Regional capacity blind spots" subtitle="Median, IQR, range, coverage and countries below 60 across all reported domains" count={countries.filter(c => Object.values(c.capacities ?? {}).some(Number.isFinite)).length} csvRows={capacityRows(capacities, countries.length)} /><Chart option={capOption} height={540} ariaLabel="Regional distribution of all reported SPAR capacity scores" /><CapacityTable rows={capacities} total={countries.length} /></section>
      <section className="panel trend"><PanelHead title="Regional trajectory" subtitle="Median of available country scores by year" count={countries.length} csvRows={trendYears.map(year => ({ reference_year: year, regional_median_spar_0_100: median(countries.map(c => c.ihr_trend.find(t => t.year === year)?.value)), reporting_countries: countries.filter(c => c.ihr_trend.some(t => t.year === year)).length, denominator: countries.length }))} /><Chart option={trendOption} height={360} ariaLabel="Regional median preparedness trajectory over time" /><details className="data-table"><summary>View accessible data table</summary><div className="table-scroll"><table><thead><tr><th>Year</th><th>Median</th><th>Countries reporting</th></tr></thead><tbody>{trendYears.map(year => <tr key={year}><th>{year}</th><td>{median(countries.map(c => c.ihr_trend.find(t => t.year === year)?.value))?.toFixed(0) ?? '—'}</td><td>{countries.filter(c => c.ihr_trend.some(t => t.year === year)).length} / {countries.length}</td></tr>)}</tbody></table></div></details></section>
      <section className="panel regional-agenda"><header className="panel-head"><div><h2>Regional action agenda</h2><p>Three lowest reported regional capacity medians; signals for joint review, not prescriptions or funding recommendations</p></div></header><div className="agenda-grid">{capacities.slice(0, 3).map((row, index) => <article key={row.capacity}><span>{index + 1}</span><div><h3>{row.capacity}</h3><p><b>{row.stats!.median.toFixed(1)}/100 median</b> · {row.below}/{row.stats!.count} reporting countries below 60 · {row.years}</p><p>Review reporting countries and validate the signal through national assessments and plans.</p></div></article>)}</div></section>
    </div>
  </>
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <div className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div> }
function PanelHead({ title, subtitle, count, csvRows }: { title: string; subtitle: string; count: number; csvRows: CsvRow[] }) { return <header className="panel-head"><div><h2>{title}</h2><p>{subtitle}</p></div><div className="analysis-actions"><CsvLink filename={`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`} rows={csvRows} /><Coverage count={count} /></div></header> }
function Trend({ value }: { value: number | null }) { if (value == null) return <span title="Insufficient observations"><Minus /></span>; return value > 1 ? <span className="up" title={`Improved ${value.toFixed(0)} points`}><ArrowUpRight /></span> : value < -1 ? <span className="down" title={`Declined ${Math.abs(value).toFixed(0)} points`}><ArrowDownRight /></span> : <span title="Broadly stable"><Minus /></span> }
type CapacityDistributionRow = { capacity: string; stats: NonNullable<ReturnType<typeof distribution>>; years: string; below: number; countries: string[] }
function capacityRows(rows: CapacityDistributionRow[], total: number): CsvRow[] { return rows.map(row => ({ capacity: row.capacity, median_0_100: row.stats.median, q1: row.stats.q1, q3: row.stats.q3, minimum: row.stats.min, maximum: row.stats.max, observation_years: row.years, reporting_countries: row.stats.count, denominator: total, countries_below_60: row.below, countries_with_observations: row.countries.join('; ') })) }
function CapacityTable({ rows, total }: { rows: CapacityDistributionRow[]; total: number }) { return <details className="data-table"><summary>View accessible data table</summary><div className="table-scroll"><table><thead><tr><th>Capacity</th><th>Median</th><th>IQR</th><th>Range</th><th>Years</th><th>Coverage</th><th>Below 60</th></tr></thead><tbody>{rows.map(row => <tr key={row.capacity}><th>{row.capacity}</th><td>{row.stats.median.toFixed(1)}</td><td>{row.stats.q1.toFixed(1)}–{row.stats.q3.toFixed(1)}</td><td>{row.stats.min.toFixed(1)}–{row.stats.max.toFixed(1)}</td><td>{row.years}</td><td>{row.stats.count}/{total}</td><td>{row.below}</td></tr>)}</tbody></table></div></details> }
