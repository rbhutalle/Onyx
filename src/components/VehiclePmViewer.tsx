import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Car, X, AlertCircle, Loader2, ClipboardList, Calendar } from 'lucide-react';

interface EquipmentPm {
  plate_no: string;
  service_rdg: number | null;
  make_name: string | null;
  model_name: string | null;
  type_description: string | null;
  timezone?: string | null;
  id?: string;
  vehicle_id?: string;
  vehicle_uuid?: string;
  [key: string]: unknown;
}

interface DailyLogItem {
  log_id: string;
  log_date: string;
  previous_rdg: number;
  daily_increment: number;
  current_rdg: number;
  operations_id?: string | null;
  [key: string]: unknown;
}

interface OperationsStatus {
  operations_id: string;
  status_name?: string;
}

export function VehiclePmViewer() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [equipmentList, setEquipmentList] = useState<EquipmentPm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentPm | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Modal Tab State: 'pm' or 'logs'
  const [activeTab, setActiveTab] = useState<'pm' | 'logs'>('pm');

  // Daily Inspection Logs & Operations Status Map
  const [dailyLogs, setDailyLogs] = useState<DailyLogItem[]>([]);
  const [operationsMap, setOperationsMap] = useState<Record<string, string>>({});
  const [logsLoading, setLogsLoading] = useState<boolean>(false);

  const fetchEquipment = async (queryToRun?: string) => {
    try {
      setLoading(true);
      setError(null);
      const activeQuery = (queryToRun !== undefined ? queryToRun : searchQuery) ?? '';

      let query = supabase
        .from('vw_vehicle_pm_details')
        .select('*')
        .order('plate_no', { ascending: true })
        .limit(50);

      if (activeQuery.trim()) {
        query = query.ilike('plate_no', `%${activeQuery.trim()}%`);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      const updatedEquipment = data || [];
      setEquipmentList(updatedEquipment);

      // Live-sync selectedEquipment if modal is open so readings and flags update instantly
      setSelectedEquipment((prevSelected) => {
        if (!prevSelected) return null;
        const prevId = prevSelected.vehicle_id || prevSelected.id || prevSelected.vehicle_uuid;
        const matched = updatedEquipment.find(
          (eq) => (eq.vehicle_id || eq.id || eq.vehicle_uuid) === prevId
        );
        return matched || prevSelected;
      });
    } catch (err: unknown) {
      const errorMessage = 
        err && typeof err === 'object' && 'message' in err 
          ? String((err as { message: unknown }).message) 
          : err instanceof Error 
            ? err.message 
            : String(err);
      console.error('Error fetching equipment PM details:', errorMessage);
      setError('Failed to load equipment records. Please verify table/view access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        const { data, error: fetchError } = await supabase
          .from('vw_vehicle_pm_details')
          .select('*')
          .order('plate_no', { ascending: true })
          .limit(50);

        if (fetchError) throw fetchError;
        if (isMounted) setEquipmentList(data || []);
      } catch (err: unknown) {
        if (isMounted) {
          const errorMessage = 
            err && typeof err === 'object' && 'message' in err 
              ? String((err as { message: unknown }).message) 
              : err instanceof Error 
                ? err.message 
                : String(err);
          console.error('Error fetching equipment PM details:', errorMessage);
          setError('Failed to load equipment records. Please verify table/view access.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Daily Logs and Operations Status Mapping when Tab 2 is active
  useEffect(() => {
    if (!selectedEquipment || activeTab !== 'logs') return;

    const equipmentId = selectedEquipment.vehicle_id || selectedEquipment.id || selectedEquipment.vehicle_uuid;
    if (!equipmentId) return;

    async function fetchEquipmentLogsAndStatuses() {
      try {
        setLogsLoading(true);

        const [logsRes, statusRes] = await Promise.all([
          supabase
            .from('vehicle_daily_logs')
            .select('log_id, log_date, previous_rdg, daily_increment, current_rdg, operations_id')
            .eq('vehicle_id', equipmentId)
            .order('log_date', { ascending: false }),
          supabase
            .from('operations_status')
            .select('operations_id, status_name')
        ]);

        if (logsRes.error) throw logsRes.error;
        if (statusRes.error) throw statusRes.error;

        const map: Record<string, string> = {};
        if (statusRes.data) {
          (statusRes.data as OperationsStatus[]).forEach((op) => {
            map[op.operations_id] = String(op.status_name ?? 'N/A');
          });
        }

        setOperationsMap(map);
        setDailyLogs((logsRes.data as unknown as DailyLogItem[]) || []);
      } catch (err) {
        console.error('Error fetching equipment daily logs:', err);
      } finally {
        setLogsLoading(false);
      }
    }

    fetchEquipmentLogsAndStatuses();
  }, [selectedEquipment, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEquipment(searchQuery);
  };

  const handleCompletePm = async (pmNum: number) => {
    if (!selectedEquipment) return;

    const equipmentId = selectedEquipment.vehicle_id || selectedEquipment.id || selectedEquipment.vehicle_uuid;
    if (!equipmentId) {
      alert('Equipment ID is missing from this record.');
      return;
    }

    try {
      setActionLoading(pmNum);

      const { error: rpcError } = await supabase.rpc('completed_vehicle_pm', {
        p_pm_level: pmNum,
        p_vehicle_id: equipmentId,
      });

      if (rpcError) throw rpcError;

      alert(`PM ${pmNum} successfully marked as completed for equipment ID ${selectedEquipment.plate_no}!`);
      
      // Refresh list and sync selected modal equipment state
      await fetchEquipment();
    } catch (err: unknown) {
      const errorMessage = 
        err && typeof err === 'object' && 'message' in err 
          ? String((err as { message: unknown }).message) 
          : err instanceof Error 
            ? err.message 
            : String(err);

      console.error('Error completing PM:', err);
      alert(`Failed to complete PM: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDateTime = (val: unknown, tz?: string | null) => {
    if (!val) return '—';
    try {
      const date = new Date(String(val));
      if (isNaN(date.getTime())) return String(val);

      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: tz || undefined,
      }).format(date);
    } catch {
      return String(val);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-300 dark:border-slate-800 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Equipment PM Details</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">View maintenance plan details and equipment telemetry.</p>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search Equipment ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-2.5 rounded-lg flex items-center gap-3 text-xs shrink-0">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Body Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-slate-50/90 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 shadow-xl overflow-hidden space-y-3">
        <div className="flex flex-col flex-1 min-h-0 space-y-2">
          {/* Scrollable Table Wrapper */}
          <div className="flex-1 min-h-0 overflow-auto border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold sticky top-0 z-10 shadow-xs">
                  <th className="py-2 px-3">Equipment ID</th>
                  <th className="py-2 px-3">Service Reading</th>
                  <th className="py-2 px-3">Make</th>
                  <th className="py-2 px-3">Model</th>
                  <th className="py-2 px-3">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        <span>Loading equipment records...</span>
                      </div>
                    </td>
                  </tr>
                ) : equipmentList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      No equipment records found.
                    </td>
                  </tr>
                ) : (
                  equipmentList.map((equipment, index) => {
                    const hasAnyFlag = [2, 3, 4, 5, 6, 7].some((pmNum) => {
                      const rawFlag = equipment[`pm${pmNum}_flag`];
                      return rawFlag === true || String(rawFlag ?? '').toLowerCase() === 'true' || rawFlag === 1;
                    });

                    return (
                      <tr
                        key={equipment.id || equipment.vehicle_id || index}
                        onClick={() => {
                          setSelectedEquipment(equipment);
                          setActiveTab('pm');
                        }}
                        className={`transition-colors cursor-pointer group ${
                          hasAnyFlag
                            ? 'bg-red-50/70 hover:bg-red-100/80 dark:bg-red-950/30 dark:hover:bg-red-950/50 border-l-4 border-red-500'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                        }`}
                        title={hasAnyFlag ? 'Attention: Maintenance flag active!' : 'Click row to view full details'}
                      >
                        <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 font-semibold">
                            <Car className={`w-3.5 h-3.5 shrink-0 ${hasAnyFlag ? 'text-red-500' : 'text-blue-500 group-hover:scale-110'} transition-transform`} />
                            <span className={hasAnyFlag ? 'text-red-700 dark:text-red-200 font-bold' : ''}>{equipment.plate_no || 'N/A'}</span>
                            {hasAnyFlag && (
                              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-red-100 dark:bg-red-800/80 text-red-700 dark:text-red-100 border border-red-200 dark:border-red-700 rounded uppercase tracking-wider font-bold">
                                PM Due
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`py-2 px-3 ${hasAnyFlag ? 'text-red-700 dark:text-red-200' : 'text-slate-700 dark:text-slate-300'}`}>
                          {equipment.service_rdg ?? 'N/A'}
                        </td>
                        <td className={`py-2 px-3 ${hasAnyFlag ? 'text-red-700 dark:text-red-200' : 'text-slate-700 dark:text-slate-300'}`}>
                          {equipment.make_name ?? 'N/A'}
                        </td>
                        <td className={`py-2 px-3 ${hasAnyFlag ? 'text-red-700 dark:text-red-200' : 'text-slate-700 dark:text-slate-300'}`}>
                          {equipment.model_name ?? 'N/A'}
                        </td>
                        <td className={`py-2 px-3 ${hasAnyFlag ? 'text-red-700 dark:text-red-200' : 'text-slate-700 dark:text-slate-300'}`}>
                          {equipment.type_description ?? 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EQUIPMENT PM DETAILS MODAL */}
      {selectedEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Equipment PM Details: <span className="text-blue-600 dark:text-blue-400">{selectedEquipment.plate_no || 'N/A'}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEquipment(null)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
              
              {/* Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 text-xs">
                <div>
                  <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Equipment ID</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{selectedEquipment.plate_no || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Service Reading</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{selectedEquipment.service_rdg ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Make / Model</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {selectedEquipment.make_name || 'N/A'} {selectedEquipment.model_name ? `/ ${selectedEquipment.model_name}` : ''}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Type Description</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{selectedEquipment.type_description || 'N/A'}</span>
                </div>
              </div>

              {/* Modal Tabs Navigation */}
              <div className="flex border-b border-slate-300 dark:border-slate-800 gap-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('pm')}
                  className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
                    activeTab === 'pm'
                      ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  PM Schedule Breakdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('logs')}
                  className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
                    activeTab === 'logs'
                      ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  Daily Inspection Log
                </button>
              </div>

              {/* Tab 1: PM Schedule Breakdown */}
              {activeTab === 'pm' && (
                <div className="border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold sticky top-0 z-10">
                        <th className="py-2 px-3">PM Level</th>
                        <th className="py-2 px-3">Previous PM</th>
                        <th className="py-2 px-3">PM Completed</th>
                        <th className="py-2 px-3">Current PM</th>
                        <th className="py-2 px-3">Next PM</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {[2, 3, 4, 5, 6, 7].map((pmNum) => {
                        const prevVal = selectedEquipment[`pm${pmNum}_previous`] ?? selectedEquipment[`pm${pmNum}_prev`] ?? 'N/A';
                        const completedVal = selectedEquipment[`pm${pmNum}_datecompleted`];
                        const currVal = selectedEquipment[`pm${pmNum}_current`] ?? selectedEquipment[`pm${pmNum}_curr`] ?? 'N/A';
                        const nextVal = selectedEquipment[`pm${pmNum}_next`] ?? 'N/A';
                        
                        const rawFlag = selectedEquipment[`pm${pmNum}_flag`];
                        const isFlagged = rawFlag === true || String(rawFlag ?? '').toLowerCase() === 'true' || rawFlag === 1;
                        const isThisLoading = actionLoading === pmNum;

                        return (
                          <tr
                            key={pmNum}
                            className={`transition-colors ${
                              isFlagged
                                ? 'bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-semibold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                            }`}
                          >
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">PM {pmNum}</td>
                            <td className="py-2 px-3">{String(prevVal)}</td>
                            <td className="py-2 px-3 font-mono text-xs">
                              {formatDateTime(completedVal, selectedEquipment.timezone)}
                            </td>
                            <td className="py-2 px-3">{String(currVal)}</td>
                            <td className="py-2 px-3">{String(nextVal)}</td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                disabled={!isFlagged || isThisLoading}
                                onClick={() => isFlagged && !isThisLoading && handleCompletePm(pmNum)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ml-auto ${
                                  isFlagged
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                                }`}
                              >
                                {isThisLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                Completed
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2: Daily Inspection Log */}
              {activeTab === 'logs' && (
                <div className="border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold sticky top-0 z-10">
                        <th className="py-2 px-3">Log Date</th>
                        <th className="py-2 px-3">Previous Reading</th>
                        <th className="py-2 px-3">Daily Increment</th>
                        <th className="py-2 px-3">Current Reading</th>
                        <th className="py-2 px-3">Operations Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {logsLoading ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                            <div className="flex justify-center items-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                              <span>Loading inspection logs...</span>
                            </div>
                          </td>
                        </tr>
                      ) : dailyLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400 italic">
                            No inspection logs found for this equipment.
                          </td>
                        </tr>
                      ) : (
                        dailyLogs.map((log) => {
                          const statusName = log.operations_id && operationsMap[log.operations_id] 
                            ? operationsMap[log.operations_id] 
                            : '—';

                          return (
                            <tr key={log.log_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                              <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">{log.log_date}</td>
                              <td className="py-2 px-3 font-mono">{log.previous_rdg ?? '—'}</td>
                              <td className="py-2 px-3 font-mono text-emerald-600 dark:text-emerald-400">+{log.daily_increment ?? '0'}</td>
                              <td className="py-2 px-3 font-mono">{log.current_rdg ?? '—'}</td>
                              <td className="py-2 px-3">
                                <span className="inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 rounded text-[11px] font-medium">
                                  {statusName}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-6 py-3 border-t border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedEquipment(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default VehiclePmViewer;