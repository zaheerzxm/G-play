# WePlay → G-Play Final Backlog Summary

**Phase 3 output — single source of truth for engineering agents.**

## Do not use v1 sprints

Execute from [`weplay-final-backlog.md`](./weplay-final-backlog.md) using **FB-XXX** IDs and **Waves 1–4** in [`weplay-final-roadmap.md`](./weplay-final-roadmap.md). Prior docs remain reference only:

| Doc | Role |
|-----|------|
| `weplay-gap-analysis.md` | v1 discovery (superseded) |
| `weplay-gap-validation.md` | Merge/split rules applied here |
| `weplay-parity-audit-v2.md` | PARITY-001–025 source |
| `weplay-gap-sprints.md` | **Do not execute** |

## Phase 2 parity baseline

| Metric | Value |
|--------|------:|
| Original v1 gaps | 108 |
| Validation: validated | 93 |
| Validation: invalid | 1 (GAP-103) |
| Validation: duplicate | 2 (merged) |
| Validation: needs split | 12 |
| New PARITY gaps | 25 |
| Overall parity | ~69% |
| Voice Room | 72% |
| Chat | 88% |
| Clan | 52% |
| Settings | 41% |
| Games | 48% |

## Final backlog

| Metric | Value |
|--------|------:|
| **Final items (FB-001–FB-135)** | **135** |
| Removed | GAP-103 |
| Merged | GAP-037+109, GAP-102+030 |
| Split | GAP-015,016,020,030,034,039,049,057,061,095,096,111 |
| PARITY imported | 25 |
| Closed (implemented) | GAP-063 |

## Severity

| Severity | Count | Wave |
|----------|------:|------|
| Critical | 10 | Wave 1 |
| High | 41 | Wave 2 |
| Medium | 68 | Wave 3 |
| Low | 16 | Wave 4 |
| **Total** | **135** | |

## Priority type distribution

| Priority | Label | Count |
|----------|-------|------:|
| 1 | Missing functionality | 31 |
| 3 | Data wiring | 12 |
| 4 | Navigation | 10 |
| 5 | Visual parity | 64 |
| 6 | Animation parity | 5 |
| 7 | Cosmetic polish | 13 |

## Wave 1 — start here (top 10 by impact)

| ID | Screen | Complexity | Lineage |
|----|--------|------------|--------|
| FB-003 | Clan chest / store / gacha | XL | GAP-084 |
| FB-004 | Clan group chat message types | XL | GAP-039b / PARITY-004 |
| FB-005 | Create Group DM | XL | GAP-039a |
| FB-006 | Drawing widget overlay | XL | GAP-011 |
| FB-008 | Lobby games catalog | XL | GAP-041 |
| FB-009 | Privacy settings screen | XL | PARITY-001 |
| FB-010 | UNO / Ludo / lobby games | XL | GAP-091 |
| FB-001 | BFF To Unlock screen | L | GAP-071 |
| FB-002 | Chat Bubble shop | L | GAP-068 |
| FB-007 | Family Fund donation flow | L | PARITY-011 |

**Recommended Wave 1 order:** FB-009 (Privacy) → FB-005 (Group DM) → FB-006 (Drawing) → FB-003 (Clan economy) → FB-004 (Clan chat types) → FB-001 (BFF unlock) → FB-008/FB-010 (Games) → FB-002 (Bubble shop) → FB-007 (Family Fund).

## Intentional G-Play design (never backlog)

- 14-seat room layout (2+4+4+4)
- DM coin transfer via red packet only (no send-coins button)
- No voice-room chat timestamps
- Walkie talkie overlay
- DM voice call is a G-Play extra (PARITY-021 documents only)

## Agent instructions

1. Pick the next **FB-XXX** item from the current wave only.
2. Read lineage (GAP/PARITY) for reference frames in audit docs.
3. Implement in listed files; respect Dependencies column.
4. Mark item done in your PR description with `FB-XXX` ID.
5. Do **not** start Wave 2 until Wave 1 test checklist passes.
6. Do **not** re-open GAP-103, GAP-001/007/077, or GAP-063.

**Start with Wave 1 only.**
