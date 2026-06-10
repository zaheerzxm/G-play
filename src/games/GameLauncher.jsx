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
import WordBattleGame from "./wordle/WordBattleGame.jsx";
import MafiaGame from "./mafia/MafiaGame.jsx";

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
  onDockChatConfig,
  onGameToast,
  chatDraft = "",
  wordleGuessAckRef,
  liveGameRef,
  avatarUrl,
  seatNumber,
}) {
  const [gameState, setGameState] = useState(null);
  const [gameLobby, setGameLobby] = useState(EMPTY_LOBBY);
  const [joined, setJoined] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [mafiaMode, setMafiaMode] = useState(false);
  const [mafiaSession, setMafiaSession] = useState(false);
  const [mafiaWaiting, setMafiaWaiting] = useState(false);
  const applyRef = useRef(null);

  const isFinished = gameState?.phase === "finished";
  const inActivePlayers = Boolean(
    gameState?.players?.some((p) => p.userId === userId),
  );
  const gameInProgress = Boolean(
    gameState?.type && gameState.phase && gameState.phase !== "waiting" && !isFinished,
  );
  const isWordle = gameState?.type === "wordle";
  const showGame = stageActive && gameInProgress && (inActivePlayers || (isWordle && !isFinished));
  const showWordleSpectator = showGame && isWordle && !inActivePlayers;
  const showResults = stageActive && gameState?.type && isFinished && (inActivePlayers || isWordle);
  const showMafia = stageActive && (mafiaMode || mafiaSession || mafiaWaiting);
  const showLobby = stageActive && !showGame && !showResults && !showMafia;

  const notify = useCallback((msg) => {
    if (!msg) return;
    console.warn("[games]", msg);
    onGameToast?.(msg);
  }, [onGameToast]);

  const applyRoomGame = useCallback((room, game) => {
    if (room?.gameLobby) {
      setGameLobby(room.gameLobby);
    }
    let nextGame = game !== undefined ? game : room?.activeGame;
    if (nextGame?.phase === "waiting") nextGame = null;
    if (nextGame !== undefined) {
      setGameState((prev) => {
        if (!nextGame) return null;
        const isDrawer = nextGame.drawerId === userId;
        if (
          isDrawer
          && prev?.type === "draw"
          && prev.word
          && !nextGame.word
          && nextGame.phase === "drawing"
        ) {
          return { ...nextGame, word: prev.word };
        }
        return nextGame;
      });
    }

    const lobbyPlayers = room?.gameLobby?.players ?? [];
    const inLobby = lobbyPlayers.some((p) => p.userId === userId);
    const inActive = nextGame?.players?.some((p) => p.userId === userId);
    setJoined(inLobby || Boolean(inActive));
  }, [userId]);

  applyRef.current = applyRoomGame;

  useEffect(() => {
    if (!wordleGuessAckRef) return undefined;
    wordleGuessAckRef.current = ({ guess, result }) => {
      if (!guess || !result?.length) return;
      setGameState((prev) => {
        if (!prev || prev.type !== "wordle") return prev;
        const myGuesses = prev.myGuesses ?? [];
        if (myGuesses.some((g) => g.guess === guess)) return prev;
        const nextGuesses = [...myGuesses, { guess, result }];
        const solved = result.every((r) => r === "correct");
        return {
          ...prev,
          myGuesses: nextGuesses,
          mySolved: solved || prev.mySolved,
          myFinished: solved || nextGuesses.length >= (prev.maxAttempts ?? 6),
        };
      });
    };
    return () => {
      wordleGuessAckRef.current = null;
    };
  }, [wordleGuessAckRef]);

  useEffect(() => {
    onSessionActiveChange?.(Boolean(showGame) || mafiaSession);
  }, [showGame, mafiaSession, onSessionActiveChange]);

  useEffect(() => {
    onWaitingGameChange?.(Boolean(showLobby) || mafiaWaiting);
  }, [showLobby, mafiaWaiting, onWaitingGameChange]);

  useEffect(() => {
    if (!onDockChatConfig) return;
    const wordleTyping =
      showGame
      && gameState?.type === "wordle"
      && inActivePlayers
      && !gameState.myFinished
      && gameState.phase === "playing";
    const drawGuessing =
      showGame
      && gameState?.type === "draw"
      && inActivePlayers
      && gameState.phase === "drawing"
      && gameState.drawerId !== userId;
    if (wordleTyping) {
      onDockChatConfig({
        placeholder: "5-letter word…",
        maxLength: 5,
        lettersOnly: true,
      });
    } else if (drawGuessing) {
      onDockChatConfig({
        placeholder: "Guess the word…",
        maxLength: 80,
        lettersOnly: false,
      });
    } else {
      onDockChatConfig(null);
    }
  }, [
    showGame,
    gameState?.type,
    gameState?.phase,
    gameState?.myFinished,
    gameState?.drawerId,
    inActivePlayers,
    userId,
    onDockChatConfig,
  ]);

  useEffect(() => {
    if (!stageActive) {
      setGameState(null);
      setGameLobby(EMPTY_LOBBY);
      setJoined(false);
      setSocketReady(false);
      setMafiaMode(false);
      setMafiaSession(false);
      setMafiaWaiting(false);
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
      console.warn("[games]", unavailable);
      setSocketReady(false);
      return undefined;
    }

    const socket = connectSocket();
    if (!socket) {
      console.warn("[games]", getGamesServerMessage() || "Game server not available");
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
      emitAck("getGameState", { roomId, userId }).then((res) => {
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
      } else {
        console.warn("[games]", res.error ?? "Could not connect to game server");
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
    if (gameType === "mafia") {
      setMafiaMode(true);
      setGameLobby((prev) => ({ ...prev, selectedType: "mafia" }));
      emitAck("selectGame", { roomId, userId, gameType }).catch(() => {});
      return;
    }
    setMafiaMode(false);
    setGameLobby((prev) => ({ ...prev, selectedType: gameType }));
    const res = await emitAck("selectGame", { roomId, userId, gameType });
    if (!res.ok) {
      notify(res.error ?? "Could not select game");
      await emitAck("getGameState", { roomId }).then((r) => {
        if (r.ok && r.state) applyRoomGame(r.state, r.state.activeGame);
      });
      return;
    }
    if (res.room) applyRoomGame(res.room, res.room.activeGame ?? null);
  }, [roomId, userId, applyRoomGame, notify]);

  const beginGame = useCallback(async () => {
    if (!socketReady) {
      notify("Connecting to game server… try again in a moment");
      return;
    }
    const res = await emitAck("beginGame", { roomId, userId });
    if (!res.ok) {
      notify(res.error ?? "Could not start game");
      return;
    }
    if (res.room) applyRoomGame(res.room, res.game);
    else if (res.game) setGameState(res.game);
  }, [socketReady, roomId, userId, applyRoomGame, notify]);

  const joinGame = useCallback(async () => {
    if (gameLobby.selectedType === "mafia") {
      setMafiaMode(true);
      return;
    }
    if (!socketReady) {
      notify("Still connecting to game server… wait a moment and try again");
      return;
    }
    const res = await emitAck("joinGame", { roomId, userId, userName });
    if (!res.ok) {
      notify(res.error ?? "Could not join");
      return;
    }
    if (res.room) applyRoomGame(res.room, res.room.activeGame);
  }, [gameLobby.selectedType, socketReady, roomId, userId, userName, applyRoomGame, notify]);

  const leaveLobby = useCallback(async () => {
    const res = await emitAck("leaveGameLobby", { roomId, userId });
    if (!res.ok) {
      notify(res.error ?? "Could not leave");
      return;
    }
    if (res.room) applyRoomGame(res.room, res.room.activeGame);
  }, [roomId, userId, applyRoomGame, notify]);

  const endGame = useCallback(async (leaveMode = false) => {
    const res = await emitAck("endGame", { roomId, userId });
    if (!res.ok) {
      notify(res.error ?? "Could not end game");
      return;
    }
    setGameState(null);
    if (leaveMode && canHost) await onDeactivateGameMode?.();
    await emitAck("getGameState", { roomId }).then((r) => {
      if (r.ok && r.state) applyRoomGame(r.state, r.state.activeGame);
    });
  }, [roomId, userId, canHost, onDeactivateGameMode, applyRoomGame, notify]);

  const startNextWordleRound = useCallback(async () => {
    const res = await emitAck("startNextWordleRound", { roomId, userId });
    if (!res.ok) {
      notify(res.error ?? "Could not start next round");
      return;
    }
    if (res.game) setGameState(res.game);
  }, [roomId, userId, notify]);

  const replayGame = useCallback(async () => {
    const type = gameLobby.selectedType ?? gameState?.type;
    if (!type || !canHost) return;
    await emitAck("endGame", { roomId, userId });
    if (type !== gameLobby.selectedType) {
      await emitAck("selectGame", { roomId, userId, gameType: type });
    }
    const res = await emitAck("beginGame", { roomId, userId });
    if (!res.ok) {
      notify(res.error ?? "Could not replay");
      return;
    }
    if (res.room) applyRoomGame(res.room, res.game);
    else if (res.game) setGameState(res.game);
  }, [gameLobby.selectedType, gameState?.type, canHost, roomId, userId, applyRoomGame, notify]);

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

      {showGame && gameState?.type === "wordle" && (
        <WordBattleGame
          roomId={roomId}
          userId={userId}
          userName={userName}
          gameState={gameState}
          canHost={canHost}
          spectator={showWordleSpectator}
          draftGuess={chatDraft}
          onStartNextRound={startNextWordleRound}
        />
      )}

      {showMafia && (
        <MafiaGame
          roomId={roomId}
          userId={userId}
          userName={userName}
          avatarUrl={avatarUrl}
          seatNumber={seatNumber}
          canHost={canHost}
          mafiaSelected={mafiaMode || gameLobby.selectedType === "mafia"}
          onSelectMafia={() => setMafiaMode(true)}
          onSessionActive={setMafiaSession}
          onWaiting={setMafiaWaiting}
          onToast={onGameToast}
        />
      )}
    </>
  );
}
