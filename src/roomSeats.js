/** Voice room mic seat count — app rooms use 14 visible seats */
export const ROOM_SEAT_COUNT = 14;

/** WePlay-style: 2 partner seats on top, then 3 rows of 4 */
export const SEAT_LAYOUT = [
  [1, 2],
  [3, 4, 5, 6],
  [7, 8, 9, 10],
  [11, 12, 13, 14],
];

/** Games mode: single row of 10 seats */
export const GAMES_MODE_SEAT_LAYOUT = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]];
export const GAMES_MODE_SEAT_COUNT = 10;

export const HOST_SEAT = 1;
export const ADMIN_SEAT = 2;

/** Partner seats are larger in UI (top row) */
export const PARTNER_SEAT_NUMBERS = new Set([1, 2]);

/** Horizontal + vertical neighbor pairs — bond icon when both occupied */
export const ADJACENT_SEAT_PAIRS = [
  [1, 2],
  [1, 3],
  [2, 4],
  [3, 4],
  [4, 5],
  [5, 6],
  [3, 7],
  [4, 8],
  [5, 9],
  [6, 10],
  [7, 8],
  [8, 9],
  [9, 10],
  [7, 11],
  [8, 12],
  [9, 13],
  [10, 14],
  [11, 12],
  [12, 13],
  [13, 14],
];

/** Same-row left/right neighbors only (for bond icons between seats). */
export function areHorizontalSeatNeighbors(seatA, seatB) {
  const a = Number(seatA);
  const b = Number(seatB);
  for (const row of SEAT_LAYOUT) {
    for (let i = 0; i < row.length - 1; i += 1) {
      if (row[i] === a && row[i + 1] === b) return true;
      if (row[i] === b && row[i + 1] === a) return true;
    }
  }
  return false;
}
