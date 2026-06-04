create view public_profiles as
  select id, full_name, role
  from profiles
  where is_active = true;
