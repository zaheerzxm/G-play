# WePlay → G-Play Final Implementation Backlog

**Version:** Phase 3 (Execution)  
**Date:** 2026-06-14  
**Total:** 135 items (FB-001–FB-135)

> **Source of truth for implementation.** Historical audit docs live in [`archive/`](./archive/).

## Consolidation applied

- **Removed:** GAP-103 (INVALID)
- **Merged:** GAP-037+109, GAP-102+030
- **Split:** GAP-015,016,020,034,039,049,057,061,095,096,111
- **Imported:** PARITY-001–025
- **Excluded:** GAP-001,007,077 (14-seat intentional)
- **Closed (validated implemented):** GAP-063 (Global region pill exists)

## Severity totals

| Severity | Count |
|----------|------:|
| Critical | 10 |
| High | 41 |
| Medium | 68 |
| Low | 16 |
| **Total** | **135** |

---

### FB-001

**Category:** BFF  
**Severity:** Critical  
**Type:** Feature  
**Screen:** BFF To Unlock screen  
**Priority:** 1 — Missing functionality  
**Description:** New BFF → To Unlock tab with slot unlock flow.  
**Likely files:** New BffUnlockSheet.jsx, BffSheet.jsx, relationships.js  
**Dependencies:** None  
**Complexity:** L  
**Lineage:** GAP-071  
**Status:** Completed  
**Implemented In:** 20b101f / 2026-06-14  
**Testing Notes:** Locked-bond model: accept BFF-family when slots full → status locked. BffSheet tabs My BFFs / To Unlock. unlock_bff_bond RPC deducts 500 coins server-side. Run supabase/bff-slots-migration.sql before testing. Invitation tab (FB-012) not included.  

---

### FB-002

**Category:** Shop  
**Severity:** Critical  
**Type:** Feature  
**Screen:** Chat Bubble shop  
**Priority:** 1 — Missing functionality  
**Description:** Dedicated Chat Bubble catalog with coin/VIP/Family tags.  
**Likely files:** New ChatBubbleShop.jsx, ShopSheet.jsx, InventorySheet.jsx  
**Dependencies:** None  
**Complexity:** L  
**Lineage:** GAP-068  
**Status:** Completed  
**Implemented In:** e3456bb / 2026-06-14  
**Testing Notes:** Dedicated ChatBubbleShop (11 items: coin/VIP/Family). Purchases stored in localStorage via userShopInventory with type chat_bubble. VIP gated via effectiveVipLevel; Family via loadMyClan. Equip + chat rendering deferred to FB-074. No SQL migration.  

---

### FB-003

**Category:** Clan  
**Severity:** Critical  
**Type:** Feature  
**Screen:** Clan chest / store / gacha  
**Priority:** 1 — Missing functionality  
**Description:** Clan Chest, Store, Gacha functional (currently stubs).  
**Likely files:** ClanProfileTab.jsx, clans.js  
**Dependencies:** None  
**Complexity:** XL  
**Lineage:** GAP-084  
**Status:** Completed  
**Implemented In:** `76dfb01` / 2026-06-14  
**Testing Notes:** Phase A+B: run `supabase/clan-economy-migration.sql` (donate, chests, store, gacha). Donate increases `fund` + `clan_coins`. Store/gacha spend `clan_coins` only (leaders, deputies, admins, super admin). Members can view store/gacha/treasury but see "Only clan leaders can spend clan treasury" when blocked. Chest rewards use personal wallet coins. Treasury refreshes after donate/spend. No FB-004/007 dependency.  

---

### FB-004

**Category:** Clan / Chat  
**Severity:** Critical  
**Type:** Feature  
**Screen:** Clan group chat message types  
**Priority:** 1 — Missing functionality  
**Description:** Structured gift cards, admin badges in clan group chat.  
**Likely files:** ClanChat.jsx, clans.js  
**Dependencies:** None  
**Complexity:** XL  
**Lineage:** GAP-039b / PARITY-004  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-005

**Category:** Chat / DM  
**Severity:** Critical  
**Type:** Feature  
**Screen:** Create Group DM  
**Priority:** 1 — Missing functionality  
**Description:** Multi-user group chat creation (currently stub toast).  
**Likely files:** New GroupChat flow, ChatSettingsSheet.jsx, privateChat.js  
**Dependencies:** None  
**Complexity:** XL  
**Lineage:** GAP-039a  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-006

**Category:** Voice Room / Tools  
**Severity:** Critical  
**Type:** Feature  
**Screen:** Drawing widget overlay  
**Priority:** 1 — Missing functionality  
**Description:** In-room collaborative drawing canvas overlay (distinct from Draw & Guess).  
**Likely files:** New DrawingWidget.jsx, RoomView.jsx, FunctionsGrid.jsx, roomLog.js  
**Dependencies:** FB-048  
**Complexity:** XL  
**Lineage:** GAP-011  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-007

