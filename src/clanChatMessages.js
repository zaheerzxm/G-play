import { formatCompactNumber } from "./formatCompact.js";
import { looksLikeCharmSystemMessage, looksLikeGiftSystemMessage } from "./gifts.js";

export const CLAN_MESSAGE_TYPES = ["text", "gift", "system"];

const ROLE_BADGE_LABELS = {
  leader: "Leader",
  deputy: "Deputy",
  admin: "Admin",
};

const ROLE_BADGE_CLASS = {
  leader: "clan-chat-role-badge--leader",
  deputy: "clan-chat-role-badge--deputy",
  admin: "clan-chat-role-badge--admin",
};

export function clanRoleShowsBadge(role) {
  return role === "leader" || role === "deputy" || role === "admin";
}

export function clanRoleBadgeLabel(role) {
  return ROLE_BADGE_LABELS[role] ?? null;
}

export function clanRoleBadgeClass(role) {
  return ROLE_BADGE_CLASS[role] ?? null;
}

/** Client-side guard before RPC (mirrors SQL spoof check). */
export function clanMessageLooksSpoofed(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return false;
  if (looksLikeGiftSystemMessage(raw)) return true;
  if (looksLikeCharmSystemMessage(raw)) return true;
  if (/^Receiver's Gold \+/i.test(raw)) return true;
  if (/donated \d+.*family fund/i.test(raw)) return true;
  if (/^\[\[clan_/i.test(raw)) return true;
  return false;
}

export function clanGiftDisplayFromMessage(msg) {
  if (!msg || msg.message_type !== "gift") return null;
  const payload = msg.payload;
  if (!payload || typeof payload !== "object") return null;

  const senderName = String(payload.sender_name ?? payload.senderName ?? "").trim();
  const recipientName = String(payload.recipient_name ?? payload.recipientName ?? "").trim();
  const giftName = String(payload.gift_name ?? payload.giftName ?? "Gift").trim();
  const emoji = String(payload.emoji ?? "🎁");
  const reward = Math.max(0, Math.floor(Number(payload.reward ?? 0) || 0));
  const charm = Math.max(0, Math.floor(Number(payload.charm ?? 0) || 0));
  const gold = Math.max(0, Math.floor(Number(payload.gold ?? payload.reward ?? 0) || 0));
  const flavor = String(payload.flavor ?? payload.quote ?? "").trim();

  return {
    senderName,
    recipientName,
    giftName,
    emoji,
    reward,
    charm,
    gold,
    flavor,
    lucky: Boolean(payload.lucky),
  };
}

export function formatClanGiftFooter({ charm, gold, recipientName }) {
  const lines = [];
  if (gold > 0) {
    lines.push(`Receiver's Gold +${formatCompactNumber(gold)} (${recipientName})`);
  }
  if (charm > 0) {
    lines.push(`Receiver's Charm +${formatCompactNumber(charm)} (${recipientName})`);
  }
  return lines;
}

export function formatClanChatPreview(lastMessage, { senderName } = {}) {
  if (!lastMessage) return "";

  const type = lastMessage.message_type ?? "text";
  if (type === "gift") {
    const gift = clanGiftDisplayFromMessage(lastMessage);
    if (gift) {
      const body = `[Gift] ${gift.senderName || "Member"} sent ${gift.giftName} to ${gift.recipientName}`;
      return senderName?.trim() ? `${senderName}: ${body}` : body;
    }
    return senderName?.trim() ? `${senderName}: [Gift]` : "[Gift]";
  }

  if (type === "system") {
    const body = String(lastMessage.message ?? "").trim() || "[System]";
    return body;
  }

  const raw = String(lastMessage.message ?? "").trim();
  const name = senderName?.trim();
  if (name) return `${name}: ${raw}`;
  return raw;
}
