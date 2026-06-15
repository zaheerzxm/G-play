import { useCallback, useEffect, useRef, useState } from "react";
import {
  connectSocket,
  disconnectSocket,
  emitAck,
  getGamesServerMessage,
  getSocket,
  resolveSocketUrl,
} from "../lib/socket.js";
import GameResults from "./GameResults.jsx";
import GamesPickerSheet from "./GamesPickerSheet.jsx";
import GameLaunchPad from "./GameLaunchPad.jsx";
import GamesStageShell from "./GamesStageShell.jsx";
import TriviaGame from "./trivia/TriviaGame.jsx";
import DrawGuessGame from "./draw/DrawGuessGame.jsx";
import WordBattleGame from "./wordle/WordBattleGame.jsx";
import MafiaGame from "./mafia/MafiaGame.jsx";
import DDDGame from "./ddd/DDDGame.jsx";
import MafiaSettingsModal from "./mafia/MafiaSettingsModal.jsx";
import DDDSettingsModal from "./ddd/DDDSettingsModal.jsx";
import { useMafiaGame } from "./mafia/useMafiaGame.js";
import { useDDDGame } from "./ddd/useDDDGame.js";
import { useMafiaRoomSync } from "./mafia/useMafiaRoomSync.js";
import { useDDDRoomSync } from "./ddd/useDDDRoomSync.js";
import { MAFIA_MIN_PLAYERS } from "./mafia/constants.js";
import { DDD_MIN_PLAYERS } from "./ddd/constants.js";
import {
  endActiveMafiaGameForRoom,
  fetchActiveMafiaGame,
  leaveMafiaGame,
} from "./mafia/mafiaApi.js";
import {
  endActiveDDDGameForRoom,
  fetchActiveDDDGame,
  leaveDDDGame,
} from "./ddd/dddApi.js";
import { markGameTaskProgress } from "../gameTasks.js";
import { PENDING_LOBBY_GAME_KEY } from "../lobbyGames.js";

const EMPTY_LOBBY = { selectedType: null, players: [] };

const MAFIA_SETTINGS_DEFAULT = {
  daySeconds: 90,
  votingSeconds: 10,
  nightSeconds: 45,
  revealOnDeath: false,
  allowDeadChat: true,
};

const DDD_SETTINGS_DEFAULT = {
  turnSeconds: 60,
  allowSelfPick: false,
};

function mapSupabasePlayers(players) {
  return (players ?? []).map((p) => ({
    userId: p.user_id,
    userName: p.nickname || "Player",
    isReady: Boolean(p.is_ready),
  }));
}

