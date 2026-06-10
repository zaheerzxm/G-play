import { useCallback, useEffect, useState } from "react";
import { getSession, onAuthChange } from "./auth.js";
import LoginScreen from "./components/LoginScreen.jsx";
import LobbyScreen from "./components/LobbyScreen.jsx";
import ProfileSetupScreen from "./components/ProfileSetupScreen.jsx";
import RoomView from "./components/RoomView.jsx";
import DmCallProvider from "./components/DmCallProvider.jsx";
import { ensureProfile, loadMyRooms, loadProfileBundle, loadSavedRooms, searchRoomByCode, loadRoomById, cleanupOwnedEmptyTempRooms, cleanupStaleTempRooms } from "./profile.js";
import { checkRoomEntry } from "./roomAccess.js";
import { isConfigured, supabase } from "./supabase.js";
import { fetchWalletCoins, subscribeWallet } from "./wallet.js";
import { effectiveVipLevel } from "./vipStatus.js";

const ACTIVE_ROOM_STORAGE_KEY = "gplay.activeRoom.v1";

function readStoredActiveRoom() {
  try {
    const raw = window.localStorage.getItem(ACTIVE_ROOM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredActiveRoom(room, minimized = false) {
  if (!room?.id) return;
  try {
    window.localStorage.setItem(
      ACTIVE_ROOM_STORAGE_KEY,
      JSON.stringify({ id: room.id, room_code: room.room_code ?? null, minimized: Boolean(minimized) }),
    );
  } catch {
    /* optional */
  }
}

function clearStoredActiveRoom() {
  try {
    window.localStorage.removeItem(ACTIVE_ROOM_STORAGE_KEY);
  } catch {
    /* optional */
  }
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [coins, setCoins] = useState(0);
  const [myRooms, setMyRooms] = useState([]);
  const [savedRooms, setSavedRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [roomMinimized, setRoomMinimized] = useState(false);
  const [pendingRoomCode, setPendingRoomCode] = useState(null);
  const [error, setError] = useState(null);

  const isSuperAdmin = Boolean(profile?.is_super_admin);

  const refreshProfile = useCallback(async (userId) => {
    const bundle = await loadProfileBundle(userId);
    if (!bundle) return;
    setProfile(bundle.profile);
    setCoins(bundle.coins);
    const [rooms, saved] = await Promise.all([loadMyRooms(userId), loadSavedRooms(userId)]);
    setMyRooms(rooms);
    setSavedRooms(saved);
  }, []);

  const bootstrapUser = useCallback(
    async (nextSession) => {
      if (!nextSession?.user) {
        setSession(null);
        setProfile(null);
        setCoins(0);
        setMyRooms([]);
        setSavedRooms([]);
        setActiveRoom(null);
        setRoomMinimized(false);
        clearStoredActiveRoom();
        return;
      }

      setSession(nextSession);
      setError(null);

      try {
        const ensured = await ensureProfile(nextSession.user);
        if (ensured) setProfile(ensured);
        await refreshProfile(nextSession.user.id);
        cleanupOwnedEmptyTempRooms(nextSession.user.id).catch(() => {});
        cleanupStaleTempRooms().catch(() => {});
      } catch (e) {
        setError(e.message ?? "Could not load profile");
      }
    },
    [refreshProfile],
  );

  useEffect(() => {
    if (!isConfigured) {
      setBooting(false);
      return;
    }

    let active = true;

    (async () => {
      const existing = await getSession();
      if (!active) return;
      await bootstrapUser(existing);
      if (active) setBooting(false);
    })();

    const unsubscribe = onAuthChange((nextSession) => {
      bootstrapUser(nextSession);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [bootstrapUser]);

  // Live coin balance when wallet row changes (gifts, rewards, purchases)
  useEffect(() => {
    if (!session?.user?.id || isSuperAdmin) return undefined;

    const userId = session.user.id;
    let active = true;

    const unsubWallet = subscribeWallet(userId, (balance) => {
      if (active) setCoins(balance);
    });

    const poll = setInterval(() => {
      fetchWalletCoins(userId)
        .then((c) => {
          if (active && c != null) setCoins(c);
        })
        .catch(() => {});
    }, 5000);

    return () => {
      active = false;
      clearInterval(poll);
      unsubWallet();
    };
  }, [session?.user?.id, isSuperAdmin]);

  useEffect(() => {
    if (!session?.user?.id || !supabase) return undefined;
    const userId = session.user.id;
    const channel = supabase
      .channel(`profile-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) setProfile(payload.new);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("room")?.trim();
    if (!code) return;
    setPendingRoomCode(code.toUpperCase());
    const clean = `${window.location.pathname}${window.location.hash || ""}`;
    window.history.replaceState({}, "", clean);
  }, []);

  useEffect(() => {
    if (!profile || !pendingRoomCode || activeRoom) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const room = await searchRoomByCode(pendingRoomCode);
        if (cancelled) return;
        if (room) {
          const { ok, reason } = await checkRoomEntry(session.user.id, room);
          if (!ok) {
            setError(reason ?? "Can't enter this room");
            return;
          }
          setActiveRoom(room);
          setRoomMinimized(false);
          saveStoredActiveRoom(room, false);
          setError(null);
        } else {
          setError(`Room ${pendingRoomCode} not found`);
        }
      } catch (e) {
        if (!cancelled) setError(e.message ?? "Could not join room");
      } finally {
        if (!cancelled) setPendingRoomCode(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, pendingRoomCode, activeRoom]);

  useEffect(() => {
    if (!profile || activeRoom || pendingRoomCode) return undefined;

    const stored = readStoredActiveRoom();
    if (!stored?.id) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const room = await loadRoomById(stored.id);
        if (cancelled) return;
        if (room) {
          const { ok } = await checkRoomEntry(session.user.id, room);
          if (!ok) {
            clearStoredActiveRoom();
            return;
          }
          setActiveRoom(room);
          setRoomMinimized(false);
          saveStoredActiveRoom(room, false);
        } else {
          clearStoredActiveRoom();
        }
      } catch {
        if (!cancelled) clearStoredActiveRoom();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, activeRoom, pendingRoomCode]);

  async function handleJoinRoom(room) {
    const { ok, reason } = await checkRoomEntry(session?.user?.id, room);
    if (!ok) {
      setError(reason ?? "Can't enter this room");
      return;
    }
    setActiveRoom(room);
    setRoomMinimized(false);
    saveStoredActiveRoom(room, false);
    setError(null);
  }

  function handleMinimizeRoom() {
    setRoomMinimized(true);
    if (activeRoom) saveStoredActiveRoom(activeRoom, true);
  }

  function handleReopenRoom() {
    setRoomMinimized(false);
    if (activeRoom) saveStoredActiveRoom(activeRoom, false);
  }

  function handleLeaveRoom() {
    setActiveRoom(null);
    setRoomMinimized(false);
    clearStoredActiveRoom();
  }

  function handleSignOut() {
    setSession(null);
    setProfile(null);
    setCoins(0);
    setMyRooms([]);
    setSavedRooms([]);
    setActiveRoom(null);
    setRoomMinimized(false);
    clearStoredActiveRoom();
  }

  async function handleSavedRoomsChange() {
    if (!session?.user?.id) return;
    const saved = await loadSavedRooms(session.user.id);
    setSavedRooms(saved);
  }

  if (booting) {
    return (
      <div className="app">
        <div className="join-screen">
          <h1>G-play</h1>
          <p className="subtitle">Loading…</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return <LoginScreen />;
  }

  if (!profile) {
    return (
      <ProfileSetupScreen
        error={error}
        onRetry={async () => {
          await bootstrapUser(session);
        }}
      />
    );
  }

  const showLobby = !activeRoom || roomMinimized;
  const persistentMyRooms = myRooms.filter((room) => !room.is_temp);
  const persistentSavedRooms = savedRooms.filter((room) => !room.is_temp);
  const activeVipLevel = effectiveVipLevel(profile);

  return (
    <DmCallProvider userId={session.user.id} displayName={profile.display_name}>
      {activeRoom && (
        <div className={`room-layer ${roomMinimized ? "room-layer--hidden" : ""}`}>
          <RoomView
            room={activeRoom}
            userId={session.user.id}
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            coins={coins}
            isSuperAdmin={isSuperAdmin}
            vipLevel={activeVipLevel}
            onCoinsChange={setCoins}
            onProfileUpdate={setProfile}
            onMinimize={handleMinimizeRoom}
            onLeave={handleLeaveRoom}
            onSavedRoomsChange={handleSavedRoomsChange}
          />
        </div>
      )}

      {showLobby && (
        <>
          {error && <p className="banner error app-banner">{error}</p>}
          <LobbyScreen
            profile={profile}
            coins={coins}
            isSuperAdmin={isSuperAdmin}
            userId={session.user.id}
            myRooms={persistentMyRooms}
            savedRooms={persistentSavedRooms}
            hasActiveRoom={Boolean(activeRoom)}
            onJoinRoom={handleJoinRoom}
            onCoinsChange={setCoins}
            onRefreshRooms={() => refreshProfile(session.user.id)}
            onProfileUpdate={setProfile}
            onSignOut={handleSignOut}
          />
        </>
      )}

      {activeRoom && roomMinimized && (
        <button
          type="button"
          className="float-room-btn"
          onClick={handleReopenRoom}
          aria-label="Reopen voice room"
        >
          <span className="float-room-icon">🎙️</span>
          <span className="float-room-label">{activeRoom.name}</span>
        </button>
      )}
    </DmCallProvider>
  );
}
