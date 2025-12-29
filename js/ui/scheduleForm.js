import { $ } from '../utils/dom.js';
import {
  createScheduleBatch,
  updateSchedule,
  deleteSchedule,
  createOrUpdateGroup,
  createOrUpdateStudent
} from '../services/supabase.js';
import { showToast } from './toast.js';

let currentId = null;
let students = [];
let groups = [];

function resolveStudentIds(inputValue){
  const tokens = (inputValue || '').split(',').map(t=>t.trim()).filter(Boolean);
  const ids = [];
  tokens.forEach(tok=>{
    if (!tok) return;
    const num = Number(tok);
    if (!Number.isNaN(num)) {
      ids.push(num);
      return;
    }
    const match = students.find(s =>
      tok.toLowerCase().includes(String(s.id)) ||
      s.name?.toLowerCase().includes(tok.toLowerCase())
    );
    if (match) ids.push(match.id);
  });
  return ids;
}

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
  const sg = $('#student-group-select');
  if (sg){
    sg.innerHTML = `<option value="">Без группы</option>` + groups.map(g=>`<option value="${g.id}">${g.name}</option>`).join('');
  }
}

export function toggleScheduleForm({ isTeacher, getUserId, refreshCalendar }){
  const card = $('#teacher-schedule-card');
  if (!card) return;
  card.style.display = isTeacher ? 'block' : 'none';
  if (card.dataset.bound) return;
  card.dataset.bound = '1';

  const toggleArea = (btnId, bodyId)=>{
    const btn = document.getElementById(btnId);
    const body = document.getElementById(bodyId);
    if (!btn || !body) return;
    const setLabel = ()=>{ btn.textContent = body.classList.contains('open') ? 'Свернуть' : 'Раскрыть'; };
    setLabel();
    btn.addEventListener('click', ()=>{
      const opened = body.classList.toggle('open');
      btn.textContent = opened ? 'Свернуть' : 'Раскрыть';
    });
  };
  toggleArea('toggle-event-form','event-form-body');
  toggleArea('toggle-directory','directory-body');

  $('#event-student-name')?.addEventListener('input', ()=>{
    const resolved = resolveStudentIds($('#event-student-name').value);
    $('#event-student-ids').value = resolved.length ? resolved.join(', ') : '—';
  });

  $('#event-submit-btn')?.addEventListener('click', async ()=>{
    const resolvedStudentIds = resolveStudentIds($('#event-student-name').value);
    $('#event-student-ids').value = resolvedStudentIds.length ? resolvedStudentIds.join(', ') : '—';

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
    if (!resolvedStudentIds.length && !group_id){
      showToast('Укажите ученика или выберите группу', 'warn');
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

  $('#group-create-btn')?.addEventListener('click', async ()=>{
    const name = $('#group-name-input').value.trim();
    if (!name) return showToast('Введите название группы', 'warn');
    try{
      const saved = await createOrUpdateGroup({ name });
      showToast('Группа сохранена', 'info');
      if (saved) groups.push(saved);
      setDirectories({ studentList: students, groupList: groups });
    }catch(e){
      showToast('Не удалось сохранить группу: '+e.message, 'error');
    }
  });

  $('#student-create-btn')?.addEventListener('click', async ()=>{
    const name = $('#student-name-input').value.trim();
    const id = Number($('#student-id-input').value);
    const group_id = $('#student-group-select').value || null;
    if (!id || !name) return showToast('Введите имя и Telegram ID ученика', 'warn');
    try{
      const saved = await createOrUpdateStudent({ id, name, group_id });
      showToast('Ученик сохранён', 'info');
      const idx = students.findIndex(s=>String(s.id)===String(saved.id));
      if (idx>=0) students[idx]=saved; else students.push(saved);
      setDirectories({ studentList: students, groupList: groups });
    }catch(e){
      showToast('Не удалось сохранить ученика: '+e.message, 'error');
    }
  });
}

function resetForm(){
  currentId = null;
  $('#event-id').value = '';
  $('#event-student-name').value = '';
  $('#event-student-ids').value = '—';
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
  $('#event-student-ids').value = foundStudent ? foundStudent.id : '—';
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
