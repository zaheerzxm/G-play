# WePlay → G-Play Parity Audit v2
**Date:** 2026-06-14  
**Method:** Systematic sample of **112/3354** reference frames (every 30 frames, 0.0–28.4 min) + full source audit + cross-check of v1 gap docs  
**Scope:** Audit only — no code changes, no edits to existing GAP entries  
**New findings:** PARITY-001 … PARITY-025  

---

## Audit methodology (v2)

1. **Frames:** 112 timestamps across full 28:30 recording (not ~40 ad-hoc samples).  
2. **Code:** All reachable screens/sheets in `src/components/` + games tree.  
3. **v1 gaps:** Treated as unverified until cross-checked (see `weplay-gap-validation.md`).  
4. **Intentional G-Play design** (excluded from missing): 14-seat room, red-packet-only DM coins, no room chat timestamps, walkie talkie.  

---

## Parity score estimate

| Area | Estimated parity | Notes |
|------|----------------:|-------|
| Voice Room | **72%** | Core flow works (voice, 14-seat, gifts, settings); missing drawing widget, lottery modal, widgets |
| Lobby / Home | **81%** | Nav, room list, hub row, HOT banner; missing lobby game catalog + GOLD RUSH overlay |
| Chat / DM | **88%** | DM, red packet, invites, reply parsing; missing sticker sheet + group chat |
| Gifts | **76%** | GiftSheet + FX pipeline live; footer/visual/animation gaps remain |
| Profile / Spotlight | **63%** | Profile sheets exist; moments/BFF dress/privacy weak |
| Rankings / VIP / Shop | **68%** | All tabs wired; dark UI, bubble shop, purchase modal gaps |
| BFF / Relationships | **58%** | Church/Guard/LoveHome partial; To Unlock + dress missing |
| Clan / Family | **52%** | Hub live; perks stubs, group chat message types, Family Fund missing |
| Settings / Privacy | **41%** | Language/parental/security partial; **Privacy screen missing** |
| Games / Tasks | **48%** | 5 in-room games live; lobby titles + tasks polish gaps |
| **Overall** | **~69%** | Weighted by user-journey importance (room > chat > lobby > rest) |

---

## Feature parity table

| Feature | WePlay (reference) | G-Play (code) | Status |
|---------|-------------------|---------------|--------|
| Voice room stage | Champagne art + widgets + chat | RoomView + StageBackdrop CSS | PARTIAL |
| 14-seat layout | Smaller grid in reference | 2+4+4+4 intentional | DIFFERENT (intentional) |
| Drawing widget | In-room canvas overlay | Not implemented | MISSING |
| Lottery | Full modal + seat-scoped draw | Emoji reaction in chat | MISSING |
| Walkie talkie | N/A in sampled frames | WalkieTalkieOverlay | G-Play extra |
| DM red packet | Red packet transfers | RedPacketSheet in PersonalChat | MATCH |
| DM direct send coins | May exist in WePlay | Removed — red packet only | INTENTIONAL |
| Group/Family chat | 57-member chat + donations | ClanChat text thread | PARTIAL |
| Create Group DM | Group creation | Stub toast | MISSING |
| Privacy settings | Full screen toggles VIP6-8 | No privacy screen | MISSING |
| Rankings | Dark podium + ornate frames | RankingsSheet functional | PARTIAL |
| Shop dual wallet | Silver + Gold balances | Gold + derived silver | PARTIAL |
| BFF To Unlock | Dedicated tab | Not implemented | MISSING |
| Confidant dress | To dress customization | IntimateSpace partial | MISSING |
| Clan perks | Chest/Store/Gacha live | PERK_STUBS toasts | MISSING |
| Chat Bubble shop | Dedicated catalog | No ChatBubbleShop | MISSING |
| Home games grid | 10+ lobby games 3D art | 5 live mini-games emoji | MISSING |
| Pull to refresh | Room list gesture | 15s polling | MISSING |
| Room manage event | Toggle in room settings | Not in RoomSettingsSheet | MISSING |
| DM sticker panel | Full picker grid | Emoji append stub | MISSING |
| YouTube video room | Embedded video stage | VideoRoomPanel implemented | PARTIAL |
| Live mini-games | Many titles | 5 live (trivia/draw/wordle/mafia/ddd) | PARTIAL |
| Guard / propose | Select members + 3000 pts | MyHomeSheet logic partial | PARTIAL |
| Safety Center | Illustrated banners | Text bullet list | PARTIAL |
| Game Rooms nav | Header button | LobbyGamesSection button | MATCH |

