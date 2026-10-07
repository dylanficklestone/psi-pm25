import {
  SingaporeRegion,
  RegionMetadata,
  TimeSeriesItem,
  WeatherStation,
  StationTimeSeriesItem,
  HealthReport,
  Coordinates,
  NearestLocationResult,
} from '../types/nea';

// Coordinates for the 5 Singapore regions (centroids based on NEA region metadata)
export const REGION_CENTROIDS: Record<SingaporeRegion, Coordinates> = {
  central: { latitude: 1.35735, longitude: 103.82 },
  north: { latitude: 1.41803, longitude: 103.82 },
  south: { latitude: 1.29587, longitude: 103.82 },
  east: { latitude: 1.35735, longitude: 103.94 },
  west: { latitude: 1.35735, longitude: 103.7 },
  national: { latitude: 1.352083, longitude: 103.819836 },
};

export const REGION_LABELS: Record<SingaporeRegion, string> = {
  central: 'Central Singapore',
  north: 'North Region',
  south: 'South Region',
  east: 'East Region',
  west: 'West Region',
  national: 'National Overall',
};

// Calculate Haversine distance in kilometers
export function calculateDistanceKm(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Find nearest Singapore region and nearest weather station
export function findNearestLocation(
  userCoords: Coordinates,
  stations: WeatherStation[] = []
): NearestLocationResult {
  const regions: SingaporeRegion[] = ['central', 'north', 'south', 'east', 'west'];
  let closestRegion: SingaporeRegion = 'central';
  let minRegionDist = Infinity;

  for (const reg of regions) {
    const dist = calculateDistanceKm(userCoords, REGION_CENTROIDS[reg]);
    if (dist < minRegionDist) {
      minRegionDist = dist;
      closestRegion = reg;
    }
  }

  let closestStation: WeatherStation | undefined;
  let minStationDist = Infinity;

  for (const st of stations) {
    if (st.location) {
      const dist = calculateDistanceKm(userCoords, st.location);
      if (dist < minStationDist) {
        minStationDist = dist;
        closestStation = st;
      }
    }
  }

  return {
    region: closestRegion,
    distanceKm: minRegionDist,
    nearestStation: closestStation,
    stationDistanceKm: minStationDist === Infinity ? undefined : minStationDist,
    userCoords,
  };
}

// Helper to fetch either via internal proxy `/api/nea/:endpoint` or directly fallback
async function fetchNeaEndpoint(endpoint: string, queryParams: Record<string, string> = {}) {
  const query = new URLSearchParams(queryParams).toString();
  const urlWithQuery = `/api/nea/${endpoint}${query ? `?${query}` : ''}`;

  try {
    const res = await fetch(urlWithQuery);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Local proxy for ${endpoint} failed, trying direct endpoint...`, err);
  }

  // Direct fallback
  const directUrl = `https://api-open.data.gov.sg/v2/real-time/api/${endpoint}${
    query ? `?${query}` : ''
  }`;
  const directRes = await fetch(directUrl, {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!directRes.ok) {
    throw new Error(`Failed to fetch NEA ${endpoint}: ${directRes.statusText}`);
  }
  return await directRes.json();
}

export function getTodayDateString(): string {
  // Use Singapore time (UTC+8)
  const now = new Date();
  const sgTime = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60000);
  const year = sgTime.getFullYear();
  const month = String(sgTime.getMonth() + 1).padStart(2, '0');
  const day = String(sgTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface NeaFullData {
  psiData: {
    regionMetadata: RegionMetadata[];
    items: TimeSeriesItem[];
  };
  pm25Data: {
    regionMetadata: RegionMetadata[];
    items: TimeSeriesItem[];
  };
  temperatureData: {
    stations: WeatherStation[];
    readings: StationTimeSeriesItem[];
    readingUnit: string;
  };
  humidityData: {
    stations: WeatherStation[];
    readings: StationTimeSeriesItem[];
    readingUnit: string;
  };
  fetchedAt: string;
}

export async function fetchAllNeaData(): Promise<NeaFullData> {
  const today = getTodayDateString();

  const [psiRes, pm25Res, tempRes, humRes] = await Promise.all([
    fetchNeaEndpoint('psi', { date: today }),
    fetchNeaEndpoint('pm25', { date: today }),
    fetchNeaEndpoint('air-temperature', { date: today }),
    fetchNeaEndpoint('relative-humidity', { date: today }),
  ]);

  return {
    psiData: psiRes.data || { regionMetadata: [], items: [] },
    pm25Data: pm25Res.data || { regionMetadata: [], items: [] },
    temperatureData: tempRes.data || { stations: [], readings: [], readingUnit: 'deg C' },
    humidityData: humRes.data || { stations: [], readings: [], readingUnit: '%' },
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchApiHealth(forceRefresh = false): Promise<HealthReport> {
  const url = forceRefresh ? '/api/health.js?force=true' : '/api/health.js';
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Health API returned ${res.status}`);
  }
  return await res.json();
}
