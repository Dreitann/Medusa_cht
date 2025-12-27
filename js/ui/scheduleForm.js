import { $ } from '../utils/dom.js';
import { createScheduleBatch, updateSchedule, deleteSchedule } from '../services/supabase.js';
import { showToast } from './toast.js';

let currentId = null;

export function toggleScheduleForm({ isTeacher, getUserId, refreshCalendar }){
  const card = $('#teacher-schedule-card');
  if (!card) return;

  // Показываем форму только для teacher
  card.style.display = isTeacher ? 'block' : 'none';

  // Навешиваем обработчик только один раз
  if (card.dataset.bound) return;
  card.dataset.bound = '1';

  $('#event-student-id').value = getUserId(); // подставляем себя по умолчанию

  $('#event-submit-btn')?.addEventListener('click', async ()=>{
    const user_id = Number($('#event-student-id').value.trim() || getUserId());
    const subject = $('#event-subject').value.trim();
    const dayInput = $('#event-date').value;
    const isoDay = dayInput ? new Date(dayInput).toISOString().slice(0,10) : '';
    const time = $('#event-time').value;
    const meet_link = $('#event-link').value.trim() || null;
    const repeatWeeks = Number($('#event-repeat').value || 0);
    const duration_minutes = Number($('#event-duration').value || 60);
    const group_name = $('#event-group').value.trim() || null;

    if (!user_id || !subject || !isoDay || !time){
      showToast('Заполните ID, тему, дату и время', 'warn');
      return;
    }
    $('#event-submit-btn').disabled = true;
    try{
      if (currentId){
        const idNum = Number(currentId);
        if (!idNum){
          throw new Error('Не выбран слот для редактирования');
        }
        await updateSchedule(idNum, { user_id, subject, day: isoDay, time, meet_link, duration_minutes, group_name });
        showToast('Событие обновлено', 'info');
      }else{
        await createScheduleBatch({ user_id, subject, day: isoDay, time, meet_link, repeatWeeks, duration_minutes, group_name });
        showToast('Событие добавлено', 'info');
      }
      resetForm(getUserId());
      if (typeof refreshCalendar === 'function'){
        await refreshCalendar();
      }
    }catch(e){
      showToast('Не удалось создать событие: '+e.message, 'error');
    }finally{
      $('#event-submit-btn').disabled = false;
    }
  });

  $('#event-delete-btn')?.addEventListener('click', async ()=>{
    if (!currentId) return;
    try{
      await deleteSchedule(currentId);
      showToast('Событие удалено', 'info');
      resetForm(getUserId());
      if (typeof refreshCalendar === 'function'){
        await refreshCalendar();
      }
    }catch(e){
      showToast('Не удалось удалить событие: '+e.message, 'error');
    }
  });
}

function resetForm(defaultUserId){
  currentId = null;
  $('#event-id').value = '';
  $('#event-student-id').value = defaultUserId;
  $('#event-subject').value = '';
  $('#event-date').value = '';
  $('#event-time').value = '';
  $('#event-link').value = '';
  $('#event-repeat').value = 0;
  $('#event-delete-btn').style.display = 'none';
  $('#event-submit-btn').textContent = 'Создать событие';
}

export function selectScheduleForEdit(ev, getUserId){
  currentId = ev?.id || null;
  $('#event-id').value = currentId || '';
  $('#event-student-id').value = ev?.user_id || getUserId();
  $('#event-subject').value = ev?.subject || '';
  $('#event-date').value = ev?.day || '';
  $('#event-time').value = ev?.time || '';
  $('#event-link').value = ev?.meet_link || '';
  $('#event-repeat').value = 0;
  $('#event-duration').value = ev?.duration_minutes || 60;
  $('#event-group').value = ev?.group_name || '';
  if (currentId){
    $('#event-delete-btn').style.display = 'inline-flex';
    $('#event-submit-btn').textContent = 'Сохранить';
  }
  document.getElementById('teacher-schedule-card')?.scrollIntoView({behavior:'smooth', block:'start'});
}
