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

  // Extract unique PM Levels for filter dropdown
  const uniquePmLevels = Array.from(new Set(data.map((r) => r.pm_level).filter(Boolean)));

  const searchTrim = vehicleSearchQuery.trim().toLowerCase();

  // Filter rows and cell items based on PM level and Vehicle search text
  const filteredData = data.filter((row) => {
    if (pmLevelFilter !== 'all' && row.pm_level?.toLowerCase() !== pmLevelFilter.toLowerCase()) {
      return false;
    }
    if (searchTrim !== '') {
      const hasVehicleMatch = visibleMonths.some((month) => {
        const val = row[month];
        if (!val) return false;
        return val.toLowerCase().includes(searchTrim);
      });
      if (!hasVehicleMatch) return false;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full bg-slate-950 min-h-screen text-slate-100 flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-100">Maintenance Forecast</h1>
            <p className="text-xs text-slate-400">12-month rolling schedule projection based on daily logs and service thresholds.</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer border border-slate-700 disabled:opacity-50 shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl flex flex-col flex-1 overflow-hidden">
        {/* Table Header & Collapsible Controls Toolbar */}
        <div className="p-4 border-b border-slate-800 space-y-3 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Schedule Matrix</h2>
              <p className="text-[11px] text-slate-400">Vehicle plate numbers and projected service dates grouped by PM level.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Vehicle Search Input */}
              <div className="relative flex items-center">
                <Car className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search vehicle plate..."
                  value={vehicleSearchQuery}
                  onChange={(e) => setVehicleSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-500 w-40 sm:w-48"
                />
                {vehicleSearchQuery && (
                  <button
                    onClick={() => setVehicleSearchQuery('')}
                    className="absolute right-2 text-slate-400 hover:text-slate-200 cursor-pointer"
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
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
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
                className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title={isControlsCollapsed ? "Expand Controls" : "Collapse Controls"}
              >
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">{isControlsCollapsed ? 'Slider' : 'Hide'}</span>
                {isControlsCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Collapsible Interactive Sliders Control Panel */}
          {!isControlsCollapsed && (
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-500/10 text-blue-400 rounded">
                  <Sliders className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200">Forecast Horizon Slider</span>
                  <p className="text-[10px] text-slate-400">Adjust the timeline window displayed in the matrix</p>
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
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[11px] font-semibold text-blue-400 bg-blue-950/60 border border-blue-800/50 px-2 py-0.5 rounded whitespace-nowrap min-w-18 text-center">
                  {forecastMonths} {forecastMonths === 1 ? 'Mo' : 'Mos'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Matrix Table with 2D Scroll (Up-Down & Left-Right) */}
        <div className="p-0 flex-1 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
              <span className="text-xs text-slate-400 font-medium">Loading maintenance forecast matrix...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-400">
              <AlertCircle className="w-7 h-7" />
              <span className="text-xs font-medium">{error}</span>
              <button
                onClick={handleRefresh}
                className="mt-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-xs transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            /* Scroll Container sized to maximize vertical space and keep scrollbar visible */
            <div className={`overflow-auto transition-all duration-200 ${isControlsCollapsed ? 'max-h-[calc(100vh-170px)]' : 'max-h-[calc(100vh-250px)]'}`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    {/* Sticky top AND left for top-left header cell */}
                    <th className="py-3 px-4 sticky top-0 left-0 z-30 bg-slate-950 w-24 text-center border-r border-slate-800 shadow-sm">
                      PM Level
                    </th>
                    {/* Sticky top for all month columns */}
                    {visibleMonths.map((month) => (
                      <th key={month} className="py-3 px-4 min-w-52 text-center border-r border-slate-800/50 last:border-r-0 sticky top-0 z-20 bg-slate-950 shadow-sm">
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={visibleMonths.length + 1} className="text-center py-12 text-slate-500 italic">
                        No maintenance forecast records found for the selected search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        {/* Sticky left for first column in rows */}
                        <td className="py-2.5 px-4 sticky left-0 bg-slate-900 z-10 text-center font-bold text-slate-200 border-r border-slate-800 shadow-sm">
                          <span className="inline-block px-2 py-0.5 bg-blue-600/20 text-blue-400 border border-blue-800/40 rounded text-xs font-semibold">
                            {row.pm_level}
                          </span>
                        </td>
                        {visibleMonths.map((month) => {
                          const cellValue = row[month];
                          if (!cellValue) {
                            return (
                              <td key={month} className="py-2.5 px-4 align-top border-r border-slate-800/50 last:border-r-0">
                                <span className="text-slate-600 italic">-</span>
                              </td>
                            );
                          }

                          const items = cellValue.split(', ').map((item) => item.trim()).filter(Boolean);
                          const filteredItems = searchTrim === ''
                            ? items
                            : items.filter((item) => item.toLowerCase().includes(searchTrim));

                          return (
                            <td key={month} className="py-2.5 px-4 align-top border-r border-slate-800/50 last:border-r-0">
                              {filteredItems.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {filteredItems.map((item, i) => (
                                    <span
                                      key={i}
                                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium shadow-2xs whitespace-nowrap ${
                                        searchTrim !== '' && item.toLowerCase().includes(searchTrim)
                                          ? 'bg-blue-600/30 text-blue-200 border border-blue-600/50 font-semibold'
                                          : 'bg-slate-950 text-slate-300 border border-slate-800'
                                      }`}
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