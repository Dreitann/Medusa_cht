import { uploadVideo, listVideos } from '../services/supabase.js';

export function attachVideoUI(userId) {
  const file = document.getElementById('video-file');
  const title = document.getElementById('video-title');
  const status = document.getElementById('video-status');
  const list = document.getElementById('video-list');

  document.getElementById('video-upload-btn')?.addEventListener('click', async () => {
    if (!file.files[0] || !title.value.trim()) { status.textContent = 'Выберите файл и введите название'; return; }
    try {
      await uploadVideo(userId, file.files[0], title.value.trim());
      status.textContent = '✅ Видео загружено';
      await refresh();
    } catch (e) { status.textContent = '❌ ' + e.message; }
  });

  async function refresh() {
    try {
      const items = await listVideos();
      list.innerHTML = items.map(v => `
        <div class="card">
          <div class="card-title">🎬 ${v.title}</div>
          <video controls src="${v.url}" style="width:100%;border-radius:6px"></video>
        </div>
      `).join('');
    } catch (e) { list.textContent = 'Ошибка: ' + e.message; }
  }
  refresh();
}
