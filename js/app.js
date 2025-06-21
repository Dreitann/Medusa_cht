// js/app.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

console.log('App.js loaded');

const supabase = createClient(
  'https://lwmervaxwrllgykcjfpn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bWVydmF4d3JsbGd5a2NqZnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDk3NjksImV4cCI6MjA2NjAyNTc2OX0.x8Ri1xtidyNqJDl4QgeSzTP2d0FaHLFPV7vBIIytLp4'
);

Telegram.WebApp.ready();
const user = Telegram.WebApp.initDataUnsafe?.user || {};
const userId = user.id;
console.log('Telegram User ID:', userId);
document.getElementById('student-name').textContent = user.first_name || 'Студент';

// Навигация по вкладкам
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

// Ближайшее занятие
async function loadNextEvent() {
  const dst = document.getElementById('next-event-content');
  dst.innerText = 'Загрузка…';
  try {
    const { data, error } = await supabase
      .from('schedule')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    if (!data.length) {
      dst.innerText = 'Нет занятий';
      return;
    }
    const events = data.map(e => ({ ...e, dt: parseToDate(e.day, e.time) }))
                       .sort((a,b)=>new Date(a.dt)-new Date(b.dt));
    const next = events[0];
    const d = new Date(next.dt);
    dst.innerHTML = `<b>${next.subject}</b><br>${d.toLocaleString('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}`;
  } catch (err) {
    console.error('Error loading next event:', err);
    dst.innerText = 'Ошибка: ' + err.message;
  }
}

// Календарь
async function loadSchedule() {
  const el = document.getElementById('calendar');
  el.innerText = 'Загрузка…';
  try {
    const { data, error } = await supabase
      .from('schedule')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    const events = data.map(e=>({
      title: e.subject,
      start: parseToDate(e.day, e.time)
    }));
    if (window._calendar) window._calendar.destroy();
    window._calendar = new FullCalendar.Calendar(el, {
      initialView: 'dayGridMonth',
      locale: 'ru',
      events
    });
    el.innerHTML = '';
    window._calendar.render();
  } catch (err) {
    console.error('Error loading schedule:', err);
    el.innerText = 'Ошибка: ' + err.message;
  }
}

// Загрузка домашки
async function uploadHomework() {
  const file = document.getElementById('hw-file').files[0];
  const status = document.getElementById('hw-status');
  if (!file) return status.innerText = 'Файл не выбран';
  const path = `${userId}/${Date.now()}_${file.name}`;
  status.innerText = 'Загрузка…';
  try {
    let { error } = await supabase.storage.from('homework').upload(path, file);
    if (error) throw error;
    status.innerText = '✅ Загружено';
    listHomework();
  } catch (err) {
    console.error('Error uploading homework:', err);
    status.innerText = 'Ошибка: ' + err.message;
  }
}

// Список домашки
async function listHomework() {
  const list = document.getElementById('hw-list');
  list.innerHTML = 'Загрузка…';
  try {
    const { data, error } = await supabase.storage.from('homework').list(userId + '/');
    if (error) throw error;
    list.innerHTML = '';
    data.forEach(f => {
      const url = supabase.storage.from('homework').getPublicUrl(userId + '/' + f.name).data.publicUrl;
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<div class="card-title">📄 ${f.name}</div><a href="${url}" target="_blank">Открыть</a>`;
      list.appendChild(card);
    });
  } catch (err) {
    console.error('Error listing homework:', err);
    list.innerHTML = `<div class="card">Ошибка: ${err.message}</div>`;
  }
}

// Загрузка видео
async function uploadVideo() {
  const file = document.getElementById('video-file').files[0];
  const title = document.getElementById('video-title').value.trim();
  const status = document.getElementById('video-status');
  if (!file || !title) return status.innerText = 'Выберите файл и введите название';
  const path = `${userId}/${Date.now()}_${file.name}`;
  status.innerText = 'Загрузка…';
  try {
    let { error } = await supabase.storage.from('videos').upload(path, file);
    if (error) throw error;
    let res = await supabase.from('videos').insert([{ file_path: path, title }]);
    if (res.error) throw res.error;
    status.innerText = '✅ Видео загружено';
    loadVideos();
  } catch (err) {
    console.error('Error uploading video:', err);
    status.innerText = 'Ошибка: ' + err.message;
  }
}

// Список видео
async function loadVideos() {
  const list = document.getElementById('video-list');
  list.innerHTML = 'Загрузка…';
  try {
    const { data, error } = await supabase.from('videos').select('*').order('uploaded_at',{ascending:false});
    if (error) throw error;
    list.innerHTML = '';
    data.forEach(item => {
      const url = supabase.storage.from('videos').getPublicUrl(item.file_path).data.publicUrl;
      const card = document.createElement('div'); card.className = 'card';
      card.innerHTML = `
        <div class="card-title">🎬 ${item.title}</div>
        <video controls src="${url}" style="width:100%;border-radius:6px;"></video>`;
      list.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading videos:', err);
    list.innerHTML = `<div class="card">Ошибка: ${err.message}</div>`;
  }
}

// Парсер даты
function parseToDate(day, time) {
  const days = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
  const today = new Date();
  const tgt = days.indexOf(day);
  let delta = (tgt + 7 - today.getDay()) % 7;
  const [hh,mm] = time.split(':').map(Number);
  if (delta===0 && (today.getHours()>hh || (today.getHours()===hh && today.getMinutes()>=mm))) delta=7;
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate()+delta, hh, mm);
  return d.toISOString().slice(0,16);
}

// Стартовая вкладка
openTab('next');
