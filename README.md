# Telegram Student WebApp (Supabase)

## 🔧 Setup Steps

1. Deploy `index.html` to GitHub Pages
2. In Supabase:
   - Go to SQL Editor → Paste contents of `schema.sql` (обновлено: `groups`, `students`, расширенное расписание с duration/group)
   - Create bucket "homework" in Storage (public)
   - Create bucket "videos" in Storage (public)
3. Done! It will:
   - Fetch lessons from schedule table + Google Calendar (если подключен)
   - Upload files to storage
   - Recognize users by Telegram ID

## 🔑 Secrets
- Скопируй `env.sample.js` → `env.js` (не коммитится) и заполни `SUPABASE_URL`, `SUPABASE_KEY`, Google ключи при необходимости.
- `env.js` уже подключается в `index.html` до остальных скриптов.
- Для бота: скопируй `backend/.env.example` → `backend/.env` и пропиши `BOT_TOKEN`.
- `TEACHER_IDS` в `env.js` — список Telegram ID через запятую; для них появится форма добавления событий в расписание.


## 🤖 Telegram Bot Setup

1. Установи зависимости:
   ```
   pip install aiogram
   ```

2. Запусти `bot.py`:
   ```
   python bot.py
   ```

3. Бот будет отвечать и предлагать WebApp через Telegram

⚠️ Убедись, что URL в `WebAppInfo(...)` совпадает с твоей ссылкой GitHub Pages.
