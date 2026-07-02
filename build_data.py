import urllib.request, json, time, statistics
from datetime import datetime, timezone
from pathlib import Path
from scripts.refresh_helpers import expected_complete_year, observation_year_range, publish_candidates, select_latest_available_year
# ---------- reference tables ----------
MENA = {
 'DZA':'Algeria','BHR':'Bahrain','EGY':'Egypt','IRN':'Iran','IRQ':'Iraq',
 'JOR':'Jordan','KWT':'Kuwait','LBN':'Lebanon','LBY':'Libya',
 'MAR':'Morocco','OMN':'Oman','PSE':'occupied Palestinian territory','QAT':'Qatar','SAU':'Saudi Arabia',
 'SYR':'Syria','TUN':'Tunisia','ARE':'United Arab Emirates','YEM':'Yemen',
 'DJI':'Djibouti','SDN':'Sudan','SOM':'Somalia'}
# World Bank FY25 Fragile & Conflict-affected Situations (FCS) — MENA subset
FCS = {'IRQ','LBN','LBY','SOM','SDN','SYR','PSE','YEM'}
# UNHCR uses ISO3 too; PSE maps in WB as PSE
def gho(code):
    url=f"https://ghoapi.azureedge.net/api/{code}"
    last=None
    for attempt in range(3):
        try:
            return json.load(urllib.request.urlopen(url,timeout=120))['value']
        except Exception as exc:
            last=exc
            if attempt < 2: time.sleep(2 ** attempt)
    raise RuntimeError(f"WHO GHO refresh failed for {code}: {last}")

CAP={f"IHRSPAR2_C{n:02d}":lbl for n,lbl in {
 2:'IHR Coordination',3:'Financing',4:'Laboratory',
 5:'Surveillance',6:'Human Resources',7:'Health Emergency Mgmt',8:'Health Services',
 9:'Infection Prevention & Control',10:'Risk Communication',11:'Points of Entry',
 12:'Zoonotic Diseases',13:'Food Safety',14:'Chemical Events',15:'Radiation Emergencies'}.items()}

data={iso:{'iso3':iso,'name':MENA[iso],'conflict':iso in FCS} for iso in MENA}
retrieved_at=datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

# ---- WHO composite (SDGIHR2021), all years ----
comp=gho('SDGIHR2021')
for iso in MENA:
    rows=sorted([(r['TimeDim'],r['NumericValue']) for r in comp
                 if r.get('SpatialDim')==iso and r.get('NumericValue') is not None])
    data[iso]['ihr_trend']=[{'year':y,'value':round(v,1)} for y,v in rows]
    data[iso]['ihr_composite']=rows[-1][1] if rows else None
    data[iso]['ihr_year']=rows[-1][0] if rows else None
who_composite_year=observation_year_range(c['ihr_year'] for c in data.values() if c['ihr_year'] is not None)

# ---- WHO 14 included capacities (latest available observation per country/domain) ----
capnames={}
for code,label in CAP.items():
    capnames[code]=label
    d=gho(code)
    for iso in MENA:
        rr=sorted([(r['TimeDim'],r['NumericValue']) for r in d
                   if r.get('SpatialDim')==iso and r.get('NumericValue') is not None])
        data[iso].setdefault('capacities',{})[label]=rr[-1][1] if rr else None
        data[iso].setdefault('capacity_years',{})[label]=rr[-1][0] if rr else None
    time.sleep(0.1)
print("WHO done")

# ---- World Bank context + income classification ----
ISO=list(MENA); clist=';'.join(ISO)
WBIND={
 'SH.MED.BEDS.ZS':'beds','SH.MED.PHYS.ZS':'physicians','SH.MED.NUMW.P3':'nurses',
 'SH.XPD.CHEX.GD.ZS':'health_exp_gdp','SH.XPD.CHEX.PC.CD':'health_exp_pc',
 'SH.XPD.OOPC.CH.ZS':'oop','SH.IMM.MEAS':'imm_measles','SH.IMM.IDPT':'imm_dpt',
 'SH.H2O.SMDW.ZS':'water','SH.STA.SMSS.ZS':'sanitation','SP.POP.TOTL':'population',
 'SP.DYN.LE00.IN':'life_exp','SH.DYN.MORT':'u5mort'}
