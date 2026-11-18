import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Check,
  Info,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Wrench,
  AlertCircle,
  Hash,
  Coins,
  Layers,
  PieChart,
  PhilippinePeso,
  Kanban,
  CalendarClock,
  CalendarPlus,
  Truck,
  ClipboardList
} from 'lucide-react';

/* --- Custom Dropdown Component --- */
interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
}

function CustomDropdown({ id, value, onChange, options, placeholder = 'Select...' }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={dropdownRef} className="relative mt-1 w-full">
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) text-xs rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:bg-(--accent-subtle) transition-colors cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-(--text-muted) shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-40 mt-1 w-full max-h-56 overflow-y-auto bg-(--bg-elevated) border border-(--border-main) rounded-lg shadow-xl py-1 text-xs"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-2.5 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-(--btn-primary-bg)/15 text-(--btn-primary-bg) font-semibold'
                    : 'text-(--text-primary) hover:bg-(--accent-subtle)'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-(--btn-primary-bg)" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* --- Multi-Series Monthly Bar / Line Chart (OpsDashboard Pattern) --- */
interface MultiSeriesMonthBucket {
  monthKey: string;
  monthLabel: string;
  s1: number;
  s2: number;
  s3: number;
}

interface SeriesConfig {
  label: string;
  barClass: string;
  textClass: string;
  strokeHex: string;
}

interface MonthlyMultiSeriesChartProps {
  data: MultiSeriesMonthBucket[];
  isLineChart: boolean;
  selectedMonthKey: string | null;
  onSelectMonth: (monthKey: string | null) => void;
  series: [SeriesConfig, SeriesConfig, SeriesConfig];
  activeRingClass: string;
  activeBgClass: string;
  activeLabelClass: string;
  isCurrency?: boolean;
  emptyMessage: string;
}

