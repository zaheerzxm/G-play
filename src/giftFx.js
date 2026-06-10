import { clampGiftReward, maxGiftRewardForName } from "./gifts.js";

const GIFT_MSG_NEW = /^(.+?) sent (\S+) (.+?) to (.+?) — won (\d+) gold$/;
const GIFT_MSG_OLD = /^sent (\S+) (.+?) to (.+?) — won (\d+) gold$/;

export function parseGiftMessage(message) {
  const mainLine = String(message ?? "").split("\n")[0]?.trim() ?? "";
  let match = mainLine.match(GIFT_MSG_NEW);
  if (match) {
    const giftName = match[3].trim();
    const rawReward = Number(match[5]);
    const maxAllowed = maxGiftRewardForName(giftName);
    if (!maxAllowed || rawReward > maxAllowed) return null;
    return {
      senderName: match[1].trim(),
      emoji: match[2],
      giftName,
      recipientName: match[4].trim(),
      reward: clampGiftReward(giftName, rawReward),
    };
  }
  match = mainLine.match(GIFT_MSG_OLD);
  if (!match) return null;
  const giftName = match[2].trim();
  const rawReward = Number(match[4]);
  const maxAllowed = maxGiftRewardForName(giftName);
  if (!maxAllowed || rawReward > maxAllowed) return null;
  return {
    senderName: null,
    emoji: match[1],
    giftName,
    recipientName: match[3].trim(),
    reward: clampGiftReward(giftName, rawReward),
  };
}

export function buildGiftBanner(msg, profileMap = {}) {
  const parsed = parseGiftMessage(msg?.message);
  if (!parsed) return null;
  const profile = profileMap[msg.user_id];
  return {
    id: String(msg.id),
    senderName: msg.nickname || "Guest",
    senderAvatar: profile?.avatar_url ?? null,
    ...parsed,
  };
}

export function findSeatForRecipient(seats, recipientName) {
  const name = recipientName.trim().toLowerCase();
  return seats.find((s) => s.nickname?.trim().toLowerCase() === name) ?? null;
}

function stageMetrics() {
  const stageEl = document.querySelector(".seats-stage");
  if (!stageEl) return null;
  const stageRect = stageEl.getBoundingClientRect();
  return { stageEl, stageRect };
}

export function computeGiftFlight(seatNumber) {
  const metrics = stageMetrics();
  if (!metrics) return null;
  const { stageRect } = metrics;
  const target = seatAvatarOnStage(seatNumber);
  if (!target) return null;

  const startX = stageRect.width / 2;
  const startY = stageRect.height - 8;

  return {
    startX,
    startY,
    dx: target.x - startX,
    dy: target.y - startY,
  };
}

/** Flight from sender seat avatar to receiver seat avatar (gifts under 500 coins). */
export function computePfpFlight(fromSeatNumber, toSeatNumber) {
  const metrics = stageMetrics();
  if (!metrics) return null;
  const { stageRect } = metrics;
  const target = seatAvatarOnStage(toSeatNumber);
  if (!target) return null;

  const from = fromSeatNumber ? seatAvatarOnStage(fromSeatNumber) : null;
  const startX = from?.x ?? stageRect.width / 2;
  const startY = from?.y ?? stageRect.height - 8;

  return {
    startX,
    startY,
    dx: target.x - startX,
    dy: target.y - startY,
    targetX: target.x,
    targetY: target.y,
  };
}

export function seatAvatarOnStage(seatNumber) {
  const seatEl = document.querySelector(`[data-seat-number="${seatNumber}"] .seat-avatar`);
  const stageEl = document.querySelector(".seats-stage");
  if (!seatEl || !stageEl) return null;

  const seatRect = seatEl.getBoundingClientRect();
  const stageRect = stageEl.getBoundingClientRect();
  const w = seatRect.width;
  const h = seatRect.height;
  const border = parseFloat(window.getComputedStyle(seatEl).borderTopWidth) || 0;

  return {
    x: seatRect.left + w / 2 - stageRect.left,
    y: seatRect.top + h / 2 - stageRect.top,
    radius: Math.max(4, Math.min(w, h) / 2 - border * 0.5),
  };
}

/** Midpoint between two seated avatars, relative to `.seat-bond-layer`. */
export function seatBondMidpoint(seatA, seatB) {
  const elA = document.querySelector(`[data-seat-number="${seatA}"] .seat-avatar`);
  const elB = document.querySelector(`[data-seat-number="${seatB}"] .seat-avatar`);
  const originEl =
    document.querySelector(".seat-bond-layer") ?? document.querySelector(".seats-stage");
  if (!originEl || !elA || !elB) return null;

  const origin = originEl.getBoundingClientRect();
  const rectA = elA.getBoundingClientRect();
  const rectB = elB.getBoundingClientRect();

  const ax = rectA.left + rectA.width / 2 - origin.left;
  const ay = rectA.top + rectA.height / 2 - origin.top;
  const bx = rectB.left + rectB.width / 2 - origin.left;
  const by = rectB.top + rectB.height / 2 - origin.top;
  const rA = Math.min(rectA.width, rectA.height) / 2;
  const rB = Math.min(rectB.width, rectB.height) / 2;

  const sameRow = Math.abs(ay - by) < 18;
  if (sameRow) {
    const left = ax <= bx ? { x: ax, r: rA } : { x: bx, r: rB };
    const right = ax <= bx ? { x: bx, r: rB } : { x: ax, r: rA };
    return {
      x: (left.x + left.r + right.x - right.r) / 2,
      y: (ay + by) / 2,
    };
  }

  const top = ay <= by ? { y: ay, r: rA } : { y: by, r: rB };
  const bottom = ay <= by ? { y: by, r: rB } : { y: ay, r: rA };
  return {
    x: (ax + bx) / 2,
    y: (top.y + top.r + bottom.y - bottom.r) / 2,
  };
}

export function seatCenterOnStage(seatNumber) {
  const avatar = seatAvatarOnStage(seatNumber);
  if (!avatar) return null;
  return { x: avatar.x, y: avatar.y };
}

export function buildGiftEffect({
  emoji,
  seatNumber,
  fromSeatNumber = null,
  senderAvatar = null,
  recipientAvatar = null,
  reward = 0,
  fx = "fly",
  usePfp = false,
}) {
  const flight = usePfp
    ? computePfpFlight(fromSeatNumber, seatNumber)
    : computeGiftFlight(seatNumber);
  if (!flight) return null;

  const resolvedFx = usePfp ? "pfp" : fx;
  const duration =
    resolvedFx === "pfp" ? 2000 : fx === "rocket" ? 2800 : fx === "burst" ? 2400 : 1800;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    emoji,
    reward: Math.max(0, Math.floor(Number(reward) || 0)),
    fx: resolvedFx,
    seatNumber,
    fromSeatNumber,
    senderAvatar,
    recipientAvatar,
    startX: flight.startX,
    startY: flight.startY,
    dx: flight.dx,
    dy: flight.dy,
    targetX: flight.targetX,
    targetY: flight.targetY,
    duration,
  };
}

export function buildGiftHit({ emoji, seatNumber, reward = 0, fx = "fly" }) {
  const center = seatCenterOnStage(seatNumber);
  if (!center) return null;
  return {
    id: `hit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    emoji,
    reward: Math.max(0, Math.floor(Number(reward) || 0)),
    fx,
    x: center.x,
    y: center.y,
    duration: fx === "burst" ? 1600 : 1200,
  };
}
