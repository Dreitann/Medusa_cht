import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

console.log('App.js loaded');

export const supabase = createClient(
  'https://lwmervaxwrllgykcjfpn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bWVydmF4d3JsbGd5a2NqZnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDk3NjksImV4cCI6MjA2NjAyNTc2OX0.x8Ri1xtidyNqJDl4QgeSzTP2d0FaHLFPV7vBIIytLp4'
);

Telegram.WebApp.ready();
const user = Telegram.WebApp.initDataUnsafe?.user || {};
const userId = user.id;
console.log('Telegram User ID:', userId);
document.getElementById('student-name').textContent = user.first_name || 'Студент';

// Register tab buttons
window.openTab = openTab;
document.getElementById('btn-next').addEventListener('click', () => openTab('next'));
document.getElementById('btn-schedule').addEventListener('click', () => openTab('schedule'));
document.getElementById('btn-homework').addEventListener('click', () => openTab('homework'));
document.getElementById('btn-video').addEventListener('click', () => openTab('video'));

function openTab(tab) {
  console.log('Switching to tab:', tab);
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.querySelectorAll('.tab-bar button').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-' + tab).classList.add('active');
  if (tab === 'next') loadNextEvent();
  if (tab === 'schedule') loadSchedule();
  if (tab === 'homework') listHomework();
  if (tab === 'video') loadVideos();
}

async function loadNextEvent() {
  console.log('Loading next event');
  const dst = document.getElementById('next-event-content');
  const { data, error } = await supabase.from('schedule').select('*').eq('user_id', userId);
  if (error || !data || !data.length) { dst.innerText = 'Нет занятий'; return; }
  const events = data.map(e => ({ ...e, dt: parseToDate(e.day, e.time) }))
                     .sort((a, b) => new Date(a.dt) - new Date(b.dt));
  const next = events[0];
  const d = new Date(next.dt);
  dst.innerHTML = `<b>${next.subject}</b><br>${d.toLocaleString('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}`;
}

async function loadSchedule() {
  console.log('Loading schedule');
  const el = document.getElementById('calendar');
  const { data, error } = await supabase.from('schedule').select('*').eq('user_id', userId);
  if (error || !data) { el.innerHTML = 'Ошибка'; return; }
  const events = data.map(e => ({ title: e.subject, start: parseToDate(e.day, e.time) }));
  if (window._calendar) window._calendar.destroy();
  window._calendar = new FullCalendar.Calendar(el,{initialView:'dayGridMonth', locale:'ru', events});
  el.innerHTML = '';
  window._calendar.render();
}

// Add event listener for date clicks on the calendar
window._calendar?.on('dateClick', function(info) {
  const selectedDate = info.dateStr;
  console.log('Clicked date:', selectedDate);
  loadEventsForDate(selectedDate);
});

async function loadEventsForDate(selectedDate) {
  const list = document.getElementById('event-list');
  if (!list) return;
  const { data, error } = await supabase.from('schedule').select('*').eq('user_id', userId);
  if (error || !data) { list.innerHTML = '<li>Ошибка загрузки</li>'; return; }

  const filtered = data.filter(e => {
    const eventDate = parseToDate(e.day, e.time).slice(0, 10);
    return eventDate === selectedDate;
  });

  if (filtered.length === 0) {
    list.innerHTML = '<li>Занятий на выбранную дату нет</li>';
  } else {
    list.innerHTML = filtered.map(e =>
      `<li>${e.time} – ${e.subject} (${e.group_name || 'Без группы'})</li>`).join('');
  }
}

async function uploadHomework() {
  console.log('Uploading homework');
  const file = document.getElementById('hw-file').files[0];
  const status = document.getElementById('hw-status');
  if (!file) return status.innerText = 'Файл не выбран';
  const path = `${userId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from('homework').upload(path, file);
  status.innerText = error ? '❌ ' + error.message : '✅ Загружено';
  listHomework();
}

async function listHomework() {
  console.log('Listing homework');
  const list = document.getElementById('hw-list');
  const { data, error } = await supabase.storage.from('homework').list(userId + '/');
  if (error || !data) { list.innerHTML = '<div class="card">Ошибка</div>'; return; }
  list.innerHTML = '';
  data.forEach(f => {
    const url = supabase.storage.from('homework').getPublicUrl(userId + '/' + f.name).data.publicUrl;
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `<div class="card-title">📄 ${f.name}</div><a href="${url}" target="_blank">Открыть</a>`;
    list.appendChild(card);
  });
}

async function uploadVideo() {
  console.log('Uploading video');
  const file = document.getElementById('video-file').files[0];
  const title = document.getElementById('video-title').value.trim();
  const status = document.getElementById('video-status');
  if (!file || !title) return status.innerText = 'Выберите файл и введите название';
  const path = `${userId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from('videos').upload(path, file);
  if (error) return status.innerText = '❌ ' + error.message;
  const { error: e2 } = await supabase.from('videos').insert([{ file_path: path, title }]);
  status.innerText = e2 ? '❌ ' + e2.message : '✅ Видео загружено';
  loadVideos();
}

async function loadVideos() {
  console.log('Loading videos');
  const list = document.getElementById('video-list');
  const { data, error } = await supabase.from('videos').select('*').order('uploaded_at',{ascending:false});
  if (error || !data) { list.innerHTML = '<div class="card">Ошибка</div>'; return; }
  list.innerHTML = '';
  data.forEach(item => {
    const url = supabase.storage.from('videos').getPublicUrl(item.file_path).data.publicUrl;
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `<div class="card-title">🎬 ${item.title}</div><video controls src="${url}" style="width:100%;border-radius:6px;"></video>`;
    list.appendChild(card);
  });
}

function parseToDate(day, time) {
  const days = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
  const today = new Date();
  const target = days.indexOf(day);
  let delta = (target + 7 - today.getDay()) % 7;
  const [hh, mm] = time.split(':').map(Number);
  if (delta===0 && (today.getHours()>hh || (today.getHours()===hh && today.getMinutes()>=mm))) delta=7;
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate()+delta, hh, mm);
  return d.toISOString().slice(0,16);
}

// Initial load
openTab('next');
