create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- profiles
alter table profiles enable row level security;
create policy "admin: full access" on profiles for all using (is_admin());
create policy "public: read only" on profiles for select using (true);

-- shifts
alter table shifts enable row level security;
create policy "admin: full access" on shifts for all using (is_admin());
create policy "public: read only" on shifts for select using (true);

-- schedule_entries
alter table schedule_entries enable row level security;
create policy "admin: full access" on schedule_entries for all using (is_admin());
create policy "public: read only" on schedule_entries for select using (true);

-- holidays
alter table holidays enable row level security;
create policy "admin: full access" on holidays for all using (is_admin());
create policy "public: read only" on holidays for select using (true);
