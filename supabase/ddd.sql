-- DDD — Dil, Dimaag, Dustbin party game
-- Run in Supabase SQL Editor (requires rooms table + auth)

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists ddd_games (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  host_id uuid not null,
  status text not null default 'lobby'
    check (status in ('lobby', 'active', 'round_end', 'ended', 'cancelled')),
  phase text not null default 'lobby'
    check (phase in (
      'lobby', 'turn_start', 'input', 'reveal_dil', 'reveal_dimaag', 'reveal_dustbin',
      'turn_result', 'round_end', 'game_over'
    )),
  round_number int not null default 0,
  current_turn_user_id uuid,
  current_turn_index int not null default 0,
  turn_started_at timestamptz,
  turn_duration_seconds int not null default 60,
  allow_self_pick boolean not null default false,
  phase_ends_at timestamptz,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists ddd_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references ddd_games(id) on delete cascade,
  user_id uuid not null,
  nickname text not null default 'Player',
  avatar_url text,
  seat_number int,
  join_order int not null default 0,
  is_active boolean not null default true,
  has_completed_turn boolean not null default false,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (game_id, user_id)
);

create table if not exists ddd_turns (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references ddd_games(id) on delete cascade,
  round_number int not null,
  turn_number int not null,
  actor_user_id uuid not null,
  dil_user_id uuid,
  dil_name text,
  dimaag_user_id uuid,
  dimaag_name text,
  dustbin_user_id uuid,
  dustbin_name text,
  submitted_at timestamptz,
  auto_submitted boolean not null default false,
  created_at timestamptz not null default now(),
  unique (game_id, round_number, turn_number)
);

create table if not exists ddd_reactions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references ddd_games(id) on delete cascade,
  turn_id uuid not null references ddd_turns(id) on delete cascade,
  user_id uuid not null,
  reaction_type text not null check (reaction_type in ('heart', 'laugh', 'shock', 'fire')),
  created_at timestamptz not null default now(),
  unique (turn_id, user_id)
);

