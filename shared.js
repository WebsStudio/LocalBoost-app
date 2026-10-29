// Piezas comunes a todas las plantillas: documento HTML, CSS base, JS base y helpers de marcado.
// Todo lo que viene de datos del usuario pasa por esc() antes de entrar en el HTML.

import { esc, escMultiline } from '../core/utils.js';

export { esc, escMultiline };

// ---------- Iconos para la web generada (SVG en línea, currentColor) ----------

const ICO = {
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  whatsapp: '<path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3Z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.2-2-1-.8.8c-1-.4-1.9-1.300-2.300-2.300l.8-.8-1-2Z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.500" cy="6.500" r=".6" fill="currentColor"/>',
  facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.500A.5.5 0 0 1 14 8Z"/>',
  tiktok: '<path d="M14 3v11.500a3.500 3.500 0 1 1-3.500-3.500M14 3c.3 2.600 2 4.300 5 4.500"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  star: '<path d="m12 2 3.100 6.300 6.900 1-5 4.900 1.200 6.800-6.200-3.300-6.200 3.300L8 14.200 3 9.300l6.900-1Z"/>',
  quote: '<path d="M7 7h4v4c0 3-2 5-4 5M15 7h4v4c0 3-2 5-4 5"/>',
};

export function ico(name, cls = '') {
  return `<svg class="ico ${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICO[name] || ''}</svg>`;
}

// ---------- Helpers de marcado ----------

export const extAttrs = (external) => (external ? ' target="_blank" rel="noopener noreferrer"' : '');

export function img(image, { cls = '', eager = false, alt } = {}) {
  if (!image) return '';
  const wh = image.width && image.height ? ` width="${image.width}" height="${image.height}"` : '';
  const a = alt !== undefined ? alt : image.alt;
  return `<img${cls ? ` class="${esc(cls)}"` : ''} src="${esc(image.path)}" alt="${esc(a)}"${wh} ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}>`;
}

export function paragraphs(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escMultiline(p)}</p>`)
    .join('\n');
}

export function brandMark(m, cls = 'brand') {
  const inner = m.logo ? img(m.logo, { cls: 'brand__logo', eager: true, alt: m.name }) : `<span class="brand__text">${esc(m.name)}</span>`;
  return `<a class="${cls}" href="#inicio"${m.logo ? ` aria-label="${esc(m.name)}, inicio"` : ''}>${inner}</a>`;
}

export function navLinks(m, cls = 'nav__link') {
  return m.nav.map((n) => `<a class="${cls}" href="#${n.id}">${esc(n.label)}</a>`).join('');
}

export function socialLinks(m, cls = 'social') {
  if (!m.social.length) return '';
  return `<ul class="${cls}" aria-label="Redes sociales">${m.social
    .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.label)}">${ico(s.network)}<span class="sr-only">${esc(s.label)}</span></a></li>`)
    .join('')}</ul>`;
}

export function ctaButton(m, cls = 'btn btn--primary', { arrow = true } = {}) {
  return `<a class="${cls}" href="${esc(m.cta.href)}"${extAttrs(m.cta.external)}>${esc(m.cta.label)}${arrow ? ico('arrow') : ''}</a>`;
}

/** Lista de datos de contacto directos (teléfono, WhatsApp, email, dirección). */
export function contactList(m, cls = 'contact-list') {
  const items = [];
  if (m.links.whatsapp) items.push(`<li><a href="${esc(m.links.whatsapp)}" target="_blank" rel="noopener noreferrer">${ico('whatsapp')}<span>WhatsApp</span></a></li>`);
  if (m.links.tel) items.push(`<li><a href="${esc(m.links.tel)}">${ico('phone')}<span>${esc(m.phone)}</span></a></li>`);
  if (m.links.email) items.push(`<li><a href="${esc(m.links.email)}">${ico('mail')}<span>${esc(m.email)}</span></a></li>`);
  if (m.address || m.city) {
    const text = [m.address, m.city].filter(Boolean).join(', ');
    items.push(m.links.map
      ? `<li><a href="${esc(m.links.map)}" target="_blank" rel="noopener noreferrer">${ico('pin')}<span>${esc(text)}</span></a></li>`
      : `<li><span class="contact-list__static">${ico('pin')}<span>${esc(text)}</span></span></li>`);
  }
  if (m.links.booking) items.push(`<li><a href="${esc(m.links.booking)}" target="_blank" rel="noopener noreferrer">${ico('arrow')}<span>Reservar online</span></a></li>`);
  return items.length ? `<ul class="${cls}">${items.join('')}</ul>` : '';
}

/** Formulario honesto: prepara un correo o un mensaje de WhatsApp; no envía nada por sí mismo. */
export function contactForm(m, { cls = 'form', submitLabel } = {}) {
  if (m.formMode === 'none') return '';
  const isMail = m.formMode === 'email';
  const label = submitLabel || (isMail ? 'Preparar correo' : 'Enviar por WhatsApp');
  const data = isMail
    ? `data-mode="email" data-email="${esc(m.email)}" data-subject="${esc(`Consulta desde la web de ${m.name}`)}"`
    : `data-mode="whatsapp" data-wa="${esc(m.links.whatsapp.split('?')[0])}"`;
  const note = isMail
    ? 'Al enviar se abrirá tu aplicación de correo con el mensaje ya preparado.'
    : 'Al enviar se abrirá WhatsApp con el mensaje ya preparado.';
  return `<form class="${cls}" data-contact-form ${data} novalidate>
  <div class="field"><label for="f-name">Nombre</label><input id="f-name" name="name" type="text" autocomplete="name" required></div>
  ${isMail ? '' : ''}<div class="field"><label for="f-contact">Teléfono o email <span class="opt">(opcional)</span></label><input id="f-contact" name="contact" type="text" autocomplete="off"></div>
  <div class="field field--full"><label for="f-msg">Mensaje</label><textarea id="f-msg" name="message" rows="4" required></textarea></div>
  <div class="field--full form__foot"><button class="btn btn--primary" type="submit">${esc(label)}${ico('arrow')}</button><p class="form__note">${esc(note)}</p></div>
  <p class="form__status" data-form-status role="status" aria-live="polite"></p>
  <noscript><p class="form__note">Activa JavaScript para usar el formulario o utiliza los datos de contacto de arriba.</p></noscript>
