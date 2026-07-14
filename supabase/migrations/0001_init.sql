-- HighNote — feedback persistence + realtime for the live demo loop.
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.

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

-- Realtime: broadcast INSERTs on this table (the dashboard subscribes to "feedback-live").
alter publication supabase_realtime add table public.feedback;

-- Row Level Security.
alter table public.feedback enable row level security;

-- Demo policy: anonymous guests may insert feedback for the demo restaurant, and
-- anyone may read it (the dashboard is a public demo). Tighten per-tenant for production.
create policy "anon insert demo feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (restaurant_slug = 'fog-and-fern');

create policy "read demo feedback"
  on public.feedback for select
  to anon, authenticated
  using (restaurant_slug = 'fog-and-fern');
