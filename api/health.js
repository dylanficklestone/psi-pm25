/**
 * NEA API Health Monitor
 * Monitors real-time status, latency, and response integrity for Singapore NEA Open Data APIs.
 * Endpoint: /api/health and /api/health.js
 */

const NEA_ENDPOINTS = [
  {
    id: 'air-temperature',
    name: 'Air Temperature',
    url: 'https://api-open.data.gov.sg/v2/real-time/api/air-temperature',
    metric: 'temperature',
  },
  {
    id: 'psi',
    name: 'Pollutant Standards Index (PSI)',
    url: 'https://api-open.data.gov.sg/v2/real-time/api/psi',
    metric: 'psi',
  },
  {
    id: 'pm25',
    name: 'PM 2.5 Fine Particulate',
    url: 'https://api-open.data.gov.sg/v2/real-time/api/pm25',
    metric: 'pm25',
  },
  {
    id: 'relative-humidity',
    name: 'Relative Humidity',
    url: 'https://api-open.data.gov.sg/v2/real-time/api/relative-humidity',
    metric: 'humidity',
  },
];

// In-memory cache for recent checks to prevent thrashing
let cache = {
  timestamp: 0,
  data: null,
};
const CACHE_TTL_MS = 10000; // 10 seconds

export async function checkEndpointHealth(endpoint) {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(endpoint.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NEA-Health-Monitor/1.0',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    const isOk = res.ok;
    let dataSummary = {};

    if (isOk) {
      try {
        const json = await res.json();
        const data = json.data || {};
        if (data.stations) {
          dataSummary = {
            stationsCount: data.stations.length,
            readingCount: data.readings?.length || 0,
            readingUnit: data.readingUnit || '',
          };
        } else if (data.regionMetadata) {
          dataSummary = {
            regionsCount: data.regionMetadata.length,
            readingCount: data.items?.length || 0,
            latestTimestamp: data.items?.[0]?.timestamp || null,
          };
        }
      } catch (parseErr) {
        // Response ok but json parse failed
      }
    }

    return {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      status: isOk ? 'HEALTHY' : 'DEGRADED',
      httpStatus: res.status,
      latencyMs,
      dataSummary,
      error: isOk ? null : `HTTP Error ${res.status}`,
      lastChecked: new Date().toISOString(),
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    return {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      status: 'DOWN',
      httpStatus: null,
      latencyMs,
      dataSummary: null,
      error: err instanceof Error ? err.message : 'Connection failed',
      lastChecked: new Date().toISOString(),
    };
  }
}

export async function getSystemHealthReport(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cache.data && now - cache.timestamp < CACHE_TTL_MS) {
    return {
      ...cache.data,
      cached: true,
      cacheAgeSeconds: Math.round((now - cache.timestamp) / 1000),
    };
  }

  const results = await Promise.all(NEA_ENDPOINTS.map(checkEndpointHealth));

  const healthyCount = results.filter((r) => r.status === 'HEALTHY').length;
  const degradedCount = results.filter((r) => r.status === 'DEGRADED').length;
  const downCount = results.filter((r) => r.status === 'DOWN').length;

  let overallStatus = 'HEALTHY';
  if (downCount > 0 || degradedCount > 1) {
    overallStatus = downCount >= 2 ? 'CRITICAL' : 'DEGRADED';
  }

  const averageLatencyMs = Math.round(
    results.reduce((acc, curr) => acc + (curr.latencyMs || 0), 0) / results.length
  );

  const report = {
    service: 'Singapore NEA Real-Time API Monitor',
    overallStatus,
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      healthy: healthyCount,
      degraded: degradedCount,
      down: downCount,
      averageLatencyMs,
    },
    apis: results,
  };

  cache = {
    timestamp: now,
    data: report,
  };

  return {
    ...report,
    cached: false,
  };
}

// Express handler
export default async function healthHandler(req, res) {
  try {
    const force = req.query.force === 'true';
    const report = await getSystemHealthReport(force);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    const statusCode = report.overallStatus === 'CRITICAL' ? 503 : 200;
    return res.status(statusCode).json(report);
  } catch (error) {
    return res.status(500).json({
      service: 'Singapore NEA Real-Time API Monitor',
      overallStatus: 'ERROR',
      error: error instanceof Error ? error.message : 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  }
}
