# Test Milestones — FB-001 through FB-135

**Date:** 2026-06-14  
**Purpose:** Define when manual testing runs during the 135-item backlog execution.

---

## Execution rules

1. **One FB item at a time** — never implement multiple FB items in a single change set.
2. **No per-item full manual test** — manual testing is **not** required after every single FB item.
3. **Milestone gates** — a checkpoint is **not passed** until **all** manual tests for that checkpoint are executed and signed off.
4. **Do not skip checkpoints** — finish Checkpoint 1 before treating Wave 1 Critical work as release-ready; same for later checkpoints.
5. **Update this doc** when an FB item is completed: move it from *Pending* to *Implemented* under the checkpoint and add any new migrations or test cases discovered during implementation.

**Related docs:**

- Backlog: [`weplay-final-backlog.md`](./weplay-final-backlog.md)
- Per-item detail (FB-001/009): [`manual-test-plan-fb001-fb009.md`](./manual-test-plan-fb001-fb009.md)
- Migrations (FB-001/009): [`manual-migrations-required.md`](./manual-migrations-required.md)
- Release audit (FB-001/009): [`release-checkpoint-fb001-fb009.md`](./release-checkpoint-fb001-fb009.md)

---

## Milestone overview

| Checkpoint | FB range | Items | Critical | High | Medium | Low | Status |
|------------|----------|------:|---------:|-----:|-------:|----:|--------|
| **1** | FB-001 – FB-010 | 10 | 10 | 0 | 0 | 0 | **In progress** (3/10 implemented) |
| **2** | FB-011 – FB-025 | 15 | 0 | 15 | 0 | 0 | Not started |
| **3** | FB-026 – FB-050 | 25 | 0 | 25 | 0 | 0 | Not started |
| **4** | FB-051 – FB-085 | 35 | 0 | 1 | 33 | 1 | Not started |
| **5** | FB-086 – FB-135 | 50 | 0 | 0 | 44 | 6 | Not started |

**Checkpoint passed:** ☐ none yet

---

## Checkpoint 1 — FB-001 through FB-010

**Theme:** Wave 1 Critical — core missing functionality (BFF, shop, clan, chat, voice room, lobby, privacy, games).

**Risk level:** **High** — 10 Critical items; several XL complexity; coin economy (BFF unlock), clan treasury, group DM, and lobby games touch core user flows.

### FB items included

| ID | Screen / area | Status | Commit |
|----|---------------|--------|--------|
| FB-001 | BFF To Unlock | **Completed** | `20b101f` (+ hardening `d546f78`) |
| FB-002 | Chat Bubble shop | Not Started | — |
| FB-003 | Clan chest / store / gacha | Not Started | — |
| FB-004 | Clan group chat message types | Not Started | — |
| FB-005 | Create Group DM | **Completed** | `0e6d385` (+ `5b115aa`, `1701510`, `52cadef`) |
| FB-006 | Drawing widget overlay | Not Started | — |
| FB-007 | Family Fund donation flow | Not Started | — |
| FB-008 | Lobby games catalog | Not Started | — |
| FB-009 | Privacy settings screen | **Completed** | `8dbdbca` (+ hardening `d546f78`) |
| FB-010 | UNO / Ludo / lobby games | Not Started | — |

**Implemented:** 3 / 10  
**Checkpoint passed:** ☐ No — manual tests not executed for completed items; 7 items remain.

### Features affected

- **BFF / relationships** — locked bonds, slot limits, unlock flow, My BFFs / To Unlock tabs (FB-001)
- **Privacy / profile** — 9 toggles, incognito visit, hide location, hide guardian board (FB-009)
- **Shop / inventory** — chat bubble catalog (FB-002)
- **Clan** — chest, store, gacha, structured clan chat, family fund donations (FB-003, FB-004, FB-007)
- **DM / chat** — group chat creation (FB-005)
- **Voice room** — collaborative drawing overlay (FB-006)
- **Lobby / games** — expanded game grid, playable UNO/Ludo/Jackaroo or marketing removal (FB-008, FB-010)

### Database migrations required

| Migration | FB | Status |
|-----------|-----|--------|
| `supabase/privacy-settings-migration.sql` | FB-009 | **Required now** |
| `supabase/bff-slots-migration.sql` | FB-001 | **Required now** (re-run after `d546f78` for RPC hardening) |
| `supabase/group-dm-migration.sql` | FB-005 | **Applied** |
| TBD per item | FB-002 – FB-004, FB-006 – FB-010 | Add rows here as each item ships |

Apply migrations in Supabase SQL Editor before checkpoint manual testing. See [`manual-migrations-required.md`](./manual-migrations-required.md).

### Required manual tests

#### FB-001 — BFF To Unlock *(implemented)*

Use [`manual-test-plan-fb001-fb009.md`](./manual-test-plan-fb001-fb009.md) § FB-001. Key cases:

- Accept under slot limit → **active**
- Accept at slot limit → **locked**; appears on **To Unlock** tab
- Unlock deducts **500 coins**; bond moves to **My BFFs**
- **partner_slot_full** when partner has no slot capacity (post-hardening)
- Intimate Space opens from unlocked bond
- `load_bff_locked_bonds` rejects cross-user queries (security — verify via app only shows own locked list)

#### FB-009 — Privacy Settings *(implemented)*

Use [`manual-test-plan-fb001-fb009.md`](./manual-test-plan-fb001-fb009.md) § FB-009. Key cases:

- Open **Me → Privacy**; toggles persist after reload
- **Hide location** — hidden on others' profile view
- **Incognito visit [V6]** — no visitor log entry for profile owner
- **Hide guardian board [V8]** — Guard section hidden on others' profile
- VIP-gated toggles forced off on save when VIP level insufficient (post-hardening)
- Incognito does not fire before privacy load completes (post-hardening)

#### FB-002 — Chat Bubble shop *(when implemented)*

- Open shop → Chat Bubble section with coin/VIP/Family tags
- Purchase flow deducts coins or shows VIP/Family gate
- Equipped bubble appears in DM/room chat (if wired)

#### FB-003 — Clan chest / store / gacha *(when implemented)*

- Clan profile → Chest, Store, Gacha each functional (not stub)
- Rewards/currency update clan or user wallet correctly
- Error states when insufficient currency

#### FB-004 — Clan group chat message types *(when implemented)*

- Structured gift cards render in clan chat
- Admin badges visible on admin messages

#### FB-005 — Create Group DM *(implemented — signed off)*

Implementation complete (Phases A–D: `5b115aa`, `1701510`, `52cadef`, `0e6d385`). Migration `supabase/group-dm-migration.sql` applied.

**Manual validation:** ☑ **Passed — 2026-06-14**

Verified:

- Create group from chat settings with 3+ members
- Post-create auto-opens GroupChat
- Group appears in Chats list
- Cross-member message delivery (polling)
- Member list accurate (count, names, owner badge)
- `npm run build` passes

Not verified this pass (non-blocking for FB-005; Checkpoint 1 regression): unread badge increment/clear; 1:1 DM regression.

#### FB-006 — Drawing widget overlay *(when implemented)*

- Host opens drawing widget in voice room
- Multiple participants can draw; strokes sync
- Close widget clears overlay without breaking room

#### FB-007 — Family Fund donation flow *(when implemented)*

- Donation message in clan chat increments treasury
- Balance and chat line match donation amount

#### FB-008 — Lobby games catalog *(when implemented)*

- Home grid shows expanded WePlay titles
- Tapping each tile navigates or shows correct state (playable vs coming soon)

#### FB-010 — UNO / Ludo / lobby games *(when implemented)*

