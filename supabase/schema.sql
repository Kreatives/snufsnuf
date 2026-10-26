-- Snufsnuf — schema Fase 1+2
-- Datamodel uit docs/architectuur-en-bouwplan.md.
--
-- RLS-posture is PROTOTYPE: zolang er nog geen auth is, leest en schrijft de
-- app met de anon/publishable key. providers en diensten zijn publiek leesbaar
-- (marktplaats); klanten, dieren, afspraken en holds staan nu ook open voor anon
-- zodat de demo werkt. Zodra auth (baasje-account + aanbieder-login) er is,
-- vervangen we de anon-policies door eigenaar-checks met auth.uid().

-- ─────────────────────────────────────────────────────────────────────────────
-- Providers (tenants, publiek leesbaar zodra actief)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.providers (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  category      text not null check (category in
                   ('trimsalon','kattentrimsalon','mobiele_trimmer','dagopvang','pension','uitlaatservice')),
  owner         text not null,
  city          text not null,
  distance_km   numeric(4,1) not null default 0,
  rating        numeric(2,1) not null default 0,
  review_count  integer not null default 0,
  blurb         text not null default '',
  species       text[] not null default '{}',
  skills        text[] not null default '{}',
  prikkelarm    boolean not null default false,
  mobiel        boolean not null default false,
  status        text not null default 'actief'
                  check (status in ('concept','in_review','actief','afgekeurd','verborgen','geschorst')),
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Diensten. Prijs/duur per maatklasse + vachttoeslag + ras-uitzondering als jsonb,
-- zodat de prijsmotor in src/lib/pricing.ts er 1-op-1 op werkt.
-- pricing:         [{ "sizeClass": "m", "priceCents": 5500, "durationMin": 75 }, ...]
-- coat_surcharge:  { "krul": { "extraMin": 30, "extraCents": 1500 }, ... }
-- breed_exceptions:[{ "breed": "Labradoodle", "priceCents": 8000, "durationMin": 120 }]
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.services (
  id               uuid primary key default gen_random_uuid(),
  provider_id      uuid not null references public.providers(id) on delete cascade,
  species          text not null,
  name             text not null,
  description      text not null default '',
  pricing          jsonb not null default '[]',
  coat_surcharge   jsonb not null default '{}',
  breed_exceptions jsonb not null default '[]',
  required_skills  text[] not null default '{}',
  buffer_min       integer not null default 15,
  indicative       boolean not null default true,
  status           text not null default 'published' check (status in ('concept','published')),
  created_at       timestamptz not null default now()
);
create index if not exists services_provider_id_idx on public.services (provider_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Klanten (baasjes) per aanbieder
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers(id) on delete cascade,
  name         text not null,
  email        text not null,
  phone        text not null default '',
  created_at   timestamptz not null default now()
);
create index if not exists customers_provider_id_idx on public.customers (provider_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Dieren — het datamoat-record
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.animals (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references public.customers(id) on delete cascade,
  name            text not null,
  species         text not null,
  breed           text,
  size_class      text not null check (size_class in ('xxs','xs','s','m','l','xl')),
  coat_type       text not null check (coat_type in ('glad','lang','krul','ruw','dubbel')),
  weight_kg       numeric(5,1),
  behavior        text[] not null default '{}',
  bite_risk       smallint not null default 0 check (bite_risk between 0 and 3),
  muzzle_required boolean not null default false,
  medical_note    text,
  top_note        varchar(140),
  photo_url       text,
  created_at      timestamptz not null default now()
);
create index if not exists animals_customer_id_idx on public.animals (customer_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Holds — voorkomt dubbele boeking, verloopt via TTL
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.holds (
  id               uuid primary key default gen_random_uuid(),
  provider_id      uuid not null references public.providers(id) on delete cascade,
  service_id       uuid not null references public.services(id) on delete cascade,
  starts_at        timestamptz not null,
  expires_at       timestamptz not null,
  idempotency_key  text unique,
  created_at       timestamptz not null default now()
);
create index if not exists holds_expires_at_idx on public.holds (expires_at);
create index if not exists holds_slot_idx on public.holds (provider_id, service_id, starts_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Afspraken — de transactie. Dier als snapshot (jsonb) zodat de daglijst klopt
-- ook als het dierprofiel later wijzigt.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.appointments (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid not null references public.providers(id) on delete cascade,
  service_id    uuid not null references public.services(id) on delete restrict,
  customer_id   uuid references public.customers(id) on delete set null,
  animal        jsonb not null,
  owner_name    text not null,
  service_name  text not null,
  staff         text not null default '',
  starts_at     timestamptz not null,
  duration_min  integer not null,
  price_cents   integer not null,
  status        text not null default 'bevestigd'
                  check (status in ('aanvraag','bevestigd','verwacht','aanwezig','in_behandeling','klaar','opgehaald','no_show','geannuleerd')),
  intake        jsonb not null default '{}',
  idempotency_key text unique,
  created_at    timestamptz not null default now()
);
create index if not exists appointments_provider_day_idx on public.appointments (provider_id, starts_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.providers    enable row level security;
alter table public.services     enable row level security;
alter table public.customers    enable row level security;
alter table public.animals      enable row level security;
alter table public.holds        enable row level security;
alter table public.appointments enable row level security;

-- Publieke marktplaats: iedereen mag actieve aanbieders en gepubliceerde diensten lezen
create policy "providers publiek leesbaar" on public.providers
  for select to anon, authenticated using (status = 'actief');

create policy "diensten publiek leesbaar" on public.services
  for select to anon, authenticated using (status = 'published');

-- PROTOTYPE-policies: zolang er geen auth is, mag anon de demo-data lezen en
-- boekingen aanmaken. Vervangen zodra auth live is (eigenaar-checks).
create policy "proto klanten" on public.customers
  for all to anon, authenticated using (true) with check (true);

create policy "proto dieren" on public.animals
  for all to anon, authenticated using (true) with check (true);

create policy "proto holds" on public.holds
  for all to anon, authenticated using (true) with check (true);

create policy "proto afspraken" on public.appointments
  for all to anon, authenticated using (true) with check (true);
