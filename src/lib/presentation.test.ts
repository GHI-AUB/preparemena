import { describe, expect, it } from 'vitest'
import { navigationOrder } from '../components/Shell'
import { dictionaries } from './i18n'
import { chartAxisTitles } from './chartLabels'

describe('presentation contract', () => {
  it('puts Context & Pressures second and names the country workspace Country Profile', () => {
    expect(navigationOrder).toEqual(['overview', 'context', 'country', 'about', 'methodology'])
    expect(navigationOrder.map(view => dictionaries.en.navigation[view])).toEqual([
      'Regional overview',
      'Context & pressures',
      'Country profile',
      'About',
      'Methodology & data quality',
    ])
  })

  it('provides an Arabic translation for every English UI string', () => {
    const flatten = (value: unknown, prefix = ''): string[] =>
      typeof value === 'string'
        ? [prefix]
        : Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key))
    expect(flatten(dictionaries.ar).sort()).toEqual(flatten(dictionaries.en).sort())
    const leaves = (value: unknown): string[] => typeof value === 'string' ? [value] : Object.values(value as Record<string, unknown>).flatMap(leaves)
    for (const leaf of leaves(dictionaries.ar)) expect(leaf.trim()).not.toBe('')
  })

  it('defines titles and units for every analytical axis', () => {
    expect(Object.values(chartAxisTitles)).toEqual(expect.arrayContaining([
      'World Bank income group',
      'Setting classification',
      'SPAR composite score (0–100)',
      'Current health expenditure per capita (current US$, logarithmic scale)',
      'SPAR capacity score (0–100)',
      'Reported displaced people present (people, logarithmic scale)',
      'Reported displaced people present (% of national population)',
      'Difference from regional median (SPAR points)',
      'Reference year',
    ]))
  })
})