**Category:** Clan  
**Severity:** Critical  
**Type:** Feature  
**Screen:** Family Fund donation flow  
**Priority:** 1 — Missing functionality  
**Description:** In-chat family donation messages and treasury increment.  
**Likely files:** ClanChat.jsx, clans.js  
**Dependencies:** FB-004  
**Complexity:** L  
**Lineage:** PARITY-011  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-008

**Category:** Home / Lobby  
**Severity:** Critical  
**Type:** Feature  
**Screen:** Lobby games catalog  
**Priority:** 1 — Missing functionality  
**Description:** Home grid missing ~10+ WePlay lobby titles.  
**Likely files:** lobbyGames.js, LobbyGamesSection.jsx, games/catalog.js  
**Dependencies:** FB-010  
**Complexity:** XL  
**Lineage:** GAP-041  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-009

**Category:** Settings / Privacy  
**Severity:** Critical  
**Type:** Feature  
**Screen:** Privacy settings screen  
**Priority:** 1 — Missing functionality  
**Description:** Full Privacy screen: hide location, do not recommend, Incognito V6, hide gifts V7, hide guardian V8, blacklists.  
**Likely files:** New PrivacySettingsSheet.jsx, ProfilePanel.jsx  
**Dependencies:** None  
**Complexity:** XL  
**Lineage:** PARITY-001  
**Status:** Completed  
**Implemented In:** 8dbdbca / 2026-06-14  
**Testing Notes:** Privacy sheet + 9 toggles persist to profiles.privacy_settings. Enforced: incognito visit (no visitor log), hide location (others' profile), hide guardian board (others' profile). VIP V6/V7/V8 gates UI-only until level met. Other toggles persist without consumer enforcement (by design). Run supabase/privacy-settings-migration.sql before testing.  

---

### FB-010

**Category:** Games  
**Severity:** Critical  
**Type:** Feature  
**Screen:** UNO / Ludo / lobby games  
**Priority:** 1 — Missing functionality  
**Description:** UNO, Ludo, Jackaroo playable or removed from marketing.  
**Likely files:** games/catalog.js, per-game modules  
**Dependencies:** FB-008  
**Complexity:** XL  
**Lineage:** GAP-091  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-011

**Category:** Voice Room / Settings  
**Severity:** High  
**Type:** Feature  
**Screen:** Associated groups  
**Priority:** 1 — Missing functionality  
**Description:** Associated Groups row and data model.  
**Likely files:** RoomSettingsSheet.jsx  
**Dependencies:** FB-023  
**Complexity:** L  
**Lineage:** GAP-015b / GAP-020b  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-012

**Category:** BFF  
**Severity:** High  
**Type:** Feature  
**Screen:** BFF Invitation tab  
**Priority:** 1 — Missing functionality  
**Description:** BFF Invitation inbox.  
**Likely files:** BffSheet.jsx  
**Dependencies:** FB-001  
**Complexity:** L  
**Lineage:** GAP-072  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-013

**Category:** Chat / DM  
**Severity:** High  
**Type:** Feature  
**Screen:** Block gaming invites  
**Priority:** 1 — Missing functionality  
**Description:** Block gaming invites toggle.  
**Likely files:** ChatSettingsSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-034b  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-014

**Category:** BFF / Intimate  
**Severity:** High  
**Type:** Feature  
**Screen:** Confidant To dress  
**Priority:** 1 — Missing functionality  
**Description:** Dress tabs: Token, Mic connection, Background.  
**Likely files:** ConfidantDressSheet.jsx, IntimateSpaceSheet.jsx  
**Dependencies:** None  
**Complexity:** XL  
**Lineage:** PARITY-002  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-015

**Category:** Chat / DM  
**Severity:** High  
**Type:** Feature  
**Screen:** DM sticker panel sheet  
**Priority:** 1 — Missing functionality  
**Description:** Full sticker picker with category tabs.  
**Likely files:** PersonalChat.jsx, StickerPanel.jsx  
**Dependencies:** None  
**Complexity:** L  
**Lineage:** GAP-111b / PARITY-008  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-016

**Category:** Event Center  
**Severity:** High  
**Type:** Feature  
**Screen:** Event creation flow  
**Priority:** 1 — Missing functionality  
**Description:** Room event create/manage.  
**Likely files:** EventCenterSheet.jsx  
**Dependencies:** FB-019  
**Complexity:** L  
**Lineage:** PARITY-018  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-017

**Category:** Home / Lobby  
**Severity:** High  
**Type:** Feature  
**Screen:** GOLD RUSH invite banner  
**Priority:** 1 — Missing functionality  
**Description:** Timed game invite overlay.  
**Likely files:** LobbyScreen.jsx  
**Dependencies:** FB-008  
**Complexity:** L  
**Lineage:** GAP-042  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-018

**Category:** Voice Room / Tools  
**Severity:** High  
**Type:** Feature  
**Screen:** Lottery result modal  
**Priority:** 1 — Missing functionality  
**Description:** Full lottery modal with participant/winner UI.  
**Likely files:** New LotteryModal.jsx, RoomView.jsx  
**Dependencies:** None  
**Complexity:** L  
**Lineage:** GAP-016a / PARITY-003  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-019

