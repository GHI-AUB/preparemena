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
import { chartAxis, chartColors, scoreColor } from '../lib/chartTheme'
import { fmt, useI18n } from '../lib/i18n'

type Props = { data: Dataset; countries: Country[]; onCountry: (iso3: string) => void }

export function SituationRoom({ data, countries, onCountry }: Props) {
  const { t } = useI18n()
  const axis = chartAxis()
  const colors = chartColors()
  const [mapReady, setMapReady] = useState(false)
  const trendYears = useMemo(() => Array.from(new Set(countries.flatMap(c => c.ihr_trend.map(point => point.year)))).sort(), [countries])
  const [yearIndex, setYearIndex] = useState(trendYears.length) // rightmost position = latest reported per country
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

  const latestMode = yearIndex >= trendYears.length
  const mapYear = latestMode ? null : trendYears[yearIndex]
  const mapRows = latestMode
    ? scored.map(c => ({ name: c.name, value: c.ihr_composite!, year: c.ihr_year, iso3: c.iso3 }))
    : countries.flatMap(c => { const point = c.ihr_trend.find(item => item.year === mapYear); return point ? [{ name: c.name, value: point.value, year: mapYear, iso3: c.iso3 }] : [] })
  const movers = useMemo(() => countries.flatMap(c => {
    if (c.ihr_trend.length < 2) return []
    const last = c.ihr_trend.at(-1)!, previous = c.ihr_trend.at(-2)!
    return [{ country: c, delta: last.value - previous.value, from: previous, to: last }]
  }), [countries])
  const improvers = [...movers].filter(m => m.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 4)
  const decliners = [...movers].filter(m => m.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 4)

  const ranking = [...scored].sort((a, b) => a.ihr_composite! - b.ihr_composite!)
  const mapOption = { tooltip: { trigger: 'item', formatter: (p: any) => p?.data ? `<b>${p.data.name}</b><br/>SPAR: ${p.data.value}<br/>${p.data.year ?? ''}` : p.name }, visualMap: { min: 30, max: 100, left: 12, bottom: 10, orient: 'horizontal', text: ['Higher', 'Lower'], inRange: { color: [colors.coral, colors.amber, colors.teal, colors.blue] }, textStyle: { color: colors.axisLabel } }, series: [{ type: 'map', map: 'MENA', roam: true, data: mapRows, itemStyle: { borderColor: colors.mapBorder, borderWidth: 1, areaColor: colors.mapMissing }, emphasis: { itemStyle: { areaColor: '#174a73' }, label: { show: true } }, select: { itemStyle: { areaColor: '#102a43' } } }] }
  const rankOption = { animationDuration: 450, grid: { left: 122, right: 40, top: 18, bottom: 54 }, tooltip: { trigger: 'item' }, xAxis: { ...axis, max: 100, name: chartAxisTitles.spar, nameLocation: 'middle', nameGap: 34 }, yAxis: { ...axis, type: 'category', name: chartAxisTitles.country, nameLocation: 'middle', nameGap: 106, data: ranking.map(c => c.name), axisLabel: { color: colors.axisStrong, fontSize: 11 } }, series: [{ type: 'bar', barWidth: 11, data: ranking.map(c => ({ value: c.ihr_composite, iso3: c.iso3, itemStyle: { color: scoreColor(c.ihr_composite), borderRadius: [0, 2, 2, 0] } })), label: { show: true, position: 'right', color: colors.axisStrong } }] }
  const capOption = { grid: { left: 190, right: 38, top: 18, bottom: 58 }, tooltip: { trigger: 'item' }, xAxis: { ...axis, min: 0, max: 100, name: chartAxisTitles.capacityScore, nameLocation: 'middle', nameGap: 34 }, yAxis: { ...axis, type: 'category', name: chartAxisTitles.capacityDomain, nameLocation: 'middle', nameGap: 176, data: capacities.map(row => row.capacity), axisLabel: { color: colors.axisStrong, fontSize: 10 } }, series: [{ type: 'boxplot', data: capacities.map(row => [row.stats!.min, row.stats!.q1, row.stats!.median, row.stats!.q3, row.stats!.max]), itemStyle: { color: 'rgba(8,126,139,.14)', borderColor: colors.teal }, tooltip: { formatter: (point: any) => { const row = capacities[point.dataIndex]; return `<b>${row.capacity}</b><br/>${t.common.median}: ${row.stats!.median.toFixed(1)}/100<br/>${t.overview.iqr}: ${row.stats!.q1.toFixed(1)}–${row.stats!.q3.toFixed(1)}<br/>${t.overview.range}: ${row.stats!.min.toFixed(1)}–${row.stats!.max.toFixed(1)}<br/>${t.overview.years}: ${row.years}<br/>${t.overview.coverageCol}: ${row.stats!.count}/${countries.length}<br/>${t.overview.below60Col}: ${row.below}` } } }] }
  const trendOption = { grid: { left: 60, right: 20, top: 16, bottom: 56 }, tooltip: { trigger: 'axis' }, xAxis: { ...axis, type: 'category', name: chartAxisTitles.referenceYear, nameLocation: 'middle', nameGap: 34, data: trendYears }, yAxis: { ...axis, min: 20, max: 100, name: chartAxisTitles.regionalTrend, nameLocation: 'middle', nameGap: 44 }, series: [{ type: 'line', smooth: true, showSymbol: true, lineStyle: { color: colors.teal, width: 2 }, itemStyle: { color: colors.teal }, data: trendYears.map(year => median(countries.map(c => c.ihr_trend.find(point => point.year === year)?.value))) }] }

  return <>
    <section className="finding-band">
      <div><h1>{t.overview.title}</h1><p>{below60 ? fmt(t.overview.findingBelow, { n: below60, total: scored.length }) : t.overview.findingNone} {t.overview.findingUse}</p></div>
      <Metric label={t.overview.regionalMedian} value={regional?.toFixed(0) ?? '—'} detail={fmt(t.overview.regionalMedianDetail, { n: scored.length })} tone="teal" />
      <Metric label={t.overview.below60} value={`${below60}`} detail={fmt(t.overview.below60Detail, { n: scored.length })} tone="coral" />
      <Metric label={t.overview.conflictAffected} value={`${conflict}`} detail={fmt(t.overview.conflictDetail, { n: countries.length })} tone="amber" />
      <Metric label={t.overview.displaced} value={formatCompact(hosted)} detail={t.overview.displacedDetail} tone="blue" />
    </section>
    <div className="situation-grid">
      <section className="panel ranking-panel"><PanelHead title={t.overview.mapTitle} subtitle={t.overview.mapSubtitle} count={mapRows.length} csvRows={mapRows.map(row => ({ country: row.name, spar_composite_0_100: row.value, reference_year: row.year, conflict_classification: countries.find(c => c.iso3 === row.iso3)?.conflict ? 'Conflict-affected' : 'Other setting' }))} />{mapReady ? <Chart option={mapOption} height={400} ariaLabel="Interactive map of reported preparedness scores across MENA" onClick={(event: any) => event?.data?.iso3 && onCountry(event.data.iso3)} /> : <div className="map-loading">{t.common.loadingMap}</div>}
        <div className="map-year"><span>{t.overview.mapYearLabel}</span><input type="range" min={0} max={trendYears.length} value={yearIndex} onChange={event => setYearIndex(Number(event.target.value))} aria-label={t.overview.mapYearLabel} aria-valuetext={latestMode ? 'Latest' : String(mapYear)} list="map-years" /><b>{latestMode ? 'Latest' : mapYear}</b><span>{fmt(t.overview.mapYearReporting, { n: mapRows.length, total: countries.length, year: latestMode ? 'Latest' : mapYear! })}</span></div>
        <details className="chart-alternative"><summary>{t.common.rankedChart}</summary><Chart option={rankOption} height={430} ariaLabel="Ordered bar chart of preparedness scores by country" onClick={(event: any) => event?.data?.iso3 && onCountry(event.data.iso3)} /></details></section>
      <section className="panel priority-table"><PanelHead title={t.overview.priorityTitle} subtitle={t.overview.prioritySubtitle} count={scored.length} csvRows={ranking.map(c => ({ regional_rank: ranks.get(c.iso3), country: c.name, spar_composite_0_100: c.ihr_composite, reference_year: c.ihr_year, trend_points: trendDelta(c) }))} />
        <div className="table-wrap"><table><thead><tr><th>{t.common.rank}</th><th>{t.common.country}</th><th>{t.common.score}</th><th>{t.common.year}</th><th>{t.common.trend}</th></tr></thead><tbody>{ranking.map(c => <tr key={c.iso3} tabIndex={0} role="link" aria-label={`Open ${c.name} Country Profile `} onClick={() => onCountry(c.iso3)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onCountry(c.iso3)}><td>{ranks.get(c.iso3)}</td><th>{c.name}</th><td><span className="score" style={{ background: scoreColor(c.ihr_composite) }}>{c.ihr_composite}</span></td><td>{c.ihr_year ?? '—'}</td><td><Trend value={trendDelta(c)} /></td></tr>)}</tbody></table></div>
      </section>
      <section className="panel capacities"><PanelHead title={t.overview.blindSpotsTitle} subtitle={t.overview.blindSpotsSubtitle} count={countries.filter(c => Object.values(c.capacities ?? {}).some(Number.isFinite)).length} csvRows={capacityRows(capacities, countries.length)} /><Chart option={capOption} height={540} ariaLabel="Regional distribution of all reported SPAR capacity scores" /><CapacityTable rows={capacities} total={countries.length} /></section>
      <section className="panel trend"><PanelHead title={t.overview.trajectoryTitle} subtitle={t.overview.trajectorySubtitle} count={countries.length} csvRows={trendYears.map(year => ({ reference_year: year, regional_median_spar_0_100: median(countries.map(c => c.ihr_trend.find(point => point.year === year)?.value)), reporting_countries: countries.filter(c => c.ihr_trend.some(point => point.year === year)).length, denominator: countries.length }))} /><Chart option={trendOption} height={300} ariaLabel="Regional median preparedness trajectory over time" /><details className="data-table"><summary>{t.common.viewDataTable}</summary><div className="table-scroll"><table><thead><tr><th>{t.common.year}</th><th>{t.common.median}</th><th>{t.common.reportingCountries}</th></tr></thead><tbody>{trendYears.map(year => <tr key={year}><th>{year}</th><td>{median(countries.map(c => c.ihr_trend.find(point => point.year === year)?.value))?.toFixed(0) ?? '—'}</td><td>{countries.filter(c => c.ihr_trend.some(point => point.year === year)).length} / {countries.length}</td></tr>)}</tbody></table></div></details>
        <PanelHead title={t.overview.changedTitle} subtitle={t.overview.changedSubtitle} count={movers.length} csvRows={movers.map(m => ({ country: m.country.name, from_year: m.from.year, from_score: m.from.value, to_year: m.to.year, to_score: m.to.value, change_points: m.delta }))} />
        {movers.length ? <div className="movers-grid">
          <div><h3>{t.overview.improvers}</h3><ul>{improvers.length ? improvers.map(m => <MoverRow key={m.country.iso3} mover={m} onCountry={onCountry} />) : <li aria-disabled="true">—</li>}</ul></div>
          <div><h3>{t.overview.decliners}</h3><ul>{decliners.length ? decliners.map(m => <MoverRow key={m.country.iso3} mover={m} onCountry={onCountry} />) : <li aria-disabled="true">—</li>}</ul></div>
        </div> : <p className="movers-empty">{t.overview.changedEmpty}</p>}
      </section>
      <section className="panel regional-agenda"><header className="panel-head"><div><h2>{t.overview.agendaTitle}</h2><p>{t.overview.agendaSubtitle}</p></div></header><div className="agenda-grid">{capacities.slice(0, 3).map((row, index) => <article key={row.capacity}><span>{index + 1}</span><div><h3>{row.capacity}</h3><p><b>{row.stats!.median.toFixed(1)}/100 {t.common.median.toLowerCase()}</b> · {row.below}/{row.stats!.count} {t.overview.below60Col} · {row.years}</p><p>{t.overview.agendaReview}</p></div></article>)}</div></section>
    </div>
  </>
}

type Mover = { country: Country; delta: number; from: { year: number; value: number }; to: { year: number; value: number } }
function MoverRow({ mover, onCountry }: { mover: Mover; onCountry: (iso3: string) => void }) {
  return <li tabIndex={0} role="link" onClick={() => onCountry(mover.country.iso3)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onCountry(mover.country.iso3)}>
    <span>{mover.country.name} <small>({mover.from.year}→{mover.to.year})</small></span>
    <span className={`delta ${mover.delta > 0 ? 'up' : 'down'}`}>{mover.delta > 0 ? '+' : ''}{mover.delta.toFixed(0)}</span>
  </li>
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <div className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div> }
function PanelHead({ title, subtitle, count, csvRows }: { title: string; subtitle: string; count: number; csvRows: CsvRow[] }) { return <header className="panel-head"><div><h2>{title}</h2><p>{subtitle}</p></div><div className="analysis-actions"><CsvLink filename={`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`} rows={csvRows} /><Coverage count={count} /></div></header> }
function Trend({ value }: { value: number | null }) {
  const { t } = useI18n()
  if (value == null) return <span title={t.overview.insufficientTitle}><Minus /></span>
  return value > 1 ? <span className="up" title={fmt(t.overview.improvedTitle, { n: value.toFixed(0) })}><ArrowUpRight /></span> : value < -1 ? <span className="down" title={fmt(t.overview.declinedTitle, { n: Math.abs(value).toFixed(0) })}><ArrowDownRight /></span> : <span title={t.overview.stableTitle}><Minus /></span>
}
type CapacityDistributionRow = { capacity: string; stats: NonNullable<ReturnType<typeof distribution>>; years: string; below: number; countries: string[] }
function capacityRows(rows: CapacityDistributionRow[], total: number): CsvRow[] { return rows.map(row => ({ capacity: row.capacity, median_0_100: row.stats.median, q1: row.stats.q1, q3: row.stats.q3, minimum: row.stats.min, maximum: row.stats.max, observation_years: row.years, reporting_countries: row.stats.count, denominator: total, countries_below_60: row.below, countries_with_observations: row.countries.join('; ') })) }
function CapacityTable({ rows, total }: { rows: CapacityDistributionRow[]; total: number }) {
  const { t } = useI18n()
  return <details className="data-table"><summary>{t.common.viewDataTable}</summary><div className="table-scroll"><table><thead><tr><th>{t.overview.capacity}</th><th>{t.common.median}</th><th>{t.overview.iqr}</th><th>{t.overview.range}</th><th>{t.overview.years}</th><th>{t.overview.coverageCol}</th><th>{t.overview.below60Col}</th></tr></thead><tbody>{rows.map(row => <tr key={row.capacity}><th>{row.capacity}</th><td>{row.stats.median.toFixed(1)}</td><td>{row.stats.q1.toFixed(1)}–{row.stats.q3.toFixed(1)}</td><td>{row.stats.min.toFixed(1)}–{row.stats.max.toFixed(1)}</td><td>{row.years}</td><td>{row.stats.count}/{total}</td><td>{row.below}</td></tr>)}</tbody></table></div></details>
}