---

## Flow audit

| Flow | Status | Notes |
|------|--------|-------|
| Login | PARTIAL | Google OAuth works; no WePlay splash/branded sequence |
| Join room | MATCH | URL deep link + lobby join + password sheet |
| Take seat | MATCH | Seat map + waiting queue + invites |
| Invite friend | PARTIAL | Seat invite + room DM card; visual parity gaps |
| Send DM | MATCH | PersonalChat send/receive + realtime |
| Send gift (room) | PARTIAL | GiftSheet wired; UI/animation gaps |
| Send gift (DM) | PARTIAL | Inline gift panel; not full GiftSheet |
| Open profile | PARTIAL | UserFullProfileSheet; visual gaps |
| Create moment | PARTIAL | CreateMomentSheet; media limited |
| Join clan | MATCH | Create/join + ClanHubSheet |
| Open BFF | PARTIAL | BffSheet grid; no unlock/invite tabs |
| Open intimate space | PARTIAL | IntimateSpaceSheet; no dress tabs |
| Open rankings | PARTIAL | All tabs exist; visual parity low |
| Open shop | PARTIAL | ShopSheet 6 tabs; modal/duration gaps |
| Open VIP | PARTIAL | VipSheet request flow |
| Open game | PARTIAL | 5 live in-room; lobby games mostly missing |

---

## Screen-by-screen audit

## Splash / Launch

**Reference frame(s):** `frame_000005`  
### Status: **PARTIAL**

### Components

| Component | Status | G-Play notes |
|-----------|--------|-------------|
| WePlay star mascot + wordmark | MISSING | LoginScreen Google-only |
| White full-screen splash delay | MISSING | App boot spinner only |

## Home / Games Lobby

**Reference frame(s):** `frame_000267, frame_000068`  
### Status: **PARTIAL**

### Components

| Component | Status | G-Play notes |
|-----------|--------|-------------|
| Bottom nav 5 tabs | MATCH | LobbyScreen nav keys |
| Games 3D gold-framed tiles | MISSING | Emoji gradient tiles |
| Game Rooms header button | MATCH | LobbyGamesSection.jsx |
| Ranking/Tasks/Online Friend row | PARTIAL | GplayHubRow — icon art differs |
| Coin pill + NEW + Events header | PARTIAL | PARITY-006 |
| GOLD RUSH timed invite overlay | MISSING | GAP-042 |
| Gift Pack countdown tile/floater | PARTIAL | GAP-049 + PARITY-017 |

## Rankings

**Reference frame(s):** `frame_000117, frame_000100`  
### Status: **PARTIAL**

### Components

| Component | Status | G-Play notes |
|-----------|--------|-------------|
| 7 category tabs | MATCH | RankingsSheet TABS |
| Time filters Today/Yesterday/Celebrity/Annual | MATCH | RankingsSheet FILTERS |
| Global/region dropdown | MATCH | Region pill + picker |
| Dark purple geometric background | MISSING | Lighter sheet styling GAP-061 |
| Top-3 crown podium | PARTIAL | Podium exists; art differs |
| Ornate avatar frames rank 4+ | MISSING | PARITY-012 |
| Sticky footer To Receive Gifts | MATCH | rankings-footer-cta |
| Help ? rules modal | PARTIAL | GAP-065 |

## Voice Room — Stage

**Reference frame(s):** `frame_000300, frame_002857`  
### Status: **PARTIAL**

### Components

| Component | Status | G-Play notes |
|-----------|--------|-------------|
| Stage header ID/level/diamond | PARTIAL | GAP-002 |
| 14-seat layout | DIFFERENT | Intentional G-Play design |
| Champagne illustration backdrop | PARTIAL | GAP-005 |
| Beats & Dance widget | MISSING | GAP-006 |
| Treasure/coin floater | PARTIAL | GAP-006 |
| System chat bell + regulations link | PARTIAL | GAP-012 |
| Jump-to-bottom pill | MISSING | GAP-013 |
| Pinned owner rules | MISSING | GAP-017 |
| Drawing widget | MISSING | GAP-011 |
| Lottery modal | MISSING | PARITY-003 |
| Bottom dock icon order | PARTIAL | GAP-101 |
| Walkie talkie | G-Play extra | Intentional |
| Room chat timestamps | N/A | Intentionally omitted |

