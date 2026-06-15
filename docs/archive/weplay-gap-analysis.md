# WePlay vs G-Play — Gap Analysis Master Backlog
**Generated:** 2026-06-14  
**Reference:** `.reference/screen-recording-frames/` (3,354 JPG, 28:30 recording)  
**G-Play evidence:** source audit + localhost:5173 (HTTP 302)  
**Total gaps:** 108 active entries (GAP-002–GAP-111 minus excluded GAP-001, GAP-007, GAP-077)  

---

## Frame category index


| Module | Representative frames | Approx. timeline |
|--------|----------------------|------------------|
| Splash / login | frame_000005 | 00:02 |
| Home / games lobby | frame_000068 | 00:34 |
| Rankings | frame_000100, frame_000200 | 00:50–01:40 |
| Voice room | frame_000300 | 02:30 |
| Voice room list | frame_000350 | 02:55 |
| DM / chat | frame_000500 | 04:10 |
| Intimate / BFF | frame_000700, frame_001000, frame_001500 | 05:50–12:30 |
| Profile / moments | frame_001200 | 10:00 |
| Church / propose | frame_001400 | 11:40 |
| Clan / Family manage | frame_001600 | 13:20 |
| Chat Bubble shop | frame_001800 | 15:00 |
| Avatar shop | frame_002000 | 16:40 |
| Video room | frame_002500 | 20:50 |
| Safety Center | frame_002200 | 18:20 |
| Message blacklist | frame_002300 | 19:10 |
| Drawing widget | frame_002800 | 23:20 |
| Love Home | frame_003400 | 28:20 |

---

## Intentional G-Play design (excluded from backlog)

These differences from WePlay reference are **by design** — do not implement as gaps:

| Topic | G-Play behavior | Former gap IDs |
|-------|-----------------|----------------|
| Normal room seat layout | **14 seats** (2 + 4 + 4 + 4) in normal mode — not WePlay's smaller 2×4+host grid | GAP-001, GAP-007, GAP-077 |
| Send coins in DM | Removed — **red packet (🧧) only** for DM coin transfers; `SendCoinsSheet` no longer in chat compose bar | *(never logged)* |
| Voice room chat timestamps | Room chat omits per-message timestamps intentionally | *(never logged)* |
| Walkie talkie | `WalkieTalkieOverlay` in room — intentional G-Play feature | *(never logged)* |


## Master backlog

### GAP-002

**ID:** GAP-002  
**Category:** Voice Room  
**Screen:** Stage header metadata  
**Reference frame(s):** `frame_000300.jpg`  
**Current G-Play screen/file:** `RoomView.jsx / StageBackdrop`  
**Severity:** High  
**Type:** UI  
**Description:** Room header must show diamond level badge, truncated room name, numeric Room ID, and online count cluster matching WePlay.  
**Expected WePlay behavior:** Left cluster: blue diamond LV badge, room title ellipsis, 'ID: #######' line; right: avatar stack + '3' count + overflow menu + music widget.  
**Current G-Play behavior:** G-Play stage-header shows level/exp bar and title but ID formatting, Group button, and music disc widget placement differ; no diamond icon parity.  
**Evidence:** Reference header shows 'SWEET P...' + 'ID: 1220836' + music note chip; grep stage-header in RoomView.jsx vs reference.  
**Likely files to inspect:** src/components/RoomView.jsx, src/components/StageBackdrop.jsx, src/App.css (.stage-header, .stage-level)  
**Implementation notes:** Add roomId line under title; match diamond badge art; optional music chip when room BGM active.  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 1  

---

### GAP-003

**ID:** GAP-003  
**Category:** Voice Room / Seats  
**Screen:** Empty seat affordance  
**Reference frame(s):** `frame_000300.jpg`  
**Current G-Play screen/file:** `RoomView.jsx seat render`  
**Severity:** Medium  
**Type:** UI  
**Description:** Empty seats need gold circular + icon and inter-seat heartbeat pulse lines like WePlay.  
**Expected WePlay behavior:** Empty seat: gold ring, centered +; horizontal white pulse arcs link adjacent empty seats.  
**Current G-Play behavior:** Empty seats use .seat-avatar--empty with generic plus; no heartbeat pulse lines between empty slots.  
**Evidence:** Reference shows white curved connectors between lower seats; App.css .seat--empty lacks pulse-line pseudo-elements.  
**Likely files to inspect:** src/App.css (.seat-avatar--empty, .seat-plus), src/components/RoomView.jsx  
**Implementation notes:** CSS-only pulse arcs between .seat--slot siblings; reuse partner heartbeat SVG at lower opacity.  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 1  

---

### GAP-004

**ID:** GAP-004  
**Category:** Voice Room / Seats  
**Screen:** Locked seat state  
**Reference frame(s):** `frame_000300.jpg`  
**Current G-Play screen/file:** `RoomView.jsx`  
**Severity:** Medium  
**Type:** UX  
**Description:** Locked seats must show padlock overlay on seat circle (not hidden slot).  
**Expected WePlay behavior:** Locked seats visible with lock icon centered; tap shows reason/toast.  
**Current G-Play behavior:** Seat lock state exists for admin but lock icon styling/size differs from WePlay padlock on purple circle.  
**Evidence:** Reference lower seats show lock icons; verify .seat--locked styles in App.css vs frame.  
**Likely files to inspect:** src/components/RoomView.jsx, src/App.css  
**Implementation notes:** Match lock glyph size and purple fill behind icon.  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 1  

---

### GAP-005

**ID:** GAP-005  
**Category:** Voice Room  
**Screen:** Stage background skin  
**Reference frame(s):** `frame_000300.jpg`  
**Current G-Play screen/file:** `StageBackdrop.jsx + App.css`  
**Severity:** Medium  
**Type:** UI  
**Description:** Champagne pyramid + bottle pour artwork behind seats (golden_party skin) must match WePlay illustration fidelity.  
**Expected WePlay behavior:** Full-width illustrated champagne bottle pouring into glass pyramid; purple bokeh orbs; gold curtains.  
**Current G-Play behavior:** golden_party backdrop uses CSS gradients + bokeh orbs but lacks illustrated bottle/pyramid art asset from reference.  
**Evidence:** Reference shows detailed champagne illustration; App.css .stage-backdrop--golden_party is gradient-only (~line 6406).  
**Likely files to inspect:** src/components/StageBackdrop.jsx, src/App.css, public/assets/  
**Implementation notes:** Import PNG/SVG stage art layers; keep bokeh animation overlay.  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 1  

---

### GAP-006

**ID:** GAP-006  
**Category:** Voice Room  
**Screen:** Floating side widgets  
**Reference frame(s):** `frame_000300.jpg, frame_002800.jpg`  
**Current G-Play screen/file:** `RoomView.jsx`  
**Severity:** High  
**Type:** Feature  
**Description:** Right-side floating 'Beats & Dance' widget and treasure/gift-box promo widget missing or mispositioned.  
**Expected WePlay behavior:** Two stacked circular widgets mid-right above chat: Beats & Dance (animated stage icon) and treasure chest with coins.  
**Current G-Play behavior:** No Beats & Dance widget component found in RoomView; red packet / promo floaters differ.  
**Evidence:** Reference frames show labeled 'Beats & Dance' circle + coin stack widget; grep 'Beats' in src/ returns no UI widget.  
**Likely files to inspect:** src/components/RoomView.jsx, new BeatsDanceWidget.jsx, src/App.css  
**Implementation notes:** Widget can deep-link to dance mini-feature or stub with toast until backend exists.  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 1  

---

### GAP-008

**ID:** GAP-008  
**Category:** Voice Room  
**Screen:** Room minimize / back  
**Reference frame(s):** `frame_000300.jpg (back chevron)`  
**Current G-Play screen/file:** `App.jsx roomMinimized`  
**Severity:** Medium  
**Type:** UX  
**Description:** Back chevron should minimize room to floating bubble while preserving audio/chat state like WePlay.  
**Expected WePlay behavior:** Tap back → small floating room chip over lobby; tap chip restores full room.  
**Current G-Play behavior:** roomMinimized float exists in App.jsx but chip visual differs (no live avatar preview / duration timer like WePlay).  
**Evidence:** App.jsx renders reopen button when roomMinimized; compare styling .room-minimize-float vs WePlay PiP bubble.  
**Likely files to inspect:** src/App.jsx, src/App.css (.room-minimize-*), src/components/RoomView.jsx  
**Implementation notes:** Add room cover thumbnail + elapsed time on float chip.  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 1  

---

### GAP-009

**ID:** GAP-009  
**Category:** Voice Room  
**Screen:** Contribution / level bar  
**Reference frame(s):** `frame_000300.jpg (diamond LV4)`  
**Current G-Play screen/file:** `RoomExpBar.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Room level diamond badge and contribution meter styling mismatch.  
**Expected WePlay behavior:** Blue diamond icon with level numeral on header; separate contribution progress elsewhere.  
**Current G-Play behavior:** RoomExpBar uses progress bar under title; diamond artwork not matching WePlay faceted gem.  
**Evidence:** Reference LV4 diamond left of title; RoomExpBar.jsx renders numeric level in bar.  
**Likely files to inspect:** src/components/RoomExpBar.jsx, src/App.css  
**Implementation notes:** Extract diamond badge component shared with profile badges.  
**Dependencies:** GAP-002  
**Risk:** Low  
**Suggested sprint:** Sprint 1  

---

### GAP-010

**ID:** GAP-010  
**Category:** Voice Room  
**Screen:** Online audience strip  
**Reference frame(s):** `frame_000300.jpg (avatar + '3')`  
**Current G-Play screen/file:** `RoomAudienceSheet.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Header online user avatars + count pill layout differs from WePlay stacked circles.  
**Expected WePlay behavior:** Up to 3 overlapping avatars + numeric online count in dark pill before menu.  
**Current G-Play behavior:** Room audience opens sheet; header preview of online users differs in size/overlap.  
**Evidence:** Reference top-right avatar with '60' badge and '3' count; RoomView header audience cluster code.  
**Likely files to inspect:** src/components/RoomView.jsx, src/components/RoomAudienceSheet.jsx  
**Implementation notes:** Match overlap offset and level badge on first avatar.  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 1  

---

### GAP-011

**ID:** GAP-011  
**Category:** Voice Room / Tools  
**Screen:** Drawing widget overlay  
**Reference frame(s):** `frame_002800.jpg (~23:20)`  
**Current G-Play screen/file:** `RoomView.jsx / FunctionsGrid.jsx`  
**Severity:** Critical  
**Type:** Feature  
**Description:** WePlay in-room Drawing Widget (collaborative canvas overlay) is separate from Draw & Guess mini-game and is missing entirely.  
**Expected WePlay behavior:** Owner opens drawing widget → white canvas overlay with brush/color/bucket/undo/redo/save; system posts 'Owner used drawing widget' and 'finished painting' lines.  
**Current G-Play behavior:** Only Draw & Guess game mode (games/draw/) exists; no room-level DrawingWidget overlay or system messages.  
**Evidence:** Reference frame_002800 shows widget with Hide menu, brush tools; grep 'drawing widget' in src/ finds only game phase 'drawing'.  
**Likely files to inspect:** New DrawingWidget.jsx, src/components/RoomView.jsx, src/components/FunctionsGrid.jsx, src/roomLog.js  
**Implementation notes:** Realtime sync via Supabase or existing room events channel; distinct from DrawGuessGame.  
**Dependencies:** GAP-012 system messages  
**Risk:** High  
**Suggested sprint:** Sprint 2  

