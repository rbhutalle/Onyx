import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Car, X, AlertCircle, Loader2 } from 'lucide-react';

interface VehiclePm {
  plate_no: string;
  service_rdg: number | null;
  make_name: string | null;
  model_name: string | null;
  type_description: string | null;
  timezone?: string | null;
  id?: string;
  vehicle_id?: string;
  [key: string]: unknown;
}

export function VehiclePmViewer() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vehicles, setVehicles] = useState<VehiclePm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePm | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchVehicles = async (queryToRun?: string) => {
    try {
      setLoading(true);
      setError(null);
      const activeQuery = queryToRun !== undefined ? queryToRun : searchQuery;

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
      setVehicles(data || []);
    } catch (err: unknown) {
      const errorMessage = 
        err && typeof err === 'object' && 'message' in err 
          ? String((err as { message: unknown }).message) 
          : err instanceof Error 
            ? err.message 
            : String(err);
      console.error('Error fetching vehicle PM details:', errorMessage);
      setError('Failed to load vehicle records. Please verify table/view access.');
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
        if (isMounted) setVehicles(data || []);
      } catch (err: unknown) {
        if (isMounted) {
          const errorMessage = 
            err && typeof err === 'object' && 'message' in err 
              ? String((err as { message: unknown }).message) 
              : err instanceof Error 
                ? err.message 
                : String(err);
          console.error('Error fetching vehicle PM details:', errorMessage);
          setError('Failed to load vehicle records. Please verify table/view access.');
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVehicles(searchQuery);
  };

  const handleCompletePm = async (pmNum: number) => {
    if (!selectedVehicle) return;

    const vehicleId = selectedVehicle.id || selectedVehicle.vehicle_id;
    if (!vehicleId) {
      alert('Vehicle ID is missing from this record.');
      return;
    }

    try {
      setActionLoading(pmNum);

      const { error: rpcError } = await supabase.rpc('completed_vehicle_pm', {
        p_pm_level: pmNum,
        p_vehicle_id: vehicleId,
      });

      if (rpcError) throw rpcError;

      alert(`PM ${pmNum} successfully marked as completed for plate ${selectedVehicle.plate_no}!`);
      
      await fetchVehicles();
      setSelectedVehicle(null);
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

  // UI-side formatting & timezone adjustment based on service_thresholds.timezone
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
        timeZone: tz || undefined, // Adjusts display to the threshold timezone without touching raw data
      }).format(date);
    } catch {
      return String(val);
    }
  };

  return (
    <div className="p-6 w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Vehicle PM Details</h1>
          <p className="text-sm text-slate-400">View maintenance plan details and vehicle telemetry.</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search Plate No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-800 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Plate No</th>
                <th className="py-3 px-4 font-semibold">Service Reading</th>
                <th className="py-3 px-4 font-semibold">Make</th>
                <th className="py-3 px-4 font-semibold">Model</th>
                <th className="py-3 px-4 font-semibold">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <span>Loading vehicle records...</span>
                    </div>
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No vehicle records found.
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle, index) => {
                  const hasAnyFlag = [2, 3, 4, 5, 6, 7].some((pmNum) => {
                    const rawFlag = vehicle[`pm${pmNum}_flag`];
                    return rawFlag === true || rawFlag === 'true' || rawFlag === 'TRUE' || rawFlag === 1;
                  });

                  return (
                    <tr
                      key={index}
                      onClick={() => setSelectedVehicle(vehicle)}
                      className={`transition-colors cursor-pointer group ${
                        hasAnyFlag
                          ? 'bg-red-950/30 hover:bg-red-950/50 border-l-4 border-red-500'
                          : 'hover:bg-blue-950/35'
                      }`}
                      title={hasAnyFlag ? 'Attention: Maintenance flag active!' : 'Click row to view full details'}
                    >
                      <td className="py-3 px-4 font-medium text-slate-100">
                        <div className="flex items-center gap-1.5 text-blue-400 group-hover:text-blue-300 font-semibold">
                          <Car className={`w-4 h-4 shrink-0 ${hasAnyFlag ? 'text-red-400' : 'text-blue-500 group-hover:scale-110'} transition-transform`} />
                          <span className={hasAnyFlag ? 'text-red-200 font-bold' : ''}>{vehicle.plate_no}</span>
                          {hasAnyFlag && (
                            <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-red-800/80 text-red-100 rounded uppercase tracking-wider font-bold">
                              PM Due
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`py-3 px-4 ${hasAnyFlag ? 'text-red-200' : 'text-slate-300'}`}>
                        {vehicle.service_rdg ?? 'N/A'}
                      </td>
                      <td className={`py-3 px-4 ${hasAnyFlag ? 'text-red-200' : 'text-slate-300'}`}>
                        {vehicle.make_name ?? 'N/A'}
                      </td>
                      <td className={`py-3 px-4 ${hasAnyFlag ? 'text-red-200' : 'text-slate-300'}`}>
                        {vehicle.model_name ?? 'N/A'}
                      </td>
                      <td className={`py-3 px-4 ${hasAnyFlag ? 'text-red-200' : 'text-slate-300'}`}>
                        {vehicle.type_description ?? 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-slate-100">
                  Vehicle PM Details: <span className="text-blue-400">{selectedVehicle.plate_no}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="block text-xs font-medium text-slate-400 uppercase">Plate Number</span>
                  <span className="text-sm font-semibold text-slate-100">{selectedVehicle.plate_no || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-400 uppercase">Service Reading</span>
                  <span className="text-sm font-semibold text-slate-100">{selectedVehicle.service_rdg ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-400 uppercase">Make / Model</span>
                  <span className="text-sm font-semibold text-slate-100">
                    {selectedVehicle.make_name || 'N/A'} {selectedVehicle.model_name ? `/ ${selectedVehicle.model_name}` : ''}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-400 uppercase">Type Description</span>
                  <span className="text-sm font-semibold text-slate-100">{selectedVehicle.type_description || 'N/A'}</span>
                </div>
              </div>

              {/* PM Schedule Breakdown Table */}
              <div>
                <h4 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider">PM Schedule Breakdown</h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="py-3 px-4 font-semibold">PM Level</th>
                        <th className="py-3 px-4 font-semibold">Previous PM</th>
                        <th className="py-3 px-4 font-semibold">PM Completed</th>
                        <th className="py-3 px-4 font-semibold">Current PM</th>
                        <th className="py-3 px-4 font-semibold">Next PM</th>
                        <th className="py-3 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {[2, 3, 4, 5, 6, 7].map((pmNum) => {
                        const prevVal = selectedVehicle[`pm${pmNum}_previous`] ?? selectedVehicle[`pm${pmNum}_prev`] ?? 'N/A';
                        const completedVal = selectedVehicle[`pm${pmNum}_datecompleted`];
                        const currVal = selectedVehicle[`pm${pmNum}_current`] ?? selectedVehicle[`pm${pmNum}_curr`] ?? 'N/A';
                        const nextVal = selectedVehicle[`pm${pmNum}_next`] ?? 'N/A';
                        
                        const rawFlag = selectedVehicle[`pm${pmNum}_flag`];
                        const isFlagged = rawFlag === true || rawFlag === 'true' || rawFlag === 'TRUE' || rawFlag === 1;
                        const isThisLoading = actionLoading === pmNum;

                        return (
                          <tr
                            key={pmNum}
                            className={`transition-colors ${
                              isFlagged
                                ? 'bg-red-950/30 text-red-400 font-semibold'
                                : 'text-slate-300 hover:bg-slate-900/50'
                            }`}
                          >
                            <td className="py-3 px-4 font-medium text-slate-100">PM {pmNum}</td>
                            <td className="py-3 px-4">{String(prevVal)}</td>
                            <td className="py-3 px-4 text-slate-300 font-mono text-xs">
                              {formatDateTime(completedVal, selectedVehicle.timezone)}
                            </td>
                            <td className="py-3 px-4">{String(currVal)}</td>
                            <td className="py-3 px-4">{String(nextVal)}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                disabled={!isFlagged || isThisLoading}
                                onClick={() => isFlagged && !isThisLoading && handleCompletePm(pmNum)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ml-auto ${
                                  isFlagged
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm'
                                    : 'bg-slate-800/50 text-slate-600 cursor-not-allowed opacity-50'
                                }`}
                              >
                                {isThisLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Completed
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-6 py-3 border-t border-slate-800 bg-slate-950">
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
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