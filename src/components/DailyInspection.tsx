import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ClipboardList, Search, Calendar, Gauge, FileText, Loader2, CheckCircle, X, AlertCircle, Car, Activity } from 'lucide-react';

interface VehiclePm {
  plate_no: string;
  service_rdg: number | null;
  make_name: string | null;
  model_name: string | null;
  type_description: string | null;
  id?: string;
  vehicle_id?: string;
  [key: string]: unknown;
}

interface OperationsStatus {
  operations_id: string;
  name?: string;
  status_name?: string;
  description?: string;
  [key: string]: unknown;
}

export function DailyInspection() {
  const [vehicles, setVehicles] = useState<VehiclePm[]>([]);
  const [operationsStatuses, setOperationsStatuses] = useState<OperationsStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePm | null>(null);
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentReading, setCurrentReading] = useState<string>('');
  const [operationsId, setOperationsId] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Previous reading pulled directly from vehicle service reading
  const previousRdg = selectedVehicle && selectedVehicle.service_rdg !== null && selectedVehicle.service_rdg !== undefined 
    ? Number(selectedVehicle.service_rdg) 
    : 0;

  const numericCurrentRdg = Number(currentReading) || 0;
  
  // Computed Daily Increment = Current Reading - Previous Reading
  const computedDailyIncrement = numericCurrentRdg >= previousRdg ? numericCurrentRdg - previousRdg : 0;

  const fetchData = async (queryToRun?: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const activeQuery = queryToRun !== undefined ? queryToRun : searchQuery;

      let vehicleQuery = supabase
        .from('vw_vehicle_pm_details')
        .select('*')
        .order('plate_no', { ascending: true })
        .limit(50);

      if (activeQuery.trim()) {
        vehicleQuery = vehicleQuery.ilike('plate_no', `%${activeQuery.trim()}%`);
      }

      const [vehicleRes, statusRes] = await Promise.all([
        vehicleQuery,
        supabase.from('operations_status').select('*')
      ]);

      if (vehicleRes.error) throw vehicleRes.error;
      if (statusRes.error) throw statusRes.error;

      setVehicles(vehicleRes.data || []);
      setOperationsStatuses(statusRes.data || []);
    } catch (err: unknown) {
      console.error('Error fetching data:', err);
      setErrorMsg('Failed to load vehicle or operations status records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        const [vehicleRes, statusRes] = await Promise.all([
          supabase.from('vw_vehicle_pm_details').select('*').order('plate_no', { ascending: true }).limit(50),
          supabase.from('operations_status').select('*')
        ]);

        if (vehicleRes.error) throw vehicleRes.error;
        if (statusRes.error) throw statusRes.error;

        if (isMounted) {
          setVehicles(vehicleRes.data || []);
          setOperationsStatuses(statusRes.data || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Error loading initial data:', err);
          setErrorMsg('Failed to load initial records. Please try again later.');
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
    fetchData(searchQuery);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedVehicle) {
      setErrorMsg('Please select a vehicle first.');
      return;
    }
    if (!currentReading || isNaN(Number(currentReading))) {
      setErrorMsg('Please enter a valid numeric current reading.');
      return;
    }
    if (numericCurrentRdg < previousRdg) {
      setErrorMsg('Current reading cannot be less than the previous vehicle service reading.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const vehicleId = selectedVehicle.vehicle_id || selectedVehicle.id;
      if (!vehicleId) {
        throw new Error('Vehicle ID is missing from the selected record.');
      }

      // Explicitly passing previous_rdg and current_rdg to the RPC function
      const { error: rpcError } = await supabase.rpc('record_vehicle_daily_log', {
        p_vehicle_id: vehicleId,
        p_log_date: logDate,
        p_previous_rdg: previousRdg,
        p_current_rdg: numericCurrentRdg,
        p_daily_increment: computedDailyIncrement,
        p_remarks: remarks.trim() || null,
        p_operations_id: operationsId || null,
      });

      if (rpcError) throw rpcError;

      setSuccessMsg(`Daily inspection successfully recorded for plate ${selectedVehicle.plate_no}!`);
      setCurrentReading('');
      setOperationsId('');
      setRemarks('');
      setSelectedVehicle(null);
      await fetchData();

      setTimeout(() => {
        setSuccessMsg(null);
      }, 2000);

    } catch (err: unknown) {
      console.error('Error recording daily log (Internal):', err);

      let userFriendlyMessage = 'Failed to record daily inspection. Please try again.';

      if (err && typeof err === 'object') {
        const supabaseErr = err as { code?: string };

        switch (supabaseErr.code) {
          case '23505':
            userFriendlyMessage = 'A daily inspection log for this vehicle on this date already exists.';
            break;
          case '42501':
            userFriendlyMessage = 'You do not have permission to perform this action.';
            break;
          case '23503':
            userFriendlyMessage = 'The selected vehicle record or operations status is invalid.';
            break;
          case '23514':
            userFriendlyMessage = 'The provided values violate system validation rules.';
            break;
          default:
            userFriendlyMessage = 'An unexpected error occurred while saving the log. Please verify your inputs.';
            break;
        }
      }

      setErrorMsg(userFriendlyMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <ClipboardList className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Daily Inspection Log</h1>
          <p className="text-sm text-slate-400">Record daily telemetry increments and mileage/hour readings for active vehicles.</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-950/50 border border-red-800 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Scroller Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto">
          
          {/* Vehicle Selector Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Selected Vehicle <span className="text-red-500">*</span>
            </label>
            
            {selectedVehicle ? (
              <div className="flex items-center justify-between bg-slate-950 border border-blue-900/60 p-4 rounded-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-sm">
                  <div>
                    <span className="text-xs text-slate-400 uppercase">Plate Number</span>
                    <div className="font-bold text-blue-400 text-base">{selectedVehicle.plate_no}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase">Current Reading</span>
                    <div className="font-semibold text-slate-100">{selectedVehicle.service_rdg ?? '0'}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase">Make / Model</span>
                    <div className="font-semibold text-slate-100">{selectedVehicle.make_name || 'N/A'} {selectedVehicle.model_name ? `/ ${selectedVehicle.model_name}` : ''}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase">Type</span>
                    <div className="font-semibold text-slate-100">{selectedVehicle.type_description || 'N/A'}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVehicle(null)}
                  className="text-slate-400 hover:text-red-400 p-2 transition-colors cursor-pointer"
                  title="Change vehicle"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500 text-slate-300 px-4 py-3 rounded-xl text-sm flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-400" />
                  {vehicles.length > 0 ? `Click here to select a vehicle (${vehicles.length} loaded)...` : 'Click here to select a vehicle...'}
                </span>
                <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded font-medium">Browse</span>
              </button>
            )}
          </div>

          {/* Date, Current Reading, and Operations Status Grid (3 columns on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                Log Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-blue-400" />
                Current Reading <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 15200.00"
                value={currentReading}
                onChange={(e) => setCurrentReading(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-400" />
                Operations Status
              </label>
              <select
                value={operationsId}
                onChange={(e) => setOperationsId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">Select status (optional)...</option>
                {operationsStatuses.map((op) => {
                  const label = String(op.status_name || op.name || op.description || op.operations_id);
                  return (
                    <option key={op.operations_id} value={op.operations_id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Telemetry Display Grid (Previous Reading & Computed Daily Increment Preview) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Previous Reading</span>
              <div className="text-lg font-mono font-bold text-blue-400">
                {previousRdg.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-500">Pulled from vehicle service reading</span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Computed Daily Increment</span>
              <div className="text-lg font-mono font-bold text-emerald-400">
                {computedDailyIncrement.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-500">Current Reading - Previous Reading</span>
            </div>
          </div>

          {/* Remarks Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" />
              Remarks / Route Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Standard delivery route, minor maintenance check performed..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Explicitly Visible Save/Submit Button */}
          <div className="flex items-center justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={submitting || !selectedVehicle}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xl"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Record Daily Inspection
            </button>
          </div>
        </form>
      </div>

      {/* Vehicle Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950">
              <h3 className="text-lg font-semibold text-slate-100">Select Vehicle</h3>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="p-4 border-b border-slate-800 bg-slate-950/50 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by Plate Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
              {loading ? (
                <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span>Loading vehicle records...</span>
                </div>
              ) : vehicles.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  No vehicle records found.
                </div>
              ) : (
                vehicles.map((v, index) => (
                  <div
                    key={v.vehicle_id || v.id || index}
                    onClick={() => {
                      setSelectedVehicle(v);
                      setShowPicker(false);
                    }}
                    className="flex items-center justify-between bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-600/50 p-3 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 rounded-lg group-hover:bg-blue-900/40 text-blue-400 transition-colors">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-blue-400">{v.plate_no}</div>
                        <div className="text-xs text-slate-400">
                          {v.make_name || 'N/A'} {v.model_name ? `/ ${v.model_name}` : ''} ({v.type_description || 'N/A'})
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 uppercase">Service Rdg</span>
                      <div className="text-sm font-semibold text-slate-200">{v.service_rdg ?? '0'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyInspection;