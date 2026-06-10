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

/** Read video state from room row (supports video_room jsonb + legacy columns). */
export function readRoomVideo(room) {
  if (!room) {
    return { videoId: null, videoTitle: null, videoSync: null };
  }

  const blob = room.video_room;
  if (blob && typeof blob === "object" && (blob.youtubeId || blob.title || blob.sync)) {
    return {
      videoId: blob.youtubeId ?? null,
      videoTitle: blob.title ?? null,
      videoSync: parseVideoSync(blob.sync),
    };
  }

  return {
    videoId: room.video_youtube_id ?? null,
    videoTitle: room.video_title ?? null,
    videoSync: parseVideoSync(room.video_sync),
  };
}

export function projectedPlaybackTime(sync) {
  if (!sync) return 0;
  if (!sync.playing) return sync.currentTime;
  return sync.currentTime + (Date.now() - sync.updatedAt) / 1000;
}

function formatVideoDbError(error) {
  const msg = error?.message ?? String(error ?? "");
  if (/video_room|video_sync|video_youtube|schema cache/i.test(msg)) {
    return "Video room needs a one-time database update. Open Supabase → SQL Editor → run supabase/video-room.sql";
  }
  return msg || "Could not save video";
}

export async function setRoomVideo(roomId, videoId, title) {
  const payload = {
    video_room: {
      youtubeId: videoId,
      title: title || null,
      sync: {
        playing: false,
        currentTime: 0,
        updatedAt: Date.now(),
      },
    },
  };
  try {
    return await updateRoomSettings(roomId, payload);
  } catch (e) {
    throw new Error(formatVideoDbError(e));
  }
}

export async function clearRoomVideo(roomId) {
  try {
    return await updateRoomSettings(roomId, { video_room: {} });
  } catch (e) {
    throw new Error(formatVideoDbError(e));
  }
}

export async function syncRoomVideoPlayback(roomId, sync, roomMeta) {
  const prev = readRoomVideo(roomMeta);
  try {
    return await updateRoomSettings(roomId, {
      video_room: {
        youtubeId: prev.videoId,
        title: prev.videoTitle,
        sync: {
          playing: Boolean(sync.playing),
          currentTime: Number(sync.currentTime) || 0,
          updatedAt: Date.now(),
        },
      },
    });
  } catch (e) {
    throw new Error(formatVideoDbError(e));
  }
}

export async function addRoomVideoFromUrl(roomId, urlOrId) {
  const videoId = parseYouTubeVideoId(urlOrId);
  if (!videoId) {
    const raw = String(urlOrId ?? "").trim();
    const partial = raw.match(/[?&]v=([\w-]{8,12})/i)?.[1];
    if (partial && partial.length < 11) {
      throw new Error("YouTube link looks cut off — copy the full link from the address bar");
    }
    throw new Error("Paste a full YouTube link (youtube.com/watch?v=… or youtu.be/…)");
  }
  const title = await fetchYouTubeTitle(videoId);
  return setRoomVideo(roomId, videoId, title);
}
