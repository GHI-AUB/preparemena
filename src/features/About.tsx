import { Building2, CheckCircle2, Database, FileDown, Filter, ListChecks, Radar, ShieldCheck, Target, Users } from 'lucide-react'
import type { Dataset } from '../types'
import { median } from '../lib/analytics'

const pathway = [
  { icon: Radar, name: 'Signal', text: 'Scan reported SPAR scores, capacity distributions, and system pressures across the region.' },
  { icon: CheckCircle2, name: 'Validate', text: 'Check reference years, coverage, and self-assessment caveats before drawing conclusions.' },
  { icon: Filter, name: 'Prioritize', text: 'Compare a country with peers and the regional median to locate the weakest reported domains.' },
  { icon: ListChecks, name: 'Plan', text: 'Frame candidate priorities for national review against JEE, NAPHS, and budget processes.' },
  { icon: FileDown, name: 'Export', text: 'Take any panel out as CSV, or print a briefing for decision meetings.' },
]

export function About({ data }: { data: Dataset }) {
  const scored = data.countries.filter(c => c.ihr_composite != null)
  const regionalMedian = data.meta.region_median ?? median(scored.map(c => c.ihr_composite))
  const below60 = scored.filter(c => c.ihr_composite! < 60).length
  const snapshot = new Date(data.meta.generated).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  return <section className="workspace about-workspace">
    <header className="workspace-head"><div><h1>About PREPARE MENA</h1><p>Evidence for country-owned epidemic and pandemic preparedness decisions.</p></div></header>

    <section className="about-intro">
      <h2>From regional signals to nationally validated action</h2>
      <p>PREPARE MENA helps policy leaders identify where reported preparedness is weakest, understand relevant system pressures, and structure priorities for further national review. It supports planning; it does not replace JEE, NAPHS, national assessments, budgeting, or technical judgement.</p>
      <div className="about-hero-stats">
        <div><b>{data.countries.length}</b><span>countries in scope</span></div>
        <div><b>{regionalMedian != null ? Math.round(regionalMedian) : '—'}</b><span>regional median SPAR</span></div>
        <div><b>{below60}</b><span>of {scored.length} reporting below 60</span></div>
        <div><b>{snapshot}</b><span>current data snapshot</span></div>
      </div>
    </section>

    <section className="pathway" aria-label="How the product is meant to be used">
      {pathway.map((step, index) => <article key={step.name}>
        <div className="pathway-head"><step.icon aria-hidden="true" /><span>{index + 1}</span></div>
        <h3>{step.name}</h3>
        <p>{step.text}</p>
      </article>)}
    </section>

    <div className="policy-questions">
      <Question number="1" title="Where is preparedness weakest?" />
      <Question number="2" title="Why might it require attention?" />
      <Question number="3" title="What should decision-makers validate and prioritize?" />
    </div>

    <AboutCard icon={<Building2 />} title="Hosted at AUB-GHI within EPaPP" host>
      PREPARE MENA is hosted and stewarded by the American University of Beirut Global Health Institute (AUB-GHI), specifically within its Epidemic and Pandemic Preparedness Program (EPaPP).
    </AboutCard>

    <div className="about-grid">
      <AboutCard icon={<Users />} title="Intended users">Health ministries, national preparedness agencies, regional bodies, WHO and UN partners, donors, analysts, and programme teams. The Regional Overview answers "where"; Context &amp; Pressures explores "why"; the Country Profile supports "what next".</AboutCard>
      <AboutCard icon={<Target />} title="Geographic scope">A defined 21-country Middle East and North Africa analytical scope. Designations do not express a position on legal status or borders.</AboutCard>
      <AboutCard icon={<ShieldCheck />} title="Strategic intelligence, not surveillance">The product is periodically refreshed and is not an outbreak alert, early-warning, operational command, or real-time surveillance system. SPAR scores are State Party self-assessments of reported capacity, not audits of performance.</AboutCard>
      <AboutCard icon={<Database />} title="Data and updates">
        <span>A validated pipeline refreshes the dataset monthly or on demand; failed retrieval preserves the previous snapshot rather than publishing partial data.</span>
        <span className="source-status">
          {Object.entries(data.meta.source_refresh ?? {}).map(([name, source]) => <span key={name}><b>{name}</b> · {source.status} · coverage {source.coverage}/{data.countries.length} · {String(source.reference_year ?? '—')}</span>)}
          {!data.meta.source_refresh && data.meta.sources.map(source => <span key={source}>{source}</span>)}
        </span>
      </AboutCard>
    </div>

    <p className="about-footnote">Missing observations are never shown as zero, indicators may use different reference years, and cross-sectional associations do not establish causality. Full definitions, source endpoints, and limitations are documented in <b>Methodology &amp; data quality</b>.</p>
  </section>
}

function Question({ number, title }: { number: string; title: string }) { return <div><span>{number}</span><strong>{title}</strong></div> }
function AboutCard({ icon, title, children, host = false }: { icon: React.ReactNode; title: string; children: React.ReactNode; host?: boolean }) { return <section className={`panel about-card${host ? ' host' : ''}`}><div>{icon}</div><h2>{title}</h2><p>{children}</p></section> }
