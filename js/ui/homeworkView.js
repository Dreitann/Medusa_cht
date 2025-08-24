import { $, setHTML, setText } from '../utils/dom.js';
import { supabase, uploadHomework, listHomework } from '../services/supabase.js';

export function initHomeworkUI(getUserId){
  $('#hw-upload-btn')?.addEventListener('click', async ()=>{
    const file = $('#hw-file').files[0];
    const status = $('#hw-status');

    if (!file) return setText(status,'Файл не выбран');

    try{
      await uploadHomework(getUserId(), file);
      setText(status,'✅ Загружено');
      await renderHomework(getUserId());
    }catch(e){
      setText(status,'❌ '+e.message);
    }
  });
}

export async function renderHomework(userId){
  const listEl = $('#hw-list');
  try{
    const list = await listHomework(userId);
    if (!list.length) return setHTML(listEl,'<div class="muted">Файлов нет</div>');
    setHTML(listEl, list.map(f=>(
      `<div class="card"><div class="card-title">📄 ${f.name}</div>
        <a href="${f.url}" target="_blank">Открыть</a></div>`
    )).join(''));
  }catch(e){
    setHTML(listEl,'<div class="card">Ошибка</div>');
  }
}