---

### GAP-012

**ID:** GAP-012  
**Category:** Voice Room / Chat  
**Screen:** System message styling  
**Reference frame(s):** `frame_000300.jpg, frame_002800.jpg`  
**Current G-Play screen/file:** `RoomView.jsx chat feed`  
**Severity:** High  
**Type:** UI  
**Description:** System chat lines must use yellow 'System:' prefix with bell icon and regulations link formatting.  
**Expected WePlay behavior:** Gold bell + 'System:' label; welcome regulations link clickable; high-quality mode announcement template.  
**Current G-Play behavior:** chat-system class exists but prefix icon/link styling differs; regulations URL not always rendered as link.  
**Evidence:** Reference System lines with bell and 'Regulations Of The Voice Room' link; RoomView system message templates.  
**Likely files to inspect:** src/components/RoomView.jsx, src/App.css (.chat-system), src/roomLog.js  
**Implementation notes:** Centralize SYSTEM_TEMPLATES with i18n keys.  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 2  

---

### GAP-013

**ID:** GAP-013  
**Category:** Voice Room / Chat  
**Screen:** New message jump pill  
**Reference frame(s):** `frame_000300.jpg (chat area behavior)`  
**Current G-Play screen/file:** `RoomView.jsx`  
**Severity:** High  
**Type:** UX  
**Description:** When chat scrolled up, floating 'New message' / jump-to-bottom pill missing.  
**Expected WePlay behavior:** Pill appears above dock when unread messages below fold; tap scrolls to latest.  
**Current G-Play behavior:** No jump-to-bottom or new-message pill in RoomView chat scroll handler.  
**Evidence:** grep jump/new message in src/ — no room chat pill; PersonalChat may auto-scroll only.  
**Likely files to inspect:** src/components/RoomView.jsx, src/App.css  
**Implementation notes:** Track scrollTop vs scrollHeight; show pill when userScrolledUp && newMessages.  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 2  

---

### GAP-014

**ID:** GAP-014  
**Category:** Voice Room / Settings  
**Screen:** High quality mode announcement  
**Reference frame(s):** `frame_000300.jpg`  
**Current G-Play screen/file:** `RoomSettingsSheet.jsx`  
**Severity:** Medium  
**Type:** UX  
**Description:** Toggling high quality mode should post system chat line exactly like WePlay.  
**Expected WePlay behavior:** System: 'This room applies high quality mode. The audio quality will be improved and more traffic will be consumed.'  
**Current G-Play behavior:** Toggle exists in RoomSettingsSheet; system line text/format may differ or not post on toggle.  
**Evidence:** Reference system message verbatim; RoomSettingsSheet high_quality toggle + roomLog posting.  
**Likely files to inspect:** src/components/RoomSettingsSheet.jsx, src/roomLog.js  
**Implementation notes:** Post on enable/disable with canonical copy.  
**Dependencies:** GAP-012  
**Risk:** Low  
**Suggested sprint:** Sprint 2  

---

### GAP-015

**ID:** GAP-015  
**Category:** Voice Room / Settings  
**Screen:** Membership fees row  
**Reference frame(s):** `Clan/room settings reference (~mid recording)`  
**Current G-Play screen/file:** `RoomSettingsSheet.jsx`  
**Severity:** Medium  
**Type:** Feature  
**Description:** WePlay room settings include membership fee / associated groups / records rows not present in G-Play sheet.  
**Expected WePlay behavior:** Settings list rows: Membership Fee, Associated Groups, Room Records with chevrons.  
**Current G-Play behavior:** RoomSettingsSheet has quality/ban/partner toggles but no membership fee or associated groups entries.  
**Evidence:** WePlay settings screens in recording ~15-18min; RoomSettingsSheet.jsx field list audit.  
**Likely files to inspect:** src/components/RoomSettingsSheet.jsx, supabase room settings schema  
**Implementation notes:** May require DB columns room.membership_fee, associated_group_ids.  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 2  

---

### GAP-016

**ID:** GAP-016  
**Category:** Voice Room / Tools  
**Screen:** Functions emote tools  
**Reference frame(s):** `frame_002800.jpg (dock)`  
**Current G-Play screen/file:** `FunctionsGrid.jsx / EmotePanel.jsx`  
**Severity:** Medium  
**Type:** Feature  
**Description:** Lottery, dice, coin toss quick emote tools in functions drawer differ or missing vs WePlay.  
**Expected WePlay behavior:** Functions grid includes Lottery, Dice, Coin Toss with animated results posted to chat.  
**Current G-Play behavior:** FunctionsGrid maps Lucky Number/Lottery to reaction emoji only; no 3D dice/lottery UI.  
**Evidence:** FunctionsGrid.jsx entertainment items; reference function sheets show lottery/dice icons.  
**Likely files to inspect:** src/components/FunctionsGrid.jsx, src/components/EmotePanel.jsx, src/components/ReactionPanel.jsx  
**Implementation notes:** Wire random outcome + chat broadcast.  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 2  

---

### GAP-017

**ID:** GAP-017  
**Category:** Voice Room / Chat  
**Screen:** Pinned room rules  
**Reference frame(s):** `frame_000300.jpg (Hindi rules)`  
**Current G-Play screen/file:** `RoomView.jsx`  
**Severity:** Medium  
**Type:** Feature  
**Description:** Room owner custom pinned rules list at top of chat missing.  
**Expected WePlay behavior:** Up to N owner-defined rules shown above chat feed (Romanized Hindi lines in reference).  
**Current G-Play behavior:** No pinned rules field in room UI; only system welcome messages.  
**Evidence:** Reference three custom rule lines before System messages; no room.rules in RoomView.  
**Likely files to inspect:** src/components/RoomView.jsx, rooms schema, RoomSettingsSheet.jsx  
**Implementation notes:** Add room.rules_text JSON array editable by host.  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 2  

---

### GAP-018

**ID:** GAP-018  
**Category:** Voice Room / Tools  
**Screen:** Scoreboard modal  
**Reference frame(s):** `scoreboard frames (~mid recording)`  
**Current G-Play screen/file:** `ScoreboardSheet.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Scoreboard modal Add/Subtract button layout and styling must match WePlay (14-seat grid mirroring is intentional).  
**Expected WePlay behavior:** Each score row has + and - buttons flanking score with color-coded totals.  
**Current G-Play behavior:** ScoreboardSheet exists but Add/Subtract button layout may differ from reference modal.  
**Evidence:** Sprint checklist cites split Add/Subtract; audit ScoreboardSheet.jsx markup vs reference.  
**Likely files to inspect:** src/components/ScoreboardSheet.jsx, src/App.css  
**Implementation notes:** Match +/- button styling; keep 14-seat scoreboard rows.  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 2  

---

### GAP-019

**ID:** GAP-019  
**Category:** Voice Room / Video mode  
**Screen:** YouTube in-room panel  
**Reference frame(s):** `frame_002500.jpg (~20:50)`  
**Current G-Play screen/file:** `VideoRoomPanel.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Video mode stage layout with embedded YouTube and branded chrome differs from WePlay.  
**Expected WePlay behavior:** Large video pane above compact seat strip; 'Choose YouTube video' empty state with brand bar.  
**Current G-Play behavior:** VideoRoomPanel + AddVideoSheet implemented but visual chrome (seat strip size, overlay controls) differs.  
**Evidence:** VideoRoomPanel.jsx has YouTube embed; compare frame_002500 stage proportions.  
**Likely files to inspect:** src/components/VideoRoomPanel.jsx, src/components/AddVideoSheet.jsx, src/App.css  
**Implementation notes:** Shrink seats to strip; match ▶ YouTube brand pill.  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 2  

---

### GAP-020

**ID:** GAP-020  
**Category:** Voice Room  
**Screen:** Group chat button in header  
**Reference frame(s):** `frame_000300.jpg`  
**Current G-Play screen/file:** `RoomView.jsx header`  
**Severity:** High  
**Type:** Navigation  
**Description:** Header 'Group' button opening room group chat / audience chat missing.  
**Expected WePlay behavior:** Small 'Group' pill with chat bubble icon next to room ID opens group messaging.  
**Current G-Play behavior:** No Group button in stage header; audience uses RoomAudienceSheet only.  
**Evidence:** Reference shows 'Group' button under title near ID; grep 'Group' in RoomView header — absent.  
**Likely files to inspect:** src/components/RoomView.jsx, new RoomGroupChatSheet.jsx  
**Implementation notes:** Could link to clan/group DM if room has associated group.  
**Dependencies:** GAP-015 associated groups  
**Risk:** Medium  
**Suggested sprint:** Sprint 2  

---

### GAP-021

**ID:** GAP-021  
**Category:** Gifts  
**Screen:** Gift sheet footer  
**Reference frame(s):** `gift frames ~05:00`  
**Current G-Play screen/file:** `GiftSheet.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Gift panel footer must show coin balance, anonymous toggle, qty selector, pink Send CTA in one row.  
**Expected WePlay behavior:** Footer: coin icon + balance, 'Send Anonymously' toggle, qty dropdown, full-width pink Send.  
**Current G-Play behavior:** GiftSheet has tabs and send but footer layout/spacing/colors differ from WePlay dark sheet.  
**Evidence:** GiftSheet.jsx footer section vs reference gift panel  
**Likely files to inspect:** GiftSheet.jsx, App.css (.gift-sheet-*)  
**Implementation notes:** Match #ff4d9d Send button; pin footer above safe area  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 3  

---

### GAP-022

**ID:** GAP-022  
**Category:** Gifts  
**Screen:** Gift tile disabled state  
**Reference frame(s):** `gift frames`  
**Current G-Play screen/file:** `GiftSheet.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Insufficient coins must gray-out gift tiles with lock overlay.  
**Expected WePlay behavior:** Unaffordable gifts desaturated with coin deficit hint.  
**Current G-Play behavior:** Gift send may error on tap instead of proactive gray-out.  
**Evidence:** GiftSheet price check logic  
**Likely files to inspect:** GiftSheet.jsx  
**Implementation notes:** Precompute canAfford per tile  
**Dependencies:** GAP-021  
**Risk:** Low  
**Suggested sprint:** Sprint 3  

---

### GAP-023

**ID:** GAP-023  
**Category:** Gifts  
**Screen:** Anonymous send mask  
**Reference frame(s):** `gift frames`  
**Current G-Play screen/file:** `GiftSheet.jsx`  
**Severity:** Medium  
**Type:** UX  
**Description:** Anonymous toggle must mask sender name in room chat gift line.  
**Expected WePlay behavior:** Gift messages show 'Someone' or mask icon when anonymous enabled.  
**Current G-Play behavior:** Anonymous flag exists; verify room chat rendering uses it consistently.  
**Evidence:** GiftSheet anonymous state + RoomView gift bubbles  
**Likely files to inspect:** GiftSheet.jsx, RoomView.jsx  
**Implementation notes:** Audit gift message template  
**Dependencies:** GAP-021  
**Risk:** Medium  
**Suggested sprint:** Sprint 3  

