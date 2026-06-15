/** BFF slot economy constants (FB-001). Single source for client + docs. */

export const BFF_SLOT_BASE_DEFAULT = 3;
export const BFF_SLOT_MAX = 99;

/** Reference price for purchasing an extra slot capacity tier (future tuning). */
export const BFF_EXTRA_SLOT_COIN_PRICE = 1000;

/** Coins charged per unlock in unlock_bff_bond RPC (must match SQL). */
export const BFF_UNLOCK_COIN_COST = 500;

export const BFF_FAMILY_BOND_TYPES = new Set(["bff", "bestie", "bro", "sis"]);

export function isBffFamilyBondType(type) {
  return BFF_FAMILY_BOND_TYPES.has(type);
}
