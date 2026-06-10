import { useCallback, useEffect, useRef, useState } from "react";
import {
  connectSocket,
  disconnectSocket,
  emitAck,
  getGamesServerMessage,
  getSocket,
  resolveSocketUrl,
} from "../lib/socket.js";
import GameLobby from "./GameLobby.jsx";
import GameResults from "./GameResults.jsx";
import TriviaGame from "./trivia/TriviaGame.jsx";
import DrawGuessGame from "./draw/DrawGuessGame.jsx";

const EMPTY_LOBBY = { selectedType: null, players: [] };

export default function GameLauncher({
  stageActive,
  roomId,
  userId,
  userName,
  canHost,
  ownerUserId,
  onDeactivateGameMode,
  onSessionActiveChange,
  onWaitingGameChange,
  liveGameRef,
}) {
  const [gameState, setGameState] = useState(null);
  const [gameLobby, setGameLobby] = useState(EMPTY_LOBBY);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const [socketReady, setSocketReady] = useState(false);
  const applyRef = useRef(null);

  const isFinished = gameState?.phase === "finished";
  const inActivePlayers = Boolean(
    gameState?.players?.some((p) => p.userId === userId),
  );
  const gameInProgress = Boolean(
    gameState?.type && gameState.phase && gameState.phase !== "waiting" && !isFinished,
  );
  const showGame = stageActive && gameInProgress && inActivePlayers;
  const showResults = stageActive && gameState?.type && isFinished && inActivePlayers;
  const showLobby = stageActive && !showGame && !showResults;

  const applyRoomGame = useCallback((room, game) => {
    if (room?.gameLobby) {
      setGameLobby(room.gameLobby);
    }
    let nextGame = game !== undefined ? game : room?.activeGame;
    if (nextGame?.phase === "waiting") nextGame = null;
    if (nextGame !== undefined) {
      setGameState(nextGame || null);
    }

    const lobbyPlayers = room?.gameLobby?.players ?? [];
    const inLobby = lobbyPlayers.some((p) => p.userId === userId);
    const inActive = nextGame?.players?.some((p) => p.userId === userId);
    setJoined(inLobby || Boolean(inActive));
  }, [userId]);

  applyRef.current = applyRoomGame;

  useEffect(() => {
    onSessionActiveChange?.(Boolean(showGame));
  }, [showGame, onSessionActiveChange]);

  useEffect(() => {
    onWaitingGameChange?.(Boolean(showLobby));
  }, [showLobby, onWaitingGameChange]);

  useEffect(() => {
    if (!stageActive) {
      setGameState(null);
      setGameLobby(EMPTY_LOBBY);
      setJoined(false);
      setError(null);
      setSocketReady(false);
      disconnectSocket();
    }
  }, [stageActive]);

  useEffect(() => {
    if (!liveGameRef) return;
    liveGameRef.current = gameState && joined && gameState.phase === "drawing"
      ? { ...gameState, joined, roomId, userId }
      : gameState
        ? { ...gameState, joined, roomId, userId }
        : null;
  }, [gameState, joined, roomId, userId, liveGameRef]);

  useEffect(() => {
    if (!stageActive || !roomId || !userId) return undefined;

    const unavailable = getGamesServerMessage();
    if (unavailable) {
      setError(unavailable);
      setSocketReady(false);
      return undefined;
    }

    const socket = connectSocket();
    if (!socket) {
      setError(getGamesServerMessage() || "Game server not available");
      setSocketReady(false);
      return undefined;
    }

    let active = true;

    const onUpdate = (payload) => {
      if (!active) return;
      applyRef.current?.(payload?.room, payload?.game);
    };

    socket.on("gameStateUpdate", onUpdate);

    const syncState = () =>
      emitAck("getGameState", { roomId }).then((res) => {
        if (!active || !res.ok || !res.state) return;
        applyRef.current?.(res.state, res.state.activeGame);
      });

    emitAck("joinRoom", {
      roomId,
      userId,
      userName,
      isHost: canHost,
      canManageGames: canHost,
      ownerUserId,
    }).then((res) => {
      if (!active) return;
      if (res.ok && res.state) {
        applyRef.current?.(res.state, res.state.activeGame);
        setSocketReady(true);
        setError(null);
      } else {
        const target = resolveSocketUrl();
        setError(
          target
            ? `${res.error ?? "Could not connect to game server"} (${target})`
            : (res.error ?? "Could not connect to game server"),
        );
      }
    });

    const poll = setInterval(syncState, 2000);

    return () => {
      active = false;
      clearInterval(poll);
      socket.off("gameStateUpdate", onUpdate);
      emitAck("leaveRoom", {});
      setSocketReady(false);
    };
  }, [stageActive, roomId, userId, userName, canHost, ownerUserId]);

  const selectGame = useCallback(async (gameType) => {
    setError(null);
    setGameLobby((prev) => ({ ...prev, selectedType: gameType }));
    const res = await emitAck("selectGame", { roomId, userId, gameType });
    if (!res.ok) {
      setError(res.error ?? "Could not select game");
      await emitAck("getGameState", { roomId }).then((r) => {
        if (r.ok && r.state) applyRoomGame(r.state, r.state.activeGame);
      });
      return;
    }
    if (res.room) applyRoomGame(res.room, res.room.activeGame ?? null);
  }, [roomId, userId, applyRoomGame]);

  const beginGame = useCallback(async () => {
    if (!socketReady) {
      setError("Connecting to game server… try again in a moment");
      return;
    }
    setError(null);
    const res = await emitAck("beginGame", { roomId, userId });
    if (!res.ok) {
      setError(res.error ?? "Could not start game");
      return;
    }
    if (res.room) applyRoomGame(res.room, res.game);
    else if (res.game) setGameState(res.game);
  }, [socketReady, roomId, userId, applyRoomGame]);

  const joinGame = useCallback(async () => {
    if (!socketReady) {
      setError("Still connecting to game server… wait a moment and try again");
      return;
    }
    setError(null);
    const res = await emitAck("joinGame", { roomId, userId, userName });
    if (!res.ok) {
      setError(res.error ?? "Could not join");
      return;
    }
    if (res.room) applyRoomGame(res.room, res.room.activeGame);
  }, [socketReady, roomId, userId, userName, applyRoomGame]);

  const leaveLobby = useCallback(async () => {
    setError(null);
    const res = await emitAck("leaveGameLobby", { roomId, userId });
    if (!res.ok) {
      setError(res.error ?? "Could not leave");
      return;
    }
    if (res.room) applyRoomGame(res.room, res.room.activeGame);
  }, [roomId, userId, applyRoomGame]);

  const endGame = useCallback(async (leaveMode = false) => {
    const res = await emitAck("endGame", { roomId, userId });
    if (!res.ok) {
      setError(res.error ?? "Could not end game");
      return;
    }
    setGameState(null);
    if (leaveMode && canHost) await onDeactivateGameMode?.();
    await emitAck("getGameState", { roomId }).then((r) => {
      if (r.ok && r.state) applyRoomGame(r.state, r.state.activeGame);
    });
  }, [roomId, userId, canHost, onDeactivateGameMode, applyRoomGame]);

  const replayGame = useCallback(async () => {
    const type = gameLobby.selectedType ?? gameState?.type;
    if (!type || !canHost) return;
    await emitAck("endGame", { roomId, userId });
    if (type !== gameLobby.selectedType) {
      await emitAck("selectGame", { roomId, userId, gameType: type });
    }
    const res = await emitAck("beginGame", { roomId, userId });
    if (!res.ok) {
      setError(res.error ?? "Could not replay");
      return;
    }
    if (res.room) applyRoomGame(res.room, res.game);
    else if (res.game) setGameState(res.game);
  }, [gameLobby.selectedType, gameState?.type, canHost, roomId, userId, applyRoomGame]);

  const sendStroke = useCallback((stroke) => {
    getSocket()?.emit("drawStroke", { roomId, userId, stroke });
  }, [roomId, userId]);

  const leaderboard = (gameState?.players ?? []).map((p) => ({
    ...p,
    score: gameState?.scores?.[p.userId] ?? 0,
  })).sort((a, b) => b.score - a.score);

  if (!stageActive) return null;

  return (
    <>
      {error && <p className="game-launcher-error">{error}</p>}

      {showLobby && (
        <GameLobby
          canHost={canHost}
          socketReady={socketReady}
          selectedType={gameLobby.selectedType}
          joinedPlayers={gameLobby.players}
          joined={joined}
          gameInProgress={gameInProgress}
          onSelectGame={selectGame}
          onJoinGame={joinGame}
          onLeaveLobby={leaveLobby}
          onBeginGame={beginGame}
          onEndGame={() => endGame(false)}
        />
      )}

      {showResults && (
        <GameResults
          gameType={gameState.type}
          leaderboard={leaderboard}
          userId={userId}
          canHost={canHost}
          onReplay={replayGame}
          onDone={() => endGame(true)}
        />
      )}

      {showGame && gameState?.type === "trivia" && (
        <TriviaGame roomId={roomId} userId={userId} gameState={gameState} />
      )}

      {showGame && gameState?.type === "draw" && (
        <DrawGuessGame
          roomId={roomId}
          userId={userId}
          userName={userName}
          gameState={gameState}
          onLocalStroke={sendStroke}
        />
      )}
    </>
  );
}
