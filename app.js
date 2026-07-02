/* ===== MENA Preparedness Dashboard app ===== */
const M = DATA.meta, C = DATA.countries;
const byIso = Object.fromEntries(C.map(c=>[c.iso3,c]));
const capOrder = M.capacity_order;
const PAL = {focal:'#e8534e',accent:'#38bdf8',good:'#34d399',warn:'#fbbf24',bad:'#f87171',
  muted:'#93a3bd',ink:'#eef3fb',gulf:'#38bdf8',conf:'#e8846b',peace:'#5eead4',line:'#2a3750',card:'#1a2436'};
const AX={axisLine:{lineStyle:{color:'#33425e'}},axisLabel:{color:'#93a3bd',fontSize:11},
  splitLine:{lineStyle:{color:'#1e2a40'}},nameTextStyle:{color:'#93a3bd'}};
const TIP={backgroundColor:'#0c1422',borderColor:'#2a3750',textStyle:{color:'#eef3fb',fontSize:12}};
const fmt=n=>n==null?'\u2014':(typeof n==='number'?(Math.abs(n)>=1e6?(n/1e6).toFixed(1)+'M':Math.abs(n)>=1e3?(n/1e3).toFixed(0)+'k':n.toLocaleString()):n);
function cval(c,k){const v=(c.context||{})[k];return v?v.value:null;}
const charts=[];
function mk(id){const el=document.getElementById(id);if(!el)return null;const ch=echarts.init(el,null,{renderer:'canvas'});charts.push(ch);return ch;}
window.addEventListener('resize',()=>charts.forEach(c=>c.resize()));

/* score color ramp */
function scoreColor(v){
  if(v==null) return '#33425e';
  const stops=[[33,'#c0392b'],[50,'#e67e22'],[65,'#f1c40f'],[80,'#7dcea0'],[100,'#1e8449']];
  for(const s of stops){ if(v<=s[0]) return s[1]; }
  return '#1e8449';
}

/* ---------------- OVERVIEW ---------------- */
function buildKPIs(){
  const scored=C.filter(c=>c.ihr_composite!=null);
  const best=scored.reduce((a,b)=>a.ihr_composite>b.ihr_composite?a:b);
  const totalRef=C.reduce((s,c)=>s+((c.refugees||{}).refugees||0)+((c.refugees||{}).idps||0),0);
  const kpis=[
    {lbl:'Regional median',val:M.region_median,sub:'IHR composite (0\u2013100)',color:PAL.accent},
    {lbl:'Best prepared',val:best.ihr_composite,sub:best.name,color:PAL.good},
    {lbl:'Below readiness (60)',val:M.n_below60+' / '+M.n_countries,sub:'countries under threshold',color:PAL.warn},
    {lbl:'Conflict-affected',val:M.n_conflict+' / '+M.n_countries,sub:'WB fragile situations',color:PAL.focal},
    {lbl:'Forcibly displaced hosted',val:fmt(totalRef),sub:'refugees + IDPs (UNHCR \u201924)',color:PAL.gulf},
  ];
  document.getElementById('kpis').innerHTML=kpis.map(k=>'<div class="kpi"><div class="lbl">'+k.lbl+'</div><div class="val" style="color:'+k.color+'">'+k.val+'</div><div class="sub">'+k.sub+'</div></div>').join('');
}

