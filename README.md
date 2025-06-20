# Telegram Student WebApp (Supabase)

## 🔧 Setup Steps

1. Deploy `index.html` to GitHub Pages
2. In Supabase:
   - Go to SQL Editor → Paste contents of `schema.sql`
   - Create bucket "homework" in Storage (public)
3. Done! It will:
   - Fetch lessons from schedule table
   - Upload files to storage
   - Recognize users by Telegram ID


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

