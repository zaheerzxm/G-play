-- Clan economy phase A (FB-003): donate + chest claims. Safe to re-run.

create table if not exists clan_economy_ledger (
  id bigint generated always as identity primary key,
  clan_id uuid not null references clans(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  kind text not null,
  clan_coins_delta bigint not null default 0,
  fund_delta bigint not null default 0,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists clan_economy_ledger_clan_idx
  on clan_economy_ledger (clan_id, created_at desc);

create table if not exists clan_chest_claims (
  user_id uuid not null references profiles(id) on delete cascade,
  clan_id uuid not null references clans(id) on delete cascade,
  chest_id text not null,
  period_key text not null,
  reward_json jsonb not null default '{}',
  claimed_at timestamptz not null default now(),
  primary key (user_id, clan_id, chest_id, period_key)
);

create table if not exists clan_member_weekly_stats (
  user_id uuid not null references profiles(id) on delete cascade,
  clan_id uuid not null references clans(id) on delete cascade,
  week_key text not null,
  donated bigint not null default 0,
  primary key (user_id, clan_id, week_key)
);

alter table clan_economy_ledger enable row level security;
alter table clan_chest_claims enable row level security;
alter table clan_member_weekly_stats enable row level security;

drop policy if exists "clan_chest_claims read own" on clan_chest_claims;
create policy "clan_chest_claims read own" on clan_chest_claims
  for select using (user_id = auth.uid());

drop policy if exists "clan_member_weekly_stats read own" on clan_member_weekly_stats;
create policy "clan_member_weekly_stats read own" on clan_member_weekly_stats
  for select using (user_id = auth.uid());

drop policy if exists "clan_economy_ledger read members" on clan_economy_ledger;
create policy "clan_economy_ledger read members" on clan_economy_ledger
  for select using (public.is_clan_member(clan_id));

create or replace function public.clan_week_key()
returns text
language sql
stable
as $$
  select to_char(current_date, 'IYYY') || '-W' || lpad(extract(week from current_date)::text, 2, '0');
$$;

create or replace function public.clan_tasks_claimed_today(p_user_id uuid, p_clan_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from clan_task_claims c
  where c.user_id = p_user_id
    and c.clan_id = p_clan_id
    and c.claimed_date = current_date;
$$;

grant execute on function public.clan_week_key() to authenticated;
grant execute on function public.clan_tasks_claimed_today(uuid, uuid) to authenticated;

create or replace function public.donate_to_clan(
  p_clan_id uuid,
  p_amount bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  amount bigint := floor(coalesce(p_amount, 0));
  v_week_key text := public.clan_week_key();
  wallet_coins bigint;
  new_wallet bigint;
  clan_row clans%rowtype;
  member_row clan_members%rowtype;
  weekly_donated bigint;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_clan_id is null then
    raise exception 'Clan required';
  end if;
  if amount < 10 then
    raise exception 'Minimum donation is 10 coins';
  end if;
  if amount > 1000000 then
    raise exception 'Maximum donation is 1,000,000 coins';
  end if;
  if not public.is_clan_member(p_clan_id) then
    raise exception 'Not a clan member';
  end if;

  select * into member_row
  from clan_members
  where clan_id = p_clan_id and user_id = uid
  for update;

  if member_row.user_id is null then
    raise exception 'Not a clan member';
  end if;

  select coins into wallet_coins
  from wallets
  where user_id = uid::text
  for update;

  if coalesce(wallet_coins, 0) < amount then
    raise exception 'Insufficient coins';
  end if;

  new_wallet := wallet_coins - amount;
  update wallets
  set coins = new_wallet, updated_at = now()
  where user_id = uid::text;

  select * into clan_row
  from clans
  where id = p_clan_id
  for update;

  if clan_row.id is null then
    raise exception 'Clan not found';
  end if;

  update clans
  set fund = coalesce(fund, 0) + amount,
      clan_coins = coalesce(clan_coins, 0) + amount
  where id = p_clan_id
  returning * into clan_row;

  insert into clan_member_weekly_stats (user_id, clan_id, week_key, donated)
  values (uid, p_clan_id, v_week_key, amount)
  on conflict (user_id, clan_id, week_key)
  do update set donated = clan_member_weekly_stats.donated + excluded.donated
  returning donated into weekly_donated;

  update clan_members
  set weekly_donation = weekly_donated,
      total_donation = coalesce(total_donation, 0) + amount
  where clan_id = p_clan_id and user_id = uid;

  insert into clan_economy_ledger (clan_id, user_id, kind, clan_coins_delta, fund_delta, meta)
  values (
    p_clan_id,
    uid,
    'donate',
    amount,
    amount,
    jsonb_build_object('amount', amount)
  );

  return jsonb_build_object(
    'new_balance', new_wallet,
    'fund', clan_row.fund,
    'clan_coins', clan_row.clan_coins,
    'weekly_donation', weekly_donated,
    'total_donation', coalesce(member_row.total_donation, 0) + amount
  );
end;
$$;

grant execute on function public.donate_to_clan(uuid, bigint) to authenticated;

create or replace function public.open_clan_chest(
  p_clan_id uuid,
  p_chest_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  clan_row clans%rowtype;
  tasks_today int;
  required_tasks int := null;
  required_level int := null;
  reward_coins bigint := 0;
  period_key text;
  wallet_coins bigint;
  new_wallet bigint;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_clan_id is null or p_chest_id is null or length(trim(p_chest_id)) = 0 then
    raise exception 'Invalid chest';
  end if;
  if not public.is_clan_member(p_clan_id) then
    raise exception 'Not a clan member';
  end if;

  case p_chest_id
    when 'activeness_25' then
      required_tasks := 1; reward_coins := 25; period_key := current_date::text;
    when 'activeness_50' then
      required_tasks := 2; reward_coins := 50; period_key := current_date::text;
    when 'activeness_75' then
      required_tasks := 3; reward_coins := 75; period_key := current_date::text;
    when 'activeness_100' then
      required_tasks := 4; reward_coins := 100; period_key := current_date::text;
    when 'treasury_level_2' then
      required_level := 2; reward_coins := 120; period_key := 'lifetime';
    when 'treasury_level_5' then
      required_level := 5; reward_coins := 300; period_key := 'lifetime';
    else
      raise exception 'Unknown chest';
  end case;

  select * into clan_row from clans where id = p_clan_id;
  if clan_row.id is null then
    raise exception 'Clan not found';
  end if;

  if required_tasks is not null then
    tasks_today := public.clan_tasks_claimed_today(uid, p_clan_id);
    if tasks_today < required_tasks then
      raise exception 'Complete more clan tasks today';
    end if;
  end if;

  if required_level is not null then
    if coalesce(clan_row.level, 1) < required_level then
      raise exception 'Clan level too low';
    end if;
  end if;

  if exists (
    select 1 from clan_chest_claims
    where user_id = uid and clan_id = p_clan_id
      and chest_id = p_chest_id and period_key = period_key
  ) then
    raise exception 'Chest already claimed';
  end if;

  select coins into wallet_coins
  from wallets
  where user_id = uid::text
  for update;

  new_wallet := coalesce(wallet_coins, 0) + reward_coins;
  update wallets
  set coins = new_wallet, updated_at = now()
  where user_id = uid::text;

  insert into clan_chest_claims (user_id, clan_id, chest_id, period_key, reward_json)
  values (
    uid,
    p_clan_id,
    p_chest_id,
    period_key,
    jsonb_build_object('type', 'coins', 'amount', reward_coins)
  );

  insert into clan_economy_ledger (clan_id, user_id, kind, clan_coins_delta, fund_delta, meta)
  values (
    p_clan_id,
    uid,
    'chest',
    0,
    0,
    jsonb_build_object('chest_id', p_chest_id, 'reward_coins', reward_coins)
  );

  return jsonb_build_object(
    'chest_id', p_chest_id,
    'reward', jsonb_build_object('type', 'coins', 'amount', reward_coins),
    'new_balance', new_wallet
  );
end;
$$;

grant execute on function public.open_clan_chest(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Phase B: clan store + gacha (spend clan_coins; leaders/deputies/admins only)
-- ---------------------------------------------------------------------------

create table if not exists public.clan_store_purchases (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid not null references public.clans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null,
  clan_coins_spent int not null check (clan_coins_spent > 0),
  reward jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create index if not exists idx_clan_store_purchases_clan on public.clan_store_purchases(clan_id, created_at desc);

create table if not exists public.clan_gacha_pulls (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid not null references public.clans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  pull_count int not null check (pull_count in (1, 10)),
  clan_coins_spent int not null check (clan_coins_spent > 0),
  rewards jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_clan_gacha_pulls_clan on public.clan_gacha_pulls(clan_id, created_at desc);

alter table public.clan_store_purchases enable row level security;
alter table public.clan_gacha_pulls enable row level security;

drop policy if exists "clan_store_purchases read own" on public.clan_store_purchases;
create policy "clan_store_purchases read own"
  on public.clan_store_purchases for select
  using (user_id = auth.uid());

drop policy if exists "clan_gacha_pulls read own" on public.clan_gacha_pulls;
create policy "clan_gacha_pulls read own"
  on public.clan_gacha_pulls for select
  using (user_id = auth.uid());

create or replace function public.can_spend_clan_treasury(p_clan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((select p.is_super_admin from public.profiles p where p.id = auth.uid()), false)
    or coalesce(public.clan_member_role(p_clan_id) in ('leader', 'deputy', 'admin'), false);
$$;

create or replace function public.grant_gift_inventory(
  p_user_id uuid,
  p_gift_id text,
  p_qty int,
  p_expires_days int default 7
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  have int;
  next_qty int;
  exp_at timestamptz := now() + make_interval(days => p_expires_days);
begin
  select quantity into have
  from public.gift_inventory
  where user_id = p_user_id and gift_id = p_gift_id
  for update;

  if found then
    next_qty := have + p_qty;
    update public.gift_inventory
    set quantity = next_qty, expires_at = exp_at
    where user_id = p_user_id and gift_id = p_gift_id;
  else
    next_qty := p_qty;
    insert into public.gift_inventory (user_id, gift_id, quantity, expires_at)
    values (p_user_id, p_gift_id, p_qty, exp_at);
  end if;

  return next_qty;
end;
$$;

create or replace function public.clan_gacha_roll_reward()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r double precision := random();
begin
  if r < 0.55 then
    return jsonb_build_object('type', 'coins', 'amount', 15 + floor(random() * 16)::int);
  elsif r < 0.80 then
    return jsonb_build_object('type', 'gift', 'gift_id', 'pkg_rose', 'quantity', 1);
  elsif r < 0.92 then
    return jsonb_build_object('type', 'gift', 'gift_id', 'pkg_heart', 'quantity', 1);
  elsif r < 0.98 then
    return jsonb_build_object(
      'type', 'clan_item',
      'item_id', 'clan_gacha_frame',
      'name', 'Clan Gacha Frame',
      'emoji', '🖼️'
    );
  else
    return jsonb_build_object('type', 'coins', 'amount', 200);
  end if;
end;
$$;

create or replace function public.purchase_clan_store_item(p_clan_id uuid, p_item_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  clan_row public.clans%rowtype;
  price int;
  reward jsonb;
  one_time boolean := false;
  new_wallet int;
  new_qty int;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_clan_member(p_clan_id) then
    raise exception 'Not a clan member';
  end if;

  if not public.can_spend_clan_treasury(p_clan_id) then
    raise exception 'Only clan leaders can spend clan treasury';
  end if;

  case p_item_id
    when 'clan_store_badge_honor' then
      price := 500; one_time := true;
      reward := jsonb_build_object('type', 'clan_item', 'item_id', p_item_id, 'name', 'Honor Badge', 'emoji', '🏅');
    when 'clan_store_badge_unity' then
      price := 400; one_time := true;
      reward := jsonb_build_object('type', 'clan_item', 'item_id', p_item_id, 'name', 'Unity Badge', 'emoji', '🤝');
    when 'clan_store_frame' then
      price := 1200; one_time := true;
      reward := jsonb_build_object('type', 'clan_item', 'item_id', p_item_id, 'name', 'Clan Frame', 'emoji', '🖼️');
    when 'clan_store_flag' then
      price := 800; one_time := true;
      reward := jsonb_build_object('type', 'clan_item', 'item_id', p_item_id, 'name', 'Clan Flag', 'emoji', '🚩');
    when 'clan_store_gift_rose' then
      price := 350;
      reward := jsonb_build_object('type', 'gift', 'gift_id', 'pkg_rose', 'quantity', 3);
    when 'clan_store_gift_heart' then
      price := 450;
      reward := jsonb_build_object('type', 'gift', 'gift_id', 'pkg_heart', 'quantity', 3);
    when 'clan_store_boost' then
      price := 1000;
      reward := jsonb_build_object('type', 'clan_item', 'item_id', p_item_id, 'name', 'Clan Boost', 'emoji', '⚡');
    else
      raise exception 'Unknown store item';
  end case;

  if one_time and exists (
    select 1 from public.clan_store_purchases
    where user_id = uid and item_id = p_item_id
  ) then
    raise exception 'Already purchased';
  end if;

  select * into clan_row from public.clans where id = p_clan_id for update;
  if not found then
    raise exception 'Clan not found';
  end if;

  if coalesce(clan_row.clan_coins, 0) < price then
    raise exception 'Not enough clan coins';
  end if;

  update public.clans
  set clan_coins = clan_coins - price
  where id = p_clan_id;

  insert into public.clan_economy_ledger (
    clan_id, user_id, kind, clan_coins_delta, fund_delta, meta
  ) values (
    p_clan_id, uid, 'store', -price, 0,
    jsonb_build_object('item_id', p_item_id, 'reward', reward)
  );

  insert into public.clan_store_purchases (clan_id, user_id, item_id, clan_coins_spent, reward)
  values (p_clan_id, uid, p_item_id, price, reward);

  if reward->>'type' = 'gift' then
    perform public.grant_gift_inventory(
      uid,
      reward->>'gift_id',
      (reward->>'quantity')::int
    );
  elsif reward->>'type' = 'coins' then
    update public.profiles
    set coins = coalesce(coins, 0) + (reward->>'amount')::int
    where id = uid
    returning coins into new_wallet;
  end if;

  return jsonb_build_object(
    'item_id', p_item_id,
    'clan_coins_spent', price,
    'clan_coins', clan_row.clan_coins - price,
    'fund', clan_row.fund,
    'reward', reward,
    'new_balance', new_wallet
  );
end;
$$;

create or replace function public.pull_clan_gacha(p_clan_id uuid, p_count int default 1)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  clan_row public.clans%rowtype;
  pull_count int;
  cost int;
  rewards jsonb := '[]'::jsonb;
  i int;
  rolled jsonb;
  new_wallet int;
  wallet_delta int := 0;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_clan_member(p_clan_id) then
    raise exception 'Not a clan member';
  end if;

  if not public.can_spend_clan_treasury(p_clan_id) then
    raise exception 'Only clan leaders can spend clan treasury';
  end if;

  pull_count := greatest(1, least(10, coalesce(p_count, 1)));
  if pull_count not in (1, 10) then
    raise exception 'Invalid pull count';
  end if;

  cost := case when pull_count = 10 then 4500 else 500 * pull_count end;

  select * into clan_row from public.clans where id = p_clan_id for update;
  if not found then
    raise exception 'Clan not found';
  end if;

  if coalesce(clan_row.clan_coins, 0) < cost then
    raise exception 'Not enough clan coins';
  end if;

  update public.clans
  set clan_coins = clan_coins - cost
  where id = p_clan_id;

  insert into public.clan_economy_ledger (
    clan_id, user_id, kind, clan_coins_delta, fund_delta, meta
  ) values (
    p_clan_id, uid, 'gacha', -cost, 0,
    jsonb_build_object('pull_count', pull_count)
  );

  for i in 1..pull_count loop
    rolled := public.clan_gacha_roll_reward();
    rewards := rewards || jsonb_build_array(rolled);

    if rolled->>'type' = 'gift' then
      perform public.grant_gift_inventory(
        uid,
        rolled->>'gift_id',
        (rolled->>'quantity')::int
      );
    elsif rolled->>'type' = 'coins' then
      wallet_delta := wallet_delta + (rolled->>'amount')::int;
    end if;
  end loop;

  if wallet_delta > 0 then
    update public.profiles
    set coins = coalesce(coins, 0) + wallet_delta
    where id = uid
    returning coins into new_wallet;
  end if;

  insert into public.clan_gacha_pulls (clan_id, user_id, pull_count, clan_coins_spent, rewards)
  values (p_clan_id, uid, pull_count, cost, rewards);

  return jsonb_build_object(
    'pull_count', pull_count,
    'clan_coins_spent', cost,
    'clan_coins', clan_row.clan_coins - cost,
    'fund', clan_row.fund,
    'rewards', rewards,
    'new_balance', new_wallet
  );
end;
$$;

grant execute on function public.can_spend_clan_treasury(uuid) to authenticated;
grant execute on function public.purchase_clan_store_item(uuid, text) to authenticated;
grant execute on function public.pull_clan_gacha(uuid, int) to authenticated;
