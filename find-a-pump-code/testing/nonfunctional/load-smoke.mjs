const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3001";
const endpoint = process.env.TEST_ENDPOINT || "/api/stations";
const requests = Number(process.env.NF_REQUESTS || 100);
const concurrency = Number(process.env.NF_CONCURRENCY || 10);
const maxP95Ms = Number(process.env.NF_MAX_P95_MS || 700);
const maxErrorRate = Number(process.env.NF_MAX_ERROR_RATE || 0.05);

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function callOnce(url) {
  const start = performance.now();
  try {
    const response = await fetch(url);
    const end = performance.now();
    return {
      ok: response.ok,
      status: response.status,
      ms: end - start,
    };
  } catch (error) {
    const end = performance.now();
    return {
      ok: false,
      status: 0,
      ms: end - start,
      error,
    };
  }
}

async function run() {
  const url = `${baseUrl}${endpoint}`;
  const results = [];
  let launched = 0;

  async function worker() {
    while (launched < requests) {
      const current = launched;
      launched += 1;
      results[current] = await callOnce(url);
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(workers);

  const durations = results.map((r) => r.ms);
  const failures = results.filter((r) => !r.ok).length;
  const errorRate = failures / results.length;
  const avg = durations.reduce((sum, v) => sum + v, 0) / durations.length;
  const p95 = percentile(durations, 95);

  console.log("=== NF Load Smoke Results ===");
  console.log(`URL: ${url}`);
  console.log(`Requests: ${requests}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Avg latency (ms): ${avg.toFixed(2)}`);
  console.log(`P95 latency (ms): ${p95.toFixed(2)}`);
  console.log(`Error rate: ${(errorRate * 100).toFixed(2)}%`);
  console.log(`Thresholds: p95 <= ${maxP95Ms} ms, error rate <= ${(maxErrorRate * 100).toFixed(2)}%`);

  const pass = p95 <= maxP95Ms && errorRate <= maxErrorRate;
  if (!pass) {
    console.error("NF-RESULT: FAIL");
    process.exit(1);
  }

  console.log("NF-RESULT: PASS");
}

run().catch((error) => {
  console.error("NF-RESULT: ERROR", error);
  process.exit(1);
});
