create or replace function da_is_admin()
returns boolean as $$
  select exists (
    select 1 from da_profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- da_profiles
alter table da_profiles enable row level security;
create policy "admin: full access" on da_profiles for all using (da_is_admin());
create policy "public: read only" on da_profiles for select using (true);

-- da_shifts
alter table da_shifts enable row level security;
create policy "admin: full access" on da_shifts for all using (da_is_admin());
create policy "public: read only" on da_shifts for select using (true);

-- da_schedule_entries
alter table da_schedule_entries enable row level security;
create policy "admin: full access" on da_schedule_entries for all using (da_is_admin());
create policy "public: read only" on da_schedule_entries for select using (true);

-- da_holidays
alter table da_holidays enable row level security;
create policy "admin: full access" on da_holidays for all using (da_is_admin());
create policy "public: read only" on da_holidays for select using (true);
