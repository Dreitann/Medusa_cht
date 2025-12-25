import { $, setText } from './utils/dom.js';
import { initTabs } from './ui/tabs.js';
import { bindGoogleAuthButton, renderNext } from './ui/nextEventCard.js';
import { renderCalendar } from './ui/calendarView.js';
import { initHomeworkUI, renderHomework } from './ui/homeworkView.js';
import { initVideoUI, renderVideos } from './ui/videoView.js';
import { initJitsi } from './ui/jitsiView.js';
import { fetchSchedule } from './services/supabase.js';
import * as gcal from './services/googleCalendar.js';

Telegram.WebApp.ready();
const tgUser = Telegram.WebApp.initDataUnsafe?.user || {};
const userId = tgUser.id ?? 999999;
setText(document.getElementById('student-name'), tgUser.first_name || 'Студент');
setText(document.getElementById('student-id'), tgUser.id ? String(tgUser.id) : 'debug');

let scheduleRows = [];
let scheduleError = null;

function setConnStatus(ok, text){
  const chip = $('#conn-chip');
  if (!chip) return;
  chip.textContent = text;
  chip.classList.toggle('success', ok);
  chip.classList.toggle('error', !ok);
}

async function refreshSchedule(){
  try{
    scheduleRows = await fetchSchedule(userId);
    scheduleError = null;
    setConnStatus(true, 'Supabase готов');
  }catch(e){
    scheduleError = e;
    setConnStatus(false, 'Supabase недоступен');
  }
}

initTabs();
initJitsi();
bindGoogleAuthButton();
initHomeworkUI(()=>userId);
initVideoUI(()=>userId);

async function boot(){
  await refreshSchedule();
  await renderNext({ scheduleRows });
  await renderCalendar({ scheduleRows, error:scheduleError });

  // Домашка/Видео
  renderHomework(userId);
  renderVideos();
}

boot();

// Реагируем на готовность/авторизацию Google
gcal.onGoogleReady(async ()=>{
  if (gcal.isAuthorized()){
    await renderNext({ scheduleRows });
    await renderCalendar({ scheduleRows, error:scheduleError });
  }
});
gcal.onSigninChange(async signed=>{
  if (signed){
    await renderNext({ scheduleRows });
    await renderCalendar({ scheduleRows, error:scheduleError });
  }
});

// По умолчанию показываем ближайшее
document.getElementById('btn-next')?.click();
