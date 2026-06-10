-- Mafia Voice Game — run once in Supabase SQL Editor
-- Requires: rooms table, auth.uid() for players

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists mafia_games (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  host_id uuid not null,
  status text not null default 'lobby'
    check (status in ('lobby', 'active', 'ended', 'cancelled')),
  phase text not null default 'lobby'
    check (phase in ('lobby', 'role_reveal', 'night', 'night_result', 'day', 'voting', 'game_over')),
  round_number int not null default 0,
  min_players int not null default 5,
  max_players int not null default 12,
  role_reveal_seconds int not null default 10,
  night_seconds int not null default 45,
  night_result_seconds int not null default 8,
  day_duration_seconds int not null default 90,
  voting_duration_seconds int not null default 45,
  reveal_roles_on_death boolean not null default false,
  allow_dead_chat boolean not null default true,
  winner_team text check (winner_team in ('mafia', 'village')),
  mvp_user_id uuid,
  phase_ends_at timestamptz,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists mafia_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references mafia_games(id) on delete cascade,
  user_id uuid not null,
  nickname text not null default 'Player',
  avatar_url text,
  role text check (role in ('mafia', 'doctor', 'detective', 'villager')),
  team text check (team in ('mafia', 'village')),
  is_alive boolean not null default true,
  is_ready boolean not null default false,
  is_host boolean not null default false,
  seat_number int,
  joined_at timestamptz not null default now(),
  eliminated_at timestamptz,
  elimination_reason text,
  unique (game_id, user_id)
);

create table if not exists mafia_actions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references mafia_games(id) on delete cascade,
  round_number int not null,
  phase text not null,
  actor_user_id uuid not null,
  target_user_id uuid,
  action_type text not null
    check (action_type in ('mafia_kill', 'doctor_save', 'detective_check', 'vote')),
  created_at timestamptz not null default now()
);

create table if not exists mafia_votes (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references mafia_games(id) on delete cascade,
  round_number int not null,
  voter_user_id uuid not null,
  target_user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (game_id, round_number, voter_user_id)
);