---

### GAP-024

**ID:** GAP-024  
**Category:** Gifts  
**Screen:** Quantity dropdown  
**Reference frame(s):** `gift frames`  
**Current G-Play screen/file:** `GiftSheet.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Qty selector must offer 1/5/33/50/100 presets like WePlay.  
**Expected WePlay behavior:** Dropdown with preset quantities and combo multiplier display.  
**Current G-Play behavior:** Qty selector may use different preset list.  
**Evidence:** GiftSheet qty UI  
**Likely files to inspect:** GiftSheet.jsx  
**Implementation notes:** Match preset list exactly  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 3  

---

### GAP-025

**ID:** GAP-025  
**Category:** Gifts  
**Screen:** Special tab helper  
**Reference frame(s):** `gift frames`  
**Current G-Play screen/file:** `GiftSheet.jsx Special tab`  
**Severity:** Medium  
**Type:** UI  
**Description:** Special gifts tab includes helper text and Business Life tags.  
**Expected WePlay behavior:** Banner text explaining special gifts; BL tagged items.  
**Current G-Play behavior:** Special tab exists; helper copy/tags differ.  
**Evidence:** GiftSheet Special tab render  
**Likely files to inspect:** GiftSheet.jsx, gifts.js  
**Implementation notes:** Add helper row + tag chips  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 3  

---

### GAP-026

**ID:** GAP-026  
**Category:** Gifts  
**Screen:** Gift animation fullscreen  
**Reference frame(s):** `gift animation frames`  
**Current G-Play screen/file:** `GiftAnimation.jsx / PremiumGiftFx.jsx`  
**Severity:** High  
**Type:** Animation  
**Description:** Premium gifts play full-screen SVGA/Lottie once inside room bounds.  
**Expected WePlay behavior:** Fullscreen FX centered; blocks input briefly; charm +N floater.  
**Current G-Play behavior:** PremiumGiftFx scoped to 430px room — good — but animation catalog may miss assets.  
**Evidence:** PremiumGiftFx portal in App.css  
**Likely files to inspect:** GiftAnimation.jsx, PremiumGiftFx.jsx, giftFx.js  
**Implementation notes:** Asset pipeline for SVGA  
**Dependencies:** None  
**Risk:** High  
**Suggested sprint:** Sprint 3  

---

### GAP-027

**ID:** GAP-027  
**Category:** Gifts  
**Screen:** Combo gift button  
**Reference frame(s):** `combo frames`  
**Current G-Play screen/file:** `ComboGiftButton.jsx`  
**Severity:** Medium  
**Type:** UX  
**Description:** Long-press or combo send button for rapid multi-send.  
**Expected WePlay behavior:** Combo UI appears after first send with increment counter.  
**Current G-Play behavior:** ComboGiftButton exists; timing/visuals differ.  
**Evidence:** ComboGiftButton.jsx  
**Likely files to inspect:** ComboGiftButton.jsx  
**Implementation notes:** Match WePlay combo ring animation  
**Dependencies:** GAP-021  
**Risk:** Medium  
**Suggested sprint:** Sprint 3  

---

### GAP-028

**ID:** GAP-028  
**Category:** Gifts  
**Screen:** DM gift promotional banner  
**Reference frame(s):** `DM gift frames`  
**Current G-Play screen/file:** `GiftSheet.jsx in PersonalChat`  
**Severity:** Medium  
**Type:** UI  
**Description:** Opening gifts from DM shows promotional recharge banner above sheet.  
**Expected WePlay behavior:** Top banner: recharge promo with coins illustration.  
**Current G-Play behavior:** GiftSheet in DM context lacks promo banner strip.  
**Evidence:** PersonalChat opens GiftSheet  
**Likely files to inspect:** GiftSheet.jsx, PersonalChat.jsx  
**Implementation notes:** Prop showPromoBanner when openedFromDm  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 3  

---

### GAP-029

**ID:** GAP-029  
**Category:** Gifts  
**Screen:** Gift wall sheet  
**Reference frame(s):** `profile gift wall frames`  
**Current G-Play screen/file:** `GiftWallSheet.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Profile/room gift wall grid with lit/unlit badges and totals.  
**Expected WePlay behavior:** Wall of gift icons with counts; tap opens detail.  
**Current G-Play behavior:** GiftWallSheet exists; badge frame art differs from WePlay golden frames.  
**Evidence:** GiftWallSheet.jsx  
**Likely files to inspect:** GiftWallSheet.jsx, App.css  
**Implementation notes:** Import badge frame assets  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 3  

---

### GAP-030

**ID:** GAP-030  
**Category:** Gifts  
**Screen:** Receiver charm feedback  
**Reference frame(s):** `frame_002800.jpg`  
**Current G-Play screen/file:** `RoomView gift lines`  
**Severity:** Medium  
**Type:** UX  
**Description:** After gift send, yellow 'Receiver's Charm +N' subline appears.  
**Expected WePlay behavior:** Charm delta shown under gift chat line.  
**Current G-Play behavior:** Charm may update server-side without inline feedback line.  
**Evidence:** Reference frame_002800 gift message  
**Likely files to inspect:** RoomView.jsx, gamification.js  
**Implementation notes:** Post charm delta as secondary chat row  
**Dependencies:** GAP-026  
**Risk:** Low  
**Suggested sprint:** Sprint 3  

---

### GAP-031

**ID:** GAP-031  
**Category:** Chat / DM  
**Screen:** Voice room invite card  
**Reference frame(s):** `DM invite frames ~04:00`  
**Current G-Play screen/file:** `PersonalChat.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** DM voice-room invite must use rich card with room cover thumbnail, not generic icon.  
**Expected WePlay behavior:** Large card with room image, name, member count, Join CTA gradient button.  
**Current G-Play behavior:** parseRoomInvite renders card with UiIcon thumb — functional but visually plain vs WePlay illustrated card.  
**Evidence:** PersonalChat.jsx lines 409-435 vs reference DM invite cards  
**Likely files to inspect:** PersonalChat.jsx, App.css (.personal-chat-card--invite)  
**Implementation notes:** Fetch room cover URL for thumbnail  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 4  

---

### GAP-032

**ID:** GAP-032  
**Category:** Chat / DM  
**Screen:** Reply quote nesting  
**Reference frame(s):** `DM frames`  
**Current G-Play screen/file:** `PersonalChat.jsx`  
**Severity:** High  
**Type:** UX  
**Description:** Reply-to message shows nested quote bubble with left bar.  
**Expected WePlay behavior:** Quoted preview above composed message; tap scrolls to original.  
**Current G-Play behavior:** Reply UI may be partial or missing in PersonalChat.  
**Evidence:** PersonalChat reply state  
**Likely files to inspect:** PersonalChat.jsx  
**Implementation notes:** Add replyTo message schema  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 4  

---

### GAP-033

**ID:** GAP-033  
**Category:** Chat / DM  
**Screen:** Large sticker no bubble  
**Reference frame(s):** `sticker DM frames`  
**Current G-Play screen/file:** `PersonalChat.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Large stickers render without chat bubble background.  
**Expected WePlay behavior:** Sticker-only message has transparent background full width.  
**Current G-Play behavior:** Stickers may render inside standard bubble.  
**Evidence:** PersonalChat sticker branch  
**Likely files to inspect:** PersonalChat.jsx, App.css  
**Implementation notes:** Conditional class --sticker-only  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 4  

---

### GAP-034

**ID:** GAP-034  
**Category:** Chat / DM  
**Screen:** Chat settings sheet  
**Reference frame(s):** `settings frames`  
**Current G-Play screen/file:** `ChatSettingsSheet.jsx`  
**Severity:** High  
**Type:** Feature  
**Description:** Chat settings: alias, background, block gaming invites rows.  
**Expected WePlay behavior:** Full settings page with wallpaper picker and toggle rows.  
**Current G-Play behavior:** ChatSettingsSheet exists with partial fields; block gaming invites missing.  
**Evidence:** ChatSettingsSheet.jsx  
**Likely files to inspect:** ChatSettingsSheet.jsx  
**Implementation notes:** Add blockGameInvites preference  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 4  

---

### GAP-035

**ID:** GAP-035  
**Category:** Chat / DM  
**Screen:** Official account badge  
**Reference frame(s):** `system chat rows`  
**Current G-Play screen/file:** `ChatListRow.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Official/support accounts show orange Official badge on avatar.  
**Expected WePlay behavior:** Badge overlay on system accounts in chat list.  
**Current G-Play behavior:** No official badge styling in chat list rows.  
**Evidence:** ChatListRow avatar area  
**Likely files to inspect:** ChatListRow.jsx, App.css  
**Implementation notes:** Flag is_official on profiles  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 4  

---

### GAP-036

**ID:** GAP-036  
**Category:** Chat / DM  
**Screen:** Chats header actions  
**Reference frame(s):** `chats tab header`  
**Current G-Play screen/file:** `LobbyScreen.jsx chats tab`  
**Severity:** Medium  
**Type:** UI  
**Description:** Chats tab header needs add-friend + compose icons top-right.  
**Expected WePlay behavior:** Two icons: person+ and edit/compose.  
**Current G-Play behavior:** Chats header may only show title.  
**Evidence:** LobbyScreen chats panel header  
**Likely files to inspect:** LobbyScreen.jsx  
**Implementation notes:** Add header icon buttons  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 4  

---

### GAP-037

**ID:** GAP-037  
**Category:** Chat / DM  
**Screen:** Floating LV/charm badge in DM  
**Reference frame(s):** `frame_000500.jpg (~04:10)`  
**Current G-Play screen/file:** `PersonalChat.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** DM header or background shows floating level/charm badge decoration.  
**Expected WePlay behavior:** 3D LV badge floating near top of chat wallpaper.  
**Current G-Play behavior:** PersonalChat uses flat header without floating badge decor.  
**Evidence:** frame_000500 reference  
**Likely files to inspect:** PersonalChat.jsx, App.css  
**Implementation notes:** Decorative absolutely-positioned badge  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 4  

---

### GAP-038