</form>`;
}

// ---------- Documento ----------

const SCHEMA_DAYS = { Lunes: 'Monday', Martes: 'Tuesday', Miércoles: 'Wednesday', Jueves: 'Thursday', Viernes: 'Friday', Sábado: 'Saturday', Domingo: 'Sunday' };

function jsonLd(m) {
  const data = { '@context': 'https://schema.org', '@type': 'LocalBusiness', name: m.name, description: m.description };
  if (m.phone) data.telephone = m.phone;
  if (m.email) data.email = m.email;
  if (m.address || m.city) data.address = { '@type': 'PostalAddress', ...(m.address ? { streetAddress: m.address } : {}), ...(m.city ? { addressLocality: m.city } : {}) };
  const open = m.rawHours.filter((r) => !r.closed && SCHEMA_DAYS[r.day]);
  if (open.length) data.openingHoursSpecification = open.map((r) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: SCHEMA_DAYS[r.day], opens: r.open, closes: r.close }));
  if (m.social.length) data.sameAs = m.social.map((s) => s.url);
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function faviconDataUrl(m) {
  const letter = (m.name.trim()[0] || 'W').toUpperCase().replace(/[<>&"']/g, 'W');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='${m.palette.primary}'/><text x='32' y='44' font-family='Georgia,serif' font-size='36' font-weight='700' text-anchor='middle' fill='${m.palette.onPrimary}'>${letter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function documentShell(m, body) {
  const desc = esc(m.description.slice(0, 160));
  return `<!doctype html>
