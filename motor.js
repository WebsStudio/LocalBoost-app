// Plantilla "Garage": oscura, condensada y angular para talleres de motos, automoción y fitness.
// Barra de cabecera con corte diagonal, portada gigante con franjas, tira de contacto rápido,
// servicios numerados con esquinas cortadas, galería en cuadrícula y banda de contacto en color.

import { esc, ico, img, paragraphs, brandMark, navLinks, socialLinks, contactList, contactForm, extAttrs, escMultiline } from '../shared.js';

const head = (id, title, intro = '', tag = '') => `<header class="sec-head" data-reveal>
  ${tag ? `<p class="tag"><span>//</span> ${esc(tag)}</p>` : ''}
  <h2 id="${id}">${esc(title)}</h2>
  ${intro ? `<p class="sec-head__intro">${esc(intro)}</p>` : ''}
</header>`;

function hero(m, s) {
  const c = s.content;
  const place = [m.category, m.city].filter(Boolean).join(' · ');
  return `<section class="hero" id="inicio" aria-labelledby="hero-title">
  ${m.heroImg ? `<div class="hero__media">${img(m.heroImg, { eager: true, alt: '' })}</div>` : '<div class="hero__media hero__media--blank" aria-hidden="true"></div>'}
  <div class="hero__stripes" aria-hidden="true"></div>
  <div class="container hero__in">
    <p class="tag"><span>//</span> ${esc(place)}</p>
    <h1 id="hero-title">${esc(c.title)}</h1>
    ${c.subtitle ? `<p class="hero__lead">${escMultiline(c.subtitle)}</p>` : ''}
    <div class="hero__actions">
      <a class="btn btn--primary btn--cut" href="${esc(m.cta.href)}"${extAttrs(m.cta.external)}>${esc(m.cta.label)}${ico('arrow')}</a>
      ${m.has('services') ? '<a class="btn btn--ghost btn--cut" href="#servicios">Servicios</a>' : ''}
    </div>
  </div>
</section>${quick(m)}`;
}

/** Tira de contacto rápido bajo la portada, solo con datos reales. */
function quick(m) {
  const tiles = [];
  if (m.links.tel) tiles.push(`<a href="${esc(m.links.tel)}">${ico('phone')}<span><small>Llámanos</small>${esc(m.phone)}</span></a>`);
  if (m.links.whatsapp) tiles.push(`<a href="${esc(m.links.whatsapp)}" target="_blank" rel="noopener noreferrer">${ico('whatsapp')}<span><small>WhatsApp</small>Escríbenos</span></a>`);
  const addr = [m.address, m.city].filter(Boolean).join(', ');
  if (addr) tiles.push(m.links.map
    ? `<a href="${esc(m.links.map)}" target="_blank" rel="noopener noreferrer">${ico('pin')}<span><small>Taller</small>${esc(addr)}</span></a>`
    : `<div>${ico('pin')}<span><small>Taller</small>${esc(addr)}</span></div>`);
  if (!tiles.length) return '';
  return `<div class="quick"><div class="container quick__in">${tiles.join('')}</div></div>`;
}

function about(m, s) {
  const c = s.content;
  return `<section class="sec about" id="nosotros" aria-labelledby="about-title">
  <div class="container about__in${m.aboutImg ? '' : ' about__in--solo'}">
    ${m.aboutImg ? `<div class="about__media" data-reveal>${img(m.aboutImg, { alt: '' })}</div>` : ''}
    <div data-reveal>
      <p class="tag"><span>//</span> Quiénes somos</p>
      <h2 id="about-title">${esc(c.title)}</h2>
      <div class="about__text">${paragraphs(c.text)}</div>
    </div>
  </div>
</section>`;
}

function services(m, s) {
  if (!m.services.length) return '';
  let n = 0;
  const card = (it) => {
    n += 1;
    return `<li class="card">
      <span class="card__num" aria-hidden="true">${String(n).padStart(2, '0')}</span>
      ${it.image ? `<div class="card__img">${img(it.image, { alt: '' })}</div>` : ''}
      <h4>${esc(it.name)}</h4>
      ${it.description ? `<p>${escMultiline(it.description)}</p>` : ''}
      ${it.price ? `<span class="card__price">${esc(it.price)}</span>` : ''}
    </li>`;
  };
  const groups = m.serviceGroups.map((g) => `${g.name ? `<h3 class="cat">${esc(g.name)}</h3>` : ''}<ul class="cards">${g.items.map(card).join('')}</ul>`).join('');
  return `<section class="sec sec--panel" id="servicios" aria-labelledby="svc-title">
  <div class="container">
    ${head('svc-title', s.content.title, s.content.intro, 'Qué hacemos')}
    <div data-reveal>${groups}</div>
  </div>
