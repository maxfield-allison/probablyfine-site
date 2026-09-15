// Count deliberate actions using public identifiers only. Analytics never gates the reader.
function trackChronochasm(name, properties) {
  try { window.umami?.track(name, properties)?.catch?.(() => {}); } catch { /* tracker may be blocked */ }
}
'use strict';
const $=id=>document.getElementById(id);
const viewport=$('viewport'), timeline=$('timeline'), marks=$('marks');
const mobile=matchMedia('(max-width:600px)'), narrow=matchMedia('(max-width:1199px)'), reduced=matchMedia('(prefers-reduced-motion:reduce)');
let data, level=0, selected=null, opened=false, filter='all', motionPaused=false, frame=0, lastFrame=0;
let positions=new Map(), bars=[], nodeElements=[], connectorElements=[], leaderElements=[];
const driftStates=new Map();
const element=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const moment=id=>data.moments.find(m=>m.id===id);
const lane=id=>data.lanes.find(l=>l.id===id);
const thread=id=>data.threads.find(t=>t.id===id);
const dateLabel=date=>new Date(date).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).toUpperCase();
const sourceLabel=s=>s.kind+' · '+s.reference;
function animateFloat(now){
  frame=0;const dt=Math.min(50,now-lastFrame||16)/1000;lastFrame=now;
  for(const b of bars){const s=driftStates.get(b.dataset.moment);const still=motionPaused||reduced.matches||b.matches(':focus-visible,.selected,.engaged');
    const phase=now/1000*(.7+s.index*.027)+s.index*1.7;
    const targetX=still?0:Math.sin(phase)*(mobile.matches?1.5:4), targetY=0, targetR=0;
    const smoothing=1-Math.exp(-dt*(still?9:4));s.x+=(targetX-s.x)*smoothing;s.y+=(targetY-s.y)*smoothing;s.r+=(targetR-s.r)*smoothing;
    b.style.setProperty('--dx',s.x.toFixed(2)+'px');b.style.setProperty('--dy',s.y.toFixed(2)+'px');b.style.setProperty('--tilt',s.r.toFixed(3)+'deg');
  }
  syncGraphMotion();
  if(!document.hidden&&!reduced.matches)frame=requestAnimationFrame(animateFloat);
}
function visualPosition(id){const p=positions.get(id);return {...p,x:p.x+(reduced.matches?0:driftStates.get(id)?.x||0)};}
function syncGraphMotion(){
  for(const node of nodeElements)node.style.setProperty('--dx',(reduced.matches?0:driftStates.get(node.dataset.moment)?.x||0)+'px');
  for(const path of connectorElements)path.setAttribute('d',connectionPath(visualPosition(path.dataset.from),visualPosition(path.dataset.to)));
  for(const path of leaderElements){const id=path.dataset.moment,card=$('event-'+id);if(card?.classList.contains('engaged'))path.setAttribute('d',leaderPath(visualPosition(id),card));}
}
function startMotion(){if(frame)cancelAnimationFrame(frame);frame=0;lastFrame=0;if(reduced.matches){for(const b of bars){b.style.setProperty('--dx','0px');b.style.setProperty('--dy','0px');b.style.setProperty('--tilt','0deg');}syncGraphMotion();}else if(!document.hidden)frame=requestAnimationFrame(animateFloat);}
const DAY=86400000;
const SCALES=[192,2304,9216];
let foldedTime=true, timeSegments=[], expandAllGaps=false;
const expandedGaps=new Set();
let timeOrigin=0, chartOrigin=230, hoverMoment=null, focusMoment=null;
function timestamp(value){return typeof value==='number'?value:Date.parse(value);}
function timeY(value){
  const time=timestamp(value),part=timeSegments.find(s=>time>=s.start&&time<=s.end);
  if(part)return part.y0+(time-part.start)/(part.end-part.start)*(part.y1-part.y0);
  const edge=time<timeSegments[0].start?timeSegments[0]:timeSegments.at(-1);
  return (time<edge.start?edge.y0:edge.y1)+(time-(time<edge.start?edge.start:edge.end))/DAY*SCALES[level];
}
function timeAtY(y){
  const part=timeSegments.find(s=>y>=s.y0&&y<=s.y1);
  if(part)return part.start+(y-part.y0)/(part.y1-part.y0)*(part.end-part.start);
  const edge=y<timeSegments[0].y0?timeSegments[0]:timeSegments.at(-1);
  return (y<edge.y0?edge.start:edge.end)+(y-(y<edge.y0?edge.y0:edge.y1))/SCALES[level]*DAY;
}
function makeTimeMap(visible){
  const margin=90*60000,windows=[];
  for(const m of visible){
    const start=Date.parse(m.time.start);
    if(m.time.kind==='day')windows.push({start,end:start+DAY});
    else {
      windows.push({start:start-margin,end:start+margin});
      if(m.time.kind==='span'){const end=Date.parse(m.time.end);windows.push({start:end-margin,end:end+margin});}
    }
  }
  windows.sort((a,b)=>a.start-b.start);
  const merged=[];
  for(const window of windows){const last=merged.at(-1);if(last&&window.start-last.end<=48*3600000)last.end=Math.max(last.end,window.end);else merged.push({...window});}
  timeOrigin=merged[0].start;
  let y=chartOrigin;timeSegments=[];
  const add=(start,end,gap=false)=>{
    const key=start+'-'+end,folded=gap&&!expandAllGaps&&!expandedGaps.has(key);
    const height=folded?84:(end-start)/DAY*SCALES[level];
    timeSegments.push({start,end,y0:y,y1:y+height,folded,gap,key});y+=height;
  };
  for(let i=0;i<merged.length;i++){if(i)add(merged[i-1].end,merged[i].start,true);add(merged[i].start,merged[i].end);}
  foldedTime=timeSegments.some(part=>part.folded);

}
function timeDescription(m){
  const t=m.time;
  if(t.kind==='day')return dateLabel(t.start)+' · time unknown';
  const stamp=value=>dateLabel(value)+' '+new Date(value).toISOString().slice(11,16);
  if(t.kind==='point')return stamp(t.start)+' UTC · moment';
  const minutes=(Date.parse(t.end)-Date.parse(t.start))/60000;
  const duration=minutes>=1440?(minutes/1440).toFixed(1)+' days':minutes>=60?(minutes/60).toFixed(1)+' hours':minutes.toFixed(1)+' min';
  return stamp(t.start)+' → '+stamp(t.end)+' UTC · '+duration+' · recorded exchange';
}
function shownMoments(){return data.moments.filter(m=>filter==='all'||m.thread===filter).sort((a,b)=>Date.parse(a.time.start)-Date.parse(b.time.start));}
function capturePositions(){return new Map([...marks.querySelectorAll('.event')].map(e=>[e.dataset.moment,e.getBoundingClientRect().top]));}
function svgPath(svg,cls,d,color){
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('class',cls);path.setAttribute('d',d);path.setAttribute('stroke',color);svg.append(path);return path;
}
// Route in chronological order, without control points outside the endpoint bounds.
function connectionPath(a,b){
  if(a.y>b.y)[a,b]=[b,a];
  if(Math.abs(a.x-b.x)<.01||Math.abs(a.y-b.y)<.01)return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  const middle=(a.y+b.y)/2,bend=Math.min(36,(b.y-a.y)/2);
  return `M ${a.x} ${a.y} L ${a.x} ${middle-bend} C ${a.x} ${middle}, ${b.x} ${middle}, ${b.x} ${middle+bend} L ${b.x} ${b.y}`;
}
function leaderPath(p,card){
  const left=card.offsetLeft,top=card.offsetTop,right=left+card.offsetWidth,bottom=top+card.offsetHeight;
  let x,y;
  if(p.x<left){x=left-8;y=Math.max(top+18,Math.min(p.y,bottom-18));}
  else if(p.x>right){x=right+8;y=Math.max(top+18,Math.min(p.y,bottom-18));}
  else{x=p.x;y=p.y<top?top-8:bottom+8;}
  const middle=(p.x+x)/2;
  return `M ${p.x} ${p.y} C ${middle} ${p.y}, ${middle} ${y}, ${x} ${y}`;
}
// Resolve overlapping generous targets by geometry, not DOM stacking order.
function nearestMoment(clientX,clientY){
  const bounds=timeline.getBoundingClientRect(),x=clientX-bounds.left,y=clientY-bounds.top;
  let nearest=null,best=Infinity;
  for(const [id,p] of positions){
    const dx=Math.abs(x-visualPosition(id).x),dy=Math.max(p.y-y,0,y-p.end);
    if(dx>24||dy>24)continue;
    const distance=Math.hypot(dx,dy);
    if(distance<best){best=distance;nearest=id;}
  }
  return nearest;
}
function pointerMoment(event){
  if(event.target.closest('.event,.time-break'))return null;
  return nearestMoment(event.clientX,event.clientY);
}
function hoverActivity(event){
  if(mobile.matches||event.pointerType==='touch'||event.target.closest('.event,.time-break'))return;
  const id=pointerMoment(event);clearTimeout(hoverExit);
  if(id){if(hoverMoment!==id){hoverMoment=id;updateConnections();}}
  else hoverExit=setTimeout(()=>{hoverMoment=null;updateConnections();},300);
}
function positionPreview(id){
  const card=$('event-'+id),p=positions.get(id);if(!card||!p)return;
  if(mobile.matches){card.style.width=(timeline.clientWidth-40)+'px';card.style.left='20px';}
  const top=Math.max(viewport.scrollTop+16,Math.min(p.y+24,viewport.scrollTop+viewport.clientHeight-card.offsetHeight-130));
  card.style.top=top+'px';
  const leader=marks.querySelector('.label-leader[data-moment="'+id+'"]');
  if(leader)leader.setAttribute('d',leaderPath(p,card));
}
function updateConnections(){
  const active=hoverMoment||focusMoment||(opened?selected:null);
  const neighbors=new Set(active?[active]:[]);
  for(const path of marks.querySelectorAll('.connection')){
    const related=path.dataset.from===active||path.dataset.to===active;
    path.classList.toggle('related',related);
    if(related){neighbors.add(path.dataset.from);neighbors.add(path.dataset.to);}
  }
  timeline.classList.toggle('has-engagement',!!active);
  for(const el of marks.querySelectorAll('.event,.activity,.label-leader')){
    el.classList.toggle('connected',neighbors.has(el.dataset.moment));
    el.classList.toggle('engaged',el.dataset.moment===active);
    if(mobile.matches&&el.classList.contains('featured')&&el.dataset.moment!==active){el.style.left='154px';el.style.width=(timeline.clientWidth-170)+'px';const position=positions.get(el.dataset.moment);if(position)el.style.top=position.labelY+'px';}
  }
  for(const card of marks.querySelectorAll('.event'))card.classList.remove('occluded');
  if(active){
    positionPreview(active);
    const front=$('event-'+active),r=front?.getBoundingClientRect();
    if(r)for(const card of marks.querySelectorAll('.event.featured')){
      if(card===front)continue;const other=card.getBoundingClientRect();
      if(other.left<r.right+12&&other.right>r.left-12&&other.top<r.bottom+12&&other.bottom>r.top-12)card.classList.add('occluded');
    }
  }
  syncGraphMotion();
}
function render({anchor=null,animate=false}={}){
  const old=animate?capturePositions():new Map(), visible=shownMoments();
  bars=[];nodeElements=[];connectorElements=[];leaderElements=[];positions=new Map();hoverMoment=null;focusMoment=null;marks.replaceChildren();
  const compact=mobile.matches, width=timeline.clientWidth;
  const railWidth=compact?94:208, railLeft=compact?42:(width-railWidth)/2;
  const cardWidth=compact?width-40:Math.min(380,width*.48);
  const labelLeft=compact?20:width-cardWidth-20;
  chartOrigin=Math.max(compact?240:220,document.querySelector('.intro').offsetTop+document.querySelector('.intro').offsetHeight+36);
  makeTimeMap(visible);
  // Subtracks depend on temporal overlap, including a small accessible point target.
  // Vertical position and the visible interval length never depend on label height.
  const laneSlots=new Map();
  for(const l of data.lanes){
    const ends=[];
    for(const m of visible.filter(m=>m.lane===l.id)){
      const y=timeY(m.time.start), end=m.time.kind==='span'?timeY(m.time.end):m.time.kind==='day'?timeY(Date.parse(m.time.start)+DAY):y;
      let slot=ends.findIndex(value=>value<=y-22);if(slot<0)slot=ends.length;
      ends[slot]=Math.max(end,y+2)+22;
      positions.set(m.id,{y,end,slot,m});
    }
    laneSlots.set(l.id,Math.max(1,ends.length));
  }
  const totalSlots=[...laneSlots.values()].reduce((sum,n)=>sum+n,0), slotWidth=railWidth/totalSlots;
  let offset=0;
  for(const l of data.lanes){
    const count=laneSlots.get(l.id), center=railLeft+(offset+count/2)*slotWidth;
    const rail=element('div','rail');rail.style.cssText='left:'+center+'px;top:'+chartOrigin+'px;background:'+l.color+'22';rail.dataset.lane=l.id;marks.append(rail);
    for(const p of positions.values())if(p.m.lane===l.id)p.x=railLeft+(offset+p.slot+.5)*slotWidth;
    offset+=count;
  }
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('graph');svg.setAttribute('aria-hidden','true');marks.append(svg);
  
  let lastFeaturedBottom=-Infinity;
  for(const m of visible){
    const p=positions.get(m.id),color=lane(m.lane).color;
    const bar=element('button','activity '+m.time.kind+(m.id===selected?' selected':''));
    const hitHeight=p.end-p.y+48;
    bar.dataset.moment=m.id;bar.dataset.timeY=String(p.y);bar.dataset.timeX=String(p.x);bar.dataset.start=String(Date.parse(m.time.start));bar.dataset.end=String(m.time.kind==='span'?Date.parse(m.time.end):Date.parse(m.time.start));
    bar.style.cssText='left:'+(p.x-24)+'px;top:'+(p.y-24)+'px;height:'+hitHeight+'px;--tone:'+color+';--duration:'+Math.max(0,p.end-p.y)+'px';
    bar.setAttribute('aria-label','Read '+m.title+'. '+timeDescription(m));bar.setAttribute('aria-pressed',String(m.id===selected));
    const drift=element('span','drift');bar.append(drift);bar.title=timeDescription(m)+'\n'+m.time.note;
    bar.addEventListener('click',()=>openStory(m.id));marks.append(bar);bars.push(bar);
    if(!driftStates.has(m.id))driftStates.set(m.id,{x:0,y:0,r:0,index:data.moments.indexOf(m)});
    const node=element('span','event-node');node.dataset.moment=m.id;node.style.cssText='top:'+p.y+'px;left:'+(p.x-4)+'px;background:'+color;marks.append(node);nodeElements.push(node);
    const card=element('button','event'+(m.id===selected?' selected':''));card.id='event-'+m.id;card.dataset.moment=m.id;card.style.width=cardWidth+'px';card.style.setProperty('--lane',color);
    card.setAttribute('aria-expanded',String(opened&&selected===m.id));card.setAttribute('aria-controls','reader');
    card.append(element('span','date',thread(m.thread).name.toUpperCase()),element('strong','',m.title),element('small','',m.deck),element('small','moment-time',m.time.kind==='day'?'Date only':new Date(m.time.start).toISOString().slice(11,16)+' UTC'+(m.time.kind==='span'?' · recorded exchange':' · moment')));
    card.append(element('span','read','Read this moment →'));
    if(level===2)card.append(element('span','chapter-detail',m.sources.length+' selected sources'));
    card.addEventListener('click',()=>openStory(m.id));marks.append(card);
    const top=p.y+24,left=labelLeft;card.style.top=top+'px';card.style.left=left+'px';
    p.labelY=top;p.labelX=left;
    if(top>=lastFeaturedBottom+24){card.classList.add('featured');if(compact){card.style.left='154px';card.style.width=(width-170)+'px';}lastFeaturedBottom=top+card.offsetHeight;}
    const leader=svgPath(svg,'label-leader',leaderPath(p,card),color);leader.dataset.moment=m.id;leaderElements.push(leader);
  }
  for(const rel of data.relations){
    const a=positions.get(rel.from),b=positions.get(rel.to);if(!a||!b)continue;
    const path=svgPath(svg,'connection '+rel.kind,connectionPath(a,b),lane(b.m.lane).color);
    path.dataset.from=rel.from;path.dataset.to=rel.to;connectorElements.push(path);const title=document.createElementNS(svg.namespaceURI,'title');title.textContent=rel.label;path.append(title);
  }
  const lastTime=Math.max(...[...positions.values()].map(p=>p.end));
  const contentEnd=lastTime+100,height=contentEnd+280;
  timeline.style.height=height+'px';svg.setAttribute('height',String(height));
  for(const rail of marks.querySelectorAll('.rail'))rail.style.height=(contentEnd-chartOrigin)+'px';
  const tickHours=[6,2,.5][level],tickStep=DAY*tickHours/24;
  for(const part of timeSegments){
    if(part.gap){
      const gap=element('button','time-break');gap.style.top=part.y0+'px';gap.style.height=(part.folded?part.y1-part.y0:44)+'px';gap.dataset.gap=part.key;gap.setAttribute('aria-expanded',String(!part.folded));gap.classList.toggle('expanded',!part.folded);
      const hours=(part.end-part.start)/3600000;gap.textContent=(hours>=24?(hours/24).toFixed(1)+' days':hours.toFixed(1)+' hours')+' between selected records · '+(part.folded?'expand':'collapse');
      gap.title=(part.folded?'Expand':'Collapse')+' this interval. No additional moments have been selected within it.';
      gap.addEventListener('click',()=>toggleGap(part));marks.append(gap);if(part.folded)continue;
    }
    const startTick=Math.ceil(part.start/tickStep)*tickStep;
    for(let time=startTick;time<=part.end;time+=tickStep){
      const y=timeY(time),midnight=time%DAY===0;
      const tick=element('div','time-tick'+(midnight?' day-tick':''));tick.style.top=y+'px';tick.dataset.time=String(time);
      tick.append(element('span','',dateLabel(time)+(midnight?'':' · '+new Date(time).toISOString().slice(11,16))));marks.append(tick);
    }
  }
  const end=element('p','end-note','Within each unfolded section, vertical distance follows time. Labelled breaks fold intervals between selected records. Hover or focus a moment to see its story and connections. Click to read. Bars show retained exchanges. Later returns have separate moments, joined by dotted connections. Hollow day bands mean the time is unknown.');end.style.top=(contentEnd+50)+'px';marks.append(end);
  if(anchor)viewport.scrollTop=timeY(anchor.time)-anchor.y;
  if(animate&&!reduced.matches)for(const e of marks.querySelectorAll('.event')){
    const before=old.get(e.dataset.moment);if(before!==undefined)e.animate([{translate:'0 '+(before-e.getBoundingClientRect().top)+'px'},{translate:'0 0'}],{duration:360,easing:'cubic-bezier(.22,1,.36,1)'});
  }
  $('zoom-out').disabled=level===0;$('zoom-in').disabled=level===2;
  document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.level===level)));
  $('depth-hint').textContent=['1 hour / 8 px','1 hour / 96 px','1 hour / 384 px'][level]+' · '+(foldedTime?'gaps folded':'full elapsed time')+' · zoom to separate moments';
  const gaps=timeSegments.filter(part=>part.gap),expanded=gaps.filter(part=>!part.folded).length;
  $('expand-gaps').disabled=expanded===gaps.length;$('collapse-gaps').disabled=expanded===0;
  $('gap-status').textContent=gaps.length?expanded+' of '+gaps.length+' gaps expanded':'No skipped intervals';
  $('browse-moments').textContent='Browse all '+data.moments.length+' moments';updateConnections();updateCurrentDate();startMotion();
}
function toggleGap(part){
  trackChronochasm('chronochasm-control',{control:'gaps',scope:'interval',expanded:part.folded});
  const anchor={time:part.start,y:part.y0-viewport.scrollTop};
  if(expandAllGaps){
    for(const gap of timeSegments.filter(p=>p.gap))expandedGaps.add(gap.key);
    expandAllGaps=false;
  }
  if(part.folded)expandedGaps.add(part.key);else expandedGaps.delete(part.key);
  render({anchor});
  const button=[...marks.querySelectorAll('.time-break')].find(e=>e.dataset.gap===part.key);button?.focus({preventScroll:true});
}
function setAllGaps(expand){
  trackChronochasm('chronochasm-control',{control:'gaps',scope:'all',expanded:expand});
  const anchor=anchorAtCurrentPosition();expandedGaps.clear();expandAllGaps=expand;render({anchor});
  // The invoked control becomes disabled, so leave keyboard focus on its inverse.
  $(expand?'collapse-gaps':'expand-gaps').focus({preventScroll:true});
  $('announcement').textContent=expand?'All timeline gaps expanded':'All timeline gaps collapsed';
}
function openMomentIndex(){
  trackChronochasm('chronochasm-control',{control:'browse'});
  const list=$('moment-list');list.replaceChildren();
  for(const m of data.moments){
    const button=element('button','moment-index-item');button.dataset.moment=m.id;
    button.append(element('small','',dateLabel(m.time.start)+' · '+thread(m.thread).name),element('strong','',m.title));
    button.addEventListener('click',()=>{$('moment-index').close();openStory(m.id,{travel:true});});list.append(button);
  }
  $('moment-index-count').textContent=data.moments.length+' moments across '+data.threads.length+' threads. Every passage is listed, including those revealed on hover.';
  $('moment-index').showModal();
}
function anchorAtCurrentPosition(){
  const choice=positions.get(hoverMoment||focusMoment||selected);
  if(choice){const y=choice.y-viewport.scrollTop;if(y>=0&&y<viewport.clientHeight-120)return{time:Date.parse(choice.m.time.start),y};}
  const y=viewport.clientHeight*.4;
  return{time:timeAtY(viewport.scrollTop+y),y};
}
function updateCurrentDate(){
  const time=timeAtY(Math.max(chartOrigin,viewport.scrollTop));
  $('current-date').textContent=dateLabel(time)+' · '+['CHAPTERS','MOMENTS','HOURS'][level];
  document.querySelector('header.site').classList.toggle('scrolled',viewport.scrollTop>20);
  const active=hoverMoment||focusMoment||(opened?selected:null);for(const card of marks.querySelectorAll('.event'))card.classList.remove('occluded');
  if(active){
    positionPreview(active);
    const front=$('event-'+active),r=front?.getBoundingClientRect();
    if(r)for(const card of marks.querySelectorAll('.event.featured')){
      if(card===front)continue;const other=card.getBoundingClientRect();
      if(other.left<r.right+12&&other.right>r.left-12&&other.top<r.bottom+12&&other.bottom>r.top-12)card.classList.add('occluded');
    }
  }
  syncGraphMotion();
}
function zoom(next){next=Math.max(0,Math.min(2,next));if(next===level)return;const anchor=anchorAtCurrentPosition();level=next;trackChronochasm('chronochasm-control',{control:'zoom',level:['chapters','moments','hours'][level]});render({anchor,animate:true});$('announcement').textContent=['Weeks in view','Days in view','Hours in view'][level];}
function sourceButton(id,label){const b=element('button','source-button',label||data.sources[id].reference);b.addEventListener('click',()=>openSource(id));return b;}
function openSource(id){
  const source=data.sources[id],detail=source.detail;
  $('source-title').textContent=source.reference;
  $('source-meta').textContent=source.kind+' · '+dateLabel(source.date);
  $('source-layer-label').textContent=detail?.kind==='exchange'?'SELECTED EXCHANGE':'SELECTED WORK RECORD';
  $('source-context').textContent=detail?.note||source.context;
  const body=$('source-selection');body.replaceChildren();
  if(detail){
    const turns=element('ol','source-turns');
    for(const selection of detail.selections){
      const turn=element('li','source-turn');
      const header=element('div','source-turn-heading');
      header.append(element('strong','',selection.speaker));
      const time=element('time','',new Date(selection.date).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'UTC'})+' UTC');
      time.dateTime=selection.date;header.append(time);turn.append(header);
      if(selection.reference)turn.append(element('p','source-turn-reference',selection.reference));
      selection.text.split('\n\n[…]\n\n').forEach((part,index)=>{
        if(index)turn.append(element('p','source-omission','[…]'));
        turn.append(element('blockquote','source-words',part));
      });
      turns.append(turn);
    }
    body.append(turns);
  }else{
    const excerpt=element('blockquote','source-words',source.excerpt);excerpt.id='source-excerpt';body.append(excerpt);
  }
  $('source-scope').textContent=detail?'Selected original words, with omissions noted above. The complete conversation or issue is not included.':'This retained selection is the available source here; no fuller exchange is included.';
  $('source').showModal();$('source-scroll').scrollTop=0;
  trackChronochasm('chronochasm-source',{source:id,moment:selected});
}
function renderReadingNavigation(id){
  const host=$('reader-navigation');host.replaceChildren();
  const chapter=data.chapters?.find(c=>c.moments.includes(id));
  const index=chapter?chapter.moments.indexOf(id):0;
  const nav=element('nav','passage-navigation');nav.setAttribute('aria-label',chapter?'Read through '+chapter.title:'Passage navigation');
  const progress=element('p','passage-progress',chapter?chapter.title+' · '+(index+1)+' of '+chapter.moments.length:'A standalone moment');
  progress.title=progress.textContent;nav.append(progress);
  const links=element('div','passage-steps');
  for(const [offset,label] of [[-1,'Previous passage'],[1,'Continue reading']]){
    const target=chapter&&moment(chapter.moments[index+offset]);
    const button=element('button','passage-link');button.dataset.direction=String(offset);
    const title=target?target.title:(offset===-1?'Beginning of this thread':'End of this thread');
    button.append(element('small','',label),element('strong','',title));
    button.title=title;button.setAttribute('aria-label',label+': '+title);button.disabled=!target;
    if(target){button.dataset.target=target.id;button.addEventListener('click',()=>{
      trackChronochasm('chronochasm-navigation',{direction:offset===-1?'previous':'next',moment:target.id});
      level=Math.max(level,1);openStory(target.id,{travel:true});
      const next=$('reader-navigation').querySelector('[data-direction="'+offset+'"]');
      if(!next.disabled)next.focus({preventScroll:true});
    });}
    links.append(button);
  }
  nav.append(links);host.append(nav);
}
function renderPassage(article,id,{headingId,onNavigate=target=>{trackChronochasm('chronochasm-navigation',{direction:'related',moment:target});openStory(target,{travel:true});}}={}){
  const m=moment(id);article.replaceChildren();const eyebrow=element('p','eyebrow',dateLabel(m.date)+' · '+lane(m.lane).name.toUpperCase());eyebrow.style.color=lane(m.lane).color;const heading=element('h2','',m.title);heading.id=headingId;article.append(eyebrow,heading,element('p','deck',m.deck));article.append(element('p','date-note',timeDescription(m)+'. '+m.time.note));if(m.dateNote)article.append(element('p','date-note',m.dateNote));
  m.paragraphs.forEach((p,i)=>{article.append(element('p','',p));if(m.quote&&i===(m.quoteAfter??Math.min(1,m.paragraphs.length-1))){const s=data.sources[m.quote];article.append(element('blockquote','',m.quoteText||s.excerpt),element('div','quote-attribution',s.kind),sourceButton(m.quote,s.detail?.kind==='exchange'?'Read the exchange behind this passage ↗':'Read the work record behind this passage ↗'));}});
  const links=element('div','reader-links');for(const l of m.links||[]){const a=element('a','',l.label+' ↗');a.href=l.url;a.target='_blank';a.rel='noopener';a.dataset.track='chronochasm-link';a.dataset.trackWhere='story';const destination=new URL(l.url,location.origin);a.dataset.trackDestination=destination.host+destination.pathname;links.append(a);}if(links.childElementCount)article.append(links);
  article.append(element('div','section-rule'),element('h3','related-heading','THE RECORD BEHIND THIS MOMENT'));const sources=element('div','source-list');m.sources.forEach((id,i)=>sources.append(sourceButton(id,String(i+1).padStart(2,'0')+' · '+data.sources[id].reference)));article.append(sources);
  const related=data.relations.filter(r=>r.from===id||r.to===id);if(related.length){article.append(element('div','section-rule'),element('h3','related-heading','FOLLOW ANOTHER THREAD'));for(const r of related){const target=moment(r.from===id?r.to:r.from);const b=element('button','related-link');b.dataset.target=target.id;b.append(element('strong','',target.title+' →'),element('small','',r.label+' · '+({tangent:'new idea',return:'returned to later',method:'change of method',continuation:'continuing the work',companion:'connected work'}[r.kind]||'related')));b.addEventListener('click',()=>onNavigate(target.id));article.append(b);}}
  const elsewhere=data.moments.filter(other=>other.thread!==m.thread&&(other.independent||m.independent)&&!related.some(r=>r.from===other.id||r.to===other.id)).sort((a,b)=>Math.abs(Date.parse(a.date)-Date.parse(m.date))-Math.abs(Date.parse(b.date)-Date.parse(m.date))).slice(0,2);
  if(elsewhere.length){article.append(element('div','section-rule'),element('h3','related-heading','ELSEWHERE IN THESE WEEKS'));for(const other of elsewhere){const b=element('button','related-link');b.dataset.target=other.id;b.append(element('strong','',other.title+' →'),element('small','',dateLabel(other.date)+' · independent work in the same period'));b.addEventListener('click',()=>onNavigate(other.id));article.append(b);}}
  article.append(element('p','process','AI-assisted reconstruction from selected conversations, retained artifacts, and issue records. Max supplied the memories, direction, and recognition. Claude performed the original disc search. Codex assembled these passages and selected source excerpts, which Max reviewed. Historical issue comments retain their recorded authorship.'));
}
function modalMode(){const modal=opened&&narrow.matches;$('reader').setAttribute('role',modal?'dialog':'region');if(modal)$('reader').setAttribute('aria-modal','true');else $('reader').removeAttribute('aria-modal');viewport.inert=modal;$('dock').inert=modal;document.querySelector('header.site').inert=modal;}
function openStory(id,{travel=false}={}){
  const m=moment(id);if(!m)return;trackChronochasm('chronochasm-moment',{moment:id,thread:m.thread});selected=id;opened=true;if(filter!=='all'&&filter!==m.thread){filter='all';$('thread-filter').value='all';}if(travel)level=Math.max(level,m.level);render();if(travel)viewport.scrollTop=Math.max(0,positions.get(id).y-viewport.clientHeight*.4);
  const article=$('story');renderPassage(article,id,{headingId:'story-title'});renderReadingNavigation(id);
  const back=element('button','back','← Return to this moment in the timeline');back.addEventListener('click',closeStory);article.append(back);
  $('reader-crumb').textContent=thread(m.thread).name.toUpperCase();$('reader').inert=false;document.body.classList.add('reading');modalMode();$('reader-scroll').scrollTop=0;$('reader').scrollTop=0;updateConnections();$('close-reader').focus({preventScroll:true});history.replaceState(null,'','#'+id);document.dispatchEvent(new CustomEvent('chronochasm:story',{detail:{id,article}}));
}
function closeStory(){if(opened)trackChronochasm('chronochasm-control',{control:'close-reader'});opened=false;document.body.classList.remove('reading');modalMode();$('reader').inert=true;render();$('event-'+selected)?.focus({preventScroll:true});history.replaceState(null,'',location.pathname+location.search);}
let hoverExit;
function engage(event,active){
  const target=event.target.closest('.event,.activity');if(!target)return;
  if(event.relatedTarget&&target.contains(event.relatedTarget))return;
  const id=target.dataset.moment;
  if(event.type.startsWith('focus')){focusMoment=active&&target.matches(':focus-visible')?id:null;updateConnections();return;}
  if(mobile.matches||target.classList.contains('activity'))return;
  clearTimeout(hoverExit);
  if(active){hoverMoment=id;updateConnections();}
  else hoverExit=setTimeout(()=>{hoverMoment=null;updateConnections();},300);
}
function bind(){
  marks.addEventListener('pointermove',hoverActivity);
  marks.addEventListener('pointerleave',()=>{clearTimeout(hoverExit);hoverExit=setTimeout(()=>{hoverMoment=null;updateConnections();},300);});
  marks.addEventListener('click',event=>{
    if(event.detail===0||event.target.closest('.event,.time-break'))return;
    const id=pointerMoment(event);if(!id)return;
    event.preventDefault();event.stopImmediatePropagation();openStory(id);
  },true);
  $('expand-gaps').addEventListener('click',()=>setAllGaps(true));
  $('collapse-gaps').addEventListener('click',()=>setAllGaps(false));
  $('browse-moments').addEventListener('click',openMomentIndex);$('close-moment-index').addEventListener('click',()=>$('moment-index').close());
  $('timeline-home').addEventListener('click',()=>{trackChronochasm('chronochasm-control',{control:'timeline-home'});if(opened)closeStory();viewport.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});});
  viewport.addEventListener('scroll',updateCurrentDate,{passive:true});
  new ResizeObserver(()=>{const height=document.querySelector('header.site').getBoundingClientRect().height;document.documentElement.style.setProperty('--header-height',height+'px');}).observe(document.querySelector('header.site'));
  let introHeight=0;new ResizeObserver(entries=>{const height=entries[0].contentRect.height;if(Math.abs(height-introHeight)>1){introHeight=height;render({anchor:anchorAtCurrentPosition()});}}).observe(document.querySelector('.intro'));
  let resizeFrame;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>render({anchor:anchorAtCurrentPosition()}));});
  $('close-reader').addEventListener('click',closeStory);$('close-source').addEventListener('click',()=>$('source').close());
  $('zoom-out').addEventListener('click',()=>zoom(level-1));$('zoom-in').addEventListener('click',()=>zoom(level+1));document.querySelectorAll('[data-level]').forEach(b=>b.addEventListener('click',()=>zoom(+b.dataset.level)));
  $('motion-toggle').addEventListener('click',()=>{motionPaused=!motionPaused;trackChronochasm('chronochasm-control',{control:'motion',paused:motionPaused});$('motion-toggle').setAttribute('aria-pressed',String(motionPaused));$('motion-toggle').setAttribute('aria-label',motionPaused?'Resume floating motion':'Pause floating motion');$('motion-toggle').textContent=motionPaused?'▷':'Ⅱ';});
  $('thread-filter').addEventListener('change',e=>{if(opened)closeStory();filter=e.target.value;trackChronochasm('chronochasm-control',{control:'thread',thread:filter});selected=null;render();viewport.scrollTop=0;$('announcement').textContent=filter==='all'?'Showing all threads':'Showing '+thread(filter).name+', '+shownMoments().length+' moments';});
  marks.addEventListener('pointerover',e=>engage(e,true));marks.addEventListener('pointerout',e=>engage(e,false));marks.addEventListener('focusin',e=>engage(e,true));marks.addEventListener('focusout',e=>engage(e,false));
  for(const id of ['source','moment-index'])$(id).addEventListener('click',e=>{if(e.target!==$(id))return;const r=$(id).getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$(id).close();});
  document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;if(e.key==='Escape'&&opened){e.preventDefault();closeStory();}if(e.key==='Tab'&&opened&&narrow.matches){const list=[...$('reader').querySelectorAll('button:not(:disabled),a[href]')];const first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  narrow.addEventListener('change',modalMode);mobile.addEventListener('change',()=>render({anchor:anchorAtCurrentPosition()}));reduced.addEventListener('change',startMotion);document.addEventListener('visibilitychange',startMotion);
  window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(moment(id))openStory(id,{travel:true});else if(opened)closeStory();});
  // Wheel/touch scrolling and browser zoom remain native. No modifier is required.
}
let resolveReady;
window.chronochasm={ready:new Promise(resolve=>{resolveReady=resolve;})};
async function init(){const response=await fetch('/chronochasm/content.json',{cache:'no-store'});if(!response.ok)throw Error('The selected history could not be loaded.');data=await response.json();for(const l of data.lanes){const key=element('span','lane-key',l.name);key.style.setProperty('--lane',l.color);key.title=l.description;$('lane-legend').append(key);}for(const t of data.threads){const o=element('option','',t.name);o.value=t.id;o.textContent=t.name+' ('+data.moments.filter(m=>m.thread===t.id).length+')';$('thread-filter').append(o);}$('edition-meta').textContent=data.threads.length+' threads · '+data.moments.length+' moments · August 18–September 14, 2026';bind();render();resolveReady({data,renderPassage,getSelected:()=>selected});const id=location.hash.slice(1);if(moment(id))openStory(id,{travel:true});}
init().catch(error=>{$('edition-meta').textContent=error.message;$('marks').append(element('p','load-error','Refresh the page to try loading the history again.'));$('zoom-in').disabled=true;$('zoom-out').disabled=true;});
