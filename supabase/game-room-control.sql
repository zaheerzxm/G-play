-- Room/game controller authorization for Mafia & DDD.
-- Mirrors src/games/gameRoomControl.js canControlRoomGame().
-- Run in Supabase SQL Editor. Safe to re-run.

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
  if p_user_id is null then
    return false;
  end if;

  if p_game_host_id is not null and p_game_host_id = p_user_id then
    return true;
  end if;

  if exists (
    select 1 from rooms r
    where r.id = p_room_id and r.owner_id = p_user_id
  ) then
    return true;
  end if;

  if exists (
    select 1 from seats s
    where s.room_id = p_room_id and s.seat_number = 1 and s.user_id = p_user_id
  ) then
    return true;
  end if;

  if exists (
    select 1 from seats s
    where s.room_id = p_room_id and s.seat_number = 2 and s.user_id = p_user_id
  ) then
    return true;
  end if;

  if exists (
    select 1 from room_admins ra
    where ra.room_id = p_room_id and ra.user_id = p_user_id
  ) then
    return true;
  end if;

  if exists (
    select 1 from profiles p
    where p.id = p_user_id and p.is_super_admin = true
  ) then
    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.can_control_room_game(text, uuid, uuid) to authenticated;

-- Mafia: start / end / kick / stop room game
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
  if not can_control_room_game(v_game.room_id, v_game.host_id, v_uid) then
    raise exception 'Not authorized to start game';
  end if;
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
  if not can_control_room_game(v_game.room_id, v_game.host_id, v_uid) then
    raise exception 'Not authorized to end game';
  end if;

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
declare
  v_uid uuid := auth.uid();
  v_game mafia_games;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_game from mafia_games where id = p_game_id;
  if not can_control_room_game(v_game.room_id, v_game.host_id, v_uid) then
    raise exception 'Not authorized to kick players';
  end if;
  delete from mafia_players where game_id = p_game_id and user_id = p_target_user_id;
  perform mafia_touch_game(p_game_id);
end;
$$;

create or replace function end_active_mafia_game_for_room(p_room_id text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_game_id uuid;
  v_game mafia_games;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select id into v_game_id
  from mafia_games
  where room_id = p_room_id and status in ('lobby', 'active')
  order by created_at desc
  limit 1;

  if v_game_id is null then return null; end if;

  select * into v_game from mafia_games where id = v_game_id;

  if not can_control_room_game(p_room_id, v_game.host_id, v_uid) then
    raise exception 'Not authorized to stop Mafia';
  end if;

  update mafia_games
  set status = 'cancelled', phase = 'game_over', ended_at = now(), phase_ends_at = null
  where id = v_game_id;

  perform mafia_log_event(
    v_game_id, v_game.round_number, 'game_over', 'Game stopped', '{}'::jsonb
  );

  return v_game_id;
end;
$$;

-- DDD: start / end / next round / stop room game
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
