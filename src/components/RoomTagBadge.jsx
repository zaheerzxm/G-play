import { normalizeRoomTag, roomTagMeta } from "../roomTags.js";

export default function RoomTagBadge({ tag, compact = false, className = "" }) {
  const key = normalizeRoomTag(tag);
  const meta = roomTagMeta(key);
  return (
    <span
      className={`G-play-room-tag G-play-room-tag--${key}${compact ? " G-play-room-tag--compact" : ""}${className ? ` ${className}` : ""}`}
      title={meta.hint}
    >
      {compact ? meta.label : `${meta.emoji} ${meta.label}`}
    </span>
  );
}
