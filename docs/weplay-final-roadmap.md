# WePlay → G-Play Final Implementation Roadmap

**Backlog:** [`weplay-final-backlog.md`](./weplay-final-backlog.md)  
**Summary:** [`weplay-final-summary.md`](./weplay-final-summary.md)  
**Date:** 2026-06-14  

Engineering agents execute **Waves 1→4** in order. Do not use v1 sprint docs.

## Dependency clusters

| Cluster | Items | Notes |
|---------|-------|-------|
| Privacy foundation | FB-009 → FB-022 → FB-057 → FB-068 → FB-077 → FB-080 | PARITY-001 unlocks VIP toggles, keyword blacklist, youth link, Nearby geo |
| Clan chat core | FB-004 → FB-007 | Gift cards before Family Fund donations |
| Room groups | FB-011 → FB-023 | Group header button before associated groups data model |
| Events | FB-016 → FB-019 | Manage-event toggle before Event Center create flow |
| Games catalog | FB-008 → FB-010 | Lobby grid and playable games are coupled |
| BFF unlock | FB-001 → FB-012 → FB-052 | To Unlock before Invitation tab and chest |
| Gifts stack | FB-031 → FB-069 → FB-092 → FB-118 → FB-119 | Footer before chat feedback, combo, disabled tiles |
| Drawing widget | FB-006 → FB-021 | Canvas overlay before drawing system lines |

## Wave 1 — Critical

**Items:** 10  
**Goal:** Ship missing core features: privacy, drawing, group DM, games, clan economy, BFF unlock.

| ID | Screen | Complexity | Deps | Files |
|----|--------|------------|------|-------|
| FB-001 | BFF To Unlock screen | L | — | `New BffUnlockSheet.jsx` |
| FB-002 | Chat Bubble shop | L | — | `New ChatBubbleShop.jsx` |
| FB-003 | Clan chest / store / gacha | XL | — | `ClanProfileTab.jsx` |
| FB-004 | Clan group chat message types | XL | — | `ClanChat.jsx` |
| FB-005 | Create Group DM | XL | — | `New GroupChat flow` |
| FB-006 | Drawing widget overlay | XL | FB-048 | `New DrawingWidget.jsx` |
| FB-007 | Family Fund donation flow | L | FB-004 | `ClanChat.jsx` |
| FB-008 | Lobby games catalog | XL | FB-010 | `lobbyGames.js` |
| FB-009 | Privacy settings screen | XL | — | `New PrivacySettingsSheet.jsx` |
| FB-010 | UNO / Ludo / lobby games | XL | FB-008 | `games/catalog.js` |

### Wave test checklist

- [ ] Privacy screen reachable from Profile settings with all toggles persisted
- [ ] Drawing widget opens from functions grid and posts system lines
- [ ] Group DM creation adds multi-user thread (not toast stub)
- [ ] Clan Chest/Store/Gacha open functional flows
- [ ] UNO/Ludo either playable or removed from lobby marketing
- [ ] Family Fund donation increments treasury in clan chat

## Wave 2 — High

**Items:** 41  
**Goal:** Complete high-impact flows: lottery modal, stickers, events, rankings, clan sign, PK/auction.

