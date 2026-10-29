// Utilidades de color para generar paletas legibles a partir de dos colores y un tema.

import { hexToRgb } from '../core/utils.js';

const clamp01 = (n) => Math.min(1, Math.max(0, n));

export function rgbToHex(r, g, b) {
  const to = (v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s, l };
}

export function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = clamp01(s);
  l = clamp01(l);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Mueve la luminosidad de `fg` hasta alcanzar el contraste mínimo sobre `bg`. */
export function ensureContrast(fg, bg, min = 4.5) {
  if (contrast(fg, bg) >= min) return fg;
  const { h, s, l } = hexToHsl(fg);
  const towardLight = luminance(bg) < 0.4;
  let cur = l;
  for (let i = 0; i < 40; i++) {
    cur = clamp01(cur + (towardLight ? 0.02 : -0.02));
    const candidate = hslToHex(h, s, cur);
    if (contrast(candidate, bg) >= min) return candidate;
  }
  return towardLight ? '#ffffff' : '#000000';
}

export function onColor(bg) {
  return contrast('#ffffff', bg) >= contrast('#111111', bg) ? '#ffffff' : '#111111';
}

export function withAlpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Paleta completa de la web a partir de primary, secondary y modo.
 * Garantiza contraste de texto ≥ 4.5 y de acento sobre fondo ≥ 4.5.
 */
export function buildPalette({ primary, secondary, themeMode }) {
  const dark = themeMode === 'dark';
  const { h, s } = hexToHsl(secondary);
  const sat = Math.min(s, 0.35);
  const p = dark
    ? {
        bg: hslToHex(h, sat * 0.8, 0.065),
        surface: hslToHex(h, sat * 0.7, 0.105),
        surface2: hslToHex(h, sat * 0.6, 0.15),
        text: hslToHex(h, Math.min(sat, 0.2), 0.94),
        muted: hslToHex(h, Math.min(sat, 0.15), 0.72),
        line: 'rgba(255, 255, 255, 0.13)',
        shadow: 'rgba(0, 0, 0, 0.45)',
      }
    : {
        bg: hslToHex(h, Math.min(sat, 0.4), 0.975),
        surface: '#ffffff',
        surface2: hslToHex(h, Math.min(sat, 0.4), 0.94),
        text: hslToHex(h, Math.min(Math.max(s, 0.05), 0.4), 0.12),
        muted: hslToHex(h, Math.min(sat, 0.15), 0.36),
        line: 'rgba(0, 0, 0, 0.12)',
        shadow: 'rgba(30, 20, 10, 0.12)',
      };
  const accent = ensureContrast(primary, p.bg, 4.5); // para texto/enlaces en color
  return {
    ...p,
    dark,
    primary,
    onPrimary: onColor(primary),
    accent,
    primarySoft: withAlpha(primary, dark ? 0.18 : 0.12),
    ink: secondary,
    onInk: onColor(secondary),
  };
}
