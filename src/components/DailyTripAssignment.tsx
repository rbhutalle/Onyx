import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Fuel,
  User,
  Car,
  Calendar as CalendarIcon,
  Search,
  Filter
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface EmployeeOption {
  employee_id: string;
  employee_code: string;
  employee_name: string;
  rate_per_hour?: number;
}

interface VehicleOption {
  vehicle_id: string;
  plate_no: string;
  conduction_no?: string;
  year?: number;
  service_rdg?: number;
}

interface RouteOption {
  route_id: string;
  route_code?: string;
  origin?: string;
  destination?: string;
  standard_fuel_liters?: number;
  buffer_allowance_liters?: number;
}

interface TripDetailInput {
  trip_iddet?: string;
  route_id: string;
  standard_fuel_liters: number;
  buffer_allowance_liters: number;
}

interface TripAssignmentRecord {
  trip_id: string;
  driver_id: string;
  vehicle_id?: string | null;
  trip_date: string;
  total_standard_fuel: number;
  total_buffer_fuel: number;
  total_fuel_allotted: number;
  total_actual_fuel?: number;
  created_at?: string;
  employees?: EmployeeOption | null;
  vehicles?: VehicleOption | null;
  trip_assignment_details?: TripDetailInput[];
  [key: string]: unknown;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const actualPages = Math.max(1, totalPages);

