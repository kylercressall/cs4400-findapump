# COMPREHENSIVE TEST PLAN FOR FIND A PUMP (FAP)

================================================================================

## 1. OVERVIEW

This test plan covers both black-box and white-box testing of the **Find A Pump** application.
Black-box tests validate behavior from a user/API consumer perspective. White-box tests validate internal logic, branching, state handling, and data-access paths in backend and frontend code.

**Project**: CS 4400 - Find A Pump  
**System Under Test**: Next.js frontend + Express/Prisma backend

================================================================================

## 2. TEST SCOPE

### IN SCOPE
- Backend API behavior and status codes
- Station retrieval and nearby station filtering
- Price endpoint behavior
- Task CRUD behavior
- Frontend map loading and rendering
- Geolocation success/failure paths
- Marker rendering (gas/EV/user location)
- Error handling and fallback behavior
- Input validation and edge cases
- Internal controller/service path coverage
- Branch and boundary condition coverage

### OUT OF SCOPE
- High-scale performance/load testing
- Security penetration testing
- Cross-region distributed failover testing
- Accessibility audit beyond smoke checks
- Native mobile app testing

================================================================================

# PART A: BLACK-BOX TESTING

================================================================================

## 3. BLACK-BOX FUNCTIONAL TESTS
(Testing from user/client perspective without relying on implementation details)

================================================================================

### 3.1 BACKEND HEALTH & BASE ROUTING (BLACK-BOX)

--------------------------------------------------------------------------------

#### 3.1.1 Root and Service Reachability

TEST ID: FN-BB-ROOT-001  
Priority: P0 (Critical)  
Description: Backend root endpoint reachable  
Input: `GET /`  
Expected Output: HTTP 200 + root greeting text  
Test Type: Positive

TEST ID: FN-BB-ROOT-002  
Priority: P0 (Critical)  
Description: Unknown endpoint returns not found  
Input: `GET /api/does-not-exist`  
Expected Output: HTTP 404  
Test Type: Negative

TEST ID: FN-BB-ROOT-003  
Priority: P1 (High)  
Description: CORS allows frontend origin  
Input: Browser request from `http://localhost:3000`  
Expected Output: Request succeeds with expected CORS headers  
Test Type: Positive

================================================================================

### 3.2 STATION API TESTS (BLACK-BOX)

--------------------------------------------------------------------------------

#### 3.2.1 Get All Stations

TEST ID: FN-BB-ST-001  
Priority: P0 (Critical)  
Description: Retrieve all stations  
Input: `GET /api/stations`  
Expected Output: HTTP 200 + array of station objects  
Test Type: Positive

TEST ID: FN-BB-ST-002  
Priority: P1 (High)  
Description: Station object includes nested relations  
Input: `GET /api/stations`  
Expected Output: Each station includes `location`, `stationBrand`, and `FuelPrice` (if present)  
Test Type: Positive

TEST ID: FN-BB-ST-003  
Priority: P1 (High)  
Description: Fuel prices sorted ascending per station  
Input: `GET /api/stations`  
Expected Output: `FuelPrice` list is sorted by `fuelPrice` ascending  
Test Type: Positive

TEST ID: FN-BB-ST-004  
Priority: P0 (Critical)  
Description: DB failure during station retrieval  
Input: `GET /api/stations` with DB unavailable  
Expected Output: HTTP 500 + `{ error: 'Failed to fetch stations' }`  
Test Type: Negative

--------------------------------------------------------------------------------

#### 3.2.2 Get Station By ID

TEST ID: FN-BB-ST-101  
Priority: P0 (Critical)  
Description: Retrieve existing station by ID  
Input: `GET /api/stations/{validId}`  
Expected Output: HTTP 200 + matching station object  
Test Type: Positive

TEST ID: FN-BB-ST-102  
Priority: P0 (Critical)  
Description: Station ID not found  
Input: `GET /api/stations/{unknownId}`  
Expected Output: HTTP 404 + `{ error: 'Station not found' }`  
Test Type: Negative

TEST ID: FN-BB-ST-103  
Priority: P1 (High)  
Description: Invalid ID format handling  
Input: `GET /api/stations/@@@`  
Expected Output: HTTP 404 or HTTP 500 with valid JSON error payload  
Test Type: Negative

--------------------------------------------------------------------------------

#### 3.2.3 Get Nearby Stations

TEST ID: FN-BB-ST-201  
Priority: P0 (Critical)  
Description: Nearby query with valid coordinates and radius  
Input: `GET /api/stations/nearby?latitude=40.2338&longitude=-111.6585&radius=10`  
Expected Output: HTTP 200 + stations constrained to expected area window  
Test Type: Positive

TEST ID: FN-BB-ST-202  
Priority: P1 (High)  
Description: Nearby query defaults radius when omitted  
Input: `GET /api/stations/nearby?latitude=40.2338&longitude=-111.6585`  
Expected Output: HTTP 200 + same behavior as default radius 10  
Test Type: Boundary

TEST ID: FN-BB-ST-203  
Priority: P1 (High)  
Description: Nearby query returns empty list if no matches  
Input: Coordinates with no nearby stations  
Expected Output: HTTP 200 + `[]`  
Test Type: Positive

TEST ID: FN-BB-ST-204  
Priority: P0 (Critical)  
Description: Missing latitude or longitude  
Input: `GET /api/stations/nearby?latitude=40.23`  
Expected Output: Error response (current implementation likely HTTP 500)  
Test Type: Negative

TEST ID: FN-BB-ST-205  
Priority: P1 (High)  
Description: Non-numeric coordinate query  
Input: `latitude=abc&longitude=xyz`  
Expected Output: Error response with JSON payload  
Test Type: Negative

TEST ID: FN-BB-ST-206  
Priority: P2 (Low)  
Description: Radius boundary very small  
Input: `radius=0.1`  
Expected Output: HTTP 200 + very small candidate set  
Test Type: Boundary

================================================================================

### 3.3 PRICES API TESTS (BLACK-BOX)

TEST ID: FN-BB-PR-001  
Priority: P1 (High)  
Description: Retrieve all prices endpoint response shape  
Input: `GET /api/prices`  
Expected Output: HTTP 200 + JSON payload  
Test Type: Positive

TEST ID: FN-BB-PR-002  
Priority: P1 (High)  
Description: Price endpoint error path  
Input: `GET /api/prices` with service fault  
Expected Output: HTTP 500 + `{ error: 'Failed to fetch all prices' }`  
Test Type: Negative

================================================================================

### 3.4 TASK API TESTS (BLACK-BOX)

--------------------------------------------------------------------------------

#### 3.4.1 Read Operations

TEST ID: FN-BB-TK-001  
Priority: P1 (High)  
Description: Retrieve all tasks  
Input: `GET /api/tasks`  
Expected Output: HTTP 200 + tasks sorted by `createdAt` descending  
Test Type: Positive

TEST ID: FN-BB-TK-002  
Priority: P1 (High)  
Description: Retrieve task by valid ID  
Input: `GET /api/tasks/{validId}`  
Expected Output: HTTP 200 + task object  
Test Type: Positive

TEST ID: FN-BB-TK-003  
Priority: P1 (High)  
Description: Retrieve task by unknown ID  
Input: `GET /api/tasks/{unknownId}`  
Expected Output: HTTP 404 + `{ error: 'Task not found' }`  
Test Type: Negative

--------------------------------------------------------------------------------

#### 3.4.2 Create/Update/Delete

TEST ID: FN-BB-TK-101  
Priority: P1 (High)  
Description: Create task with valid title  
Input: `POST /api/tasks` body `{ "title": "buy groceries" }`  
Expected Output: HTTP 201 + created task  
Test Type: Positive

TEST ID: FN-BB-TK-102  
Priority: P0 (Critical)  
Description: Create task missing title  
Input: `POST /api/tasks` body `{}`  
Expected Output: HTTP 400 + `{ error: 'Title is required' }`  
Test Type: Negative

