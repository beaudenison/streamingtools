create table if not exists users (
  id uuid primary key,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key,
  user_id uuid not null references users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists connections (
  id uuid primary key,
  user_id uuid not null references users (id) on delete cascade,
  platform text not null check (platform in ('twitch', 'kick')),
  platform_user_id text not null,
  login text not null,
  display_name text not null,
  access_token_enc text not null,
  refresh_token_enc text not null,
  expires_at timestamptz,
  scopes text not null,
  needs_reauth boolean not null default false,
  webhook_secret_enc text,
  last_error text,
  unique (platform, platform_user_id),
  unique (user_id, platform)
);

create table if not exists oauth_states (
  state text primary key,
  platform text not null,
  code_verifier text,
  user_id uuid references users (id) on delete cascade,
  return_to text not null,
  expires_at timestamptz not null
);

create table if not exists subscriptions (
  id uuid primary key,
  connection_id uuid not null references connections (id) on delete cascade,
  platform text not null,
  external_id text,
  event_type text not null,
  status text not null,
  unique (connection_id, event_type)
);

create table if not exists alert_configs (
  user_id uuid primary key references users (id) on delete cascade,
  overlay_key text not null unique,
  settings jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists chat_configs (
  user_id uuid primary key references users (id) on delete cascade,
  overlay_key text not null unique,
  settings jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists alert_events (
  id uuid primary key,
  user_id uuid not null references users (id) on delete cascade,
  platform text not null,
  type text not null,
  name text not null,
  amount integer,
  message text,
  dedupe_key text not null,
  is_test boolean not null default false,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique (user_id, dedupe_key)
);

create index if not exists alert_events_pull
  on alert_events (user_id, created_at);
