import { $, setText } from './utils/dom.js';
import { initTabs } from './ui/tabs.js';
import { bindGoogleAuthButton, renderNext } from './ui/nextEventCard.js';
import { renderCalendar } from './ui/calendarView.js';
import { initHomeworkUI, renderHomework } from './ui/homeworkView.js';
import { initVideoUI, renderVideos } from './ui/videoView.js';
import { initJitsi } from './ui/jitsiView.js';
import { fetchSchedule, ensureUser } from './services/supabase.js';
import { setStatus } from './ui/status.js';
import { showToast } from './ui/toast.js';
import * as gcal from './services/googleCalendar.js';

Telegram.WebApp.ready();
const tgUser = Telegram.WebApp.initDataUnsafe?.user || {};
const userId = tgUser.id ?? 999999;
setText(document.getElementById('student-name'), tgUser.first_name || 'Студент');
setText(document.getElementById('student-id'), tgUser.id ? String(tgUser.id) : 'debug');

let scheduleRows = [];
let scheduleError = null;

setStatus('supabase', { state:'idle', text:'Ожидание' });
setStatus('google', { state:'warn', text:'Войти' });
setStatus('jitsi', { state:'idle', text:'Готов' });

async function refreshSchedule(){
  try{
    setStatus('supabase', { state:'warn', text:'Проверяем' });
    scheduleRows = await fetchSchedule(userId);
    scheduleError = null;
    setStatus('supabase', { state:'ok', text:'Готов' });
  }catch(e){
    scheduleError = e;
    setStatus('supabase', { state:'error', text:'Ошибка' });
    showToast('Supabase недоступен: '+e.message, 'error');
  }
}

initTabs();
initJitsi();
bindGoogleAuthButton();
initHomeworkUI(()=>userId);
initVideoUI(()=>userId);

async function boot(){
  if (!window.__ENV__?.SUPABASE_URL || !window.__ENV__?.SUPABASE_KEY){
    showToast('Заполните SUPABASE_URL и SUPABASE_KEY в env.js', 'error', 5000);
    setStatus('supabase',{state:'error', text:'Конфиг'});
  }

  try{
    await ensureUser({ id:userId, first_name: tgUser.first_name || 'Студент' });
  }catch(e){
    console.warn('Не удалось создать пользователя', e);
    showToast('Не удалось синхронизировать пользователя', 'warn');
  }

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
  setStatus('google', gcal.isAuthorized()
    ? { state:'ok', text:'Подключён' }
    : { state:'warn', text:'Войти' });
  if (gcal.isAuthorized()){
    await renderNext({ scheduleRows });
    await renderCalendar({ scheduleRows, error:scheduleError });
  }
});
gcal.onSigninChange(async signed=>{
  setStatus('google', signed
    ? { state:'ok', text:'Подключён' }
    : { state:'warn', text:'Войти' });
  if (signed){
    await renderNext({ scheduleRows });
    await renderCalendar({ scheduleRows, error:scheduleError });
  }
});

// По умолчанию показываем ближайшее
document.getElementById('btn-next')?.click();
