import { h, s, mount } from './dom.js';
import { icon } from './icons.js';
import { toast, confirmDialog, promptDialog, customDialog } from './feedback.js';
import { CATEGORIES, STATUS } from '../core/models.js';
import { createDemoProject } from '../core/demo.js';
import { formatRelative, formatDate, readableOn } from '../core/utils.js';

const CAT_ICON = { beauty: 'scissors', wellness: 'sparkles', restaurant: 'utensils', motor: 'wrench', fitness: 'dumbbell', services: 'briefcase', other: 'star' };
const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || 'Otro negocio';
const TEMPLATE_NAMES = { beauty: 'Atelier', restaurant: 'Mesa', motor: 'Garage' };

export async function renderDashboard({ repo, navigate }) {
  const state = { query: '', category: 'all', status: 'all', sort: 'recent', projects: [], busyId: null };
  const el = h('div', null);
  const listHost = h('div', { 'aria-live': 'polite' });

  async function load() {
    try {
      state.projects = await repo.list();
    } catch (e) {
      state.projects = [];
      toast(e.message || 'No se pudieron leer los proyectos.', { type: 'error', timeout: 7000 });
    }
  }

  async function createFlow(preset) {
    const result = await customDialog({
      title: 'Nuevo proyecto',
      render: ({ close }) => {
        const nameInput = h('input', { class: 'input', type: 'text', maxlength: 120, required: true, placeholder: 'Ej. Peluquería Aurora', 'data-autofocus': '' });
        const select = h('select', { class: 'select' }, CATEGORIES.map((c) => h('option', { value: c.id, selected: c.id === (preset || 'beauty') }, c.label)));
        const err = h('p', { class: 'field__error', role: 'alert', hidden: true });
        return h('form', { class: 'stack', novalidate: true, onsubmit: (e) => {
          e.preventDefault();
          const name = nameInput.value.trim();
          if (!name) {
            err.textContent = 'Escribe un nombre para el proyecto.';
            err.hidden = false;
            nameInput.setAttribute('aria-invalid', 'true');
            nameInput.focus();
            return;
          }
          close({ name, category: select.value });
        } },
          h('label', { class: 'field' }, h('span', { class: 'field__label' }, 'Nombre del proyecto'), nameInput, err),
          h('label', { class: 'field' }, h('span', { class: 'field__label' }, 'Tipo de negocio'), select,
            h('span', { class: 'field__hint' }, 'Elegimos una plantilla acorde; podrás cambiarla después.')),
          h('div', { class: 'modal__actions' },
            h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => close(null) }, 'Cancelar'),
            h('button', { type: 'submit', class: 'btn btn--primary' }, 'Crear y continuar', icon('arrow-right', 16))));
      },
    });
    if (!result) return;
    try {
      const p = await repo.create({ name: result.name, category: result.category });
      p.business.name = result.name;
      await repo.save(p);
      navigate(`/p/${p.id}/wizard`);
    } catch (e) {
      toast(e.message, { type: 'error', timeout: 7000 });
    }
  }

  async function createDemo() {
    try {
      const p = await repo.save(createDemoProject('beauty'));
      toast('Proyecto de demostración creado. Está marcado como demo.', { type: 'success' });
      navigate(`/p/${p.id}/edit`);
    } catch (e) {
      toast(e.message, { type: 'error', timeout: 7000 });
    }
  }

  async function doRename(m) {
    const name = await promptDialog({ title: 'Renombrar proyecto', label: 'Nombre del proyecto', value: m.name });
    if (!name) return;
    try { await repo.rename(m.id, name); toast('Proyecto renombrado.', { type: 'success' }); await refresh(); }
    catch (e) { toast(e.message, { type: 'error' }); }
  }

  async function doDuplicate(m) {
    try { await repo.duplicate(m.id); toast('Proyecto duplicado.', { type: 'success' }); await refresh(); }
    catch (e) { toast(e.message, { type: 'error', timeout: 7000 }); }
  }

  async function doDelete(m) {
    const ok = await confirmDialog({
      title: `¿Eliminar “${m.name}”?`,
      message: 'Se borrará de este navegador junto con sus imágenes. Esta acción no se puede deshacer. Si lo necesitas, exporta antes una copia de seguridad.',
      confirmLabel: 'Eliminar proyecto',
      danger: true,
    });
    if (!ok) return;
    try { await repo.remove(m.id); toast('Proyecto eliminado.', { type: 'success' }); await refresh(); }
    catch (e) { toast(e.message, { type: 'error' }); }
  }

  async function doExport(m, btn) {
    if (state.busyId) return;
    state.busyId = m.id;
    btn.setAttribute('aria-busy', 'true');
    btn.disabled = true;
    try {
      const project = await repo.get(m.id);
      if (!project) throw new Error('El proyecto ya no existe.');
      const { exportProject } = await import('../export/exporter.js');
      const res = await exportProject(project);
      await repo.markExported(m.id);
      toast(`ZIP descargado (${res.fileCount} archivos). Súbelo a GitHub Pages siguiendo el README incluido.`, { type: 'success', timeout: 7000 });
      await refresh();
    } catch (e) {
      console.error(e);
      toast(`No se pudo exportar: ${e.message}`, { type: 'error', timeout: 8000 });
    } finally {
      state.busyId = null;
      btn.removeAttribute('aria-busy');
      btn.disabled = false;
    }
  }

  function filtered() {
    const q = state.query.trim().toLowerCase();
    let items = state.projects.filter((m) => {
      if (state.category !== 'all' && m.category !== state.category) return false;
      if (state.status !== 'all' && m.status !== state.status) return false;
      if (q && !`${m.name} ${m.businessName || ''} ${catLabel(m.category)}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (state.sort === 'name') items = [...items].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return items;
  }

  function projectRow(m) {
    const color = m.primary || '#8b7cf6';
    const exportBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Exportar ${m.name} como ZIP`, title: 'Exportar ZIP' }, icon('download', 17));
    exportBtn.addEventListener('click', () => doExport(m, exportBtn));
    const open = m.status === 'draft' ? `#/p/${m.id}/wizard` : `#/p/${m.id}/edit`;
    return h('div', { class: 'row', role: 'listitem' },
      h('div', { class: 'swatch', style: { background: color, color: readableOn(color) }, 'aria-hidden': 'true' }, icon(CAT_ICON[m.category] || 'star', 20)),
      h('div', { class: 'row__title' },
        h('a', { class: 'row__name', href: open, title: m.status === 'draft' ? 'Continuar con el asistente' : 'Abrir en el editor' }, m.name),
        h('div', { class: 'row__meta' }, catLabel(m.category), m.isDemo ? ' · ' : '', m.isDemo ? h('span', { class: 'pill pill--demo' }, 'Demostración') : null)),
      h('div', { class: 'col-status' }, h('span', { class: `pill pill--${m.status}` }, STATUS[m.status] || 'Borrador')),
      h('div', { class: 'row__cell col-tpl' }, `Plantilla ${TEMPLATE_NAMES[m.templateId] || '—'}`),
      h('div', { class: 'row__cell col-date', title: formatDate(m.updatedAt) }, formatRelative(m.updatedAt)),
      h('div', { class: 'row__actions' },
        h('a', { class: 'icon-btn', href: `#/p/${m.id}/edit`, 'aria-label': `Abrir editor de ${m.name}`, title: 'Abrir editor' }, icon('layout', 17)),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Renombrar ${m.name}`, title: 'Renombrar', onclick: () => doRename(m) }, icon('pencil', 17)),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Duplicar ${m.name}`, title: 'Duplicar', onclick: () => doDuplicate(m) }, icon('copy', 17)),
        exportBtn,
        h('button', { class: 'icon-btn icon-btn--danger', type: 'button', 'aria-label': `Eliminar ${m.name}`, title: 'Eliminar', onclick: () => doDelete(m) }, icon('trash', 17))));
  }

  function emptyState() {
    return h('div', { class: 'empty' },
      s('svg', { class: 'empty__art', viewBox: '0 0 96 96', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' },
        s('rect', { x: 14, y: 20, width: 68, height: 52, rx: 8 }), s('path', { d: 'M14 34h68' }),
        s('circle', { cx: 24, cy: 27, r: 1.5 }), s('circle', { cx: 31, cy: 27, r: 1.5 }),
        s('path', { d: 'M26 50h22M26 58h34' }), s('path', { d: 'M64 46v14M57 53h14', opacity: 0.8 })),
      h('h2', null, 'Aún no tienes proyectos'),
      h('p', null, 'Crea la web de tu primer cliente en unos minutos: rellena los datos del negocio, elige una plantilla y descarga los archivos listos para publicar.'),
      h('div', { class: 'empty__actions' },
        h('button', { class: 'btn btn--primary', type: 'button', onclick: () => createFlow() }, icon('plus', 16), 'Crear primer proyecto'),
        h('button', { class: 'btn', type: 'button', onclick: createDemo }, icon('sparkles', 16), 'Ver un proyecto de demostración')),
      h('p', { class: 'faint', style: { fontSize: '12.5px' } }, 'La demostración usa datos ficticios y se marca como tal.'));
  }

  function noResults() {
    return h('div', { class: 'empty' },
      icon('search', 36, 'empty__art'),
      h('h2', null, 'Ningún proyecto coincide'),
      h('p', null, 'Prueba con otra búsqueda o quita los filtros.'),
      h('button', { class: 'btn', type: 'button', onclick: () => { state.query = ''; state.category = 'all'; state.status = 'all'; renderAll(); } }, 'Quitar filtros'));
  }

  function renderList() {
    const items = filtered();
    if (!state.projects.length) return mount(listHost, emptyState());
    if (!items.length) return mount(listHost, noResults());
    mount(listHost,
      h('div', { class: 'list', role: 'list', 'aria-label': 'Proyectos' },
        h('div', { class: 'row row--head', 'aria-hidden': 'true' },
          h('span'), h('span', null, 'Proyecto'), h('span', { class: 'col-status' }, 'Estado'), h('span', { class: 'col-tpl' }, 'Plantilla'), h('span', { class: 'col-date' }, 'Modificado'), h('span')),
        items.map(projectRow)),
      h('p', { class: 'faint', style: { marginTop: '10px', fontSize: '12.5px' }, 'aria-live': 'polite' }, `${items.length} de ${state.projects.length} proyectos`));
  }

  function chip(label, value, count) {
    return h('button', { class: 'chip', type: 'button', 'aria-pressed': String(state.category === value), onclick: () => { state.category = value; renderAll(); } },
      label, count !== undefined ? h('span', { class: 'count' }, count) : null);
  }

  function renderAll() {
    const counts = {};
    for (const m of state.projects) counts[m.category] = (counts[m.category] || 0) + 1;
    const present = CATEGORIES.filter((c) => counts[c.id]);

    const search = h('input', { class: 'input', type: 'search', placeholder: 'Buscar proyectos…', 'aria-label': 'Buscar proyectos', value: state.query });
    search.addEventListener('input', () => { state.query = search.value; renderList(); });
    const status = h('select', { class: 'select', 'aria-label': 'Filtrar por estado', style: { width: 'auto', minWidth: '150px' }, onchange: (e) => { state.status = e.target.value; renderList(); } },
      h('option', { value: 'all', selected: state.status === 'all' }, 'Todos los estados'),
      Object.entries(STATUS).map(([k, v]) => h('option', { value: k, selected: state.status === k }, v)));
    const sort = h('select', { class: 'select', 'aria-label': 'Ordenar', style: { width: 'auto', minWidth: '140px' }, onchange: (e) => { state.sort = e.target.value; renderList(); } },
      h('option', { value: 'recent', selected: state.sort === 'recent' }, 'Más recientes'),
      h('option', { value: 'name', selected: state.sort === 'name' }, 'Por nombre'));

    const quick = [['beauty', 'scissors', 'Peluquería o belleza'], ['restaurant', 'utensils', 'Restaurante o café'], ['motor', 'wrench', 'Taller de motos'], ['fitness', 'dumbbell', 'Fitness']];

    mount(el,
      h('section', { class: 'welcome', 'aria-labelledby': 'welcome-title' },
        h('div', null,
          h('p', { class: 'eyebrow' }, 'Panel'),
          h('h1', { id: 'welcome-title' }, 'Webs que se venden solas, en minutos.'),
          h('p', null, 'Crea la web de un negocio local, personalízala y descarga los archivos listos para publicar en GitHub Pages u otro hosting estático.'),
          h('button', { class: 'btn btn--primary', type: 'button', onclick: () => createFlow() }, icon('plus', 16), 'Nuevo proyecto')),
        h('div', null,
          h('p', { class: 'faint', style: { fontSize: '12.5px', marginBottom: '8px' } }, 'Empezar con…'),
          h('div', { class: 'quick-grid' }, quick.map(([cat, ic, label]) =>
            h('button', { class: 'quick', type: 'button', onclick: () => createFlow(cat) }, icon(ic, 18), label))))),
      h('div', { class: 'page-head', style: { marginBottom: '16px' } },
        h('div', null, h('h2', { class: 'h3', style: { fontSize: '20px' } }, 'Tus proyectos'),
          h('p', { class: 'page-sub', style: { marginTop: '4px' } }, 'Guardados en este navegador (no se sincronizan en la nube).'))),
      state.projects.length ? h('div', null,
        h('div', { class: 'toolbar' }, h('div', { class: 'search' }, icon('search', 16), search), status, sort),
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Filtrar por categoría', style: { marginBottom: '16px' } },
          chip('Todas', 'all', state.projects.length), present.map((c) => chip(c.label, c.id, counts[c.id])))) : null,
      listHost);
    renderList();
  }

  async function refresh() { await load(); renderAll(); }

  await load();
  renderAll();
  return { el };
}