function buildMap(){
  echarts.registerMap('MENA',GEO);
  const ch=mk('map');
  const dd=C.map(c=>({name:c.name,value:c.ihr_composite,iso3:c.iso3}));
  ch.setOption({
    tooltip:Object.assign({},TIP,{formatter:function(p){const c=byIso[(p.data&&p.data.iso3)]; if(!c)return p.name;
      return '<b>'+c.name+'</b><br/>IHR score: <b>'+(c.ihr_composite==null?'\u2014':c.ihr_composite)+'</b> (rank '+(c.rank||'\u2014')+')<br/>'+(c.conflict?'\u26a0 Conflict-affected':'Stable setting')+' \u00b7 '+(c.income||'')+'<br/><span style="color:#93a3bd">click to open profile</span>';}}),
    visualMap:{min:30,max:100,left:12,bottom:14,calculable:true,
      inRange:{color:['#c0392b','#e67e22','#f1c40f','#7dcea0','#1e8449']},
      textStyle:{color:'#93a3bd'},text:['prepared','fragile']},
    series:[{type:'map',map:'MENA',roam:true,data:dd,nameProperty:'name',
      itemStyle:{borderColor:'#0e1420',borderWidth:.8,areaColor:'#33425e'},
      emphasis:{itemStyle:{areaColor:'#ffd166'},label:{show:false}},
      select:{itemStyle:{areaColor:'#ffd166'}},
      label:{show:false}}]
  });
  ch.on('click',function(p){const c=byIso[(p.data&&p.data.iso3)]; if(c) openCountry(c.iso3);});
}

function buildRank(){
  const ch=mk('rankbar');
  const s=C.filter(c=>c.ihr_composite!=null).sort((a,b)=>a.ihr_composite-b.ihr_composite);
  ch.setOption({
    grid:{left:110,right:34,top:10,bottom:28},
    tooltip:Object.assign({},TIP,{formatter:p=>'<b>'+p.name+'</b><br/>IHR: '+p.value}),
    xAxis:Object.assign({max:100,name:'IHR score'},AX),
    yAxis:Object.assign({type:'category',data:s.map(c=>c.name)},AX,{axisLabel:{color:'#c8d4e6',fontSize:11}}),
    series:[{type:'bar',data:s.map(c=>({value:c.ihr_composite,iso3:c.iso3,
        itemStyle:{color:scoreColor(c.ihr_composite),borderRadius:[0,4,4,0]}})),
      barWidth:'62%',
      label:{show:true,position:'right',color:'#cdd8ea',fontSize:10,formatter:p=>p.value},
      markLine:{silent:true,symbol:'none',data:[{xAxis:M.region_median}],
        lineStyle:{color:PAL.accent,type:'dashed'},label:{formatter:'median '+M.region_median,color:PAL.accent,fontSize:10}}}]
  });
  ch.on('click',p=>{if(p.data&&p.data.iso3)openCountry(p.data.iso3);});
}

function buildConflictBox(){
  const ch=mk('conflictbox');
  const groups=[['Conflict-affected',C.filter(c=>c.conflict&&c.ihr_composite!=null),PAL.conf],
                ['Stable setting',C.filter(c=>!c.conflict&&c.ihr_composite!=null),PAL.peace]];
  const cats=groups.map(g=>g[0]);
  const scatter=[];const means=[];
  groups.forEach((g,i)=>{const arr=g[1].map(c=>c.ihr_composite);
    const mean=arr.reduce((a,b)=>a+b,0)/arr.length;means.push(mean.toFixed(1));
    g[1].forEach(c=>scatter.push({value:[i,c.ihr_composite],name:c.name,iso3:c.iso3,
      itemStyle:{color:g[2]}}));});
  ch.setOption({
    grid:{left:44,right:20,top:22,bottom:30},
    tooltip:Object.assign({},TIP,{formatter:p=>p.data.name?'<b>'+p.data.name+'</b><br/>IHR: '+p.data.value[1]:''}),
    xAxis:Object.assign({type:'category',data:cats},AX,{axisLabel:{color:'#c8d4e6',fontSize:12}}),
    yAxis:Object.assign({min:20,max:100,name:'IHR score'},AX),
    series:[
      {type:'scatter',data:scatter,symbolSize:13,z:3,emphasis:{scale:1.4}},
      {type:'scatter',data:means.map((m,i)=>({value:[i,+m]})),symbol:'rect',symbolSize:[46,3],
        itemStyle:{color:'#eef3fb'},z:2,silent:true,
        label:{show:true,position:'right',formatter:p=>'\u03bc '+p.value[1],color:'#eef3fb',fontSize:11}}
    ]
  });
  ch.on('click',p=>{if(p.data&&p.data.iso3)openCountry(p.data.iso3);});
}

