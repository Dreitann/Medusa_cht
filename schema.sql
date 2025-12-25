-- users
create table users (
  id bigint primary key,
  first_name text,
  role text default 'student'
);

-- schedule
create table schedule (
  id serial primary key,
  user_id bigint references users(id),
  subject text,
  day text,
  time text,
  meet_link text
);

-- homework
create table homework (
  id serial primary key,
  user_id bigint references users(id),
  filename text,
  file_path text,
  uploaded_at timestamp default now()
);

-- videos
create table videos (
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

create policy "Allow read" on users for select using (true);
create policy "Allow upsert" on users for insert with check (true);
create policy "Allow read" on schedule for select using (true);
create policy "Allow insert" on homework for insert with check (true);
create policy "Allow read" on homework for select using (true);
create policy "Allow read" on videos for select using (true);
create policy "Allow insert" on videos for insert with check (true);
