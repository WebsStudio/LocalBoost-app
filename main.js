// Arranque de la aplicación y router por hash (#/...). Las rutas por hash funcionan
// en GitHub Pages sin configuración de servidor y con rutas relativas.

import { createRepository } from './core/repository.js';
import { h, mount } from './ui/dom.js';
import { icon } from './ui/icons.js';
import { toast } from './ui/feedback.js';

const repo = createRepository();
const root = document.getElementById('app');

export function navigate(path) {
  if (location.hash === `#${path}`) route();
  else location.hash = path;
}

const ctx = { repo, navigate, toast };
let currentCleanup = null;
let renderToken = 0;

function sidebar(active) {
  const link = (href, ic, label, key) =>
    h('a', { href, 'aria-current': active === key ? 'page' : null }, icon(ic, 18), label);
  return h('aside', { class: 'sidebar' },
    h('a', { class: 'brand', href: '#/', 'aria-label': 'LocalBoost, inicio' },
      h('span', { class: 'brand__mark' }, icon('layout', 16)),
      h('span', { class: 'brand__name' }, 'LocalBoost')),
    h('nav', { class: 'nav', 'aria-label': 'Principal' },
      link('#/', 'folder', 'Proyectos', 'projects'),
      link('#/data', 'database', 'Datos y copias', 'data')),
    h('div', { class: 'sidebar__foot' },
      h('strong', null, 'Guardado en este navegador.'),
      ' Tus proyectos no se sincronizan entre dispositivos. Haz copias de seguridad desde “Datos y copias”.'));
}

function shell(active, content) {
  return [sidebar(active), h('main', { id: 'main', class: 'main', tabindex: '-1' }, h('div', { class: 'container' }, content))];
}

function parse() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const [path] = hash.split('?');
  let m;
  if (path === '/' || path === '') return { name: 'dashboard' };
  if (path === '/data') return { name: 'data' };
  if ((m = path.match(/^\/p\/([\w-]+)\/wizard$/))) return { name: 'wizard', id: m[1] };
  if ((m = path.match(/^\/p\/([\w-]+)\/edit$/))) return { name: 'editor', id: m[1] };
  return { name: 'notfound' };
}

function loading() {
  return h('div', { class: 'loading', role: 'status' }, h('span', { class: 'spinner' }), 'Cargando…');
}

function notFound(message = 'No hemos encontrado esta página.') {
  return h('div', { class: 'empty' },
    icon('alert', 40, 'empty__art'),
    h('h2', null, message),
    h('div', { class: 'empty__actions' }, h('a', { class: 'btn btn--primary', href: '#/' }, 'Volver a proyectos')));
}

async function route() {
  const token = ++renderToken;
  if (currentCleanup) {
    try { currentCleanup(); } catch { /* ignorar */ }
    currentCleanup = null;
  }
  const r = parse();
  root.classList.remove('app-shell--full');
  try {
    if (r.name === 'dashboard') {
      mount(root, ...shell('projects', loading()));
      const { renderDashboard } = await import('./ui/dashboard.js');
      if (token !== renderToken) return;
      const view = await renderDashboard(ctx);
      if (token !== renderToken) return;
      mount(root, ...shell('projects', view.el));
      currentCleanup = view.cleanup || null;
    } else if (r.name === 'data') {
      mount(root, ...shell('data', loading()));
      const { renderData } = await import('./ui/data.js');
      if (token !== renderToken) return;
      const view = await renderData(ctx);
      if (token !== renderToken) return;
      mount(root, ...shell('data', view.el));
      currentCleanup = view.cleanup || null;
    } else if (r.name === 'wizard' || r.name === 'editor') {
      mount(root, ...shell('projects', loading()));
      const project = await repo.get(r.id);
      if (token !== renderToken) return;
      if (!project) {
        mount(root, ...shell('projects', notFound('Ese proyecto no existe en este navegador.')));
        return;
      }
      const mod = r.name === 'wizard' ? await import('./ui/wizard.js') : await import('./ui/editor.js');
      if (token !== renderToken) return;
      const view = r.name === 'wizard' ? await mod.renderWizard(ctx, project) : await mod.renderEditor(ctx, project);
      if (token !== renderToken) return;
      if (view.fullscreen) {
        root.classList.add('app-shell--full');
        mount(root, view.el);
      } else {
        mount(root, ...shell('projects', view.el));
      }
      currentCleanup = view.cleanup || null;
    } else {
      mount(root, ...shell('projects', notFound()));
    }
  } catch (err) {
    console.error(err);
    if (token !== renderToken) return;
    mount(root, ...shell('projects', h('div', { class: 'notice notice--error', role: 'alert' }, icon('alert', 18),
      h('div', null, h('strong', null, 'Algo ha fallado al cargar esta pantalla.'), h('p', null, String(err?.message || err))))));
  }
  document.getElementById('main')?.focus({ preventScroll: true });
  if (r.name !== 'editor') window.scrollTo({ top: 0 });
}

window.addEventListener('hashchange', route);
route();