create table if not exists ddd_stats (
  user_id uuid primary key,
  games_played int not null default 0,
  rounds_played int not null default 0,
  times_dil int not null default 0,
  times_dimaag int not null default 0,
  times_dustbin int not null default 0,
  turns_taken int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists ddd_games_room_idx on ddd_games(room_id, created_at desc);
create index if not exists ddd_games_active_idx on ddd_games(room_id) where status in ('lobby', 'active', 'round_end');
create index if not exists ddd_players_game_idx on ddd_players(game_id, join_order);
create index if not exists ddd_turns_game_idx on ddd_turns(game_id, round_number, turn_number);
create index if not exists ddd_reactions_turn_idx on ddd_reactions(turn_id);

alter table ddd_games replica identity full;
alter table ddd_players replica identity full;
alter table ddd_turns replica identity full;
alter table ddd_reactions replica identity full;

-- ============================================================
-- RLS
-- ============================================================

alter table ddd_games enable row level security;
alter table ddd_players enable row level security;
alter table ddd_turns enable row level security;
alter table ddd_reactions enable row level security;
alter table ddd_stats enable row level security;

drop policy if exists "ddd_games read" on ddd_games;
create policy "ddd_games read" on ddd_games for select using (true);

drop policy if exists "ddd_players read" on ddd_players;
create policy "ddd_players read" on ddd_players for select using (true);

drop policy if exists "ddd_turns read" on ddd_turns;
create policy "ddd_turns read" on ddd_turns for select using (true);

drop policy if exists "ddd_reactions read" on ddd_reactions;
create policy "ddd_reactions read" on ddd_reactions for select using (true);

drop policy if exists "ddd_stats read" on ddd_stats;
create policy "ddd_stats read" on ddd_stats for select using (true);

-- Writes via security definer RPCs only

-- ============================================================
-- HELPERS
-- ============================================================

create or replace function ddd_touch_game(p_game_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update ddd_games set updated_at = now() where id = p_game_id;
end;
$$;

create or replace function ddd_set_phase(
  p_game_id uuid,
  p_phase text,
  p_duration_seconds int default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  update ddd_games
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

create or replace function ddd_active_player_count(p_game_id uuid)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from ddd_players
  where game_id = p_game_id and is_active and left_at is null;
$$;

create or replace function ddd_turn_order_players(p_game_id uuid)
returns setof ddd_players language sql stable security definer set search_path = public as $$
  select * from ddd_players
  where game_id = p_game_id and is_active and left_at is null
  order by join_order, joined_at;
$$;

create or replace function ddd_allow_self_pick(p_game_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(g.allow_self_pick, false)
    or ddd_active_player_count(p_game_id) < 4
  from ddd_games g where g.id = p_game_id;
$$;

create or replace function ddd_transfer_host_if_needed(p_game_id uuid, p_leaving_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_game ddd_games;
  v_next uuid;
begin
  select * into v_game from ddd_games where id = p_game_id;
  if v_game.host_id is distinct from p_leaving_user_id then return; end if;

  select user_id into v_next
  from ddd_players
  where game_id = p_game_id and is_active and left_at is null and user_id <> p_leaving_user_id
  order by join_order, joined_at
  limit 1;

  if v_next is not null then
    update ddd_games set host_id = v_next, updated_at = now() where id = p_game_id;
  end if;
end;
$$;

create or replace function ddd_upsert_stats_for_turn(p_turn ddd_turns)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_turn.dil_user_id is not null then
    insert into ddd_stats (user_id, times_dil) values (p_turn.dil_user_id, 1)
    on conflict (user_id) do update set times_dil = ddd_stats.times_dil + 1, updated_at = now();
  end if;
  if p_turn.dimaag_user_id is not null then
    insert into ddd_stats (user_id, times_dimaag) values (p_turn.dimaag_user_id, 1)
    on conflict (user_id) do update set times_dimaag = ddd_stats.times_dimaag + 1, updated_at = now();
  end if;
  if p_turn.dustbin_user_id is not null then
    insert into ddd_stats (user_id, times_dustbin) values (p_turn.dustbin_user_id, 1)
    on conflict (user_id) do update set times_dustbin = ddd_stats.times_dustbin + 1, updated_at = now();
  end if;
  insert into ddd_stats (user_id, turns_taken) values (p_turn.actor_user_id, 1)
  on conflict (user_id) do update set turns_taken = ddd_stats.turns_taken + 1, updated_at = now();
end;
$$;

create or replace function ddd_build_round_summary(p_game_id uuid, p_round int)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_dil jsonb;
  v_dimaag jsonb;
  v_dustbin jsonb;
  v_targeted jsonb;
  v_turns jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', uid, 'nickname', nick, 'count', cnt
  ) order by cnt desc), '[]'::jsonb) into v_dil
  from (
    select dil_user_id uid, max(dil_name) nick, count(*) cnt
    from ddd_turns where game_id = p_game_id and round_number = p_round and dil_user_id is not null
    group by dil_user_id
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', uid, 'nickname', nick, 'count', cnt
  ) order by cnt desc), '[]'::jsonb) into v_dimaag
  from (
    select dimaag_user_id uid, max(dimaag_name) nick, count(*) cnt
    from ddd_turns where game_id = p_game_id and round_number = p_round and dimaag_user_id is not null
    group by dimaag_user_id
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', uid, 'nickname', nick, 'count', cnt
  ) order by cnt desc), '[]'::jsonb) into v_dustbin
  from (
    select dustbin_user_id uid, max(dustbin_name) nick, count(*) cnt
    from ddd_turns where game_id = p_game_id and round_number = p_round and dustbin_user_id is not null
    group by dustbin_user_id
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', uid, 'nickname', nick, 'count', cnt
  ) order by cnt desc), '[]'::jsonb) into v_targeted
  from (
    select picked uid, max(pnick) nick, count(*) cnt from (
      select dil_user_id picked, dil_name pnick from ddd_turns where game_id = p_game_id and round_number = p_round and dil_user_id is not null
      union all
      select dimaag_user_id, dimaag_name from ddd_turns where game_id = p_game_id and round_number = p_round and dimaag_user_id is not null
      union all
      select dustbin_user_id, dustbin_name from ddd_turns where game_id = p_game_id and round_number = p_round and dustbin_user_id is not null
    ) u group by picked
  ) x;

  select coalesce(jsonb_agg(to_jsonb(t.*) order by t.turn_number), '[]'::jsonb) into v_turns
  from ddd_turns t where t.game_id = p_game_id and t.round_number = p_round;

  return jsonb_build_object(
    'mostDil', coalesce(v_dil->0, 'null'::jsonb),
    'mostDimaag', coalesce(v_dimaag->0, 'null'::jsonb),
    'mostDustbin', coalesce(v_dustbin->0, 'null'::jsonb),
    'mostTargeted', coalesce(v_targeted->0, 'null'::jsonb),
    'allDil', v_dil,
    'allDimaag', v_dimaag,
    'allDustbin', v_dustbin,
    'turns', v_turns
  );
