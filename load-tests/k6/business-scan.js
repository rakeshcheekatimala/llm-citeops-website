import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

const targetUrl = (__ENV.TARGET_URL || "http://localhost:3000").replace(/\/$/, "");
const scanBaseUrl = __ENV.SCAN_BASE_URL || "https://example.com";
const scanUrls = (__ENV.SCAN_URLS || scanBaseUrl)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const thinkTimeSeconds = Number(__ENV.THINK_TIME_SECONDS || "1");

export const options = {
  scenarios: {
    business_scan_ramp: {
      executor: "ramping-vus",
      stages: [
        { duration: __ENV.WARMUP_DURATION || "30s", target: Number(__ENV.WARMUP_VUS || "2") },
        { duration: __ENV.STEADY_DURATION || "2m", target: Number(__ENV.STEADY_VUS || "10") },
        { duration: __ENV.RAMPDOWN_DURATION || "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<15000"],
    scan_5xx_rate: ["rate<0.01"],
  },
};

const scan2xxRate = new Rate("scan_2xx_rate");
const scan429Rate = new Rate("scan_429_rate");
const scan5xxRate = new Rate("scan_5xx_rate");
const scanUnexpectedCounter = new Counter("scan_unexpected_statuses");

export default function () {
  const response = http.post(
    `${targetUrl}/api/business-scan/scan`,
    JSON.stringify({ project: buildProject() }),
    {
      headers: {
        "content-type": "application/json",
        "x-load-test": "answerlint-business-scan",
      },
      tags: { endpoint: "business-scan" },
      timeout: __ENV.REQUEST_TIMEOUT || "120s",
    },
  );

  const is2xx = response.status >= 200 && response.status < 300;
  const is429 = response.status === 429;
  const is5xx = response.status >= 500;

  scan2xxRate.add(is2xx);
  scan429Rate.add(is429);
  scan5xxRate.add(is5xx);
  if (!is2xx && !is429 && !is5xx) {
    scanUnexpectedCounter.add(1);
  }

  check(response, {
    "business scan returns 2xx or controlled 429": (res) =>
      (res.status >= 200 && res.status < 300) || res.status === 429,
    "business scan does not return 5xx": (res) => res.status < 500,
    "business scan has JSON response": (res) =>
      String(res.headers["Content-Type"] || "").includes("application/json"),
  });

  sleep(thinkTimeSeconds);
}

function buildProject() {
  const now = new Date().toISOString();
  return {
    id: `k6-${__VU}-${__ITER}`,
    baseUrl: scanBaseUrl,
    discoveredUrls: scanUrls,
    businessModel: "Load test project",
    scanHistory: [],
    latestScore: null,
    potentialScore: null,
    lostOpportunityScore: null,
    createdAt: now,
    updatedAt: now,
    storageStatus: "skipped",
    pages: scanUrls.map((url, index) => ({
      id: `page-${index + 1}`,
      url,
      title: `Load test page ${index + 1}`,
      category: index === 0 ? "Revenue Pages" : "Content Pages",
      impactTier: index === 0 ? "Very High" : "Medium",
      included: true,
      is_manually_categorized: false,
      reason: "Synthetic load test page",
      confidence: 1,
      signals: ["load-test"],
      source: "base_url",
      incomingInternalLinks: 1,
      isNavigationLinked: index === 0,
      isHomepageLinked: index === 0,
    })),
  };
}
