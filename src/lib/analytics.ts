import type { Country } from '../types'
import type { PeerMode } from './navigation'

export function median(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((value): value is number => Number.isFinite(value)).sort((a, b) => a - b)
  if (!valid.length) return null
  const middle = Math.floor(valid.length / 2)
  return valid.length % 2 ? valid[middle] : (valid[middle - 1] + valid[middle]) / 2
}

export function quantile(values: Array<number | null | undefined>, probability: number): number | null {
  const valid = values.filter((value): value is number => Number.isFinite(value)).sort((a, b) => a - b)
  if (!valid.length) return null
  if (valid.length === 1) return valid[0]
  const position = (valid.length - 1) * Math.min(1, Math.max(0, probability))
  const lower = Math.floor(position)
  const fraction = position - lower
  return valid[lower + 1] == null ? valid[lower] : valid[lower] + fraction * (valid[lower + 1] - valid[lower])
}

export type Distribution = { min: number; q1: number; median: number; q3: number; max: number; count: number }

export function distribution(values: Array<number | null | undefined>): Distribution | null {
  const valid = values.filter((value): value is number => Number.isFinite(value)).sort((a, b) => a - b)
  if (!valid.length) return null
  return { min: valid[0], q1: quantile(valid, .25)!, median: quantile(valid, .5)!, q3: quantile(valid, .75)!, max: valid.at(-1)!, count: valid.length }
}

export type LinearFit = { intercept: number; slope: number; predict: (x: number) => number }

export function linearRegression(points: Array<[number, number]>): LinearFit | null {
  const valid = points.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
  if (valid.length < 2) return null
  const n = valid.length
  const sx = valid.reduce((sum, [x]) => sum + x, 0)
  const sy = valid.reduce((sum, [, y]) => sum + y, 0)
  const sxx = valid.reduce((sum, [x]) => sum + x * x, 0)
  const sxy = valid.reduce((sum, [x, y]) => sum + x * y, 0)
  const denominator = n * sxx - sx * sx
  if (denominator === 0) return null
  const slope = (n * sxy - sx * sy) / denominator
  const intercept = (sy - slope * sx) / n
  return { intercept, slope, predict: (x: number) => intercept + slope * x }
}

export function hostedPopulationShare(country: Country): number | null {
  const population = country.context?.population?.value
  return population && population > 0 ? hostedPopulation(country) / population * 100 : null
}

export function tiedRanks(countries: Country[]): Map<string, number> {
  const sorted = countries.filter(c => c.ihr_composite != null)
    .sort((a, b) => (b.ihr_composite ?? -Infinity) - (a.ihr_composite ?? -Infinity))
  const ranks = new Map<string, number>()
  let previous: number | null = null
  let rank = 0
  sorted.forEach((country, index) => {
    if (country.ihr_composite !== previous) rank = index + 1
    ranks.set(country.iso3, rank)
    previous = country.ihr_composite
  })
  return ranks
}

export function trendDelta(country: Country): number | null {
  if (country.ihr_trend.length < 2) return null
  return country.ihr_trend.at(-1)!.value - country.ihr_trend[0].value
}

export function capacityCoverage(country: Country, capacityOrder?: string[]): number {
  return capacityOrder
    ? capacityOrder.filter(capacity => Number.isFinite(country.capacities?.[capacity])).length
    : Object.values(country.capacities ?? {}).filter(Number.isFinite).length
}

export function hostedPopulation(country: Country): number {
  const r = country.refugees ?? {}
  return (r.refugees ?? 0) + (r.asylum_seekers ?? 0) + (r.idps ?? 0)
}

export function contextIndex(value: number | null | undefined, regionalMedian: number | null | undefined): number | null {
  return Number.isFinite(value) && Number.isFinite(regionalMedian) && regionalMedian! > 0
    ? value! / regionalMedian! * 100
    : null
}

export function incomePeers(countries: Country[], selected: Country, minimum = 3): { countries: Country[]; label: string } {
  const reporting = countries.filter(country => country.ihr_composite != null)
  const income = reporting.filter(country => selected.income && country.income === selected.income)
  return income.length >= minimum
    ? { countries: income, label: `${selected.income} peers` }
    : { countries: reporting, label: 'all MENA reporting countries' }
}

export function peerCountries(countries: Country[], selected: Country, mode: PeerMode, minimum = 3): { countries: Country[]; label: string; fallback: boolean } {
  const reporting = countries.filter(country => country.ihr_composite != null)
  const matched = mode === 'all' ? reporting : mode === 'income'
    ? reporting.filter(country => selected.income && country.income === selected.income)
    : reporting.filter(country => country.conflict === selected.conflict)
  if (mode !== 'all' && matched.length < minimum) return { countries: reporting, label: 'all MENA reporting countries', fallback: true }
  return { countries: matched, label: mode === 'all' ? 'all MENA reporting countries' : mode === 'income' ? `${selected.income} peers` : `${selected.conflict ? 'conflict-affected' : 'other-setting'} peers`, fallback: false }
}

export function yearRange(years: Array<number | null | undefined>): string {
  const valid = Array.from(new Set(years.filter((year): year is number => Number.isFinite(year)))).sort((a, b) => a - b)
  if (!valid.length) return 'year unavailable'
  return valid.length === 1 ? String(valid[0]) : `${valid[0]}–${valid.at(-1)}`
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}
