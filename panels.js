// Paneles de edición compartidos por el asistente (pasos 1–4) y el editor (pestañas).
// Cada panel recibe { project, change } y modifica `project` directamente; `change()` avisa
// de que hay cambios (guardado automático + actualización de la vista previa).

import { h } from './dom.js';
import { icon } from './icons.js';
import { toast, confirmDialog } from './feedback.js';
import {
  textField, selectField, checkField, colorField, segmented, group, accordion, itemTools,
} from './forms.js';
import { imagePicker, galleryPicker } from './images.js';
import {
  CATEGORIES, TEMPLATES, FONT_PAIRS, STYLES, SECTION_TYPES, LIMITS, createSection, getTemplate, categoryTemplate,
} from '../core/models.js';
import { uid, isValidEmail, isValidPhone, normalizeUrl, buildSocialLink } from '../core/utils.js';

const swap = (arr, i, j) => { [arr[i], arr[j]] = [arr[j], arr[i]]; };

// ---------- 1. Negocio ----------

export function businessPanel({ project, change }) {
  const b = project.business;
  const validators = [];
  const reg = (f) => { validators.push(f.validate); return f.el; };
  const bind = (key) => (v) => { b[key] = v; change(); };

  const optionalUrl = (v) => (!v.trim() || normalizeUrl(v) ? '' : 'Escribe una dirección web válida, por ejemplo https://ejemplo.com.');
  const optionalPhone = (v) => (!v.trim() || isValidPhone(v) ? '' : 'Introduce un número válido (entre 7 y 15 cifras).');
  const social = (net) => (v) => (!v.trim() || buildSocialLink(net, v) ? '' : 'Usa la URL completa del perfil o @usuario.');

  const category = selectField({
    label: 'Categoría del negocio', value: b.category,
    options: CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
    onChange: (v) => { b.category = v; change(); },
  });

  const el = h('div', { class: 'stack' },
    group('Datos del negocio',
      h('div', { class: 'form-grid' },
        reg(textField({ label: 'Nombre del negocio', value: b.name, required: true, maxlength: 80, placeholder: 'Ej. Peluquería Aurora', onInput: (v) => { b.name = v; change(); }, autocomplete: 'organization' })),
        category.el,
        textField({ label: 'Descripción corta', value: b.description, multiline: true, rows: 3, maxlength: 600, optional: true, span2: true,
          hint: 'Se usa en buscadores y al compartir la web. Una o dos frases.', onInput: bind('description') }).el)),
    group('Ubicación',
      h('div', { class: 'form-grid' },
        textField({ label: 'Ciudad', value: b.city, maxlength: 80, optional: true, onInput: bind('city'), autocomplete: 'address-level2' }).el,
        textField({ label: 'Dirección', value: b.address, maxlength: 140, optional: true, onInput: bind('address'), autocomplete: 'street-address' }).el,
        reg(textField({ label: 'Enlace de Google Maps', value: b.mapUrl, optional: true, span2: true, maxlength: 400, validate: optionalUrl,
          hint: 'Si lo dejas vacío, el mapa se busca con la dirección y la ciudad.', onInput: bind('mapUrl') })))),
    group('Contacto',
      h('div', { class: 'form-grid' },
        reg(textField({ label: 'Teléfono', value: b.phone, type: 'tel', inputmode: 'tel', optional: true, maxlength: 30, validate: optionalPhone, onInput: bind('phone'), autocomplete: 'tel' })),
        reg(textField({ label: 'WhatsApp', value: b.whatsapp, type: 'tel', inputmode: 'tel', optional: true, maxlength: 30, validate: optionalPhone, onInput: bind('whatsapp'),
          hint: 'Sin prefijo, se añade el del país (abajo).' })),
        reg(textField({ label: 'Correo electrónico', value: b.email, type: 'email', optional: true, maxlength: 120, onInput: bind('email'), autocomplete: 'email',
          validate: (v) => (!v.trim() || isValidEmail(v) ? '' : 'Escribe un correo válido, por ejemplo hola@negocio.com.') })),
        reg(textField({ label: 'Enlace de reservas externo', value: b.bookingUrl, optional: true, maxlength: 400, validate: optionalUrl, onInput: bind('bookingUrl'),
          hint: 'Calendly, Treatwell, Google Calendar… LocalBoost no gestiona reservas.' })))),
    group('Redes sociales',
      h('div', { class: 'form-grid' },
        reg(textField({ label: 'Instagram', value: b.instagram, optional: true, placeholder: '@usuario', validate: social('instagram'), onInput: bind('instagram') })),
        reg(textField({ label: 'Facebook', value: b.facebook, optional: true, placeholder: 'https://facebook.com/…', validate: social('facebook'), onInput: bind('facebook') })),
        reg(textField({ label: 'TikTok', value: b.tiktok, optional: true, placeholder: '@usuario', validate: social('tiktok'), onInput: bind('tiktok') })))),
    accordion('Opciones avanzadas de WhatsApp', 'phone', false,
      textField({ label: 'Prefijo de país', value: b.countryCode, optional: true, maxlength: 4, inputmode: 'numeric',
        hint: 'Solo números. España = 34.', validate: (v) => (!v.trim() || /^\d{1,4}$/.test(v.trim()) ? '' : 'Usa solo números.'),
        onInput: (v) => { b.countryCode = v.replace(/\D/g, '') || '34'; change(); } }).el,
      textField({ label: 'Mensaje inicial', value: b.whatsappMessage, multiline: true, rows: 2, maxlength: 200, optional: true,
        hint: 'Texto que aparecerá escrito al abrir el chat.', onInput: bind('whatsappMessage') }).el));

  return { el, validate: () => validators.map((v) => v()).every(Boolean) && !!b.name.trim() };
}

