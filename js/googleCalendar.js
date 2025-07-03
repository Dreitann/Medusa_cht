// js/googleCalendar.js

// 1) Ваши ключи из Google Cloud Console
const CLIENT_ID     = '156070127304-l8lqdcetr3rqdln2sfm59a1iu8is421l.apps.googleusercontent.com';
const API_KEY       = 'AIzaSyALADqAQwTUzs1pLyI_ORMI8SULs5T0HN8';

// 2) Настройки Google Calendar API
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES         = 'https://www.googleapis.com/auth/calendar.events.readonly';

// UI-элементы
const authorizeButton = document.getElementById('authorize-button');
const nextContent     = document.getElementById('next-event-content');
const calendarEl      = document.getElementById('calendar');
const eventListEl     = document.getElementById('event-list');

let events = [], calendar = null;

/** Загружает GAPI и вызывает initClient */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}
// Делаем функцию доступной глобально для onload
window.handleClientLoad = handleClientLoad;

/** Инициализация клиента */
async function initClient() {
  await gapi.client.init({
    apiKey:       API_KEY,
    clientId:     CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope:        SCOPES
  });

  // слушаем изменения статуса входа
  gapi.auth2.getAuthInstance()
     .isSignedIn.listen(updateSigninStatus);
  // первоначальное состояние
  updateSigninStatus(
    gapi.auth2.getAuthInstance().isSignedIn.get()
  );
  // привязываем кнопку
  authorizeButton.onclick = () =>
    gapi.auth2.getAuthInstance().signIn();
}

/** Обновление интерфейса при смене статуса */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    loadEvents();
  } else {
    authorizeButton.style.display = 'inline-block';
    nextContent.textContent = 'Пожалуйста, авторизуйтесь';
  }
}

/** Загружаем события из Google Calendar */
async function loadEvents() {
  const resp = await gapi.client.calendar.events.list({
    calendarId:          'primary',
    timeMin:             (new Date()).toISOString(),
    showDeleted:         false,
    singleEvents:        true,
    orderBy:             'startTime',
    maxResults:          50,
    conferenceDataVersion: 1
  });

  events = (resp.result.items || []).map(ev => ({
    summary: ev.summary || '(без названия)',
    start:   ev.start.dateTime || ev.start.date,
    end:     ev.end.dateTime   || ev.end.date,
    meetup:  ev.hangoutLink || ''
  }));

  renderNextEvent();
  renderCalendar();
}

/** Отрисовываем ближайшее событие */
function renderNextEvent() {
  const now    = Date.now();
  const future = events
    .map(ev => ({ ...ev, ts: new Date(ev.start).getTime() }))
    .filter(ev => ev.ts >= now)
    .sort((a,b) => a.ts - b.ts);

  if (!future.length) {
    nextContent.textContent = 'Нет предстоящих событий';
    return;
  }

  const ev = future[0];
  const d  = new Date(ev.start);
  nextContent.innerHTML = `
    <strong>${ev.summary}</strong><br>
    ${d.toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}
    ${d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}
  `;
}

/** Отрисовываем FullCalendar */
function renderCalendar() {
  if (calendar) calendar.destroy();

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale:     'ru',
    events:     events.map(ev => ({
      title: ev.summary,
      start: ev.start,
      extendedProps: { meetup: ev.meetup }
    })),
    eventClick: info => {
      const link = info.event.extendedProps.meetup;
      if (link) window.open(link, '_blank');
    },
    dateClick: info => {
      const day  = info.dateStr;
      const list = events.filter(e => e.start.startsWith(day));
      eventListEl.innerHTML = list.length
        ? list.map(e =>
            `<li>${e.start.slice(11,16)} – ${e.summary}</li>`
          ).join('')
        : '<li>Нет событий на эту дату</li>';
    }
  });

  calendar.render();
}