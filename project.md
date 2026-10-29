# Project: Nepali Streamer Donation Platform

> Context file for AI coding assistants. Read fully before writing code.

## 1. Overview & Goal
A Streamlabs/StreamElements-style platform for Nepali streamers. Viewers donate in NPR via Khalti/eSewa; donations credit the streamer's in-app wallet; on-stream OBS overlays show donation alerts (with sound + Nepali TTS) and a unified multi-platform chat. Streamers request payouts; an admin approves and sends money manually, minus platform fees.

- **Status of project:** personal, unreleased learning project. **Sandbox/test payment keys only.**
- Owner: Sushank Gurung (GitHub `cHANGTEEZY`), React/React Native dev.
- Legal note: holding funds + payouts is likely a licensed PSP activity in Nepal (Payment and Settlement Act 2075, NRB). Only relevant if ever released publicly — do not add production payment flows without being asked.

## 2. Core Features
- **Platform connections** (OAuth): YouTube, Twitch, Kick first; Facebook later; TikTok optional (unofficial).
- **OBS overlays** (browser sources, per-streamer secret URLs):
  - Alerts overlay: animation + sound + TTS, queued one at a time.
  - Chat overlay: normalized messages from all connected platforms.
  - Goal / leaderboard widgets (later).
- **Donation page** `/:handle` + **QR code** linking to it. Donor enters name, amount, message, picks gateway.
- **Wallet**: verified donation credits streamer balance (net of fee).
- **Payouts**: streamer requests → balance held → admin approves → admin transfers manually → marks paid (or reverses on failure).
- **Fees**: platform cut per donation (basis points, per-streamer override possible) + flat payout fee.
- **Alert customization**: message templates (`{name} donated Rs {amount}: {message}`), amount tiers, custom sounds/GIFs, layout, duration, TTS on/off + min amount.
- **TTS voices**: Azure `ne-NP-HemkalaNeural` (F), `ne-NP-SagarNeural` (M); custom voice via ElevenLabs voice cloning **only of the streamer's own voice with recorded consent**.
- **Moderation**: profanity filter (Nepali + Romanized Nepali + English), strip links/phone numbers, length cap, streamer blocklist, optional manual approval queue.
- **Test alert** button in dashboard; skip/replay/pause controls.

## 3. Tech Stack
| Concern | Choice |
|---|---|
| Frontend | TanStack Start (React, TS), TanStack Query/Form, Tailwind + shadcn/ui |
| Backend | Hono (TS) on Node 22 (`@hono/node-server`), `@hono/zod-validator`, `hono/client` RPC types |
| Realtime | Hono WebSocket helper (`@hono/node-ws`) + Redis pub/sub |
| DB | Postgres + Drizzle ORM / drizzle-kit |
| Queue | Redis + BullMQ (worker process) |
| Auth | Better Auth (email + Google/Twitch OAuth login, Drizzle adapter) |
| Validation | Zod (shared schemas) |
| Storage | Cloudflare R2 via S3 API (`@aws-sdk/client-s3`, presigned uploads) |
| Overlay | Motion (framer-motion), Howler.js, optional Lottie |
| QR | `qrcode` / `qrcode.react` |
| Monitoring | Sentry, pino, Bull Board |
| Tooling | pnpm workspaces + Turborepo, Docker Compose (postgres, redis, minio) |

## 4. Monorepo Layout
```
apps/
  web/       TanStack Start: /dashboard/*, /:handle, /overlay/{alerts,chat,goal}/$token, /admin/*
  api/       Hono: REST routes, payment return/webhooks, auth, /ws endpoint
  worker/    BullMQ consumers: alerts+TTS, chat ingesters, token refresh, payment reconcile
packages/
  db/        Drizzle schema, migrations, ledger helpers (postTransaction)
  shared/    Zod schemas, event types (AlertEvent, ChatMessage), fee calc
  payments/  khalti.ts, esewa.ts behind one PaymentProvider interface
infra/       docker-compose, env templates
```

## 5. Domain Glossary
- **Streamer**: user who receives donations; has handle, wallet, overlays, connections.
- **Viewer / Donor**: anonymous person paying via donate page; no account required.
- **Donation**: donor intent (name, message, amount); becomes `paid` only after server-side verification.
- **Payment**: gateway attempt for a donation (provider, transaction_uuid, provider_ref).
- **Ledger entry**: immutable signed paisa amount on one ledger account; entries of a ledger transaction sum to 0.
- **Payout request**: streamer's withdrawal request; lifecycle requested → approved → paid | rejected | failed.
- **Payout method**: verified destination (eSewa ID, Khalti ID, bank account).
- **Overlay token**: secret random token in an overlay URL, scoped to one streamer + widget; stored hashed; rotatable.
- **Widget**: an overlay type (alerts, chat, goal, leaderboard) with JSON config.

