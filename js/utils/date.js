export function toISODate(d){
  return new Date(d).toISOString().slice(0,10); // YYYY-MM-DD
}

export function fmtDateTimeRu(d){
  const nd = new Date(d);
  const date = nd.toLocaleDateString('ru-RU',{day:'2-digit',month:'long'});
  const time = nd.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  return `${date} ${time}`;
}

export function combineDayTime(day, time){
  if (!day) return null;
  const iso = time ? `${day}T${time}` : day;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}