export default function GameLauncher({
  stageActive,
  roomId,
  userId,
  userName,
  canHost,
  roomControlContext,
  ownerUserId,
  onDeactivateGameMode,
  onSessionActiveChange,
  onWaitingGameChange,
  onDockChatConfig,
  onGameToast,
  chatDraft = "",
  wordleGuessAckRef,
  liveGameRef,
  gamesUiRef,
  avatarUrl,
  seatNumber,
}) {
  const [gameState, setGameState] = useState(null);
  const [gameLobby, setGameLobby] = useState(EMPTY_LOBBY);
  const [joined, setJoined] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [dddDismissed, setDddDismissed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(true);
  const [mafiaSettingsOpen, setMafiaSettingsOpen] = useState(false);
  const [dddSettingsOpen, setDddSettingsOpen] = useState(false);
  const [mafiaSettings, setMafiaSettings] = useState(MAFIA_SETTINGS_DEFAULT);
  const [dddSettings, setDddSettings] = useState(DDD_SETTINGS_DEFAULT);
  const applyRef = useRef(null);
  const pendingGameAppliedRef = useRef(false);
  const { gameId: roomMafiaGameId } = useMafiaRoomSync(roomId, stageActive);
  const { gameId: roomDDDGameId } = useDDDRoomSync(roomId, stageActive);

  const mafia = useMafiaGame({
    roomId,
    userId,
    userName,
    avatarUrl,
    seatNumber,
    canHost,
    roomControlContext,
    roomGameId: roomMafiaGameId,
  });

  const ddd = useDDDGame({
    roomId,
    userId,
    userName,
    avatarUrl,
    seatNumber,
    canHost,
    roomControlContext,
    roomGameId: roomDDDGameId,
  });

  const selectedType = gameLobby.selectedType;
  const isMafiaSelected = selectedType === "mafia";
  const isDDDSelected = selectedType === "ddd";
  const isSupabaseSelected = isMafiaSelected || isDDDSelected;

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
  const showMafia = stageActive && (mafia.inProgress || (mafia.isOver && mafia.reveal));
  const showDDD = stageActive && !dddDismissed && (ddd.inProgress || ddd.isRoundEnd);
  const showLobby = stageActive && !showGame && !showResults && !showMafia && !showDDD;

  useEffect(() => {
    if (!userId || !stageActive) return;
    if (isFinished && gameState?.type) {
      markGameTaskProgress(userId, `play_${gameState.type}`);
    }
    if (mafia.isOver) markGameTaskProgress(userId, "play_mafia");
    if (ddd.isRoundEnd && ddd.roundNumber > 0) markGameTaskProgress(userId, "play_ddd");
  }, [userId, stageActive, isFinished, gameState?.type, mafia.isOver, ddd.isRoundEnd, ddd.roundNumber]);

  const lobbyPlayers = isMafiaSelected
    ? mapSupabasePlayers(mafia.players)
    : isDDDSelected
      ? mapSupabasePlayers(ddd.players)
      : gameLobby.players;

  const lobbyJoined = isMafiaSelected
    ? mafia.joined
    : isDDDSelected
      ? ddd.joined
      : joined;

  const mafiaMe = mafia.players.find((p) => String(p.user_id) === String(userId));

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
    onSessionActiveChange?.(Boolean(showGame) || showMafia || showDDD);
  }, [showGame, showMafia, showDDD, onSessionActiveChange]);

  useEffect(() => {
    onWaitingGameChange?.(Boolean(showLobby));
  }, [showLobby, onWaitingGameChange]);

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
    if (!stageActive) return;
    if (!gameLobby.selectedType && !gameState) {
      setDddDismissed(false);
      setPickerOpen(true);
    }
  }, [stageActive, gameLobby.selectedType, gameState]);

  useEffect(() => {
    if (showLobby && !gameLobby.selectedType) setPickerOpen(true);
  }, [showLobby, gameLobby.selectedType]);

  useEffect(() => {
    if (!gamesUiRef) return undefined;
    gamesUiRef.current = { openPicker: () => setPickerOpen(true) };
    return () => {
      gamesUiRef.current = null;
    };
  }, [gamesUiRef]);

  useEffect(() => {
    if (!stageActive) pendingGameAppliedRef.current = false;
  }, [stageActive]);

  useEffect(() => {
    if (!stageActive) {
      setGameState(null);
      setGameLobby(EMPTY_LOBBY);
      setJoined(false);
      setSocketReady(false);
      setDddDismissed(false);
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

  const stopRoomMafia = useCallback(async () => {
    if (!roomId || !canHost) return;
    try {
      await endActiveMafiaGameForRoom(roomId);
    } catch (e) {
      console.warn("[mafia] stop", e?.message ?? e);
    }
  }, [roomId, canHost]);

  const stopRoomDDD = useCallback(async () => {
    if (!roomId || !canHost) return;
    try {
      await endActiveDDDGameForRoom(roomId);
    } catch (e) {
      console.warn("[ddd] stop", e?.message ?? e);
    }
  }, [roomId, canHost]);

  const clearMafiaSeat = useCallback(async () => {
    let id = mafia.gameId ?? roomMafiaGameId;
    if (!id && roomId) {
      try {
        id = await fetchActiveMafiaGame(roomId);
      } catch {
        /* ok */
      }
    }
    if (!id) return;
    try {
      await leaveMafiaGame(id);
    } catch {
      /* ok */
    }
  }, [mafia.gameId, roomMafiaGameId, roomId]);

  const clearDDDSeat = useCallback(async () => {
    let id = ddd.gameId ?? roomDDDGameId;
    if (!id && roomId) {
      try {
        id = await fetchActiveDDDGame(roomId);
      } catch {
        /* ok */
      }
    }
    if (!id) return;
    try {
      await leaveDDDGame(id);
    } catch {
      /* ok */
    }
  }, [ddd.gameId, roomDDDGameId, roomId]);

  const selectGame = useCallback(async (gameType) => {
    const fromType = gameLobby.selectedType;
    if (fromType === gameType) {
      setPickerOpen(false);
      return;
    }

    if (fromType === "mafia" || gameType === "mafia") {
      await clearMafiaSeat();
    }
    if (fromType === "ddd" || gameType === "ddd") {
      await clearDDDSeat();
    }
    if (fromType && fromType !== "mafia" && fromType !== "ddd" && joined) {
      await emitAck("leaveGameLobby", { roomId, userId }).catch(() => {});
    }

    if (canHost) {
      await stopRoomMafia();
      await stopRoomDDD();
    }

    if (gameType === "ddd") setDddDismissed(false);

    const isSupabasePick = gameType === "mafia" || gameType === "ddd";
    setGameLobby((prev) => ({ ...prev, selectedType: gameType }));

    const syncSocketSelection = () =>
      emitAck("selectGame", { roomId, userId, gameType }).then((res) => {
        if (res.ok && res.room) applyRoomGame(res.room, res.room.activeGame ?? null);
        else if (!isSupabasePick && !res.ok) {
          notify(res.error ?? "Could not select game");
          emitAck("getGameState", { roomId }).then((r) => {
            if (r.ok && r.state) applyRoomGame(r.state, r.state.activeGame);
          });
        }
      });

    if (isSupabasePick) {
      await mafia.refresh().catch(() => {});
      await ddd.refresh().catch(() => {});
      setPickerOpen(false);
      syncSocketSelection().catch(() => {});
      return;
    }

    const res = await emitAck("selectGame", { roomId, userId, gameType });
    if (!res.ok) {
      notify(res.error ?? "Could not select game");
      await emitAck("getGameState", { roomId }).then((r) => {
        if (r.ok && r.state) applyRoomGame(r.state, r.state.activeGame);
      });
      return;
    }
    if (res.room) applyRoomGame(res.room, res.room.activeGame ?? null);
    setPickerOpen(false);
  }, [
    roomId,
    userId,
    canHost,
    joined,
    gameLobby.selectedType,
    clearMafiaSeat,
    clearDDDSeat,
    stopRoomMafia,
    stopRoomDDD,
    applyRoomGame,
    notify,
    mafia,
    ddd,
  ]);

  useEffect(() => {
    if (!stageActive || !canHost || pendingGameAppliedRef.current) return;

    let pendingId = null;
    try {
      pendingId = sessionStorage.getItem(PENDING_LOBBY_GAME_KEY);
    } catch {
      /* ignore */
    }
    if (!pendingId) return;

    const needsSocket = pendingId !== "mafia" && pendingId !== "ddd";
    if (needsSocket && !socketReady) return;

    pendingGameAppliedRef.current = true;
    try {
      sessionStorage.removeItem(PENDING_LOBBY_GAME_KEY);
    } catch {
      /* ignore */
    }
    selectGame(pendingId);
  }, [stageActive, canHost, socketReady, selectGame]);

  const beginGame = useCallback(async () => {
    if (isMafiaSelected) {
      try {
        await mafia.start();
      } catch (e) {
        notify(e.message ?? "Could not start Mafia");
      }
      return;
    }
    if (isDDDSelected) {
      try {
        await ddd.start();
      } catch (e) {
        notify(e.message ?? "Could not start DDD");
      }
      return;
    }
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
  }, [isMafiaSelected, isDDDSelected, mafia, ddd, socketReady, roomId, userId, applyRoomGame, notify]);

  const returnToGamePicker = useCallback(async (endForAll = false) => {
    if (endForAll && canHost) {
      await stopRoomMafia();
      await stopRoomDDD();
      setDddDismissed(false);
      await clearMafiaSeat();
      await clearDDDSeat();
      setGameLobby(EMPTY_LOBBY);
      setGameState(null);
      setPickerOpen(true);
      const res = await emitAck("endGame", { roomId, userId, force: true });
      if (res.ok) {
        applyRoomGame({ gameLobby: EMPTY_LOBBY }, null);
      }
      await emitAck("getGameState", { roomId, userId }).then((r) => {
        if (r.ok && r.state) applyRoomGame(r.state, null);
      });
      return;
    }
    setDddDismissed(true);
    setPickerOpen(true);
    await clearMafiaSeat();
    await clearDDDSeat();
    if (!isSupabaseSelected && joined) {
      await emitAck("leaveGameLobby", { roomId, userId }).catch(() => {});
    }
    await mafia.refresh().catch(() => {});
    await ddd.refresh().catch(() => {});
  }, [
    canHost,
    roomId,
    userId,
    joined,
    isSupabaseSelected,
    clearMafiaSeat,
    clearDDDSeat,
    stopRoomMafia,
    stopRoomDDD,
    applyRoomGame,
    mafia,
    ddd,
  ]);

  const joinGame = useCallback(async () => {
    if (isMafiaSelected) {
      try {
        let id = roomMafiaGameId ?? mafia.gameId;
        if (!id && canHost) id = await mafia.selectMafia(mafiaSettings);
        await mafia.join(id);
      } catch (e) {
        notify(e.message ?? "Could not join Mafia");
      }
      return;
    }
    if (isDDDSelected) {
      try {
        if (!ddd.gameId && !roomDDDGameId && canHost) await ddd.selectDDD();
        await ddd.join(roomDDDGameId ?? undefined);
      } catch (e) {
        notify(e.message ?? "Could not join DDD");
      }
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
  }, [
    isMafiaSelected,
    isDDDSelected,
    roomMafiaGameId,
    roomDDDGameId,
    canHost,
    mafia,
    ddd,
    mafiaSettings,
    socketReady,
    roomId,
    userId,
    userName,
    applyRoomGame,
    notify,
  ]);

  const leaveLobby = useCallback(async () => {
    if (isMafiaSelected) {
      try {
        await mafia.leave();
      } catch (e) {
        notify(e.message ?? "Could not leave");
      }
      return;
    }
    if (isDDDSelected) {
      try {
        await ddd.leave();
      } catch (e) {
        notify(e.message ?? "Could not leave");
      }
      return;
    }
    const res = await emitAck("leaveGameLobby", { roomId, userId });
    if (!res.ok) {
      notify(res.error ?? "Could not leave");
      return;
    }
    if (res.room) applyRoomGame(res.room, res.room.activeGame);
  }, [isMafiaSelected, isDDDSelected, mafia, ddd, roomId, userId, applyRoomGame, notify]);

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

  const isSupabaseGame = isSupabaseSelected;
  const minPlayers = isMafiaSelected
    ? MAFIA_MIN_PLAYERS
    : isDDDSelected
      ? DDD_MIN_PLAYERS
      : null;

  const canManageGames = canHost || mafia.canManage || ddd.canManage;

  const canStart = isMafiaSelected
    ? mafia.players.length >= MAFIA_MIN_PLAYERS
      && mafia.players.length > 0
      && mafia.players.every((p) => p.is_ready)
    : isDDDSelected
      ? ddd.players.length >= DDD_MIN_PLAYERS
      : Boolean(selectedType)
        && !gameInProgress
        && lobbyPlayers.length >= (
          selectedType === "draw" || selectedType === "wordle" ? 2 : 1
        );

  if (!stageActive) return null;

  const inPlayView = showGame || showResults || showMafia || showDDD;

  return (
    <GamesStageShell
      showBack={inPlayView}
      canEndForAll={canManageGames}
      onReturnToPicker={returnToGamePicker}
    >
      {showLobby && (
        <>
          <GameLaunchPad
            selectedType={selectedType}
            joined={lobbyJoined}
            joinedPlayers={lobbyPlayers}
            canHost={canHost}
            canManage={canManageGames}
            canStart={canStart}
            gameInProgress={gameInProgress}
            socketReady={socketReady}
            isSupabaseGame={isSupabaseGame}
            minPlayers={minPlayers}
            isReady={Boolean(mafiaMe?.is_ready)}
            onJoin={joinGame}
            onLeave={leaveLobby}
            onStart={beginGame}
            onToggleReady={
              isMafiaSelected && mafia.joined
                ? () => mafia.toggleReady(!mafiaMe?.is_ready).catch((e) => notify(e.message))
                : undefined
            }
            onOpenSettings={
              isMafiaSelected
                ? () => setMafiaSettingsOpen(true)
                : isDDDSelected
                  ? () => setDddSettingsOpen(true)
                  : undefined
            }
            onOpenPicker={() => setPickerOpen(true)}
          />
          {mafiaSettingsOpen && (
            <MafiaSettingsModal
              settings={mafiaSettings}
              onChange={setMafiaSettings}
              onClose={() => setMafiaSettingsOpen(false)}
            />
          )}
          {dddSettingsOpen && (
            <DDDSettingsModal
              settings={dddSettings}
              onChange={setDddSettings}
              onClose={() => setDddSettingsOpen(false)}
            />
          )}
          <GamesPickerSheet
            open={pickerOpen}
            onClose={() => {
              if (gameLobby.selectedType) setPickerOpen(false);
            }}
            canHost={canManageGames}
            selectedType={gameLobby.selectedType}
            gameInProgress={gameInProgress}
            onSelectGame={selectGame}
          />
        </>
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
          roomControlContext={roomControlContext}
          roomMafiaGameId={roomMafiaGameId}
          onReturnToPicker={returnToGamePicker}
          onToast={onGameToast}
        />
      )}

      {showDDD && (
        <DDDGame
          roomId={roomId}
          userId={userId}
          userName={userName}
          avatarUrl={avatarUrl}
          seatNumber={seatNumber}
          canHost={canHost}
          roomControlContext={roomControlContext}
          roomDDDGameId={roomDDDGameId}
          onReturnToPicker={returnToGamePicker}
          onToast={onGameToast}
        />
      )}
    </GamesStageShell>
  );
}
