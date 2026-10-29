// Modelos de datos, catálogos y saneado de proyectos.
// Todo lo que se lee de localStorage o de una copia de seguridad pasa por sanitizeProject().

import { uid, deepClone, isHexColor } from './utils.js';

export const SCHEMA_VERSION = 1;

export const CATEGORIES = [
  { id: 'beauty', label: 'Belleza y peluquería', template: 'beauty' },
  { id: 'wellness', label: 'Estética y bienestar', template: 'beauty' },
  { id: 'restaurant', label: 'Restaurante y cafetería', template: 'restaurant' },
  { id: 'motor', label: 'Taller de motos y automoción', template: 'motor' },
  { id: 'fitness', label: 'Fitness y entrenadores', template: 'motor' },
  { id: 'services', label: 'Servicios locales', template: 'beauty' },
  { id: 'other', label: 'Otro negocio', template: 'beauty' },
];

export const TEMPLATES = [
  {
    id: 'beauty',
    name: 'Atelier',
    tagline: 'Elegante y luminoso para belleza y bienestar',
    defaults: { primary: '#b08968', secondary: '#2b2320', themeMode: 'light', fontPair: 'serif-elegant', style: 'soft' },
  },
  {
    id: 'restaurant',
    name: 'Mesa',
    tagline: 'Editorial y cálido para restauración',
    defaults: { primary: '#c8553d', secondary: '#1f1a17', themeMode: 'dark', fontPair: 'serif-classic', style: 'editorial' },
  },
  {
    id: 'motor',
    name: 'Garage',
    tagline: 'Oscuro y potente para talleres y motos',
    defaults: { primary: '#ff4d2e', secondary: '#0e0e10', themeMode: 'dark', fontPair: 'sans-condensed', style: 'sharp' },
  },
];

// Pilas de fuentes del sistema: la web exportada no depende de servicios externos.
export const FONT_PAIRS = [
  { id: 'serif-elegant', label: 'Serif elegante', heading: "'Iowan Old Style','Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif", body: "'Avenir Next',Avenir,'Segoe UI',system-ui,sans-serif" },
  { id: 'serif-classic', label: 'Serif clásica', heading: "Georgia,'Times New Roman',Times,serif", body: "system-ui,'Segoe UI',Roboto,sans-serif" },
  { id: 'sans-modern', label: 'Sans moderna', heading: "'Avenir Next','Segoe UI',system-ui,sans-serif", body: "'Avenir Next','Segoe UI',system-ui,sans-serif" },
  { id: 'sans-condensed', label: 'Sans condensada', heading: "'Arial Narrow','Roboto Condensed','Helvetica Neue',Arial,sans-serif", body: "system-ui,'Segoe UI',Roboto,Arial,sans-serif" },
  { id: 'mono-tech', label: 'Técnica', heading: "ui-monospace,'SF Mono',Menlo,Consolas,monospace", body: "system-ui,'Segoe UI',Roboto,sans-serif" },
];

export const STYLES = [
  { id: 'soft', label: 'Suave (esquinas redondeadas)' },
  { id: 'editorial', label: 'Editorial (líneas finas)' },
  { id: 'sharp', label: 'Afilado (ángulos rectos)' },
];

export const SECTION_TYPES = {
  hero: { label: 'Portada', icon: 'layout', required: true },
  about: { label: 'Sobre nosotros', icon: 'user' },
  services: { label: 'Servicios', icon: 'list' },
  gallery: { label: 'Galería', icon: 'image' },
  testimonials: { label: 'Opiniones', icon: 'quote' },
  hours: { label: 'Horario', icon: 'clock' },
  location: { label: 'Ubicación', icon: 'pin' },
  contact: { label: 'Contacto', icon: 'mail' },
  footer: { label: 'Pie de página', icon: 'minus', required: true },
};

export const STATUS = {
  draft: 'Borrador',
  ready: 'Listo',
  exported: 'Exportado',
};

export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const LIMITS = {
  maxImageSourceBytes: 4 * 1024 * 1024, // archivo original admitido
  maxImageDimension: 1400, // px tras comprimir
  maxProjectImages: 24,
  maxServices: 40,
  maxTestimonials: 12,
  maxGallery: 12,
};

// ---------- Contenido de ejemplo por categoría (texto de demostración) ----------

