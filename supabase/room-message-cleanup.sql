-- Room chat retention: TTL for all rooms + wipe temp-room chat when nobody is online.
-- Run in Supabase SQL editor (or merge into RUN-THIS.sql).

create index if not exists messages_room_created_idx
  on messages (room_id, created_at);

create or replace function public.purge_stale_room_messages(
  p_room_id text default null,
  p_message_ttl interval default interval '24 hours',
  p_presence_ttl interval default interval '90 seconds'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ttl_deleted bigint := 0;
  v_empty_deleted bigint := 0;
begin
  with ttl_rows as (
    delete from messages m
    where m.created_at < now() - p_message_ttl
      and (p_room_id is null or m.room_id = p_room_id)
    returning 1
  )
  select count(*) into v_ttl_deleted from ttl_rows;

  with empty_temp as (
    select r.id as room_id
    from rooms r
    where r.is_temp = true
      and (p_room_id is null or r.id = p_room_id)
      and not exists (
        select 1
        from presence p
        where p.room_id = r.id
          and p.last_seen > now() - p_presence_ttl
      )
      and not exists (
        select 1
        from seats s
        where s.room_id = r.id
          and s.user_id is not null
      )
  ),
  empty_rows as (
    delete from messages m
    using empty_temp e
    where m.room_id = e.room_id
    returning 1
  )
  select count(*) into v_empty_deleted from empty_rows;

  return jsonb_build_object(
    'ttl_deleted', v_ttl_deleted,
    'empty_temp_deleted', v_empty_deleted
  );
end;
$$;

revoke all on function public.purge_stale_room_messages(text, interval, interval) from public;
grant execute on function public.purge_stale_room_messages(text, interval, interval) to authenticated;
