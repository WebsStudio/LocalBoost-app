// Exportación: proyecto → paquete ZIP con la web estática lista para publicar.
// buildExportBundle() es puro (se prueba en Node); exportProject() añade la descarga en el navegador.

import { generateSite, dataUrlToBytes } from '../generator/index.js';
import { createZip } from './zip.js';
import { buildExportReadme } from './readme.js';
import { slugify } from '../core/utils.js';

/** Avisos que conviene mostrar antes de exportar (no bloquean). */
export function getExportWarnings(project) {
  const b = project.business;
  const out = [];
  if (!b.name.trim()) out.push('Falta el nombre del negocio: se usará el nombre del proyecto.');
  if (!b.phone.trim() && !b.whatsapp.trim() && !b.email.trim() && !b.bookingUrl.trim()) {
    out.push('No hay teléfono, WhatsApp, correo ni enlace de reservas: los visitantes no tendrán forma de contactar.');
  }
  if (!project.services.some((s) => s.name.trim()) && project.sections.some((s) => s.type === 'services' && s.enabled)) {
    out.push('La sección de servicios está activa pero no hay ningún servicio con nombre.');
  }
  if (project.isDemo || b.email.trim().toLowerCase().endsWith('@example.com')) {
    out.push('El proyecto contiene datos de demostración (por ejemplo correo @example.com). Sustitúyelos antes de publicar.');
  }
  return out;
}

export function buildExportBundle(project) {
  const site = generateSite(project);
  const model = site.model;
  const files = site.files.map((f) => ({ path: f.path, data: f.data }));
  const assetFiles = site.assets.map((a) => ({ path: a.path, data: dataUrlToBytes(a.dataUrl) }));

  const readme = buildExportReadme({
    name: model.name,
    files: site.files.map((f) => f.path),
    assetPaths: site.assets.map((a) => a.path),
    hasForm: model.formMode !== 'none',
    formMode: model.formMode,
  });

  const all = [...files, ...assetFiles, { path: 'README.md', data: readme }, { path: '.nojekyll', data: '' }];
  const zip = createZip(all);
  return {
    zip,
    filename: `${slugify(model.name, 'sitio')}-web.zip`,
    fileCount: all.length,
    paths: all.map((f) => f.path),
  };
}

export async function exportProject(project) {
  const bundle = buildExportBundle(project);
  const { downloadBlob } = await import('../ui/download.js');
  downloadBlob(new Blob([bundle.zip], { type: 'application/zip' }), bundle.filename);
  return { fileCount: bundle.fileCount, filename: bundle.filename, bytes: bundle.zip.length };
}
