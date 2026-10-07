import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ============================================================
// CAMPUS STATIONERY MANAGEMENT SYSTEM - LOAD TEST
// ============================================================

const BASE_URL = 'https://campus-stationery-api.onrender.com';

// Custom metrics
const applicationErrors = new Rate('application_errors');

const healthResponseTime = new Trend('health_response_time');
const productsResponseTime = new Trend('products_response_time');
const brandsResponseTime = new Trend('brands_response_time');
const searchResponseTime = new Trend('search_response_time');
const categoriesResponseTime = new Trend('categories_response_time');

// ============================================================
// LOAD TEST CONFIGURATION
// ============================================================

export const options = {
  stages: [
    // Warm-up
    { duration: '30s', target: 5 },

    // 10 concurrent users
    { duration: '30s', target: 10 },

    // 25 concurrent users
    { duration: '30s', target: 25 },

    // 50 concurrent users
    { duration: '30s', target: 50 },

    // 100 concurrent users
    { duration: '30s', target: 100 },

    // Ramp down
    { duration: '30s', target: 0 },
  ],

  thresholds: {
    // Less than 5% HTTP failures
    http_req_failed: ['rate<0.05'],

    // 95% of requests should finish under 3 seconds
    http_req_duration: ['p(95)<3000'],

    // Application checkpoint errors below 5%
    application_errors: ['rate<0.05'],
  },

  // Stop individual requests from hanging forever
  httpDebug: 'none',
};

// ============================================================
// MAIN USER FLOW
// ============================================================

export default function () {

  // ==========================================================
  // CHECKPOINT 1 — BACKEND HEALTH
  // ==========================================================

  const health = http.get(`${BASE_URL}/api/health`, {
    tags: {
      endpoint: 'health',
    },
    timeout: '10s',
  });

  healthResponseTime.add(health.timings.duration);

  const healthOK = check(health, {
    'CHECKPOINT 1 - Health status is 200': (r) =>
      r.status === 200,

    'CHECKPOINT 1 - Health response under 3 sec': (r) =>
      r.timings.duration < 3000,

    'CHECKPOINT 1 - Health response exists': (r) =>
      r.body && r.body.length > 0,
  });

  applicationErrors.add(!healthOK);


  // ==========================================================
  // CHECKPOINT 2 — PRODUCTS
  // ==========================================================

  const products = http.get(`${BASE_URL}/api/products`, {
    tags: {
      endpoint: 'products',
    },
    timeout: '10s',
  });

  productsResponseTime.add(products.timings.duration);

  const productsOK = check(products, {
    'CHECKPOINT 2 - Products status is 200': (r) =>
      r.status === 200,

    'CHECKPOINT 2 - Products response under 3 sec': (r) =>
      r.timings.duration < 3000,

    'CHECKPOINT 2 - Products response exists': (r) =>
      r.body && r.body.length > 0,
  });

  applicationErrors.add(!productsOK);


  // ==========================================================
  // CHECKPOINT 3 — PRODUCT BRANDS
  // ==========================================================

  const brands = http.get(`${BASE_URL}/api/products/brands`, {
    tags: {
      endpoint: 'brands',
    },
    timeout: '10s',
  });

  brandsResponseTime.add(brands.timings.duration);

  const brandsOK = check(brands, {
    'CHECKPOINT 3 - Brands status is 200': (r) =>
      r.status === 200,

    'CHECKPOINT 3 - Brands response under 3 sec': (r) =>
      r.timings.duration < 3000,

    'CHECKPOINT 3 - Brands response exists': (r) =>
      r.body && r.body.length > 0,
  });

  applicationErrors.add(!brandsOK);


  // ==========================================================
  // CHECKPOINT 4 — PRODUCT SEARCH
  // ==========================================================

  const search = http.get(
    `${BASE_URL}/api/products?search=pen`,
    {
      tags: {
        endpoint: 'product_search',
      },
      timeout: '10s',
    }
  );

  searchResponseTime.add(search.timings.duration);

  const searchOK = check(search, {
    'CHECKPOINT 4 - Product search status is 200': (r) =>
      r.status === 200,

    'CHECKPOINT 4 - Search response under 3 sec': (r) =>
      r.timings.duration < 3000,

    'CHECKPOINT 4 - Search response exists': (r) =>
      r.body && r.body.length > 0,
  });

  applicationErrors.add(!searchOK);


  // ==========================================================
  // CHECKPOINT 5 — CATEGORIES
  // ==========================================================

  const categories = http.get(
    `${BASE_URL}/api/categories`,
    {
      tags: {
        endpoint: 'categories',
      },
      timeout: '10s',
    }
  );

  categoriesResponseTime.add(categories.timings.duration);

  const categoriesOK = check(categories, {
    'CHECKPOINT 5 - Categories status is 200': (r) =>
      r.status === 200,

    'CHECKPOINT 5 - Categories response under 3 sec': (r) =>
      r.timings.duration < 3000,

    'CHECKPOINT 5 - Categories response exists': (r) =>
      r.body && r.body.length > 0,
  });

  applicationErrors.add(!categoriesOK);


  // ==========================================================
  // SIMULATE USER THINKING TIME
  // ==========================================================

  sleep(1);
}


// ============================================================
// FINAL SUMMARY
// ============================================================

export function handleSummary(data) {

  const metrics = data.metrics;

  const totalRequests =
    metrics.http_reqs?.values?.count || 0;

  const failedRequests =
    metrics.http_req_failed?.values?.rate || 0;

  const avgResponse =
    metrics.http_req_duration?.values?.avg || 0;

  const p95Response =
    metrics.http_req_duration?.values?.['p(95)'] || 0;

  const p99Response =
    metrics.http_req_duration?.values?.['p(99)'] || 0;

  const maxResponse =
    metrics.http_req_duration?.values?.max || 0;

  const requestsPerSecond =
    metrics.http_reqs?.values?.rate || 0;

  const applicationErrorRate =
    metrics.application_errors?.values?.rate || 0;

  const report = `
============================================================
 CAMPUS STATIONERY MANAGEMENT SYSTEM
 LOAD TESTING SUMMARY
============================================================

TEST TARGET
------------------------------------------------------------
Backend:
${BASE_URL}

Maximum Virtual Users:
100

Test Type:
Ramp-up Load Test

============================================================
OVERALL RESULTS
============================================================

Total HTTP Requests:
${totalRequests}

Requests Per Second:
${requestsPerSecond.toFixed(2)}

Average Response Time:
${avgResponse.toFixed(2)} ms

95th Percentile (p95):
${p95Response.toFixed(2)} ms

99th Percentile (p99):
${p99Response.toFixed(2)} ms

Maximum Response Time:
${maxResponse.toFixed(2)} ms

HTTP Failure Rate:
${(failedRequests * 100).toFixed(2)} %

Application Error Rate:
${(applicationErrorRate * 100).toFixed(2)} %

============================================================
PERFORMANCE INTERPRETATION
============================================================

p95 Response Time Target:
< 3000 ms

HTTP Failure Target:
< 5%

Application Error Target:
< 5%

============================================================
TEST COMPLETED
============================================================
`;

  return {
    stdout: report,
  };
}