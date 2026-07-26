# SIMIT Frontend Design

Date: 2026-07-27
Status: approved (design)

## Context

The backend (`../be`) is complete: a FastAPI paper-submission API for **SIMIT —
4th International Student Symposium in Türkiye**, organised by Pusat Studi PPI
Türkiye. It has no frontend. This spec covers a React SPA for all four roles.

Event facts (from the organisers' timeline assets and seeded data):

- Abstract submission: 26 Jul – 20 Aug 2026
- Abstract review: 21 – 30 Aug 2026
- Notification of acceptance: 31 Aug 2026
- Full paper deadline: 25 Sep 2026
- Peer review: 26 Sep – 14 Oct 2026
- Final revision: 22 Oct 2026
- Conference day: 15 Oct 2026
- Target presenters: 65 (max)
- Output journals: PIJAR, Jurnal Kimia Riset, Jurnal UPI

Timeline content is **fetched from `GET /timeline`**, not hardcoded — the API
already owns it and the EIC can edit it. The dates above are context for
whoever seeds that table, not literals in the UI.

## Decisions (settled with the user)

- **All four roles** in scope: public, author, SC (reviewer), EIC, admin.
- **UI language: English.**
- **TypeScript**, not plain JS — the API just went through breaking changes
  (`id_sc` → `reviewers`), and compile-time field checking is the cheapest
  guard against repeating that class of mistake.
- Brand colours `#E1723D` and `#922B67`.
- Placeholder logo (inline SVG, swappable for the real asset).
- Footer: `© Pusat Studi PPI Türkiye`.
- `docker-compose.yml` lives in `fe/`, separate from the backend's.

## Stack

| Concern | Choice | Why |
|---|---|---|
| Build | Vite | Current standard; CRA is deprecated |
| Framework | React 19 + TypeScript | As decided |
| Styling | Tailwind CSS v4 | Design tokens in CSS, no separate config file needed |
| Routing | React Router v7 (declarative) | Role-gated routes |
| Data | TanStack Query | Caching, invalidation after mutations, loading/error states without hand-rolling |
| Forms | react-hook-form + zod | Many forms (submit, review, assign, announce); zod schemas double as runtime response guards where useful |
| Container | multi-stage build → nginx | Static SPA + API proxy in one image |

### No CORS: same-origin via proxy

The backend has no CORS middleware. Rather than modify it, the frontend is
served same-origin with the API:

- **Dev**: Vite `server.proxy` forwards `/v1/api` → `http://localhost:8888`
- **Prod**: nginx in the frontend container proxies `/v1/api` → the backend

The browser therefore never makes a cross-origin request, so no backend change
is needed. Consequence to note: if the frontend is ever deployed on a
different host from the API, CORS becomes necessary after all.

The backend runs from its own compose project, so the frontend container
reaches it via a configurable upstream (default `host.docker.internal:8888`,
which Docker Desktop resolves on Windows and macOS). On Linux hosts this needs
either `--add-host=host.docker.internal:host-gateway` or a shared network —
documented in `fe/README.md`.

## Design System

Two brand colours drive everything:

- **`#E1723D`** (orange) — primary actions, focus rings, active nav
- **`#922B67`** (plum) — headings, brand surfaces, secondary accents

Each gets a light/dark step for hover, borders, and tinted backgrounds. Neutrals
are warm-tinted greys so they sit with the brand rather than fighting it.
Defined once as CSS custom properties in `src/index.css` under Tailwind v4's
`@theme`, so utilities like `bg-brand` and `text-plum` come for free.

**Status badges** map the nine article statuses to colours by pipeline meaning,
not arbitrarily:

| Status group | Treatment |
|---|---|
| `submitted` | neutral (waiting) |
| `assigned_to_sc`, `abstract_review_complete`, `full_paper_submitted`, `full_paper_review_complete` | amber (in progress) |
| `abstract_accepted` | plum (milestone reached) |
| `revision_needed` | orange (action needed from author) |
| `accepted` | green (success) |
| `rejected` | red (terminal) |

Authors see the coarser server-mapped values (`under_review` etc.), so the
badge component handles both vocabularies.

Shared components: `Button` (primary/secondary/ghost/danger), `Card`, `Badge`,
`Input`/`Textarea`/`Select`/`FileInput`, `Table`, `Modal`, `Spinner`,
`EmptyState`, `ErrorState`, `PageHeader`, `Pagination`.

Every list view has a real empty state and a real error state — not a blank
screen — because a new deployment starts empty and that first impression is the
one an organiser sees.

## Information Architecture

```
/                        Landing (public)
/login                   Login
/register                Register (author self-registration)

/dashboard               Author: my submissions
/submit                  Author: submit abstract
/articles/:id            Author: submission detail + stage actions

/review                  SC: assigned queue
/review/:id              SC: review form + own past reviews

/editorial               EIC: all articles, filterable
/editorial/:id           EIC: reviewers, all reviews, announce decision
/editorial/journals      EIC: journal CRUD
/editorial/timeline      EIC: timeline CRUD

/admin/users             Admin: users, archive/restore
/admin/topics            Admin: topics + subtopics
/admin/occupations       Admin: occupations
/admin/audit             Admin: audit log, filtered + paginated
/admin/archive           Admin: archived articles, restore
```

Role gating is a route wrapper reading the decoded JWT role. Admin can reach
every route (the API already permits it); other roles get redirected to their
own landing area rather than shown a bare 403 page.

## Auth

- JWT in `localStorage`, attached as `Authorization: Bearer` by the API client.
- On **401 from any request**, the client clears the token and redirects to
  `/login`. This matters more than usual here: the backend now revokes archived
  users mid-session, so a previously-valid token can start failing at any
  moment, and the UI must not sit in a broken half-authenticated state.
- The stored token carries `id_user` and `role`; user detail is fetched from
  `GET /users/{id}` when a profile view needs it.
- Registration requires an **existing** `occupation_name` (the backend rejects
  unknown ones with 400), so the register form uses a select populated from
  `GET /occupations` rather than a free-text field.

## Per-Role Screens

### Author

- **Dashboard** — cards/table of own submissions with status badge and the next
  action. Empty state links to `/submit`.
- **Submit Abstract** — title, authors, abstract text, keywords, topic select
  (`GET /topics`), and a PDF file input. Clean two-step flow: `POST /uploads`
  returns a `file_path`, then `POST /articles` creates the record with that
  real path. (A standalone `POST /uploads` was added to the backend for exactly
  this — the older `POST /articles/{id}/upload` needed an article to already
  exist, which forced a placeholder-then-patch dance.)
- **Detail** — status stepper reflecting the two-phase pipeline, version
  history (`GET /articles/{id}/versions`), and a contextual action:
  - `abstract_accepted` → submit full paper
  - `revision_needed` → submit revision
  - otherwise → read-only
  Authors cannot see reviewer notes (API returns 403 by design); the page says
  so explicitly instead of showing an empty section.

### SC (Reviewer)

- **Queue** — assigned articles; those awaiting this reviewer's input are
  surfaced first.
- **Review Detail** — article metadata, version list with download links, and a
  phase-appropriate form:
  - abstract phase → Accept / Reject + notes
  - full-paper phase → Accept / Request revision + notes
  Own previous reviews are listed (`GET /articles/{id}/reviews` returns only
  the caller's). A reviewer who already reviewed the current version sees the
  form disabled with an explanation, because the API rejects a second review
  with 409.

### EIC

- **Editorial Dashboard** — all articles with status filter and reviewer count.
- **Article Management** — assign reviewers (multi-select of SC users, with an
  explicit "override conflict of interest" checkbox), unassign, view **all**
  reviews with each reviewer's decision, and announce the outcome. The announce
  form is phase-aware and only enabled at `*_review_complete`; full-paper
  acceptance requires picking a journal. COI rejections (409) surface the
  server's message, which names the shared institution.
- **Journals / Timeline** — straightforward CRUD tables.

### Admin

- Everything above, plus **Users** (create with role, archive, restore,
  `include_deleted` toggle), **Topics** (topic + three subtopic kinds),
  **Occupations**, **Audit Log** (filters for entity/action/actor, paginated —
  the only server-paginated list), and **Archived Articles** (restore).

## Docker

`fe/Dockerfile` — multi-stage: `node:22-alpine` builds, `nginx:alpine` serves.
`fe/nginx.conf` — SPA fallback (`try_files ... /index.html`) plus the
`/v1/api` proxy.
`fe/docker-compose.yml` — one service, port `3000:80`, `API_UPSTREAM` env var
defaulting to `host.docker.internal:8888`.

## Testing

- **Type checking is the primary safety net** (`tsc --noEmit`) — the API
  response types are declared once and every screen consumes them.
- **Vitest unit tests** for logic worth pinning: the status→badge mapping
  (all nine statuses plus the author-facing vocabulary), role-based route
  access rules, and the phase-derivation helper that decides which form a
  screen shows.
- **Production build must succeed** (`npm run build`) — this catches what
  dev-mode HMR forgives.
- **Manual verification against the live backend** for the full flow, the same
  approach used for the backend features: register → submit → assign → review →
  announce → revision → accept, plus an admin pass over users/audit/archive.
- No component-render or e2e test harness in this first pass; adding
  Testing Library or Playwright is a separate effort.

## Open Questions / Known Awkwardness

1. **Authors cannot see reviewer feedback at all.** Deliberate (blind review),
   but for a `revision_needed` outcome an author has no in-app explanation of
   *what* to revise. Worth revisiting whether the EIC's announcement should
   carry a message field.
2. **Storage is unconfigured**, so uploads return 500 until real credentials
   are set. The UI surfaces that error honestly rather than pretending the
   upload worked.

## Out of Scope

- Email templates / notification preferences (backend sends plain emails).
- Password reset (no backend endpoint exists).
- Profile editing beyond what `PATCH /users/{id}` already allows.
- Internationalisation infrastructure (English only, as decided).
- Server-side rendering, PWA, offline support.
