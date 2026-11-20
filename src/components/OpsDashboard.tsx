import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  LayoutGrid,
  Compass,
  Fuel,
  Truck,
  AlertCircle,
  Search,
  RefreshCw,
  MapPin,
  Users,
  Gauge,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Check,
  Table as TableIcon,
  Sparkles,
  Calendar,
  TrendingUp,
  Award,
  Flame,
  Info,
} from 'lucide-react';

/* --- Reusable CustomDropdown Component --- */

export interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
}

interface CustomDropdownProps<T extends string | number> {
  id?: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  openUpwards?: boolean;
}

function CustomDropdown<T extends string | number>({
  id,
  value,
  options,
  onChange,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  openUpwards = false,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) || options[0],
    [options, value]
  );

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2 text-left transition-colors focus:outline-none cursor-pointer ${buttonClassName}`}
      >
        <span className="truncate">{selectedOption?.label ?? ''}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-(--text-muted) shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 min-w-full w-max max-w-xs max-h-60 overflow-y-auto rounded-lg border border-(--border-main) bg-(--bg-elevated) shadow-xl py-1 ${
            openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'
          } ${menuClassName}`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-(--text-primary) hover:bg-(--accent-subtle)'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* --- Reusable TablePagination Component --- */

interface TablePaginationProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

