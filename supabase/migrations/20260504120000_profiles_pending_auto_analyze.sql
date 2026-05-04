-- Add pending signup analysis flag; stop reading auth raw_user_meta_data on user insert.

alter table public.profiles
  add column if not exists pending_auto_analyze boolean not null default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  final_username text;
begin
  final_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 12);

  insert into public.profiles (id, username, website_url, pending_auto_analyze)
  values (new.id, final_username, null, false);

  return new;
end;
$$;
