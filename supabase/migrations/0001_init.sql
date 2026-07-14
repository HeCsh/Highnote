-- HighNote — feedback persistence + realtime for the live demo loop.
-- Safe to paste into the Supabase SQL editor and run (idempotent — re-running is fine).

create table if not exists public.feedback (
  id               uuid primary key default gen_random_uuid(),
  restaurant_slug  text        not null,
  table_number     text        not null,
  rating           int         not null check (rating between 1 and 5),
  tags             text[]      not null default '{}',
  comment          text        not null default '',
  created_at       timestamptz not null default now()
);

create index if not exists feedback_slug_created_idx
  on public.feedback (restaurant_slug, created_at desc);

-- Full row image so realtime subscription filters work reliably.
alter table public.feedback replica identity full;

-- Realtime: broadcast changes on this table (the dashboard subscribes to "feedback-live").
do $$
begin
  alter publication supabase_realtime add table public.feedback;
exception
  when duplicate_object then null; -- already in the publication
end $$;

-- Table-level privileges for the demo's anonymous role (explicit, not relying on defaults).
grant select, insert on public.feedback to anon, authenticated;

-- Row Level Security.
alter table public.feedback enable row level security;

-- Demo policies: anonymous guests may insert feedback for the demo restaurant, and
-- anyone may read it (the dashboard is a public demo). Tighten per-tenant for production.
drop policy if exists "anon insert demo feedback" on public.feedback;
create policy "anon insert demo feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (restaurant_slug = 'fog-and-fern');

drop policy if exists "read demo feedback" on public.feedback;
create policy "read demo feedback"
  on public.feedback for select
  to anon, authenticated
  using (restaurant_slug = 'fog-and-fern');
