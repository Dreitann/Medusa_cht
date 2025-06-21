
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://lwmervaxwrllgykcjfpn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bWVydmF4d3JsbGd5a2NqZnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDk3NjksImV4cCI6MjA2NjAyNTc2OX0.x8Ri1xtidyNqJDl4QgeSzTP2d0FaHLFPV7vBIIytLp4'
);

const calendarList = document.getElementById('calendar-list');
const userId = Telegram.WebApp.initDataUnsafe?.user?.id;

async function loadSchedule() {
  if (!userId) {
    calendarList.innerHTML = '<li>Ошибка: Не удалось получить ID пользователя</li>';
    return;
  }

  const { data: schedule, error } = await supabase
    .from('schedule')
    .select('*')
    .eq('user_id', userId);

  if (error || !schedule || schedule.length === 0) {
    calendarList.innerHTML = '<li>Нет записей или ошибка загрузки</li>';
    return;
  }

  calendarList.innerHTML = '';
  schedule.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `📚 ${item.subject} – ${item.day}, ${item.time}`;
    calendarList.appendChild(li);
  });
}

Telegram.WebApp.ready();
loadSchedule();