TEST ID: FN-BB-TK-103  
Priority: P1 (High)  
Description: Update task title only  
Input: `PATCH /api/tasks/{id}` body `{ "title": "updated" }`  
Expected Output: HTTP 200 + updated task  
Test Type: Positive

TEST ID: FN-BB-TK-104  
Priority: P1 (High)  
Description: Update task completion only  
Input: `PATCH /api/tasks/{id}` body `{ "done": true }`  
Expected Output: HTTP 200 + updated task  
Test Type: Positive

TEST ID: FN-BB-TK-105  
Priority: P1 (High)  
Description: Delete existing task  
Input: `DELETE /api/tasks/{id}`  
Expected Output: HTTP 204 with empty response  
Test Type: Positive

TEST ID: FN-BB-TK-106  
Priority: P1 (High)  
Description: Delete unknown task ID  
Input: `DELETE /api/tasks/{unknownId}`  
Expected Output: HTTP 500 (current behavior) or 404 if improved later  
Test Type: Negative

================================================================================

### 3.5 FRONTEND MAP TESTS (BLACK-BOX)

TEST ID: FN-BB-FE-001  
Priority: P0 (Critical)  
Description: Map renders when Google Maps API key is valid  
Input: Launch frontend with valid `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`  
Expected Output: Full-screen map visible  
Test Type: Positive

TEST ID: FN-BB-FE-002  
Priority: P0 (Critical)  
Description: Loading state appears before map script ready  
Input: Open page on slow network  
Expected Output: "Loading map..." shown then replaced by map  
Test Type: Positive

TEST ID: FN-BB-FE-003  
Priority: P0 (Critical)  
Description: Geolocation allowed path  
Input: Grant location permission  
Expected Output: User marker shown; map pans to user location  
Test Type: Positive

TEST ID: FN-BB-FE-004  
Priority: P0 (Critical)  
Description: Geolocation denied path  
Input: Deny location permission  
Expected Output: Error banner "Location permission denied..." + default center map  
Test Type: Negative

TEST ID: FN-BB-FE-005  
Priority: P1 (High)  
Description: Browser has no geolocation support  
Input: Simulate missing `navigator.geolocation`  
Expected Output: Error banner "Geolocation is not supported..."  
Test Type: Negative

TEST ID: FN-BB-FE-006  
Priority: P1 (High)  
Description: Both gas and EV stations load  
Input: Normal map session in populated area  
Expected Output: Gas and EV markers are visible and distinguishable  
Test Type: Positive

TEST ID: FN-BB-FE-007  
Priority: P1 (High)  
Description: Partial station load failure  
Input: Force one nearby search to fail  
Expected Output: Error banner "Some nearby stations could not be loaded."  
Test Type: Negative

TEST ID: FN-BB-FE-008  
Priority: P1 (High)  
Description: Both station searches fail  
Input: Force both nearby searches to fail  
Expected Output: Error banner "Unable to load nearby stations."  
Test Type: Negative

TEST ID: FN-BB-FE-009  
Priority: P2 (Low)  
Description: Legend content correctness  
Input: Open map page  
Expected Output: Legend contains Gas Station and EV Charging Station indicators  
Test Type: Positive

================================================================================

### 3.6 END-TO-END SCENARIOS (BLACK-BOX)

TEST ID: FN-BB-E2E-001  
Priority: P0 (Critical)  
Description: Startup and map baseline workflow  
Test Steps:
1. Start backend and frontend
2. Open homepage
3. Confirm map renders
4. Confirm legend appears
Expected Results: No crash, map + legend visible  
Test Type: Integration

TEST ID: FN-BB-E2E-002  
Priority: P0 (Critical)  
Description: Allow location and show nearby stations  
Test Steps:
1. Open app and allow location
2. Wait for searches to complete
3. Verify user marker + station markers
Expected Results: User marker and nearby stations are shown  
Test Type: Integration

