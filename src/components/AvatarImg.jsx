import { useState } from "react";

export default function AvatarImg({ src, fallback = "?", className = "", imgClassName = "" }) {
  const [failed, setFailed] = useState(false);
  const letter = String(fallback || "?").charAt(0).toUpperCase();

  if (!src || failed) {
    return <span className={className}>{letter}</span>;
  }

  return (
    <img
      src={src}
      alt=""
      className={imgClassName || className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