const CATEGORY_COPY = {
  beauty: {
    heroTitle: 'Tu cabello, en las mejores manos',
    heroSubtitle: 'Cortes, color y tratamientos personalizados en un espacio donde apetece quedarse.',
    about: 'Somos un equipo apasionado por el cabello y el cuidado personal. Trabajamos con productos de calidad y escuchamos antes de empezar: cada persona merece un resultado a su medida.',
    services: [
      ['Corte y peinado', 'Asesoramiento, corte y acabado a medida.', '30 €'],
      ['Color y mechas', 'Técnicas de color con productos profesionales.', 'Desde 55 €'],
      ['Tratamiento capilar', 'Hidratación y reparación profunda.', '25 €'],
    ],
  },
  wellness: {
    heroTitle: 'Un momento para ti',
    heroSubtitle: 'Tratamientos faciales y corporales en un ambiente tranquilo y cuidado.',
    about: 'Un centro pensado para desconectar. Combinamos técnica profesional y trato cercano para que cada visita sea una pausa que se note.',
    services: [
      ['Limpieza facial', 'Limpieza profunda e hidratación.', '45 €'],
      ['Masaje relajante', 'Sesión de 50 minutos.', '50 €'],
      ['Depilación', 'Cera y técnicas suaves.', 'Desde 8 €'],
    ],
  },
  restaurant: {
    heroTitle: 'Cocina de mercado, sin prisa',
    heroSubtitle: 'Producto de temporada, recetas con memoria y una carta que cambia con el calendario.',
    about: 'Cocinamos con lo que trae cada estación y con proveedores cercanos. Una casa pequeña donde la mesa es el centro.',
    services: [
      ['Menú del día', 'Primero, segundo, postre y bebida.', '14,50 €'],
      ['Carta de temporada', 'Platos para compartir.', 'Desde 8 €'],
      ['Reservas de grupo', 'Menús cerrados para celebraciones.', 'Consultar'],
    ],
  },
  motor: {
    heroTitle: 'Tu moto, a punto',
    heroSubtitle: 'Mecánica, puesta a punto y preparación para quienes se toman la moto en serio.',
    about: 'Taller especializado en motocicletas. Diagnóstico claro, presupuesto antes de tocar nada y repuestos de calidad.',
    services: [
      ['Revisión completa', 'Frenos, neumáticos, cadena y niveles.', 'Desde 60 €'],
      ['Cambio de aceite y filtros', 'Con productos homologados.', 'Desde 35 €'],
      ['Diagnosis electrónica', 'Lectura de averías y ajuste.', '30 €'],
    ],
  },
  fitness: {
    heroTitle: 'Entrena con un plan',
    heroSubtitle: 'Entrenamiento personal y grupos reducidos adaptados a tu nivel y a tu semana.',
    about: 'Un estudio pequeño con atención real. Planificamos, medimos progreso y ajustamos contigo.',
    services: [
      ['Entrenamiento personal', 'Sesiones 1 a 1.', '35 €'],
      ['Grupos reducidos', 'Máximo 6 personas.', '45 €/mes'],
      ['Valoración inicial', 'Objetivos y plan de trabajo.', 'Gratis'],
    ],
  },
  services: {
    heroTitle: 'Un servicio de confianza en tu barrio',
    heroSubtitle: 'Trabajo bien hecho, trato directo y presupuesto sin sorpresas.',
    about: 'Llevamos años atendiendo a vecinos y negocios de la zona. Respondemos rápido y damos la cara.',
    services: [
      ['Visita y presupuesto', 'Sin compromiso.', 'Gratis'],
      ['Servicio estándar', 'Descripción del servicio.', 'Desde 40 €'],
      ['Urgencias', 'Atención prioritaria.', 'Consultar'],
    ],
  },
  other: {
    heroTitle: 'Bienvenido a tu negocio local',
    heroSubtitle: 'Cuéntales en una frase qué haces y por qué confiar en ti.',
    about: 'Presenta aquí tu historia, tu forma de trabajar y lo que te hace diferente.',
    services: [
      ['Servicio principal', 'Descripción breve.', 'Desde 20 €'],
      ['Servicio complementario', 'Descripción breve.', 'Consultar'],
    ],
  },
};

export function categoryTemplate(categoryId) {
  return CATEGORIES.find((c) => c.id === categoryId)?.template || 'beauty';
}

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

export function getFontPair(id) {
  return FONT_PAIRS.find((f) => f.id === id) || FONT_PAIRS[0];
}

export function defaultHours() {
  return DAYS.map((day, i) => ({
    id: uid('h'),
    day,
    closed: i === 6,
    open: i === 5 ? '10:00' : '09:30',
    close: i === 5 ? '14:00' : '19:30',
  }));
}