| ID | Screen | Complexity | Deps | Files |
|----|--------|------------|------|-------|
| FB-011 | Associated groups | L | FB-023 | `RoomSettingsSheet.jsx` |
| FB-012 | BFF Invitation tab | L | FB-001 | `BffSheet.jsx` |
| FB-013 | Block gaming invites | M | — | `ChatSettingsSheet.jsx` |
| FB-014 | Confidant To dress | XL | — | `ConfidantDressSheet.jsx` |
| FB-015 | DM sticker panel sheet | L | — | `PersonalChat.jsx` |
| FB-016 | Event creation flow | L | FB-019 | `EventCenterSheet.jsx` |
| FB-017 | GOLD RUSH invite banner | L | FB-008 | `LobbyScreen.jsx` |
| FB-018 | Lottery result modal | L | — | `New LotteryModal.jsx` |
| FB-019 | Manage event toggle | M | — | `RoomSettingsSheet.jsx` |
| FB-020 | Clan sign in room chat | M | FB-029 | `RoomView.jsx` |
| FB-021 | Drawing system lines | S | FB-006 | `roomLog.js` |
| FB-022 | Privacy VIP toggles | L | FB-009 | `PrivacySettingsSheet` |
| FB-023 | Group chat header button | M | FB-011 | `RoomView.jsx` |
| FB-024 | New message jump pill | S | — | `RoomView.jsx` |
| FB-025 | Auction mode UI | L | — | `AuctionPanel.jsx` |
| FB-026 | Avatar shop Boy/Girl | M | — | `ShopSheet.jsx` |
| FB-027 | Beats & Dance + treasure widgets | M | — | `RoomView.jsx` |
| FB-028 | Dark purple rankings UI | L | — | `RankingsSheet.jsx` |
| FB-029 | Family Sign editor | L | — | `ClanManageTab.jsx` |
| FB-030 | Game tile 3D art | L | FB-008 | `LobbyGamesSection.jsx` |
| FB-031 | Gift sheet footer | M | — | `GiftSheet.jsx` |
| FB-032 | Gift wall sheet | M | — | `GiftWallSheet.jsx` |
| FB-033 | Invite card visual parity | M | — | `PersonalChat.jsx` |
| FB-034 | Moments discover row | M | — | `ExploreTab.jsx` |
| FB-035 | Moments feed cards | M | — | `MomentsFeed.jsx` |
| FB-036 | Ornate avatar frames | M | — | `RankingsSheet.jsx` |
| FB-037 | PK battle bar | L | — | `PkBarSheet.jsx` |
| FB-038 | PLAY Show tab UI | M | — | `PlayShowSheet.jsx` |
| FB-039 | Propose visual parity | M | — | `ChurchSheet.jsx` |
| FB-040 | Purchase duration modal | M | — | `ShopSheet.jsx` |
| FB-041 | Reply quote nesting UI | M | — | `PersonalChat.jsx` |
| FB-042 | Rings + Love/Blessing stats | M | — | `LoveHomeSheet.jsx` |
| FB-043 | Room card badges | M | — | `LobbyScreen.jsx` |
| FB-044 | Safety Center banners | M | — | `SecurityCenterSheet.jsx` |
| FB-045 | Scoreboard modal layout | M | — | `ScoreboardSheet.jsx` |
| FB-046 | Select members UI | M | — | `MyHomeSheet.jsx` |
| FB-047 | Stage header metadata | M | — | `RoomView.jsx` |
| FB-048 | System message styling | M | — | `RoomView.jsx` |
| FB-049 | Token wall locks | M | — | `IntimateSpaceSheet.jsx` |
| FB-050 | YouTube in-room panel | M | — | `VideoRoomPanel.jsx` |
| FB-051 | Premium gift fullscreen FX | L | — | `PremiumGiftFx.jsx` |

### Wave test checklist

- [ ] Lottery opens modal with winner card (not emoji-only chat line)
- [ ] DM sticker sheet opens with category tabs
- [ ] Room Manage event toggle links to Event Center
- [ ] Rankings dark theme + ornate frames render on list rows
- [ ] Auction/PK overlays match reference stage chrome

## Wave 3 — Medium

**Items:** 68  
**Goal:** Data wiring, navigation polish, shop/wallet, clan tasks, settings sub-screens.

