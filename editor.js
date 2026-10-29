// Editor en vivo: panel de edición (izquierda) separado de la vista previa (derecha).

import { h } from './dom.js';
import { icon } from './icons.js';
import { toast, promptDialog, customDialog } from './feedback.js';
import { businessPanel, servicesPanel, identityPanel, sectionsPanel, seoPanel } from './panels.js';
import { createPreview, deviceSwitch, createAutosave } from './preview.js';
import { getExportWarnings } from '../export/exporter.js';

const TABS = [
  { id: 'business', label: 'Negocio', icon: 'user', build: businessPanel },
  { id: 'services', label: 'Servicios', icon: 'list', build: servicesPanel },
  { id: 'design', label: 'Diseño', icon: 'palette', build: identityPanel },
  { id: 'sections', label: 'Secciones', icon: 'layout', build: sectionsPanel },
  { id: 'seo', label: 'SEO', icon: 'search', build: seoPanel },
];

function confirmWithList({ title, intro, items, confirmLabel }) {
  return customDialog({
    title,
    render: ({ close }) => h('div', { class: 'stack' },
      h('p', { class: 'modal__text' }, intro),
      h('ul', { style: { margin: 0, paddingLeft: '18px', color: 'var(--muted)', display: 'grid', gap: '6px' } }, items.map((i) => h('li', null, i))),
      h('div', { class: 'modal__actions' },
        h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => close(false) }, 'Volver y corregir'),
        h('button', { class: 'btn btn--primary', type: 'button', 'data-autofocus': '', onclick: () => close(true) }, confirmLabel))),
  }).then((v) => v === true);
}

export async function renderEditor({ repo, navigate }, project) {
  const autosave = createAutosave({ repo, project, delay: 500 });
  const preview = createPreview({ getProject: () => project });
  const change = () => { autosave.touch(); preview.update(); };

  let activeTab = 'business';
  let device = 'desktop';

  const titleEl = h('span', { class: 'editor__title', title: project.name }, project.name);
  const body = h('div', { class: 'editor__body', role: 'tabpanel', tabindex: '0' });
  const tabsEl = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Secciones del editor' });
  const root = h('div', { class: 'editor', 'data-view': 'edit' });

  function drawTabs() {
    const buttons = TABS.map((t) => h('button', {
      type: 'button', role: 'tab', id: `tab-${t.id}`, 'aria-selected': String(t.id === activeTab), 'aria-controls': 'editor-panel',
      tabindex: t.id === activeTab ? '0' : '-1', onclick: () => select(t.id),
    }, icon(t.icon, 15), t.label));
    tabsEl.replaceChildren(...buttons);
    tabsEl.onkeydown = (e) => {
      const i = TABS.findIndex((t) => t.id === activeTab);
      let n = -1;
      if (e.key === 'ArrowRight') n = (i + 1) % TABS.length;
      else if (e.key === 'ArrowLeft') n = (i - 1 + TABS.length) % TABS.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = TABS.length - 1;
      if (n >= 0) { e.preventDefault(); select(TABS[n].id); tabsEl.querySelector(`#tab-${TABS[n].id}`)?.focus(); }
    };
  }

  function select(id) {
    activeTab = id;
    drawTabs();
    const tab = TABS.find((t) => t.id === id);
    body.id = 'editor-panel';
    body.setAttribute('aria-labelledby', `tab-${id}`);
    body.replaceChildren(tab.build({ project, change }).el);
    body.scrollTop = 0;
  }

  async function doSave() {
    const ok = await autosave.flush();
    if (ok) toast('Cambios guardados en este navegador.', { type: 'success', timeout: 2500 });
  }

  async function doExport(btn) {
    const warnings = getExportWarnings(project);
    if (warnings.length) {
      const go = await confirmWithList({
        title: 'Revisa antes de exportar',
        intro: 'Hemos detectado cosas que quizá quieras corregir. Puedes exportar igualmente.',
        items: warnings, confirmLabel: 'Exportar igualmente',
      });
      if (!go) return;
    }
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    try {
      const { exportProject } = await import('../export/exporter.js');
      const res = await exportProject(project);
      project.status = 'exported';
      project.lastExportedAt = new Date().toISOString();
      autosave.touch();
      await autosave.flush();
      toast(`ZIP descargado (${res.fileCount} archivos). Sigue el README incluido para publicarlo en GitHub Pages.`, { type: 'success', timeout: 7000 });
    } catch (e) {
      console.error(e);
      toast(`No se pudo exportar: ${e.message}`, { type: 'error', timeout: 8000 });
    } finally {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
    }
  }

  const exportBtn = h('button', { class: 'btn btn--primary', type: 'button', onclick: (e) => doExport(e.currentTarget) }, icon('zip', 16), 'Exportar ZIP');

  const panel = h('div', { class: 'editor__panel' },
    h('div', { class: 'editor__top' },
      h('a', { class: 'icon-btn', href: '#/', 'aria-label': 'Volver a proyectos', title: 'Proyectos' }, icon('arrow-left', 18)),
      titleEl,
      h('a', { class: 'btn btn--ghost btn--sm', href: `#/p/${project.id}/wizard`, title: 'Volver al asistente paso a paso' }, 'Asistente'),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Renombrar proyecto', title: 'Renombrar', onclick: async () => {
        const v = await promptDialog({ title: 'Renombrar proyecto', label: 'Nombre del proyecto', value: project.name });
        if (v) { project.name = v; titleEl.textContent = v; titleEl.title = v; autosave.touch(); }
      } }, icon('pencil', 16)),
      h('button', { class: 'btn btn--sm mobile-switch', type: 'button', onclick: () => { root.dataset.view = 'preview'; preview.render(); } }, icon('eye', 15), 'Vista previa')),
    tabsEl, body,
    h('div', { class: 'editor__foot' },
      autosave.label,
      h('div', { class: 'cluster', style: { gap: '8px' } },
        h('button', { class: 'btn btn--sm', type: 'button', onclick: doSave }, icon('save', 15), 'Guardar'),
        exportBtn)));

  const stage = h('div', { class: 'editor__stage' },
    h('div', { class: 'editor__stagebar' },
      h('button', { class: 'btn btn--sm mobile-switch', type: 'button', onclick: () => { root.dataset.view = 'edit'; } }, icon('edit', 15), 'Editar'),
      deviceSwitch({ value: device, onChange: (d) => { device = d; preview.setDevice(d); } }),
      h('span', { class: 'faint', style: { fontSize: '12.5px' } }, 'Vista previa en vivo')),
    h('div', { class: 'editor__canvas' }, preview.el));

  root.append(panel, stage);
  select('business');
  preview.render();

  // Atajo Ctrl/Cmd + S
  const onKey = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); doSave(); }
  };
  window.addEventListener('keydown', onKey);

  return {
    el: root,
    fullscreen: true,
    cleanup() { window.removeEventListener('keydown', onKey); preview.destroy(); autosave.destroy(); },
  };
}