/** Crea una sección con contenido por defecto. */
export function createSection(type, copy = CATEGORY_COPY.other) {
  const base = { id: uid('sec'), type, enabled: true };
  switch (type) {
    case 'hero':
      return { ...base, content: { title: copy.heroTitle, subtitle: copy.heroSubtitle, ctaLabel: 'Pedir cita', ctaType: 'whatsapp', imageId: '' } };
    case 'about':
      return { ...base, content: { title: 'Sobre nosotros', text: copy.about, imageId: '' } };
    case 'services':
      return { ...base, content: { title: 'Servicios', intro: 'Lo que hacemos, con precios claros.' } };
    case 'gallery':
      return { ...base, content: { title: 'Galería', imageIds: [] } };
    case 'testimonials':
      return { ...base, content: { title: 'Opiniones', items: [] } };
    case 'hours':
      return { ...base, content: { title: 'Horario', rows: defaultHours() } };
    case 'location':
      return { ...base, content: { title: 'Dónde estamos', note: '' } };
    case 'contact':
      return { ...base, content: { title: 'Contacto', intro: 'Escríbenos y te respondemos lo antes posible.', showForm: true } };
    case 'footer':
      return { ...base, content: { text: '' } };
    default:
      return null;
  }
}

export const DEFAULT_SECTION_ORDER = ['hero', 'about', 'services', 'gallery', 'testimonials', 'hours', 'location', 'contact', 'footer'];

/** Proyecto nuevo. `demo:true` marca el contenido como demostración. */
export function createProject({ name = '', category = 'beauty', demo = false } = {}) {
  const templateId = categoryTemplate(category);
  const tpl = getTemplate(templateId);
  const copy = CATEGORY_COPY[category] || CATEGORY_COPY.other;
  const now = new Date().toISOString();
  const sections = DEFAULT_SECTION_ORDER.map((t) => createSection(t, copy));
  // Galería y opiniones empiezan desactivadas hasta que haya contenido real.
  for (const s of sections) if (s.type === 'gallery' || s.type === 'testimonials') s.enabled = false;

  return {
    id: uid('proj'),
    schemaVersion: SCHEMA_VERSION,
    name: name || 'Proyecto sin nombre',
    status: 'draft',
    isDemo: !!demo,
    createdAt: now,
    updatedAt: now,
    lastExportedAt: '',
    wizardStep: 1,
    business: {
      name: '',
      category,
      description: '',
      city: '',
      address: '',
      phone: '',
      whatsapp: '',
      countryCode: '34',
      whatsappMessage: 'Hola, me gustaría pedir información.',
      email: '',
      instagram: '',
      facebook: '',
      tiktok: '',
      bookingUrl: '',
      mapUrl: '',
    },
    services: copy.services.map(([n, d, p]) => ({ id: uid('svc'), name: n, description: d, price: p, category: '', imageId: '' })),
    identity: {
      templateId,
      primary: tpl.defaults.primary,
      secondary: tpl.defaults.secondary,
      themeMode: tpl.defaults.themeMode,
      fontPair: tpl.defaults.fontPair,
      style: tpl.defaults.style,
      logoId: '',
    },
    seo: { title: '', description: '' },
    sections,
    assets: {},
  };
}

// ---------- Saneado ----------

const str = (v, max = 2000) => (typeof v === 'string' ? v.slice(0, max) : v == null ? '' : String(v).slice(0, max));
const bool = (v, d = false) => (typeof v === 'boolean' ? v : d);
const arr = (v) => (Array.isArray(v) ? v : []);
const oneOf = (v, list, d) => (list.includes(v) ? v : d);
const isoOrNow = (v) => (typeof v === 'string' && !Number.isNaN(new Date(v).getTime()) ? v : new Date().toISOString());
const dataUrlOk = (v) => typeof v === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(v);

/**
 * Devuelve un proyecto válido a partir de datos no fiables o de versiones anteriores,
 * o null si no hay forma de recuperarlo.
 */