- UNO, Ludo, Jackaroo either launch playable sessions or are removed from marketing
- No broken/dead tiles in lobby grid

### Regression tests (Checkpoint 1)

Run after **all** FB-001–010 items are implemented and individually smoke-tested:

| Area | Test |
|------|------|
| Auth / lobby | Sign in, navigate Me / Discover / Chats / Voice rooms |
| Profile | Open full profile (self + other); existing sections unchanged |
| BFF grid | My BFFs layout and Intimate Space entry still work |
| Privacy | Non-gated toggles still persist; profile enforcement unchanged for FB-009 scope |
| Wallet | Coin balance consistent after BFF unlock and any shop purchases |
| Voice room | Join room, chat, leave — no regression from drawing widget |
| Clan | Existing clan chat and profile tabs still load |
| DM | 1:1 chat send/receive; no regression from group DM addition |
| Build | `npm run build` passes |

### Sign-off

| Section | Tester | Date | Pass/Fail |
|---------|--------|------|-----------|
| FB-001 BFF | | | |
| FB-009 Privacy | | | |
| FB-005 Group DM | | 2026-06-14 | Pass |
| FB-002 – FB-004, FB-006 – FB-010 | | | |
| Regression | | | |
| **Checkpoint 1 total** | | | |

---

## Checkpoint 2 — FB-011 through FB-025

**Theme:** Wave 1 High — voice room settings, BFF invitation, DM/chat polish, events, clan badges, auction UI.

**Risk level:** **Medium–High** — no Critical severity items, but voice room group chat, events, and BFF invitation add navigation and realtime paths; auction UI touches PK economy display.

### FB items included

| ID | Category | Screen |
|----|----------|--------|
| FB-011 | Voice Room / Settings | Associated groups |
| FB-012 | BFF | BFF Invitation tab |
| FB-013 | Chat / DM | Block gaming invites |
| FB-014 | BFF / Intimate | Confidant To dress |
| FB-015 | Chat / DM | DM sticker panel sheet |
| FB-016 | Event Center | Event creation flow |
| FB-017 | Home / Lobby | GOLD RUSH invite banner |
| FB-018 | Voice Room / Tools | Lottery result modal |
| FB-019 | Voice Room / Settings | Manage event toggle |
| FB-020 | Clan | Clan sign in room chat |
| FB-021 | Voice Room / Chat | Drawing system lines |
| FB-022 | Settings | Privacy VIP toggles |
| FB-023 | Voice Room | Group chat header button |
| FB-024 | Voice Room / Chat | New message jump pill |
| FB-025 | Auction / PK | Auction mode UI |

**Dependencies note:** FB-011 ↔ FB-023; FB-016 ↔ FB-019; FB-021 → FB-006; FB-012 → FB-001; FB-022 → FB-009; FB-017/020 → FB-008/029. Implement in dependency order within the one-at-a-time rule.

### Features affected

- Voice room settings (associated groups, events, group chat header)
- BFF invitation inbox and confidant dress tabs
- DM stickers, block gaming invites, reply/jump UX
- Event Center create/manage
- Lobby GOLD RUSH banner
- Lottery modal, drawing system lines
- Clan sign badge in room chat
- Privacy VIP toggle consumers (hide gifts, etc.)
- Auction stage UI parity

### Database migrations required

- **Inherited from Checkpoint 1** — privacy + BFF slot migrations must already be applied
- **TBD per item** — document new SQL files here as FB-011–025 ship (events, associated groups, sticker assets metadata, etc.)

### Required manual tests

