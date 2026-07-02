import { describe, expect, it } from 'vitest'
import { contextIndex, distribution, hostedPopulationShare, incomePeers, linearRegression, median, peerCountries, quantile, tiedRanks, trendDelta, yearRange } from './analytics'
import type { Country } from '../types'

const country = (iso3: string, score: number | null): Country => ({
  iso3, name: iso3, conflict: false, income: null, ihr_composite: score, ihr_year: 2025,
  ihr_trend: [], capacities: {}, context: {},
})

describe('analytics', () => {
  it('calculates medians without treating missing values as zero', () => {
    expect(median([null, 10, 30, undefined, 20])).toBe(20)
    expect(median([10, 20])).toBe(15)
  })

  it('uses competition ranking for ties', () => {
    const ranks = tiedRanks([country('A', 90), country('B', 90), country('C', 70), country('D', null)])
    expect(ranks.get('A')).toBe(1)
    expect(ranks.get('B')).toBe(1)
    expect(ranks.get('C')).toBe(3)
    expect(ranks.has('D')).toBe(false)
  })

  it('requires two observations for a trend', () => {
    const c = country('A', 50)
    c.ihr_trend = [{ year: 2025, value: 50 }]
    expect(trendDelta(c)).toBeNull()
    c.ihr_trend.unshift({ year: 2021, value: 40 })
    expect(trendDelta(c)).toBe(10)
  })

  it('calculates interpolated quartiles and distributions without missing values', () => {
    expect(quantile([null, 0, 10, 20, 30], .25)).toBe(7.5)
    expect(distribution([0, 10, 20, 30])).toEqual({ min: 0, q1: 7.5, median: 15, q3: 22.5, max: 30, count: 4 })
    expect(distribution([null])).toBeNull()
  })

  it('fits a linear relationship and rejects insufficient or invariant inputs', () => {
    const fit = linearRegression([[0, 1], [1, 3], [2, 5]])
    expect(fit?.slope).toBeCloseTo(2)
    expect(fit?.predict(3)).toBeCloseTo(7)
    expect(linearRegression([[1, 2]])).toBeNull()
    expect(linearRegression([[1, 2], [1, 3]])).toBeNull()
  })

  it('calculates hosted population share only with a valid denominator', () => {
    const c = country('A', 50)
    c.refugees = { refugees: 50, asylum_seekers: 10, idps: 40 }
    c.context.population = { value: 1000, year: 2024 }
    expect(hostedPopulationShare(c)).toBe(10)
    delete c.context.population
    expect(hostedPopulationShare(c)).toBeNull()
  })

  it('indexes mixed-unit context values without inventing missing denominators', () => {
    expect(contextIndex(12, 8)).toBe(150)
    expect(contextIndex(null, 8)).toBeNull()
    expect(contextIndex(12, 0)).toBeNull()
  })

  it('uses income peers and falls back when the peer group is too small', () => {
    const selected = { ...country('A', 70), income: 'High income' }
    const same = { ...country('B', 80), income: 'High income' }
    const other = { ...country('C', 60), income: 'Low income' }
    expect(incomePeers([selected, same, other], selected, 2).countries).toHaveLength(2)
    expect(incomePeers([selected, same, other], selected).label).toBe('all MENA reporting countries')
  })

  it('supports conflict-status and all-region peer definitions', () => {
    const selected = { ...country('A', 70), conflict: true }
    const conflictPeer = { ...country('B', 60), conflict: true }
    const other = { ...country('C', 80), conflict: false }
    expect(peerCountries([selected, conflictPeer, other], selected, 'conflict', 2).countries.map(item => item.iso3)).toEqual(['A', 'B'])
    expect(peerCountries([selected, conflictPeer, other], selected, 'all').countries).toHaveLength(3)
    expect(peerCountries([selected, other], selected, 'conflict').fallback).toBe(true)
  })

  it('formats mixed and missing reference-year ranges', () => {
    expect(yearRange([2024, 2022, 2024])).toBe('2022–2024')
    expect(yearRange([2024])).toBe('2024')
    expect(yearRange([])).toBe('year unavailable')
  })
})