function TablePagination({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: TablePaginationProps) {
  const dropdownOptions = useMemo(
    () => pageSizeOptions.map((size) => ({ value: size, label: String(size) })),
    [pageSizeOptions]
  );

  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-(--bg-elevated) border-t border-(--border-main) text-[11px] text-(--text-muted)">
      <div className="flex items-center gap-2">
        <span>
          Showing <strong className="text-(--text-primary) font-mono">{startItem}</strong>–
          <strong className="text-(--text-primary) font-mono">{endItem}</strong> of{' '}
          <strong className="text-(--text-primary) font-mono">{totalItems.toLocaleString()}</strong>
        </span>
        <span className="text-(--border-main)">|</span>
        <div className="flex items-center gap-1.5">
          <span>Rows:</span>
          <CustomDropdown
            value={pageSize}
            options={dropdownOptions}
            openUpwards
            onChange={(val) => {
              onPageSizeChange(Number(val));
              onPageChange(1);
            }}
            buttonClassName="bg-(--bg-surface) border border-(--border-main) text-(--text-primary) rounded px-1.5 py-0.5 text-[11px] font-mono"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="flex items-center gap-0.5 px-2 py-1 rounded border border-(--border-main) bg-(--bg-surface) text-(--text-primary) font-semibold hover:bg-(--accent-subtle) disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        <span className="px-2 font-mono text-(--text-primary) font-semibold">
          Page {safePage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          className="flex items-center gap-0.5 px-2 py-1 rounded border border-(--border-main) bg-(--bg-surface) text-(--text-primary) font-semibold hover:bg-(--accent-subtle) disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function paginateSlice<T>(items: T[], currentPage: number, pageSize: number): T[] {
  if (items.length === 0) return [];
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/* --- Interfaces --- */

interface RouteRow {
  route_id: string;
  route_code: string;
  route_name: string;
  origin: string;
  destination: string;
  distance_km: number;
  round_trip: boolean;
  traffic_factor: string | null;
  standard_fuel_liters: number;
  buffer_allowance_liters: number;
  max_authorized_liters: number | null;
  is_active: boolean;
}

interface TripDetailRow {
  trip_iddet: string;
  trip_id: string;
  route_id: string;
  standard_fuel_liters: number;
  buffer_allowance_liters: number;
  allocated_fuel_liters: number | null;
  routes?: {
    route_code: string;
    route_name: string;
    origin: string;
    destination: string;
    distance_km: number;
    round_trip: boolean;
    traffic_factor: string | null;
  } | null;
}

interface TripAssignmentRow {
  trip_id: string;
  driver_id: string;
  vehicle_id: string | null;
  trip_date: string;
  total_standard_fuel: number;
  total_buffer_fuel: number;
  total_fuel_allotted: number;
  created_at: string;
  employees?: Record<string, unknown> | null;
  vehicles?: {
    plate_no?: string;
    conduction_no?: string;
  } | null;
  trip_assignment_details?: TripDetailRow[];
}

interface RouteDispatchEntry {
  trip_iddet: string;
  trip_id: string;
  trip_date: string;
  plate_no: string;
  driver_name: string;
  standard_fuel: number;
  buffer_fuel: number;
  fuel_provided: number;
  distance_km: number;
}

interface DriverDispatchEntry {
  key: string;
  trip_id: string;
  trip_date: string;
  plate_no: string;
  route_label: string;
  standard_fuel: number;
  buffer_fuel: number;
  fuel_provided: number;
}

interface EquipmentDispatchEntry {
  key: string;
  trip_id: string;
  trip_date: string;
  route_label: string;
  driver_name: string;
  standard_fuel: number;
  buffer_fuel: number;
  fuel_provided: number;
}

type MainTab = 'overview' | 'routes' | 'drivers' | 'equipment';

function formatLocalDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const formatEmployeeName = (emp?: Record<string, unknown> | null, fallbackId?: string) => {
  if (!emp) return fallbackId ? `Driver (${fallbackId.slice(0, 6)})` : 'Unassigned';
  const fullName = emp.full_name || emp.employee_name || emp.name;
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();
  const first = typeof emp.first_name === 'string' ? emp.first_name.trim() : '';
  const last = typeof emp.last_name === 'string' ? emp.last_name.trim() : '';
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  const code = emp.employee_code || emp.emp_code;
  if (typeof code === 'string' && code.trim()) return code.trim();
  return fallbackId ? `Driver (${fallbackId.slice(0, 6)})` : 'Unassigned';
};

async function queryOperationsPayload(startDate: string, endDate: string, allDates: boolean) {
  const { data: routesData, error: routesError } = await supabase
    .from('routes')
    .select('*')
    .order('route_code', { ascending: true })
    .limit(5000);

  if (routesError) throw routesError;

  let tripQuery = supabase
    .from('trip_assignments')
    .select(`
      trip_id,
      driver_id,
      vehicle_id,
      trip_date,
      total_standard_fuel,
      total_buffer_fuel,
      total_fuel_allotted,
      created_at,
      employees (*),
      vehicles (plate_no, conduction_no),
      trip_assignment_details (
        trip_iddet,
        trip_id,
        route_id,
        standard_fuel_liters,
        buffer_allowance_liters,
        allocated_fuel_liters,
        routes (
          route_code,
          route_name,
          origin,
          destination,
          distance_km,
          round_trip,
          traffic_factor
        )
      )
    `)
    .order('trip_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10000);

  if (!allDates) {
    if (startDate) {
      tripQuery = tripQuery.gte('trip_date', startDate);
    }
    if (endDate) {
      tripQuery = tripQuery.lte('trip_date', `${endDate}T23:59:59.999Z`);
    }
  }

  const { data: tripsData, error: tripsError } = await tripQuery;
  if (tripsError) throw tripsError;

  const routeLookup = new Map((routesData || []).map((r: RouteRow) => [r.route_id, r]));
  const hydratedTrips = ((tripsData as unknown as TripAssignmentRow[]) || []).map((trip) => ({
    ...trip,
    trip_assignment_details: (trip.trip_assignment_details || []).map((det) => {
      const masterRoute = routeLookup.get(det.route_id);
      return {
        ...det,
        routes: det.routes || masterRoute || null,
      };
    }),
  }));

  return {
    routes: (routesData as RouteRow[]) || [],
    trips: hydratedTrips,
  };
}

export function OpsDashboard() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('overview');
  const [trips, setTrips] = useState<TripAssignmentRow[]>([]);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Default Dates on Form Load: Date To = Current Date, Date From = Date To - 30 days
  const defaultEndDate = useMemo(() => formatLocalDateISO(new Date()), []);
  const defaultStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatLocalDateISO(d);
  }, []);

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [allDates, setAllDates] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [selectedRouteMonthKey, setSelectedRouteMonthKey] = useState<string | null>(null);

  // Selected Inspector Rows
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);

  // Pagination States for Top Leaderboard Tables & Route Lists (10 each page)
  const [topRepeatedRoutePage, setTopRepeatedRoutePage] = useState<number>(1);
  const [leastEfficientRoutePage, setLeastEfficientRoutePage] = useState<number>(1);
  const [topDriversMostPage, setTopDriversMostPage] = useState<number>(1);
  const [topDriversLeastPage, setTopDriversLeastPage] = useState<number>(1);
  const [topEquipMostPage, setTopEquipMostPage] = useState<number>(1);
  const [topEquipLeastPage, setTopEquipLeastPage] = useState<number>(1);
  const leaderboardPageSize = 10;

  // Detail Inspector Pagination States
  const [routeDetailPage, setRouteDetailPage] = useState<number>(1);
  const [routeDetailPageSize, setRouteDetailPageSize] = useState<number>(10);
  const [driverDetailPage, setDriverDetailPage] = useState<number>(1);
  const [driverDetailPageSize, setDriverDetailPageSize] = useState<number>(10);
  const [equipmentDetailPage, setEquipmentDetailPage] = useState<number>(1);
  const [equipmentDetailPageSize, setEquipmentDetailPageSize] = useState<number>(10);

  const handleDateFromChange = (newStart: string) => {
    setLoading(true);
    setSelectedMonthKey(null);
    setSelectedRouteMonthKey(null);
    setStartDate(newStart);
    if (endDate && newStart && newStart > endDate) {
      setEndDate(newStart);
    }
  };

  const handleDateToChange = (newEnd: string) => {
    setLoading(true);
    setSelectedMonthKey(null);
    setSelectedRouteMonthKey(null);
    setEndDate(newEnd);
    if (startDate && newEnd && newEnd < startDate) {
      const adjusted = new Date(`${newEnd}T00:00:00`);
      adjusted.setDate(adjusted.getDate() - 30);
      setStartDate(formatLocalDateISO(adjusted));
    }
  };

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    setErrorMsg(null);
    try {
      const payload = await queryOperationsPayload(startDate, endDate, allDates);
      setRoutes(payload.routes);
      setTrips(payload.trips);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : String(err);
      console.error('Error loading OpsDashboard:', msg);
      setErrorMsg(`Unable to load operations metrics: ${msg}`);
    } finally {
      setRefreshing(false);
    }
  }, [startDate, endDate, allDates]);

  useEffect(() => {
    let isMounted = true;

    queryOperationsPayload(startDate, endDate, allDates)
      .then((payload) => {
        if (!isMounted) return;
        setRoutes(payload.routes);
        setTrips(payload.trips);
        setErrorMsg(null);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: unknown }).message)
            : String(err);
        console.error('Error loading OpsDashboard:', msg);
        setErrorMsg(`Unable to load operations metrics: ${msg}`);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate, allDates]);

  // Determine if period traverses more than 2 months (approx 62 days or > 2 distinct months)
  const isPeriodTraversingOver2Months = useMemo(() => {
    if (allDates) return true;
    if (!startDate || !endDate) return false;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays > 62;
  }, [startDate, endDate, allDates]);

  // Search-filtered trips
  const searchFilteredTrips = useMemo(() => {
    if (!searchQuery.trim()) return trips;
    const q = searchQuery.trim().toLowerCase();

    return trips.filter((t) => {
      const driverName = formatEmployeeName(t.employees, t.driver_id).toLowerCase();
      const plate = (t.vehicles?.plate_no || t.vehicles?.conduction_no || '').toLowerCase();
      const details = t.trip_assignment_details || [];

      const matchesRoute = details.some(
        (d) =>
          (d.routes?.route_code || '').toLowerCase().includes(q) ||
          (d.routes?.route_name || '').toLowerCase().includes(q) ||
          (d.routes?.origin || '').toLowerCase().includes(q) ||
          (d.routes?.destination || '').toLowerCase().includes(q)
      );

      return driverName.includes(q) || plate.includes(q) || matchesRoute;
    });
  }, [trips, searchQuery]);

  // Monthly Fuel Allocations (Base vs Buffer) for Chart (including zero-record months)
  const monthlyFuelAllocations = useMemo(() => {
    const monthMap = new Map<
      string,
      { monthKey: string; monthLabel: string; baseFuel: number; bufferFuel: number; totalFuel: number }
    >();

    if (!allDates && startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const curr = new Date(start.getFullYear(), start.getMonth(), 1);
        const last = new Date(end.getFullYear(), end.getMonth(), 1);
        while (curr <= last) {
          const y = curr.getFullYear();
          const m = String(curr.getMonth() + 1).padStart(2, '0');
          const key = `${y}-${m}`;
          const label = curr.toLocaleString('default', { month: 'short', year: 'numeric' });
          monthMap.set(key, {
            monthKey: key,
            monthLabel: label,
            baseFuel: 0,
            bufferFuel: 0,
            totalFuel: 0,
          });
          curr.setMonth(curr.getMonth() + 1);
        }
      }
    } else if (allDates && searchFilteredTrips.length > 0) {
      const validKeys = searchFilteredTrips
        .map((t) => t.trip_date?.substring(0, 7))
        .filter((k): k is string => Boolean(k && k.length >= 7))
        .sort();

      if (validKeys.length > 0) {
        const first = new Date(`${validKeys[0]}-01T00:00:00`);
        const last = new Date(`${validKeys[validKeys.length - 1]}-01T00:00:00`);
        if (!isNaN(first.getTime()) && !isNaN(last.getTime())) {
          const curr = new Date(first.getFullYear(), first.getMonth(), 1);
          while (curr <= last) {
            const y = curr.getFullYear();
            const m = String(curr.getMonth() + 1).padStart(2, '0');
            const key = `${y}-${m}`;
            const label = curr.toLocaleString('default', { month: 'short', year: 'numeric' });
            monthMap.set(key, {
              monthKey: key,
              monthLabel: label,
              baseFuel: 0,
              bufferFuel: 0,
              totalFuel: 0,
            });
            curr.setMonth(curr.getMonth() + 1);
          }
        }
      }
    }

    searchFilteredTrips.forEach((trip) => {
      if (!trip.trip_date) return;
      const mKey = trip.trip_date.substring(0, 7);
      if (mKey.length < 7) return;

      if (!monthMap.has(mKey)) {
        const d = new Date(`${mKey}-01T00:00:00`);
        const label = isNaN(d.getTime())
          ? mKey
          : d.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthMap.set(mKey, {
          monthKey: mKey,
          monthLabel: label,
          baseFuel: 0,
          bufferFuel: 0,
          totalFuel: 0,
        });
      }

      const bucket = monthMap.get(mKey)!;
      const std = Number(trip.total_standard_fuel || 0);
      const buf = Number(trip.total_buffer_fuel || 0);
      const tot = Number(trip.total_fuel_allotted || std + buf);

      bucket.baseFuel += std;
      bucket.bufferFuel += buf;
      bucket.totalFuel += tot;
    });

    return Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [searchFilteredTrips, startDate, endDate, allDates]);

  // Active trips filtered by search query + optional clicked month bar
  const filteredTrips = useMemo(() => {
    if (!selectedMonthKey) return searchFilteredTrips;
    return searchFilteredTrips.filter((t) => t.trip_date?.substring(0, 7) === selectedMonthKey);
  }, [searchFilteredTrips, selectedMonthKey]);

  // Core KPI Calculations
  const metrics = useMemo(() => {
    const totalTrips = filteredTrips.length;
    let totalSegments = 0;
    let totalDistanceKm = 0;
    let totalStandardFuel = 0;
    let totalBufferFuel = 0;
    let totalAllottedFuel = 0;

    const uniqueVehicles = new Set<string>();
    const uniqueDrivers = new Set<string>();

    filteredTrips.forEach((trip) => {
      if (trip.vehicle_id) uniqueVehicles.add(trip.vehicle_id);
      if (trip.driver_id) uniqueDrivers.add(trip.driver_id);

      const std = Number(trip.total_standard_fuel || 0);
      const buf = Number(trip.total_buffer_fuel || 0);
      const allotted = Number(trip.total_fuel_allotted || std + buf);

      totalStandardFuel += std;
      totalBufferFuel += buf;
      totalAllottedFuel += allotted;

      const details = trip.trip_assignment_details || [];
      totalSegments += details.length;
      details.forEach((d) => {
        const dist = Number(d.routes?.distance_km || 0);
        totalDistanceKm += d.routes?.round_trip ? dist * 2 : dist;
      });
    });

    // Fuel efficiency is run against total fuel only (Total Dispatched Distance / Total Fuel Allotted)
    const kmPerLiterTotalFuel = totalAllottedFuel > 0 ? totalDistanceKm / totalAllottedFuel : 0;
    const efficiencyPct = totalAllottedFuel > 0 ? (totalStandardFuel / totalAllottedFuel) * 100 : 0;

    return {
      totalTrips,
      totalSegments,
      totalDistanceKm,
      totalStandardFuel,
      totalBufferFuel,
      totalAllottedFuel,
      kmPerLiterTotalFuel,
      efficiencyPct,
      activeVehiclesCount: uniqueVehicles.size,
      activeDriversCount: uniqueDrivers.size,
      activeRoutesCount: routes.filter((r) => r.is_active).length,
      totalRoutesCount: routes.length,
    };
  }, [filteredTrips, routes]);

  // 1. Route Dispatch & Fuel Allocation Summary (Grouped by Route)
  const routePerformance = useMemo(() => {
    const map = new Map<
      string,
      {
        route_id: string;
        route_code: string;
        route_name: string;
        origin: string;
        destination: string;
        traffic_factor: string;
        distance_km: number;
        round_trip: boolean;
        dispatchCount: number;
        totalDistanceKm: number;
        standardFuel: number;
        bufferFuel: number;
        allocatedFuel: number;
        efficiencyPct: number;
        kmPerLiter: number;
        entries: RouteDispatchEntry[];
      }
    >();

    routes.forEach((r) => {
      map.set(r.route_id, {
        route_id: r.route_id,
        route_code: r.route_code,
        route_name: r.route_name,
        origin: r.origin,
        destination: r.destination,
        traffic_factor: r.traffic_factor || 'HIGHWAY',
        distance_km: Number(r.distance_km || 0),
        round_trip: r.round_trip,
        dispatchCount: 0,
        totalDistanceKm: 0,
        standardFuel: 0,
        bufferFuel: 0,
        allocatedFuel: 0,
        efficiencyPct: 0,
        kmPerLiter: 0,
        entries: [],
      });
    });

    filteredTrips.forEach((trip) => {
      const driverName = formatEmployeeName(trip.employees, trip.driver_id);
      const plateNo = trip.vehicles?.plate_no || trip.vehicles?.conduction_no || 'Unassigned';

      (trip.trip_assignment_details || []).forEach((d) => {
        const existing = map.get(d.route_id) || {
          route_id: d.route_id,
          route_code: d.routes?.route_code || 'N/A',
          route_name: d.routes?.route_name || 'Unknown Route',
          origin: d.routes?.origin || '-',
          destination: d.routes?.destination || '-',
          traffic_factor: d.routes?.traffic_factor || 'HIGHWAY',
          distance_km: Number(d.routes?.distance_km || 0),
          round_trip: Boolean(d.routes?.round_trip),
          dispatchCount: 0,
          totalDistanceKm: 0,
          standardFuel: 0,
          bufferFuel: 0,
          allocatedFuel: 0,
          efficiencyPct: 0,
          kmPerLiter: 0,
          entries: [],
        };

        const std = Number(d.standard_fuel_liters || 0);
        const buf = Number(d.buffer_allowance_liters || 0);
        const alloc = Number(d.allocated_fuel_liters ?? std + buf);
        const legDist = existing.round_trip ? existing.distance_km * 2 : existing.distance_km;

        existing.dispatchCount += 1;
        existing.totalDistanceKm += legDist;
        existing.standardFuel += std;
        existing.bufferFuel += buf;
        existing.allocatedFuel += alloc;
        existing.entries.push({
          trip_iddet: d.trip_iddet,
          trip_id: trip.trip_id,
          trip_date: trip.trip_date,
          plate_no: plateNo,
          driver_name: driverName,
          standard_fuel: std,
          buffer_fuel: buf,
          fuel_provided: alloc,
          distance_km: legDist,
        });

        map.set(d.route_id, existing);
      });
    });

    return Array.from(map.values())
      .map((item) => {
        const efficiencyPct =
          item.allocatedFuel > 0 ? (item.standardFuel / item.allocatedFuel) * 100 : 0;
        const kmPerLiter = item.allocatedFuel > 0 ? item.totalDistanceKm / item.allocatedFuel : 0;
        return {
          ...item,
          efficiencyPct,
          kmPerLiter,
          entries: item.entries.sort((a, b) => b.trip_date.localeCompare(a.trip_date)),
        };
      })
      .sort((a, b) => b.dispatchCount - a.dispatchCount);
  }, [filteredTrips, routes]);

  // Month-on-Month breakdown specifically for Route Summary (including zero-record months)
  const routeMonthlyBreakdown = useMemo(() => {
    const monthMap = new Map<
      string,
      {
        monthKey: string;
        monthLabel: string;
        routesCount: number;
        repeatedLegs: number;
      }
    >();

    // Pre-populate continuous month buckets
    if (!allDates && startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const curr = new Date(start.getFullYear(), start.getMonth(), 1);
        const last = new Date(end.getFullYear(), end.getMonth(), 1);
        while (curr <= last) {
          const y = curr.getFullYear();
          const m = String(curr.getMonth() + 1).padStart(2, '0');
          const key = `${y}-${m}`;
          const label = curr.toLocaleString('default', { month: 'short', year: 'numeric' });
          monthMap.set(key, {
            monthKey: key,
            monthLabel: label,
            routesCount: 0,
            repeatedLegs: 0,
          });
          curr.setMonth(curr.getMonth() + 1);
        }
      }
    } else if (allDates && searchFilteredTrips.length > 0) {
      const validKeys = searchFilteredTrips
        .map((t) => t.trip_date?.substring(0, 7))
        .filter((k): k is string => Boolean(k && k.length >= 7))
        .sort();

      if (validKeys.length > 0) {
        const first = new Date(`${validKeys[0]}-01T00:00:00`);
        const last = new Date(`${validKeys[validKeys.length - 1]}-01T00:00:00`);
        if (!isNaN(first.getTime()) && !isNaN(last.getTime())) {
          const curr = new Date(first.getFullYear(), first.getMonth(), 1);
          while (curr <= last) {
            const y = curr.getFullYear();
            const m = String(curr.getMonth() + 1).padStart(2, '0');
            const key = `${y}-${m}`;
            const label = curr.toLocaleString('default', { month: 'short', year: 'numeric' });
            monthMap.set(key, {
              monthKey: key,
              monthLabel: label,
              routesCount: 0,
              repeatedLegs: 0,
            });
            curr.setMonth(curr.getMonth() + 1);
          }
        }
      }
    }

    const routeSetsByMonth = new Map<string, Set<string>>();

    searchFilteredTrips.forEach((trip) => {
      if (!trip.trip_date) return;
      const mKey = trip.trip_date.substring(0, 7);
      if (mKey.length < 7) return;

      if (!monthMap.has(mKey)) {
        const d = new Date(`${mKey}-01T00:00:00`);
        const label = isNaN(d.getTime())
          ? mKey
          : d.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthMap.set(mKey, {
          monthKey: mKey,
          monthLabel: label,
          routesCount: 0,
          repeatedLegs: 0,
        });
      }

      const bucket = monthMap.get(mKey)!;
      const details = trip.trip_assignment_details || [];
      bucket.repeatedLegs += details.length;

      if (!routeSetsByMonth.has(mKey)) {
        routeSetsByMonth.set(mKey, new Set<string>());
      }
      const routeSet = routeSetsByMonth.get(mKey)!;
      details.forEach((d) => routeSet.add(d.route_id));
    });

    return Array.from(monthMap.values())
      .map((m) => ({
        ...m,
        routesCount: routeSetsByMonth.get(m.monthKey)?.size ?? 0,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [searchFilteredTrips, startDate, endDate, allDates]);

  // Base list of routes filtered by clicked month for Route Summary tables
  const monthFilteredRoutePerformance = useMemo(() => {
    let list = routePerformance.filter((r) => r.dispatchCount > 0);
    if (selectedRouteMonthKey) {
      list = list
        .map((r) => {
          const filteredEntries = r.entries.filter(
            (e) => e.trip_date?.substring(0, 7) === selectedRouteMonthKey
          );
          const dispatchCount = filteredEntries.length;
          const standardFuel = filteredEntries.reduce((acc, cur) => acc + cur.standard_fuel, 0);
          const bufferFuel = filteredEntries.reduce((acc, cur) => acc + cur.buffer_fuel, 0);
          const allocatedFuel = filteredEntries.reduce((acc, cur) => acc + cur.fuel_provided, 0);
          const totalDistanceKm = filteredEntries.reduce((acc, cur) => acc + cur.distance_km, 0);
          const efficiencyPct = allocatedFuel > 0 ? (standardFuel / allocatedFuel) * 100 : 0;
          const kmPerLiter = allocatedFuel > 0 ? totalDistanceKm / allocatedFuel : 0;

          return {
            ...r,
            dispatchCount,
            standardFuel,
            bufferFuel,
            allocatedFuel,
            totalDistanceKm,
            efficiencyPct,
            kmPerLiter,
            entries: filteredEntries,
          };
        })
        .filter((r) => r.dispatchCount > 0);
    }
    return list;
  }, [routePerformance, selectedRouteMonthKey]);

  // Top Repeated Fuel Routes (sorted by dispatchCount descending, then allotted fuel) with pagination
  const sortedTopRepeatedRoutes = useMemo(() => {
    return [...monthFilteredRoutePerformance].sort(
      (a, b) => b.dispatchCount - a.dispatchCount || b.allocatedFuel - a.allocatedFuel
    );
  }, [monthFilteredRoutePerformance]);

  const paginatedTopRepeatedRoutes = useMemo(
    () => paginateSlice(sortedTopRepeatedRoutes, topRepeatedRoutePage, leaderboardPageSize),
    [sortedTopRepeatedRoutes, topRepeatedRoutePage]
  );

  // Least Efficient List (sorted by efficiencyPct ascending) with pagination
  const sortedLeastEfficientRoutes = useMemo(() => {
    return [...monthFilteredRoutePerformance].sort((a, b) => a.efficiencyPct - b.efficiencyPct);
  }, [monthFilteredRoutePerformance]);

  const paginatedLeastEfficientRoutes = useMemo(
    () => paginateSlice(sortedLeastEfficientRoutes, leastEfficientRoutePage, leaderboardPageSize),
    [sortedLeastEfficientRoutes, leastEfficientRoutePage]
  );

  // 2. Trip Assignment Ledger (Grouped by Driver)
  const driverAssignments = useMemo(() => {
    const map = new Map<
      string,
      {
        driver_id: string;
        driver_name: string;
        tripCount: number;
        legCount: number;
        standardFuel: number;
        bufferFuel: number;
        allocatedFuel: number;
        efficiencyPct: number;
        entries: DriverDispatchEntry[];
      }
    >();

    filteredTrips.forEach((trip) => {
      const driverKey = trip.driver_id || 'unassigned';
      const driverName = formatEmployeeName(trip.employees, trip.driver_id);
      const plateNo = trip.vehicles?.plate_no || trip.vehicles?.conduction_no || 'Unassigned';
      const details = trip.trip_assignment_details || [];

      const existing = map.get(driverKey) || {
        driver_id: driverKey,
        driver_name: driverName,
        tripCount: 0,
        legCount: 0,
        standardFuel: 0,
        bufferFuel: 0,
        allocatedFuel: 0,
        efficiencyPct: 0,
        entries: [],
      };

      const tripStd = Number(trip.total_standard_fuel || 0);
      const tripBuf = Number(trip.total_buffer_fuel || 0);
      const tripAlloc = Number(trip.total_fuel_allotted || tripStd + tripBuf);

      existing.tripCount += 1;
      existing.legCount += details.length;
      existing.standardFuel += tripStd;
      existing.bufferFuel += tripBuf;
      existing.allocatedFuel += tripAlloc;

      if (details.length === 0) {
        existing.entries.push({
          key: trip.trip_id,
          trip_id: trip.trip_id,
          trip_date: trip.trip_date,
          plate_no: plateNo,
          route_label: 'No route assigned',
          standard_fuel: tripStd,
          buffer_fuel: tripBuf,
          fuel_provided: tripAlloc,
        });
      } else {
        details.forEach((leg) => {
          const legStd = Number(leg.standard_fuel_liters || 0);
          const legBuf = Number(leg.buffer_allowance_liters || 0);
          const legAlloc = Number(leg.allocated_fuel_liters ?? legStd + legBuf);
          const routeLabel = leg.routes
            ? `${leg.routes.route_code} — ${leg.routes.route_name}`
            : 'Unknown Route';

          existing.entries.push({
            key: leg.trip_iddet,
            trip_id: trip.trip_id,
            trip_date: trip.trip_date,
            plate_no: plateNo,
            route_label: routeLabel,
            standard_fuel: legStd,
            buffer_fuel: legBuf,
            fuel_provided: legAlloc,
          });
        });
      }

      map.set(driverKey, existing);
    });

    return Array.from(map.values())
      .map((d) => ({
        ...d,
        efficiencyPct: d.allocatedFuel > 0 ? (d.standardFuel / d.allocatedFuel) * 100 : 0,
        entries: d.entries.sort((a, b) => b.trip_date.localeCompare(a.trip_date)),
      }))
      .sort((a, b) => b.tripCount - a.tripCount);
  }, [filteredTrips]);

  const sortedDriversMostBuffer = useMemo(() => {
    return [...driverAssignments].sort(
      (a, b) => b.bufferFuel - a.bufferFuel || b.allocatedFuel - a.allocatedFuel
    );
  }, [driverAssignments]);

  const sortedDriversLeastBuffer = useMemo(() => {
    return [...driverAssignments].sort(
      (a, b) => a.bufferFuel - b.bufferFuel || b.efficiencyPct - a.efficiencyPct
    );
  }, [driverAssignments]);

  const paginatedDriversMostBuffer = useMemo(
    () => paginateSlice(sortedDriversMostBuffer, topDriversMostPage, leaderboardPageSize),
    [sortedDriversMostBuffer, topDriversMostPage]
  );

  const paginatedDriversLeastBuffer = useMemo(
    () => paginateSlice(sortedDriversLeastBuffer, topDriversLeastPage, leaderboardPageSize),
    [sortedDriversLeastBuffer, topDriversLeastPage]
  );

  // 3. Trip Assignment Ledger (Grouped by Equipment / Plate No)
  const equipmentAssignments = useMemo(() => {
    const map = new Map<
      string,
      {
        equipment_id: string;
        plate_no: string;
        tripCount: number;
        legCount: number;
        standardFuel: number;
        bufferFuel: number;
        allocatedFuel: number;
        efficiencyPct: number;
        entries: EquipmentDispatchEntry[];
      }
    >();

    filteredTrips.forEach((trip) => {
      const plateNo = trip.vehicles?.plate_no || trip.vehicles?.conduction_no || 'Unassigned';
      const equipmentKey = trip.vehicle_id || `unassigned-${plateNo}`;
      const driverName = formatEmployeeName(trip.employees, trip.driver_id);
      const details = trip.trip_assignment_details || [];

      const existing = map.get(equipmentKey) || {
        equipment_id: equipmentKey,
        plate_no: plateNo,
        tripCount: 0,
        legCount: 0,
        standardFuel: 0,
        bufferFuel: 0,
        allocatedFuel: 0,
        efficiencyPct: 0,
        entries: [],
      };

      const tripStd = Number(trip.total_standard_fuel || 0);
      const tripBuf = Number(trip.total_buffer_fuel || 0);
      const tripAlloc = Number(trip.total_fuel_allotted || tripStd + tripBuf);

      existing.tripCount += 1;
      existing.legCount += details.length;
      existing.standardFuel += tripStd;
      existing.bufferFuel += tripBuf;
      existing.allocatedFuel += tripAlloc;

      if (details.length === 0) {
        existing.entries.push({
          key: trip.trip_id,
          trip_id: trip.trip_id,
          trip_date: trip.trip_date,
          route_label: 'No route assigned',
          driver_name: driverName,
          standard_fuel: tripStd,
          buffer_fuel: tripBuf,
          fuel_provided: tripAlloc,
        });
      } else {
        details.forEach((leg) => {
          const legStd = Number(leg.standard_fuel_liters || 0);
          const legBuf = Number(leg.buffer_allowance_liters || 0);
          const legAlloc = Number(leg.allocated_fuel_liters ?? legStd + legBuf);
          const routeLabel = leg.routes
            ? `${leg.routes.route_code} — ${leg.routes.route_name}`
            : 'Unknown Route';

          existing.entries.push({
            key: leg.trip_iddet,
            trip_id: trip.trip_id,
            trip_date: trip.trip_date,
            route_label: routeLabel,
            driver_name: driverName,
            standard_fuel: legStd,
            buffer_fuel: legBuf,
            fuel_provided: legAlloc,
          });
        });
      }

      map.set(equipmentKey, existing);
    });

    return Array.from(map.values())
      .map((eq) => ({
        ...eq,
        efficiencyPct: eq.allocatedFuel > 0 ? (eq.standardFuel / eq.allocatedFuel) * 100 : 0,
        entries: eq.entries.sort((a, b) => b.trip_date.localeCompare(a.trip_date)),
      }))
      .sort((a, b) => b.tripCount - a.tripCount);
  }, [filteredTrips]);

  const sortedEquipmentMostBuffer = useMemo(() => {
    return [...equipmentAssignments].sort(
      (a, b) => b.bufferFuel - a.bufferFuel || b.allocatedFuel - a.allocatedFuel
    );
  }, [equipmentAssignments]);

  const sortedEquipmentLeastBuffer = useMemo(() => {
    return [...equipmentAssignments].sort(
      (a, b) => a.bufferFuel - b.bufferFuel || b.efficiencyPct - a.efficiencyPct
    );
  }, [equipmentAssignments]);

  const paginatedEquipmentMostBuffer = useMemo(
    () => paginateSlice(sortedEquipmentMostBuffer, topEquipMostPage, leaderboardPageSize),
    [sortedEquipmentMostBuffer, topEquipMostPage]
  );

  const paginatedEquipmentLeastBuffer = useMemo(
    () => paginateSlice(sortedEquipmentLeastBuffer, topEquipLeastPage, leaderboardPageSize),
    [sortedEquipmentLeastBuffer, topEquipLeastPage]
  );

  // Active Inspector Objects
  const activeRouteInspector = useMemo(
    () => routePerformance.find((r) => r.route_id === selectedRouteId) || null,
    [routePerformance, selectedRouteId]
  );

  const activeDriverInspector = useMemo(
    () => driverAssignments.find((d) => d.driver_id === selectedDriverId) || null,
    [driverAssignments, selectedDriverId]
  );

  const activeEquipmentInspector = useMemo(
    () => equipmentAssignments.find((e) => e.equipment_id === selectedEquipmentId) || null,
    [equipmentAssignments, selectedEquipmentId]
  );

  // Paginated Slices for Detail Inspectors
  const paginatedRouteEntries = useMemo(() => {
    if (!activeRouteInspector) return [];
    let entries = activeRouteInspector.entries;
    if (selectedRouteMonthKey) {
      entries = entries.filter((e) => e.trip_date?.substring(0, 7) === selectedRouteMonthKey);
    }
    return paginateSlice(entries, routeDetailPage, routeDetailPageSize);
  }, [activeRouteInspector, selectedRouteMonthKey, routeDetailPage, routeDetailPageSize]);

  const totalRouteInspectorEntries = useMemo(() => {
    if (!activeRouteInspector) return 0;
    let entries = activeRouteInspector.entries;
    if (selectedRouteMonthKey) {
      entries = entries.filter((e) => e.trip_date?.substring(0, 7) === selectedRouteMonthKey);
    }
    return entries.length;
  }, [activeRouteInspector, selectedRouteMonthKey]);

  const paginatedDriverEntries = useMemo(
    () =>
      activeDriverInspector
        ? paginateSlice(activeDriverInspector.entries, driverDetailPage, driverDetailPageSize)
        : [],
    [activeDriverInspector, driverDetailPage, driverDetailPageSize]
  );

  const paginatedEquipmentEntries = useMemo(
    () =>
      activeEquipmentInspector
        ? paginateSlice(
            activeEquipmentInspector.entries,
            equipmentDetailPage,
            equipmentDetailPageSize
          )
        : [],
    [activeEquipmentInspector, equipmentDetailPage, equipmentDetailPageSize]
  );

  const standardSharePct =
    metrics.totalAllottedFuel > 0
      ? (metrics.totalStandardFuel / metrics.totalAllottedFuel) * 100
      : 0;
  const bufferSharePct =
    metrics.totalAllottedFuel > 0
      ? (metrics.totalBufferFuel / metrics.totalAllottedFuel) * 100
      : 0;

  const getMainTabClass = (tabKey: MainTab) => {
    const isActive = activeMainTab === tabKey;
    return isActive
      ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) border border-(--btn-primary-bg) shadow-md ring-2 ring-(--btn-primary-bg)/30'
      : 'bg-(--bg-surface) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--accent-subtle) border border-(--border-main)';
  };

  return (
    <div className="h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3 flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 rounded-xl shadow-xs shrink-0">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">
              Operations Dispatch & Fuel Suite
            </h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">
              Trip dispatch volume, route utilization, driver assignments, and authorized fuel allocation ledgers.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-2.5 rounded-lg flex items-center gap-3 text-xs shrink-0">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-elevated) border border-(--border-main) rounded-xl p-4 shadow-xl overflow-hidden space-y-3">
        {/* Title, Search & Date Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border-main) pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-(--text-primary)">
              {activeMainTab === 'overview' && 'Executive Dispatch & Fuel Allocation Overview'}
              {activeMainTab === 'routes' && 'Route Dispatch & Fuel Allocation Summary'}
              {activeMainTab === 'drivers' && 'Trip Assignment Ledger (Grouped by Driver)'}
              {activeMainTab === 'equipment' && 'Trip Assignment Ledger (Grouped by Equipment)'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="flex items-center gap-1.5 bg-(--bg-surface) border border-(--border-main) px-2.5 py-1.5 rounded-lg text-xs shadow-xs">
              <Search className="w-3.5 h-3.5 text-(--text-muted) shrink-0" />
              <input
                type="text"
                placeholder="Search plate, driver, route..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setTopRepeatedRoutePage(1);
                  setLeastEfficientRoutePage(1);
                  setTopDriversMostPage(1);
                  setTopDriversLeastPage(1);
                  setTopEquipMostPage(1);
                  setTopEquipLeastPage(1);
                }}
                className="bg-transparent text-(--text-primary) font-medium text-xs focus:outline-none w-36 sm:w-44"
              />
            </div>

            {/* Period Date Filter & Refresh */}
            <div className="flex items-center gap-1.5 bg-(--bg-surface) border border-(--border-main) px-2.5 py-1.5 rounded-lg text-xs shadow-xs">
              <Filter className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setAllDates(!allDates);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                  allDates
                    ? 'bg-blue-600 text-white'
                    : 'bg-(--bg-elevated) border border-(--border-main) text-(--text-muted) hover:text-(--text-primary)'
                }`}
                title="Toggle all historical dates"
              >
                {allDates ? 'All Dates Active' : 'All Dates'}
              </button>

              {!allDates && (
                <>
                  <span className="text-[10px] font-bold uppercase text-(--text-muted)">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="bg-transparent text-(--text-primary) font-medium text-xs focus:outline-none cursor-pointer"
                  />
                  <span className="text-[10px] font-bold uppercase text-(--text-muted) ml-1">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    className="bg-transparent text-(--text-primary) font-medium text-xs focus:outline-none cursor-pointer"
                  />
                </>
              )}

              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshing || loading}
                className="flex items-center gap-1 bg-(--btn-primary-bg,#0f172a) text-white px-2.5 py-1 rounded-md text-[11px] font-semibold ml-2 hover:opacity-95 transition-opacity cursor-pointer shadow-xs disabled:opacity-50"
                title="Refresh operations data"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing || loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-(--border-main) pb-3 pt-1 shrink-0">
          {[
            { id: 'overview', label: '1. Dispatch & Fuel Overview', icon: Gauge },
            { id: 'routes', label: `2. Route Summary (${routePerformance.length})`, icon: MapPin },
            { id: 'drivers', label: `3. Driver Ledger (${driverAssignments.length})`, icon: Users },
            { id: 'equipment', label: `4. Equipment Ledger (${equipmentAssignments.length})`, icon: Truck },
          ].map((tab) => {
            const Icon = tab.icon;
            const tabKey = tab.id as MainTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMainTab(tabKey)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getMainTabClass(tabKey)}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic View Content */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto p-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-(--text-muted)" />
              <p className="text-xs text-(--text-muted)">Querying dispatch and fuel allocation datasets...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: Dispatch & Fuel Overview */}
              {activeMainTab === 'overview' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Primary KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-(--bg-surface) border border-(--border-main) rounded-xl shadow-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-(--text-muted)">
                          Dispatched Trips
                        </span>
                        <Compass className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-black text-(--text-primary) font-mono">
                        {metrics.totalTrips.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-(--text-muted)">
                        {metrics.totalSegments} route leg{metrics.totalSegments === 1 ? '' : 's'} &bull;{' '}
                        {metrics.totalDistanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km total
                      </div>
                    </div>

                    <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl shadow-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                          Total Allotted Fuel
                        </span>
                        <Fuel className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                        {metrics.totalAllottedFuel.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        L
                      </div>
                      <div className="text-[10px] text-(--text-muted) font-mono">
                        Std: {metrics.totalStandardFuel.toFixed(2)} L + Buffer: {metrics.totalBufferFuel.toFixed(2)} L
                      </div>
                    </div>

                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                          Fleet & Route Coverage
                        </span>
                        <Truck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {metrics.activeVehiclesCount} Units
                      </div>
                      <div className="text-[10px] text-(--text-muted)">
                        {metrics.activeDriversCount} driver{metrics.activeDriversCount === 1 ? '' : 's'} &bull;{' '}
                        {metrics.activeRoutesCount}/{metrics.totalRoutesCount} active routes
                      </div>
                    </div>
                  </div>

                  {/* Monthly Graph: Line chart if period traverses more than 2 months */}
                  <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-main) pb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <h3 className="text-xs font-extrabold uppercase tracking-wide text-(--text-primary)">
                          Month-on-Month Fuel Allocations (Base Standard vs. Buffer Allowance){' '}
                          {isPeriodTraversingOver2Months ? '(Line Trend)' : ''}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-xs inline-block"></span>
                          Base Standard (L)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs inline-block"></span>
                          Buffer Allowance (L)
                        </span>
                        {selectedMonthKey && (
                          <button
                            type="button"
                            onClick={() => setSelectedMonthKey(null)}
                            className="ml-2 px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded font-bold text-[10px] hover:bg-blue-500/20 cursor-pointer"
                          >
                            Clear Month Filter
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-(--text-muted)">
                      {selectedMonthKey
                        ? `Filtering dashboard KPIs and ledgers by selected month: ${
                            monthlyFuelAllocations.find((m) => m.monthKey === selectedMonthKey)
                              ?.monthLabel || selectedMonthKey
                          }. Click the active point/bar again to reset.`
                        : isPeriodTraversingOver2Months
                        ? `Period exceeds 2 months; displaying as a line trend chart with Y-axis increments of total average. Click any data point to filter period.`
                        : `Compares monthly Base Standard Fuel against Authorized Buffer Allowance. Click any bar/point to filter KPIs and tables.`}
                    </p>

                    {monthlyFuelAllocations.length === 0 ? (
                      <div className="py-10 text-center text-xs text-(--text-muted)">
                        No monthly fuel allocation records available for the selected date period.
                      </div>
                    ) : isPeriodTraversingOver2Months ? (
                      /* Fixed Line Graph for > 2 months */
                      <div className="pt-4 pb-2 flex gap-3">
                        {(() => {
                          const avgBase =
                            monthlyFuelAllocations.reduce((acc, cur) => acc + cur.baseFuel, 0) /
                            (monthlyFuelAllocations.length || 1);
                          const avgBuffer =
                            monthlyFuelAllocations.reduce((acc, cur) => acc + cur.bufferFuel, 0) /
                            (monthlyFuelAllocations.length || 1);
                          const totalAvg = avgBase + avgBuffer;

                          const maxSeriesVal = Math.max(
                            ...monthlyFuelAllocations.map((m) =>
                              Math.max(m.baseFuel, m.bufferFuel)
                            ),
                            1
                          );
                          const step = totalAvg > 0 ? totalAvg / 4 : maxSeriesVal / 4;
                          const yMax = Math.max(step * 4, maxSeriesVal);

                          const chartHeight = 160;
                          const count = monthlyFuelAllocations.length;

                          const getXPercent = (idx: number) =>
                            count === 1 ? 50 : ((idx + 0.5) / count) * 100;

                          const getYPercent = (val: number) =>
                            Math.min(100, Math.max(0, (val / yMax) * 100));

                          const basePoints = monthlyFuelAllocations
                            .map((m, idx) => {
                              const x = getXPercent(idx) * 10;
                              const y =
                                chartHeight - (getYPercent(m.baseFuel) / 100) * chartHeight;
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            })
                            .join(' ');

                          const bufferPoints = monthlyFuelAllocations
                            .map((m, idx) => {
                              const x = getXPercent(idx) * 10;
                              const y =
                                chartHeight - (getYPercent(m.bufferFuel) / 100) * chartHeight;
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            })
                            .join(' ');

                          return (
                            <>
                              {/* Y-Axis Increments of Total Average */}
                              <div className="flex flex-col justify-between h-40 text-[10px] font-mono text-(--text-muted) text-right pr-1 shrink-0 select-none">
                                {[4, 3, 2, 1, 0].map((multiplier) => {
                                  const val = (yMax / 4) * multiplier;
                                  return (
                                    <span key={multiplier} className="leading-none">
                                      {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}L
                                    </span>
                                  );
                                })}
                              </div>

                              {/* Scrollable Plot & X-Axis */}
                              <div className="flex-1 overflow-x-auto">
                                <div
                                  className="relative"
                                  style={{ minWidth: `${Math.max(480, count * 72)}px` }}
                                >
                                  {/* Plot Area */}
                                  <div className="relative h-40 border-b border-l border-(--border-main)">
                                    {/* Horizontal Gridlines */}
                                    {[0, 25, 50, 75, 100].map((pct) => (
                                      <div
                                        key={pct}
                                        className="absolute left-0 right-0 border-t border-dashed border-(--border-main)/50 pointer-events-none"
                                        style={{ bottom: `${pct}%` }}
                                      />
                                    ))}

                                    {/* Connecting Lines */}
                                    {count > 1 && (
                                      <svg
                                        width="100%"
                                        height="100%"
                                        viewBox={`0 0 1000 ${chartHeight}`}
                                        preserveAspectRatio="none"
                                        className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible"
                                      >
                                        <path
                                          d={`M ${basePoints.split(' ').join(' L ')}`}
                                          fill="none"
                                          stroke="#3b82f6"
                                          strokeWidth="2.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          vectorEffect="non-scaling-stroke"
                                        />
                                        <path
                                          d={`M ${bufferPoints.split(' ').join(' L ')}`}
                                          fill="none"
                                          stroke="#f59e0b"
                                          strokeWidth="2.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          vectorEffect="non-scaling-stroke"
                                        />
                                      </svg>
                                    )}

                                    {/* Interactive Month Columns & Positioned Data Dots */}
                                    {monthlyFuelAllocations.map((m, idx) => {
                                      const isSelected = selectedMonthKey === m.monthKey;
                                      const baseBottomPct = getYPercent(m.baseFuel);
                                      const bufferBottomPct = getYPercent(m.bufferFuel);

                                      return (
                                        <button
                                          type="button"
                                          key={m.monthKey}
                                          onClick={() =>
                                            setSelectedMonthKey(isSelected ? null : m.monthKey)
                                          }
                                          style={{
                                            left: `${(idx / count) * 100}%`,
                                            width: `${100 / count}%`,
                                          }}
                                          className={`absolute top-0 bottom-0 group cursor-pointer transition-colors ${
                                            isSelected
                                              ? 'bg-blue-500/15'
                                              : 'hover:bg-(--accent-subtle)/60'
                                          }`}
                                        >
                                          {/* Tooltip */}
                                          <div className="absolute left-1/2 -translate-x-1/2 top-2 hidden group-hover:flex flex-col bg-(--bg-elevated)/95 backdrop-blur-sm border border-(--border-main) p-2 rounded shadow-lg text-[10px] z-30 whitespace-nowrap pointer-events-none space-y-0.5">
                                            <span className="font-bold text-(--text-primary)">
                                              {m.monthLabel}
                                            </span>
                                            <span className="text-blue-500 font-mono">
                                              Base Standard: {m.baseFuel.toFixed(2)} L
                                            </span>
                                            <span className="text-amber-500 font-mono">
                                              Buffer Allowance: {m.bufferFuel.toFixed(2)} L
                                            </span>
                                            <span className="text-(--text-primary) font-bold font-mono">
                                              Total Allotted: {m.totalFuel.toFixed(2)} L
                                            </span>
                                          </div>

                                          {/* Base Standard Dot */}
                                          <span
                                            style={{ bottom: `${baseBottomPct}%` }}
                                            className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 shadow-xs z-20"
                                          />

                                          {/* Buffer Allowance Dot */}
                                          <span
                                            style={{ bottom: `${bufferBottomPct}%` }}
                                            className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900 shadow-xs z-20"
                                          />
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* X-Axis Month Labels */}
                                  <div className="flex pt-2">
                                    {monthlyFuelAllocations.map((m) => {
                                      const isSelected = selectedMonthKey === m.monthKey;
                                      return (
                                        <div
                                          key={m.monthKey}
                                          style={{ width: `${100 / count}%` }}
                                          className={`text-[10px] font-bold text-center truncate px-0.5 ${
                                            isSelected
                                              ? 'text-blue-600 dark:text-blue-400 font-black underline'
                                              : 'text-(--text-muted)'
                                          }`}
                                        >
                                          {m.monthLabel}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      /* Bar Graph for <= 2 months */
                      <div className="pt-2 pb-2 overflow-x-auto">
                        <div className="flex items-end justify-around gap-4 min-w-[320px] h-44 px-2 border-b border-(--border-main) pb-1">
                          {(() => {
                            const maxFuelVal = Math.max(
                              ...monthlyFuelAllocations.map((m) =>
                                Math.max(m.baseFuel, m.bufferFuel)
                              ),
                              1
                            );

                            return monthlyFuelAllocations.map((m) => {
                              const baseHeight = Math.max(
                                4,
                                Math.round((m.baseFuel / maxFuelVal) * 120)
                              );
                              const bufferHeight = Math.max(
                                4,
                                Math.round((m.bufferFuel / maxFuelVal) * 120)
                              );
                              const isSelected = selectedMonthKey === m.monthKey;

                              return (
                                <button
                                  type="button"
                                  key={m.monthKey}
                                  onClick={() =>
                                    setSelectedMonthKey(isSelected ? null : m.monthKey)
                                  }
                                  className={`flex flex-col items-center flex-1 h-full justify-end group relative transition-all rounded-lg p-1 cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-500/15 ring-2 ring-blue-500'
                                      : 'hover:bg-(--accent-subtle)'
                                  }`}
                                >
                                  <div className="absolute left-1/2 -translate-x-1/2 top-2 hidden group-hover:flex flex-col bg-(--bg-elevated)/95 backdrop-blur-sm border border-(--border-main) p-2 rounded shadow-lg text-[10px] z-30 whitespace-nowrap pointer-events-none space-y-0.5">
                                    <span className="font-bold text-(--text-primary)">
                                      {m.monthLabel}
                                    </span>
                                    <span className="text-blue-500 font-mono">
                                      Base Standard: {m.baseFuel.toFixed(2)} L
                                    </span>
                                    <span className="text-amber-500 font-mono">
                                      Buffer Allowance: {m.bufferFuel.toFixed(2)} L
                                    </span>
                                    <span className="text-(--text-primary) font-bold font-mono">
                                      Total Allotted: {m.totalFuel.toFixed(2)} L
                                    </span>
                                    <span className="text-[9px] text-(--text-muted) italic mt-0.5">
                                      Click to filter period
                                    </span>
                                  </div>

                                  <div className="flex items-end justify-center gap-1.5 w-full max-w-24 h-32 px-1">
                                    <div
                                      className="w-4 bg-blue-500 rounded-t-sm transition-all duration-300 hover:opacity-90"
                                      style={{ height: `${baseHeight}px` }}
                                      title={`Base Fuel: ${m.baseFuel.toFixed(2)} L`}
                                    />
                                    <div
                                      className="w-4 bg-amber-500 rounded-t-sm transition-all duration-300 hover:opacity-90"
                                      style={{ height: `${bufferHeight}px` }}
                                      title={`Buffer Fuel: ${m.bufferFuel.toFixed(2)} L`}
                                    />
                                  </div>

                                  <span
                                    className={`text-[10px] font-bold mt-2 truncate w-full text-center ${
                                      isSelected
                                        ? 'text-blue-600 dark:text-blue-400 font-black underline'
                                        : 'text-(--text-muted)'
                                    }`}
                                  >
                                    {m.monthLabel}
                                  </span>
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fuel Allocation Composition Panel */}
                  <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-main) pb-2">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-blue-500" />
                        <h3 className="text-xs font-extrabold uppercase tracking-wide text-(--text-primary)">
                          Fuel Allocation Composition & KM Run Breakdown
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-(--text-muted)">
                        Total Authorized Fuel: <strong>{metrics.totalAllottedFuel.toFixed(2)} L</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      <div className="p-3 bg-(--bg-elevated) border border-(--border-main) rounded-lg space-y-1">
                        <span className="text-[10px] font-bold uppercase text-(--text-muted)">
                          Total Distance Run (KM)
                        </span>
                        <div className="text-lg font-black font-mono text-(--text-primary)">
                          {metrics.totalDistanceKm.toLocaleString(undefined, {
                            maximumFractionDigits: 1,
                          })}{' '}
                          km
                        </div>
                        <div className="text-[10px] text-(--text-muted)">
                          Across {metrics.totalSegments} dispatched route legs
                        </div>
                      </div>

                      <div className="p-3 bg-(--bg-elevated) border border-(--border-main) rounded-lg space-y-1">
                        <span className="text-[10px] font-bold uppercase text-(--text-muted)">
                          Fuel Efficiency (vs Total Fuel)
                        </span>
                        <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {metrics.kmPerLiterTotalFuel.toFixed(2)} km/L
                        </div>
                        <div className="text-[10px] text-(--text-muted)">
                          Base Utilization: {metrics.efficiencyPct.toFixed(1)}%
                        </div>
                      </div>

                      <div className="p-3 bg-(--bg-elevated) border border-(--border-main) rounded-lg space-y-1">
                        <span className="text-[10px] font-bold uppercase text-(--text-muted)">
                          Fuel Breakdown (Std vs Buffer)
                        </span>
                        <div className="text-xs font-mono font-bold text-(--text-primary)">
                          Std: {metrics.totalStandardFuel.toFixed(2)} L ({standardSharePct.toFixed(1)}%)
                        </div>
                        <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          Buffer: {metrics.totalBufferFuel.toFixed(2)} L ({bufferSharePct.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Route Dispatch & Fuel Allocation Summary */}
              {activeMainTab === 'routes' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Month-on-Month Line or Bar Graphs for Route Summary */}
                  <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-main) pb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <h3 className="text-xs font-extrabold uppercase tracking-wide text-(--text-primary)">
                          Month-on-Month Route Activity Trends{' '}
                          {isPeriodTraversingOver2Months ? '(Line Trend)' : ''}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block"></span>
                          Repeated Legs
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 bg-indigo-500 rounded-xs inline-block"></span>
                          Active Routes
                        </span>
                        {selectedRouteMonthKey && (
                          <button
                            type="button"
                            onClick={() => setSelectedRouteMonthKey(null)}
                            className="ml-2 px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded font-bold text-[10px] hover:bg-blue-500/20 cursor-pointer"
                          >
                            Clear Month Filter
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-(--text-muted)">
                      {selectedRouteMonthKey
                        ? `Filtering route tables by month: ${
                            routeMonthlyBreakdown.find((m) => m.monthKey === selectedRouteMonthKey)
                              ?.monthLabel || selectedRouteMonthKey
                          }. Click the active point/bar again to reset.`
                        : isPeriodTraversingOver2Months
                        ? `Period exceeds 2 months; displaying as a line trend chart with Y-axis increments of total average. Click any data point to filter route tables below.`
                        : `Displays monthly volume of Repeated Legs and Active Routes. Click any bar/point to filter route tables below.`}
                    </p>

                    {routeMonthlyBreakdown.length === 0 ? (
                      <div className="py-10 text-center text-xs text-(--text-muted)">
                        No monthly route breakdown available for the selected period.
                      </div>
                    ) : isPeriodTraversingOver2Months ? (
                      /* Fixed Line Graph for Route Summary (> 2 months) */
                      <div className="pt-4 pb-2 flex gap-3">
                        {(() => {
                          const avgLegs =
                            routeMonthlyBreakdown.reduce((acc, cur) => acc + cur.repeatedLegs, 0) /
                            (routeMonthlyBreakdown.length || 1);
                          const avgRoutes =
                            routeMonthlyBreakdown.reduce((acc, cur) => acc + cur.routesCount, 0) /
                            (routeMonthlyBreakdown.length || 1);
                          const totalAvg = avgLegs + avgRoutes;

                          const maxSeriesVal = Math.max(
                            ...routeMonthlyBreakdown.map((m) =>
                              Math.max(m.repeatedLegs, m.routesCount)
                            ),
                            1
                          );
                          const step = totalAvg > 0 ? totalAvg / 4 : maxSeriesVal / 4;
                          const yMax = Math.max(step * 4, maxSeriesVal);

                          const chartHeight = 160;
                          const count = routeMonthlyBreakdown.length;

                          const getXPercent = (idx: number) =>
                            count === 1 ? 50 : ((idx + 0.5) / count) * 100;

                          const getYPercent = (val: number) =>
                            Math.min(100, Math.max(0, (val / yMax) * 100));

                          const legsPoints = routeMonthlyBreakdown
                            .map((m, idx) => {
                              const x = getXPercent(idx) * 10;
                              const y =
                                chartHeight - (getYPercent(m.repeatedLegs) / 100) * chartHeight;
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            })
                            .join(' ');

                          const routesPoints = routeMonthlyBreakdown
                            .map((m, idx) => {
                              const x = getXPercent(idx) * 10;
                              const y =
                                chartHeight - (getYPercent(m.routesCount) / 100) * chartHeight;
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            })
                            .join(' ');

                          return (
                            <>
                              {/* Y-Axis Increments of Total Average */}
                              <div className="flex flex-col justify-between h-40 text-[10px] font-mono text-(--text-muted) text-right pr-1 shrink-0 select-none">
                                {[4, 3, 2, 1, 0].map((multiplier) => {
                                  const val = (yMax / 4) * multiplier;
                                  return (
                                    <span key={multiplier} className="leading-none">
                                      {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
                                    </span>
                                  );
                                })}
                              </div>

                              {/* Scrollable Plot & X-Axis */}
                              <div className="flex-1 overflow-x-auto">
                                <div
                                  className="relative"
                                  style={{ minWidth: `${Math.max(480, count * 72)}px` }}
                                >
                                  <div className="relative h-40 border-b border-l border-(--border-main)">
                                    {[0, 25, 50, 75, 100].map((pct) => (
                                      <div
                                        key={pct}
                                        className="absolute left-0 right-0 border-t border-dashed border-(--border-main)/50 pointer-events-none"
                                        style={{ bottom: `${pct}%` }}
                                      />
                                    ))}

                                    {/* Connecting Lines */}
                                    {count > 1 && (
                                      <svg
                                        width="100%"
                                        height="100%"
                                        viewBox={`0 0 1000 ${chartHeight}`}
                                        preserveAspectRatio="none"
                                        className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible"
                                      >
                                        <path
                                          d={`M ${legsPoints.split(' ').join(' L ')}`}
                                          fill="none"
                                          stroke="#10b981"
                                          strokeWidth="2.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          vectorEffect="non-scaling-stroke"
                                        />
                                        <path
                                          d={`M ${routesPoints.split(' ').join(' L ')}`}
                                          fill="none"
                                          stroke="#6366f1"
                                          strokeWidth="2.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          vectorEffect="non-scaling-stroke"
                                        />
                                      </svg>
                                    )}

                                    {routeMonthlyBreakdown.map((m, idx) => {
                                      const isSelected = selectedRouteMonthKey === m.monthKey;
                                      const legsBottomPct = getYPercent(m.repeatedLegs);
                                      const routesBottomPct = getYPercent(m.routesCount);

                                      return (
                                        <button
                                          type="button"
                                          key={m.monthKey}
                                          onClick={() =>
                                            setSelectedRouteMonthKey(
                                              isSelected ? null : m.monthKey
                                            )
                                          }
                                          style={{
                                            left: `${(idx / count) * 100}%`,
                                            width: `${100 / count}%`,
                                          }}
                                          className={`absolute top-0 bottom-0 group cursor-pointer transition-colors ${
                                            isSelected
                                              ? 'bg-emerald-500/15'
                                              : 'hover:bg-(--accent-subtle)/60'
                                          }`}
                                        >
                                          <div className="absolute left-1/2 -translate-x-1/2 top-2 hidden group-hover:flex flex-col bg-(--bg-elevated)/95 backdrop-blur-sm border border-(--border-main) p-2 rounded shadow-lg text-[10px] z-30 whitespace-nowrap pointer-events-none space-y-0.5">
                                            <span className="font-bold text-(--text-primary)">
                                              {m.monthLabel}
                                            </span>
                                            <span className="text-emerald-500 font-mono">
                                              Repeated Legs: {m.repeatedLegs}
                                            </span>
                                            <span className="text-indigo-500 font-mono font-bold">
                                              Active Routes: {m.routesCount}
                                            </span>
                                          </div>

                                          {/* Repeated Legs Dot (Green) */}
                                          <span
                                            style={{ bottom: `${legsBottomPct}%` }}
                                            className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-xs z-20"
                                          />

                                          {/* Active Routes Dot (Indigo) */}
                                          <span
                                            style={{ bottom: `${routesBottomPct}%` }}
                                            className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900 shadow-xs z-20"
                                          />
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* X-Axis Month Labels */}
                                  <div className="flex pt-2">
                                    {routeMonthlyBreakdown.map((m) => {
                                      const isSelected = selectedRouteMonthKey === m.monthKey;
                                      return (
                                        <div
                                          key={m.monthKey}
                                          style={{ width: `${100 / count}%` }}
                                          className={`text-[10px] font-bold text-center truncate px-0.5 ${
                                            isSelected
                                              ? 'text-emerald-600 dark:text-emerald-400 font-black underline'
                                              : 'text-(--text-muted)'
                                          }`}
                                        >
                                          {m.monthLabel}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      /* Bar Graph for Route Summary (<= 2 months) */
                      <div className="pt-2 pb-2 overflow-x-auto">
                        <div className="flex items-end justify-around gap-4 min-w-[320px] h-44 px-2 border-b border-(--border-main) pb-1">
                          {(() => {
                            const maxLegs = Math.max(
                              ...routeMonthlyBreakdown.map((m) =>
                                Math.max(m.repeatedLegs, m.routesCount, 1)
                              ),
                              1
                            );

                            return routeMonthlyBreakdown.map((m) => {
                              const legHeight = Math.max(
                                4,
                                Math.round((m.repeatedLegs / maxLegs) * 120)
                              );
                              const routesHeight = Math.max(
                                4,
                                Math.round((m.routesCount / maxLegs) * 120)
                              );
                              const isSelected = selectedRouteMonthKey === m.monthKey;

                              return (
                                <button
                                  type="button"
                                  key={m.monthKey}
                                  onClick={() =>
                                    setSelectedRouteMonthKey(isSelected ? null : m.monthKey)
                                  }
                                  className={`flex flex-col items-center flex-1 h-full justify-end group relative transition-all rounded-lg p-1 cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-500/15 ring-2 ring-emerald-500'
                                      : 'hover:bg-(--accent-subtle)'
                                  }`}
                                >
                                  <div className="absolute left-1/2 -translate-x-1/2 top-2 hidden group-hover:flex flex-col bg-(--bg-elevated)/95 backdrop-blur-sm border border-(--border-main) p-2 rounded shadow-lg text-[10px] z-30 whitespace-nowrap pointer-events-none space-y-0.5">
                                    <span className="font-bold text-(--text-primary)">
                                      {m.monthLabel}
                                    </span>
                                    <span className="text-emerald-500 font-mono">
                                      Repeated Legs: {m.repeatedLegs}
                                    </span>
                                    <span className="text-indigo-500 font-mono font-bold">
                                      Active Routes: {m.routesCount}
                                    </span>
                                    <span className="text-[9px] text-(--text-muted) italic mt-0.5">
                                      Click to filter top routes
                                    </span>
                                  </div>

                                  <div className="flex items-end justify-center gap-1.5 w-full max-w-24 h-32 px-1">
                                    <div
                                      className="w-4 bg-emerald-500 rounded-t-sm transition-all duration-300 hover:opacity-90"
                                      style={{ height: `${legHeight}px` }}
                                      title={`Repeated Legs: ${m.repeatedLegs}`}
                                    />
                                    <div
                                      className="w-4 bg-indigo-500 rounded-t-sm transition-all duration-300 hover:opacity-90"
                                      style={{ height: `${routesHeight}px` }}
                                      title={`Active Routes: ${m.routesCount}`}
                                    />
                                  </div>

                                  <span
                                    className={`text-[10px] font-bold mt-2 truncate w-full text-center ${
                                      isSelected
                                        ? 'text-emerald-600 dark:text-emerald-400 font-black underline'
                                        : 'text-(--text-muted)'
                                    }`}
                                  >
                                    {m.monthLabel}
                                  </span>
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Top Repeated Fuel Routes (Clickable) */}
                  <div className="p-3.5 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-2.5 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-main) pb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" />
                        <div>
                          <h3 className="text-xs font-extrabold uppercase tracking-wide text-(--text-primary)">
                            Top Repeated Fuel Routes (Clickable)
                          </h3>
                          <p className="text-[10px] text-(--text-muted) flex items-center gap-1 mt-0.5">
                            <Info className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>
                              <strong>Bounded to month:</strong> {selectedRouteMonthKey || 'All Months'} | Click any row to inspect route dispatches.
                            </span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-(--text-muted)">
                        Total: {sortedTopRepeatedRoutes.length} Corridors
                      </span>
                    </div>

                    <div className="border border-(--border-main) rounded-lg overflow-hidden bg-(--bg-elevated)">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-(--bg-surface) text-[10px] uppercase text-(--text-muted) border-b border-(--border-main)">
                            <tr>
                              <th className="p-2.5 w-12 text-center">Rank</th>
                              <th className="p-2.5">Route</th>
                              <th className="p-2.5 text-right">Total Allotted</th>
                              <th className="p-2.5 text-right">Total Distance</th>
                              <th className="p-2.5 text-right">Efficiency</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-(--border-main)">
                            {paginatedTopRepeatedRoutes.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-(--text-muted)">
                                  No repeated route dispatches recorded for the selected period/month.
                                </td>
                              </tr>
                            ) : (
                              paginatedTopRepeatedRoutes.map((r, idx) => {
                                const absoluteRank =
                                  (topRepeatedRoutePage - 1) * leaderboardPageSize + idx + 1;
                                const isSelected = selectedRouteId === r.route_id;
                                return (
                                  <tr
                                    key={r.route_id}
                                    onClick={() => {
                                      setSelectedRouteId(isSelected ? null : r.route_id);
                                      setRouteDetailPage(1);
                                    }}
                                    className={`cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-blue-500/15 font-semibold'
                                        : 'hover:bg-(--accent-subtle)'
                                    }`}
                                  >
                                    <td className="p-2.5 text-center font-mono font-black text-blue-600 dark:text-blue-400">
                                      #{absoluteRank}
                                    </td>
                                    <td className="p-2.5">
                                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 mr-1.5">
                                        [{r.route_code}]
                                      </span>
                                      <span className="font-bold text-(--text-primary)">
                                        {r.route_name}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-bold text-(--text-primary)">
                                      {r.allocatedFuel.toFixed(2)} L
                                    </td>
                                    <td className="p-2.5 text-right font-mono text-(--text-secondary)">
                                      {r.totalDistanceKm.toLocaleString(undefined, {
                                        maximumFractionDigits: 1,
                                      })}{' '}
                                      km
                                    </td>
                                    <td className="p-2.5 text-right font-mono">
                                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                        {r.efficiencyPct.toFixed(1)}% ({r.kmPerLiter.toFixed(2)}{' '}
                                        km/L)
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                      <TablePagination
                        totalItems={sortedTopRepeatedRoutes.length}
                        currentPage={topRepeatedRoutePage}
                        pageSize={leaderboardPageSize}
                        onPageChange={setTopRepeatedRoutePage}
                        onPageSizeChange={() => {}}
                      />
                    </div>
                  </div>

                  {/* Least Efficient List */}
                  <div className="p-3.5 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-2.5 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-main) pb-2">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <h3 className="text-xs font-extrabold uppercase tracking-wide text-(--text-primary)">
                            Least Efficient Routes (Clickable)
                          </h3>
                          <p className="text-[10px] text-(--text-muted) flex items-center gap-1 mt-0.5">
                            <Info className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>
                              <strong>Bounded to month:</strong> {selectedRouteMonthKey || 'All Months'} | Click any row to inspect route dispatches.
                            </span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-(--text-muted)">
                        Total: {sortedLeastEfficientRoutes.length} Corridors
                      </span>
                    </div>

                    <div className="border border-(--border-main) rounded-lg overflow-hidden bg-(--bg-elevated)">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-(--bg-surface) text-[10px] uppercase text-(--text-muted) border-b border-(--border-main)">
                            <tr>
                              <th className="p-2.5 w-12 text-center">Rank</th>
                              <th className="p-2.5">Route</th>
                              <th className="p-2.5 text-right">Total Allotted</th>
                              <th className="p-2.5 text-right">Total Distance</th>
                              <th className="p-2.5 text-right">Efficiency</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-(--border-main)">
                            {paginatedLeastEfficientRoutes.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-(--text-muted)">
                                  No route dispatches recorded for the selected period/month.
                                </td>
                              </tr>
                            ) : (
                              paginatedLeastEfficientRoutes.map((r, idx) => {
                                const absoluteRank =
                                  (leastEfficientRoutePage - 1) * leaderboardPageSize + idx + 1;
                                const isSelected = selectedRouteId === r.route_id;
                                return (
                                  <tr
                                    key={r.route_id}
                                    onClick={() => {
                                      setSelectedRouteId(isSelected ? null : r.route_id);
                                      setRouteDetailPage(1);
                                    }}
                                    className={`cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-blue-500/15 font-semibold'
                                        : 'hover:bg-(--accent-subtle)'
                                    }`}
                                  >
                                    <td className="p-2.5 text-center font-mono font-black text-amber-600 dark:text-amber-400">
                                      #{absoluteRank}
                                    </td>
                                    <td className="p-2.5">
                                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 mr-1.5">
                                        [{r.route_code}]
                                      </span>
                                      <span className="font-bold text-(--text-primary)">
                                        {r.route_name}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-bold text-(--text-primary)">
                                      {r.allocatedFuel.toFixed(2)} L
                                    </td>
                                    <td className="p-2.5 text-right font-mono text-(--text-secondary)">
                                      {r.totalDistanceKm.toLocaleString(undefined, {
                                        maximumFractionDigits: 1,
                                      })}{' '}
                                      km
                                    </td>
                                    <td className="p-2.5 text-right font-mono">
                                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                                        {r.efficiencyPct.toFixed(1)}% ({r.kmPerLiter.toFixed(2)}{' '}
                                        km/L)
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                      <TablePagination
                        totalItems={sortedLeastEfficientRoutes.length}
                        currentPage={leastEfficientRoutePage}
                        pageSize={leaderboardPageSize}
                        onPageChange={setLeastEfficientRoutePage}
                        onPageSizeChange={() => {}}
                      />
                    </div>
                  </div>

                  {/* Clicked Route Inspector */}
                  {activeRouteInspector && (
                    <div className="p-3.5 bg-(--bg-surface) border-2 border-blue-500/40 rounded-xl space-y-3 shadow-xs animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-blue-600 dark:text-blue-400">
                          <Sparkles className="w-4 h-4" />
                          <span>
                            Inspecting Route: [{activeRouteInspector.route_code}]{' '}
                            {activeRouteInspector.route_name} ({totalRouteInspectorEntries}{' '}
                            Dispatches {selectedRouteMonthKey ? `in ${selectedRouteMonthKey}` : ''})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedRouteId(null)}
                          className="text-xs font-semibold text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
                        >
                          Close Inspector
                        </button>
                      </div>

                      <div className="border border-(--border-main) rounded-lg overflow-hidden bg-(--bg-elevated)">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-(--bg-surface) text-[10px] text-(--text-muted) uppercase border-b border-(--border-main)">
                              <tr>
                                <th className="p-2">Date</th>
                                <th className="p-2">Equipment (Plate No)</th>
                                <th className="p-2">Driver</th>
                                <th className="p-2 text-right">Standard (L)</th>
                                <th className="p-2 text-right">Buffer (L)</th>
                                <th className="p-2 text-right">Fuel Provided (L)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border-main)">
                              {paginatedRouteEntries.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="p-4 text-center text-(--text-muted)">
                                    No trips dispatched on this route for the selected period/month.
                                  </td>
                                </tr>
                              ) : (
                                paginatedRouteEntries.map((entry) => (
                                  <tr key={entry.trip_iddet} className="hover:bg-(--accent-subtle)">
                                    <td className="p-2 font-mono font-semibold text-(--text-primary)">
                                      {entry.trip_date}
                                    </td>
                                    <td className="p-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                                      {entry.plate_no}
                                    </td>
                                    <td className="p-2 font-medium text-(--text-secondary)">
                                      {entry.driver_name}
                                    </td>
                                    <td className="p-2 text-right font-mono text-(--text-secondary)">
                                      {entry.standard_fuel.toFixed(2)}
                                    </td>
                                    <td className="p-2 text-right font-mono text-(--text-muted)">
                                      {entry.buffer_fuel.toFixed(2)}
                                    </td>
                                    <td className="p-2 text-right font-mono font-black text-(--text-primary)">
                                      {entry.fuel_provided.toFixed(2)} L
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <TablePagination
                          totalItems={totalRouteInspectorEntries}
                          currentPage={routeDetailPage}
                          pageSize={routeDetailPageSize}
                          onPageChange={setRouteDetailPage}
                          onPageSizeChange={setRouteDetailPageSize}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Trip Assignment Ledger (Grouped by Driver) */}
              {activeMainTab === 'drivers' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-3.5 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-main) pb-2">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-500 shrink-0" />
                        <div>
                          <h3 className="text-xs font-extrabold uppercase tracking-wide text-(--text-primary)">
                            Driver Buffer Consumption & Efficiency Leaderboard
                          </h3>
                          <p className="text-[10px] text-(--text-muted) flex items-center gap-1 mt-0.5">
                            <Info className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>
                              <strong>Efficiency Formula:</strong> Driver Fuel Efficiency (%) = (Standard Fuel &divide; Total Fuel Allotted) &times; 100
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {/* Most Buffer Fuel */}
                      <div className="border border-(--border-main) rounded-lg overflow-hidden bg-(--bg-elevated) flex flex-col">
                        <div className="px-3 py-1.5 bg-amber-500/10 border-b border-(--border-main) flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5" /> Top Drivers — Most Buffer Fuel
                          </span>
                          <span className="text-[9px] font-mono text-(--text-muted)">
                            Highest Buffer (L)
                          </span>
                        </div>
                        <div className="overflow-x-auto flex-1">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-(--bg-surface) text-[10px] uppercase text-(--text-muted) border-b border-(--border-main)">
                              <tr>
                                <th className="p-2">Driver</th>
                                <th className="p-2 text-center">Trips</th>
                                <th className="p-2 text-right">Buffer (L)</th>
                                <th className="p-2 text-right">Allotted (L)</th>
                                <th className="p-2 text-right">Efficiency</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border-main)">
                              {paginatedDriversMostBuffer.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-3 text-center text-(--text-muted)">
                                    No driver data available.
                                  </td>
                                </tr>
                              ) : (
                                paginatedDriversMostBuffer.map((drv) => {
                                  const isSelected = selectedDriverId === drv.driver_id;
                                  return (
                                    <tr
                                      key={drv.driver_id}
                                      onClick={() => {
                                        setSelectedDriverId(isSelected ? null : drv.driver_id);
                                        setDriverDetailPage(1);
                                      }}
                                      className={`cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'bg-purple-500/15 font-semibold'
                                          : 'hover:bg-(--accent-subtle)'
                                      }`}
                                    >
                                      <td className="p-2 font-bold text-(--text-primary)">
                                        {drv.driver_name}
                                      </td>
                                      <td className="p-2 text-center font-mono">{drv.tripCount}</td>
                                      <td className="p-2 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                                        {drv.bufferFuel.toFixed(2)} L
                                      </td>
                                      <td className="p-2 text-right font-mono text-(--text-secondary)">
                                        {drv.allocatedFuel.toFixed(2)} L
                                      </td>
                                      <td className="p-2 text-right font-mono font-bold text-(--text-primary)">
                                        {drv.efficiencyPct.toFixed(1)}%
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                        <TablePagination
                          totalItems={sortedDriversMostBuffer.length}
                          currentPage={topDriversMostPage}
                          pageSize={leaderboardPageSize}
                          onPageChange={setTopDriversMostPage}
                          onPageSizeChange={() => {}}
                        />
                      </div>

                      {/* Least Buffer Fuel */}
                      <div className="border border-(--border-main) rounded-lg overflow-hidden bg-(--bg-elevated) flex flex-col">
                        <div className="px-3 py-1.5 bg-emerald-500/10 border-b border-(--border-main) flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" /> Top Drivers — Least Buffer Fuel
                          </span>
                          <span className="text-[9px] font-mono text-(--text-muted)">
                            Lowest Buffer (L)
                          </span>
                        </div>
                        <div className="overflow-x-auto flex-1">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-(--bg-surface) text-[10px] uppercase text-(--text-muted) border-b border-(--border-main)">
                              <tr>
                                <th className="p-2">Driver</th>
                                <th className="p-2 text-center">Trips</th>
                                <th className="p-2 text-right">Buffer (L)</th>
                                <th className="p-2 text-right">Allotted (L)</th>
                                <th className="p-2 text-right">Efficiency</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border-main)">
                              {paginatedDriversLeastBuffer.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-3 text-center text-(--text-muted)">
                                    No driver data available.
                                  </td>
                                </tr>
                              ) : (
                                paginatedDriversLeastBuffer.map((drv) => {
                                  const isSelected = selectedDriverId === drv.driver_id;
                                  return (
                                    <tr
                                      key={drv.driver_id}
                                      onClick={() => {
                                        setSelectedDriverId(isSelected ? null : drv.driver_id);
                                        setDriverDetailPage(1);
                                      }}
                                      className={`cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'bg-purple-500/15 font-semibold'
                                          : 'hover:bg-(--accent-subtle)'
                                      }`}
                                    >
                                      <td className="p-2 font-bold text-(--text-primary)">
                                        {drv.driver_name}
                                      </td>
                                      <td className="p-2 text-center font-mono">{drv.tripCount}</td>
                                      <td className="p-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        {drv.bufferFuel.toFixed(2)} L
                                      </td>
                                      <td className="p-2 text-right font-mono text-(--text-secondary)">
                                        {drv.allocatedFuel.toFixed(2)} L
                                      </td>
                                      <td className="p-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        {drv.efficiencyPct.toFixed(1)}%
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                        <TablePagination
                          totalItems={sortedDriversLeastBuffer.length}
                          currentPage={topDriversLeastPage}
                          pageSize={leaderboardPageSize}
                          onPageChange={setTopDriversLeastPage}
                          onPageSizeChange={() => {}}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Clicked Driver Inspector */}
                  {activeDriverInspector && (
                    <div className="p-3.5 bg-(--bg-surface) border-2 border-purple-500/40 rounded-xl space-y-3 shadow-xs animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-purple-600 dark:text-purple-400">
                          <TableIcon className="w-4 h-4" />
                          <span>
                            Inspecting Driver: {activeDriverInspector.driver_name} (
                            {activeDriverInspector.entries.length} Records)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedDriverId(null)}
                          className="text-xs font-semibold text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
                        >
                          Close Inspector
                        </button>
                      </div>

                      <div className="border border-(--border-main) rounded-lg overflow-hidden bg-(--bg-elevated)">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-(--bg-surface) text-[10px] text-(--text-muted) uppercase border-b border-(--border-main)">
                              <tr>
                                <th className="p-2">Date</th>
                                <th className="p-2">Equipment (Plate No)</th>
                                <th className="p-2">Route</th>
                                <th className="p-2 text-right">Standard (L)</th>
                                <th className="p-2 text-right">Buffer (L)</th>
                                <th className="p-2 text-right">Fuel Provided (L)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border-main)">
                              {paginatedDriverEntries.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="p-4 text-center text-(--text-muted)">
                                    No route legs recorded for this driver.
                                  </td>
                                </tr>
                              ) : (
                                paginatedDriverEntries.map((entry) => (
                                  <tr key={entry.key} className="hover:bg-(--accent-subtle)">
                                    <td className="p-2 font-mono font-semibold text-(--text-primary)">
                                      {entry.trip_date}
                                    </td>
                                    <td className="p-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                                      {entry.plate_no}
                                    </td>
                                    <td className="p-2 font-medium text-(--text-secondary)">
                                      {entry.route_label}
                                    </td>
                                    <td className="p-2 text-right font-mono text-(--text-secondary)">
                                      {entry.standard_fuel.toFixed(2)}
                                    </td>
                                    <td className="p-2 text-right font-mono text-(--text-muted)">
                                      {entry.buffer_fuel.toFixed(2)}
                                    </td>
                                    <td className="p-2 text-right font-mono font-black text-(--text-primary)">
                                      {entry.fuel_provided.toFixed(2)} L
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <TablePagination
                          totalItems={activeDriverInspector.entries.length}
                          currentPage={driverDetailPage}
                          pageSize={driverDetailPageSize}
                          onPageChange={setDriverDetailPage}
                          onPageSizeChange={setDriverDetailPageSize}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Trip Assignment Ledger (Grouped by Equipment / Plate No) */}
              {activeMainTab === 'equipment' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-3.5 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-main) pb-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                        <div>
                          <h3 className="text-xs font-extrabold uppercase tracking-wide text-(--text-primary)">
                            Equipment Buffer Consumption & Efficiency Leaderboard
                          </h3>
                          <p className="text-[10px] text-(--text-muted) flex items-center gap-1 mt-0.5">
                            <Info className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>
                              <strong>Efficiency Formula:</strong> Equipment Fuel Efficiency (%) = (Standard Fuel &divide; Total Fuel Allotted) &times; 100
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {/* Most Buffer Fuel */}
                      <div className="border border-(--border-main) rounded-lg overflow-hidden bg-(--bg-elevated) flex flex-col">
                        <div className="px-3 py-1.5 bg-amber-500/10 border-b border-(--border-main) flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5" /> Top Equipment — Most Buffer Fuel
                          </span>
                          <span className="text-[9px] font-mono text-(--text-muted)">
                            Highest Buffer (L)
                          </span>
                        </div>
                        <div className="overflow-x-auto flex-1">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-(--bg-surface) text-[10px] uppercase text-(--text-muted) border-b border-(--border-main)">
                              <tr>
                                <th className="p-2">Plate No</th>
                                <th className="p-2 text-center">Trips</th>
                                <th className="p-2 text-right">Buffer (L)</th>
                                <th className="p-2 text-right">Allotted (L)</th>
                                <th className="p-2 text-right">Efficiency</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border-main)">
                              {paginatedEquipmentMostBuffer.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-3 text-center text-(--text-muted)">
                                    No equipment data available.
                                  </td>
                                </tr>
                              ) : (
                                paginatedEquipmentMostBuffer.map((eq) => {
                                  const isSelected = selectedEquipmentId === eq.equipment_id;
                                  return (
                                    <tr
                                      key={eq.equipment_id}
                                      onClick={() => {
                                        setSelectedEquipmentId(
                                          isSelected ? null : eq.equipment_id
                                        );
                                        setEquipmentDetailPage(1);
                                      }}
                                      className={`cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'bg-blue-500/15 font-semibold'
                                          : 'hover:bg-(--accent-subtle)'
                                      }`}
                                    >
                                      <td className="p-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                                        {eq.plate_no}
                                      </td>
                                      <td className="p-2 text-center font-mono">{eq.tripCount}</td>
                                      <td className="p-2 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                                        {eq.bufferFuel.toFixed(2)} L
                                      </td>
                                      <td className="p-2 text-right font-mono text-(--text-secondary)">
                                        {eq.allocatedFuel.toFixed(2)} L
                                      </td>
                                      <td className="p-2 text-right font-mono font-bold text-(--text-primary)">
                                        {eq.efficiencyPct.toFixed(1)}%
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                        <TablePagination
                          totalItems={sortedEquipmentMostBuffer.length}
                          currentPage={topEquipMostPage}
                          pageSize={leaderboardPageSize}
                          onPageChange={setTopEquipMostPage}
                          onPageSizeChange={() => {}}
                        />
                      </div>

                      {/* Least Buffer Fuel */}
                      <div className="border border-(--border-main) rounded-lg overflow-hidden bg-(--bg-elevated) flex flex-col">
                        <div className="px-3 py-1.5 bg-emerald-500/10 border-b border-(--border-main) flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" /> Top Equipment — Least Buffer Fuel
                          </span>
                          <span className="text-[9px] font-mono text-(--text-muted)">
                            Lowest Buffer (L)
                          </span>
                        </div>
                        <div className="overflow-x-auto flex-1">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-(--bg-surface) text-[10px] uppercase text-(--text-muted) border-b border-(--border-main)">
                              <tr>
                                <th className="p-2">Plate No</th>
                                <th className="p-2 text-center">Trips</th>
                                <th className="p-2 text-right">Buffer (L)</th>
                                <th className="p-2 text-right">Allotted (L)</th>
                                <th className="p-2 text-right">Efficiency</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border-main)">
                              {paginatedEquipmentLeastBuffer.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-3 text-center text-(--text-muted)">
                                    No equipment data available.
                                  </td>
                                </tr>
                              ) : (
                                paginatedEquipmentLeastBuffer.map((eq) => {
                                  const isSelected = selectedEquipmentId === eq.equipment_id;
                                  return (
                                    <tr
                                      key={eq.equipment_id}
                                      onClick={() => {
                                        setSelectedEquipmentId(
                                          isSelected ? null : eq.equipment_id
                                        );
                                        setEquipmentDetailPage(1);
                                      }}
                                      className={`cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'bg-blue-500/15 font-semibold'
                                          : 'hover:bg-(--accent-subtle)'
                                      }`}
                                    >
                                      <td className="p-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                                        {eq.plate_no}
                                      </td>
                                      <td className="p-2 text-center font-mono">{eq.tripCount}</td>
                                      <td className="p-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        {eq.bufferFuel.toFixed(2)} L
                                      </td>
                                      <td className="p-2 text-right font-mono text-(--text-secondary)">
                                        {eq.allocatedFuel.toFixed(2)} L
                                      </td>
                                      <td className="p-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        {eq.efficiencyPct.toFixed(1)}%
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                        <TablePagination
                          totalItems={sortedEquipmentLeastBuffer.length}
                          currentPage={topEquipLeastPage}
                          pageSize={leaderboardPageSize}
                          onPageChange={setTopEquipLeastPage}
                          onPageSizeChange={() => {}}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Clicked Equipment Inspector */}
                  {activeEquipmentInspector && (
                    <div className="p-3.5 bg-(--bg-surface) border-2 border-blue-500/40 rounded-xl space-y-3 shadow-xs animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-blue-600 dark:text-blue-400">
                          <TableIcon className="w-4 h-4" />
                          <span>
                            Inspecting equipment: {activeEquipmentInspector.plate_no} (
                            {activeEquipmentInspector.entries.length} Records)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedEquipmentId(null)}
                          className="text-xs font-semibold text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
                        >
                          Close Inspector
                        </button>
                      </div>

                      <div className="border border-(--border-main) rounded-lg overflow-hidden bg-(--bg-elevated)">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-(--bg-surface) text-[10px] text-(--text-muted) uppercase border-b border-(--border-main)">
                              <tr>
                                <th className="p-2">Date</th>
                                <th className="p-2">Route</th>
                                <th className="p-2">Driver</th>
                                <th className="p-2 text-right">Standard (L)</th>
                                <th className="p-2 text-right">Buffer (L)</th>
                                <th className="p-2 text-right">Fuel Provided (L)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border-main)">
                              {paginatedEquipmentEntries.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="p-4 text-center text-(--text-muted)">
                                    No route legs recorded for this equipment.
                                  </td>
                                </tr>
                              ) : (
                                paginatedEquipmentEntries.map((entry) => (
                                  <tr key={entry.key} className="hover:bg-(--accent-subtle)">
                                    <td className="p-2 font-mono font-semibold text-(--text-primary)">
                                      {entry.trip_date}
                                    </td>
                                    <td className="p-2 font-medium text-(--text-secondary)">
                                      {entry.route_label}
                                    </td>
                                    <td className="p-2 font-medium text-(--text-secondary)">
                                      {entry.driver_name}
                                    </td>
                                    <td className="p-2 text-right font-mono text-(--text-secondary)">
                                      {entry.standard_fuel.toFixed(2)}
                                    </td>
                                    <td className="p-2 text-right font-mono text-(--text-muted)">
                                      {entry.buffer_fuel.toFixed(2)}
                                    </td>
                                    <td className="p-2 text-right font-mono font-black text-(--text-primary)">
                                      {entry.fuel_provided.toFixed(2)} L
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <TablePagination
                          totalItems={activeEquipmentInspector.entries.length}
                          currentPage={equipmentDetailPage}
                          pageSize={equipmentDetailPageSize}
                          onPageChange={setEquipmentDetailPage}
                          onPageSizeChange={setEquipmentDetailPageSize}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OpsDashboard;