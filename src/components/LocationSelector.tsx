import React, { useState } from 'react';
import {
  SingaporeRegion,
  WeatherStation,
  NearestLocationResult,
  Coordinates,
} from '../types/nea';
import { REGION_LABELS, findNearestLocation } from '../services/neaApi';
import { Navigation, MapPin, Compass, Check } from 'lucide-react';

interface LocationSelectorProps {
  selectedRegion: SingaporeRegion;
  onSelectRegion: (reg: SingaporeRegion) => void;
  stations: WeatherStation[];
  selectedStationId?: string;
  onSelectStation: (stId: string) => void;
  locationResult?: NearestLocationResult | null;
  onLocationDetected: (res: NearestLocationResult) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedRegion,
  onSelectRegion,
  stations,
  selectedStationId,
  onSelectStation,
  locationResult,
  onLocationDetected,
}) => {
  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const regions: SingaporeRegion[] = ['central', 'north', 'south', 'east', 'west', 'national'];

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        const res = findNearestLocation(coords, stations);
        onLocationDetected(res);
        onSelectRegion(res.region);
        if (res.nearestStation) {
          onSelectStation(res.nearestStation.id);
        }
        setDetecting(false);
      },
      (err) => {
        setDetecting(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location access was denied. You can select your region manually below.');
        } else {
          setGeoError('Unable to retrieve location coordinates. Select region manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-md p-4 sm:p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Location & Monitoring Zone
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Select your Singapore territory or use GPS geolocation
          </p>
        </div>

        {/* Detect Location Button */}
        <button
          onClick={handleDetectLocation}
          disabled={detecting}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-cyan-200 bg-cyan-950/60 border border-cyan-800/70 hover:bg-cyan-900/60 hover:border-cyan-600 rounded-lg transition-all duration-150 disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${detecting ? 'animate-spin' : ''}`} />
          <span>{detecting ? 'Acquiring GPS...' : 'Use My Current Location'}</span>
        </button>
      </div>

      {/* Geolocation feedback banner */}
      {locationResult && (
        <div className="mb-4 p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-between text-xs font-mono text-cyan-300">
          <div className="flex items-center gap-2 truncate">
            <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">
              Nearest Zone: <strong className="capitalize">{locationResult.region}</strong> (
              {locationResult.distanceKm} km away)
              {locationResult.nearestStation && ` · Station: ${locationResult.nearestStation.name}`}
            </span>
          </div>
          <span className="text-[11px] text-cyan-400/80 shrink-0 ml-2">GPS Calibrated</span>
        </div>
      )}

      {geoError && (
        <div className="mb-4 p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs font-mono text-amber-300">
          {geoError}
        </div>
      )}

      {/* Region Selector Pills */}
      <div>
        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
          Air Quality Region (PSI / PM 2.5)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {regions.map((reg) => {
            const isSelected = selectedRegion === reg;
            return (
              <button
                key={reg}
                onClick={() => onSelectRegion(reg)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-950/40 font-semibold'
                    : 'bg-slate-950/50 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="capitalize">{reg}</span>
                {isSelected && <Check className="w-3 h-3 text-cyan-400 ml-1 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Station Selector Dropdown for Temperature & Humidity */}
      {stations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Weather Station (Temperature & Humidity)
            </label>
            <span className="text-[11px] font-mono text-slate-500">
              {stations.length} NEA Stations Active
            </span>
          </div>

          <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={selectedStationId || ''}
              onChange={(e) => onSelectStation(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="">National Average / Auto Nearest</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.id})
                </option>
              ))}
            </select>

            <div className="text-xs font-mono text-slate-400 flex items-center px-3 py-2 bg-slate-950/30 rounded-lg border border-slate-800/40 truncate">
              {selectedStationId
                ? `Selected: ${stations.find((s) => s.id === selectedStationId)?.name || selectedStationId}`
                : 'Using aggregate Singapore multi-station telemetry'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
