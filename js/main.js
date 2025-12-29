import { $, setText } from './utils/dom.js';
import { initTabs } from './ui/tabs.js';
import { renderNext } from './ui/nextEventCard.js';
import { renderCalendar } from './ui/calendarView.js';
import { initHomeworkUI, renderHomework } from './ui/homeworkView.js';
import { initVideoUI, renderVideos } from './ui/videoView.js';
import { initJitsi } from './ui/jitsiView.js';
import { fetchSchedule, ensureUserExists, fetchUserProfile, fetchGroups, fetchStudents, createOrUpdateStudent } from './services/supabase.js';
import { SUPABASE_URL, SUPABASE_KEY, TEACHER_IDS } from './config.js';
import { setStatus } from './ui/status.js';
import { showToast } from './ui/toast.js';
import { toggleScheduleForm, selectScheduleForEdit, setDirectories } from './ui/scheduleForm.js';

Telegram.WebApp.ready();
const tgUser = Telegram.WebApp.initDataUnsafe?.user || {};
const userId = tgUser.id ?? 999999;
let isTeacher = TEACHER_IDS.includes(String(userId));
setText(document.getElementById('student-name'), tgUser.first_name || 'Студент');
setText(document.getElementById('student-id'), tgUser.id ? String(tgUser.id) : 'debug');

let scheduleRows = [];
let scheduleError = null;
let studentDirectory = [];
let groupDirectory = [];

setStatus('supabase', { state:'idle', text:'Ожидание' });
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

function runApp(){
  toggleScheduleForm({
    isTeacher,
    getUserId: ()=>userId,
    refreshCalendar: async ()=>{
      await refreshSchedule();
      await renderNext({ scheduleRows, isTeacher, students: studentDirectory });
      await renderCalendar({ scheduleRows, error:scheduleError, onSelectSchedule: isTeacher ? onScheduleSelect : null });
    }
  });

  refreshSchedule().then(async ()=>{
    await renderNext({ scheduleRows, isTeacher, students: studentDirectory });
    await renderCalendar({ scheduleRows, error:scheduleError, onSelectSchedule: isTeacher ? onScheduleSelect : null });
  });

  renderHomework(userId);
  renderVideos();
}

initTabs();
initJitsi();
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
    const profile = await fetchUserProfile(userId);
    if (profile?.role === 'teacher') isTeacher = true;
    if (profile?.role === 'student'){
      // Синхронизируем студента в справочник, чтобы учитель мог сразу находить по имени/ID
      try{
        await createOrUpdateStudent({ id: userId, name: tgUser.first_name || 'Студент', group_id: null });
      }catch(syncErr){
        console.warn('Не удалось синхронизировать ученика в справочник', syncErr);
      }
    }
    if (profile?.role){
      hasRole = true;
      const roleEl = document.getElementById('student-role');
      if (roleEl){
        roleEl.textContent = profile.role;
        roleEl.style.display = 'inline-flex';
      }
      document.getElementById('access-gate').style.display = 'none';
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
    if (gate){
      gate.style.display = 'flex';
      const msg = document.getElementById('access-msg');
      if (msg) msg.textContent = 'Ошибка запроса профиля. Нажмите "Передать данные" и повторите после назначения роли.';
    }
  }

  if (!hasRole) return;
  if (isTeacher){
    try{
      groupDirectory = await fetchGroups();
      studentDirectory = await fetchStudents();
      setDirectories({ studentList: studentDirectory, groupList: groupDirectory });
      await renderNext({ scheduleRows, isTeacher, students: studentDirectory });
    }catch(e){
      console.warn('Не удалось загрузить справочники', e);
    }
  }
  runApp();
}

boot();

document.getElementById('profile-sync-btn')?.addEventListener('click', async ()=>{
  try{
    await ensureUserExists({ id:userId, first_name: tgUser.first_name || 'Студент' });
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
          await renderCalendar({ scheduleRows, error:scheduleError, onSelectSchedule: isTeacher ? onScheduleSelect : null });
        }
      });
      runApp();
    }else{
      const gate = document.getElementById('access-gate');
      const msg = document.getElementById('access-msg');
      if (gate){
        gate.style.display = 'flex';
        if (msg) msg.textContent = 'Роль ещё не назначена. Назначьте роль в Supabase и нажмите обновить.';
      }
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
      await ensureUserExists({ id:userId, first_name: tgUser.first_name || 'Студент' });
      showToast('Данные переданы. Ждите назначения роли.', 'info');
      const gate = document.getElementById('access-gate');
      const msg = document.getElementById('access-msg');
      if (gate) gate.style.display = 'flex';
      if (msg) msg.textContent = 'Мы получили ваш ID. Доступ откроется после назначения роли.';
      accessBtn.textContent = 'Запрос отправлен';
      accessBtn.disabled = true;
    }catch(e){
      showToast('Не удалось передать данные: '+e.message, 'error');
    }
  });
}

// По умолчанию показываем ближайшее
document.getElementById('btn-next')?.click();

function onScheduleSelect(ev){
  selectScheduleForEdit(ev);
}
