import { gplayUrl } from "./gplayAssets.js";

/** Map gift id → SVGA filename under public/weplay (populated after voice-room cache extract) */
export const GIFT_SVGA = {
  // rocket: "gift_rocket.svga",
};

export function giftSvgaUrl(giftId) {
  const file = GIFT_SVGA[giftId];
  return file ? gplayUrl(file) : null;
}

let svgaModulePromise = null;

export function loadSvgaPlayer() {
  if (!svgaModulePromise) {
    svgaModulePromise = import("svgaplayerweb").then((m) => m.default ?? m);
  }
  return svgaModulePromise;
}
