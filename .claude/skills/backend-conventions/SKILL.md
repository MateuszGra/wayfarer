---
name: backend-conventions
description: Backend conventions for Wayfarer's Node.js + TypeScript + Fastify + PostgreSQL modular monolith on MyDevil (modules and layers, rich domain model, routes, background jobs, tracker webhooks, caching, migrations, API errors, security, testing). Load when writing or changing server code in this repo: API routes, modules under src/modules, jobs, step-sync integrations (Garmin, Fitbit) or database migrations.
---

Adapted from a DDD/hexagonal backend guide to our stack: TypeScript (strict) on Node.js, Fastify, PostgreSQL, one process on MyDevil (FreeBSD, Passenger). The global coding rules (comments, API errors, tests, English in the repo) still apply.

## Ask first

- database schema changes (new migrations),
- new dependencies, especially any with native code (FreeBSD has to compile them),
- deploy or CI changes,
- changes to tracker webhook handlers or the step-sync job,
- changes to `src/shared`, which the game frontend also uses.

## Modular monolith

One repository, one Node process, one domain. Fastify serves `/api/*`; Passenger serves the built game from `public/`.

```
src/
  server/          Fastify bootstrap, plugins, route registration
  modules/
    auth/          accounts, sessions
    steps/         tracker connections (Garmin, Fitbit), manual entry, daily step budget
    progress/      position on the route, days, milestones
    routes/        route and biome data
    weather/       player region (GeoLite2) and cached forecasts
  shared/          pure logic shared with the game: steps → km, route position, time of day, weather states
```

- **Cross-module calls** go only through a module's public API, its `index.ts`. That API exposes service functions or interfaces, DTO types and events. Never import another module's internal files. Enforce this with `dependency-cruiser` rules in CI.
- **Public API DTOs** are plain `readonly` types made of primitives, string-literal unions and shared value types. They never expose database rows or driver errors.
- **Changing a public API is a breaking change.** Grep every consumer, the game frontend included, before you rename, remove or add a required field.
- **Leaking APIs:** if another module's API leaks internals, wrap it in your own anti-corruption layer (an interface plus an adapter) rather than depending on the leak.
- **`src/shared` stays pure:** no I/O, no Node-only APIs. It runs in the browser too.

## Layers: domain ← application ← infrastructure

Each module has `domain/`, `application/` and `infrastructure/` folders. Imports only point inwards.

### Domain

- **What it holds:** aggregates, value objects, repository interfaces, domain events and domain errors.
- **Rich model:** invariants and calculations live in the aggregate, for example "a day's step budget is set once per day" or "progress never goes backwards". To decide where code goes, ask: is this a domain rule or orchestration? Rules go in the aggregate; step order, caching and dispatch go in the application layer.
- **Value objects** are immutable classes or branded types (`StepCount`, `Kilometres`, `RouteId`), validated in their factory. Repository interfaces take value objects, not raw primitives.
- **Factories:** `Aggregate.create(...)` for new objects, and `Aggregate.restore(...)` for the repository to rebuild one from a row.
- **Domain events:** aggregates record events such as "daily budget set" or "milestone reached". Other code reacts to those events instead of being called directly.
- **No infrastructure imports:** no Fastify, no `pg`, no HTTP clients, no `process.env`.
- **Time is injected** (a `Clock` port), never `new Date()` inside the domain.
- **IDs** are UUID v7.

### Application

- **What it holds:** use cases, ports (interfaces for external services), job payload types and event handlers.
- **Shape of a use case:** load the aggregate, call a domain method, save it, publish its events.
- **Ports must not leak infrastructure.** Ask: would this parameter still make sense with an in-memory implementation?
- **Slow or external work runs as a background job.** Enqueue it; don't call another use case's handler inline.

### Infrastructure

- **What it holds:** repository implementations (SQL), Fastify routes, job workers, the cache and adapters for Garmin, Fitbit, Open-Meteo and GeoLite2.
- **Entry points only:** routes and workers contain no business logic.
- **A route:**
  - declares request and response schemas (TypeBox / JSON Schema), so Fastify validates input and serializes output;
  - builds value objects and calls the use case;
  - maps domain errors to API errors.

