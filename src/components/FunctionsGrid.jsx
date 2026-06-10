import { GPLAY_ASSETS } from "../gplayAssets.js";

export default function FunctionsGrid({
  onDailyTasks,
  onReactions,
  onMode,
  onRedPacket,
  onWaiting,
  onImage,
  onClose,
}) {
  const entertainment = [
    { key: "packet", emoji: "🧧", label: "Red Packets", onClick: onRedPacket },
    { key: "winner", emoji: "🎡", label: "Big Winner", onClick: onDailyTasks },
    { key: "bingo", emoji: "🅱️", label: "Bingo", onClick: onReactions },
    { key: "lucky", emoji: "🍀", label: "Lucky Number", onClick: onMode },
    { key: "business", img: GPLAY_ASSETS.iconChest, label: "Business Life", onClick: onDailyTasks },
  ];

  const tools = [
    { key: "lottery", emoji: "🎰", label: "Lottery", onClick: onReactions },
    { key: "pk", emoji: "⚔️", label: "PK", onClick: onMode },
    { key: "sound", emoji: "🎵", label: "Sound Effect", onClick: onReactions },
    { key: "order", emoji: "🎙️", label: "Order", onClick: onWaiting },
    { key: "score", emoji: "⏱️", label: "Scoreboard", onClick: onDailyTasks },
    { key: "image", emoji: "🖼️", label: "Image", onClick: onImage },
    { key: "close", emoji: "✕", label: "Close", onClick: onClose },
  ];

  function renderItem(item) {
    return (
      <button key={item.key} type="button" className="functions-grid-btn" onClick={item.onClick}>
        {item.img ? (
          <img src={item.img} alt="" className="functions-grid-icon-img" />
        ) : (
          <span className="functions-grid-icon">{item.emoji}</span>
        )}
        <span className="functions-grid-label">{item.label}</span>
      </button>
    );
  }

  return (
    <div className="emoji-panel-backdrop" onClick={onClose}>
      <div className="functions-grid-panel" onClick={(e) => e.stopPropagation()}>
        <p className="emoji-panel-title">Game Entertainment</p>
        <div className="functions-grid functions-grid--entertainment">
          {entertainment.map(renderItem)}
        </div>
        <p className="emoji-panel-title emoji-panel-title--tools">Room Tools</p>
        <div className="functions-grid functions-grid--tools">
          {tools.map(renderItem)}
        </div>
      </div>
    </div>
  );
}
