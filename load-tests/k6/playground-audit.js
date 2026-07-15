import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

const targetUrl = (__ENV.TARGET_URL || "http://localhost:3000").replace(/\/$/, "");
const auditUrl = __ENV.AUDIT_URL || "https://example.com";
const thinkTimeSeconds = Number(__ENV.THINK_TIME_SECONDS || "1");

export const options = {
  scenarios: {
    playground_audit_ramp: {
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
    audit_5xx_rate: ["rate<0.01"],
  },
};

const audit2xxRate = new Rate("audit_2xx_rate");
const audit5xxRate = new Rate("audit_5xx_rate");
const auditUnexpectedCounter = new Counter("audit_unexpected_statuses");

export default function () {
  const response = http.post(
    `${targetUrl}/api/playground/audit`,
    JSON.stringify({ url: auditUrl }),
    {
      headers: {
        "content-type": "application/json",
        "x-load-test": "answerlint-playground-audit",
      },
      tags: { endpoint: "playground-audit" },
      timeout: __ENV.REQUEST_TIMEOUT || "120s",
    },
  );

  const is2xx = response.status >= 200 && response.status < 300;
  const is5xx = response.status >= 500;

  audit2xxRate.add(is2xx);
  audit5xxRate.add(is5xx);
  if (!is2xx && !is5xx) {
    auditUnexpectedCounter.add(1);
  }

  check(response, {
    "playground audit returns 2xx": (res) => res.status >= 200 && res.status < 300,
    "playground audit does not return 5xx": (res) => res.status < 500,
    "playground audit has JSON response": (res) =>
      String(res.headers["Content-Type"] || "").includes("application/json"),
  });

  sleep(thinkTimeSeconds);
}
