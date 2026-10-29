// Componentes de formulario accesibles y reutilizables (asistente y editor).
// Todo el texto del usuario entra en el DOM mediante h() → siempre como texto, nunca como HTML.

import { h, nextId } from './dom.js';
import { icon } from './icons.js';

/**
 * Campo de texto con etiqueta, ayuda y error accesibles.
 * @returns {{el:HTMLElement, input:HTMLElement, validate:()=>boolean}}
 */
export function textField({
  label, value = '', onInput, type = 'text', placeholder = '', optional = false, required = false, hint = '',
  maxlength = 300, multiline = false, rows = 3, validate, autocomplete, inputmode, span2 = false,
}) {
  const id = nextId('fld');
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const props = {
    id, class: multiline ? 'textarea' : 'input', value, placeholder, maxlength, autocomplete, inputmode,
    'aria-describedby': hint ? `${hintId} ${errId}` : errId,
  };
  if (!multiline) props.type = type;
  if (multiline) props.rows = rows;
  if (required) props['aria-required'] = 'true';
  const input = h(multiline ? 'textarea' : 'input', props);
  if (multiline) input.value = value; // textarea: el valor va como propiedad
  const err = h('p', { class: 'field__error', id: errId, role: 'alert', hidden: true });

  const run = () => {
    const msg = validate ? validate(input.value) : (required && !input.value.trim() ? 'Este campo es obligatorio.' : '');
    if (msg) {
      err.replaceChildren(icon('alert', 14), msg);
      err.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      return false;
    }
    err.hidden = true;
    err.replaceChildren();
    input.removeAttribute('aria-invalid');
    return true;
  };
  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true') run();
    onInput?.(input.value);
  });
  input.addEventListener('blur', run);

  const el = h('div', { class: `field${span2 ? ' span-2' : ''}` },
    h('label', { class: 'field__label', for: id },
      h('span', null, label, required ? h('span', { 'aria-hidden': 'true' }, ' *') : null),
      optional ? h('span', { class: 'opt' }, 'Opcional') : null),
    input,
    hint ? h('span', { class: 'field__hint', id: hintId }, hint) : null,
    err);
  return { el, input, validate: run };
}

export function selectField({ label, value, options, onChange, hint = '', span2 = false }) {
  const id = nextId('sel');
  const select = h('select', { id, class: 'select' },
    options.map((o) => h('option', { value: o.value, selected: o.value === value }, o.label)));
  select.addEventListener('change', () => onChange?.(select.value));
  return {
    el: h('div', { class: `field${span2 ? ' span-2' : ''}` },
      h('label', { class: 'field__label', for: id }, label),
      select,
      hint ? h('span', { class: 'field__hint' }, hint) : null),
    select,
  };
}

export function checkField({ label, checked, onChange, hint = '' }) {
  const id = nextId('chk');
  const input = h('input', { id, type: 'checkbox', checked: !!checked });
  input.addEventListener('change', () => onChange?.(input.checked));
  return h('div', { class: 'field' },
    h('label', { class: 'check', for: id }, input, h('span', null, label)),
    hint ? h('span', { class: 'field__hint' }, hint) : null);
}

/** Selector de color: input[type=color] + texto hexadecimal sincronizados. */
export function colorField({ label, value, onChange, hint = '' }) {
  const id = nextId('col');
  const picker = h('input', { type: 'color', class: 'input input--color', value, 'aria-label': `${label}: selector de color` });
  const hex = h('input', { id, type: 'text', class: 'input', value, maxlength: 7, spellcheck: 'false', autocomplete: 'off', 'aria-describedby': `${id}-err` });
  const err = h('p', { class: 'field__error', id: `${id}-err`, role: 'alert', hidden: true }, 'Usa el formato #RRGGBB.');
  picker.addEventListener('input', () => { hex.value = picker.value; hex.removeAttribute('aria-invalid'); err.hidden = true; onChange(picker.value); });
  hex.addEventListener('input', () => {
    let v = hex.value.trim();
    if (v && !v.startsWith('#')) v = `#${v}`;
    if (/^#[0-9a-f]{6}$/i.test(v)) {
      v = v.toLowerCase();
      picker.value = v; hex.removeAttribute('aria-invalid'); err.hidden = true; onChange(v);
    } else {
      hex.setAttribute('aria-invalid', 'true'); err.hidden = false;
    }
  });
  hex.addEventListener('blur', () => { if (hex.getAttribute('aria-invalid')) { hex.value = picker.value; hex.removeAttribute('aria-invalid'); err.hidden = true; } });
  return {
    el: h('div', { class: 'field' },
      h('label', { class: 'field__label', for: id }, label),
      h('div', { class: 'color-row' }, picker, hex),
      hint ? h('span', { class: 'field__hint' }, hint) : null, err),
    set(v) { picker.value = v; hex.value = v; },
  };
}

export function segmented({ label, value, options, onChange }) {
  const wrap = h('div', { class: 'segmented', role: 'group', 'aria-label': label });
  const buttons = options.map((o) => {
    const b = h('button', { type: 'button', 'aria-pressed': String(o.value === value) }, o.icon ? icon(o.icon, 15) : null, o.label);
    b.addEventListener('click', () => {
      buttons.forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      onChange(o.value);
    });
    return b;
  });
  wrap.append(...buttons);
  return wrap;
}

export function group(title, ...children) {
  return h('section', { class: 'group' }, title ? h('h3', { class: 'group__title' }, title) : null, ...children);
}

/** Bloque desplegable accesible (details/summary). */
export function accordion(title, iconName, open, ...children) {
  return h('details', { class: 'acc', open: !!open },
    h('summary', null, iconName ? icon(iconName, 16) : null, title),
    h('div', { class: 'acc__body' }, ...children));
}

/** Botones subir/bajar/eliminar para una fila. */
export function itemTools({ index, count, onUp, onDown, onDelete, name }) {
  return h('div', { class: 'item__tools' },
    h('button', { class: 'icon-btn', type: 'button', disabled: index === 0, 'aria-label': `Subir ${name}`, title: 'Subir', onclick: onUp }, icon('up', 16)),
    h('button', { class: 'icon-btn', type: 'button', disabled: index === count - 1, 'aria-label': `Bajar ${name}`, title: 'Bajar', onclick: onDown }, icon('down', 16)),
    h('button', { class: 'icon-btn icon-btn--danger', type: 'button', 'aria-label': `Eliminar ${name}`, title: 'Eliminar', onclick: onDelete }, icon('trash', 16)));
}
