# Dhewa web

TanStack Start app for Dhewa. It will host the streamer dashboard, the public donate page, and the OBS overlays. Right now it is the app shell: routing, the signed-in layout, and the auth screens.

Sign-in on these screens is still a local placeholder. The API in `dhewa-de-api` is what will own the real session.

## Requirements

- Node 22
- npm

## Run

```bash
npm install
npm run dev
```

The dev server is http://localhost:3000.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint |
| `npm run to:avif` | Convert an image to AVIF |
| `npm run extract:avif` | Poster frame from each `.webm` under `public/` |
| `npm run frame:rive` | Still frame from a `.riv` file |

## Layout

```
src/routes/       file routes, plus robots.txt, sitemap.xml, and llms.txt
src/features/     screens, grouped by area (auth, home, users, settings)
src/components/   shared UI
src/api/          client helpers
src/lib/          seo, the HTTP client, and other shared helpers
src/router.tsx    TanStack Router setup
```

Page titles and the sitemap come from `src/lib/seo.ts`. Set `VITE_SITE_URL` when the public URL is not the default.

## API

The API is a separate app. See [../dhewa-de-api/README.md](../dhewa-de-api/README.md). Run it on port 3001 so it does not take 3000 from this dev server.
