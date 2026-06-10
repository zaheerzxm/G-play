-- Personal profile blocks (run if user_blocks table is missing)
create table if not exists user_blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_no_self check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocked_idx on user_blocks (blocked_id);

alter table user_blocks enable row level security;

drop policy if exists "user_blocks read" on user_blocks;
drop policy if exists "user_blocks insert" on user_blocks;
drop policy if exists "user_blocks delete" on user_blocks;

create policy "user_blocks read" on user_blocks for select using (true);
create policy "user_blocks insert" on user_blocks for insert with check (true);
create policy "user_blocks delete" on user_blocks for delete using (true);
