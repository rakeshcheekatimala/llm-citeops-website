# Load Testing AnswerLint

Use these k6 tests to measure how many concurrent scan requests the current
Next.js + Vercel + Supabase stack can handle without guessing.

## Install k6

```bash
brew install k6
```

## What To Test

Run both tests because they stress different paths:

- `playground-audit.js` tests `POST /api/playground/audit`.
- `business-scan.js` tests `POST /api/business-scan/scan`.

The business scan is heavier. One request can audit multiple included pages, and
the app currently audits pages in batches of four. Ten concurrent business-scan
users with four included pages can create up to forty page audits in flight.

## Safe Baseline Run

Run against local first:

```bash
npm run dev
```

Then in another terminal:

```bash
TARGET_URL=http://localhost:3000 npm run load:test:playground
```

Business scan requires the feature flag to be enabled in the target environment:

```bash
TARGET_URL=http://localhost:3000 \
SCAN_BASE_URL=https://example.com \
SCAN_URLS=https://example.com \
npm run load:test:business
```

## Vercel / Supabase Run

Use a Vercel preview URL or production URL only when you are ready to spend real
function, database, and outbound fetch capacity.

Start small:

```bash
TARGET_URL=https://your-vercel-preview-url.vercel.app \
AUDIT_URL=https://useanswerlint.com \
WARMUP_VUS=1 \
STEADY_VUS=5 \
STEADY_DURATION=2m \
npm run load:test:playground
```

Then increase `STEADY_VUS` gradually: `10`, `20`, `40`, `80`.

For business scan, use URLs you own. Avoid load testing third-party websites.

```bash
TARGET_URL=https://your-vercel-preview-url.vercel.app \
SCAN_BASE_URL=https://useanswerlint.com \
SCAN_URLS=https://useanswerlint.com,https://useanswerlint.com/playground \
WARMUP_VUS=1 \
STEADY_VUS=5 \
STEADY_DURATION=2m \
npm run load:test:business
```

## Stop Conditions

Stop increasing load when any of these are true:

- 5xx rate is above 1%.
- p95 request duration is above your acceptable user wait time.
- Supabase logs show connection exhaustion or slow queries.
- Vercel logs show function timeouts or memory errors.
- 429 rate is high and expected because the app rate limiter is protecting the
  route.

## Reading Results

Use the last passing step as your realistic capacity point.

Record:

- target URL
- Supabase plan
- Vercel plan
- endpoint tested
- included page count per scan
- VUs
- request rate
- p50, p90, p95 duration
- 2xx rate
- 429 rate
- 5xx rate

429 responses are not infrastructure failures. They mean the app rejected excess
traffic intentionally. 5xx responses are failures that need investigation.

## Capacity Formula

Use measured data, not guesses:

```text
stable_scan_requests_per_minute = successful_requests / test_minutes
stable_concurrent_scan_users = highest VUs with 5xx < 1% and acceptable p95
```

For business scans, also calculate fanout:

```text
max_page_audits_in_flight = concurrent_business_scan_requests * included_pages_per_scan
```

Because the current business scan audits up to four pages per request at once,
the practical fanout is:

```text
page_audit_pressure = concurrent_business_scan_requests * min(included_pages_per_scan, 4)
```

This is usually the number that explains Vercel/Supabase/external fetch pressure
more clearly than visitor count.