**ID:** GAP-038  
**Category:** Chat / DM  
**Screen:** Muted conversation indicator  
**Reference frame(s):** `chat list frames`  
**Current G-Play screen/file:** `ChatListRow.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Muted chats show bell-slash icon on row.  
**Expected WePlay behavior:** Bell with slash on right of muted threads.  
**Current G-Play behavior:** Mute preference may exist without row icon.  
**Evidence:** Chat settings mute flag  
**Likely files to inspect:** ChatListRow.jsx, privateChat.js  
**Implementation notes:** Show icon when convo.muted  
**Dependencies:** GAP-034  
**Risk:** Low  
**Suggested sprint:** Sprint 4  

---

### GAP-039

**ID:** GAP-039  
**Category:** Chat / DM  
**Screen:** Create Group chat  
**Reference frame(s):** `group chat frames`  
**Current G-Play screen/file:** `ChatSettingsSheet.jsx`  
**Severity:** Critical  
**Type:** Feature  
**Description:** Create Group chat flow for multi-user threads.  
**Expected WePlay behavior:** Group creation picker with name + members.  
**Current G-Play behavior:** ChatSettingsSheet line: 'Create Group — coming soon (stub)'.  
**Evidence:** ChatSettingsSheet.jsx stub string  
**Likely files to inspect:** New GroupChat feature  
**Implementation notes:** Full group messaging schema  
**Dependencies:** None  
**Risk:** High  
**Suggested sprint:** Sprint 4  

---

### GAP-040

**ID:** GAP-040  
**Category:** Chat / DM  
**Screen:** Clan chat row styling  
**Reference frame(s):** `chats tab`  
**Current G-Play screen/file:** `LobbyScreen.jsx + ClanChat.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Clan chat entry row uses distinct family badge icon and preview formatting.  
**Expected WePlay behavior:** Clan row with sign badge, last message preview, unread pill.  
**Current G-Play behavior:** Clan row exists; sign badge graphic differs from WePlay Family icon.  
**Evidence:** LobbyScreen clan chat row  
**Likely files to inspect:** LobbyScreen.jsx, ClanChat.jsx  
**Implementation notes:** Use clan.sign artwork on row  
**Dependencies:** GAP-081  
**Risk:** Low  
**Suggested sprint:** Sprint 4  

---

### GAP-041

**ID:** GAP-041  
**Category:** Home / Lobby  
**Screen:** Games grid catalog  
**Reference frame(s):** `frame_000068.jpg (~00:34)`  
**Current G-Play screen/file:** `LobbyGamesSection.jsx + lobbyGames.js`  
**Severity:** Critical  
**Type:** Feature  
**Description:** Home games grid missing ~10+ WePlay titles (Spy, Ludo live, Mic Grab, Jackaroo, etc.).  
**Expected WePlay behavior:** Full grid: Who's the Spy, Trickster's Cafe, Hide And Seek, Space Werewolf, Oh My Card, Ludo, Guess My Drawing, Mic Grab, Crazy Alpaca, Jackaroo…  
**Current G-Play behavior:** LOBBY_GAMES_GRID only lists 5 live in-room mini-games (trivia/draw/wordle/mafia/ddd); no lobby-only games.  
**Evidence:** frame_000068 vs lobbyGames.js  
**Likely files to inspect:** lobbyGames.js, LobbyGamesSection.jsx, games/catalog.js  
**Implementation notes:** Separate LOBBY_ONLY_GAMES catalog  
**Dependencies:** GAP-091  
**Risk:** High  
**Suggested sprint:** Sprint 5  

---

### GAP-042

**ID:** GAP-042  
**Category:** Home / Lobby  
**Screen:** GOLD RUSH invite banner  
**Reference frame(s):** `frame_000068.jpg`  
**Current G-Play screen/file:** `LobbyScreen.jsx`  
**Severity:** High  
**Type:** Feature  
**Description:** Floating timed invite banner 'Invite you to GOLD RUSH' with avatars + Enter now.  
**Expected WePlay behavior:** Top overlay with countdown (6s), participant avatars, dismiss X.  
**Current G-Play behavior:** No GOLD RUSH or timed game invite overlay on home tab.  
**Evidence:** frame_000068 top banner  
**Likely files to inspect:** LobbyScreen.jsx, new GameInviteBanner.jsx  
**Implementation notes:** Realtime promo events channel  
**Dependencies:** GAP-041  
**Risk:** Medium  
**Suggested sprint:** Sprint 5  

---

### GAP-043

**ID:** GAP-043  
**Category:** Voice Room / Lobby  
**Screen:** Pull-to-refresh  
**Reference frame(s):** `frame_000350.jpg (~02:55)`  
**Current G-Play screen/file:** `LobbyScreen.jsx rooms tab`  
**Severity:** Medium  
**Type:** UX  
**Description:** Voice room All tab supports pull-to-refresh spinner.  
**Expected WePlay behavior:** Pull down → spinner → refresh list.  
**Current G-Play behavior:** Room list refresh may be manual/button only.  
**Evidence:** frame_000350  
**Likely files to inspect:** LobbyScreen.jsx  
**Implementation notes:** Touch pull gesture on room list  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 5  

---

### GAP-044

**ID:** GAP-044  
**Category:** Voice Room / Lobby  
**Screen:** Gold Tycoon carousel banner  
**Reference frame(s):** `room list banners`  
**Current G-Play screen/file:** `LobbyScreen.jsx ROOM_PROMO_BANNERS`  
**Severity:** Medium  
**Type:** UI  
**Description:** Promo carousel includes Gold Tycoon illustrated banner.  
**Expected WePlay behavior:** Gold Tycoon art banner in carousel.  
**Current G-Play behavior:** ROOM_PROMO_BANNERS has gold key but CSS illustration differs.  
**Evidence:** lobbyGames.js ROOM_PROMO_BANNERS  
**Likely files to inspect:** LobbyScreen.jsx, App.css  
**Implementation notes:** Match illustrated art  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 5  

---

### GAP-045

**ID:** GAP-045  
**Category:** Voice Room / Lobby  
**Screen:** Room card badges  
**Reference frame(s):** `room list frames`  
**Current G-Play screen/file:** `LobbyScreen.jsx room cards`  
**Severity:** High  
**Type:** UI  
**Description:** Room cards show hex level badges + Partying/Entrepreneur ribbon pills.  
**Expected WePlay behavior:** Hexagonal level badge + colored status ribbons on cover.  
**Current G-Play behavior:** Cards use emoji medals from level — not hex badges/ribbons.  
**Evidence:** LobbyScreen room card render ~line 530  
**Likely files to inspect:** LobbyScreen.jsx, App.css  
**Implementation notes:** Import hex badge SVG + ribbon components  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 5  

---

### GAP-046

**ID:** GAP-046  
**Category:** Voice Room / Lobby  
**Screen:** Sub-filters Friends/PK/Music/Video/Game  
**Reference frame(s):** `room list frames`  
**Current G-Play screen/file:** `LobbyScreen.jsx tag pills`  
**Severity:** Medium  
**Type:** UI  
**Description:** All tab sub-filter pills Friends/PK/Music/Video/Game with active styling.  
**Expected WePlay behavior:** Horizontal pills below tabs; active pill filled teal.  
**Current G-Play behavior:** Tag pills exist (friends,pk,music,video,game) — verify visual parity with reference.  
**Evidence:** LobbyScreen tag filter code  
**Likely files to inspect:** LobbyScreen.jsx  
**Implementation notes:** Compare pill colors to WePlay teal  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 5  

---

### GAP-047

**ID:** GAP-047  
**Category:** Home / Lobby  
**Screen:** Ranking/Tasks/Online Friend quick row  
**Reference frame(s):** `frame_000068.jpg`  
**Current G-Play screen/file:** `GplayHubRow.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Below Games title: Ranking, Tasks, Online Friend icon row.  
**Expected WePlay behavior:** Three icon+label quick links centered under header.  
**Current G-Play behavior:** GplayHubRow may exist with different icons/order.  
**Evidence:** GplayHubRow.jsx vs frame_000068  
**Likely files to inspect:** GplayHubRow.jsx, LobbyScreen.jsx  
**Implementation notes:** Align icons and labels  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 5  

---

### GAP-048

**ID:** GAP-048  
**Category:** Home / Lobby  
**Screen:** Game tile 3D art  
**Reference frame(s):** `frame_000068.jpg`  
**Current G-Play screen/file:** `LobbyGamesSection.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Game tiles use gold-framed 3D character art not emoji gradients.  
**Expected WePlay behavior:** Each tile: gold border + illustrated character on gradient.  
**Current G-Play behavior:** Tiles use emoji + CSS gradient via toLobbyTile(); artUrl always null.  
**Evidence:** lobbyGames.js toLobbyTile artUrl:null  
**Likely files to inspect:** LobbyGamesSection.jsx, public/art/games/  
**Implementation notes:** Add artUrl assets per game  
**Dependencies:** GAP-041  
**Risk:** Medium  
**Suggested sprint:** Sprint 5  

---

### GAP-049

**ID:** GAP-049  
**Category:** Home / Lobby  
**Screen:** Gift Pack countdown floater  
**Reference frame(s):** `frame_000068.jpg Crazy Alpaca tile`  
**Current G-Play screen/file:** `LobbyGamesSection.jsx`  
**Severity:** Medium  
**Type:** Feature  
**Description:** Specific game tiles show Gift Pack badge with live countdown timer.  
**Expected WePlay behavior:** Badge 'Gift Pack' + HH:MM:SS on eligible tiles.  
**Current G-Play behavior:** No countdown gift pack badge on lobby tiles.  
**Evidence:** frame_000068 Crazy Alpaca badge  
**Likely files to inspect:** LobbyGamesSection.jsx, gamification.js  
**Implementation notes:** Timer from promo API  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 5  

---

### GAP-050

**ID:** GAP-050  
**Category:** Voice Room / Lobby  
**Screen:** HOT ROOM ranking banner  
**Reference frame(s):** `voice room list ~01:00`  
**Current G-Play screen/file:** `LobbyScreen.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Graphical HOT ROOM banner with podium avatars (may have been partially implemented).  
**Expected WePlay behavior:** Gradient banner with top room avatars on podium + View ranking CTA.  
**Current G-Play behavior:** Verify current G-play-hot-ranking-banner vs latest WePlay reference for remaining visual gaps.  
**Evidence:** LobbyScreen hot banner + frame ~000200  
**Likely files to inspect:** LobbyScreen.jsx, App.css  
**Implementation notes:** Diff against reference after local visual QA  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 5  

---

### GAP-051

**ID:** GAP-051  
**Category:** Profile / Spotlight  
**Screen:** Moments Discover row  
**Reference frame(s):** `frame_001200.jpg (~10:00)`  
**Current G-Play screen/file:** `MomentsFeed.jsx + ExploreTab.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Discover tab Moments entry row with avatar dot and preview strip.  
**Expected WePlay behavior:** Horizontal moments row with red dot on avatar ring.  
**Current G-Play behavior:** MomentsFeed exists; discover row styling differs from WePlay spotlight row.  
**Evidence:** ExploreTab moments section  
**Likely files to inspect:** MomentsFeed.jsx, ExploreTab.jsx  
**Implementation notes:** Match row height and dot indicator  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 6  

---

### GAP-052

**ID:** GAP-052  
**Category:** Profile  
**Screen:** Cover carousel + 3D avatar  
**Reference frame(s):** `profile frames`  
**Current G-Play screen/file:** `ProfileCoverCarousel.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Profile cover swipe carousel with optional 3D avatar preview hint.  
**Expected WePlay behavior:** Full-width cover images swipeable; 3D avatar badge if equipped.  
**Current G-Play behavior:** ProfileCoverCarousel exists; 3D avatar hint missing.  
**Evidence:** ProfileCoverCarousel.jsx  
**Likely files to inspect:** ProfileCoverCarousel.jsx, UserFullProfileSheet.jsx  
**Implementation notes:** Add 3D avatar entry chip  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 6  

---

### GAP-053

**ID:** GAP-053  
**Category:** Profile  
**Screen:** Me tab settings grid  
**Reference frame(s):** `profile me tab ~08:00`  
**Current G-Play screen/file:** `ProfilePanel.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Me tab settings/inventory grid icon layout and labels differ from WePlay.  
**Expected WePlay behavior:** Two-column icon grid: Wallet, Shop, VIP, Tasks, etc. with badge dots.  
**Current G-Play behavior:** ProfilePanel has sections but spacing/icons differ.  
**Evidence:** ProfilePanel.jsx layout  
**Likely files to inspect:** ProfilePanel.jsx, App.css  
**Implementation notes:** Audit grid against reference frames  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 6  

