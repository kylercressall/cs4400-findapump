# BUG-DRIVEN TEST CASE DOCUMENT

Find A Pump (FAP)

================================================================================

## 1. OVERVIEW

This document converts two reported performance defects into structured test cases
aligned with the Find A Pump comprehensive test plan.

The goal is to ensure the defects are:

- Reproducible
- Testable
- Traceable to regression coverage

================================================================================

## 2. BUG-BASED TEST CASE #1

---

### TEST ID: FN-BUG-NF-001

**Linked Bug ID:** NF-LOAD-001
**Priority:** P1
**Severity:** S2

---

### DESCRIPTION

API endpoint `/api/stations` exceeds P95 latency threshold under moderate load (100 requests, 10 concurrent).

---

### ENVIRONMENT

- Browser: N/A (backend performance test)
- OS: macOS (Apple Silicon)
- Frontend: Next.js
- Backend: Express + Prisma
- API Base URL: `http://localhost:4000`
- Test Runner: `testing/nonfunctional/load-smoke.mjs`

---

### STEPS TO REPRODUCE

1. Start the backend server on `localhost:4000`
2. Run the load smoke test: `pnpm run test:nf:load`
3. The test sends 100 requests to `/api/stations` with concurrency of 10
4. Observe P95 latency in the test output

---

### INPUT USED

- URL: `http://localhost:4000/api/stations`
- Requests: 100
- Concurrency: 10

---

### EXPECTED RESULT

- P95 latency ≤ 700ms
- Error rate ≤ 5%

---

### ACTUAL RESULT

- Avg latency: 778.38ms
- P95 latency: 1202.57ms (exceeds 700ms threshold by 72%)
- Error rate: 0.00%

---

### JUSTIFICATION

The `/api/stations` endpoint likely makes external API calls (e.g., Google Places API) on every request without caching or connection pooling. Under concurrent load, these external calls multiply latency, causing the P95 to exceed the 700ms threshold. This degrades user experience when multiple users access the app simultaneously.

---

### FREQUENCY

- [X] Always
- [ ] Sometimes
- [ ] Rare

---

### BUG CATEGORY

- [ ] Input Validation
- [ ] Calculation / Logic Error
- [ ] User Interface
- [X] Performance
- [ ] Other: `<Specify>`

---

### STATUS

- [ ] New
- [ ] Assigned
- [ ] In Progress
- [X] Fixed
- [X] Retested
- [X] Closed

---

### ASSIGNED TO

Collin Ross

---

### RESOLUTION / NOTES

Likely root causes:

- No response caching on `/api/stations` — every request hits external APIs
- No database indexing on frequently queried columns
- No connection pooling configured for Prisma
- Potential fix: add in-memory or Redis cache for station data, add DB indexes, configure Prisma connection pool

Latest retest passed:

- Avg latency: 336.67ms
- P95 latency: 504.86ms
- Error rate: 0.00%
- NF-RESULT: PASS

Because the endpoint now meets the P95 latency and error-rate thresholds, this bug is closed.

================================================================================

## 3. TEST CASE DERIVED FROM BUG #1

---

### TEST ID: FN-BB-NF-BUG-001

**Test Type:** Regression / Performance
**Priority:** P1
**Coverage Type:** Black-box

---

### DESCRIPTION

Validate that `/api/stations` P95 latency remains under 700ms at 10 concurrent requests after performance fix is applied.

---

### TEST STEPS

1. Start the backend server on `localhost:4000`
2. Run `pnpm run test:nf:load`
3. Observe P95 latency and error rate

---

### EXPECTED OUTPUT (POST-FIX)

- P95 latency ≤ 700ms
- Error rate ≤ 5%
- NF-RESULT: PASS

---

### LATEST TEST RESULT

- Avg latency: 336.67ms
- P95 latency: 504.86ms
- Error rate: 0.00%
- NF-RESULT: PASS

---

### PASS CRITERIA

- P95 latency is at or below 700ms
- Error rate is at or below 5%

---

### FAIL CRITERIA

- P95 latency exceeds 700ms
- Error rate exceeds 5%

================================================================================

## 4. BUG-BASED TEST CASE #2

---

### TEST ID: FN-BUG-NF-002

**Linked Bug ID:** NF-SCALE-001
**Priority:** P1
**Severity:** S2

---

### DESCRIPTION

API endpoint `/api/stations` does not scale under concurrent load. At 25 concurrent requests, degradation is 12.35x baseline (threshold: 12x). At 50 concurrent requests, degradation is 48.38x baseline.

---

### ENVIRONMENT

- Browser: N/A (backend performance test)
- OS: macOS (Apple Silicon)
- Frontend: Next.js
- Backend: Express + Prisma
- API Base URL: `http://localhost:4000`
- Test Runner: `testing/nonfunctional/scalability-test.mjs`

---

### STEPS TO REPRODUCE