**Category:** Voice Room / Settings  
**Severity:** High  
**Type:** Feature  
**Screen:** Manage event toggle  
**Priority:** 1 — Missing functionality  
**Description:** Manage event toggle linking to Event Center.  
**Likely files:** RoomSettingsSheet.jsx, EventCenterSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** PARITY-007  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-020

**Category:** Clan  
**Severity:** High  
**Type:** Feature  
**Screen:** Clan sign in room chat  
**Priority:** 3 — Data wiring  
**Description:** Family sign badge in room chat.  
**Likely files:** RoomView.jsx  
**Dependencies:** FB-029  
**Complexity:** M  
**Lineage:** GAP-087  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-021

**Category:** Voice Room / Chat  
**Severity:** High  
**Type:** Feature  
**Screen:** Drawing system lines  
**Priority:** 3 — Data wiring  
**Description:** System lines on drawing widget events.  
**Likely files:** roomLog.js  
**Dependencies:** FB-006  
**Complexity:** S  
**Lineage:** GAP-106  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-022

**Category:** Settings  
**Severity:** High  
**Type:** Feature  
**Screen:** Privacy VIP toggles  
**Priority:** 3 — Data wiring  
**Description:** VIP6-8 privacy toggles functional.  
**Likely files:** PrivacySettingsSheet, GuardSheet.jsx  
**Dependencies:** FB-009  
**Complexity:** L  
**Lineage:** PARITY-019  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-023

**Category:** Voice Room  
**Severity:** High  
**Type:** Feature  
**Screen:** Group chat header button  
**Priority:** 4 — Navigation  
**Description:** Header Group pill opens room group chat.  
**Likely files:** RoomView.jsx, RoomGroupChatSheet.jsx  
**Dependencies:** FB-011  
**Complexity:** M  
**Lineage:** GAP-020a  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-024

**Category:** Voice Room / Chat  
**Severity:** High  
**Type:** Feature  
**Screen:** New message jump pill  
**Priority:** 4 — Navigation  
**Description:** Jump-to-bottom pill when scrolled up.  
**Likely files:** RoomView.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-013  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-025

**Category:** Auction / PK  
**Severity:** High  
**Type:** Feature  
**Screen:** Auction mode UI  
**Priority:** 5 — Visual parity  
**Description:** Auction stage UI parity.  
**Likely files:** AuctionPanel.jsx  
**Dependencies:** None  
**Complexity:** L  
**Lineage:** PARITY-015  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-026

**Category:** Shop  
**Severity:** High  
**Type:** Feature  
**Screen:** Avatar shop Boy/Girl  
**Priority:** 5 — Visual parity  
**Description:** Gender tabs + rarity tiers.  
**Likely files:** ShopSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-067  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-027

**Category:** Voice Room  
**Severity:** High  
**Type:** Feature  
**Screen:** Beats & Dance + treasure widgets  
**Priority:** 5 — Visual parity  
**Description:** Floating Beats & Dance and treasure widgets.  
**Likely files:** RoomView.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-006  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-028

**Category:** Rankings  
**Severity:** High  
**Type:** Feature  
**Screen:** Dark purple rankings UI  
**Priority:** 5 — Visual parity  
**Description:** Dark geometric background.  
**Likely files:** RankingsSheet.jsx  
**Dependencies:** None  
**Complexity:** L  
**Lineage:** GAP-061a  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-029

**Category:** Clan  
**Severity:** High  
**Type:** Feature  
**Screen:** Family Sign editor  
**Priority:** 5 — Visual parity  
**Description:** Graphical sign composer.  
**Likely files:** ClanManageTab.jsx  
**Dependencies:** None  
**Complexity:** L  
**Lineage:** GAP-081  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-030

**Category:** Home / Lobby  
**Severity:** High  
**Type:** Feature  
**Screen:** Game tile 3D art  
**Priority:** 5 — Visual parity  
**Description:** Gold-framed 3D game tile art.  
**Likely files:** LobbyGamesSection.jsx  
**Dependencies:** FB-008  
**Complexity:** L  
**Lineage:** GAP-048  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-031

**Category:** Gifts  
**Severity:** High  
**Type:** Feature  
**Screen:** Gift sheet footer  
**Priority:** 5 — Visual parity  
**Description:** Coin, anonymous, qty, pink Send footer.  
**Likely files:** GiftSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-021  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-032

**Category:** Gifts  
**Severity:** High  
**Type:** Feature  
**Screen:** Gift wall sheet  
**Priority:** 5 — Visual parity  
**Description:** Gift wall lit/unlit badges.  
**Likely files:** GiftWallSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-029  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-033

**Category:** Chat / DM  
**Severity:** High  
**Type:** Feature  
**Screen:** Invite card visual parity  
**Priority:** 5 — Visual parity  
**Description:** Rich card with room cover thumbnail.  
**Likely files:** PersonalChat.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-031  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-034

**Category:** Profile  
**Severity:** High  
**Type:** Feature  
**Screen:** Moments discover row  
**Priority:** 5 — Visual parity  
**Description:** Discover moments row with dot.  
**Likely files:** ExploreTab.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-051  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-035

