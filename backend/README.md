## Заполнение ролей в Supabase

Фронт сейчас работает на publishable (anon) ключе, поэтому RLS не знает auth.uid. Роль учителя берём из таблицы `users`.

1. Создай пользователя (или обнови существующего) в `public.users`:
   - id = Telegram ID (bigint)
   - role = `teacher`
2. В SQL Editor добавь/проверь политики (если не применял schema.sql):
```sql
alter table users enable row level security;
alter table schedule enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='users' and policyname='Allow upsert') then
    create policy "Allow upsert" on users for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='users' and policyname='Allow read') then
    create policy "Allow read" on users for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='schedule' and policyname='Allow insert') then
    create policy "Allow insert" on schedule for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='schedule' and policyname='Allow read') then
    create policy "Allow read" on schedule for select using (true);
  end if;
end$$;
```

Важно: insert в `users` и `schedule` должен быть разрешён для роли `anon`, иначе WebApp не сможет передать данные при первом входе.
3. Формат даты/времени в расписании: `day` = `YYYY-MM-DD`, `time` = `HH:MM`.

Для полноценного контроля доступа можно перейти на Supabase Auth и кастомный JWT (Telegram ID → JWT), тогда RLS можно завязать на `auth.uid()`.