</section>`;
}

function gallery(m, s) {
  if (!m.galleryImgs.length) return '';
  return `<section class="sec" id="galeria" aria-labelledby="gal-title">
  <div class="container">
    ${head('gal-title', s.content.title, '', 'Trabajos')}
    <div class="grid" data-reveal>${m.galleryImgs.map((i) => `<figure>${img(i)}</figure>`).join('')}</div>
  </div>
</section>`;
}

function testimonials(m, s) {
  const items = s.content.items.filter((t) => t.text.trim());
  if (!items.length) return '';
  return `<section class="sec sec--panel" id="opiniones" aria-labelledby="tes-title">
  <div class="container">
    ${head('tes-title', s.content.title, '', 'Clientes')}
    <ul class="voices" data-reveal>
      ${items.map((t) => `<li><blockquote><p>${escMultiline(t.text)}</p></blockquote>${t.name ? `<p class="voices__who">${esc(t.name)}</p>` : ''}</li>`).join('')}
    </ul>
  </div>
</section>`;
}

function hours(m, s) {
  if (!m.hours.length) return '';
  return `<section class="sec" id="horario" aria-labelledby="hor-title">
  <div class="container">
    ${head('hor-title', s.content.title, '', 'Abrimos')}
    <dl class="hours" data-reveal>
      ${m.hours.map((h) => `<div class="hours__item${h.closed ? ' is-closed' : ''}"><dt>${esc(h.label)}</dt><dd>${esc(h.text)}</dd></div>`).join('')}
    </dl>
  </div>
</section>`;
}

function location(m, s) {
  const text = [m.address, m.city].filter(Boolean).join(', ');
  if (!text) return '';
  return `<section class="sec sec--panel place" id="ubicacion" aria-labelledby="loc-title">
  <div class="container place__in" data-reveal>
    <div>
      <p class="tag"><span>//</span> Cómo llegar</p>
      <h2 id="loc-title">${esc(s.content.title)}</h2>
      <p class="place__addr">${ico('pin')}<span>${esc(text)}</span></p>
      ${s.content.note ? `<p class="place__note">${escMultiline(s.content.note)}</p>` : ''}
      ${m.links.map ? `<a class="btn btn--primary btn--cut" href="${esc(m.links.map)}" target="_blank" rel="noopener noreferrer">Abrir en Google Maps${ico('arrow')}</a>` : ''}
    </div>
    <div class="place__art" aria-hidden="true"></div>
  </div>
</section>`;
}

function contact(m, s) {
  const form = contactForm(m);
  const list = contactList(m);
  if (!form && !list && !m.social.length) return '';
  const bigPhone = m.links.tel ? `<a class="bigcall" href="${esc(m.links.tel)}">${ico('phone')}<span>${esc(m.phone)}</span></a>` : '';
  return `<section class="contact" id="contacto" aria-labelledby="con-title">
  <div class="contact__band">
    <div class="container contact__band-in" data-reveal>
      <div>
        <p class="tag tag--inverse"><span>//</span> Contacto</p>
        <h2 id="con-title">${esc(s.content.title)}</h2>
        ${s.content.intro ? `<p>${escMultiline(s.content.intro)}</p>` : ''}
      </div>
      ${bigPhone}
    </div>
  </div>
  <div class="container contact__in${form ? '' : ' contact__in--solo'}" data-reveal>
    <div>${list}${socialLinks(m)}</div>
    ${form ? `<div class="contact__form">${form}</div>` : ''}
  </div>
</section>`;
}

function footer(m, s) {
  const custom = (s.content.text || '').trim();
  return `<footer class="site-footer">
  <div class="container site-footer__in">
    ${brandMark(m, 'brand brand--footer')}
    ${socialLinks(m)}
    <p class="site-footer__copy">${custom ? escMultiline(custom) : `© <span data-year>${new Date().getFullYear()}</span> ${esc(m.name)}. Todos los derechos reservados.`}</p>
  </div>
</footer>`;
}

const RENDER = { hero, about, services, gallery, testimonials, hours, location, contact };

function header(m) {
  return `<header class="site-header" data-header>
  <div class="container site-header__in">
    ${brandMark(m)}
    <nav class="nav" data-nav aria-label="Principal">
      ${navLinks(m)}
      <a class="btn btn--primary btn--cut nav__cta" href="${esc(m.cta.href)}"${extAttrs(m.cta.external)}>${esc(m.cta.label)}</a>
    </nav>
    <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-label="Abrir o cerrar el menú">${ico('menu')}</button>
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
/* ===== Plantilla Garage ===== */
:root { --cut: 14px; --head-h: 72px; }
html { scroll-padding-top: calc(var(--head-h) + 12px); }
h1, h2, h3, h4 { font-weight: 800; text-transform: uppercase; letter-spacing: .01em; line-height: 1; }
.tag { margin: 0 0 1rem; font-family: var(--font-head); text-transform: uppercase; letter-spacing: .22em; font-size: .85rem; font-weight: 700; color: var(--accent); }
.tag span { color: var(--primary); margin-right: .4em; }
.tag--inverse, .tag--inverse span { color: var(--on-primary); opacity: .9; }
.btn { text-transform: uppercase; letter-spacing: .1em; font-family: var(--font-head); font-weight: 800; font-size: .95rem; }
.btn--cut { border-radius: 0; clip-path: polygon(var(--cut) 0, 100% 0, calc(100% - var(--cut)) 100%, 0 100%); padding-inline: 2rem; border: 0; }
.btn--cut.btn--ghost { background: var(--surface-2); color: var(--text); }
.btn--cut.btn--ghost:hover { background: var(--text); color: var(--bg); }

/* Cabecera */
.site-header { position: sticky; top: 0; z-index: 60; background: color-mix(in srgb, var(--bg) 94%, transparent); backdrop-filter: blur(10px); border-bottom: 3px solid var(--primary); }
.site-header__in { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; min-height: var(--head-h); }
.brand__text { font-family: var(--font-head); font-weight: 900; font-size: 1.6rem; text-transform: uppercase; letter-spacing: .04em; font-style: italic; transform: skewX(-6deg); display: inline-block; }
.brand__text::before { content: ''; display: inline-block; width: .55em; height: 1em; margin-right: .4em; vertical-align: -.12em; background: var(--primary); transform: skewX(-18deg); }
.nav { display: flex; align-items: center; gap: 1.8rem; }
.nav__link { color: var(--text); text-decoration: none; font-family: var(--font-head); text-transform: uppercase; letter-spacing: .12em; font-size: .9rem; font-weight: 700; padding: .4rem 0; border-bottom: 3px solid transparent; transition: border-color .2s, color .2s; }
.nav__link:hover { border-color: var(--primary); }
.nav__cta { min-height: 44px; padding-block: .5em; }
.nav-toggle { display: none; width: 48px; height: 48px; place-items: center; background: var(--primary); color: var(--on-primary); border: 0; cursor: pointer; clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%); }
@media (max-width: 960px) {
  .nav-toggle { display: grid; }
  .nav { position: absolute; left: 0; right: 0; top: 100%; flex-direction: column; align-items: stretch; gap: 0; padding: .5rem 1.25rem 1.5rem; background: var(--bg); border-bottom: 3px solid var(--primary); display: none; }
  .nav.is-open { display: flex; }
  .nav__link { padding: 1rem 0; border-bottom: 1px solid var(--line); font-size: 1.05rem; }
  .nav__cta { margin-top: 1rem; }
}

/* Portada */
.hero { position: relative; overflow: hidden; isolation: isolate; min-height: min(86vh, 800px); display: flex; align-items: center; background: var(--bg); }
.hero__media { position: absolute; inset: 0 0 0 38%; z-index: -2; clip-path: polygon(14% 0, 100% 0, 100% 100%, 0 100%); }
.hero__media img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.9) contrast(1.05); }
.hero__media--blank { background:
  repeating-linear-gradient(-55deg, transparent 0 26px, color-mix(in srgb, var(--primary) 18%, transparent) 26px 52px),
  linear-gradient(120deg, var(--surface), var(--surface-2)); }
