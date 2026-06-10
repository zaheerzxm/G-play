-- Word Battle (Wordle) — run once in Supabase SQL Editor

create table if not exists wordle_games (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  host_id uuid,
  secret_word text not null default '',
  status text not null default 'active' check (status in ('active', 'round_end', 'finished', 'cancelled')),
  round_number int not null default 1,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists wordle_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references wordle_games(id) on delete cascade,
  user_id uuid not null,
  nickname text,
  attempts_used int not null default 0,
  solved boolean not null default false,
  solve_time_ms int,
  score int not null default 0,
  rank int,
  updated_at timestamptz not null default now(),
  unique (game_id, user_id)
);

create table if not exists wordle_guesses (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references wordle_games(id) on delete cascade,
  user_id uuid not null,
  guess text not null check (char_length(guess) = 5),
  result jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists wordle_player_stats (
  user_id uuid primary key,
  games_played int not null default 0,
  games_won int not null default 0,
  rounds_won int not null default 0,
  current_streak int not null default 0,
  best_streak int not null default 0,
  total_attempts int not null default 0,
  total_solve_ms bigint not null default 0,
  rounds_solved int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists wordle_games_room_id_idx on wordle_games(room_id, started_at desc);
create index if not exists wordle_players_game_id_idx on wordle_players(game_id);
create index if not exists wordle_guesses_game_user_idx on wordle_guesses(game_id, user_id, created_at);
create index if not exists wordle_player_stats_wins_idx on wordle_player_stats(games_won desc);

alter table wordle_games enable row level security;
alter table wordle_players enable row level security;
alter table wordle_guesses enable row level security;
alter table wordle_player_stats enable row level security;

drop policy if exists "wordle_games read" on wordle_games;
create policy "wordle_games read" on wordle_games for select using (true);
drop policy if exists "wordle_games insert" on wordle_games;
create policy "wordle_games insert" on wordle_games for insert with check (true);
drop policy if exists "wordle_games update" on wordle_games;
create policy "wordle_games update" on wordle_games for update using (true) with check (true);

drop policy if exists "wordle_players read" on wordle_players;
create policy "wordle_players read" on wordle_players for select using (true);
drop policy if exists "wordle_players insert" on wordle_players;
create policy "wordle_players insert" on wordle_players for insert with check (true);
drop policy if exists "wordle_players update" on wordle_players;
create policy "wordle_players update" on wordle_players for update using (true) with check (true);

drop policy if exists "wordle_guesses read" on wordle_guesses;
create policy "wordle_guesses read" on wordle_guesses for select using (true);
drop policy if exists "wordle_guesses insert" on wordle_guesses;
create policy "wordle_guesses insert" on wordle_guesses for insert with check (true);

drop policy if exists "wordle_player_stats read" on wordle_player_stats;
create policy "wordle_player_stats read" on wordle_player_stats for select using (true);
drop policy if exists "wordle_player_stats upsert" on wordle_player_stats;
create policy "wordle_player_stats upsert" on wordle_player_stats for insert with check (true);
drop policy if exists "wordle_player_stats update" on wordle_player_stats;
create policy "wordle_player_stats update" on wordle_player_stats for update using (true) with check (true);

alter publication supabase_realtime add table wordle_games;
alter publication supabase_realtime add table wordle_players;
alter publication supabase_realtime add table wordle_guesses;
