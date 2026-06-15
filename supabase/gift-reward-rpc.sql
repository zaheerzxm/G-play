-- Server-side gift reward rolls (run in Supabase SQL Editor).
-- Client falls back to local roll if this RPC is not deployed.

create or replace function roll_gift_reward(p_unit_cost int, p_quantity int default 1)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := greatest(1, coalesce(p_quantity, 1));
  v_cost int := greatest(0, coalesce(p_unit_cost, 0));
  v_min int;
  v_max int;
  v_total int := 0;
  i int;
begin
  if v_cost <= 0 then
    return jsonb_build_object('total', 0, 'lucky', false);
  end if;

  if floor(random() * 200)::int = 0 then
    return jsonb_build_object(
      'total', v_cost * v_count * 3,
      'lucky', true,
      'multiplier', 3
    );
  end if;

  v_min := greatest(1, (v_cost * 0.01)::int);
  v_max := greatest(v_min, (v_cost * 0.8)::int);

  for i in 1..v_count loop
    v_total := v_total + v_min + floor(random() * (v_max - v_min + 1))::int;
  end loop;

  return jsonb_build_object('total', v_total, 'lucky', false);
end;
$$;

grant execute on function roll_gift_reward(int, int) to authenticated;
grant execute on function roll_gift_reward(int, int) to anon;
