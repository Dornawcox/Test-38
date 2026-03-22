(function(){
  const btn = document.getElementById('menuButton');
  const drawer = document.getElementById('drawer');
  const closeBtn = document.getElementById('drawerClose');
  const scrim = document.getElementById('scrim');

  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let lastFocus = null;

  function openDrawer(){
    lastFocus = document.activeElement;
    drawer.classList.add('open');
    scrim.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');

    const firstLink = drawer.querySelector('.drawer-link');
    if (firstLink) firstLink.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer(){
    drawer.classList.remove('open');
    scrim.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';

    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    expanded ? closeDrawer() : openDrawer();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (scrim) scrim.addEventListener('click', closeDrawer);

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });

  // Close after clicking a link
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

  // Focus trap
  document.addEventListener('keydown', (e) => {
    if (!drawer.classList.contains('open')) return;
    if (e.key !== 'Tab') return;

    const focusables = drawer.querySelectorAll(focusableSelector);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Footer year
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();

/* ===== Scrolling rails + accordions ===== */
(function(){
  function initRail(opts){
    const rail = document.querySelector(opts.railSel);
    const prev = document.querySelector(opts.prevSel);
    const next = document.querySelector(opts.nextSel);
    if (!rail) return;

    function step(){
      const card = rail.querySelector(opts.cardSel);
      if (!card) return 260;
      const gap = opts.gap ?? 12;
      return card.getBoundingClientRect().width + gap;
    }
    function update(){
      if (!prev || !next) return;
      const max = rail.scrollWidth - rail.clientWidth;
      const x = rail.scrollLeft;
      prev.disabled = x <= 2;
      next.disabled = x >= max - 2;
    }
    function scrollByDir(dir){
      rail.scrollBy({ left: dir * step(), behavior: "smooth" });
    }

    if (prev) prev.addEventListener("click", () => scrollByDir(-1));
    if (next) next.addEventListener("click", () => scrollByDir(1));

    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    // Desktop nicety: wheel vertical scroll moves the rail horizontally
    rail.addEventListener("wheel", (e) => {
      if (!e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        rail.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });
  }

  // Project cards rail
  initRail({
    railSel: "[data-wg-rail]",
    prevSel: "[data-wg-scroll='prev']",
    nextSel: "[data-wg-scroll='next']",
    cardSel: ".wg-project-card",
    gap: 12
  });

  // Tool/Community/Platform rail
  initRail({
    railSel: "[data-tcp-rail]",
    prevSel: "[data-tcp-scroll='prev']",
    nextSel: "[data-tcp-scroll='next']",
    cardSel: ".tcp-card",
    gap: 12
  });

  // Attribution rail
  initRail({
    railSel: "[data-attr-rail]",
    prevSel: "[data-attr-scroll='prev']",
    nextSel: "[data-attr-scroll='next']",
    cardSel: ".attr-card",
    gap: 12
  });

  // Accordion behavior for project cards: only one <details> open at a time
  const detailsEls = Array.from(document.querySelectorAll(".wg-project-card__details"));
  detailsEls.forEach((d) => {
    d.addEventListener("toggle", () => {
      if (!d.open) return;
      detailsEls.forEach((other) => {
        if (other !== d) other.open = false;
      });
    });
  });

  // Registry card accordion — only one open at a time
  const regDetails = Array.from(document.querySelectorAll(".reg-card__details"));
  regDetails.forEach((d) => {
    d.addEventListener("toggle", () => {
      if (!d.open) return;
      regDetails.forEach((other) => {
        if (other !== d) other.open = false;
      });
    });
  });
})();

/* ===== Shared Calendar (event cards) ===== */
(function(){
  const rail = document.querySelector('[data-cal-rail]');
  if(!rail) return;

  // Enable rail arrows (reuse initRail pattern)
  (function initRail(){
    const prev = document.querySelector('[data-cal-scroll="prev"]');
    const next = document.querySelector('[data-cal-scroll="next"]');
    const cardSel = '.wg-project-card';
    const gap = 12;

    function step(){
      const card = rail.querySelector(cardSel);
      if (!card) return 260;
      return card.getBoundingClientRect().width + gap;
    }
    function update(){
      if(!prev || !next) return;
      const max = rail.scrollWidth - rail.clientWidth;
      const x = rail.scrollLeft;
      prev.disabled = x <= 2;
      next.disabled = x >= max - 2;
    }
    window.__calRailUpdate = update;
    function scrollByDir(dir){
      rail.scrollBy({ left: dir * step(), behavior: 'smooth' });
      // refresh after layout settles
      window.setTimeout(update, 250);
    }

    if(prev) prev.addEventListener('click', ()=> scrollByDir(-1));
    if(next) next.addEventListener('click', ()=> scrollByDir(1));
    rail.addEventListener('scroll', update, { passive:true });
    window.addEventListener('resize', update);
    update();

    rail.addEventListener('wheel', (e)=>{
      if(!e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)){
        rail.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive:false });
  })();

  const sourceChips = document.getElementById('calSourceChips');
  const tagChips = document.getElementById('calTagChips');
  const meta = document.getElementById('calMeta');

  const SOURCE = {
    GOAT:     { label:'Gathering for Open Agriculture Technology (GOAT)', shortLabel:'GOAT',     icon:'https://www.google.com/s2/favicons?domain=goatech.org&sz=64',                          color:'#fef3c7', textColor:'#92400e' },
    GIAA:     { label:'Global Initiative for Agroecology and Agriculture (GIAA)', shortLabel:'GIAA', icon:'https://www.google.com/s2/favicons?domain=gia-agroecology.org&sz=64',              color:'#d1fae5', textColor:'#065f46' },
    AKC:      { label:'Ag Knowledge Concordance', shortLabel:'AKC',  icon:'https://www.google.com/s2/favicons?domain=agricultural-knowledge-concordance.github.io&sz=64', color:'#dbeafe', textColor:'#1e40af' },
    FARMHACK: { label:'Farm Hack', shortLabel:'FarmHack', icon:'https://www.google.com/s2/favicons?domain=farmhack.org&sz=64',                                              color:'#f3e8ff', textColor:'#6b21a8' },
    OFC:      { label:'Open Future Coalition', shortLabel:'OFC',     icon:'https://www.google.com/s2/favicons?domain=openfuturecoalition.org&sz=64',                       color:'#fce7f3', textColor:'#9d174d' }
  };

  const state = { tag:'' };
  let data = [];

  function escapeHtml(s){
    return (s ?? '').toString()
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function fmtRange(startIso, endIso){
    const start = new Date(startIso);
    const end = new Date(endIso || startIso);
    if (Number.isNaN(start.getTime())) return '';
    const optsDate = { weekday:'short', month:'short', day:'numeric', year:'numeric' };
    const optsTime = { hour:'2-digit', minute:'2-digit' };
    const sameDay = start.toDateString() === end.toDateString();
    const d = start.toLocaleDateString(undefined, optsDate);
    const t1 = start.toLocaleTimeString(undefined, optsTime);
    const t2 = endIso ? end.toLocaleTimeString(undefined, optsTime) : '';
    return sameDay ? `${d} • ${t1}${t2 ? '–' + t2 : ''}` : `${d} • ${t1} → ${end.toLocaleDateString(undefined, optsDate)} • ${t2}`;
  }

  function monthKey(iso){
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month:'short', year:'numeric' });
  }

  function makeChip(label, onClick){
    const b = document.createElement('button');
    b.className = 'cal-chip';
    b.type = 'button';
    b.textContent = label;
    b.setAttribute('aria-pressed','false');
    b.addEventListener('click', onClick);
    return b;
  }

  function updateChips(){
    document.querySelectorAll('.cal-chip').forEach(ch => {
      const txt = ch.textContent || '';
      let pressed = false;
      if (txt === 'All tags') pressed = state.tag === '';
      for (const k of Object.keys(SOURCE)){
      }
      if (state.tag && txt === state.tag) pressed = true;
      ch.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    });
  }

  function matches(ev){
    if (state.tag && !(ev.tags || []).includes(state.tag)) return false;
    const now = Date.now();
    const end = new Date(ev.end || ev.start).getTime();
    return end >= now - 365*24*3600*1000; // show ~last year + upcoming
  }

  function card(ev){
    const src = SOURCE[ev.source] || { label: ev.source || 'Event', shortLabel: ev.source || 'Event', icon:'', color:'#f1efe8', textColor:'#5f5e5a' };
    const tagList = (ev.tags || []).filter(t => t !== ev.source).slice(0,3);
    const tagPills = tagList.map(t => `<span class="ec-pill">${escapeHtml(t)}</span>`).join('');
    const startDate = new Date(ev.start);
    const endDate = ev.end ? new Date(ev.end) : null;
    const isMultiDay = endDate && startDate.toDateString() !== endDate.toDateString();
    const dateFmt = { weekday:'short', month:'short', day:'numeric', year:'numeric' };
    const startStr = Number.isNaN(startDate.getTime()) ? '' : startDate.toLocaleDateString(undefined, dateFmt);
    const endStr = isMultiDay ? endDate.toLocaleDateString(undefined, dateFmt) : '';
    const dateStr = isMultiDay ? `${startStr} – ${endStr}` : startStr;
    const where = ev.location ? ev.location : '';

    // Thumbnail: use ev.image if present, else a deterministic placeholder tinted by source color
    const thumbStyle = ev.image
      ? `background-image:url('${escapeHtml(ev.image)}');background-size:cover;background-position:center;`
      : `background:${src.color};`;

    // Month/day badge from start date
    const monthAbbr = Number.isNaN(startDate.getTime()) ? '' : startDate.toLocaleDateString(undefined, {month:'short'}).toUpperCase();
    const dayNum   = Number.isNaN(startDate.getTime()) ? '' : startDate.getDate();

    return `
<article class="ec">
  <div class="ec__top">
    <div class="ec__date-col">
      <span class="ec__date-month">${escapeHtml(monthAbbr)}</span>
      <span class="ec__date-day">${dayNum}</span>
    </div>
    <div class="ec__thumb-mid" style="${thumbStyle}"></div>
    <div class="ec__logo-col">
      ${src.icon ? `<img class="ec__src-logo-lg" src="${src.icon}" alt="${escapeHtml(src.shortLabel)}" loading="lazy"/>` : `<span class="ec__src-pill-sm" style="background:${src.color};color:${src.textColor};">${escapeHtml(src.shortLabel)}</span>`}
    </div>
  </div>
  <div class="ec__body">
    <h4 class="ec__title">${escapeHtml(ev.title || 'Untitled event')}</h4>
    <p class="ec__when">${escapeHtml(dateStr)}${where ? ` · ${escapeHtml(where)}` : ''}</p>
    ${tagPills ? `<div class="ec__pills">${tagPills}</div>` : ''}
    ${ev.url ? `<a class="ec__link-inline" href="${escapeHtml(ev.url)}" target="_blank" rel="noopener">Event page ↗</a>` : ''}
  </div>
</article>`;
  }
  function render(){
    updateChips();

    const list = data.filter(matches).sort((a,b)=> new Date(a.start).getTime() - new Date(b.start).getTime());

    meta.textContent = `${list.length} upcoming events shown` + (state.tag ? ` • ${state.tag}` : '');

    // For this homepage rail, show the next ~18 events (still scrollable)
    const subset = list.slice(0, 18);
    rail.innerHTML = subset.map(card).join('') || `<div class="muted" style="padding: 10px 6px;">No upcoming events match your filters.</div>`;
    if (window.__calRailUpdate) window.__calRailUpdate();

    // No expand/collapse in new card design
  }

  function buildFilters(){
    const tags = [...new Set(data.flatMap(e=>e.tags || []))].sort();

    tagChips.innerHTML = '';
    tagChips.appendChild(makeChip('All tags', ()=>{ state.tag = ''; render(); }));
    tags.slice(0, 10).forEach(t => {
      tagChips.appendChild(makeChip(t, ()=>{ state.tag = (state.tag===t) ? '' : t; render(); }));
    });
  }

  // Inline events data (works as file:// and when served)
  (function loadEvents() {
    const inline = [{"id":"goat-ecofarm-gathering-2026-01-22","title":"Serendipitous Gathering of GOATs at Ecofarm","start":"2026-01-22T02:00:00Z","end":"2026-01-25T01:59:00Z","timezone":"UTC","location":"Monterey Bay, California, USA","url":"https://forum.goatech.org/t/serendipitous-gathering-of-goats-at-ecofarm-monterey-bay-california-jan-22-24-2026/2004","source":"GOAT","tags":["GOAT","regional-meetup","In-person"]},{"id":"goat-mofga-2026-02-07","title":"GOATs coming to MOFGA","start":"2026-02-07T06:00:00Z","end":"2026-02-12T05:59:00Z","timezone":"UTC","location":"Portland, Maine, USA","url":"https://forum.goatech.org/t/goats-coming-to-mofga-portland-maine-feb-7-11-2026/2010","source":"GOAT","tags":["GOAT","regional-meetup","In-person"]},{"id":"goat-monthly-call-2026-02-12","title":"GOAT Monthly Community Call","start":"2026-02-12T21:00:00Z","end":"2026-02-12T22:15:00Z","timezone":"UTC","location":"Online","url":"https://forum.goatech.org/t/2026-02-12-goat-monthly-community-call/2017","source":"GOAT","tags":["GOAT","Community call","Online"]},{"id":"goat-asabe-aim-2026-07-12","title":"GOATs at ASABE AIM 2026","start":"2026-07-12T00:00:00Z","end":"2026-07-16T23:59:00Z","timezone":"UTC","location":"Indianapolis, Indiana, USA","url":"https://forum.goatech.org/t/goats-at-asabe-conference-indianapolis-indiana-july-12-15-2026/2009","source":"GOAT","tags":["GOAT","regional-meetup","Conference"]},{"id":"akc-land-steward-cultural-data-preservation-s1-2026-02-13","title":"Land Steward & Cultural Data Preservation \u2014 Virtual Session 1","start":"2026-02-13T16:00:00Z","end":"2026-02-13T17:30:00Z","timezone":"UTC","location":"Online","url":"https://luma.com/event/manage/evt-5WGJ3HKFss7sRuo","source":"Ag Knowledge Concordance","tags":["Workshop","Online","Stewardship"]},{"id":"akc-land-steward-cultural-data-preservation-s2-2026-02-14","title":"Land Steward & Cultural Data Preservation \u2014 Virtual Session 2","start":"2026-02-14T02:00:00Z","end":"2026-02-14T03:30:00Z","timezone":"UTC","location":"Online","url":"https://luma.com/event/manage/evt-pnHS2zC7em79kVm","source":"Ag Knowledge Concordance","tags":["Workshop","Online","Stewardship"]},{"id":"akc-ai-impact-summit-2026-02-16","title":"AI Impact Summit (and AI Commons House side events)","start":"2026-02-16T00:00:00Z","end":"2026-02-21T23:59:00Z","timezone":"UTC","location":"New Delhi, India","url":"https://impact.indiaai.gov.in/","source":"Ag Knowledge Concordance","tags":["Summit","AI","In-person"]},{"id":"giaa-digital-sovereignty-session-2bis-2026-02-03","title":"Co-development of Digital Sovereignty Curriculum (Session 2 bis)","start":"2026-02-03T09:30:00Z","end":"2026-02-03T11:00:00Z","timezone":"UTC","location":"Online","url":"https://www.gia-agroecology.org/","source":"GIAA","tags":["GIAA","Online","Working session"]},{"id":"giaa-digital-sovereignty-session-3-2026-02-05","title":"Co-development of Digital Sovereignty Curriculum (Session 3)","start":"2026-02-05T17:00:00Z","end":"2026-02-05T18:30:00Z","timezone":"UTC","location":"Online","url":"https://www.gia-agroecology.org/","source":"GIAA","tags":["GIAA","Online","Working session"]},{"id":"giaa-digital-sovereignty-session-1bis-2026-02-27","title":"Co-development of Digital Sovereignty Curriculum (Session 1 bis)","start":"2026-02-27T09:30:00Z","end":"2026-02-27T11:00:00Z","timezone":"UTC","location":"Online","url":"https://www.gia-agroecology.org/","source":"GIAA","tags":["GIAA","Online","Working session"]},{"id":"giaa-digital-sovereignty-session-2-2026-02-28","title":"Co-development of Digital Sovereignty Curriculum (Session 2)","start":"2026-02-28T17:00:00Z","end":"2026-02-28T18:30:00Z","timezone":"UTC","location":"Online","url":"https://www.gia-agroecology.org/","source":"GIAA","tags":["GIAA","Online","Working session"]},{"id":"giaa-americas-meeting-2026-02-19","title":"GIAA meeting (Americas timezone)","start":"2026-02-19T16:30:00Z","end":"2026-02-19T17:30:00Z","timezone":"UTC","location":"Online","url":"https://www.gia-agroecology.org/","source":"GIAA","tags":["GIAA","Online","Meeting"]},{"id":"giaa-launch-webinar-head-in-the-cloud-2026-02-25","title":"LAUNCH WEBINAR | HEAD IN THE CLOUD","start":"2026-02-25T14:00:00Z","end":"2026-02-25T15:30:00Z","timezone":"UTC","location":"Online","url":"https://www.gia-agroecology.org/","source":"GIAA","tags":["GIAA","Webinar","Online"]}];
    data = Array.isArray(inline) ? inline : (inline.items || []);
    buildFilters();
    render();
    // Also try fetching fresh data (works when served, fails silently as file://)
    if (typeof fetch !== 'undefined') {
      fetch('data/events.json', { cache:'no-store' })
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(fresh) {
          if (!fresh) return;
          data = Array.isArray(fresh) ? fresh : (fresh.items || []);
          buildFilters();
          render();
        })
        .catch(function() { /* silently use inline data */ });
    }
  })();
})();
