-- Product field structure templates per client (profile). RLS: owner only.

create table if not exists public.product_templates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_templates_fields_is_array_check
    check (jsonb_typeof(fields) = 'array')
);

create index if not exists product_templates_client_updated_idx
  on public.product_templates (client_id, updated_at desc);

alter table public.product_templates enable row level security;

drop policy if exists "Product templates viewable by owner" on public.product_templates;
create policy "Product templates viewable by owner"
  on public.product_templates
  for select
  using (auth.uid() = client_id);

drop policy if exists "Product templates insertable by owner" on public.product_templates;
create policy "Product templates insertable by owner"
  on public.product_templates
  for insert
  with check (auth.uid() = client_id);

drop policy if exists "Product templates updatable by owner" on public.product_templates;
create policy "Product templates updatable by owner"
  on public.product_templates
  for update
  using (auth.uid() = client_id);

drop policy if exists "Product templates deletable by owner" on public.product_templates;
create policy "Product templates deletable by owner"
  on public.product_templates
  for delete
  using (auth.uid() = client_id);

create or replace function public.product_templates_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists product_templates_set_updated_at on public.product_templates;
create trigger product_templates_set_updated_at
  before update on public.product_templates
  for each row execute procedure public.product_templates_set_updated_at();
