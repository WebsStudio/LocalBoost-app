// Vista previa en un iframe aislado (sandbox sin allow-same-origin) + guardado automático.

import { h } from './dom.js';
import { icon } from './icons.js';
import { toast } from './feedback.js';
import { generateSite, buildPreviewDocument } from '../generator/index.js';
import { debounce } from '../core/utils.js';
import { pruneAssets } from './images.js';

const DEVICES = [
  { id: 'desktop', label: 'Ordenador', icon: 'monitor' },
  { id: 'tablet', label: 'Tableta', icon: 'layout' },
  { id: 'mobile', label: 'Móvil', icon: 'phone' },
];

/**
 * @param {{getProject:()=>object, device?:string}} o
 */
export function createPreview({ getProject, device = 'desktop' }) {
  const frame = h('iframe', {
    class: 'preview-frame', title: 'Vista previa de la web', 'data-device': device,
    sandbox: 'allow-scripts allow-popups allow-popups-to-escape-sandbox',
  });
  let scrollY = 0;
  let failedOnce = false;
  const onMessage = (e) => {
    if (e.source === frame.contentWindow && e.data && e.data.lbScroll !== undefined) scrollY = Number(e.data.lbScroll) || 0;
  };
  window.addEventListener('message', onMessage);

  const restore = () => `<script>(function(){var y=${Math.round(scrollY)};
addEventListener('load',function(){if(y){scrollTo(0,y);}});
var t;addEventListener('scroll',function(){clearTimeout(t);t=setTimeout(function(){parent.postMessage({lbScroll:scrollY},'*');},80);},{passive:true});
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(a&&/^(tel:|mailto:)/.test(a.getAttribute('href'))){e.preventDefault();}});
})();<\/script>`;

  function render() {
    try {
      const site = generateSite(getProject());
      let doc = buildPreviewDocument(site);
      doc = doc.replace('</body>', () => `${restore()}\n</body>`);
      frame.srcdoc = doc;
      failedOnce = false;
    } catch (err) {
      console.error(err);
      if (!failedOnce) toast('No se pudo actualizar la vista previa. Revisa los últimos cambios.', { type: 'error' });
      failedOnce = true;
    }
  }
  const update = debounce(render, 220);

  return {
    el: frame,
    render,
    update,
    setDevice(d) { frame.dataset.device = d; },
    destroy() { update.cancel(); window.removeEventListener('message', onMessage); frame.srcdoc = ''; },
  };
}

export function deviceSwitch({ value = 'desktop', onChange, devices = DEVICES }) {
  const wrap = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Tamaño de la vista previa' });
  const btns = devices.map((d) => {
    const b = h('button', { type: 'button', 'aria-pressed': String(d.id === value), title: d.label, 'aria-label': d.label }, icon(d.icon, 16), h('span', { class: 'dev-label' }, d.label));
    b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      onChange(d.id);
    });
    return b;
  });
  wrap.append(...btns);
  return wrap;
}

/**
 * Guardado automático con indicador de estado.
 * @param {{repo:object, project:object}} o
 */
export function createAutosave({ repo, project, delay = 600 }) {
  const label = h('span', { class: 'save-state', 'data-state': 'saved', role: 'status' }, icon('check', 14), 'Todo guardado');
  let dirty = false;
  let saving = Promise.resolve();

  function setState(state, text) {
    label.dataset.state = state;
    label.replaceChildren(icon(state === 'error' ? 'alert' : state === 'saving' ? 'clock' : 'check', 14), text);
  }

  async function doSave() {
    if (!dirty) return true;
    dirty = false;
    setState('saving', 'Guardando…');
    try {
      pruneAssets(project);
      const saved = await repo.save(project);
      project.updatedAt = saved.updatedAt;
      if (!dirty) setState('saved', 'Todo guardado');
      return true;
    } catch (e) {
      dirty = true;
      setState('error', 'Sin guardar');
      toast(e.message || 'No se pudo guardar.', { type: 'error', timeout: 8000 });
      return false;
    }
  }

  const debounced = debounce(() => { saving = saving.then(doSave); }, delay);
  const onUnload = () => { if (dirty) { debounced.cancel(); try { pruneAssets(project); repo.save(project); } catch { /* sin opciones */ } } };
  window.addEventListener('beforeunload', onUnload);

  return {
    label,
    touch() { dirty = true; setState('saving', 'Cambios sin guardar…'); debounced(); },
    /** Guarda ya y espera a que termine. */
    async flush() { debounced.cancel(); saving = saving.then(doSave); return saving; },
    destroy() { debounced.cancel(); window.removeEventListener('beforeunload', onUnload); if (dirty) { try { pruneAssets(project); repo.save(project); } catch { /* ignorar */ } } },
  };
}
