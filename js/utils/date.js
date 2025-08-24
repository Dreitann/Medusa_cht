export function toISODate(d){
  return new Date(d).toISOString().slice(0,10); // YYYY-MM-DD
}

export function fmtDateTimeRu(d){
  const nd = new Date(d);
  const date = nd.toLocaleDateString('ru-RU',{day:'2-digit',month:'long'});
  const time = nd.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  return `${date} ${time}`;
}
