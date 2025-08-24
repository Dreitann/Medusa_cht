import { $, setText } from '../utils/dom.js';
import { JITSI_DOMAIN, JITSI_ROOM } from '../config.js';

export function initJitsi(){
  $('#btn-jitsi')?.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.getElementById('tab-jitsi')?.classList.add('active');

    if (!window.jitsiApi){
      window.jitsiApi = new JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName: JITSI_ROOM,
        parentNode: document.getElementById('jitsi-container'),
        width:'100%', height:340
      });
      window.jitsiApi.addEventListener('videoConferenceJoined', ()=>console.log('Jitsi joined'));
    }
  });

  document.getElementById('jitsi-participants-btn')?.addEventListener('click', async ()=>{
    if (!window.jitsiApi) return;
    const p = await window.jitsiApi.getParticipantsInfo();
    alert('Участники:\n'+p.map(x=>x.displayName || 'Без имени').join('\n'));
  });
}
