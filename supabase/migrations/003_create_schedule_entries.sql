create table schedule_entries (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  shift_id   uuid not null references shifts(id) on delete cascade,
  work_date  date not null,
  note       text,
  created_at timestamptz not null default now(),

  unique (profile_id, shift_id, work_date)
);

create index on schedule_entries (work_date);
create index on schedule_entries (profile_id);