---

### GAP-054

**ID:** GAP-054  
**Category:** Profile  
**Screen:** Gift wall on profile  
**Reference frame(s):** `profile frames`  
**Current G-Play screen/file:** `GiftWallSheet.jsx from profile`  
**Severity:** High  
**Type:** UI  
**Description:** Profile shows gift wall preview section before full sheet.  
**Expected WePlay behavior:** Inline gift wall strip on profile with View all.  
**Current G-Play behavior:** Gift wall only in sheet — may lack inline preview on profile.  
**Evidence:** UserFullProfileSheet.jsx  
**Likely files to inspect:** UserFullProfileSheet.jsx, GiftWallSheet.jsx  
**Implementation notes:** Add inline preview row  
**Dependencies:** GAP-029  
**Risk:** Medium  
**Suggested sprint:** Sprint 6  

---

### GAP-055

**ID:** GAP-055  
**Category:** Profile  
**Screen:** PLAY Show entry  
**Reference frame(s):** `profile frames`  
**Current G-Play screen/file:** `PlayShowSheet.jsx`  
**Severity:** Medium  
**Type:** Navigation  
**Description:** Profile PLAY Show entry tile opens PLAY Show rankings.  
**Expected WePlay behavior:** PLAY Show button on profile with icon.  
**Current G-Play behavior:** PlayShowSheet reachable from rankings; profile entry may be missing.  
**Evidence:** PlayShowSheet.jsx, ProfilePanel.jsx  
**Likely files to inspect:** ProfilePanel.jsx  
**Implementation notes:** Add PLAY Show tile  
**Dependencies:** GAP-061  
**Risk:** Low  
**Suggested sprint:** Sprint 6  

---

### GAP-056

**ID:** GAP-056  
**Category:** Profile  
**Screen:** Stats/charm/level badges  
**Reference frame(s):** `profile header`  
**Current G-Play screen/file:** `UserFullProfileSheet.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Profile stats row: charm, level, visitors with badge artwork.  
**Expected WePlay behavior:** Icon badges with numbers in rounded capsules.  
**Current G-Play behavior:** Stats exist in StatsSheet; header capsule art differs.  
**Evidence:** StatsSheet.jsx, UserFullProfileSheet.jsx  
**Likely files to inspect:** UserFullProfileSheet.jsx  
**Implementation notes:** Unify badge components  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 6  

---

### GAP-057

**ID:** GAP-057  
**Category:** Profile  
**Screen:** Edit profile fields  
**Reference frame(s):** `edit profile frames`  
**Current G-Play screen/file:** `EditProfileSheet.jsx`  
**Severity:** Medium  
**Type:** Feature  
**Description:** Edit profile: country picker, bio, avatar crop flow.  
**Expected WePlay behavior:** Country list with flags; bio 200 chars; square crop.  
**Current G-Play behavior:** EditProfileSheet may lack country selector or crop UI.  
**Evidence:** EditProfileSheet.jsx  
**Likely files to inspect:** EditProfileSheet.jsx  
**Implementation notes:** Add country field + cropper  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 6  

---

### GAP-058

**ID:** GAP-058  
**Category:** Profile  
**Screen:** Visitors sheet  
**Reference frame(s):** `visitors frames`  
**Current G-Play screen/file:** `VisitorsSheet.jsx`  
**Severity:** Medium  
**Type:** Feature  
**Description:** Visitors list with timestamp and incognito VIP visitors.  
**Expected WePlay behavior:** List of visitors avatars + time ago; VIP can hide.  
**Current G-Play behavior:** VisitorsSheet exists; incognito/hidden visitor logic may differ.  
**Evidence:** VisitorsSheet.jsx  
**Likely files to inspect:** VisitorsSheet.jsx, vipStatus.js  
**Implementation notes:** VIP hide footprint flag  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 6  

---

### GAP-059

**ID:** GAP-059  
**Category:** Profile / Spotlight  
**Screen:** Create moment composer  
**Reference frame(s):** `moments compose frames`  
**Current G-Play screen/file:** `CreateMomentSheet.jsx`  
**Severity:** Medium  
**Type:** UX  
**Description:** Create moment supports photo + text + location tag.  
**Expected WePlay behavior:** Composer with album picker, text, @mentions.  
**Current G-Play behavior:** CreateMomentSheet may be text-only partial.  
**Evidence:** CreateMomentSheet.jsx  
**Likely files to inspect:** CreateMomentSheet.jsx  
**Implementation notes:** Expand media picker  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 6  

---

### GAP-060

**ID:** GAP-060  
**Category:** Profile  
**Screen:** Spotlight full feed layout  
**Reference frame(s):** `moments feed frames`  
**Current G-Play screen/file:** `MomentsFeed.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Spotlight feed cards: likes, comments, gift buttons on each moment.  
**Expected WePlay behavior:** Card layout with interaction bar beneath media.  
**Current G-Play behavior:** MomentsFeed layout/spacing differs from WePlay discover feed.  
**Evidence:** MomentsFeed.jsx  
**Likely files to inspect:** MomentsFeed.jsx, App.css  
**Implementation notes:** Card-by-card diff vs reference  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 6  

---

### GAP-061

**ID:** GAP-061  
**Category:** Rankings  
**Screen:** Dark purple podium UI  
**Reference frame(s):** `frame_000100.jpg (~00:50)`  
**Current G-Play screen/file:** `RankingsSheet.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Rankings sheet uses dark purple geometric background with crown podium for top 3.  
**Expected WePlay behavior:** Purple patterned backdrop; crowns on ranks 1-3; gold names.  
**Current G-Play behavior:** RankingsSheet tabs match categories but background is lighter G-play sheet white/purple mix.  
**Evidence:** frame_000100 vs RankingsSheet.jsx  
**Likely files to inspect:** RankingsSheet.jsx, App.css (.rankings-*)  
**Implementation notes:** Rebuild rankings as full-bleed dark page  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 7  

---

### GAP-062

**ID:** GAP-062  
**Category:** Rankings  
**Screen:** Time filter pills  
**Reference frame(s):** `frame_000100.jpg`  
**Current G-Play screen/file:** `RankingsSheet.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Secondary pills: Today/Yesterday/Celebrity/Annual with filled active state.  
**Expected WePlay behavior:** Yesterday pill white fill when active (reference).  
**Current G-Play behavior:** Filters exist; active pill styling differs.  
**Evidence:** RankingsSheet time filters  
**Likely files to inspect:** RankingsSheet.jsx  
**Implementation notes:** Match pill fill colors  
**Dependencies:** GAP-061  
**Risk:** Low  
**Suggested sprint:** Sprint 7  

---

### GAP-063

**ID:** GAP-063  
**Category:** Rankings  
**Screen:** Global region dropdown  
**Reference frame(s):** `frame_000100.jpg`  
**Current G-Play screen/file:** `RankingsSheet.jsx`  
**Severity:** Medium  
**Type:** Feature  
**Description:** Global dropdown to switch ranking region.  
**Expected WePlay behavior:** Global ▼ opens region list.  
**Current G-Play behavior:** Global filter may be static label only.  
**Evidence:** RankingsSheet header  
**Likely files to inspect:** RankingsSheet.jsx, rankings.js  
**Implementation notes:** Wire region param to API  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 7  

---

### GAP-064

**ID:** GAP-064  
**Category:** Rankings  
**Screen:** PLAY Show tab UI  
**Reference frame(s):** `frame_000200.jpg (~01:40)`  
**Current G-Play screen/file:** `PlayShowSheet.jsx / Rankings PLAY tab`  
**Severity:** High  
**Type:** UI  
**Description:** PLAY Show tab with Male/Female toggle and Collection metric.  
**Expected WePlay behavior:** Gender toggle + collection count column in list.  
**Current G-Play behavior:** PLAY tab in RankingsSheet may lack gender toggle layout.  
**Evidence:** frame_000200  
**Likely files to inspect:** PlayShowSheet.jsx, RankingsSheet.jsx  
**Implementation notes:** Port PLAY UI from PlayShowSheet  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 7  

---

### GAP-065

**ID:** GAP-065  
**Category:** Rankings  
**Screen:** Help ? icon  
**Reference frame(s):** `frame_000100.jpg`  
**Current G-Play screen/file:** `RankingsSheet.jsx`  
**Severity:** Low  
**Type:** UX  
**Description:** Header ? opens ranking rules explainer.  
**Expected WePlay behavior:** Modal with rules text.  
**Current G-Play behavior:** Help icon absent or non-functional.  
**Evidence:** Rankings header  
**Likely files to inspect:** RankingsSheet.jsx  
**Implementation notes:** Add rules modal  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 7  

---

### GAP-066

**ID:** GAP-066  
**Category:** VIP  
**Screen:** VIP membership request flow  
**Reference frame(s):** `VIP frames ~12:00`  
**Current G-Play screen/file:** `VipSheet.jsx`  
**Severity:** High  
**Type:** Feature  
**Description:** VIP sheet: tier cards, purchase, membership request pending state.  
**Expected WePlay behavior:** Request VIP → pending badge on profile.  
**Current G-Play behavior:** VipSheet exists; request flow UI may differ.  
**Evidence:** VipSheet.jsx  
**Likely files to inspect:** VipSheet.jsx, vipStatus.js  
**Implementation notes:** Match request states  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 7  

---

### GAP-067

**ID:** GAP-067  
**Category:** Shop  
**Screen:** Avatar shop Boy/Girl  
**Reference frame(s):** `frame_002000.jpg (~16:40)`  
**Current G-Play screen/file:** `ShopSheet.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Avatar shop with Boy/Girl tabs and rarity tiers A/B/C.  
**Expected WePlay behavior:** Gender tabs + rarity labels on items.  
**Current G-Play behavior:** ShopSheet Decorations may not match avatar shop layout.  
**Evidence:** frame_002000  
**Likely files to inspect:** ShopSheet.jsx, userShopInventory.js  
**Implementation notes:** Dedicated avatar shop route  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 7  

---

### GAP-068

**ID:** GAP-068  
**Category:** Shop  
**Screen:** Chat Bubble catalog  
**Reference frame(s):** `frame_001800.jpg (~15:00)`  
**Current G-Play screen/file:** `ShopSheet.jsx (missing screen)`  
**Severity:** Critical  
**Type:** Feature  
**Description:** Dedicated Chat Bubble shop grid with coin/VIP/Family source tags.  
**Expected WePlay behavior:** 3-column grid; preview bubble with 'WePlay' text; price tags.  
**Current G-Play behavior:** No ChatBubbleShop component; ShopSheet has no Chat Bubble category matching reference.  
**Evidence:** frame_001800; grep ChatBubble in src — none  
**Likely files to inspect:** New ChatBubbleShop.jsx, ShopSheet.jsx  
**Implementation notes:** Inventory + equip bubble per chat  
**Dependencies:** None  
**Risk:** High  
**Suggested sprint:** Sprint 7  

---

### GAP-069

**ID:** GAP-069  
**Category:** VIP  
**Screen:** VIP badge on names  
**Reference frame(s):** `room/chat frames`  
**Current G-Play screen/file:** `VipDisplayName.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** VIP users show crown/color on display names in room and rankings.  
**Expected WePlay behavior:** Gold gradient name + VIP icon.  
**Current G-Play behavior:** VipDisplayName used in some places; not universal in room chat.  
**Evidence:** VipDisplayName.jsx usage grep  
**Likely files to inspect:** VipDisplayName.jsx, RoomView.jsx  
**Implementation notes:** Apply across chat bubbles  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 7  

