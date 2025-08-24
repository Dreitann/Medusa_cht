import { listUpcomingEvents, getState } from '../services/googleCalendar.js';

export async function renderNextEvent(dst) {
  if (!getState().items.length) await listUpcomingEvents();
  const now = Date.now();
  const future = getState().items
    .map(e => ({ ...e, ts: Date.parse(e.startISO) }))
    .filter(e => e.ts >= now)
    .sort((a, b) => a.ts - b.ts);
  if (!future.length) { dst.textContent = 'Нет предстоящих событий'; return; }
  const ev = future[0];
  const d = new Date(ev.startISO);
  dst.innerHTML = `<b>${ev.title}</b><br>${d.toLocaleDateString('ru-RU',{day:'numeric',month:'long'})} ${d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}`;
}