create table if not exists mafia_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references mafia_games(id) on delete cascade,
  round_number int not null default 0,
  event_type text not null,
  message text not null default '',
  public_data jsonb not null default '{}'::jsonb,
  private_user_id uuid,
  private_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists mafia_player_stats (
  user_id uuid primary key,
  games_played int not null default 0,
  games_won int not null default 0,
  games_lost int not null default 0,
  mafia_wins int not null default 0,
  villager_wins int not null default 0,
  times_mafia int not null default 0,
  times_doctor int not null default 0,
  times_detective int not null default 0,
  times_villager int not null default 0,
  doctor_saves int not null default 0,
  detective_finds int not null default 0,
  votes_survived int not null default 0,
  mvp_count int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists mafia_games_room_idx on mafia_games(room_id, created_at desc);
create index if not exists mafia_games_active_idx on mafia_games(room_id) where status in ('lobby', 'active');
create index if not exists mafia_players_game_idx on mafia_players(game_id);
create index if not exists mafia_events_game_idx on mafia_events(game_id, created_at);
create index if not exists mafia_votes_game_round_idx on mafia_votes(game_id, round_number);

-- Public view — no secret roles
create or replace view mafia_players_public as
select
  id, game_id, user_id, nickname, avatar_url,
  is_alive, is_ready, is_host, seat_number,
  joined_at, eliminated_at, elimination_reason
from mafia_players;

-- ============================================================
-- RLS
-- ============================================================

alter table mafia_games enable row level security;
alter table mafia_players enable row level security;
alter table mafia_actions enable row level security;
alter table mafia_votes enable row level security;
alter table mafia_events enable row level security;
alter table mafia_player_stats enable row level security;

drop policy if exists "mafia_games read" on mafia_games;
create policy "mafia_games read" on mafia_games for select using (true);

drop policy if exists "mafia_events read" on mafia_events;
create policy "mafia_events read" on mafia_events for select using (
  private_user_id is null or private_user_id = auth.uid()
);

drop policy if exists "mafia_players read own" on mafia_players;
create policy "mafia_players read own" on mafia_players for select using (user_id = auth.uid());

drop policy if exists "mafia_player_stats read" on mafia_player_stats;
create policy "mafia_player_stats read" on mafia_player_stats for select using (true);

-- Writes via security definer RPCs only
drop policy if exists "mafia_games write" on mafia_games;
drop policy if exists "mafia_players write" on mafia_players;

-- ============================================================
-- HELPERS
-- ============================================================

create or replace function mafia_touch_game(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update mafia_games set updated_at = now() where id = p_game_id;
end;
$$;

create or replace function mafia_role_counts(p_count int)
returns table(mafia int, doctor int, detective int, villager int)
language plpgsql
immutable
as $$
begin
  if p_count < 5 then
    return query select 0, 0, 0, 0;
  elsif p_count = 5 then
    return query select 1, 1, 1, 2;
  elsif p_count <= 7 then
    return query select 2, 1, 1, greatest(0, p_count - 4);
  elsif p_count <= 10 then
    return query select 2, 1, 1, greatest(0, p_count - 4);
  else
    return query select 3, 1, 1, greatest(0, p_count - 5);
  end if;
end;
$$;

create or replace function mafia_get_player(p_game_id uuid, p_user_id uuid default auth.uid())
returns mafia_players
language sql
stable
security definer
set search_path = public
as $$
  select * from mafia_players
  where game_id = p_game_id and user_id = coalesce(p_user_id, auth.uid())
  limit 1;
$$;

create or replace function mafia_alive_count(p_game_id uuid, p_team text default null)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from mafia_players
  where game_id = p_game_id and is_alive
    and (p_team is null or team = p_team);
$$;

create or replace function mafia_log_event(
  p_game_id uuid,
  p_round int,
  p_type text,
  p_message text,
  p_public jsonb default '{}'::jsonb,
  p_private_user uuid default null,
  p_private jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into mafia_events (game_id, round_number, event_type, message, public_data, private_user_id, private_data)
  values (p_game_id, p_round, p_type, p_message, p_public, p_private_user, p_private);
end;
$$;

create or replace function mafia_set_phase(
  p_game_id uuid,
  p_phase text,
  p_duration_seconds int default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update mafia_games
  set
    phase = p_phase,
    phase_ends_at = case
      when p_duration_seconds is null then null
      else now() + make_interval(secs => p_duration_seconds)
    end,
    updated_at = now()
  where id = p_game_id;
end;
$$;

-- ============================================================
-- RPC: create / join / leave lobby
-- ============================================================

create or replace function create_mafia_game(
  p_room_id text,
  p_day_seconds int default 90,
  p_voting_seconds int default 45,
  p_reveal_on_death boolean default false,
  p_allow_dead_chat boolean default true,
  p_nickname text default 'Host'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_game_id uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select id into v_game_id from mafia_games
  where room_id = p_room_id and status in ('lobby', 'active')
  order by created_at desc limit 1;

  if v_game_id is not null then return v_game_id; end if;

  insert into mafia_games (
    room_id, host_id, day_duration_seconds, voting_duration_seconds,
    reveal_roles_on_death, allow_dead_chat
  ) values (
    p_room_id, v_uid, p_day_seconds, p_voting_seconds,
    p_reveal_on_death, p_allow_dead_chat
  ) returning id into v_game_id;

  insert into mafia_players (game_id, user_id, nickname, is_host, is_ready)
  values (v_game_id, v_uid, coalesce(nullif(trim(p_nickname), ''), 'Host'), true, true)
  on conflict (game_id, user_id) do nothing;

  return v_game_id;
end;
$$;

create or replace function join_mafia_game(
  p_game_id uuid,
  p_nickname text default 'Player',
  p_avatar_url text default null,
  p_seat_number int default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_game mafia_games;
  v_count int;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_game from mafia_games where id = p_game_id;
  if not found then raise exception 'Game not found'; end if;
  if v_game.status <> 'lobby' then raise exception 'Game already started'; end if;

  select count(*) into v_count from mafia_players where game_id = p_game_id;
  if v_count >= v_game.max_players then raise exception 'Game is full'; end if;

  insert into mafia_players (game_id, user_id, nickname, avatar_url, seat_number)
  values (p_game_id, v_uid, coalesce(nullif(trim(p_nickname), ''), 'Player'), p_avatar_url, p_seat_number)
  on conflict (game_id, user_id) do update set
    nickname = excluded.nickname,
    avatar_url = coalesce(excluded.avatar_url, mafia_players.avatar_url),
    seat_number = coalesce(excluded.seat_number, mafia_players.seat_number);

  perform mafia_touch_game(p_game_id);
end;
$$;

create or replace function leave_mafia_game(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_game mafia_games;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_game from mafia_games where id = p_game_id;
  if v_game.status <> 'lobby' then raise exception 'Cannot leave after start'; end if;
  delete from mafia_players where game_id = p_game_id and user_id = v_uid;
  perform mafia_touch_game(p_game_id);
end;
$$;

create or replace function set_mafia_ready(p_game_id uuid, p_ready boolean default true)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  update mafia_players set is_ready = p_ready
  where game_id = p_game_id and user_id = v_uid;
  perform mafia_touch_game(p_game_id);
end;
$$;

-- ============================================================
-- RPC: role assignment + start
-- ============================================================

create or replace function assign_mafia_roles(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_counts record;
  v_ids uuid[];
  v_i int;
  v_roles text[] := '{}';
  v_role text;
  v_uid uuid;
begin
  select array_agg(user_id order by random()) into v_ids
  from mafia_players where game_id = p_game_id;

  select * into v_counts from mafia_role_counts(coalesce(array_length(v_ids, 1), 0));

  for v_i in 1..v_counts.mafia loop v_roles := array_append(v_roles, 'mafia'); end loop;
  v_roles := array_append(v_roles, 'doctor');
  v_roles := array_append(v_roles, 'detective');
  for v_i in 1..v_counts.villager loop v_roles := array_append(v_roles, 'villager'); end loop;

  v_roles := (select array_agg(r order by random()) from unnest(v_roles) r);

  for v_i in 1..coalesce(array_length(v_ids, 1), 0) loop
    v_uid := v_ids[v_i];
    v_role := v_roles[v_i];
    update mafia_players
    set
      role = v_role,
      team = case when v_role = 'mafia' then 'mafia' else 'village' end
    where game_id = p_game_id and user_id = v_uid;

    perform mafia_log_event(
      p_game_id, 0, 'role_assigned', 'Your role has been assigned',
      '{}'::jsonb, v_uid,
      jsonb_build_object('role', v_role, 'team', case when v_role = 'mafia' then 'mafia' else 'village' end)
    );
  end loop;
end;
$$;

create or replace function start_mafia_game(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_game mafia_games;
  v_count int;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_game from mafia_games where id = p_game_id;
  if v_game.host_id <> v_uid then raise exception 'Only host can start'; end if;
  if v_game.status <> 'lobby' then raise exception 'Game already started'; end if;

  select count(*) into v_count from mafia_players where game_id = p_game_id;
  if v_count < v_game.min_players then
    raise exception 'Need at least % players', v_game.min_players;
  end if;

  update mafia_games
  set status = 'active', started_at = now(), round_number = 1, updated_at = now()
  where id = p_game_id;

  perform assign_mafia_roles(p_game_id);
  perform mafia_set_phase(p_game_id, 'role_reveal', (select role_reveal_seconds from mafia_games where id = p_game_id));
  perform mafia_log_event(p_game_id, 1, 'game_started', 'Mafia game has started', '{}'::jsonb);
end;
$$;

-- ============================================================
-- RPC: night actions
-- ============================================================

create or replace function submit_mafia_action(p_game_id uuid, p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_game mafia_games;
  v_me mafia_players;
  v_target mafia_players;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_game from mafia_games where id = p_game_id;
  if v_game.phase <> 'night' then raise exception 'Not night phase'; end if;
  select * into v_me from mafia_players where game_id = p_game_id and user_id = v_uid;
  if v_me.role <> 'mafia' or not v_me.is_alive then raise exception 'Invalid actor'; end if;
  select * into v_target from mafia_players where game_id = p_game_id and user_id = p_target_user_id;
  if not v_target.is_alive or v_target.role = 'mafia' then raise exception 'Invalid target'; end if;

  delete from mafia_actions
  where game_id = p_game_id and round_number = v_game.round_number
    and actor_user_id = v_uid and action_type = 'mafia_kill';

  insert into mafia_actions (game_id, round_number, phase, actor_user_id, target_user_id, action_type)
  values (p_game_id, v_game.round_number, 'night', v_uid, p_target_user_id, 'mafia_kill');

  perform mafia_touch_game(p_game_id);
end;
$$;

create or replace function submit_doctor_action(p_game_id uuid, p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_game mafia_games;
  v_me mafia_players;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_game from mafia_games where id = p_game_id;
  if v_game.phase <> 'night' then raise exception 'Not night phase'; end if;
  select * into v_me from mafia_players where game_id = p_game_id and user_id = v_uid;
  if v_me.role <> 'doctor' or not v_me.is_alive then raise exception 'Invalid actor'; end if;

  delete from mafia_actions
  where game_id = p_game_id and round_number = v_game.round_number
    and actor_user_id = v_uid and action_type = 'doctor_save';

  insert into mafia_actions (game_id, round_number, phase, actor_user_id, target_user_id, action_type)
  values (p_game_id, v_game.round_number, 'night', v_uid, p_target_user_id, 'doctor_save');

  perform mafia_touch_game(p_game_id);
end;
$$;

create or replace function submit_detective_action(p_game_id uuid, p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_game mafia_games;
  v_me mafia_players;
  v_target mafia_players;
  v_is_mafia boolean;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_game from mafia_games where id = p_game_id;
  if v_game.phase <> 'night' then raise exception 'Not night phase'; end if;
  select * into v_me from mafia_players where game_id = p_game_id and user_id = v_uid;
  if v_me.role <> 'detective' or not v_me.is_alive then raise exception 'Invalid actor'; end if;
  if p_target_user_id = v_uid then raise exception 'Cannot investigate self'; end if;
  select * into v_target from mafia_players where game_id = p_game_id and user_id = p_target_user_id;
  if not v_target.is_alive then raise exception 'Invalid target'; end if;

  delete from mafia_actions
  where game_id = p_game_id and round_number = v_game.round_number
    and actor_user_id = v_uid and action_type = 'detective_check';

  insert into mafia_actions (game_id, round_number, phase, actor_user_id, target_user_id, action_type)
  values (p_game_id, v_game.round_number, 'night', v_uid, p_target_user_id, 'detective_check');

  v_is_mafia := v_target.role = 'mafia';
  perform mafia_log_event(
    p_game_id, v_game.round_number, 'detective_result',
    case when v_is_mafia then 'Suspect is Mafia' else 'Suspect is not Mafia' end,
    '{}'::jsonb, v_uid,
    jsonb_build_object('target_user_id', p_target_user_id, 'is_mafia', v_is_mafia)
  );

  perform mafia_touch_game(p_game_id);
end;
$$;

-- ============================================================
-- RPC: resolve night + day vote + win check
-- ============================================================

create or replace function resolve_mafia_night(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game mafia_games;
  v_kill_target uuid;
  v_save_target uuid;
  v_eliminated uuid;
  v_nickname text;
  v_reveal boolean;
begin
  select * into v_game from mafia_games where id = p_game_id;
  if v_game.phase <> 'night' then return; end if;

  select target_user_id into v_kill_target
  from mafia_actions
  where game_id = p_game_id and round_number = v_game.round_number and action_type = 'mafia_kill'
  group by target_user_id
  order by count(*) desc
  limit 1;

  select target_user_id into v_save_target
  from mafia_actions
  where game_id = p_game_id and round_number = v_game.round_number and action_type = 'doctor_save'
  limit 1;

  v_eliminated := null;
  if v_kill_target is not null and (v_save_target is null or v_save_target <> v_kill_target) then
    v_eliminated := v_kill_target;
    update mafia_players
    set is_alive = false, eliminated_at = now(), elimination_reason = 'night_kill'
    where game_id = p_game_id and user_id = v_eliminated;

    select nickname into v_nickname from mafia_players where game_id = p_game_id and user_id = v_eliminated;
    select reveal_roles_on_death into v_reveal from mafia_games where id = p_game_id;

    perform mafia_log_event(
      p_game_id, v_game.round_number, 'player_eliminated',
      v_nickname || ' was eliminated last night',
      jsonb_build_object('user_id', v_eliminated, 'nickname', v_nickname, 'reason', 'night')
    );
  else
    perform mafia_log_event(p_game_id, v_game.round_number, 'night_resolved', 'No one was eliminated last night', '{}'::jsonb);
  end if;

  perform check_mafia_win_condition(p_game_id);
  select * into v_game from mafia_games where id = p_game_id;
  if v_game.phase = 'game_over' then return; end if;

  perform mafia_set_phase(p_game_id, 'night_result', v_game.night_result_seconds);
end;
$$;

create or replace function submit_day_vote(p_game_id uuid, p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_game mafia_games;
  v_me mafia_players;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_game from mafia_games where id = p_game_id;
  if v_game.phase <> 'voting' then raise exception 'Not voting phase'; end if;
  select * into v_me from mafia_players where game_id = p_game_id and user_id = v_uid;
  if not v_me.is_alive then raise exception 'Eliminated players cannot vote'; end if;
  if p_target_user_id = v_uid then raise exception 'Cannot vote for yourself'; end if;

  insert into mafia_votes (game_id, round_number, voter_user_id, target_user_id)
  values (p_game_id, v_game.round_number, v_uid, p_target_user_id)
  on conflict (game_id, round_number, voter_user_id)
  do update set target_user_id = excluded.target_user_id;

  perform mafia_log_event(
    p_game_id, v_game.round_number, 'vote_cast',
    v_me.nickname || ' voted',
    jsonb_build_object('voter_user_id', v_uid)
  );
  perform mafia_touch_game(p_game_id);
end;
$$;

create or replace function resolve_day_vote(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game mafia_games;
  v_top uuid;
  v_top_count int;
  v_tie_count int;
  v_nickname text;
begin
  select * into v_game from mafia_games where id = p_game_id;
  if v_game.phase <> 'voting' then return; end if;

  select target_user_id, count(*)::int into v_top, v_top_count
  from mafia_votes
  where game_id = p_game_id and round_number = v_game.round_number
  group by target_user_id
  order by count(*) desc
  limit 1;

  select count(*)::int into v_tie_count
  from (
    select count(*) c from mafia_votes
    where game_id = p_game_id and round_number = v_game.round_number
    group by target_user_id
    having count(*) = coalesce(v_top_count, 0)
  ) t;

  if v_top is not null and v_top_count > 0 and v_tie_count = 1 then
    update mafia_players
    set is_alive = false, eliminated_at = now(), elimination_reason = 'day_vote'
    where game_id = p_game_id and user_id = v_top;

    select nickname into v_nickname from mafia_players where game_id = p_game_id and user_id = v_top;
    perform mafia_log_event(
      p_game_id, v_game.round_number, 'player_eliminated',
      v_nickname || ' was voted out',
      jsonb_build_object('user_id', v_top, 'nickname', v_nickname, 'reason', 'vote')
    );
  else
    perform mafia_log_event(p_game_id, v_game.round_number, 'voting_tie', 'Vote tied — no one eliminated', '{}'::jsonb);
  end if;

  perform check_mafia_win_condition(p_game_id);
  select * into v_game from mafia_games where id = p_game_id;
  if v_game.phase = 'game_over' then return; end if;

  update mafia_games set round_number = round_number + 1, updated_at = now() where id = p_game_id;
  perform mafia_set_phase(p_game_id, 'night', v_game.night_seconds);
  perform mafia_log_event(p_game_id, v_game.round_number + 1, 'night_started', 'Night falls… everyone sleeps', '{}'::jsonb);
end;
$$;

create or replace function check_mafia_win_condition(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mafia int;
  v_village int;
  v_winner text;
begin
  select mafia_alive_count, village_alive_count into v_mafia, v_village
  from (
    select
      count(*) filter (where team = 'mafia' and is_alive) as mafia_alive_count,
      count(*) filter (where team = 'village' and is_alive) as village_alive_count
    from mafia_players where game_id = p_game_id
  ) s;

  if v_mafia = 0 then
    v_winner := 'village';
  elsif v_mafia >= v_village then
    v_winner := 'mafia';
  else
    return;
  end if;

  update mafia_games
  set winner_team = v_winner, phase = 'game_over', status = 'ended', ended_at = now(), phase_ends_at = null
  where id = p_game_id;

  perform mafia_log_event(
    p_game_id,
    (select round_number from mafia_games where id = p_game_id),
    'game_over',
    case when v_winner = 'mafia' then 'Mafia wins!' else 'Village wins!' end,
    jsonb_build_object('winner_team', v_winner)
  );

  insert into mafia_player_stats (user_id, games_played, games_won, games_lost, mafia_wins, villager_wins, updated_at)
  select
    mp.user_id,
    1,
    case when (v_winner = 'mafia' and mp.team = 'mafia') or (v_winner = 'village' and mp.team = 'village') then 1 else 0 end,
    case when (v_winner = 'mafia' and mp.team = 'village') or (v_winner = 'village' and mp.team = 'mafia') then 1 else 0 end,
    case when v_winner = 'mafia' and mp.team = 'mafia' then 1 else 0 end,
    case when v_winner = 'village' and mp.team = 'village' then 1 else 0 end,
    now()
  from mafia_players mp where mp.game_id = p_game_id
  on conflict (user_id) do update set
    games_played = mafia_player_stats.games_played + 1,
    games_won = mafia_player_stats.games_won + excluded.games_won,
    games_lost = mafia_player_stats.games_lost + excluded.games_lost,
    mafia_wins = mafia_player_stats.mafia_wins + excluded.mafia_wins,
    villager_wins = mafia_player_stats.villager_wins + excluded.villager_wins,
    times_mafia = mafia_player_stats.times_mafia + case when excluded.mafia_wins > 0 then 1 else 0 end,
    updated_at = now();
end;
$$;

-- ============================================================
-- RPC: phase advance (timers)
-- ============================================================

create or replace function advance_mafia_phase_if_due(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game mafia_games;
begin
  select * into v_game from mafia_games where id = p_game_id;
  if v_game.status <> 'active' then return; end if;
  if v_game.phase_ends_at is null or v_game.phase_ends_at > now() then return; end if;

  case v_game.phase
    when 'role_reveal' then
      perform mafia_set_phase(p_game_id, 'night', v_game.night_seconds);
      perform mafia_log_event(p_game_id, v_game.round_number, 'night_started', 'Night falls…', '{}'::jsonb);
    when 'night' then
      perform resolve_mafia_night(p_game_id);
    when 'night_result' then
      perform mafia_set_phase(p_game_id, 'day', v_game.day_duration_seconds);
      perform mafia_log_event(p_game_id, v_game.round_number, 'day_started', 'Day breaks — discuss!', '{}'::jsonb);
    when 'day' then
      perform mafia_set_phase(p_game_id, 'voting', v_game.voting_duration_seconds);
      perform mafia_log_event(p_game_id, v_game.round_number, 'voting_started', 'Time to vote', '{}'::jsonb);
    when 'voting' then
      perform resolve_day_vote(p_game_id);
    else
      null;
  end case;
end;
$$;

-- ============================================================
-- RPC: end game + kick + public/private state
-- ============================================================

create or replace function end_mafia_game(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_game mafia_games;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_game from mafia_games where id = p_game_id;
  if v_game.host_id <> v_uid then raise exception 'Only host can end game'; end if;

  update mafia_games
  set status = 'ended', phase = 'game_over', ended_at = now(), phase_ends_at = null
  where id = p_game_id;

  perform mafia_log_event(p_game_id, v_game.round_number, 'game_over', 'Game ended by host', '{}'::jsonb);
end;
$$;

create or replace function kick_mafia_player(p_game_id uuid, p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from mafia_games where id = p_game_id and host_id = v_uid) then
    raise exception 'Only host can kick';
  end if;
  delete from mafia_players where game_id = p_game_id and user_id = p_target_user_id;
  perform mafia_touch_game(p_game_id);
end;
$$;

create or replace function get_mafia_public_state(p_game_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_game jsonb;
  v_players jsonb;
  v_events jsonb;
  v_votes jsonb;
begin
  select to_jsonb(g.*) into v_game from mafia_games g where g.id = p_game_id;
  if v_game is null then return null; end if;

  select coalesce(jsonb_agg(to_jsonb(p.*) order by p.joined_at), '[]'::jsonb) into v_players
  from mafia_players_public p where p.game_id = p_game_id;

  select coalesce(jsonb_agg(to_jsonb(e.*) order by e.created_at desc), '[]'::jsonb) into v_events
  from mafia_events e
  where e.game_id = p_game_id and e.private_user_id is null
  limit 30;

  select coalesce(jsonb_agg(jsonb_build_object(
    'target_user_id', target_user_id, 'votes', cnt
  )), '[]'::jsonb) into v_votes
  from (
    select target_user_id, count(*)::int cnt
    from mafia_votes
    where game_id = p_game_id and round_number = (v_game->>'round_number')::int
    group by target_user_id
  ) vc;

  return jsonb_build_object('game', v_game, 'players', v_players, 'events', v_events, 'voteCounts', v_votes);
end;
$$;

create or replace function get_my_mafia_private_state(p_game_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_me mafia_players;
  v_teammates jsonb;
  v_private_events jsonb;
  v_game mafia_games;
begin
  if v_uid is null then return '{}'::jsonb; end if;
  select * into v_me from mafia_players where game_id = p_game_id and user_id = v_uid;
  if not found then return '{}'::jsonb; end if;
  select * into v_game from mafia_games where id = p_game_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', user_id, 'nickname', nickname, 'avatar_url', avatar_url
  )), '[]'::jsonb) into v_teammates
  from mafia_players
  where game_id = p_game_id and role = 'mafia' and user_id <> v_uid
    and v_me.role = 'mafia' and v_game.status = 'active';

  select coalesce(jsonb_agg(to_jsonb(e.*) order by e.created_at desc), '[]'::jsonb) into v_private_events
  from mafia_events e
  where e.game_id = p_game_id and e.private_user_id = v_uid;

  return jsonb_build_object(
    'role', case when v_game.status = 'ended' or v_me.user_id = v_uid then v_me.role else v_me.role end,
    'team', v_me.team,
    'is_alive', v_me.is_alive,
    'mafia_teammates', v_teammates,
    'private_events', v_private_events
  );
end;
$$;

create or replace function get_mafia_game_reveal(p_game_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_players jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', user_id, 'nickname', nickname, 'avatar_url', avatar_url,
    'role', role, 'team', team, 'is_alive', is_alive
  ) order by joined_at), '[]'::jsonb) into v_players
  from mafia_players where game_id = p_game_id;

  return jsonb_build_object(
    'players', v_players,
    'winner_team', (select winner_team from mafia_games where id = p_game_id),
    'mvp_user_id', (select mvp_user_id from mafia_games where id = p_game_id)
  );
end;
$$;

create or replace function get_active_mafia_game(p_room_id text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from mafia_games
  where room_id = p_room_id and status in ('lobby', 'active')
  order by created_at desc
  limit 1;
$$;

-- Realtime
alter publication supabase_realtime add table mafia_games;
alter publication supabase_realtime add table mafia_events;

grant execute on function create_mafia_game to authenticated;
grant execute on function join_mafia_game to authenticated;
grant execute on function leave_mafia_game to authenticated;
grant execute on function set_mafia_ready to authenticated;
grant execute on function start_mafia_game to authenticated;
grant execute on function submit_mafia_action to authenticated;
grant execute on function submit_doctor_action to authenticated;
grant execute on function submit_detective_action to authenticated;
grant execute on function submit_day_vote to authenticated;
grant execute on function advance_mafia_phase_if_due to authenticated;
grant execute on function end_mafia_game to authenticated;
grant execute on function kick_mafia_player to authenticated;
grant execute on function get_mafia_public_state to authenticated;
grant execute on function get_my_mafia_private_state to authenticated;
grant execute on function get_mafia_game_reveal to authenticated;
grant execute on function get_active_mafia_game to authenticated;
