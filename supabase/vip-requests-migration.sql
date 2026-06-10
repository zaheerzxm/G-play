-- VIP + purchase requests: users request weekly VIP or coin top-ups, super admins approve/reject
alter table profiles add column if not exists vip_points bigint not null default 0;
alter table profiles add column if not exists vip_expires_at timestamptz;

create table if not exists vip_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  -- requested_level is kept for old clients; current app grows level from vip_points.
  requested_level int not null default 1 check (requested_level between 1 and 10),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (user_id)
);

create index if not exists vip_requests_status_created_idx
  on vip_requests (status, created_at desc);

alter table vip_requests enable row level security;

alter table vip_requests drop constraint if exists vip_requests_requested_level_check;
alter table vip_requests add constraint vip_requests_requested_level_check
  check (requested_level between 1 and 10);

create table if not exists coin_purchase_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  pack_id text not null,
  coins bigint not null check (coins > 0),
  price_label text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists coin_purchase_requests_status_created_idx
  on coin_purchase_requests (status, created_at desc);

create index if not exists coin_purchase_requests_user_status_idx
  on coin_purchase_requests (user_id, status, created_at desc);

alter table coin_purchase_requests enable row level security;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select p.is_super_admin from profiles p where p.id = auth.uid()), false);
$$;

grant execute on function public.is_super_admin() to authenticated;

drop policy if exists "profiles update super admin" on profiles;
create policy "profiles update super admin" on profiles
  for update using (public.is_super_admin())
  with check (true);

drop policy if exists "vip_requests read own or super" on vip_requests;
drop policy if exists "vip_requests insert own" on vip_requests;
drop policy if exists "vip_requests update own pending" on vip_requests;
drop policy if exists "vip_requests update super" on vip_requests;
drop policy if exists "coin_purchase_requests read own or super" on coin_purchase_requests;
drop policy if exists "coin_purchase_requests insert own" on coin_purchase_requests;
drop policy if exists "coin_purchase_requests update super" on coin_purchase_requests;

create policy "vip_requests read own or super" on vip_requests
  for select using (
    auth.uid() = user_id
    or public.is_super_admin()
  );

create policy "vip_requests insert own" on vip_requests
  for insert with check (auth.uid() = user_id);

create policy "vip_requests update own pending" on vip_requests
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status = 'pending');

create policy "vip_requests update super" on vip_requests
  for update using (public.is_super_admin())
  with check (true);

create policy "coin_purchase_requests read own or super" on coin_purchase_requests
  for select using (
    auth.uid() = user_id
    or public.is_super_admin()
  );

create policy "coin_purchase_requests insert own" on coin_purchase_requests
  for insert with check (auth.uid() = user_id);

create policy "coin_purchase_requests update super" on coin_purchase_requests
  for update using (public.is_super_admin())
  with check (true);

do $$ begin alter publication supabase_realtime add table vip_requests; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table coin_purchase_requests; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table profiles; exception when duplicate_object then null; end $$;
