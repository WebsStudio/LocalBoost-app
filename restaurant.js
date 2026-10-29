// Plantilla "Mesa": editorial y cálida para restaurantes, cafeterías y hostelería.
// Cabecera centrada en dos filas, portada a sangre con marco fino, carta de una columna
// con filetes ornamentales, galería en tira horizontal y contacto con campos subrayados.

import { esc, ico, img, paragraphs, brandMark, navLinks, socialLinks, contactList, contactForm, extAttrs, escMultiline } from '../shared.js';

const head = (id, title, intro = '', eyebrow = '') => `<header class="sec-head" data-reveal>
  ${eyebrow ? `<p class="eyebrow"><span>${esc(eyebrow)}</span></p>` : ''}
  <h2 id="${id}">${esc(title)}</h2>
  ${intro ? `<p class="sec-head__intro">${esc(intro)}</p>` : ''}
</header>`;

function hero(m, s) {
  const c = s.content;
  const place = [m.category, m.city].filter(Boolean).join(' · ');
  return `<section class="hero" id="inicio" aria-labelledby="hero-title">
  ${m.heroImg ? img(m.heroImg, { cls: 'hero__bg', eager: true, alt: '' }) : '<div class="hero__bg hero__bg--blank" aria-hidden="true"></div>'}
  <div class="hero__shade" aria-hidden="true"></div>
  <div class="hero__frame" aria-hidden="true"></div>
  <div class="container hero__in">
    <p class="eyebrow"><span>${esc(place)}</span></p>
    <h1 id="hero-title">${esc(c.title)}</h1>
    ${c.subtitle ? `<p class="hero__lead">${escMultiline(c.subtitle)}</p>` : ''}
    <div class="hero__actions">
      <a class="btn btn--primary" href="${esc(m.cta.href)}"${extAttrs(m.cta.external)}>${esc(m.cta.label)}${ico('arrow')}</a>
      ${m.has('services') ? '<a class="hero__link" href="#servicios">Ver la carta</a>' : ''}
    </div>
  </div>
</section>`;
}

function about(m, s) {
  const c = s.content;
  return `<section class="sec about" id="nosotros" aria-labelledby="about-title">
  <div class="container">
    <div class="about__grid" data-reveal>
      <div>
        <p class="eyebrow"><span>La casa</span></p>
        <h2 id="about-title">${esc(c.title)}</h2>
      </div>
      <div class="about__text">${paragraphs(c.text)}</div>
    </div>
    ${m.aboutImg ? `<figure class="about__wide" data-reveal>${img(m.aboutImg, { alt: '' })}</figure>` : ''}
  </div>
</section>`;
}

function services(m, s) {
  if (!m.services.length) return '';
  const item = (it) => `<li class="dish">
    <div class="dish__main">
      <div class="dish__top"><h4>${esc(it.name)}</h4>${it.price ? `<span class="dish__rule" aria-hidden="true"></span><span class="dish__price">${esc(it.price)}</span>` : ''}</div>
      ${it.description ? `<p>${escMultiline(it.description)}</p>` : ''}
    </div>
    ${it.image ? `<span class="dish__img">${img(it.image, { alt: '' })}</span>` : ''}
  </li>`;
  const groups = m.serviceGroups.map((g) => `<div class="menu__group">
    ${g.name ? `<h3 class="menu__cat"><span>${esc(g.name)}</span></h3>` : '<div class="menu__orn" aria-hidden="true">✦</div>'}
    <ul>${g.items.map(item).join('')}</ul>
  </div>`).join('');
  return `<section class="sec sec--panel" id="servicios" aria-labelledby="svc-title">
  <div class="container">
    ${head('svc-title', s.content.title, s.content.intro, 'La carta')}
    <div class="menu" data-reveal>${groups}</div>
  </div>
</section>`;
}

function gallery(m, s) {
  if (!m.galleryImgs.length) return '';
  return `<section class="sec sec--flush" id="galeria" aria-labelledby="gal-title">
  <div class="container">${head('gal-title', s.content.title, '', 'Ambiente')}</div>
  <div class="strip" tabindex="0" role="region" aria-label="Galería de imágenes (desplázate horizontalmente)" data-reveal>
    ${m.galleryImgs.map((i) => `<figure>${img(i)}</figure>`).join('')}
  </div>
</section>`;
}