## Voice Room — Settings

**Reference frame(s):** `frame_003157`  
### Status: **PARTIAL**

### Components

| Component | Status | G-Play notes |
|-----------|--------|-------------|
| High quality / ban toggles | MATCH | RoomSettingsSheet |
| Mode/Tag/Background chevron rows | PARTIAL | Form dropdowns PARITY-013 |
| Partner seat row | MATCH | Partner toggle exists |
| Password toggle + value row | PARTIAL | Password field exists; toggle pattern differs |
| Manage event toggle | MISSING | PARITY-007 |
| Membership fees row | MISSING | GAP-015 |
| Admin / Blacklist rows | PARTIAL | Separate sheets |

## DM / Personal Chat

**Reference frame(s):** `frame_000517, frame_000500`  
### Status: **PARTIAL**

### Components

| Component | Status | G-Play notes |
|-----------|--------|-------------|
| Message bubbles + reply quote | PARTIAL | Reply parsing exists; nest styling differs GAP-032 |
| Room/clan invite cards | PARTIAL | Functional; art gap GAP-031 |
| Red packet send/open | MATCH | RedPacketSheet variant dm |
| Red packet only (no coin btn) | INTENTIONAL | By design |
| Sticker panel sheet | MISSING | PARITY-008 |
| Avatar ornate frame incoming | PARTIAL | GAP-109 |
| Floating LV/gift badge | PARTIAL | GAP-037/109 overlap |
| Voice call header icon | G-Play extra | PARITY-021 |

## Shop

**Reference frame(s):** `frame_001057`  
### Status: **PARTIAL**

### Components

| Component | Status | G-Play notes |
|-----------|--------|-------------|
| 6 category tabs | MATCH | ShopSheet tabs |
| Backpack header icon | PARTIAL | Inventory link partial |
| Silver + Gold balances | PARTIAL | PARITY-010 derived silver |
| Purchase duration modal | MISSING | PARITY-005 |
| Relationship token items | PARTIAL | Items exist; modal gap |

## Clan / Family Group Chat

**Reference frame(s):** `frame_001657`  
### Status: **PARTIAL**

### Components

| Component | Status | G-Play notes |
|-----------|--------|-------------|
| Group header name (N) | MATCH | ClanChat header |
| Admin badge on messages | MISSING | PARITY-004 |
| Structured gift cards | MISSING | PARITY-004 |
| Family Fund donation banner | MISSING | PARITY-011 |
| FAMILY BUSINESS scroll badge | MISSING | PARITY-023 |

## Clan / Manage

**Reference frame(s):** `frame_001600`  
### Status: **PARTIAL**

### Components

| Component | Status | G-Play notes |
|-----------|--------|-------------|
| 5 hub tabs | MATCH | ClanHubSheet |
| Family Sign graphical editor | MISSING | GAP-081 text only |
| Required Charm badge row | PARTIAL | GAP-082 numeric input |
| Steal prohibition toggle | MISSING | GAP-083 |
| Section accent bars | MISSING | GAP-105 |

## BFF / Intimate

**Reference frame(s):** `frame_000757, frame_001500`  
### Status: **PARTIAL**

### Components

| Component | Status | G-Play notes |
|-----------|--------|-------------|
| BFF grid | PARTIAL | BffSheet |
| To Unlock tab | MISSING | GAP-071 |
| BFF Invitation tab | MISSING | GAP-072 |
| Confidant To dress tabs | MISSING | PARITY-002 |
| Intimate token wall | PARTIAL | GAP-073 |

## Privacy / Settings

**Reference frame(s):** `frame_002257`  
### Status: **MISSING**

### Components

| Component | Status | G-Play notes |
|-----------|--------|-------------|
| Privacy screen | MISSING | PARITY-001 |
| Message blacklist row | PARTIAL | BlockedUsersSheet separate |
| Game invitation blacklist | MISSING | PARITY-001 |
| VIP6-8 privacy toggles | MISSING | PARITY-001/019 |

## Safety Center

