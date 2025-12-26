import { $, setHTML } from '../utils/dom.js';
import { toISODate, combineDayTime } from '../utils/date.js';
import * as gcal from '../services/googleCalendar.js';
import { openMeeting } from '../services/meetings.js';

let calendar;
const clean = v => String(v ?? '').replace(/['"]/g,'').trim();

function mapScheduleToEvents(rows){
  return rows.map(r => {
    const dt = combineDayTime(clean(r.day), clean(r.time));
    if (!dt) return null;
    return {
      title: clean(r.subject) || 'Занятие',
      start: dt,
      extendedProps: { link: r.meet_link || null, provider: 'schedule', time: clean(r.time) }
    };
  }).filter(Boolean);
}

function eventsForDay(day, events){
  return events.filter(e => {
    const iso = toISODate(e.start);
    return iso === day;
  });
}

export async function renderCalendar({ scheduleRows=[], error=null } = {}){
  const host = $('#calendar');
  const list = $('#event-list');
  if (!host) return;

  if (typeof FullCalendar === 'undefined'){
    setHTML(list,'<li>Не удалось загрузить календарь</li>');
    return;
  }

  setHTML(list, '<li>Загружаем события…</li>');

  // Загружаем события
  const scheduleEvents = mapScheduleToEvents(scheduleRows);
  let events = [...scheduleEvents];
  let hasGoogle = false;

  if (gcal.isAuthorized()){
    await gcal.refreshEvents();
    const googleEvents = gcal.getAllEvents().map(e=>({
      title: e.title,
      start: e.start,
      extendedProps: { link: e.link, provider:'google' }
    }));
    events = [...googleEvents, ...events];
    hasGoogle = true;
  }

  if (!events.length){
    const msg = error ? 'Не удалось загрузить расписание' : 'Событий нет';
    setHTML(list, `<li>${msg}</li>`);
    host.innerHTML = '';
    return;
  }

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
      const items = eventsForDay(day, events);
      setHTML(list, items.length
        ? items.map(it=>{
            const src = it.extendedProps.provider === 'google'
              ? 'Google'
              : 'Supabase';
            const parsed = new Date(it.start);
            const time = it.extendedProps.time
              || (!Number.isNaN(parsed.getTime()) ? parsed.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}) : '');
            return `<li><span class="pill pill-${src.toLowerCase()}">${src}</span> ${time} — ${it.title}</li>`;
          }).join('')
        : `<li>Нет событий на ${day}</li>`);
    }
  });
  host.innerHTML = '';
  calendar.render();

  setHTML(list, hasGoogle
    ? '<li>Выберите дату</li>'
    : '<li>Выберите дату или подключите Google для событий из календаря</li>');
}
