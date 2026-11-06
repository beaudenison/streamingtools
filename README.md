# Streaming Tools

**[streamingtools.xyz](https://www.streamingtools.xyz)** — free tools for people who stream.
Twitch and Kick chat and alerts for OBS or Streamlabs, and vertical clips for YouTube Shorts, TikTok, and Reels.

## Tools

| Tool | What it does | Where |
|---|---|---|
| **Chat Overlay** | Twitch and Kick chat in an OBS / Streamlabs browser source. Style messages, badges and filters, show one platform or both. No account needed; sign in to keep the overlay link the same when you change the look. | [`/chat`](https://www.streamingtools.xyz/chat) |
| **Alerts** | Follow, sub, resub, gifted sub, raid, cheer and KICKs alerts for Twitch and Kick in one browser source. Sign in with Twitch, Kick, or both. | [`/alerts`](https://www.streamingtools.xyz/alerts) |
| **Portrait Clip** | Windows app that turns a landscape OBS / Streamlabs recording into a vertical short — facecam on top, gameplay below. No account, no watermark, renders locally. | [`/portrait-clip`](https://www.streamingtools.xyz/portrait-clip) · source: [beaudenison/portrait-clip](https://github.com/beaudenison/portrait-clip) |

## Stack

- [Next.js](https://nextjs.org) 15 (App Router) + React 19 + TypeScript
- Postgres via [`postgres`](https://github.com/porsager/postgres) — schema in [`db/schema.sql`](db/schema.sql), applied automatically on first connection
- Twitch EventSub and Kick webhooks for alerts; public chat read directly for the overlay
- OAuth tokens encrypted at rest (AES-256-GCM, [`lib/secret.ts`](lib/secret.ts))
- Hosted on Vercel, with a daily cron (`/api/cron/refresh`) that refreshes platform tokens

## Project layout

```
app/(site)/        public pages: home, chat, alerts, portrait-clip, account, privacy
app/chat/overlay   the chat browser source OBS loads
app/alerts/overlay the alerts browser source OBS loads
app/api/           auth (Twitch, Kick), webhooks, overlay config, account, cron
components/        UI (customizers, feeds, header/footer)
lib/               chat parsing, alert mapping, auth, db, SEO, tool definitions (lib/tools.ts)
db/schema.sql      database tables
```

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
```

The chat overlay works without any env vars. Sign-in and alerts need a database and Twitch / Kick app credentials:

| Variable | Used for |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `TOKEN_KEY` | Encrypts stored OAuth tokens (16+ random characters) |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | Twitch sign-in and EventSub |
| `KICK_CLIENT_ID` / `KICK_CLIENT_SECRET` | Kick sign-in and webhooks |
| `CRON_SECRET` | Protects `/api/cron/refresh` in production |

OAuth redirect URLs are `<origin>/api/auth/twitch/callback` and `<origin>/api/auth/kick/callback`.

## Deploying

Pushing to `main` deploys to production on Vercel. Set the variables above in the Vercel project settings.

---

Made by [Beau Denison](https://x.com/beaudenison).