.hero__stripes { position: absolute; left: 0; right: 0; bottom: 0; height: 16px; z-index: -1; background: repeating-linear-gradient(-45deg, var(--primary) 0 14px, transparent 14px 28px); }
.hero__in { padding-block: 5rem 6rem; }
.hero h1 { font-size: clamp(3.2rem, 9.5vw, 8rem); max-width: 11ch; margin-bottom: 1.6rem; font-style: italic; letter-spacing: -.005em; text-shadow: 0 2px 30px var(--bg); }
.hero__lead { max-width: 44ch; font-size: 1.2rem; color: color-mix(in srgb, var(--text) 85%, transparent); margin-bottom: 2.2rem; }
.hero__actions { display: flex; flex-wrap: wrap; gap: .9rem; }
@media (max-width: 800px) {
  .hero__media { inset: 0; clip-path: none; opacity: .38; }
  .hero__media--blank { opacity: .7; }
}

.quick { background: var(--primary); color: var(--on-primary); }
.quick__in { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); }
.quick a, .quick__in > div { display: flex; align-items: center; gap: 1rem; padding: 1.3rem 1.2rem; color: inherit; text-decoration: none; border-left: 1px solid color-mix(in srgb, var(--on-primary) 25%, transparent); transition: background-color .2s; }
.quick__in > :first-child { border-left: 0; }
.quick a:hover { background: color-mix(in srgb, var(--on-primary) 12%, transparent); }
.quick .ico { width: 1.7rem; height: 1.7rem; }
.quick span { display: flex; flex-direction: column; font-family: var(--font-head); font-weight: 800; font-size: 1.15rem; text-transform: uppercase; line-height: 1.15; }
.quick small { font-size: .7rem; letter-spacing: .2em; opacity: .8; font-weight: 700; }

.sec { padding: clamp(4rem, 9vw, 7.5rem) 0; }
.sec--panel { background: var(--surface); }
.sec-head { margin-bottom: clamp(2.2rem, 5vw, 3.8rem); max-width: 760px; }
.sec-head h2, .about h2, .place h2, .contact__band h2 { font-size: clamp(2.4rem, 6vw, 4.6rem); font-style: italic; }
.sec-head__intro { margin: 1rem 0 0; color: var(--muted); font-size: 1.1rem; }

.about__in { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(2rem, 6vw, 6rem); align-items: center; }
.about__in--solo { grid-template-columns: minmax(0, 760px); }
.about__media { position: relative; }
.about__media::before { content: ''; position: absolute; inset: 18px -18px -18px 18px; border: 3px solid var(--primary); z-index: -1; }
.about__media img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
.about h2 { margin-bottom: 1.4rem; }
.about__text { color: var(--muted); font-size: 1.1rem; }
@media (max-width: 860px) { .about__in { grid-template-columns: 1fr; } .about__media::before { inset: 12px -8px -12px 8px; } }

/* Servicios */
.cat { margin: 2.5rem 0 1.2rem; font-size: 1.1rem; color: var(--accent); letter-spacing: .2em; }
.cat:first-child { margin-top: 0; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.2rem; }
.card { position: relative; display: flex; flex-direction: column; gap: .8rem; padding: 2rem 1.6rem 1.6rem; background: var(--bg); border: 1px solid var(--line); clip-path: polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 0 100%); transition: transform .25s, border-color .25s, background-color .25s; }
.card:hover { transform: translateY(-4px); border-color: var(--primary); }
.card__num { position: absolute; top: .6rem; right: 2.4rem; font-family: var(--font-head); font-size: 3.2rem; font-weight: 900; line-height: 1; color: transparent; -webkit-text-stroke: 1px var(--primary); opacity: .75; }
.card__img { margin: -.6rem -.2rem .4rem; aspect-ratio: 16 / 10; overflow: hidden; }
.card__img img { width: 100%; height: 100%; object-fit: cover; }
.card h4 { font-size: 1.5rem; padding-right: 3.5rem; }
.card p { margin: 0; color: var(--muted); flex: 1; }
.card__price { align-self: flex-start; margin-top: .6rem; padding: .35rem 1.1rem .35rem .8rem; background: var(--primary); color: var(--on-primary); font-family: var(--font-head); font-weight: 800; text-transform: uppercase; clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%); }

