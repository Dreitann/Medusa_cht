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
  time text
);

-- homework
create table homework (
  id serial primary key,
  user_id bigint references users(id),
  filename text,
  uploaded_at timestamp default now()
);

alter table users enable row level security;
alter table schedule enable row level security;
alter table homework enable row level security;

create policy "Allow read" on schedule for select using (true);
create policy "Allow insert" on homework for insert with check (true);
