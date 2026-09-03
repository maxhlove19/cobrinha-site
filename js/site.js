/* Alliance Jiu Jitsu Los Angeles by Cobrinha — small, dependency-free */
(function () {
  // year
  var y = document.getElementById('yr'); if (y) y.textContent = new Date().getFullYear();

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
    setTimeout(function () { rv.forEach(show); }, 900);
  } else { rv.forEach(show); }

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

  // "today" list on the home page: pick rows for the current weekday from the embedded schedule data
  var today = document.getElementById('today');
  if (today && window.SCHEDULE) {
    var d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
    var list = window.SCHEDULE.filter(function (r) { return r.d === d; });
    var head = document.getElementById('todayName'); if (head) head.textContent = d === 'Sun' ? 'Sunday — closed. Here is Monday' : 'Today, ' + { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' }[d];
    if (d === 'Sun') list = window.SCHEDULE.filter(function (r) { return r.d === 'Mon'; });
    today.innerHTML = list.map(function (r) { return '<div class="srow"><b>' + r.c + '</b><span>' + r.t + '</span></div>'; }).join('') || '<div class="srow"><b>No classes today</b><span>See the full schedule</span></div>';
  }

  // free-class form: build a mailto fallback so the page works even before the form backend is connected
  var form = document.getElementById('bookForm');
  if (form) {
    form.addEventListener('submit', function (ev) {
      if (form.getAttribute('action')) return; // real backend connected
      ev.preventDefault();
      var f = new FormData(form), lines = [];
      f.forEach(function (v, k) { if (v) lines.push(k + ': ' + v); });
      location.href = 'mailto:info@cobrinhabjj.com?subject=' + encodeURIComponent('Free class request — ' + (f.get('program') || '')) + '&body=' + encodeURIComponent(lines.join('\n'));
    });
  }
})();
