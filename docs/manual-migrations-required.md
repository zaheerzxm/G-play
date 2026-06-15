# Manual Migrations Required

Before manual testing **FB-009** (Privacy Settings) and **FB-001** (BFF To Unlock), apply both SQL migrations in the Supabase SQL Editor.

**Do not continue feature work until both are applied.**

## 1. Privacy settings (FB-009)

**File:** `supabase/privacy-settings-migration.sql`

Adds `profiles.privacy_settings` (jsonb) for privacy toggle persistence.

## 2. BFF slots (FB-001)

**File:** `supabase/bff-slots-migration.sql`

Adds:

- `profiles.bff_slot_base` / `profiles.bff_slots_purchased`
- BFF slot RPCs (`bff_slot_limit`, `bff_slot_count`, `load_bff_locked_bonds`, `unlock_bff_bond`)
- Updated `respond_user_bond` (locked BFF bonds when slots full)

## Order

1. Run `privacy-settings-migration.sql`
2. Run `bff-slots-migration.sql`

Both scripts are idempotent (`IF NOT EXISTS` / `CREATE OR REPLACE`) and safe to re-run.

## After applying

Use [`manual-test-plan-fb001-fb009.md`](./manual-test-plan-fb001-fb009.md) to verify behavior before starting the next backlog item.
