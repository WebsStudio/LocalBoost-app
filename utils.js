// Utilidades puras (sin DOM) para poder probarlas con Node.

export function uid(prefix = 'id') {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${rnd}`;
}

export function deepClone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto para insertarlo como contenido HTML o dentro de un atributo. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/** Convierte saltos de línea en <br> tras escapar. */
export function escMultiline(value) {
  return esc(value).replace(/\r?\n/g, '<br>');
}

export function slugify(text, fallback = 'sitio') {
  const s = String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return s || fallback;
}

export function debounce(fn, wait = 250) {
  let t;
  const wrapped = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
  wrapped.flush = (...args) => {
    clearTimeout(t);
    fn(...args);
  };
  wrapped.cancel = () => clearTimeout(t);
  return wrapped;
}

export function formatDate(iso, locale = 'es-ES') {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatRelative(iso, now = Date.now()) {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const diff = Math.max(0, now - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Hace un momento';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Hace ${d} ${d === 1 ? 'día' : 'días'}`;
  return formatDate(iso);
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ---------- Validación ----------

export function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v ?? '').trim());
}

/** Acepta solo http(s). Devuelve la URL normalizada o '' si no es válida. */
export function normalizeUrl(v) {
  const raw = String(v ?? '').trim();
  if (!raw) return '';
  const withProto = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    if (!u.hostname.includes('.')) return '';
    return u.href;
  } catch {
    return '';
  }
}

export function isValidPhone(v) {
  const digits = String(v ?? '').replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function isHexColor(v) {
  return /^#[0-9a-f]{6}$/i.test(String(v ?? ''));
}

// ---------- Enlaces de contacto ----------

/**
 * Normaliza un teléfono a dígitos internacionales.
 * - Si empieza por "+" o "00" se respeta el prefijo escrito.
 * - Si no, se antepone `countryCode` (por defecto 34, España).
 */
export function toInternationalDigits(phone, countryCode = '34') {
  const raw = String(phone ?? '').trim();
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (raw.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  const cc = String(countryCode).replace(/\D/g, '');
  if (cc && digits.startsWith(cc) && digits.length >= cc.length + 8) return digits;
  return cc + digits.replace(/^0+/, '');
}

export function buildTelLink(phone, countryCode = '34') {
  const d = toInternationalDigits(phone, countryCode);
  return d ? `tel:+${d}` : '';
}

export function buildWhatsAppLink(phone, message = '', countryCode = '34') {
  const d = toInternationalDigits(phone, countryCode);
  if (!d) return '';
  const text = String(message ?? '').trim();
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function buildMailto(email, subject = '', body = '') {
  const e = String(email ?? '').trim();
  if (!isValidEmail(e)) return '';
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${e}${params.length ? `?${params.join('&')}` : ''}`;
}

/** Enlace de mapa: usa mapUrl si es válida; si no, una búsqueda de Google Maps. */
export function buildMapLink(address, city, mapUrl = '') {
  const custom = normalizeUrl(mapUrl);
  if (custom) return custom;
  const q = [address, city].map((s) => String(s ?? '').trim()).filter(Boolean).join(', ');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
}

/** Enlace de red social: acepta URL completa o @usuario. */
export function buildSocialLink(network, value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || /^(www\.)?[a-z0-9-]+\.[a-z]{2,}\//i.test(raw)) return normalizeUrl(raw);
  // Solo un nombre de usuario bien formado (con o sin @); cualquier otra cosa se descarta.
  if (!/^@?[\w.]{1,40}$/.test(raw)) return '';
  const user = raw.replace(/^@/, '');
  const bases = {
    instagram: 'https://www.instagram.com/',
    facebook: 'https://www.facebook.com/',
    tiktok: 'https://www.tiktok.com/@',
  };
  return bases[network] ? bases[network] + user : '';
}

export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

/** Color de texto legible (negro/blanco) sobre un fondo. */
export function readableOn(hex) {
  const { r, g, b } = hexToRgb(hex);
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return L > 0.4 ? '#111111' : '#ffffff';
}
