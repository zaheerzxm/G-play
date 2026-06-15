-- DM red packets: nullable room_id + recipient targeting (run in Supabase SQL Editor).

alter table red_packets alter column room_id drop not null;

alter table red_packets add column if not exists recipient_id uuid references profiles(id) on delete cascade;

create index if not exists red_packets_recipient_id_idx on red_packets(recipient_id);
