-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, full_name)
  values (gen_random_uuid(), new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill profile for existing users
insert into public.profiles (id, user_id, full_name)
select gen_random_uuid(), u.id, coalesce(u.raw_user_meta_data->>'full_name', '')
from auth.users u
where not exists (select 1 from public.profiles p where p.user_id = u.id);
