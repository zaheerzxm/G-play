# Manual Test Plan — FB-009 & FB-001

**Prerequisite:** Apply both migrations in [`manual-migrations-required.md`](./manual-migrations-required.md) first.

Use two test accounts (Account A and Account B) where noted.

---

## FB-009 — Privacy Settings

### Open Privacy screen

1. Sign in as Account A.
2. Go to **Me** tab.
3. Tap **Privacy** (between Parental control and Help Center).
4. **Expected:** Privacy settings sheet opens with grouped toggles.

### Toggle persistence

1. Toggle any setting (e.g. **Hide Location**).
2. Close the Privacy sheet.
3. Refresh the app (reload browser / restart app).
4. Open **Me → Privacy** again.
5. **Expected:** Toggle state matches what you set.

### Hide location (enforcement)

1. As Account A, enable **Hide Location**.
2. Sign in as Account B (or use a second browser/profile).
3. Open Account A’s full profile from Account B.
4. **Expected:** Country/location flag and label are **not** shown on Account A’s profile hero.
5. As Account A, view own profile — location may still show for self (optional check).

### Incognito visit (VIP 6+)

1. As Account A, ensure VIP level ≥ 6 (or use a test account with VIP 6+).
2. Enable **Incognito Visit [V6]** in Privacy.
3. As Account A, open Account B’s full profile.
4. As Account B, open **Me → Visitors**.
5. **Expected:** Account A does **not** appear as a new visitor.
6. Disable incognito, repeat visit — **Expected:** visitor entry appears (if Visitors list is used).

### Hide guardian board (VIP 8+)

1. As Account A, ensure VIP level ≥ 8.
2. Enable **Hide Guardian board [V8]** in Privacy.
3. As Account B, open Account A’s full profile.
4. **Expected:** **Guard** section is absent (no guard thumbnails, no Guard row).
5. As Account A, view own profile — Guard section should still be visible for self.

---

## FB-001 — BFF To Unlock

**Note:** There is no BFF proposal UI yet. Create test bonds via Supabase SQL or `proposeBond(userId, otherId, 'bff')` in the browser console, then accept from the other account’s profile (pending proposal UI).

### Accept under slot limit → active

1. As Account A, ensure fewer than **3** active BFF-family bonds (`bff`, `bestie`, `bro`, `sis`).
2. Create a pending BFF proposal from a mutual friend (Account B).
3. As Account A, accept the proposal from Account B’s profile (bond pending UI).
4. **Expected:** Bond status becomes **active** (not locked).
5. Open **Profile → BFF** — bond appears under **My BFFs**.

### Accept at slot limit → locked

1. As Account A, have **3** active BFF-family bonds already.
2. Create and accept a **4th** BFF-family proposal.
3. **Expected:** Bond becomes **locked** (not shown in My BFFs grid).
4. Open **BFF → To Unlock** tab.
5. **Expected:** Locked bond row shows partner avatar, name, bond type, **500 coins**, teal **Unlock** button.

### Unlock flow

1. Ensure Account A has ≥ **500** coins.
2. On **To Unlock**, tap **Unlock** for the locked bond.
3. **Expected:**
   - Success toast.
   - **500 coins** deducted (check wallet balance).
   - Slot counter updates (e.g. **3/3 → 3/4** if a purchased slot was added).
   - Bond disappears from **To Unlock**.
   - Bond appears under **My BFFs**.

### Intimate Space

1. From **My BFFs**, tap the newly unlocked bond card.
2. **Expected:** Intimate Space sheet opens for that bond.

### Regression — existing grid

1. Open **BFF → My BFFs** with existing active bonds.
2. **Expected:** Grid layout unchanged; cards open Intimate Space as before.

---

## Sign-off

| Item | Tester | Date | Pass/Fail |
|------|--------|------|-----------|
| FB-009 Privacy | | | |
| FB-001 BFF To Unlock | | | |

Do not start **FB-005** or other backlog items until both sections pass manual testing.
