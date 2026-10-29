// Plantilla "Atelier": elegante y luminosa para belleza, peluquería y bienestar.
// Cabecera con navegación centrada, portada partida con imagen en arco, carta de servicios
// con puntos guía, galería en mosaico y contacto sobre banda tintada.

import { esc, ico, img, paragraphs, brandMark, navLinks, socialLinks, ctaButton, contactList, contactForm, extAttrs, escMultiline } from '../shared.js';

const head = (title, intro = '', eyebrow = '') => `<header class="sec-head" data-reveal>
  ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
  <h2>${esc(title)}</h2>
  ${intro ? `<p class="sec-head__intro">${esc(intro)}</p>` : ''}
</header>`;

function hero(m, s) {
  const c = s.content;
  const monogram = esc((m.name.trim()[0] || '·').toUpperCase());
  const art = m.heroImg
    ? `<div class="hero__arch">${img(m.heroImg, { eager: true, alt: '' })}</div>`
    : `<div class="hero__arch hero__arch--blank" aria-hidden="true"><span>${monogram}</span></div>`;
  const place = [m.category, m.city].filter(Boolean).join(' · ');
  return `<section class="hero" id="inicio" aria-labelledby="hero-title">
  <div class="container hero__in">
    <div class="hero__copy">
      <p class="eyebrow">${esc(place)}</p>
      <h1 id="hero-title">${esc(c.title)}</h1>
      ${c.subtitle ? `<p class="hero__lead">${escMultiline(c.subtitle)}</p>` : ''}
      <div class="hero__actions">
        ${ctaButton(m)}
        ${m.has('services') ? '<a class="btn btn--ghost" href="#servicios">Ver servicios</a>' : ''}
      </div>
    </div>
    ${art}
  </div>
</section>`;
}

function about(m, s) {
  const c = s.content;
  const media = m.aboutImg
    ? `<div class="about__media">${img(m.aboutImg, { alt: '' })}</div>`
    : '';
  return `<section class="sec about${media ? '' : ' about--solo'}" id="nosotros" aria-labelledby="about-title">
  <div class="container about__in">
    ${media}
    <div class="about__copy" data-reveal>
      <p class="eyebrow">Nuestra casa</p>
      <h2 id="about-title">${esc(c.title)}</h2>
      ${paragraphs(c.text)}
    </div>
  </div>
</section>`;
}

function serviceItem(it) {
  const thumb = it.image ? `<span class="svc__thumb">${img(it.image, { alt: '' })}</span>` : '';
  return `<li class="svc${it.image ? ' svc--img' : ''}">
    ${thumb}
    <div class="svc__body">
      <div class="svc__top"><h3>${esc(it.name)}</h3>${it.price ? `<span class="svc__dots" aria-hidden="true"></span><span class="svc__price">${esc(it.price)}</span>` : ''}</div>
      ${it.description ? `<p>${escMultiline(it.description)}</p>` : ''}
    </div>
  </li>`;
}

function services(m, s) {
  if (!m.services.length) return '';
  const groups = m.serviceGroups.map((g) => `<div class="svc-group">
    ${g.name ? `<h3 class="svc-group__name">${esc(g.name)}</h3>` : ''}
    <ul class="svc-list">${g.items.map(serviceItem).join('')}</ul>
  </div>`).join('');
  return `<section class="sec sec--tint" id="servicios" aria-labelledby="svc-title">
  <div class="container">
    ${head(s.content.title, s.content.intro, 'Carta de servicios').replace('<h2>', '<h2 id="svc-title">')}
    <div class="svc-groups" data-reveal>${groups}</div>
    <p class="center"><a class="btn btn--primary" href="${esc(m.cta.href)}"${extAttrs(m.cta.external)}>${esc(m.cta.label)}${ico('arrow')}</a></p>
  </div>
</section>`;
}

function gallery(m, s) {
  if (!m.galleryImgs.length) return '';
  return `<section class="sec" id="galeria" aria-labelledby="gal-title">
  <div class="container">
    ${head(s.content.title, '', 'Un vistazo').replace('<h2>', '<h2 id="gal-title">')}
    <div class="mosaic" data-reveal>${m.galleryImgs.map((i) => `<figure>${img(i)}</figure>`).join('')}</div>
  </div>
</section>`;
}

function testimonials(m, s) {
  const items = s.content.items.filter((t) => t.text.trim());
  if (!items.length) return '';
  return `<section class="sec sec--tint" id="opiniones" aria-labelledby="tes-title">
  <div class="container">
    ${head(s.content.title, '', 'Lo que dicen').replace('<h2>', '<h2 id="tes-title">')}
    <ul class="quotes${items.length === 1 ? ' quotes--one' : ''}" data-reveal>
      ${items.map((t) => `<li><figure class="quote">${ico('quote', 'quote__mark')}<blockquote><p>${escMultiline(t.text)}</p></blockquote>${t.name ? `<figcaption>${esc(t.name)}</figcaption>` : ''}</figure></li>`).join('')}
    </ul>
  </div>
</section>`;
}

