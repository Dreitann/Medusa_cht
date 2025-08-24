import { $, setHTML } from '../utils/dom.js';
import { toISODate } from '../utils/date.js';
import * as gcal from '../services/googleCalendar.js';
import { openMeeting } from '../services/meetings.js';

let calendar;

export async function renderCalendar(){
  const host = $('#calendar');
  const list = $('#event-list');
  if (!host) return;

  // Загружаем события
  if (!gcal.isAuthorized()) {
    setHTML(list,'<li>Авторизуйтесь в Google</li>');
    return;
  }
  await gcal.refreshEvents();
  const events = gcal.getAllEvents().map(e=>({
    title: e.title,
    start: e.start,
    extendedProps: { link: e.link }
  }));

  if (calendar) calendar.destroy();
  calendar = new FullCalendar.Calendar(host, {
    initialView:'dayGridMonth',
    locale:'ru',
    events,
    eventClick: info => {
      const link = info.event.extendedProps.link;
      if (link) openMeeting(link);
    },
    dateClick: info => {
      const day = info.dateStr;
      const items = gcal.getEventsForDay(day);
      setHTML(list, items.length
        ? items.map(it=>`<li>${it.start.slice(11,16)} — ${it.title}</li>`).join('')
        : '<li>Нет событий на эту дату</li>');
    }
  });
  host.innerHTML = '';
  calendar.render();
}
