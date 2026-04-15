-- Site analyses persisted for each user after the pipeline finishes (completed or failed).
-- Inserts use the caller JWT (see insert policy); in-flight state is not stored here.
-- RLS allows owners to read their rows if accessed directly from Supabase clients.

create table if not exists public.site_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null,
  status text not null
    constraint site_analyses_status_check
    check (status in ('completed', 'failed')),
  product_count integer not null default 0,
  cms_type text
    constraint site_analyses_cms_type_check
    check (cms_type is null or cms_type in ('woocommerce', 'shopify', 'prestashop', 'unknown')),
  error_message text,
  vertical_summary text,
  catalog_match_categories text[],
  brands_list text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_analyses_user_updated_idx
  on public.site_analyses (user_id, updated_at desc);

alter table public.site_analyses enable row level security;

drop policy if exists "Site analyses viewable by owner" on public.site_analyses;
create policy "Site analyses viewable by owner"
  on public.site_analyses
  for select
  using (auth.uid() = user_id);

drop policy if exists "Site analyses insertable by owner" on public.site_analyses;
create policy "Site analyses insertable by owner"
  on public.site_analyses
  for insert
  with check (auth.uid() = user_id);
