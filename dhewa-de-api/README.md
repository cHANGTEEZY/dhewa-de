# Dhewa API

HTTP API for Dhewa. Hono on Bun, Postgres through Drizzle, and Better Auth for email and password sign-in.

The web app lives in `dhewa-de-ui` and is not wired to this API yet.

## Requirements

- [Bun](https://bun.sh) 1.3 or newer
- Postgres 14 or newer

## Run

```bash
bun install
cp .env.example .env.local
```

Edit `.env.local`:

- `DATABASE_URL` for a database you can migrate
- `BETTER_AUTH_SECRET` from `openssl rand -base64 32` (at least 32 characters)
- `PORT=3001` and `BETTER_AUTH_URL=http://localhost:3001`, so this process does not bind the same port as the web app
- `FRONTEND_ORIGIN` and `CORS_ORIGIN` set to `http://localhost:3000`

`ARCJET_KEY` is required by the env schema. In development Arcjet fails open when the key is not a real site key.

```bash
bun run db:migrate
bun run dev
```

The server listens on the `PORT` in `.env.local`.

| Path | What it is |
| --- | --- |
| `GET /health` | Health check |
| `GET /api/v1/users/me` | Signed-in user |
| `/api/auth/*` | Better Auth (sign-up, sign-in, session) |
| `GET /docs` | API reference |

### Sign-up and sign-in

```bash
curl -X POST http://localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Sita","email":"sita@example.com","password":"password123"}'

curl -X POST http://localhost:3001/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"sita@example.com","password":"password123"}'
```

Session checks use the cookie from those responses. Routes that need a user call `requireAuth()` from `src/middleware/require-auth.ts`.

Auth config is `src/modules/auth/auth.service.ts`. After changing it:

```bash
bun run auth:generate
bun run db:generate
bun run db:migrate
```

## Environment

Validated in `src/config/env.ts`. Bun reads `.env.local`.

| Variable | Required | Notes |
| --- | --- | --- |
| `PORT` | No | Defaults to `3000`. Use `3001` next to the web app. |
| `HOST` | No | Defaults to `0.0.0.0` |
| `NODE_ENV` | No | `development`, `production`, or `test` |
| `LOG_LEVEL` | No | Pino level, default `info` |
| `CORS_ORIGIN` | No | Allowed browser origin, or `*` |
| `FRONTEND_ORIGIN` | Yes | Origin Better Auth trusts for callbacks |
| `DATABASE_URL` | Yes | Postgres connection string |
| `DATABASE_URL_UNPOOLED` | No | Direct URL for hosted Postgres migrations |
| `BETTER_AUTH_URL` | No | Public base URL of this API. Match `PORT`. |
| `BETTER_AUTH_SECRET` | Yes | At least 32 characters |
| `ARCJET_KEY` | Yes | Site key from Arcjet. Placeholder is fine locally. |
| `ARCJET_ENV` | No | `development` or `production` |

## Database

Schemas are in `src/db/schema/`. Drizzle Kit uses `src/db/schema/index.ts`.

| Script | What it does |
| --- | --- |
| `bun run auth:generate` | Regenerate the Better Auth tables |
| `bun run db:generate` | Write a SQL migration |
| `bun run db:migrate` | Apply migrations |
| `bun run db:push` | Push the schema without a migration (local only) |
| `bun run db:studio` | Drizzle Studio |

Money, once it exists, is stored as integer paisa. That rule is in `project.md`. This API does not move money yet.

## Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Dev server with reload |
| `bun run serve` | Server without reload |
| `bun run build` | Production bundle |
| `bun run start` | Run the bundle |
| `bun run test` | Tests |
| `bun run typecheck` | Typecheck |

## Docker

```bash
docker build -t dhewa-api .
docker run -p 3001:3001 --env-file .env.local dhewa-api
```

The image runs as the `bun` user and checks `/health`.

## Layout

```
src/app.ts            Hono app and middleware
src/server.ts         Bun entry
src/config/env.ts     Env validation
src/db/               Drizzle client and schema
src/modules/auth/     Better Auth
src/modules/users/    Current user
src/modules/health/   Health check
drizzle/              SQL migrations
```

## License

MIT. See [LICENSE](LICENSE).