**Category:** Profile  
**Severity:** High  
**Type:** Feature  
**Screen:** Moments feed cards  
**Priority:** 5 — Visual parity  
**Description:** Spotlight card interactions.  
**Likely files:** MomentsFeed.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-060  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-036

**Category:** Rankings  
**Severity:** High  
**Type:** Feature  
**Screen:** Ornate avatar frames  
**Priority:** 5 — Visual parity  
**Description:** Decorative frames ranks 4+.  
**Likely files:** RankingsSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-061c / PARITY-012  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-037

**Category:** PK  
**Severity:** High  
**Type:** Feature  
**Screen:** PK battle bar  
**Priority:** 5 — Visual parity  
**Description:** PK overlay UI parity.  
**Likely files:** PkBarSheet.jsx  
**Dependencies:** None  
**Complexity:** L  
**Lineage:** PARITY-016  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-038

**Category:** Rankings  
**Severity:** High  
**Type:** Feature  
**Screen:** PLAY Show tab UI  
**Priority:** 5 — Visual parity  
**Description:** Gender toggle + Collection metric.  
**Likely files:** PlayShowSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-064  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-039

**Category:** Church  
**Severity:** High  
**Type:** Feature  
**Screen:** Propose visual parity  
**Priority:** 5 — Visual parity  
**Description:** Propose flow UI.  
**Likely files:** ChurchSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-076  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-040

**Category:** Shop  
**Severity:** High  
**Type:** Feature  
**Screen:** Purchase duration modal  
**Priority:** 5 — Visual parity  
**Description:** Duration selector + stat effects modal.  
**Likely files:** ShopSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** PARITY-005  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-041

**Category:** Chat / DM  
**Severity:** High  
**Type:** Feature  
**Screen:** Reply quote nesting UI  
**Priority:** 5 — Visual parity  
**Description:** Nested quote bubble styling.  
**Likely files:** PersonalChat.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-032  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-042

**Category:** Love Home  
**Severity:** High  
**Type:** Feature  
**Screen:** Rings + Love/Blessing stats  
**Priority:** 5 — Visual parity  
**Description:** Ring modal + stat counters.  
**Likely files:** LoveHomeSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-075 / GAP-110  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-043

**Category:** Home / Lobby  
**Severity:** High  
**Type:** Feature  
**Screen:** Room card badges  
**Priority:** 5 — Visual parity  
**Description:** Hex badges and ribbon pills.  
**Likely files:** LobbyScreen.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-045  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-044

**Category:** Settings  
**Severity:** High  
**Type:** Feature  
**Screen:** Safety Center banners  
**Priority:** 5 — Visual parity  
**Description:** Illustrated safety banners.  
**Likely files:** SecurityCenterSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-094  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-045

**Category:** Voice Room / Tools  
**Severity:** High  
**Type:** Feature  
**Screen:** Scoreboard modal layout  
**Priority:** 5 — Visual parity  
**Description:** Add/Subtract button layout parity.  
**Likely files:** ScoreboardSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-018  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-046

**Category:** Church  
**Severity:** High  
**Type:** Feature  
**Screen:** Select members UI  
**Priority:** 5 — Visual parity  
**Description:** Propose member picker + Guard Pts hint.  
**Likely files:** MyHomeSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** PARITY-009  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-047

**Category:** Voice Room  
**Severity:** High  
**Type:** Feature  
**Screen:** Stage header metadata  
**Priority:** 5 — Visual parity  
**Description:** Diamond badge, room ID, music chip, audience.  
**Likely files:** RoomView.jsx, StageBackdrop.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-002  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-048

**Category:** Voice Room / Chat  
**Severity:** High  
**Type:** Feature  
**Screen:** System message styling  
**Priority:** 5 — Visual parity  
**Description:** Yellow System: prefix, bell, regulations link.  
**Likely files:** RoomView.jsx, roomLog.js  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-012  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-049

**Category:** Intimate Space  
**Severity:** High  
**Type:** Feature  
**Screen:** Token wall locks  
**Priority:** 5 — Visual parity  
**Description:** Exclusive wall level gates.  
**Likely files:** IntimateSpaceSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-073  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-050

**Category:** Voice Room / Video  
**Severity:** High  
**Type:** Feature  
**Screen:** YouTube in-room panel  
**Priority:** 5 — Visual parity  
**Description:** Video mode chrome and seat strip.  
**Likely files:** VideoRoomPanel.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-019  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-051

**Category:** Gifts  
**Severity:** High  
**Type:** Feature  
**Screen:** Premium gift fullscreen FX  
**Priority:** 6 — Animation parity  
**Description:** SVGA/Lottie fullscreen gift FX.  
**Likely files:** PremiumGiftFx.jsx, giftFx.js  
**Dependencies:** None  
**Complexity:** L  
**Lineage:** GAP-026  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-052

**Category:** BFF  
**Severity:** Medium  
**Type:** Feature  
**Screen:** BFF Chest  
**Priority:** 1 — Missing functionality  
**Description:** Chest rewards modal.  
**Likely files:** BffSheet.jsx  
**Dependencies:** FB-001  
**Complexity:** M  
**Lineage:** GAP-074  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-053

