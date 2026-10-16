// Lalima Photo Studio: the only script on the site (besides Tailwind CDN).
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const t = (en, ne) => (document.documentElement.lang === 'ne' ? ne : en);

// Footer year
document.querySelectorAll('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));

// Mobile menu: aria-expanded, Escape closes, focus trapped while open
const menuBtn = document.getElementById('menu-btn');
const menu = document.getElementById('menu');
if (menuBtn && menu) {
  const focusables = () => menu.querySelectorAll('a, button');
  const close = () => {
    menu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    menuBtn.focus();
  };
  menuBtn.addEventListener('click', () => {
    menu.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    focusables()[0].focus();
  });
  menu.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
  menu.addEventListener('keydown', e => {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    const f = focusables(), first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

// Scroll reveal + stat count-up
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in');
    io.unobserve(e.target);
    const n = +e.target.dataset.count;
    if (n && !reduceMotion) {
      const t0 = performance.now();
      const tick = t => {
        const p = Math.min((t - t0) / 1200, 1);
        e.target.textContent = Math.round(n * (1 - (1 - p) ** 3));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }
}, { threshold: 0.15 });
document.querySelectorAll('.reveal, [data-count]').forEach(el => io.observe(el));

// Open now / Closed badge, Nepal time. Hours: Sun–Fri 08:00–20:00, Saturday closed.
// ponytail: hours hard-coded here and in the HTML; change both if they change.
function isOpen(date = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(date).map(x => [x.type, x.value]));
  const mins = +p.hour * 60 + +p.minute;
  return p.weekday !== 'Sat' && mins >= 8 * 60 && mins < 20 * 60;
}
document.querySelectorAll('[data-open-badge]').forEach(el => {
  const open = isOpen();
  el.textContent = open ? t('Open now', 'अहिले खुला छ') : t('Closed now', 'अहिले बन्द छ');
  el.style.background = open ? '#DCFCE7' : '#FEE2E2';
  el.style.color = open ? '#14532D' : '#7F1D1D';
  el.hidden = false;
});

// Copy buttons
document.querySelectorAll('[data-copy]').forEach(btn => {
  btn.hidden = false;
  const label = btn.lastElementChild.textContent;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.lastElementChild.textContent = t('Copied!', 'कपी भयो!');
    } catch {
      btn.lastElementChild.textContent = t('Press and hold to copy', 'थिचेर कपी गर्नुहोस्');
    }
    setTimeout(() => (btn.lastElementChild.textContent = label), 2500);
  });
});

// Click-to-load map
document.querySelectorAll('[data-map-src]').forEach(btn => btn.addEventListener('click', () => {
  const f = document.createElement('iframe');
  f.src = btn.dataset.mapSrc;
  f.title = 'Map to Lalima Photo Studio, Gauradaha';
  f.loading = 'lazy';
  f.allowFullscreen = true;
  f.referrerPolicy = 'strict-origin-when-cross-origin';
  f.className = 'w-full aspect-video rounded-[20px] border-0';
  btn.closest('[data-map]').replaceWith(f);
}));

// Services filter
const filters = document.querySelectorAll('[data-filter]');
filters.forEach(b => {
  b.closest('[data-filters]').hidden = false;
  b.addEventListener('click', () => {
    filters.forEach(x => x.setAttribute('aria-pressed', x === b));
    document.querySelectorAll('[data-cat]').forEach(card => {
      card.hidden = b.dataset.filter !== 'all' && !card.dataset.cat.split(' ').includes(b.dataset.filter);
    });
  });
});

// Inquiry form → mailto (plain form action is the no-JS fallback)
const form = document.getElementById('inquiry');
if (form) {
  const status = document.getElementById('form-status');
  const F = form.elements;
  const dateWrap = document.getElementById('date-wrap');
  const toggleDate = () => (dateWrap.hidden = !/Wedding|Event/.test(F.service.value));
  F.service.addEventListener('change', toggleDate);
  toggleDate();

  const text = () => {
    const v = n => F[n].value.trim();
    return [
      `Name: ${v('name')}`,
      `Phone: ${v('phone')}`,
      `Service: ${v('service')}`,
      dateWrap.hidden ? '' : `Event date: ${v('date')}`,
      '',
      v('message'),
      '',
      '(Sent from the Lalima Photo Studio website)',
    ].filter((l, i) => l || i > 3).join('\n');
  };
  const invalid = () => {
    if (form.reportValidity()) return false;
    status.textContent = t('Please fill in your name and message.', 'कृपया आफ्नो नाम र सन्देश लेख्नुहोस्।');
    return true;
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (invalid()) return;
    const subject = `Website inquiry: ${F.service.value} – ${F.name.value.trim()}`;
    location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text())}`;
    status.textContent = t(
      `Your email app should open. If it didn't, email us at ${form.dataset.email} or call us.`,
      `तपाईंको इमेल एप खुल्नुपर्ने हो। नखुलेमा ${form.dataset.email} मा इमेल गर्नुहोस् वा फोन गर्नुहोस्।`);
  });
  document.getElementById('send-wa')?.addEventListener('click', () => {
    if (invalid()) return;
    window.open(`https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(text())}`, '_blank', 'noopener');
  });
}
