-- Global kiss event stream + daily aggregates.
create extension if not exists pgcrypto;

create table if not exists public.kiss_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  type text not null default 'kiss',
  value integer not null default 1,
  metadata jsonb
);

create index if not exists kiss_events_created_at_idx on public.kiss_events (created_at desc);
create index if not exists kiss_events_type_created_at_idx on public.kiss_events (type, created_at desc);

alter table public.kiss_events enable row level security;

drop policy if exists "public_read_kiss_events" on public.kiss_events;
create policy "public_read_kiss_events"
on public.kiss_events
for select
to anon, authenticated
using (true);

drop policy if exists "public_insert_kiss_events" on public.kiss_events;
create policy "public_insert_kiss_events"
on public.kiss_events
for insert
to anon, authenticated
with check (
  type = 'kiss'
  and value between 1 and 10
);

create table if not exists public.daily_kiss_stats (
  day date primary key,
  total_kisses integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.daily_kiss_stats enable row level security;

drop policy if exists "public_read_daily_kiss_stats" on public.daily_kiss_stats;
create policy "public_read_daily_kiss_stats"
on public.daily_kiss_stats
for select
to anon, authenticated
using (true);

create or replace function public.sync_daily_kiss_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_day date;
  event_value integer;
begin
  if new.type <> 'kiss' then
    return new;
  end if;

  event_day := timezone('utc', new.created_at)::date;
  event_value := greatest(coalesce(new.value, 1), 1);

  insert into public.daily_kiss_stats (day, total_kisses)
  values (event_day, event_value)
  on conflict (day)
  do update set
    total_kisses = public.daily_kiss_stats.total_kisses + excluded.total_kisses,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists kiss_events_daily_stats_trigger on public.kiss_events;
create trigger kiss_events_daily_stats_trigger
after insert on public.kiss_events
for each row
execute function public.sync_daily_kiss_stats();

insert into public.daily_kiss_stats (day, total_kisses)
select timezone('utc', created_at)::date as day, sum(greatest(coalesce(value, 1), 1)) as total_kisses
from public.kiss_events
where type = 'kiss'
group by 1
on conflict (day)
do update set
  total_kisses = excluded.total_kisses,
  updated_at = timezone('utc', now());

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'kiss_events'
  ) then
    execute 'alter publication supabase_realtime add table public.kiss_events';
  end if;
end
$$;
