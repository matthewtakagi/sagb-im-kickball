-- Kickball app store. One row keeps the same JSON shape as data/store.json
-- so scoring, lineups, and stats stay atomic on Vercel.

create table if not exists public.kickball_store (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{"players":[],"games":[],"plays":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.kickball_store (id, data)
values (1, '{"players":[],"games":[],"plays":[]}'::jsonb)
on conflict (id) do nothing;

alter table public.kickball_store enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'kickball_store'
      and policyname = 'Public can read kickball store'
  ) then
    create policy "Public can read kickball store"
      on public.kickball_store
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;

-- Writes go through the Next.js server with the service role key, which bypasses RLS.