**Reference frame(s):** `frame_002200`  
### Status: **PARTIAL**

### Components

| Component | Status | G-Play notes |
|-----------|--------|-------------|
| Illustrated gradient banners | MISSING | GAP-094 text only |
| Youth Mode entry | PARTIAL | ParentalControlSheet partial |

## Chat Bubble Shop

**Reference frame(s):** `frame_001800`  
### Status: **MISSING**

### Components

| Component | Status | G-Play notes |
|-----------|--------|-------------|
| 3-column bubble grid | MISSING | GAP-068 |
| From Family / From VIP tags | MISSING | GAP-068 |
| Backpack inventory icon | PARTIAL | GAP-107 |

## Drawing Widget

**Reference frame(s):** `frame_002800`  
### Status: **MISSING**

### Components

| Component | Status | G-Play notes |
|-----------|--------|-------------|
| Canvas overlay + tools | MISSING | GAP-011 |
| System open/close lines | MISSING | GAP-106 |

## Love Home

**Reference frame(s):** `frame_003400`  
### Status: **PARTIAL**

### Components

| Component | Status | G-Play notes |
|-----------|--------|-------------|
| Ring item modal | PARTIAL | GAP-075 |
| Love / Blessing counters | PARTIAL | GAP-110 |
| Send Gift bottom bar | PARTIAL | LoveHomeSheet |

---

## Interaction audit summary

| Interaction | Status | Notes |
|-------------|--------|-------|
| Pull to refresh (room list) | MISSING | 15s interval refresh only |
| Long press (general UI) | MISSING | No generic long-press menus |
| Long press / hold walkie | MATCH | WalkieTalkieOverlay pointer handlers |
| Gift combo | PARTIAL | Click combo — PARITY-025 |
| Swipe profile cover | MATCH | ProfileCoverCarousel |
| Back minimize room | PARTIAL | Works; chip art differs GAP-008 |
| Bottom sheet dismiss | MATCH | Backdrop tap + back chevron |
| Empty states | PARTIAL | Text-only GAP-100 |
| Loading states | PARTIAL | Spinner text common |
| Error states | PARTIAL | Toast + inline error |
| Modal lottery dismiss X | MISSING | No lottery modal |
| Seat long-press actions | PARTIAL | SeatActionSheet |

---

## Visual audit summary

| Dimension | Overall | Worst screens |
|-----------|---------|---------------|
| Typography | PARTIAL | Rankings gold names, gift cards |
| Colors / teal accent | PARTIAL | GAP-098; rankings purple missing |
| Spacing / padding | PARTIAL | DM bubbles, clan chat |
| Border radius | MATCH | Sheets use rounded corners consistently |
| Shadows | PARTIAL | Gift cards, clan banners flat vs WePlay |
| Iconography | PARTIAL | Dock, hub row, settings |
| Illustrations | MISSING | Splash, Safety, stage art, game tiles |
| Animations | PARTIAL | Gift FX exist; combo/lottery/draw widget weak |
| Gradients | PARTIAL | Rankings, Safety, shop modals |

---

## New gaps (PARITY-001+)

> Only issues **not adequately covered** by existing GAP-002–GAP-111 entries.

### PARITY-001

**Category:** Settings / Privacy  
**Screen:** Privacy settings  
**Reference frame(s):** frame_002257.jpg (~18:57)  
**Severity:** Critical  
**Type:** Feature  
**Description:** Dedicated Privacy settings screen with grouped toggles and VIP-gated options is entirely absent from G-Play.  
**Expected WePlay behavior:** Privacy screen: Stats, Voice rooms joined, Hide Location, Do Not Recommend, post sharing, Incognito Visit [V6], Hide recent gifts [V7], Hide Guardian board [V8], Message Blacklist, Game Invitation Blacklist.  
**Current G-Play behavior:** No Privacy screen in ProfilePanel or settings; BlockedUsersSheet and SecurityCenterSheet exist separately; grep 'Incognito|privacy' in src/ returns zero UI.  
**Evidence:** frame_002257 full screen; no ProfilePanel privacy entry; no privacy.jsx component.  

---

### PARITY-002

