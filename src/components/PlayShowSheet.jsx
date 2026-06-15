import { useState } from "react";
import { createPortal } from "react-dom";
import { AVATAR_3D_PRESETS, DEFAULT_AVATAR_3D, loadAvatar3d, saveAvatar3d } from "../avatar3d.js";
import Avatar3dFigure from "./Avatar3dFigure.jsx";
import { IconGift, UiIcon } from "./NavIcons.jsx";

const COLOR_OPTS = {
  skin: ["#f5d0b5", "#e8b796", "#c68642", "#8d5524", "#ffdfc4"],
  hair: ["#2d2d2d", "#6b4423", "#9b7edb", "#f472b6", "#38bdf8", "#fde68a"],
  outfit: ["#f8fafc", "#fbcfe8", "#bae6fd", "#fef08a", "#1e293b", "#ef4444"],
  pants: ["#c4a574", "#78716c", "#1e3a5f", "#374151", "#f5f5f4"],
};

export default function PlayShowSheet({ userId, profile, onClose, onToast }) {
  const [config, setConfig] = useState(() => loadAvatar3d(userId, profile));
  const [busy, setBusy] = useState(false);

  function setColor(key, value) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  async function handleSave() {
    setBusy(true);
    try {
      await saveAvatar3d(userId, config);
      onToast?.("3D avatar saved!");
      onClose?.();
    } catch (e) {
      onToast?.(e?.message ?? "Could not save");
    } finally {
      setBusy(false);
    }
  }

  const sheet = (
    <div className="gplay-mobile-shell-backdrop gplay-mobile-shell-backdrop--play-show">
      <div className="gplay-mobile-shell play-show-page play-show-page--ref" onClick={(e) => e.stopPropagation()}>
        <header className="play-show-top">
          <button type="button" className="play-show-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <span className="play-show-title">PLAY Show</span>
          <button type="button" className="play-show-save" disabled={busy} onClick={handleSave}>
            Save
          </button>
        </header>

        <div className="play-show-body">
          <div className="play-show-stage">
            <Avatar3dFigure config={config} size="stage" />
          </div>

          <div className="play-show-toolbar">
            <button type="button" className="play-show-tool play-show-tool--active">
              <span>★</span>
              <small>Collections</small>
            </button>
            <button
              type="button"
              className="play-show-tool"
              onClick={() => setConfig({ ...DEFAULT_AVATAR_3D })}
            >
              <span>👕</span>
              <small>Reset</small>
            </button>
            <button type="button" className="play-show-tool">
              <UiIcon Icon={IconGift} />
              <small>Send Gift</small>
            </button>
          </div>

          <div className="play-show-customize">
          {Object.entries(COLOR_OPTS).map(([key, colors]) => (
            <div key={key} className="play-show-color-row">
              <span className="play-show-color-label">{key}</span>
              <div className="play-show-swatches">
                {colors.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    className={`play-show-swatch${config[key] === hex ? " play-show-swatch--active" : ""}`}
                    style={{ background: hex }}
                    onClick={() => setColor(key, hex)}
                    aria-label={key}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="play-show-color-row">
            <span className="play-show-color-label">preset</span>
            <div className="play-show-style-btns">
              {Object.entries(AVATAR_3D_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  className={config.gender === preset.gender ? "play-show-style-btn--active" : ""}
                  onClick={() => setConfig({ ...preset })}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
          <div className="play-show-color-row">
            <span className="play-show-color-label">hair style</span>
            <div className="play-show-style-btns">
              {["short", "long"].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={config.hairStyle === s ? "play-show-style-btn--active" : ""}
                  onClick={() => setConfig((c) => ({ ...c, hairStyle: s }))}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
