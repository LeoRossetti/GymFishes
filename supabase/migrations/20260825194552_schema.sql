create table profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text not null check (char_length(display_name) between 2 and 20),
  fish_variant  text not null default 'guppy',
  accent        text not null default 'blue',
  created_at    timestamptz not null default now()
);

create table groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 40),
  invite_code  text not null unique check (invite_code ~ '^[A-Z2-9]{6}$'),
  created_by   uuid not null references profiles(id),
  created_at   timestamptz not null default now()
);

create table group_members (
  group_id    uuid not null references groups(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (group_id, profile_id)
);

create table bottles (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 30),
  volume_ml    int  not null check (volume_ml between 1 and 10000),
  emoji        text,
  archived_at  timestamptz,
  created_at   timestamptz not null default now()
);

create table entries (
  id           uuid primary key,
  profile_id   uuid not null references profiles(id) on delete cascade,
  group_id     uuid not null references groups(id)   on delete cascade,
  total_ml     int  not null check (total_ml between 1 and 20000),
  composition  jsonb not null default '[]'::jsonb,
  note         text check (char_length(note) <= 140),
  photo_path   text,
  thumb_path   text,
  drank_at     timestamptz not null,
  drank_on     date not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index entries_group_updated_idx on entries (group_id, updated_at);
create index entries_group_day_idx     on entries (group_id, drank_on);

-- drank_on cannot be a generated column: `at time zone` is STABLE, not IMMUTABLE.
create or replace function set_entry_day() returns trigger
language plpgsql as $$
begin
  new.drank_on   := (new.drank_at at time zone 'America/Sao_Paulo')::date;
  new.updated_at := now();
  return new;
end $$;

create trigger entries_set_day
  before insert or update on entries
  for each row execute function set_entry_day();
