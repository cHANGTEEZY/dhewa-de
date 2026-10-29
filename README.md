# Dhewa

Dhewa is a donation platform for Nepali streamers. This repo holds the web app and the API.

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

Each app has its own README: [dhewa-de-ui/README.md](dhewa-de-ui/README.md) and [dhewa-de-api/README.MD](dhewa-de-api/README.MD).
