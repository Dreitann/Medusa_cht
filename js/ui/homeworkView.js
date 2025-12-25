import { $, setHTML, setText } from '../utils/dom.js';
import { supabase, uploadHomework, listHomework } from '../services/supabase.js';

export function initHomeworkUI(getUserId){
  const btn = $('#hw-upload-btn');
  btn?.addEventListener('click', async ()=>{
    const file = $('#hw-file').files[0];
    const status = $('#hw-status');

    if (!file) return setText(status,'Файл не выбран');

    btn.disabled = true;
    setText(status,'Загружаем…');
    try{
      await uploadHomework(getUserId(), file);
      setText(status,'✅ Загружено');
      $('#hw-file').value = '';
      await renderHomework(getUserId());
    }catch(e){
      setText(status,'❌ '+e.message);
    }finally{
      btn.disabled = false;
    }
  });
}

export async function renderHomework(userId){
  const listEl = $('#hw-list');
  setHTML(listEl,'<div class="muted">Загрузка…</div>');
  try{
    const list = await listHomework(userId);
    if (!list.length) return setHTML(listEl,'<div class="muted">Файлов нет</div>');
    setHTML(listEl, list.map(f=>(
      `<div class="card"><div class="card-title">📄 ${f.name}</div>
        <div class="muted small">Загружено: ${f.uploaded_at ? new Date(f.uploaded_at).toLocaleString('ru-RU') : '—'}</div>
        <a href="${f.url}" class="btn full" target="_blank">Открыть</a></div>`
    )).join(''));
  }catch(e){
    setHTML(listEl,`<div class="card">Ошибка: ${e.message}</div>`);
  }
}
