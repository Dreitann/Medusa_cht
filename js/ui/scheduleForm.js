import { $ } from '../utils/dom.js';
import { createScheduleBatch, updateSchedule, deleteSchedule } from '../services/supabase.js';
import { showToast } from './toast.js';

let currentId = null;
let students = [];
let groups = [];

export function setDirectories({ studentList=[], groupList=[] }){
  students = studentList;
  groups = groupList;
  const dl = $('#students-list');
  if (dl){
    dl.innerHTML = students.map(s=>`<option value="${s.name} (ID: ${s.id})"></option>`).join('');
  }
  const gs = $('#event-group-select');
  if (gs){
    gs.innerHTML = `<option value="">Без группы</option>` + groups.map(g=>`<option value="${g.id}">${g.name}</option>`).join('');
  }
}

export function toggleScheduleForm({ isTeacher, getUserId, refreshCalendar }){
  const card = $('#teacher-schedule-card');
  if (!card) return;
  card.style.display = isTeacher ? 'block' : 'none';
  if (card.dataset.bound) return;
  card.dataset.bound = '1';

  $('#event-submit-btn')?.addEventListener('click', async ()=>{
    const namesRaw = $('#event-student-name').value.trim();
    const nameItems = namesRaw ? namesRaw.split(',').map(x=>x.trim()).filter(Boolean) : [];
    const resolvedStudentIds = nameItems.map(n=>{
      const match = students.find(s=>n.includes(String(s.id)) || n.toLowerCase().startsWith(s.name.toLowerCase()));
      return match ? match.id : null;
    }).filter(Boolean);

    const subject = $('#event-subject').value.trim();
    const dayInput = $('#event-date').value;
    const isoDay = dayInput ? new Date(dayInput).toISOString().slice(0,10) : '';
    const time = $('#event-time').value;
    const meet_link = $('#event-link').value.trim() || null;
    const repeatWeeks = Number($('#event-repeat').value || 0);
    const duration_minutes = Number($('#event-duration').value || 60);
    const group_name = $('#event-group').value.trim() || null;
    const group_id = $('#event-group-select').value || null;
    const baseUserId = getUserId();

    if (!subject || !isoDay || !time){
      showToast('Заполните тему, дату и время', 'warn');
      return;
    }

    $('#event-submit-btn').disabled = true;
    try{
      if (currentId){
        const idNum = Number(currentId);
        if (!idNum) throw new Error('Не выбран слот для редактирования');
        await updateSchedule(idNum, {
          user_id: baseUserId,
          student_id: resolvedStudentIds[0] || null,
          group_id,
          subject,
          day: isoDay,
          time,
          meet_link,
          duration_minutes,
          group_name
        });
        showToast('Событие обновлено', 'info');
      }else{
        await createScheduleBatch({
          user_id: baseUserId,
          subject,
          day: isoDay,
          time,
          meet_link,
          repeatWeeks,
          duration_minutes,
          group_name,
          user_ids: [],
          student_ids: resolvedStudentIds,
          group_id
        });
        showToast('Событие добавлено', 'info');
      }
      resetForm();
      if (typeof refreshCalendar === 'function') await refreshCalendar();
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
      resetForm();
      if (typeof refreshCalendar === 'function') await refreshCalendar();
    }catch(e){
      showToast('Не удалось удалить событие: '+e.message, 'error');
    }
  });
}

function resetForm(){
  currentId = null;
  $('#event-id').value = '';
  $('#event-student-name').value = '';
  $('#event-subject').value = '';
  $('#event-date').value = '';
  $('#event-time').value = '';
  $('#event-link').value = '';
  $('#event-repeat').value = 0;
  $('#event-duration').value = 60;
  $('#event-group').value = '';
  $('#event-group-select').value = '';
  $('#event-delete-btn').style.display = 'none';
  $('#event-submit-btn').textContent = 'Создать событие';
}

export function selectScheduleForEdit(ev){
  currentId = ev?.id || null;
  $('#event-id').value = currentId || '';
  const foundStudent = students.find(s=>String(s.id) === String(ev?.student_id || ev?.user_id));
  $('#event-student-name').value = foundStudent ? `${foundStudent.name} (ID: ${foundStudent.id})` : '';
  $('#event-subject').value = ev?.subject || '';
  $('#event-date').value = ev?.day || '';
  $('#event-time').value = ev?.time || '';
  $('#event-link').value = ev?.meet_link || '';
  $('#event-repeat').value = 0;
  $('#event-duration').value = ev?.duration_minutes || 60;
  $('#event-group').value = ev?.group_name || '';
  $('#event-group-select').value = ev?.group_id || '';
  if (currentId){
    $('#event-delete-btn').style.display = 'inline-flex';
    $('#event-submit-btn').textContent = 'Сохранить';
  }
  document.getElementById('teacher-schedule-card')?.scrollIntoView({behavior:'smooth', block:'start'});
}
