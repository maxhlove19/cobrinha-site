/* Alliance Jiu Jitsu Los Angeles by Cobrinha — small, dependency-free */
(function () {
  // year
  var y = document.getElementById('yr'); if (y) y.textContent = new Date().getFullYear();
  // academy age: opened on Wilshire in 2011, never hardcode the number
  document.querySelectorAll('[data-years]').forEach(function (e) { var y = new Date().getFullYear() - 2011; e.textContent = y; if (e.hasAttribute('data-count')) e.setAttribute('data-count', y); });

  // mobile menu
  var burger = document.getElementById('burger'), menu = document.getElementById('menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      menu.hidden = open;
      document.body.classList.toggle('menu-open', !open);
      burger.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { burger.click(); }); });
  }

  // reveal on scroll (with insurance so nothing stays invisible)
  var rv = [].slice.call(document.querySelectorAll('.rv'));
  function show(el) { el.classList.add('in'); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
    rv.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight * 1.1) show(el); });
  } else { rv.forEach(show); }

  // stagger: give each child an index for the delay
  document.querySelectorAll('.stagger').forEach(function (g) { [].forEach.call(g.children, function (c, i) { if (!c.style.getPropertyValue('--i')) c.style.setProperty('--i', i); }); });

  // scroll effects: progress line, nav shrink, parallax on marked media (fine pointers only)
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches, reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bar = document.createElement('div'); bar.className = 'progress'; document.body.appendChild(bar);
  var nav = document.getElementById('nav'), px = [].slice.call(document.querySelectorAll('.media.px img')), ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      if (nav) nav.classList.toggle('small', y > 80);
      if (!reduce) px.forEach(function (img) { var r = img.parentNode.getBoundingClientRect(); var p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; img.style.setProperty('--py', (p * -40).toFixed(1) + 'px'); });
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (!reduce) document.querySelectorAll('.media.wide, .media.tall').forEach(function (m) { if (m.querySelector('img')) m.classList.add('px'); });

  // card tilt
  if (fine && !reduce) document.querySelectorAll('.pcard').forEach(function (c) {
    c.addEventListener('mousemove', function (e) { var r = c.getBoundingClientRect(); var x = (e.clientX - r.left) / r.width - .5, yy = (e.clientY - r.top) / r.height - .5; c.style.setProperty('--ry', (x * 8) + 'deg'); c.style.setProperty('--rx', (-yy * 8) + 'deg'); });
    c.addEventListener('mouseleave', function () { c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); });
  });

  // count-up stats
  var nums = document.querySelectorAll('[data-count]');
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count')), dec = (String(to).split('.')[1] || '').length, t0 = null, dur = 1200;
    function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur); p = 1 - Math.pow(1 - p, 3); el.textContent = (to * p).toFixed(dec); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  if (nums.length && 'IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); io2.unobserve(e.target); } }); }, { threshold: 0.4 });
    nums.forEach(function (n) { io2.observe(n); });
  } else { nums.forEach(function (n) { n.textContent = n.getAttribute('data-count'); }); }

  // schedule filter tabs
  var tabs = document.querySelectorAll('.tab[data-filter]');
  if (tabs.length) {
    var rows = document.querySelectorAll('.sched tbody tr');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
        t.setAttribute('aria-selected', 'true');
        var f = t.getAttribute('data-filter');
        rows.forEach(function (r) { r.hidden = !(f === 'all' || (r.getAttribute('data-k') || '').split(' ').indexOf(f) > -1); });
      });
    });
  }

  // "today" list on the home page (re-run when the Gymdesk feed arrives)
  window.__renderToday = function () {
    var today = document.getElementById('today'); if (!today || !window.SCHEDULE) return;
    var d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
    var list = window.SCHEDULE.filter(function (r) { return r.d === d; });
    var head = document.getElementById('todayName'); if (head) head.textContent = 'Today, ' + { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' }[d];
    today.innerHTML = list.map(function (r) { return '<div class="srow"><b>' + r.c + '</b><span>' + r.t + '</span></div>'; }).join('') || '<div class="srow"><b>No classes today</b><span>See the full schedule</span></div>';
  };
  window.__renderToday();

  // free-class form: build a mailto fallback so the page works even before the form backend is connected
  var form = document.getElementById('bookForm');
  if (form) {
    form.addEventListener('submit', function (ev) {
      if (form.getAttribute('action')) return; // real backend connected
      ev.preventDefault();
      var f = new FormData(form), lines = [];
      f.forEach(function (v, k) { if (v) lines.push(k + ': ' + v); });
      location.href = 'mailto:info@cobrinhabjj.com?subject=' + encodeURIComponent('Kids\' free trial request — ' + (f.get('program') || '')) + '&body=' + encodeURIComponent(lines.join('\n'));
    });
  }
})();

