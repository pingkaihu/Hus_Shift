create table da_shifts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  start_time time not null,
  end_time   time not null,
  color      text not null default '#888888'
);
