import { parseRoomInvite, parseClanInvite } from "./privateChat.js";
import { looksLikeGiftSystemMessage } from "./gifts.js";

export function formatChatPreview(message, { senderName } = {}) {
  if (!message) return "";
  const raw = String(message).trim();
  if (!raw) return "";

  let body = raw;

  if (parseRoomInvite(raw)) {
    const text = parseRoomInvite(raw)?.text;
    body = text ? `[Voice Room] ${text}` : "[Voice Room] Join my voice room";
  } else if (parseClanInvite(raw)) {
    const text = parseClanInvite(raw)?.text;
    body = text ? `[Clan] ${text}` : "[Clan] Join my clan";
  } else if (looksLikeGiftSystemMessage(raw) || (raw.includes("— won ") && /sent/i.test(raw))) {
    body = `[Gift] ${raw.split("\n")[0]}`;
  } else if (/\bred packet\b/i.test(raw) || raw.startsWith("[redpacket]") || raw.includes("🧧")) {
    body = "[Red Packet]";
  } else if (/^Send you \d/i.test(raw) || /^sent you \d/i.test(raw)) {
    body = `[Coins] ${raw}`;
  } else if (raw.startsWith("[img]")) {
    body = "[Photo]";
  } else if (raw.startsWith("[emote:")) {
    body = "[Emote]";
  } else if (/^\[\[reply\]\]/i.test(raw)) {
    body = "[Reply]";
  } else if (/joined|guessed correctly|wordle|mafia|draw/i.test(raw) && /🎨|🎮|game/i.test(raw)) {
    body = `[Games] ${raw}`;
  }

  const name = senderName?.trim();
  if (name) return `${name}: ${body}`;
  return body;
}

export function chatRowTags(friend, { clanId } = {}) {
  const tags = [];
  if (friend?.is_super_admin) tags.push({ key: "official", label: "Official" });
  if (clanId && friend?.clan_id === clanId) tags.push({ key: "clan", label: "Clan" });
  return tags;
}
