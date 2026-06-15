-- Fix room_waiting 403 on upsert (run in Supabase SQL Editor if you see POST room_waiting 403)

drop policy if exists "waiting update" on room_waiting;
create policy "waiting update" on room_waiting for update using (true) with check (true);
