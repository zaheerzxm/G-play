-- Gift wall realtime updates.
-- Safe to run multiple times in Supabase SQL Editor.

do $$
begin
  alter publication supabase_realtime add table gift_transactions;
exception when duplicate_object then null;
end $$;
