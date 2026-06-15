/** BFF slot economy constants (FB-001). Single source for client + docs. */

export const BFF_SLOT_BASE_DEFAULT = 3;
export const BFF_SLOT_MAX = 99;

/** Coins charged per unlock in unlock_bff_bond RPC (must match SQL). */
export const BFF_UNLOCK_COIN_COST = 500;

export const BFF_FAMILY_BOND_TYPES = new Set(["bff", "bestie", "bro", "sis"]);

export function isBffFamilyBondType(type) {
  return BFF_FAMILY_BOND_TYPES.has(type);
}