TEST ID: FN-BB-E2E-003  
Priority: P1 (High)  
Description: Location denied fallback workflow  
Test Steps:
1. Open app
2. Deny geolocation permission
3. Inspect map center and error message
Expected Results: Default center is shown with denial message  
Test Type: Integration

TEST ID: FN-BB-E2E-004  
Priority: P1 (High)  
Description: Tasks CRUD flow via API client  
Test Steps:
1. Create task
2. Fetch all tasks
3. Update task
4. Delete task
Expected Results: Correct status codes and state transitions for each step  
Test Type: Integration

================================================================================

# PART B: WHITE-BOX TESTING

================================================================================

## 4. WHITE-BOX STRUCTURAL TESTS
(Testing internal code structure, logic paths, and implementation behavior)

================================================================================

### 4.1 STATION CONTROLLER (WHITE-BOX)

--------------------------------------------------------------------------------

#### 4.1.1 `getAllStations` Paths

TEST ID: FN-WB-SC-001  
Priority: P0 (Critical)  
Description: Success path calls service and returns JSON  
Target Method: `getAllStations`  
Execution Path: try branch  
Expected Internal State: `stationService.getStationsWithPrices()` invoked once, HTTP 200  
Test Type: Path Coverage

TEST ID: FN-WB-SC-002  
Priority: P0 (Critical)  
Description: Error path returns 500 payload  
Target Method: `getAllStations`  
Execution Path: catch branch  
Expected Internal State: HTTP 500 + failure JSON  
Test Type: Branch Coverage

--------------------------------------------------------------------------------

#### 4.1.2 `getStationById` Paths

TEST ID: FN-WB-SC-101  
Priority: P0 (Critical)  
Description: Found station path  
Target Method: `getStationById`  
Execution Path: station exists  
Expected Internal State: HTTP 200 and station JSON  
Test Type: Path Coverage

TEST ID: FN-WB-SC-102  
Priority: P0 (Critical)  
Description: Not-found station path  
Target Method: `getStationById`  
Execution Path: `!station` true  
Expected Internal State: HTTP 404 + `{ error: 'Station not found' }`  
Test Type: Branch Coverage

TEST ID: FN-WB-SC-103  
Priority: P1 (High)  
Description: Exception path  
Target Method: `getStationById`  
Execution Path: catch branch  
Expected Internal State: HTTP 500 + failure payload  
Test Type: Branch Coverage

--------------------------------------------------------------------------------

#### 4.1.3 `getStationsNearby` Paths

TEST ID: FN-WB-SC-201  
Priority: P0 (Critical)  
Description: Numeric query parsing path  
Target Method: `getStationsNearby`  
Execution Path: Number(latitude), Number(longitude), Number(radius)  
Expected Internal State: service called with parsed numeric args  
Test Type: Path Coverage

TEST ID: FN-WB-SC-202  
Priority: P1 (High)  
Description: Radius default path  
Target Method: `getStationsNearby`  
Execution Path: `Number(radius) || 10` when radius omitted/NaN  
Expected Internal State: service called with radius 10  
Test Type: Branch Coverage

TEST ID: FN-WB-SC-203  
Priority: P0 (Critical)  
Description: Exception path for malformed inputs  
Target Method: `getStationsNearby`  
Execution Path: catch branch  
Expected Internal State: HTTP 500 + failure payload  
Test Type: Branch Coverage

================================================================================

### 4.2 STATION SERVICE (WHITE-BOX)

TEST ID: FN-WB-SS-001  
Priority: P0 (Critical)  
Description: `getStationsWithPrices` includes required relations  
Target Method: `getStationsWithPrices`  
Verification: Prisma query includes `location`, `stationBrand`, and `FuelPrice.include.fuelType`  
Test Type: Structure Verification

TEST ID: FN-WB-SS-002  
Priority: P1 (High)  
Description: Price ordering in service query  
Target Method: `getStationsWithPrices` / `getStationById`  
Verification: `orderBy: { fuelPrice: 'asc' }` is used  
Test Type: Logic Verification