**Category:** Voice Room  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Business Life  
**Priority:** 1 — Missing functionality  
**Description:** Business Life feature.  
**Likely files:** FunctionsGrid.jsx  
**Dependencies:** None  
**Complexity:** L  
**Lineage:** PARITY-020  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-054

**Category:** Voice Room / Tools  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Coin toss emote  
**Priority:** 1 — Missing functionality  
**Description:** Coin toss in chat.  
**Likely files:** FunctionsGrid.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-016c  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-055

**Category:** Voice Room / Tools  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Dice emote  
**Priority:** 1 — Missing functionality  
**Description:** Animated dice in chat.  
**Likely files:** FunctionsGrid.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-016b  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-056

**Category:** Home / Lobby  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Gift Pack tile badge  
**Priority:** 1 — Missing functionality  
**Description:** Countdown on tiles.  
**Likely files:** LobbyGamesSection.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-049a  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-057

**Category:** Settings  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Keyword blacklist  
**Priority:** 1 — Missing functionality  
**Description:** Keyword filtering.  
**Likely files:** New keyword module  
**Dependencies:** FB-009  
**Complexity:** M  
**Lineage:** GAP-095b  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-058

**Category:** Voice Room / Settings  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Membership fees row  
**Priority:** 1 — Missing functionality  
**Description:** Membership Fee settings row.  
**Likely files:** RoomSettingsSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-015a  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-059

**Category:** Profile  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Moment composer media  
**Priority:** 1 — Missing functionality  
**Description:** Photo/location/mentions.  
**Likely files:** CreateMomentSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-059  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-060

**Category:** Settings  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Parental controls  
**Priority:** 1 — Missing functionality  
**Description:** PIN + limits.  
**Likely files:** ParentalControlSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-096a  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-061

**Category:** Voice Room / Chat  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Pinned owner rules  
**Priority:** 1 — Missing functionality  
**Description:** Pinned rules above chat.  
**Likely files:** RoomView.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-017  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-062

**Category:** Voice Room / Settings  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Room records row  
**Priority:** 1 — Missing functionality  
**Description:** Room Records row.  
**Likely files:** RoomSettingsSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-015c  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-063

**Category:** Clan  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Steal toggle  
**Priority:** 1 — Missing functionality  
**Description:** Steal prohibition.  
**Likely files:** ClanManageTab.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-083  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-064

**Category:** Gifts  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Anonymous mask  
**Priority:** 3 — Data wiring  
**Description:** Anonymous in chat lines.  
**Likely files:** GiftSheet.jsx  
**Dependencies:** FB-031  
**Complexity:** S  
**Lineage:** GAP-023  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-065

**Category:** Profile  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Bio field  
**Priority:** 3 — Data wiring  
**Description:** Bio parity.  
**Likely files:** EditProfileSheet.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-057b  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-066

**Category:** Profile  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Country picker  
**Priority:** 3 — Data wiring  
**Description:** Country with flags.  
**Likely files:** EditProfileSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-057a  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-067

**Category:** Voice Room / Settings  
**Severity:** Medium  
**Type:** Feature  
**Screen:** High quality system line  
**Priority:** 3 — Data wiring  
**Description:** System line on HQ toggle.  
**Likely files:** RoomSettingsSheet.jsx  
**Dependencies:** FB-048  
**Complexity:** XS  
**Lineage:** GAP-014  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-068

**Category:** Discover  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Nearby geo  
**Priority:** 3 — Data wiring  
**Description:** Real location + privacy.  
**Likely files:** NearbySheet.jsx  
**Dependencies:** FB-009  
**Complexity:** L  
**Lineage:** PARITY-022  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-069

**Category:** Gifts  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Receiver Gold line  
**Priority:** 3 — Data wiring  
**Description:** Receiver's Gold +N subline.  
**Likely files:** RoomView.jsx, ClanChat.jsx  
**Dependencies:** FB-119  
**Complexity:** S  
**Lineage:** PARITY-014  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-070

**Category:** Settings  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Region picker  
**Priority:** 3 — Data wiring  
**Description:** Searchable regions.  
**Likely files:** LanguageSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-093  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-071

**Category:** Shop  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Silver wallet  
**Priority:** 3 — Data wiring  
**Description:** Real silver balance.  
**Likely files:** ShopSheet.jsx, wallet.js  
**Dependencies:** None  
**Complexity:** L  
**Lineage:** PARITY-010  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-072

**Category:** Profile  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Visitors incognito  
**Priority:** 3 — Data wiring  
**Description:** VIP hide footprint.  
**Likely files:** VisitorsSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-058  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-073

**Category:** BFF  
**Severity:** Medium  
**Type:** Feature  
**Screen:** BFF shop link  
**Priority:** 4 — Navigation  
**Description:** Header shop deep link.  
**Likely files:** BffSheet.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-078  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-074

