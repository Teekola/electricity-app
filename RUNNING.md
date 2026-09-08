# Running this project

## Requirements

- Docker, running, with Compose v2 (`docker compose`), which hosts the seeded PostgreSQL database
- Node 24: the exact version is in `.nvmrc`, which nvm, fnm and mise all read, and `pnpm install` refuses to run on anything else
- pnpm

`make help` lists every target mentioned below. If `make` is not available, each target's body in the `Makefile` is one or two commands you can run directly.

## First run

```
make setup
make dev
```

`make setup` installs the dependencies and creates the two `.env` files a fresh clone is missing, copying each from its `.env.example`. Both are required: the API needs `DATABASE_URL` and the web app needs `NEXT_PUBLIC_API_BASE_URL`, neither with a fallback. The examples are already filled in for local use, so they need no editing. An existing `.env` is left alone, so re-running `make setup` after a pull is safe.

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

The integration tests read the seeded database rather than mocking it, so the container has to be up first. Nothing in this app writes to the database, so the tests cannot pollute it.

`make check` runs lint, typecheck, tests and both builds, and starts the database and the API itself, because the web build prerenders Day Details against it. It is one of CI's two jobs; `make e2e` below is the other. Formatting is in neither: `lint-staged` already applies Prettier on commit.

## End-to-end tests

The suite drives a real browser, which needs one install per machine:

```
make e2e-setup
make e2e
```

`make e2e-setup` downloads the Chromium build Playwright drives. On Linux it also installs that browser's system libraries, which needs root, so it asks for your sudo password. On macOS and Windows there are no such libraries and it only downloads the browser.

`make e2e` starts the database and the API, builds both apps, and runs the suite against those production builds on ports 3100 and 3101, deliberately not 3000 and 3001, so a suite run cannot attach itself to a dev server you happen to have open. The report lands in `packages/e2e/playwright-report/`.

## The containerised API

```
make up
```

Builds and runs the shipped API image alongside the database and Adminer. This is for verifying the artifact that gets deployed, not for developing against; `make dev` is the edit loop.

## Stopping

```
make down
```

Stops and removes the containers, along with the volume Postgres keeps its data in. That volume is anonymous and is abandoned the moment its container goes, so `down` deletes it rather than leaving it on the disk to accumulate. Nothing is lost: the dataset is baked into the image, so the next `make db-up` starts a fresh container that seeds itself again, which takes a while. The dev servers `make dev` starts run in the foreground, so Ctrl-C ends those.

## Resetting the database

```
make db-reset
```

Removes the containers with their volume and seeds again from `db/init-db.tar.gz`, which is `make down` followed by `make db-up`, under the name you go looking for. It is the assignment's `docker compose up --build --renew-anon-volumes` in `Makefile` form. You rarely need either: the dataset is fixed and historical, and nothing in this app writes to it. Reach for it if `db/init-db.tar.gz` ever changes, because a container that already exists keeps the data it has, or if you have changed something by hand.
