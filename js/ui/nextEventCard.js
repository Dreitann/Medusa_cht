import { $, setHTML } from '../utils/dom.js';
import { fmtDateTimeRu, combineDayTime } from '../utils/date.js';
import * as gcal from '../services/googleCalendar.js';

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
  const dt = combineDayTime(row.day, row.time);
  if (!dt) return null;
  return { title: row.subject || 'Занятие', start: dt, provider:'schedule' };
}

function pickNext(events){
  const now = Date.now();
  return events
    .map(e => ({ ...e, t: new Date(e.start).getTime() }))
    .filter(e => !Number.isNaN(e.t) && e.t >= now)
    .sort((a,b)=>a.t-b.t)[0] || null;
}

export async function renderNext({ scheduleRows=[] } = {}){
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

  const ev = pickNext(events);
  if (!ev) return setHTML(dst,'Нет предстоящих событий');

  const sourceLabel = ev.provider === 'google' ? 'Google Calendar' : 'Расписание Supabase';
  setHTML(dst, `<div class="pill">${sourceLabel}</div><b>${ev.title}</b><br>${fmtDateTimeRu(ev.start)}`);
}
