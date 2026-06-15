import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatCompactNumber } from "../formatCompact.js";
import {
  GUARD_PROPOSE_CP,
  loadChurchCandidates,
  loadTodaysWeddings,
  loadMyWeddingSchedule,
  ringMeta,
  scheduleWedding,
  WEDDING_RING_TYPES,
  WEDDING_TIME_SLOTS,
  weddingCeremonyPhase,
} from "../church.js";
import { loadMutualFriends } from "../social.js";
import {
  loadPrimaryCoupleBond,
  loadCpSlotInfo,
  proposeBond,
  partnerUserId,
} from "../relationships.js";
import { loadProfilesForUserIds } from "../profile.js";
import AvatarImg from "./AvatarImg.jsx";
import { IconChurch, IconGuard, IconHeart, UiIcon } from "./NavIcons.jsx";

const TABS = [
  { key: "propose", label: "Church" },
  { key: "wedding", label: "Wedding" },
  { key: "divorce", label: "Divorce" },
];

function formatSlotTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChurchSheet({ userId, onClose, onToast }) {
  const [tab, setTab] = useState("propose");
  const [candidates, setCandidates] = useState([]);
  const [todaysWeddings, setTodaysWeddings] = useState([]);
  const [mySchedule, setMySchedule] = useState(null);
  const [myBond, setMyBond] = useState(null);
  const [myCpSlots, setMyCpSlots] = useState(null);
  const [busy, setBusy] = useState(false);
  const [selectedRing, setSelectedRing] = useState("floral");
  const [selectedSlot, setSelectedSlot] = useState(WEDDING_TIME_SLOTS[2].hour);
  const [selectedWedding, setSelectedWedding] = useState(null);

  useEffect(() => {
    if (!userId) return;
    loadMutualFriends(userId).then((friends) => loadChurchCandidates(userId, friends).then(setCandidates));
    loadTodaysWeddings().then(setTodaysWeddings);
    loadMyWeddingSchedule(userId).then(setMySchedule);
    loadPrimaryCoupleBond(userId).then(setMyBond);
    loadCpSlotInfo(userId).then(setMyCpSlots);
  }, [userId]);

  async function handlePropose(friend) {
    if (busy) return;
    setBusy(true);
    try {
      await proposeBond(userId, friend.id, "cp");
      onToast?.(`CP proposal sent to ${friend.display_name}`);
      const friends = await loadMutualFriends(userId);
      setCandidates(await loadChurchCandidates(userId, friends));
      setMyCpSlots(await loadCpSlotInfo(userId));
    } catch (err) {
      onToast?.(err?.message ?? "Could not propose");
    } finally {
      setBusy(false);
    }
  }

  async function handleScheduleWedding() {
    if (!myBond || busy) return;
    const partnerId = partnerUserId(myBond, userId);
    const d = new Date();
    d.setHours(selectedSlot, 0, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    setBusy(true);
    try {
      await scheduleWedding(userId, partnerId, selectedRing, d);
      onToast?.("Wedding scheduled!");
      setMySchedule(await loadMyWeddingSchedule(userId));
      setTodaysWeddings(await loadTodaysWeddings());
    } catch (err) {
      onToast?.(err?.message ?? "Could not schedule");
    } finally {
      setBusy(false);
    }
  }

  const coupleBond = myBond && (myBond.bondType === "cp" || myBond.bondType === "wedding");

  if (selectedWedding) {
    const ring = ringMeta(selectedWedding.ringType);
    const inviteCard = (
      <div className="gplay-mobile-shell-backdrop" onClick={() => setSelectedWedding(null)}>
        <div className="church-wedding-invite-card" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="church-back" onClick={() => setSelectedWedding(null)} aria-label="Back">‹</button>
          <div className="church-wedding-invite-hero">
            <span className="church-wedding-invite-ring" aria-hidden>{ring.emoji}</span>
            <h3>Wedding Invitation</h3>
            <p className="church-wedding-invite-time">{formatSlotTime(selectedWedding.scheduledAt)}</p>
          </div>
          <div className="church-wedding-invite-couple">
            <AvatarImg
              src={selectedWedding.userA.avatar_url}
              fallback={selectedWedding.userA.display_name}
              className="church-wedding-invite-avatar"
              imgClassName="church-wedding-invite-avatar"
            />
            <span className="church-wedding-invite-heart" aria-hidden>💕</span>
            <AvatarImg
              src={selectedWedding.userB.avatar_url}
              fallback={selectedWedding.userB.display_name}
              className="church-wedding-invite-avatar"
              imgClassName="church-wedding-invite-avatar"
            />
          </div>
          <p className="church-wedding-invite-names">
            {selectedWedding.userA.display_name} & {selectedWedding.userB.display_name}
          </p>
          <p className="church-wedding-invite-ring-label">{ring.label ?? "Wedding ring"}</p>
          <button type="button" className="primary-btn" onClick={() => onToast?.("RSVP saved — see you at the chapel!")}>
            Accept invitation
          </button>
        </div>
      </div>
    );
    return createPortal(inviteCard, document.body);
  }

  const sheet = (
    <div className="gplay-mobile-shell-backdrop" onClick={onClose}>
      <div className="gplay-mobile-shell church-sheet church-sheet--full" onClick={(e) => e.stopPropagation()}>
        <header className="church-header church-header--full">
          <button type="button" className="church-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <nav className="church-header-tabs" aria-label="Church sections">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`church-header-tab ${tab === t.key ? "church-header-tab--active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <button type="button" className="church-help" aria-label="Help">?</button>
        </header>

        {tab !== "divorce" && (
          <div className="church-mode-ctas">
            <button
              type="button"
              className={`church-mode-cta church-mode-cta--propose ${tab === "propose" ? "church-mode-cta--active" : ""}`}
              onClick={() => setTab("propose")}
            >
              Propose
            </button>
            <button
              type="button"
              className={`church-mode-cta church-mode-cta--wedding ${tab === "wedding" ? "church-mode-cta--active" : ""}`}
              onClick={() => setTab("wedding")}
            >
              Wedding
            </button>
          </div>
        )}

        {tab === "propose" && (
          <div className="church-body">
            <div className="church-propose-card">
              <UiIcon Icon={IconHeart} variant="lg" className="church-propose-art" />
              <h3>Propose to your special one</h3>
              <p>
                Guard reaches {formatCompactNumber(GUARD_PROPOSE_CP)} → propose via Protect + Send Gift
              </p>
              {myCpSlots && (
                <p className="church-cp-slots">
                  Your CP slots: {myCpSlots.used}/{myCpSlots.limit}
                  {!myCpSlots.hasGender && " · Set gender in profile first"}
                  {myCpSlots.hasGender && myCpSlots.remaining <= 0 && " · CP limit reached"}
                </p>
              )}
            </div>
            <p className="church-section-title">Select members</p>
            <ul className="church-member-list">
              {candidates.length === 0 && (
                <li className="church-member church-member--empty">Add mutual friends first</li>
              )}
              {candidates.map((friend) => {
                const initial = (friend.display_name || "?").charAt(0).toUpperCase();
                return (
                  <li key={friend.id} className="church-member">
                    <AvatarImg
                      src={friend.avatar_url}
                      fallback={initial}
                      className="church-member-avatar church-member-avatar--fallback"
                      imgClassName="church-member-avatar"
                    />
                    <div className="church-member-meta">
                      <span className="church-member-name">{friend.display_name}</span>
                      <span className="church-member-guard">
                        <UiIcon Icon={IconGuard} className="church-member-guard-icon" />{" "}
                        {formatCompactNumber(friend.guardMine)} / {formatCompactNumber(GUARD_PROPOSE_CP)}
                      </span>
                      {friend.activeBond && (
                        <span className="church-member-bond">{friend.activeBond}</span>
                      )}
                      {friend.pendingBond && (
                        <span className="church-member-bond">{friend.pendingBond} pending</span>
                      )}
                      {friend.blockReason && (
                        <span className="church-member-block">{friend.blockReason}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="church-propose-btn"
                      disabled={busy || !friend.canPropose}
                      onClick={() => handlePropose(friend)}
                    >
                      Propose
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {tab === "wedding" && (
          <div className="church-body">
            <div className="church-wedding-intro">
              <UiIcon Icon={IconChurch} variant="lg" className="church-wedding-intro-icon" />
              <p>Go propose to her/him, then schedule your wedding here.</p>
            </div>

            {coupleBond && !mySchedule && (
              <div className="church-schedule-form">
                <p className="church-section-title">Schedule your wedding</p>
                <label className="field-label">Ring</label>
                <div className="church-ring-picker">
                  {WEDDING_RING_TYPES.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      className={selectedRing === r.key ? "church-ring--active" : ""}
                      onClick={() => setSelectedRing(r.key)}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </div>
                <label className="field-label">Time slot</label>
                <select value={selectedSlot} onChange={(e) => setSelectedSlot(Number(e.target.value))}>
                  {WEDDING_TIME_SLOTS.map((s) => (
                    <option key={s.hour} value={s.hour}>{s.label}</option>
                  ))}
                </select>
                <button type="button" className="primary-btn" disabled={busy} onClick={handleScheduleWedding}>
                  Schedule wedding
                </button>
              </div>
            )}

            {mySchedule && (
              <div className="church-my-schedule">
                {(() => {
                  const phase = weddingCeremonyPhase(mySchedule.scheduledAt);
                  return (
                    <>
                      <span className={`church-wedding-phase church-wedding-phase--${phase.status}`}>
                        {phase.label}
                      </span>
                      <p>
                        Your wedding: {formatSlotTime(mySchedule.scheduledAt)} · {ringMeta(mySchedule.ringType).emoji}
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            <p className="church-section-title church-section-title--wedding">
              Today&apos;s Wedding
            </p>
            <ul className="church-wedding-list">
              {todaysWeddings.length === 0 && (
                <li className="church-wedding-row church-wedding-row--empty">No weddings scheduled today</li>
              )}
              {todaysWeddings.map((w) => {
                const ring = ringMeta(w.ringType);
                const phase = weddingCeremonyPhase(w.scheduledAt);
                return (
                  <li key={w.id}>
                    <button
                      type="button"
                      className="church-wedding-row church-wedding-row--btn"
                      onClick={() => setSelectedWedding(w)}
                    >
                      <span className="church-wedding-row-time">{formatSlotTime(w.scheduledAt)}</span>
                      <span className="church-wedding-row-names">
                        {w.userA.display_name} & {w.userB.display_name}
                      </span>
                      <span className="church-wedding-row-ring" aria-hidden>{ring.emoji}</span>
                      {phase.label && (
                        <span className={`church-wedding-phase church-wedding-phase--${phase.status}`}>
                          {phase.label}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {tab === "divorce" && (
          <div className="church-body church-body--center">
            {!coupleBond ? (
              <>
                <p className="church-single">You are still single</p>
                <button type="button" className="primary-btn" onClick={() => setTab("propose")}>
                  Go Propose
                </button>
              </>
            ) : (
              <>
                <p className="church-single">End relationship from Intimate Space menu</p>
                <button type="button" className="church-divorce-btn" onClick={onClose}>
                  Back
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
