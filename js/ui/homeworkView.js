import { uploadHomework, listHomework } from '../services/supabase.js';

export function attachHomeworkUI(userId) {
  const file = document.getElementById('hw-file');
  const status = document.getElementById('hw-status');
  const list = document.getElementById('hw-list');

  document.getElementById('hw-upload-btn')?.addEventListener('click', async () => {
    if (!file.files[0]) { status.textContent = 'Файл не выбран'; return; }
    try {
      await uploadHomework(userId, file.files[0]);
      status.textContent = '✅ Загружено';
      await refresh();
    } catch (e) { status.textContent = '❌ ' + e.message; }
  });

  async function refresh() {
    try {
      const items = await listHomework(userId);
      list.innerHTML = items.map(it => `
        <div class="card">
          <div class="card-title">📄 ${it.name}</div>
          <a href="${it.url}" target="_blank">Открыть</a>
        </div>
      `).join('');
    } catch (e) { list.textContent = 'Ошибка: ' + e.message; }
  }
  refresh();
}