// ---------- 2. Servicios ----------

export function servicesPanel({ project, change }) {
  const host = h('div', { class: 'stack' });
  const list = h('div', { class: 'items' });

  function draw() {
    const items = project.services;
    list.replaceChildren(...items.map((s, i) => {
      const nm = s.name.trim() || `servicio ${i + 1}`;
      return h('div', { class: 'item' },
        h('div', { class: 'item__head' },
          h('span', { class: 'item__title' }, `Servicio ${i + 1}`),
          itemTools({
            index: i, count: items.length, name: nm,
            onUp: () => { swap(items, i, i - 1); draw(); change(); },
            onDown: () => { swap(items, i, i + 1); draw(); change(); },
            onDelete: async () => {
              if (s.name.trim() || s.description.trim()) {
                const ok = await confirmDialog({ title: `¿Eliminar “${nm}”?`, message: 'Se quitará de la web. Esta acción no se puede deshacer.', confirmLabel: 'Eliminar', danger: true });
                if (!ok) return;
              }
              items.splice(i, 1); draw(); change();
            },
          })),
        h('div', { class: 'form-grid' },
          textField({ label: 'Nombre', value: s.name, maxlength: 120, onInput: (v) => { s.name = v; change(); } }).el,
          textField({ label: 'Precio', value: s.price, optional: true, maxlength: 40, placeholder: 'Ej. 30 € o Desde 45 €', onInput: (v) => { s.price = v; change(); } }).el,
          textField({ label: 'Descripción', value: s.description, optional: true, multiline: true, rows: 2, maxlength: 400, span2: true, onInput: (v) => { s.description = v; change(); } }).el,
          textField({ label: 'Categoría', value: s.category, optional: true, maxlength: 60, placeholder: 'Ej. Color, Mecánica, Entrantes',
            hint: 'Los servicios con la misma categoría se agrupan.', onInput: (v) => { s.category = v; change(); } }).el,
          imagePicker({ project, label: 'Imagen', getId: () => s.imageId, setId: (id) => { s.imageId = id; }, onChange: change, maxDim: 900 })));
    }));
    if (!items.length) {
      list.replaceChildren(h('div', { class: 'empty' }, icon('list', 40, 'empty__art'),
        h('h2', null, 'Aún no hay servicios'), h('p', null, 'Añade los servicios o productos que ofrece el negocio, con su precio si quieres mostrarlo.')));
    }
    addBtn.disabled = items.length >= LIMITS.maxServices;
  }

  const addBtn = h('button', { class: 'btn', type: 'button', onclick: () => {
    project.services.push({ id: uid('svc'), name: '', description: '', price: '', category: '', imageId: '' });
    draw(); change();
    const inputs = list.querySelectorAll('.item:last-child input');
    inputs[0]?.focus();
  } }, icon('plus', 16), 'Añadir servicio');

  host.append(list, h('div', null, addBtn));
  draw();
  return { el: host, validate: () => true };
}

