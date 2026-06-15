# Release Checkpoint — FB-009 & FB-001

**Date:** 2026-06-14  
**Commits reviewed:** `8dbdbca`, `20b101f`, `1a7e4a7`, `3a0db67`  
**Scope:** Privacy Settings (FB-009) + BFF To Unlock (FB-001)  
**Audit type:** Read-only release review — remediation fixes applied 2026-06-14 (see §11)

---

## Executive summary

Both features compile cleanly and follow existing G-Play patterns (sheet UI, Supabase RPCs, profile JSON columns). **Migrations are mandatory** before production use. Pre-migration behavior is **partially graceful** (BFF grid still loads; privacy/BFF advanced flows error with toasts) but **not fully safe** for login/profile if schema drift is severe.

**Release readiness score: 74 / 100**

| Blocker tier | Status |
|--------------|--------|
| Build | Pass |
| Migrations applied | **Required** (blocker for release) |
| Manual test plan executed | **Not yet** (blocker for next FB item) |
| Security hardening | Medium findings (non-blocking for internal/staging) |

---

## 1. Changes reviewed

### FB-009 (`8dbdbca`)

| Area | Files |
|------|-------|
| Migration | `supabase/privacy-settings-migration.sql` |
| Module | `src/privacySettings.js` |
| UI | `src/components/PrivacySettingsSheet.jsx` |
| Navigation | `ProfilePanel.jsx`, `LobbyScreen.jsx` |
| Enforcement | `UserFullProfileSheet.jsx` (incognito, hide location, hide guard) |
| Styles | `App.css` (privacy section) |
| Profile load | `profile.js` (`privacy_settings` in bulk select) |

### FB-001 (`20b101f`)

| Area | Files |
|------|-------|
| Migration | `supabase/bff-slots-migration.sql` |
| Constants | `src/bffSlots.js` |
| API | `relationships.js` (slot info, locked bonds, unlock) |
| UI | `BffSheet.jsx` (My BFFs / To Unlock tabs) |
| Wiring | `UserFullProfileSheet.jsx` (`onCoinsChange`) |
| Styles | `App.css` (BFF tabs + unlock rows) |

### Docs (`3a0db67`)

- `docs/manual-migrations-required.md`
- `docs/manual-test-plan-fb001-fb009.md`
- Backlog hash updates (FB-009 → `8dbdbca`, FB-001 → `20b101f`)

---

## 2. Static analysis

### Build & lint

| Check | Result |
|-------|--------|
| `npm run build` | **Pass** (~3s) |
| ESLint / IDE diagnostics on touched files | **No issues** |
| Bundle size warning (>500 kB) | Pre-existing, not introduced by FB-009/001 |
| Dynamic import / eval warnings (lottie, svga) | Pre-existing |

### Unused imports / dead code

| Finding | Risk | Location | Status |
|---------|------|----------|--------|
| `BFF_FAMILY_BOND_TYPES` re-exported from `relationships.js` but consumers use local `Set`s | Low | Duplication across `BffSheet`, `UserFullProfileSheet` | Open |

No broken imports or missing exports detected.

### Duplicated logic

| Pattern | Notes |
|---------|-------|
| `BFF_TYPES` / `CP_TYPES` sets | Copied in multiple components (pre-existing pattern) |
| BFF bond list enrichment | Similar mapping in `BffSheet` and `UserFullProfileSheet` |
| Slot defaults (`3`) | Fallback in `BffSheet`, `bffSlots.js`, SQL — consistent |

---

## 3. Pre-migration behavior

### FB-009 — Privacy

| Scenario | Behavior | Graceful? |
|----------|----------|-----------|
| `privacy_settings` column **missing**, open Privacy sheet | `loadPrivacySettings` → PostgREST error → toast; UI shows defaults from `privacyFromProfile(profile)` | **Partial** — sheet opens, toggles visible |
| Save toggle without column | `savePrivacySettings` update fails → toast | **Yes** — no crash |
| `loadProfileBundle` (`select *`) without column | Column absent from row, not an error | **Yes** |
| Explicit `select('privacy_settings')` in enforcement path | Error → catch → `defaultPrivacySettings()` | **Yes** |
| Profile views / rest of app | Unaffected | **Yes** |

**Verdict:** Privacy screen **loads with defaults**; persistence and enforcement require migration.

### FB-001 — BFF