| ID | Screen | Complexity | Deps | Files |
|----|--------|------------|------|-------|
| FB-052 | BFF Chest | M | FB-001 | `BffSheet.jsx` |
| FB-053 | Business Life | L | — | `FunctionsGrid.jsx` |
| FB-054 | Coin toss emote | S | — | `FunctionsGrid.jsx` |
| FB-055 | Dice emote | S | — | `FunctionsGrid.jsx` |
| FB-056 | Gift Pack tile badge | M | — | `LobbyGamesSection.jsx` |
| FB-057 | Keyword blacklist | M | FB-009 | `New keyword module` |
| FB-058 | Membership fees row | M | — | `RoomSettingsSheet.jsx` |
| FB-059 | Moment composer media | M | — | `CreateMomentSheet.jsx` |
| FB-060 | Parental controls | M | — | `ParentalControlSheet.jsx` |
| FB-061 | Pinned owner rules | M | — | `RoomView.jsx` |
| FB-062 | Room records row | M | — | `RoomSettingsSheet.jsx` |
| FB-063 | Steal toggle | M | — | `ClanManageTab.jsx` |
| FB-064 | Anonymous mask | S | FB-031 | `GiftSheet.jsx` |
| FB-065 | Bio field | XS | — | `EditProfileSheet.jsx` |
| FB-066 | Country picker | M | — | `EditProfileSheet.jsx` |
| FB-067 | High quality system line | XS | FB-048 | `RoomSettingsSheet.jsx` |
| FB-068 | Nearby geo | L | FB-009 | `NearbySheet.jsx` |
| FB-069 | Receiver Gold line | S | FB-119 | `RoomView.jsx` |
| FB-070 | Region picker | M | — | `LanguageSheet.jsx` |
| FB-071 | Silver wallet | L | — | `ShopSheet.jsx` |
| FB-072 | Visitors incognito | M | — | `VisitorsSheet.jsx` |
| FB-073 | BFF shop link | XS | — | `BffSheet.jsx` |
| FB-074 | Bubble backpack equip | M | FB-002 | `InventorySheet.jsx` |
| FB-075 | First-run wizard | M | — | `ProfileSetupScreen.jsx` |
| FB-076 | Help modal | S | — | `RankingsSheet.jsx` |
| FB-077 | Message blacklist UI | S | — | `BlockedUsersSheet.jsx` |
| FB-078 | PLAY Show entry | XS | — | `ProfilePanel.jsx` |
| FB-079 | Pull-to-refresh | M | — | `LobbyScreen.jsx` |
| FB-080 | Youth Mode link | S | FB-009 | `ParentalControlSheet.jsx` |
| FB-081 | Charm gate UI | S | — | `ClanManageTab.jsx` |
| FB-082 | Chats header icons | XS | — | `LobbyScreen.jsx` |
| FB-083 | Clan chat row | S | FB-029 | `LobbyScreen.jsx` |
| FB-084 | Coin pack ribbons | S | — | `CoinShopSheet.jsx` |
| FB-085 | Compose icon layout | S | FB-015 | `PersonalChat.jsx` |
| FB-086 | Couple ranking pairs | M | — | `RankingsSheet.jsx` |
| FB-087 | Cover carousel | M | — | `ProfileCoverCarousel.jsx` |
| FB-088 | DM avatar frame + badge | M | — | `PersonalChat.jsx` |
| FB-089 | DM gift promo banner | S | — | `GiftSheet.jsx` |
| FB-090 | FAMILY BUSINESS badge | S | FB-004 | `ClanChat.jsx` |
| FB-091 | Gift Pack floater | M | — | `GiftPackFloater.jsx` |
| FB-092 | Gift tile disabled | S | FB-031 | `GiftSheet.jsx` |
| FB-093 | Gift wall preview | M | — | `UserFullProfileSheet.jsx` |
| FB-094 | Gold Tycoon banner | S | — | `LobbyScreen.jsx` |
| FB-095 | HOT ROOM polish | S | — | `LobbyScreen.jsx` |
| FB-096 | Header coin/NEW/Events | M | — | `GplayHomeHeader.jsx` |
| FB-097 | Header icons | XS | — | `ClanHubSheet.jsx` |
| FB-098 | Hub quick links | S | — | `GplayHubRow.jsx` |
| FB-099 | Large sticker no bubble | S | — | `PersonalChat.jsx` |
| FB-100 | Manage tab dot | XS | — | `ClanHubSheet.jsx` |
| FB-101 | Me settings grid | M | — | `ProfilePanel.jsx` |
| FB-102 | Muted bell icon | XS | — | `ChatListRow.jsx` |
| FB-103 | News cards | M | — | `ClanNewsTab.jsx` |
| FB-104 | Official badge | XS | — | `ChatListRow.jsx` |
| FB-105 | Podium art | M | FB-028 | `RankingsSheet.jsx` |
| FB-106 | Qty presets | XS | — | `GiftSheet.jsx` |
| FB-107 | Settings list pattern | S | — | `RoomSettingsSheet.jsx` |
| FB-108 | Special tab helper | XS | — | `GiftSheet.jsx` |
| FB-109 | Splash + login branding | M | — | `LoginScreen.jsx` |
| FB-110 | Stats badges | S | — | `UserFullProfileSheet.jsx` |
| FB-111 | Tag filter pills | XS | — | `LobbyScreen.jsx` |
| FB-112 | Tasks rewards UI | S | — | `ClanTasksTab.jsx` |
| FB-113 | Time filter pills | S | FB-028 | `RankingsSheet.jsx` |
| FB-114 | Title badges | M | — | `RoomView.jsx` |
| FB-115 | VIP name coverage | S | — | `VipDisplayName.jsx` |
| FB-116 | VIP request UI | M | — | `VipSheet.jsx` |
| FB-117 | Voice room button | S | — | `ClanProfileTab.jsx` |
| FB-118 | Combo button | M | FB-031 | `ComboGiftButton.jsx` |
| FB-119 | Gift chat feedback merged | M | FB-031 | `RoomView.jsx` |

