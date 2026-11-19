# Wayfarer

A slow, cozy walking game powered by the player's real-world steps. A lone wanderer crosses real regions, from the Baltic coast to Santiago de Compostela, as far as yesterday's steps allow. He walks by day, camps by night, and the weather follows the weather outside the player's window.

- What the game is and its rules: [docs/brief.md](docs/brief.md)
- How it looks and moves: [docs/style-guide.md](docs/style-guide.md)
- Visual reference (open in a browser): [prototypes/scene-demo/index.html](prototypes/scene-demo/index.html)

## Stack

| Part        | Technology                                                                |
| ----------- | ------------------------------------------------------------------------- |
| Game client | Vite, TypeScript, Vue 3 (UI shell), PixiJS 8 (scene), PWA                 |
| UI          | Atomic Design, Wayfarer design system on Reka UI, CSS tokens              |
| Server      | Node.js, Fastify, TypeScript                                              |
| Database    | PostgreSQL, Kysely (typed SQL), Kysely migrations                         |
| Tests       | Vitest (server, shared logic, Vue components), Playwright later for E2E   |
| Quality     | `tsc --strict`, ESLint, Prettier, dependency-cruiser (architecture rules) |
| Hosting     | MyDevil: one Node app under Passenger, MyDevil PostgreSQL                 |

The whole thing is **one modular monolith**: one repository and one Node process. The process serves the API under `/api` and the built game as static files.

## Project structure

```
.
├── app.js                     Passenger entry point on MyDevil (loads dist/server/main.js)
├── docker-compose.yml         local PostgreSQL for development
├── docs/                      brief and style guide
├── prototypes/scene-demo/     single-file visual prototype of the scene
├── src/                       server and shared logic (TypeScript, compiled to dist/)
│   ├── server/                Fastify bootstrap, error handling, health check
│   ├── db/                    database connection, schema types, migrations
│   ├── modules/               business modules (modular monolith)
│   │   └── routes/            domain/ ← application/ ← infrastructure/, public API in index.ts
│   └── shared/                pure logic and contracts shared with the game (steps → km, daily walk, API types)
├── web/                       the game client (Vite root)
│   └── src/
│       ├── app/               App shell and router (/login, /forgot-password, /start, /scene)
│       ├── design-system/     tokens.css and Base* atoms
│       ├── shared/            feature-agnostic molecules and organisms (game menu, route map), composables, i18n, API client
│       ├── features/          auth (sign-in), onboarding (route and daily goal), scene (game, map and achievements windows)
│       └── scene-engine/      framework-free PixiJS scene (only SceneView.vue touches it)
└── public/                    build output of the game (git-ignored), served by Passenger
```

These architecture rules are checked by `npm run depcruise`:

- `src/shared` stays pure, so it can run in the browser too;
- modules talk to each other only through their `index.ts`;
- the domain layer does not import infrastructure;
- the game never imports server code;
- `scene-engine` has no Vue;
- features do not import each other;
- Atomic Design layers only import downwards;
- Reka UI is used only inside the design system.

## Requirements

- **Docker Desktop.** It is enough to run everything: the app container brings its own Node.js 26.
- Optional: **Node.js 26 LTS** on the host (see `.nvmrc`; the minimum is Node 24), only if you want to run the tools outside Docker. With nvm, run `nvm install && nvm use`.

## Getting started

### With Docker (recommended)

```bash
cp .env.example .env     # local settings; the container overrides the database host
docker compose up -d     # or: npm run up
```

The app container does three things on start:

1. installs dependencies into its own volume;
2. runs the migrations;
3. starts the API on `:3000` and the game on **http://localhost:5173**.

To follow its output, run `docker compose logs -f app` (or `npm run logs`).

Run any tool inside the container, for example:

```bash
docker compose exec app npm run check
docker compose exec app npm test
```

The dev server listens on all interfaces, so you can also open the game from a phone on the same Wi-Fi at `http://<your-mac-ip>:5173`.

### On the host

```bash
cp .env.example .env
npm install
npm run db:up            # only PostgreSQL in Docker (port 5432)
npm run db:migrate
npm run dev              # API on :3000 and the game on http://localhost:5173
```

The Vite dev server proxies `/api` to the API, so the game and the API share one origin, just as in production.

