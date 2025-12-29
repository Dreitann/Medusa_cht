import { $, setHTML } from '../utils/dom.js';
import { fmtDateTimeRu, combineDayTime } from '../utils/date.js';
import * as gcal from '../services/googleCalendar.js';

const clean = v => String(v ?? '').replace(/['"]/g,'').trim();

export function bindGoogleAuthButton(){
  const btn = $('#google-auth-btn');
  if (!btn) return;

  gcal.onSigninChange(async (signed)=>{
    btn.style.display = signed ? 'none' : 'inline-block';
    if (signed) await renderNext();
  });

  btn.addEventListener('click', ()=> gcal.signIn());
}

function mapScheduleRow(row){
  const dt = combineDayTime(clean(row.day), clean(row.time));
  if (!dt) return null;
  return {
    id: row.id,
    title: clean(row.subject) || 'Занятие',
    start: dt,
    provider:'schedule',
    link: row.meet_link || null,
    duration: row.duration_minutes || null,
    student_id: row.student_id || row.user_id || null,
    group_name: row.group_name || null,
    time: clean(row.time) || null
  };
}

function pickNext(events){
  const now = Date.now();
  return events
    .map(e => ({ ...e, t: new Date(e.start).getTime() }))
    .filter(e => !Number.isNaN(e.t) && e.t >= now)
    .sort((a,b)=>a.t-b.t)[0] || null;
}

function groupNearestDay(events){
  const now = new Date();
  const todayIso = now.toISOString().slice(0,10);
  const upcoming = events
    .map(ev => ({ ...ev, day: new Date(ev.start).toISOString().slice(0,10) }))
    .filter(ev => ev.day >= todayIso)
    .sort((a,b)=> new Date(a.start) - new Date(b.start));
  if (!upcoming.length) return [];
  const nearestDay = upcoming[0].day;
  return upcoming.filter(ev => ev.day === nearestDay);
}

export async function renderNext({ scheduleRows=[], isTeacher=false, students=[] } = {}){
  const dst = $('#next-event-content');
  const scheduleEvents = scheduleRows.map(mapScheduleRow).filter(Boolean);

  let events = scheduleEvents;
  if (gcal.isAuthorized()){
    await gcal.refreshEvents();
    const googleEvents = gcal.getAllEvents().map(e=>({...e, provider:'google'}));
    events = [...googleEvents, ...scheduleEvents];
  }

  if (!events.length){
    setHTML(dst,'События не найдены. Добавьте расписание в Supabase или войдите в Google.');
    return;
  }

  // Для учителя показываем все события ближайшего дня
  if (isTeacher){
    const dayEvents = groupNearestDay(events.filter(ev=>ev.provider==='schedule'));
    if (!dayEvents.length){
      setHTML(dst,'События не найдены. Добавьте расписание в Supabase или войдите в Google.');
      return;
    }
    const list = dayEvents.map((ev, idx)=>{
      const studentName = students.find(s=>String(s.id)===String(ev.student_id))?.name;
      const who = studentName || ev.group_name || '';
      const duration = ev.duration ? ` · ${ev.duration} мин` : '';
      const linkBtn = ev.link ? `<a class="btn ghost tiny event-action" href="${ev.link}" target="_blank">Ссылка</a>` : '';
      const divider = idx < dayEvents.length-1 ? '<div class="divider"></div>' : '';
      return `
        <li class="next-item">
          <div class="next-row">
            <div class="next-col">
              <div class="pill pill-supabase">Supabase</div>
              <div class="next-title">${ev.time || fmtDateTimeRu(ev.start)}${duration} — ${ev.title}</div>
              <div class="muted small">${who || 'Без ученика'}</div>
            </div>
            <div class="next-actions">
              ${linkBtn || ''}
            </div>
          </div>
          ${divider}
        </li>`;
    }).join('');
    setHTML(dst, `<div class="muted small" style="margin-bottom:6px;">Ближайший день с занятиями (${dayEvents[0].day})</div><ul class="next-list">${list}</ul>`);
    return;
  }

  const ev = pickNext(events);
  if (!ev) return setHTML(dst,'Нет предстоящих событий');

  const sourceLabel = ev.provider === 'google' ? 'Google Calendar' : 'Расписание Supabase';
  const btn = ev.link ? `<div style="margin-top:8px;"><a class="btn ghost" href="${ev.link}" target="_blank">Перейти в встречу</a></div>` : '';
  setHTML(dst, `<div class="pill">${sourceLabel}</div><b>${ev.title}</b><br>${fmtDateTimeRu(ev.start)}${btn}`);
}