function hours(m, s) {
  if (!m.hours.length) return '';
  return `<section class="sec" id="horario" aria-labelledby="hor-title">
  <div class="container narrow">
    ${head(s.content.title, '', 'Cuándo vernos').replace('<h2>', '<h2 id="hor-title">')}
    <dl class="hours" data-reveal>
      ${m.hours.map((h) => `<div class="hours__row${h.closed ? ' is-closed' : ''}"><dt>${esc(h.label)}</dt><dd>${esc(h.text)}</dd></div>`).join('')}
    </dl>
  </div>
</section>`;
}

function location(m, s) {
  const text = [m.address, m.city].filter(Boolean).join(', ');
  if (!text) return '';
  const card = m.links.map
    ? `<a class="place__card" href="${esc(m.links.map)}" target="_blank" rel="noopener noreferrer"><span class="place__pin">${ico('pin')}</span><span class="place__addr">${esc(text)}</span><span class="place__go">Abrir en Google Maps ${ico('arrow')}</span></a>`
    : `<div class="place__card"><span class="place__pin">${ico('pin')}</span><span class="place__addr">${esc(text)}</span></div>`;
  return `<section class="sec sec--tint" id="ubicacion" aria-labelledby="loc-title">
  <div class="container narrow">
    ${head(s.content.title, s.content.note, 'Visítanos').replace('<h2>', '<h2 id="loc-title">')}
    <div data-reveal>${card}</div>
  </div>
</section>`;
}

function contact(m, s) {
  const form = contactForm(m);
  const list = contactList(m);
  if (!form && !list && !m.social.length) return '';
  return `<section class="sec contact" id="contacto" aria-labelledby="con-title">
  <div class="container contact__in${form ? '' : ' contact__in--solo'}">
    <div class="contact__copy" data-reveal>
      <p class="eyebrow">Hablemos</p>
      <h2 id="con-title">${esc(s.content.title)}</h2>
      ${s.content.intro ? `<p>${escMultiline(s.content.intro)}</p>` : ''}
      ${list}
      ${socialLinks(m)}
    </div>
    ${form ? `<div class="contact__form" data-reveal>${form}</div>` : ''}
  </div>
</section>`;
}

function footer(m, s) {
  const custom = (s.content.text || '').trim();
  return `<footer class="site-footer">
  <div class="container site-footer__in">
    ${brandMark(m, 'brand brand--footer')}
    ${m.nav.length ? `<nav aria-label="Pie de página" class="footnav">${navLinks(m, 'footnav__link')}</nav>` : ''}
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
      <a class="btn btn--primary nav__cta" href="${esc(m.cta.href)}"${extAttrs(m.cta.external)}>${esc(m.cta.label)}</a>
    </nav>
    <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-label="Abrir o cerrar el menú">${ico('menu')}</button>
  </div>
</header>`;
}

export function render(m) {
  const main = m.sections
    .filter((s) => RENDER[s.type])
    .map((s) => RENDER[s.type](m, s))
    .join('\n');
  const foot = m.byType.footer ? footer(m, m.byType.footer) : '';
  const body = `${header(m)}
<main id="contenido">
${m.has('hero') ? '' : '<span id="inicio"></span>'}
${main}
</main>
${foot}`;
  return { body, css: CSS, js: '' };
}

