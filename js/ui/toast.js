const containerId = 'toast-container';

function ensureContainer(){
  let el = document.getElementById(containerId);
  if (!el){
    el = document.createElement('div');
    el.id = containerId;
    document.body.appendChild(el);
  }
  return el;
}

export function showToast(message, type='info', timeout=3200){
  const host = ensureContainer();
  const item = document.createElement('div');
  item.className = `toast toast-${type}`;
  item.textContent = message;
  host.appendChild(item);

  requestAnimationFrame(()=> item.classList.add('visible'));
  setTimeout(()=>{
    item.classList.remove('visible');
    setTimeout(()=>item.remove(), 200);
  }, timeout);
}
