const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:4000";
const ENDPOINT = process.env.TEST_ENDPOINT || "/api/stations";
const ITERATIONS = Number(process.env.NF_ITERATIONS || 20);
const MAX_VARIANCE = Number(process.env.NF_MAX_VARIANCE || 0.10);

async function consistencyTest() {
  console.log("Response Consistency Test");
  console.log("------------------------\n");

  const sizes = [];
  let errors = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    try {
      const res = await fetch(`${BASE_URL}${ENDPOINT}`);
      if (!res.ok) {
        errors++;
        continue;
      }
      const data = await res.text();
      sizes.push(data.length);
    } catch {
      errors++;
    }
  }

  if (sizes.length === 0) {
    console.log("  [FAIL] No successful responses received.");
    console.log(`  Errors: ${errors}`);
    console.log("\n  Result: FAIL\n");
    process.exit(1);
    return;
  }

  const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  const consistent = sizes.every((s) => Math.abs(s - avg) < avg * MAX_VARIANCE);

  console.log(`  Iterations: ${ITERATIONS}`);
  console.log(`  Successful responses: ${sizes.length}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Avg response size: ${avg.toFixed(0)} bytes`);
  console.log(`  Max variance allowed: ${(MAX_VARIANCE * 100).toFixed(0)}%`);
  console.log(`  All within variance: ${consistent}`);
  console.log(`\n  Result: ${consistent ? "PASS" : "FAIL"}\n`);

  if (!consistent) process.exit(1);
}

console.log("\n=== NF Consistency Results ===\n");
consistencyTest().then(() => console.log("Complete.\n"));