---

### GAP-070

**ID:** GAP-070  
**Category:** Wallet  
**Screen:** Coin shop recharge packs  
**Reference frame(s):** `wallet frames`  
**Current G-Play screen/file:** `CoinShopSheet.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Coin recharge grid with bonus badges and first-purchase promo.  
**Expected WePlay behavior:** Pack tiles with +bonus% ribbons.  
**Current G-Play behavior:** CoinShopSheet exists; promo ribbon art differs.  
**Evidence:** CoinShopSheet.jsx  
**Likely files to inspect:** CoinShopSheet.jsx  
**Implementation notes:** Match pack artwork  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 7  

---

### GAP-071

**ID:** GAP-071  
**Category:** BFF  
**Screen:** To Unlock slot screen  
**Reference frame(s):** `frame_001500.jpg (~12:30)`  
**Current G-Play screen/file:** `BffSheet.jsx (missing screen)`  
**Severity:** Critical  
**Type:** Feature  
**Description:** New BFF → To Unlock tab lists relationships needing slot unlock with Unlock buttons.  
**Expected WePlay behavior:** Tabs: BFF Invitation | To Unlock; list rows with relationship type text + teal Unlock pill.  
**Current G-Play behavior:** BffSheet shows grid of active BFFs only; no To Unlock tab or unlock purchase flow.  
**Evidence:** frame_001500; BffSheet.jsx has no To Unlock  
**Likely files to inspect:** New BffUnlockSheet.jsx, BffSheet.jsx, relationships.js  
**Implementation notes:** Slot unlock consumes tokens/coins  
**Dependencies:** None  
**Risk:** High  
**Suggested sprint:** Sprint 8  

---

### GAP-072

**ID:** GAP-072  
**Category:** BFF  
**Screen:** BFF Invitation tab  
**Reference frame(s):** `frame_001000.jpg (~08:20)`  
**Current G-Play screen/file:** `BffSheet.jsx`  
**Severity:** High  
**Type:** Feature  
**Description:** BFF Invitation tab to send/manage pending invites.  
**Expected WePlay behavior:** Pending invites list with accept/decline.  
**Current G-Play behavior:** BffSheet lacks invitation tab; redirects to friends toast.  
**Evidence:** BffSheet handleManageSlots toast  
**Likely files to inspect:** BffSheet.jsx  
**Implementation notes:** Invitation inbox + notifications  
**Dependencies:** GAP-071  
**Risk:** Medium  
**Suggested sprint:** Sprint 8  

---

### GAP-073

**ID:** GAP-073  
**Category:** BFF / Intimate  
**Screen:** Intimate Space token wall  
**Reference frame(s):** `frame_000700.jpg (~05:50)`  
**Current G-Play screen/file:** `IntimateSpaceSheet.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Intimate space exclusive gift walls with lock icons per level gate.  
**Expected WePlay behavior:** Token wall grid with locks until level N.  
**Current G-Play behavior:** IntimateSpaceSheet has slot locks; wall art differs from reference.  
**Evidence:** IntimateSpaceSheet.jsx  
**Likely files to inspect:** IntimateSpaceSheet.jsx  
**Implementation notes:** Match wall backgrounds  
**Dependencies:** GAP-071  
**Risk:** Medium  
**Suggested sprint:** Sprint 8  

---

### GAP-074

**ID:** GAP-074  
**Category:** BFF  
**Screen:** BFF Chest rewards  
**Reference frame(s):** `BFF frames`  
**Current G-Play screen/file:** `IntimateSpaceSheet / BffSheet`  
**Severity:** Medium  
**Type:** Feature  
**Description:** BFF Chest button opens daily/weekly bond rewards.  
**Expected WePlay behavior:** Chest icon opens loot modal.  
**Current G-Play behavior:** BFF Chest button missing or stub.  
**Evidence:** Bff reference chest button  
**Likely files to inspect:** BffSheet.jsx  
**Implementation notes:** Chest cooldown + rewards table  
**Dependencies:** GAP-071  
**Risk:** Medium  
**Suggested sprint:** Sprint 8  

---

### GAP-075

**ID:** GAP-075  
**Category:** BFF / Love Home  
**Screen:** Love Home rings display  
**Reference frame(s):** `frame_003400.jpg (~28:20)`  
**Current G-Play screen/file:** `LoveHomeSheet.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Love Home shows equipped rings with item description modal.  
**Expected WePlay behavior:** Ring slots with 3D art; tap → description sheet.  
**Current G-Play behavior:** LoveHomeSheet exists; ring modal art differs.  
**Evidence:** frame_003400  
**Likely files to inspect:** LoveHomeSheet.jsx  
**Implementation notes:** Import ring assets  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 8  

---

### GAP-076

**ID:** GAP-076  
**Category:** BFF / Church  
**Screen:** Church Propose screen  
**Reference frame(s):** `frame_001400.jpg (~11:40)`  
**Current G-Play screen/file:** `ChurchSheet.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Church propose flow with ring selector and CP announcement.  
**Expected WePlay behavior:** Propose UI with ring grid + confirm.  
**Current G-Play behavior:** ChurchSheet has propose; visual parity gaps vs reference.  
**Evidence:** ChurchSheet.jsx  
**Likely files to inspect:** ChurchSheet.jsx  
**Implementation notes:** UI diff pass  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 8  

---

### GAP-078

**ID:** GAP-078  
**Category:** BFF  
**Screen:** Relationship token shop link  
**Reference frame(s):** `BFF shop frames`  
**Current G-Play screen/file:** `ShopSheet Relationship tab`  
**Severity:** Medium  
**Type:** Navigation  
**Description:** BFF flow links to token shop for unlock items.  
**Expected WePlay behavior:** Shop icon in BFF header opens Relationship tab.  
**Current G-Play behavior:** Shop reachable but link from BFF header missing.  
**Evidence:** ShopSheet tabs  
**Likely files to inspect:** BffSheet.jsx, ShopSheet.jsx  
**Implementation notes:** Header shop icon deep link  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 8  

---

### GAP-079

**ID:** GAP-079  
**Category:** BFF  
**Screen:** Bond level badges in chat  
**Reference frame(s):** `frame_002800.jpg YAPPERS badge`  
**Current G-Play screen/file:** `RoomView chat`  
**Severity:** Medium  
**Type:** UI  
**Description:** User titles like YAPPERS display as styled badges beside names in chat.  
**Expected WePlay behavior:** Custom title badges with icons in gift/chat lines.  
**Current G-Play behavior:** Title badges partial via vip/charm; YAPPERS-style custom titles missing.  
**Evidence:** Reference YAPPERS badge on gift line  
**Likely files to inspect:** RoomView.jsx, profile titles  
**Implementation notes:** Title badge component  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 8  

---

### GAP-080

**ID:** GAP-080  
**Category:** BFF  
**Screen:** Couple rankings integration  
**Reference frame(s):** `rankings couple tab`  
**Current G-Play screen/file:** `RankingsSheet couple tab`  
**Severity:** Medium  
**Type:** Data Wiring  
**Description:** Couple rank tab shows bonded pairs with heart overlay avatars.  
**Expected WePlay behavior:** Paired avatars with heart connector in list.  
**Current G-Play behavior:** Couple tab exists; pair avatar layout differs.  
**Evidence:** RankingsSheet couple render  
**Likely files to inspect:** RankingsSheet.jsx  
**Implementation notes:** Match paired avatar UI  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 8  

---

### GAP-081

**ID:** GAP-081  
**Category:** Clan / Family  
**Screen:** Family Sign badge editor  
**Reference frame(s):** `frame_001600.jpg (~13:20)`  
**Current G-Play screen/file:** `ClanManageTab.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Family Sign is graphical badge editor (icon+text tag) not plain text field.  
**Expected WePlay behavior:** Red YAPPERS sword tag preview; tap opens badge editor.  
**Current G-Play behavior:** ClanManageTab uses text input sign_label only — no graphical sign editor.  
**Evidence:** frame_001600 vs ClanManageTab sign_label input  
**Likely files to inspect:** ClanManageTab.jsx, clans.js  
**Implementation notes:** Badge composer UI + PNG export  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 9  

---

### GAP-082

**ID:** GAP-082  
**Category:** Clan  
**Screen:** Required Charm gate UI  
**Reference frame(s):** `frame_001600.jpg`  
**Current G-Play screen/file:** `ClanManageTab.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Required Charm row shows charm level badge icon + 'above' label.  
**Expected WePlay behavior:** Purple star badge LV19 + 'above' text.  
**Current G-Play behavior:** min_charm_level numeric input without badge preview.  
**Evidence:** ClanManageTab minCharm field  
**Likely files to inspect:** ClanManageTab.jsx  
**Implementation notes:** Charm level badge picker  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 9  

---

### GAP-083

**ID:** GAP-083  
**Category:** Clan  
**Screen:** Access to steal toggle  
**Reference frame(s):** `frame_001600.jpg`  
**Current G-Play screen/file:** `ClanManageTab.jsx`  
**Severity:** Medium  
**Type:** Feature  
**Description:** Access to steal prohibition toggle for clan members.  
**Expected WePlay behavior:** Toggle: prohibit stealing feature for all members.  
**Current G-Play behavior:** No steal toggle in ClanManageTab.  
**Evidence:** frame_001600 Access to steal section  
**Likely files to inspect:** ClanManageTab.jsx, clans schema  
**Implementation notes:** Add allow_stealing column  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 9  

---

### GAP-084

**ID:** GAP-084  
**Category:** Clan  
**Screen:** Clan chest / store / gacha  
**Reference frame(s):** `clan profile tab`  
**Current G-Play screen/file:** `ClanProfileTab.jsx PERK_STUBS`  
**Severity:** Critical  
**Type:** Feature  
**Description:** Clan chest, store, gacha perks are functional not stubs.  
**Expected WePlay behavior:** Open chest → rewards; store purchases; gacha pull animation.  
**Current G-Play behavior:** PERK_STUBS toast 'Coming soon' on chest/store/gacha.  
**Evidence:** ClanProfileTab.jsx PERK_STUBS  
**Likely files to inspect:** ClanProfileTab.jsx, clans.js  
**Implementation notes:** Economy + inventory integration  
**Dependencies:** None  
**Risk:** High  
**Suggested sprint:** Sprint 9  

