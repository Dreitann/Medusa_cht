-- users (Telegram auth)
create table if not exists users (
  id bigint primary key,
  first_name text,
  role text
);

-- groups (для занятий)
create table if not exists groups (
  id serial primary key,
  name text not null
);

-- students (привязка Telegram id к группе)
create table if not exists students (
  id bigint primary key,
  name text,
  group_id int references groups(id)
);

-- schedule
create table if not exists schedule (
  id serial primary key,
  user_id bigint references users(id),
  student_id bigint references students(id),
  group_id int references groups(id),
  subject text,
  day text,
  time text,
  meet_link text,
  status text default 'planned',
  duration_minutes int,
  group_name text
);

-- homework
create table if not exists homework (
  id serial primary key,
  user_id bigint references users(id),
  filename text,
  file_path text,
  uploaded_at timestamp default now()
);

-- videos
create table if not exists videos (
  id serial primary key,
  title text,
  file_path text,
  uploaded_by text,
  uploaded_at timestamp default now()
);

alter table users enable row level security;
alter table schedule enable row level security;
alter table homework enable row level security;
alter table videos enable row level security;

create policy "Allow read" on groups for select using (true);
create policy "Allow insert" on groups for insert with check (true);

create policy "Allow read" on students for select using (true);
create policy "Allow insert" on students for insert with check (true);
create policy "Allow update" on students for update using (true);

create policy "Allow read" on users for select using (true);
create policy "Allow upsert" on users for insert with check (true);
create policy "Allow read" on schedule for select using (true);
create policy "Allow insert" on schedule for insert with check (true);
create policy "Allow update" on schedule for update using (true);
create policy "Allow insert" on homework for insert with check (true);
create policy "Allow read" on homework for select using (true);
create policy "Allow read" on videos for select using (true);
create policy "Allow insert" on videos for insert with check (true);

-- Удаляем дефолт роли, чтобы новая запись создавалась без роли
alter table users alter column role drop default;
