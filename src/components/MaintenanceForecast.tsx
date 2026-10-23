import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Loader2, AlertCircle, RefreshCw, Sliders, Filter, Car, X, ChevronDown, ChevronUp } from 'lucide-react';

interface PredictiveRow {
  pm_level: string;
  [key: string]: string | null;
}

export function MaintenanceForecast() {
  const [data, setData] = useState<PredictiveRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sliders, Filters, and Collapsible Toolbar State
  const [forecastMonths, setForecastMonths] = useState<number>(12);
  const [pmLevelFilter, setPmLevelFilter] = useState<string>('all');
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState<string>('');
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false);

  const allMonths = [
    'Month 1', 'Month 2', 'Month 3', 'Month 4', 
    'Month 5', 'Month 6', 'Month 7', 'Month 8', 
    'Month 9', 'Month 10', 'Month 11', 'Month 12'
  ];

  // Slice visible months based on slider position
  const visibleMonths = allMonths.slice(0, forecastMonths);

  // 1. Initial Load Effect
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

  // Extract unique PM Levels for filter dropdown with safe fallbacks
  const uniquePmLevels = Array.from(
    new Set((data || []).map((r) => r?.pm_level).filter((val): val is string => Boolean(val)))
  );

  const searchTrim = (vehicleSearchQuery ?? '').trim().toLowerCase();

  // Filter rows and cell items based on PM level and Vehicle search text safely
  const filteredData = (data || []).filter((row) => {
    const rowPmLevel = (row?.pm_level ?? '').toLowerCase();
    if (pmLevelFilter !== 'all' && rowPmLevel !== pmLevelFilter.toLowerCase()) {
      return false;
    }
    if (searchTrim !== '') {
      const hasVehicleMatch = visibleMonths.some((month) => {
        const val = (row?.[month] ?? '').toLowerCase();
        return val.includes(searchTrim);
      });
      if (!hasVehicleMatch) return false;
    }
    return true;
  });

  return (
    <div className="h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3 flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-300 dark:border-slate-800 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Maintenance Forecast</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">12-month rolling schedule projection based on daily logs and service thresholds.</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-300 dark:border-slate-800 disabled:opacity-50 shadow-xs self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 px-3.5 py-2 rounded-lg flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-800/50 text-red-900 dark:text-red-200 rounded text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Main Content Body Container */}
      <div className="bg-slate-50/90 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 shadow-xl overflow-hidden space-y-3 flex flex-col flex-1 min-h-0">
        
        {/* Table Header & Collapsible Controls Toolbar */}
        <div className="border-b border-slate-300 dark:border-slate-800 pb-3 space-y-3 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Schedule Matrix</h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">Equipment ID and projected service dates grouped by PM level.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Vehicle Search Input */}
              <div className="relative flex items-center">
                <Car className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search Equipment ID..."
                  value={vehicleSearchQuery}
                  onChange={(e) => setVehicleSearchQuery(e.target.value)}
                  className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 w-40 sm:w-48"
                />
                {vehicleSearchQuery && (
                  <button
                    onClick={() => setVehicleSearchQuery('')}
                    className="absolute right-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* PM Level Filter Dropdown */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={pmLevelFilter}
                  onChange={(e) => setPmLevelFilter(e.target.value)}
                  className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">All PM Levels</option>
                  {uniquePmLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Collapse / Expand Controls Toggle Button */}
              <button
                onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
                className="p-1.5 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title={isControlsCollapsed ? "Expand Controls" : "Collapse Controls"}
              >
                <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline font-semibold">{isControlsCollapsed ? 'Slider' : 'Hide'}</span>
                {isControlsCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Collapsible Interactive Sliders Control Panel */}
          {!isControlsCollapsed && (
            <div className="bg-slate-100/80 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                  <Sliders className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Forecast Horizon Slider</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Adjust the timeline window displayed in the matrix</p>
                </div>
              </div>

              <div className="flex items-center gap-3 min-w-56">
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={forecastMonths}
                  onChange={(e) => setForecastMonths(Number(e.target.value))}
                  className="w-full h-1 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
                />
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/50 px-2 py-0.5 rounded whitespace-nowrap min-w-18 text-center">
                  {forecastMonths} {forecastMonths === 1 ? 'Mo' : 'Mos'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sub-tab content panel & Scrollable 2D Table Matrix */}
        <div className="flex flex-col flex-1 min-h-0 space-y-2">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading maintenance forecast matrix...</span>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                    {/* Sticky top AND left for top-left header cell */}
                    <th className="py-2 px-3 sticky top-0 left-0 z-30 bg-slate-100 dark:bg-slate-900 w-24 text-center border-r border-slate-300 dark:border-slate-800 shadow-xs">
                      PM Level
                    </th>
                    {/* Sticky top for all month columns */}
                    {visibleMonths.map((month) => (
                      <th key={month} className="py-2 px-3 min-w-52 text-center border-r border-slate-200 dark:border-slate-800/50 last:border-r-0 sticky top-0 z-20 bg-slate-100 dark:bg-slate-900 shadow-xs">
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={visibleMonths.length + 1} className="text-center py-12 text-slate-500 dark:text-slate-400 italic text-xs">
                        No maintenance forecast records found for the selected search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        {/* Sticky left for first column in rows */}
                        <td className="py-2 px-3 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 text-center font-bold text-slate-900 dark:text-slate-100 border-r border-slate-300 dark:border-slate-800 shadow-xs">
                          <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 rounded text-xs font-semibold">
                            {row?.pm_level ?? '—'}
                          </span>
                        </td>
                        {visibleMonths.map((month) => {
                          const cellValue = row?.[month];
                          if (!cellValue) {
                            return (
                              <td key={month} className="py-2 px-3 align-top border-r border-slate-200 dark:border-slate-800/50 last:border-r-0">
                                <span className="text-slate-400 dark:text-slate-600 italic">-</span>
                              </td>
                            );
                          }

                          // Split items safely and sort by Plate No and then by Date
                          const items = String(cellValue)
                            .split(', ')
                            .map((item) => (item ?? '').trim())
                            .filter(Boolean);
                          
                          items.sort((a, b) => {
                            const matchA = a.match(/^(.+?)\s*\((.+?)\)$/);
                            const matchB = b.match(/^(.+?)\s*\((.+?)\)$/);

                            const plateA = matchA ? matchA[1].trim() : a;
                            const dateStrA = matchA ? matchA[2].trim() : '';

                            const plateB = matchB ? matchB[1].trim() : b;
                            const dateStrB = matchB ? matchB[2].trim() : '';

                            const plateCompare = plateA.localeCompare(plateB);
                            if (plateCompare !== 0) return plateCompare;

                            const timeA = dateStrA ? new Date(`${dateStrA} 2026`).getTime() : 0;
                            const timeB = dateStrB ? new Date(`${dateStrB} 2026`).getTime() : 0;
                            return timeA - timeB;
                          });

                          const filteredItems = searchTrim === ''
                            ? items
                            : items.filter((item) => item.toLowerCase().includes(searchTrim));

                          return (
                            <td key={month} className="py-2 px-3 align-top border-r border-slate-200 dark:border-slate-800/50 last:border-r-0">
                              {filteredItems.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {filteredItems.map((item, i) => {
                                    const isMatch = searchTrim !== '' && item.toLowerCase().includes(searchTrim);
                                    return (
                                      <span
                                        key={i}
                                        className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${
                                          isMatch
                                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800/60 font-semibold'
                                            : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                                        }`}
                                      >
                                        {item}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-600 italic">-</span>
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