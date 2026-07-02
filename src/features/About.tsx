import { Building2, Database, ShieldCheck, Target, Users } from 'lucide-react'
import type { Dataset } from '../types'

export function About({ data }: { data: Dataset }) {
  return <section className="workspace about-workspace">
    <header className="workspace-head"><div><h1>About PREPARE MENA</h1><p>Evidence for country-owned epidemic and pandemic preparedness decisions.</p></div></header>
    <AboutCard icon={<Building2 />} title="Hosted at AUB-GHI within EPaPP" host>PREPARE MENA is hosted and stewarded by the American University of Beirut Global Health Institute (AUB-GHI), specifically within its Epidemic and Pandemic Preparedness Program (EPaPP).</AboutCard>
    <section className="about-intro"><h2>From regional signals to nationally validated action</h2><p>PREPARE MENA helps policy leaders identify where reported preparedness is weakest, understand relevant system pressures, and structure priorities for further national review. It supports planning; it does not replace JEE, NAPHS, national assessments, budgeting, or technical judgement.</p></section>
    <div className="policy-questions"><Question number="1" title="Where is preparedness weakest?" /><Question number="2" title="Why might it require attention?" /><Question number="3" title="What should decision-makers validate and prioritize?" /></div>
    <div className="about-grid">
      <AboutCard icon={<Users />} title="Intended users">Health ministries, national preparedness agencies, regional bodies, WHO and UN partners, donors, analysts, and programme teams.</AboutCard>
      <AboutCard icon={<Target />} title="Geographic scope">A defined 21-country Middle East and North Africa analytical scope. Designations do not express a position on legal status or borders.</AboutCard>
      <AboutCard icon={<ShieldCheck />} title="Strategic intelligence, not surveillance">The product is periodically refreshed and is not an outbreak alert, early-warning, operational command, or real-time surveillance system.</AboutCard>
      <AboutCard icon={<Database />} title="Data and updates">WHO SPAR, World Bank, and UNHCR data are refreshed monthly or manually through a validated pipeline. Current snapshot: {data.meta.generated}.</AboutCard>
    </div>
  </section>
}

function Question({ number, title }: { number: string; title: string }) { return <div><span>{number}</span><strong>{title}</strong></div> }
function AboutCard({ icon, title, children, host = false }: { icon: React.ReactNode; title: string; children: React.ReactNode; host?: boolean }) { return <section className={`panel about-card${host ? ' host' : ''}`}><div>{icon}</div><h2>{title}</h2><p>{children}</p></section> }
