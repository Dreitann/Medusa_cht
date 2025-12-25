import { $ } from '../utils/dom.js';

const STATUS_CLASS = {
  ok: 'status-ok',
  warn: 'status-warn',
  error: 'status-error',
  idle: 'status-idle'
};

export function setStatus(id, { state='idle', text='—' } = {}){
  const el = $(`[data-status-id="${id}"]`);
  if (!el) return;
  Object.values(STATUS_CLASS).forEach(cls => el.classList.remove(cls));
  el.classList.add(STATUS_CLASS[state] || STATUS_CLASS.idle);
  el.querySelector('.status-text')?.replaceChildren(document.createTextNode(text));
}