**Category:** BFF / Intimate  
**Screen:** Confidant To dress  
**Reference frame(s):** frame_000757.jpg (~06:18)  
**Severity:** High  
**Type:** Feature  
**Description:** BFF/Confidant visual customization ('To dress') with Token / Microphone connection / Background / Relationship tabs missing.  
**Expected WePlay behavior:** 'Confidant To dress' page: preview stage, item carousel with LV badges, 'Not acquired' CTA, microphone-connection puzzle-piece connector between avatars.  
**Current G-Play behavior:** IntimateSpaceSheet.jsx has story/timeline/token wall tabs but no 'To dress' sub-nav or microphone-connection cosmetic picker.  
**Evidence:** frame_000757; IntimateSpaceSheet spaceTab = story only + token slots, no dress tabs.  

---

### PARITY-003

**Category:** Voice Room / Tools  
**Screen:** Lottery result modal  
**Reference frame(s):** frame_002857.jpg (~23:49)  
**Severity:** High  
**Type:** UI  
**Description:** In-room Lottery opens a full modal with participant/winner counts, winner card, and 'Send Gift' CTA — not just a chat emoji line.  
**Expected WePlay behavior:** White 'Lottery' modal: Participant 1 / Winner 1, purple winner card, pink Send Gift button, system lines for initiation and result.  
**Current G-Play behavior:** FunctionsGrid/EmotePanel lottery → sendReaction emoji '🎰 lottery: …' in chat (reactions.js); no LotteryModal component.  
**Evidence:** frame_002857 modal vs reactions.js case 'lottery'; GAP-016 covers tools generally but not modal UI.  

---

### PARITY-004

**Category:** Clan / Group Chat  
**Screen:** Family group chat messages  
**Reference frame(s):** frame_001657.jpg (~13:49)  
**Severity:** Critical  
**Type:** Feature  
**Description:** WePlay Family/Clan group chat (57 members) with structured gift cards, Family Fund donation banners, and Admin badges — beyond G-Play ClanChat text thread.  
**Expected WePlay behavior:** Group 'Yappers (57)': gift cards with flavor quote + Receiver's Charm/Gold lines, yellow 'Donate to the family!' banner, Admin green badge on names, centered timestamps.  
**Current G-Play behavior:** ClanChat.jsx exists as group thread; no Family Fund donation message type, no structured gift-card layout, no admin badge on chat rows.  
**Evidence:** frame_001657; ClanChat.jsx message render vs reference gift card structure.  

---

### PARITY-005

**Category:** Shop  
**Screen:** Purchase duration modal  
**Reference frame(s):** frame_001057.jpg (~08:47)  
**Severity:** Medium  
**Type:** UI  
**Description:** Shop item purchase uses centered modal with duration selector (Forever), stat effect copy (+Charm/Guardian/Intimacy), and teal Buy button.  
**Expected WePlay behavior:** Magic Luxury Car modal: Token badge, 150000 gold, 'Select Purchase Duration' Forever checkbox, effect stats paragraph, full-width Buy.  
**Current G-Play behavior:** ShopSheet.jsx purchases on tile tap with toast/inventory; no duration picker modal or stat-effect description block.  
**Evidence:** ShopSheet.jsx buy flow vs frame_001057 modal.  

---

### PARITY-006

**Category:** Home / Lobby  
**Screen:** Header coin + NEW + Events  
**Reference frame(s):** frame_000267.jpg (~02:14)  
**Severity:** Medium  
**Type:** UI  
**Description:** Games home header shows avatar, gold coin pill with balance + orange '+' top-up, NEW ornament notification, and Events star — not just hub row links.  
**Expected WePlay behavior:** Top row: profile avatar, '207' coin pill with +, NEW badge ornament, Events teal star.  
**Current G-Play behavior:** GplayHomeHeader.jsx + CoinsTopBar patterns differ; coin balance may be in profile/hub but header ornament layout not matching reference.  
**Evidence:** frame_000267 header vs GplayHomeHeader.jsx audit.  

---

### PARITY-007

**Category:** Voice Room / Settings  
**Screen:** Manage event toggle  
**Reference frame(s):** frame_003157.jpg (~26:19)  
**Severity:** High  
**Type:** Feature  
**Description:** Room settings includes 'Manage event' toggle linking room admins to Event Center event creation — missing from G-Play RoomSettingsSheet.  
**Expected WePlay behavior:** Settings toggle 'Manage event' OFF with description about Event Center; also Mode/Tag/Background as navigable rows, password toggle + value row pattern.  
**Current G-Play behavior:** RoomSettingsSheet.jsx has toggles for quality/ban/partner/password/tag/background but no manage_event field; EventCenterSheet exists separately in lobby.  
**Evidence:** frame_003157 Manage event row; RoomSettingsSheet grep no manage_event.  

