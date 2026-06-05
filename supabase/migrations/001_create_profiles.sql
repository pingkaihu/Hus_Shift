create table da_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  email       text not null,
  phone       text,
  role        text not null default 'staff' check (role in ('admin', 'staff')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Auto-create da_profiles row when a new auth user is created
create or replace function da_handle_new_user()
returns trigger as $$
begin
  insert into public.da_profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer set search_path = '';

create trigger da_on_auth_user_created
  after insert on auth.users
  for each row execute function da_handle_new_user();
