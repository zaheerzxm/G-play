# WePlay vs G-Play — Implementation Sprints

Each sprint = 10 gaps from [`weplay-gap-analysis.md`](./weplay-gap-analysis.md).  
Order follows priority: voice room → chat → gifts → profile → friends → VIP → tasks → games → polish.

---

## Sprint 1: Core Room Parity

**Goal:** Match WePlay voice room header, stage background, and floating widgets (14-seat layout is intentional — out of scope).

**Gap IDs:** GAP-002, GAP-003, GAP-004, GAP-005, GAP-006, GAP-008, GAP-009, GAP-010, GAP-101

**Likely files:**
- `src/components/RoomView.jsx`
- `src/components/StageBackdrop.jsx`
- `src/App.css` (`.voice-stage`, `.seat-*`, `.stage-header`)
- `src/roomSeats.js`

**Risk:** High — touches core room layout used by all modes

**Testing checklist:**
- [ ] Join global room: 14-seat layout unchanged (intentional)
- [ ] Room level badge + numeric ID in header
- [ ] Empty seats show gold `+` styling
- [ ] Stage background champagne skin renders behind seats
- [ ] Floating Beats & Dance + treasure widgets positioned correctly
- [ ] Minimize/back preserves room state

---

## Sprint 2: Room Interactions

**Goal:** Room chat UX, system messages, settings sheet parity, in-room tools.

**Gap IDs:** GAP-011, GAP-012, GAP-013, GAP-014, GAP-015, GAP-016, GAP-017, GAP-018, GAP-019, GAP-020

**Likely files:**
- `src/components/RoomView.jsx`
- `src/components/RoomSettingsSheet.jsx`
- `src/components/FunctionsGrid.jsx`
- `src/components/EmotePanel.jsx`
- `src/roomLog.js`

**Risk:** High

**Testing checklist:**
- [ ] Drawing widget opens from functions (if implemented GAP-011)
- [ ] Yellow System: prefix messages with regulations link
- [ ] “New message at bottom” jump pill when scrolled up
- [ ] High quality mode toggle persists + posts system line
- [ ] Membership fees / associated groups / records rows (if added)
- [ ] Lottery, dice, coin toss emote tools in bottom drawer
- [ ] Scoreboard modal seat grid + split Add/Subtract buttons
- [ ] YouTube/video panel in video mode matches frame_002500

---

## Sprint 3: Gifts & Animations

**Goal:** Gift sheet, animations, combo, premium FX parity with WePlay.

**Gap IDs:** GAP-021, GAP-022, GAP-023, GAP-024, GAP-025, GAP-026, GAP-027, GAP-028, GAP-029, GAP-030

**Likely files:**
- `src/components/GiftSheet.jsx`
- `src/components/GiftAnimation.jsx`
- `src/components/PremiumGiftFx.jsx`
- `src/components/ComboGiftButton.jsx`
- `src/gifts.js`, `src/giftFx.js`, `src/App.css`

**Risk:** Medium

**Testing checklist:**
- [ ] Gift panel dark theme + pink Send button
- [ ] Insufficient coins gray-out gift tiles
- [ ] Anonymous mask toggle in footer
- [ ] Qty dropdown 1/5/33/50/100
- [ ] Special tab helper text + Business Life tags
- [ ] Promotional banner above sheet in DM context
- [ ] SVGA / Lottie full-screen gift plays once
- [ ] Gift wall sheet badge parity

---

## Sprint 4: Chat & DM Parity

**Goal:** Chat list, DM bubbles, settings, invites, official badges.

**Gap IDs:** GAP-031, GAP-032, GAP-033, GAP-034, GAP-035, GAP-036, GAP-037, GAP-038, GAP-039, GAP-040

**Likely files:**
- `src/components/PersonalChat.jsx`
- `src/components/LobbyScreen.jsx` (chats tab)
- `src/components/ChatSettingsSheet.jsx`
- `src/privateChat.js`
- `src/chatPreview.js`