| Scenario | Behavior | Graceful? |
|----------|----------|-----------|
| Slot columns **missing**, open BFF (My BFFs) | `loadActiveBondsForUser` works (no new columns) | **Yes** |
| Slot info fetch | `loadBffSlotInfo` fails → catch → fallback `used/limit` from local count / 3 | **Yes** |
| To Unlock tab | `load_bff_locked_bonds` RPC missing → catch → empty list | **Yes** |
| Unlock button | RPC missing → toast error | **Yes** |
| Accept BFF without new `respond_user_bond` | Old RPC always sets `active` (no `locked` state) | **Degraded** — feature incomplete, not crashing |

**Verdict:** BFF grid **loads** pre-migration; To Unlock / unlock / locked accept **require migration**.

---

## 4. RPC security review

### New / replaced RPCs (`bff-slots-migration.sql`)

| RPC | Auth check | RLS | Notes |
|-----|------------|-----|-------|
| `bff_slot_limit` | N/A (read helper) | Reads `profiles` (public read policy) | OK |
| `bff_slot_count` | N/A | Reads `user_relationships` (public read) | OK |
| `load_bff_locked_bonds` | **`auth.uid() = p_user_id`** | Bypasses RLS | **Fixed** — unauthorized callers rejected |
| `unlock_bff_bond` | `auth.uid() = p_user_id` | Definer; wallet `FOR UPDATE` | **Good** — partner slot check added (`partner_slot_full`) |
| `respond_user_bond` (replaced) | **None** (same as original in `RUN-THIS.sql`) | Definer | **Pre-existing pattern:** caller can pass any `p_responder_id` |

### FB-009 (no new RPCs)

| Path | Auth | Notes |
|------|------|-------|
| `profiles` update `privacy_settings` | RLS: `auth.uid() = id` | OK for own profile |
| VIP gate on toggles | **`enforceVipPrivacyGates` in save/load** | **Fixed** — VIP-gated keys forced false before persist |

### Race conditions & double-spend

| Scenario | Mitigation | Residual risk |
|----------|------------|---------------|
| Double-click Unlock | Client `unlockBusyId`; second RPC finds no `locked` row | **Low** |
| Concurrent unlock (2 bonds) | Wallet `FOR UPDATE` serializes deductions | **Low** for coins |
| Concurrent slot purchase increment | Profile `bff_slots_purchased` update **not** row-locked | **Low–Medium:** rare over-count of purchased slots under heavy concurrency |
| Unlock after migration partial apply | RPC missing → client toast | **Low** |
| One-side unlock when partner at slot cap | **Fixed** — `partner_slot_full` before coin deduct | **Low** |

### Slot count consistency

| Rule | Implementation |
|------|----------------|
| Active BFF bonds count toward `used` | `bff_slot_count` filters `status = 'active'` |
| Locked bonds do not count | Correct |
| Unlock at capacity | Increments `bff_slots_purchased` then activates | Correct for unlocking user |
| Both users checked on accept | If **either** user at limit → `locked` | Partner one-side unlock blocked when partner at cap (**Fixed**) |

---

## 5. Runtime / UX findings

### Loading states

| Surface | Loading | Error |
|---------|---------|-------|
| Privacy sheet | Yes (`loading` text) | Toast on load/save fail |
| BFF My BFFs | Yes | Empty grid on fail |
| BFF To Unlock | Yes (`lockedLoading`) | Empty list on fail (silent) |
| Slot counter | Falls back on error | No user-visible error |

### Error handling gaps

| Issue | Risk | Recommendation (future) |
|-------|------|-------------------------|
| To Unlock load failure is silent (empty state) | Medium | Toast or inline error when RPC missing |
| Incognito `recordVisit` may run before `viewerPrivacy` async load completes | Medium | **Fixed** — gated on `viewerPrivacyReady` |
| Privacy load error still renders toggles (defaults) | Low | Acceptable; save will fail clearly |

### Enforcement coverage (FB-009)