end;
$$;

-- ============================================================
-- RPC: create / join / leave
-- ============================================================

create or replace function create_ddd_game(p_room_id text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_game_id uuid;
  v_existing uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select id into v_existing from ddd_games
  where room_id = p_room_id and status in ('lobby', 'active', 'round_end')
  order by created_at desc limit 1;
  if v_existing is not null then return v_existing; end if;

  insert into ddd_games (room_id, host_id, status, phase)
  values (p_room_id, v_uid, 'lobby', 'lobby')
  returning id into v_game_id;

  insert into ddd_players (game_id, user_id, nickname, join_order, is_active)
  values (v_game_id, v_uid, 'Host', 0, true)
  on conflict (game_id, user_id) do nothing;

  return v_game_id;
end;
$$;

create or replace function join_ddd_game(
  p_game_id uuid,
  p_nickname text default 'Player',
  p_avatar_url text default null,
  p_seat_number int default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_game ddd_games;
  v_order int;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_game from ddd_games where id = p_game_id;
  if not found then raise exception 'Game not found'; end if;
  if v_game.status <> 'lobby' then raise exception 'Game already started'; end if;

  select coalesce(max(join_order), -1) + 1 into v_order from ddd_players where game_id = p_game_id;

  insert into ddd_players (game_id, user_id, nickname, avatar_url, seat_number, join_order, is_active)
  values (p_game_id, v_uid, coalesce(nullif(trim(p_nickname), ''), 'Player'), p_avatar_url, p_seat_number, v_order, true)
  on conflict (game_id, user_id) do update set
    nickname = excluded.nickname,
    avatar_url = coalesce(excluded.avatar_url, ddd_players.avatar_url),
    seat_number = coalesce(excluded.seat_number, ddd_players.seat_number),
    is_active = true,
    left_at = null;

  perform ddd_touch_game(p_game_id);
end;
$$;

create or replace function leave_ddd_game(p_game_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_game ddd_games;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_game from ddd_games where id = p_game_id for update;
  if not found then raise exception 'Game not found'; end if;

  perform ddd_transfer_host_if_needed(p_game_id, v_uid);

  update ddd_players
  set is_active = false, left_at = now()
  where game_id = p_game_id and user_id = v_uid;

  if v_game.status = 'lobby' then
    delete from ddd_players where game_id = p_game_id and user_id = v_uid;
    perform ddd_touch_game(p_game_id);
    return;
  end if;

  if v_game.status = 'active' and v_game.current_turn_user_id = v_uid and v_game.phase = 'input' then
    perform auto_submit_ddd_turn(p_game_id);
  end if;

  perform ddd_touch_game(p_game_id);
end;
$$;

-- ============================================================
-- RPC: start / end
-- ============================================================

create or replace function public.can_control_room_game(
  p_room_id text,
  p_game_host_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_user_id is null then return false; end if;
  if p_game_host_id is not null and p_game_host_id = p_user_id then return true; end if;
  if exists (select 1 from rooms r where r.id = p_room_id and r.owner_id = p_user_id) then return true; end if;
  if exists (select 1 from seats s where s.room_id = p_room_id and s.seat_number = 1 and s.user_id = p_user_id) then return true; end if;
  if exists (select 1 from seats s where s.room_id = p_room_id and s.seat_number = 2 and s.user_id = p_user_id) then return true; end if;
  if exists (select 1 from room_admins ra where ra.room_id = p_room_id and ra.user_id = p_user_id) then return true; end if;
  if exists (select 1 from profiles p where p.id = p_user_id and p.is_super_admin = true) then return true; end if;
  return false;
end;
$$;

create or replace function start_ddd_game(p_game_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_game ddd_games;
  v_first uuid;
  v_count int;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_game from ddd_games where id = p_game_id for update;
  if not can_control_room_game(v_game.room_id, v_game.host_id, v_uid) then
    raise exception 'Not authorized to start game';
  end if;
  if v_game.status <> 'lobby' then raise exception 'Game already started'; end if;

  v_count := ddd_active_player_count(p_game_id);
  if v_count < 3 then raise exception 'Need at least 3 players'; end if;

  select user_id into v_first from ddd_turn_order_players(p_game_id) limit 1;

  update ddd_games set
    status = 'active',
    round_number = 1,
    current_turn_index = 0,
    current_turn_user_id = v_first,
    turn_started_at = now(),
    started_at = coalesce(started_at, now()),
    phase = 'turn_start',
    phase_ends_at = now() + interval '3 seconds',
    updated_at = now()
  where id = p_game_id;

  update ddd_players set has_completed_turn = false where game_id = p_game_id;
end;
$$;

create or replace function end_ddd_game(p_game_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_game ddd_games;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_game from ddd_games where id = p_game_id;
  if not can_control_room_game(v_game.room_id, v_game.host_id, v_uid) then
    raise exception 'Not authorized to end game';
  end if;

  update ddd_games set
    status = 'ended', phase = 'game_over', ended_at = now(), phase_ends_at = null, updated_at = now()
  where id = p_game_id;
end;
$$;

create or replace function end_active_ddd_game_for_room(p_room_id text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_game_id uuid;
  v_game ddd_games;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select id into v_game_id from ddd_games
  where room_id = p_room_id and status in ('lobby', 'active', 'round_end')
  order by created_at desc limit 1;
  if v_game_id is null then return null; end if;

  select * into v_game from ddd_games where id = v_game_id;

  if not can_control_room_game(p_room_id, v_game.host_id, v_uid) then
    raise exception 'Not authorized to stop DDD';
  end if;

  update ddd_games set
    status = 'cancelled', phase = 'game_over', ended_at = now(), phase_ends_at = null, updated_at = now()
  where id = v_game_id;

  return v_game_id;
end;
$$;

-- ============================================================
-- RPC: submit turn
-- ============================================================

create or replace function submit_ddd_turn(
  p_game_id uuid,
  p_dil_user_id uuid,
  p_dimaag_user_id uuid,
  p_dustbin_user_id uuid,
  p_dil_name text default null,
  p_dimaag_name text default null,
  p_dustbin_name text default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_game ddd_games;
  v_turn_id uuid;
  v_allow_self boolean;
  v_ids uuid[];
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_game from ddd_games where id = p_game_id for update;
  if v_game.status <> 'active' then raise exception 'Game not active'; end if;
  if v_game.phase <> 'input' then raise exception 'Not in input phase'; end if;
  if v_game.current_turn_user_id <> v_uid then raise exception 'Not your turn'; end if;

  if exists (
    select 1 from ddd_turns
    where game_id = p_game_id and round_number = v_game.round_number and turn_number = v_game.current_turn_index
  ) then raise exception 'Turn already submitted'; end if;

  v_allow_self := ddd_allow_self_pick(p_game_id);

  v_ids := array_remove(array[p_dil_user_id, p_dimaag_user_id, p_dustbin_user_id], null);
  if (select count(distinct x) from unnest(v_ids) x) <> coalesce(array_length(v_ids, 1), 0) then
    raise exception 'Cannot pick same player for multiple categories';
  end if;

  if not v_allow_self and (p_dil_user_id = v_uid or p_dimaag_user_id = v_uid or p_dustbin_user_id = v_uid) then
    raise exception 'Cannot pick yourself';
  end if;

  insert into ddd_turns (
    game_id, round_number, turn_number, actor_user_id,
    dil_user_id, dil_name, dimaag_user_id, dimaag_name, dustbin_user_id, dustbin_name,
    submitted_at, auto_submitted
  ) values (
    p_game_id, v_game.round_number, v_game.current_turn_index, v_uid,
    p_dil_user_id, coalesce(nullif(trim(p_dil_name), ''), 'Skipped'),
    p_dimaag_user_id, coalesce(nullif(trim(p_dimaag_name), ''), 'Skipped'),
    p_dustbin_user_id, coalesce(nullif(trim(p_dustbin_name), ''), 'Skipped'),
    now(), false
  ) returning id into v_turn_id;

  perform ddd_upsert_stats_for_turn((select t from ddd_turns t where t.id = v_turn_id));

  update ddd_players set has_completed_turn = true
  where game_id = p_game_id and user_id = v_uid;

  perform ddd_set_phase(p_game_id, 'reveal_dil', 2);
  return v_turn_id;
end;
$$;

create or replace function auto_submit_ddd_turn(p_game_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_game ddd_games;
  v_uid uuid;
  v_turn_id uuid;
begin
  select * into v_game from ddd_games where id = p_game_id for update;
  if v_game.status <> 'active' or v_game.phase <> 'input' then return null; end if;
  v_uid := v_game.current_turn_user_id;

  if exists (
    select 1 from ddd_turns
    where game_id = p_game_id and round_number = v_game.round_number and turn_number = v_game.current_turn_index
  ) then return null; end if;

  insert into ddd_turns (
    game_id, round_number, turn_number, actor_user_id,
    dil_name, dimaag_name, dustbin_name, submitted_at, auto_submitted
  ) values (
    p_game_id, v_game.round_number, v_game.current_turn_index, v_uid,
    'Skipped', 'Skipped', 'Skipped', now(), true
  ) returning id into v_turn_id;

  update ddd_players set has_completed_turn = true
  where game_id = p_game_id and user_id = v_uid;

  perform ddd_set_phase(p_game_id, 'reveal_dil', 2);
  return v_turn_id;
end;
$$;

-- ============================================================
-- RPC: advance phase / turn
-- ============================================================

create or replace function ddd_begin_next_turn(p_game_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_game ddd_games;
  v_players uuid[];
  v_next uuid;
  v_total int;
begin
  select * into v_game from ddd_games where id = p_game_id for update;

  select array_agg(user_id order by join_order, joined_at), count(*)::int
  into v_players, v_total
  from ddd_players where game_id = p_game_id and is_active and left_at is null;

  if v_game.current_turn_index + 1 >= v_total then
    update ddd_games set
      status = 'round_end',
      phase = 'round_end',
      phase_ends_at = null,
      current_turn_user_id = null,
      updated_at = now()
    where id = p_game_id;

    update ddd_stats set rounds_played = rounds_played + 1, updated_at = now()
    where user_id in (select user_id from ddd_players where game_id = p_game_id);
    return;
  end if;

  v_next := v_players[v_game.current_turn_index + 2];

  update ddd_games set
    current_turn_index = current_turn_index + 1,
    current_turn_user_id = v_next,
    turn_started_at = now(),
    phase = 'turn_start',
    phase_ends_at = now() + interval '3 seconds',
    updated_at = now()
  where id = p_game_id;
end;
$$;

create or replace function advance_ddd_phase(p_game_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_game ddd_games;
begin
  select * into v_game from ddd_games where id = p_game_id for update;
  if v_game.phase_ends_at is not null and v_game.phase_ends_at > now() then return; end if;

  case v_game.phase
    when 'turn_start' then
      perform ddd_set_phase(p_game_id, 'input', v_game.turn_duration_seconds);
      update ddd_games set turn_started_at = now() where id = p_game_id;

    when 'input' then
      perform auto_submit_ddd_turn(p_game_id);

    when 'reveal_dil' then
      perform ddd_set_phase(p_game_id, 'reveal_dimaag', 2);

    when 'reveal_dimaag' then
      perform ddd_set_phase(p_game_id, 'reveal_dustbin', 2);

    when 'reveal_dustbin' then
      perform ddd_set_phase(p_game_id, 'turn_result', 5);

    when 'turn_result' then
      perform ddd_begin_next_turn(p_game_id);

    else
      null;
  end case;
end;
$$;

create or replace function advance_ddd_phase_if_due(p_game_id uuid)
returns void language sql security definer set search_path = public as $$
  select advance_ddd_phase(p_game_id)
  where exists (
    select 1 from ddd_games g
    where g.id = p_game_id
      and g.phase_ends_at is not null
      and g.phase_ends_at <= now()
      and g.status in ('active', 'round_end')
  );
$$;

create or replace function start_ddd_next_round(p_game_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_game ddd_games;
  v_first uuid;
  v_count int;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_game from ddd_games where id = p_game_id for update;
  if not can_control_room_game(v_game.room_id, v_game.host_id, v_uid) then
    raise exception 'Not authorized to start next round';
  end if;
  if v_game.status <> 'round_end' then raise exception 'Round not finished'; end if;

  v_count := ddd_active_player_count(p_game_id);
  if v_count < 3 then raise exception 'Need at least 3 players'; end if;

  select user_id into v_first from ddd_turn_order_players(p_game_id) limit 1;

  update ddd_players set has_completed_turn = false where game_id = p_game_id;

  update ddd_games set
    status = 'active',
    round_number = round_number + 1,
    current_turn_index = 0,
    current_turn_user_id = v_first,
    turn_started_at = now(),
    phase = 'turn_start',
    phase_ends_at = now() + interval '3 seconds',
    updated_at = now()
  where id = p_game_id;
end;
$$;

-- ============================================================
-- RPC: reactions + state
-- ============================================================

create or replace function add_ddd_reaction(
  p_game_id uuid,
  p_turn_id uuid,
  p_reaction_type text
)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_reaction_type not in ('heart', 'laugh', 'shock', 'fire') then
    raise exception 'Invalid reaction';
  end if;

  insert into ddd_reactions (game_id, turn_id, user_id, reaction_type)
  values (p_game_id, p_turn_id, v_uid, p_reaction_type)
  on conflict (turn_id, user_id) do update set reaction_type = excluded.reaction_type;

  perform ddd_touch_game(p_game_id);
end;
$$;

create or replace function get_active_ddd_game(p_room_id text)
returns uuid language sql stable security definer set search_path = public as $$
  select id from ddd_games
  where room_id = p_room_id and status in ('lobby', 'active', 'round_end')
  order by created_at desc limit 1;
$$;

create or replace function get_ddd_public_state(p_game_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_game jsonb;
  v_players jsonb;
  v_current_turn jsonb;
  v_reactions jsonb;
  v_summary jsonb;
  v_round int;
begin
  select to_jsonb(g.*) into v_game from ddd_games g where g.id = p_game_id;
  if v_game is null then return null; end if;
  v_round := (v_game->>'round_number')::int;

  select coalesce(jsonb_agg(to_jsonb(p.*) order by p.join_order, p.joined_at), '[]'::jsonb)
  into v_players from ddd_players p where p.game_id = p_game_id and p.is_active and p.left_at is null;

  select to_jsonb(t.*) into v_current_turn from ddd_turns t
  where t.game_id = p_game_id and t.round_number = v_round
    and t.turn_number = (v_game->>'current_turn_index')::int
  limit 1;

  if v_current_turn is not null then
    select coalesce(jsonb_agg(to_jsonb(r.*)), '[]'::jsonb) into v_reactions
    from ddd_reactions r where r.turn_id = (v_current_turn->>'id')::uuid;
  else
    v_reactions := '[]'::jsonb;
  end if;

  if (v_game->>'status') = 'round_end' then
    v_summary := ddd_build_round_summary(p_game_id, v_round);
  end if;

  return jsonb_build_object(
    'game', v_game,
    'players', v_players,
    'currentTurn', v_current_turn,
    'reactions', coalesce(v_reactions, '[]'::jsonb),
    'roundSummary', v_summary
  );
end;
$$;

-- Realtime
do $$ begin alter publication supabase_realtime add table ddd_games;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table ddd_players;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table ddd_turns;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table ddd_reactions;
exception when duplicate_object then null; end $$;

grant execute on function create_ddd_game(text) to authenticated;
grant execute on function join_ddd_game(uuid, text, text, int) to authenticated;
grant execute on function leave_ddd_game(uuid) to authenticated;
grant execute on function start_ddd_game(uuid) to authenticated;
grant execute on function end_ddd_game(uuid) to authenticated;
grant execute on function end_active_ddd_game_for_room(text) to authenticated;
grant execute on function submit_ddd_turn(uuid, uuid, uuid, uuid, text, text, text) to authenticated;
grant execute on function auto_submit_ddd_turn(uuid) to authenticated;
grant execute on function advance_ddd_phase(uuid) to authenticated;
grant execute on function advance_ddd_phase_if_due(uuid) to authenticated;
grant execute on function start_ddd_next_round(uuid) to authenticated;
grant execute on function add_ddd_reaction(uuid, uuid, text) to authenticated;
grant execute on function get_active_ddd_game(text) to authenticated;
grant execute on function get_ddd_public_state(uuid) to authenticated;
