-- Run once in Supabase SQL Editor (fixes "video_sync column not found")
alter table rooms add column if not exists video_room jsonb not null default '{}'::jsonb;

-- Optional legacy columns (safe if already added)
alter table rooms add column if not exists video_youtube_id text;
alter table rooms add column if not exists video_title text;
alter table rooms add column if not exists video_sync jsonb not null default '{}'::jsonb;