INDICATOR_LABELS={
 'beds':('Hospital beds','per 1,000 people','nonnegative','Higher availability is not a measure of readiness or quality.'),
 'physicians':('Physicians','per 1,000 people','nonnegative','Higher values indicate greater reported workforce availability.'),
 'nurses':('Nurses and midwives','per 1,000 people','nonnegative','Higher values indicate greater reported workforce availability.'),
 'health_exp_gdp':('Current health expenditure','% of GDP','percentage','Higher values are not inherently favourable.'),
 'health_exp_pc':('Current health expenditure per capita','current US$ per person','nonnegative','Higher spending is not inherently more efficient or effective.'),
 'oop':('Out-of-pocket expenditure','% of current health expenditure','percentage','Lower values may indicate stronger financial protection; context matters.'),
 'imm_measles':('Measles immunization','% of eligible children','percentage','Higher coverage is generally favourable.'),
 'imm_dpt':('DPT immunization','% of eligible children','percentage','Higher coverage is generally favourable.'),
 'water':('Safely managed drinking water','% of population','percentage','Higher service coverage is generally favourable.'),
 'sanitation':('Safely managed sanitation','% of population','percentage','Higher service coverage is generally favourable.'),
 'life_exp':('Life expectancy at birth','years','nonnegative','Higher values are generally favourable but are not a preparedness measure.'),
 'u5mort':('Under-five mortality','deaths per 1,000 live births','nonnegative','Lower values are generally favourable; interpret direction accordingly.')}
CONTEXT_SELECTORS={'beds','physicians','nurses','imm_measles','imm_dpt','water','sanitation','life_exp','u5mort'}
indicator_definitions=[{'key':key,'label':INDICATOR_LABELS[key][0],'definition':INDICATOR_LABELS[key][0]+' reported by the World Bank.','unit':INDICATOR_LABELS[key][1],'source_code':code,'source':'World Bank','scale':INDICATOR_LABELS[key][2],'direction':INDICATOR_LABELS[key][3],'context_selector':key in CONTEXT_SELECTORS} for code,key in WBIND.items() if key in INDICATOR_LABELS]
wb_errors=[]
for code,key in WBIND.items():
    latest={}
    for start in range(0,len(ISO),7):
        batch_codes=ISO[start:start+7]
        batch=';'.join(batch_codes)
        u=f"https://api.worldbank.org/v2/country/{batch}/indicator/{code}?format=json&mrv=8&per_page=1000"
        try: responses=[json.load(urllib.request.urlopen(u,timeout=120))]
        except Exception:
            responses=[]
            for iso in batch_codes:
                single=f"https://api.worldbank.org/v2/country/{iso}/indicator/{code}?format=json&mrv=8&per_page=100"
                try: responses.append(json.load(urllib.request.urlopen(single,timeout=60)))
                except Exception as e: wb_errors.append((f"{code}:{iso}",str(e)))
        for d in responses:
          if len(d)<2 or not d[1]: continue
          for r in d[1]:
            iso=r['countryiso3code']; v=r['value']
            if iso in data and v is not None:
                y=int(r['date'])
                if iso not in latest or y>latest[iso][0]: latest[iso]=(y,v)
    for iso,(y,v) in latest.items():
        data[iso].setdefault('context',{})[key]={'value':v,'year':y}
    time.sleep(0.08)

# income classification (per-country metadata)
for iso in ISO:
    try:
        d=json.load(urllib.request.urlopen(f"https://api.worldbank.org/v2/country/{iso}?format=json",timeout=30))
        meta=d[1][0]
        data[iso]['income']=meta['incomeLevel']['value']
        data[iso]['region']=meta['region']['value']
    except Exception as e:
        data[iso]['income']=None; print('inc err',iso,e)
    time.sleep(0.05)
print("WB done")
if wb_errors:
    raise RuntimeError(f"World Bank refresh incomplete; retaining last published dataset: {wb_errors}")

# ---- UNHCR refugee/IDP observations (latest available complete annual response) ----
def fetch_unhcr(year):
    url=f"https://api.unhcr.org/population/v1/population/?limit=2000&year={year}&coa_all=true"
    return json.load(urllib.request.urlopen(url,timeout=60))['items']

displacement_year,items=select_latest_available_year(fetch_unhcr,expected_complete_year(),lookback=4)
unhcr_endpoint="https://api.unhcr.org/population/v1/population/"
def n(x):
    try: return int(x)
    except: return 0
for iso in MENA:
    agg={'refugees':0,'asylum_seekers':0,'idps':0,'stateless':0,'returned':0}
    for it in items:
        if it.get('coa_iso')==iso:
            agg['refugees']+=n(it.get('refugees')); agg['asylum_seekers']+=n(it.get('asylum_seekers'))
            agg['idps']+=n(it.get('idps')); agg['stateless']+=n(it.get('stateless'))
            agg['returned']+=n(it.get('returned_refugees'))+n(it.get('returned_idps'))
    data[iso]['refugees']=agg