## 6. Data Model (key columns)
- `users`: id, email, name, role (streamer|admin)
- `streamers`: id, user_id, handle (unique), display_name, fee_bps, min_donation_paisa, status
- `platform_connections`: id, streamer_id, platform, external_channel_id, access_token_enc, refresh_token_enc, expires_at, scopes, status (active|needs_reauth)
- `overlay_tokens`: id, streamer_id, widget, token_hash, created_at, revoked_at
- `donations`: id, streamer_id, donor_name, message, message_clean, amount_paisa, status (pending|paid|failed|refunded), alert_status
- `payments`: id, donation_id, provider, transaction_uuid (unique), provider_ref (unique), amount_paisa, provider_fee_paisa, status, raw_verify jsonb, verified_at
- `ledger_accounts`: id, type (streamer_wallet|payouts_pending|platform_fee|gateway_clearing|gateway_fee|cash), streamer_id nullable
- `ledger_transactions`: id, kind (donation|payout_hold|payout_paid|payout_reverse|adjustment), ref_id, idempotency_key (unique)
- `ledger_entries`: id, transaction_id, account_id, amount_paisa (+debit / −credit)
- `payout_methods`: id, streamer_id, type (esewa|khalti|bank), account_name, account_number/esewa_id, bank_code, verified
- `payout_requests`: id, streamer_id, method_id, amount_paisa, fee_paisa, status, reference, reviewed_by
- `alert_configs`: id, streamer_id, tier_min_paisa, template, layout jsonb, sound_asset_id, tts_enabled, voice_profile_id, duration_ms
- `sound_assets`: id, streamer_id, r2_key, mime, duration_ms, size
- `voice_profiles`: id, streamer_id, provider (azure|elevenlabs), voice_id, consent_r2_key

**Fee example (illustrative only):** Rs 1,000 donation, 7% fee → gateway_clearing +100000, streamer_wallet −93000, platform_fee −7000 (paisa). Payout Rs 900 with Rs 25 fee → wallet debited 92500, 90000 sent, 2500 to platform_fee.

## 7. Key Flows
### Donation
1. Viewer opens `/:handle` (link or QR), fills form (Zod-validated, message moderated).
2. `POST /donations` creates donation (pending) + payment with unique `transaction_uuid`; calls Khalti initiate or builds signed eSewa form.
3. Viewer pays at gateway.
4. Gateway redirects to return/success URL — treat params as hints only.
5. Server verifies: Khalti `lookup` (status `Completed`, amount matches, pidx belongs to this payment) or eSewa status API (`COMPLETE`) + signature check.
6. One DB transaction: lock payment row; if already settled → return (idempotent); insert balanced ledger entries; donation → paid.
7. Enqueue alert job → worker moderates, generates TTS (cache by hash(text, voice) in R2), publishes `alert:{streamerId}`.
8. Overlay plays animation → sound → TTS → acks.
9. Reconcile job re-checks pending/ambiguous payments.

### Payout
1. Streamer picks verified payout method + amount ≥ minimum; `POST /payouts`.
2. Transaction: `SELECT … FOR UPDATE` wallet; check available ≥ amount + fee; post wallet → payouts_pending (hold).
3. Admin reviews; reject → reversing entries.
4. Admin transfers manually (no public Khalti/eSewa payout API), enters reference.
5. Mark paid → payouts_pending → cash, fee → platform_fee. Failure → reverse to wallet.
6. Notify streamer.

### Overlay connection
1. OBS browser source loads `/overlay/alerts/:token` (1920×1080, transparent background).
2. Page fetches `GET /overlay/:token/config`, opens `wss://…/ws?token=…`.
3. Server hashes token, resolves streamer + widget, joins room `streamer:{id}:{widget}`.
4. Heartbeat every 20s; reconnect with exponential backoff (1s→30s, jitter); send `lastAckedEventId` to replay unacked alerts from Redis.
5. Client FIFO queue plays one alert at a time and acks.
6. Optional: dashboard connects to local obs-websocket v5 (localhost:4455) from the streamer's browser for scene triggers — never via our server. Same URLs work in Streamlabs Desktop.

### Chat ingestion
1. Streamer connects platform via OAuth (state + PKCE); tokens stored AES-GCM encrypted.
2. Worker refreshes tokens before expiry; failure → `needs_reauth`.
3. Go-live detected (manual toggle, YouTube liveBroadcasts.list, Twitch `stream.online`, Kick webhook).
4. Start one ingester per streamer per platform (Redis lock prevents duplicates); stop on offline.
5. Normalize to `ChatMessage { id, platform, streamerId, author { name, avatar, badges }, text, emotes[], paid?, ts }`.
6. Moderate → Redis publish `chat:{streamerId}` → WS → chat overlay.

