-- Add color column to profiles
alter table public.profiles add column if not exists color text;

-- Update handle_new_user to include a default color or keep it null
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, avatar_url, color)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    null -- will fallback to letter-based in UI
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
