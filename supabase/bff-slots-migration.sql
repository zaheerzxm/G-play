-- BFF slot limits + locked bonds (FB-001). Safe to run multiple times in Supabase SQL Editor.

alter table profiles add column if not exists bff_slot_base int not null default 3;
alter table profiles add column if not exists bff_slots_purchased int not null default 0;

create or replace function public.is_bff_bond_type(p_type text)
returns boolean
language sql
immutable
as $$
  select coalesce(p_type, '') in ('bff', 'bestie', 'bro', 'sis');
$$;

create or replace function public.bff_slot_limit(p_user_id uuid)
returns int
language sql
stable
as $$
  select coalesce(
    (
      select least(
        99,
        greatest(0, coalesce(p.bff_slot_base, 3)) + greatest(0, coalesce(p.bff_slots_purchased, 0))
      )
      from profiles p
      where p.id = p_user_id
    ),
    3
  );
$$;

create or replace function public.bff_slot_count(
  p_user_id uuid,
  p_exclude_user_a uuid default null,
  p_exclude_user_b uuid default null
)
returns int
language sql
stable
as $$
  select count(*)::int
  from user_relationships ur
  where (ur.user_a = p_user_id or ur.user_b = p_user_id)
    and ur.status = 'active'
    and public.is_bff_bond_type(ur.bond_type)
    and (
      p_exclude_user_a is null
      or not (ur.user_a = p_exclude_user_a and ur.user_b = p_exclude_user_b)
    );
$$;

create or replace function public.load_bff_locked_bonds(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if p_user_id is null then
    return '[]'::jsonb;
  end if;
  if auth.uid() is distinct from p_user_id then
    raise exception 'Not authorized';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', ur.id,
        'user_a', ur.user_a,
        'user_b', ur.user_b,
        'bond_type', ur.bond_type,
        'started_at', ur.started_at,
        'partner_id', case when ur.user_a = p_user_id then ur.user_b else ur.user_a end
      )
      order by ur.started_at desc nulls last
    ),
    '[]'::jsonb
  )
  into result
  from user_relationships ur
  where (ur.user_a = p_user_id or ur.user_b = p_user_id)
    and ur.status = 'locked'
    and public.is_bff_bond_type(ur.bond_type);

  return coalesce(result, '[]'::jsonb);
end;
$$;