1. Start the backend server on `localhost:4000`
2. Run the scalability test: `pnpm run test:nf:scalability`
3. The test sends requests at 1, 5, 10, 25, and 50 concurrent levels
4. Observe degradation factor at each level

---

### INPUT USED

- URL: `http://localhost:4000/api/stations`
- Concurrency levels: 1, 5, 10, 25, 50
- Max degradation allowed: 12x

---

### EXPECTED RESULT

- All concurrency levels stay within 12x baseline degradation

---

### ACTUAL RESULT

| Concurrency | Total Time | Degradation | Result |
| ----------- | ---------- | ----------- | ------ |
| 1           | 152ms      | 1.00x       | PASS   |
| 5           | 297ms      | 1.95x       | PASS   |
| 10          | 905ms      | 5.95x       | PASS   |
| 25          | 1877ms     | 12.35x      | FAIL   |
| 50          | 7354ms     | 48.38x      | FAIL   |

---

Latest retest result:

| Concurrency | Total Time | Degradation | Result |
| ----------- | ---------- | ----------- | ------ |
| 1           | 69ms       | 1.00x       | PASS   |
| 5           | 157ms      | 2.28x       | PASS   |
| 10          | 310ms      | 4.49x       | PASS   |
| 25          | 759ms      | 11.00x      | PASS   |
| 50          | 1389ms     | 20.13x      | FAIL   |

The endpoint improved, but the scalability test still fails at 50 concurrent requests because 20.13x exceeds the 12x maximum degradation threshold.

---

### JUSTIFICATION

At 50 concurrent requests the response time degrades by 48x, meaning users would experience ~7 second response times under moderate traffic. This indicates the backend cannot handle concurrent load due to missing caching, lack of connection pooling, or blocking external API calls on every request.

---

### FREQUENCY

- [X] Always
- [ ] Sometimes
- [ ] Rare

---

### BUG CATEGORY

- [ ] Input Validation
- [ ] Calculation / Logic Error
- [ ] User Interface
- [X] Performance
- [ ] Other: `<Specify>`

---

### STATUS

- [ ] New
- [ ] Assigned
- [X] In Progress
- [ ] Fixed
- [X] Retested
- [ ] Closed

---

### ASSIGNED TO

Collin Ross

---

### RESOLUTION / NOTES

Likely root causes (same as NF-LOAD-001):

- No response caching — external API called on every request
- No Prisma connection pooling
- No database indexes on queried columns
- Potential fix: implement response caching (in-memory/Redis), add DB indexes, configure Prisma connection pool, consider rate limiting external API calls

Latest retest result:

- 1, 5, 10, and 25 concurrent requests now pass.
- 50 concurrent requests still fails at 20.13x baseline degradation.
- Max degradation allowed is 12x.
- Because the highest concurrency level still fails, this bug remains open.

================================================================================

## 5. TEST CASE DERIVED FROM BUG #2

---

### TEST ID: FN-BB-NF-BUG-002

**Test Type:** Regression / Performance
**Priority:** P1
**Coverage Type:** Black-box

---

### DESCRIPTION

Validate that `/api/stations` scales within 12x degradation at all concurrency levels up to 50.

---

### TEST STEPS

1. Start the backend server on `localhost:4000`
2. Run `pnpm run test:nf:scalability`
3. Observe degradation factor at each level

---

### EXPECTED OUTPUT (POST-FIX)

- All concurrency levels (1, 5, 10, 25, 50) stay within 12x baseline
- NF-RESULT: PASS

---

### LATEST TEST RESULT

| Concurrency | Total Time | Degradation | Result |
| ----------- | ---------- | ----------- | ------ |
| 1           | 69ms       | 1.00x       | PASS   |
| 5           | 157ms      | 2.28x       | PASS   |
| 10          | 310ms      | 4.49x       | PASS   |
| 25          | 759ms      | 11.00x      | PASS   |
| 50          | 1389ms     | 20.13x      | FAIL   |

Current result: FAIL

---

### PASS CRITERIA

- No concurrency level exceeds 12x degradation
- No errors during test

---

### FAIL CRITERIA

- Any concurrency level exceeds 12x degradation
- Errors occur during test execution

================================================================================

## 6. TRACEABILITY

| Artifact   | Reference        |
| ---------- | ---------------- |
| Bug Report | NF-LOAD-001      |
| Test Case  | FN-BB-NF-BUG-001 |
| Component  | Backend / API    |
| Bug Report | NF-SCALE-001     |
| Test Case  | FN-BB-NF-BUG-002 |
| Component  | Backend / API    |

================================================================================

## 7. NOTES

- Both test cases should be added to the **regression suite**
- Both failures share the same likely root cause (no caching / no connection pooling)
- Fixing one may resolve both
- After fix, re-run all non-functional tests together: `pnpm run test:nf`
- Consider also profiling the `/api/stations` route to identify if the bottleneck is DB queries or external API calls

================================================================================