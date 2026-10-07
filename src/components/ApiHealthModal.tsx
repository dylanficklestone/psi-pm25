import React, { useState, useEffect } from 'react';
import { HealthReport } from '../types/nea';
import { fetchApiHealth } from '../services/neaApi';
import { ShieldCheck, RefreshCw, X, Server, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface ApiHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReport?: HealthReport | null;
}

export const ApiHealthModal: React.FC<ApiHealthModalProps> = ({
  isOpen,
  onClose,
  initialReport,
}) => {
  const [report, setReport] = useState<HealthReport | null>(initialReport || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApiHealth(force);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query /api/health.js');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !report) {
      loadHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                NEA API Infrastructure Health
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Endpoint: <code className="text-cyan-300">/api/health.js</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close API Health modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Summary Banner */}
          {report && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  SYSTEM STATUS
                </span>
                <div className="flex items-center gap-2 mt-1">
                  {report.overallStatus === 'HEALTHY' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <span
                    className={`text-lg font-mono font-bold ${
                      report.overallStatus === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {report.overallStatus}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({report.summary.healthy}/{report.summary.total} APIs Operational)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                <div>
                  <span className="text-slate-500 block text-[10px]">AVG LATENCY</span>
                  <span className="text-sm font-semibold text-cyan-300 tabular-nums">
                    {report.summary.averageLatencyMs} ms
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CHECKED</span>
                  <span className="text-slate-300">
                    {new Date(report.timestamp).toLocaleTimeString('en-SG', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs font-mono text-rose-300">
              {error}
            </div>
          )}

          {/* Endpoint Rows */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Monitored NEA Data Streams (4 Endpoints)
            </h3>

            {report?.apis.map((api) => (
              <div
                key={api.id}
                className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        api.status === 'HEALTHY'
                          ? 'bg-emerald-400'
                          : api.status === 'DEGRADED'
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span className="font-semibold text-slate-200">{api.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        api.status === 'HEALTHY'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-800/40'
                      }`}
                    >
                      {api.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-md">{api.url}</p>
                </div>

                <div className="flex items-center gap-3 sm:justify-end text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-800/70 text-slate-300">
                    HTTP {api.httpStatus || 'ERR'}
                  </span>
                  <span className="text-cyan-300 tabular-nums font-semibold">
                    {api.latencyMs} ms
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 pt-2">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Direct backend ping test against Singapore Government Open Data API Gateway.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/70">
          <span className="text-xs font-mono text-slate-400">
            {report?.cached ? `Cached (${report.cacheAgeSeconds}s ago)` : 'Real-time Ping'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadHealth(true)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-cyan-950 text-cyan-200 border border-cyan-800 hover:bg-cyan-900 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Pinging Endpoints...' : 'Refresh Status'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
