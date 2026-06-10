# G-play

Mobile-first social voice-room app built with React, Supabase, and LiveKit.

The app currently includes Google auth, user profiles, custom 10-seat rooms, realtime room chat, presence, wallets, gifts, daily tasks, room follows, admin tools, private friend chat, and LiveKit voice.

## Stack

- React 18 + Vite
- Supabase Auth, Postgres, RLS, Realtime, and Edge Functions
- LiveKit for voice rooms and direct voice calls

## Setup

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Fill in `.env`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-supabase-anon-or-publishable-key
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
VITE_SUPER_ADMIN_EMAIL=your@gmail.com
```

3. In Supabase SQL Editor, run:

```text
supabase/schema.sql
supabase/rls-policies.sql
supabase/RUN-THIS.sql
```

`RUN-THIS.sql` includes bonds, guard, Church wedding schedules, partner seat settings, and all RPCs. Re-run it after pulling updates.

4. Deploy the LiveKit token function from `supabase/functions/livekit-token`.

Set these function secrets in Supabase:

```text
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
```

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Build

```bash
npm run build
```

The current production build succeeds, but Vite warns that the main bundle is large. The next cleanup target should be code-splitting the lobby, room, gift, and profile/chat surfaces.

## Notes

- `.env` is local-only and should not be committed.
- Realtime for app tables is configured inside `supabase/RUN-THIS.sql` (safe to re-run).
- Some early SQL policies are permissive for MVP speed. Before production, tighten wallet, room admin, blacklist, seat, and message mutations behind RLS checks or trusted RPC/Edge Function calls.