---

### PARITY-008

**Category:** Chat / DM  
**Screen:** Sticker panel sheet  
**Reference frame(s):** frame_000517.jpg (~04:19)  
**Severity:** High  
**Type:** Feature  
**Description:** DM emoji button opens full sticker sheet with category tabs (smiley, heart, characters) and scrollable grid — not inline emoji append.  
**Expected WePlay behavior:** Bottom sticker picker: tab row + 4-column scroll grid of custom stickers/photos.  
**Current G-Play behavior:** PersonalChat.jsx compose-sticker button appends '🙂' to input; StickerPanel.jsx exists for room but is not imported in PersonalChat.  
**Evidence:** frame_000517 picker vs PersonalChat line 683 onClick setInput emoji.  

---

### PARITY-009

**Category:** Church / Propose  
**Screen:** Select members  
**Reference frame(s):** frame_001357.jpg (~11:12)  
**Severity:** Medium  
**Type:** UI  
**Description:** Propose CP flow uses dedicated 'Select members' checklist screen with Guard Pts requirement copy and Next (N) header.  
**Expected WePlay behavior:** Cancel | Select members | Next (1); rows with blue check circles; 'Guard Pts … reaches 3000' hint.  
**Current G-Play behavior:** MyHomeSheet.jsx enforces GUARD_PROPOSE_CP (3000) in logic/toast but propose picker UI differs from WePlay checklist screen.  
**Evidence:** frame_001357 vs MyHomeSheet propose UX.  

---

### PARITY-010

**Category:** Shop / Wallet  
**Screen:** Silver coin wallet  
**Reference frame(s):** frame_001057.jpg  
**Severity:** Medium  
**Type:** Data Wiring  
**Description:** WePlay shop shows separate Silver (340) and Gold (207) balances; G-Play derives silver display from gold.  
**Expected WePlay behavior:** Balance row: silver hex ◎ 340 + gold coin 207 +.  
**Current G-Play behavior:** ShopSheet.jsx: silverBalance = Math.floor(coins * 1.6) — cosmetic derived value, not separate wallet.  
**Evidence:** ShopSheet.jsx line 46 silverBalance formula.  

---

### PARITY-011

**Category:** Clan  
**Screen:** Family Fund donations  
**Reference frame(s):** frame_001657.jpg  
**Severity:** High  
**Type:** Feature  
**Description:** Family Fund donation messages and clan treasury increments in group chat are not implemented.  
**Expected WePlay behavior:** Yellow 'Donate to the family!' banner; system line 'donated 11 Family Fund. Family Fund +11'.  
**Current G-Play behavior:** clan member weekly_donation fields exist in ClanMembersTab; no in-chat donation banner/message type or Family Fund pool.  
**Evidence:** frame_001657 donation banner; grep family fund in src — no chat message handler.  

---

### PARITY-012

**Category:** Rankings  
**Screen:** Decorative avatar frames in list  
**Reference frame(s):** frame_000117.jpg (~00:58)  
**Severity:** Medium  
**Type:** UI  
**Description:** Rankings rows 4+ show ornate animated avatar frames (fire, crown, magic) per user — G-Play list uses plain circles.  
**Expected WePlay behavior:** Rank 4–12 list: highly decorated avatar rings, custom colored/stylized usernames, multiple badge icons per row.  
**Current G-Play behavior:** RankingsSheet rankings-row: plain rankings-avatar circle, single display_name string.  
**Evidence:** frame_000117 list rows vs RankingsSheet.jsx list markup.  

---

### PARITY-013

**Category:** Voice Room / Settings  
**Screen:** Settings row navigation pattern  
**Reference frame(s):** frame_003157.jpg  
**Severity:** Medium  
**Type:** UI  
**Description:** WePlay room settings uses iOS grouped list: Mode/Tag/Background/Partner Seat as chevron rows with value on right; G-Play uses inline dropdowns.  
**Expected WePlay behavior:** White grouped table; 'Normal', 'Friends', 'Golden Party', 'Enable All' as trailing gray values with > chevrons.  
**Current G-Play behavior:** RoomSettingsSheet uses select dropdowns and upload widgets in form layout — functionally similar, visually different pattern.  
**Evidence:** frame_003157 vs RoomSettingsSheet.jsx form controls.  