TEST ID: FN-WB-SS-003  
Priority: P0 (Critical)  
Description: Nearby bounding-box delta calculation path  
Target Method: `getStationsByLocation`  
Execution Path: compute `latDelta` and `lonDelta`  
Expected Internal State: Query bounds use computed deltas correctly  
Test Type: Path Coverage

TEST ID: FN-WB-SS-004  
Priority: P1 (High)  
Description: Latitude edge behavior near poles  
Target Method: `getStationsByLocation`  
Execution Path: `Math.cos(latitude)` denominator edge  
Expected Internal State: No unhandled exception for valid latitude bounds  
Test Type: Boundary

================================================================================

### 4.3 TASK CONTROLLER/SERVICE (WHITE-BOX)

--------------------------------------------------------------------------------

#### 4.3.1 Task Controller Branches

TEST ID: FN-WB-TC-001  
Priority: P1 (High)  
Description: `createTask` missing title returns 400  
Target Method: `createTask`  
Execution Path: `if (!title)` branch  
Expected Internal State: service not called, HTTP 400 returned  
Test Type: Branch Coverage

TEST ID: FN-WB-TC-002  
Priority: P1 (High)  
Description: `getTaskById` not-found path  
Target Method: `getTaskById`  
Execution Path: `if (!task)` branch  
Expected Internal State: HTTP 404  
Test Type: Branch Coverage

TEST ID: FN-WB-TC-003  
Priority: P1 (High)  
Description: Generic catch path on service exception  
Target Method: all task controller handlers  
Execution Path: catch branch  
Expected Internal State: HTTP 500 with operation-specific message  
Test Type: Path Coverage

--------------------------------------------------------------------------------

#### 4.3.2 Task Service Data Access

TEST ID: FN-WB-TS-101  
Priority: P1 (High)  
Description: `getAllTasks` order direction  
Target Method: `getAllTasks`  
Verification: `orderBy.createdAt` equals `desc`  
Test Type: Logic Verification

TEST ID: FN-WB-TS-102  
Priority: P1 (High)  
Description: `updateTask` partial payload path  
Target Method: `updateTask`  
Execution Path: receives `{ title }`, `{ done }`, or both  
Expected Internal State: Prisma update called with exact provided fields  
Test Type: Branch Coverage

TEST ID: FN-WB-TS-103  
Priority: P1 (High)  
Description: Delete unknown ID exception path  
Target Method: `deleteTask`  
Execution Path: Prisma throws on unknown ID  
Expected Internal State: exception propagates to controller catch  
Test Type: Path Coverage

================================================================================

### 4.4 MAP COMPONENT (WHITE-BOX)

TEST ID: FN-WB-MAP-001  
Priority: P0 (Critical)  
Description: Early return when map script not loaded  
Target Component: `Map`  
Execution Path: `if (!isLoaded)` branch  
Expected Internal State: returns loading JSX only  
Test Type: Branch Coverage

TEST ID: FN-WB-MAP-002  
Priority: P0 (Critical)  
Description: Effect guard when map is null  
Target Component: `Map` useEffect  
Execution Path: `if (!isLoaded || !map) return`  
Expected Internal State: no geolocation call made  
Test Type: Branch Coverage

TEST ID: FN-WB-MAP-003  
Priority: P0 (Critical)  
Description: Geolocation unsupported branch  
Target Component: `Map` useEffect  
Execution Path: `if (!navigator.geolocation)`  
Expected Internal State: error state set appropriately  
Test Type: Branch Coverage

TEST ID: FN-WB-MAP-004  
Priority: P0 (Critical)  
Description: Geolocation success branch  
Target Component: `Map` useEffect  
Execution Path: success callback  
Expected Internal State: sets `userLocation`, calls `panTo`, executes two nearby searches  
Test Type: Path Coverage

TEST ID: FN-WB-MAP-005  
Priority: P1 (High)  
Description: allSettled both fulfilled  
Target Component: `Map` useEffect  
Execution Path: both search promises fulfilled  
Expected Internal State: combined station list set, error null  
Test Type: Path Coverage

