# Dhewa

Dhewa is a donation platform for Nepali streamers. A viewer opens a streamer's page, pays in NPR with Khalti or eSewa, and the verified amount is credited to that streamer's wallet. An OBS browser source plays the alert. Payouts are requested by the streamer and sent manually after an admin approves them.

This is a personal project and it is not released. Do not put production payment keys in it.

## Layout

```
dhewa-de-ui/    web app
dhewa-de-api/   HTTP API
project.md      product notes (domain, data model, build order)
```

The web app is a TanStack Start frontend. The API is Hono on Bun, with Postgres, Drizzle, and Better Auth.

## Run locally

The web app is http://localhost:3000. It proxies `/api` to the API, which listens on port 3001. `BETTER_AUTH_URL` stays `http://localhost:3000` so the session cookie and OAuth callbacks use the browser origin.

API, from `dhewa-de-api`:

```bash
bun install
cp .env.example .env.local
bun run db:migrate
bun run dev
```

Web, from `dhewa-de-ui`:

```bash
npm install
npm run dev
```

Sign-in is email and password. Google and Twitch work after you set both the client id and the secret for that provider. Callback URLs:

- `http://localhost:3000/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/twitch`

Each app has its own README: [dhewa-de-ui/README.md](dhewa-de-ui/README.md) and [dhewa-de-api/README.md](dhewa-de-api/README.md).

## Where things stand

Sign-in, the session, and the settings profile (name, username, email verification) go through the API. Donations, the wallet, overlays, and payouts are not built. `project.md` is the spec for that work.