/* Galería */
.grid { display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: clamp(160px, 22vw, 260px); gap: .8rem; }
.grid figure { margin: 0; overflow: hidden; position: relative; }
.grid figure:first-child { grid-column: span 2; grid-row: span 2; }
.grid img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(.55) contrast(1.05); transition: filter .4s, transform .6s; }
.grid figure:hover img { filter: none; transform: scale(1.05); }
@media (max-width: 700px) { .grid { grid-template-columns: 1fr 1fr; } .grid figure:first-child { grid-column: span 2; grid-row: span 1; } }

/* Opiniones */
.voices { display: grid; gap: 1.2rem; }
.voices li { padding: 1.4rem 1.6rem 1.4rem 2rem; border-left: 6px solid var(--primary); background: var(--bg); }
.voices blockquote { margin: 0; font-size: 1.2rem; }
.voices blockquote p { margin: 0 0 .6rem; }
.voices__who { margin: 0; font-family: var(--font-head); text-transform: uppercase; letter-spacing: .15em; font-weight: 800; font-size: .9rem; color: var(--accent); }

/* Horario */
.hours { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1px; margin: 0; background: var(--line); border: 1px solid var(--line); }
.hours__item { background: var(--surface); padding: 1.4rem 1.5rem; }
.hours dt { font-family: var(--font-head); text-transform: uppercase; letter-spacing: .12em; font-weight: 800; font-size: .95rem; color: var(--accent); margin-bottom: .4rem; }
.hours dd { margin: 0; font-family: var(--font-head); font-weight: 800; font-size: 1.7rem; font-variant-numeric: tabular-nums; }
.hours__item.is-closed dd { color: var(--muted); }

/* Ubicación */
.place__in { display: grid; grid-template-columns: 1.1fr .9fr; gap: clamp(2rem, 6vw, 6rem); align-items: center; }
.place__addr { display: flex; gap: .8rem; align-items: flex-start; font-family: var(--font-head); font-weight: 700; font-size: clamp(1.4rem, 3vw, 2rem); margin: 1.2rem 0 1rem; text-transform: uppercase; }
.place__addr .ico { color: var(--primary); width: 1.4em; height: 1.4em; margin-top: .1em; }
.place__note { color: var(--muted); max-width: 46ch; }
.place__art { min-height: 260px; background: repeating-linear-gradient(-45deg, var(--primary) 0 18px, transparent 18px 36px), var(--bg); clip-path: polygon(12% 0, 100% 0, 88% 100%, 0 100%); opacity: .9; }
@media (max-width: 800px) { .place__in { grid-template-columns: 1fr; } .place__art { min-height: 90px; } }

/* Contacto */
.contact__band { background: var(--primary); color: var(--on-primary); padding: clamp(2.5rem, 6vw, 4.5rem) 0; }
.contact__band-in { display: flex; justify-content: space-between; align-items: center; gap: 2rem; flex-wrap: wrap; }
.contact__band h2 { margin-bottom: .6rem; }
.contact__band p { margin: 0; opacity: .9; max-width: 44ch; }
.bigcall { display: inline-flex; align-items: center; gap: .8rem; color: inherit; text-decoration: none; font-family: var(--font-head); font-weight: 900; font-style: italic; font-size: clamp(1.8rem, 5vw, 3.4rem); line-height: 1; padding: .4em .8em; border: 3px solid currentColor; clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%); }
.bigcall:hover { background: var(--on-primary); color: var(--primary); }
.contact__in { display: grid; grid-template-columns: 1fr 1.2fr; gap: clamp(2rem, 6vw, 5rem); padding-block: clamp(3rem, 7vw, 5rem); align-items: start; }
.contact__in--solo { grid-template-columns: 1fr; }
.contact .contact-list { margin-bottom: 1.8rem; }
.contact .contact-list a, .contact .contact-list__static { font-family: var(--font-head); font-size: 1.2rem; font-weight: 700; text-transform: uppercase; color: var(--text); }
.contact .contact-list .ico { color: var(--accent); }
.contact__form { background: var(--surface); padding: clamp(1.4rem, 4vw, 2.4rem); border-top: 4px solid var(--primary); }
@media (max-width: 860px) { .contact__in { grid-template-columns: 1fr; } }

/* Pie */
.site-footer { padding: 2.2rem 0; border-top: 3px solid var(--primary); background: var(--surface); }
.site-footer__in { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; }
.site-footer__copy { margin: 0; color: var(--muted); font-size: .9rem; }
`;
