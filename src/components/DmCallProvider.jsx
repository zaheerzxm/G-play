import { useCallback, useEffect, useRef, useState } from "react";
import { DmCallContext } from "../context/DmCallContext.jsx";
import {
  RING_TIMEOUT_MS,
  answerDmCall,
  cancelDmCall,
  endDmCall,
  loadActiveCall,
  loadPendingIncomingCall,
  markDmCallMissed,
  rejectDmCall,
  startDmCall,
  subscribeDmCalls,
} from "../dmCalls.js";
import { loadProfilesForUserIds } from "../profile.js";
import DmCallOverlay from "./DmCallOverlay.jsx";

function peerFromCall(call, userId, profiles) {
  if (!call) return null;
  const peerId = call.caller_id === userId ? call.callee_id : call.caller_id;
  return profiles[peerId] ?? { id: peerId, display_name: "Friend" };
}

export default function DmCallProvider({ userId, displayName, children }) {
  const [call, setCall] = useState(null);
  const [peer, setPeer] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [role, setRole] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const ringTimerRef = useRef(null);

  const resetCall = useCallback(() => {
    setCall(null);
    setPeer(null);
    setPhase("idle");
    setRole(null);
    setBusy(false);
    if (ringTimerRef.current) {
      clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  }, []);

  const showNotice = useCallback((text) => {
    setNotice(text);
    setTimeout(() => setNotice(null), 3500);
  }, []);

  const applyCallRow = useCallback(
    async (row) => {
      if (!row || !userId) return;

      const profiles = await loadProfilesForUserIds([row.caller_id, row.callee_id]);
      const nextPeer = peerFromCall(row, userId, profiles);
      const nextRole = row.caller_id === userId ? "caller" : "callee";

      if (row.status === "ringing" && isRingingRow(row)) {
        setCall(row);
        setPeer(nextPeer);
        setRole(nextRole);
        setPhase(nextRole === "caller" ? "outgoing" : "incoming");
        return;
      }

      if (row.status === "active") {
        setCall(row);
        setPeer(nextPeer);
        setRole(nextRole);
        setPhase("active");
        return;
      }

      if (row.status === "rejected" && nextRole === "caller") {
        showNotice(`${nextPeer.display_name} declined`);
        resetCall();
        return;
      }

      if (row.status === "missed") {
        if (nextRole === "caller") showNotice("No answer");
        resetCall();
        return;
      }

      if (row.status === "ended" || row.status === "rejected") {
        resetCall();
      }
    },
    [userId, resetCall, showNotice],
  );

  useEffect(() => {
    if (!userId) return undefined;

    let active = true;

    (async () => {
      const incoming = await loadPendingIncomingCall(userId);
      const ongoing = await loadActiveCall(userId);
      if (!active) return;
      if (ongoing) await applyCallRow(ongoing);
      else if (incoming) await applyCallRow(incoming);
    })();

    const unsub = subscribeDmCalls(userId, {
      onChange: (row) => {
        applyCallRow(row);
      },
    });

    return () => {
      active = false;
      unsub();
    };
  }, [userId, applyCallRow]);

  useEffect(() => {
    if ((phase !== "outgoing" && phase !== "incoming") || !call?.id) return undefined;

    ringTimerRef.current = setTimeout(() => {
      markDmCallMissed(call.id).then((row) => {
        if (row) {
          if (role === "caller") showNotice("No answer");
          resetCall();
        }
      });
    }, RING_TIMEOUT_MS);

    return () => {
      if (ringTimerRef.current) {
        clearTimeout(ringTimerRef.current);
        ringTimerRef.current = null;
      }
    };
  }, [phase, call?.id, role, resetCall, showNotice]);

  async function startCall(friend) {
    if (!friend?.id || busy || phase !== "idle") return;
    setBusy(true);
    try {
      const row = await startDmCall(userId, friend.id);
      setCall(row);
      setPeer(friend);
      setRole("caller");
      setPhase("outgoing");
    } catch (e) {
      showNotice(e.message ?? "Could not start call");
    } finally {
      setBusy(false);
    }
  }

  async function answerCall() {
    if (!call?.id || busy || phase !== "incoming") return;
    setBusy(true);
    try {
      const row = await answerDmCall(call.id, userId);
      setCall(row);
      setPhase("active");
    } catch (e) {
      showNotice(e.message ?? "Could not answer");
      resetCall();
    } finally {
      setBusy(false);
    }
  }

  async function rejectCall() {
    if (!call?.id || busy) return;
    setBusy(true);
    try {
      await rejectDmCall(call.id, userId);
    } catch {
      /* ignore */
    } finally {
      resetCall();
    }
  }

  async function cancelCall() {
    if (!call?.id || busy) return;
    setBusy(true);
    try {
      await cancelDmCall(call.id, userId);
    } catch {
      /* ignore */
    } finally {
      resetCall();
    }
  }

  async function hangUp() {
    if (!call?.id) {
      resetCall();
      return;
    }
    setBusy(true);
    try {
      await endDmCall(call.id, userId);
    } catch {
      /* ignore */
    } finally {
      resetCall();
    }
  }

  const inCall = phase !== "idle";

  return (
    <DmCallContext.Provider value={{ startCall, phase, inCall, busy }}>
      {children}
      {notice && <p className="dm-call-toast">{notice}</p>}
      {phase !== "idle" && (
        <DmCallOverlay
          phase={phase}
          peer={peer}
          displayName={displayName}
          userId={userId}
          roomName={call?.room_name}
          busy={busy}
          onAnswer={answerCall}
          onReject={rejectCall}
          onCancel={cancelCall}
          onHangUp={hangUp}
        />
      )}
    </DmCallContext.Provider>
  );
}

function isRingingRow(row) {
  if (!row || row.status !== "ringing") return false;
  return Date.now() - new Date(row.created_at).getTime() < RING_TIMEOUT_MS;
}
