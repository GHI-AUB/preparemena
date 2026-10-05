import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BriefingView } from './BriefingView'
import data from '../../public/data.json'
import type { Dataset } from '../types'

const dataset = data as Dataset

describe('BriefingView', () => {
  it('renders a dedicated regional overview briefing document', () => {
    const html = renderToStaticMarkup(<BriefingView view="overview" data={dataset} countries={dataset.countries} country={dataset.countries[0]} filters={{ income: 'all', conflict: 'all' }} peerMode="income" onClose={vi.fn()} renderActions={<span>Export PDF</span>} />)

    expect(html).toContain('aria-label="Regional Overview briefing"')
    expect(html).toContain('PREPARE MENA')
    expect(html).toContain('AUB-GHI')
    expect(html).toContain('Export PDF')
    expect(html).toContain('class="briefing-page"')
  })
})
