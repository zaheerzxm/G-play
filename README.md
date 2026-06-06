# G-play MVP

Mobile-first live room with **10 seats** and **realtime chat**, powered by Supabase.

## Setup

1. Copy env file and add your Supabase anon key:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://tcdnjjkqytrjwhcxbglj.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

2. Ensure your Supabase tables match `supabase/schema.sql` (`global-room` with 10 pre-seeded seats).

3. Enable **Realtime** for `seats` and `messages` in Supabase → Database → Replication.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in two browser windows. Use different nicknames, sit on seats, and send chat messages.

## Test

1. Window A: enter "Alice" → Join Global Room → tap Seat 1
2. Window B: enter "Bob" → Join Global Room → tap Seat 2
3. Both see seat updates instantly
4. Chat messages sync live in both windows
