import { useState } from 'react'
import { BarChart3, BookOpen, Check, FileText, Globe2, Info, Map, Share2, SlidersHorizontal, Users } from 'lucide-react'
import { copy } from '../lib/strings'

export type View = 'overview' | 'country' | 'context' | 'about' | 'methodology'

export const navigationItems: Array<[View, string, typeof Map]> = [
  ['overview', copy.navigation.overview, Map],
  ['context', copy.navigation.context, BarChart3],
  ['country', copy.navigation.country, FileText],
  ['about', copy.navigation.about, Info],
  ['methodology', copy.navigation.methodology, BookOpen],
]

type ShellProps = {
  view: View
  setView: (view: View) => void
  generated: string
  children: React.ReactNode
  onBriefing: () => void
}

export function Shell({ view, setView, generated, children, onBriefing }: ShellProps) {
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const share = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(window.location.href)
      setShareStatus('copied')
    } catch {
      setShareStatus('failed')
    }
    window.setTimeout(() => setShareStatus('idle'), 2500)
  }
  return <div className="app-shell">
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brand-mark" aria-hidden="true"><Globe2 /></div>
      <nav>{navigationItems.map(([id, label, Icon]) => <button key={id} className={view === id ? 'active' : ''} aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}><Icon /><span>{label}</span></button>)}</nav>
    </aside>
    <div className="app-main">
      <header className="topbar">
        <div><strong>{copy.product}</strong><span className="divider" /> <span>{navigationItems.find(i => i[0] === view)?.[1]}</span></div>
        <div className="top-actions">
          <span className="freshness">Data refreshed <b>{new Date(generated).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</b></span>
          <span className="language-status" title="English interface"><Globe2 /> English</span>
          <button className="text-button" onClick={share} aria-live="polite">{shareStatus === 'copied' ? <Check /> : <Share2 />} {shareStatus === 'copied' ? 'Link copied' : shareStatus === 'failed' ? 'Copy failed' : 'Share'}</button>
          <button className="primary-button" onClick={onBriefing}><FileText /> Briefing</button>
        </div>
      </header>
      <div className="briefing-header"><strong>PREPARE MENA</strong><span>{navigationItems.find(i => i[0] === view)?.[1]} briefing</span><small>Generated {new Date().toLocaleDateString('en-GB')} · Data snapshot {generated}</small></div>
      <main>{children}</main>
      <footer className="briefing-footer"><span>An AUB-GHI EPaPP initiative · Strategic decision support, not outbreak surveillance</span><span>WHO SPAR is self-reported; validate priorities nationally.</span></footer>
    </div>
  </div>
}

export function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="empty-state"><SlidersHorizontal /><h2>{title}</h2><p>{children}</p></div>
}

export function Coverage({ count, total = 21 }: { count: number; total?: number }) {
  return <span className="coverage"><Users /> {count} of {total} countries</span>
}
