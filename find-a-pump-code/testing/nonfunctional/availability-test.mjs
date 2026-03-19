const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:4000";
const ENDPOINT = process.env.TEST_ENDPOINT || "/api/stations";
const DURATION_SEC = Number(process.env.NF_DURATION_SEC || 60);
const INTERVAL_MS = Number(process.env.NF_INTERVAL_MS || 200);
const MAX_ERROR_RATE = Number(process.env.NF_MAX_ERROR_RATE || 0.01);

async function availabilityTest() {
  console.log("Availability Test");
  console.log("-----------------\n");

  const duration = DURATION_SEC * 1000;
  let total = 0;
  let failures = 0;
  let minTime = Infinity;
  let maxTime = 0;
  let totalTime = 0;

  const startTime = Date.now();

  while (Date.now() - startTime < duration) {
    const start = Date.now();
    try {
      const res = await fetch(`${BASE_URL}${ENDPOINT}`);
      const elapsed = Date.now() - start;
      totalTime += elapsed;
      minTime = Math.min(minTime, elapsed);
      maxTime = Math.max(maxTime, elapsed);
      if (!res.ok) failures++;
    } catch {
      failures++;
    }
    total++;
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }

  const errorRate = total > 0 ? failures / total : 1;
  const avgTime = total > 0 ? (totalTime / total).toFixed(2) : "N/A";

  console.log(`  Duration: ${DURATION_SEC}s`);
  console.log(`  Interval: ${INTERVAL_MS}ms`);
  console.log(`  Total requests: ${total}`);
  console.log(`  Failures: ${failures}`);
  console.log(`  Error rate: ${(errorRate * 100).toFixed(2)}%`);
  console.log(`  Max error rate allowed: ${(MAX_ERROR_RATE * 100).toFixed(2)}%`);
  console.log(`  Response time: avg=${avgTime}ms, min=${minTime}ms, max=${maxTime}ms`);
  console.log(`\n  Result: ${errorRate <= MAX_ERROR_RATE ? "PASS" : "FAIL"}\n`);

  if (errorRate > MAX_ERROR_RATE) process.exit(1);
}

console.log("\n=== NF Availability Results ===\n");
availabilityTest().then(() => console.log("Complete.\n"));