export function sanitizeProject(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const base = createProject({ category: oneOf(input?.business?.category, CATEGORIES.map((c) => c.id), 'beauty') });
  const p = deepClone(base);

  p.id = typeof input.id === 'string' && /^[\w-]{3,64}$/.test(input.id) ? input.id : base.id;
  p.name = str(input.name, 120) || 'Proyecto sin nombre';
  p.status = oneOf(input.status, Object.keys(STATUS), 'draft');
  p.isDemo = bool(input.isDemo);
  p.createdAt = isoOrNow(input.createdAt);
  p.updatedAt = isoOrNow(input.updatedAt);
  p.lastExportedAt = input.lastExportedAt ? isoOrNow(input.lastExportedAt) : '';
  p.wizardStep = Math.min(5, Math.max(1, parseInt(input.wizardStep, 10) || 1));

  const b = input.business && typeof input.business === 'object' ? input.business : {};
  for (const key of Object.keys(p.business)) {
    if (key === 'category') p.business.category = oneOf(b.category, CATEGORIES.map((c) => c.id), 'other');
    else if (b[key] !== undefined) p.business[key] = str(b[key], key === 'description' ? 600 : 300);
  }
  p.business.countryCode = str(p.business.countryCode, 4).replace(/\D/g, '') || '34';

  if (Array.isArray(input.services)) {
    p.services = arr(input.services).slice(0, LIMITS.maxServices).map((s) => ({
      id: str(s?.id, 64) || uid('svc'),
      name: str(s?.name, 120),
      description: str(s?.description, 400),
      price: str(s?.price, 40),
      category: str(s?.category, 60),
      imageId: str(s?.imageId, 64),
    }));
  }

  const idn = input.identity && typeof input.identity === 'object' ? input.identity : {};
  p.identity.templateId = oneOf(idn.templateId, TEMPLATES.map((t) => t.id), p.identity.templateId);
  p.identity.primary = isHexColor(idn.primary) ? idn.primary : p.identity.primary;
  p.identity.secondary = isHexColor(idn.secondary) ? idn.secondary : p.identity.secondary;
  p.identity.themeMode = oneOf(idn.themeMode, ['light', 'dark'], p.identity.themeMode);
  p.identity.fontPair = oneOf(idn.fontPair, FONT_PAIRS.map((f) => f.id), p.identity.fontPair);
  p.identity.style = oneOf(idn.style, STYLES.map((s) => s.id), p.identity.style);
  p.identity.logoId = str(idn.logoId, 64);

  const seo = input.seo && typeof input.seo === 'object' ? input.seo : {};
  p.seo = { title: str(seo.title, 120), description: str(seo.description, 320) };

  // Imágenes
  p.assets = {};
  if (input.assets && typeof input.assets === 'object') {
    for (const [id, a] of Object.entries(input.assets).slice(0, LIMITS.maxProjectImages + 2)) {
      if (a && dataUrlOk(a.dataUrl) && /^[\w-]{1,64}$/.test(id)) {
        p.assets[id] = { name: str(a.name, 120) || 'imagen', mime: str(a.mime, 40), size: Number(a.size) || 0, dataUrl: a.dataUrl, width: Number(a.width) || 0, height: Number(a.height) || 0 };
      }
    }
  }
  const hasAsset = (id) => !id || !!p.assets[id];
  if (!hasAsset(p.identity.logoId)) p.identity.logoId = '';

  // Secciones
  if (Array.isArray(input.sections)) {
    const seen = new Set();
    const out = [];
    for (const s of input.sections) {
      const type = s?.type;
      if (!SECTION_TYPES[type] || seen.has(type)) continue; // una sección de cada tipo
      seen.add(type);
      const fresh = createSection(type, CATEGORY_COPY[p.business.category] || CATEGORY_COPY.other);
      const c = s.content && typeof s.content === 'object' ? s.content : {};
      const content = fresh.content;
      for (const k of Object.keys(content)) {
        if (typeof content[k] === 'string' && c[k] !== undefined) content[k] = str(c[k], 1500);
      }
      if (type === 'hero') content.ctaType = oneOf(c.ctaType, ['whatsapp', 'phone', 'booking', 'contact'], 'whatsapp');
      if (type === 'hero' || type === 'about') content.imageId = hasAsset(str(c.imageId, 64)) ? str(c.imageId, 64) : '';
      if (type === 'gallery') content.imageIds = arr(c.imageIds).map((x) => str(x, 64)).filter((x) => x && p.assets[x]).slice(0, LIMITS.maxGallery);
      if (type === 'testimonials') {
        content.items = arr(c.items).slice(0, LIMITS.maxTestimonials).map((t) => ({ id: str(t?.id, 64) || uid('t'), name: str(t?.name, 80), text: str(t?.text, 400) }));
      }
      if (type === 'hours') {
        const rows = arr(c.rows).slice(0, 7);
        if (rows.length) {
          content.rows = rows.map((r, i) => ({
            id: str(r?.id, 64) || uid('h'),
            day: str(r?.day, 20) || DAYS[i] || '',
            closed: bool(r?.closed),
            open: /^\d{2}:\d{2}$/.test(r?.open) ? r.open : '09:00',
            close: /^\d{2}:\d{2}$/.test(r?.close) ? r.close : '18:00',
          }));
        }
      }
      if (type === 'contact') content.showForm = bool(c.showForm, true);
      out.push({ id: str(s.id, 64) || fresh.id, type, enabled: bool(s.enabled, true), content });
    }
    // Garantiza que existan las secciones obligatorias
    for (const t of Object.keys(SECTION_TYPES)) {
      if (SECTION_TYPES[t].required && !seen.has(t)) {
        const fresh = createSection(t, CATEGORY_COPY[p.business.category] || CATEGORY_COPY.other);
        if (t === 'hero') out.unshift(fresh);
        else out.push(fresh);
      }
    }
    p.sections = out;
  }
  return p;
}

export function projectMeta(p) {
  return {
    id: p.id,
    name: p.name,
    category: p.business.category,
    status: p.status,
    isDemo: p.isDemo,
    templateId: p.identity.templateId,
    primary: p.identity.primary,
    businessName: p.business.name,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    lastExportedAt: p.lastExportedAt,
  };
}
