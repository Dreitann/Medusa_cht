import { $, setText } from './utils/dom.js';
import { initTabs } from './ui/tabs.js';
import { bindGoogleAuthButton, renderNext } from './ui/nextEventCard.js';
import { renderCalendar } from './ui/calendarView.js';
import { initHomeworkUI, renderHomework } from './ui/homeworkView.js';
import { initVideoUI, renderVideos } from './ui/videoView.js';
import { initJitsi } from './ui/jitsiView.js';
import { fetchSchedule, ensureUser, fetchUserProfile } from './services/supabase.js';
import { SUPABASE_URL, SUPABASE_KEY, TEACHER_IDS } from './config.js';
import { setStatus } from './ui/status.js';
import { showToast } from './ui/toast.js';
import * as gcal from './services/googleCalendar.js';
import { toggleScheduleForm } from './ui/scheduleForm.js';

Telegram.WebApp.ready();
const tgUser = Telegram.WebApp.initDataUnsafe?.user || {};
const userId = tgUser.id ?? 999999;
let isTeacher = TEACHER_IDS.includes(String(userId));
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
  if (!SUPABASE_URL || !SUPABASE_KEY){
    showToast('Заполните SUPABASE_URL и SUPABASE_KEY в env.js', 'error', 5000);
    setStatus('supabase',{state:'error', text:'Конфиг'});
    return;
  }

  let hasRole = false;

  try{
    await ensureUser({ id:userId, first_name: tgUser.first_name || 'Студент' });
  }catch(e){
    console.warn('Не удалось создать пользователя', e);
    // Не блокируем работу приложения из-за неуспешного upsert пользователя
    setStatus('supabase',{state:'warn', text:'Без профиля'});
  }

  try{
    const profile = await fetchUserProfile(userId);
    if (profile?.role === 'teacher') isTeacher = true;
    if (profile?.role){
      const roleEl = document.getElementById('student-role');
      if (roleEl){
        roleEl.textContent = profile.role;
        roleEl.style.display = 'inline-flex';
      }
      document.getElementById('access-gate').style.display = 'none';
      hasRole = true;
    }else{
      const syncBtn = document.getElementById('profile-sync-btn');
      if (syncBtn) syncBtn.style.display = 'inline-flex';
      const gate = document.getElementById('access-gate');
      const msg = document.getElementById('access-msg');
      if (gate){
        gate.style.display = 'flex';
        if (msg) msg.textContent = 'Нажмите "Передать данные". Мы добавим вас в список и откроем доступ после назначения роли.';
      }
    }
  }catch(e){
    console.warn('Не удалось получить профиль', e);
    const gate = document.getElementById('access-gate');
    if (gate) gate.style.display = 'flex';
  }

  // Если роли нет — не даём доступ к функционалу до назначения роли
  if (!hasRole) return;

  toggleScheduleForm({
    isTeacher,
    getUserId: ()=>userId,
    refreshCalendar: async ()=>{
      await refreshSchedule();
      await renderNext({ scheduleRows });
      await renderCalendar({ scheduleRows, error:scheduleError });
    }
  });

  await refreshSchedule();
  await renderNext({ scheduleRows });
  await renderCalendar({ scheduleRows, error:scheduleError });

  // Домашка/Видео
  renderHomework(userId);
  renderVideos();
}

boot();

document.getElementById('profile-sync-btn')?.addEventListener('click', async ()=>{
  try{
    await ensureUser({ id:userId, first_name: tgUser.first_name || 'Студент' });
    const profile = await fetchUserProfile(userId);
    if (profile?.role){
      const roleEl = document.getElementById('student-role');
      if (roleEl){
        roleEl.textContent = profile.role;
        roleEl.style.display = 'inline-flex';
      }
      document.getElementById('profile-sync-btn').style.display = 'none';
      document.getElementById('access-gate').style.display = 'none';
      isTeacher = profile.role === 'teacher';
      toggleScheduleForm({
        isTeacher,
        getUserId: ()=>userId,
        refreshCalendar: async ()=>{
          await refreshSchedule();
          await renderNext({ scheduleRows });
          await renderCalendar({ scheduleRows, error:scheduleError });
        }
      });
    }
    showToast('Профиль обновлён', 'info');
  }catch(e){
    showToast('Не удалось обновить профиль: '+e.message, 'error');
  }
});

const accessBtn = document.getElementById('access-btn');
if (accessBtn){
  accessBtn.addEventListener('click', async ()=>{
    try{
      await ensureUser({ id:userId, first_name: tgUser.first_name || 'Студент' });
      showToast('Данные переданы. Ждите назначения роли.', 'info');
      const gate = document.getElementById('access-gate');
      if (gate) gate.style.display = 'flex';
    }catch(e){
      showToast('Не удалось передать данные: '+e.message, 'error');
    }
  });
}

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
