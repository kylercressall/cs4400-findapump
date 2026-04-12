# COMPREHENSIVE TEST PLAN FOR FIND A PUMP (FAP)

## 1. Overview

This plan covers black-box, white-box, integration, and non-functional testing for the current implementation:

- Frontend: Next.js + React map UI
- Backend: Express + Prisma service APIs
- External dependencies: Google Places Nearby Search API and Google Places Details API

Project: CS 4400 - Find A Pump

## 2. Test Scope

### In scope

- Backend routes, controller status handling, and service query logic
- Nearby station and cached station behavior
- Fuel price endpoint behavior and mapping
- Frontend map loading, station rendering, sorting/filtering, panel interaction, and fallback/error states
- Route -> controller -> service interaction consistency

### Out of scope

- Security penetration testing
- Full accessibility audit (beyond component behavior checks)
- Distributed failover / DR environment validation
- Native mobile app testing

## 3. Current Automated Suite Inventory

### Implemented tests (and status)

- apps/backend/tests/app.test.ts: implemented and passing
- apps/backend/tests/blackbox/api.routes.test.ts: implemented and passing
- apps/backend/tests/price.services.test.ts: implemented and passing
- apps/backend/tests/whitebox/station.controller.test.ts: implemented and passing
- apps/backend/tests/whitebox/station.service.test.ts: implemented and passing
- apps/frontend/tests/map.test.tsx: implemented and passing

Validated run results (April 12, 2026):

- Backend: 18/18 passing tests after `pnpm run prisma:generate` in `apps/backend`
- Frontend: 13/13 passing tests

## 4. Functional Black-Box Test Catalog

Legend:

- Status IMPLEMENTED: automated test exists in repo
- Status PLANNED: test case is required but currently missing automation

### 4.1 Base app and station routes

- FN-BB-ROOT-001: GET `/` returns 200 and greeting text. Status: IMPLEMENTED.
- FN-BB-ROOT-002: unknown endpoint returns 404. Status: PLANNED.
- FN-BB-ROOT-003: CORS allows localhost/private-network origins. Status: PARTIAL (localhost allowed implemented; private-network origin case planned).
- FN-BB-ST-001: GET `/api/stations` returns list. Status: IMPLEMENTED.
- FN-BB-ST-101: GET `/api/stations/:id` returns station when found. Status: IMPLEMENTED.
- FN-BB-ST-102: GET `/api/stations/:id` returns 404 when missing. Status: IMPLEMENTED.
- FN-BB-ST-201: GET `/api/stations/nearby` with valid coordinates returns list. Status: IMPLEMENTED.
- FN-BB-ST-202: nearby endpoint defaults radius when omitted. Status: PLANNED.
- FN-BB-ST-204: nearby endpoint with malformed query returns error payload. Status: PLANNED.

### 4.2 Maps routes

- FN-BB-MP-001: GET `/api/maps/nearby` returns 400 when `lat`/`lng` missing. Status: PLANNED.
- FN-BB-MP-002: GET `/api/maps/nearby` returns 200 for valid query. Status: PLANNED.
- FN-BB-MP-003: GET `/api/maps/nearby/cached` returns 400 when query invalid. Status: PLANNED.
- FN-BB-MP-004: GET `/api/maps/nearby/cached` returns 200 for valid query. Status: PLANNED.
- FN-BB-MP-005: map route returns 500 when service throws. Status: PLANNED.

### 4.3 Price routes

- FN-BB-PR-001: GET `/api/prices` returns JSON payload. Status: IMPLEMENTED.
- FN-BB-PR-002: GET `/api/prices` service failure returns 500. Status: PLANNED.
- FN-BB-PR-101: GET `/api/prices/fuel` without `placeId` returns 400. Status: IMPLEMENTED.
- FN-BB-PR-102: GET `/api/prices/fuel?placeId=...` returns fuel price list. Status: IMPLEMENTED.
- FN-BB-PR-103: GET `/api/prices/fuel` returns 500 when service throws. Status: IMPLEMENTED.

### 4.4 Frontend map behavior

- FN-BB-FE-001: loading fallback shown when map script not loaded. Status: IMPLEMENTED.
- FN-BB-FE-002: legend content displays correctly. Status: IMPLEMENTED.
- FN-BB-FE-003: fallback stations load immediately. Status: IMPLEMENTED.
- FN-BB-FE-004: geolocation success pans map and reloads stations. Status: IMPLEMENTED.
- FN-BB-FE-005: geolocation denied shows fallback message. Status: IMPLEMENTED.
- FN-BB-FE-006: geolocation unavailable still loads fallback area. Status: IMPLEMENTED.
- FN-BB-FE-007: cached nearby failure shows error banner. Status: IMPLEMENTED.
- FN-BB-FE-008: panel collapse/expand interaction works. Status: IMPLEMENTED.
- FN-BB-FE-009: sort by cheapest default behavior. Status: IMPLEMENTED.
- FN-BB-FE-010: type filter behavior. Status: IMPLEMENTED.
- FN-BB-FE-011: fuel grade filter behavior (`N/A` when grade absent). Status: IMPLEMENTED.
- FN-BB-FE-012: sort option switch (closest). Status: IMPLEMENTED.
- FN-BB-FE-013: station row click focuses map and zooms. Status: IMPLEMENTED.
- FN-BB-FE-014: fuel-price fetch fallback for gas stations lacking cached `fuelPrices`. Status: PLANNED.
- FN-BB-FE-015: info-window render branch for selected station. Status: PLANNED.

