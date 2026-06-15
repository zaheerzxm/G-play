import { useEffect, useMemo, useRef, useState } from "react";
import { VoiceContext } from "../context/VoiceContext.jsx";
import { LIVEKIT_URL, isLiveKitConfigured } from "../livekit.js";
import { LiveKitConnectionManager, connectToVoiceRoom } from "../livekitManager.js";

function isBenignVoiceError(err) {
  const msg = String(err?.message ?? err ?? "").toLowerCase();
  if (!msg) return true;
  return (
    msg.includes("abort")
    || msg.includes("signal connection")
    || msg.includes("cancel")
    || msg.includes("disconnect")
    || msg.includes("client initiated")
    || msg.includes("leaving")
    || msg.includes("user aborted")
  );
}

export default function VoiceRoom({
  roomName,
  participantName,
  participantIdentity,
  isSeated,
  seatMicAllowed = true,
  onSpeakingChange,
  onVoiceStatus,
  children,
}) {
  const managerRef = useRef(null);
  const userMicPrefRef = useRef(null);
  const [micError, setMicError] = useState(null);
  const [micEnabled, setMicEnabled] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("off");
  const [voiceError, setVoiceError] = useState(null);
  const [connectAttempt, setConnectAttempt] = useState(0);
  const [walkieTargetId, setWalkieTargetId] = useState(null);
  const [walkieSession, setWalkieSession] = useState({
    active: false,
    outgoingTargetId: null,
    incomingFromId: null,
  });
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  if (!managerRef.current) {
    managerRef.current = new LiveKitConnectionManager();
  }

  const manager = managerRef.current;

  useEffect(() => {
    manager.onSpeakingChange = (ids) => onSpeakingChange?.(ids);
    manager.onMicError = (msg) => setMicError(msg);
    manager.onWalkieStateChange = (state) => {
      setWalkieSession(state);
      setWalkieTargetId(state.outgoingTargetId || null);
    };
    manager.onAudioUnlockChange = (unlocked) => setAudioUnlocked(unlocked);
    manager.onStatusChange = (status) => {
      onVoiceStatus?.(status);
      if (status === "connected") {
        setVoiceReady(true);
        setVoiceStatus("connected");
        setVoiceError(null);
      }
      if (status === "disconnected") {
        setVoiceReady(false);
        setVoiceStatus("off");
        setMicEnabled(false);
        setSpeakerEnabled(true);
        setAudioUnlocked(false);
      }
    };

    return () => {
      manager.onSpeakingChange = null;
      manager.onMicError = null;
      manager.onWalkieStateChange = null;
      manager.onAudioUnlockChange = null;
      manager.onStatusChange = null;
    };
  }, [manager, onSpeakingChange, onVoiceStatus]);

  const connectGenRef = useRef(0);
  const seatGenRef = useRef(0);

  // Connect once when entering a voice room (not on every seat change).
  useEffect(() => {
    if (!isLiveKitConfigured() || !roomName || !participantName || !participantIdentity) {
      onVoiceStatus?.("off");
      setVoiceStatus("off");
      setVoiceError(null);
      return undefined;
    }

    const gen = ++connectGenRef.current;
    setVoiceStatus("connecting");
    setVoiceError(null);
    onVoiceStatus?.("connecting");
    (async () => {
      try {
        await connectToVoiceRoom(manager, {
          roomName,
          participantName,
          participantIdentity,
          serverUrl: LIVEKIT_URL,
        });
        if (gen !== connectGenRef.current) return;
        setMicEnabled(manager.isMicrophoneEnabled);
        setSpeakerEnabled(manager.isSpeakerEnabled);
      } catch (e) {
        if (gen !== connectGenRef.current) return;
        const message = e?.message ?? "Voice connection failed";
        if (!isBenignVoiceError(e)) {
          console.warn("[voice]", message);
        }
        setVoiceReady(false);
        setVoiceStatus("error");
        setVoiceError(message);
        onVoiceStatus?.("error");
      }
    })();

    return () => {
      if (gen === connectGenRef.current) {
        manager.disconnect().catch(() => {});
      }
    };
  }, [roomName, participantName, participantIdentity, manager, onVoiceStatus, connectAttempt]);

  useEffect(() => {
    userMicPrefRef.current = null;
  }, [roomName]);

  // Seat change: seating permission only — user mic preference persists across moves.
  useEffect(() => {
    if (!voiceReady) return;
    const gen = ++seatGenRef.current;
    (async () => {
      await manager.applySeatState(isSeated);
      if (gen !== seatGenRef.current) return;
      if (!isSeated) {
        setMicEnabled(false);
        return;
      }
      if (!seatMicAllowed) {
        await manager.setMicrophoneEnabled(false);
        if (gen !== seatGenRef.current) return;
        setMicEnabled(false);
        setMicError(null);
        return;
      }
      const wantMic =
        userMicPrefRef.current !== null ? userMicPrefRef.current : manager.isMicrophoneEnabled;
      if (wantMic !== manager.isMicrophoneEnabled) {
        const ok = await manager.setMicrophoneEnabled(wantMic);
        if (gen !== seatGenRef.current) return;
        setMicEnabled(ok && wantMic);
        setMicError(ok || !wantMic ? null : "Tap mic to enable your microphone");
        return;
      }
      setMicEnabled(manager.isMicrophoneEnabled);
      setMicError(
        manager.isMicrophoneEnabled ? null : "Tap mic to enable your microphone",
      );
    })();
  }, [isSeated, seatMicAllowed, voiceReady, manager]);

  useEffect(() => {
    if (!voiceReady) return undefined;

    let recovering = false;
    const recover = async () => {
      if (recovering || !manager.connected || !manager.isAudioUnlocked) return;
      recovering = true;
      try {
        await manager.recoverAudio();
        setSpeakerEnabled(manager.isSpeakerEnabled);
        setMicEnabled(manager.isMicrophoneEnabled);
      } finally {
        recovering = false;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") recover();
    };

    window.addEventListener("focus", recover);
    window.addEventListener("pageshow", recover);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", recover);
      window.removeEventListener("pageshow", recover);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [manager, voiceReady]);

  useEffect(() => {
    if (!voiceReady || !manager.connected || manager.isAudioUnlocked) return;
    let cancelled = false;
    (async () => {
      await manager.unlockAudioFromGesture();
      if (cancelled) return;
      setAudioUnlocked(manager.isAudioUnlocked);
      setSpeakerEnabled(manager.isSpeakerEnabled);
    })();
    return () => {
      cancelled = true;
    };
  }, [manager, voiceReady]);

  const retryConnect = useMemo(
    () => () => setConnectAttempt((n) => n + 1),
    [],
  );

  const voiceContext = useMemo(
    () => ({
      manager,
      isSeated,
      voiceReady,
      voiceStatus,
      voiceError,
      micError,
      retryConnect,
      micEnabled,
      speakerEnabled,
      seatMicAllowed,
      walkieTargetId,
      walkieSession,
      audioUnlocked,
      async unlockAudioFromGesture() {
        if (!manager.connected) return false;
        const ok = await manager.unlockAudioFromGesture();
        setAudioUnlocked(manager.isAudioUnlocked);
        setSpeakerEnabled(manager.isSpeakerEnabled);
        return ok;
      },
      async toggleMic() {
        if (!isSeated || !manager.connected || !seatMicAllowed) return;
        setMicError(null);
        await manager.unlockAudioFromGesture();
        setAudioUnlocked(manager.isAudioUnlocked);
        await manager.applySeatState(true);
        const next = !manager.isMicrophoneEnabled;
        const ok = await manager.setMicrophoneEnabled(next);
        userMicPrefRef.current = ok ? next : userMicPrefRef.current;
        if (ok) {
          setMicEnabled(next);
        } else if (next) {
          setMicError("Tap mic to enable your microphone");
        }
      },
      async toggleSpeaker() {
        if (!manager.connected) return;
        await manager.unlockAudioFromGesture();
        setAudioUnlocked(manager.isAudioUnlocked);
        setSpeakerEnabled(await manager.toggleSpeaker());
      },
      async recoverAudio() {
        if (!manager.connected) return;
        await manager.unlockAudioFromGesture();
        setAudioUnlocked(manager.isAudioUnlocked);
        setSpeakerEnabled(manager.isSpeakerEnabled);
      },
      async startWalkieTalk(targetId) {
        if (!manager.connected || !targetId) return false;
        setMicError(null);
        await manager.unlockAudioFromGesture();
        setAudioUnlocked(manager.isAudioUnlocked);
        const ok = await manager.startWalkieTalk(targetId);
        setWalkieTargetId(ok ? targetId : null);
        setMicEnabled(manager.isMicrophoneEnabled);
        return ok;
      },
      async stopWalkieTalk() {
        setWalkieSession({ active: false, outgoingTargetId: null, incomingFromId: null });
        setWalkieTargetId(null);
        await manager.stopWalkieTalk();
        setMicEnabled(manager.isMicrophoneEnabled);
      },
      async enableMicFromGesture() {
        if (!isSeated || !manager.connected) return;
        setMicError(null);
        await manager.unlockAudioFromGesture();
        setAudioUnlocked(manager.isAudioUnlocked);
        const ok = await manager.startPublishing();
        setMicEnabled(ok);
      },
    }),
    [
      manager,
      isSeated,
      seatMicAllowed,
      voiceReady,
      voiceStatus,
      voiceError,
      micError,
      retryConnect,
      micEnabled,
      speakerEnabled,
      audioUnlocked,
      walkieTargetId,
      walkieSession,
    ],
  );

  if (!isLiveKitConfigured()) {
    return children;
  }

  return (
    <VoiceContext.Provider value={voiceContext}>
      {children}
    </VoiceContext.Provider>
  );
}
