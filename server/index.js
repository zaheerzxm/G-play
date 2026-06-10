import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import {
  addMember,
  clearActiveGame,
  clearGameLobby,
  clearStaleWaitingGame,
  ensureGameLobby,
  getActiveGame,
  getMember,
  getRoom,
  canManageGame,
  isGameInProgress,
  publicRoomState,
  removeMember,
  setActiveGame,
  setRoomHost,
} from "./gameState.js";
import {
  createTriviaGame,
  handleTriviaAnswer,
  startTriviaQuestion,
} from "./trivia.js";
import {
  createDrawGuessGame,
  handleClearCanvas,
  handleDrawStroke,
  handleGuess,
  startDrawRound,
} from "./drawGuess.js";

const PORT = Number(process.env.PORT || process.env.SOCKET_PORT || 3001);
const DEFAULT_CLIENT_ORIGINS = [
  "http://localhost:5173",
  "https://zaheerzxm.github.io",
];
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const corsOrigin = CLIENT_ORIGINS.length > 0 ? CLIENT_ORIGINS : DEFAULT_CLIENT_ORIGINS;

const app = express();
app.use(cors({ origin: corsOrigin }));
app.get("/health", (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: corsOrigin, methods: ["GET", "POST"] },
});

const socketMeta = new Map();

function roomChannel(roomId) {
  return `room:${roomId}`;
}

function endActiveGame(roomId) {
  const game = getActiveGame(roomId);
  if (game?.destroy) game.destroy();
  clearActiveGame(roomId);
}

function personalGameSnapshot(game, userId) {
  if (!game) return null;
  return game.snapshot?.(userId) ?? game.toPublic?.() ?? null;
}

function broadcastGameState(io, roomId, game) {
  const roomState = publicRoomState(roomId);
  if (game.type === "draw") {
    const room = getRoom(roomId);
    for (const m of room.members.values()) {
      const personal = game.snapshot(m.userId);
      if (m.socketId) {
        io.to(m.socketId).emit("gameStateUpdate", { room: roomState, game: personal });
      }
    }
    return;
  }
  const publicSnap = game.toPublic?.() ?? game.snapshot?.();
  io.to(roomChannel(roomId)).emit("gameStateUpdate", { room: roomState, game: publicSnap });
}

function broadcastRoom(io, roomId, game = undefined) {
  const roomState = publicRoomState(roomId);
  const active = game === undefined ? getActiveGame(roomId) : game;
  if (active?.type === "draw") {
    broadcastGameState(io, roomId, active);
    return;
  }
  const publicSnap = active?.toPublic?.() ?? active?.snapshot?.() ?? null;
  io.to(roomChannel(roomId)).emit("gameStateUpdate", { room: roomState, game: publicSnap });
}

function launchGameFromLobby(game, io, roomId) {
  if (game.type === "draw" && game._state) {
    game._state.playerOrder = game.players.map((p) => p.userId);
    startDrawRound(game, io, roomId);
  } else if (game.type === "trivia") {
    startTriviaQuestion(game, io, roomId);
  }
}