---

### PARITY-014

**Category:** Voice Room / Chat  
**Screen:** Receiver's Gold feedback  
**Reference frame(s):** frame_001657.jpg, frame_002800.jpg  
**Severity:** Low  
**Type:** UX  
**Description:** Gift messages can show 'Receiver's Gold +N' in addition to Charm — G-Play may only show Charm delta (GAP-030).  
**Expected WePlay behavior:** Gift card footer: 'Receiver's Gold +48, Charm +30' in red/orange subtext.  
**Current G-Play behavior:** Room chat gift lines emphasize charm; gold credit subline not consistently rendered.  
**Evidence:** frame_001657 gift card footer text pattern.  

---

### PARITY-015

**Category:** Auction / PK  
**Screen:** Auction mode UI  
**Reference frame(s):** mid-recording auction frames  
**Severity:** High  
**Type:** UI  
**Description:** WePlay auction voice-room mode has dedicated stage UI; G-Play AuctionPanel exists but not frame-verified for parity.  
**Expected WePlay behavior:** Auction stage with bid timer, current bid, hammer animations (reference mid-recording).  
**Current G-Play behavior:** AuctionPanel.jsx wired in RoomView; no v1 gap entry or frame evidence audit.  
**Evidence:** AuctionPanel.jsx present; absent from weplay-gap-analysis.md screen inventory.  

---

### PARITY-016

**Category:** PK  
**Screen:** PK battle bar  
**Reference frame(s):** PK frames mid-recording  
**Severity:** High  
**Type:** UI  
**Description:** Room PK mode bar (team scores, timer, supporters) not audited in v1 gaps despite PkBarSheet.jsx existing.  
**Expected WePlay behavior:** PK overlay above stage with red/blue bars and countdown.  
**Current G-Play behavior:** PkBarSheet.jsx imported in RoomView; visual/interaction parity unverified.  
**Evidence:** PkBarSheet.jsx; not in gap doc.  

---

### PARITY-017

**Category:** Lobby  
**Screen:** GiftPackFloater  
**Reference frame(s):** frame_000068.jpg  
**Severity:** Medium  
**Type:** UI  
**Description:** Lobby Gift Pack floating countdown widget on non-home tabs needs frame-verified styling parity.  
**Expected WePlay behavior:** Gift Pack badge with HH:MM:SS on game tile and/or floater.  
**Current G-Play behavior:** GiftPackFloater.jsx + GiftPackSheet.jsx exist; GAP-049 covers tile badge but floater cross-tab behavior under-documented.  
**Evidence:** GiftPackFloater in LobbyScreen; partial overlap GAP-049 — new: floater placement/animation.  

---

### PARITY-018

**Category:** Event Center  
**Screen:** Event creation flow  
**Reference frame(s):** Event frames ~mid recording  
**Severity:** Medium  
**Type:** Feature  
**Description:** Event Center create/manage room events flow linked from room settings is stub-level.  
**Expected WePlay behavior:** Event Center with create event, 7-day membership perks, room event management.  
**Current G-Play behavior:** EventCenterSheet.jsx with static cards + onAction callbacks; manage_event room setting missing (PARITY-007).  
**Evidence:** EventCenterSheet.jsx; PARITY-007 dependency.  

---

### PARITY-019

**Category:** Profile  
**Screen:** Guard privacy hide VIP8  
**Reference frame(s):** frame_002257.jpg  
**Severity:** Medium  
**Type:** Feature  
**Description:** VIP8 'Hide Guardian board' privacy toggle — GuardSheet exists but hide-from-others privacy not wired.  
**Expected WePlay behavior:** Toggle 'Hide Guardian board [V8]' prevents others viewing guardian rankings.  
**Current G-Play behavior:** GuardSheet.jsx shows board; no user privacy flag to hide board from visitors.  
**Evidence:** frame_002257 V8 toggle; GuardSheet has no hide setting.  

---

### PARITY-020

