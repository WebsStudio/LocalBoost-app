// Datos y copias de seguridad.

import { h, mount } from './dom.js';
import { icon } from './icons.js';
import { toast, confirmDialog } from './feedback.js';
import { downloadJson, fileStamp } from './download.js';
import { formatBytes } from '../core/utils.js';

const MAX_BACKUP_BYTES = 40 * 1024 * 1024;

export async function renderData({ repo, navigate }) {
  const el = h('div', null);

  async function draw() {
    const usage = repo.usage();
    const pct = Math.min(100, Math.round((usage.bytes / usage.limit) * 100));
    const count = (await repo.list()).length;
    const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, 'aria-label': 'Seleccionar copia de seguridad' });
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      fileInput.value = '';
      if (!file) return;
      if (file.size > MAX_BACKUP_BYTES) return toast('El archivo es demasiado grande para ser una copia de LocalBoost.', { type: 'error' });
      try {
        const data = JSON.parse(await file.text());
        const res = await repo.importBackup(data);
        toast(`Importados ${res.imported} proyecto(s)${res.skipped ? `, ${res.skipped} omitido(s) por no ser válidos` : ''}.`, { type: 'success', timeout: 6000 });
        await draw();
      } catch (e) {
        toast(e instanceof SyntaxError ? 'El archivo no es un JSON válido.' : e.message, { type: 'error', timeout: 7000 });
      }
    });

    mount(el,
      h('div', { class: 'page-head' },
        h('div', null,
          h('p', { class: 'eyebrow' }, 'Almacenamiento'),
          h('h1', { class: 'page-title' }, 'Datos y copias de seguridad'),
          h('p', { class: 'page-sub' }, 'Cómo se guardan tus proyectos y cómo llevarlos a otro navegador u ordenador.'))),
      h('div', { class: 'stack' },
        h('div', { class: 'notice notice--warn' }, icon('alert', 18),
          h('div', null, h('strong', null, 'Los datos viven solo en este navegador. '),
            'LocalBoost usa el almacenamiento local (localStorage): no hay cuenta ni sincronización en la nube. Si borras los datos del navegador, usas otro dispositivo o cambias de navegador, no verás estos proyectos. La copia de seguridad es la forma de moverlos y protegerlos.')),
        h('section', { class: 'panel panel--pad' },
          h('h2', { class: 'h3' }, 'Espacio utilizado'),
          h('div', { class: 'meter', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct, 'aria-label': 'Espacio usado' }, h('span', { style: { width: `${Math.max(pct, 1)}%` } })),
          h('p', { class: 'muted' }, `${formatBytes(usage.bytes)} de unos ${formatBytes(usage.limit)} aprox. · ${count} proyecto(s)`),
          h('p', { class: 'faint', style: { fontSize: '12.5px', marginTop: '6px' } }, 'El límite real depende del navegador. Las imágenes se comprimen al subirlas para ahorrar espacio.')),
        h('section', { class: 'panel panel--pad stack' },
          h('h2', { class: 'h3' }, 'Copia de seguridad'),
          h('p', { class: 'muted' }, 'Descarga todos tus proyectos (con sus imágenes) en un único archivo JSON, o restaura una copia anterior. Al importar nunca se sobrescriben proyectos existentes: se añaden como nuevos.'),
          h('div', { class: 'cluster' },
            h('button', { class: 'btn btn--primary', type: 'button', disabled: count === 0, onclick: async () => {
              try {
                downloadJson(await repo.exportBackup(), `localboost-copia-${fileStamp()}.json`);
                toast('Copia de seguridad descargada.', { type: 'success' });
              } catch (e) { toast(e.message, { type: 'error' }); }
            } }, icon('download', 16), 'Descargar copia'),
            h('button', { class: 'btn', type: 'button', onclick: () => fileInput.click() }, icon('upload', 16), 'Importar copia'),
            fileInput)),
        h('section', { class: 'panel panel--pad stack' },
          h('h2', { class: 'h3' }, 'Zona de riesgo'),
          h('p', { class: 'muted' }, 'Elimina todos los proyectos de este navegador. No se puede deshacer.'),
          h('div', null, h('button', { class: 'btn btn--danger', type: 'button', disabled: count === 0, onclick: async () => {
            const ok = await confirmDialog({
              title: '¿Eliminar todos los proyectos?',
              message: `Se borrarán ${count} proyecto(s) de este navegador. Descarga antes una copia de seguridad si quieres conservarlos.`,
              confirmLabel: 'Eliminar todo', danger: true });
            if (!ok) return;
            try {
              for (const m of await repo.list()) await repo.remove(m.id);
              toast('Todos los proyectos se han eliminado.', { type: 'success' });
              await draw();
            } catch (e) { toast(e.message, { type: 'error' }); }
          } }, icon('trash', 16), 'Eliminar todos los proyectos')))));
  }

  await draw();
  return { el };
}
