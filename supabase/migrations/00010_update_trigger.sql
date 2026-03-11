-- Migration 00010: Update handle_new_user trigger to extract entity_id and phone
-- Depends on: 00002_entities.sql (entity_id column in profiles)

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role, entity_id, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    case
      when coalesce(new.raw_user_meta_data->>'user_type', '') = 'admin'
        then 'admin'::public.user_role
      else 'employee'::public.user_role
    end,
    nullif(new.raw_user_meta_data->>'entity_id', '')::uuid,
    nullif(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$ language plpgsql security definer;
