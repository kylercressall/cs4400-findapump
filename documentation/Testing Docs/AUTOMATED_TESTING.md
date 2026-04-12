# Automated Testing Guide (Find A Pump)

This guide reflects the current monorepo test setup and validated command behavior.

## 1) Install dependencies

```bash
cd find-a-pump-code
pnpm install
```

## 2) Required backend setup before backend tests

Backend tests import Prisma client at module load time. Generate the backend Prisma client first:

```bash
cd apps/backend
pnpm run prisma:generate
```

Then return to repo root for workspace test commands.

## 3) Functional automated tests

### Backend tests

```bash
cd find-a-pump-code
pnpm test:backend
```

Coverage:

```bash
pnpm test:backend:coverage
```

### Frontend tests

```bash
cd find-a-pump-code/apps/frontend
pnpm test --run
```

## 4) Implemented automated test files

### Backend

- apps/backend/tests/app.test.ts
- apps/backend/tests/blackbox/api.routes.test.ts
- apps/backend/tests/price.services.test.ts
- apps/backend/tests/whitebox/station.controller.test.ts
- apps/backend/tests/whitebox/station.service.test.ts

### Frontend

- apps/frontend/tests/map.test.tsx

## 5) Current validated test status (April 12, 2026)

- Backend: 5 files passing, 18 tests passing (after running `pnpm run prisma:generate` in `apps/backend`).
- Frontend: 1 file passing, 13 tests passing.
- Frontend test run emits React `act(...)` warnings in one test path, but all assertions pass.

## 6) Missing automated tests (high priority)

The following code paths exist but are not currently covered by dedicated automated tests:

- maps controller validation and failure paths:
  - missing/invalid `lat/lng` handling in `/api/maps/nearby` and `/api/maps/nearby/cached`
  - service exception -> HTTP 500 branches
- maps service:
  - `searchNearby` status handling (`OK`, `ZERO_RESULTS`, non-OK)
  - cached station mapping (`dbStationsToNearby`) and stale-price exclusion behavior
  - background `upsertAllStations` resilience when individual upserts fail
- price service internals:
  - API-key missing branch
  - non-OK upstream response branch
  - station-not-found branch in background upsert
  - price conversion and Prisma upsert payload correctness
- app-level route coverage gaps:
  - `/api/maps/*` route-level tests
  - `/api/prices` error path coverage in black-box layer

## 7) Non-functional automated tests

Start backend first (default expected URL: `http://localhost:4000`).

```bash
cd find-a-pump-code
pnpm test:nf:load
pnpm test:nf:reliability
pnpm test:nf:scalability
pnpm test:nf:consistency
pnpm test:nf:availability
```

## 8) Environment variables for non-functional tuning

- `TEST_BASE_URL` (default: `http://localhost:4000`)
- `TEST_ENDPOINT` (default endpoint differs by script)
- `NF_MAX_P95_MS` (default: `700`)
- `NF_MAX_ERROR_RATE` (default differs by script)
- `NF_REQUESTS`
- `NF_CONCURRENCY`
- `NF_DURATION_SEC`
- `NF_INTERVAL_MS`
- `NF_MAX_DEGRADATION` (scalability)
- `NF_ITERATIONS` (consistency)
- `NF_MAX_VARIANCE` (consistency)

## 9) Test ID naming

- Functional IDs: `FN-*`
- Non-functional IDs: `NF-*`
