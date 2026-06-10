import { io } from "socket.io-client";

let socket = null;
let socketUrl = null;

const STATIC_HOST_SUFFIXES = [
  ".github.io",
  ".gitlab.io",
  ".pages.dev",
  ".vercel.app",
  ".netlify.app",
];

/** Default live game server (Render) — must match render.yaml service name. */
const LIVE_GAMES_SERVER = "https://g-play-socket.onrender.com";

function isStaticDeployHost(hostname) {
  return STATIC_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix),
  );
}

function isPrivateLan(hostname) {
  return /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname);
}

function isLocalHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function envSocketUrl() {
  const raw = import.meta.env.VITE_SOCKET_URL?.trim()?.replace(/\/$/, "");
  if (!raw || /localhost|127\.0\.0\.1/i.test(raw)) return null;
  return raw;
}

/**
 * Socket URL for mini-games.
 * GitHub Pages: uses VITE_SOCKET_URL from production build, or LIVE_GAMES_SERVER fallback.
 * LAN dev: http://<same-ip>:3001
 */
export function resolveSocketUrl() {
  const configured = envSocketUrl();

  if (typeof window === "undefined") {
    return configured || LIVE_GAMES_SERVER;
  }

  const { hostname } = window.location;

  if (isStaticDeployHost(hostname)) {
    return configured || LIVE_GAMES_SERVER;
  }

  if (isLocalHost(hostname) || isPrivateLan(hostname)) {
    return `http://${hostname}:3001`;
  }

  return configured || LIVE_GAMES_SERVER;
}

export function isLiveGamesServer() {
  const url = resolveSocketUrl();
  return Boolean(url?.startsWith("https://"));
}

export function getGamesServerMessage() {
  if (resolveSocketUrl()) return null;
  return "Game server URL is not configured.";
}

export function getSocket() {
  const url = resolveSocketUrl();
  if (!url) return null;

  if (!socket || socketUrl !== url) {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    socketUrl = url;
    socket = io(url, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 12,
      timeout: isLiveGamesServer() ? 20000 : 12000,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s) return null;
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}

export function waitForSocket(timeoutMs) {
  const unavailable = getGamesServerMessage();
  if (unavailable) return Promise.reject(new Error(unavailable));

  const waitMs = timeoutMs ?? (isLiveGamesServer() ? 45000 : 12000);

  const s = connectSocket();
  if (!s) return Promise.reject(new Error(getGamesServerMessage() || "No game server"));

  if (s.connected) return Promise.resolve(s);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      const target = resolveSocketUrl();
      reject(
        new Error(
          isLiveGamesServer()
            ? `Game server is waking up — free hosting can take ~30s. Try again. (${target})`
            : `Game server timed out (${target})`,
        ),
      );
    }, waitMs);

    const onConnect = () => {
      cleanup();
      resolve(s);
    };
    const onError = () => {
      cleanup();
      const target = resolveSocketUrl();
      reject(
        new Error(
          target
            ? `Cannot reach game server at ${target}`
            : "Cannot reach game server",
        ),
      );
    };

    const cleanup = () => {
      clearTimeout(timer);
      s.off("connect", onConnect);
      s.off("connect_error", onError);
    };

    s.once("connect", onConnect);
    s.once("connect_error", onError);
  });
}

export function emitAck(event, payload, timeoutMs) {
  const waitMs = timeoutMs ?? (isLiveGamesServer() ? 45000 : 12000);
  return waitForSocket(waitMs)
    .then(
      (s) =>
        new Promise((resolve) => {
          const timer = setTimeout(
            () =>
              resolve({
                ok: false,
                error: isLiveGamesServer()
                  ? "Game server slow to respond — tap again in a few seconds"
                  : "Game server timed out — is it running?",
              }),
            waitMs,
          );
          s.emit(event, payload, (response) => {
            clearTimeout(timer);
            resolve(response ?? { ok: false, error: "No response from server" });
          });
        }),
    )
    .catch((err) => ({
      ok: false,
      error: err?.message || "Cannot reach game server",
    }));
}
