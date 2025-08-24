import { $, $$ } from '../utils/dom.js';

export function initTabs(){
  const buttons = [
    'next','schedule','homework','video','jitsi'
  ];
  buttons.forEach(name=>{
    $('#btn-'+name)?.addEventListener('click', ()=>{
      $$('.tab').forEach(t=>t.classList.remove('active'));
      $('#tab-'+name)?.classList.add('active');

      $$('.tab-bar button').forEach(b=>b.classList.remove('active'));
      $('#btn-'+name)?.classList.add('active');
    });
  });
}