function buildIncomeScatter(){
  const ch=mk('incomescatter');
  const order=['Low income','Lower middle income','Upper middle income','High income'];
  const short={'Low income':'Low','Lower middle income':'Lower-mid','Upper middle income':'Upper-mid','High income':'High'};
  const data=C.filter(c=>c.ihr_composite!=null&&c.income).map(c=>{
    const pop=cval(c,'population')||1e6;
    return {value:[order.indexOf(c.income),c.ihr_composite],name:c.name,iso3:c.iso3,
      symbolSize:Math.max(9,Math.min(42,Math.sqrt(pop/1e6)*4)),
      itemStyle:{color:c.conflict?PAL.conf:PAL.accent,opacity:.82,borderColor:'#0e1420'}};});
  ch.setOption({
    grid:{left:44,right:20,top:16,bottom:44},
    tooltip:Object.assign({},TIP,{formatter:p=>'<b>'+p.data.name+'</b><br/>'+order[p.data.value[0]]+'<br/>IHR: '+p.data.value[1]}),
    xAxis:Object.assign({type:'value',min:-.5,max:3.5,interval:1},AX,
      {axisLabel:{color:'#93a3bd',formatter:v=>short[order[v]]||''},name:'income group \u2192'}),
    yAxis:Object.assign({min:20,max:100,name:'IHR score'},AX),
    series:[{type:'scatter',data:data}]
  });
  ch.on('click',p=>{if(p.data&&p.data.iso3)openCountry(p.data.iso3);});
}

function linfit(pts){
  const n=pts.length,sx=pts.reduce((a,p)=>a+p[0],0),sy=pts.reduce((a,p)=>a+p[1],0);
  const sxx=pts.reduce((a,p)=>a+p[0]*p[0],0),sxy=pts.reduce((a,p)=>a+p[0]*p[1],0);
  const b=(n*sxy-sx*sy)/(n*sxx-sx*sx),a=(sy-b*sx)/n;return {a:a,b:b};
}
function buildEff(){
  const ch=mk('effscatter');
  const rows=C.filter(c=>c.ihr_composite!=null&&cval(c,'health_exp_pc')).map(c=>({
    x:Math.log10(cval(c,'health_exp_pc')),y:c.ihr_composite,c:c}));
  const f=linfit(rows.map(r=>[r.x,r.y]));const a=f.a,b=f.b;
  const xs=rows.map(r=>r.x),xmin=Math.min.apply(null,xs),xmax=Math.max.apply(null,xs);
  const line=[[xmin,a+b*xmin],[xmax,a+b*xmax]];
  const data=rows.map(r=>{const resid=r.y-(a+b*r.x);
    return {value:[r.x,r.y],name:r.c.name,iso3:r.c.iso3,resid:resid,
      symbolSize:12,itemStyle:{color:resid>=0?PAL.good:PAL.bad,opacity:.85,borderColor:'#0e1420'}};});
  ch.setOption({
    grid:{left:44,right:20,top:16,bottom:42},
    tooltip:Object.assign({},TIP,{formatter:p=>p.data.name?'<b>'+p.data.name+'</b><br/>Spend/capita: $'+Math.round(Math.pow(10,p.data.value[0]))+'<br/>IHR: '+p.data.value[1]+'<br/>'+(p.data.resid>=0?'\u25b2 over':'\u25bc under')+'-performs spend by '+Math.abs(p.data.resid).toFixed(0):''}),
    xAxis:Object.assign({type:'value',name:'health spend / capita (US$, log)',min:xmin-.15,max:xmax+.15,
      axisLabel:{color:'#93a3bd',formatter:v=>'$'+(Math.pow(10,v)>=1000?(Math.pow(10,v)/1000).toFixed(0)+'k':Math.round(Math.pow(10,v)))}},AX),
    yAxis:Object.assign({min:20,max:100,name:'IHR score'},AX),
    series:[
      {type:'line',data:line,showSymbol:false,lineStyle:{color:PAL.muted,type:'dashed',width:1.4},silent:true,z:1},
      {type:'scatter',data:data,z:3}
    ]
  });
  ch.on('click',p=>{if(p.data&&p.data.iso3)openCountry(p.data.iso3);});
}

