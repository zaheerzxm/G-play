-- Atomic seat invite accept: clears prior seat, claims target, marks invite accepted.
create or replace function public.accept_seat_invite(
  p_room_id text,
  p_invitee_id uuid,
  p_display_name text,
  p_seat_number int default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
  v_target record;
  v_seat int;
  v_claimed int;
  v_keep_mic_on boolean := true;
begin
  select *
  into v_invite
  from seat_invites
  where room_id = p_room_id
    and invitee_id = p_invitee_id
    and status = 'pending'
    and created_at >= now() - interval '30 seconds'
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'Invite expired';
  end if;

  v_seat := coalesce(nullif(p_seat_number, 0), v_invite.seat_number);

  select *
  into v_target
  from seats
  where room_id = p_room_id
    and seat_number = v_seat
  for update;

  if not found then
    raise exception 'Seat not found';
  end if;

  if v_target.is_locked then
    raise exception 'This seat is locked';
  end if;

  if v_target.user_id is not null and v_target.user_id <> p_invitee_id then
    raise exception 'Seat was just taken';
  end if;

  select coalesce(mic_on, true)
  into v_keep_mic_on
  from seats
  where room_id = p_room_id
    and user_id = p_invitee_id
  limit 1;

  update seats
  set user_id = null,
      nickname = null,
      updated_at = now()
  where room_id = p_room_id
    and user_id = p_invitee_id
    and seat_number <> v_seat;

  update seats
  set user_id = p_invitee_id,
      nickname = coalesce(nullif(trim(p_display_name), ''), nickname, 'Guest'),
      mic_on = v_keep_mic_on,
      updated_at = now()
  where room_id = p_room_id
    and seat_number = v_seat
    and (user_id is null or user_id = p_invitee_id)
  returning seat_number into v_claimed;

  if v_claimed is null then
    raise exception 'Seat was just taken by someone else';
  end if;

  update seat_invites
  set status = 'accepted'
  where room_id = p_room_id
    and invitee_id = p_invitee_id
    and status = 'pending';

  return jsonb_build_object('seat_number', v_claimed);
end;
$$;

grant execute on function public.accept_seat_invite(text, uuid, text, int) to anon, authenticated;
