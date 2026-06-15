import { GPLAY_ASSETS } from "../gplayAssets.js";
import {
  IconChest,
  IconClose,
  IconGacha,
  IconImage,
  IconMusic,
  IconOrder,
  IconPk,
  IconSoundEffect,
  IconTasks,
  IconTimer,
} from "./NavIcons.jsx";

export default function FunctionsGrid({
  embedded = false,
  onRedPacket,
  onDraw,
  onBigWinner,
  onBingo,
  onLuckyNumber,
  onBusinessLife,
  onLottery,
  onPk,
  onMusic,
  onSoundEffect,
  onOrder,
  onScoreboard,
  onImage,
  onClose,
}) {
  const entertainment = [
    { key: "packet", Icon: IconChest, label: "Red Packets", onClick: onRedPacket },
    { key: "draw", Icon: IconImage, label: "Draw", onClick: onDraw },
    { key: "winner", Icon: IconTasks, label: "Big Winner", onClick: onBigWinner },
    { key: "bingo", Icon: IconGacha, label: "Bingo", onClick: onBingo },
    { key: "lucky", Icon: IconPk, label: "Lucky Number", onClick: onLuckyNumber },
    { key: "business", img: GPLAY_ASSETS.iconChest, label: "Business Life", onClick: onBusinessLife },
  ];

  const tools = [
    { key: "lottery", Icon: IconGacha, label: "Lottery", onClick: onLottery },
    { key: "pk", Icon: IconPk, label: "PK", onClick: onPk },
    { key: "music", Icon: IconMusic, label: "Music", onClick: onMusic },
    { key: "sound", Icon: IconSoundEffect, label: "Sound Effect", onClick: onSoundEffect },
    { key: "order", Icon: IconOrder, label: "Order", onClick: onOrder },
    { key: "score", Icon: IconTimer, label: "Scoreboard", onClick: onScoreboard },
  ];

  function renderItem(item) {
    const isPk = item.key === "pk";
    return (
      <button key={item.key} type="button" className="functions-grid-btn" onClick={item.onClick}>
        {item.img ? (
          <img src={item.img} alt="" className="functions-grid-icon-img" />
        ) : (
          <span className="functions-grid-icon">
            <item.Icon />
          </span>
        )}
        {isPk && <span className="functions-grid-new">NEW</span>}
        <span className="functions-grid-label">{item.label}</span>
      </button>
    );
  }

  const panel = (
    <div className={`functions-grid-panel ${embedded ? "functions-grid-panel--embedded" : ""}`} onClick={(e) => e.stopPropagation()}>
      <p className="emoji-panel-title">Game Entertainment</p>
      <div className="functions-grid functions-grid--entertainment">
        {entertainment.map(renderItem)}
      </div>
      <p className="emoji-panel-title emoji-panel-title--tools">Room Tools</p>
      <div className="functions-grid functions-grid--tools">
        {tools.map(renderItem)}
      </div>
    </div>
  );

  if (embedded) return panel;

  return (
    <div className="emoji-panel-backdrop" onClick={onClose}>
      {panel}
    </div>
  );
}