function buildCapBar(){
  const ch=mk('capbar');
  const rows=capOrder.map(cap=>({cap:cap,v:M.capacity_median[cap]})).sort((a,b)=>a.v-b.v);
  ch.setOption({
    grid:{left:158,right:30,top:8,bottom:26},
    tooltip:Object.assign({},TIP,{formatter:p=>'<b>'+p.name+'</b><br/>Regional median: '+p.value}),
    xAxis:Object.assign({max:100,name:'median score'},AX),
    yAxis:Object.assign({type:'category',data:rows.map(r=>r.cap)},AX,{axisLabel:{color:'#c8d4e6',fontSize:10.5}}),
    series:[{type:'bar',data:rows.map(r=>({value:r.v,itemStyle:{color:scoreColor(r.v),borderRadius:[0,4,4,0]}})),
      barWidth:'64%',label:{show:true,position:'right',color:'#cdd8ea',fontSize:10}}]
  });
}

function buildTrendAll(){
  const ch=mk('trendall');
  const movers={'Jordan':PAL.good,'Iraq':PAL.warn,'Lebanon':PAL.focal,'Sudan':PAL.bad};
  const years=[2021,2022,2023,2024,2025];
  const series=C.filter(c=>c.ihr_trend&&c.ihr_trend.length>1).map(c=>{
    const bold=movers[c.name];
    const dmap=Object.fromEntries(c.ihr_trend.map(p=>[p.year,p.value]));
    return {name:c.name,type:'line',showSymbol:!!bold,symbolSize:5,smooth:.2,
      data:years.map(y=>dmap[y]==null?null:dmap[y]),connectNulls:true,
      lineStyle:{color:bold||'#33425e',width:bold?3:1,opacity:bold?1:.5},
      itemStyle:{color:bold||'#33425e'},z:bold?5:1,
      endLabel:{show:!!bold,color:bold,fontSize:11,fontWeight:'bold',formatter:p=>p.seriesName}};});
  ch.setOption({
    grid:{left:40,right:74,top:14,bottom:28},
    tooltip:Object.assign({},TIP,{trigger:'item',formatter:p=>'<b>'+p.seriesName+'</b><br/>'+p.name+': '+p.value}),
    xAxis:Object.assign({type:'category',data:years,boundaryGap:false},AX),
    yAxis:Object.assign({min:20,max:100,name:'IHR score'},AX),
    series:series
  });
}

function buildRefScatter(){
  const ch=mk('refscatter');
  const rows=C.filter(c=>c.ihr_composite!=null&&c.refugees).map(c=>{
    const r=c.refugees;const hosted=(r.refugees||0)+(r.asylum_seekers||0)+(r.idps||0);
    const pop=cval(c,'population')||1;const pct=hosted/pop*100;
    return {value:[Math.max(hosted,100),c.ihr_composite],name:c.name,iso3:c.iso3,hosted:hosted,pct:pct,
      symbolSize:Math.max(9,Math.min(40,Math.sqrt(pct)*7)),
      itemStyle:{color:c.conflict?PAL.conf:PAL.accent,opacity:.82,borderColor:'#0e1420'}};});
  ch.setOption({
    grid:{left:52,right:20,top:16,bottom:42},
    tooltip:Object.assign({},TIP,{formatter:p=>'<b>'+p.data.name+'</b><br/>Hosted (ref+asy+IDP): '+fmt(p.data.hosted)+'<br/>= '+p.data.pct.toFixed(1)+'% of population<br/>IHR: '+p.data.value[1]}),
    xAxis:Object.assign({type:'log',name:'people hosted (log)',axisLabel:{color:'#93a3bd',formatter:v=>fmt(v)}},AX),
    yAxis:Object.assign({min:20,max:100,name:'IHR score'},AX),
    series:[{type:'scatter',data:rows}]
  });
  ch.on('click',p=>{if(p.data&&p.data.iso3)openCountry(p.data.iso3);});
}

