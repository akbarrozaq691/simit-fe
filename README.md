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

If 5173 is already taken Vite moves to the next free port and prints the one
it chose. Check that line rather than assuming 5173 — a stale dev server from
an earlier session will otherwise serve you an old bundle.

Other scripts:

```bash
npm run typecheck   # tsc -b, no emit
npm run build        # typecheck + production build to dist/
npm run lint          # oxlint
```

## Running it as a container

```bash
# The backend publishes on loopback by default, which a container cannot
# reach through host-gateway on Linux. Start the backend with:
#   APP_BIND=0.0.0.0 docker-compose up -d      (in ../be)
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

## Production (nginx on the host)

The container above bundles nginx, so it is one or the other — not both. To
run nginx yourself, `deploy/nginx/` holds the config and its install steps in
the file header:

```bash
npm run build
sudo mkdir -p /var/www/simit && sudo cp -r dist/* /var/www/simit/
sudo cp deploy/nginx/simit-headers.conf /etc/nginx/snippets/
sudo cp deploy/nginx/simit.conf /etc/nginx/sites-available/simit
sudo ln -s /etc/nginx/sites-available/simit /etc/nginx/sites-enabled/simit
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d simit.example.com
```

Replace `simit.example.com` and `/var/www/simit` to match the deployment.
This path wants the backend on its default loopback binding — nothing but the
proxy on the same machine needs to reach it.

Redeploying is `npm run build` plus copying `dist/` again; nginx needs no
reload, because `index.html` is served with `no-store` while the hashed assets
under `/assets/` are cached permanently.

## Branding

The logo is currently a placeholder inline SVG in
`src/components/Logo.tsx` — swap that one file for the real SIMIT asset when
it's available. Brand colors (`brand` orange, `plum`) and neutral (`ink`)
tokens are declared in `src/index.css` under Tailwind's `@theme`.