-- Unlock cost: 500 coins (see src/bffSlots.js BFF_UNLOCK_COIN_COST)
create or replace function public.unlock_bff_bond(
  p_user_id uuid,
  p_other_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  unlock_cost bigint := 500;
  pair_a uuid;
  pair_b uuid;
  row_rec user_relationships%rowtype;
  wallet_coins bigint;
  new_balance bigint;
  partner_id uuid;
begin
  if p_user_id is null or p_other_id is null or p_user_id = p_other_id then
    raise exception 'Invalid users';
  end if;
  if auth.uid() is distinct from p_user_id then
    raise exception 'Not authorized';
  end if;

  if p_user_id < p_other_id then
    pair_a := p_user_id;
    pair_b := p_other_id;
  else
    pair_a := p_other_id;
    pair_b := p_user_id;
  end if;

  select * into row_rec
  from user_relationships
  where user_a = pair_a and user_b = pair_b and status = 'locked';

  if row_rec.id is null then
    raise exception 'No locked BFF bond found';
  end if;
  if not public.is_bff_bond_type(row_rec.bond_type) then
    raise exception 'Not a BFF-family bond';
  end if;

  partner_id := case when row_rec.user_a = p_user_id then row_rec.user_b else row_rec.user_a end;

  if public.bff_slot_count(partner_id, pair_a, pair_b) >= public.bff_slot_limit(partner_id) then
    raise exception 'partner_slot_full';
  end if;

  select coins into wallet_coins
  from wallets
  where user_id = p_user_id::text
  for update;

  if coalesce(wallet_coins, 0) < unlock_cost then
    raise exception 'Insufficient coins';
  end if;

  if public.bff_slot_limit(p_user_id) >= 99
     and public.bff_slot_count(p_user_id, pair_a, pair_b) >= public.bff_slot_limit(p_user_id) then
    raise exception 'Maximum BFF slots (99) reached';
  end if;

  if public.bff_slot_count(p_user_id, pair_a, pair_b) >= public.bff_slot_limit(p_user_id) then
    update profiles
    set bff_slots_purchased = bff_slots_purchased + 1
    where id = p_user_id;
  end if;

  update wallets
  set coins = coins - unlock_cost, updated_at = now()
  where user_id = p_user_id::text
  returning coins into new_balance;

  update user_relationships
  set status = 'active',
      level = greatest(level, 1),
      relationship_level = greatest(relationship_level, level, 1)
  where id = row_rec.id
  returning * into row_rec;

  return jsonb_build_object(
    'status', row_rec.status,
    'bond_type', row_rec.bond_type,
    'coins_spent', unlock_cost,
    'new_balance', new_balance,
    'partner_id', partner_id,
    'slot_limit', public.bff_slot_limit(p_user_id),
    'slots_used', public.bff_slot_count(p_user_id, null, null)
  );
end;
$$;

create or replace function public.respond_user_bond(
  p_responder_id uuid,
  p_other_id uuid,
  p_accept boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pair_a uuid;
  pair_b uuid;
  row_rec user_relationships%rowtype;
  bond_type text;
  next_status text;
begin
  if p_responder_id is null or p_other_id is null then
    raise exception 'Invalid users';
  end if;

  if p_responder_id < p_other_id then
    pair_a := p_responder_id;
    pair_b := p_other_id;
  else
    pair_a := p_other_id;
    pair_b := p_responder_id;
  end if;

  select * into row_rec from user_relationships where user_a = pair_a and user_b = pair_b;
  if row_rec.id is null or row_rec.status <> 'pending' then
    raise exception 'No pending proposal';
  end if;
  if row_rec.proposed_by = p_responder_id then
    raise exception 'Cannot respond to your own proposal';
  end if;

  if p_accept then
    bond_type := coalesce(row_rec.proposed_bond_type, 'cp');

    if bond_type in ('cp', 'wedding', 'choti_ghar_wali', 'badi_ghar_wali') then
      perform public.assert_cp_slot_available(p_responder_id, pair_a, pair_b);
      perform public.assert_cp_slot_available(row_rec.proposed_by, pair_a, pair_b);
      next_status := 'active';
    elsif public.is_bff_bond_type(bond_type) then
      if public.bff_slot_count(p_responder_id, pair_a, pair_b) >= public.bff_slot_limit(p_responder_id)
         or public.bff_slot_count(row_rec.proposed_by, pair_a, pair_b) >= public.bff_slot_limit(row_rec.proposed_by) then
        next_status := 'locked';
      else
        next_status := 'active';
      end if;
    else
      next_status := 'active';
    end if;

    update user_relationships
    set status = next_status,
        bond_type = bond_type,
        started_at = now(),
        proposed_by = null,
        proposed_bond_type = null,
        level = greatest(level, 1),
        relationship_level = greatest(relationship_level, level, 1)
    where id = row_rec.id
    returning * into row_rec;
  else
    update user_relationships
    set status = 'tracking',
        proposed_by = null,
        proposed_bond_type = null,
        bond_type = null
    where id = row_rec.id
    returning * into row_rec;
  end if;

  return jsonb_build_object(
    'status', row_rec.status,
    'bond_type', row_rec.bond_type,
    'guard_a', row_rec.guard_a,
    'guard_b', row_rec.guard_b
  );
end;
$$;

grant execute on function public.bff_slot_limit(uuid) to authenticated;
grant execute on function public.bff_slot_count(uuid, uuid, uuid) to authenticated;
grant execute on function public.load_bff_locked_bonds(uuid) to authenticated;
grant execute on function public.unlock_bff_bond(uuid, uuid) to authenticated;
grant execute on function public.respond_user_bond(uuid, uuid, boolean) to authenticated;
