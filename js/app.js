import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://lwmervaxwrllgykcjfpn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bWVydmF4d3JsbGd5a2NqZnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDk3NjksImV4cCI6MjA2NjAyNTc2OX0.x8Ri1xtidyNqJDl4QgeSzTP2d0FaHLFPV7vBIIytLp4'
);

Telegram.WebApp.ready();
const user = Telegram.WebApp.initDataUnsafe?.user || {};
const userId = user?.id;

document.getElementById("student-name").textContent = user?.first_name || "Студент";

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
}

async function loadSchedule() {
  const container = document.getElementById("schedule-list");
  const { data, error } = await supabase.from("schedule").select("*").eq("user_id", userId);
  if (error || !data) return container.innerHTML = "<div class='card'>Ошибка загрузки</div>";
  container.innerHTML = "";
  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<div class="card-title">📘 ${item.subject}</div><div>${item.day}, ${item.time}</div>`;
    container.appendChild(card);
  });
}

async function uploadHomework() {
  const file = document.getElementById("hw-file").files[0];
  const status = document.getElementById("hw-status");
  if (!file) return status.textContent = "Файл не выбран";

  const path = `${userId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from("homework").upload(path, file);
  status.textContent = error ? "❌ " + error.message : "✅ Загружено";
  listHomework();
}

async function listHomework() {
  const list = document.getElementById("hw-list");
  const { data, error } = await supabase.storage.from("homework").list(userId + "/");
  if (error || !data) return list.innerHTML = "<div class='card'>Ошибка загрузки</div>";
  list.innerHTML = "";
  data.forEach(file => {
    const url = supabase.storage.from("homework").getPublicUrl(userId + "/" + file.name).data.publicUrl;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<div class="card-title">📄 ${file.name}</div><a href="${url}" target="_blank">Открыть</a>`;
    list.appendChild(card);
  });
}

async function loadVideos() {
  const container = document.getElementById("video-list");
  const { data, error } = await supabase.from("videos").select("*");
  if (error || !data) return container.innerHTML = "<div class='card'>Ошибка загрузки</div>";
  container.innerHTML = "";
  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<div class="card-title">🎬 ${item.title}</div><a href="${item.url}" target="_blank">Смотреть</a>`;
    container.appendChild(card);
  });
}

loadSchedule();
listHomework();
loadVideos();
