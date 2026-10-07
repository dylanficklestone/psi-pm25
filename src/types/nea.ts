export type SingaporeRegion = 'central' | 'north' | 'south' | 'east' | 'west' | 'national';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RegionMetadata {
  name: SingaporeRegion;
  labelLocation: Coordinates;
}

export interface PollutantReadings {
  psi_twenty_four_hourly?: Record<string, number>;
  pm25_twenty_four_hourly?: Record<string, number>;
  pm10_twenty_four_hourly?: Record<string, number>;
  pm25_one_hourly?: Record<string, number>;
  so2_twenty_four_hourly?: Record<string, number>;
  so2_sub_index?: Record<string, number>;
  o3_eight_hour_max?: Record<string, number>;
  o3_sub_index?: Record<string, number>;
  co_eight_hour_max?: Record<string, number>;
  co_sub_index?: Record<string, number>;
  no2_one_hour_max?: Record<string, number>;
  pm10_sub_index?: Record<string, number>;
  pm25_sub_index?: Record<string, number>;
}

export interface TimeSeriesItem {
  timestamp: string;
  date: string;
  updatedTimestamp?: string;
  readings: PollutantReadings;
}

export interface WeatherStation {
  id: string;
  deviceId: string;
  name: string;
  location: Coordinates;
}

export interface StationReading {
  stationId: string;
  value: number;
}

export interface StationTimeSeriesItem {
  timestamp: string;
  data: StationReading[];
}

export interface AirQualityBand {
  level: 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  min: number;
  max: number;
  colorHex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
  generalAdvisory: string;
  vulnerableAdvisory: string;
}

export interface PM25Band {
  level: 'Normal' | 'Elevated' | 'High' | 'Very High';
  min: number;
  max: number;
  colorHex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  generalAdvisory: string;
  vulnerableAdvisory: string;
}

export interface EndpointHealth {
  id: string;
  name: string;
  url: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  httpStatus: number | null;
  latencyMs: number;
  dataSummary: Record<string, unknown> | null;
  error: string | null;
  lastChecked: string;
}

export interface HealthReport {
  service: string;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'ERROR';
  timestamp: string;
  cached?: boolean;
  cacheAgeSeconds?: number;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
    averageLatencyMs: number;
  };
  apis: EndpointHealth[];
}

export interface NearestLocationResult {
  region: SingaporeRegion;
  distanceKm: number;
  nearestStation?: WeatherStation;
  stationDistanceKm?: number;
  userCoords?: Coordinates;
}
