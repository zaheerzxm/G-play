import { useMemo, useState } from "react";
import DDDCategorySlot from "./DDDCategorySlot.jsx";
import DDDPlayerPicker from "./DDDPlayerPicker.jsx";

export default function DDDInputPanel({ pickable, allowSelfPick, onSubmit, submitting }) {
  const [picks, setPicks] = useState({ dil: null, dimaag: null, dustbin: null });
  const [activeSlot, setActiveSlot] = useState(null);
  const [query, setQuery] = useState("");

  const disabledIds = useMemo(() => {
    const ids = [];
    if (picks.dil) ids.push(picks.dil.user_id);
    if (picks.dimaag) ids.push(picks.dimaag.user_id);
    if (picks.dustbin) ids.push(picks.dustbin.user_id);
    return ids;
  }, [picks]);

  const allFilled = picks.dil && picks.dimaag && picks.dustbin;

  const handlePick = (player) => {
    if (!activeSlot) return;
    setPicks((prev) => ({ ...prev, [activeSlot]: player }));
    setActiveSlot(null);
    setQuery("");
  };

  const handleSubmit = () => {
    if (!allFilled) return;
    onSubmit?.({
      dilUserId: picks.dil.user_id,
      dimaagUserId: picks.dimaag.user_id,
      dustbinUserId: picks.dustbin.user_id,
      dilName: picks.dil.nickname,
      dimaagName: picks.dimaag.nickname,
      dustbinName: picks.dustbin.nickname,
    });
  };

  return (
    <div className="ddd-input-panel">
      <div className="ddd-slots">
        <DDDCategorySlot
          category="dil"
          player={picks.dil}
          active={activeSlot === "dil"}
          onClick={() => setActiveSlot("dil")}
        />
        <DDDCategorySlot
          category="dimaag"
          player={picks.dimaag}
          active={activeSlot === "dimaag"}
          onClick={() => setActiveSlot("dimaag")}
        />
        <DDDCategorySlot
          category="dustbin"
          player={picks.dustbin}
          active={activeSlot === "dustbin"}
          onClick={() => setActiveSlot("dustbin")}
        />
      </div>

      {activeSlot && (
        <DDDPlayerPicker
          players={pickable}
          query={query}
          onQueryChange={setQuery}
          onPick={handlePick}
          disabledIds={disabledIds.filter((id) => id !== picks[activeSlot]?.user_id)}
        />
      )}

      <button
        type="button"
        className="game-btn game-btn--primary game-btn--wide"
        disabled={!allFilled || submitting}
        onClick={handleSubmit}
      >
        {submitting ? "Submitting…" : "Submit choices"}
      </button>
    </div>
  );
}