TEST ID: FN-WB-MAP-006  
Priority: P1 (High)  
Description: one fulfilled and one rejected  
Target Component: `Map` useEffect  
Execution Path: mixed promise outcomes  
Expected Internal State: partial list set, partial failure error message  
Test Type: Branch Coverage

TEST ID: FN-WB-MAP-007  
Priority: P1 (High)  
Description: both rejected  
Target Component: `Map` useEffect  
Execution Path: both promise outcomes rejected  
Expected Internal State: empty list and "Unable to load nearby stations." error  
Test Type: Branch Coverage

TEST ID: FN-WB-MAP-008  
Priority: P1 (High)  
Description: Marker selection by station kind  
Target Component: marker rendering map  
Execution Path: `station.kind === 'ev' ? evIconUrl : gasIconUrl`  
Expected Internal State: correct icon selected by branch  
Test Type: Branch Coverage

================================================================================

### 4.5 INTEGRATION STATE CONSISTENCY (WHITE-BOX)

TEST ID: FN-WB-INT-001  
Priority: P0 (Critical)  
Description: Controller-to-service argument consistency for nearby stations  
Components: station controller + station service  
Verification: parsed query values match service input  
Test Type: State Consistency

TEST ID: FN-WB-INT-002  
Priority: P1 (High)  
Description: Task create validation prevents invalid DB writes  
Components: task controller + task service  
Verification: no service call when title missing  
Test Type: State Consistency

TEST ID: FN-WB-INT-003  
Priority: P1 (High)  
Description: Map UI state reflects async backend/map provider outcomes  
Components: Map state + Places API callbacks  
Verification: `stations` and `error` state combinations are consistent with outcomes  
Test Type: State Consistency

================================================================================

### 4.6 CODE COVERAGE TARGETS

CLASS/COMPONENT: `station.controller.ts`  
TARGET LINE COVERAGE: 95%  
CRITICAL PATHS: success/not-found/catch branches

CLASS/COMPONENT: `station.service.ts`  
TARGET LINE COVERAGE: 90%  
CRITICAL PATHS: bounding box calculation and query assembly

CLASS/COMPONENT: `task.controllers.ts`  
TARGET LINE COVERAGE: 95%  
CRITICAL PATHS: validation + error handling

CLASS/COMPONENT: `task.services.ts`  
TARGET LINE COVERAGE: 90%  
CRITICAL PATHS: CRUD data-access calls

CLASS/COMPONENT: `Map.tsx`  
TARGET LINE COVERAGE: 85%  
CRITICAL PATHS: geolocation, allSettled outcomes, render branches

OVERALL PROJECT TARGET: 85%+ line coverage for critical modules under active development

================================================================================

# PART C: TEST EXECUTION FRAMEWORK

================================================================================

## 5. TEST EXECUTION STRATEGY

### 5.1 SMOKE TESTING

**Purpose**: Confirm critical workflows are functional before full test run.

**Scope**: P0 tests only.

**Core Smoke Set**:
- BB-ROOT-001
- BB-ST-001
- BB-ST-101
- BB-ST-201
- BB-FE-001
- BB-FE-003

**Exit Criteria**: All smoke tests pass.

--------------------------------------------------------------------------------

### 5.2 MANUAL TESTING (BLACK-BOX)

PURPOSE: Validate API behavior and UI experience.

APPROACH:
1. Execute API test cases through Postman/Insomnia/curl.
2. Execute frontend map scenarios in browser.
3. Record expected vs actual outputs.
4. Log defects with test case IDs.

EXECUTION ORDER:
1. Smoke tests (P0)
2. Station APIs
3. Task APIs
4. Prices endpoint
5. Frontend map and E2E flows

--------------------------------------------------------------------------------

### 5.3 AUTOMATED UNIT TESTING (WHITE-BOX)

PURPOSE: Validate code logic and path coverage.