## 8. Third-Party APIs
| API | Use | Auth | Docs |
|---|---|---|---|
| Khalti ePayment | initiate (pidx) + lookup verify; amounts in paisa; sandbox dev.khalti.com | `Authorization: Key <secret>` | https://docs.khalti.com/ |
| eSewa ePay v2 | HMAC-SHA256 signed form (total_amount,transaction_uuid,product_code); status check; sandbox product `EPAYTEST` | HMAC secret | http://developer.esewa.com.np/pages/Epay-V2 |
| Payouts | **No public merchant payout API found** → manual admin transfer | — | — |
| YouTube Live | `liveChatMessages.streamList` (server streaming). **Quota: 5 units/call, 10,000/day default.** Never poll `list`. | OAuth 2.0 | https://developers.google.com/youtube/v3/live/docs/liveChatMessages/streamList , https://developers.google.com/youtube/data/determine_quota_cost |
| Twitch | EventSub WebSocket (`channel.chat.message`, follow, subscribe, cheer, raid) | OAuth user token | https://dev.twitch.tv/docs/eventsub/ |
| Kick | Public API + webhooks (chat, follows, subs) | OAuth 2.1 + PKCE | https://docs.kick.com/ |
| Facebook Live | Graph API live comments (needs App Review) | Page token | https://developers.facebook.com/docs/live-video-api/ |
| TikTok Live | Unofficial `tiktok-live-connector`; fragile, ToS risk; isolate in own worker | — | https://github.com/zerodytrash/TikTok-Live-Connector |
| Azure Speech | TTS ne-NP voices via REST/SSML | key + region | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support |
| ElevenLabs | Custom voice cloning (consent required) | `xi-api-key` | https://elevenlabs.io/docs |

## 9. Invariants & Rules (MUST follow)
- Money is **integer paisa** (`bigint`/integer). Never floats; never NPR decimals in storage.
- **Double-entry ledger**: every money movement is a `ledger_transaction` whose entries sum to 0. Entries are immutable; fix with reversing transactions.
- **Never mutate balances directly.** Balance = SUM(entries) (a cached column may be updated only inside the same transaction).
- **Idempotency**: unique `transaction_uuid`, `provider_ref`, `idempotency_key`; handlers must be safe to call repeatedly.
- **Always verify payments server-side** with the gateway; never trust redirect/query params; check amount and ownership.
- Alerts fire only after verification.
- **Overlay tokens are secrets**: random ≥32 bytes, store hashed, never log, rotatable.
- **No secrets in code**: use env vars (validated with Zod at startup); `.env` git-ignored.
- **Validate all input with Zod** (API bodies, params, webhook payloads, env).
- Platform OAuth tokens encrypted at rest.
- Use row locks (`FOR UPDATE`) for wallet holds/payouts.
- Moderate donor text before display and TTS.
- Voice cloning only for the streamer's own voice with stored consent.

## 10. Coding Conventions
- TypeScript `strict: true` everywhere; no `any`.
- ESM, pnpm, Turborepo; shared types/schemas live in `packages/shared`.
- Hono routes grouped by domain; export `AppType` for `hono/client`.
- Drizzle schema in `packages/db`; migrations via drizzle-kit, never hand-edit applied migrations.
- Gateways behind a `PaymentProvider` interface (`initiate`, `verify`).
- Small pure functions for fee calc and ledger posting, with unit tests (Vitest).
- Structured logs with pino; no PII/secrets in logs.
- Prefer explicit error types; return typed JSON errors from the API.

## 11. Current Status & Build Order
**Status: planning only — nothing built yet.**
1. Week 1: monorepo, Docker Postgres/Redis, Drizzle schema, Better Auth, streamer profile.
2. Week 2: Khalti sandbox + eSewa EPAYTEST, donate page + QR.
3. Week 3: ledger, idempotency, wallet view, reconcile job (tests).
4. Week 4: WS service, alerts overlay, sounds, test alert, token rotation.
5. Week 5: Azure TTS + moderation, alert config editor.
6. Week 6: payout methods, requests/holds, admin panel.
7. Weeks 7–8: Twitch EventSub → YouTube streamList → Kick, chat overlay.
8. Later: Facebook, TikTok (isolated), ElevenLabs custom voice, obs-websocket triggers, goals/leaderboard, React Native app.

## 12. Out of Scope / Non-Goals
- Public release, production payment keys, NRB licensing/compliance work.
- Automated payouts (no API available); card/international payments.
- Fonepay/ConnectIPS (optional later only).
- Hosting video/streams; replacing OBS.
- Cloning any voice other than the consenting streamer's own.
- Subscriptions/memberships, merch, mobile app (until "Later").
