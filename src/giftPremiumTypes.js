import { findGift, findGiftByName, giftQuantityFromName } from "./gifts.js";

export const PREMIUM_GIFT_MIN_COST = 1000;

const VALID_PREMIUM_FX = new Set([
  "universe",
  "galaxy",
  "rocket",
  "car",
  "supercar",
  "firework",
  "castle",
  "palace",
  "yacht",
  "dragon",
  "ring",
  "hearts",
  "crown",
  "frame",
]);

export function isPremiumGiftCost(cost) {
  return Math.max(0, Number(cost) || 0) >= PREMIUM_GIFT_MIN_COST;
}

export function giftTotalCost(gift, quantity = 1) {
  if (!gift) return 0;
  const unit = Math.max(0, Number(gift.cost) || Number(gift.chestValue) || 0);
  return unit * Math.max(1, Number(quantity) || 1);
}

export function isPremiumGift(gift, quantity = 1) {
  return isPremiumGiftCost(giftTotalCost(gift, quantity));
}

export function premiumValueForName(giftName, reward = 0) {
  const gift = findGiftByName(giftName);
  const qty = giftQuantityFromName(giftName);
  return Math.max(giftTotalCost(gift, qty), Number(reward) || 0);
}

/** Each catalog gift >= 500 coins sets `premiumFx` on the gift row. */
export function premiumFxTypeForGift(gift) {
  const fromCatalog = gift?.premiumFx;
  if (fromCatalog && VALID_PREMIUM_FX.has(fromCatalog)) return fromCatalog;

  if (!gift) return "crown";
  const id = String(gift.id ?? "").toLowerCase().replace(/^chest_/, "");
  const name = String(gift.name ?? "").toLowerCase();

  if (id.includes("universe") || name.includes("universe")) return "universe";
  if (id.includes("galaxy") || name.includes("galaxy")) return "galaxy";
  if (id.includes("supercar")) return "supercar";
  if (id.includes("rocket")) return "rocket";
  if (id.includes("car")) return "car";
  if (id.includes("firework")) return "firework";
  if (id.includes("palace")) return "palace";
  if (id.includes("castle")) return "castle";
  if (id.includes("yacht")) return "yacht";
  if (id.includes("dragon")) return "dragon";
  if (id.includes("ring")) return "ring";
  if (id.includes("frame")) return "frame";
  if (id.includes("crown")) return "crown";
  if (id.includes("love")) return "hearts";

  return isPremiumGift(gift) ? "crown" : "crown";
}

export function premiumFxTypeForName(giftName) {
  return premiumFxTypeForGift(findGiftByName(giftName));
}

/** Extra hold after the main scene so +gold can appear before fade-out. */
export const PREMIUM_COIN_HOLD_MS = 1800;

export function premiumFxDuration(type, reward = 0) {
  let ms;
  switch (type) {
    case "rocket":
      ms = 4000;
      break;
    case "car":
      ms = 4500;
      break;
    case "supercar":
      ms = 2800;
      break;
    case "firework":
      ms = 3800;
      break;
    case "dragon":
      ms = 4200;
      break;
    case "yacht":
      ms = 3000;
      break;
    case "castle":
      ms = 4600;
      break;
    case "palace":
      ms = 4500;
      break;
    case "universe":
    case "galaxy":
      ms = 4300;
      break;
    case "ring":
    case "hearts":
      ms = 3400;
      break;
    case "crown":
      ms = 3600;
      break;
    case "frame":
      ms = 3500;
      break;
    default:
      ms = 3600;
  }
  if (Math.max(0, Number(reward) || 0) > 0) {
    ms += PREMIUM_COIN_HOLD_MS;
  }
  return ms;
}
