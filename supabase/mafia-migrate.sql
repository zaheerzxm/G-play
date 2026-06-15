-- Run this in Supabase SQL Editor if you get:
--   function name "create_mafia_game" is not unique
-- Safe to re-run.

drop function if exists create_mafia_game(text, int, int, boolean, boolean, text);

-- Then run the updated functions from mafia.sql:
-- create_mafia_game, finish_mafia_game, check_mafia_win_condition,
-- submit_detective_action, advance_mafia_phase_if_due,
-- resolve_mafia_night, resolve_day_vote

grant execute on function create_mafia_game(text, int, int, int, boolean, boolean, text) to authenticated;
