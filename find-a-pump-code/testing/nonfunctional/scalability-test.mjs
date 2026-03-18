const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:4000";
const ENDPOINT = process.env.TEST_ENDPOINT || "/api/stations";
const MAX_DEGRADATION = Number(process.env.NF_MAX_DEGRADATION || 12);

async function scalabilityTest() {
  console.log("Scalability Test");
  console.log("----------------\n");

  const levels = [1, 5, 10, 25, 50];
  let baseline = 0;
  let passed = true;

  for (const level of levels) {
    const start = Date.now();
    try {
      const results = await Promise.all(
        Array.from({ length: level }, () => fetch(`${BASE_URL}${ENDPOINT}`))
      );
      const elapsed = Date.now() - start;
      const allOk = results.every((r) => r.ok);

      if (level === 1) baseline = elapsed;
      const degradation = baseline > 0 ? (elapsed / baseline).toFixed(2) : "N/A";

      if (degradation > MAX_DEGRADATION || !allOk) passed = false;

      console.log(
        `  [${allOk && degradation <= MAX_DEGRADATION ? "PASS" : "FAIL"}] ${level} concurrent: ${elapsed}ms total, ${degradation}x baseline`
      );
    } catch (error) {
      passed = false;
      console.log(`  [FAIL] ${level} concurrent: ${error.message}`);
    }
  }

  console.log(`\n  Max degradation allowed: ${MAX_DEGRADATION}x`);
  console.log(`  Result: ${passed ? "PASS" : "FAIL"}\n`);

  if (!passed) process.exit(1);
}

console.log("\n=== NF Scalability Results ===\n");
scalabilityTest().then(() => console.log("Complete.\n"));