---

### GAP-085

**ID:** GAP-085  
**Category:** Clan  
**Screen:** Manage tab notification dot  
**Reference frame(s):** `frame_001600.jpg`  
**Current G-Play screen/file:** `ClanHubSheet.jsx tabs`  
**Severity:** Low  
**Type:** UI  
**Description:** Manage tab shows red dot when applications pending.  
**Expected WePlay behavior:** Red dot on Manage tab icon.  
**Current G-Play behavior:** Notification dot on manage tab may be missing.  
**Evidence:** ClanHubSheet tab bar  
**Likely files to inspect:** clan/ClanHubSheet.jsx  
**Implementation notes:** Dot when applications.length>0  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 9  

---

### GAP-086

**ID:** GAP-086  
**Category:** Clan  
**Screen:** Family header rank + menu  
**Reference frame(s):** `frame_001600.jpg`  
**Current G-Play screen/file:** `ClanHubSheet header`  
**Severity:** Medium  
**Type:** UI  
**Description:** Family header includes bar chart rank icon and overflow menu.  
**Expected WePlay behavior:** Chart icon + ... menu on header right.  
**Current G-Play behavior:** Clan hub header icons differ.  
**Evidence:** ClanHubSheet header  
**Likely files to inspect:** clan/ClanHubSheet.jsx  
**Implementation notes:** Add rank shortcut icon  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 9  

---

### GAP-087

**ID:** GAP-087  
**Category:** Clan  
**Screen:** Clan sign in room chat  
**Reference frame(s):** `room chat badges`  
**Current G-Play screen/file:** `RoomView chat + clan.sign_label`  
**Severity:** Medium  
**Type:** UI  
**Description:** Clan members show family sign badge next to name in room chat.  
**Expected WePlay behavior:** Mini sign tag beside username.  
**Current G-Play behavior:** clan-sign-label on profile tab only; not in room chat.  
**Evidence:** ClanProfileTab clan-sign-label  
**Likely files to inspect:** RoomView.jsx chat name render  
**Implementation notes:** Pass clan sign in seat/chat meta  
**Dependencies:** GAP-081  
**Risk:** Medium  
**Suggested sprint:** Sprint 9  

---

### GAP-088

**ID:** GAP-088  
**Category:** Clan  
**Screen:** Clan voice room button  
**Reference frame(s):** `clan profile`  
**Current G-Play screen/file:** `ClanProfileTab.jsx`  
**Severity:** Medium  
**Type:** Feature  
**Description:** Clan voice room entry matches WePlay live button styling.  
**Expected WePlay behavior:** Prominent voice room button opens clan room.  
**Current G-Play behavior:** openClanVoiceRoom wired but CSS named stub; styling mismatch.  
**Evidence:** clan-room-stub-btn--live class  
**Likely files to inspect:** ClanProfileTab.jsx  
**Implementation notes:** Rename + restyle button  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 9  

---

### GAP-089

**ID:** GAP-089  
**Category:** Clan  
**Screen:** Clan tasks rewards  
**Reference frame(s):** `clan tasks tab`  
**Current G-Play screen/file:** `ClanTasksTab.jsx`  
**Severity:** Medium  
**Type:** Data Wiring  
**Description:** Clan task tab shows progress bars and claim buttons like WePlay.  
**Expected WePlay behavior:** Daily clan missions with coin/clan exp rewards.  
**Current G-Play behavior:** ClanTasksTab exists; reward visuals differ.  
**Evidence:** ClanTasksTab.jsx  
**Likely files to inspect:** ClanTasksTab.jsx, gameTasks.js  
**Implementation notes:** UI parity pass  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 9  

---

### GAP-090

**ID:** GAP-090  
**Category:** Clan  
**Screen:** Clan news feed  
**Reference frame(s):** `clan news tab`  
**Current G-Play screen/file:** `ClanNewsTab.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Clan news tab milestone cards with illustrations.  
**Expected WePlay behavior:** News cards with icons and timestamps.  
**Current G-Play behavior:** ClanNewsTab uses text posts; illustration cards differ.  
**Evidence:** ClanNewsTab.jsx  
**Likely files to inspect:** ClanNewsTab.jsx  
**Implementation notes:** Card template components  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 9  

---

### GAP-091

**ID:** GAP-091  
**Category:** Mini-games  
**Screen:** UNO / Ludo / lobby games  
**Reference frame(s):** `frame_000068.jpg + catalog.js`  
**Current G-Play screen/file:** `games/catalog.js`  
**Severity:** Critical  
**Type:** Feature  
**Description:** UNO, Ludo, Jackaroo, Spy, Mic Grab etc. playable or hidden — not eternal coming soon.  
**Expected WePlay behavior:** Games marked live in WePlay home grid must be playable or removed from marketing grid.  
**Current G-Play behavior:** uno/ludo live:false; lobby grid omits most WePlay titles.  
**Evidence:** catalog.js live:false; frame_000068  
**Likely files to inspect:** games/catalog.js, lobbyGames.js  
**Implementation notes:** Phased game delivery plan  
**Dependencies:** GAP-041  
**Risk:** High  
**Suggested sprint:** Sprint 10  

---

### GAP-092

**ID:** GAP-092  
**Category:** Splash / Login  
**Screen:** Branded splash + login  
**Reference frame(s):** `frame_000005.jpg (~00:02)`  
**Current G-Play screen/file:** `LoginScreen.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** WePlay splash: white screen, star mascot logo, WePlay wordmark; login options beyond Google-only.  
**Expected WePlay behavior:** Branded splash animation; phone/social login buttons.  
**Current G-Play behavior:** LoginScreen is Google OAuth centered; no WePlay-style splash/logo sequence.  
**Evidence:** frame_000005 vs LoginScreen.jsx  
**Likely files to inspect:** LoginScreen.jsx, App.jsx booting state  
**Implementation notes:** Brand assets + optional splash delay  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 10  

---

### GAP-093

**ID:** GAP-093  
**Category:** Settings  
**Screen:** Region selector with search  
**Reference frame(s):** `frame_000150.jpg (~01:15)`  
**Current G-Play screen/file:** `LanguageSheet.jsx / profile region`  
**Severity:** Medium  
**Type:** Feature  
**Description:** Region/country selector with search field for rankings and content locale.  
**Expected WePlay behavior:** Searchable region list modal.  
**Current G-Play behavior:** LanguageSheet handles language; region search may be absent.  
**Evidence:** frame_000150  
**Likely files to inspect:** LanguageSheet.jsx, profile region field  
**Implementation notes:** Add region picker  
**Dependencies:** GAP-063  
**Risk:** Medium  
**Suggested sprint:** Sprint 10  

---

### GAP-094

**ID:** GAP-094  
**Category:** Settings  
**Screen:** Safety Center illustrated banners  
**Reference frame(s):** `frame_002200.jpg (~18:20)`  
**Current G-Play screen/file:** `SecurityCenterSheet.jsx`  
**Severity:** High  
**Type:** UI  
**Description:** Safety Center shows five illustrated gradient banners (Youth Mode, scams, privacy…).  
**Expected WePlay behavior:** Large colorful banner cards with mascots; tap opens article.  
**Current G-Play behavior:** SecurityCenterSheet is text bullet list only — no illustrated banners.  
**Evidence:** frame_002200 vs SecurityCenterSheet TIPS list  
**Likely files to inspect:** SecurityCenterSheet.jsx  
**Implementation notes:** Replace with banner list + deep links  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 10  

---

### GAP-095

**ID:** GAP-095  
**Category:** Settings  
**Screen:** Message blacklist screen  
**Reference frame(s):** `frame_002300.jpg (~19:10)`  
**Current G-Play screen/file:** `BlockedUsersSheet.jsx`  
**Severity:** Medium  
**Type:** Feature  
**Description:** Dedicated message blacklist management screen from settings.  
**Expected WePlay behavior:** Blacklist UI separate from blocked users with keyword filters.  
**Current G-Play behavior:** BlockedUsersSheet exists; keyword blacklist may be missing.  
**Evidence:** frame_002300  
**Likely files to inspect:** BlockedUsersSheet.jsx, SecurityCenterSheet.jsx  
**Implementation notes:** Keyword block list  
**Dependencies:** None  
**Risk:** Medium  
**Suggested sprint:** Sprint 10  

---

### GAP-096

**ID:** GAP-096  
**Category:** Settings  
**Screen:** Parental controls parity  
**Reference frame(s):** `parental frames`  
**Current G-Play screen/file:** `ParentalControlSheet.jsx`  
**Severity:** Medium  
**Type:** Feature  
**Description:** Parental control PIN, time limits, feature locks matching WePlay Youth Mode link.  
**Expected WePlay behavior:** PIN gate + restricted features list.  
**Current G-Play behavior:** ParentalControlSheet exists; depth vs WePlay Youth Mode unclear.  
**Evidence:** ParentalControlSheet.jsx  
**Likely files to inspect:** ParentalControlSheet.jsx  
**Implementation notes:** Cross-link Youth Mode banner  
**Dependencies:** GAP-094  
**Risk:** Medium  
**Suggested sprint:** Sprint 10  

---

### GAP-097

**ID:** GAP-097  
**Category:** Polish  
**Screen:** Bottom nav label branding  
**Reference frame(s):** `frame_000068.jpg`  
**Current G-Play screen/file:** `LobbyScreen.jsx bottom nav`  
**Severity:** Low  
**Type:** UI  
**Description:** First tab labeled 'WePlay' with controller icon in reference; G-Play uses 'G-play'.  
**Expected WePlay behavior:** Brand decision: match WePlay or keep G-play — document intentional delta if kept.  
**Current G-Play behavior:** Label is 'G-play' in LobbyScreen nav config.  
**Evidence:** LobbyScreen bottom nav labels  
**Likely files to inspect:** LobbyScreen.jsx  
**Implementation notes:** Product decision required  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 10  

---

### GAP-098

**ID:** GAP-098  
**Category:** Polish  
**Screen:** Teal accent token consistency  
**Reference frame(s):** `multiple frames`  
**Current G-Play screen/file:** `App.css theme`  
**Severity:** Medium  
**Type:** UI  
**Description:** WePlay primary accent ~#00CED1/teal used on tabs, buttons, active pills consistently.  
**Expected WePlay behavior:** Teal active tab underline, outline buttons.  
**Current G-Play behavior:** G-play uses mixed purple/pink/teal — inconsistent vs reference.  
**Evidence:** App.css --accent tokens  
**Likely files to inspect:** App.css  
**Implementation notes:** Define --weplay-teal token  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 10  

---

### GAP-099

**ID:** GAP-099  
**Category:** Polish  
**Screen:** Sheet animation timing  
**Reference frame(s):** `sheets throughout`  
**Current G-Play screen/file:** `App.css .gplay-mobile-shell`  
**Severity:** Medium  
**Type:** Animation  
**Description:** Bottom sheets slide up with spring easing matching iOS WePlay.  
**Expected WePlay behavior:** ~300ms spring slide; backdrop fade.  
**Current G-Play behavior:** Sheets use CSS transitions; timing may feel snappier/flatter.  
**Evidence:** App.css sheet transitions  
**Likely files to inspect:** App.css  
**Implementation notes:** Tune cubic-bezier  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 10  

