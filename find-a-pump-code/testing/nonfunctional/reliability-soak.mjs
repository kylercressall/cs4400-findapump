const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3001";
const endpoint = process.env.TEST_ENDPOINT || "/api/stations/nearby?latitude=40.2338&longitude=-111.6585&radius=10";
const durationSec = Number(process.env.NF_DURATION_SEC || 60);
const intervalMs = Number(process.env.NF_INTERVAL_MS || 250);
const maxErrorRate = Number(process.env.NF_MAX_ERROR_RATE || 0.03);

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

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const url = `${baseUrl}${endpoint}`;
  const endAt = Date.now() + durationSec * 1000;

  let total = 0;
  let failures = 0;
  let slowest = 0;

  while (Date.now() < endAt) {
    const result = await callOnce(url);
    total += 1;
    if (!result.ok) failures += 1;
    if (result.ms > slowest) slowest = result.ms;
    await sleep(intervalMs);
  }

  const errorRate = total > 0 ? failures / total : 1;

  console.log("=== NF Reliability Soak Results ===");
  console.log(`URL: ${url}`);
  console.log(`Duration (sec): ${durationSec}`);
  console.log(`Total requests: ${total}`);
  console.log(`Failures: ${failures}`);
  console.log(`Error rate: ${(errorRate * 100).toFixed(2)}%`);
  console.log(`Slowest response (ms): ${slowest.toFixed(2)}`);
  console.log(`Threshold: error rate <= ${(maxErrorRate * 100).toFixed(2)}%`);

  if (errorRate > maxErrorRate) {
    console.error("NF-RESULT: FAIL");
    process.exit(1);
  }

  console.log("NF-RESULT: PASS");
}

run().catch((error) => {
  console.error("NF-RESULT: ERROR", error);
  process.exit(1);
});
