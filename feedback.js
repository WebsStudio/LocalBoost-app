// Notificaciones (toasts) y diálogos modales accesibles basados en <dialog>.

import { h, append, nextId } from './dom.js';
import { icon } from './icons.js';

export function toast(message, { type = 'info', timeout = 4200 } = {}) {
  const host = document.getElementById('toasts');
  if (!host) return;
  const names = { success: 'check', error: 'alert', info: 'info' };
  const closeBtn = h('button', { class: 'toast__close', type: 'button', 'aria-label': 'Cerrar notificación' }, icon('x', 14));
  const el = h('div', { class: `toast toast--${type}` }, icon(names[type] || 'info', 18), h('p', { class: 'toast__text' }, message), closeBtn);
  const remove = () => {
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 180);
  };
  closeBtn.addEventListener('click', remove);
  host.append(el);
  if (timeout) setTimeout(remove, timeout);
  return remove;
}

function openDialog(build) {
  return new Promise((resolve) => {
    const dialog = h('dialog', { class: 'modal' });
    const titleId = nextId('dlg');
    dialog.setAttribute('aria-labelledby', titleId);
    let result = null;
    const finish = (value) => {
      result = value;
      dialog.close();
    };
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(result);
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) finish(null); // clic en el fondo
    });
    append(dialog, [build({ finish, titleId, dialog })]);
    document.body.append(dialog);
    dialog.showModal();
    dialog.querySelector('[data-autofocus]')?.focus();
  });
}

/** @returns {Promise<boolean>} */
export async function confirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false, cancelLabel = 'Cancelar' }) {
  const r = await openDialog(({ finish, titleId }) =>
    h('form', { class: 'modal__body', method: 'dialog', onsubmit: (e) => { e.preventDefault(); finish(true); } },
      h('h2', { id: titleId, class: 'modal__title' }, title),
      h('p', { class: 'modal__text' }, message),
      h('div', { class: 'modal__actions' },
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => finish(false) }, cancelLabel),
        h('button', { type: 'submit', class: `btn ${danger ? 'btn--danger' : 'btn--primary'}`, 'data-autofocus': '' }, confirmLabel))));
  return r === true;
}

/** Diálogo con un campo de texto. Devuelve el texto o null si se cancela. */
export async function promptDialog({ title, label, value = '', confirmLabel = 'Guardar', placeholder = '', maxLength = 120 }) {
  return openDialog(({ finish, titleId }) => {
    const id = nextId('in');
    const input = h('input', { id, class: 'input', type: 'text', value, placeholder, maxlength: maxLength, required: true, 'data-autofocus': '' });
    return h('form', { class: 'modal__body', onsubmit: (e) => { e.preventDefault(); const v = input.value.trim(); if (v) finish(v); } },
      h('h2', { id: titleId, class: 'modal__title' }, title),
      h('label', { class: 'field' }, h('span', { class: 'field__label' }, label), input),
      h('div', { class: 'modal__actions' },
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => finish(null) }, 'Cancelar'),
        h('button', { type: 'submit', class: 'btn btn--primary' }, confirmLabel)));
  });
}

/** Diálogo con contenido propio. `render({close})` devuelve el contenido. */
export function customDialog({ title, render, wide = false }) {
  return openDialog(({ finish, titleId, dialog }) => {
    if (wide) dialog.classList.add('modal--wide');
    return h('div', { class: 'modal__body' },
      h('div', { class: 'modal__head' },
        h('h2', { id: titleId, class: 'modal__title' }, title),
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Cerrar', onclick: () => finish(null) }, icon('x', 18))),
      render({ close: finish }));
  });
}
