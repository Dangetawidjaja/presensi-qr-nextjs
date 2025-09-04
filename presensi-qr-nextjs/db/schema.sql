create table if not exists public.passes (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  participant_name text not null,
  participant_email text,
  token_hash text not null unique,
  used_at timestamptz
);
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  participant_name text not null,
  participant_email text,
  scanned_at timestamptz not null default now(),
  method text not null default 'self',
  ip text,
  user_agent text
);
create index if not exists idx_passes_event on public.passes(event_id);
create index if not exists idx_passes_token_hash on public.passes(token_hash);
