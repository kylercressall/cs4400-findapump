# Automated Testing Guide (Find A Pump)

## 1) Install dependencies

```bash
cd find-a-pump-code
pnpm install
```

## 2) Functional automated tests

### Backend black-box + white-box

```bash
pnpm test:backend
```

### Backend with coverage

```bash
pnpm test:backend:coverage
```

Implemented test files:

- `apps/backend/tests/blackbox/api.routes.test.ts`
- `apps/backend/tests/whitebox/station.controller.test.ts`
- `apps/backend/tests/whitebox/station.service.test.ts`

## 3) Non-functional automated tests

Start backend first (default expected: `http://localhost:4000`).

### NF-NF-LOAD-001 (load smoke)

```bash
pnpm test:nf:load
```

### NF-NF-REL-001 (reliability soak)

```bash
pnpm test:nf:reliability
```

### NF-NF-SCALE-001 (scalability)

```bash
TEST_BASE_URL=http://localhost:4000 pnpm test:nf:scalability
```

### NF-NF-CONSIST-001 (response consistency)

```bash
TEST_BASE_URL=http://localhost:4000 pnpm test:nf:consistency
```

### NF-NF-AVAIL-001 (availability)

```bash
TEST_BASE_URL=http://localhost:4000 pnpm test:nf:availability
```

## 4) Environment variables for non-functional tuning

- `TEST_BASE_URL` (default: `http://localhost:4000`)
- `TEST_ENDPOINT` (default endpoint differs by script)
- `NF_MAX_P95_MS` (default: `700`)
- `NF_MAX_ERROR_RATE` (default: `0.05` for load, `0.03` for soak, `0.01` for availability)
- `NF_REQUESTS` (default: `100`)
- `NF_CONCURRENCY` (default: `10`)
- `NF_DURATION_SEC` (default: `60`)
- `NF_INTERVAL_MS` (default: `250`)
- `NF_MAX_DEGRADATION` (default: `12` for scalability)
- `NF_ITERATIONS` (default: `20` for consistency)
- `NF_MAX_VARIANCE` (default: `0.10` for consistency)

Example custom run:

```bash
$env:TEST_BASE_URL="http://localhost:4000"
$env:TEST_ENDPOINT="/api/stations"
$env:NF_MAX_P95_MS="500"
pnpm test:nf:load
```

## 5) ID Naming

- Functional test IDs use: `FN-*`
- Non-functional test IDs use: `NF-*`
