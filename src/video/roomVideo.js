import { updateRoomSettings } from "../roomAdmin.js";
import { fetchYouTubeTitle, parseYouTubeVideoId } from "./youtube.js";

export function parseVideoSync(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    playing: Boolean(raw.playing),
    currentTime: Number(raw.currentTime) || 0,
    updatedAt: Number(raw.updatedAt) || Date.now(),
  };
}

export function projectedPlaybackTime(sync) {
  if (!sync) return 0;
  if (!sync.playing) return sync.currentTime;
  return sync.currentTime + (Date.now() - sync.updatedAt) / 1000;
}

export async function setRoomVideo(roomId, videoId, title) {
  return updateRoomSettings(roomId, {
    video_youtube_id: videoId,
    video_title: title || null,
    video_sync: {
      playing: false,
      currentTime: 0,
      updatedAt: Date.now(),
    },
  });
}

export async function clearRoomVideo(roomId) {
  return updateRoomSettings(roomId, {
    video_youtube_id: null,
    video_title: null,
    video_sync: {},
  });
}

export async function syncRoomVideoPlayback(roomId, sync) {
  return updateRoomSettings(roomId, {
    video_sync: {
      playing: Boolean(sync.playing),
      currentTime: Number(sync.currentTime) || 0,
      updatedAt: Date.now(),
    },
  });
}

export async function addRoomVideoFromUrl(roomId, urlOrId) {
  const videoId = parseYouTubeVideoId(urlOrId);
  if (!videoId) throw new Error("Paste a valid YouTube link or video id");
  const title = await fetchYouTubeTitle(videoId);
  return setRoomVideo(roomId, videoId, title);
}
