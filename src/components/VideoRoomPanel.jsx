import { useCallback, useEffect, useId, useRef, useState } from "react";
import { loadYouTubeApi, youtubeEmbedOrigin } from "../video/youtube.js";
import { projectedPlaybackTime } from "../video/roomVideo.js";

const YT_PLAYING = 1;
const YT_PAUSED = 2;
const SKIP_SECONDS = 10;
const DOUBLE_TAP_MS = 380;

export default function VideoRoomPanel({
  videoId,
  videoSync,
  canControl,
  onAddVideo,
  onChangeVideo,
  onSyncPlayback,
  onClearVideo,
}) {
  const mountId = useId().replace(/:/g, "");
  const playerHostId = `yt-player-${mountId}`;
  const playerRef = useRef(null);
  const lastTapRef = useRef({ side: null, at: 0 });
  const [playerReady, setPlayerReady] = useState(false);
  const [skipHint, setSkipHint] = useState(null);
  const suppressSyncRef = useRef(false);
  const skipHintTimerRef = useRef(null);

  const pushSync = useCallback(
    (playing, currentTime) => {
      if (!canControl || !onSyncPlayback) return;
      suppressSyncRef.current = true;
      onSyncPlayback({
        playing,
        currentTime: currentTime ?? playerRef.current?.getCurrentTime?.() ?? 0,
      });
      setTimeout(() => {
        suppressSyncRef.current = false;
      }, 800);
    },
    [canControl, onSyncPlayback],
  );

  const showSkipHint = useCallback((label) => {
    setSkipHint(label);
    if (skipHintTimerRef.current) clearTimeout(skipHintTimerRef.current);
    skipHintTimerRef.current = setTimeout(() => setSkipHint(null), 750);
  }, []);

  const seekBy = useCallback(
    (delta) => {
      const player = playerRef.current;
      if (!player?.getCurrentTime || !canControl) return;
      const next = Math.max(0, player.getCurrentTime() + delta);
      player.seekTo(next, true);
      const playing = player.getPlayerState?.() === YT_PLAYING;
      pushSync(playing, next);
      showSkipHint(delta > 0 ? `+${SKIP_SECONDS}s` : `-${SKIP_SECONDS}s`);
    },
    [canControl, pushSync, showSkipHint],
  );

  const handleTapZone = useCallback(
    (side) => {
      if (!canControl || !playerReady) return;
      const now = Date.now();
      const last = lastTapRef.current;
      if (last.side === side && now - last.at <= DOUBLE_TAP_MS) {
        seekBy(side === "left" ? -SKIP_SECONDS : SKIP_SECONDS);
        lastTapRef.current = { side: null, at: 0 };
        return;
      }
      lastTapRef.current = { side, at: now };
    },
    [canControl, playerReady, seekBy],
  );

  useEffect(() => {
    if (!videoId) {
      setPlayerReady(false);
      playerRef.current?.destroy?.();
      playerRef.current = null;
      return undefined;
    }

    let cancelled = false;
    setPlayerReady(false);

    loadYouTubeApi().then((YT) => {
      if (cancelled || !YT?.Player) return;
      playerRef.current?.destroy?.();
      playerRef.current = new YT.Player(playerHostId, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: canControl ? 1 : 0,
          disablekb: canControl ? 0 : 1,
          fs: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: youtubeEmbedOrigin(),
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            setPlayerReady(true);
            const sync = videoSync;
            if (sync?.currentTime > 0) {
              e.target.seekTo(projectedPlaybackTime(sync), true);
            }
            if (sync?.playing) e.target.playVideo();
          },
          onStateChange: (e) => {
            if (!canControl || suppressSyncRef.current) return;
            const state = e.data;
            if (state === YT_PLAYING) pushSync(true);
            else if (state === YT_PAUSED) pushSync(false);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId, canControl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playerReady || canControl || !videoSync || suppressSyncRef.current) return undefined;
    const p = playerRef.current;
    if (!p?.getCurrentTime) return undefined;

    const tick = () => {
      if (suppressSyncRef.current) return;
      const target = projectedPlaybackTime(videoSync);
      const drift = Math.abs(p.getCurrentTime() - target);
      if (drift > 2.5) p.seekTo(target, true);
      const state = p.getPlayerState?.();
      if (videoSync.playing && state !== YT_PLAYING) p.playVideo();
      if (!videoSync.playing && state === YT_PLAYING) p.pauseVideo();
    };

    tick();
    const interval = setInterval(tick, 2000);
    return () => clearInterval(interval);
  }, [playerReady, canControl, videoSync]);

  useEffect(
    () => () => {
      if (skipHintTimerRef.current) clearTimeout(skipHintTimerRef.current);
    },
    [],
  );

  if (!videoId) {
    return (
      <div className="stage-video-strip stage-video-strip--reference">
        <span className="stage-video-brand">▶ YouTube</span>
        <span className="stage-video-placeholder">
          Choose a YouTube video
          <br />
          to watch and chat with friends in the room
        </span>
        {canControl ? (
          <button type="button" className="stage-video-add" onClick={onAddVideo}>
            Add a video
          </button>
        ) : (
          <span className="stage-video-watch-hint">Waiting for host to add a video</span>
        )}
      </div>
    );
  }

  return (
    <div className="stage-video-strip stage-video-strip--reference stage-video-strip--playing">
      <div className="stage-video-player-wrap">
        <div id={playerHostId} className="stage-video-player-host" />
        {canControl && playerReady && (
          <>
            <button
              type="button"
              className="stage-video-tap-zone stage-video-tap-zone--left"
              aria-label="Double-tap to rewind 10 seconds"
              onClick={() => handleTapZone("left")}
            />
            <button
              type="button"
              className="stage-video-tap-zone stage-video-tap-zone--right"
              aria-label="Double-tap to skip forward 10 seconds"
              onClick={() => handleTapZone("right")}
            />
            <div className="stage-video-host-actions">
              <button type="button" className="stage-video-host-btn" onClick={onChangeVideo} title="Change video">
                ↻
              </button>
              <button type="button" className="stage-video-host-btn" onClick={onClearVideo} title="Remove video">
                ✕
              </button>
            </div>
          </>
        )}
        {skipHint && <span className="stage-video-skip-hint">{skipHint}</span>}
      </div>
    </div>
  );
}
