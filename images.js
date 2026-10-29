// Subida, validación y compresión de imágenes (en el navegador) + selectores de imagen reutilizables.
// Las imágenes se guardan como data URLs dentro del proyecto (localStorage). Las URL temporales
// creadas para leer el archivo se revocan siempre.

import { h } from './dom.js';
import { icon } from './icons.js';
import { toast } from './feedback.js';
import { uid, formatBytes } from '../core/utils.js';
import { LIMITS } from '../core/models.js';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ACCEPT_ATTR = ACCEPTED.join(',');

export class ImageError extends Error {}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const done = () => URL.revokeObjectURL(url);
    img.onload = () => { done(); resolve(img); };
    img.onerror = () => { done(); reject(new ImageError('No se pudo leer la imagen. Prueba con otro archivo.')); };
    img.src = url;
  });
}

/**
 * Valida y comprime una imagen. Devuelve un objeto de asset listo para guardar.
 * @param {File} file
 * @param {{maxDim?:number}} [opts]
 */
export async function processImageFile(file, { maxDim = LIMITS.maxImageDimension } = {}) {
  if (!ACCEPTED.includes(file.type)) throw new ImageError('Formato no admitido. Usa JPG, PNG, WebP o GIF.');
  if (file.size > LIMITS.maxImageSourceBytes) {
    throw new ImageError(`La imagen pesa ${formatBytes(file.size)}. El máximo es ${formatBytes(LIMITS.maxImageSourceBytes)}.`);
  }
  const img = await loadImage(file);
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  if (!w0 || !h0) throw new ImageError('La imagen está vacía o dañada.');
  const scale = Math.min(1, maxDim / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const hh = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = hh;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('Tu navegador no permite procesar imágenes.');
  const keepsAlpha = file.type !== 'image/jpeg';
  if (!keepsAlpha) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, hh); }
  ctx.drawImage(img, 0, 0, w, hh);

  let mime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
  let dataUrl = canvas.toDataURL(mime, 0.82);
  if (!dataUrl.startsWith(`data:${mime}`)) { // navegador sin soporte WebP
    mime = keepsAlpha ? 'image/png' : 'image/jpeg';
    dataUrl = canvas.toDataURL(mime, 0.82);
  }
  const base = file.name.replace(/\.[^.]+$/, '') || 'imagen';
  return { name: base.slice(0, 80), mime, size: Math.round((dataUrl.length * 3) / 4), dataUrl, width: w, height: hh };
}

/** Añade una imagen al proyecto y devuelve su id. Respeta el máximo de imágenes. */
export function addAsset(project, asset) {
  if (Object.keys(project.assets).length >= LIMITS.maxProjectImages) {
    throw new ImageError(`Has alcanzado el máximo de ${LIMITS.maxProjectImages} imágenes por proyecto. Elimina alguna para añadir más.`);
  }
  const id = uid('img');
  project.assets[id] = asset;
  return id;
}

/** Elimina las imágenes que ya no usa ninguna parte del proyecto (libera espacio). */
export function pruneAssets(project) {
  const used = new Set();
  if (project.identity.logoId) used.add(project.identity.logoId);
  for (const s of project.services) if (s.imageId) used.add(s.imageId);
  for (const sec of project.sections) {
    if (sec.content.imageId) used.add(sec.content.imageId);
    if (Array.isArray(sec.content.imageIds)) sec.content.imageIds.forEach((i) => used.add(i));
  }
  for (const id of Object.keys(project.assets)) if (!used.has(id)) delete project.assets[id];
}

async function pickFiles(multiple) {
  return new Promise((resolve) => {
    const input = h('input', { type: 'file', accept: ACCEPT_ATTR, multiple: !!multiple, style: { display: 'none' } });
    let settled = false;
    input.addEventListener('change', () => { settled = true; const files = [...(input.files || [])]; input.remove(); resolve(files); });
    input.addEventListener('cancel', () => { if (!settled) { input.remove(); resolve([]); } });
    document.body.append(input);
    input.click();
  });
}

/**
 * Selector de una imagen.
 * @param {{project:object, getId:()=>string, setId:(id:string)=>void, label:string, onChange:()=>void, maxDim?:number, hint?:string}} o
 */
export function imagePicker({ project, getId, setId, label, onChange, maxDim, hint }) {
  const host = h('div', { class: 'field' });

  function draw() {
    const id = getId();
    const asset = id && project.assets[id];
    host.replaceChildren(
      h('span', { class: 'field__label' }, label, h('span', { class: 'opt' }, 'Opcional')),
      h('div', { class: 'upload-row' },
        asset
          ? h('div', { class: 'thumb' },
            h('img', { src: asset.dataUrl, alt: `Vista previa de ${label.toLowerCase()}` }),
            h('button', { type: 'button', 'aria-label': `Quitar ${label.toLowerCase()}`, onclick: () => { setId(''); draw(); onChange(); } }, icon('x', 12)))
          : null,
        h('button', { class: 'btn btn--sm', type: 'button', onclick: async (e) => {
          const btn = e.currentTarget;
          const [file] = await pickFiles(false);
          if (!file) return;
          btn.disabled = true;
          try {
            const processed = await processImageFile(file, { maxDim });
            const newId = addAsset(project, processed);
            setId(newId);
            draw();
            onChange();
          } catch (err) {
            toast(err.message || 'No se pudo subir la imagen.', { type: 'error', timeout: 6000 });
            btn.disabled = false;
          }
        } }, icon('upload', 15), asset ? 'Cambiar imagen' : 'Subir imagen')),
      hint ? h('span', { class: 'field__hint' }, hint) : null);
  }
  draw();
  return host;
}

/** Selector de varias imágenes (galería). */
export function galleryPicker({ project, content, onChange }) {
  const host = h('div', { class: 'field' });
  function draw() {
    const ids = content.imageIds;
    host.replaceChildren(
      h('span', { class: 'field__label' }, `Imágenes de la galería (${ids.length}/${LIMITS.maxGallery})`),
      ids.length
        ? h('div', { class: 'gallery-grid' }, ids.map((id, i) => {
          const a = project.assets[id];
          return h('div', { class: 'thumb' },
            a ? h('img', { src: a.dataUrl, alt: `Imagen ${i + 1} de la galería` }) : null,
            h('button', { type: 'button', 'aria-label': `Quitar imagen ${i + 1} de la galería`, onclick: () => { content.imageIds.splice(i, 1); draw(); onChange(); } }, icon('x', 12)));
        }))
        : h('p', { class: 'field__hint' }, 'Aún no hay imágenes. La sección no se mostrará hasta que añadas alguna.'),
      h('div', null, h('button', { class: 'btn btn--sm', type: 'button', disabled: ids.length >= LIMITS.maxGallery, onclick: async (e) => {
        const btn = e.currentTarget;
        const files = await pickFiles(true);
        if (!files.length) return;
        btn.disabled = true;
        let added = 0;
        for (const f of files) {
          if (content.imageIds.length >= LIMITS.maxGallery) { toast(`La galería admite hasta ${LIMITS.maxGallery} imágenes.`, { type: 'info' }); break; }
          try {
            content.imageIds.push(addAsset(project, await processImageFile(f)));
            added++;
          } catch (err) {
            toast(`${f.name}: ${err.message}`, { type: 'error', timeout: 6000 });
          }
        }
        draw();
        if (added) onChange();
      } }, icon('plus', 15), 'Añadir imágenes')));
  }
  draw();
  return host;
}
