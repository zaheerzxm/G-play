# WePlay Gap Validation Report (v1 GAP-002–GAP-111)

**Date:** 2026-06-14  
**Purpose:** Validate existing gap backlog against v2 parity audit. **Does not modify gap entries.**  

---

## Summary

| Metric | Count |
|--------|------:|
| GAP entries reviewed | 108 |
| VALIDATED | 93 |
| INVALID | 1 |
| DUPLICATE | 2 |
| NEEDS SPLITTING | 12 |
| New PARITY findings | 25 |
| Excluded (intentional) | GAP-001, GAP-007, GAP-077 (14-seat layout) |

---

## Final report (Phase 2)

| # | Metric | Value |
|---|--------|------:|
| 1 | **Validated gaps** | 93 / 108 active GAP entries |
| 2 | **New gaps found (v2)** | 25 (`PARITY-001`–`PARITY-025`) |
| 3 | **Duplicates** | 2 (GAP-037/GAP-109, GAP-102/GAP-030) |
| 4 | **Incorrect assumptions** | 5 documented below + 1 INVALID gap |
| 5 | **Estimated overall parity** | **~69%** (see `weplay-parity-audit-v2.md`) |

**Parity by area:** Voice Room 72% · Lobby 81% · Chat 88% · Gifts 76% · Profile 63% · Rankings/VIP/Shop 68% · BFF 58% · Clan 52% · Settings/Privacy 41% · Games 48%

---

- **GAP-103:** Game Rooms button EXISTS in LobbyGamesSection.jsx lines 30-34

## DUPLICATE gaps

- **GAP-037:** Overlaps GAP-109 floating badge — merge visually
- **GAP-102:** Overlaps GAP-030 gift chat feedback/sprites — consolidate

## NEEDS SPLITTING

- **GAP-015:** Membership fees + associated groups + records are 3 features; only partially missing
- **GAP-016:** Lottery needs separate modal gap (→ PARITY-003); dice/coin toss separate
- **GAP-020:** Group button + associated groups dependency
- **GAP-030:** Charm feedback + PARITY-014 Gold feedback
- **GAP-034:** Alias/wallpaper/block invites exist; gaming invite block may be partial
- **GAP-039:** Group chat stub + PARITY-004 clan gift/donation messages
- **GAP-049:** Tile badge + PARITY-017 floater
- **GAP-057:** Country + bio + crop — crop exists in AvatarCropModal
- **GAP-061:** Dark bg + podium + list frames + footer — multiple sub-issues; footer CTA exists
- **GAP-095:** Message blacklist exists as BlockedUsersSheet; keyword blacklist missing
- **GAP-096:** Parental controls + Youth Mode link to PARITY-001 privacy
- **GAP-111:** Sticker icon layout + PARITY-008 full sticker sheet

---

## Full validation table

