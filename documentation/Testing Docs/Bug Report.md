# BUG-DRIVEN TEST CASE DOCUMENT

Find A Pump (FAP)

================================================================================

## 1. OVERVIEW

This document converts a reported defect into a structured test case aligned with the Find A Pump comprehensive test plan.

The goal is to ensure the defect is:

- Reproducible
- Testable
- Traceable to regression coverage

================================================================================

## 2. BUG-BASED TEST CASE

---

### TEST ID: FN-BUG-FE-001

**Linked Bug ID:** `<INSERT BUG ID HERE>`
**Priority:** <P0 / P1 / P2>
**Severity:** <S1 / S2 / S3 / S4>

---

### DESCRIPTION

<Insert bug title / summary here>

---

### ENVIRONMENT

- Browser: <e.g., Chrome>
- OS: <e.g., Windows 10>
- Frontend: Next.js
- Backend: Express + Prisma
- API Base URL: `<if applicable>`

---

### STEPS TO REPRODUCE

1. <Step 1>
2. <Step 2>
3. <Step 3>
4. <Step 4>

---

### INPUT USED

<Insert query params / payload / user actions>

---

### EXPECTED RESULT

<What should happen according to requirements>

---

### ACTUAL RESULT

<What actually happens (bug behavior)>

---

### JUSTIFICATION

<Why this is a bug (tie to requirement or expected system behavior)>

---

### FREQUENCY

- [ ] Always
- [ ] Sometimes
- [ ] Rare

---

### BUG CATEGORY

- [ ] Input Validation
- [ ] Calculation / Logic Error
- [ ] User Interface
- [ ] Performance
- [ ] Other: `<Specify>`

---

### STATUS

- [ ] New
- [ ] Assigned
- [ ] In Progress
- [ ] Fixed
- [ ] Retested
- [ ] Closed

---

### ASSIGNED TO

<Developer / team member>

---

### RESOLUTION / NOTES

<Fix description OR investigation notes>

================================================================================

## 3. TEST CASE DERIVED FROM BUG

---

### TEST ID: FN-BB-FE-BUG-001

**Test Type:** Negative / Regression
**Priority:** Same as bug
**Coverage Type:** Black-box

---

### DESCRIPTION

Validate that the previously reported bug no longer occurs.

---

### TEST STEPS

1. Execute steps from "Steps to Reproduce"
2. Observe system behavior

---

### EXPECTED OUTPUT (POST-FIX)

- Bug condition does NOT occur
- System behaves according to expected result
- No regression side effects

---

### PASS CRITERIA

- Actual result matches expected result
- No error logs or UI inconsistencies

---

### FAIL CRITERIA

- Original bug behavior reappears
- New unintended behavior occurs

================================================================================

## 4. TRACEABILITY

| Artifact   | Reference                  |
| ---------- | -------------------------- |
| Bug Report | `<BUG ID>`               |
| Test Case  | FN-BB-FE-BUG-001           |
| Component  | <Frontend / Backend / API> |

================================================================================

## 5. NOTES

- This test case should be added to the **regression suite**
- If related to map/geolocation, include in:
  - FN-BB-FE-004 (Geolocation denied)
  - FN-WB-MAP-* coverage where applicable :contentReference[oaicite:1]{index=1}

================================================================================
