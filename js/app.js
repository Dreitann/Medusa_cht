// js/app.js
import { supabase } from './supabaseClient.js';

// Telegram init
Telegram.WebApp.ready();
const tgUser = Telegram.WebApp.initDataUnsafe.user || {};
document.getElementById('student-name').textContent = tgUser.first_name || 'Студент';

// Домашка (Supabase)
window.uploadHomework = async function() {
  const file = document.getElementById('hw-file').files[0];
  const status = document.getElementById('hw-status');
  if (!file) return status.textContent = 'Файл не выбран';
  const path = `${tgUser.id}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from('homework').upload(path, file);
  status.textContent = error ? '❌ ' + error.message : '✅ Загружено';
  listHomework();
};
window.listHomework = async function() {
  const list = document.getElementById('hw-list');
  const { data, error } = await supabase.storage.from('homework').list(`${tgUser.id}/`);
  if (error) return list.textContent = 'Ошибка загрузки';
  list.innerHTML = data.map(f=>`
    <div class="card">
      <div class="card-title">📄 ${f.name}</div>
      <a href="${supabase.storage.from('homework').getPublicUrl(`${tgUser.id}/${f.name}`).data.publicUrl}" target="_blank">Открыть</a>
    </div>`).join('');
};

// Видео (Supabase)
window.uploadVideo = async function() {
  const file = document.getElementById('video-file').files[0];
  const title = document.getElementById('video-title').value.trim();
  const status = document.getElementById('video-status');
  if (!file || !title) return status.textContent = 'Выберите файл и введите название';
  const path = `${tgUser.id}/${Date.now()}_${file.name}`;
  let { error } = await supabase.storage.from('videos').upload(path, file);
  if (error) return status.textContent = '❌ ' + error.message;
  const { error: e2 } = await supabase.from('videos').insert([{ file_path: path, title }]);
  status.textContent = e2 ? '❌ ' + e2.message : '✅ Видео загружено';
  loadVideos();
};
window.loadVideos = async function() {
  const list = document.getElementById('video-list');
  const { data, error } = await supabase.from('videos').select('*').order('uploaded_at',{ascending:false});
  if (error) return list.textContent = 'Ошибка загрузки';
  list.innerHTML = data.map(item=>`
    <div class="card">
      <div class="card-title">🎬 ${item.title}</div>
      <video controls src="${supabase.storage.from('videos').getPublicUrl(item.file_path).data.publicUrl}" style="width:100%;border-radius:6px"></video>
    </div>`).join('');
};

// Jitsi Embed
let jitsiApi = null;
function startJitsi(){
  if (jitsiApi) return;
  jitsiApi = new JitsiMeetExternalAPI('meet.jit.si',{
    roomName: 'MentoriumRoom_'+tgUser.id,
    parentNode: document.getElementById('jitsi-container'),
    interfaceConfigOverwrite:{TOOLBAR_BUTTONS:[]}
  });
}
window.toggleAudio = ()=>jitsiApi.executeCommand('toggleAudio');
window.toggleVideo = ()=>jitsiApi.executeCommand('toggleVideo');
window.toggleChat  = ()=>jitsiApi.executeCommand('toggleChat');
window.toggleWhiteboard = ()=>jitsiApi.executeCommand('toggleWhiteboard');
window.alertParticipants = ()=>jitsiApi.getParticipantsInfo().then(p=>alert(p.map(x=>x.displayName).join('\n')));
document.getElementById('btn-jitsi').onclick = ()=>{ openTab('jitsi'); startJitsi(); };

// Таб-бар
function openTab(id){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  document.querySelectorAll('nav.tab-bar button').forEach(b=>b.classList.remove('active'));
  document.getElementById('btn-'+id).classList.add('active');
  if(id==='homework')  listHomework();
  if(id==='video')     loadVideos();
}
['next','schedule','homework','video','jitsi'].forEach(tab=>
  document.getElementById('btn-'+tab).onclick = ()=>openTab(tab)
);