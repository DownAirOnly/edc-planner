/* Fest v3: festival switcher and isolated Cyclops Cove favorites.
 * EDC Pocket's original local key and Firebase schedule are intentionally untouched.
 * Cyclops favorites are device-only until per-festival cloud recovery is verified.
 */
(() => {
  'use strict';
  const ACTIVE_KEY = 'fest_active_festival_v3';
  const COVE_KEY = 'fest_cyclops_cove_2026_v1';
  const EDC = 'edc-orlando-2026';
  const COVE = 'cyclops-cove-2026';
  // Advertised day-by-day lineup; times and stages have not been published.
  // https://app.beacon.buzz/e/cyclops-cove-4
  const days = [
    {date:'Fri, Dec 4', day:'Friday', artists:[
      'A Hundred Drums b2b Zen Selekta','ALLEYCVT b2b LEVEL UP','Hedex',
      'INFEKT b2b HOL!','HVDES','Izzy Vadim','Lizzy Jane','Modal Nodes',
      'Nimda b2b Prosecute','Ravenscoon','Seeing Dubble','SISTO',
      'CRANKDAT b2b Subtronics','Taiki Nulight','TYNAN','WARLORD']},
    {date:'Sat, Dec 5', day:'Saturday', artists:[
      'AVELLO','Blurrd Vzn','CØSTA','Doctor P b2b FuntCase',
      'Don Jamal','Lucas Larvenz','Osyris','PEEKABOO','REAPER','RL Grime',
      'RZRKT b2b Vastive','sfam','SHOSH','Slang Dogs','Subtronics',
      'TroyBoi','VICKY B']},
    {date:'Sun, Dec 6', day:'Sunday', artists:[
      'Blossom','Daggz','Galactic Effect','Gardella','Getter','Kompany',
      'Lumasi','Mlotik','Mocha','Seven Lions','Smoakland','Steller',
      'Subtronics','sumthin sumthin','Vyhara',
      'Witching Hour (JEANIE b2b VAMPA)','Z3LLA']}
  ];
  const acts = days.flatMap((group,day) => group.artists.map(artist => ({
    artist, day, id:day+':'+artist.toLocaleLowerCase('en-US').normalize('NFKD')
      .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
  })));
  const validIds = new Set(acts.map(a=>a.id));
  const $ = id => document.getElementById(id);
  const view = $('fest-view');
  const nav = $('fest-nav');
  const switcher = $('festival-switch');
  if (!view || !nav || !switcher) return;
  const saved = (()=>{try{return JSON.parse(localStorage.getItem(COVE_KEY)||'{}')}catch{return {}}})();
  const picked = new Set((Array.isArray(saved.selected)?saved.selected:[]).filter(id=>validIds.has(id)));
  let selectedFestival = COVE;
  let tab = 'lineup';
  let day = 0;
  let search = '';

  function el(tag, className, value) {
    const out=document.createElement(tag);
    if(className) out.className=className;
    if(value!==undefined) out.textContent=value;
    return out;
  }
  function notice(message) {
    const toast=$('toast');
    if(!toast) return;
    toast.textContent=message;
    toast.classList.add('show');
    clearTimeout(notice.timer);
    notice.timer=setTimeout(()=>toast.classList.remove('show'),3500);
  }
  function persist() {
    try {
      localStorage.setItem(COVE_KEY,JSON.stringify({festivalId:COVE,selected:[...picked]}));
      return true;
    } catch {
      notice('Could not save on this device. Use Copy picks to keep a copy.');
      return false;
    }
  }
  function button(label, cls, action) {
    const b=el('button',cls,label);
    b.type='button';
    b.addEventListener('click',action);
    return b;
  }
  function heading(title,detail) {
    const wrap=el('div','section-title');
    wrap.append(el('h2','',title),el('span','subtle',detail));
    return wrap;
  }
  function intro() {
    const hero=el('section','fest-hero');
    hero.append(el('div','hero-label','DECEMBER 4–6 · BOCA RATON, FL'),
                el('h1','','Cyclops Cove 4'));
    const details=el('div','fest-hero-meta','Sunset Cove Amphitheatre · '+acts.length+' performances · '+picked.size+' picked');
    hero.append(details);
    return hero;
  }
  function statusNote() {
    return el('div','info-box warn',
      'Set times and stages are not published yet. Save the artists you want to see now; a timed schedule will follow when official times are released.');
  }
  function localNote() {
    return el('div','fest-save-note',
      'Cyclops picks are saved only on this device in v3, even when you are signed in. Your EDC cloud schedule is separate. Use Copy picks or Export backup to keep another copy.');
  }
  function dayControls() {
    const wrap=el('div','days');
    days.forEach((item,i)=>{
      const b=el('button','day-button'+(day===i?' active':''),'');
      b.type='button';
      b.setAttribute('aria-pressed',String(day===i));
      b.append(el('span','',item.day),el('b','',item.date.split(', ')[1]));
      b.addEventListener('click',()=>{day=i;render();});
      wrap.append(b);
    });
    return wrap;
  }
  function card(act) {
    const chosen=picked.has(act.id);
    const article=el('article','fest-act'+(chosen?' picked':''));
    const info=el('div','fest-act-info');
    info.append(el('strong','',act.artist),el('span','',days[act.day].date+' · Time TBA'));
    const choose=button(chosen?'✓':'+','add-set'+(chosen?' selected':''),()=>{
      if(picked.has(act.id)) picked.delete(act.id); else picked.add(act.id);
      persist(); render();
    });
    choose.setAttribute('aria-label',(chosen?'Remove ':'Add ')+act.artist+(chosen?' from':' to')+' picks');
    choose.setAttribute('aria-pressed',String(chosen));
    article.append(info,choose);
    return article;
  }
  function pickActions() {
    const controls=el('div','fest-actions');
    controls.append(
      button('Copy picks','small-button primary',copyPicks),
      button('Export backup','small-button',exportBackup)
    );
    return controls;
  }
  function renderLineup() {
    view.append(intro(),heading('Lineup','Time TBA'),statusNote(),dayControls());
    const wrap=el('label','search-wrap fest-search');
    const input=el('input');
    input.type='search'; input.placeholder='Search artists';
    input.setAttribute('aria-label','Search Cyclops Cove artists');
    input.value=search;
    input.addEventListener('input',e=>{
      search=e.target.value;
      renderResults();
    });
    wrap.append(input);
    view.append(wrap);
    const summary=el('div','result-head');
    summary.append(el('span','subtle',''),button('My picks · '+picked.size,'small-button',()=>setTab('picks')));
    view.append(summary);
    const list=el('div','set-list');
    list.id='fest-results';
    view.append(list);
    renderResults();
    view.append(localNote());
  }
  function renderResults(){
    const list=$('fest-results');
    if(!list)return;
    list.replaceChildren();
    const matches=acts.filter(a=>a.day===day && a.artist.toLocaleLowerCase('en-US').includes(search.toLocaleLowerCase('en-US')));
    const count=view.querySelector('.result-head .subtle');
    if(count)count.textContent=matches.length+' of '+days[day].artists.length+' performances';
    if(!matches.length) list.append(el('div','empty','No matching artists.'));
    else matches.forEach(a=>list.append(card(a)));
  }
  function renderPicks() {
    view.append(intro(),heading('My picks',picked.size+' saved'),dayControls(),pickActions());
    const mine=acts.filter(a=>a.day===day && picked.has(a.id));
    const list=el('div','set-list');
    if(!mine.length){
      const empty=el('div','empty');
      empty.append(el('h3','','Nothing picked for '+days[day].day),
        button('Browse lineup','small-button primary',()=>setTab('lineup')));
      list.append(empty);
    }else mine.forEach(a=>list.append(card(a)));
    view.append(list,statusNote(),localNote());
  }
  function renderInfo() {
    view.append(intro(),heading('Event information','Official ticket listing'));
    const grid=el('div','fest-info-grid');
    [
      ['Venue','Sunset Cove Amphitheatre'],
      ['Address','20405 Amphitheater Circle, Boca Raton, FL 33498'],
      ['Dates','December 4–6, 2026'],
      ['Friday & Saturday','Doors 2 PM · Curfew 11 PM'],
      ['Sunday','Doors 1 PM · Curfew 10 PM'],
      ['Age requirement','18+']
    ].forEach(([label,value])=>{
      const cell=el('div','fest-info-cell');
      cell.append(el('span','',label),el('strong','',value));
      grid.append(cell);
    });
    view.append(grid);
    const links=el('div','fest-actions');
    const official=el('a','small-button primary','Ticket information');
    official.href='https://cyclopscove.frontgatetickets.com/';
    official.target='_blank';official.rel='noopener noreferrer';
    const lineup=el('a','small-button','Lineup source');
    lineup.href='https://app.beacon.buzz/e/cyclops-cove-4';
    lineup.target='_blank';lineup.rel='noopener noreferrer';
    links.append(official,lineup);
    view.append(links,statusNote(),localNote());
  }
  function setTab(next) {
    tab=next;
    render();
    window.scrollTo({top:0,behavior:'instant'});
  }
  function render() {
    view.replaceChildren();
    if(tab==='picks')renderPicks();
    else if(tab==='info')renderInfo();
    else renderLineup();
    nav.querySelectorAll('button[data-fest-tab]').forEach(b=>{
      const active=b.dataset.festTab===tab;
      b.classList.toggle('active',active);
      b.setAttribute('aria-current',active?'page':'false');
    });
  }
  function pickedText(){
    const lines=['Cyclops Cove 4 — December 4–6, 2026','Set times TBA'];
    days.forEach((group,i)=>{
      const mine=acts.filter(a=>a.day===i && picked.has(a.id));
      if(mine.length) lines.push('',group.day+' · '+group.date,...mine.map(a=>'- '+a.artist));
    });
    return lines.join('\n');
  }
  async function copyPicks() {
    if(!picked.size){notice('Choose some artists first.');return;}
    try{
      await navigator.clipboard.writeText(pickedText());
      notice('Artist picks copied.');
    }catch{notice('Clipboard unavailable. Export a backup instead.');}
  }
  function exportBackup(){
    const backup={app:'Fest',version:3,festivalId:COVE,selected:[...picked],exportedAt:new Date().toISOString()};
    const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));
    const a=el('a');a.href=url;a.download='fest-cyclops-cove-2026-backup.json';
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  function chooseFestival(next) {
    selectedFestival=next===EDC?EDC:COVE;
    try{localStorage.setItem(ACTIVE_KEY,selectedFestival)}catch{}
    switcher.value=selectedFestival;
    const showEdc=selectedFestival===EDC;
    $('view').hidden=!showEdc;
    view.hidden=showEdc;
    $('account-banner').hidden=!showEdc;
    $('edc-footer').hidden=!showEdc;
    $('fest-footer').hidden=showEdc;
    $('edc-nav').hidden=!showEdc;
    nav.hidden=showEdc;
    if(!showEdc)render();
    window.scrollTo({top:0,behavior:'instant'});
  }
  nav.querySelectorAll('button[data-fest-tab]').forEach(b=>{
    b.addEventListener('click',()=>setTab(b.dataset.festTab));
  });
  switcher.addEventListener('change',e=>chooseFestival(e.target.value));
  let initial=COVE;
  try{if(localStorage.getItem(ACTIVE_KEY)===EDC)initial=EDC}catch{}
  chooseFestival(initial);
})();