function MonthlyMultiSeriesChart({
  data,
  isLineChart,
  selectedMonthKey,
  onSelectMonth,
  series,
  activeRingClass,
  activeBgClass,
  activeLabelClass,
  isCurrency = false,
  emptyMessage
}: MonthlyMultiSeriesChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return <div className="py-12 text-center text-xs text-(--text-muted)">{emptyMessage}</div>;
  }

  const formatVal = (val: number) =>
    isCurrency
      ? `₱${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : val.toLocaleString();

  const formatCompactTick = (val: number) => {
    if (isCurrency) {
      if (val >= 1_000_000) return `₱${(val / 1_000_000).toFixed(1)}M`;
      if (val >= 1_000) return `₱${(val / 1_000).toFixed(0)}k`;
      return `₱${Math.round(val)}`;
    }
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
    return `${Math.round(val)}`;
  };

  const rawMax = Math.max(...data.map((m) => Math.max(m.s1, m.s2, m.s3)), 1);
  const stepUnit = rawMax <= 4 ? 1 : Math.ceil(rawMax / 4);
  const yMax = stepUnit * 4;
  const yTicks = [yMax, stepUnit * 3, stepUnit * 2, stepUnit, 0];

  /* --- LINE GRAPH VIEW (> 2 MONTHS) --- */
  if (isLineChart) {
    const svgWidth = Math.max(640, data.length * 90);
    const svgHeight = 200;
    const padLeft = 56;
    const padRight = 28;
    const padTop = 18;
    const padBottom = 32;
    const plotWidth = svgWidth - padLeft - padRight;
    const plotHeight = svgHeight - padTop - padBottom;

    const getX = (idx: number) =>
      data.length === 1
        ? padLeft + plotWidth / 2
        : padLeft + (idx / (data.length - 1)) * plotWidth;

    const getY = (val: number) =>
      padTop + plotHeight - Math.min(1, Math.max(0, val / yMax)) * plotHeight;

    const buildPoints = (getter: (d: MultiSeriesMonthBucket) => number) =>
      data.map((d, i) => `${getX(i)},${getY(getter(d))}`).join(' ');

    const hoveredBucket = hoveredIdx !== null ? data[hoveredIdx] : null;

    return (
      <div className="pt-2 pb-1 overflow-x-auto relative">
        {hoveredBucket && hoveredIdx !== null && (
          <div
            style={{
              left: `${Math.min(82, Math.max(18, (getX(hoveredIdx) / svgWidth) * 100))}%`
            }}
            className="absolute top-2 -translate-x-1/2 flex flex-col bg-(--bg-elevated)/95 backdrop-blur-sm border border-(--border-main) p-2 rounded shadow-lg text-[10px] z-30 whitespace-nowrap pointer-events-none space-y-0.5"
          >
            <span className="font-bold text-(--text-primary)">{hoveredBucket.monthLabel}</span>
            <span className={series[0].textClass}>
              {series[0].label}: {formatVal(hoveredBucket.s1)}
            </span>
            <span className={series[1].textClass}>
              {series[1].label}: {formatVal(hoveredBucket.s2)}
            </span>
            <span className={series[2].textClass}>
              {series[2].label}: {formatVal(hoveredBucket.s3)}
            </span>
            <span className="text-[9px] text-(--text-muted) italic mt-0.5">Click point to filter KPIs</span>
          </div>
        )}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-52 min-w-140 select-none overflow-visible"
          role="img"
          aria-label="Monthly multi-series trend line chart"
        >
          {/* Horizontal Gridlines & Y-Axis Ticks */}
          {yTicks.map((tickVal, idx) => {
            const yPos = getY(tickVal);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={svgWidth - padRight}
                  y2={yPos}
                  stroke="currentColor"
                  className="text-(--border-main)"
                  strokeDasharray={tickVal === 0 ? undefined : '3 3'}
                  strokeWidth={tickVal === 0 ? 1.2 : 0.8}
                />
                <text
                  x={padLeft - 8}
                  y={yPos + 3}
                  textAnchor="end"
                  className="fill-(--text-muted) text-[9px] font-mono"
                >
                  {formatCompactTick(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Selected / Hovered Vertical Guide */}
          {data.map((m, idx) => {
            const xPos = getX(idx);
            const isSelected = selectedMonthKey === m.monthKey;
            const isHovered = hoveredIdx === idx;
            if (!isSelected && !isHovered) return null;
            return (
              <line
                key={`guide-${m.monthKey}`}
                x1={xPos}
                y1={padTop}
                x2={xPos}
                y2={padTop + plotHeight}
                stroke={isSelected ? series[0].strokeHex : 'currentColor'}
                className={!isSelected ? 'text-(--text-muted)/40' : undefined}
                strokeWidth={isSelected ? 1.75 : 1}
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Series Polylines */}
          <polyline
            fill="none"
            stroke={series[0].strokeHex}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={buildPoints((d) => d.s1)}
          />
          <polyline
            fill="none"
            stroke={series[1].strokeHex}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={buildPoints((d) => d.s2)}
          />
          <polyline
            fill="none"
            stroke={series[2].strokeHex}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={buildPoints((d) => d.s3)}
          />

          {/* Interactive Data Points & X-Axis Labels */}
          {data.map((m, idx) => {
            const xPos = getX(idx);
            const isSelected = selectedMonthKey === m.monthKey;
            const isHovered = hoveredIdx === idx;
            const colWidth = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth;

            return (
              <g
                key={m.monthKey}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSelectMonth(isSelected ? null : m.monthKey)}
              >
                <rect
                  x={xPos - colWidth / 2}
                  y={padTop}
                  width={colWidth}
                  height={plotHeight + padBottom}
                  fill="transparent"
                />

                <circle
                  cx={xPos}
                  cy={getY(m.s1)}
                  r={isSelected || isHovered ? 5 : 3.5}
                  fill={series[0].strokeHex}
                  stroke="var(--bg-surface)"
                  strokeWidth={1.5}
                />
                <circle
                  cx={xPos}
                  cy={getY(m.s2)}
                  r={isSelected || isHovered ? 5 : 3.5}
                  fill={series[1].strokeHex}
                  stroke="var(--bg-surface)"
                  strokeWidth={1.5}
                />
                <circle
                  cx={xPos}
                  cy={getY(m.s3)}
                  r={isSelected || isHovered ? 5 : 3.5}
                  fill={series[2].strokeHex}
                  stroke="var(--bg-surface)"
                  strokeWidth={1.5}
                />

                <text
                  x={xPos}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  className={`text-[10px] font-bold transition-colors ${
                    isSelected
                      ? 'fill-sky-500 underline'
                      : isHovered
                      ? 'fill-(--text-primary)'
                      : 'fill-(--text-muted)'
                  }`}
                >
                  {m.monthLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  /* --- BAR GRAPH VIEW (<= 2 MONTHS) --- */
  return (
    <div className="pt-2 pb-2 overflow-x-auto">
      <div className="flex items-end justify-around gap-4 min-w-80 h-44 px-2 border-b border-(--border-main) pb-1">
        {data.map((m, idx) => {
          const h1 = Math.max(4, Math.round((m.s1 / rawMax) * 120));
          const h2 = Math.max(4, Math.round((m.s2 / rawMax) * 120));
          const h3 = Math.max(4, Math.round((m.s3 / rawMax) * 120));
          const isSelected = selectedMonthKey === m.monthKey;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectMonth(isSelected ? null : m.monthKey)}
              className={`flex flex-col items-center flex-1 h-full justify-end group relative transition-all rounded-lg p-1 cursor-pointer ${
                isSelected ? `${activeBgClass} ring-2 ${activeRingClass}` : 'hover:bg-(--accent-subtle)'
              }`}
            >
              <div className="absolute left-1/2 -translate-x-1/2 top-2 hidden group-hover:flex flex-col bg-(--bg-elevated)/90 backdrop-blur-sm border border-(--border-main) p-2 rounded shadow-lg text-[10px] z-30 whitespace-nowrap pointer-events-none space-y-0.5">
                <span className="font-bold text-(--text-primary)">{m.monthLabel}</span>
                <span className={series[0].textClass}>
                  {series[0].label}: {formatVal(m.s1)}
                </span>
                <span className={series[1].textClass}>
                  {series[1].label}: {formatVal(m.s2)}
                </span>
                <span className={series[2].textClass}>
                  {series[2].label}: {formatVal(m.s3)}
                </span>
                <span className="text-[9px] text-(--text-muted) italic mt-1">Click to filter KPIs</span>
              </div>

              <div className="flex items-end justify-center gap-1.5 w-full max-w-24 h-32 px-1">
                <div
                  className={`w-3.5 ${series[0].barClass} rounded-t-sm transition-all duration-300 hover:opacity-90`}
                  style={{ height: `${h1}px` }}
                  title={`${series[0].label}: ${formatVal(m.s1)}`}
                />
                <div
                  className={`w-3.5 ${series[1].barClass} rounded-t-sm transition-all duration-300 hover:opacity-90`}
                  style={{ height: `${h2}px` }}
                  title={`${series[1].label}: ${formatVal(m.s2)}`}
                />
                <div
                  className={`w-3.5 ${series[2].barClass} rounded-t-sm transition-all duration-300 hover:opacity-90`}
                  style={{ height: `${h3}px` }}
                  title={`${series[2].label}: ${formatVal(m.s3)}`}
                />
              </div>

              <span
                className={`text-[10px] font-bold mt-2 truncate w-full text-center ${
                  isSelected ? `${activeLabelClass} font-black underline` : 'text-(--text-muted)'
                }`}
              >
                {m.monthLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --- Interfaces --- */
interface VehicleRecord {
  vehicle_id: string;
  plate_no: string;
  customer_name: string;
  supervisor_ids: string[];
  supervisor_name: string;
  make_name: string;
  model_name: string;
  job_order_type_id: string | null;
  job_order_type_desc: string;
  vehicle_year: number;
  vehicle_age_years: number;
  is_active: boolean;
  activity_status: string;
  job_order_count: number;
  completed_job_count: number;
  labor_hours: number;
  labor_cost: number;
  labor_billed: number;
  materials_cost: number;
  contract_cost: number;
  total_maintenance_cost: number;
  avg_cost_per_job: number;
  avg_cycle_time_days: number;
  total_km: number;
  repeat_job_count: number;
  distinct_task_count: number;
  avg_days_between_repeat_jobs: number;
  overdue_pm_count: number;
  incident_count: number;
  major_incident_count: number;
  incident_loss: number;
}

interface JobOrderTypeOption {
  type_id: string;
  type_desc: string;
}

interface JobOrderStatusOption {
  status_id: string;
  status_name: string;
}

interface SupervisorOption {
  employee_id: string;
  employee_name: string;
}

interface VehicleJobHistory {
  job_order_no: string;
  created_at: string;
  date_completed: string | null;
  status_name: string;
  priority_desc: string;
  total_cost: number;
}

interface VehicleTaskHistory {
  fmea_id: string;
  risk_name: string;
  first_date: string;
  latest_date: string;
  occurrence_count: number;
}

interface VehicleRepeatRepairHistory {
  task_standard_id: string;
  task_name: string;
  first_repair_date: string;
  latest_repair_date: string;
  recurrence_count: number;
  days_between_repairs: number;
}

interface VehiclePmStatusDetail {
  pm_code: string;
  current_rdg: number;
  target_pm_rdg: number;
  is_due: boolean;
}

interface VehicleIncidentHistory {
  incident_refno: string;
  incident_date: string;
  severity: string;
  loss: number;
  status: string;
}

interface KanbanCardItem {
  job_order_no: string;
  vehicle_id: string;
  plate_no: string;
  make_name: string;
  model_name: string;
  date_created: string;
  date_needed: string;
  status_label: string;
  type_desc: string;
  materials_cost: number;
  labor_cost: number;
  contract_cost: number;
  total_cost: number;
}

type KanbanColumnKey = 'Queued' | 'On-hold' | 'In-Progress' | 'Delayed' | 'Completed' | 'Cancelled';

const KANBAN_COLUMNS: {
  key: KanbanColumnKey;
  title: string;
  badgeClass: string;
  borderClass: string;
  dotClass: string;
}[] = [
  {
    key: 'Queued',
    title: 'Queued',
    badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
    borderClass: 'border-t-slate-500',
    dotClass: 'bg-slate-500'
  },
  {
    key: 'On-hold',
    title: 'On-hold',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    borderClass: 'border-t-amber-500',
    dotClass: 'bg-amber-500'
  },
  {
    key: 'In-Progress',
    title: 'In-Progress',
    badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    borderClass: 'border-t-sky-500',
    dotClass: 'bg-sky-500'
  },
  {
    key: 'Delayed',
    title: 'Delayed',
    badgeClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    borderClass: 'border-t-orange-500',
    dotClass: 'bg-orange-500'
  },
  {
    key: 'Completed',
    title: 'Completed',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    borderClass: 'border-t-emerald-500',
    dotClass: 'bg-emerald-500'
  },
  {
    key: 'Cancelled',
    title: 'Cancelled',
    badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    borderClass: 'border-t-rose-500',
    dotClass: 'bg-rose-500'
  }
];

function normalizeKanbanStatus(rawStatus: string): KanbanColumnKey | null {
  const s = rawStatus.trim().toLowerCase().replace(/[\s_]+/g, '-');
  if (s === 'queued' || s === 'queue' || s === 'open' || s === 'pending') return 'Queued';
  if (s === 'on-hold' || s === 'onhold' || s === 'hold') return 'On-hold';
  if (s === 'in-progress' || s === 'inprogress' || s === 'ongoing' || s === 'active') return 'In-Progress';
  if (s === 'delayed' || s === 'delay' || s === 'overdue') return 'Delayed';
  if (s === 'completed' || s === 'complete' || s === 'closed' || s === 'done') return 'Completed';
  if (s === 'cancelled' || s === 'canceled' || s === 'cancel') return 'Cancelled';
  return null;
}

export function JobOrderDashboard() {
  const [activeSubTab, setActiveSubTab] = useState<'type' | 'costs' | 'breakdown' | 'vehicles' | 'kanban'>('type');
  const [rankingTab, setRankingTab] = useState<'jobs' | 'cost'>('jobs');

  const [loading, setLoading] = useState<boolean>(true);
  const [dateLoading, setDateLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected Month States for Chart Click Filtering
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [selectedCostMonthKey, setSelectedCostMonthKey] = useState<string | null>(null);
  const [selectedBreakdownMonthKey, setSelectedBreakdownMonthKey] = useState<string | null>(null);

  // Selected Kanban Card for Inspection Table
  const [selectedKanbanCard, setSelectedKanbanCard] = useState<KanbanCardItem | null>(null);

  // Default dates (last 90 days)
  const defaultEndDate = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  const defaultStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split('T')[0];
  }, []);

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);

  // Timezone-safe month span check (YYYY-MM-DD split avoids UTC midnight drift)
  const isPeriodTraversingOver2Months = useMemo(() => {
    if (!startDate || !endDate) return false;
    const [sYear, sMonth] = startDate.split('-').map(Number);
    const [eYear, eMonth] = endDate.split('-').map(Number);
    if (!sYear || !sMonth || !eYear || !eMonth) return false;

    const monthSpan = (eYear - sYear) * 12 + (eMonth - sMonth) + 1;
    return monthSpan > 2;
  }, [startDate, endDate]);

  // Continuous local YYYY-MM buckets across selected period
  const periodMonthBuckets = useMemo(() => {
    if (!startDate || !endDate) return [];
    const [sYear, sMonth] = startDate.split('-').map(Number);
    const [eYear, eMonth] = endDate.split('-').map(Number);
    if (!sYear || !sMonth || !eYear || !eMonth) return [];

    const buckets: { monthKey: string; monthLabel: string }[] = [];
    let year = sYear;
    let month = sMonth;

    while (year < eYear || (year === eYear && month <= eMonth)) {
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const labelDate = new Date(year, month - 1, 1);
      const label = labelDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      buckets.push({ monthKey: key, monthLabel: label });

      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    return buckets;
  }, [startDate, endDate]);

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setSelectedMonthKey(null);
    setSelectedCostMonthKey(null);
    setSelectedBreakdownMonthKey(null);
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setSelectedMonthKey(null);
    setSelectedCostMonthKey(null);
    setSelectedBreakdownMonthKey(null);
  };

  // Filter States
  const [filterCustomer, setFilterCustomer] = useState<string>('ALL');
  const [filterMake, setFilterMake] = useState<string>('ALL');
  const [filterModel, setFilterModel] = useState<string>('ALL');
  const [filterJobOrderTypeId, setFilterJobOrderTypeId] = useState<string>('ALL');
  const [filterStatusId, setFilterStatusId] = useState<string>('ALL');
  const [filterSupervisorId, setFilterSupervisorId] = useState<string>('ALL');

  // Dropdown Master Options & Raw Jobs
  const [jobOrderTypes, setJobOrderTypes] = useState<JobOrderTypeOption[]>([]);
  const [jobOrderStatuses, setJobOrderStatuses] = useState<JobOrderStatusOption[]>([]);
  const [supervisorsList, setSupervisorsList] = useState<SupervisorOption[]>([]);

  // Data states
  const [vehiclesData, setVehiclesData] = useState<VehicleRecord[]>([]);
  const [allJobsCache, setAllJobsCache] = useState<Record<string, unknown>[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(null);
  const [vehicleDrilldownLoading, setVehicleDrilldownLoading] = useState<boolean>(false);
  const [vehicleJobHistory, setVehicleJobHistory] = useState<VehicleJobHistory[]>([]);
  const [vehicleTaskHistory, setVehicleTaskHistory] = useState<VehicleTaskHistory[]>([]);
  const [vehicleRepeatHistory, setVehicleRepeatHistory] = useState<VehicleRepeatRepairHistory[]>([]);
  const [vehiclePmDetails, setVehiclePmDetails] = useState<VehiclePmStatusDetail[]>([]);
  const [vehicleIncidentHistory, setVehicleIncidentHistory] = useState<VehicleIncidentHistory[]>([]);

  /* --- Fetch Equipment Data & Master Options --- */
  const fetchVehiclesData = useCallback(async () => {
    try {
      setDateLoading(true);
      setErrorMsg(null);

      const [vehiclesRes, jobsRes, employeesRes, joTypesRes, joStatusRes] = await Promise.all([
        supabase.from('vw_vehicle_bad_actor_metrics').select('*'),
        supabase.from('joborder_master').select(`
          job_order_no, vehicle_id, type_id, status_id, created_at, expected_completion, date_completed, assigned_supervisor, 
          labor_cost, materials_cost, contract_cost, total_cost,
          vehicles ( plate_no ),
          joborder_type ( type_id, type_desc ),
          joborder_status ( status_id, status_name )
        `),
        supabase.from('employees').select('employee_id, employee_name').eq('is_active', true).eq('is_supervisor', true).order('employee_name'),
        supabase.from('joborder_type').select('type_id, type_desc').order('type_desc'),
        supabase.from('joborder_status').select('status_id, status_name').order('status_name')
      ]);

      if (vehiclesRes.error) throw vehiclesRes.error;
      if (jobsRes.error) throw jobsRes.error;
      if (employeesRes.error) throw employeesRes.error;
      if (joTypesRes.error) throw joTypesRes.error;
      if (joStatusRes.error) throw joStatusRes.error;

      const rawVehicles = vehiclesRes.data || [];
      const allJobs = jobsRes.data || [];
      const activeSupervisors = employeesRes.data || [];

      setJobOrderTypes(joTypesRes.data || []);
      setJobOrderStatuses(joStatusRes.data || []);
      setSupervisorsList(activeSupervisors);
      setAllJobsCache(allJobs);

      // Build employee name lookup map
      const employeeNameMap = new Map<string, string>();
      activeSupervisors.forEach((emp: Record<string, unknown>) => {
        if (emp.employee_id && emp.employee_name) {
          employeeNameMap.set(String(emp.employee_id), String(emp.employee_name));
        }
      });

      const vehicleSupervisorSetMap = new Map<string, Set<string>>();
      const vehicleSupervisorNameSetMap = new Map<string, Set<string>>();
      const vehicleTypeRepeatMap = new Map<string, number>();

      allJobs.forEach((j: Record<string, unknown>) => {
        if (!j.vehicle_id) return;
        const vId = String(j.vehicle_id);

        if (j.assigned_supervisor) {
          const supId = String(j.assigned_supervisor);
          const supName = employeeNameMap.get(supId) || 'Unassigned';

          if (!vehicleSupervisorSetMap.has(vId)) {
            vehicleSupervisorSetMap.set(vId, new Set());
            vehicleSupervisorNameSetMap.set(vId, new Set());
          }

          vehicleSupervisorSetMap.get(vId)!.add(supId);
          vehicleSupervisorNameSetMap.get(vId)!.add(supName);
        }

        if (j.type_id) {
          const key = `${vId}_${j.type_id}`;
          vehicleTypeRepeatMap.set(key, (vehicleTypeRepeatMap.get(key) || 0) + 1);
        }
      });

      // Deduplicate rawVehicles by vehicle_id
      const uniqueVehiclesMap = new Map<string, Record<string, unknown>>();
      rawVehicles.forEach((v: Record<string, unknown>) => {
        const vId = String(v.vehicle_id);
        if (!uniqueVehiclesMap.has(vId)) {
          uniqueVehiclesMap.set(vId, v);
        }
      });

      const tempVehicles: VehicleRecord[] = Array.from(uniqueVehiclesMap.values()).map((v: Record<string, unknown>) => {
        const vId = String(v.vehicle_id);
        const vAge = Number(v.vehicle_age_years || 0);
        const typeId = v.job_order_type_id ? String(v.job_order_type_id) : null;

        let typeRepeatCount = 0;
        if (typeId) {
          const countForType = vehicleTypeRepeatMap.get(`${vId}_${typeId}`) || 1;
          typeRepeatCount = Math.max(0, countForType - 1);
        }

        const supIds = Array.from(vehicleSupervisorSetMap.get(vId) || []);
        const supNames = Array.from(vehicleSupervisorNameSetMap.get(vId) || ['Unassigned']);

        return {
          vehicle_id: vId,
          plate_no: String(v.plate_no || 'N/A'),
          customer_name: String(v.customer_name || 'Unassigned'),
          supervisor_ids: supIds,
          supervisor_name: supNames.join(', '),
          make_name: String(v.make_name || 'Unknown'),
          model_name: String(v.model_name || 'Unknown'),
          job_order_type_id: typeId,
          job_order_type_desc: String(v.job_order_type_desc || 'General'),
          vehicle_year: Number(v.vehicle_year || new Date().getFullYear()),
          vehicle_age_years: vAge,
          is_active: Boolean(v.is_active ?? true),
          activity_status: String(v.activity_status || 'Active'),
          job_order_count: Number(v.job_order_count || 0),
          completed_job_count: Number(v.completed_job_count || 0),
          labor_hours: Number(v.labor_hours || 0),
          labor_cost: Number(v.labor_cost || 0),
          labor_billed: Number(v.labor_billed || 0),
          materials_cost: Number(v.materials_cost || 0),
          contract_cost: Number(v.contract_cost || 0),
          total_maintenance_cost: Number(v.total_maintenance_cost || 0),
          avg_cost_per_job: Number(v.avg_cost_per_job || 0),
          avg_cycle_time_days: Number(v.avg_cycle_time_days || 0),
          total_km: Number(v.total_km || 0),
          repeat_job_count: typeRepeatCount,
          distinct_task_count: Number(v.distinct_task_count || 0),
          avg_days_between_repeat_jobs: 0,
          overdue_pm_count: Number(v.overdue_pm_count || 0),
          incident_count: Number(v.incident_count || 0),
          major_incident_count: Number(v.major_incident_count || 0),
          incident_loss: Number(v.incident_loss || 0)
        };
      });

      setVehiclesData(tempVehicles);
    } catch (err: unknown) {
      console.error('Error fetching equipment metrics:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network connection lost. Please check your connection and try again.';
      setErrorMsg(errorMessage);
    } finally {
      setDateLoading(false);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchVehicleDrilldown = async (vehicleId: string) => {
    try {
      setVehicleDrilldownLoading(true);
      const [jobsRes, tasksRes, risksRes, pmRes, incRes] = await Promise.all([
        supabase.from('joborder_master').select(`
          job_order_no, created_at, date_completed, total_cost,
          joborder_status ( status_name ),
          joborder_priority ( priority_desc )
        `).eq('vehicle_id', vehicleId).order('created_at', { ascending: false }),
        supabase.from('joborder_task_details').select(`
          task_standard_id, created_at,
          equipment_taskstandards ( task_standard_desc ),
          joborder_master!inner ( vehicle_id, created_at )
        `).eq('joborder_master.vehicle_id', vehicleId).gte('joborder_master.created_at', startDate).lte('joborder_master.created_at', endDate + 'T23:59:59').order('created_at', { ascending: true }),
        supabase.from('vehicle_daily_risks').select(`
          fmea_id, created_at,
          vehicle_daily_logs!inner ( vehicle_id, log_date ),
          vw_fmea_items ( failure_mode, failure_cause )
        `).eq('vehicle_daily_logs.vehicle_id', vehicleId).gte('created_at', startDate).lte('created_at', endDate + 'T23:59:59').order('created_at', { ascending: true }),
        supabase.from('vehicle_pm').select('*').eq('vehicle_id', vehicleId).single(),
        supabase.from('incident_report').select(`
          *,
          joborder_status ( status_name )
        `).eq('vehicle_id', vehicleId).order('incident_date', { ascending: false })
      ]);

      setVehicleJobHistory((jobsRes.data || []).map((j: Record<string, unknown>) => {
        const rawStat = j.joborder_status as Record<string, unknown> | null;
        const rawPrio = j.joborder_priority as Record<string, unknown> | null;
        return {
          job_order_no: String(j.job_order_no || 'JO'),
          created_at: String(j.created_at || '').substring(0, 10),
          date_completed: j.date_completed ? String(j.date_completed).substring(0, 10) : null,
          status_name: String(rawStat?.status_name || 'Open'),
          priority_desc: String(rawPrio?.priority_desc || 'Normal'),
          total_cost: Number(j.total_cost || 0)
        };
      }));

      // Process Issue / Task History from vehicle_daily_risks
      const rawRisks = (risksRes.data || []) as Record<string, unknown>[];
      const riskOccurrenceMap = new Map<string, { risk_name: string; dates: string[] }>();

      rawRisks.forEach((r: Record<string, unknown>) => {
        const fmeaId = String(r.fmea_id || 'UNKNOWN');
        const fmeaItem = r.vw_fmea_items as Record<string, unknown> | null;
        const riskName = String(fmeaItem?.failure_mode || fmeaItem?.failure_cause || 'Inspection Risk Flag');
        const logDate = String(r.created_at || new Date().toISOString()).substring(0, 10);

        if (!riskOccurrenceMap.has(fmeaId)) {
          riskOccurrenceMap.set(fmeaId, { risk_name: riskName, dates: [] });
        }
        riskOccurrenceMap.get(fmeaId)!.dates.push(logDate);
      });

      const processedDailyRisks: VehicleTaskHistory[] = [];
      riskOccurrenceMap.forEach((val, fmeaId) => {
        const sortedDates = val.dates.sort();
        processedDailyRisks.push({
          fmea_id: fmeaId,
          risk_name: val.risk_name,
          first_date: sortedDates[0],
          latest_date: sortedDates[sortedDates.length - 1],
          occurrence_count: sortedDates.length
        });
      });

      setVehicleTaskHistory(processedDailyRisks);

      // Repeat Repair History Formula
      const rawTasks = (tasksRes.data || []) as Record<string, unknown>[];
      const taskStandardMap = new Map<string, { task_name: string; dates: string[] }>();
      rawTasks.forEach((t: Record<string, unknown>) => {
        const tStdId = String(t.task_standard_id || 'UNKNOWN');
        const std = t.equipment_taskstandards as Record<string, unknown> | null;
        const tName = String(std?.task_standard_desc || 'Standard Task');
        const tDate = String(t.created_at || new Date().toISOString()).substring(0, 10);

        if (!taskStandardMap.has(tStdId)) {
          taskStandardMap.set(tStdId, { task_name: tName, dates: [] });
        }
        taskStandardMap.get(tStdId)!.dates.push(tDate);
      });

      const dynamicRepeatHistory: VehicleRepeatRepairHistory[] = [];
      taskStandardMap.forEach((val, tStdId) => {
        if (val.dates.length > 1) {
          const sortedDates = val.dates.sort();
          const firstDate = sortedDates[0];
          const latestDate = sortedDates[sortedDates.length - 1];
          const diffTime = Math.abs(new Date(latestDate).getTime() - new Date(firstDate).getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          dynamicRepeatHistory.push({
            task_standard_id: tStdId,
            task_name: val.task_name,
            first_repair_date: firstDate,
            latest_repair_date: latestDate,
            recurrence_count: sortedDates.length,
            days_between_repairs: Math.round(diffDays / (sortedDates.length - 1))
          });
        }
      });

      setVehicleRepeatHistory(dynamicRepeatHistory);

      // PM Status Details
      const pmRecord = pmRes.data || {};
      const currentRdg = Number(pmRecord.current_rdg || 45000);

      const pmConfigs = [
        { code: 'PM2', target: Number(pmRecord.pm2_current || 50000) },
        { code: 'PM3', target: Number(pmRecord.pm3_current || 55000) },
        { code: 'PM4', target: Number(pmRecord.pm4_current || 60000) },
        { code: 'PM5', target: Number(pmRecord.pm5_current || 65000) },
        { code: 'PM6', target: Number(pmRecord.pm6_current || 70000) },
        { code: 'PM7', target: Number(pmRecord.pm7_current || 75000) }
      ];

      const generatedPmDetails: VehiclePmStatusDetail[] = pmConfigs.map((cfg) => ({
        pm_code: cfg.code,
        current_rdg: currentRdg,
        target_pm_rdg: cfg.target,
        is_due: currentRdg >= cfg.target
      }));

      setVehiclePmDetails(generatedPmDetails);

      setVehicleIncidentHistory((incRes.data || []).map((i: Record<string, unknown>) => {
        const rawStat = i.joborder_status as Record<string, unknown> | null;
        return {
          incident_refno: String(i.incident_refno || i.incident_ref || `INC-2026-${String(i.incident_id || '001').padStart(3, '0')}`),
          incident_date: String(i.incident_date || '').substring(0, 10),
          severity: String(i.incident_severity || 'Moderate'),
          loss: Number(i.incident_loss || 0),
          status: String(rawStat?.status_name || i.incident_status || 'Closed')
        };
      }));
    } catch (err) {
      console.error('Error loading equipment drilldown:', err);
    } finally {
      setVehicleDrilldownLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function init() {
      await fetchVehiclesData();
      if (active) {
        setLoading(false);
      }
    }

    init();

    return () => {
      active = false;
    };
  }, [fetchVehiclesData]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchVehiclesData();
    if (selectedVehicle) {
      await fetchVehicleDrilldown(selectedVehicle.vehicle_id);
    }
    setRefreshing(false);
  };

  // Dropdown options memos
  const customerOptions = useMemo<DropdownOption[]>(() => [
    { value: 'ALL', label: 'All Customers' },
    ...Array.from(new Set(vehiclesData.map((v) => v.customer_name))).map((c) => ({ value: c, label: c }))
  ], [vehiclesData]);

  const makeOptions = useMemo<DropdownOption[]>(() => [
    { value: 'ALL', label: 'All Makes' },
    ...Array.from(new Set(vehiclesData.map((v) => v.make_name))).map((m) => ({ value: m, label: m }))
  ], [vehiclesData]);

  const modelOptions = useMemo<DropdownOption[]>(() => [
    { value: 'ALL', label: 'All Models' },
    ...Array.from(new Set(vehiclesData.map((v) => v.model_name))).map((m) => ({ value: m, label: m }))
  ], [vehiclesData]);

  const joTypeOptions = useMemo<DropdownOption[]>(() => [
    { value: 'ALL', label: 'All JO Types' },
    ...jobOrderTypes.map((jot) => ({ value: jot.type_id, label: jot.type_desc }))
  ], [jobOrderTypes]);

  const joStatusOptions = useMemo<DropdownOption[]>(() => [
    { value: 'ALL', label: 'All Statuses' },
    ...jobOrderStatuses.map((st) => ({ value: st.status_id, label: st.status_name }))
  ], [jobOrderStatuses]);

  const supervisorOptions = useMemo<DropdownOption[]>(() => [
    { value: 'ALL', label: 'All Supervisors' },
    ...supervisorsList.map((sup) => ({ value: sup.employee_id, label: sup.employee_name }))
  ], [supervisorsList]);

  // Vehicle segment lookup map (Customer / Make / Model) for monthly charts
  const segmentVehicleIds = useMemo(() => {
    const ids = new Set<string>();
    vehiclesData.forEach((v) => {
      if (filterCustomer !== 'ALL' && v.customer_name !== filterCustomer) return;
      if (filterMake !== 'ALL' && v.make_name !== filterMake) return;
      if (filterModel !== 'ALL' && v.model_name !== filterModel) return;
      ids.add(v.vehicle_id);
    });
    return ids;
  }, [vehiclesData, filterCustomer, filterMake, filterModel]);

  // Dynamically recalculate equipment metrics based on date range, supervisor, status & JO Type filters
  const filteredVehicles = useMemo(() => {
    return vehiclesData
      .map((v) => {
        let matchingJobs = allJobsCache.filter((j) => {
          if (String(j.vehicle_id) !== v.vehicle_id) return false;

          const createdAt = String(j.created_at || '').substring(0, 10);
          if (createdAt && (createdAt < startDate || createdAt > endDate)) return false;

          return true;
        });

        if (filterSupervisorId !== 'ALL') {
          matchingJobs = matchingJobs.filter((j) => String(j.assigned_supervisor) === filterSupervisorId);
        }

        if (filterJobOrderTypeId !== 'ALL') {
          matchingJobs = matchingJobs.filter((j) => String(j.type_id || '') === filterJobOrderTypeId);
        }

        if (filterStatusId !== 'ALL') {
          matchingJobs = matchingJobs.filter((j) => String(j.status_id || '') === filterStatusId);
        }

        const joCount = matchingJobs.length;
        const laborCost = matchingJobs.reduce((acc, j) => acc + Number(j.labor_cost || 0), 0);
        const matCost = matchingJobs.reduce((acc, j) => acc + Number(j.materials_cost || 0), 0);
        const contractCost = matchingJobs.reduce((acc, j) => acc + Number(j.contract_cost || 0), 0);
        const totalCost = matchingJobs.reduce((acc, j) => acc + Number(j.total_cost || 0), 0);

        if (
          joCount === 0 &&
          (filterSupervisorId !== 'ALL' ||
            filterJobOrderTypeId !== 'ALL' ||
            filterStatusId !== 'ALL' ||
            startDate !== defaultStartDate ||
            endDate !== defaultEndDate)
        ) {
          return null;
        }

        return {
          ...v,
          job_order_count: joCount,
          completed_job_count: joCount,
          labor_cost: laborCost,
          materials_cost: matCost,
          contract_cost: contractCost,
          total_maintenance_cost: totalCost,
          avg_cost_per_job: joCount > 0 ? totalCost / joCount : 0
        };
      })
      .filter((v): v is VehicleRecord => v !== null)
      .filter((v) => {
        if (filterCustomer !== 'ALL' && v.customer_name !== filterCustomer) return false;
        if (filterMake !== 'ALL' && v.make_name !== filterMake) return false;
        if (filterModel !== 'ALL' && v.model_name !== filterModel) return false;
        if (v.job_order_count === 0 && (filterSupervisorId !== 'ALL' || filterJobOrderTypeId !== 'ALL' || filterStatusId !== 'ALL')) return false;
        return true;
      });
  }, [vehiclesData, allJobsCache, filterCustomer, filterMake, filterModel, filterJobOrderTypeId, filterStatusId, filterSupervisorId, startDate, endDate, defaultStartDate, defaultEndDate]);

  // Kanban Board Grouped Cards (Decoupled from period startDate/endDate; displays plate_no)
  const kanbanBoardData = useMemo(() => {
    const grouped: Record<KanbanColumnKey, KanbanCardItem[]> = {
      Queued: [],
      'On-hold': [],
      'In-Progress': [],
      Delayed: [],
      Completed: [],
      Cancelled: []
    };

    const equipmentMap = new Map<string, VehicleRecord>();
    vehiclesData.forEach((v) => equipmentMap.set(v.vehicle_id, v));

    allJobsCache.forEach((j) => {
      if (!j.vehicle_id) return;
      const eqId = String(j.vehicle_id);
      const eq = equipmentMap.get(eqId);

      if (filterCustomer !== 'ALL' && eq?.customer_name !== filterCustomer) return;
      if (filterMake !== 'ALL' && eq?.make_name !== filterMake) return;
      if (filterModel !== 'ALL' && eq?.model_name !== filterModel) return;
      if (filterSupervisorId !== 'ALL' && String(j.assigned_supervisor) !== filterSupervisorId) return;
      if (filterJobOrderTypeId !== 'ALL' && String(j.type_id || '') !== filterJobOrderTypeId) return;
      if (filterStatusId !== 'ALL' && String(j.status_id || '') !== filterStatusId) return;

      const rawStat = j.joborder_status as Record<string, unknown> | null;
      let statusName = String(rawStat?.status_name || '');
      if (!statusName && j.status_id) {
        const foundStatus = jobOrderStatuses.find((st) => st.status_id === String(j.status_id));
        if (foundStatus) statusName = foundStatus.status_name;
      }

      const columnKey = normalizeKanbanStatus(statusName);
      if (!columnKey) return;

      const rawType = j.joborder_type as Record<string, unknown> | null;
      let typeDesc = String(rawType?.type_desc || '');
      if (!typeDesc && j.type_id) {
        const foundType = jobOrderTypes.find((t) => t.type_id === String(j.type_id));
        if (foundType) typeDesc = foundType.type_desc;
      }

      const rawVeh = j.vehicles as Record<string, unknown> | null;
      const resolvedPlateNo = eq?.plate_no || (rawVeh?.plate_no ? String(rawVeh.plate_no) : 'N/A');

      const dateCreated = j.created_at ? String(j.created_at).substring(0, 10) : '—';
      const rawNeeded = j.expected_completion || j.date_completed;
      const dateNeeded = rawNeeded ? String(rawNeeded).substring(0, 10) : 'TBD';

      grouped[columnKey].push({
        job_order_no: String(j.job_order_no || 'N/A'),
        vehicle_id: eqId,
        plate_no: resolvedPlateNo,
        make_name: eq?.make_name || 'Unknown',
        model_name: eq?.model_name || 'Unknown',
        date_created: dateCreated,
        date_needed: dateNeeded,
        status_label: statusName || columnKey,
        type_desc: typeDesc || 'General',
        materials_cost: Number(j.materials_cost || 0),
        labor_cost: Number(j.labor_cost || 0),
        contract_cost: Number(j.contract_cost || 0),
        total_cost: Number(j.total_cost || 0)
      });
    });

    (Object.keys(grouped) as KanbanColumnKey[]).forEach((col) => {
      grouped[col].sort((a, b) => b.date_created.localeCompare(a.date_created));
    });

    return grouped;
  }, [
    allJobsCache,
    vehiclesData,
    jobOrderStatuses,
    jobOrderTypes,
    filterCustomer,
    filterMake,
    filterModel,
    filterSupervisorId,
    filterJobOrderTypeId,
    filterStatusId
  ]);

  // Compute job order type counts & costs based on filtered equipment or all jobs cache within date range AND selectedMonthKey
  const jobOrderTypeMetrics = useMemo(() => {
    const typeCountMap = new Map<string, number>();
    const typeCostMap = new Map<string, number>();

    let filteredTotalJoCount = 0;

    allJobsCache.forEach((j) => {
      if (!j.vehicle_id || !segmentVehicleIds.has(String(j.vehicle_id))) return;

      const createdAt = String(j.created_at || '').substring(0, 10);
      if (createdAt && (createdAt < startDate || createdAt > endDate)) return;

      if (selectedMonthKey && (!createdAt || createdAt.substring(0, 7) !== selectedMonthKey)) return;

      if (filterSupervisorId !== 'ALL' && String(j.assigned_supervisor) !== filterSupervisorId) return;
      if (filterJobOrderTypeId !== 'ALL' && String(j.type_id || '') !== filterJobOrderTypeId) return;
      if (filterStatusId !== 'ALL' && String(j.status_id || '') !== filterStatusId) return;

      filteredTotalJoCount += 1;

      const rawType = j.joborder_type as Record<string, unknown> | null;
      let typeDesc = String(rawType?.type_desc || '');

      if (!typeDesc && j.type_id) {
        const found = jobOrderTypes.find((t) => t.type_id === String(j.type_id));
        if (found) typeDesc = found.type_desc;
      }

      if (!typeDesc) typeDesc = 'General / Unclassified';

      const cost = Number(j.total_cost || 0);

      typeCountMap.set(typeDesc, (typeCountMap.get(typeDesc) || 0) + 1);
      typeCostMap.set(typeDesc, (typeCostMap.get(typeDesc) || 0) + cost);
    });

    const counts: { type_desc: string; count: number }[] = [];
    typeCountMap.forEach((count, type_desc) => {
      counts.push({ type_desc, count });
    });

    let plannedCost = 0;
    let emergencyCost = 0;
    let reworkCost = 0;

    let plannedCount = 0;
    let emergencyCount = 0;
    let reworkCount = 0;

    typeCostMap.forEach((cost, desc) => {
      const lower = desc.toLowerCase();
      if (lower.includes('plan')) plannedCost += cost;
      else if (lower.includes('emerg') || lower.includes('unplan')) emergencyCost += cost;
      else if (lower.includes('rework') || lower.includes('repeat')) reworkCost += cost;
    });

    typeCountMap.forEach((cnt, desc) => {
      const lower = desc.toLowerCase();
      if (lower.includes('plan')) plannedCount += cnt;
      else if (lower.includes('emerg') || lower.includes('unplan')) emergencyCount += cnt;
      else if (lower.includes('rework') || lower.includes('repeat')) reworkCount += cnt;
    });

    return {
      counts: counts.sort((a, b) => b.count - a.count),
      plannedCost,
      emergencyCost,
      reworkCost,
      plannedCount,
      emergencyCount,
      reworkCount,
      filteredTotalJoCount
    };
  }, [segmentVehicleIds, allJobsCache, jobOrderTypes, filterSupervisorId, filterJobOrderTypeId, filterStatusId, startDate, endDate, selectedMonthKey]);

  // Compute Job Order Costs sub-tab metrics dynamically filtered by selectedCostMonthKey
  const jobOrderCostSubTabMetrics = useMemo(() => {
    let plannedCost = 0;
    let emergencyCost = 0;
    let reworkCost = 0;
    let totalCost = 0;

    allJobsCache.forEach((j) => {
      if (!j.vehicle_id || !segmentVehicleIds.has(String(j.vehicle_id))) return;

      const createdAt = String(j.created_at || '').substring(0, 10);
      if (createdAt && (createdAt < startDate || createdAt > endDate)) return;

      if (selectedCostMonthKey && (!createdAt || createdAt.substring(0, 7) !== selectedCostMonthKey)) return;

      if (filterSupervisorId !== 'ALL' && String(j.assigned_supervisor) !== filterSupervisorId) return;
      if (filterJobOrderTypeId !== 'ALL' && String(j.type_id || '') !== filterJobOrderTypeId) return;
      if (filterStatusId !== 'ALL' && String(j.status_id || '') !== filterStatusId) return;

      const rawType = j.joborder_type as Record<string, unknown> | null;
      let typeDesc = String(rawType?.type_desc || '');
      if (!typeDesc && j.type_id) {
        const found = jobOrderTypes.find((t) => t.type_id === String(j.type_id));
        if (found) typeDesc = found.type_desc;
      }
      const lower = typeDesc.toLowerCase();
      const cost = Number(j.total_cost || 0);

      totalCost += cost;

      if (lower.includes('plan')) plannedCost += cost;
      else if (lower.includes('emerg') || lower.includes('unplan')) emergencyCost += cost;
      else if (lower.includes('rework') || lower.includes('repeat')) reworkCost += cost;
    });

    return {
      plannedCost,
      emergencyCost,
      reworkCost,
      totalCost
    };
  }, [segmentVehicleIds, allJobsCache, jobOrderTypes, filterSupervisorId, filterJobOrderTypeId, filterStatusId, startDate, endDate, selectedCostMonthKey]);

  // Compute Job Order Cost Breakdown sub-tab metrics dynamically filtered by selectedBreakdownMonthKey
  const jobOrderBreakdownSubTabMetrics = useMemo(() => {
    let materialsCost = 0;
    let laborCost = 0;
    let contractCost = 0;
    let totalCost = 0;

    allJobsCache.forEach((j) => {
      if (!j.vehicle_id || !segmentVehicleIds.has(String(j.vehicle_id))) return;

      const createdAt = String(j.created_at || '').substring(0, 10);
      if (createdAt && (createdAt < startDate || createdAt > endDate)) return;

      if (selectedBreakdownMonthKey && (!createdAt || createdAt.substring(0, 7) !== selectedBreakdownMonthKey)) return;

      if (filterSupervisorId !== 'ALL' && String(j.assigned_supervisor) !== filterSupervisorId) return;
      if (filterJobOrderTypeId !== 'ALL' && String(j.type_id || '') !== filterJobOrderTypeId) return;
      if (filterStatusId !== 'ALL' && String(j.status_id || '') !== filterStatusId) return;

      const mat = Number(j.materials_cost || 0);
      const lab = Number(j.labor_cost || 0);
      const con = Number(j.contract_cost || 0);
      const tot = Number(j.total_cost || 0);

      materialsCost += mat;
      laborCost += lab;
      contractCost += con;
      totalCost += tot;
    });

    return {
      materialsCost,
      laborCost,
      contractCost,
      totalCost
    };
  }, [segmentVehicleIds, allJobsCache, filterSupervisorId, filterJobOrderTypeId, filterStatusId, startDate, endDate, selectedBreakdownMonthKey]);

  // Compute Monthly Job Order Type Count Analysis
  const monthlyJobOrderTypeCounts = useMemo(() => {
    const monthMap = new Map<string, { monthKey: string; monthLabel: string; planned: number; emergency: number; rework: number }>();
    periodMonthBuckets.forEach((b) => {
      monthMap.set(b.monthKey, { ...b, planned: 0, emergency: 0, rework: 0 });
    });

    allJobsCache.forEach((j) => {
      if (!j.vehicle_id || !segmentVehicleIds.has(String(j.vehicle_id))) return;
      if (filterSupervisorId !== 'ALL' && String(j.assigned_supervisor) !== filterSupervisorId) return;
      if (filterJobOrderTypeId !== 'ALL' && String(j.type_id || '') !== filterJobOrderTypeId) return;
      if (filterStatusId !== 'ALL' && String(j.status_id || '') !== filterStatusId) return;

      const createdAt = String(j.created_at || '').substring(0, 10);
      if (!createdAt || createdAt < startDate || createdAt > endDate) return;

      const mKey = createdAt.substring(0, 7);
      const bucket = monthMap.get(mKey);
      if (!bucket) return;

      const rawType = j.joborder_type as Record<string, unknown> | null;
      let typeDesc = String(rawType?.type_desc || '');
      if (!typeDesc && j.type_id) {
        const found = jobOrderTypes.find((t) => t.type_id === String(j.type_id));
        if (found) typeDesc = found.type_desc;
      }
      const lower = typeDesc.toLowerCase();

      if (lower.includes('plan')) {
        bucket.planned += 1;
      } else if (lower.includes('emerg') || lower.includes('unplan')) {
        bucket.emergency += 1;
      } else if (lower.includes('rework') || lower.includes('repeat')) {
        bucket.rework += 1;
      }
    });

    return Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [periodMonthBuckets, segmentVehicleIds, allJobsCache, jobOrderTypes, filterSupervisorId, filterJobOrderTypeId, filterStatusId, startDate, endDate]);

  // Compute Monthly Comparative Costs
  const monthlyComparativeCosts = useMemo(() => {
    const monthMap = new Map<string, { monthKey: string; monthLabel: string; planned: number; emergency: number; rework: number }>();
    periodMonthBuckets.forEach((b) => {
      monthMap.set(b.monthKey, { ...b, planned: 0, emergency: 0, rework: 0 });
    });

    allJobsCache.forEach((j) => {
      if (!j.vehicle_id || !segmentVehicleIds.has(String(j.vehicle_id))) return;
      if (filterSupervisorId !== 'ALL' && String(j.assigned_supervisor) !== filterSupervisorId) return;
      if (filterJobOrderTypeId !== 'ALL' && String(j.type_id || '') !== filterJobOrderTypeId) return;
      if (filterStatusId !== 'ALL' && String(j.status_id || '') !== filterStatusId) return;

      const createdAt = String(j.created_at || '').substring(0, 10);
      if (!createdAt || createdAt < startDate || createdAt > endDate) return;

      const mKey = createdAt.substring(0, 7);
      const bucket = monthMap.get(mKey);
      if (!bucket) return;

      const rawType = j.joborder_type as Record<string, unknown> | null;
      let typeDesc = String(rawType?.type_desc || '');
      if (!typeDesc && j.type_id) {
        const found = jobOrderTypes.find((t) => t.type_id === String(j.type_id));
        if (found) typeDesc = found.type_desc;
      }
      const lower = typeDesc.toLowerCase();
      const cost = Number(j.total_cost || 0);

      if (lower.includes('plan')) {
        bucket.planned += cost;
      } else if (lower.includes('emerg') || lower.includes('unplan')) {
        bucket.emergency += cost;
      } else if (lower.includes('rework') || lower.includes('repeat')) {
        bucket.rework += cost;
      }
    });

    return Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [periodMonthBuckets, segmentVehicleIds, allJobsCache, jobOrderTypes, filterSupervisorId, filterJobOrderTypeId, filterStatusId, startDate, endDate]);

  // Compute Monthly Component Cost Analysis
  const monthlyComponentComparativeCosts = useMemo(() => {
    const monthMap = new Map<string, { monthKey: string; monthLabel: string; materials: number; labor: number; contract: number }>();
    periodMonthBuckets.forEach((b) => {
      monthMap.set(b.monthKey, { ...b, materials: 0, labor: 0, contract: 0 });
    });

    allJobsCache.forEach((j) => {
      if (!j.vehicle_id || !segmentVehicleIds.has(String(j.vehicle_id))) return;
      if (filterSupervisorId !== 'ALL' && String(j.assigned_supervisor) !== filterSupervisorId) return;
      if (filterJobOrderTypeId !== 'ALL' && String(j.type_id || '') !== filterJobOrderTypeId) return;
      if (filterStatusId !== 'ALL' && String(j.status_id || '') !== filterStatusId) return;

      const createdAt = String(j.created_at || '').substring(0, 10);
      if (!createdAt || createdAt < startDate || createdAt > endDate) return;

      const mKey = createdAt.substring(0, 7);
      const bucket = monthMap.get(mKey);
      if (!bucket) return;

      bucket.materials += Number(j.materials_cost || 0);
      bucket.labor += Number(j.labor_cost || 0);
      bucket.contract += Number(j.contract_cost || 0);
    });

    return Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [periodMonthBuckets, segmentVehicleIds, allJobsCache, filterSupervisorId, filterJobOrderTypeId, filterStatusId, startDate, endDate]);

  const vehicleKpis = useMemo(() => {
    const uniqueActiveVehiclesSet = new Set(filteredVehicles.filter((v) => v.is_active).map((v) => v.vehicle_id));
    const totalActiveVehicles = uniqueActiveVehiclesSet.size;

    const uniqueVehiclesWithJoSet = new Set(filteredVehicles.filter((v) => v.job_order_count > 0).map((v) => v.vehicle_id));
    const vehiclesWithJo = uniqueVehiclesWithJoSet.size;

    const totalJo = filteredVehicles.reduce((acc, v) => acc + v.job_order_count, 0);
    const totalCost = filteredVehicles.reduce((acc, v) => acc + v.total_maintenance_cost, 0);
    const totalMaterialsCost = filteredVehicles.reduce((acc, v) => acc + v.materials_cost, 0);
    const totalLaborCost = filteredVehicles.reduce((acc, v) => acc + v.labor_cost, 0);
    const totalContractCost = filteredVehicles.reduce((acc, v) => acc + v.contract_cost, 0);
    const avgCostPerJo = totalJo > 0 ? totalCost / totalJo : 0;

    return {
      totalActiveVehicles,
      vehiclesWithJo,
      totalJo,
      totalCost,
      totalMaterialsCost,
      totalLaborCost,
      totalContractCost,
      avgCostPerJo
    };
  }, [filteredVehicles]);

  // Sorting definitions for Top 20 Rankings
  const topByJobs = useMemo(() => [...filteredVehicles].sort((a, b) => b.job_order_count - a.job_order_count).slice(0, 20), [filteredVehicles]);
  const topByCost = useMemo(() => [...filteredVehicles].sort((a, b) => b.total_maintenance_cost - a.total_maintenance_cost).slice(0, 20), [filteredVehicles]);

  const handleSelectVehicle = async (v: VehicleRecord) => {
    setSelectedVehicle(v);
    await fetchVehicleDrilldown(v.vehicle_id);
  };

  // Theme-aware active tab styling referencing index.css CSS variables
  const getMainTabClass = (tabKey: typeof activeSubTab) => {
    const isActive = activeSubTab === tabKey;
    return isActive
      ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) border border-(--btn-primary-bg) shadow-md ring-2 ring-(--btn-primary-bg)/30'
      : 'bg-(--bg-surface) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--accent-subtle) border border-(--border-main)';
  };

  const useLineGraphType = isPeriodTraversingOver2Months || monthlyJobOrderTypeCounts.length > 2;
  const useLineGraphCosts = isPeriodTraversingOver2Months || monthlyComparativeCosts.length > 2;
  const useLineGraphBreakdown = isPeriodTraversingOver2Months || monthlyComponentComparativeCosts.length > 2;

  return (
    <div className="h-[calc(100vh-140px)] w-full max-w-7xl mx-auto px-2 sm:px-4 space-y-3 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-(--btn-primary-bg)/15 text-(--btn-primary-bg) rounded-xl shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">
              Job Order Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">
              Monitor fleet maintenance performance, job order volumes, repair types, and cost breakdowns.
            </p>
          </div>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={loading || refreshing || dateLoading}
          className="bg-(--bg-surface) hover:bg-(--accent-subtle) border border-(--border-main) text-(--text-primary) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          title="Refresh analytics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-(--btn-primary-bg)' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-2.5 rounded-lg flex items-center gap-3 text-xs shrink-0">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content Body Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-elevated) border border-(--border-main) rounded-xl p-3 shadow-xl overflow-hidden space-y-3">
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto p-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-(--text-muted)" />
              <p className="text-xs text-(--text-muted)">Loading dashboard analytics & reliability metrics...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Date & Filters Toolbar */}
              <div className="p-3 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border-main) pb-2">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-(--btn-primary-bg)" />
                    <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                      Date Range & Fleet Segment Filters
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-(--text-muted)">Period:</span>
                    <input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="bg-(--bg-elevated) border border-(--border-main) px-2 py-1 rounded text-xs text-(--text-primary)"
                    />
                    <span>to</span>
                    <input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      className="bg-(--bg-elevated) border border-(--border-main) px-2 py-1 rounded text-xs text-(--text-primary)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <div>
                    <label htmlFor="filterCustomer" className="text-[10px] font-bold uppercase text-(--text-muted)">Customer</label>
                    <CustomDropdown
                      id="filterCustomer"
                      value={filterCustomer}
                      onChange={setFilterCustomer}
                      options={customerOptions}
                    />
                  </div>

                  <div>
                    <label htmlFor="filterMake" className="text-[10px] font-bold uppercase text-(--text-muted)">Equipment Make</label>
                    <CustomDropdown
                      id="filterMake"
                      value={filterMake}
                      onChange={setFilterMake}
                      options={makeOptions}
                    />
                  </div>

                  <div>
                    <label htmlFor="filterModel" className="text-[10px] font-bold uppercase text-(--text-muted)">Equipment Model</label>
                    <CustomDropdown
                      id="filterModel"
                      value={filterModel}
                      onChange={setFilterModel}
                      options={modelOptions}
                    />
                  </div>

                  <div>
                    <label htmlFor="filterJobOrderTypeId" className="text-[10px] font-bold uppercase text-(--text-muted)">JO Type</label>
                    <CustomDropdown
                      id="filterJobOrderTypeId"
                      value={filterJobOrderTypeId}
                      onChange={setFilterJobOrderTypeId}
                      options={joTypeOptions}
                    />
                  </div>

                  <div>
                    <label htmlFor="filterStatusId" className="text-[10px] font-bold uppercase text-(--text-muted)">JO Status</label>
                    <CustomDropdown
                      id="filterStatusId"
                      value={filterStatusId}
                      onChange={setFilterStatusId}
                      options={joStatusOptions}
                    />
                  </div>

                  <div>
                    <label htmlFor="filterSupervisorId" className="text-[10px] font-bold uppercase text-(--text-muted)">Supervisor</label>
                    <CustomDropdown
                      id="filterSupervisorId"
                      value={filterSupervisorId}
                      onChange={setFilterSupervisorId}
                      options={supervisorOptions}
                    />
                  </div>
                </div>

                {/* Filter Panel KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-(--border-main)">
                  <div className="p-2.5 bg-(--bg-elevated) border border-(--border-main) rounded-lg space-y-0.5">
                    <div className="text-[9px] font-bold uppercase text-(--text-muted)">Active Equipment</div>
                    <div className="text-base font-extrabold text-(--text-primary)">{vehicleKpis.totalActiveVehicles}</div>
                  </div>

                  <div className="p-2.5 bg-(--bg-elevated) border border-(--border-main) rounded-lg space-y-0.5">
                    <div className="text-[9px] font-bold uppercase text-(--text-muted)">Equipment with JO</div>
                    <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">{vehicleKpis.vehiclesWithJo}</div>
                  </div>
                </div>
              </div>

              {/* Main Tabs Navigation */}
              <div className="flex flex-wrap items-center gap-2 border-b border-(--border-main) pb-3 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('type')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${getMainTabClass('type')}`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Job Order Type</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('costs')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${getMainTabClass('costs')}`}
                >
                  <PhilippinePeso className="w-4 h-4" />
                  <span>Job Order Costs</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('breakdown')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${getMainTabClass('breakdown')}`}
                >
                  <PieChart className="w-4 h-4" />
                  <span>Job Order Cost Breakdown</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('vehicles')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${getMainTabClass('vehicles')}`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>Equipment Rankings</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('kanban')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${getMainTabClass('kanban')}`}
                >
                  <Kanban className="w-4 h-4" />
                  <span>Kanban Board</span>
                </button>
              </div>

              {/* Sub-Tab 1: Job Order Type */}
              {activeSubTab === 'type' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* 1. Monthly Chart (Bar <= 2 mos | Line > 2 mos) */}
                  <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-main) pb-2">
                      <div className="flex items-center gap-2">
                        {useLineGraphType ? (
                          <TrendingUp className="w-4 h-4 text-sky-500" />
                        ) : (
                          <BarChart3 className="w-4 h-4 text-sky-500" />
                        )}
                        <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                          Monthly Job Order Type Count Analysis (Planned vs Emergency vs Rework)
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-sky-500 rounded-xs inline-block"></span>Planned</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-xs inline-block"></span>Emergency</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-xs inline-block"></span>Rework</span>
                        {selectedMonthKey && (
                          <button
                            onClick={() => setSelectedMonthKey(null)}
                            className="ml-2 px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded font-bold text-[10px] hover:bg-rose-500/20 cursor-pointer"
                          >
                            Clear Month Filter
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-(--text-muted)">
                      {selectedMonthKey
                        ? `Showing KPI metrics for selected month: ${monthlyJobOrderTypeCounts.find((m) => m.monthKey === selectedMonthKey)?.monthLabel || selectedMonthKey}. Click the active month ${useLineGraphType ? 'point' : 'bar'} to reset to full period.`
                        : `Click any month ${useLineGraphType ? 'point' : 'bar'} to filter Job Order KPI Cards for that specific month (${startDate} to ${endDate}).`}
                    </p>

                    <MonthlyMultiSeriesChart
                      data={monthlyJobOrderTypeCounts.map((m) => ({
                        monthKey: m.monthKey,
                        monthLabel: m.monthLabel,
                        s1: m.planned,
                        s2: m.emergency,
                        s3: m.rework
                      }))}
                      isLineChart={useLineGraphType}
                      selectedMonthKey={selectedMonthKey}
                      onSelectMonth={setSelectedMonthKey}
                      series={[
                        { label: 'Planned JOs', barClass: 'bg-sky-500', textClass: 'text-sky-500', strokeHex: '#0ea5e9' },
                        { label: 'Emergency JOs', barClass: 'bg-rose-500', textClass: 'text-rose-500', strokeHex: '#f43f5e' },
                        { label: 'Rework JOs', barClass: 'bg-amber-500', textClass: 'text-amber-500', strokeHex: '#f59e0b' }
                      ]}
                      activeRingClass="ring-sky-500"
                      activeBgClass="bg-sky-500/15"
                      activeLabelClass="text-sky-600 dark:text-sky-400"
                      emptyMessage="No job order count data available for the selected period."
                    />
                  </div>

                  {/* 2. Dynamically Filtered Job Order KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400">
                        Planned JO Count {selectedMonthKey ? `(${monthlyJobOrderTypeCounts.find((m) => m.monthKey === selectedMonthKey)?.monthLabel})` : ''}
                      </div>
                      <div className="text-lg font-extrabold text-sky-600 dark:text-sky-400 font-mono">{jobOrderTypeMetrics.plannedCount.toLocaleString()}</div>
                      <div className="text-[10px] text-sky-600/80 dark:text-sky-400/80">Scheduled maintenance</div>
                    </div>

                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
                        Emergency JO Count {selectedMonthKey ? `(${monthlyJobOrderTypeCounts.find((m) => m.monthKey === selectedMonthKey)?.monthLabel})` : ''}
                      </div>
                      <div className="text-lg font-extrabold text-rose-600 dark:text-rose-400 font-mono">{jobOrderTypeMetrics.emergencyCount.toLocaleString()}</div>
                      <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80">Unplanned breakdowns</div>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                        Rework JO Count {selectedMonthKey ? `(${monthlyJobOrderTypeCounts.find((m) => m.monthKey === selectedMonthKey)?.monthLabel})` : ''}
                      </div>
                      <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 font-mono">{jobOrderTypeMetrics.reworkCount.toLocaleString()}</div>
                      <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80">Repeat or corrective repairs</div>
                    </div>

                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                        Total Job Orders {selectedMonthKey ? `(${monthlyJobOrderTypeCounts.find((m) => m.monthKey === selectedMonthKey)?.monthLabel})` : ''}
                      </div>
                      <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                        {(selectedMonthKey ? jobOrderTypeMetrics.filteredTotalJoCount : vehicleKpis.totalJo).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-blue-600/80 dark:text-blue-400/80">Combined total count</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Job Order Costs */}
              {activeSubTab === 'costs' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* 1. Monthly Comparative Cost Analysis Chart (Bar <= 2 mos | Line > 2 mos) */}
                  <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-main) pb-2">
                      <div className="flex items-center gap-2">
                        {useLineGraphCosts ? (
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                        ) : (
                          <BarChart3 className="w-4 h-4 text-blue-500" />
                        )}
                        <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                          Monthly Comparative Cost Analysis (Planned vs Emergency vs Rework)
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-sky-500 rounded-xs inline-block"></span>Planned</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-xs inline-block"></span>Emergency</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-xs inline-block"></span>Rework</span>
                        {selectedCostMonthKey && (
                          <button
                            onClick={() => setSelectedCostMonthKey(null)}
                            className="ml-2 px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded font-bold text-[10px] hover:bg-rose-500/20 cursor-pointer"
                          >
                            Clear Month Filter
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-(--text-muted)">
                      {selectedCostMonthKey
                        ? `Showing cost metrics for selected month: ${monthlyComparativeCosts.find((m) => m.monthKey === selectedCostMonthKey)?.monthLabel || selectedCostMonthKey}. Click the active month ${useLineGraphCosts ? 'point' : 'bar'} to reset to full period.`
                        : `Click any month ${useLineGraphCosts ? 'point' : 'bar'} to filter Job Order Cost KPI Cards for that specific month (${startDate} to ${endDate}).`}
                    </p>

                    <MonthlyMultiSeriesChart
                      data={monthlyComparativeCosts.map((m) => ({
                        monthKey: m.monthKey,
                        monthLabel: m.monthLabel,
                        s1: m.planned,
                        s2: m.emergency,
                        s3: m.rework
                      }))}
                      isLineChart={useLineGraphCosts}
                      selectedMonthKey={selectedCostMonthKey}
                      onSelectMonth={setSelectedCostMonthKey}
                      series={[
                        { label: 'Planned', barClass: 'bg-sky-500', textClass: 'text-sky-500', strokeHex: '#0ea5e9' },
                        { label: 'Emergency', barClass: 'bg-rose-500', textClass: 'text-rose-500', strokeHex: '#f43f5e' },
                        { label: 'Rework', barClass: 'bg-amber-500', textClass: 'text-amber-500', strokeHex: '#f59e0b' }
                      ]}
                      activeRingClass="ring-blue-500"
                      activeBgClass="bg-blue-500/15"
                      activeLabelClass="text-blue-600 dark:text-blue-400"
                      isCurrency
                      emptyMessage="No comparative cost data available for the selected period."
                    />
                  </div>

                  {/* 2. Dynamically Filtered Job Order Costs KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400">
                        Planned JO Total Cost {selectedCostMonthKey ? `(${monthlyComparativeCosts.find((m) => m.monthKey === selectedCostMonthKey)?.monthLabel})` : ''}
                      </div>
                      <div className="text-lg font-extrabold text-sky-600 dark:text-sky-400">₱{jobOrderCostSubTabMetrics.plannedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-sky-600/80 dark:text-sky-400/80">Scheduled maintenance</div>
                    </div>

                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
                        Emergency JO Total Cost {selectedCostMonthKey ? `(${monthlyComparativeCosts.find((m) => m.monthKey === selectedCostMonthKey)?.monthLabel})` : ''}
                      </div>
                      <div className="text-lg font-extrabold text-rose-600 dark:text-rose-400">₱{jobOrderCostSubTabMetrics.emergencyCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80">Unplanned breakdowns</div>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                        Rework JO Total Cost {selectedCostMonthKey ? `(${monthlyComparativeCosts.find((m) => m.monthKey === selectedCostMonthKey)?.monthLabel})` : ''}
                      </div>
                      <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400">₱{jobOrderCostSubTabMetrics.reworkCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80">Repeat or corrective repairs</div>
                    </div>

                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                        TOTAL JO Cost {selectedCostMonthKey ? `(${monthlyComparativeCosts.find((m) => m.monthKey === selectedCostMonthKey)?.monthLabel})` : ''}
                      </div>
                      <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">₱{jobOrderCostSubTabMetrics.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">Combined maintenance cost</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: Job Order Cost Breakdown */}
              {activeSubTab === 'breakdown' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* 1. Monthly Component Cost Analysis Chart (Bar <= 2 mos | Line > 2 mos) */}
                  <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-main) pb-2">
                      <div className="flex items-center gap-2">
                        {useLineGraphBreakdown ? (
                          <TrendingUp className="w-4 h-4 text-purple-500" />
                        ) : (
                          <BarChart3 className="w-4 h-4 text-purple-500" />
                        )}
                        <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                          Monthly Comparative Cost Analysis (Materials Cost vs Labor Cost vs Contract Cost)
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-xs inline-block"></span>Materials</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-xs inline-block"></span>Labor</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-500 rounded-xs inline-block"></span>Contract</span>
                        {selectedBreakdownMonthKey && (
                          <button
                            onClick={() => setSelectedBreakdownMonthKey(null)}
                            className="ml-2 px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded font-bold text-[10px] hover:bg-rose-500/20 cursor-pointer"
                          >
                            Clear Month Filter
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-(--text-muted)">
                      {selectedBreakdownMonthKey
                        ? `Showing cost breakdown for selected month: ${monthlyComponentComparativeCosts.find((m) => m.monthKey === selectedBreakdownMonthKey)?.monthLabel || selectedBreakdownMonthKey}. Click the active month ${useLineGraphBreakdown ? 'point' : 'bar'} to reset to full period.`
                        : `Click any month ${useLineGraphBreakdown ? 'point' : 'bar'} to filter Cost Breakdown KPI Cards for that specific month (${startDate} to ${endDate}).`}
                    </p>

                    <MonthlyMultiSeriesChart
                      data={monthlyComponentComparativeCosts.map((m) => ({
                        monthKey: m.monthKey,
                        monthLabel: m.monthLabel,
                        s1: m.materials,
                        s2: m.labor,
                        s3: m.contract
                      }))}
                      isLineChart={useLineGraphBreakdown}
                      selectedMonthKey={selectedBreakdownMonthKey}
                      onSelectMonth={setSelectedBreakdownMonthKey}
                      series={[
                        { label: 'Materials', barClass: 'bg-blue-500', textClass: 'text-blue-500', strokeHex: '#3b82f6' },
                        { label: 'Labor', barClass: 'bg-amber-500', textClass: 'text-amber-500', strokeHex: '#f59e0b' },
                        { label: 'Contract', barClass: 'bg-purple-500', textClass: 'text-purple-500', strokeHex: '#a855f7' }
                      ]}
                      activeRingClass="ring-purple-500"
                      activeBgClass="bg-purple-500/15"
                      activeLabelClass="text-purple-600 dark:text-purple-400"
                      isCurrency
                      emptyMessage="No component comparative cost data available for the selected period."
                    />
                  </div>

                  {/* 2. Dynamically Filtered Cost Breakdown KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                        Materials Cost {selectedBreakdownMonthKey ? `(${monthlyComponentComparativeCosts.find((m) => m.monthKey === selectedBreakdownMonthKey)?.monthLabel})` : ''}
                      </div>
                      <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400">₱{jobOrderBreakdownSubTabMetrics.materialsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-blue-600/80 dark:text-blue-400/80">Total parts & materials</div>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                        Labor Cost {selectedBreakdownMonthKey ? `(${monthlyComponentComparativeCosts.find((m) => m.monthKey === selectedBreakdownMonthKey)?.monthLabel})` : ''}
                      </div>
                      <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400">₱{jobOrderBreakdownSubTabMetrics.laborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80">Total labor charges</div>
                    </div>

                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400">
                        Contract Cost {selectedBreakdownMonthKey ? `(${monthlyComponentComparativeCosts.find((m) => m.monthKey === selectedBreakdownMonthKey)?.monthLabel})` : ''}
                      </div>
                      <div className="text-lg font-extrabold text-purple-600 dark:text-purple-400">₱{jobOrderBreakdownSubTabMetrics.contractCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-purple-600/80 dark:text-purple-400/80">Total outsourced services</div>
                    </div>

                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                        TOTAL COST {selectedBreakdownMonthKey ? `(${monthlyComponentComparativeCosts.find((m) => m.monthKey === selectedBreakdownMonthKey)?.monthLabel})` : ''}
                      </div>
                      <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">₱{jobOrderBreakdownSubTabMetrics.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">Matls + Labor + Contract</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 4: Equipment Rankings */}
              {activeSubTab === 'vehicles' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border border-(--border-main) rounded-xl p-4 bg-(--bg-surface) space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border-main) pb-3">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-(--btn-primary-bg)" />
                        <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                          Top Equipment Rankings
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setRankingTab('jobs')}
                          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                            rankingTab === 'jobs'
                              ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) shadow-sm'
                              : 'bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary)'
                          }`}
                        >
                          <Hash className="w-3.5 h-3.5" />
                          <span>Top JO Count</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRankingTab('cost')}
                          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                            rankingTab === 'cost'
                              ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) shadow-sm'
                              : 'bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary)'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Top JO Cost</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-96 overflow-y-auto border border-(--border-main) rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-(--border-main) text-(--text-muted) text-[10px] uppercase bg-(--bg-elevated) sticky top-0 z-10 shadow-xs">
                            <th className="p-2.5">Plate No</th>
                            <th className="p-2.5">Customer</th>
                            <th className="p-2.5 text-right">JO Count</th>
                            <th className="p-2.5 text-right">Labor Cost</th>
                            <th className="p-2.5 text-right">Materials</th>
                            <th className="p-2.5 text-right">Contract</th>
                            <th className="p-2.5 text-right">Total Cost</th>
                            <th className="p-2.5 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-main)">
                          {(rankingTab === 'jobs' ? topByJobs : topByCost).map((v, idx) => (
                            <tr key={`rank-${v.vehicle_id}-${idx}`} className="hover:bg-(--accent-subtle) transition-colors">
                              <td className="p-2.5 font-bold text-(--text-primary)">{v.plate_no}</td>
                              <td className="p-2.5 text-(--text-secondary)">{v.customer_name}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">{v.job_order_count}</td>
                              <td className="p-2.5 text-right font-mono">₱{v.labor_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td className="p-2.5 text-right font-mono">₱{v.materials_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td className="p-2.5 text-right font-mono">₱{v.contract_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">₱{v.total_maintenance_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleSelectVehicle(v)}
                                  className="px-2 py-1 bg-(--btn-primary-bg) hover:opacity-90 text-(--btn-primary-text) rounded text-[10px] font-semibold flex items-center gap-1 mx-auto transition-opacity cursor-pointer"
                                >
                                  <span>Inspect</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 5: Kanban Board */}
              {activeSubTab === 'kanban' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-(--bg-surface) border border-(--border-main) px-3 py-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Kanban className="w-4 h-4 text-(--btn-primary-bg)" />
                      <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                        Job Order Status Kanban Board
                      </h3>
                    </div>
                    <span className="text-[11px] text-(--text-muted)">
                      Showing all job orders across all dates • Click any card to inspect details
                    </span>
                  </div>

                  <div className="overflow-x-auto pb-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 min-w-255">
                      {KANBAN_COLUMNS.map((col) => {
                        const cards = kanbanBoardData[col.key] || [];
                        return (
                          <div
                            key={col.key}
                            className={`flex flex-col bg-(--bg-surface) border border-(--border-main) border-t-4 ${col.borderClass} rounded-xl shadow-xs max-h-120`}
                          >
                            {/* Column Header */}
                            <div className="p-2.5 border-b border-(--border-main) flex items-center justify-between gap-2 shrink-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${col.dotClass}`} />
                                <span className="text-xs font-bold text-(--text-primary) truncate">
                                  {col.title}
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${col.badgeClass}`}>
                                {cards.length}
                              </span>
                            </div>

                            {/* Column Body */}
                            <div className="p-2 space-y-2 overflow-y-auto flex-1">
                              {cards.length === 0 ? (
                                <div className="py-8 text-center text-[11px] text-(--text-muted) italic">
                                  No job orders
                                </div>
                              ) : (
                                cards.map((item, idx) => {
                                  const isCardSelected = selectedKanbanCard?.job_order_no === item.job_order_no;
                                  return (
                                    <button
                                      type="button"
                                      key={`${col.key}-${item.job_order_no}-${idx}`}
                                      onClick={() =>
                                        setSelectedKanbanCard(isCardSelected ? null : item)
                                      }
                                      className={`w-full text-left p-2.5 bg-(--bg-elevated) hover:bg-(--accent-subtle) border rounded-lg shadow-2xs transition-all space-y-1.5 cursor-pointer ${
                                        isCardSelected
                                          ? 'border-(--btn-primary-bg) ring-2 ring-(--btn-primary-bg)/40 bg-(--accent-subtle)'
                                          : 'border-(--border-main)'
                                      }`}
                                    >
                                      {/* JO Number & Type */}
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="font-mono text-xs font-extrabold text-(--text-primary) truncate">
                                          {item.job_order_no}
                                        </span>
                                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-(--bg-surface) border border-(--border-main) text-(--text-muted) shrink-0">
                                          {item.type_desc}
                                        </span>
                                      </div>

                                      {/* Equipment (plate_no) */}
                                      <div className="flex items-center gap-1.5 text-[11px] text-(--text-secondary)">
                                        <Truck className="w-3.5 h-3.5 text-(--btn-primary-bg) shrink-0" />
                                        <span className="font-bold text-(--text-primary) truncate">
                                          {item.plate_no}
                                        </span>
                                      </div>

                                      {/* Date Created & Date Needed */}
                                      <div className="pt-1 border-t border-(--border-main)/60 space-y-1 text-[10px] text-(--text-muted)">
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="flex items-center gap-1">
                                            <CalendarPlus className="w-3 h-3 shrink-0" />
                                            <span>Date Created:</span>
                                          </span>
                                          <span className="font-mono font-semibold text-(--text-primary)">
                                            {item.date_created}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="flex items-center gap-1">
                                            <CalendarClock className="w-3 h-3 shrink-0" />
                                            <span>Date Needed:</span>
                                          </span>
                                          <span className="font-mono font-bold text-(--text-primary)">
                                            {item.date_needed}
                                          </span>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Kanban Card Inspection Table */}
                  {selectedKanbanCard && (
                    <div className="border-2 border-(--btn-primary-bg)/50 rounded-xl p-4 bg-(--bg-surface) space-y-3 shadow-lg animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-(--border-main) pb-2.5">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-(--btn-primary-bg)" />
                          <h4 className="text-xs font-extrabold uppercase text-(--text-primary)">
                            Job Order Inspection: {selectedKanbanCard.job_order_no} ({selectedKanbanCard.status_label})
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedKanbanCard(null)}
                          className="px-3 py-1 bg-(--bg-elevated) hover:bg-(--accent-subtle) border border-(--border-main) text-(--text-primary) rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Close
                        </button>
                      </div>

                      <div className="overflow-x-auto border border-(--border-main) rounded-lg">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-(--border-main) text-(--text-muted) text-[10px] uppercase bg-(--bg-elevated)">
                              <th className="p-2.5">Equipment (Plate No)</th>
                              <th className="p-2.5">Make / Model / Type</th>
                              <th className="p-2.5">Date Created / Needed</th>
                              <th className="p-2.5 text-right">Materials Cost</th>
                              <th className="p-2.5 text-right">Labor Cost</th>
                              <th className="p-2.5 text-right">Contract Cost</th>
                              <th className="p-2.5 text-right">Total Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-(--bg-surface) hover:bg-(--accent-subtle) transition-colors">
                              <td className="p-2.5 font-bold text-(--text-primary)">
                                {selectedKanbanCard.plate_no}
                              </td>
                              <td className="p-2.5 text-(--text-secondary)">
                                <div className="font-semibold text-(--text-primary)">
                                  {selectedKanbanCard.make_name} {selectedKanbanCard.model_name}
                                </div>
                                <div className="text-[10px] text-(--text-muted)">
                                  {selectedKanbanCard.type_desc}
                                </div>
                              </td>
                              <td className="p-2.5 font-mono text-[11px]">
                                <div>
                                  <span className="text-(--text-muted)">Created:</span>{' '}
                                  <span className="text-(--text-primary)">{selectedKanbanCard.date_created}</span>
                                </div>
                                <div>
                                  <span className="text-(--text-muted)">Needed:</span>{' '}
                                  <span className="font-bold text-(--text-primary)">{selectedKanbanCard.date_needed}</span>
                                </div>
                              </td>
                              <td className="p-2.5 text-right font-mono text-blue-600 dark:text-blue-400">
                                ₱{selectedKanbanCard.materials_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="p-2.5 text-right font-mono text-amber-600 dark:text-amber-400">
                                ₱{selectedKanbanCard.labor_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="p-2.5 text-right font-mono text-purple-600 dark:text-purple-400">
                                ₱{selectedKanbanCard.contract_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="p-2.5 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                                ₱{selectedKanbanCard.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Equipment Drill-Down Panel */}
              {selectedVehicle && (
                <div className="border-2 border-(--btn-primary-bg)/50 rounded-xl p-4 bg-(--bg-surface) space-y-4 shadow-xl animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-(--border-main) pb-3">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-(--btn-primary-bg)" />
                      <h3 className="text-sm font-extrabold uppercase text-(--text-primary)">
                        Equipment Drill-Down Profile: {selectedVehicle.plate_no} ({selectedVehicle.make_name} {selectedVehicle.model_name})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedVehicle(null)}
                      className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs border border-gray-300 dark:border-gray-600"
                    >
                      Close Panel
                    </button>
                  </div>

                  {vehicleDrilldownLoading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-(--btn-primary-bg)" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 text-xs bg-(--bg-elevated) p-3 rounded-lg border border-(--border-main)">
                        <div><strong className="text-(--text-muted)">Customer:</strong> {selectedVehicle.customer_name}</div>
                        <div><strong className="text-(--text-muted)">Make / Model:</strong> {selectedVehicle.make_name} {selectedVehicle.model_name}</div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex flex-col justify-between">
                          <div className="text-[10px] font-bold uppercase text-blue-600">Materials Cost</div>
                          <div className="text-lg font-bold mt-1">₱{selectedVehicle.materials_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex flex-col justify-between">
                          <div className="text-[10px] font-bold uppercase text-amber-600">Labor Cost</div>
                          <div className="text-lg font-bold mt-1">₱{selectedVehicle.labor_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg flex flex-col justify-between">
                          <div className="text-[10px] font-bold uppercase text-purple-600">Contract Cost</div>
                          <div className="text-lg font-bold mt-1">₱{selectedVehicle.contract_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex flex-col justify-between">
                          <div className="text-[10px] font-bold uppercase text-emerald-600">Total Cost</div>
                          <div className="text-lg font-bold mt-1">₱{selectedVehicle.total_maintenance_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold uppercase text-(--text-primary) mb-2">Job Order History ({vehicleJobHistory.length})</h4>
                        <div className="overflow-x-auto max-h-48 border border-(--border-main) rounded-lg">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-(--bg-elevated) text-[10px] text-(--text-muted) uppercase sticky top-0">
                              <tr>
                                <th className="p-2">JO Number</th>
                                <th className="p-2">Created Date</th>
                                <th className="p-2">Completed Date</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Priority</th>
                                <th className="p-2 text-right">Total Cost</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border-main)">
                              {vehicleJobHistory.length === 0 ? (
                                <tr><td colSpan={6} className="p-4 text-center text-(--text-muted)">No job orders found for this equipment.</td></tr>
                              ) : (
                                vehicleJobHistory.map((j, idx) => (
                                  <tr key={idx} className="hover:bg-(--accent-subtle)">
                                    <td className="p-2 font-mono font-bold">{j.job_order_no}</td>
                                    <td className="p-2 font-mono">{j.created_at}</td>
                                    <td className="p-2 font-mono">{j.date_completed || '—'}</td>
                                    <td className="p-2">{j.status_name}</td>
                                    <td className="p-2">{j.priority_desc}</td>
                                    <td className="p-2 text-right font-mono">₱{j.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-bold uppercase text-(--text-primary) mb-2">Issue / Task History (Equipment Daily Risks)</h4>
                          <div className="overflow-x-auto max-h-40 border border-(--border-main) rounded-lg">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-(--bg-elevated) text-[10px] text-(--text-muted) uppercase sticky top-0">
                                <tr>
                                  <th className="p-2">Risk / Failure Mode</th>
                                  <th className="p-2">First Date</th>
                                  <th className="p-2">Latest Date</th>
                                  <th className="p-2 text-right">Recurrence</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-(--border-main)">
                                {vehicleTaskHistory.length === 0 ? (
                                  <tr><td colSpan={4} className="p-4 text-center text-(--text-muted)">No daily risks recorded for this equipment in the selected period.</td></tr>
                                ) : (
                                  vehicleTaskHistory.map((t, idx) => (
                                    <tr key={idx} className="hover:bg-(--accent-subtle)">
                                      <td className="p-2 font-semibold">{t.risk_name}</td>
                                      <td className="p-2 font-mono">{t.first_date}</td>
                                      <td className="p-2 font-mono">{t.latest_date}</td>
                                      <td className="p-2 text-right font-mono text-amber-600 font-bold">{t.occurrence_count}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold uppercase text-(--text-primary) mb-2">Repeat Repair History (Task Standard Recurrence)</h4>
                          <div className="overflow-x-auto max-h-40 border border-(--border-main) rounded-lg">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-(--bg-elevated) text-[10px] text-(--text-muted) uppercase sticky top-0">
                                <tr>
                                  <th className="p-2">Task Standard</th>
                                  <th className="p-2">First Date</th>
                                  <th className="p-2">Latest Date</th>
                                  <th className="p-2 text-right">Recurrence</th>
                                  <th className="p-2 text-right">Days Between</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-(--border-main)">
                                {vehicleRepeatHistory.length === 0 ? (
                                  <tr><td colSpan={5} className="p-4 text-center text-(--text-muted)">No repeat task standards found for this equipment in the selected period.</td></tr>
                                ) : (
                                  vehicleRepeatHistory.map((r, idx) => (
                                    <tr key={idx} className="hover:bg-(--accent-subtle)">
                                      <td className="p-2 font-semibold">{r.task_name}</td>
                                      <td className="p-2 font-mono">{r.first_repair_date}</td>
                                      <td className="p-2 font-mono">{r.latest_repair_date}</td>
                                      <td className="p-2 text-right font-mono text-amber-600 font-bold">{r.recurrence_count}</td>
                                      <td className="p-2 text-right font-mono">{r.days_between_repairs}d</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-bold uppercase text-(--text-primary) mb-2">PM Status Flags (PM 2 to PM 7)</h4>
                          <div className="overflow-x-auto max-h-40 border border-(--border-main) rounded-lg">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-(--bg-elevated) text-[10px] text-(--text-muted) uppercase sticky top-0">
                                <tr>
                                  <th className="p-2">PM Code</th>
                                  <th className="p-2 text-right">Current Rdg</th>
                                  <th className="p-2 text-right">Target PM Rdg (pmX_current)</th>
                                  <th className="p-2 text-center">Status Flag</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-(--border-main)">
                                {vehiclePmDetails.map((p, idx) => (
                                  <tr key={idx} className="hover:bg-(--accent-subtle)">
                                    <td className="p-2 font-mono font-bold">{p.pm_code}</td>
                                    <td className="p-2 text-right font-mono">{p.current_rdg.toLocaleString()}</td>
                                    <td className="p-2 text-right font-mono">{p.target_pm_rdg.toLocaleString()}</td>
                                    <td className="p-2 text-center">
                                      {p.is_due ? (
                                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded text-[10px] font-bold">
                                          Due / Overdue
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold">
                                          OK
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold uppercase text-(--text-primary) mb-2">Incident History</h4>
                          <div className="overflow-x-auto max-h-40 border border-(--border-main) rounded-lg">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-(--bg-elevated) text-[10px] text-(--text-muted) uppercase sticky top-0">
                                <tr>
                                  <th className="p-2">Incident Ref No</th>
                                  <th className="p-2">Date</th>
                                  <th className="p-2">Severity</th>
                                  <th className="p-2 text-right">Loss</th>
                                  <th className="p-2">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-(--border-main)">
                                {vehicleIncidentHistory.length === 0 ? (
                                  <tr><td colSpan={5} className="p-4 text-center text-(--text-muted)">No incidents recorded.</td></tr>
                                ) : (
                                  vehicleIncidentHistory.map((i, idx) => (
                                    <tr key={idx} className="hover:bg-(--accent-subtle)">
                                      <td className="p-2 font-mono font-bold">{i.incident_refno}</td>
                                      <td className="p-2 font-mono">{i.incident_date}</td>
                                      <td className="p-2 font-semibold text-red-600">{i.severity}</td>
                                      <td className="p-2 text-right font-mono">₱{i.loss.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                      <td className="p-2">{i.status}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobOrderDashboard;