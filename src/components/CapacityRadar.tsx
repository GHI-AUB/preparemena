import { useState } from 'react'

export type RadarRow = { name: string; value: number; regional: number; top: number; year: number | null; regionalYears: string; coverage: number; compare?: number | null }

type Props = { rows: RadarRow[]; country: string; topName: string; total: number; compareName?: string }

export function CapacityRadar({ rows, country, topName, total, compareName }: Props) {
  const [active, setActive] = useState(0)
  const cx = 320, cy = 245, radius = 168
  const point = (index: number, value: number) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / rows.length
    const r = radius * value / 100
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]
  }
  const polygon = (key: 'value' | 'regional' | 'top') => rows.map((row, index) => point(index, row[key]).join(',')).join(' ')
  const hasCompare = Boolean(compareName) && rows.some(row => row.compare != null)
  const comparePolygon = hasCompare && rows.every(row => row.compare != null)
    ? rows.map((row, index) => point(index, row.compare!).join(',')).join(' ')
    : null
  const selected = rows[active]
  return <div className="capacity-radar">
    <div className="radar-tooltip" role="status"><b>{selected.name}</b><span>{country}: {selected.value}/100 ({selected.year ?? 'year unavailable'})</span>{hasCompare && <span>{compareName}: {selected.compare != null ? `${selected.compare}/100` : '—'}</span>}<span>Regional median: {selected.regional.toFixed(1)}/100 ({selected.regionalYears})</span><span>{topName}: {selected.top}/100</span><small>Regional coverage: {selected.coverage}/{total}</small></div>
    <svg viewBox="0 0 640 520" role="img" aria-label={`Capacity profile for ${country}, regional median, and ${topName}${hasCompare ? `, compared with ${compareName}` : ''}`}>
      {[25, 50, 75, 100].map(level => <polygon key={level} points={rows.map((_, index) => point(index, level).join(',')).join(' ')} className="radar-ring" />)}
      {rows.map((row, index) => { const [x, y] = point(index, 100); return <g key={row.name}><line x1={cx} y1={cy} x2={x} y2={y} className="radar-axis" /><text x={cx + (x - cx) * 1.12} y={cy + (y - cy) * 1.12} textAnchor={x < cx - 8 ? 'end' : x > cx + 8 ? 'start' : 'middle'} className="radar-label">{shorten(row.name)}</text></g> })}
      <polygon points={polygon('value')} className="radar-series country" />
      {comparePolygon && <polygon points={comparePolygon} className="radar-series compare" />}
      <polygon points={polygon('regional')} className="radar-series regional" />
      <polygon points={polygon('top')} className="radar-series top" />
      {hasCompare && rows.map((row, index) => { if (row.compare == null) return null; const [x, y] = point(index, row.compare); return <circle key={`compare-${row.name}`} cx={x} cy={y} r={4} className="radar-point compare" tabIndex={0} role="button" aria-label={`${row.name}. ${compareName} ${row.compare}.`} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)} /> })}
      {(['value', 'regional', 'top'] as const).flatMap(key => rows.map((row, index) => { const [x, y] = point(index, row[key]); return <circle key={`${key}-${row.name}`} cx={x} cy={y} r={key === 'value' ? 5 : 4} className={`radar-point ${key}`} tabIndex={0} role="button" aria-label={`${row.name}. ${country} ${row.value}; regional median ${row.regional.toFixed(1)}; ${topName} ${row.top}.`} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)} /> }))}
    </svg>
    <div className="radar-legend" aria-label="Capacity profile legend"><Legend label={country} kind="country" />{hasCompare && <Legend label={compareName!} kind="compare" />}<Legend label="Regional median" kind="regional" /><Legend label={`${topName} (highest composite)`} kind="top" /></div>
  </div>
}

function Legend({ label, kind }: { label: string; kind: string }) { return <span><svg viewBox="0 0 46 12" aria-hidden="true"><line x1="2" y1="6" x2="44" y2="6" className={`radar-series ${kind}`} /><circle cx="23" cy="6" r="3.5" className={`radar-point ${kind}`} /></svg>{label}</span> }
function shorten(value: string) { return value.length > 21 ? `${value.slice(0, 20)}…` : value }