/* ---------------- COUNTRY ---------------- */
function fillSelect(){
  const sel=document.getElementById('countrysel');
  sel.innerHTML=C.slice().sort((a,b)=>a.name.localeCompare(b.name))
    .map(c=>'<option value="'+c.iso3+'">'+c.name+'</option>').join('');
  sel.addEventListener('change',e=>renderCountry(e.target.value));
}
let cCharts={};
function cinit(id){const el=document.getElementById(id);let ch=cCharts[id];if(!ch){ch=echarts.init(el);cCharts[id]=ch;}return ch;}
function renderCountry(iso){
  const c=byIso[iso];if(!c)return;
  document.getElementById('countrysel').value=iso;
  document.getElementById('cbig').innerHTML=(c.ihr_composite==null?'\u2013':c.ihr_composite)+'<small>/100</small>';
  document.getElementById('cbig').style.color=scoreColor(c.ihr_composite);
  document.getElementById('crank').textContent='Regional rank '+(c.rank||'\u2014')+' of '+M.n_countries+' \u00b7 median '+M.region_median;
  document.getElementById('cpills').innerHTML=
    '<span class="badge '+(c.conflict?'b-conf':'b-peace')+'">'+(c.conflict?'\u26a0 Conflict-affected':'Stable setting')+'</span>'+
    '<span class="badge b-inc">'+(c.income||'\u2014')+'</span>'+
    (c.refugees?'<span class="badge b-inc">'+fmt((c.refugees.refugees||0)+(c.refugees.idps||0))+' displaced hosted</span>':'');
  buildNarr(c);buildSpark(c);buildRadar(c);buildGap(c);buildCtx(c);buildPeer(c);
  Object.values(cCharts).forEach(ch=>ch.resize());
}

function buildNarr(c){
  const caps=capOrder.map(k=>({k:k,v:(c.capacities||{})[k],m:M.capacity_median[k]})).filter(x=>x.v!=null);
  const strong=caps.filter(x=>x.v-x.m>=10).sort((a,b)=>(b.v-b.m)-(a.v-a.m)).slice(0,3);
  const weak=caps.filter(x=>x.v-x.m<=-10).sort((a,b)=>(a.v-a.m)-(b.v-b.m)).slice(0,3);
  const tr=c.ihr_trend||[];const delta=tr.length>1?(tr[tr.length-1].value-tr[0].value):0;
  const dir=delta>3?'improved by '+delta.toFixed(0)+' points':delta<-3?'declined by '+Math.abs(delta).toFixed(0)+' points':'stayed broadly flat';
  const pos=c.ihr_composite>=M.region_median?'above':'below';
  let s='<b>'+c.name+'</b> scores <b>'+(c.ihr_composite==null?'\u2014':c.ihr_composite)+'/100</b> on IHR core capacity \u2014 '+pos+' the regional median of '+M.region_median+' (rank '+c.rank+'/'+M.n_countries+'). ';
  s+='Since 2021 its preparedness has '+dir+'. ';
  if(weak.length) s+='Weakest relative to regional peers: '+weak.map(x=>x.k).join(', ')+'. ';
  if(strong.length) s+='Comparative strengths: '+strong.map(x=>x.k).join(', ')+'. ';
  const oop=cval(c,'oop');
  if(oop!=null&&oop>40) s+='High out-of-pocket spending ('+oop.toFixed(0)+'% of health expenditure) signals financial-protection risk during a health emergency. ';
  if(c.conflict) s+='As a conflict-affected setting, service continuity and surveillance face structural strain.';
  document.getElementById('cnarr').innerHTML=s;
}

function buildSpark(c){
  const ch=cinit('cspark');const tr=c.ihr_trend||[];
  ch.setOption({grid:{left:2,right:2,top:6,bottom:2},
    xAxis:{type:'category',show:false,data:tr.map(p=>p.year),boundaryGap:false},
    yAxis:{show:false,min:Math.min.apply(null,tr.map(p=>p.value))-6,max:Math.max.apply(null,tr.map(p=>p.value))+6},
    tooltip:Object.assign({},TIP,{trigger:'axis',formatter:p=>p[0].name+': '+p[0].value}),
    series:[{type:'line',data:tr.map(p=>p.value),smooth:.3,symbol:'circle',symbolSize:4,
      lineStyle:{color:scoreColor(c.ihr_composite),width:2.4},itemStyle:{color:scoreColor(c.ihr_composite)},
      areaStyle:{color:'rgba(232,83,78,.12)'}}]});
}