## API errors

- Every error has one code from a single place, `src/server/errors.ts`, and the HTTP status that matches it:
  `{ "error": { "code": "tracker_not_connected", "message": "Tracker is not connected" } }`
- One Fastify error handler maps domain errors to codes. Unknown errors become `internal_error` with status 500 and are logged.
- The game maps codes to its own Polish UI text and never shows `message` to players.

## Background jobs and webhooks

- **Queue:** jobs run on PostgreSQL itself (for example `pg-boss`, pure JS). There is no Redis or broker to run on MyDevil. Scheduled work, such as the step sync after midnight and the hourly weather refresh, is a cron entry in the MyDevil panel that triggers a job.
- **Payloads** are small JSON objects with primitives only.
- **Workers must be idempotent.** Jobs retry and trackers resend webhooks after any non-2xx response, so the same input twice must give the same end state. The daily step budget is keyed by user and date.
- **Expected domain errors** are caught and the job finishes. Rethrowing them makes the job retry forever.
- **Webhook handlers** verify the signature, store or enqueue the payload, and return 2xx quickly. The business logic runs in the `steps` module, which guards against processing the same input twice.
- **Ordering:** handlers of the same event run in no guaranteed order, so don't rely on one handler's side effect in another.
- **Formatting:** extract it into a separate function or class, so the worker only orchestrates.

## Consistency with external systems

- **The tracker is the source of truth for steps,** and our database is the source of truth for progress. A sync must never lower a day's budget once the day has been played.
- **Late uploads:** trackers sometimes upload hours late. Handle that as a documented rule, not an ad-hoc patch.
- **Before chasing a bug in our code,** check the tracker's app configuration and the webhook delivery logs. If there is no log at all, the request never reached us.

## Caching

- **Forecasts:** weather is cached per region for about an hour, not per player.
- **Route data:** cache it in memory at start-up; it is static files.
- **Write, don't invalidate:** when you know the new value, write it to the cache. Deleting the key sends the next read to stale data.
- **Version cache keys** whenever the cached shape changes.

## Database and migrations

- **Access:** `pg` with a typed query builder (for example Kysely) and plain SQL. No heavy ORM, no packages with native bindings.
- **Migrations:** one migration per schema change, reviewed like code, run on deploy before the app restarts. Never edit a migration that has already been applied.
- **Hot-path totals** are stored as columns updated by the domain method that changes them, for example a player's total km. They are never recomputed with `SUM` on every request.

## Security and privacy

- **Identity** comes from the verified session, never from a user id in the URL or body.
- **Tracker OAuth tokens** are stored encrypted. Only the scopes we need are requested.
- **Location:** only the player's region is stored, never the IP address or a precise location (see the brief).
- **Before changing or removing an endpoint,** search its consumers: the game frontend and the API tests.

## TypeScript

- **Compiler:** `strict: true`, no `any`, explicit return types on exported functions.
- **Immutability:** `readonly` DTOs; string-literal unions or `as const` objects instead of `enum`.
- **Formatting:** never by hand. Prettier and ESLint run in CI, and `tsc --noEmit` and `dependency-cruiser` must pass with no new findings.

## Testing (Vitest)

- **Unit tests:** domain and application code tested through its public functions, with in-memory fakes for repositories, the clock and tracker adapters. Assert outcomes: aggregate state, return values, published events.
- **No real external APIs** (Garmin, Fitbit, Open-Meteo) in tests; use fake adapters.
- **Every new or changed route** gets an API test with `fastify.inject()`, covering success, validation errors and each error code.
- **Integration tests against PostgreSQL** cover the SQL we wrote. They are few and run separately.
- **Webhooks and jobs:** test the full flow and idempotency (the same webhook twice gives the same result).

## Production (MyDevil)

- **Read-only by default:** no manual SQL writes, no destructive commands, no deploys without being asked.
- **Check the Node version in the MyDevil panel** before using newer Node APIs.
- **Logs:** use Passenger and the app's logs. Before judging production behaviour, read the deployed version, not a stale local checkout.