### Wave test checklist

- [ ] Gift send shows Charm + Gold sublines where applicable
- [ ] Silver wallet is separate balance (not gold×1.6)
- [ ] Parental controls PIN + limits functional
- [ ] Gift Pack tile badge + floater countdown visible on lobby

## Wave 4 — Low polish

**Items:** 16  
**Goal:** Visual tokens, animations, cosmetic labels, interaction model tweaks.

| ID | Screen | Complexity | Deps | Files |
|----|--------|------------|------|-------|
| FB-120 | Discover red dot | XS | — | `LobbyScreen.jsx` |
| FB-121 | Combo press model | S | FB-118 | `ComboGiftButton.jsx` |
| FB-122 | Sheet animations | XS | — | `App.css` |
| FB-123 | Audience strip | S | — | `RoomView.jsx` |
| FB-124 | Champagne backdrop art | M | — | `StageBackdrop.jsx` |
| FB-125 | DM call G-Play extra | XS | — | `DmCallProvider.jsx` |
| FB-126 | Diamond badge | S | FB-047 | `RoomExpBar.jsx` |
| FB-127 | Dock icon order | XS | — | `RoomDock.jsx` |
| FB-128 | Empty illustrations | M | — | `Multiple` |
| FB-129 | Empty seat styling | S | — | `App.css` |
| FB-130 | Family vs Clan label | XS | — | `RankingsSheet.jsx` |
| FB-131 | G-play tab label | XS | — | `LobbyScreen.jsx` |
| FB-132 | Locked seat padlock | XS | — | `App.css` |
| FB-133 | Minimize chip art | S | — | `App.jsx` |
| FB-134 | Section accent bars | XS | — | `ClanManageTab.jsx` |
| FB-135 | Teal accent | S | — | `App.css` |

### Wave test checklist

- [ ] Empty seat gold + styling matches reference
- [ ] Combo gift long-press model evaluated vs click-only
- [ ] Theme teal accent tokens applied consistently