| GAP ID | Verdict | Notes |
|--------|---------|-------|
| GAP-002 | VALIDATED | Header metadata gaps confirmed vs frame_000300 |
| GAP-003 | VALIDATED | Empty seat styling — intentional 14-seat layout unchanged |
| GAP-004 | VALIDATED | Locked seat padlock styling |
| GAP-005 | VALIDATED | Champagne illustration vs CSS gradient |
| GAP-006 | VALIDATED | Beats & Dance + treasure widgets missing |
| GAP-008 | VALIDATED | Minimize chip visual differs |
| GAP-009 | VALIDATED | Diamond badge vs progress bar |
| GAP-010 | VALIDATED | Audience strip layout |
| GAP-011 | VALIDATED | Drawing widget confirmed missing — frame_002800 |
| GAP-012 | VALIDATED | System chat prefix/link |
| GAP-013 | VALIDATED | Jump-to-bottom pill missing in RoomView |
| GAP-014 | VALIDATED | High quality system line |
| GAP-015 | NEEDS SPLITTING | Membership fees + associated groups + records are 3 features; only partially missing |
| GAP-016 | NEEDS SPLITTING | Lottery needs separate modal gap (→ PARITY-003); dice/coin toss separate |
| GAP-017 | VALIDATED | Pinned owner rules missing |
| GAP-018 | VALIDATED | Scoreboard +/- layout; seat count mirroring N/A (14 intentional) |
| GAP-019 | VALIDATED | Video mode chrome |
| GAP-020 | NEEDS SPLITTING | Group button + associated groups dependency |
| GAP-021 | VALIDATED | Gift footer layout |
| GAP-022 | VALIDATED | Gray-out unaffordable gifts |
| GAP-023 | VALIDATED | Anonymous mask in chat lines |
| GAP-024 | VALIDATED | Qty presets |
| GAP-025 | VALIDATED | Special tab helper |
| GAP-026 | VALIDATED | Premium FX |
| GAP-027 | VALIDATED | Combo button — add PARITY-025 for press model |
| GAP-028 | VALIDATED | DM gift promo banner |
| GAP-029 | VALIDATED | Gift wall badges |
| GAP-030 | NEEDS SPLITTING | Charm feedback + PARITY-014 Gold feedback |
| GAP-031 | VALIDATED | Invite card exists but visual parity gap — summary overstated 'missing' |
| GAP-032 | VALIDATED | Reply UI partial — [[reply]] parsing exists, nested bubble styling differs |
| GAP-033 | VALIDATED | Large sticker no bubble |
| GAP-034 | NEEDS SPLITTING | Alias/wallpaper/block invites exist; gaming invite block may be partial |
| GAP-035 | VALIDATED | Official badge on chat list |
| GAP-036 | VALIDATED | Chats header icons |
| GAP-037 | DUPLICATE | Overlaps GAP-109 floating badge — merge visually |
| GAP-038 | VALIDATED | Muted bell on rows |
| GAP-039 | NEEDS SPLITTING | Group chat stub + PARITY-004 clan gift/donation messages |
| GAP-040 | VALIDATED | Clan chat row styling |
| GAP-041 | VALIDATED | Lobby games catalog |
| GAP-042 | VALIDATED | GOLD RUSH banner |
| GAP-043 | VALIDATED | Pull-to-refresh missing |
| GAP-044 | VALIDATED | Gold Tycoon banner art |
| GAP-045 | VALIDATED | Room card hex badges |
| GAP-046 | VALIDATED | Tag filter pills |
| GAP-047 | VALIDATED | Hub quick links row |
| GAP-048 | VALIDATED | 3D game tile art |
| GAP-049 | NEEDS SPLITTING | Tile badge + PARITY-017 floater |
| GAP-050 | VALIDATED | HOT ROOM banner polish |
| GAP-051 | VALIDATED | Moments discover row |
| GAP-052 | VALIDATED | Cover carousel + 3D hint |
| GAP-053 | VALIDATED | Me tab settings grid |
| GAP-054 | VALIDATED | Inline gift wall preview |
| GAP-055 | VALIDATED | PLAY Show profile entry |
| GAP-056 | VALIDATED | Stats/charm badges |
| GAP-057 | NEEDS SPLITTING | Country + bio + crop — crop exists in AvatarCropModal |
| GAP-058 | VALIDATED | Visitors incognito partial |
| GAP-059 | VALIDATED | Moment composer media |
| GAP-060 | VALIDATED | Spotlight feed cards |
| GAP-061 | NEEDS SPLITTING | Dark bg + podium + list frames + footer — multiple sub-issues; footer CTA exists |
| GAP-062 | VALIDATED | Time filter pill styling |
| GAP-063 | VALIDATED | Global region — implemented as region pill in RankingsSheet |
| GAP-064 | VALIDATED | PLAY Show tab UI |
| GAP-065 | VALIDATED | Help ? icon |
| GAP-066 | VALIDATED | VIP request flow |
| GAP-067 | VALIDATED | Avatar shop Boy/Girl |
| GAP-068 | VALIDATED | Chat Bubble dedicated shop missing |
| GAP-069 | VALIDATED | VIP name styling coverage |
| GAP-070 | VALIDATED | Coin shop pack ribbons |
| GAP-071 | VALIDATED | BFF To Unlock screen |
| GAP-072 | VALIDATED | BFF Invitation tab |
| GAP-073 | VALIDATED | Intimate token wall + PARITY-002 dress tabs |
| GAP-074 | VALIDATED | BFF Chest |
| GAP-075 | VALIDATED | Love Home rings |
| GAP-076 | VALIDATED | Church propose UI |
| GAP-078 | VALIDATED | BFF shop link |
| GAP-079 | VALIDATED | Custom title badges YAPPERS-style |
| GAP-080 | VALIDATED | Couple ranking pairs |
| GAP-081 | VALIDATED | Family Sign graphical editor |
| GAP-082 | VALIDATED | Charm gate badge picker |
| GAP-083 | VALIDATED | Steal prohibition toggle |
| GAP-084 | VALIDATED | Clan chest/store/gacha stubs |
| GAP-085 | VALIDATED | Manage tab dot |
| GAP-086 | VALIDATED | Clan header icons |
| GAP-087 | VALIDATED | Clan sign in room chat |
| GAP-088 | VALIDATED | Clan voice room button styling |
| GAP-089 | VALIDATED | Clan tasks rewards UI |
| GAP-090 | VALIDATED | Clan news cards |
| GAP-091 | VALIDATED | UNO/Ludo/lobby games |
| GAP-092 | VALIDATED | Splash/login branding |
| GAP-093 | VALIDATED | Region search picker |
| GAP-094 | VALIDATED | Safety Center banners |
| GAP-095 | NEEDS SPLITTING | Message blacklist exists as BlockedUsersSheet; keyword blacklist missing |
| GAP-096 | NEEDS SPLITTING | Parental controls + Youth Mode link to PARITY-001 privacy |
| GAP-097 | VALIDATED | G-play vs WePlay branding — product decision |
| GAP-098 | VALIDATED | Teal accent consistency |
| GAP-099 | VALIDATED | Sheet animation timing |
| GAP-100 | VALIDATED | Empty state illustrations |
| GAP-101 | VALIDATED | Dock icon order |
| GAP-102 | DUPLICATE | Overlaps GAP-030 gift chat feedback/sprites — consolidate |
| GAP-103 | INVALID | Game Rooms button EXISTS in LobbyGamesSection.jsx lines 30-34 |
| GAP-104 | VALIDATED | Family vs Clan label — copy decision |
| GAP-105 | VALIDATED | Manage section accent bars |
| GAP-106 | VALIDATED | Drawing system lines — depends GAP-011 |
| GAP-107 | VALIDATED | Chat bubble backpack icon |
| GAP-108 | VALIDATED | Discover notification dot |
| GAP-109 | VALIDATED | DM avatar gold frame — overlaps GAP-037 |
| GAP-110 | VALIDATED | Love Home Love/Blessing stats |
| GAP-111 | NEEDS SPLITTING | Sticker icon layout + PARITY-008 full sticker sheet |

---

## Incorrect assumptions in v1 summary

1. **GAP-103 (Game Rooms button)** — listed as missing; button exists in `LobbyGamesSection.jsx`.  
2. **GAP-031 top-10 'missing'** — invite cards are implemented; gap is **visual** parity not absence.  
3. **GAP-063 Global region** — implemented via region pill; gap severity overstated as missing.  
4. **Sampling bias** — v1 ~40 frames; v2 found Privacy, Confidant dress, Lottery modal, Family chat donations without prior gaps.  
5. **Intentional design** updated since v1: DM send-coins removed; red packet only.  

## Recommended v3 actions (documentation only)

- Merge GAP-037 + GAP-109 + GAP-102 + GAP-030 into structured DM/room gift feedback group  
- Remove or downgrade GAP-103 to INVALID  
- Split GAP-015, GAP-016, GAP-039, GAP-061, GAP-095, GAP-111  
- Add PARITY-001–025 to backlog as separate track  
