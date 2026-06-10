/** Voice room category tags — discovery badges and room settings only (not user bonds). */

export const ROOM_TAG_GROUPS = ["Social", "Activity", "Events"];

export const ROOM_TAGS = [
  { key: "chats", label: "Chat", emoji: "💬", group: "Social", hint: "Hang out and talk" },
  { key: "friends", label: "Friends", emoji: "👋", group: "Social", hint: "Friend groups" },
  { key: "find_friend", label: "Find Friend", emoji: "🔍", group: "Social", hint: "Meet new people" },
  { key: "music", label: "Music", emoji: "🎵", group: "Activity", hint: "Sing & karaoke" },
  { key: "video", label: "Video", emoji: "📺", group: "Activity", hint: "Watch videos together" },
  { key: "game", label: "Game", emoji: "🎮", group: "Activity", hint: "Play games on voice" },
  { key: "pk", label: "PK", emoji: "⚔️", group: "Activity", hint: "Battles & competitions" },
  { key: "auction", label: "Auction", emoji: "🔨", group: "Activity", hint: "Bid on seats & items" },
  { key: "birthday", label: "Birthday", emoji: "🎂", group: "Events", hint: "Birthday party" },
  { key: "party", label: "Party", emoji: "🎉", group: "Events", hint: "Open party room" },
];

const TAG_BY_KEY = Object.fromEntries(ROOM_TAGS.map((t) => [t.key, t]));

/** Legacy bond tags stored on old rooms — map to a normal room category. */
const LEGACY_BOND_TAGS = new Set([
  "cp",
  "wedding",
  "bro",
  "sis",
  "bff",
  "bestie",
  "family",
  "charm",
  "guard",
  "mentor",
  "apprentice",
  "son",
  "daughter",
  "choti_ghar_wali",
  "badi_ghar_wali",
  "couple",
]);

export function normalizeRoomTag(tag) {
  const key = String(tag ?? "chats").trim().toLowerCase().replace(/\s+/g, "_");
  if (TAG_BY_KEY[key]) return key;
  if (key === "chat") return "chats";
  if (key === "games") return "game";
  if (LEGACY_BOND_TAGS.has(key)) return "chats";
  return "chats";
}

export function roomTagMeta(tag) {
  const key = normalizeRoomTag(tag);
  return TAG_BY_KEY[key] ?? TAG_BY_KEY.chats;
}

export function roomTagLabel(tag) {
  return roomTagMeta(tag).label;
}

export function roomTagDisplay(tag) {
  const meta = roomTagMeta(tag);
  return `${meta.emoji} ${meta.label}`;
}

export function tagsInGroup(group) {
  return ROOM_TAGS.filter((t) => t.group === group);
}