function testimonials(m, s) {
  const items = s.content.items.filter((t) => t.text.trim());
  if (!items.length) return '';
  const [first, ...rest] = items;
  return `<section class="sec" id="opiniones" aria-labelledby="tes-title">
  <div class="container narrow">
    ${head('tes-title', s.content.title, '', 'Mesas que nos recuerdan')}
    <figure class="feature" data-reveal>
      <blockquote><p>${escMultiline(first.text)}</p></blockquote>
      ${first.name ? `<figcaption>— ${esc(first.name)}</figcaption>` : ''}
    </figure>
    ${rest.length ? `<ul class="more-quotes" data-reveal>${rest.map((t) => `<li><blockquote><p>${escMultiline(t.text)}</p></blockquote>${t.name ? `<cite>— ${esc(t.name)}</cite>` : ''}</li>`).join('')}</ul>` : ''}
  </div>
</section>`;
}

function hours(m, s) {
  if (!m.hours.length) return '';
  return `<section class="sec sec--panel" id="horario" aria-labelledby="hor-title">
  <div class="container narrow">
    ${head('hor-title', s.content.title, '', 'Nuestras horas')}
    <dl class="hours" data-reveal>
      ${m.hours.map((h) => `<div class="hours__row${h.closed ? ' is-closed' : ''}"><dt>${esc(h.label)}</dt><dd>${esc(h.text)}</dd></div>`).join('')}
    </dl>
  </div>
</section>`;
}

function location(m, s) {
  const text = [m.address, m.city].filter(Boolean).join(', ');
  if (!text) return '';
  return `<section class="sec place" id="ubicacion" aria-labelledby="loc-title">
  <div class="container place__in" data-reveal>
    <p class="eyebrow"><span>Dónde encontrarnos</span></p>
    <h2 id="loc-title">${esc(s.content.title)}</h2>
    <p class="place__addr">${esc(text)}</p>
    ${s.content.note ? `<p class="place__note">${escMultiline(s.content.note)}</p>` : ''}
    ${m.links.map ? `<a class="btn btn--ghost" href="${esc(m.links.map)}" target="_blank" rel="noopener noreferrer">${ico('pin')}Cómo llegar</a>` : ''}
  </div>
</section>`;
}

function contact(m, s) {
  const form = contactForm(m, { cls: 'form form--line' });
  const list = contactList(m, 'contact-list contact-list--big');
  if (!form && !list && !m.social.length) return '';
  return `<section class="sec sec--panel contact" id="contacto" aria-labelledby="con-title">
  <div class="container contact__in${form ? '' : ' contact__in--solo'}">
    <div data-reveal>
      <p class="eyebrow"><span>Reservas y consultas</span></p>
      <h2 id="con-title">${esc(s.content.title)}</h2>
      ${s.content.intro ? `<p class="contact__intro">${escMultiline(s.content.intro)}</p>` : ''}
      ${list}
      ${socialLinks(m)}
    </div>
    ${form ? `<div data-reveal>${form}</div>` : ''}
  </div>
</section>`;
}

function footer(m, s) {
  const custom = (s.content.text || '').trim();
  const text = [m.address, m.city].filter(Boolean).join(', ');
  return `<footer class="site-footer">
  <div class="container site-footer__grid">
    <div><p class="site-footer__name">${esc(m.name)}</p>${text ? `<p class="site-footer__small">${esc(text)}</p>` : ''}</div>
    ${m.nav.length ? `<nav aria-label="Pie de página" class="footnav">${navLinks(m, 'footnav__link')}</nav>` : '<span></span>'}
    <div class="site-footer__right">${socialLinks(m)}</div>
  </div>
  <p class="site-footer__copy container">${custom ? escMultiline(custom) : `© <span data-year>${new Date().getFullYear()}</span> ${esc(m.name)}. Todos los derechos reservados.`}</p>
</footer>`;
}

const RENDER = { hero, about, services, gallery, testimonials, hours, location, contact };

function header(m) {
  return `<header class="site-header" data-header>
  <div class="container">
    <div class="site-header__top">
      ${brandMark(m)}
      <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-label="Abrir o cerrar el menú">${ico('menu')}</button>
    </div>
    <nav class="nav" data-nav aria-label="Principal">
      ${navLinks(m)}
      <a class="nav__cta" href="${esc(m.cta.href)}"${extAttrs(m.cta.external)}>${esc(m.cta.label)}</a>
    </nav>
  </div>
</header>`;
}