**Category:** Shop  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Bubble backpack equip  
**Priority:** 4 — Navigation  
**Description:** Equip owned bubbles.  
**Likely files:** InventorySheet.jsx  
**Dependencies:** FB-002  
**Complexity:** M  
**Lineage:** GAP-107  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-075

**Category:** Onboarding  
**Severity:** Medium  
**Type:** Feature  
**Screen:** First-run wizard  
**Priority:** 4 — Navigation  
**Description:** Onboarding UX.  
**Likely files:** ProfileSetupScreen.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** PARITY-024  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-076

**Category:** Rankings  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Help modal  
**Priority:** 4 — Navigation  
**Description:** Rules explainer.  
**Likely files:** RankingsSheet.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-065  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-077

**Category:** Settings  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Message blacklist UI  
**Priority:** 4 — Navigation  
**Description:** Blacklist screen.  
**Likely files:** BlockedUsersSheet.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-095a  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-078

**Category:** Profile  
**Severity:** Medium  
**Type:** Feature  
**Screen:** PLAY Show entry  
**Priority:** 4 — Navigation  
**Description:** PLAY Show tile.  
**Likely files:** ProfilePanel.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-055  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-079

**Category:** Voice Room / Lobby  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Pull-to-refresh  
**Priority:** 4 — Navigation  
**Description:** Pull refresh gesture.  
**Likely files:** LobbyScreen.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-043  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-080

**Category:** Settings  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Youth Mode link  
**Priority:** 4 — Navigation  
**Description:** Link to privacy.  
**Likely files:** ParentalControlSheet.jsx  
**Dependencies:** FB-009  
**Complexity:** S  
**Lineage:** GAP-096b  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-081

**Category:** Clan  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Charm gate UI  
**Priority:** 5 — Visual parity  
**Description:** Badge picker.  
**Likely files:** ClanManageTab.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-082  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-082

**Category:** Chat / DM  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Chats header icons  
**Priority:** 5 — Visual parity  
**Description:** Add-friend + compose.  
**Likely files:** LobbyScreen.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-036  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-083

**Category:** Chat / DM  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Clan chat row  
**Priority:** 5 — Visual parity  
**Description:** Clan row styling.  
**Likely files:** LobbyScreen.jsx  
**Dependencies:** FB-029  
**Complexity:** S  
**Lineage:** GAP-040  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-084

**Category:** Wallet  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Coin pack ribbons  
**Priority:** 5 — Visual parity  
**Description:** Pack promo art.  
**Likely files:** CoinShopSheet.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-070  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-085

**Category:** Chat / DM  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Compose icon layout  
**Priority:** 5 — Visual parity  
**Description:** Compose bar icon order.  
**Likely files:** PersonalChat.jsx  
**Dependencies:** FB-015  
**Complexity:** S  
**Lineage:** GAP-111a  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-086

**Category:** BFF  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Couple ranking pairs  
**Priority:** 5 — Visual parity  
**Description:** Paired avatars.  
**Likely files:** RankingsSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-080  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-087

**Category:** Profile  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Cover carousel  
**Priority:** 5 — Visual parity  
**Description:** Cover + 3D hint.  
**Likely files:** ProfileCoverCarousel.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-052  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-088

**Category:** Chat / DM  
**Severity:** Medium  
**Type:** Feature  
**Screen:** DM avatar frame + badge  
**Priority:** 5 — Visual parity  
**Description:** Gold frame + floating LV badge.  
**Likely files:** PersonalChat.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-037+109  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-089

**Category:** Gifts  
**Severity:** Medium  
**Type:** Feature  
**Screen:** DM gift promo banner  
**Priority:** 5 — Visual parity  
**Description:** Promo strip in DM.  
**Likely files:** GiftSheet.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-028  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-090

**Category:** Clan / Chat  
**Severity:** Medium  
**Type:** Feature  
**Screen:** FAMILY BUSINESS badge  
**Priority:** 5 — Visual parity  
**Description:** Gift scroll badge.  
**Likely files:** ClanChat.jsx  
**Dependencies:** FB-004  
**Complexity:** S  
**Lineage:** PARITY-023  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-091

**Category:** Home / Lobby  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Gift Pack floater  
**Priority:** 5 — Visual parity  
**Description:** Lobby floater widget.  
**Likely files:** GiftPackFloater.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-049b / PARITY-017  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-092

**Category:** Gifts  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Gift tile disabled  
**Priority:** 5 — Visual parity  
**Description:** Gray-out unaffordable tiles.  
**Likely files:** GiftSheet.jsx  
**Dependencies:** FB-031  
**Complexity:** S  
**Lineage:** GAP-022  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-093

**Category:** Profile  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Gift wall preview  
**Priority:** 5 — Visual parity  
**Description:** Inline gift wall.  
**Likely files:** UserFullProfileSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-054  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-094

**Category:** Voice Room / Lobby  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Gold Tycoon banner  
**Priority:** 5 — Visual parity  
**Description:** Banner illustration.  
**Likely files:** LobbyScreen.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-044  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-095