function buildRadar(c){
  const ch=cinit('cradar');
  const top=C.filter(x=>x.ihr_composite!=null).reduce((a,b)=>a.ihr_composite>b.ihr_composite?a:b);
  const ind=capOrder.map(k=>({name:k.length>20?k.slice(0,19)+'\u2026':k,max:100}));
  ch.setOption({
    tooltip:Object.assign({},TIP),
    legend:{data:[c.name,'Regional median',top.name+' (top)'],bottom:0,textStyle:{color:'#93a3bd',fontSize:11}},
    radar:{indicator:ind,radius:'66%',center:['50%','50%'],splitNumber:4,
      axisName:{color:'#a9b7cd',fontSize:9.5},
      splitLine:{lineStyle:{color:'#243149'}},splitArea:{areaStyle:{color:['#141d2e','#182234']}},
      axisLine:{lineStyle:{color:'#243149'}}},
    series:[{type:'radar',data:[
      {value:capOrder.map(k=>(c.capacities||{})[k]==null?0:(c.capacities||{})[k]),name:c.name,
        itemStyle:{color:PAL.focal},areaStyle:{color:'rgba(232,83,78,.28)'},lineStyle:{width:2}},
      {value:capOrder.map(k=>M.capacity_median[k]),name:'Regional median',
        itemStyle:{color:PAL.accent},lineStyle:{type:'dashed',width:1.6},areaStyle:{opacity:0}},
      {value:capOrder.map(k=>(top.capacities||{})[k]==null?0:(top.capacities||{})[k]),name:top.name+' (top)',
        itemStyle:{color:PAL.muted},lineStyle:{type:'dotted',opacity:.6},areaStyle:{opacity:0}}
    ]}]
  });
}

function buildGap(c){
  const ch=cinit('cgap');
  const rows=capOrder.map(k=>({k:k,d:((c.capacities||{})[k]==null?0:(c.capacities||{})[k])-M.capacity_median[k]}))
    .sort((a,b)=>a.d-b.d);
  ch.setOption({
    grid:{left:158,right:40,top:8,bottom:26},
    tooltip:Object.assign({},TIP,{formatter:p=>'<b>'+p.name+'</b><br/>'+(p.value>=0?'+':'')+p.value+' vs median'}),
    xAxis:Object.assign({name:'\u0394 vs regional median',min:-60,max:40},AX),
    yAxis:Object.assign({type:'category',data:rows.map(r=>r.k)},AX,{axisLabel:{color:'#c8d4e6',fontSize:10}}),
    series:[{type:'bar',data:rows.map(r=>({value:Math.round(r.d),
      itemStyle:{color:r.d>=0?PAL.accent:PAL.focal,borderRadius:r.d>=0?[0,4,4,0]:[4,0,0,4]}})),
      barWidth:'62%',label:{show:true,position:'outside',color:'#cdd8ea',fontSize:9.5,
        formatter:p=>(p.value>=0?'+':'')+p.value}}]
  });
}

