import { useCallback, useEffect, useRef, useState } from "react";
import { isConfigured, supabase } from "./supabase.js";

const SEAT_LAYOUT = [
  [1, 2],
  [3, 4, 5, 6],
  [7, 8, 9, 10],
];

const NICKNAME_KEY = "gplay_nickname";
const POLL_MS = 2000;

function getUserId() {
  const key = "gplay_user_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function isSeatTaken(seat) {
  return Boolean(seat?.user_id);
}

function seatInitial(seat) {
  const name = seat?.nickname?.trim();
  return name ? name.charAt(0).toUpperCase() : "?";
}

export default function App() {
  const userId = useRef(getUserId()).current;
  const joinedAtRef = useRef(null);

  const [joinInput, setJoinInput] = useState("");
  const [nickname, setNickname] = useState(null);
  const [room, setRoom] = useState(null);
  const [seats, setSeats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);
  const [autoJoining, setAutoJoining] = useState(true);
  const chatEndRef = useRef(null);

  const mySeat = seats.find((s) => s.user_id === userId)?.seat_number ?? null;
  const seatMap = Object.fromEntries(seats.map((s) => [s.seat_number, s]));

  const loadRoom = useCallback(async () => {
    if (!supabase) throw new Error("Supabase is not configured");
    const { data, error: roomError } = await supabase.from("rooms").select("*").limit(1);
    if (roomError) throw roomError;
    if (!data?.length) throw new Error("No room found in the rooms table");
    return data[0];
  }, []);

  const loadSeats = useCallback(async (roomId) => {
    if (!supabase) return;
    const { data, error: seatError } = await supabase
      .from("seats")
      .select("*")
      .eq("room_id", roomId)
      .order("seat_number");
    if (seatError) throw seatError;
    setSeats(data ?? []);
  }, []);

  const loadMessages = useCallback(async (roomId) => {
    if (!supabase) return;
    let query = supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (joinedAtRef.current) {
      query = query.gte("created_at", joinedAtRef.current);
    }

    const { data, error: msgError } = await query.limit(200);
    if (msgError) throw msgError;
    setMessages(data ?? []);
  }, []);

  const enterRoom = useCallback(
    async (name) => {
      const trimmed = name.trim();
      if (trimmed.length < 2) return;

      setLoading(true);
      setError(null);
      joinedAtRef.current = new Date().toISOString();

      try {
        const globalRoom = await loadRoom();
        setRoom(globalRoom);
        setNickname(trimmed);
        sessionStorage.setItem(NICKNAME_KEY, trimmed);
        await Promise.all([loadSeats(globalRoom.id), loadMessages(globalRoom.id)]);
      } catch (e) {
        setError(e.message ?? "Could not join room");
        setRoom(null);
        setNickname(null);
        sessionStorage.removeItem(NICKNAME_KEY);
      } finally {
        setLoading(false);
        setAutoJoining(false);
      }
    },
    [loadRoom, loadSeats, loadMessages],
  );

  // Auto-rejoin last nickname on refresh
  useEffect(() => {
    if (!isConfigured || !supabase) {
      setAutoJoining(false);
      return;
    }
    const saved = sessionStorage.getItem(NICKNAME_KEY);
    if (saved?.trim().length >= 2) {
      enterRoom(saved);
    } else {
      setAutoJoining(false);
    }
  }, [enterRoom]);

  // Realtime + polling fallback
  useEffect(() => {
    if (!nickname || !room || !supabase) return;

    let active = true;
    let pollTimer = null;
    let seatsOk = false;
    let messagesOk = false;

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        if (active) {
          loadSeats(room.id);
          loadMessages(room.id);
        }
      }, POLL_MS);
    };

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const checkLive = () => {
      const ok = seatsOk && messagesOk;
      setLive(ok);
      if (ok) stopPolling();
      else startPolling();
    };

    const seatsChannel = supabase
      .channel(`seats-${room.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seats", filter: `room_id=eq.${room.id}` },
        () => loadSeats(room.id),
      )
      .subscribe((status) => {
        if (!active) return;
        seatsOk = status === "SUBSCRIBED";
        checkLive();
      });

    const messagesChannel = supabase
      .channel(`messages-${room.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `room_id=eq.${room.id}` },
        () => loadMessages(room.id),
      )
      .subscribe((status) => {
        if (!active) return;
        messagesOk = status === "SUBSCRIBED";
        checkLive();
      });

    // Poll until realtime connects
    startPolling();
    const bootPoll = setTimeout(() => {
      if (active && seatsOk && messagesOk) stopPolling();
    }, 500);

    return () => {
      active = false;
      stopPolling();
      clearTimeout(bootPoll);
      setLive(false);
      supabase.removeChannel(seatsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [nickname, room, loadSeats, loadMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function claimSeat(seatNumber) {
    if (!room || !supabase) return;
    setError(null);

    const target = seatMap[seatNumber];
    if (isSeatTaken(target) && target.user_id !== userId) {
      setError("Seat is already taken");
      return;
    }

    await supabase
      .from("seats")
      .update({ user_id: null, nickname: null })
      .eq("room_id", room.id)
      .eq("user_id", userId);

    const { error: updateError } = await supabase
      .from("seats")
      .update({ user_id: userId, nickname })
      .eq("room_id", room.id)
      .eq("seat_number", seatNumber);

    if (updateError) setError(updateError.message);
  }

  async function leaveSeat() {
    if (!room || !supabase) return;
    setError(null);

    const { error: updateError } = await supabase
      .from("seats")
      .update({ user_id: null, nickname: null })
      .eq("room_id", room.id)
      .eq("user_id", userId);

    if (updateError) setError(updateError.message);
  }

  function handleSeatClick(seatNumber) {
    const occupant = seatMap[seatNumber];
    if (occupant?.user_id === userId) {
      leaveSeat();
      return;
    }
    if (!isSeatTaken(occupant)) {
      claimSeat(seatNumber);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !room || !supabase) return;

    setError(null);
    setChatInput("");

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      room_id: room.id,
      user_id: userId,
      nickname,
      message: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({
        room_id: room.id,
        user_id: userId,
        nickname,
        message: text,
      })
      .select()
      .single();

    if (sendError) {
      setError(sendError.message);
      setChatInput(text);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return;
    }

    setMessages((prev) => {
      const without = prev.filter((m) => m.id !== tempId && m.id !== data.id);
      return [...without, data];
    });
  }

  function handleLeaveRoom() {
    if (room && supabase) {
      supabase
        .from("seats")
        .update({ user_id: null, nickname: null })
        .eq("room_id", room.id)
        .eq("user_id", userId);
    }
    sessionStorage.removeItem(NICKNAME_KEY);
    joinedAtRef.current = null;
    setRoom(null);
    setNickname(null);
    setJoinInput("");
    setSeats([]);
    setMessages([]);
    setChatInput("");
    setError(null);
    setLive(false);
  }

  if (autoJoining) {
    return (
      <div className="app">
        <div className="join-screen">
          <h1>G-play</h1>
          <p className="subtitle">Rejoining room…</p>
        </div>
      </div>
    );
  }

  if (!nickname || !room) {
    return (
      <div className="app">
        <div className="join-screen">
          <h1>G-play</h1>
          <p className="subtitle">Live voice room</p>

          {!isConfigured && (
            <p className="banner error">
              Add your Supabase anon key to <code>.env</code> as VITE_SUPABASE_KEY, then restart
              the dev server.
            </p>
          )}

          {error && <p className="banner error">{error}</p>}

          <input
            type="text"
            placeholder="Your nickname"
            maxLength={24}
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enterRoom(joinInput)}
            autoFocus
          />

          <button
            type="button"
            disabled={joinInput.trim().length < 2 || !isConfigured || loading}
            onClick={() => enterRoom(joinInput)}
          >
            {loading ? "Joining…" : "Join Global Room"}
          </button>

          <p className="hint">Open two browser windows with different nicknames to test.</p>
        </div>
      </div>
    );
  }

  const roomName = room.name ?? "Global Room";

  return (
    <div className="app">
      <header className="room-header">
        <div>
          <h1>{roomName}</h1>
          <p className="role">
            {mySeat ? `Seat ${mySeat} · seated` : "Audience · no seat"}
            <span className={`live-dot ${live ? "live-dot--on" : ""}`}>
              {live ? " · live" : " · syncing…"}
            </span>
          </p>
        </div>
        <button type="button" className="text-btn" onClick={handleLeaveRoom}>
          Leave
        </button>
      </header>

      {error && <p className="banner error">{error}</p>}
      {loading && <p className="banner">Loading…</p>}

      <section className="seats">
        {SEAT_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className={`seat-row ${row.length === 2 ? "seat-row--two" : ""}`}>
            {row.map((num) => {
              const seat = seatMap[num];
              const isMine = seat?.user_id === userId;
              const isEmpty = !isSeatTaken(seat);

              return (
                <button
                  key={num}
                  type="button"
                  className="seat"
                  disabled={!isEmpty && !isMine}
                  onClick={() => handleSeatClick(num)}
                >
                  <span
                    className={`seat-avatar ${isMine ? "seat-avatar--mine" : ""} ${isEmpty ? "seat-avatar--empty" : ""}`}
                  >
                    {isEmpty ? "+" : seatInitial(seat)}
                  </span>
                  <span className="seat-label">
                    {isEmpty ? `Seat ${num}` : seat.nickname || "Guest"}
                  </span>
                  {isMine && <span className="seat-hint">tap to leave</span>}
                </button>
              );
            })}
          </div>
        ))}
      </section>

      <p className="seat-help">Tap an empty seat to sit. Tap your seat to leave or pick another to move.</p>

      <section className="chat">
        <div className="chat-messages">
          {messages.length === 0 && (
            <p className="chat-empty">No messages this session. Say hello.</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="chat-message">
              <span className="chat-author">{msg.nickname || "Guest"}</span>
              <span className="chat-text">{msg.message}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form className="chat-form" onSubmit={sendMessage}>
          <input
            type="text"
            placeholder="Type a message…"
            maxLength={300}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button type="submit" disabled={!chatInput.trim()}>
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