To stop everything, run `docker compose down`. Your data stays in the `db-data` Docker volume. To start from an empty database, run `docker compose down -v`.

## Scripts

| Script                                     | What it does                                               |
| ------------------------------------------ | ---------------------------------------------------------- |
| `npm run dev`                              | API (`tsx watch`) and game (Vite) together                 |
| `npm run build`                            | builds the game into `public/` and the server into `dist/` |
| `npm start`                                | runs the built server (`dist/server/main.js`)              |
| `npm run db:up` / `db:down`                | starts / stops the local PostgreSQL                        |
| `npm run db:migrate` / `db:rollback`       | applies all pending migrations / rolls back the last one   |
| `npm test`                                 | all Vitest suites (`server` and `web` projects)            |
| `npm run test:watch`                       | Vitest in watch mode                                       |
| `npm run typecheck`                        | `tsc` for the server and `vue-tsc` for the game            |
| `npm run lint` / `format` / `format:check` | ESLint / Prettier                                          |
| `npm run depcruise`                        | architecture rules                                         |
| `npm run check`                            | everything above, as CI would run it                       |

## Testing

- Tests live next to the code: `*.test.ts`.
- Unit tests need no database or network. Time comes from an injected clock, and external services are replaced with fakes.
- API tests use `fastify.inject()` against an app built with fake dependencies (see `src/server/app.test.ts`).
- Integration tests against PostgreSQL are few and use `TEST_DATABASE_URL`, a separate `wayfarer_test` database created by `docker/postgres/init.sql`.

## Screens

| Path               | What it is                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `/login`           | Sign-in and account creation over a still landscape, without the wanderer                                                       |
| `/forgot-password` | Placeholder until password reset exists                                                                                         |
| `/start`           | Choosing the route and the daily step goal on the map, with the journey length worked out live                                  |
| `/scene`           | The game. The ☰ button (or Escape) opens the menu: Map and Achievements open as windows over the game, sign-out is always last |

Until the auth API and step sync exist, signing in leads straight on, and progress and step history are demo data.

## Developer tools

In development builds the game shows a developer panel on the right (it slides away to a tab): time of day, a faster clock, the beard by days on the road, the biome and a new variant. URL parameters, in development or with `?dev`:

| Parameter                        | Effect                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `?dev`                           | Shows the developer tools in a production build                                |
| `?hour=12`                       | Starts at that hour instead of following the clock                             |
| `?t=56`                          | Jumps the animation loops (pipe, stops on the road, lighthouse) to that second |
| `?menu`, `?map`, `?achievements` | Starts with that window open                                                   |

## API errors

Every error response has the same shape and an HTTP status that matches the code:

```json
{ "error": { "code": "database_unavailable", "message": "Database is unavailable" } }
```

All codes are listed in one place, `src/shared/api/errorCodes.ts`, which the server and the game share. The game maps each code to Polish text (`web/src/shared/api/errorMessages.ts`) and never shows `message` to players.

## Deploying to MyDevil

1. In the panel, create a Node.js website for the domain and pick the newest Node version available (24 or newer). Create a PostgreSQL database and user.
2. Put the repository in the website's Passenger directory, so that `app.js` and `public/` sit in its root.
3. Create `.env` there with the production `DATABASE_URL` and `PORT`. The server loads it at start-up, because Passenger runs `app.js` without `--env-file`.
4. Build and migrate on the server:
   ```bash
   npm ci
   npm run build
   node dist/db/migrate.js latest
   ```
5. Restart the app with `devil www restart <domain>`.

How requests are served:

- Passenger serves files in `public/` directly.
- Fastify handles `/api/*`.
- For any other path it returns `public/index.html`, so `/map` and `/settings` work on reload.

Avoid npm packages with native code, because MyDevil runs FreeBSD and would have to compile them.

## Conventions

The working rules for code in this repo live in project skills under `.claude/skills/`:

- `frontend-conventions`: Atomic Design, the design system, the Vue and PixiJS boundary, UI copy, tests.
- `backend-conventions`: modules and layers, jobs and webhooks, database, security.
- `wayfarer-biomes`: the biome map of the route and the rules for designing biomes.
- `review`: the checklist used before a change counts as done.

Everything in the repository is written in English. Only text that players see is in Polish.