| ID | Key tests |
|----|-----------|
| FB-011 | Associated Groups row in room settings; data persists |
| FB-012 | BFF Invitation tab lists pending invites; accept/decline |
| FB-013 | Block gaming invites toggle blocks invite cards in DM |
| FB-014 | Confidant dress tabs (Token, Mic, Background) save and display |
| FB-015 | Sticker panel categories; sticker sends in DM |
| FB-016 | Create room event; appears in Event Center |
| FB-017 | GOLD RUSH banner shows on schedule; tap navigates |
| FB-018 | Lottery modal shows participants and winner |
| FB-019 | Manage event toggle links to Event Center |
| FB-020 | Clan sign badge visible in room chat for clan members |
| FB-021 | Drawing widget events post system lines to room chat |
| FB-022 | hide_recent_gifts [V7] enforced on profile/gift wall |
| FB-023 | Group pill in room header opens room group chat |
| FB-024 | Jump pill appears when scrolled up; tap scrolls to latest |
| FB-025 | Auction mode UI matches WePlay stage layout |

### Regression tests (Checkpoint 2)

| Area | Test |
|------|------|
| Checkpoint 1 | Re-run Checkpoint 1 regression suite |
| BFF | My BFFs / To Unlock / Invitation tabs coexist |
| Privacy | FB-009 + FB-022 toggles still enforce correctly |
| Voice room | Room join, seat, chat, settings sheet |
| Events | Non-event rooms unaffected |
| DM | 1:1 and group (if FB-005 done) still deliver |

### Sign-off

| Section | Tester | Date | Pass/Fail |
|---------|--------|------|-----------|
| FB-011 – FB-025 | | | |
| Regression | | | |
| **Checkpoint 2 total** | | | |

---

## Checkpoint 3 — FB-026 through FB-050

**Theme:** Wave 2 High — shop/gifts visual parity, rankings, PK, church, intimate space, YouTube video mode, lobby polish.

**Risk level:** **Medium** — predominantly UI/parity work; gift wall and premium FX (FB-051 preview in next checkpoint) touch economy display; YouTube panel adds media embed surface.

### FB items included

FB-026 through FB-050 (25 High items): Avatar shop gender tabs, Beats & Dance widgets, rankings dark UI, Family Sign editor, game tile art, gift sheet/wall parity, DM invite cards, Moments discover/feed, PK bar, Church propose UI, shop duration modal, Love Home rings, room card badges, Safety Center, scoreboard, stage header metadata, system message styling, token wall locks, YouTube in-room panel, and related visual parity items.

### Features affected

- Shop (avatar gender tabs, purchase duration modal)
- Gifts (sheet footer, gift wall badges)
- Rankings (dark UI, ornate frames, PLAY Show tab)
- PK / Auction visuals
- Profile / Moments discover and feed cards
- Church propose and member picker flows
- Love Home rings and stats
- Voice room stage header, system messages, YouTube panel
- Intimate Space token wall level gates
- Lobby room card badges and game tile art
- Clan Family Sign editor

### Database migrations required

- **Inherited** — Checkpoints 1–2 migrations applied
- **TBD per item** — gift wall metadata, family sign storage, token wall levels, YouTube session state, etc.

### Required manual tests

For each FB-026–050 item when implemented:

1. Open the target screen from its primary entry point
2. Verify visual parity with WePlay reference (screenshot diff or checklist)
3. Verify interactive elements (taps, toggles, modals) complete without console errors
4. Verify data wiring where applicable (counts, badges, locks reflect real state)

**Spot-check clusters:**

| Cluster | IDs | Focus |
|---------|-----|-------|
| Shop / gifts | FB-026, FB-031, FB-032, FB-040 | Purchase UI, gift wall lit/unlit |
| Rankings / PK | FB-028, FB-036, FB-037, FB-038 | Layout, frames, PK bar |
| Profile / Moments | FB-034, FB-035 | Discover row, feed cards |
| Church / Love | FB-039, FB-042, FB-046 | Propose flow, rings modal |
| Voice room | FB-027, FB-045, FB-047, FB-048, FB-050 | Widgets, scoreboard, header, YouTube |
| Intimate / BFF | FB-049 | Token wall level gates |

### Regression tests (Checkpoint 3)

