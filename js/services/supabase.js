import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_KEY, HW_BUCKET, VIDEO_BUCKET } from '../config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Домашка ---
export async function uploadHomework(userId, file){
  const path = `${userId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from(HW_BUCKET).upload(path, file);
  if (error) throw error;
  return path;
}

export async function listHomework(userId){
  const { data, error } = await supabase.storage.from(HW_BUCKET).list(`${userId}/`);
  if (error) throw error;
  return (data||[]).map(f => ({
    name: f.name,
    url: supabase.storage.from(HW_BUCKET).getPublicUrl(`${userId}/${f.name}`).data.publicUrl
  }));
}

// --- Видео ---
export async function uploadVideo(userId, file, title){
  const path = `${userId}/${Date.now()}_${file.name}`;
  const up = await supabase.storage.from(VIDEO_BUCKET).upload(path, file);
  if (up.error) throw up.error;

  const ins = await supabase.from('videos').insert([{ file_path: path, title }]).select().single();
  if (ins.error) throw ins.error;

  return path;
}

export async function listVideos(){
  const { data, error } = await supabase.from('videos').select('*').order('uploaded_at',{ascending:false});
  if (error) throw error;
  return (data||[]).map(v => ({
    title: v.title,
    url: supabase.storage.from(VIDEO_BUCKET).getPublicUrl(v.file_path).data.publicUrl
  }));
}
