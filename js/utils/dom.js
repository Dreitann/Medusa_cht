export const $  = sel => document.querySelector(sel);
export const $$ = sel => document.querySelectorAll(sel);

export function setText(el, text){ if(!el) return; el.textContent = text; }
export function setHTML(el, html){ if(!el) return; el.innerHTML  = html; }