IMPLEMENTED FRAMEWORKS IN THIS REPO:
- Backend: Vitest + Supertest
- Coverage: Vitest coverage output

IMPLEMENTED AUTOMATION FILES:
- `find-a-pump-code/apps/backend/tests/blackbox/api.routes.test.ts`
- `find-a-pump-code/apps/backend/tests/whitebox/station.controller.test.ts`
- `find-a-pump-code/apps/backend/tests/whitebox/station.service.test.ts`

RUN COMMANDS:
1. `cd find-a-pump-code`
2. `pnpm install`
3. `pnpm test:backend`
4. `pnpm test:backend:coverage`

CURRENT AUTOMATED COVERAGE SCOPE:
- Functional black-box API routing tests (`FN-BB-*`)
- Functional white-box controller tests (`FN-WB-SC-*`)
- Functional white-box service tests (`FN-WB-SS-*`)

EXECUTION ORDER:
1. Controller unit tests
2. Service unit tests (mocked Prisma)
3. Frontend component tests (mock map APIs)
4. Integration-focused API tests

--------------------------------------------------------------------------------

### 5.4 INTEGRATION TESTING (MIXED)

PURPOSE: Validate end-to-end component interaction.

APPROACH:
- Route â†’ Controller â†’ Service flow tests for station/task endpoints
- Frontend map flow with mocked geolocation and map provider responses
- DB-connected integration subset in controlled test environment

--------------------------------------------------------------------------------

### 5.5 REGRESSION TESTING

PURPOSE: Ensure changes do not break existing functionality.

APPROACH:
- Re-run all P0 tests after each merged change touching critical paths.
- Re-run related P1 tests for modified components.
- Full regression before milestone demo/release.

--------------------------------------------------------------------------------

### 5.6 COVERAGE ANALYSIS

PROCESS:
1. Run automated test suite with coverage enabled.
2. Compare against Section 4.6 targets.
3. Identify uncovered branches.
4. Add missing tests for critical paths.

--------------------------------------------------------------------------------

### 5.7 NON-FUNCTIONAL TEST AUTOMATION

PURPOSE: Validate baseline reliability and latency under repeatable request load.

IMPLEMENTED NON-FUNCTIONAL SCRIPTS:
- `find-a-pump-code/testing/nonfunctional/load-smoke.mjs`
- `find-a-pump-code/testing/nonfunctional/reliability-soak.mjs`

NF TEST IDS (AUTOMATED):
- TEST ID: NF-NF-LOAD-001  
  Description: Load smoke test for endpoint latency and error rate  
  Command: `pnpm test:nf:load`

- TEST ID: NF-NF-REL-001  
  Description: Reliability soak test over a timed interval  
  Command: `pnpm test:nf:reliability`

HOW TO APPLY NON-FUNCTIONAL TESTS:
1. Start backend service (default expected base URL: `http://localhost:3001`).
2. Run `cd find-a-pump-code`.
3. Execute `pnpm test:nf:load` for quick latency/error baseline.
4. Execute `pnpm test:nf:reliability` for time-based reliability.
5. Tune thresholds with env vars:
   - `TEST_BASE_URL`
   - `TEST_ENDPOINT`
   - `NF_MAX_P95_MS`
   - `NF_MAX_ERROR_RATE`
   - `NF_REQUESTS`, `NF_CONCURRENCY`, `NF_DURATION_SEC`, `NF_INTERVAL_MS`

================================================================================

## 6. TEST DATA REQUIREMENTS

### 6.1 API TEST DATA
- Valid station IDs
- Unknown/non-existent station IDs
- Valid task payloads (`title` present)
- Invalid task payloads (missing title)
- Nearby query coordinates (dense area and sparse area)

### 6.2 FRONTEND TEST DATA
- Valid Google Maps API key
- Invalid/missing API key configuration
- Geolocation allow/deny simulations
- Mock Places API responses:
  - gas + ev success
  - partial failure
  - total failure

### 6.3 TEST DATA STORAGE
Suggested structure:

