import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  SingaporeRegion,
  WeatherStation,
  Coordinates,
  NearestLocationResult,
  PollutantReadings,
} from '../types/nea';
import {
  getTileLayerUrl,
  OneMapStyle,
  SINGAPORE_CENTER,
  SINGAPORE_BOUNDS,
  fetchOneMapStatus,
  OneMapStatus,
  REGION_BOUNDARIES,
} from '../services/oneMapService';
import { REGION_CENTROIDS, REGION_LABELS } from '../services/neaApi';
import { getPsiBand, getPm25Band } from '../utils/airQuality';
import {
  Layers,
  MapPin,
  Navigation,
  Maximize2,
  Info,
  ShieldCheck,
  Thermometer,
  Droplets,
  Gauge,
  Flame,
} from 'lucide-react';

export type MapMetricLayer = 'psi' | 'pm25' | 'temperature' | 'humidity';

interface GeographicalMapProps {
  selectedRegion: SingaporeRegion;
  onSelectRegion: (reg: SingaporeRegion) => void;
  stations: WeatherStation[];
  selectedStationId?: string;
  onSelectStation: (stId: string) => void;
  latestReadings: {
    psi: number | null;
    pm25: number | null;
    temperature: number | null;
    humidity: number | null;
    rawPollutants?: PollutantReadings;
  } | null;
  stationTempData: { stationId: string; value: number }[];
  stationHumData: { stationId: string; value: number }[];
  locationResult?: NearestLocationResult | null;
  onDetectLocation?: () => void;
}

