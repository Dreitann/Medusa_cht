import { $, setHTML } from '../utils/dom.js';
import { fmtDateTimeRu } from '../utils/date.js';
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

export async function renderNext(){
  const dst = $('#next-event-content');
  if (!gcal.isAuthorized()) {
    setHTML(dst, 'Требуется авторизация Google');
    return;
  }
  await gcal.refreshEvents();
  const ev = gcal.getNextEvent();
  if (!ev) return setHTML(dst,'Нет предстоящих событий');

  setHTML(dst, `<b>${ev.title}</b><br>${fmtDateTimeRu(ev.start)}`);
}
