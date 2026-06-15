import { bestieBowLevelFromExp } from "../bestieBowTiers.js";
import { bondMeta } from "../relationships.js";
import AvatarImg from "./AvatarImg.jsx";

const TOKEN = "✈";

export default function BffPreviewCards({ bonds, max = 3 }) {
  if (!bonds?.length) return null;

  return (
    <div className="weplay-bff-row weplay-bff-row--ref">
      {bonds.slice(0, max).map((b) => {
        const meta = bondMeta(b.bondType);
        const bowLevel = bestieBowLevelFromExp(b.relationshipExp ?? 0);
        return (
          <article
            key={b.otherUserId}
            className={`weplay-bff-card-ref weplay-bff-card-ref--${meta.popupClass}`}
            title={b.otherName}
          >
            <span className="weplay-bff-card-ref-lv">LV{bowLevel}</span>
            <span className="weplay-bff-card-ref-type" aria-hidden>{meta.emoji}</span>
            <span className="weplay-bff-card-ref-token" aria-hidden>{TOKEN}</span>
            <AvatarImg
              src={b.otherAvatar}
              fallback={b.otherName || "?"}
              className="weplay-bff-card-ref-avatar weplay-bff-card-ref-avatar--fallback"
              imgClassName="weplay-bff-card-ref-avatar"
            />
          </article>
        );
      })}
    </div>
  );
}
