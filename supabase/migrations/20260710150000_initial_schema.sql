create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Oddling user' check (char_length(display_name) between 1 and 40),
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.avatars (
  id uuid primary key,
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 12),
  seed text not null,
  traits jsonb not null,
  parts jsonb not null,
  mutation_count integer not null default 0 check (mutation_count >= 0),
  rebuild_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_prompts (
  id uuid primary key default gen_random_uuid(),
  avatar_id uuid not null references public.avatars(id) on delete cascade,
  local_date date not null,
  timezone text not null,
  question_id text not null,
  reroll_used boolean not null default false,
  created_at timestamptz not null default now(),
  unique (avatar_id, local_date)
);

create table public.daily_entries (
  id uuid primary key,
  avatar_id uuid not null references public.avatars(id) on delete cascade,
  question_id text not null,
  local_date date not null,
  timezone text not null,
  answer text not null check (char_length(answer) between 1 and 60),
  trait_delta jsonb not null,
  response_text text not null check (char_length(response_text) <= 84),
  created_at timestamptz not null default now(),
  unique (avatar_id, local_date)
);

create table public.mutations (
  id uuid primary key,
  entry_id uuid not null unique references public.daily_entries(id) on delete cascade,
  avatar_id uuid not null references public.avatars(id) on delete cascade,
  slot text not null check (slot in ('head', 'back', 'texture', 'handheld')),
  token text not null,
  label text not null,
  previous_token text,
  created_at timestamptz not null default now()
);

create table public.stickers (
  id uuid primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  avatar_id uuid not null references public.avatars(id) on delete cascade,
  kind text not null check (kind in ('daily', 'relationship')),
  title text not null check (char_length(title) <= 20),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table public.shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  avatar_id uuid not null references public.avatars(id) on delete cascade,
  public_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  public_snapshot jsonb not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.guest_interactions (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.shares(id) on delete cascade,
  visitor_id uuid not null,
  visitor_rate_hash text not null,
  action text not null check (action in ('poke', 'feed', 'label')),
  response_text text not null,
  sticker_payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (share_id, visitor_id)
);

create table public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  anonymous_session_id text,
  event_name text not null check (event_name in (
    'onboarding_started', 'onboarding_completed', 'daily_question_viewed',
    'daily_answer_submitted', 'mutation_revealed', 'share_created',
    'guest_interacted', 'guest_started_onboarding', 'pwa_installed'
  )),
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index daily_entries_avatar_created_idx on public.daily_entries (avatar_id, created_at desc);
create index mutations_avatar_created_idx on public.mutations (avatar_id, created_at desc);
create index stickers_owner_created_idx on public.stickers (owner_id, created_at desc);
create index shares_owner_created_idx on public.shares (owner_id, created_at desc);
create index guest_interactions_share_created_idx on public.guest_interactions (share_id, created_at desc);
create index product_events_name_created_idx on public.product_events (event_name, created_at desc);

alter table public.profiles enable row level security;
alter table public.avatars enable row level security;
alter table public.daily_prompts enable row level security;
alter table public.daily_entries enable row level security;
alter table public.mutations enable row level security;
alter table public.stickers enable row level security;
alter table public.shares enable row level security;
alter table public.guest_interactions enable row level security;
alter table public.product_events enable row level security;

create policy "profiles owner all" on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "avatars owner all" on public.avatars for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "prompts owner all" on public.daily_prompts for all to authenticated
  using (exists (select 1 from public.avatars a where a.id = avatar_id and a.owner_id = auth.uid()))
  with check (exists (select 1 from public.avatars a where a.id = avatar_id and a.owner_id = auth.uid()));
create policy "entries owner all" on public.daily_entries for all to authenticated
  using (exists (select 1 from public.avatars a where a.id = avatar_id and a.owner_id = auth.uid()))
  with check (exists (select 1 from public.avatars a where a.id = avatar_id and a.owner_id = auth.uid()));
create policy "mutations owner all" on public.mutations for all to authenticated
  using (exists (select 1 from public.avatars a where a.id = avatar_id and a.owner_id = auth.uid()))
  with check (exists (select 1 from public.avatars a where a.id = avatar_id and a.owner_id = auth.uid()));
create policy "stickers owner all" on public.stickers for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "shares owner all" on public.shares for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "events owner insert" on public.product_events for insert to authenticated with check (user_id = auth.uid());
create policy "events owner select" on public.product_events for select to authenticated using (user_id = auth.uid());

grant usage on schema public to authenticated;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.avatars to authenticated;
grant select, insert, update, delete on public.daily_prompts to authenticated;
grant select, insert, update, delete on public.daily_entries to authenticated;
grant select, insert, update, delete on public.mutations to authenticated;
grant select, insert, update, delete on public.stickers to authenticated;
grant select, insert, update, delete on public.shares to authenticated;
grant select, insert on public.product_events to authenticated;

create or replace function public.submit_daily_result(
  p_owner_id uuid,
  p_avatar_id uuid,
  p_entry jsonb,
  p_avatar_traits jsonb,
  p_avatar_parts jsonb,
  p_mutation_count integer,
  p_mutation jsonb,
  p_sticker jsonb
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_owner_id <> auth.uid() then raise exception 'not authorized'; end if;
  if exists (select 1 from daily_entries where avatar_id = p_avatar_id and local_date = (p_entry->>'date')::date) then return; end if;

  update avatars set traits = p_avatar_traits, parts = p_avatar_parts, mutation_count = p_mutation_count, updated_at = now()
  where id = p_avatar_id and owner_id = p_owner_id;

  insert into daily_entries (id, avatar_id, question_id, local_date, timezone, answer, trait_delta, response_text)
  values ((p_entry->>'id')::uuid, p_avatar_id, p_entry->>'questionId', (p_entry->>'date')::date,
    p_entry->>'timezone', p_entry->>'answer', p_entry->'traitDelta', p_entry->>'response');

  insert into mutations (id, entry_id, avatar_id, slot, token, label, previous_token)
  values ((p_mutation->>'id')::uuid, (p_entry->>'id')::uuid, p_avatar_id, p_mutation->>'slot',
    p_mutation->>'token', p_mutation->>'label', nullif(p_mutation->>'previousToken', ''));

  insert into stickers (id, owner_id, avatar_id, kind, title, payload)
  values ((p_sticker->>'id')::uuid, p_owner_id, p_avatar_id, 'daily', p_sticker->>'title', p_sticker);
end;
$$;

revoke all on function public.submit_daily_result(uuid, uuid, jsonb, jsonb, jsonb, integer, jsonb, jsonb) from public;
grant execute on function public.submit_daily_result(uuid, uuid, jsonb, jsonb, jsonb, integer, jsonb, jsonb) to authenticated;
