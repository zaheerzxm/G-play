/** Maps LiveKit participant identities (user_id) to seat numbers. */

export function buildSeatVoiceMap(seats) {
  const userToSeat = new Map();
  const seatToUser = new Map();

  for (const seat of seats) {
    if (!seat?.user_id) continue;
    userToSeat.set(seat.user_id, seat.seat_number);
    seatToUser.set(seat.seat_number, seat.user_id);
  }

  return { userToSeat, seatToUser };
}

/** Returns seat numbers whose occupants are above the speaking threshold. */
export function speakingIdsToSeatNumbers(seats, speakingUserIds) {
  const speakingSeats = new Set();
  for (const seat of seats) {
    if (seat?.user_id && speakingUserIds.has(seat.user_id)) {
      speakingSeats.add(seat.seat_number);
    }
  }
  return speakingSeats;
}

/** LiveKit identity for a seated user (matches Supabase user_id). */
export function seatParticipantIdentity(seat) {
  return seat?.user_id ?? null;
}