**Category:** Games / Room  
**Screen:** Business Life function  
**Reference frame(s):** functions grid frames  
**Severity:** Medium  
**Type:** Feature  
**Description:** WePlay 'Business Life' room function is a distinct mini-experience; G-Play shows toast stub only.  
**Expected WePlay behavior:** Business Life entry in functions grid opens dedicated UI.  
**Current G-Play behavior:** RoomView.jsx Business Life handler → toast only (subagent confirmed).  
**Evidence:** RoomView Business Life toast grep.  

---

### PARITY-021

**Category:** Chat / DM  
**Screen:** DM voice call header  
**Reference frame(s):** user G-Play screenshot + WePlay DM  
**Severity:** Medium  
**Type:** Feature  
**Description:** G-Play DM includes phone/call icon (DmCallProvider); WePlay reference DM uses ... menu — call feature is G-Play-specific extension needing parity doc note, not WePlay match.  
**Expected WePlay behavior:** DM header: back, name, ... menu (frame_000517).  
**Current G-Play behavior:** PersonalChat header includes call icon via DmCallProvider — extra feature vs WePlay reference.  
**Evidence:** DmCallProvider.jsx; frame_000517 no phone icon — document as G-Play-only feature.  

---

### PARITY-022

**Category:** Discover  
**Screen:** Nearby pseudo-distance  
**Reference frame(s):** nearby frames  
**Severity:** Medium  
**Type:** Data Wiring  
**Description:** Nearby sheet uses deterministic pseudo-distance from user IDs rather than real location — functional gap vs WePlay geo discovery.  
**Expected WePlay behavior:** People Nearby with location hiding privacy toggle (frame_002257).  
**Current G-Play behavior:** NearbySheet.jsx pseudo-distance; Privacy hide location missing (PARITY-001).  
**Evidence:** NearbySheet + missing privacy toggles.  

---

### PARITY-023

**Category:** Room / Chat  
**Screen:** FAMILY BUSINESS gift badge  
**Reference frame(s):** frame_001657.jpg  
**Severity:** Low  
**Type:** UI  
**Description:** Group chat gift messages show 'FAMILY BUSINESS' scroll badge decoration beside cards.  
**Expected WePlay behavior:** Scroll icon label 'FAMILY BUSINESS' to right of gift cards, occasional x2 multiplier.  
**Current G-Play behavior:** No family business decoration on clan chat gift rendering.  
**Evidence:** frame_001657 right-side scroll badge.  

---

### PARITY-024

**Category:** Login / Onboarding  
**Screen:** Profile setup vs WePlay first-run  
**Reference frame(s):** frame_000005 → login flow  
**Severity:** Medium  
**Type:** UX  
**Description:** Post-login onboarding is ProfileSetupScreen error/retry state — no WePlay-style profile avatar/country first-run wizard parity verified.  
**Expected WePlay behavior:** Login → region/profile setup flow (frame_000150 region).  
**Current G-Play behavior:** ProfileSetupScreen.jsx minimal bootstrap; EditProfileSheet has fields but first-run UX differs.  
**Evidence:** ProfileSetupScreen vs frame_000150 region selector.  

---

### PARITY-025

**Category:** Interactions  
**Screen:** Gift combo interaction model  
**Reference frame(s):** room gift usage  
**Severity:** Low  
**Type:** UX  
**Description:** WePlay gift combo may use press/hold pattern; G-Play ComboGiftButton is click-based 3.5s window — interaction model mismatch.  
**Expected WePlay behavior:** Combo send interaction (inferred from WePlay UX patterns).  
**Current G-Play behavior:** ComboGiftButton.jsx click to increment; not long-press.  
**Evidence:** ComboGiftButton.jsx; GAP-027 notes combo exists but not press model.  

---

## v1 coverage gaps (screens in code never in GAP doc)

These surfaces exist in G-Play but were **absent from v1 gap analysis** — now partially covered by PARITY entries:

`EventCenterSheet`, `GiftPackFloater`, `GuardSheet`, `MyHomeSheet`, `AuctionPanel`, `PkBarSheet`, `WalkieTalkieOverlay`, `DmCallOverlay`, `PromoModal`, `NearbySheet`, `HelpCenterSheet`, `AdminPanelSheet`, `FriendsHub`, `OnlineFriendsSheet`, `ProfileSetupScreen`
