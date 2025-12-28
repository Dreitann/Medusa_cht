import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_KEY, HW_BUCKET, VIDEO_BUCKET } from '../config.js';

const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_KEY);
export const supabase = hasSupabaseConfig ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function requireSupabase(){
  if (!supabase) throw new Error('Supabase не сконфигурирован: задайте SUPABASE_URL и SUPABASE_KEY в env.js');
}

// --- Пользователь ---
export async function ensureUser({ id, first_name, role }){
  requireSupabase();
  if (!id) return;
  const payload = { id, first_name };
  if (role) payload.role = role;
  const { error } = await supabase
    .from('users')
    .upsert([payload], { onConflict:'id' });
  if (error) throw error;
}

// Создаём пользователя только если его ещё нет, без присвоения роли
export async function ensureUserExists({ id, first_name }){
  requireSupabase();
  if (!id) return null;
  try{
    const existing = await fetchUserProfile(id);
    if (existing) return existing;
  }catch(_e){
    // если нет строки, создаём
  }
  const { data, error } = await supabase
    .from('users')
    .insert([{ id, first_name, role: null }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchUserProfile(id){
  requireSupabase();
  if (!id) return null;
  const { data, error, status } = await supabase.from('users').select('id, first_name, role').eq('id', id).single();
  if (error){
    // 406/ PGRST116 -> no rows
    if (status === 406 || error.code === 'PGRST116') return null;
    throw error;
  }
  return data || null;
}

// --- Расписание ---
export async function fetchSchedule(userId){
  requireSupabase();
  const { data, error } = await supabase
    .from('schedule')
    .select('*, students(name), groups(name)')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('day', { ascending:true })
    .order('time', { ascending:true });
  if (error) throw error;
  return data || [];
}

export async function createSchedule({ user_id, subject, day, time, meet_link, duration_minutes, group_id, student_id, group_name }){
  requireSupabase();
  const { data, error } = await supabase
    .from('schedule')
    .insert([{ user_id, subject, day, time, meet_link, duration_minutes, group_id, student_id, group_name }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createScheduleBatch({ user_id, subject, day, time, meet_link, repeatWeeks = 0, duration_minutes, group_name, user_ids=null, student_ids=null, group_id=null }){
  requireSupabase();
  const baseDate = new Date(day);
  const rows = [];
  const idsToUse = user_ids && Array.isArray(user_ids) ? user_ids : [user_id];
  const studentsToUse = student_ids && Array.isArray(student_ids) ? student_ids : [];
  for (let id of idsToUse){
    for (let i=0; i<=repeatWeeks; i++){
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i*7);
      const iso = d.toISOString().slice(0,10);
      rows.push({ user_id:id, subject, day: iso, time, meet_link, duration_minutes, group_name, group_id });
    }
  }
  for (let sid of studentsToUse){
    for (let i=0; i<=repeatWeeks; i++){
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i*7);
      const iso = d.toISOString().slice(0,10);
      rows.push({ student_id: sid, subject, day: iso, time, meet_link, duration_minutes, group_name, group_id });
    }
  }
  const { data, error } = await supabase.from('schedule').insert(rows).select();
  if (error) throw error;
  return data;
}

export async function updateSchedule(id, payload){
  requireSupabase();
  const { data, error } = await supabase
    .from('schedule')
    .update(payload)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteSchedule(id){
  requireSupabase();
  const { error } = await supabase.from('schedule').delete().eq('id', id);
  if (error) throw error;
}

// --- Справочники ---
export async function fetchGroups(){
  requireSupabase();
  const { data, error } = await supabase.from('groups').select('*').order('name');
  if (error) throw error;
  return data||[];
}

export async function createOrUpdateGroup(group){
  requireSupabase();
  const { data, error } = await supabase.from('groups').upsert([group]).select().maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchStudents(){
  requireSupabase();
  const { data, error } = await supabase.from('students').select('*, groups(name)').order('name');
  if (error) throw error;
  return data||[];
}

export async function createOrUpdateStudent(student){
  requireSupabase();
  const { data, error } = await supabase.from('students').upsert([student]).select().maybeSingle();
  if (error) throw error;
  return data;
}

// --- Домашка ---
export async function uploadHomework(userId, file){
  requireSupabase();
  const path = `${userId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from(HW_BUCKET).upload(path, file);
  if (error) throw error;

  // Логируем в таблицу для истории
  await supabase.from('homework').insert([{
    user_id:userId,
    filename:file.name,
    file_path:path
  }]);
  return path;
}

export async function listHomework(userId){
  requireSupabase();
  const { data, error } = await supabase
    .from('homework')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending:false });
  if (error) throw error;
  return (data||[]).map(f => ({
    name: f.filename,
    uploaded_at: f.uploaded_at,
    url: supabase.storage.from(HW_BUCKET).getPublicUrl(f.file_path).data.publicUrl
  }));
}

// --- Видео ---
export async function uploadVideo(userId, file, title){
  requireSupabase();
  const path = `${userId}/${Date.now()}_${file.name}`;
  const up = await supabase.storage.from(VIDEO_BUCKET).upload(path, file);
  if (up.error) throw up.error;

  const ins = await supabase.from('videos').insert([{
    file_path: path,
    title,
    uploaded_by: userId
  }]).select().single();
  if (ins.error) throw ins.error;

  return path;
}

export async function listVideos(){
  requireSupabase();
  const { data, error } = await supabase.from('videos').select('*').order('uploaded_at',{ascending:false});
  if (error) throw error;
  return (data||[]).map(v => ({
    title: v.title,
    uploaded_at: v.uploaded_at,
    url: supabase.storage.from(VIDEO_BUCKET).getPublicUrl(v.file_path).data.publicUrl
  }));
}
