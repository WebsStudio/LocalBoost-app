// Convierte un proyecto en un "modelo de sitio" listo para pintar: enlaces resueltos,
// imágenes con rutas relativas, secciones activas en orden y paleta de colores.

import {
  buildTelLink, buildWhatsAppLink, buildMailto, buildMapLink, buildSocialLink,
  normalizeUrl, isValidEmail, slugify,
} from '../core/utils.js';
import { CATEGORIES, getFontPair } from '../core/models.js';
import { buildPalette } from './color.js';

export const NAV_LABELS = {
  about: ['nosotros', 'Nosotros'],
  services: ['servicios', 'Servicios'],
  gallery: ['galeria', 'Galería'],
  testimonials: ['opiniones', 'Opiniones'],
  hours: ['horario', 'Horario'],
  location: ['ubicacion', 'Ubicación'],
  contact: ['contacto', 'Contacto'],
};

const SOCIAL_LABELS = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok' };
const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

function groupHours(rows) {
  const norm = rows.map((r) => ({ day: r.day, key: r.closed ? 'closed' : `${r.open}-${r.close}`, closed: r.closed, open: r.open, close: r.close }));
  const out = [];
  for (const r of norm) {
    const last = out[out.length - 1];
    if (last && last.key === r.key) last.days.push(r.day);
    else out.push({ key: r.key, days: [r.day], closed: r.closed, open: r.open, close: r.close });
  }
  return out.map((g) => ({
    label: g.days.length > 1 ? `${g.days[0]} a ${g.days[g.days.length - 1]}` : g.days[0],
    text: g.closed ? 'Cerrado' : `${g.open} – ${g.close}`,
    closed: g.closed,
  }));
}

export function buildSiteModel(project) {
  const b = project.business;
  const used = new Map(); // assetId -> {path, mime, dataUrl}
  const takenPaths = new Set();

  const image = (id, alt = '') => {
    const a = id && project.assets[id];
    if (!a) return null;
    if (!used.has(id)) {
      const ext = MIME_EXT[a.mime] || (a.dataUrl.match(/^data:image\/(\w+)/)?.[1] === 'jpeg' ? 'jpg' : a.dataUrl.match(/^data:image\/(\w+)/)?.[1]) || 'jpg';
      const stem = slugify(String(a.name).replace(/\.[a-z0-9]+$/i, ''), 'imagen');
      let path = `assets/${stem}.${ext}`;
      let n = 2;
      while (takenPaths.has(path)) path = `assets/${stem}-${n++}.${ext}`;
      takenPaths.add(path);
      used.set(id, { path, mime: a.mime, dataUrl: a.dataUrl });
    }
    return { path: used.get(id).path, alt, width: a.width || 0, height: a.height || 0 };
  };

  const name = b.name.trim() || project.name;
  const category = CATEGORIES.find((c) => c.id === b.category)?.label || 'Negocio local';
  const cc = b.countryCode || '34';

  const phoneRaw = b.phone.trim();
  const waRaw = (b.whatsapp || '').trim();
  const links = {
    tel: phoneRaw ? buildTelLink(phoneRaw, cc) : '',
    whatsapp: waRaw ? buildWhatsAppLink(waRaw, b.whatsappMessage, cc) : '',
    email: isValidEmail(b.email) ? buildMailto(b.email.trim(), `Consulta desde la web de ${name}`) : '',
    map: buildMapLink(b.address, b.city, b.mapUrl),
    booking: normalizeUrl(b.bookingUrl),
  };
  const social = ['instagram', 'facebook', 'tiktok']
    .map((n) => ({ network: n, label: SOCIAL_LABELS[n], url: buildSocialLink(n, b[n]) }))
    .filter((s) => s.url);

  const pal = buildPalette(project.identity);
  const font = getFontPair(project.identity.fontPair);

  const sections = project.sections.filter((s) => s.enabled).map((s) => ({ ...s, content: { ...s.content } }));
  const byType = Object.fromEntries(sections.map((s) => [s.type, s]));

  // Imágenes de las secciones
  const hero = byType.hero;
  const heroImg = hero ? image(hero.content.imageId, '') : null;
  const aboutImg = byType.about ? image(byType.about.content.imageId, `${name}`) : null;
  const galleryImgs = byType.gallery
    ? byType.gallery.content.imageIds.map((id, i) => image(id, `${name} — imagen ${i + 1}`)).filter(Boolean)
    : [];
  const logo = image(project.identity.logoId, `Logotipo de ${name}`);

  // Servicios
  const services = project.services
    .filter((s) => s.name.trim())
    .map((s) => ({ name: s.name.trim(), description: s.description.trim(), price: s.price.trim(), category: s.category.trim(), image: image(s.imageId, s.name.trim()) }));
  const groups = [];
  for (const s of services) {
    let g = groups.find((x) => x.name === s.category);
    if (!g) { g = { name: s.category, items: [] }; groups.push(g); }
    g.items.push(s);
  }
  groups.sort((a, b2) => (a.name === '' ? -1 : 0) - (b2.name === '' ? -1 : 0)); // sin categoría primero

  // Horario
  const hoursSection = byType.hours;
  const hours = hoursSection ? groupHours(hoursSection.content.rows) : [];
  const rawHours = hoursSection ? hoursSection.content.rows : [];

  // CTA principal
  const ctaType = hero?.content.ctaType || 'whatsapp';
  const ctaOrder = { whatsapp: ['whatsapp', 'tel', 'booking', 'email'], phone: ['tel', 'whatsapp', 'booking', 'email'], booking: ['booking', 'whatsapp', 'tel', 'email'], contact: [] }[ctaType] || [];
  let ctaHref = '#contacto';
  let ctaExternal = false;
  for (const k of ctaOrder) {
    if (links[k]) { ctaHref = links[k]; ctaExternal = k === 'whatsapp' || k === 'booking'; break; }
  }
  if (ctaHref === '#contacto' && !byType.contact) ctaHref = links.whatsapp || links.tel || links.booking || links.email || '#';

  const nav = sections
    .filter((s) => NAV_LABELS[s.type])
    .map((s) => ({ id: NAV_LABELS[s.type][0], label: NAV_LABELS[s.type][1], type: s.type }));

  const heroTitle = hero?.content.title || name;
  const description = (project.seo.description || b.description || hero?.content.subtitle || `${name}, ${category.toLowerCase()}${b.city ? ` en ${b.city}` : ''}.`).trim().slice(0, 300);
  const title = (project.seo.title || `${name} — ${category}${b.city ? ` en ${b.city}` : ''}`).trim().slice(0, 120);

  const contactSection = byType.contact;
  const formMode = !contactSection?.content.showForm ? 'none' : links.email ? 'email' : links.whatsapp ? 'whatsapp' : 'none';

  return {
    project,
    lang: 'es',
    name,
    category,
    city: b.city.trim(),
    address: b.address.trim(),
    phone: phoneRaw,
    whatsappRaw: waRaw,
    email: isValidEmail(b.email) ? b.email.trim() : '',
    description,
    title,
    links,
    social,
    cta: { href: ctaHref, external: ctaExternal, label: hero?.content.ctaLabel?.trim() || 'Contactar' },
    nav,
    sections,
    byType,
    has: (t) => !!byType[t],
    heroTitle,
    heroSubtitle: hero?.content.subtitle || '',
    heroImg,
    aboutImg,
    galleryImgs,
    logo,
    services,
    serviceGroups: groups,
    hours,
    rawHours,
    formMode,
    palette: pal,
    fonts: font,
    style: project.identity.style,
    templateId: project.identity.templateId,
    usedAssets: used,
  };
}