```
/testing
  /api
    - stations-valid.json
    - stations-invalid.json
    - tasks-valid.json
    - tasks-invalid.json
  /frontend
    - map-mocks-success.json
    - map-mocks-partial-fail.json
    - map-mocks-fail.json
```

================================================================================

## 7. DEFECT CLASSIFICATION

### 7.1 SEVERITY LEVELS
- S1 (Critical): crash, data corruption, major workflow unavailable
- S2 (High): core feature incorrect, no practical workaround
- S3 (Medium): non-critical logic issue, workaround exists
- S4 (Low): cosmetic or minor messaging issue

### 7.2 PRIORITY LEVELS
- P0: Must fix before release/demo
- P1: Should fix in current iteration
- P2: Can defer if schedule constrained

================================================================================

## 8. RESOURCE REQUIREMENTS

### 8.1 INFRASTRUCTURE
- Node.js 20+
- pnpm
- Browser with geolocation support
- Local Prisma database setup

### 8.2 TOOLS
- Postman/Insomnia or curl
- Jest/Vitest + Supertest
- React Testing Library
- Coverage tooling
- Issue tracker (GitHub Issues/Jira/etc.)

================================================================================

## 9. TEST SCHEDULE AND TIMELINE (PROPOSED)

PHASE 1 (Days 1-2): Environment + test data setup  
PHASE 2 (Days 3-5): White-box unit tests + coverage baseline  
PHASE 3 (Days 6-8): Black-box API/UI testing  
PHASE 4 (Days 9-10): Integration + regression + closure

MILESTONES:
- M1: Environment ready (Day 2)
- M2: Core unit coverage baseline reached (Day 5)
- M3: Functional suite complete (Day 8)
- M4: Regression complete and report issued (Day 10)

================================================================================

## 10. RISK MANAGEMENT

### 10.1 KEY RISKS
- R-01: Incomplete test coverage in rapidly changing modules
- R-02: Environment/config drift between frontend/backend
- R-03: External map/geolocation API behavior variance
- R-04: Late requirements or endpoint changes
- R-05: Defect fix turnaround delays

### 10.2 MITIGATION SUMMARY
- Track coverage each test cycle for critical files
- Lock test env setup docs and sample `.env` files
- Use deterministic mocks for map/geolocation in automation
- Freeze endpoint contract before full regression run
- Daily defect triage and retest loop for P0/P1

================================================================================

## 11. SUCCESS CRITERIA

### 11.1 BLACK-BOX SUCCESS
- 100% of P0 tests executed and passing
- 95%+ of P1 tests executed
- Zero open S1 defects

### 11.2 WHITE-BOX SUCCESS
- Coverage targets from Section 4.6 met for critical modules
- All controller error branches validated
- No unresolved null/exception handling gaps in critical paths

### 11.3 INTEGRATION SUCCESS
- All E2E scenarios (BB-E2E series) pass
- Route/controller/service interactions remain consistent
- Frontend map workflows stable across success and failure paths

================================================================================

## 12. TEST REPORTING

### 12.1 DAILY REPORT
- Planned vs executed tests
- New defects by severity
- Blockers and risk changes
- Next-day plan

### 12.2 FINAL SUMMARY REPORT
- Total tests executed and pass rates
- Coverage by component
- Defect analysis and remaining known issues
- Release readiness recommendation

### 12.3 DEFECT TEMPLATE (MINIMUM)
- Defect ID
- Title
- Component
- Linked Test Case ID
- Repro steps
- Expected vs actual
- Severity/Priority
- Status/Owner

================================================================================

## 13. APPENDIX

### 13.1 ACRONYMS
- BB: Black-Box
- WB: White-Box
- E2E: End-to-End
- API: Application Programming Interface
- SRS: Software Requirements Specification

### 13.2 NOTES FOR THIS REPOSITORY
- This plan intentionally covers both station/price and task API modules present in the current codebase.
- If deployment entrypoint changes (e.g., switching between backend startup files), rerun smoke tests and refresh route coverage.

================================================================================