**Risk:** Medium

**Testing checklist:**
- [ ] Voice room invite card in DM
- [ ] Reply-quote bubble nesting
- [ ] Large sticker without bubble background
- [ ] Chat settings: alias, background, block gaming invites
- [ ] Official badge on system accounts
- [ ] Header add-friend + compose icons
- [ ] Floating LV/charm badge in DM (frame_000500)
- [ ] Muted bell icon on chat rows

---

## Sprint 5: Lobby & Discovery

**Goal:** Voice room list, home games hub, banners, pull-to-refresh.

**Gap IDs:** GAP-041, GAP-042, GAP-043, GAP-044, GAP-045, GAP-046, GAP-047, GAP-048, GAP-049, GAP-050

**Likely files:**
- `src/components/LobbyScreen.jsx`
- `src/components/LobbyGamesSection.jsx`
- `src/components/GplayHomeHeader.jsx`
- `src/components/ExploreTab.jsx`
- `src/lobbyGames.js`

**Risk:** Medium

**Testing checklist:**
- [ ] Pull-to-refresh spinner on All tab (frame_000350)
- [ ] Gold Tycoon carousel banner
- [ ] Room card hex badges + Partying / Entrepreneur pills
- [ ] Sub-filters Friends/PK/Music/Video/Game on All
- [ ] GOLD RUSH invite banner on home games (frame_000068)
- [ ] Ranking / Tasks / Online Friend quick links row
- [ ] Game tile 3D art vs emoji tiles documented gap
- [ ] Gift Pack floater countdown on lobby tabs

---

## Sprint 6: Profile & Spotlight

**Goal:** Me tab, profile sheets, moments, visitors, edit profile.

**Gap IDs:** GAP-051, GAP-052, GAP-053, GAP-054, GAP-055, GAP-056, GAP-057, GAP-058, GAP-059, GAP-060

**Likely files:**
- `src/components/ProfilePanel.jsx`
- `src/components/UserFullProfileSheet.jsx`
- `src/components/MomentsFeed.jsx`
- `src/components/CreateMomentSheet.jsx`
- `src/components/VisitorsSheet.jsx`

**Risk:** Medium

**Testing checklist:**
- [ ] Discover → Moments row with avatar dot (frame_001200)
- [ ] Profile cover carousel + 3D avatar hint
- [ ] Gift wall on profile
- [ ] PLAY Show entry from profile
- [ ] Stats / charm / level badges layout
- [ ] Edit profile: country, bio, avatar crop

---

## Sprint 7: Rankings & VIP

**Goal:** Rankings UI, VIP sheet, avatar shop, chat bubbles shop.

**Gap IDs:** GAP-061, GAP-062, GAP-063, GAP-064, GAP-065, GAP-066, GAP-067, GAP-068, GAP-069, GAP-070

**Likely files:**
- `src/components/RankingsSheet.jsx`
- `src/components/VipSheet.jsx`
- `src/components/PlayShowSheet.jsx`
- `src/components/ShopSheet.jsx`
- `src/rankings.js`

**Risk:** Medium

**Testing checklist:**
- [ ] Dark purple rankings background + geometric pattern (frame_000100)
- [ ] Crown icons ranks 1–3; gold names
- [ ] PLAY Show tab Male/Female toggle + Collection metric (frame_000200)
- [ ] Global region dropdown on rankings
- [ ] VIP membership request flow
- [ ] Avatar shop Boy/Girl + rarity A/B/C (frame_002000)
- [ ] Chat Bubble catalog screen (frame_001800) — new screen if missing

---

## Sprint 8: BFF & Relationships

**Goal:** BFF flow, intimate space, church/love home, bonds.

**Gap IDs:** GAP-071, GAP-072, GAP-073, GAP-074, GAP-075, GAP-076, GAP-078, GAP-079, GAP-080, GAP-110

**Likely files:**
- `src/components/BffSheet.jsx`
- `src/components/IntimateSpaceSheet.jsx`
- `src/components/LoveHomeSheet.jsx`
- `src/components/ChurchSheet.jsx`
- `src/components/SeatBondLayer.jsx`

**Risk:** High — complex social state

**Testing checklist:**
- [ ] BFF relationship picker + token shop link (frame_001000)
- [ ] New BFF → To Unlock list (frame_001500)
- [ ] Intimate Space token wall + exclusive wall locks (frame_000700)
- [ ] BFF Chest button opens rewards
- [ ] Love Home rings + item description modal (frame_003400)
- [ ] Church Propose screen (frame_001400)
- [ ] Partner seat heartbeat when CP bonded (optional polish only — layout unchanged)

---

## Sprint 9: Clan / Family

**Goal:** Clan hub tabs, manage settings, perks, tasks.

**Gap IDs:** GAP-081, GAP-082, GAP-083, GAP-084, GAP-085, GAP-086, GAP-087, GAP-088, GAP-089, GAP-090

**Likely files:**
- `src/components/clan/*`
- `src/clans.js`
- `src/components/ClanChat.jsx`

**Risk:** Medium

**Testing checklist:**
- [ ] Family Sign badge editor (frame_001600)
- [ ] Required Charm gate for applications
- [ ] Access to steal prohibition toggle
- [ ] Clan chest / store / gacha (currently stubs)
- [ ] Clan voice room button (stub)
- [ ] Manage tab notification dot on Profile

---

## Sprint 10: Games & Polish

**Goal:** Mini-game catalog, splash/login, settings, animations, i18n polish.

**Gap IDs:** GAP-091, GAP-092, GAP-093, GAP-094, GAP-095, GAP-096, GAP-097, GAP-098, GAP-099, GAP-100

**Likely files:**
- `src/games/catalog.js`
- `src/components/LoginScreen.jsx`
- `src/components/LanguageSheet.jsx`
- `src/components/SecurityCenterSheet.jsx`
- `src/App.css`

**Risk:** High for new games; Low for polish

**Testing checklist:**
- [ ] Splash / branded login vs Google-only (frame_000005)
- [ ] Region selector with search (frame_000150)
- [ ] Safety Center illustrated banners (frame_002200)
- [ ] Message blacklist screen (frame_002300)
- [ ] UNO/Ludo live or hidden from grid
- [ ] Bottom nav label “WePlay” vs “G-play” decision
- [ ] Teal accent `#00CED1` token consistency
- [ ] Page transition / sheet animation timing

---

## Second-pass extensions (optional add-ons)

These gaps were added after the initial 10×10 sprint plan. Implement after the core sprint item or in the same sprint if low effort:

| Extension | Gap IDs | Attach to sprint |
|-----------|---------|------------------|
| Room dock + drawing system lines | GAP-101, GAP-106 | Sprint 1–2 |
| Lobby Game Rooms + nav dots | GAP-103, GAP-108 | Sprint 5–6 |
| DM polish (frames, sticker icon) | GAP-109, GAP-111 | Sprint 4 |
| Gift chat sprites | GAP-102 | Sprint 3 |
| Rankings copy + chat bubble backpack | GAP-104, GAP-107 | Sprint 7 |
| Clan manage accents | GAP-105 | Sprint 9 |
| Love Home stats | GAP-110 | Sprint 8 |

---

## Cross-sprint dependencies

| Dependency | Blocks |
|------------|--------|
| GAP-011 drawing widget | GAP-106 drawing system lines |
| GAP-021 gift footer | GAP-028 DM gift banner |
| GAP-041 game catalog | GAP-091 individual game implementations |
| GAP-071 BFF tokens | GAP-073 intimate space wall unlocks |
| GAP-081 clan sign | GAP-087 clan profile display in room chat badges |
