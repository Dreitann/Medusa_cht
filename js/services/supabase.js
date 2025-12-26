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
    .select('*')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('day', { ascending:true })
    .order('time', { ascending:true });
  if (error) throw error;
  return data || [];
}

export async function createSchedule({ user_id, subject, day, time, meet_link }){
  requireSupabase();
  const { data, error } = await supabase
    .from('schedule')
    .insert([{ user_id, subject, day, time, meet_link }])
    .select()
    .single();
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
