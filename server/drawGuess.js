import { DRAW_WORDS } from "./drawWords.js";
import { getRoom } from "./gameState.js";

const ROUND_MS = 60000;
const BETWEEN_ROUND_MS = 4000;
const MAX_ROUNDS_PER_PLAYER = 2;

function pickWord() {
  return DRAW_WORDS[Math.floor(Math.random() * DRAW_WORDS.length)];
}

function maskWord(w) {
  return w.replace(/[a-zA-Z]/g, "_");
}

export function createDrawGuessGame({ roomId, hostUserId, players }) {
  const scores = {};
  for (const p of players) scores[p.userId] = 0;

  const playerOrder = players.map((p) => p.userId);
  const state = {
    playerOrder,
    roundIndex: 0,
    drawerIndex: 0,
    word: pickWord(),
    guessed: new Set(),
    guessOrder: [],
  };

  const game = {
    type: "draw",
    roomId,
    hostUserId,
    phase: "waiting",
    readyUserIds: new Set(),
    scores,
    players: players.map((p) => ({ userId: p.userId, userName: p.userName })),
    strokes: [],
    timers: [],
    startedAt: Date.now(),
    endsAt: null,
    _state: state,

    get drawerId() {
      return state.playerOrder[state.drawerIndex] ?? null;
    },

    snapshot(forUserId) {
      const isDrawer = forUserId === this.drawerId;
      return {
        type: "draw",
        phase: this.phase,
        roundIndex: state.roundIndex,
        totalRounds: state.playerOrder.length * MAX_ROUNDS_PER_PLAYER,
        scores: { ...scores },
        players: this.players,
        hostUserId,
        drawerId: this.drawerId,
        drawerName: this.players.find((p) => p.userId === this.drawerId)?.userName ?? "Drawer",
        word: isDrawer && this.phase === "drawing" ? state.word : null,
        hint: this.phase === "drawing" && !isDrawer ? maskWord(state.word) : null,
        endsAt: this.endsAt,
        guessedUserIds: [...state.guessed],
        readyUserIds: [...this.readyUserIds],
        strokes: this.strokes,
      };
    },

    toPublic() {
      return this.snapshot(null);
    },

    clearTimers() {
      for (const t of this.timers) clearTimeout(t);
      this.timers = [];
    },

    destroy() {
      this.clearTimers();
    },
  };

  return game;
}

export function startDrawRound(game, io, roomId) {
  game.clearTimers();
  const state = game._state;
  state.word = pickWord();
  state.guessed = new Set();
  state.guessOrder = [];
  game.strokes = [];
  game.phase = "drawing";
  game.endsAt = Date.now() + ROUND_MS;

  broadcastDrawState(game, io, roomId);

  const timer = setTimeout(() => endDrawRound(game, io, roomId), ROUND_MS);
  game.timers.push(timer);
}

function broadcastDrawState(game, io, roomId) {
  const room = getRoom(roomId);
  for (const m of room.members.values()) {
    const snap = game.snapshot(m.userId);
    if (m.socketId) io.to(m.socketId).emit("gameStateUpdate", { game: snap });
  }
}

function endDrawRound(game, io, roomId) {
  const state = game._state;
  game.phase = "roundEnd";
  broadcastDrawState(game, io, roomId);

  const next = setTimeout(() => {
    state.roundIndex += 1;
    state.drawerIndex = (state.drawerIndex + 1) % state.playerOrder.length;
    if (state.roundIndex >= state.playerOrder.length * MAX_ROUNDS_PER_PLAYER) {
      game.phase = "finished";
      broadcastDrawState(game, io, roomId);
      return;
    }
    startDrawRound(game, io, roomId);
  }, BETWEEN_ROUND_MS);
  game.timers.push(next);
}

export function handleDrawStroke(game, userId, stroke) {
  if (game.phase !== "drawing") return false;
  if (userId !== game.drawerId) return false;
  if (!stroke || typeof stroke !== "object") return false;
  game.strokes.push({ ...stroke, t: Date.now() });
  if (game.strokes.length > 5000) game.strokes.shift();
  return true;
}

export function handleClearCanvas(game, userId, hostUserId) {
  if (game.phase !== "drawing") return false;
  if (userId !== game.drawerId && userId !== hostUserId) return false;
  game.strokes = [];
  return true;
}

export function handleGuess(game, userId, guess, io, roomId) {
  if (game.phase !== "drawing") return { ok: false };
  const state = game._state;
  if (userId === game.drawerId) return { ok: false };
  if (state.guessed.has(userId)) return { ok: false };
  const normalized = String(guess ?? "").trim().toLowerCase();
  if (!normalized) return { ok: false };
  if (normalized !== state.word.toLowerCase()) return { ok: false, wrong: true };

  state.guessed.add(userId);
  if (!state.guessOrder) state.guessOrder = [];
  state.guessOrder.push(userId);
  const rank = state.guessOrder.length - 1;
  const timeLeft = Math.max(0, (game.endsAt ?? Date.now()) - Date.now());
  const speedPts = Math.floor(timeLeft / 400);
  const rankPts = Math.max(10, 100 - rank * 28);
  const points = 35 + speedPts + rankPts;
  game.scores[userId] = (game.scores[userId] ?? 0) + points;
  game.scores[game.drawerId] = (game.scores[game.drawerId] ?? 0) + 35;

  broadcastDrawState(game, io, roomId);

  if (state.guessed.size >= game.players.length - 1) {
    game.clearTimers();
    endDrawRound(game, io, roomId);
  }

  return { ok: true, correct: true, points, rank: rank + 1 };
}
