import { listUpcomingEvents, getState } from '../services/googleCalendar.js';

let fc;

export async function renderCalendar(containerEl, listEl) {
  if (!getState().items.length) await listUpcomingEvents();

  const events = getState().items.map(e => ({
    title: e.title,
    start: e.startISO,
    extendedProps: { meet: e.meet },
  }));

  if (fc) fc.destroy();
  fc = new FullCalendar.Calendar(containerEl, {
    initialView: 'dayGridMonth',
    locale: 'ru',
    events,
    eventClick: info => {
      const link = info.event.extendedProps.meet;
      if (link) window.open(link, '_blank');
    },
    dateClick: info => {
      const y = info.date.getFullYear();
      const m = String(info.date.getMonth() + 1).padStart(2, '0');
      const d = String(info.date.getDate()).padStart(2, '0');
      const dayStr = `${y}-${m}-${d}`;
      const filtered = getState().items.filter(e => (e.startISO || '').startsWith(dayStr));
      listEl.innerHTML = filtered.length
        ? filtered.map(e => {
            const t = (e.startISO||'').includes('T') ? e.startISO.slice(11,16) : 'весь день';
            return `<li>${t} — ${e.title}</li>`;
          }).join('')
        : '<li>Нет событий на эту дату</li>';
    },
  });
  fc.render();
}
