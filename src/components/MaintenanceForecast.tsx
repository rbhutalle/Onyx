import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Loader2, AlertCircle, RefreshCw, Sliders, Filter } from 'lucide-react';

interface PredictiveRow {
  pm_level: string;
  [key: string]: string | null;
}

export function MaintenanceForecast() {
  const [data, setData] = useState<PredictiveRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sliders and Filter State
  const [forecastMonths, setForecastMonths] = useState<number>(12);
  const [pmLevelFilter, setPmLevelFilter] = useState<string>('all');

  const allMonths = [
    'Month 1', 'Month 2', 'Month 3', 'Month 4', 
    'Month 5', 'Month 6', 'Month 7', 'Month 8', 
    'Month 9', 'Month 10', 'Month 11', 'Month 12'
  ];

  // Slice visible months based on slider position
  const visibleMonths = allMonths.slice(0, forecastMonths);

  // 1. Initial Load Effect (prevents cascading state updates during render)
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const { data: result, error: supabaseError } = await supabase
          .from('vw_12monthpredictive_maintenance_details')
          .select('*');

        if (supabaseError) throw supabaseError;
        
        if (isMounted) {
          setData(result || []);
          setError(null);
        }
      } catch (err: unknown) {
        console.error('Error fetching maintenance forecast:', err);
        const message = err instanceof Error ? err.message : 'Failed to load maintenance forecast schedule.';
        if (isMounted) setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Manual Refresh Handler
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: supabaseError } = await supabase
        .from('vw_12monthpredictive_maintenance_details')
        .select('*');

      if (supabaseError) throw supabaseError;
      setData(result || []);
    } catch (err: unknown) {
      console.error('Error refreshing maintenance forecast:', err);
      const message = err instanceof Error ? err.message : 'Failed to refresh maintenance forecast schedule.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Filter rows based on PM Level selection
  const filteredData = pmLevelFilter === 'all' 
    ? data 
    : data.filter((row) => row.pm_level?.toLowerCase() === pmLevelFilter.toLowerCase());

  // Unique PM Levels for filter dropdown
  const uniquePmLevels = Array.from(new Set(data.map((r) => r.pm_level).filter(Boolean)));

  return (
    <div className="p-8 space-y-6 max-w-full bg-slate-900 min-h-screen text-slate-100">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">Maintenance Forecast</h1>
            <p className="text-xs text-slate-400">12-month rolling schedule projection based on daily logs and service thresholds.</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer border border-slate-700 disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Header & Sliders Toolbar */}
        <div className="p-5 border-b border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span>Schedule Matrix</span>
              </h2>
              <p className="text-xs text-slate-400">Vehicle plate numbers and projected service dates grouped by Preventive Maintenance level.</p>
            </div>

            {/* PM Level Filter Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={pmLevelFilter}
                onChange={(e) => setPmLevelFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All PM Levels</option>
                {uniquePmLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Sliders Control Panel */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-200">Forecast Horizon Slider</span>
                <p className="text-[11px] text-slate-400">Adjust the timeline window displayed in the matrix table</p>
              </div>
            </div>

            <div className="flex items-center gap-4 min-w-64">
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={forecastMonths}
                onChange={(e) => setForecastMonths(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs font-semibold text-blue-400 bg-blue-950/60 border border-blue-800/50 px-2.5 py-1 rounded-md whitespace-nowrap min-w-20 text-center">
                {forecastMonths} {forecastMonths === 1 ? 'Month' : 'Months'}
              </span>
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-xs text-slate-400 font-medium">Loading maintenance forecast matrix...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-400">
              <AlertCircle className="w-8 h-8" />
              <span className="text-xs font-medium">{error}</span>
              <button
                onClick={handleRefresh}
                className="mt-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-xs transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4 sticky left-0 bg-slate-900 z-10 w-28 text-center border-r border-slate-800">
                      PM Level
                    </th>
                    {visibleMonths.map((month) => (
                      <th key={month} className="py-3.5 px-4 min-w-55 text-center border-r border-slate-800/50 last:border-r-0">
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={visibleMonths.length + 1} className="text-center py-12 text-slate-500 italic">
                        No maintenance forecast records found.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 sticky left-0 bg-slate-950 z-10 text-center font-bold text-slate-200 border-r border-slate-800 shadow-sm">
                          <span className="inline-block px-2.5 py-1 bg-blue-600/20 text-blue-400 border border-blue-800/40 rounded-lg text-xs font-semibold">
                            {row.pm_level}
                          </span>
                        </td>
                        {visibleMonths.map((month) => {
                          const cellValue = row[month];
                          return (
                            <td key={month} className="py-3 px-4 align-top border-r border-slate-800/50 last:border-r-0">
                              {cellValue ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {cellValue.split(', ').map((item, i) => (
                                    <span
                                      key={i}
                                      className="inline-block px-2 py-0.5 bg-slate-900 text-slate-300 border border-slate-800 rounded-md text-[11px] font-medium shadow-2xs whitespace-nowrap"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-600 italic">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MaintenanceForecast;