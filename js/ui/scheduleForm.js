import { $ } from '../utils/dom.js';
import { createSchedule } from '../services/supabase.js';
import { showToast } from './toast.js';

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

    if (!user_id || !subject || !isoDay || !time){
      showToast('Заполните ID, тему, дату и время', 'warn');
      return;
    }
    $('#event-submit-btn').disabled = true;
    try{
      await createSchedule({ user_id, subject, day: isoDay, time, meet_link });
      showToast('Событие добавлено', 'info');
      if (typeof refreshCalendar === 'function'){
        await refreshCalendar();
      }
    }catch(e){
      showToast('Не удалось создать событие: '+e.message, 'error');
    }finally{
      $('#event-submit-btn').disabled = false;
    }
  });
}