| Toggle | Enforced now |
|--------|--------------|
| hide_location | Yes (others' profile) |
| incognito_visit | Yes (skip `recordVisit`) |
| hide_guardian_board | Yes (others' profile) |
| hide_stats, hide_recent_gifts, others | Persist only (by design) |

---

## 6. Findings summary

| ID | Finding | Risk | Recommended fix (do not implement yet) |
|----|---------|------|--------------------------------------|
| R1 | Migrations not applied → privacy save / BFF unlock fail | **High** (ops) | Apply both SQL files before release (documented) |
| R2 | Manual test plan not executed | **High** (quality) | Run `manual-test-plan-fb001-fb009.md` |
| R3 | `load_bff_locked_bonds` lacks `auth.uid()` check | **Medium** (security) | Require `auth.uid() = p_user_id` | **Fixed** |
| R4 | VIP privacy toggles not validated server-side | **Medium** (security) | RPC or trigger to enforce VIP level on JSON keys | **Fixed** (`enforceVipPrivacyGates`) |
| R5 | Incognito visit race before privacy settings load | **Medium** (privacy) | Defer `recordVisit` until viewer privacy resolved | **Fixed** |
| R6 | `respond_user_bond` no auth.uid (pre-existing + replaced) | **Medium** (security) | Add auth check to match `unlock_bff_bond` | Open (out of scope) |
| R7 | Partner slot asymmetry after one-side unlock | **Medium** (logic) | Document or sync both users' slot accounting | **Fixed** (`partner_slot_full`) |
| R8 | `BFF_EXTRA_SLOT_COIN_PRICE` (1000) vs unlock cost (500) | **Low** (docs) | Align naming/docs or wire constant into SQL | **Fixed** (removed unused constant) |
| R9 | Unused `targetName` prop in `BffSheet` | **Low** (lint) | Remove or use in header | **Fixed** |
| R10 | To Unlock silent failure on RPC error | **Low** (UX) | Surface error toast |
| R11 | No BFF proposal UI (pre-existing) | **Low** (test) | Blocks manual QA without SQL/console |

---

## 7. Migration dependencies

**Must run before release testing:**

1. `supabase/privacy-settings-migration.sql`
2. `supabase/bff-slots-migration.sql`

**Order:** Privacy first, then BFF (either order works; both idempotent).

**Not merged into `RUN-THIS.sql` yet** — deploy checklist must include explicit migration step.

---

## 8. Release readiness score

### Score: **74 / 100**

| Factor | Weight | Score | Notes |
|--------|--------|-------|-------|
| Build / compile | 15 | 15 | Clean build |
| Code quality | 15 | 12 | Minor dead code, duplication |
| Pre-migration safety | 15 | 11 | Partial graceful degradation |
| RPC security | 20 | 13 | unlock OK; load_locked + respond gaps |
| Error / loading UX | 15 | 12 | Mostly good; silent To Unlock fail |
| Test coverage | 20 | 11 | Manual plan exists; not executed |
| Documentation | 0* | +0 | Migration + test docs present |

\*Documentation improves ops readiness but does not replace executed tests.

### Ready for

| Stage | Ready? |
|-------|--------|
| Staging deploy (with migrations) | **Yes, with caveats** |
| Production release | **No** — run migrations + manual tests first |
| Next FB item (FB-005, etc.) | **No** — complete manual test sign-off |

---

## 9. Recommended pre-release checklist

1. Apply both migrations in Supabase SQL Editor
2. Execute full manual test plan (two accounts, VIP test users if available)
3. Verify RPC grants for authenticated role
4. Confirm coin balance updates after BFF unlock in lobby + profile contexts
5. Re-score after manual pass (target ≥ 85 before next FB work)

---

## 10. Explicit non-findings

- No FB-012, FB-052, FB-014, FB-073 code included
- No changes to Church/CP proposal flows beyond `respond_user_bond` BFF branch
- Intimate Space unchanged
- Build warnings are pre-existing bundle size / third-party eval

**Audit complete. Remediation fixes applied 2026-06-14 (§11).**

---

## 11. Remediation fixes (2026-06-14)

Checkpoint findings addressed without starting new FB items:

| # | Finding | Fix |
|---|---------|-----|
| 1 | `load_bff_locked_bonds` auth | `auth.uid() = p_user_id` check in `bff-slots-migration.sql` |
| 2 | VIP privacy server validation | `enforceVipPrivacyGates()` in `privacySettings.js` — forces `incognito_visit` (V6), `hide_recent_gifts` (V7), `hide_guardian_board` (V8) to false before save; also applied on load |
| 3 | Incognito race | `UserFullProfileSheet.jsx` — `viewerPrivacyReady` gate before `recordVisit` |
| 4 | Partner slot on unlock | `unlock_bff_bond` raises `partner_slot_full` when partner has no capacity; toast in `BffSheet` |
| 5 | Cleanup | Removed unused `targetName` from `BffSheet`; removed `BFF_EXTRA_SLOT_COIN_PRICE` from `bffSlots.js` |

**Still open:** R1 (migrations not applied), R2 (manual tests), R6 (`respond_user_bond` auth — pre-existing, out of scope), R10 (silent To Unlock load failure), R11 (no BFF proposal UI for QA).
