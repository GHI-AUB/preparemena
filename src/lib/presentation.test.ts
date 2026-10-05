import { describe, expect, it } from 'vitest'
import { navigationOrder } from '../components/Shell'
import { copy } from './i18n'
import { chartAxisTitles } from './chartLabels'

describe('presentation contract', () => {
  it('puts Context & Pressures second and names the country workspace Country Profile ', () => {
    expect(navigationOrder).toEqual(['overview', 'context', 'country', 'about', 'methodology'])
    expect(navigationOrder.map(view => copy.navigation[view])).toEqual([
      'Regional overview',
      'Context & Pressures',
      'Country Profile ',
      'About',
      'Methodology & Data quality',
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
