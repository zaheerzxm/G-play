-- Profile fields used by Edit Profile, Nearby, Spotlight, and online friend status.
-- Safe to run multiple times in Supabase SQL Editor.

alter table profiles add column if not exists country text;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists last_active_at timestamptz;
alter table profiles add column if not exists avatar_3d jsonb;

create index if not exists profiles_last_active_idx on profiles (last_active_at desc);
