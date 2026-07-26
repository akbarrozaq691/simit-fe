# SIMIT Frontend

Vite + React 19 + TypeScript SPA for **SIMIT — 4th International Student
Symposium in Türkiye**, organised by Pusat Studi PPI Türkiye.

## Development

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`. `/v1/api` requests are
proxied to the backend at `http://localhost:8888` (see `vite.config.ts`), so
the backend must be running on port 8888 — same-origin in dev means no CORS
configuration is needed on either side.

Other scripts:

```bash
npm run typecheck   # tsc -b, no emit
npm run build        # typecheck + production build to dist/
npm run lint          # oxlint
```

## Production (Docker)

```bash
docker-compose up -d --build
```

Serves the built SPA on `http://localhost:3000` via nginx. `/v1/api/`
requests are reverse-proxied to the backend, same-origin, so the backend
still needs no CORS setup.

By default the backend is reached at `host.docker.internal:8888` (the
backend runs from its own compose project in `../be`). Override with the
`API_UPSTREAM` environment variable if the backend lives elsewhere, e.g.:

```bash
API_UPSTREAM=192.168.1.10:8888 docker-compose up -d --build
```

The exposed port can also be overridden with `FE_PORT` (default `3000`).

> Note: `host-gateway` (used for `host.docker.internal` in
> `docker-compose.yml`) is supported on Docker Desktop (Mac/Windows) and on
> Linux with Docker Engine ≥ 20.10. If it doesn't resolve on your Linux
> setup, point `API_UPSTREAM` at the host's actual LAN/bridge IP instead.

## Branding

The logo is currently a placeholder inline SVG in
`src/components/Logo.tsx` — swap that one file for the real SIMIT asset when
it's available. Brand colors (`brand` orange, `plum`) and neutral (`ink`)
tokens are declared in `src/index.css` under Tailwind's `@theme`.
