-- Toegepast na schema.sql (via Supabase MCP). Hier vastgelegd voor reproduceerbaarheid.

-- ── Data API GRANTs (RLS bewaakt de rijen, GRANT bepaalt tabel-toegang) ──────
grant select on public.providers to anon, authenticated;
grant select on public.services  to anon, authenticated;
grant select, insert, update, delete on public.customers    to anon, authenticated;
grant select, insert, update, delete on public.holds         to anon, authenticated;
grant select, insert, update, delete on public.appointments  to anon, authenticated;

-- ── Auth: profielen met rol ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  role         text not null default 'baasje' check (role in ('aanbieder','baasje')),
  display_name text,
  created_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to authenticated;

create policy "eigen profiel zichtbaar" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "eigen profiel bewerken" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Profiel automatisch aanmaken bij signup, met rol uit de metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'baasje'),
    new.raw_user_meta_data->>'display_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
-- Niet aanroepbaar als RPC door anon/authenticated (security-advisor).
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Aanbieder: eigenaarschap + bedrijfsvelden ───────────────────────────────
alter table public.providers add column if not exists owner_user_id uuid references auth.users on delete set null;
alter table public.providers add column if not exists kvk     text;
alter table public.providers add column if not exists phone   text;
alter table public.providers add column if not exists website text;
alter table public.providers add column if not exists address text;
grant insert, update on public.providers to authenticated;

create policy "aanbieder ziet eigen salon" on public.providers
  for select to authenticated using ((select auth.uid()) = owner_user_id);
create policy "aanbieder maakt salon" on public.providers
  for insert to authenticated with check ((select auth.uid()) = owner_user_id);
create policy "aanbieder bewerkt salon" on public.providers
  for update to authenticated using ((select auth.uid()) = owner_user_id) with check ((select auth.uid()) = owner_user_id);

-- ── Baasje: eigen dieren (vervangt de prototype-policy) ──────────────────────
alter table public.animals add column if not exists owner_user_id uuid references auth.users on delete cascade;
drop policy if exists "proto dieren" on public.animals;
revoke all on public.animals from anon;
grant select, insert, update, delete on public.animals to authenticated;
create policy "baasje beheert eigen dieren" on public.animals
  for all to authenticated
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);