const CSS = `
/* ===== Plantilla Atelier ===== */
body { font-weight: 400; }
h1, h2, h3 { font-weight: 500; letter-spacing: -0.01em; }
.eyebrow { margin: 0 0 1rem; font-size: .78rem; letter-spacing: .22em; text-transform: uppercase; color: var(--accent); font-weight: 600; }
.center { text-align: center; margin-top: 3rem; }
.narrow { max-width: 760px; }

/* Cabecera */
.site-header { position: sticky; top: 0; z-index: 50; background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid transparent; transition: border-color .25s, box-shadow .25s; }
.site-header.is-scrolled { border-color: var(--line); }
.site-header__in { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; min-height: 78px; }
.brand__text { font-family: var(--font-head); font-size: 1.55rem; font-style: italic; letter-spacing: -.01em; }
.nav { display: flex; align-items: center; gap: 2rem; }
.nav__link { color: var(--text); text-decoration: none; font-size: .95rem; position: relative; padding: .3rem 0; }
.nav__link::after { content: ''; position: absolute; left: 0; right: 100%; bottom: 0; height: 1px; background: var(--accent); transition: right .25s; }
.nav__link:hover::after { right: 0; }
.nav__cta { min-height: 42px; padding: .5em 1.2em; font-size: .92rem; }
.nav-toggle { display: none; width: 46px; height: 46px; place-items: center; background: transparent; border: 1px solid var(--line); border-radius: 50%; color: var(--text); cursor: pointer; }
@media (max-width: 900px) {
  .nav-toggle { display: grid; }
  .nav { position: absolute; left: 0; right: 0; top: 100%; flex-direction: column; align-items: stretch; gap: 0; padding: 1rem 1.25rem 1.5rem; background: var(--bg); border-bottom: 1px solid var(--line); box-shadow: 0 20px 30px -20px var(--shadow); display: none; }
  .nav.is-open { display: flex; }
  .nav__link { padding: .9rem 0; font-size: 1.05rem; border-bottom: 1px solid var(--line); }
  .nav__link::after { display: none; }
  .nav__cta { margin-top: 1rem; }
}

/* Portada */
.hero { padding: clamp(2.5rem, 7vw, 6rem) 0 clamp(3rem, 7vw, 6rem); }
.hero__in { display: grid; grid-template-columns: 1.1fr .9fr; gap: clamp(2rem, 6vw, 6rem); align-items: center; }
.hero h1 { font-size: clamp(2.6rem, 6.2vw, 5rem); line-height: 1.04; margin-bottom: 1.4rem; }
.hero__lead { font-size: 1.2rem; color: var(--muted); max-width: 36ch; margin-bottom: 2rem; }
.hero__actions { display: flex; flex-wrap: wrap; gap: .8rem; }
.hero__arch { aspect-ratio: 4 / 5; width: 100%; max-width: 460px; margin-left: auto; border-radius: 999px 999px var(--radius-lg) var(--radius-lg); overflow: hidden; box-shadow: 0 40px 60px -30px var(--shadow); position: relative; }
.hero__arch img { width: 100%; height: 100%; object-fit: cover; }
.hero__arch--blank { display: grid; place-items: center; background: radial-gradient(circle at 30% 20%, var(--primary-soft), transparent 55%), linear-gradient(160deg, var(--surface-2), var(--surface)); border: 1px solid var(--line); }
.hero__arch--blank::before { content: ''; position: absolute; inset: 14px; border: 1px solid var(--line); border-radius: inherit; }
.hero__arch--blank span { font-family: var(--font-head); font-style: italic; font-size: clamp(6rem, 14vw, 11rem); color: var(--accent); opacity: .85; line-height: 1; }
@media (max-width: 860px) {
  .hero__in { grid-template-columns: 1fr; }
  .hero__arch { max-width: 360px; margin: 1rem auto 0; order: -1; }
  .hero__lead { max-width: none; }
}

/* Secciones */
.sec { padding: clamp(3.5rem, 8vw, 7rem) 0; }
.sec--tint { background: var(--surface-2); }
.sec-head { text-align: center; max-width: 640px; margin: 0 auto clamp(2.2rem, 5vw, 4rem); }
.sec-head h2, .about h2, .contact h2 { font-size: clamp(2rem, 4.2vw, 3.2rem); }
.sec-head__intro { margin: 1rem 0 0; color: var(--muted); font-size: 1.1rem; }

.about__in { display: grid; grid-template-columns: .9fr 1.1fr; gap: clamp(2rem, 6vw, 6rem); align-items: center; }
.about--solo .about__in { grid-template-columns: 1fr; max-width: 720px; text-align: center; }
.about__media { border-radius: var(--radius-lg); overflow: hidden; aspect-ratio: 4 / 5; box-shadow: 0 30px 50px -30px var(--shadow); }
.about__media img { width: 100%; height: 100%; object-fit: cover; }
.about__copy h2 { margin-bottom: 1.4rem; }
.about__copy p { color: var(--muted); font-size: 1.1rem; }
@media (max-width: 860px) { .about__in { grid-template-columns: 1fr; } }

/* Servicios: carta con puntos guía */
.svc-groups { display: grid; gap: 3rem; max-width: 1000px; margin: 0 auto; }
.svc-group__name { font-family: var(--font-body); font-size: .8rem; letter-spacing: .22em; text-transform: uppercase; color: var(--accent); margin-bottom: 1.4rem; padding-bottom: .8rem; border-bottom: 1px solid var(--line); font-weight: 600; }
.svc-list { display: grid; grid-template-columns: 1fr 1fr; gap: 1.8rem 4rem; }
.svc { display: flex; gap: 1rem; }
.svc__body { flex: 1; min-width: 0; }
.svc__top { display: flex; align-items: baseline; gap: .6rem; }
.svc h3 { font-size: 1.35rem; font-weight: 500; }
.svc__dots { flex: 1; border-bottom: 2px dotted var(--line); transform: translateY(-4px); min-width: 1rem; }
.svc__price { font-family: var(--font-head); font-size: 1.2rem; color: var(--accent); white-space: nowrap; }
.svc p { margin: .35rem 0 0; color: var(--muted); font-size: .98rem; }
.svc__thumb { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; flex: none; }
.svc__thumb img { width: 100%; height: 100%; object-fit: cover; }
@media (max-width: 760px) { .svc-list { grid-template-columns: 1fr; } }

/* Galería */
.mosaic { columns: 3 260px; column-gap: 1rem; }
.mosaic figure { margin: 0 0 1rem; break-inside: avoid; border-radius: var(--radius-lg); overflow: hidden; }
.mosaic img { width: 100%; transition: transform .6s ease; }
.mosaic figure:hover img { transform: scale(1.04); }

/* Opiniones */
.quotes { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }
.quotes--one { grid-template-columns: minmax(0, 720px); justify-content: center; text-align: center; }
.quote { margin: 0; height: 100%; padding: 2rem; background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--line); }
.quote__mark { width: 2rem; height: 2rem; color: var(--accent); margin-bottom: 1rem; }
.quotes--one .quote { padding: 3rem; }
.quote blockquote { margin: 0; font-family: var(--font-head); font-size: 1.25rem; line-height: 1.5; font-style: italic; }
.quote blockquote p { margin: 0; }
.quote figcaption { margin-top: 1.3rem; font-size: .85rem; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-weight: 600; }

/* Horario */
.hours { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: .6rem 2rem; margin: 0; }
.hours__row { display: flex; justify-content: space-between; gap: 1rem; padding: 1.1rem 0; border-bottom: 1px solid var(--line); }
.hours__row:last-child { border-bottom: 0; }
.hours dt { font-weight: 600; }
.hours dd { margin: 0; color: var(--muted); font-variant-numeric: tabular-nums; }
.hours__row.is-closed dd { font-style: italic; }

/* Ubicación */
.place__card { display: grid; justify-items: center; gap: .9rem; padding: clamp(2rem, 5vw, 3.5rem) 1.5rem; text-align: center; color: inherit; text-decoration: none; border-radius: var(--radius-lg); border: 1px solid var(--line); background:
  linear-gradient(var(--line) 1px, transparent 1px) 0 0 / 100% 40px,
  linear-gradient(90deg, var(--line) 1px, transparent 1px) 0 0 / 40px 100%,
  var(--surface); transition: transform .25s, box-shadow .25s; }
a.place__card:hover { transform: translateY(-3px); box-shadow: 0 25px 40px -25px var(--shadow); }
.place__pin { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%; background: var(--primary); color: var(--on-primary); }
.place__pin .ico { width: 1.7rem; height: 1.7rem; }
.place__addr { font-family: var(--font-head); font-size: clamp(1.3rem, 3vw, 1.8rem); }
.place__go { display: inline-flex; align-items: center; gap: .5rem; color: var(--accent); font-weight: 600; font-size: .95rem; }

/* Contacto */
.contact { background: var(--ink); color: var(--on-ink); }
.contact h2 { color: inherit; margin-bottom: 1.2rem; }
.contact .eyebrow { color: color-mix(in srgb, var(--primary) 70%, var(--on-ink)); }
.contact__in { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(2rem, 6vw, 6rem); align-items: start; }
.contact__in--solo { grid-template-columns: minmax(0, 640px); justify-content: center; text-align: center; }
.contact__in--solo .contact-list, .contact__in--solo .social { justify-content: center; justify-items: center; }
.contact__copy > p { opacity: .85; font-size: 1.1rem; margin-bottom: 1.8rem; }
.contact .contact-list { margin-bottom: 1.8rem; }
.contact .contact-list a { color: inherit; font-size: 1.05rem; }
.contact .social a { border-color: color-mix(in srgb, var(--on-ink) 30%, transparent); }
.contact__form { background: var(--surface); color: var(--text); padding: clamp(1.5rem, 4vw, 2.5rem); border-radius: var(--radius-lg); }
@media (max-width: 860px) { .contact__in { grid-template-columns: 1fr; } }

/* Pie */
.site-footer { padding: 3.5rem 0 2.5rem; border-top: 1px solid var(--line); }
.site-footer__in { display: grid; justify-items: center; gap: 1.5rem; text-align: center; }
.footnav { display: flex; flex-wrap: wrap; justify-content: center; gap: .5rem 1.8rem; }
.footnav__link { color: var(--muted); text-decoration: none; font-size: .95rem; }
.footnav__link:hover { color: var(--text); }
.site-footer__copy { margin: 0; color: var(--muted); font-size: .88rem; }
`;
