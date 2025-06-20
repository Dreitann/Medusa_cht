const tg = window.Telegram.WebApp;
tg.expand();

const userId = tg.initDataUnsafe.user?.id || 0;
const firstName = tg.initDataUnsafe.user?.first_name || "Ученик";
document.getElementById("username").innerText = firstName;

function switchTab(id) {
  document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tabbar .tab').forEach(t => {
    if (t.getAttribute('onclick').includes(id)) {
      t.classList.add('active');
    }
  });
}

async function uploadHomework() {
  const fileInput = document.getElementById("hwfile");
  const file = fileInput.files[0];
  const filePath = `${userId}/${Date.now()}_${file.name}`;

  const { data, error } = await supabase.storage.from("homework").upload(filePath, file);
  document.getElementById("upload-status").innerText = error
    ? "❌ Ошибка: " + error.message
    : "✅ Загружено: " + data.path;
}

async function loadSchedule() {
  const { data, error } = await supabase
    .from("schedule")
    .select("*")
    .eq("user_id", userId);

  const list = document.getElementById("schedule-list");
  list.innerHTML = "";

  if (error || data.length === 0) {
    list.innerHTML = "<li>Расписание не найдено</li>";
    return;
  }

  data.forEach(item => {
    const li = document.createElement("li");
    li.innerText = `${item.day} ${item.time} — ${item.subject}`;
    list.appendChild(li);
  });
}

loadSchedule();
