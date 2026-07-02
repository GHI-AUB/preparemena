import { describe, expect, it } from 'vitest'
import { parseFilters, parseFoundation, parsePeerMode, parseView } from './navigation'

describe('parseView', () => {
  it('redirects the legacy comparison route', () => expect(parseView('compare')).toBe('context'))
  it('preserves valid routes and rejects invalid routes', () => {
    expect(parseView('methodology')).toBe('methodology')
    expect(parseView('situation')).toBe('overview')
    expect(parseView('unknown')).toBe('overview')
    expect(parseView(null)).toBe('overview')
  })
  it('restores filters and rejects an invalid conflict classification', () => {
    expect(parseFilters(new URLSearchParams('income=High+income&conflict=conflict&capacity=Laboratory'))).toEqual({ income: 'High income', conflict: 'conflict', capacity: 'Laboratory' })
    expect(parseFilters(new URLSearchParams('conflict=unknown'))).toEqual({ income: 'all', conflict: 'all', capacity: 'all' })
  })
  it('restores foundation and peer state with safe defaults', () => {
    expect(parseFoundation('sanitation')).toBe('sanitation')
    expect(parseFoundation('invalid')).toBe('physicians')
    expect(parsePeerMode('conflict')).toBe('conflict')
    expect(parsePeerMode('invalid')).toBe('income')
  })
})
