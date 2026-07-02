import { describe, expect, it } from 'vitest'
import { navigationItems } from '../components/Shell'
import { chartAxisTitles } from './chartLabels'

describe('presentation contract', () => {
  it('puts Context & Pressures second and names the country workspace Country Profile', () => {
    expect(navigationItems.map(([view, label]) => [view, label])).toEqual([
      ['overview', 'Regional overview'],
      ['context', 'Context & pressures'],
      ['country', 'Country profile'],
      ['about', 'About'],
      ['methodology', 'Methodology & data quality'],
    ])
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