| Area | Test |
|------|------|
| Checkpoints 1–2 | Full regression suites |
| Gifts | Send gift in room and DM; wall updates |
| Rankings | All tabs load; filters work |
| Voice room | Join, chat, tools grid, leave |
| Profile | Full profile sheet all sections |

### Sign-off

| Section | Tester | Date | Pass/Fail |
|---------|--------|------|-----------|
| FB-026 – FB-050 | | | |
| Regression | | | |
| **Checkpoint 3 total** | | | |

---

## Checkpoint 4 — FB-051 through FB-085

**Theme:** Wave 3 — premium gift FX, BFF chest, voice room features (Business Life, emotes), settings depth, profile/discover, wallet silver, polish.

**Risk level:** **Medium** — 33 Medium + 1 High (FB-051 premium FX); Business Life and keyword blacklist add moderation/settings surface; silver wallet is new economy path.

### FB items included

FB-051 through FB-085 (35 items): Premium gift fullscreen FX, BFF Chest, Business Life, coin toss/dice emotes, Gift Pack tile badge, keyword blacklist, membership fees, moment composer media, parental controls, pinned owner rules, room records, clan steal toggle, anonymous gifts, bio/country/region pickers, nearby geo, silver wallet, visitors incognito, bubble backpack equip, onboarding wizard, and assorted medium polish items.

### Features affected

- Gifts (premium SVGA/Lottie FX, anonymous mask, receiver gold line, qty presets, combo)
- BFF (chest rewards, shop link)
- Voice room (Business Life, emotes, pinned rules, room records, pull-to-refresh)
- Settings (keyword blacklist, parental controls, region picker, message blacklist, Youth Mode)
- Profile (bio, country, moment composer, gift wall preview, PLAY Show entry, visitors)
- Shop / wallet (silver balance, bubble equip, coin pack ribbons)
- Discover (nearby geo + privacy interaction)
- Clan (steal toggle, charm gate, news cards, tasks UI)
- Onboarding first-run wizard

### Database migrations required

- **Inherited** — Checkpoints 1–3 migrations applied
- **TBD per item** — silver wallet, keyword blacklist, parental PIN, BFF chest rewards, Business Life state, geo/nearby indexes, etc.

### Required manual tests

| Cluster | IDs | Key tests |
|---------|-----|-----------|
| Premium gifts | FB-051, FB-064, FB-069, FB-106, FB-118, FB-119 | Fullscreen FX plays; anonymous masks name; combo send |
| BFF / clan | FB-052, FB-063, FB-073, FB-081, FB-103, FB-112 | Chest open rewards; steal toggle; clan news |
| Voice room | FB-053, FB-054, FB-055, FB-061, FB-062, FB-067, FB-079 | Business Life flow; emotes in chat; pinned rules |
| Settings | FB-057, FB-060, FB-070, FB-077, FB-080 | Keyword filter; parental PIN; region picker |
| Profile / discover | FB-059, FB-065, FB-066, FB-068, FB-072, FB-093 | Moment media attach; nearby respects privacy |
| Wallet / shop | FB-071, FB-074, FB-084 | Silver balance spend; bubble equip |
| Onboarding | FB-075 | First-run wizard completes |

Run per-item smoke test when each FB ships; full checkpoint pass requires all rows above.

### Regression tests (Checkpoint 4)

| Area | Test |
|------|------|
| Checkpoints 1–3 | Full regression suites |
| Coin economy | Coins + silver balances consistent after purchases |
| Privacy | All privacy toggles still enforce |
| Gifts | Standard (non-premium) gifts still send |
| Voice room | Core room loop unaffected by Business Life |

### Sign-off

| Section | Tester | Date | Pass/Fail |
|---------|--------|------|-----------|
| FB-051 – FB-085 | | | |
| Regression | | | |
| **Checkpoint 4 total** | | | |

---

## Checkpoint 5 — FB-086 through FB-135