/* ===== engagement layer 2 ===== */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // word-by-word reveal on display headings (skip headings that contain markup other than <br>)
  if (!reduce) document.querySelectorAll('h1.display, h2.display').forEach(function (h) {
    if (h.closest('.faq') || h.id === 'todayName') return;
    var html = h.innerHTML; if (/<(?!br\s*\/?>)[a-z]/i.test(html) && !h.closest('.hero')) return;
    if (h.closest('.hero')) { // hero has <span class="thin">; wrap words inside text nodes only
      var i = 0; (function walk(n) { [].slice.call(n.childNodes).forEach(function (c) { if (c.nodeType === 3) { var f = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(function (t) { if (!t) return; if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(t)); return; } var s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--w', i++); s.textContent = t; f.appendChild(s); }); n.replaceChild(f, c); } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c); }); })(h); return;
    }
    var idx = 0; h.innerHTML = html.split(/(<br\s*\/?>)/i).map(function (part) { if (/^<br/i.test(part)) return part; return part.split(/(\s+)/).map(function (t) { if (!t || /^\s+$/.test(t)) return t; return '<span class="w" style="--w:' + (idx++) + '">' + t + '</span>'; }).join(''); }).join('');
    if (!h.closest('.rv')) { h.classList.add('rv'); }
    var rct = h.getBoundingClientRect(); if (rct.top < window.innerHeight && rct.bottom > 0) { h.classList.add('in'); }
  });
  setTimeout(function () { document.querySelectorAll('h1.display, h2.display').forEach(function (h) { var r = h.getBoundingClientRect(); if (r.top < window.innerHeight * 1.2) h.classList.add('in'); }); }, 1200);

  // next class pill (hero + schedule): from window.SCHEDULE, re-run when the Gymdesk feed arrives
  function parseT(t) { var m = /(\d+):(\d+)\s*(am|pm)/i.exec(t); if (!m) return null; var h = +m[1] % 12 + (/pm/i.test(m[3]) ? 12 : 0); return h * 60 + (+m[2]); }
  window.__renderNext = function () {
    var S = window.SCHEDULE || [], slot = document.getElementById('nextClass'); if (!slot || !S.length) return;
    var now = new Date(), days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], n = null;
    for (var off = 0; off < 8 && !n; off++) {
      var d = new Date(now); d.setDate(now.getDate() + off); var key = days[d.getDay()], cur = off === 0 ? now.getHours() * 60 + now.getMinutes() : -1;
      var todays = S.filter(function (r) { return r.d === key && parseT(r.t) !== null && parseT(r.t) > cur; }).sort(function (a, b) { return parseT(a.t) - parseT(b.t); });
      if (todays.length) { var r = todays[0], mins = parseT(r.t) - (off === 0 ? cur : 0) + off * 1440; n = { r: r, when: off === 0 ? (mins < 60 ? 'in ' + mins + ' min' : 'today at ' + r.t) : off === 1 ? 'tomorrow at ' + r.t : d.toLocaleDateString(undefined, { weekday: 'long' }) + ' at ' + r.t }; }
    }
    if (n) slot.innerHTML = '<span class="dot"></span><span>Next class <b>' + n.r.c + '</b> · ' + n.when + '</span>'; else slot.hidden = true;
  };
  window.__renderNext();

  // class finder
  var finder = document.getElementById('finder');
  if (finder) {
    var st = { who: 'me', exp: 'none', goal: 'fit' };
    var RES = {
      kids: { l: 'Kids · Eagles', n: 'Your child\'s age group', t: 'Baby Eagles 3–4, Little Eagles 5–6, Eagle Warriors 7–12, Teens 13–16. Trials are one-on-one with an instructor.', s: ['Free trial on Mon, Wed or Fri: ages 3–6 at 3:30 pm', 'Ages 7–16 at 5:00 pm', 'Gear rental $15, refunded when they sign up'], href: 'free-class.html', cta: 'Book free trial' },
      women: { l: 'Women only', n: 'Women\'s program', t: 'Taught by Ursula Valverde, black belt. Self-defense first, all levels together.', s: ['Mon & Wed 6:10 pm · Tue 8:00 am · Sat 11:15 am', 'Start with the four-week Beginners course or sign up directly', 'Gear rental $20, refunded when you sign up'], href: 'start.html', cta: 'Start training' },
      beg: { l: 'Start here', n: 'Four-week Beginners course', t: 'Built for zero experience: falls, escapes, first submissions. Then Fundamentals 1.', s: ['Mon & Wed 8:00 pm · Thu 6:10 pm, rolling start', 'Three classes a week for four weeks', 'Gear rental $20, refunded when you sign up'], href: 'start.html', cta: 'Start training' },
      fund: { l: 'Adults', n: 'Fundamentals 1–3', t: 'Join at your stripe level with people at your level. Gi, with No-Gi Fundamentals Tue/Thu 6:10 pm.', s: ['Start with the four-week Beginners course or sign up directly', 'Mornings, lunchtimes and evenings', 'Drop-in $60 with gi, refunded if you sign up'], href: 'start.html', cta: 'Start training' },
      adv: { l: 'Blue belt and up', n: 'Advanced & Competition', t: 'Cobrinha\'s room. Ninety-minute classes, gi and no-gi, competition prep inside.', s: ['Mon & Wed 7:20 pm · Mon/Wed/Fri 12 pm', 'No-Gi Advanced Tue & Thu 12 pm', 'Drop-in $60 with gi, refunded if you sign up'], href: 'programs.html#advanced', cta: 'Reserve a spot' },
      nogi: { l: 'All levels', n: 'No-Gi', t: 'Six classes a week, all on Tuesday and Thursday. Start in No-Gi Fundamentals.', s: ['Tue & Thu 6:10 pm Fundamentals', 'Tue & Thu 7:20 pm No-Gi · 12 pm Advanced', 'Start with the four-week Beginners course or sign up directly'], href: 'start.html', cta: 'Start training' }
    };
    function pick() {
      if (st.who === 'kid') return RES.kids; if (st.who === 'woman') return RES.women;
      if (st.exp === 'none') return st.goal === 'nogi' ? RES.nogi : RES.beg;
      if (st.exp === 'some') return st.goal === 'nogi' ? RES.nogi : RES.fund;
      return st.goal === 'nogi' ? RES.nogi : RES.adv;
    }
    var out = document.getElementById('fres');
    function render() {
      var r = pick(); out.classList.add('flash');
      setTimeout(function () { out.innerHTML = '<div class="rl">' + r.l + '</div><div class="rn">' + r.n + '</div><div class="rt">' + r.t + '</div><div class="rs">' + r.s.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div><a class="btn red" href="' + r.href + '">' + r.cta + '</a>'; out.classList.remove('flash'); }, 160);
    }
    finder.querySelectorAll('.opt').forEach(function (b) {
      b.addEventListener('click', function () { var g = b.getAttribute('data-g'); st[g] = b.getAttribute('data-v'); finder.querySelectorAll('.opt[data-g="' + g + '"]').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); render(); });
    });
    render();
  }

  // kids age picker
  var age = document.getElementById('age');
  if (age) {
    var ao = document.getElementById('ageOut'), ar = document.getElementById('ageRes');
    function grp(a) {
      if (a < 3) return ['Not yet', 'Baby Eagles starts at 3. Come back on their third birthday; we save a spot.', ''];
      if (a <= 4) return ['Baby Eagles', 'Tuesday & Thursday 4:10 pm · short, game-based classes', 'Free trial: Mon, Wed or Fri 3:30 pm, 30 minutes'];
      if (a <= 6) return ['Little Eagles', 'Monday, Wednesday & Friday 4:10 pm', 'Free trial: Mon, Wed or Fri 3:30 pm, 30 minutes'];
      if (a <= 12) return ['Eagle Warriors', 'Monday–Thursday 5:00 pm · Friday No-Gi 5:00 pm · Saturday 9:00 am', 'Free trial: Mon, Wed or Fri 5:00 pm'];
      if (a <= 16) return ['Eagle Teens', 'Tuesday & Thursday 5:00 pm', 'Free trial: Mon, Wed or Fri 5:00 pm'];
      return ['Adult program', 'From 17, teens train with the adults: the four-week Beginners course, then Fundamentals 1.', 'Beginners course Mon & Wed 8:00 pm · Thu 6:10 pm, or sign up directly'];
    }
    function upd() { var a = +age.value, g = grp(a); ao.textContent = a; ar.innerHTML = '<b>' + g[0] + '</b><i>' + g[1] + '</i>' + (g[2] ? '<i>' + g[2] + '</i>' : ''); }
    age.addEventListener('input', upd); upd();
  }

  // titles timeline
  var tl = document.getElementById('tl');
  if (tl) {
    var det = document.getElementById('tld');
    tl.querySelectorAll('.tli').forEach(function (it) {
      function on() { tl.querySelectorAll('.tli').forEach(function (x) { x.classList.remove('on'); }); it.classList.add('on'); if (!det) return; det.classList.add('flash'); setTimeout(function () { det.textContent = it.getAttribute('data-d'); det.classList.remove('flash'); }, 120); }
      it.addEventListener('mouseenter', on); it.addEventListener('click', on); it.addEventListener('focus', on);
    });
    var first = tl.querySelector('.tli'); if (first) first.click();
  }

  // schedule day pills + "now" highlight
  var days = document.getElementById('days');
  if (days) {
    var rows = document.querySelectorAll('.sched tbody tr'), dn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], today = dn[new Date().getDay()], nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    var pills = days.querySelectorAll('.day');
    pills.forEach(function (p) { if (p.getAttribute('data-d') === today) p.classList.add('today'); p.addEventListener('click', function () { var d = p.getAttribute('data-d'); pills.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); p.setAttribute('aria-pressed', 'true'); rows.forEach(function (r) { r.hidden = !(d === 'all' || r.querySelector('td.d').textContent.trim() === d); }); document.querySelectorAll('.tab').forEach(function (t) { t.setAttribute('aria-selected', t.getAttribute('data-filter') === 'all' ? 'true' : 'false'); }); }); });
    rows.forEach(function (r) { var d = r.querySelector('td.d').textContent.trim(), m = /(\d+):(\d+)\s*(am|pm)/i.exec(r.querySelector('td.t').textContent); if (d === today && m) { var mm = (+m[1] % 12 + (/pm/i.test(m[3]) ? 12 : 0)) * 60 + (+m[2]); if (mm >= nowMin && mm < nowMin + 180) r.classList.add('now'); } });
  }
})();

/* Spanish page: translate the shared chrome (nav, dock, footer CTAs) */
(function(){
  var MAPS={pt:{"Start training":"Comece a treinar","Come train with us this week":"Venha treinar com a gente esta semana","Call":"Ligar","Sign the waiver":"Assinar o termo","Academy":"Academia","Programs":"Programas","Kids":"Kids","Schedule":"Horários","Contact":"Contato","Women's program":"Turma feminina","Membership":"Mensalidade","Q&A":"Perguntas","Instructors":"Professores","Cobrinha's record":"Conquistas do Cobrinha","Visit":"Visite","Beginners":"Iniciantes","Free class":"Aula grátis","Pricing":"Preços","Privacy":"Privacidade","Call us":"Ligue","Start here":"Comece aqui","Home":"Início","Text us":"Mande mensagem","Sign the waiver · create your profile":"Assine o termo · cria seu cadastro","Privates":"Particulares","Visit":"Visite","Private lessons":"Aulas particulares","Book a private lesson":"Agende uma aula particular","Book a kids' free trial":"Agende a aula grátis (kids)","Book kids' free trial":"Aula grátis (kids)","Adult beginners course":"Curso para iniciantes","Kids & teens":"Crianças e adolescentes","All programs":"Todos os programas","Who is Cobrinha":"Quem é o Cobrinha","Visitor info & parking":"Visitantes e estacionamento","Questions & answers":"Perguntas e respostas","Reviews":"Avaliações","Holiday closures":"Feriados (fechado)","Book free trial":"Agendar aula grátis"}};
  MAPS.es={"Start training":"Empieza a entrenar","Come train with us this week":"Ven a entrenar con nosotros esta semana","Call":"Llamar","Sign the waiver":"Firmar la exención","Academy":"Academia","Programs":"Programas","Kids":"Niños","Schedule":"Horarios","Contact":"Contacto","Women's program":"Programa de mujeres","Membership":"Membresía","Q&A":"Preguntas","Instructors":"Instructores","Cobrinha's record":"Palmarés de Cobrinha","Visit":"Visítanos","Beginners":"Principiantes","Free class":"Clase gratis","Pricing":"Precios","Privacy":"Privacidad","Call us":"Llámanos","Start here":"Empieza aquí","Home":"Inicio","Text us":"Escríbenos","Sign the waiver · create your profile":"Firma la exención · crea tu perfil","Privates":"Privadas","Visit":"Visítanos","Private lessons":"Clases privadas","Book a private lesson":"Reserva una clase privada","Book a kids' free trial":"Reserva la clase gratis (niños)","Book kids' free trial":"Clase gratis (niños)","Adult beginners course":"Curso para principiantes","Kids & teens":"Niños y adolescentes","All programs":"Todos los programas","Who is Cobrinha":"Quién es Cobrinha","Visitor info & parking":"Visitantes y estacionamiento","Questions & answers":"Preguntas y respuestas","Reviews":"Reseñas","Holiday closures":"Días festivos (cerrado)","Book free trial":"Reservar clase gratis"};
  var ES_STRINGS=MAPS[document.documentElement.lang]; if(!ES_STRINGS)return;
  document.querySelectorAll("nav a, .menu a, .dock a, .cta-band a, .cta-band h2, footer a, footer h4").forEach(function(a){
    var k=(a.textContent||"").replace(/\s+/g," ").trim();
    if(ES_STRINGS[k]){a.textContent=ES_STRINGS[k];}
  });
})();


/* ===== Gymdesk-fed schedule: week grid + feeds the "today" list and "next class" pill ===== */
(function () {
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], COLS = [1, 2, 3, 4, 5, 6, 0]; // Mon–Sat, then Sunday (members only)
  // ponytail: css/site.css .wrow still says repeat(6,…); this rule widens the desktop grid to seven days until that line is changed
  document.head.insertAdjacentHTML('beforeend', '<style>@media(min-width:900px){.wrow{grid-template-columns:78px repeat(7,minmax(0,1fr))}}</style>');
  function fmt(m) { var h = Math.floor(m / 60), mm = m % 60; return ((h + 11) % 12 + 1) + ':' + (mm < 10 ? '0' : '') + mm + (h < 12 ? ' am' : ' pm'); }
  function split(title) { var m = /^([^(]+?)\s*\(([^)]*)\)\s*(.*)$/.exec(title); if (!m) return { n: title.replace(/\s+/g, ' ').trim(), s: '' }; var n = m[1].replace(/[\s\-–:]+$/, '').trim(), s = m[2].trim(), rest = m[3].replace(/^[\s\-–:·]+/, '').trim(); if (rest) s = s ? s + ' · ' + rest : rest; return { n: n, s: s }; }
  function publicEvents(ev) { return ev.filter(function (e) { return !/private class/i.test(e.title); }); }
  function renderGrid(ev) {
    var grid = document.getElementById('wgrid'); if (!grid) return;
    var todayIdx = new Date().getDay(), nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    var times = []; ev.forEach(function (e) { if (times.indexOf(e.start) < 0) times.push(e.start); }); times.sort(function (a, b) { return a - b; });
    var html = '<div class="wrow head"><div class="wt"></div>';
    COLS.forEach(function (d) { html += '<div class="wc' + (d === todayIdx ? ' today' : '') + '" data-d="' + d + '">' + DAYS[d] + '</div>'; });
    html += '</div>';
    times.forEach(function (t) {
      html += '<div class="wrow" data-t="' + t + '"><div class="wt">' + fmt(t) + '</div>';
      COLS.forEach(function (d) {
        var cell = ev.filter(function (e) { return e.day === d && e.start === t; });
        html += '<div class="wc' + (cell.length ? ' has' : '') + '" data-d="' + d + '">' + cell.map(function (e) {
          var p = split(e.title), live = d === todayIdx && nowMin >= e.start && nowMin < e.end;
          return '<span class="ev c-' + (e.color || 'black') + (live ? ' now' : '') + '">' + p.n + '<small>' + (p.s ? p.s + ' · ' : '') + fmt(e.start).replace(' ', '') + '–' + fmt(e.end).replace(' ', '') + '</small></span>';
        }).join('') + '</div>';
      });
      html += '</div>';
    });
    grid.innerHTML = html;
    var legend = document.getElementById('legend');
    if (legend) legend.innerHTML = '<span class="c-black">Fundamentals 1 · all levels</span><span class="c-magenta">Fundamentals 2 · 3 stripes +</span><span class="c-blue">Advanced &amp; No-Gi · blue belt +</span><span class="c-purple">Women\'s class</span><span class="c-brown">Baby Eagles 3–4</span><span class="c-green">Little Eagles 5–6</span><span class="c-yellow">Eagle Warriors 7–12</span><span class="c-orange">Teens 13–16</span>';
    // mobile: one day at a time, driven by the day pills
    var pills = document.querySelectorAll('#days .day');
    function showDay(name) {
      var d = DAYS.indexOf(name); if (d < 0) d = 1;
      pills.forEach(function (b) { b.setAttribute('aria-pressed', DAYS.indexOf(b.getAttribute('data-d')) === d ? 'true' : 'false'); });
      grid.querySelectorAll('.wc').forEach(function (c) { c.classList.toggle('on', +c.getAttribute('data-d') === d); });
      grid.querySelectorAll('.wrow[data-t]').forEach(function (r) { var c = r.querySelector('.wc[data-d="' + d + '"]'); r.classList.toggle('hide-d', !(c && c.classList.contains('has'))); });
    }
    pills.forEach(function (b) { b.addEventListener('click', function () { showDay(b.getAttribute('data-d')); }); });
    showDay(DAYS[todayIdx]);
  }
  function feedLegacy(ev) { // shape used by the home "today" list and the "next class" pill
    window.SCHEDULE = ev.map(function (e) { var p = split(e.title); return { d: DAYS[e.day], t: fmt(e.start), c: p.n + (/members only/i.test(p.s) ? ' · members only' : ''), k: '' }; });
    if (window.__renderToday) window.__renderToday(); if (window.__renderNext) window.__renderNext();
  }
  var url = window.SCHEDULE_URL || 'js/schedule.json';
  fetch(url, { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (data) {
    var ev = publicEvents(data.events || []); if (!ev.length) return;
    renderGrid(ev); feedLegacy(ev);
  }).catch(function () { var g = document.getElementById('wgrid'); if (g) g.innerHTML = '<p class="small muted" style="padding:16px">The live schedule could not load. <a class="link" href="https://cobrinha-jiu-jitsu-academy.gymdesk.com/schedule">Open it in Gymdesk</a>.</p>'; });
})();


/* ===== 2026-11-14: holidays, kids free-trial booking, thanks page ===== */
(function () {
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function nice(d, o) { return d.toLocaleDateString('en-US', o || { weekday: 'long', month: 'long', day: 'numeric' }); }
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var H = (window.HOLIDAYS || []).map(function (h) { var p = h[0].split('-'); return { d: new Date(+p[0], +p[1] - 1, +p[2]), k: h[0], n: h[1] }; })
    .filter(function (h) { return h.d >= today; }).sort(function (a, b) { return a.d - b.d; });
  var closed = {}; H.forEach(function (h) { closed[h.k] = h.n; });
  window.__closed = closed;

  // holiday lists
  document.querySelectorAll('.hol-list').forEach(function (ul) {
    ul.innerHTML = H.slice(0, 8).map(function (h) { return '<li><b>' + nice(h.d, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + '</b> <span>· ' + h.n + '</span></li>'; }).join('') || '<li>No closures coming up.</li>';
  });
  var next = H[0];
  document.querySelectorAll('.hol-inline').forEach(function (e) { if (next) e.textContent = 'Next: ' + nice(next.d, { month: 'long', day: 'numeric' }) + ' (' + next.n + ')'; });
  // closed today: replace the "today" list on the home page
  var tk = iso(today);
  if (closed[tk]) {
    var t = document.getElementById('today'); if (t) t.innerHTML = '<div class="srow"><b>Closed today</b><span>' + closed[tk] + '</span></div>';
    var nc = document.getElementById('nextClass'); if (nc) nc.innerHTML = '<span class="dot"></span><span>Closed today for ' + closed[tk] + '</span>';
  }

  // ---- kids free-trial booking ----
  // Trial days: Monday, Wednesday, Friday only. Booking window: the rest of this month;
  // from the 25th, next month's spots open too. Holidays above are skipped.
  var TRIAL = {
    days: [1, 3, 5],
    openNextMonthOn: 25,
    groups: {
      '3-4': { name: 'Baby Eagles (ages 3–4)', time: '3:30 pm', len: '30 min' },
      '5-6': { name: 'Little Eagles (ages 5–6)', time: '3:30 pm', len: '30 min' },
      '7-12': { name: 'Eagle Warriors (ages 7–12)', time: '5:00 pm', len: '1 hour' },
      '13-16': { name: 'Eagle Teens (ages 13–16)', time: '5:00 pm', len: '1 hour' }
    }
  };
  var form = document.getElementById('bookForm'), sel = document.getElementById('tGroup');
  if (form && sel) {
    var box = document.getElementById('tDays'), sum = document.getElementById('tSum'), err = document.getElementById('tErr'), win = document.getElementById('tWindow');
    var fDate = document.getElementById('tDate'), fTime = document.getElementById('tTimeIn'), fGroup = document.getElementById('tGroupName');
    var chosen = null;
    function lastDay() {
      var end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      if (today.getDate() >= TRIAL.openNextMonthOn) end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      return end;
    }
    function dates() {
      var out = [], d = new Date(today); d.setDate(d.getDate() + 1); var end = lastDay();
      for (; d <= end; d.setDate(d.getDate() + 1)) if (TRIAL.days.indexOf(d.getDay()) > -1 && !closed[iso(d)]) out.push(new Date(d));
      return out;
    }
    var end = lastDay();
    win.textContent = 'Open days through ' + nice(end, { month: 'long', day: 'numeric' }) + '. New spots open every month.';
    function update() {
      var g = TRIAL.groups[sel.value];
      fGroup.value = g ? g.name : '';
      if (!g) { box.innerHTML = '<p class="small muted">Choose an age group first.</p>'; sum.hidden = true; return; }
      var ds = dates();
      box.innerHTML = ds.length ? ds.map(function (d) { var k = iso(d); return '<button type="button" class="tday" role="radio" aria-checked="' + (chosen === k) + '" data-k="' + k + '"><b>' + nice(d, { weekday: 'short' }) + '</b><small>' + nice(d, { month: 'short', day: 'numeric' }) + ' · ' + g.time + '</small></button>'; }).join('')
        : '<p class="small muted">No open days left this month. Call or text (323) 931-9953 and we\'ll fit you in.</p>';
      box.querySelectorAll('.tday').forEach(function (b) { b.addEventListener('click', function () { chosen = b.getAttribute('data-k'); update(); }); });
      if (chosen && !ds.some(function (d) { return iso(d) === chosen; })) chosen = null;
      if (chosen) {
        var p = chosen.split('-'), cd = new Date(+p[0], +p[1] - 1, +p[2]);
        fDate.value = nice(cd, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); fTime.value = g.time + ' (' + g.len + ')';
        sum.innerHTML = '<b>' + g.name + '</b><br>' + fDate.value + ' at ' + g.time + ' · ' + g.len + ', one-on-one';
        sum.hidden = false;
      } else { fDate.value = ''; fTime.value = ''; sum.hidden = true; }
    }
    sel.addEventListener('change', function () { chosen = null; update(); });
    var qa = new URLSearchParams(location.search).get('age'); if (qa && TRIAL.groups[qa]) sel.value = qa;
    update();
    form.addEventListener('submit', function (ev) {
      var miss = !sel.value ? 'Choose an age group.' : !chosen ? 'Pick a day.' : !form.name.value.trim() ? 'Add your name.' : !form.phone.value.trim() ? 'Add a phone number.' : !/.+@.+\..+/.test(form.email.value) ? 'Add a valid email.' : '';
      if (miss) { ev.preventDefault(); err.textContent = miss; err.hidden = false; return; }
      err.hidden = true;
      var g = TRIAL.groups[sel.value];
      form.querySelector('[name="_subject"]').value = 'Kids\' free trial booked: ' + fDate.value + ' ' + g.time + ' · ' + g.name;
      var nx = form.querySelector('[name="_next"]'); nx.value = nx.value.split('?')[0] + '?d=' + encodeURIComponent(fDate.value) + '&t=' + encodeURIComponent(g.time) + '&g=' + encodeURIComponent(g.name);
    });
  }

  // thanks page: show what was booked
  var lead = document.getElementById('thxLead'), q = new URLSearchParams(location.search);
  if (lead && q.get('d')) {
    var esc = function (x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    lead.innerHTML = 'Free trial booked: <b>' + esc(q.get('g') || '') + '</b>, ' + esc(q.get('d')) + ' at ' + esc(q.get('t') || '') + '. We\'ll confirm by text or email. Need to change it? Call or text <a class="link" href="tel:+13239319953">(323) 931-9953</a>.';
  }

  // kids age slider: send the "Book" button to the right age group
  var age = document.getElementById('age'), ab = document.getElementById('ageBook');
  if (age && ab) { var setA = function () { var a = +age.value, k = a <= 4 ? '3-4' : a <= 6 ? '5-6' : a <= 12 ? '7-12' : '13-16'; ab.href = 'free-class.html?age=' + k; ab.hidden = a < 3 || a > 16; }; age.addEventListener('input', setA); setA(); }
})();
