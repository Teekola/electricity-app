# Running this project

## Requirements

- Docker, for the seeded PostgreSQL database
- Node 24 — the exact version is in `.nvmrc`, so `nvm use` picks it up
- pnpm

`make help` lists every target mentioned below. If `make` is not available, each target's body in
the `Makefile` is one or two plain `docker compose` or `pnpm` commands you can run directly.

## First run

```
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
make dev
```

Both `.env` copies are required and nothing creates them for you: `apps/api/src/config.ts` needs
`DATABASE_URL` and `apps/web/lib/env.ts` needs `NEXT_PUBLIC_API_BASE_URL`, neither with a fallback.

`make dev` starts the database and then every dev server on the host:

|          |                       |
| -------- | --------------------- |
| Frontend | http://localhost:3000 |
| API      | http://localhost:3001 |
| Adminer  | http://localhost:8088 |

Log into Adminer as `academy` / `academy`, database `electricity`.

## Tests

```
make db-up
pnpm test
```

The integration tests read the seeded database rather than mocking it, so the container has to be
up first. Nothing in this app writes to the database, so the tests cannot pollute it.

`make check` runs the whole set CI runs — lint, typecheck, tests and both builds — and starts the
database and the API itself, because the web build prerenders Day Details against it. Formatting is
not in it: `lint-staged` already applies Prettier on commit.

## End-to-end tests

The suite drives a real browser, which needs one install per machine:

```
make e2e-setup
make e2e
```

`make e2e-setup` downloads the Chromium build Playwright drives. On Linux it also installs that
browser's system libraries, which needs root, so it asks for your sudo password. On macOS and
Windows there are no such libraries and it only downloads the browser.

`make e2e` starts the database and the API, builds both apps, and runs the suite against those production
builds on ports 3100 and 3101 — deliberately not 3000 and 3001, so a suite run cannot attach
itself to a dev server you happen to have open. The report lands in
`packages/e2e/playwright-report/`.

## The containerised API

```
make up
```

Builds and runs the shipped API image alongside the database and Adminer. This is for verifying the
artifact that gets deployed, not for developing against — `make dev` is the edit loop.

## Resetting the database

```
make db-reset
```

Drops the volume and re-seeds from `db/init-db.tar.gz`. The dataset is fixed and historical, so
this is only needed if something has been changed by hand.
