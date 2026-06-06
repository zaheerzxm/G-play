-- Run in Supabase SQL editor if chat/seats don't update live

alter publication supabase_realtime add table seats;
alter publication supabase_realtime add table messages;

-- RLS policies (required for anon client)
alter table seats enable row level security;
alter table messages enable row level security;

create policy "seats read" on seats for select using (true);
create policy "seats update" on seats for update using (true);
create policy "messages read" on messages for select using (true);
create policy "messages insert" on messages for insert with check (true);