**Category:** Home / Lobby  
**Severity:** Medium  
**Type:** Feature  
**Screen:** HOT ROOM polish  
**Priority:** 5 — Visual parity  
**Description:** Banner visual diff.  
**Likely files:** LobbyScreen.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-050  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-096

**Category:** Home / Lobby  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Header coin/NEW/Events  
**Priority:** 5 — Visual parity  
**Description:** Header ornaments.  
**Likely files:** GplayHomeHeader.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** PARITY-006  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-097

**Category:** Clan  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Header icons  
**Priority:** 5 — Visual parity  
**Description:** Rank + menu icons.  
**Likely files:** ClanHubSheet.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-086  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-098

**Category:** Home / Lobby  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Hub quick links  
**Priority:** 5 — Visual parity  
**Description:** Ranking/Tasks/Online row.  
**Likely files:** GplayHubRow.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-047  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-099

**Category:** Chat / DM  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Large sticker no bubble  
**Priority:** 5 — Visual parity  
**Description:** Sticker-only messages.  
**Likely files:** PersonalChat.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-033  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-100

**Category:** Clan  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Manage tab dot  
**Priority:** 5 — Visual parity  
**Description:** Pending apps dot.  
**Likely files:** ClanHubSheet.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-085  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-101

**Category:** Profile  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Me settings grid  
**Priority:** 5 — Visual parity  
**Description:** Settings icon grid.  
**Likely files:** ProfilePanel.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-053  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-102

**Category:** Chat / DM  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Muted bell icon  
**Priority:** 5 — Visual parity  
**Description:** Muted row indicator.  
**Likely files:** ChatListRow.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-038  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-103

**Category:** Clan  
**Severity:** Medium  
**Type:** Feature  
**Screen:** News cards  
**Priority:** 5 — Visual parity  
**Description:** Illustrated news.  
**Likely files:** ClanNewsTab.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-090  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-104

**Category:** Chat / DM  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Official badge  
**Priority:** 5 — Visual parity  
**Description:** Official badge on rows.  
**Likely files:** ChatListRow.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-035  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-105

**Category:** Rankings  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Podium art  
**Priority:** 5 — Visual parity  
**Description:** Crown top-3 styling.  
**Likely files:** RankingsSheet.jsx  
**Dependencies:** FB-028  
**Complexity:** M  
**Lineage:** GAP-061b  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-106

**Category:** Gifts  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Qty presets  
**Priority:** 5 — Visual parity  
**Description:** Presets 1/5/33/50/100.  
**Likely files:** GiftSheet.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-024  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-107

**Category:** Voice Room / Settings  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Settings list pattern  
**Priority:** 5 — Visual parity  
**Description:** iOS chevron grouped settings.  
**Likely files:** RoomSettingsSheet.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** PARITY-013  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-108

**Category:** Gifts  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Special tab helper  
**Priority:** 5 — Visual parity  
**Description:** Helper + Business Life tags.  
**Likely files:** GiftSheet.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-025  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-109

**Category:** Login  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Splash + login branding  
**Priority:** 5 — Visual parity  
**Description:** Branded splash.  
**Likely files:** LoginScreen.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-092  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-110

**Category:** Profile  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Stats badges  
**Priority:** 5 — Visual parity  
**Description:** Stats capsules.  
**Likely files:** UserFullProfileSheet.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-056  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-111

**Category:** Voice Room / Lobby  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Tag filter pills  
**Priority:** 5 — Visual parity  
**Description:** Filter pill styling.  
**Likely files:** LobbyScreen.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-046  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-112

**Category:** Clan  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Tasks rewards UI  
**Priority:** 5 — Visual parity  
**Description:** Task card polish.  
**Likely files:** ClanTasksTab.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-089  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-113

**Category:** Rankings  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Time filter pills  
**Priority:** 5 — Visual parity  
**Description:** Active pill styling.  
**Likely files:** RankingsSheet.jsx  
**Dependencies:** FB-028  
**Complexity:** S  
**Lineage:** GAP-062  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-114

**Category:** BFF  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Title badges  
**Priority:** 5 — Visual parity  
**Description:** YAPPERS-style badges.  
**Likely files:** RoomView.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-079  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-115

**Category:** VIP  
**Severity:** Medium  
**Type:** Feature  
**Screen:** VIP name coverage  
**Priority:** 5 — Visual parity  
**Description:** VIP names everywhere.  
**Likely files:** VipDisplayName.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-069  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-116

**Category:** VIP  
**Severity:** Medium  
**Type:** Feature  
**Screen:** VIP request UI  
**Priority:** 5 — Visual parity  
**Description:** Request flow polish.  
**Likely files:** VipSheet.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-066  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-117

**Category:** Clan  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Voice room button  
**Priority:** 5 — Visual parity  
**Description:** Button restyle.  
**Likely files:** ClanProfileTab.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-088  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-118

**Category:** Gifts  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Combo button  
**Priority:** 6 — Animation parity  
**Description:** Combo send ring.  
**Likely files:** ComboGiftButton.jsx  
**Dependencies:** FB-031  
**Complexity:** M  
**Lineage:** GAP-027  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-119

