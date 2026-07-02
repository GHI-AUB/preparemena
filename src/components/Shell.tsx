import { useState } from 'react'
import { BarChart3, BookOpen, Check, FileText, Globe2, Info, Map, Moon, Share2, SlidersHorizontal, Sun, Users } from 'lucide-react'
import { fmt, useI18n, type Lang } from '../lib/i18n'
import type { Theme } from '../lib/chartTheme'

export type View = 'overview' | 'country' | 'context' | 'about' | 'methodology'

export const navigationOrder: View[] = ['overview', 'context', 'country', 'about', 'methodology']

const navigationIcons: Array<[View, typeof Map]> = [
  ['overview', Map],
  ['context', BarChart3],
  ['country', FileText],
  ['about', Info],
  ['methodology', BookOpen],
]

type ShellProps = {
  view: View
  setView: (view: View) => void
  generated: string
  children: React.ReactNode
  onBriefing: () => void
  theme: Theme
  setTheme: (theme: Theme) => void
  lang: Lang
  setLang: (lang: Lang) => void
}

export function Shell({ view, setView, generated, children, onBriefing, theme, setTheme, lang, setLang }: ShellProps) {
  const { t } = useI18n()
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
  const dateLocale = lang === 'ar' ? 'ar-LB' : 'en-GB'
  return <div className="app-shell">
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brand-mark" aria-hidden="true"><Globe2 /></div>
      <nav>{navigationIcons.map(([id, Icon]) => <button key={id} className={view === id ? 'active' : ''} aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}><Icon /><span>{t.navigation[id]}</span></button>)}</nav>
    </aside>
    <div className="app-main">
      <header className="topbar">
        <div><strong>{t.product}</strong><span className="divider" /> <span>{t.navigation[view]}</span></div>
        <div className="top-actions">
          <span className="freshness">{t.topbar.dataRefreshed} <b>{new Date(generated).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short', year: 'numeric' })}</b></span>
          <button className="text-button language-status" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} title={t.topbar.languageToggleTitle}><Globe2 /> {t.topbar.languageToggle}</button>
          <button className="text-button icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? t.topbar.themeToLight : t.topbar.themeToDark} title={theme === 'dark' ? t.topbar.themeToLight : t.topbar.themeToDark}>{theme === 'dark' ? <Sun /> : <Moon />}</button>
          <button className="text-button" onClick={share} aria-live="polite">{shareStatus === 'copied' ? <Check /> : <Share2 />} {shareStatus === 'copied' ? t.topbar.linkCopied : shareStatus === 'failed' ? t.topbar.copyFailed : t.topbar.share}</button>
          <button className="primary-button" onClick={onBriefing}><FileText /> {t.topbar.briefing}</button>
        </div>
      </header>
      <div className="briefing-header"><strong>{t.product}</strong><span>{t.navigation[view]} {t.briefing.suffix}</span><small>{t.briefing.generated} {new Date().toLocaleDateString(dateLocale)} · {t.briefing.snapshot} {generated}</small></div>
      <main>{children}</main>
      <footer className="briefing-footer"><span>{t.footer.initiative}</span><span>{t.footer.caveat}</span></footer>
    </div>
  </div>
}

export function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="empty-state"><SlidersHorizontal /><h2>{title}</h2><p>{children}</p></div>
}

export function Coverage({ count, total = 21 }: { count: number; total?: number }) {
  const { t } = useI18n()
  return <span className="coverage"><Users /> {fmt(t.common.coverage, { n: count, total })}</span>
}
