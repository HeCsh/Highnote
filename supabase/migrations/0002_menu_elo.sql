-- HighNote — Menu Elo: menu items + pairwise comparisons.
-- Safe to paste into the Supabase SQL editor and run (idempotent).
-- Item ids are stable text slugs (not uuid) so the client's static menu works
-- identically in local-fallback and Supabase modes without a lookup round-trip.

-- ---- menu_items ----
create table if not exists public.menu_items (
  id               text        primary key,
  restaurant_slug  text        not null,
  name             text        not null,
  emoji            text,
  section          text        not null,
  active           boolean     not null default true,
  created_at       timestamptz not null default now()
);

grant select on public.menu_items to anon, authenticated;
alter table public.menu_items enable row level security;

drop policy if exists "read demo menu" on public.menu_items;
create policy "read demo menu"
  on public.menu_items for select
  to anon, authenticated
  using (restaurant_slug = 'fog-and-fern');

-- Seed the Fog & Fern menu (idempotent).
insert into public.menu_items (id, restaurant_slug, name, emoji, section) values
  ('mushroom-toast',        'fog-and-fern', 'Mushroom Toast',        '🍄', 'Starters'),
  ('little-gem-salad',      'fog-and-fern', 'Little Gem Salad',      '🥬', 'Starters'),
  ('crispy-brussels',       'fog-and-fern', 'Crispy Brussels',       '🥦', 'Starters'),
  ('pan-seared-halibut',    'fog-and-fern', 'Pan-Seared Halibut',    '🐟', 'Mains'),
  ('half-roast-chicken',    'fog-and-fern', 'Half Roast Chicken',    '🍗', 'Mains'),
  ('squash-risotto',        'fog-and-fern', 'Squash Risotto',        '🎃', 'Mains'),
  ('dry-aged-burger',       'fog-and-fern', 'Dry-Aged Burger',       '🍔', 'Mains'),
  ('olive-oil-cake',        'fog-and-fern', 'Olive Oil Cake',        '🍰', 'Desserts'),
  ('chocolate-pot-de-creme','fog-and-fern', 'Chocolate Pot de Crème','🍫', 'Desserts'),
  ('affogato',              'fog-and-fern', 'Affogato',              '☕', 'Desserts'),
  ('house-negroni',         'fog-and-fern', 'House Negroni',         '🍸', 'Drinks'),
  ('fog-cutter',            'fog-and-fern', 'Fog Cutter',            '🍹', 'Drinks')
on conflict (id) do nothing;

-- ---- comparisons ----
create table if not exists public.comparisons (
  id               uuid        primary key default gen_random_uuid(),
  restaurant_slug  text        not null,
  item_a           text        not null references public.menu_items(id),
  item_b           text        not null references public.menu_items(id),
  winner           text        references public.menu_items(id),   -- null = tie
  feedback_id      uuid        references public.feedback(id),
  table_number     text        not null default '',
  created_at       timestamptz not null default now()
);

create index if not exists comparisons_slug_created_idx
  on public.comparisons (restaurant_slug, created_at desc);

alter table public.comparisons replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.comparisons;
exception when duplicate_object then null;
end $$;

grant select, insert on public.comparisons to anon, authenticated;
alter table public.comparisons enable row level security;

-- Mirrors the feedback table's demo policy.
drop policy if exists "anon insert demo comparison" on public.comparisons;
create policy "anon insert demo comparison"
  on public.comparisons for insert
  to anon, authenticated
  with check (restaurant_slug = 'fog-and-fern');

drop policy if exists "read demo comparisons" on public.comparisons;
create policy "read demo comparisons"
  on public.comparisons for select
  to anon, authenticated
  using (restaurant_slug = 'fog-and-fern');