---

### GAP-100

**ID:** GAP-100  
**Category:** Polish  
**Screen:** Empty states illustrations  
**Reference frame(s):** `empty states across app`  
**Current G-Play screen/file:** `Various *.jsx`  
**Severity:** Low  
**Type:** UI  
**Description:** Empty lists show mascot illustration + CTA copy like WePlay.  
**Expected WePlay behavior:** Illustrated empty state per module.  
**Current G-Play behavior:** Many screens use text-only 'No items yet'.  
**Evidence:** weplay-subpage-empty class usage  
**Likely files to inspect:** Multiple components  
**Implementation notes:** EmptyState illustration component  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 10  

---

### GAP-101

**ID:** GAP-101  
**Category:** Voice Room / Dock  
**Screen:** Dock icon order and styling  
**Reference frame(s):** `frame_000300.jpg, frame_002800.jpg`  
**Current G-Play screen/file:** `RoomDock.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Bottom dock icon order must be speaker, mic, Type field, gift, camera, grid — with pink gift and dark input pill.  
**Expected WePlay behavior:** Left: speaker + mic; center: dark rounded Type… input with emoji; right: pink gift, camera, 4-square grid.  
**Current G-Play behavior:** RoomDock layout exists but icon order/sizes differ; gift button pink styling partially in App.css.  
**Evidence:** Reference dock layout in frame_000300/002800; RoomDock.jsx markup audit.  
**Likely files to inspect:** src/components/RoomDock.jsx, src/App.css (.room-dock--G-play)  
**Implementation notes:** Match icon order exactly for muscle memory parity  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 1 extension  

---

### GAP-102

**ID:** GAP-102  
**Category:** Voice Room / Chat  
**Screen:** Gift message pill animation  
**Reference frame(s):** `frame_002800.jpg`  
**Current G-Play screen/file:** `RoomView gift chat lines`  
**Severity:** Medium  
**Type:** Animation  
**Description:** Gift chat lines show floating 2D gift icon (e.g., pill emoji) animating near message.  
**Expected WePlay behavior:** Small gift sprite floats beside Sent X gift chat row.  
**Current G-Play behavior:** Gift chat bubbles show text; floating sprite animation not present.  
**Evidence:** frame_002800 pill icon floating near gift message.  
**Likely files to inspect:** RoomView.jsx, GiftHitFx.jsx  
**Implementation notes:** Reuse GiftHitFx for inline chat sprites  
**Dependencies:** GAP-030  
**Risk:** Low  
**Suggested sprint:** Sprint 3 extension  

---

### GAP-103

**ID:** GAP-103  
**Category:** Home / Lobby  
**Screen:** Game Rooms entry button  
**Reference frame(s):** `frame_000068.jpg`  
**Current G-Play screen/file:** `LobbyGamesSection.jsx header`  
**Severity:** Medium  
**Type:** Navigation  
**Description:** Games header includes 'Game Rooms' button with door icon opening live game room list.  
**Expected WePlay behavior:** Top-right Game Rooms chip navigates to aggregated game lobbies.  
**Current G-Play behavior:** No Game Rooms button beside Games title in LobbyGamesSection.  
**Evidence:** frame_000068 shows Game Rooms with door icon top-right of Games header.  
**Likely files to inspect:** LobbyGamesSection.jsx, LobbyScreen.jsx  
**Implementation notes:** New GameRoomsSheet listing active game tables  
**Dependencies:** GAP-041  
**Risk:** Medium  
**Suggested sprint:** Sprint 5 extension  

---

### GAP-104

**ID:** GAP-104  
**Category:** Rankings  
**Screen:** Family tab label  
**Reference frame(s):** `frame_000100.jpg`  
**Current G-Play screen/file:** `RankingsSheet.jsx`  
**Severity:** Low  
**Type:** UI  
**Description:** Rankings primary tab reads 'Family' in WePlay reference but G-Play uses 'Clan'.  
**Expected WePlay behavior:** Tab label 'Family' (or localized equivalent) matching WePlay.  
**Current G-Play behavior:** Rankings tab key clan labeled 'Clan' in RankingsSheet.  
**Evidence:** frame_000100 tabs list ends with Family; RankingsSheet uses Clan.  
**Likely files to inspect:** RankingsSheet.jsx  
**Implementation notes:** Product copy decision — Family vs Clan  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 7 extension  

---

### GAP-105

**ID:** GAP-105  
**Category:** Clan / Family  
**Screen:** Manage section headers  
**Reference frame(s):** `frame_001600.jpg`  
**Current G-Play screen/file:** `ClanManageTab.jsx`  
**Severity:** Low  
**Type:** UI  
**Description:** Manage settings sections use vertical cyan bar + bold section title styling.  
**Expected WePlay behavior:** Cyan vertical accent bar before section labels (Family Sign, Application Settings…).  
**Current G-Play behavior:** ClanManageTab uses plain form labels without accent bars.  
**Evidence:** frame_001600 section header styling.  
**Likely files to inspect:** ClanManageTab.jsx, App.css  
**Implementation notes:** CSS ::before accent bar on .clan-manage-section  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 9 extension  

---

### GAP-106

**ID:** GAP-106  
**Category:** Voice Room / Chat  
**Screen:** Owner used drawing system line  
**Reference frame(s):** `frame_002800.jpg`  
**Current G-Play screen/file:** `roomLog.js`  
**Severity:** Medium  
**Type:** Feature  
**Description:** System chat must post 'Owner used drawing widget' when widget opened.  
**Expected WePlay behavior:** Exact system line on widget open/close/finish events.  
**Current G-Play behavior:** No drawing widget events — system lines absent.  
**Evidence:** frame_002800 System: Owner used drawing widget  
**Likely files to inspect:** roomLog.js, DrawingWidget (GAP-011)  
**Implementation notes:** Implement with GAP-011  
**Dependencies:** GAP-011  
**Risk:** Low  
**Suggested sprint:** Sprint 2 extension  

---

### GAP-107

**ID:** GAP-107  
**Category:** Shop  
**Screen:** Chat bubble inventory backpack  
**Reference frame(s):** `frame_001800.jpg`  
**Current G-Play screen/file:** `InventorySheet.jsx`  
**Severity:** Medium  
**Type:** Navigation  
**Description:** Chat Bubble shop header orange backpack icon opens owned bubble inventory.  
**Expected WePlay behavior:** Backpack icon top-right → My Chat Bubbles inventory equip screen.  
**Current G-Play behavior:** InventorySheet exists but no Chat Bubble category equip flow from dedicated shop.  
**Evidence:** frame_001800 orange backpack icon header right.  
**Likely files to inspect:** InventorySheet.jsx, ChatBubbleShop (GAP-068)  
**Implementation notes:** Filter inventory type=chat_bubble  
**Dependencies:** GAP-068  
**Risk:** Medium  
**Suggested sprint:** Sprint 7 extension  

---

### GAP-108

**ID:** GAP-108  
**Category:** Notifications  
**Screen:** Discover tab red dot  
**Reference frame(s):** `frame_000068.jpg`  
**Current G-Play screen/file:** `LobbyScreen.jsx bottom nav`  
**Severity:** Low  
**Type:** UI  
**Description:** Discover bottom nav icon shows red notification dot for unseen discover content.  
**Expected WePlay behavior:** Red dot on Discover tab when new spotlight/moments content.  
**Current G-Play behavior:** Chats has unread badge; Discover dot logic may be incomplete.  
**Evidence:** frame_000068 Discover icon has red dot.  
**Likely files to inspect:** LobbyScreen.jsx, ExploreTab.jsx  
**Implementation notes:** Track lastSeenMoments timestamp  
**Dependencies:** GAP-051  
**Risk:** Low  
**Suggested sprint:** Sprint 6 extension  

---

### GAP-109

**ID:** GAP-109  
**Category:** Chat / DM  
**Screen:** Incoming avatar ornate frame  
**Reference frame(s):** `frame_000500.jpg (~04:10)`  
**Current G-Play screen/file:** `PersonalChat.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Incoming DM avatars show ornate gold circular VIP/charm frame around profile photo.  
**Expected WePlay behavior:** Gold decorative ring with flourishes on other user's avatar in DM thread.  
**Current G-Play behavior:** PersonalChat renders plain circular avatars without equipped frame overlay.  
**Evidence:** frame_000500 incoming message avatar has elaborate gold frame; PersonalChat avatar markup lacks frame layer.  
**Likely files to inspect:** PersonalChat.jsx, AvatarImg.jsx, inventory frame equip logic  
**Implementation notes:** Reuse profile equipped frame asset on chat avatars when viewer has frame data  
**Dependencies:** GAP-067 avatar shop  
**Risk:** Low  
**Suggested sprint:** Sprint 4 extension  

---

### GAP-110

**ID:** GAP-110  
**Category:** BFF / Love Home  
**Screen:** Love Home Love/Blessing stats  
**Reference frame(s):** `frame_003400.jpg (~28:20)`  
**Current G-Play screen/file:** `LoveHomeSheet.jsx`  
**Severity:** Medium  
**Type:** UI  
**Description:** Love Home header shows Love and Blessing numeric counters beside cover photo.  
**Expected WePlay behavior:** Right column stats: Love 153686, Blessing 4258 with labels.  
**Current G-Play behavior:** LoveHomeSheet may show bond info but Love/Blessing counter strip layout differs or is absent.  
**Evidence:** frame_003400 top-right stat rows; audit LoveHomeSheet header metrics.  
**Likely files to inspect:** LoveHomeSheet.jsx, relationships.js  
**Implementation notes:** Wire love_points / blessing_points from bond aggregate tables  
**Dependencies:** GAP-075  
**Risk:** Medium  
**Suggested sprint:** Sprint 8 extension  

---

### GAP-111

**ID:** GAP-111  
**Category:** Chat / DM  
**Screen:** DM input bar sticker entry  
**Reference frame(s):** `frame_000500.jpg`  
**Current G-Play screen/file:** `PersonalChat.jsx`  
**Severity:** Low  
**Type:** UI  
**Description:** DM composer left icon opens sticker/ghost panel (distinct from emoji inside input).  
**Expected WePlay behavior:** Leftmost ghost/sticker icon; emoji picker inside Type field; gift + plus on right.  
**Current G-Play behavior:** PersonalChat dock may omit left sticker icon or reorder icons vs reference.  
**Evidence:** frame_000500 bottom bar icon order: ghost left, emoji in field, gift, plus.  
**Likely files to inspect:** PersonalChat.jsx, StickerPanel.jsx, App.css  
**Implementation notes:** Match icon order and wire StickerPanel from DM context  
**Dependencies:** None  
**Risk:** Low  
**Suggested sprint:** Sprint 4 extension  

---

## Second-pass review notes (2026-06-14)

Added **GAP-101–GAP-111** after re-checking reference frames against G-Play source. Original backlog preserved except **GAP-001, GAP-007, GAP-077** removed as intentional 14-seat layout design. Key additions: dock icon parity, Game Rooms button, drawing widget system lines, Chat Bubble inventory backpack, Discover notification dot, DM avatar frames, Love Home stats, DM sticker entry.

---