## 5. White-Box Test Catalog

### 5.1 Station controller

- FN-WB-SC-001: getAllStations success branch. Status: IMPLEMENTED.
- FN-WB-SC-002: getAllStations catch/500 branch. Status: PLANNED.
- FN-WB-SC-102: getStationById not-found branch. Status: IMPLEMENTED.
- FN-WB-SC-103: getStationById catch/500 branch. Status: PLANNED.
- FN-WB-SC-202: getStationsNearby default radius branch. Status: IMPLEMENTED.
- FN-WB-SC-203: getStationsNearby catch/500 branch. Status: PLANNED.

### 5.2 Station service

- FN-WB-SS-001: includes required relations for list query. Status: IMPLEMENTED.
- FN-WB-SS-002: getStationById query by id includes ordering relation path. Status: IMPLEMENTED.
- FN-WB-SS-003: nearby bounds calculation path. Status: IMPLEMENTED.
- FN-WB-SS-004: latitude edge behavior near cosine boundary. Status: PLANNED.

### 5.3 Price service

- FN-WB-PS-001: missing API key branch throws. Status: PLANNED.
- FN-WB-PS-002: non-OK upstream response throws. Status: PLANNED.
- FN-WB-PS-003: successful fuel option mapping to normalized entries. Status: PLANNED.
- FN-WB-PS-004: background upsert skips unknown station. Status: PLANNED.
- FN-WB-PS-005: upsert writes combined units+nanos fuel price. Status: PLANNED.

### 5.4 Maps controller/service

- FN-WB-MC-001: parseParams returns null for missing/invalid query. Status: PLANNED.
- FN-WB-MC-002: getNearbyStations success path. Status: PLANNED.
- FN-WB-MC-003: getCachedStations success path. Status: PLANNED.
- FN-WB-MC-004: catch/500 paths for both map handlers. Status: PLANNED.
- FN-WB-MS-001: `searchNearby` handles `ZERO_RESULTS` as empty list. Status: PLANNED.
- FN-WB-MS-002: `searchNearby` throws on non-OK status. Status: PLANNED.
- FN-WB-MS-003: `dbStationsToNearby` filters stale prices by max age. Status: PLANNED.
- FN-WB-MS-004: `getNearbyStations` combines gas+ev Promise settlement results. Status: PLANNED.

## 6. Integration Test Scenarios

- FN-INT-001: station route -> controller -> service flow for list and by-id endpoints. Status: PARTIAL (covered through mocked route tests).
- FN-INT-002: nearby station route with numeric query -> service arguments. Status: PARTIAL.
- FN-INT-003: map frontend workflow with fallback fetch + geolocation fetch. Status: IMPLEMENTED (component-level integration with mocks).
- FN-INT-004: map cached result plus background refresh plus per-station fuel fetch fallback. Status: PLANNED.

## 7. Non-Functional Automation

Implemented scripts under `find-a-pump-code/testing/nonfunctional`:

- NF-NF-LOAD-001: load-smoke.mjs
- NF-NF-REL-001: reliability-soak.mjs
- NF-NF-SCALE-001: scalability-test.mjs
- NF-NF-CONSIST-001: consistency-test.mjs
- NF-NF-AVAIL-001: availability-test.mjs

Execution:

1. Start backend service (default `http://localhost:4000`).
2. Run from repo root:
   - `pnpm test:nf:load`
   - `pnpm test:nf:reliability`
   - `pnpm test:nf:scalability`
   - `pnpm test:nf:consistency`
   - `pnpm test:nf:availability`

## 8. Coverage Targets

- `apps/backend/src/controllers/station.controller.ts`: 90%+ line coverage
- `apps/backend/src/services/station.service.ts`: 90%+ line coverage
- `apps/backend/src/controllers/maps.controller.ts`: 85%+ line coverage
- `apps/backend/src/services/maps.service.ts`: 85%+ line coverage
- `apps/backend/src/services/price.services.ts`: 85%+ line coverage
- `apps/backend/src/app.ts`: 85%+ line coverage
- `apps/frontend/app/components/Map.tsx`: 85%+ line coverage

Overall target for critical modules: 85%+ line coverage.

## 9. Execution Strategy

1. Environment setup:
   - `pnpm install`
   - `cd apps/backend && pnpm run prisma:generate`
2. Run backend suite and fix regressions.
3. Run frontend suite and fix regressions.
4. Run non-functional scripts against a running backend.
5. Add PLANNED tests from Sections 4 and 5 in priority order (P0 -> P1).

## 10. Risks and Gaps

- Highest current automation gap is map backend coverage (controllers and services have no direct tests).
- Price service internals are under-tested; existing `price.services.test.ts` file is route-focused rather than service-internal.
- Backend tests are environment-sensitive if Prisma client generation is skipped.

## 11. Exit Criteria

- 100% of P0 tests passing.
- No open S1 defects.
- Planned map-controller/map-service and price-service white-box tests added.
- Coverage targets met for critical modules.
