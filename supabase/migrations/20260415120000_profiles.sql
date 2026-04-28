-- Profiles linked to auth.users. Run in Supabase SQL Editor or via `supabase db push`.
-- Creates RLS and trigger to insert a row on signup (username is not unique).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles
  for update
  using (auth.uid() = id);

drop policy if exists "Profiles insertable by owner" on public.profiles;
create policy "Profiles insertable by owner"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_username text;
  meta_url text;
  final_username text;
begin
  meta_username := nullif(trim(new.raw_user_meta_data->>'username'), '');
  meta_url := nullif(trim(new.raw_user_meta_data->>'website_url'), '');

  final_username := coalesce(
    meta_username,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 12)
  );

  insert into public.profiles (id, username, website_url)
  values (new.id, final_username, meta_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
