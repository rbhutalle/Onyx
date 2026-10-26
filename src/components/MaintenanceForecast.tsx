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
      } catch {
        if (isMounted) setError('Failed to load maintenance forecast schedule.');
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
    } catch {
      setError('Failed to refresh maintenance forecast schedule.');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-(--border-main) pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 rounded-xl shadow-xs shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Maintenance Forecast</h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">12-month rolling schedule projection based on daily logs and service thresholds.</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-(--bg-surface) hover:bg-(--accent-subtle) text-(--text-primary) text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-(--border-main) disabled:opacity-50 shadow-xs self-start sm:self-auto shrink-0"
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
      <div className="bg-(--bg-elevated) border border-(--border-main) rounded-xl p-4 shadow-xl overflow-hidden space-y-3 flex flex-col flex-1 min-h-0">
        
        {/* Table Header & Collapsible Controls Toolbar */}
        <div className="border-b border-(--border-main) pb-3 space-y-3 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold text-(--text-primary) uppercase tracking-wider">Schedule Matrix</h2>
              <p className="text-[11px] text-(--text-muted)">Equipment ID and projected service dates grouped by PM level.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Vehicle Search Input */}
              <div className="relative flex items-center">
                <Car className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search Equipment ID..."
                  value={vehicleSearchQuery}
                  onChange={(e) => setVehicleSearchQuery(e.target.value)}
                  className="bg-(--bg-elevated) border border-(--border-main) rounded-lg pl-8 pr-7 py-1.5 text-xs text-(--text-primary) focus:outline-none focus:border-(--text-primary) placeholder:text-(--text-muted) w-40 sm:w-48"
                />
                {vehicleSearchQuery && (
                  <button
                    onClick={() => setVehicleSearchQuery('')}
                    className="absolute right-2 text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* PM Level Filter Dropdown */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-(--text-muted)" />
                <select
                  value={pmLevelFilter}
                  onChange={(e) => setPmLevelFilter(e.target.value)}
                  className="bg-(--bg-elevated) border border-(--border-main) rounded-lg px-2.5 py-1.5 text-xs text-(--text-primary) focus:outline-none focus:border-(--text-primary) cursor-pointer"
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
                className="p-1.5 bg-(--bg-surface) hover:bg-(--accent-subtle) text-(--text-primary) border border-(--border-main) rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title={isControlsCollapsed ? "Expand Controls" : "Collapse Controls"}
              >
                <Sliders className="w-3.5 h-3.5 text-(--text-primary)" />
                <span className="hidden sm:inline font-semibold">{isControlsCollapsed ? 'Slider' : 'Hide'}</span>
                {isControlsCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Collapsible Interactive Sliders Control Panel */}
          {!isControlsCollapsed && (
            <div className="bg-(--bg-surface) border border-(--border-main) rounded-lg p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-(--accent-subtle) text-(--text-primary) rounded">
                  <Sliders className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-(--text-primary)">Forecast Horizon Slider</span>
                  <p className="text-[10px] text-(--text-muted)">Adjust the timeline window displayed in the matrix</p>
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
                  className="w-full h-1 bg-(--border-main) rounded-lg appearance-none cursor-pointer accent-(--text-primary)"
                />
                <span className="text-[11px] font-semibold text-(--text-primary) bg-(--accent-subtle) border border-(--border-main) px-2 py-0.5 rounded whitespace-nowrap min-w-18 text-center">
                  {forecastMonths} {forecastMonths === 1 ? 'Mo' : 'Mos'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sub-tab content panel & Scrollable 2D Table Matrix */}
        <div className="flex flex-col flex-1 min-h-0 space-y-2">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 border border-(--border-main) rounded-lg bg-(--bg-surface)">
              <Loader2 className="w-6 h-6 animate-spin text-(--text-primary)" />
              <span className="text-xs text-(--text-muted) font-medium">Loading maintenance forecast matrix...</span>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-surface)">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) bg-(--bg-elevated) text-(--text-muted) text-[11px] font-semibold uppercase tracking-wider">
                    {/* Sticky top AND left for top-left header cell */}
                    <th className="py-2 px-3 sticky top-0 left-0 z-30 bg-(--bg-elevated) w-24 text-center border-r border-(--border-main) shadow-xs">
                      PM Level
                    </th>
                    {/* Sticky top for all month columns */}
                    {visibleMonths.map((month) => (
                      <th key={month} className="py-2 px-3 min-w-52 text-center border-r border-(--border-main) last:border-r-0 sticky top-0 z-20 bg-(--bg-elevated) shadow-xs">
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={visibleMonths.length + 1} className="text-center py-12 text-(--text-muted) italic text-xs">
                        No maintenance forecast records found for the selected search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-(--accent-subtle) transition-colors">
                        {/* Sticky left for first column in rows */}
                        <td className="py-2 px-3 sticky left-0 bg-(--bg-elevated) z-10 text-center font-bold text-(--text-primary) border-r border-(--border-main) shadow-xs">
                          <span className="inline-block px-2 py-0.5 bg-(--accent-subtle) text-(--text-primary) border border-(--border-main) rounded text-xs font-semibold">
                            {row?.pm_level ?? '—'}
                          </span>
                        </td>
                        {visibleMonths.map((month) => {
                          const cellValue = row?.[month];
                          if (!cellValue) {
                            return (
                              <td key={month} className="py-2 px-3 align-top border-r border-(--border-main) last:border-r-0">
                                <span className="text-(--text-muted) italic">-</span>
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
                            <td key={month} className="py-2 px-3 align-top border-r border-(--border-main) last:border-r-0">
                              {filteredItems.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {filteredItems.map((item, i) => {
                                    const isMatch = searchTrim !== '' && item.toLowerCase().includes(searchTrim);
                                    return (
                                      <span
                                        key={i}
                                        className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${
                                          isMatch
                                            ? 'bg-(--accent-subtle) text-(--text-primary) border border-(--border-main) font-semibold'
                                            : 'bg-(--bg-elevated) text-(--text-secondary) border border-(--border-main)'
                                        }`}
                                      >
                                        {item}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-(--text-muted) italic">-</span>
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