export const GeographicalMap: React.FC<GeographicalMapProps> = ({
  selectedRegion,
  onSelectRegion,
  stations,
  selectedStationId,
  onSelectStation,
  latestReadings,
  stationTempData,
  stationHumData,
  locationResult,
  onDetectLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonsLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapMetricLayer>('psi');
  const [mapStyle, setMapStyle] = useState<OneMapStyle>('Night');
  const [oneMapStatus, setOneMapStatus] = useState<OneMapStatus | null>(null);

  // Fetch OneMap API integration status on mount
  useEffect(() => {
    fetchOneMapStatus().then(setOneMapStatus);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: SINGAPORE_CENTER,
      zoom: 11,
      minZoom: 10,
      maxZoom: 17,
      maxBounds: SINGAPORE_BOUNDS,
      maxBoundsViscosity: 0.8,
      zoomControl: false,
      attributionControl: false,
    });

    // Add custom zoom control in top-right
    L.control
      .zoom({
        position: 'topright',
      })
      .addTo(map);

    // Initial tile layer
    const tileUrl = getTileLayerUrl(mapStyle);
    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 18,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    polygonsLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when Map Style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    tileLayerRef.current.setUrl(getTileLayerUrl(mapStyle));
  }, [mapStyle]);

  // Render Map Markers & Polygons based on active layer and telemetry data
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !polygonsLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    polygonsLayerRef.current.clearLayers();

    const regions: SingaporeRegion[] = ['central', 'north', 'south', 'east', 'west'];

    // 1) Render Region Boundaries if activeLayer is PSI or PM2.5
    if (activeLayer === 'psi' || activeLayer === 'pm25') {
      regions.forEach((reg) => {
        const coords = REGION_BOUNDARIES[reg];
        if (!coords) return;

        let fillColor = '#38bdf8';
        if (activeLayer === 'psi') {
          const val = latestReadings?.rawPollutants?.psi_twenty_four_hourly?.[reg] || 35;
          fillColor = getPsiBand(val).colorHex;
        } else {
          const val = latestReadings?.rawPollutants?.pm25_one_hourly?.[reg] || 15;
          fillColor = getPm25Band(val).colorHex;
        }

        const isSelected = selectedRegion === reg;

        const polygon = L.polygon(coords, {
          color: fillColor,
          weight: isSelected ? 2.5 : 1,
          opacity: isSelected ? 0.9 : 0.4,
          fillColor,
          fillOpacity: isSelected ? 0.2 : 0.08,
          dashArray: isSelected ? undefined : '4 4',
        });

        polygon.on('click', () => {
          onSelectRegion(reg);
        });

        polygonsLayerRef.current?.addLayer(polygon);
      });
    }

    // 2) Render Markers based on Active Metric Layer
    if (activeLayer === 'psi' || activeLayer === 'pm25') {
      // REGIONAL AIR QUALITY MARKERS
      regions.forEach((reg) => {
        const centroid = REGION_CENTROIDS[reg];
        if (!centroid) return;

        const isSelected = selectedRegion === reg;
        let value = 0;
        let bandBadge = '';
        let bandColor = '#38bdf8';
        let unit = '';

        if (activeLayer === 'psi') {
          value =
            latestReadings?.rawPollutants?.psi_twenty_four_hourly?.[reg] ??
            latestReadings?.psi ??
            0;
          const band = getPsiBand(value);
          bandBadge = band.level;
          bandColor = band.colorHex;
          unit = 'PSI';
        } else {
          value =
            latestReadings?.rawPollutants?.pm25_one_hourly?.[reg] ??
            latestReadings?.pm25 ??
            0;
          const band = getPm25Band(value);
          bandBadge = band.level;
          bandColor = band.colorHex;
          unit = 'µg/m³';
        }

        // Custom HTML Marker Icon
        const iconHtml = `
          <div class="relative group cursor-pointer transition-transform duration-200 hover:scale-110">
            <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border shadow-xl backdrop-blur-md ${
              isSelected
                ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/30'
                : 'bg-slate-950/90 border-slate-700 hover:border-slate-500'
            }" style="border-left: 4px solid ${bandColor};">
              <div class="text-left">
                <div class="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-1">
                  <span>${reg}</span>
                  ${isSelected ? '<span class="text-cyan-400">●</span>' : ''}
                </div>
                <div class="flex items-baseline gap-1 mt-0.5">
                  <span class="text-sm font-mono font-bold text-white tabular-nums">${value}</span>
                  <span class="text-[9px] font-mono text-slate-400">${unit}</span>
                </div>
              </div>
            </div>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-900 border-r border-b ${
              isSelected ? 'border-cyan-400' : 'border-slate-700'
            }"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-map-marker',
          iconSize: [90, 40],
          iconAnchor: [45, 42],
        });

        const marker = L.marker([centroid.latitude, centroid.longitude], {
          icon: customIcon,
        });

        marker.on('click', () => {
          onSelectRegion(reg);
        });

        // Popup with details
        marker.bindPopup(`
          <div class="p-2 font-mono text-xs text-slate-900">
            <div class="font-bold text-sm uppercase mb-1">${REGION_LABELS[reg]}</div>
            <div class="mb-1"><strong>${activeLayer.toUpperCase()}:</strong> ${value} ${unit} (${bandBadge})</div>
            <div class="text-[11px] text-slate-600">Coordinates: ${centroid.latitude.toFixed(3)}, ${centroid.longitude.toFixed(3)}</div>
            <div class="mt-2 text-[10px] text-cyan-700 font-semibold">Click to focus in dashboard</div>
          </div>
        `);

        markersLayerRef.current?.addLayer(marker);
      });
    } else {
      // 3) WEATHER STATION MARKERS (Temperature & Humidity)
      stations.forEach((st) => {
        if (!st.location) return;

        const isSelected = selectedStationId === st.id;
        let value = '--';
        let unit = '';
        let color = '#38bdf8';

        if (activeLayer === 'temperature') {
          unit = '°C';
          const match = stationTempData.find((d) => d.stationId === st.id);
          if (match) {
            value = match.value.toFixed(1);
            // Thermal color: 26°C (green) -> 30°C (amber) -> 34°C (orange)
            const t = match.value;
            color = t < 28 ? '#10b981' : t < 31 ? '#38bdf8' : t < 33 ? '#f59e0b' : '#f97316';
          }
        } else {
          unit = '%';
          const match = stationHumData.find((d) => d.stationId === st.id);
          if (match) {
            value = match.value.toFixed(0);
            const h = match.value;
            color = h < 60 ? '#38bdf8' : h < 80 ? '#0284c7' : '#06b6d4';
          }
        }

        const iconHtml = `
          <div class="relative group cursor-pointer transition-transform duration-200 hover:scale-115">
            <div class="flex items-center gap-1 px-2 py-1 rounded-md border shadow-lg backdrop-blur-md ${
              isSelected
                ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/40 text-cyan-200'
                : 'bg-slate-950/90 border-slate-700 text-slate-200 hover:border-slate-500'
            }">
              <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${color};"></span>
              <span class="text-xs font-mono font-bold tabular-nums text-white">${value}${unit}</span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-station-marker',
          iconSize: [60, 26],
          iconAnchor: [30, 26],
        });

        const marker = L.marker([st.location.latitude, st.location.longitude], {
          icon: customIcon,
        });

        marker.on('click', () => {
          onSelectStation(st.id);
        });

        marker.bindPopup(`
          <div class="p-2 font-mono text-xs text-slate-900">
            <div class="font-bold text-sm mb-1">${st.name}</div>
            <div class="mb-1"><strong>Station ID:</strong> ${st.id}</div>
            <div class="mb-1"><strong>${activeLayer === 'temperature' ? 'Air Temperature' : 'Relative Humidity'}:</strong> ${value}${unit}</div>
            <div class="text-[11px] text-slate-600">Lat: ${st.location.latitude.toFixed(4)}, Lon: ${st.location.longitude.toFixed(4)}</div>
            <div class="mt-2 text-[10px] text-cyan-700 font-semibold">Click to select station</div>
          </div>
        `);

        markersLayerRef.current?.addLayer(marker);
      });
    }

    // 4) User Geolocation Beacon (if GPS available)
    if (locationResult?.userCoords) {
      const { latitude, longitude } = locationResult.userCoords;
      const userHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-cyan-400/30 animate-ping"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white shadow-lg"></div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userHtml,
        className: 'user-location-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker([latitude, longitude], { icon: userIcon });
      userMarker.bindPopup(`
        <div class="p-2 font-mono text-xs text-slate-900">
          <div class="font-bold mb-1">📍 You Are Here</div>
          <div>Nearest Region: <strong class="capitalize">${locationResult.region}</strong> (${locationResult.distanceKm} km away)</div>
        </div>
      `);
      markersLayerRef.current?.addLayer(userMarker);
    }
  }, [
    activeLayer,
    selectedRegion,
    selectedStationId,
    stations,
    stationTempData,
    stationHumData,
    latestReadings,
    locationResult,
    onSelectRegion,
    onSelectStation,
  ]);

  // Reset to Singapore center
  const handleResetView = () => {
    mapInstanceRef.current?.setView(SINGAPORE_CENTER, 11, {
      animate: true,
    });
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Top Map Toolbar */}
      <div className="p-4 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/60">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-semibold text-white tracking-tight">
              Singapore Geographical Telemetry Map
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              SLA OneMap API
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time geospatial distribution of air quality and climate stations
          </p>
        </div>

        {/* Layer Selector & Style Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Layer Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            {(
              [
                { id: 'psi', label: 'PSI', icon: Gauge },
                { id: 'pm25', label: 'PM 2.5', icon: Flame },
                { id: 'temperature', label: 'Temp', icon: Thermometer },
                { id: 'humidity', label: 'Humidity', icon: Droplets },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveLayer(t.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                    activeLayer === t.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* OneMap Style Switcher */}
          <div className="flex items-center gap-1">
            <select
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value as OneMapStyle)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              title="OneMap Tile Style"
            >
              <option value="Night">Night Style</option>
              <option value="Default">Default Style</option>
              <option value="Grey">Grey Style</option>
              <option value="Original">Original Style</option>
            </select>
          </div>

          {/* Quick Actions */}
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset Map View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {onDetectLocation && (
            <button
              onClick={onDetectLocation}
              className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900 transition-colors"
              title="Center on My Location"
            >
              <Navigation className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* OneMap API Integration Status Banner */}
      <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800/60 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              oneMapStatus?.hasActiveToken ? 'bg-emerald-400' : 'bg-cyan-400'
            }`}
          />
          <span>
            {oneMapStatus?.hasActiveToken
              ? 'OneMap API: Connected (SLA Official Map Tiles)'
              : 'OneMap API: Ready · Set ONEMAP_API in Vercel to mint SLA token'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span>Active Layer: <strong className="text-slate-300 uppercase">{activeLayer}</strong></span>
          <span aria-hidden="true">·</span>
          <span>{stations.length} Stations Mapped</span>
        </div>
      </div>

      {/* Map Container Viewport */}
      <div className="relative w-full h-[420px] sm:h-[480px] bg-slate-950 z-0">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Map Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-[400] bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 shadow-xl backdrop-blur-md text-xs font-mono max-w-xs pointer-events-auto">
          <div className="font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="uppercase text-[11px] tracking-wider text-slate-400">
              {activeLayer === 'psi'
                ? 'PSI Bands'
                : activeLayer === 'pm25'
                ? 'PM 2.5 Scale'
                : activeLayer === 'temperature'
                ? 'Thermal Scale'
                : 'Moisture Scale'}
            </span>
          </div>

          {activeLayer === 'psi' && (
            <div className="space-y-1 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">0 - 50: Good</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-slate-300">51 - 100: Moderate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300">101 - 200: Unhealthy</span>
              </div>
            </div>
          )}

          {activeLayer === 'pm25' && (
            <div className="space-y-1 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">0 - 55 µg/m³: Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300">56 - 150 µg/m³: Elevated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-slate-300">151 - 250 µg/m³: High</span>
              </div>
            </div>
          )}

          {(activeLayer === 'temperature' || activeLayer === 'humidity') && (
            <div className="text-[10px] text-slate-400 space-y-1">
              <div>Click any station marker to select for detailed charts & stats.</div>
              <div className="text-cyan-400">Green / Blue = Cool · Amber / Orange = Warm</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
