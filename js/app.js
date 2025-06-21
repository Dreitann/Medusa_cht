
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://lwmervaxwrllgykcjfpn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bWVydmF4d3JsbGd5a2NqZnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDk3NjksImV4cCI6MjA2NjAyNTc2OX0.x8Ri1xtidyNqJDl4QgeSzTP2d0FaHLFPV7vBIIytLp4'
);

const tg = Telegram.WebApp;
tg.ready();

const userId = tg.initDataUnsafe?.user?.id;

function switchTab(id) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
}

// загрузка расписания
async function loadSchedule() {
  const list = document.getElementById('schedule-list');
  const { data, error } = await supabase.from('schedule').select('*').eq('user_id', userId);
  if (error || !data) return list.innerHTML = '<li>Ошибка загрузки</li>';
  list.innerHTML = '';
  data.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.day} ${item.time} — ${item.subject}`;
    list.appendChild(li);
  });
}

// загрузка дз
async function uploadHomework() {
  const file = document.getElementById('hw-file').files[0];
  const status = document.getElementById('hw-status');
  if (!file) return status.textContent = 'Файл не выбран';

  const path = `${userId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from('homework').upload(path, file);
  if (error) {
    status.textContent = '❌ Ошибка: ' + error.message;
  } else {
    status.textContent = '✅ Загружено: ' + data.path;
    listHomework();
  }
}

// отображение загруженных дз
async function listHomework() {
  const { data, error } = await supabase.storage.from('homework').list(userId + '/');
  const list = document.getElementById('hw-list');
  if (error || !data) return list.innerHTML = '<li>Ошибка загрузки</li>';
  list.innerHTML = '';
  data.forEach(file => {
    const li = document.createElement('li');
    const link = supabase.storage.from('homework').getPublicUrl(userId + '/' + file.name).data.publicUrl;
    li.innerHTML = `<a href="${link}" target="_blank">${file.name}</a>`;
    list.appendChild(li);
  });
}

loadSchedule();
listHomework();
