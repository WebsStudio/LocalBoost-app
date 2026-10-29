// Generador de webs: proyecto → archivos estáticos (index.html, style.css, script.js) + imágenes usadas.
// Es código puro (sin DOM) para poder ejecutarlo y probarlo en Node.

import { buildSiteModel } from './model.js';
import { documentShell, baseCss, baseJs } from './shared.js';
import * as beauty from './templates/beauty.js';
import * as restaurant from './templates/restaurant.js';
import * as motor from './templates/motor.js';

const REGISTRY = { beauty, restaurant, motor };

export function generateSite(project) {
  const model = buildSiteModel(project);
  const tpl = REGISTRY[model.templateId] || beauty;
  const { body, css, js } = tpl.render(model);
  const html = documentShell(model, body);
  const files = [
    { path: 'index.html', data: html },
    { path: 'style.css', data: baseCss(model) + css },
    { path: 'script.js', data: baseJs() + (js || '') },
  ];
  const assets = [...model.usedAssets.values()].map((a) => ({ path: a.path, mime: a.mime, dataUrl: a.dataUrl }));
  return { files, assets, model };
}

/** Decodifica un data URL de imagen en bytes. Funciona en navegador y en Node. */
export function dataUrlToBytes(dataUrl) {
  const comma = dataUrl.indexOf(',');
  const b64 = dataUrl.slice(comma + 1);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Documento único para la vista previa (iframe srcdoc): CSS y JS en línea e imágenes como data URLs.
 * Solo para previsualizar; la exportación real mantiene archivos separados.
 */
export function buildPreviewDocument(site) {
  const { files, assets } = site;
  const get = (p) => files.find((f) => f.path === p).data;
  let html = get('index.html');
  let css = get('style.css');
  let js = get('script.js');
  for (const a of assets) {
    html = html.split(`"${a.path}"`).join(`"${a.dataUrl}"`);
    css = css.split(a.path).join(a.dataUrl);
  }
  html = html.replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${css}\n</style>`);
  // Evita que "</script>" dentro del JS cierre la etiqueta antes de tiempo.
  html = html.replace('<script src="script.js" defer></script>', () => `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`);
  return html;
}
