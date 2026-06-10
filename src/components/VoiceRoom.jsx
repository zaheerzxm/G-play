import { useEffect, useMemo, useRef, useState } from "react";
import { VoiceContext } from "../context/VoiceContext.jsx";
import { LIVEKIT_URL, isLiveKitConfigured } from "../livekit.js";
import { LiveKitConnectionManager, connectToVoiceRoom } from "../livekitManager.js";

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
  const [voiceError, setVoiceError] = useState(null);
  const [micError, setMicError] = useState(null);
  const [micEnabled, setMicEnabled] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);
  const [walkieTargetId, setWalkieTargetId] = useState(null);
  const [walkieSession, setWalkieSession] = useState({
    active: false,
    outgoingTargetId: null,
    incomingFromId: null,
  });

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
    manager.onStatusChange = (status) => {
      onVoiceStatus?.(status);
      if (status === "connected") setVoiceReady(true);
      if (status === "disconnected") {
        setVoiceReady(false);
        setMicEnabled(false);
        setSpeakerEnabled(true);
      }
    };

    return () => {
      manager.onSpeakingChange = null;
      manager.onMicError = null;
      manager.onWalkieStateChange = null;
      manager.onStatusChange = null;
    };
  }, [manager, onSpeakingChange, onVoiceStatus]);

  const connectGenRef = useRef(0);

  // Connect once when entering a voice room (not on every seat change).
  useEffect(() => {
    if (!isLiveKitConfigured() || !roomName || !participantName || !participantIdentity) {
      onVoiceStatus?.("off");
      return undefined;
    }

    const gen = ++connectGenRef.current;
    onVoiceStatus?.("connecting");
    setVoiceError(null);

    (async () => {
      try {
        await connectToVoiceRoom(manager, {
          roomName,
          participantName,
          participantIdentity,
          isSeated,
          serverUrl: LIVEKIT_URL,
        });
        if (gen !== connectGenRef.current) return;
        setMicEnabled(manager.isMicrophoneEnabled);
        setSpeakerEnabled(manager.isSpeakerEnabled);
        setVoiceError(null);
      } catch (e) {
        if (gen !== connectGenRef.current) return;
        setVoiceError(e.message ?? "Voice connection failed");
        onVoiceStatus?.("error");
        setVoiceReady(false);
      }
    })();

    return () => {
      if (gen === connectGenRef.current) {
        manager.disconnect().catch(() => {});
      }
    };
  }, [roomName, participantName, participantIdentity, manager, onVoiceStatus]);

  useEffect(() => {
    userMicPrefRef.current = null;
  }, [roomName]);

  // Seat change: seating permission only — user mic preference persists across moves.
  useEffect(() => {
    if (!voiceReady) return;
    (async () => {
      await manager.applySeatState(isSeated);
      if (!isSeated) {
        setMicEnabled(false);
        return;
      }
      if (!seatMicAllowed) {
        await manager.setMicrophoneEnabled(false);
        setMicEnabled(false);
        setMicError(null);
        return;
      }
      const wantMic = userMicPrefRef.current === true;
      if (wantMic && !manager.isMicrophoneEnabled) {
        const ok = await manager.setMicrophoneEnabled(true);
        setMicEnabled(ok);
        setMicError(ok ? null : "Tap mic to enable your microphone");
        return;
      }
      setMicEnabled(manager.isMicrophoneEnabled);
      if (!manager.isMicrophoneEnabled) {
        setMicError("Tap mic to enable your microphone");
      } else {
        setMicError(null);
      }
    })();
  }, [isSeated, seatMicAllowed, voiceReady, manager]);

  useEffect(() => {
    if (!voiceReady) return undefined;

    let recovering = false;
    const recover = async () => {
      if (recovering || !manager.connected) return;
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

  const voiceContext = useMemo(
    () => ({
      manager,
      isSeated,
      voiceReady,
      micEnabled,
      speakerEnabled,
      seatMicAllowed,
      walkieTargetId,
      walkieSession,
      async toggleMic() {
        if (!isSeated || !manager.connected || !seatMicAllowed) return;
        setMicError(null);
        const next = !manager.isMicrophoneEnabled;
        const ok = await manager.setMicrophoneEnabled(next);
        if (ok) {
          userMicPrefRef.current = next;
          setMicEnabled(next);
        }
      },
      async toggleSpeaker() {
        if (!manager.connected) return;
        setSpeakerEnabled(await manager.toggleSpeaker());
      },
      async recoverAudio() {
        if (!manager.connected) return;
        await manager.recoverAudio();
        setSpeakerEnabled(manager.isSpeakerEnabled);
      },
      async startWalkieTalk(targetId) {
        if (!manager.connected || !targetId) return false;
        setMicError(null);
        const ok = await manager.startWalkieTalk(targetId);
        setWalkieTargetId(ok ? targetId : null);
        setMicEnabled(manager.isMicrophoneEnabled);
        return ok;
      },
      async stopWalkieTalk() {
        await manager.stopWalkieTalk();
        setWalkieTargetId(null);
        setWalkieSession({ active: false, outgoingTargetId: null, incomingFromId: null });
        setMicEnabled(manager.isMicrophoneEnabled);
      },
      async enableMicFromGesture() {
        if (!isSeated || !manager.connected) return;
        setMicError(null);
        const ok = await manager.startPublishing();
        setMicEnabled(ok);
      },
    }),
    [manager, isSeated, seatMicAllowed, voiceReady, micEnabled, speakerEnabled, walkieTargetId, walkieSession],
  );

  if (!isLiveKitConfigured()) {
    return children;
  }

  return (
    <VoiceContext.Provider value={voiceContext}>
      {voiceError && <p className="banner voice-banner">{voiceError}</p>}
      {children}
    </VoiceContext.Provider>
  );
}