  return (
    <div className="shrink-0 flex items-center justify-between px-3 py-2 border-t border-(--border-main) bg-(--bg-surface) text-xs">
      <div className="text-(--text-muted)">
        Showing <span className="font-semibold text-(--text-primary)">{startItem}</span> to{' '}
        <span className="font-semibold text-(--text-primary)">{endItem}</span> of{' '}
        <span className="font-semibold text-(--text-primary)">{totalItems}</span> entries
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-(--border-main) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: actualPages }, (_, i) => i + 1).map((page) => {
            const isCurrent = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-(--accent-subtle) border-(--text-primary) text-(--text-primary)'
                    : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= actualPages}
          className="p-1.5 rounded-lg border border-(--border-main) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function DailyTripAssignment() {
  const [trips, setTrips] = useState<TripAssignmentRecord[]>([]);
  const [drivers, setDrivers] = useState<EmployeeOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);

  // Filters & Pagination — Default Date Filter set to current date
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [routeSearchQueries, setRouteSearchQueries] = useState<{ [index: number]: string }>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [driverId, setDriverId] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [tripDate, setTripDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [details, setDetails] = useState<TripDetailInput[]>([]);

  // Fetch Available Drivers & Vehicles for the selected Trip Date
  const loadAvailableResources = useCallback(async (dateStr: string, currentEditingDriverId?: string, currentEditingVehicleId?: string, currentEditingTripId?: string) => {
    try {
      // 1. Fetch available drivers
      const { data: allDrivers, error: empErr } = await supabase
        .from('employees')
        .select('employee_id, employee_code, employee_name, rate_per_hour')
        .eq('is_active', true)
        .eq('is_driver', true)
        .order('employee_name', { ascending: true });

      if (empErr) throw empErr;

      // 2. Fetch available vehicles based on active status and date assignment check
      const { data: allVehicles, error: vehErr } = await supabase
        .from('vehicles')
        .select('vehicle_id, plate_no, conduction_no, year, service_rdg')
        .eq('is_active', true)
        .order('plate_no', { ascending: true });

      if (vehErr) throw vehErr;

      // 3. Fetch existing trip assignments for this date
      const { data: assignedTrips, error: tripErr } = await supabase
        .from('trip_assignments')
        .select('driver_id, vehicle_id, trip_id')
        .eq('trip_date', dateStr);

      if (tripErr) throw tripErr;

      const assignedDriverIds = new Set(
        (assignedTrips || [])
          .filter((t) => !currentEditingTripId || t.trip_id !== currentEditingTripId)
          .map((t) => t.driver_id)
          .filter(Boolean)
      );

      const assignedVehicleIds = new Set(
        (assignedTrips || [])
          .filter((t) => !currentEditingTripId || t.trip_id !== currentEditingTripId)
          .map((t) => t.vehicle_id)
          .filter(Boolean)
      );

      const filteredDrivers = (allDrivers || []).filter(
        (d) => !assignedDriverIds.has(d.employee_id) || d.employee_id === currentEditingDriverId
      );

      const filteredVehicles = (allVehicles || []).filter(
        (v) => !assignedVehicleIds.has(v.vehicle_id) || v.vehicle_id === currentEditingVehicleId
      );

      setDrivers(filteredDrivers);
      setVehicles(filteredVehicles);
    } catch {
      setErrorMsg('Failed to load available drivers and vehicles.');
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      setErrorMsg(null);
      const [tripsRes, routesRes] = await Promise.all([
        supabase
          .from('trip_assignments')
          .select('*, employees(*), vehicles(*), trip_assignment_details(*)')
          .order('trip_date', { ascending: false }),
        supabase
          .from('routes')
          .select('*')
      ]);

      if (tripsRes.error) throw tripsRes.error;
      if (routesRes.error) throw routesRes.error;

      setTrips(tripsRes.data || []);
      setRoutes(routesRes.data || []);
      await loadAvailableResources(tripDate);
    } catch {
      setErrorMsg('Failed to load Trip Assignments data. Please check database permissions.');
    }
  }, [tripDate, loadAvailableResources]);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      if (isMounted) {
        await loadInitialData();
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadInitialData]);

  useEffect(() => {
    let isMounted = true;
    async function updateResources() {
      if (isModalOpen && isMounted) {
        await loadAvailableResources(tripDate, editingId ? driverId : undefined, editingId ? vehicleId : undefined, editingId || undefined);
      }
    }
    updateResources();
    return () => {
      isMounted = false;
    };
  }, [tripDate, isModalOpen, editingId, driverId, vehicleId, loadAvailableResources]);

  // Filtered trips based on date filter
  const filteredTrips = useMemo(() => {
    if (!selectedDateFilter) return trips;
    return trips.filter((t) => t.trip_date === selectedDateFilter);
  }, [trips, selectedDateFilter]);

  const totalPages = Math.ceil(filteredTrips.length / ITEMS_PER_PAGE);
  const paginatedTrips = filteredTrips.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleOpenAdd = () => {
    setEditingId(null);
    setDriverId('');
    setVehicleId('');
    const today = new Date().toISOString().split('T')[0];
    setTripDate(today);
    setDetails([]);
    setRouteSearchQueries({});
    loadAvailableResources(today);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (trip: TripAssignmentRecord) => {
    setEditingId(trip.trip_id);
    setDriverId(trip.driver_id);
    setVehicleId(trip.vehicle_id || '');
    setTripDate(trip.trip_date);
    setDetails(
      (trip.trip_assignment_details || []).map((d) => ({
        trip_iddet: d.trip_iddet,
        route_id: d.route_id,
        standard_fuel_liters: Number(d.standard_fuel_liters || 0),
        buffer_allowance_liters: Number(d.buffer_allowance_liters || 0)
      }))
    );
    setRouteSearchQueries({});
    loadAvailableResources(trip.trip_date, trip.driver_id, trip.vehicle_id || undefined, trip.trip_id);
    setIsModalOpen(true);
  };

  const handleAddRouteRow = () => {
    setDetails((prev) => [
      ...prev,
      {
        route_id: '',
        standard_fuel_liters: 0,
        buffer_allowance_liters: 0
      }
    ]);
  };

  const handleRemoveRouteRow = (index: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
    setRouteSearchQueries((prev) => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const handleRouteSelect = (index: number, selectedRouteId: string) => {
    const matchedRoute = routes.find((r) => r.route_id === selectedRouteId);
    setDetails((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        route_id: selectedRouteId,
        standard_fuel_liters: Number(matchedRoute?.standard_fuel_liters || 0),
        buffer_allowance_liters: Number(matchedRoute?.buffer_allowance_liters || 0)
      };
      return copy;
    });
  };

  const handleDetailChange = (index: number, field: keyof TripDetailInput, value: number) => {
    setDetails((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value
      };
      return copy;
    });
  };

  // Auto-calculated Header Totals
  const totalStandardFuel = details.reduce((sum, d) => sum + (Number(d.standard_fuel_liters) || 0), 0);
  const totalBufferFuel = details.reduce((sum, d) => sum + (Number(d.buffer_allowance_liters) || 0), 0);
  const totalFuelAllotted = totalStandardFuel + totalBufferFuel;

  const reloadTripsOnly = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_assignments')
        .select('*, employees(*), vehicles(*), trip_assignment_details(*)')
        .order('trip_date', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch {
      setErrorMsg('Failed to refresh trip assignments list.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this daily trip assignment?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('trip_assignments').delete().eq('trip_id', id);
      if (error) throw error;

      setSuccessMsg('Trip assignment deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      await reloadTripsOnly();
      await loadAvailableResources(tripDate);

      if (paginatedTrips.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch {
      setErrorMsg('Failed to delete trip assignment record.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId || !tripDate) {
      setErrorMsg('Driver and Trip Date are required.');
      return;
    }

    if (details.length === 0) {
      setErrorMsg('At least one route segment must be added to the trip assignment.');
      return;
    }

    for (let i = 0; i < details.length; i++) {
      if (!details[i].route_id) {
        setErrorMsg(`Please select a route for row #${i + 1}.`);
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const headerPayload = {
        driver_id: driverId,
        vehicle_id: vehicleId || null,
        trip_date: tripDate,
        total_standard_fuel: totalStandardFuel,
        total_buffer_fuel: totalBufferFuel,
        total_fuel_allotted: totalFuelAllotted,
        total_actual_fuel: 0.00
      };

      let masterTripId = editingId;

      if (editingId) {
        const { error: headerErr } = await supabase
          .from('trip_assignments')
          .update(headerPayload)
          .eq('trip_id', editingId);

        if (headerErr) throw headerErr;

        const { error: delErr } = await supabase
          .from('trip_assignment_details')
          .delete()
          .eq('trip_id', editingId);

        if (delErr) throw delErr;
      } else {
        const { data: newHeader, error: headerErr } = await supabase
          .from('trip_assignments')
          .insert([headerPayload])
          .select()
          .single();

        if (headerErr) throw headerErr;
        masterTripId = newHeader.trip_id;
      }

      const detailsPayload = details.map((d) => ({
        trip_id: masterTripId,
        route_id: d.route_id,
        standard_fuel_liters: d.standard_fuel_liters,
        buffer_allowance_liters: d.buffer_allowance_liters
      }));

      const { error: detailsErr } = await supabase
        .from('trip_assignment_details')
        .insert(detailsPayload);

      if (detailsErr) throw detailsErr;

      setSuccessMsg(editingId ? 'Trip Assignment updated successfully!' : 'Trip Assignment saved successfully!');
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      await reloadTripsOnly();
      await loadAvailableResources(tripDate);
    } catch {
      setErrorMsg('Failed to save Trip Assignment. Please verify route selections and database constraints.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-(--border-main) pb-3">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 rounded-xl shadow-xs">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Daily Trip Assignment</h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">Assign driver routes, vehicles, and monitor standard and buffer fuel allocations.</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="shrink-0 bg-(--accent-subtle) border border-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="shrink-0 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-surface) border border-(--border-main) shadow-xs rounded-xl p-4 overflow-hidden space-y-3">
        {/* Controls Bar: Date Filter & New Trip Assignment Button */}
        <div className="shrink-0 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-(--text-primary) flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-(--text-muted)" /> Filter Date:
            </span>
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => {
                setSelectedDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-(--text-primary)"
            />
            {selectedDateFilter && (
              <button
                onClick={() => {
                  setSelectedDateFilter('');
                  setCurrentPage(1);
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-1 cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-(--text-muted)">
              Showing <span className="font-semibold text-(--text-primary)">{filteredTrips.length}</span> assignments
            </span>
            <button
              onClick={handleOpenAdd}
              className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Trip Assignment</span>
            </button>
          </div>
        </div>

        {/* Table & Pagination */}
        <div className="flex flex-col flex-1 min-h-0 space-y-2">
          <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Driver</th>
                  <th className="py-2 px-3">Vehicle</th>
                  <th className="py-2 px-3">Std Fuel (L)</th>
                  <th className="py-2 px-3">Buffer Fuel (L)</th>
                  <th className="py-2 px-3">Total Allotted (L)</th>
                  <th className="py-2 px-3 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-(--text-muted) text-xs">No trip assignments logged for this date.</td>
                  </tr>
                ) : (
                  paginatedTrips.map((item) => {
                    const driverName = item.employees?.employee_name || 'Unassigned Driver';
                    const driverCode = item.employees?.employee_code;
                    const vehiclePlate = item.vehicles?.plate_no || 'No Vehicle Assigned';

                    return (
                      <tr key={item.trip_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="py-2 px-3 font-mono text-(--text-primary)">{item.trip_date}</td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-(--text-primary)">{driverName}</div>
                          {driverCode && <div className="text-[10px] text-(--text-muted) font-mono">{driverCode}</div>}
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-(--text-primary)">
                          {vehiclePlate}
                        </td>
                        <td className="py-2 px-3 font-mono text-(--text-secondary)">{Number(item.total_standard_fuel || 0).toFixed(2)}</td>
                        <td className="py-2 px-3 font-mono text-(--text-secondary)">{Number(item.total_buffer_fuel || 0).toFixed(2)}</td>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {Number(item.total_fuel_allotted || 0).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.trip_id)}
                              className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTrips.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-4xl p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">
                {editingId ? 'Edit Daily Trip Assignment' : 'New Daily Trip Assignment'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                {/* Header Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-(--bg-surface) p-3 rounded-xl border border-(--border-main)">
                  <div>
                    <label className="text-xs uppercase text-(--text-muted) font-semibold mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Driver <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={driverId}
                      onChange={(e) => setDriverId(e.target.value)}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
                    >
                      <option value="">Select Available Driver...</option>
                      {drivers.map((d) => (
                        <option key={d.employee_id} value={d.employee_id}>
                          {d.employee_name} ({d.employee_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs uppercase text-(--text-muted) font-semibold mb-1 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" /> Vehicle
                    </label>
                    <select
                      value={vehicleId}
                      onChange={(e) => setVehicleId(e.target.value)}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-(--text-primary) cursor-pointer"
                    >
                      <option value="">Select Available Vehicle...</option>
                      {vehicles.map((v) => (
                        <option key={v.vehicle_id} value={v.vehicle_id}>
                          {v.plate_no} {v.conduction_no ? `(${v.conduction_no})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs uppercase text-(--text-muted) font-semibold mb-1 flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" /> Trip Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={tripDate}
                      onChange={(e) => setTripDate(e.target.value)}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-(--text-primary)"
                    />
                  </div>
                </div>

                {/* Live Header Summaries */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-(--bg-surface) border border-(--border-main) p-2.5 rounded-lg">
                    <span className="text-[10px] text-(--text-muted) block uppercase">Total Std Fuel</span>
                    <span className="font-bold text-(--text-primary)">{totalStandardFuel.toFixed(2)} L</span>
                  </div>
                  <div className="bg-(--bg-surface) border border-(--border-main) p-2.5 rounded-lg">
                    <span className="text-[10px] text-(--text-muted) block uppercase">Total Buffer Fuel</span>
                    <span className="font-bold text-(--text-primary)">{totalBufferFuel.toFixed(2)} L</span>
                  </div>
                  <div className="bg-(--bg-surface) border border-(--border-main) p-2.5 rounded-lg">
                    <span className="text-[10px] text-(--text-muted) block uppercase">Total Fuel Allotted</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalFuelAllotted.toFixed(2)} L</span>
                  </div>
                </div>

                {/* Route Segment Details Table */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-(--text-primary) flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-emerald-500" /> Route Segments & Fuel Allotment
                    </span>
                    <button
                      type="button"
                      onClick={handleAddRouteRow}
                      className="text-xs bg-(--accent-subtle) border border-(--border-main) hover:bg-(--bg-surface) text-(--text-primary) px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Route
                    </button>
                  </div>

                  <div className="border border-(--border-main) rounded-xl overflow-hidden bg-(--bg-surface)">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle)">
                          <th className="py-2 px-3">Route (Search & Select)</th>
                          <th className="py-2 px-3 w-32">Std Fuel (L)</th>
                          <th className="py-2 px-3 w-32">Buffer (L)</th>
                          <th className="py-2 px-3 w-32">Allocated (L)</th>
                          <th className="py-2 px-2 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--border-main)">
                        {details.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-(--text-muted) text-xs">
                              No routes assigned yet. Click "Add Route" above.
                            </td>
                          </tr>
                        ) : (
                          details.map((row, idx) => {
                            const searchQuery = routeSearchQueries[idx] || '';
                            const filteredRoutes = routes.filter((r) => {
                              const query = searchQuery.toLowerCase();
                              const code = (r.route_code || '').toLowerCase();
                              const origin = (r.origin || '').toLowerCase();
                              const dest = (r.destination || '').toLowerCase();
                              return code.includes(query) || origin.includes(query) || dest.includes(query);
                            });

                            const allocated = (Number(row.standard_fuel_liters) || 0) + (Number(row.buffer_allowance_liters) || 0);

                            return (
                              <tr key={idx} className="hover:bg-(--bg-elevated) transition-colors">
                                <td className="py-1.5 px-3 space-y-1">
                                  <div className="relative">
                                    <Search className="w-3 h-3 text-(--text-muted) absolute left-2 top-2.5" />
                                    <input
                                      type="text"
                                      placeholder="Search route code/origin..."
                                      value={searchQuery}
                                      onChange={(e) =>
                                        setRouteSearchQueries({ ...routeSearchQueries, [idx]: e.target.value })
                                      }
                                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded pl-7 pr-2 py-1 text-xs focus:outline-none"
                                    />
                                  </div>
                                  <select
                                    required
                                    value={row.route_id}
                                    onChange={(e) => handleRouteSelect(idx, e.target.value)}
                                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded px-2 py-1 text-xs focus:outline-none cursor-pointer"
                                  >
                                    <option value="">-- Choose from {filteredRoutes.length} matching routes --</option>
                                    {filteredRoutes.map((r) => (
                                      <option key={r.route_id} value={r.route_id}>
                                        {r.route_code ? `${r.route_code}: ` : ''}{r.origin || 'Origin'} → {r.destination || 'Destination'} (Std: {r.standard_fuel_liters || 0}L)
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-1.5 px-3 align-top">
                                  <input
                                    type="number"
                                    step="any"
                                    value={row.standard_fuel_liters}
                                    onChange={(e) => handleDetailChange(idx, 'standard_fuel_liters', Number(e.target.value) || 0)}
                                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) font-mono px-2 py-1 rounded text-xs"
                                  />
                                </td>
                                <td className="py-1.5 px-3 align-top">
                                  <input
                                    type="number"
                                    step="any"
                                    value={row.buffer_allowance_liters}
                                    onChange={(e) => handleDetailChange(idx, 'buffer_allowance_liters', Number(e.target.value) || 0)}
                                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) font-mono px-2 py-1 rounded text-xs"
                                  />
                                </td>
                                <td className="py-1.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 align-top pt-2">
                                  {allocated.toFixed(2)}
                                </td>
                                <td className="py-1.5 px-2 text-center align-top pt-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRouteRow(idx)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 p-1 rounded transition-colors"
                                    title="Remove segment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
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

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingId ? 'Update Trip Assignment' : 'Save Trip Assignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyTripAssignment;