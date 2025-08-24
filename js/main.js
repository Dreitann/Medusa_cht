import { $, setText } from './utils/dom.js';
import { initTabs } from './ui/tabs.js';
import { bindGoogleAuthButton, renderNext } from './ui/nextEventCard.js';
import { renderCalendar } from './ui/calendarView.js';
import { initHomeworkUI, renderHomework } from './ui/homeworkView.js';
import { initVideoUI, renderVideos } from './ui/videoView.js';
import { initJitsi } from './ui/jitsiView.js';
import * as gcal from './services/googleCalendar.js';

Telegram.WebApp.ready();
const tgUser = Telegram.WebApp.initDataUnsafe?.user || {};
const userId = tgUser.id || 'debug-user';
setText(document.getElementById('student-name'), tgUser.first_name || 'Студент');

initTabs();
initJitsi();
bindGoogleAuthButton();
initHomeworkUI(()=>userId);
initVideoUI(()=>userId);

// Реагируем на готовность/авторизацию Google
gcal.onGoogleReady(async ()=>{
  if (gcal.isAuthorized()){
    await renderNext();
    await renderCalendar();
  }
});
gcal.onSigninChange(async signed=>{
  if (signed){
    await renderNext();
    await renderCalendar();
  }
});

// Домашка/Видео при первом заходе на вкладку (можно вызывать и сразу)
renderHomework(userId);
renderVideos();

// По умолчанию показываем ближайшее
document.getElementById('btn-next')?.click();