function buildCtx(c){
  const ch=cinit('cctx');
  const defs=[['beds','Hospital beds /1k'],['physicians','Physicians /1k'],['nurses','Nurses /1k'],
    ['health_exp_gdp','Health exp %GDP'],['oop','Out-of-pocket %'],['imm_measles','Measles imm %'],
    ['life_exp','Life expectancy'],['u5mort','Under-5 mortality']];
  const cats=[],cvals=[],mvals=[];
  defs.forEach(function(d){const k=d[0],lbl=d[1];const v=cval(c,k),m=M.context_median[k];if(v!=null){cats.push(lbl);cvals.push(+v.toFixed(1));mvals.push(m);}});
  ch.setOption({
    grid:{left:120,right:40,top:10,bottom:24},
    tooltip:Object.assign({},TIP,{trigger:'axis',axisPointer:{type:'shadow'},
      formatter:p=>'<b>'+p[0].name+'</b><br/>'+c.name+': '+p[0].value+'<br/>Region median: '+mvals[p[0].dataIndex]}),
    xAxis:Object.assign({},AX),
    yAxis:Object.assign({type:'category',data:cats},AX,{axisLabel:{color:'#c8d4e6',fontSize:10.5}}),
    series:[
      {type:'bar',data:cvals,barWidth:'52%',
        itemStyle:{color:PAL.focal,borderRadius:[0,4,4,0]},
        label:{show:true,position:'right',color:'#cdd8ea',fontSize:10}},
      {type:'scatter',data:mvals.map((m,i)=>[m,i]),symbol:'rect',symbolSize:[3,20],
        itemStyle:{color:'#eef3fb'},z:5,silent:true}
    ]
  });
}

function buildPeer(c){
  const ch=cinit('cpeer');
  let peers=C.filter(x=>x.income===c.income&&x.ihr_composite!=null);
  let label='income-group peers ('+(c.income||'')+')';
  if(peers.length<3){peers=C.filter(x=>x.ihr_composite!=null);label='all MENA';}
  document.getElementById('cpeerdesc').textContent='Preparedness vs. '+label+'. Selected country highlighted.';
  peers=peers.sort((a,b)=>a.ihr_composite-b.ihr_composite);
  ch.setOption({
    grid:{left:110,right:34,top:8,bottom:24},
    tooltip:Object.assign({},TIP,{formatter:p=>'<b>'+p.name+'</b><br/>IHR: '+p.value}),
    xAxis:Object.assign({max:100},AX),
    yAxis:Object.assign({type:'category',data:peers.map(p=>p.name)},AX,{axisLabel:{color:'#c8d4e6',fontSize:10.5}}),
    series:[{type:'bar',data:peers.map(p=>({value:p.ihr_composite,iso3:p.iso3,
      itemStyle:{color:p.iso3===c.iso3?PAL.focal:'#3a4a68',borderRadius:[0,4,4,0]}})),
      barWidth:'62%',label:{show:true,position:'right',color:'#cdd8ea',fontSize:10}}]
  });
  ch.on('click',p=>{if(p.data&&p.data.iso3)openCountry(p.data.iso3);});
}

/* ---------------- view switching ---------------- */
function openCountry(iso){
  document.querySelectorAll('#viewtoggle button').forEach(b=>b.classList.toggle('active',b.dataset.v==='country'));
  document.getElementById('view-overview').classList.add('hide');
  document.getElementById('view-country').classList.remove('hide');
  renderCountry(iso);
}
function showOverview(){
  document.querySelectorAll('#viewtoggle button').forEach(b=>b.classList.toggle('active',b.dataset.v==='overview'));
  document.getElementById('view-country').classList.add('hide');
  document.getElementById('view-overview').classList.remove('hide');
  charts.forEach(c=>c.resize());
}
document.querySelectorAll('#viewtoggle button').forEach(b=>{
  b.addEventListener('click',()=>b.dataset.v==='overview'?showOverview():openCountry('LBN'));
});

/* ---------------- boot ---------------- */
document.getElementById('genmeta').textContent='\u00b7 data refreshed '+M.generated;
document.getElementById('foot').innerHTML=
  '<b>Sources:</b> '+DATA.meta.sources.join(' \u00b7 ')+'. '+
  'Preparedness = WHO IHR State Party Self-Assessment Report (SPAR) core-capacity score, self-reported (interpret as capacity signal, not external audit). '+
  'Conflict classification = '+M.fcs_note+'. Income groups = World Bank. Displacement = UNHCR, country of asylum, 2024. '+
  'Some indicators have partial country/year coverage; latest available value shown. Built for research use \u2014 not an official surveillance product.';
buildKPIs();buildMap();buildRank();buildConflictBox();buildIncomeScatter();buildEff();buildCapBar();buildTrendAll();buildRefScatter();
fillSelect();