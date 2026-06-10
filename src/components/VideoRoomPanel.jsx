import { useCallback, useEffect, useId, useRef, useState } from "react";
import { loadYouTubeApi, youtubeEmbedOrigin } from "../video/youtube.js";
import { projectedPlaybackTime } from "../video/roomVideo.js";

const YT_PLAYING = 1;
const YT_PAUSED = 2;

export default function VideoRoomPanel({
  videoId,
  videoTitle,
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
  const [playerReady, setPlayerReady] = useState(false);
  const [localPlaying, setLocalPlaying] = useState(false);
  const suppressSyncRef = useRef(false);

  const pushSync = useCallback(
    (playing, currentTime) => {
      if (!canControl || !onSyncPlayback) return;
      suppressSyncRef.current = true;
      setLocalPlaying(playing);
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
      setLocalPlaying(videoSync.playing);
    };

    tick();
    const interval = setInterval(tick, 2000);
    return () => clearInterval(interval);
  }, [playerReady, canControl, videoSync]);

  useEffect(() => {
    setLocalPlaying(Boolean(videoSync?.playing));
  }, [videoSync?.playing, videoId]);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p?.getPlayerState) return;
    const state = p.getPlayerState();
    if (state === YT_PLAYING) {
      p.pauseVideo();
      pushSync(false);
    } else {
      p.playVideo();
      pushSync(true);
    }
  };

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
      </div>
      <div className="stage-video-meta">
        <span className="stage-video-brand">▶ YouTube</span>
        {videoTitle && <span className="stage-video-title">{videoTitle}</span>}
        <div className="stage-video-controls">
          {canControl && (
            <>
              <button type="button" className="stage-video-ctrl" onClick={togglePlay}>
                {localPlaying ? "Pause" : "Play"}
              </button>
              <button type="button" className="stage-video-ctrl stage-video-ctrl--ghost" onClick={onChangeVideo}>
                Change video
              </button>
              <button type="button" className="stage-video-ctrl stage-video-ctrl--ghost" onClick={onClearVideo}>
                Remove
              </button>
            </>
          )}
          {!canControl && (
            <span className="stage-video-watch-hint">Watching together — synced with host</span>
          )}
        </div>
      </div>
    </div>
  );
}
