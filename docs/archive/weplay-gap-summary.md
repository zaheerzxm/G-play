# WePlay vs G-Play — Gap Analysis Summary

**Date:** 2026-06-14  
**Reference source:** `.reference/screen-recording-frames/` (3,354 JPG frames, 28:30 screen recording, `FRAME_INDEX.md`)  
**G-Play inspected via:** source code audit + local dev server at `http://localhost:5173` (HTTP 302 redirect active)  
**Scope:** Documentation only — no implementation

---

## Methodology

1. **Reference frames:** Sampled and categorized frames across the full timeline (frames 000005–003400+), plus frame index timestamps. Categories mapped to WePlay modules (splash, lobby, voice room, gifts, profile, BFF, clan, settings, etc.).
2. **G-Play code:** Inspected `App.jsx`, `LobbyScreen.jsx`, `RoomView.jsx`, gift/profile/social/clan/game modules, and `App.css`.
3. **Comparison rule:** Each gap is logged only when a concrete difference is evidenced by a reference frame **and** a G-Play file/screen — not assumed from memory.

---

## Headline counts

| Severity | Count | Examples |
|----------|------:|----------|
| **Critical** | 11 | Missing WePlay games, drawing widget, room invite cards in DM, clan perk store, group chat |
| **High** | 37 | YouTube-in-room, chat jump pill, PLAY Show rankings UI, BFF unlock flow |
| **Medium** | 35 | Spacing, badges, carousel banners, emoji sticker panel layout, settings list styling |
| **Low** | 15 | Tab labels, microcopy, minor icon differences |
| **Total gaps (active)** | **108** | GAP-002–GAP-111 minus excluded GAP-001, GAP-007, GAP-077 |

---

## What G-Play already matches (not gaps)

These were verified in code and **not** logged as missing features (visual polish gaps may still exist):

- Bottom nav: Home / Voice Room / Chats / Discover / Me (`LobbyScreen.jsx`)
- Voice room list tabs: Related / All / Popular + Related subtabs Recents / Join / Following
- Gift sheet tabs Package / Gift / Special / VIP + anonymous toggle (`GiftSheet.jsx`)
- Room settings toggles: high quality, ban chat/images/red packet, partner seat (`RoomSettingsSheet.jsx`)
- Rankings tabs: Popularity, VIP, Couple, Room, BFF, Clan, PLAY + time filters (`RankingsSheet.jsx`)
- Core live mini-games: Trivia, Draw, Wordle, Mafia, DDD (`games/catalog.js`)
- Intimate Space, Love Home, Church, Clan hub sheets (partial/stub areas noted as gaps)

---

## Intentional G-Play design (not gaps)

| Topic | Notes |
|-------|--------|
| **14-seat normal room** | G-Play uses 2+4+4+4 seats intentionally — not WePlay's smaller grid. Excluded: GAP-001, GAP-007, GAP-077 |
| **DM coin transfers** | Red packet only in chat — no separate send-coins button |
| **Voice room chat timestamps** | Omitted in room chat intentionally |
| **Walkie talkie** | `WalkieTalkieOverlay` — intentional G-Play feature |

---

## Priority order (implementation)

1. Core voice room UI & stage layout (header, backdrop, widgets — not seat count)  
2. Host/admin seat controls (lock, invite — not layout change)  
3. Chat + floating messages  
4. Gifts + gift wall  
5. Profile + spotlight/moments  
6. Friends / invites / online navigation  
7. VIP / badges / levels  
8. Tasks  
9. Mini-games catalog parity  
10. Polish + animations  

---

## Sprint overview

| Sprint | Name | Gaps | Risk |
|--------|------|------|------|
| 1 | Core Room Parity | GAP-002–010, GAP-101 (excl. seat layout) | High |
| 2 | Room Interactions | GAP-011–020 | High |
| 3 | Gifts & Animations | GAP-021–030 | Medium |
| 4 | Chat & DM Parity | GAP-031–040 | Medium |
| 5 | Lobby & Discovery | GAP-041–050 | Medium |
| 6 | Profile & Spotlight | GAP-051–060 | Medium |
| 7 | Rankings & VIP | GAP-061–070 | Medium |
| 8 | BFF & Relationships | GAP-071–076, GAP-078–080, GAP-110 | High |
| 9 | Clan / Family | GAP-081–090 | Medium |
| 10 | Games & Polish | GAP-091–100 | High |

Full gap entries: [`weplay-gap-analysis.md`](./weplay-gap-analysis.md)  
Sprint details: [`weplay-gap-sprints.md`](./weplay-gap-sprints.md)

---

## Top 10 critical gaps to fix first

1. **GAP-011** — In-room drawing widget overlay (WePlay frame 002800) — not in G-Play  
2. **GAP-021** — Gift send footer layout (coin + anonymous + qty + pink Send) visual parity  
3. **GAP-031** — DM voice-room invite card visual parity  
4. **GAP-041** — Home games grid missing ~10+ WePlay titles (Spy, Ludo live, Mic Grab, etc.)  
5. **GAP-051** — Moments feed visual parity with WePlay Discover row  
6. **GAP-061** — Rankings dark purple podium UI vs G-Play sheet styling  
7. **GAP-071** — BFF “To Unlock” slot management screen  
8. **GAP-081** — Clan Family Sign badge editor  
9. **GAP-091** — UNO / Ludo / Jackaroo etc. marked coming soon  
10. **GAP-039** — Group chat creation still stubbed  

---

## Second-pass additions (GAP-101–111)

Added after re-reviewing reference frames — **no original gaps removed**:

| ID | Area | Why missed first pass |
|----|------|------------------------|
| GAP-101 | Room dock icon order | Dock layout not diffed frame-by-frame initially |
| GAP-102 | Gift chat sprite animation | Visible only in frame_002800 gift line |
| GAP-103 | Game Rooms header button | Partially obscured by GOLD RUSH banner in frame_000068 |
| GAP-104 | Rankings "Family" tab label | Copy difference vs G-Play "Clan" |
| GAP-105 | Clan manage section accent bars | Small UI detail in frame_001600 |
| GAP-106 | Drawing widget system lines | Depends on GAP-011 discovery |
| GAP-107 | Chat bubble backpack inventory | Header icon in frame_001800 |
| GAP-108 | Discover tab notification dot | Bottom nav detail in frame_000068 |
| GAP-109 | DM avatar gold frame | frame_000500 ornate avatar ring |
| GAP-110 | Love Home Love/Blessing stats | frame_003400 header counters |
| GAP-111 | DM sticker ghost icon | frame_000500 composer layout |

---

## Limitations of this analysis

- Not every one of 3,354 frames was manually viewed; sampling used `FRAME_INDEX.md` timestamps + ~40 representative frames per module.
- G-Play local screenshots were **not** saved to `docs/` (browser capture not run); evidence cites source files + reference frame filenames.
- Some WePlay features may exist under different names in G-Play — each gap cites both sides.