**Theme:** Wave 4 — remaining Medium/Low polish, VIP coverage, UI micro-parity, documentation, theme tokens.

**Risk level:** **Low–Medium** — mostly visual polish and copy; lower blast radius individually, but volume (50 items) increases regression risk if batched carelessly.

### FB items included

FB-086 through FB-135 (50 items): Couple ranking pairs, cover carousel, DM avatar frames, gift promo banners, clan badges, lobby floaters/banners, header ornaments, settings grid, ranking podium art, VIP name coverage, sheet animations, empty illustrations, theme teal accent, and other Low/Medium polish items.

### Features affected

- BFF couple ranking display, title badges
- Profile cover carousel, stats badges, settings grid
- DM visual polish (avatar frames, stickers, compose layout, official badge)
- Lobby headers, HOT ROOM, Gift Pack floater, hub quick links
- Rankings podium and time filters
- VIP name rendering and request UI
- Voice room dock, seats, minimize chip, audience strip
- Global theme tokens and empty-state art
- Documentation (DM call G-Play extra — FB-125)

### Database migrations required

- **Inherited** — Checkpoints 1–4 migrations applied
- **TBD per item** — unlikely for most polish items; document if any item adds schema

### Required manual tests

Given the volume, use **sampling + full checklist**:

1. **Per-item smoke** (when implemented): open target screen → verify change visible → no console errors
2. **Themed sweeps** at checkpoint pass:

| Sweep | IDs (sample) | Verify |
|-------|--------------|--------|
| VIP names | FB-115, FB-116 | VIP gradient names on profile, chat, rankings |
| Lobby chrome | FB-091, FB-094, FB-095, FB-096, FB-098 | Floaters, banners, header ornaments |
| DM polish | FB-088, FB-089, FB-099, FB-102, FB-104, FB-085 | Frames, badges, sticker layout |
| Voice room chrome | FB-123, FB-126, FB-127, FB-129, FB-132, FB-133 | Dock, seats, minimize chip |
| Theme / polish | FB-122, FB-128, FB-130, FB-131, FB-134, FB-135 | Animations, empty states, accent color |
| Rankings / BFF | FB-105, FB-113, FB-114, FB-086 | Podium, filters, couple pairs |

3. **FB-125** — confirm DM call documentation exists and matches behavior

### Regression tests (Checkpoint 5)

| Area | Test |
|------|------|
| Checkpoints 1–4 | Full regression suites |
| End-to-end smoke | New user onboarding → lobby → room → gift → profile → settings |
| Cross-platform | iOS Safari + desktop Chrome spot check |
| Performance | No obvious jank from animations (FB-122) or premium FX |
| Build | `npm run build` passes |

### Sign-off

| Section | Tester | Date | Pass/Fail |
|---------|--------|------|-----------|
| FB-086 – FB-135 | | | |
| Regression | | | |
| **Checkpoint 5 total** | | | |

---

## When to run tests

| Event | Action |
|-------|--------|
| FB item completed | Update backlog status + this doc; **no** full manual test required |
| Last item in checkpoint completed | Schedule full checkpoint manual test pass |
| Checkpoint manual tests all pass | Mark checkpoint **Passed** in overview table; proceed to next FB item |
| Hotfix to completed checkpoint item | Re-run that item's tests + targeted regression |
| SQL migration added | Apply in Supabase before testing affected checkpoint |

---

## Checkpoint pass criteria

A checkpoint is **passed** only when:

1. All FB items in the range are **Completed** in the backlog
2. All **Required manual tests** for that checkpoint are executed
3. All **Regression tests** for that checkpoint pass
4. All **Database migrations** listed for the checkpoint are applied in Supabase
5. Sign-off table is filled with Pass for every section
6. `npm run build` passes on the commit under test

Until Checkpoint 1 passes, treat Wave 1 Critical work as **not release-ready** even though FB-001 and FB-009 are individually complete.
