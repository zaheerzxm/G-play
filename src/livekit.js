import { supabase } from "./supabase.js";

export const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

function isNewSupabaseApiKey(key) {
  return key?.startsWith("sb_publishable_") || key?.startsWith("sb_secret_");
}

async function parseFunctionError(response) {
  try {
    const data = await response.json();
    return data?.error || data?.message || data?.code || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

/**
 * New publishable keys must use the `apikey` header (not Authorization Bearer).
 * The function must have JWT verification turned OFF in Supabase Dashboard.
 */
async function invokeWithPublishableKey(body) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/livekit-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await parseFunctionError(response);
    if (response.status === 401) {
      throw new Error(
        `${message} — Open Supabase → Edge Functions → livekit-token → turn OFF "Verify JWT", then redeploy.`,
      );
    }
    throw new Error(message);
  }

  return response.json();
}

export function isLiveKitConfigured() {
  return Boolean(LIVEKIT_URL && supabase);
}

export async function fetchLiveKitToken({
  roomName,
  participantName,
  participantIdentity,
  isSeated,
}) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!LIVEKIT_URL) throw new Error("VITE_LIVEKIT_URL is not set");

  const body = {
    roomName,
    participantName,
    participantIdentity,
    isSeated: Boolean(isSeated),
  };

  let data;

  if (isNewSupabaseApiKey(SUPABASE_KEY)) {
    data = await invokeWithPublishableKey(body);
  } else {
    const { data: result, error } = await supabase.functions.invoke("livekit-token", { body });
    if (error) {
      if (error.context?.status === 401) {
        throw new Error(
          "Unauthorized calling livekit-token — check VITE_SUPABASE_KEY or disable Verify JWT on the function.",
        );
      }
      throw error;
    }
    data = result;
  }

  if (data?.error) throw new Error(data.error);
  if (!data?.token) throw new Error("No LiveKit token returned");

  return {
    token: data.token,
    url: data.url || LIVEKIT_URL,
  };
}
