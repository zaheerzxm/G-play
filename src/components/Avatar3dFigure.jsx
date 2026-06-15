import { DEFAULT_AVATAR_3D } from "../avatar3d.js";

/** Lightweight CSS “3D” chibi avatar — no WebGL. */
export default function Avatar3dFigure({
  config,
  size = "md",
  className = "",
  holdingHands = false,
  flip = false,
}) {
  const c = { ...DEFAULT_AVATAR_3D, ...config };
  const hairLong = c.hairStyle === "long";
  const genderClass = c.gender === "male" ? "avatar3d--male" : c.gender === "female" ? "avatar3d--female" : "";

  return (
    <div
      className={`avatar3d avatar3d--${size}${genderClass ? ` ${genderClass}` : ""}${holdingHands ? " avatar3d--hold" : ""}${flip ? " avatar3d--flip" : ""}${className ? ` ${className}` : ""}`}
      aria-hidden
    >
      <div className="avatar3d-shadow" />
      <div className="avatar3d-body-wrap">
        {hairLong && <div className="avatar3d-hair-back" style={{ background: c.hair }} />}
        <div className="avatar3d-head" style={{ background: c.skin }}>
          <div className="avatar3d-hair-front" style={{ background: c.hair }} />
          <div className="avatar3d-face">
            <span className="avatar3d-eye" />
            <span className="avatar3d-eye" />
            <span className="avatar3d-smile" />
          </div>
        </div>
        <div className="avatar3d-torso" style={{ background: c.outfit }} />
        <div className="avatar3d-legs">
          <div className="avatar3d-leg" style={{ background: c.pants }} />
          <div className="avatar3d-leg" style={{ background: c.pants }} />
        </div>
        <div className="avatar3d-feet">
          <div className="avatar3d-foot" style={{ background: c.shoes }} />
          <div className="avatar3d-foot" style={{ background: c.shoes }} />
        </div>
        {holdingHands && <div className="avatar3d-hand avatar3d-hand--out" style={{ background: c.skin }} />}
      </div>
    </div>
  );
}

export function Avatar3dCouple({ configA, configB, size = "md", className = "" }) {
  return (
    <div className={`avatar3d-couple avatar3d-couple--${size}${className ? ` ${className}` : ""}`}>
      <Avatar3dFigure config={configA} size={size} holdingHands flip />
      <span className="avatar3d-couple-heart" aria-hidden>💕</span>
      <Avatar3dFigure config={configB} size={size} holdingHands />
    </div>
  );
}
