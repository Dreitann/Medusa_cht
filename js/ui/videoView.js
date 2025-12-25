import { $, setHTML, setText } from '../utils/dom.js';
import { uploadVideo, listVideos } from '../services/supabase.js';
import { showToast } from './toast.js';

export function initVideoUI(getUserId){
  const btn = $('#video-upload-btn');
  btn?.addEventListener('click', async ()=>{
    const file  = $('#video-file').files[0];
    const title = $('#video-title').value.trim();
    const status = $('#video-status');

    if (!file || !title) return setText(status,'Выберите файл и введите название');

    btn.disabled = true;
    setText(status,'Загружаем…');
    try{
      await uploadVideo(getUserId(), file, title);
      setText(status,'✅ Видео загружено');
      showToast('Видео загружено', 'info');
      $('#video-title').value = '';
      $('#video-file').value = '';
      await renderVideos();
    }catch(e){
      setText(status,'❌ '+e.message);
      showToast('Ошибка загрузки видео: '+e.message, 'error');
    }finally{
      btn.disabled = false;
    }
  });
}

export async function renderVideos(){
  const host = $('#video-list');
  setHTML(host,'<div class="muted">Загрузка…</div>');
  try{
    const items = await listVideos();
    if (!items.length) return setHTML(host,'<div class="muted">Видео нет</div>');
    setHTML(host, items.map(v=>(
      `<div class="card"><div class="card-title">🎬 ${v.title}</div>
        <div class="muted">Загружено: ${v.uploaded_at ? new Date(v.uploaded_at).toLocaleDateString('ru-RU') : '—'}</div>
        <video controls class="video-player" src="${v.url}"></video></div>`
    )).join(''));
  }catch(e){
    setHTML(host,`<div class="card">Ошибка: ${e.message}</div>`);
    showToast('Не удалось загрузить список видео: '+e.message, 'error');
  }
}