export function render(m) {
  const main = m.sections.filter((s) => RENDER[s.type]).map((s) => RENDER[s.type](m, s)).join('\n');
  const foot = m.byType.footer ? footer(m, m.byType.footer) : '';
  return {
    body: `${header(m)}
<main id="contenido">
${m.has('hero') ? '' : '<span id="inicio"></span>'}
${main}
</main>
${foot}`,
    css: CSS,
    js: '',
  };
}

const CSS = `
/* ===== Plantilla Mesa ===== */
h1, h2, h3, h4 { font-weight: 400; }
.narrow { max-width: 820px; }
.eyebrow { display: flex; align-items: center; gap: 1rem; margin: 0 0 1.2rem; font-size: .76rem; letter-spacing: .3em; text-transform: uppercase; color: var(--accent); font-weight: 600; }
.eyebrow::before, .eyebrow::after { content: ''; height: 1px; width: 2.5rem; background: currentColor; opacity: .6; }
.sec-head .eyebrow { justify-content: center; }
.btn { border-radius: var(--radius); text-transform: uppercase; letter-spacing: .14em; font-size: .82rem; }

/* Cabecera en dos filas */
.site-header { position: sticky; top: 0; z-index: 50; background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
.site-header__top { display: flex; align-items: center; justify-content: center; padding: 1.1rem 0 .6rem; position: relative; }
.brand__text { font-family: var(--font-head); font-size: clamp(1.4rem, 3vw, 2rem); letter-spacing: .28em; text-transform: uppercase; }
.brand__logo { max-height: 52px; }
.nav { display: flex; justify-content: center; align-items: center; gap: clamp(1rem, 3vw, 2.6rem); padding: .5rem 0 .9rem; }
.nav__link { color: var(--muted); text-decoration: none; font-size: .78rem; letter-spacing: .22em; text-transform: uppercase; padding: .35rem 0; border-bottom: 1px solid transparent; transition: color .2s, border-color .2s; }
.nav__link:hover { color: var(--text); border-color: var(--accent); }
.nav__cta { color: var(--accent); text-decoration: none; font-size: .78rem; letter-spacing: .22em; text-transform: uppercase; padding: .55rem 1.1rem; border: 1px solid var(--accent); border-radius: var(--radius); transition: background-color .2s, color .2s; }
.nav__cta:hover { background: var(--primary); color: var(--on-primary); border-color: var(--primary); }
.nav-toggle { display: none; position: absolute; right: 0; top: 50%; transform: translateY(-40%); width: 44px; height: 44px; place-items: center; background: transparent; color: var(--text); border: 1px solid var(--line); border-radius: var(--radius); cursor: pointer; }
@media (max-width: 860px) {
  .nav-toggle { display: grid; }
  .site-header__top { justify-content: flex-start; padding: .8rem 0; }
  .nav { display: none; flex-direction: column; align-items: stretch; gap: 0; padding: 0 0 1rem; }
  .nav.is-open { display: flex; }
  .nav__link { padding: .95rem 0; border-bottom: 1px solid var(--line); }
  .nav__cta { margin-top: 1rem; text-align: center; }
}

/* Portada a sangre */
.hero { position: relative; min-height: min(88vh, 860px); display: flex; align-items: flex-end; overflow: hidden; isolation: isolate; background: var(--surface); }
.hero__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -3; }
.hero__bg--blank { background:
  radial-gradient(900px 500px at 15% 90%, var(--primary-soft), transparent 70%),
  radial-gradient(700px 400px at 90% 10%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 70%),
  repeating-linear-gradient(135deg, transparent 0 22px, color-mix(in srgb, var(--text) 3%, transparent) 22px 23px),
  var(--surface); }
.hero__shade { position: absolute; inset: 0; z-index: -2; background: linear-gradient(180deg, color-mix(in srgb, var(--bg) 25%, transparent) 0%, color-mix(in srgb, var(--bg) 20%, transparent) 40%, var(--bg) 100%); }
.hero__frame { position: absolute; inset: clamp(12px, 2vw, 26px); border: 1px solid color-mix(in srgb, var(--text) 28%, transparent); z-index: -1; pointer-events: none; }
.hero__in { padding-block: clamp(4rem, 12vw, 9rem) clamp(3.5rem, 8vw, 6rem); }
.hero .eyebrow { margin-bottom: 1.6rem; }
.hero .eyebrow::after { display: none; }
.hero h1 { font-size: clamp(3rem, 9vw, 7.2rem); line-height: .98; max-width: 14ch; letter-spacing: -.02em; margin-bottom: 1.6rem; }
.hero__lead { max-width: 46ch; font-size: 1.2rem; color: color-mix(in srgb, var(--text) 82%, transparent); margin-bottom: 2.2rem; }
.hero__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 1.6rem; }
.hero__link { color: var(--text); text-decoration: none; font-size: .82rem; letter-spacing: .18em; text-transform: uppercase; border-bottom: 1px solid var(--accent); padding-bottom: .3rem; }

.sec { padding: clamp(4rem, 9vw, 8rem) 0; }
.sec--panel { background: var(--surface); border-block: 1px solid var(--line); }
.sec--flush { padding-bottom: 0; }
.sec-head { text-align: center; margin: 0 auto clamp(2.5rem, 6vw, 4.5rem); max-width: 640px; }
.sec-head h2, .place h2, .contact h2, .about h2 { font-size: clamp(2.2rem, 5vw, 3.8rem); letter-spacing: -.01em; }
.sec-head__intro { margin: 1.2rem 0 0; color: var(--muted); font-size: 1.1rem; font-style: italic; font-family: var(--font-head); }

/* Nosotros */
.about__grid { display: grid; grid-template-columns: 5fr 7fr; gap: clamp(2rem, 6vw, 6rem); align-items: start; }
.about__text { columns: 2 280px; column-gap: 2.5rem; color: var(--muted); font-size: 1.08rem; }
.about__text p:first-child::first-letter { float: left; font-family: var(--font-head); font-size: 4.2rem; line-height: .8; padding: .35rem .6rem 0 0; color: var(--accent); }
.about__wide { margin: clamp(2.5rem, 6vw, 5rem) 0 0; aspect-ratio: 21 / 9; overflow: hidden; border-radius: var(--radius-lg); }
.about__wide img { width: 100%; height: 100%; object-fit: cover; }
@media (max-width: 860px) { .about__grid { grid-template-columns: 1fr; } .about__wide { aspect-ratio: 4 / 3; } }

/* Carta */
.menu { max-width: 800px; margin: 0 auto; display: grid; gap: 3.2rem; }
.menu__cat { display: flex; align-items: center; gap: 1.2rem; margin-bottom: 1.8rem; font-family: var(--font-body); font-size: .85rem; letter-spacing: .3em; text-transform: uppercase; color: var(--accent); font-weight: 600; }
.menu__cat::before, .menu__cat::after { content: ''; flex: 1; height: 1px; background: var(--line); }
.menu__orn { text-align: center; color: var(--accent); margin-bottom: 1.4rem; letter-spacing: 1rem; }
.menu ul { display: grid; gap: 1.7rem; }
.dish { display: flex; gap: 1.2rem; align-items: flex-start; }
.dish__main { flex: 1; min-width: 0; }
.dish__top { display: flex; align-items: baseline; gap: .8rem; }
.dish h4 { font-family: var(--font-head); font-size: 1.45rem; }
.dish__rule { flex: 1; border-bottom: 1px solid var(--line); transform: translateY(-5px); min-width: 1rem; }
.dish__price { font-family: var(--font-head); font-size: 1.3rem; color: var(--accent); white-space: nowrap; }
.dish p { margin: .3rem 0 0; color: var(--muted); font-style: italic; font-family: var(--font-head); }
.dish__img { width: 84px; height: 84px; flex: none; overflow: hidden; border-radius: var(--radius); }
.dish__img img { width: 100%; height: 100%; object-fit: cover; }

/* Galería en tira */
.strip { display: flex; gap: 1rem; overflow-x: auto; scroll-snap-type: x mandatory; padding: 0 max(1.25rem, calc((100vw - 1160px) / 2)) 1rem; scrollbar-width: thin; scrollbar-color: var(--accent) transparent; }
.strip figure { flex: none; margin: 0; width: min(80vw, 520px); height: clamp(260px, 38vw, 400px); scroll-snap-align: center; border-radius: var(--radius-lg); overflow: hidden; }
.strip img { width: 100%; height: 100%; object-fit: cover; }
.sec--flush + .sec { padding-top: clamp(4rem, 9vw, 8rem); }

/* Opiniones */
.feature { margin: 0; text-align: center; }
.feature blockquote { margin: 0; }
.feature blockquote p { font-family: var(--font-head); font-size: clamp(1.7rem, 4vw, 2.7rem); line-height: 1.25; font-style: italic; }
.feature blockquote p::before { content: '“'; display: block; font-size: 4rem; line-height: .6; color: var(--accent); }
.feature figcaption, .more-quotes cite { display: block; margin-top: 1.2rem; font-size: .8rem; letter-spacing: .22em; text-transform: uppercase; color: var(--muted); font-style: normal; }
.more-quotes { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-top: 3.5rem; border-top: 1px solid var(--line); }
.more-quotes li { padding: 2rem 1.8rem; border-left: 1px solid var(--line); }
.more-quotes li:first-child { border-left: 0; padding-left: 0; }
.more-quotes blockquote { margin: 0; font-family: var(--font-head); font-style: italic; font-size: 1.15rem; }
.more-quotes blockquote p { margin: 0; }
@media (max-width: 700px) { .more-quotes li { border-left: 0; border-top: 1px solid var(--line); padding-left: 0; } .more-quotes li:first-child { border-top: 0; } }

/* Horario */
.hours { margin: 0 auto; max-width: 560px; border: 3px double var(--line); padding: 1rem 2rem; border-radius: var(--radius); }
.hours__row { display: flex; justify-content: space-between; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--line); }
.hours__row:last-child { border-bottom: 0; }
.hours dt { font-family: var(--font-head); font-size: 1.2rem; }
.hours dd { margin: 0; color: var(--muted); font-variant-numeric: tabular-nums; }
.hours__row.is-closed dd { font-style: italic; }

/* Ubicación */
.place__in { text-align: center; display: grid; justify-items: center; gap: 1.2rem; }
.place .eyebrow { margin: 0; }
.place__addr { font-family: var(--font-head); font-size: clamp(1.6rem, 4vw, 2.6rem); font-style: italic; color: var(--accent); margin: 0; max-width: 24ch; }
.place__note { margin: 0; max-width: 50ch; color: var(--muted); }

/* Contacto */
.contact__in { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(2rem, 7vw, 7rem); align-items: start; }
.contact__in--solo { grid-template-columns: minmax(0, 620px); justify-content: center; text-align: center; }
.contact__in--solo .eyebrow { justify-content: center; }
.contact__in--solo .contact-list, .contact__in--solo .social { justify-items: center; justify-content: center; }
.contact h2 { margin-bottom: 1.2rem; }
.contact__intro { color: var(--muted); font-size: 1.1rem; margin-bottom: 2rem; }
.contact-list--big { gap: 1rem; margin-bottom: 2rem; }
.contact-list--big a, .contact-list--big .contact-list__static { font-family: var(--font-head); font-size: 1.3rem; color: var(--text); }
.contact-list--big .ico { color: var(--accent); }
.form--line .field input, .form--line .field textarea { background: transparent; border: 0; border-bottom: 1px solid var(--line); border-radius: 0; padding-inline: 0; }
.form--line .field input:focus, .form--line .field textarea:focus { outline: 0; border-bottom-color: var(--accent); box-shadow: 0 1px 0 var(--accent); }
.form--line .field label { font-size: .72rem; letter-spacing: .2em; text-transform: uppercase; color: var(--muted); }
@media (max-width: 860px) { .contact__in { grid-template-columns: 1fr; } }

/* Pie */
.site-footer { padding: 3.5rem 0 2rem; border-top: 1px solid var(--line); }
.site-footer__grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 2rem; align-items: center; }
.site-footer__name { font-family: var(--font-head); font-size: 1.5rem; letter-spacing: .2em; text-transform: uppercase; margin: 0 0 .3rem; }
.site-footer__small { margin: 0; color: var(--muted); font-size: .9rem; }
.footnav { display: flex; flex-wrap: wrap; justify-content: center; gap: .4rem 1.6rem; }
.footnav__link { color: var(--muted); text-decoration: none; font-size: .78rem; letter-spacing: .2em; text-transform: uppercase; }
.footnav__link:hover { color: var(--text); }
.site-footer__right .social { justify-content: flex-end; }
.site-footer__copy { margin: 2.5rem auto 0; padding-top: 1.5rem; border-top: 1px solid var(--line); color: var(--muted); font-size: .85rem; text-align: center; }
@media (max-width: 760px) { .site-footer__grid { grid-template-columns: 1fr; text-align: center; } .site-footer__right .social { justify-content: center; } }
`;
