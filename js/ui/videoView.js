import { $, setHTML, setText } from '../utils/dom.js';
import { uploadVideo, listVideos } from '../services/supabase.js';

export function initVideoUI(getUserId){
  $('#video-upload-btn')?.addEventListener('click', async ()=>{
    const file  = $('#video-file').files[0];
    const title = $('#video-title').value.trim();
    const status = $('#video-status');

    if (!file || !title) return setText(status,'Выберите файл и введите название');

    try{
      await uploadVideo(getUserId(), file, title);
      setText(status,'✅ Видео загружено');
      await renderVideos();
    }catch(e){
      setText(status,'❌ '+e.message);
    }
  });
}

export async function renderVideos(){
  const host = $('#video-list');
  try{
    const items = await listVideos();
    if (!items.length) return setHTML(host,'<div class="muted">Видео нет</div>');
    setHTML(host, items.map(v=>(
      `<div class="card"><div class="card-title">🎬 ${v.title}</div>
        <video controls style="width:100%;border-radius:8px" src="${v.url}"></video></div>`
    )).join(''));
  }catch(e){
    setHTML(host,'<div class="card">Ошибка</div>');
  }
}
