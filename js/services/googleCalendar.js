import {
  GOOGLE_API_KEY, GOOGLE_CLIENT_ID, DISCOVERY_DOCS, GCAL_SCOPES
} from '../config.js';

let gIsReady   = false;
let isSignedIn = false;
let cache      = []; // события

// Делам функцию глобально видимой для onload скрипта в index.html
window.handleClientLoad = function(){
  gapi.load('client:auth2', initClient);
};

async function initClient(){
  await gapi.client.init({
    apiKey: GOOGLE_API_KEY,
    clientId: GOOGLE_CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: GCAL_SCOPES
  });

  gIsReady   = true;
  isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();

  gapi.auth2.getAuthInstance().isSignedIn.listen(v => {
    isSignedIn = v;
    _onSigninChange?.(v);
  });

  // Прогружаем первый раз если уже залогинен
  if (isSignedIn) await refreshEvents();
  _onReady?.();
}

// --- Внешний API модуля ---

let _onReady = null;
let _onSigninChange = null;

export function onGoogleReady(cb){ _onReady = cb; }
export function onSigninChange(cb){ _onSigninChange = cb; }

export function signIn(){ gapi.auth2.getAuthInstance().signIn(); }
export function signOut(){ gapi.auth2.getAuthInstance().signOut(); }

export function isAuthorized(){ return gIsReady && isSignedIn; }

export async function refreshEvents(){
  if (!gIsReady || !isSignedIn) return [];
  const resp = await gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    singleEvents: true,
    showDeleted: false,
    orderBy: 'startTime',
    maxResults: 100,
    conferenceDataVersion: 1
  });
  cache = (resp.result.items || []).map(ev => ({
    id: ev.id,
    title: ev.summary || '(без названия)',
    start: ev.start.dateTime || ev.start.date,
    end:   ev.end?.dateTime   || ev.end?.date,
    link:  ev.hangoutLink || null
  }));
  return cache;
}

export function getAllEvents(){ return cache.slice(); }

export function getNextEvent(){
  const now = Date.now();
  return cache
    .map(e => ({...e, t: new Date(e.start).getTime()}))
    .filter(e => e.t >= now)
    .sort((a,b)=>a.t-b.t)[0] || null;
}

export function getEventsForDay(isoDay /* YYYY-MM-DD */){
  return cache.filter(e => String(e.start).startsWith(isoDay));
}
