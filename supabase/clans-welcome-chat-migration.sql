-- Re-run if clans already exist: updates create_clan to seed welcome group chat message
create or replace function public.create_clan(p_name text, p_user_id uuid)
returns public.clans
language plpgsql
security definer
set search_path = public
as $$
declare
  new_clan public.clans;
  trimmed text;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Not authorized';
  end if;

  trimmed := trim(coalesce(p_name, ''));
  if length(trimmed) < 2 then
    raise exception 'Clan name is too short';
  end if;
  if length(trimmed) > 24 then
    raise exception 'Clan name is too long';
  end if;

  if exists(select 1 from clan_members m where m.user_id = p_user_id) then
    raise exception 'Already in a clan';
  end if;

  insert into clans (clan_code, name, created_by)
  values (public.generate_clan_code(), trimmed, p_user_id)
  returning * into new_clan;

  insert into clan_members (clan_id, user_id, role)
  values (new_clan.id, p_user_id, 'leader');

  insert into clan_news (clan_id, kind, body)
  values (new_clan.id, 'milestone', format('Clan "%s" was founded!', trimmed));

  insert into clan_messages (clan_id, user_id, message)
  values (
    new_clan.id,
    p_user_id,
    format('Welcome to %s! 🛡️ Share Clan ID %s to invite friends.', trimmed, new_clan.clan_code)
  );

  return new_clan;
end;
$$;
