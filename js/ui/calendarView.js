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
      id: r.id,
      title: clean(r.subject) || 'Занятие',
      start: dt,
      extendedProps: {
        link: r.meet_link || null,
        provider: 'schedule',
        time: clean(r.time),
        user_id: r.user_id,
        student_id: r.student_id,
        duration_minutes: r.duration_minutes,
        group_name: r.group_name || null,
        student_name: null
      }
    };
  }).filter(Boolean);
}

function eventsForDay(day, events){
  return events.filter(e => {
    const iso = toISODate(e.start);
    return iso === day;
  });
}

export async function renderCalendar({ scheduleRows=[], error=null, onSelectSchedule=null } = {}){
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
    host.innerHTML = '<div class="muted small" style="padding:12px;">Нет событий для отображения</div>';
    return;
  }

  if (calendar) calendar.destroy();
  calendar = new FullCalendar.Calendar(host, {
    initialView:'dayGridMonth',
    locale:'ru',
    firstDay: 1,
    eventDisplay:'block',
    dayMaxEventRows: 4,
    events,
    eventClick: info => {
      const link = info.event.extendedProps.link;
      if (onSelectSchedule && info.event.extendedProps.provider === 'schedule'){
        onSelectSchedule({
          id: info.event.id,
          subject: info.event.title,
          day: toISODate(info.event.start),
          time: info.event.extendedProps.time,
          meet_link: link,
          user_id: info.event.extendedProps.user_id,
          duration_minutes: info.event.extendedProps.duration_minutes,
          group_name: info.event.extendedProps.group_name
        });
        return;
      }
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
            const linkBtn = it.extendedProps.link ? `<a class="btn ghost tiny event-action" href="${it.extendedProps.link}" target="_blank">Ссылка</a>` : '';
            const editBtn = onSelectSchedule && it.extendedProps.provider === 'schedule'
              ? `<button class="btn tiny ghost event-action event-edit" data-id="${it.id||''}" data-subject="${it.title}" data-day="${toISODate(it.start)}" data-time="${it.extendedProps.time||''}" data-link="${it.extendedProps.link||''}" data-user="${it.extendedProps.student_id||it.extendedProps.user_id||''}" data-duration="${it.extendedProps.duration_minutes||''}" data-group="${it.extendedProps.group_name||''}">Редактировать</button>`
              : '';
            const duration = it.extendedProps.duration_minutes ? ` · ${it.extendedProps.duration_minutes} мин` : '';
            const group = it.extendedProps.group_name ? ` · ${it.extendedProps.group_name}` : '';
            const student = it.extendedProps.student_name ? ` · ${it.extendedProps.student_name}` : '';
            return `<li><span class="pill pill-${src.toLowerCase()}">${src}</span> ${time}${duration}${group}${student} — ${it.title} ${linkBtn} ${editBtn}</li>`;
          }).join('')
        : `<li>Нет событий на ${day}</li>`);
      if (onSelectSchedule){
        list.querySelectorAll('.event-edit').forEach(btn=>{
          btn.addEventListener('click', ()=>{
            onSelectSchedule({
              id: btn.dataset.id,
              subject: btn.dataset.subject,
              day: btn.dataset.day,
              time: btn.dataset.time,
              meet_link: btn.dataset.link,
              user_id: btn.dataset.user,
              duration_minutes: btn.dataset.duration,
              group_name: btn.dataset.group
            });
          });
        });
      }
    }
  });
  host.innerHTML = '';
  calendar.render();
  // чуть позже подправляем размеры, если контейнер сначала был скрыт
  setTimeout(()=>{ try{ calendar.updateSize(); }catch(_e){} }, 80);

  setHTML(list, hasGoogle
    ? '<li>Выберите дату</li>'
    : '<li>Выберите дату или подключите Google для событий из календаря</li>');
}

// Когда пользователь переходит на вкладку «Расписание», пересчитываем размеры календаря
document.addEventListener('tab:change', (e)=>{
  if (e.detail?.name === 'schedule' && calendar){
    try{ calendar.updateSize(); }catch(_e){}
  }
});