<html lang="${m.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(m.title)}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="${esc(m.palette.bg)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:title" content="${esc(m.title)}">
<meta property="og:description" content="${desc}">
<meta property="og:site_name" content="${esc(m.name)}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="${esc(faviconDataUrl(m))}">
<link rel="stylesheet" href="style.css">
<script type="application/ld+json">${jsonLd(m)}</script>
</head>
<body class="tpl-${esc(m.templateId)}">
<a class="skip-link" href="#contenido">Saltar al contenido</a>
${body}
<script src="script.js" defer></script>
</body>
</html>
`;
}

// ---------- CSS base ----------

const STYLE_TOKENS = {
  soft: { radius: '14px', radiusLg: '28px', border: '1px' },
  editorial: { radius: '2px', radiusLg: '4px', border: '1px' },
  sharp: { radius: '0px', radiusLg: '0px', border: '2px' },
};

export function baseCss(m) {
  const p = m.palette;
  const st = STYLE_TOKENS[m.style] || STYLE_TOKENS.soft;
  return `/* ${m.name} — estilos
   Variables de color y tipografía en :root: cámbialas aquí para retocar la web. */
:root {
  --bg: ${p.bg};
  --surface: ${p.surface};
  --surface-2: ${p.surface2};
  --text: ${p.text};
  --muted: ${p.muted};
  --line: ${p.line};
  --shadow: ${p.shadow};
  --primary: ${p.primary};
  --on-primary: ${p.onPrimary};
  --accent: ${p.accent};
  --primary-soft: ${p.primarySoft};
  --ink: ${p.ink};
  --on-ink: ${p.onInk};
  --font-head: ${m.fonts.heading};
  --font-body: ${m.fonts.body};
  --radius: ${st.radius};
  --radius-lg: ${st.radiusLg};
  --bw: ${st.border};
  color-scheme: ${p.dark ? 'dark' : 'light'};
}

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: 84px; -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--font-body); font-size: 1.0625rem; line-height: 1.65; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
img { display: block; max-width: 100%; height: auto; }
a { color: var(--accent); text-underline-offset: 3px; }
h1, h2, h3, h4 { margin: 0; font-family: var(--font-head); line-height: 1.12; text-wrap: balance; }
p { margin: 0 0 1em; }
ul { margin: 0; padding: 0; list-style: none; }
.container { width: min(1160px, 100% - 2.5rem); margin-inline: auto; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.skip-link { position: absolute; left: 1rem; top: -4rem; z-index: 1000; padding: .7rem 1rem; background: var(--primary); color: var(--on-primary); border-radius: var(--radius); font-weight: 600; transition: top .15s; }
.skip-link:focus { top: 1rem; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
.ico { width: 1.2em; height: 1.2em; flex: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: .6em; min-height: 48px; padding: .75em 1.5em; border: var(--bw) solid transparent; border-radius: var(--radius); font: 600 1rem/1.2 var(--font-body); text-decoration: none; cursor: pointer; transition: transform .2s, background-color .2s, color .2s, border-color .2s, box-shadow .2s; }
.btn:hover { transform: translateY(-2px); }
.btn--primary { background: var(--primary); color: var(--on-primary); }
.btn--primary:hover { box-shadow: 0 10px 24px -8px var(--primary); }
.btn--ghost { background: transparent; color: var(--text); border-color: var(--line); }
.btn--ghost:hover { border-color: var(--text); }
.field { display: flex; flex-direction: column; gap: .4rem; }
.field--full { grid-column: 1 / -1; }
.field label { font-size: .9rem; font-weight: 600; }
.field .opt { font-weight: 400; color: var(--muted); }
.field input, .field textarea { width: 100%; padding: .8rem 1rem; font: inherit; color: var(--text); background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); }
.field input:hover, .field textarea:hover { border-color: var(--muted); }
.field input:focus, .field textarea:focus { outline: 3px solid var(--primary-soft); border-color: var(--accent); }
.field [aria-invalid="true"] { border-color: #d64545; }
.form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form__foot { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.form__note { margin: 0; font-size: .85rem; color: var(--muted); }
.form__status { grid-column: 1 / -1; margin: 0; min-height: 1.4em; font-size: .95rem; color: var(--accent); }
.form__status[data-error] { color: #d64545; }
@media (max-width: 640px) { .form { grid-template-columns: 1fr; } }
.contact-list { display: grid; gap: .75rem; }
.contact-list a, .contact-list__static { display: inline-flex; align-items: center; gap: .7rem; color: inherit; text-decoration: none; }
.contact-list a:hover span { text-decoration: underline; text-underline-offset: 4px; }
.social { display: flex; gap: .6rem; }
.social a { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--line); color: inherit; transition: background-color .2s, color .2s, border-color .2s; }
.social a:hover { background: var(--primary); color: var(--on-primary); border-color: var(--primary); }
.brand { display: inline-flex; align-items: center; color: inherit; text-decoration: none; }
.brand__logo { max-height: 44px; width: auto; }
.js [data-reveal] { opacity: 0; transform: translateY(18px); transition: opacity .7s ease, transform .7s ease; }
.js [data-reveal].in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .js [data-reveal] { opacity: 1; transform: none; }
}
`;
}

// ---------- JS base ----------

export function baseJs() {
  return `/* Comportamiento mínimo: menú móvil, cabecera, formulario de contacto y animaciones suaves. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-open', open);
    };
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setOpen(false); toggle.focus(); } });
  }

  var header = document.querySelector('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var y = String(new Date().getFullYear());
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) { el.textContent = y; });

  var form = document.querySelector('[data-contact-form]');
  if (form) {
    var status = form.querySelector('[data-form-status]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name;
      var msg = form.elements.message;
      var bad = [name, msg].filter(function (f) { return !f.value.trim(); });
      [name, msg].forEach(function (f) { f.setAttribute('aria-invalid', String(!f.value.trim())); });
      if (bad.length) {
        status.setAttribute('data-error', '');
        status.textContent = 'Por favor, completa tu nombre y el mensaje.';
        bad[0].focus();
        return;
      }
      status.removeAttribute('data-error');
      var contact = form.elements.contact.value.trim();
      var text = msg.value.trim() + '\\n\\n— ' + name.value.trim() + (contact ? ' (' + contact + ')' : '');
      if (form.dataset.mode === 'email') {
        window.location.href = 'mailto:' + form.dataset.email + '?subject=' + encodeURIComponent(form.dataset.subject) + '&body=' + encodeURIComponent(text);
        status.textContent = 'Se está abriendo tu aplicación de correo. Si no se abre, escríbenos directamente a ' + form.dataset.email + '.';
      } else {
        window.open(form.dataset.wa + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
        status.textContent = 'Se está abriendo WhatsApp con tu mensaje preparado.';
      }
    });
  }

  var items = document.querySelectorAll('[data-reveal]');
  if (items.length) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      Array.prototype.forEach.call(items, function (el) { io.observe(el); });
    }
  }
})();
`;
}
