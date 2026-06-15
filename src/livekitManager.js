import { Room, RoomEvent, Track, createLocalAudioTrack } from "livekit-client";
import { fetchLiveKitToken } from "./livekit.js";

/** Normalized audio level (0–1) above which a seat avatar shows speaking. */
export const SPEAKING_AUDIO_THRESHOLD = 0.08;
const WALKIE_TRACK_PREFIX = "walkie:";

export class LiveKitConnectionManager {
  constructor() {
    this.room = new Room({
      adaptiveStream: false,
      dynacast: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.audioElements = [];
    this.trackElements = new Map();
    this.remoteAudioTracks = new Set();
    this._cleanup = [];
    this._speakingTimer = null;
    this.onSpeakingChange = null;
    this.onStatusChange = null;
    this.onMicError = null;
    this._micEnabled = false;
    this._speakerEnabled = true;
    this._isSeated = false;
    this._walkieTrack = null;
    this._walkieTargetIdentity = null;
    this._walkieRestoreMic = false;
    this._ignoredIncomingWalkie = new Set();
    this._audioUnlocked = false;
    this._pendingAudioAttachments = [];
    this.onWalkieStateChange = null;
    this.onAudioUnlockChange = null;
  }

  get isAudioUnlocked() {
    return this._audioUnlocked;
  }

  _isLiveWalkieIncomingPublication(pub, localId, participantIdentity) {
    if (!pub?.track) return false;
    const target = this._walkieTargetFromPublication(pub);
    if (target !== localId) return false;
    if (participantIdentity && this._ignoredIncomingWalkie.has(participantIdentity)) return false;
    if (pub.isSubscribed === false) return false;
    if (pub.isMuted) return false;
    const mst = pub.track.mediaStreamTrack;
    if (!mst || mst.readyState === "ended") return false;
    if (pub.track.isMuted) return false;
    return true;
  }

  async _unsubscribeIncomingWalkieFrom(participantIdentity) {
    const localId = this.room.localParticipant?.identity;
    if (!localId || !participantIdentity) return;

    const participant = this.room.remoteParticipants.get(participantIdentity);
    if (!participant) return;

    for (const pub of participant.audioTrackPublications.values()) {
      if (this._walkieTargetFromPublication(pub) !== localId) continue;
      const track = pub.track;
      if (track) {
        this._unregisterRemoteAudioTrack(track);
        try {
          track.detach().forEach((el) => el.remove());
        } catch {
          /* ok */
        }
      }
      try {
        await pub.setSubscribed(false);
      } catch {
        /* ok */
      }
    }
  }

  _getWalkieState() {
    const localId = this.room.localParticipant?.identity;
    if (!localId || !this.connected) {
      return { active: false, outgoingTargetId: null, incomingFromId: null };
    }

    const outgoingTargetId =
      this._walkieTrack && this._walkieTargetIdentity ? this._walkieTargetIdentity : null;
    let incomingFromId = null;

    for (const participant of this.room.remoteParticipants.values()) {
      for (const pub of participant.audioTrackPublications.values()) {
        if (!this._isLiveWalkieIncomingPublication(pub, localId, participant.identity)) continue;
        incomingFromId = participant.identity;
        break;
      }
      if (incomingFromId) break;
    }

    return {
      active: Boolean(outgoingTargetId || incomingFromId),
      outgoingTargetId,
      incomingFromId,
    };
  }

  _emitWalkieState() {
    this.onWalkieStateChange?.(this._getWalkieState());
  }

  get connected() {
    return this.room.state === "connected";
  }

  get isMicrophoneEnabled() {
    return this._micEnabled;
  }

  get isSpeakerEnabled() {
    return this._speakerEnabled;
  }

  _registerRemoteAudioTrack(track) {
    if (!track || track.kind !== Track.Kind.Audio) return;
    this.remoteAudioTracks.add(track);
    this._applyTrackVolume(track);
  }

  _unregisterRemoteAudioTrack(track) {
    if (!track) return;
    this.remoteAudioTracks.delete(track);
    const el = this.trackElements.get(track);
    if (el) {
      el.remove();
      this.trackElements.delete(track);
      this.audioElements = this.audioElements.filter((node) => node !== el);
    }
  }

  _applyTrackVolume(track) {
    const on = this._speakerEnabled;
    const vol = on ? 1 : 0;
    try {
      if (typeof track.setVolume === "function") track.setVolume(vol);
    } catch {
      /* ok */
    }
    try {
      if (track.mediaStreamTrack) track.mediaStreamTrack.enabled = on;
    } catch {
      /* ok */
    }
  }

  _publicationTrackName(publication) {
    return publication?.trackName || publication?.name || "";
  }

  _walkieTargetFromPublication(publication) {
    const name = this._publicationTrackName(publication);
    return name.startsWith(WALKIE_TRACK_PREFIX) ? name.slice(WALKIE_TRACK_PREFIX.length) : null;
  }

  _shouldAttachRemoteAudioTrack(publication, participant) {
    if (participant?.isLocal) return false;
    if (participant?.identity === this.room.localParticipant?.identity) return false;

    const walkieTarget = this._walkieTargetFromPublication(publication);
    if (!walkieTarget) return true;
    return walkieTarget === this.room.localParticipant?.identity;
  }

  _queueRemoteAudioTrack(track, publication, participant) {
    if (this._pendingAudioAttachments.some((entry) => entry.track === track)) return;
    this._pendingAudioAttachments.push({ track, publication, participant });
  }

  _removePendingAudioTrack(track) {
    this._pendingAudioAttachments = this._pendingAudioAttachments.filter((entry) => entry.track !== track);
  }

  _flushPendingAudioAttachments() {
    const pending = this._pendingAudioAttachments.splice(0);
    for (const { track, publication, participant } of pending) {
      this._doAttachRemoteAudioTrack(track, publication, participant);
    }
  }

  _doAttachRemoteAudioTrack(track, publication, participant) {
    const existing = this.trackElements.get(track);
    if (existing?.isConnected) return existing;
    if (existing) {
      existing.remove();
      this.audioElements = this.audioElements.filter((node) => node !== existing);
    }

    const el = track.attach();
    const isWalkie = Boolean(this._walkieTargetFromPublication(publication));
    el.setAttribute("data-livekit-audio", isWalkie ? "walkie" : "remote");
    el.autoplay = true;
    el.playsInline = true;
    el.muted = !this._speakerEnabled;
    el.volume = this._speakerEnabled ? 1 : 0;
    document.body.appendChild(el);
    this.trackElements.set(track, el);
    this.audioElements.push(el);
    return el;
  }

  _attachRemoteAudioTrack(track, publication, participant) {
    if (!track || track.kind !== Track.Kind.Audio) return null;
    if (!this._shouldAttachRemoteAudioTrack(publication, participant)) return null;
    this._registerRemoteAudioTrack(track);

    if (!this._audioUnlocked) {
      this._queueRemoteAudioTrack(track, publication, participant);
      return null;
    }

    return this._doAttachRemoteAudioTrack(track, publication, participant);
  }

  _syncExistingRemoteAudio() {
    for (const participant of this.room.remoteParticipants.values()) {
      for (const pub of participant.audioTrackPublications.values()) {
        if (pub.track) this._attachRemoteAudioTrack(pub.track, pub, participant);
      }
    }
  }

  _applySpeakerState() {
    const on = this._speakerEnabled;
    const vol = on ? 1 : 0;

    for (const track of this.remoteAudioTracks) {
      this._applyTrackVolume(track);
    }

    for (const el of this.audioElements) {
      el.muted = !on;
      el.volume = vol;
    }

    document.querySelectorAll("audio[data-livekit-audio='remote']").forEach((el) => {
      el.muted = !on;
      el.volume = vol;
    });
  }

  async setSpeakerEnabled(enabled) {
    this._speakerEnabled = enabled;
    this._applySpeakerState();
    if (enabled && this.connected) {
      await this.recoverAudio();
    }
    return this._speakerEnabled;
  }

  async toggleSpeaker() {
    return this.setSpeakerEnabled(!this._speakerEnabled);
  }

  _emitStatus(status) {
    this.onStatusChange?.(status);
  }

  _emitSpeaking() {
    if (!this.onSpeakingChange) return;

    const speaking = new Set();
    const local = this.room.localParticipant;

    if (
      local.isMicrophoneEnabled &&
      local.audioLevel >= SPEAKING_AUDIO_THRESHOLD
    ) {
      speaking.add(local.identity);
    }

    for (const participant of this.room.remoteParticipants.values()) {
      if (participant.audioLevel >= SPEAKING_AUDIO_THRESHOLD) {
        speaking.add(participant.identity);
      }
    }

    this.onSpeakingChange(speaking);
  }

  _watchSpeaking() {
    const handler = () => this._emitSpeaking();
    this.room.on(RoomEvent.ActiveSpeakersChanged, handler);
    this._cleanup.push(() => this.room.off(RoomEvent.ActiveSpeakersChanged, handler));

    this._speakingTimer = setInterval(handler, 100);
    this._cleanup.push(() => clearInterval(this._speakingTimer));
  }

  _detachWalkieRemoteAudio() {
    const localId = this.room.localParticipant?.identity;
    if (!localId) return;

    for (const participant of this.room.remoteParticipants.values()) {
      for (const pub of participant.audioTrackPublications.values()) {
        if (!this._walkieTargetFromPublication(pub)) continue;
        if (this._walkieTargetFromPublication(pub) !== localId) continue;
        const track = pub.track;
        if (!track) continue;
        this._unregisterRemoteAudioTrack(track);
        try {
          track.detach().forEach((el) => el.remove());
        } catch {
          /* ok */
        }
      }
    }
  }

  _isIncomingWalkiePublication(publication, participant) {
    const localId = this.room.localParticipant?.identity;
    if (!localId || participant?.isLocal) return false;
    return this._walkieTargetFromPublication(publication) === localId;
  }

  _onIncomingWalkiePublished(publication, participant) {
    if (publication?.kind !== Track.Kind.Audio) return;
    if (!this._isIncomingWalkiePublication(publication, participant)) return;
    // New publish = fresh session; clear dismiss so the overlay can show again.
    this._ignoredIncomingWalkie.delete(participant.identity);
    this._emitWalkieState();
  }

  _onIncomingWalkieEnded(publication, participant) {
    if (!this._isIncomingWalkiePublication(publication, participant)) return;
    const track = publication.track;
    if (track) {
      this._unregisterRemoteAudioTrack(track);
      try {
        track.detach().forEach((el) => el.remove());
      } catch {
        /* ok */
      }
    }
    try {
      publication.setSubscribed?.(false);
    } catch {
      /* ok */
    }
    this._emitWalkieState();
  }

  _watchAudioTracks() {
    const onSubscribed = async (track, publication, participant) => {
      if (track.kind !== Track.Kind.Audio) return;
      if (participant?.isLocal) return;
      if (participant?.identity === this.room.localParticipant?.identity) return;

      this._attachRemoteAudioTrack(track, publication, participant);
      if (this._audioUnlocked) {
        await this.recoverAudio();
      }
      this._emitWalkieState();
    };

    const onUnsubscribed = (track, publication, participant) => {
      if (track.kind !== Track.Kind.Audio) return;
      if (participant?.isLocal) return;
      this._removePendingAudioTrack(track);
      this._unregisterRemoteAudioTrack(track);
      track.detach().forEach((el) => {
        el.remove();
        this.audioElements = this.audioElements.filter((node) => node !== el);
        if (this.trackElements.get(track) === el) this.trackElements.delete(track);
      });
      this._onIncomingWalkieEnded(publication, participant);
    };

    const onPublished = (publication, participant) => {
      this._onIncomingWalkiePublished(publication, participant);
    };

    const onUnpublished = (publication, participant) => {
      this._onIncomingWalkieEnded(publication, participant);
    };

    const onParticipantDisconnected = () => {
      this._emitWalkieState();
    };

    this.room.on(RoomEvent.TrackSubscribed, onSubscribed);
    this.room.on(RoomEvent.TrackUnsubscribed, onUnsubscribed);
    this.room.on(RoomEvent.TrackPublished, onPublished);
    this.room.on(RoomEvent.TrackUnpublished, onUnpublished);
    this.room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    this._cleanup.push(() => {
      this.room.off(RoomEvent.TrackSubscribed, onSubscribed);
      this.room.off(RoomEvent.TrackUnsubscribed, onUnsubscribed);
      this.room.off(RoomEvent.TrackPublished, onPublished);
      this.room.off(RoomEvent.TrackUnpublished, onUnpublished);
      this.room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    });
  }

  _watchWalkieSync() {
    const tick = () => {
      if (this.connected) this._emitWalkieState();
    };
    this._walkieSyncTimer = setInterval(tick, 500);
    this._cleanup.push(() => clearInterval(this._walkieSyncTimer));
  }

  async connect(serverUrl, token) {
    this._teardown();
    this._watchAudioTracks();
    this._watchSpeaking();
    this._watchWalkieSync();

    const onDisconnected = () => {
      this._emitWalkieState();
      this._emitStatus("disconnected");
    };
    this.room.on(RoomEvent.Disconnected, onDisconnected);
    this._cleanup.push(() => this.room.off(RoomEvent.Disconnected, onDisconnected));

    await this.room.connect(serverUrl, token, { autoSubscribe: true });
    this._emitStatus("connected");
  }

  async unlockAudioFromGesture() {
    if (!this.connected) return false;
    if (!this._audioUnlocked) {
      this._audioUnlocked = true;
      this.onAudioUnlockChange?.(true);
    }
    return this.recoverAudio();
  }

  async recoverAudio() {
    if (!this.connected) return false;

    this._syncExistingRemoteAudio();
    this._emitWalkieState();
    this._applySpeakerState();

    if (!this._audioUnlocked || !this._speakerEnabled) return this._audioUnlocked;

    this._flushPendingAudioAttachments();

    try {
      await this.room.startAudio();
    } catch {
      /* Chrome may require a user gesture after long suspension. */
    }

    await Promise.all(
      this.audioElements.map(async (el) => {
        if (!el.isConnected) return;
        el.muted = false;
        el.volume = 1;
        try {
          await el.play();
        } catch {
          /* Browser autoplay policy can block this until the next tap. */
        }
      }),
    );

    return true;
  }

  async disconnect() {
    this._teardown();
    if (this.room.state !== "disconnected") {
      await this.room.disconnect();
    }
    this._emitStatus("disconnected");
  }

  async stopPublishing() {
    if (!this.connected) {
      this._micEnabled = false;
      return;
    }
    this._micEnabled = false;
    await this.room.localParticipant.setMicrophoneEnabled(false);
    this._emitSpeaking();
  }

  async startPublishing() {
    if (!this.connected) return false;

    try {
      const pub = await this.room.localParticipant.setMicrophoneEnabled(true);
      if (!pub) {
        throw new Error("Microphone blocked — tap 🎤 in the header to allow mic");
      }
      this._micEnabled = true;
      this._emitSpeaking();
      return true;
    } catch (err) {
      this._micEnabled = false;
      this.onMicError?.(err.message ?? "Could not enable microphone");
      return false;
    }
  }

  async setMicrophoneEnabled(enabled) {
    if (!this.connected) return false;
    if (enabled && !this._isSeated) return false;

    try {
      if (enabled) {
        return await this.startPublishing();
      }
      await this.stopPublishing();
      return true;
    } catch (err) {
      this.onMicError?.(err.message ?? "Microphone error");
      return false;
    }
  }

  async startWalkieTalk(targetIdentity) {
    if (!this.connected || !targetIdentity) return false;
    if (targetIdentity === this.room.localParticipant?.identity) return false;

    await this.stopWalkieTalk({ restoreMic: false, dismissIncoming: false });
    this._walkieTargetIdentity = targetIdentity;
    this._walkieRestoreMic = this._isSeated && this._micEnabled;

    try {
      if (this._walkieRestoreMic) {
        await this.stopPublishing();
      }

      const track = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      this._walkieTrack = track;
      await this.room.localParticipant.publishTrack(track, {
        name: `${WALKIE_TRACK_PREFIX}${targetIdentity}`,
        source: Track.Source.Microphone,
        stream: `walkie-${this.room.localParticipant.identity}-${targetIdentity}`,
      });
      this._emitWalkieState();
      return true;
    } catch (err) {
      this.onMicError?.(err.message ?? "Could not start walkie talkie");
      await this.stopWalkieTalk({ restoreMic: this._walkieRestoreMic });
      return false;
    }
  }

  async stopWalkieTalk({ restoreMic = true, dismissIncoming = true } = {}) {
    const incomingBefore = this._getWalkieState().incomingFromId;
    const track = this._walkieTrack;
    const shouldRestoreMic = restoreMic && this._walkieRestoreMic && this._isSeated;
    this._walkieTrack = null;
    this._walkieTargetIdentity = null;
    this._walkieRestoreMic = false;

    if (track) {
      try {
        await this.room.localParticipant.unpublishTrack(track, true);
      } catch {
        try {
          track.stop();
        } catch {
          /* ok */
        }
      }
    }

    if (dismissIncoming && incomingBefore) {
      this._ignoredIncomingWalkie.add(incomingBefore);
      await this._unsubscribeIncomingWalkieFrom(incomingBefore);
      this._detachWalkieRemoteAudio();
    }

    if (shouldRestoreMic && this.connected) {
      await this.startPublishing();
    }
    this._emitWalkieState();
  }

  /** Seat state controls permission only; users must tap mic to publish. */
  async applySeatState(isSeated) {
    this._isSeated = isSeated;
    if (!this.connected) return;

    if (!isSeated) {
      await this.stopPublishing();
    }
  }

  _teardown() {
    for (const fn of this._cleanup) fn();
    this._cleanup = [];
    this.stopWalkieTalk({ restoreMic: false }).catch(() => {});
    for (const el of this.audioElements) el.remove();
    this.audioElements = [];
    this.trackElements.clear();
    this.remoteAudioTracks.clear();
    this._ignoredIncomingWalkie.clear();
    this._pendingAudioAttachments = [];
    this._micEnabled = false;
    this._speakerEnabled = true;
    if (this._audioUnlocked) {
      this._audioUnlocked = false;
      this.onAudioUnlockChange?.(false);
    }
  }
}

/** Connect once per room. Seat/mic permission is applied in VoiceRoom after voiceReady. */
export async function connectToVoiceRoom(manager, {
  roomName,
  participantName,
  participantIdentity,
  serverUrl,
}) {
  const { token, url } = await fetchLiveKitToken({
    roomName,
    participantName,
    participantIdentity,
    isSeated: true,
  });

  if (manager.connected) {
    return { token, url: url || serverUrl };
  }

  await manager.connect(url || serverUrl, token);

  return { token, url: url || serverUrl };
}