**Category:** Gifts  
**Severity:** Medium  
**Type:** Feature  
**Screen:** Gift chat feedback merged  
**Priority:** 6 — Animation parity  
**Description:** Charm +N + floating gift sprites.  
**Likely files:** RoomView.jsx, GiftHitFx.jsx  
**Dependencies:** FB-031  
**Complexity:** M  
**Lineage:** GAP-030+102  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-120

**Category:** Notifications  
**Severity:** Low  
**Type:** Feature  
**Screen:** Discover red dot  
**Priority:** 5 — Visual parity  
**Description:** Discover badge.  
**Likely files:** LobbyScreen.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-108  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-121

**Category:** Gifts  
**Severity:** Low  
**Type:** Feature  
**Screen:** Combo press model  
**Priority:** 6 — Animation parity  
**Description:** Long-press eval.  
**Likely files:** ComboGiftButton.jsx  
**Dependencies:** FB-118  
**Complexity:** S  
**Lineage:** PARITY-025  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-122

**Category:** Polish  
**Severity:** Low  
**Type:** Feature  
**Screen:** Sheet animations  
**Priority:** 6 — Animation parity  
**Description:** Spring timing.  
**Likely files:** App.css  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-099  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-123

**Category:** Voice Room  
**Severity:** Low  
**Type:** Feature  
**Screen:** Audience strip  
**Priority:** 7 — Cosmetic polish  
**Description:** Avatar overlap.  
**Likely files:** RoomView.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-010  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-124

**Category:** Voice Room  
**Severity:** Low  
**Type:** Feature  
**Screen:** Champagne backdrop art  
**Priority:** 7 — Cosmetic polish  
**Description:** Bottle/pyramid PNG.  
**Likely files:** StageBackdrop.jsx  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-005  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-125

**Category:** Documentation  
**Severity:** Low  
**Type:** Feature  
**Screen:** DM call G-Play extra  
**Priority:** 7 — Cosmetic polish  
**Description:** Document extra feature.  
**Likely files:** DmCallProvider.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** PARITY-021  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-126

**Category:** Voice Room  
**Severity:** Low  
**Type:** Feature  
**Screen:** Diamond badge  
**Priority:** 7 — Cosmetic polish  
**Description:** Diamond component.  
**Likely files:** RoomExpBar.jsx  
**Dependencies:** FB-047  
**Complexity:** S  
**Lineage:** GAP-009  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-127

**Category:** Voice Room  
**Severity:** Low  
**Type:** Feature  
**Screen:** Dock icon order  
**Priority:** 7 — Cosmetic polish  
**Description:** Dock layout.  
**Likely files:** RoomDock.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-101  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-128

**Category:** Polish  
**Severity:** Low  
**Type:** Feature  
**Screen:** Empty illustrations  
**Priority:** 7 — Cosmetic polish  
**Description:** Empty state art.  
**Likely files:** Multiple  
**Dependencies:** None  
**Complexity:** M  
**Lineage:** GAP-100  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-129

**Category:** Voice Room / Seats  
**Severity:** Low  
**Type:** Feature  
**Screen:** Empty seat styling  
**Priority:** 7 — Cosmetic polish  
**Description:** Gold + on empty seats.  
**Likely files:** App.css  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-003  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-130

**Category:** Polish  
**Severity:** Low  
**Type:** Feature  
**Screen:** Family vs Clan label  
**Priority:** 7 — Cosmetic polish  
**Description:** Tab copy.  
**Likely files:** RankingsSheet.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-104  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-131

**Category:** Polish  
**Severity:** Low  
**Type:** Feature  
**Screen:** G-play tab label  
**Priority:** 7 — Cosmetic polish  
**Description:** Brand copy.  
**Likely files:** LobbyScreen.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-097  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-132

**Category:** Voice Room / Seats  
**Severity:** Low  
**Type:** Feature  
**Screen:** Locked seat padlock  
**Priority:** 7 — Cosmetic polish  
**Description:** Padlock styling.  
**Likely files:** App.css  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-004  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-133

**Category:** Voice Room  
**Severity:** Low  
**Type:** Feature  
**Screen:** Minimize chip art  
**Priority:** 7 — Cosmetic polish  
**Description:** Float chip thumbnail.  
**Likely files:** App.jsx  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-008  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-134

**Category:** Clan  
**Severity:** Low  
**Type:** Feature  
**Screen:** Section accent bars  
**Priority:** 7 — Cosmetic polish  
**Description:** Cyan accent bars.  
**Likely files:** ClanManageTab.jsx  
**Dependencies:** None  
**Complexity:** XS  
**Lineage:** GAP-105  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

### FB-135

**Category:** Polish  
**Severity:** Low  
**Type:** Feature  
**Screen:** Teal accent  
**Priority:** 7 — Cosmetic polish  
**Description:** Theme tokens.  
**Likely files:** App.css  
**Dependencies:** None  
**Complexity:** S  
**Lineage:** GAP-098  
**Status:** Not Started  
**Implemented In:** —  
**Testing Notes:** —  

---