print("UNHCR done")

countries=list(data.values())
scores=sorted(c['ihr_composite'] for c in countries if c['ihr_composite'] is not None)
for c in countries:
    if c['ihr_composite'] is not None:
        c['rank']=1+sum(1 for score in scores if score>c['ihr_composite'])
capacity_order=[CAP[c] for c in sorted(CAP)]
capacity_median={cap:statistics.median([c.get('capacities',{}).get(cap) for c in countries
    if c.get('capacities',{}).get(cap) is not None]) for cap in capacity_order}
context_keys=sorted({key for c in countries for key in c.get('context',{})})
context_median={key:statistics.median([c['context'][key]['value'] for c in countries
    if key in c.get('context',{}) and c['context'][key].get('value') is not None]) for key in context_keys}
world_bank_years=[obs['year'] for c in countries for obs in c.get('context',{}).values() if obs.get('year') is not None]
capacity_years=[year for c in countries for year in c.get('capacity_years',{}).values() if year is not None]
source_refresh={
  'who_composite':{'endpoint':'https://ghoapi.azureedge.net/api/SDGIHR2021','status':'success','retrieved_at':retrieved_at,'coverage':sum(c['ihr_composite'] is not None for c in countries),'reference_year':who_composite_year},
  'who_capacities':{'endpoint':'https://ghoapi.azureedge.net/api/IHRSPAR2_C02..C15','status':'success','retrieved_at':retrieved_at,'coverage':sum(any(v is not None for v in c.get('capacities',{}).values()) for c in countries),'reference_year':observation_year_range(capacity_years)},
  'world_bank':{'endpoint':'https://api.worldbank.org/v2/','status':'success','retrieved_at':retrieved_at,'coverage':sum(bool(c.get('context')) for c in countries),'reference_year':observation_year_range(world_bank_years)},
  'unhcr':{'endpoint':unhcr_endpoint,'status':'success','retrieved_at':retrieved_at,'coverage':len({it.get('coa_iso') for it in items if it.get('coa_iso') in MENA}),'reference_year':displacement_year},
  'conflict_classification':{'endpoint':'World Bank FY25 FCS list (versioned repository classification)','status':'static','retrieved_at':retrieved_at,'coverage':len(countries),'reference_year':'FY25'},
}

out={'meta':{'generated':time.strftime('%Y-%m-%d'),
      'last_successful_refresh':retrieved_at,
      'schema_version':'3.0.0',
      'displacement_year':displacement_year,
      'sources':['WHO GHO (SDGIHR2021, IHRSPAR2)','World Bank Open Data','UNHCR Refugee Statistics'],
      'source_refresh':source_refresh,
      'capacity_order':capacity_order,
      'indicator_definitions':indicator_definitions,
      'fcs_note':'World Bank FY25 Fragile & Conflict-affected Situations list',
      'region_median':statistics.median(scores),
      'region_mean':round(statistics.mean(scores),1),
      'capacity_median':capacity_median,
      'context_median':context_median,
      'n_countries':len(countries),
      'n_conflict':sum(1 for c in countries if c['conflict']),
      'n_below60':sum(1 for c in countries if c['ihr_composite'] is not None and c['ihr_composite']<60)},
     'countries':countries}

assert len(countries)==21, f"expected 21 countries, got {len(countries)}"
assert all(c['iso3'] != 'ISR' for c in countries), "out-of-scope country found"
assert all(0 <= score <= 100 for score in scores), "SPAR score outside 0–100"
assert len({c['iso3'] for c in countries})==len(countries), "duplicate country ISO3"
payload=json.dumps(out,indent=1)+"\n"
def validate_payload(candidate):
    parsed=json.loads(candidate)
    assert len(parsed['countries'])==21
    assert parsed['meta']['source_refresh']['who_composite']['status']=='success'
    assert parsed['meta']['source_refresh']['world_bank']['status']=='success'
    assert parsed['meta']['source_refresh']['unhcr']['status']=='success'

publish_candidates(payload,[Path('data.json'),Path('public/data.json')],validate_payload)
print("WROTE data.json  countries=",len(out['countries']))
# sanity
lb=data['LBN']
print("Lebanon:",lb['ihr_composite'],lb['income'],lb['conflict'],"refugees=",lb['refugees']['refugees'],
      "beds=",lb.get('context',{}).get('beds'))
