
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://lwmervaxwrllgykcjfpn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bWVydmF4d3JsbGd5a2NqZnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDk3NjksImV4cCI6MjA2NjAyNTc2OX0.x8Ri1xtidyNqJDl4QgeSzTP2d0FaHLFPV7vBIIytLp4'
);

Telegram.WebApp.ready();
const tg = Telegram.WebApp;

const initData = tg.initDataUnsafe;
const userId = initData?.user?.id;

document.getElementById("init-data").textContent = JSON.stringify(initData, null, 2);
document.getElementById("user-id").textContent = userId || "❌ нет user.id";

async function loadSchedule() {
  const responseBlock = document.getElementById("schedule-response");
  const listBlock = document.getElementById("calendar-list");

  if (!userId) {
    responseBlock.textContent = "❌ user.id отсутствует";
    listBlock.innerHTML = "<li>Ошибка получения user.id</li>";
    return;
  }

  const { data, error } = await supabase
    .from("schedule")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    responseBlock.textContent = JSON.stringify(error, null, 2);
    listBlock.innerHTML = "<li>Ошибка загрузки расписания</li>";
    return;
  }

  responseBlock.textContent = JSON.stringify(data, null, 2);

  if (!data || data.length === 0) {
    listBlock.innerHTML = "<li>Нет занятий</li>";
    return;
  }

  listBlock.innerHTML = "";
  data.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `📚 ${item.subject} – ${item.day}, ${item.time}`;
    listBlock.appendChild(li);
  });
}

loadSchedule();