// ---------- 3. Identidad visual ----------

export function identityPanel({ project, change, onTemplateChange }) {
  const id = project.identity;
  const recommended = categoryTemplate(project.business.category);
  const host = h('div', { class: 'stack' });

  const primary = colorField({ label: 'Color principal', value: id.primary, onChange: (v) => { id.primary = v; change(); } });
  const secondary = colorField({ label: 'Color secundario', value: id.secondary, hint: 'Fondos oscuros y textos de contraste.', onChange: (v) => { id.secondary = v; change(); } });
  const fontSel = selectField({ label: 'Tipografía', value: id.fontPair, options: FONT_PAIRS.map((f) => ({ value: f.id, label: f.label })),
    hint: 'Fuentes del sistema: la web carga al instante y no depende de servicios externos.', onChange: (v) => { id.fontPair = v; change(); } });
  const styleSel = selectField({ label: 'Estilo visual', value: id.style, options: STYLES.map((s) => ({ value: s.id, label: s.label })), onChange: (v) => { id.style = v; change(); } });
  function buildMode() {
    return h('div', { class: 'field' }, h('span', { class: 'field__label' }, 'Tema de la web'),
      segmented({ label: 'Tema de la web', value: id.themeMode, options: [{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }], onChange: (v) => { id.themeMode = v; change(); } }));
  }
  let modeEl = buildMode();

  const cards = TEMPLATES.map((t) => {
    const art = h('div', { class: 'template-card__art', style: { background: `linear-gradient(135deg, ${t.defaults.secondary} 0%, ${t.defaults.primary} 130%)`, display: 'grid', placeItems: 'center' } },
      h('span', { style: { color: '#fff', fontSize: '22px', fontWeight: '600', letterSpacing: '0.02em', fontFamily: FONT_PAIRS.find((f) => f.id === t.defaults.fontPair)?.heading } }, t.name));
    const btn = h('button', { class: 'template-card', type: 'button', 'aria-pressed': String(id.templateId === t.id) }, art,
      h('strong', null, t.name, t.id === recommended ? h('span', { class: 'pill pill--demo', style: { marginLeft: '8px' } }, 'Recomendada') : null),
      h('span', null, t.tagline));
    btn.addEventListener('click', () => {
      if (id.templateId === t.id) return;
      id.templateId = t.id;
      Object.assign(id, { primary: t.defaults.primary, secondary: t.defaults.secondary, themeMode: t.defaults.themeMode, fontPair: t.defaults.fontPair, style: t.defaults.style });
      cards.forEach((c) => c.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      primary.set(id.primary); secondary.set(id.secondary);
      fontSel.select.value = id.fontPair; styleSel.select.value = id.style;
      const freshMode = buildMode();
      modeEl.replaceWith(freshMode);
      modeEl = freshMode;
      toast(`Plantilla ${t.name}: hemos aplicado su paleta y tipografía. Puedes ajustarlas abajo.`, { type: 'info' });
      onTemplateChange?.(getTemplate(t.id));
      change();
    });
    return btn;
  });

  host.append(
    group('Plantilla', h('div', { class: 'template-grid', role: 'group', 'aria-label': 'Plantillas' }, cards),
      h('p', { class: 'field__hint' }, 'Cada plantilla tiene su propia composición, tipografía y carácter; no es solo un cambio de color.')),
    group('Colores y estilo',
      h('div', { class: 'form-grid' }, primary.el, secondary.el, fontSel.el, styleSel.el, modeEl)),
    group('Logotipo',
      imagePicker({ project, label: 'Logotipo', getId: () => id.logoId, setId: (v) => { id.logoId = v; }, onChange: change, maxDim: 600,
        hint: 'Mejor PNG o WebP con fondo transparente. Si no subes uno, se usa el nombre del negocio.' })));
  return { el: host, validate: () => true };
}

// ---------- 4. Secciones ----------

const CTA_OPTIONS = [
  { value: 'whatsapp', label: 'Abrir WhatsApp' },
  { value: 'phone', label: 'Llamar por teléfono' },
  { value: 'booking', label: 'Enlace de reservas' },
  { value: 'contact', label: 'Ir a la sección de contacto' },
];

function sectionFields(sec, project, change) {
  const c = sec.content;
  const t = (key, label, extra = {}) => textField({ label, value: c[key] ?? '', onInput: (v) => { c[key] = v; change(); }, maxlength: 300, ...extra }).el;
  switch (sec.type) {
    case 'hero':
      return [
        t('title', 'Titular', { maxlength: 120 }),
        t('subtitle', 'Subtítulo', { multiline: true, rows: 2, maxlength: 300 }),
        t('ctaLabel', 'Texto del botón principal', { maxlength: 40 }),
        selectField({ label: 'Acción del botón', value: c.ctaType, options: CTA_OPTIONS, onChange: (v) => { c.ctaType = v; change(); },
          hint: 'Si falta el dato (p. ej. no hay WhatsApp), el botón cae a la siguiente opción disponible.' }).el,
        imagePicker({ project, label: 'Imagen de portada', getId: () => c.imageId, setId: (v) => { c.imageId = v; }, onChange: change, maxDim: 1600 }),
      ];
    case 'about':
      return [
        t('title', 'Título', { maxlength: 100 }),
        t('text', 'Texto', { multiline: true, rows: 5, maxlength: 1200, hint: 'Separa párrafos con una línea en blanco.' }),
        imagePicker({ project, label: 'Imagen', getId: () => c.imageId, setId: (v) => { c.imageId = v; }, onChange: change, maxDim: 1200 }),
      ];
    case 'services':
      return [t('title', 'Título', { maxlength: 100 }), t('intro', 'Introducción', { multiline: true, rows: 2, maxlength: 300 }),
        h('p', { class: 'field__hint' }, 'Los servicios se editan en el paso “Servicios”.')];
    case 'gallery':
      return [t('title', 'Título', { maxlength: 100 }), galleryPicker({ project, content: c, onChange: change })];
    case 'testimonials': return [t('title', 'Título', { maxlength: 100 }), testimonialsEditor(c, change)];
    case 'hours': return [t('title', 'Título', { maxlength: 100 }), hoursEditor(c, change)];
    case 'location':
      return [t('title', 'Título', { maxlength: 100 }), t('note', 'Nota (cómo llegar, aparcamiento…)', { multiline: true, rows: 2, maxlength: 300, optional: true }),
        h('p', { class: 'field__hint' }, 'La dirección y el enlace al mapa se toman de “Negocio”.')];
    case 'contact':
      return [t('title', 'Título', { maxlength: 100 }), t('intro', 'Introducción', { multiline: true, rows: 2, maxlength: 300 }),
        checkField({ label: 'Mostrar formulario de contacto', checked: c.showForm, onChange: (v) => { c.showForm = v; change(); },
          hint: 'No envía datos a un servidor: abre el correo o WhatsApp del visitante con el mensaje preparado.' })];
    case 'footer':
      return [t('text', 'Texto del pie', { optional: true, maxlength: 200, hint: 'Si lo dejas vacío se muestra el nombre del negocio y el año.' })];
    default: return [];
  }
}

function testimonialsEditor(c, change) {
  const wrap = h('div', { class: 'items' });
  const draw = () => {
    wrap.replaceChildren(
      ...c.items.map((it, i) => h('div', { class: 'item' },
        h('div', { class: 'item__head' }, h('span', { class: 'item__title' }, `Opinión ${i + 1}`),
          itemTools({ index: i, count: c.items.length, name: `opinión ${i + 1}`,
            onUp: () => { swap(c.items, i, i - 1); draw(); change(); }, onDown: () => { swap(c.items, i, i + 1); draw(); change(); },
            onDelete: () => { c.items.splice(i, 1); draw(); change(); } })),
        textField({ label: 'Nombre', value: it.name, maxlength: 80, onInput: (v) => { it.name = v; change(); } }).el,
        textField({ label: 'Opinión', value: it.text, multiline: true, rows: 3, maxlength: 400, onInput: (v) => { it.text = v; change(); } }).el)),
      h('p', { class: 'field__hint' }, 'Usa solo opiniones reales de clientes y con su permiso.'),
      h('div', null, h('button', { class: 'btn btn--sm', type: 'button', disabled: c.items.length >= LIMITS.maxTestimonials, onclick: () => {
        c.items.push({ id: uid('t'), name: '', text: '' }); draw(); change();
      } }, icon('plus', 15), 'Añadir opinión')));
  };
  draw();
  return wrap;
}

function hoursEditor(c, change) {
  return h('div', { class: 'items' }, c.rows.map((r) => {
    const open = textField({ label: 'Abre', value: r.open, type: 'time', maxlength: 5, onInput: (v) => { if (v) { r.open = v; change(); } } });
    const close = textField({ label: 'Cierra', value: r.close, type: 'time', maxlength: 5, onInput: (v) => { if (v) { r.close = v; change(); } } });
    const refresh = () => { open.input.disabled = r.closed; close.input.disabled = r.closed; };
    refresh();
    return h('div', { class: 'item' },
      checkField({ label: `${r.day}: cerrado`, checked: r.closed, onChange: (v) => { r.closed = v; refresh(); change(); } }),
      h('div', { class: 'form-grid' }, open.el, close.el));
  }));
}

export function sectionsPanel({ project, change }) {
  const host = h('div', { class: 'stack' });
  const list = h('div', { class: 'sections-list' });
  const MIN = 1; // hero siempre primero

  function move(i, dir) {
    const j = i + dir;
    const s = project.sections;
    if (j < MIN || j > s.length - 2) return; // hero primero y pie último
    swap(s, i, j);
    draw(); change();
  }

  function draw() {
    const secs = project.sections;
    const openIds = new Set([...list.querySelectorAll('details[open]')].map((d) => d.dataset.sid));
    list.replaceChildren(...secs.map((sec, i) => {
      const meta = SECTION_TYPES[sec.type];
      const locked = sec.type === 'hero' || sec.type === 'footer';
      const toggle = h('input', { type: 'checkbox', checked: sec.enabled, disabled: !!meta.required, 'aria-label': `Mostrar sección ${meta.label}` });
      toggle.addEventListener('change', () => { sec.enabled = toggle.checked; row.dataset.enabled = String(sec.enabled); change(); });
      const row = h('div', { class: 'sec', 'data-enabled': String(sec.enabled) },
        toggle,
        h('span', { class: 'sec__name' }, icon(meta.icon, 16), meta.label, meta.required ? h('span', { class: 'sec__badge' }, 'obligatoria') : null),
        h('div', { class: 'item__tools' },
          h('button', { class: 'icon-btn', type: 'button', disabled: locked || i <= MIN, 'aria-label': `Subir ${meta.label}`, title: 'Subir', onclick: () => move(i, -1) }, icon('up', 16)),
          h('button', { class: 'icon-btn', type: 'button', disabled: locked || i >= secs.length - 2, 'aria-label': `Bajar ${meta.label}`, title: 'Bajar', onclick: () => move(i, 1) }, icon('down', 16))));
      const details = h('details', { class: 'acc', 'data-sid': sec.id, open: openIds.has(sec.id) },
        h('summary', null, icon('edit', 15), `Configurar ${meta.label.toLowerCase()}`),
        h('div', { class: 'acc__body' }, ...sectionFields(sec, project, change)));
      return h('div', { class: 'stack', style: { gap: '6px' } }, row, details);
    }));
  }

  draw();
  host.append(
    h('p', { class: 'muted' }, 'Activa o desactiva secciones y cambia su orden. La portada va siempre arriba y el pie de página al final.'),
    list);
  return { el: host, validate: () => true };
}

// ---------- SEO ----------

export function seoPanel({ project, change }) {
  const seo = project.seo;
  return {
    el: h('div', { class: 'stack' },
      group('Buscadores',
        textField({ label: 'Título de la página', value: seo.title, optional: true, maxlength: 120,
          hint: 'Si lo dejas vacío se genera con el nombre, la categoría y la ciudad.', onInput: (v) => { seo.title = v; change(); } }).el,
        textField({ label: 'Descripción', value: seo.description, optional: true, multiline: true, rows: 3, maxlength: 320,
          hint: 'Unos 150 caracteres. Si la dejas vacía se usa la descripción del negocio.', onInput: (v) => { seo.description = v; change(); } }).el)),
    validate: () => true,
  };
}

/** Añade una sección que falte (por ejemplo, tras importar datos antiguos). */
export function ensureSection(project, type) {
  if (project.sections.some((s) => s.type === type)) return;
  const sec = createSection(type);
  const footerIdx = project.sections.findIndex((s) => s.type === 'footer');
  project.sections.splice(footerIdx < 0 ? project.sections.length : footerIdx, 0, sec);
}
