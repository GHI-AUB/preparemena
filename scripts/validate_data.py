#!/usr/bin/env python3
import json, sys
from pathlib import Path

path=Path(sys.argv[1] if len(sys.argv)>1 else 'public/data.json')
data=json.loads(path.read_text())
errors=[]
countries=data.get('countries',[])
if len(countries)!=21: errors.append(f"expected 21 countries, got {len(countries)}")
codes=[c.get('iso3') for c in countries]
if 'ISR' in codes: errors.append('out-of-scope country code found')
if len(codes)!=len(set(codes)): errors.append('duplicate ISO3 codes')
meta=data.get('meta',{})
expected_capacities=set(meta.get('capacity_order',[]))
for c in countries:
    iso=c.get('iso3')
    score=c.get('ihr_composite')
    trend=c.get('ihr_trend',[])
    years=[point.get('year') for point in trend]
    if score is not None and not 0<=score<=100: errors.append(f"{c.get('iso3')}: composite outside 0–100")
    if score is None: errors.append(f'{iso}: missing composite')
    if not trend: errors.append(f'{iso}: missing composite trend')
    if years != sorted(set(years)): errors.append(f'{iso}: composite trend years must be unique and ascending')
    if trend and c.get('ihr_year') != trend[-1].get('year'): errors.append(f'{iso}: composite year does not match final trend observation')
    if trend and score != trend[-1].get('value'): errors.append(f'{iso}: composite score does not match final trend observation')
    if set(c.get('capacities',{})) != expected_capacities: errors.append(f'{iso}: capacity keys do not match capacity_order')
    if set(c.get('capacity_years',{})) != expected_capacities: errors.append(f'{iso}: capacity-year keys do not match capacity_order')
    for cap,value in c.get('capacities',{}).items():
        if value is not None and not 0<=value<=100: errors.append(f"{c.get('iso3')}: {cap} outside 0–100")
        year=c.get('capacity_years',{}).get(cap)
        if value is not None and year is None: errors.append(f"{c.get('iso3')}: {cap} missing reference year")
if not meta.get('generated'): errors.append('missing generation date')
if not meta.get('last_successful_refresh'): errors.append('missing refresh timestamp')
if not meta.get('displacement_year'): errors.append('missing displacement reference year')
required_sources={'who_composite','who_capacities','world_bank','unhcr','conflict_classification'}
if not required_sources.issubset(meta.get('source_refresh',{})): errors.append('incomplete source refresh metadata')
if meta.get('source_refresh',{}).get('who_composite',{}).get('coverage') != 21: errors.append('WHO composite coverage must be 21 countries')
if errors:
    print('\n'.join(errors),file=sys.stderr)
    raise SystemExit(1)
print(f"validated {len(countries)} countries from {path}")