io.on("connection", (socket) => {
  socket.on("joinRoom", (payload, ack) => {
    try {
      const { roomId, userId, userName, isHost: hostFlag, ownerUserId, canManageGames } = payload ?? {};
      if (!roomId || !userId) {
        ack?.({ ok: false, error: "roomId and userId required" });
        return;
      }

      const prev = socketMeta.get(socket.id);
      if (prev?.roomId) {
        socket.leave(roomChannel(prev.roomId));
        removeMember(prev.roomId, prev.userId);
      }

      socket.join(roomChannel(roomId));
      socketMeta.set(socket.id, { roomId, userId, userName: userName || "Player" });
      const room = getRoom(roomId);
      if (ownerUserId) room.ownerUserId = ownerUserId;
      if (hostFlag) setRoomHost(roomId, userId);
      if (canManageGames || ownerUserId === userId) room.gameManagerIds.add(userId);
      clearStaleWaitingGame(roomId);
      const active = getActiveGame(roomId);
      const lobby = ensureGameLobby(room);
      const inGame = Boolean(
        lobby.players.some((p) => p.userId === userId)
        || active?.players?.some((p) => p.userId === userId),
      );
      addMember(roomId, userId, {
        userName: userName || "Player",
        socketId: socket.id,
        inGame,
      });

      const state = publicRoomState(roomId);
      const activeGame = getActiveGame(roomId);
      if (activeGame?.type === "draw") {
        io.to(roomChannel(roomId)).emit("gameStateUpdate", { room: state });
        socket.emit("gameStateUpdate", {
          room: state,
          game: personalGameSnapshot(activeGame, userId),
        });
      } else {
        io.to(roomChannel(roomId)).emit("gameStateUpdate", { room: state, game: state.activeGame });
      }
      const ackState = { ...state, activeGame: personalGameSnapshot(activeGame, userId) ?? state.activeGame };
      ack?.({ ok: true, state: ackState });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
    }
  });

  socket.on("leaveRoom", () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    socket.leave(roomChannel(meta.roomId));
    removeMember(meta.roomId, meta.userId);
    socketMeta.delete(socket.id);
    io.to(roomChannel(meta.roomId)).emit("gameStateUpdate", { room: publicRoomState(meta.roomId) });
  });

  socket.on("selectGame", (payload, ack) => {
    try {
      const { roomId, userId, gameType } = payload ?? {};
      if (!roomId || !userId || !gameType) throw new Error("Invalid selectGame payload");
      if (!canManageGame(roomId, userId)) throw new Error("Only host or admin can select a game");
      clearStaleWaitingGame(roomId);
      if (isGameInProgress(roomId)) throw new Error("A game is already running");

      const room = getRoom(roomId);
      const lobby = ensureGameLobby(room);
      if (gameType !== "trivia" && gameType !== "draw") throw new Error("Unknown game type");
      lobby.selectedType = gameType;

      broadcastRoom(io, roomId);
      const state = publicRoomState(roomId);
      ack?.({ ok: true, room: state });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
    }
  });

  socket.on("getGameState", (payload, ack) => {
    try {
      const { roomId, userId: payloadUserId } = payload ?? {};
      if (!roomId) throw new Error("roomId required");
      const meta = socketMeta.get(socket.id);
      const userId = payloadUserId || meta?.userId;
      const state = publicRoomState(roomId);
      const activeGame = getActiveGame(roomId);
      if (activeGame && userId) {
        state.activeGame = personalGameSnapshot(activeGame, userId);
      }
      ack?.({ ok: true, state });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
    }
  });

  socket.on("joinGame", (payload, ack) => {
    try {
      const { roomId, userId, userName } = payload ?? {};
      if (!roomId || !userId) throw new Error("Invalid joinGame payload");
      if (isGameInProgress(roomId)) throw new Error("Game already running — wait for it to finish");

      const room = getRoom(roomId);
      const lobby = ensureGameLobby(room);
      const member = getMember(roomId, userId);
      if (!member) throw new Error("Join the voice room first");
      member.inGame = true;
      member.userName = userName || member.userName;

      const already = lobby.players.some((p) => p.userId === userId);
      if (!already) {
        lobby.players.push({ userId, userName: member.userName });
      }

      broadcastRoom(io, roomId);
      const roomState = publicRoomState(roomId);
      ack?.({ ok: true, room: roomState });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
    }
  });

  socket.on("leaveGameLobby", (payload, ack) => {
    try {
      const { roomId, userId } = payload ?? {};
      if (!roomId || !userId) throw new Error("Invalid leaveGameLobby payload");
      if (isGameInProgress(roomId)) throw new Error("Cannot leave during an active game");

      const room = getRoom(roomId);
      const lobby = ensureGameLobby(room);
      lobby.players = lobby.players.filter((p) => p.userId !== userId);
      const member = getMember(roomId, userId);
      if (member) member.inGame = false;

      broadcastRoom(io, roomId);
      ack?.({ ok: true, room: publicRoomState(roomId) });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
    }
  });

  socket.on("beginGame", (payload, ack) => {
    try {
      const { roomId, userId } = payload ?? {};
      if (!canManageGame(roomId, userId)) throw new Error("Only host or admin can start the game");
      if (isGameInProgress(roomId)) throw new Error("A game is already running");

      const room = getRoom(roomId);
      const lobby = ensureGameLobby(room);
      if (!lobby.selectedType) throw new Error("Select a game first");
      const players = [...lobby.players];
      if (players.length < 1) throw new Error("Need at least one player to join first");
      if (lobby.selectedType === "draw" && players.length < 2) {
        throw new Error("Draw & Guess needs at least 2 players");
      }

      let game;
      if (lobby.selectedType === "trivia") {
        game = createTriviaGame({ roomId, hostUserId: userId, players });
      } else if (lobby.selectedType === "draw") {
        game = createDrawGuessGame({ roomId, hostUserId: userId, players });
      } else {
        throw new Error("Unknown game type");
      }

      setActiveGame(roomId, game);
      for (const p of players) {
        const m = getMember(roomId, p.userId);
        if (m) m.inGame = true;
      }

      launchGameFromLobby(game, io, roomId);
      broadcastGameState(io, roomId, game);

      const roomState = publicRoomState(roomId);
      const snap = game.snapshot?.(userId) ?? game.toPublic?.();
      ack?.({ ok: true, game: snap, room: roomState });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
    }
  });

  socket.on("endGame", (payload, ack) => {
    try {
      const { roomId, userId, force } = payload ?? {};
      const room = getRoom(roomId);
      const canEnd =
        canManageGame(roomId, userId) || (force && room.ownerUserId && room.ownerUserId === userId);
      if (!canEnd) throw new Error("Only host or admin can end the game");
      endActiveGame(roomId);
      if (force) clearGameLobby(roomId);
      for (const m of room.members.values()) {
        const inLobby = ensureGameLobby(room).players.some((p) => p.userId === m.userId);
        m.inGame = inLobby;
      }
      io.to(roomChannel(roomId)).emit("gameStateUpdate", { room: publicRoomState(roomId), game: null });
      ack?.({ ok: true });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
    }
  });

  socket.on("sendTriviaAnswer", (payload, ack) => {
    try {
      const { roomId, userId, answerIndex } = payload ?? {};
      const game = getActiveGame(roomId);
      if (!game || game.type !== "trivia") throw new Error("No trivia game");
      const ok = handleTriviaAnswer(game, userId, answerIndex);
      if (!ok) throw new Error("Answer not accepted");
      ack?.({ ok: true });
      io.to(roomChannel(roomId)).emit("gameStateUpdate", { game: game.snapshot() });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
    }
  });

  socket.on("drawStroke", (payload) => {
    const { roomId, userId, stroke } = payload ?? {};
    const game = getActiveGame(roomId);
    if (!game || game.type !== "draw") return;
    if (!handleDrawStroke(game, userId, stroke)) return;
    socket.to(roomChannel(roomId)).emit("drawStroke", { stroke, userId });
  });

  socket.on("clearCanvas", (payload, ack) => {
    try {
      const { roomId, userId } = payload ?? {};
      const game = getActiveGame(roomId);
      if (!game || game.type !== "draw") throw new Error("No draw game");
      const room = getRoom(roomId);
      if (!handleClearCanvas(game, userId, room.hostUserId)) throw new Error("Not allowed");
      io.to(roomChannel(roomId)).emit("clearCanvas", { roomId });
      if (game.type === "draw") {
        for (const m of room.members.values()) {
          const personal = game.snapshot(m.userId);
          if (m.socketId) io.to(m.socketId).emit("gameStateUpdate", { game: personal });
        }
      }
      ack?.({ ok: true });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
    }
  });

  socket.on("submitGuess", (payload, ack) => {
    try {
      const { roomId, userId, guess } = payload ?? {};
      const game = getActiveGame(roomId);
      if (!game || game.type !== "draw") throw new Error("No draw game");
      const result = handleGuess(game, userId, guess, io, roomId);
      if (!result.ok) throw new Error(result.wrong ? "Wrong guess" : "Guess not accepted");
      ack?.({ ok: true, points: result.points, rank: result.rank, correct: true });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
    }
  });

  socket.on("disconnect", () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    removeMember(meta.roomId, meta.userId);
    socketMeta.delete(socket.id);
    io.to(roomChannel(meta.roomId)).emit("gameStateUpdate", { room: publicRoomState(meta.roomId) });
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`G-Play socket server listening on port ${PORT}`);
  console.log(`CORS origins: ${Array.isArray(corsOrigin) ? corsOrigin.join(", ") : corsOrigin}`);
});
