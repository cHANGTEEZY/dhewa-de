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

The web app listens on port 3000. The API's example env also uses 3000, so run the API on 3001.

API, from `dhewa-de-api`:

```bash
bun install
cp .env.example .env.local
```

In `.env.local`, set `PORT=3001`, point `BETTER_AUTH_URL` at `http://localhost:3001`, and set `FRONTEND_ORIGIN` and `CORS_ORIGIN` to `http://localhost:3000`. Then:

```bash
bun run db:migrate
bun run dev
```

Web, from `dhewa-de-ui`:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Each app has its own README: [dhewa-de-ui/README.md](dhewa-de-ui/README.md) and [dhewa-de-api/README.md](dhewa-de-api/README.md).

## Where things stand

The API signs people up and in with email and a password. The web app still keeps a local placeholder session and does not call the API yet. Donations, the wallet, overlays, and payouts are not built. `project.md` is the spec for that work.
