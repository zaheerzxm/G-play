/** In-memory authoritative game sessions per voice room. */

const rooms = new Map();

export function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      roomId,
      hostUserId: null,
      ownerUserId: null,
      gameManagerIds: new Set(),
      members: new Map(),
      activeGame: null,
      gameLobby: { selectedType: null, players: [] },
      triviaUsedIds: new Set(),
    });
  }
  return rooms.get(roomId);
}

export function setRoomHost(roomId, userId) {
  const room = getRoom(roomId);
  room.hostUserId = userId;
}

export function addMember(roomId, userId, meta) {
  const room = getRoom(roomId);
  const prev = room.members.get(userId);
  room.members.set(userId, {
    ...prev,
    ...meta,
    userId,
    joinedAt: prev?.joinedAt ?? Date.now(),
  });
  return room;
}

export function removeMember(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.members.delete(userId);
  if (room.members.size === 0) {
    rooms.delete(roomId);
    return null;
  }
  return room;
}

export function getMember(roomId, userId) {
  return rooms.get(roomId)?.members.get(userId) ?? null;
}

export function isHost(roomId, userId) {
  const room = rooms.get(roomId);
  return Boolean(room && room.hostUserId === userId);
}

export function canManageGame(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room || !userId) return false;
  if (room.ownerUserId === userId) return true;
  if (room.hostUserId === userId) return true;
  if (room.gameManagerIds?.has(userId)) return true;
  return false;
}

export function setActiveGame(roomId, game) {
  const room = getRoom(roomId);
  room.activeGame = game;
  return game;
}

export function clearActiveGame(roomId) {
  const room = rooms.get(roomId);
  if (room) room.activeGame = null;
}

export function ensureGameLobby(room) {
  if (!room.gameLobby) {
    room.gameLobby = { selectedType: null, players: [] };
  }
  return room.gameLobby;
}

export function clearGameLobby(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.gameLobby = { selectedType: null, players: [] };
}

export function isGameInProgress(roomId) {
  const game = getActiveGame(roomId);
  if (!game) return false;
  // Lobby uses room.gameLobby — only block when a round is actually running
  return game.phase !== "finished" && game.phase !== "waiting";
}

export function clearStaleWaitingGame(roomId) {
  const game = getActiveGame(roomId);
  if (!game || game.phase !== "waiting") return false;
  if (game.destroy) game.destroy();
  clearActiveGame(roomId);
  return true;
}

export function getActiveGame(roomId) {
  return rooms.get(roomId)?.activeGame ?? null;
}

export function publicRoomState(roomId) {
  const room = rooms.get(roomId);
  if (!room) {
    return {
      roomId,
      hostUserId: null,
      members: [],
      gameLobby: { selectedType: null, players: [] },
      activeGame: null,
    };
  }
  const lobby = ensureGameLobby(room);
  return {
    roomId,
    hostUserId: room.hostUserId,
    members: [...room.members.values()].map((m) => ({
      userId: m.userId,
      userName: m.userName,
      inGame: Boolean(m.inGame),
    })),
    gameLobby: {
      selectedType: lobby.selectedType,
      players: [...lobby.players],
    },
    activeGame: room.activeGame?.toPublic?.() ?? room.activeGame?.snapshot?.() ?? null,
  };
}
