import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SingaporeRegion,
  WeatherStation,
  NearestLocationResult,
  HealthReport,
} from './types/nea';
import {
  fetchAllNeaData,
  fetchApiHealth,
  NeaFullData,
  REGION_LABELS,
} from './services/neaApi';
import {
  getPsiBand,
  getPm25Band,
  calculateHazeIntensity,
  calculateHeatIndex,
} from './utils/airQuality';
import { SkylineBackground } from './components/SkylineBackground';
import { WeatherAtmosphere } from './components/WeatherAtmosphere';
import { MetricCard } from './components/MetricCard';
import { InteractiveCharts } from './components/InteractiveCharts';
import { LocationSelector } from './components/LocationSelector';
import { HealthAdvisory } from './components/HealthAdvisory';
import { ApiHealthModal } from './components/ApiHealthModal';
import { AtmosphereControls } from './components/AtmosphereControls';
import { GeographicalMap } from './components/GeographicalMap';

import {
  Wind,
  Flame,
  Thermometer,
  Droplets,
  Gauge,
  RefreshCw,
  Server,
  AlertCircle,
  Eye,
  Clock,
} from 'lucide-react';

export default function App() {
  // Application Data State
  const [neaData, setNeaData] = useState<NeaFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Location & Region State
  const [selectedRegion, setSelectedRegion] = useState<SingaporeRegion>('central');
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [locationResult, setLocationResult] = useState<NearestLocationResult | null>(null);

  // Weather & Atmosphere State
  const [weatherMode, setWeatherMode] = useState<'live' | 'clear' | 'hazy' | 'humid' | 'rainy'>('live');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'golden' | 'night' | 'auto'>('auto');
  const [customHazeIntensity, setCustomHazeIntensity] = useState<number>(0.2);

  // API Health Modal State
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [apiHealthReport, setApiHealthReport] = useState<HealthReport | null>(null);
  const [apiHealthStatus, setApiHealthStatus] = useState<
    'HEALTHY' | 'DEGRADED' | 'DOWN' | 'LOADING' | 'ERROR'
  >('LOADING');

  // Load NEA Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllNeaData();
      setNeaData(data);
      setLastRefreshed(new Date());

      // If no station selected yet and stations available, pick one in current region or first
      if (data.temperatureData.stations.length > 0 && !selectedStationId) {
        setSelectedStationId(data.temperatureData.stations[0].id);
      }
    } catch (err) {
      console.error('Error fetching NEA data:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to retrieve real-time air quality metrics from NEA.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedStationId]);

  // Load API Health check
  const checkHealthStatus = useCallback(async () => {
    try {
      const report = await fetchApiHealth();
      setApiHealthReport(report);
      if (report.overallStatus === 'CRITICAL') {
        setApiHealthStatus('DOWN');
      } else {
        setApiHealthStatus(report.overallStatus);
      }
    } catch {
      setApiHealthStatus('DEGRADED');
    }
  }, []);

  useEffect(() => {
    loadData();
    checkHealthStatus();

    // Auto-refresh every 5 minutes (standard NEA polling interval)
    const interval = setInterval(() => {
      loadData();
      checkHealthStatus();
    }, 300000);

    return () => clearInterval(interval);
  }, [loadData, checkHealthStatus]);

  // Extract latest readings for the chosen region and station
  const latestReadings = useMemo(() => {
    if (!neaData) return null;

    // Latest PSI
    const psiItems = neaData.psiData.items || [];
    const latestPsiItem = psiItems[0];
    const psiVal = latestPsiItem?.readings?.psi_twenty_four_hourly?.[selectedRegion] ??
      latestPsiItem?.readings?.psi_twenty_four_hourly?.national ??
      null;

    // Latest PM 2.5 (1-hr reading)
    const pm25Items = neaData.pm25Data.items || [];
    const latestPm25Item = pm25Items[0];
    const pm25Val = latestPm25Item?.readings?.pm25_one_hourly?.[selectedRegion] ??
      latestPm25Item?.readings?.pm25_one_hourly?.national ??
      null;

    // Latest Temperature
    const tempItems = neaData.temperatureData.readings || [];
    const latestTempItem = tempItems[0];
    let tempVal: number | null = null;
    let activeStation: WeatherStation | undefined;

    if (latestTempItem && latestTempItem.data) {
      if (selectedStationId) {
        const found = latestTempItem.data.find((d) => d.stationId === selectedStationId);
        if (found) tempVal = found.value;
      }
      if (tempVal === null && latestTempItem.data.length > 0) {
        const sum = latestTempItem.data.reduce((a, b) => a + b.value, 0);
        tempVal = Math.round((sum / latestTempItem.data.length) * 10) / 10;
      }
    }

    if (selectedStationId) {
      activeStation = neaData.temperatureData.stations.find((s) => s.id === selectedStationId);
    }

    // Latest Humidity
    const humItems = neaData.humidityData.readings || [];
    const latestHumItem = humItems[0];
    let humVal: number | null = null;

    if (latestHumItem && latestHumItem.data) {
      if (selectedStationId) {
        const found = latestHumItem.data.find((d) => d.stationId === selectedStationId);
        if (found) humVal = found.value;
      }
      if (humVal === null && latestHumItem.data.length > 0) {
        const sum = latestHumItem.data.reduce((a, b) => a + b.value, 0);
        humVal = Math.round((sum / latestHumItem.data.length) * 10) / 10;
      }
    }

    // Heat index
    const heatIndexVal =
      tempVal !== null && humVal !== null ? calculateHeatIndex(tempVal, humVal) : null;

    return {
      psi: psiVal,
      pm25: pm25Val,
      temperature: tempVal,
      humidity: humVal,
      heatIndex: heatIndexVal,
      activeStation,
      rawPollutants: latestPsiItem?.readings,
      timestamp: latestPsiItem?.timestamp || new Date().toISOString(),
    };
  }, [neaData, selectedRegion, selectedStationId]);

  // Derived Air Quality status bands
  const psiBand = useMemo(() => getPsiBand(latestReadings?.psi), [latestReadings?.psi]);
  const pm25Band = useMemo(() => getPm25Band(latestReadings?.pm25), [latestReadings?.pm25]);

  // Calculate live atmospheric haziness
  const liveHazeInfo = useMemo(() => {
    return calculateHazeIntensity(latestReadings?.psi || 35, latestReadings?.pm25 || 15);
  }, [latestReadings?.psi, latestReadings?.pm25]);

  // Effective Haze Intensity (either live computed or manually customized)
  const effectiveHaze = useMemo(() => {
    if (weatherMode === 'live') {
      return liveHazeInfo.intensity;
    }
    return customHazeIntensity;
  }, [weatherMode, liveHazeInfo.intensity, customHazeIntensity]);

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans">
      {/* 4) Background Silhouette of Singapore Skyline */}
      <SkylineBackground
        hazeIntensity={effectiveHaze}
        timeOfDay={timeOfDay}
        weatherEffect={weatherMode}
      />

      {/* 3) Dynamic Atmospheric Weather & Volumetric Haze Effects */}
      <WeatherAtmosphere
        hazeIntensity={effectiveHaze}
        weatherMode={weatherMode}
      />

      {/* TOP BAR CONTRACT: Single text brand, nav links, primary actions */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand single text wordmark */}
          <a
            href="/"
            className="text-lg font-bold tracking-tight text-white hover:text-cyan-300 transition-colors flex items-center gap-2"
          >
            <Wind className="w-5 h-5 text-cyan-400" />
            <span>SG Air & Weather</span>
          </a>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#metrics" className="hover:text-white transition-colors">
              Readings
            </a>
            <a href="#map" className="hover:text-white transition-colors">
              Geo Map
            </a>
            <a href="#trends" className="hover:text-white transition-colors">
              Diurnal Trends
            </a>
            <a href="#advisory" className="hover:text-white transition-colors">
              Health Advisory
            </a>
            <a href="#atmosphere" className="hover:text-white transition-colors">
              Skyline & Atmosphere
            </a>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2.5">
            {/* 2) API Health Monitor Button */}
            <button
              onClick={() => setHealthModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-colors"
              title="Inspect NEA API Infrastructure Health (/api/health.js)"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  apiHealthStatus === 'HEALTHY'
                    ? 'bg-emerald-400'
                    : apiHealthStatus === 'DEGRADED'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                } animate-pulse`}
              />
              <span className="hidden sm:inline">API Health</span>
              <Server className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Refresh Data Button */}
            <button
              onClick={() => {
                loadData();
                checkHealthStatus();
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-sm disabled:opacity-50"
              title="Refresh NEA data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Error notification if any */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="px-2.5 py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-white text-[11px]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Hero Status Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span className="text-white font-medium">Singapore National Air & Climate Telemetry</span>
            <span aria-hidden="true">·</span>
            <span>Region: <strong className="text-cyan-300 capitalize">{selectedRegion}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Skyline Visibility: <strong className="text-white">{liveHazeInfo.category}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Updated {lastRefreshed.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* 1) Location Selector (GPS detection + Singapore regions & weather stations) */}
        <LocationSelector
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          stations={neaData?.temperatureData.stations || []}
          selectedStationId={selectedStationId}
          onSelectStation={setSelectedStationId}
          locationResult={locationResult}
          onLocationDetected={setLocationResult}
        />

        {/* 1) Real-Time Metric Cards Grid with Official NEA Colour-Coded Badges */}
        <section id="metrics" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400">
              Live Environmental Telemetry
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Keyless NEA Open Data API v2
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* PSI Card */}
            <MetricCard
              title="24-hr PSI"
              value={latestReadings?.psi ?? null}
              unit="PSI"
              icon={Gauge}
              band={psiBand}
              subtitle={`${REGION_LABELS[selectedRegion]} standard index`}
              accentColor="#38bdf8"
            />

            {/* PM 2.5 Card */}
            <MetricCard
              title="1-hr PM 2.5"
              value={latestReadings?.pm25 ?? null}
              unit="µg/m³"
              icon={Flame}
              band={pm25Band}
              subtitle="Fine respirable particulate density"
              accentColor="#f59e0b"
            />

            {/* Ambient Air Temperature */}
            <MetricCard
              title="Air Temperature"
              value={latestReadings?.temperature ?? null}
              unit="°C"
              icon={Thermometer}
              subtitle={
                latestReadings?.activeStation
                  ? `Station: ${latestReadings.activeStation.name}`
                  : 'Singapore islandwide reading'
              }
              accentColor="#f97316"
            />

            {/* Relative Humidity & Heat Index */}
            <MetricCard
              title="Relative Humidity"
              value={latestReadings?.humidity ?? null}
              unit="%"
              icon={Droplets}
              subtitle={
                latestReadings?.heatIndex
                  ? `Feels like ${latestReadings.heatIndex}°C apparent heat`
                  : 'Atmospheric moisture saturation'
              }
              accentColor="#06b6d4"
            />
          </div>
        </section>

        {/* Geographical Telemetry Map (Integrated with OneMap API) */}
        <section id="map">
          <GeographicalMap
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
            stations={neaData?.temperatureData.stations || []}
            selectedStationId={selectedStationId}
            onSelectStation={setSelectedStationId}
            latestReadings={latestReadings}
            stationTempData={neaData?.temperatureData.readings?.[0]?.data || []}
            stationHumData={neaData?.humidityData.readings?.[0]?.data || []}
            locationResult={locationResult}
          />
        </section>

        {/* 1) Interactive Charts Section */}
        <section id="trends">
          <InteractiveCharts
            selectedRegion={selectedRegion}
            psiItems={neaData?.psiData.items || []}
            pm25Items={neaData?.pm25Data.items || []}
            tempItems={neaData?.temperatureData.readings || []}
            humidityItems={neaData?.humidityData.readings || []}
            selectedStationId={selectedStationId}
            stationName={latestReadings?.activeStation?.name}
          />
        </section>

        {/* Health Advisory & Full Pollutants Matrix */}
        <section id="advisory">
          <HealthAdvisory
            psiBand={psiBand}
            pm25Band={pm25Band}
            readings={latestReadings?.rawPollutants}
            region={selectedRegion}
          />
        </section>

        {/* 3 & 4) Weather Effects & Singapore Skyline Atmosphere Controller */}
        <section id="atmosphere">
          <AtmosphereControls
            weatherMode={weatherMode}
            onWeatherModeChange={setWeatherMode}
            timeOfDay={timeOfDay}
            onTimeOfDayChange={setTimeOfDay}
            hazeIntensity={effectiveHaze}
            onHazeIntensityChange={setCustomHazeIntensity}
            autoHazeIntensity={liveHazeInfo.intensity}
            hazeCategory={liveHazeInfo.category}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2">
            <span>Powered by National Environment Agency (NEA) Data APIs</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setHealthModalOpen(true)}
              className="text-cyan-400 hover:underline"
            >
              /api/health.js
            </button>
          </div>
          <div>
            <span>Official Standards: NEA PSI & 1-Hr PM2.5 Advisory Guidelines</span>
          </div>
        </div>
      </footer>

      {/* 2) API Health Modal */}
      <ApiHealthModal
        isOpen={healthModalOpen}
        onClose={() => setHealthModalOpen(false)}
        initialReport={apiHealthReport}
      />
    </div>
  );
}
