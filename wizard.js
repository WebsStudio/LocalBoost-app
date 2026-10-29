// Asistente de creación en 5 pasos. El progreso se guarda automáticamente y se puede volver atrás.

import { h } from './dom.js';
import { icon } from './icons.js';
import { toast } from './feedback.js';
import { businessPanel, servicesPanel, identityPanel, sectionsPanel } from './panels.js';
import { createPreview, deviceSwitch, createAutosave } from './preview.js';
import { getExportWarnings } from '../export/exporter.js';

const STEPS = [
  { id: 1, label: 'Negocio', title: 'Información del negocio', sub: 'Datos que aparecerán en la web. Solo el nombre es obligatorio.' },
  { id: 2, label: 'Servicios', title: 'Servicios o productos', sub: 'Lo que ofrece el negocio. Puedes ordenarlos y agruparlos por categoría.' },
  { id: 3, label: 'Identidad', title: 'Identidad visual', sub: 'Elige una plantilla y personaliza colores, tipografía y logotipo.' },
  { id: 4, label: 'Secciones', title: 'Secciones de la web', sub: 'Decide qué partes tendrá la página, en qué orden y con qué contenido.' },
  { id: 5, label: 'Vista previa', title: 'Vista previa', sub: 'Así se verá la web. Puedes volver a cualquier paso para cambiar lo que quieras.' },
];

export async function renderWizard({ repo, navigate }, project) {
  let step = Math.min(5, Math.max(1, project.wizardStep || 1));
  let preview = null;
  const autosave = createAutosave({ repo, project });
  const change = () => { autosave.touch(); preview?.update(); };

  const stepper = h('ol', { class: 'stepper', 'aria-label': 'Pasos del asistente' });
  const content = h('section', { class: 'panel step-card', 'aria-live': 'polite' });
  const nav = h('div', { class: 'wizard__nav' });
  let panel = null;

  function drawStepper() {
    stepper.replaceChildren(...STEPS.map((s) => {
      const state = s.id === step ? 'current' : s.id < step ? 'done' : 'todo';
      const btn = h('button', { type: 'button', 'aria-current': s.id === step ? 'step' : null, onclick: () => go(s.id) },
        h('span', { class: 'num' }, state === 'done' ? icon('check', 13) : String(s.id)), h('span', null, s.label));
      return h('li', { 'data-state': state }, btn);
    }));
  }

  function validateCurrent() {
    if (step === 1 && panel && !panel.validate()) {
      toast('Revisa los campos marcados antes de continuar.', { type: 'error' });
      const bad = content.querySelector('[aria-invalid="true"]') || content.querySelector('input[aria-required="true"]');
      bad?.focus();
      if (!project.business.name.trim()) content.querySelector('input[aria-required="true"]')?.focus();
      return false;
    }
    return true;
  }

  function go(target) {
    if (target === step) return;
    if (target > step && !validateCurrent()) return;
    step = target;
    project.wizardStep = step;
    autosave.touch();
    draw();
    window.scrollTo({ top: 0 });
  }

  function drawPreview() {
    preview?.destroy();
    let device = 'desktop';
    preview = createPreview({ getProject: () => project });
    const stage = h('div', { class: 'preview-stage' }, preview.el);
    const warnings = getExportWarnings(project);
    content.append(
      h('div', { class: 'preview-wrap' },
        h('div', { class: 'preview-bar' },
          deviceSwitch({ value: device, onChange: (d) => { device = d; preview.setDevice(d); } }),
          h('a', { class: 'btn btn--sm', href: `#/p/${project.id}/edit` }, icon('layout', 15), 'Abrir en el editor')),
        warnings.length
          ? h('div', { class: 'notice notice--warn', role: 'status' }, icon('alert', 18),
            h('div', null, h('strong', null, 'Antes de publicar:'), h('ul', { style: { margin: '4px 0 0', paddingLeft: '18px' } }, warnings.map((w) => h('li', null, w)))))
          : null,
        stage));
    preview.render();
  }

  function draw() {
    drawStepper();
    const meta = STEPS[step - 1];
    preview?.destroy();
    preview = null;
    content.replaceChildren(h('h2', null, meta.title), h('p', { class: 'muted' }, meta.sub));
    panel = null;
    const ctx = { project, change };
    if (step === 1) panel = businessPanel(ctx);
    else if (step === 2) panel = servicesPanel(ctx);
    else if (step === 3) panel = identityPanel(ctx);
    else if (step === 4) panel = sectionsPanel(ctx);
    if (panel) content.append(panel.el);
    else drawPreview();
    drawNav();
  }

  function drawNav() {
    const back = h('button', { class: 'btn', type: 'button', disabled: step === 1, onclick: () => go(step - 1) }, icon('arrow-left', 16), 'Atrás');
    let next;
    if (step < 5) {
      next = h('button', { class: 'btn btn--primary', type: 'button', onclick: () => go(step + 1) }, 'Continuar', icon('arrow-right', 16));
    } else {
      next = h('button', { class: 'btn btn--primary', type: 'button', onclick: async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        project.status = project.status === 'exported' ? 'exported' : 'ready';
        autosave.touch();
        const ok = await autosave.flush();
        if (ok) { toast('Proyecto guardado y marcado como listo.', { type: 'success' }); navigate(`/p/${project.id}/edit`); }
        else btn.disabled = false;
      } }, icon('check', 16), 'Terminar y abrir el editor');
    }
    nav.replaceChildren(back, autosave.label, next);
  }

  const title = h('div', { class: 'page-head' },
    h('div', null,
      h('a', { class: 'btn btn--ghost btn--sm', href: '#/', style: { marginLeft: '-12px', marginBottom: '6px' } }, icon('arrow-left', 15), 'Proyectos'),
      h('p', { class: 'eyebrow' }, 'Asistente'),
      h('h1', { class: 'page-title' }, project.name)),
    h('p', { class: 'muted', style: { maxWidth: '36ch', fontSize: '13px' } }, 'Se guarda solo en este navegador mientras escribes.'));

  const el = h('div', { class: 'wizard' }, title, stepper, content, nav);
  draw();

  return {
    el,
    cleanup() { preview?.destroy(); autosave.destroy(); },
  };
}
