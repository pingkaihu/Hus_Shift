create view da_public_profiles as
  select id, full_name, role
  from da_profiles
  where is_active = true;
