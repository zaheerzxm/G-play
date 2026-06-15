-- FB-004: typed clan chat messages (text / gift / system) + spoof protection
-- Run after supabase/clans.sql

alter table public.clan_messages
  add column if not exists message_type text not null default 'text'
    check (message_type in ('text', 'gift', 'system')),
  add column if not exists payload jsonb;

create or replace function public.clan_message_looks_spoofed(p_message text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    coalesce(p_message, '') ~ '— won [0-9]+ gold'
    or coalesce(p_message, '') ~* '^Receiver''s Charm \+'
    or coalesce(p_message, '') ~* '^Receiver''s Gold \+'
    or coalesce(p_message, '') ~* 'donated [0-9]+.*family fund'
    or coalesce(p_message, '') ~* '^\[\[clan_';
$$;

create or replace function public.clan_messages_validate_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if TG_OP <> 'INSERT' then
    return NEW;
  end if;

  if NEW.message_type is null then
    NEW.message_type := 'text';
  end if;

  if coalesce(current_setting('app.clan_chat_typed_insert', true), '') = '1' then
    return NEW;
  end if;

  if NEW.message_type <> 'text' then
    raise exception 'Typed clan messages require authorized insert';
  end if;

  if public.clan_message_looks_spoofed(NEW.message) then
    raise exception 'Message not allowed';
  end if;

  NEW.payload := null;
  return NEW;
end;
$$;

drop trigger if exists clan_messages_validate_insert on public.clan_messages;
create trigger clan_messages_validate_insert
  before insert on public.clan_messages
  for each row execute function public.clan_messages_validate_insert();

create or replace function public.send_clan_chat_message(p_clan_id uuid, p_message text)
returns public.clan_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  trimmed text := trim(coalesce(p_message, ''));
  row public.clan_messages%rowtype;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_clan_id is null then
    raise exception 'Clan required';
  end if;
  if trimmed = '' then
    raise exception 'Message is empty';
  end if;
  if length(trimmed) > 500 then
    raise exception 'Message is too long';
  end if;
  if not public.is_clan_member(p_clan_id) then
    raise exception 'Not a clan member';
  end if;
  if public.clan_message_looks_spoofed(trimmed) then
    raise exception 'Message not allowed';
  end if;

  insert into public.clan_messages (clan_id, user_id, message, message_type, payload)
  values (p_clan_id, uid, trimmed, 'text', null)
  returning * into row;

  return row;
end;
$$;

-- Infrastructure for future gift/system inserts (SQL admin or chained RPCs — not granted to app users)
create or replace function public.post_clan_chat_typed_message(
  p_clan_id uuid,
  p_user_id uuid,
  p_message_type text,
  p_message text,
  p_payload jsonb default null
)
returns public.clan_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.clan_messages%rowtype;
begin
  if p_clan_id is null or p_user_id is null then
    raise exception 'Clan and user required';
  end if;
  if p_message_type not in ('gift', 'system') then
    raise exception 'Invalid typed message';
  end if;
  if trim(coalesce(p_message, '')) = '' then
    raise exception 'Message is empty';
  end if;
  if not public.is_clan_member(p_clan_id) then
    raise exception 'Not a clan member';
  end if;

  perform set_config('app.clan_chat_typed_insert', '1', true);

  insert into public.clan_messages (clan_id, user_id, message, message_type, payload)
  values (p_clan_id, p_user_id, trim(p_message), p_message_type, coalesce(p_payload, '{}'::jsonb))
  returning * into row;

  return row;
end;
$$;

grant execute on function public.send_clan_chat_message(uuid, text) to authenticated;
