-- Privacy settings (FB-009). Safe to run multiple times in Supabase SQL Editor.

alter table profiles
  add column if not exists privacy_settings jsonb not null default '{}';
