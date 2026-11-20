import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  LayoutDashboard, 
  Clock, 
  Car,
  Loader2,
  AlertCircle,
  Printer,
  RefreshCw,
  Calendar,
  ClipboardList,
  AlertOctagon,
  Wrench,
  PauseCircle,
  Activity,
  PlayCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Columns3,
  X,
  User,
  DollarSign
} from 'lucide-react';

/* --- Interfaces --- */
interface OverviewSummary {
  past_due_count: number;
  currently_due_count: number;
  due_to_threshold_count: number;
  grand_total_pms: number;
  total_vehicles_affected: number;
}

interface FlaggedVehiclePm {
  vehicle_id: string;
  plate_no: string;
  current_rdg: number;
  pm_code: string;
  pm_prev: number;
  pm_current: number;
  effective_interval: number;
  threshold_multiplier: number;
  trigger_rdg: number;
  pm_status: 'PAST DUE' | 'CURRENTLY DUE' | 'DUE TO THRESHOLD';
}

interface InspectionComplianceSummary {
  inspection_date: string;
  total_active_vehicles: number;
  inspected_count: number;
  uninspected_count: number;
  status_compliant_count: number;
  status_compliance_percentage: number;
  operational_count: number;
  standby_count: number;
  breakdown_count: number;
  inspection_results_summary: string;
  inspection_compliance_percentage: number;
}

interface UninspectedVehicle {
  vehicle_id: string;
  plate_no: string;
  service_rdg: number;
}

interface FleetComplianceInspectRecord {
  vehicle_id: string;
  plate_no: string;
  service_rdg: number;
  is_inspected: boolean;
  has_valid_status: boolean;
  status_name: string;
}

interface JobOrderVolumeSummary {
  job_order_date: string;
  total_job_orders_created: number;
  unique_vehicles_serviced: number;
  completed_count: number;
  not_yet_started_count: number;
  completion_rate_percentage: number;
}

interface WorkOrderRegisterRecord {
  job_order_id: string;
  job_order_date: string;
  job_order_no: string;
  plate_no: string;
  priority_level: string;
  current_status: string;
  date_requested: string;
  date_started: string | null;
  expected_completion: string | null;
  date_completed: string | null;
  assigned_supervisor: string;
  requestor: string;
  approver: string;
  odo_rdg: number;
  labor_cost: number;
  materials_cost: number;
  contract_cost: number;
  total_cost: number;
  days_delayed: number;
}

interface DelayedSummaryMetrics {
  evaluation_date: string;
  total_delayed_job_orders: number;
  max_days_delayed: number;
  avg_days_delayed: number;
}

interface OverdueJobOrderRecord {
  evaluation_date: string;
  job_order_no: string;
  plate_no: string;
  priority_level: string;
  current_status: string;
  date_requested: string;
  expected_completion: string;
  date_started: string | null;
  days_delayed: number;
  assigned_supervisor: string;
}

type MainTab = 'todays-priorities' | 'inspection-compliance' | 'job-order-priorities';
type JoSubTab = 'volume' | 'delays' | 'kanban';
type KanbanLane = 'queued' | 'on-hold' | 'in-progress' | 'delayed';

type PmKpiKey = 'total' | 'vehicles' | 'past-due' | 'currently-due' | 'threshold';
type ComplianceKpiKey =
  | 'total-fleet'
  | 'inspected'
  | 'uninspected'
  | 'compliance-rate'
  | 'operational'
  | 'standby'
  | 'breakdown'
  | 'status-compliance';
type JoVolumeKpiKey = 'total-created' | 'unique-vehicles' | 'completed' | 'not-started' | 'completion-rate';
type JoDelayKpiKey = 'total-delayed' | 'max-delay' | 'avg-delay';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<MainTab>('todays-priorities');
  const [joSubTab, setJoSubTab] = useState<JoSubTab>('volume');

  const [loading, setLoading] = useState<boolean>(true);
  const [dateLoading, setDateLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active KPI Card Inspector States
  const [selectedPmKpi, setSelectedPmKpi] = useState<PmKpiKey | null>(null);
  const [selectedComplianceKpi, setSelectedComplianceKpi] = useState<ComplianceKpiKey | null>(null);
  const [selectedJoVolumeKpi, setSelectedJoVolumeKpi] = useState<JoVolumeKpiKey | null>(null);
  const [selectedJoDelayKpi, setSelectedJoDelayKpi] = useState<JoDelayKpiKey | null>(null);

  // Kanban Selected Job Order Detail Modal State
  const [selectedKanbanJo, setSelectedKanbanJo] = useState<{
    record: WorkOrderRegisterRecord;
    lane: KanbanLane;
  } | null>(null);

  // Pagination states for KPI Inspector tables
  const [pmKpiInspectPage, setPmKpiInspectPage] = useState<number>(1);
  const [complianceKpiInspectPage, setComplianceKpiInspectPage] = useState<number>(1);
  const [joVolumeKpiInspectPage, setJoVolumeKpiInspectPage] = useState<number>(1);
  const [joDelayKpiInspectPage, setJoDelayKpiInspectPage] = useState<number>(1);

  // Pagination states for main tables
  const [ongoingJoPage, setOngoingJoPage] = useState<number>(1);
  const [notStartedJoPage, setNotStartedJoPage] = useState<number>(1);
  const [overdueJoPage, setOverdueJoPage] = useState<number>(1);
  const pageSize = 10;

  // Initialize with current local date
  const [selectedInspectionDate, setSelectedInspectionDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Overview / PM Priority state
  const [overviewSummary, setOverviewSummary] = useState<OverviewSummary>({
    past_due_count: 0,
    currently_due_count: 0,
    due_to_threshold_count: 0,
    grand_total_pms: 0,
    total_vehicles_affected: 0,
  });
  const [flaggedVehicles, setFlaggedVehicles] = useState<FlaggedVehiclePm[]>([]);

  // Inspection Compliance State
  const [complianceSummary, setComplianceSummary] = useState<InspectionComplianceSummary>({
    inspection_date: selectedInspectionDate,
    total_active_vehicles: 0,
    inspected_count: 0,
    uninspected_count: 0,
    status_compliant_count: 0,
    status_compliance_percentage: 0,
    operational_count: 0,
    standby_count: 0,
    breakdown_count: 0,
    inspection_results_summary: 'None',
    inspection_compliance_percentage: 0,
  });
  const [uninspectedVehicles, setUninspectedVehicles] = useState<UninspectedVehicle[]>([]);
  const [fleetComplianceRecords, setFleetComplianceRecords] = useState<FleetComplianceInspectRecord[]>([]);

  // Job Order Priorities State
  const [volumeSummary, setVolumeSummary] = useState<JobOrderVolumeSummary>({
    job_order_date: selectedInspectionDate,
    total_job_orders_created: 0,
    unique_vehicles_serviced: 0,
    completed_count: 0,
    not_yet_started_count: 0,
    completion_rate_percentage: 0
  });
  const [allActiveWorkOrders, setAllActiveWorkOrders] = useState<WorkOrderRegisterRecord[]>([]);
  const [createdWorkOrderRegister, setCreatedWorkOrderRegister] = useState<WorkOrderRegisterRecord[]>([]);
  const [completedWorkOrderRegister, setCompletedWorkOrderRegister] = useState<WorkOrderRegisterRecord[]>([]);
  const [ongoingWorkOrderRegister, setOngoingWorkOrderRegister] = useState<WorkOrderRegisterRecord[]>([]);
  const [notYetStartedRegister, setNotYetStartedRegister] = useState<WorkOrderRegisterRecord[]>([]);

  const [delayedSummary, setDelayedSummary] = useState<DelayedSummaryMetrics>({
    evaluation_date: selectedInspectionDate,
    total_delayed_job_orders: 0,
    max_days_delayed: 0,
    avg_days_delayed: 0
  });
  const [overdueQueue, setOverdueQueue] = useState<OverdueJobOrderRecord[]>([]);

  const fetchGeneralDashboardData = useCallback(async () => {
    try {
      setErrorMsg(null);

      const [summaryRes, itemizedRes] = await Promise.all([
        supabase.from('vw_pm_fleet_summary_metrics').select('*').single(),
        supabase.from('vw_pm_fleet_itemized_queue').select('*')
      ]);

      if (summaryRes.data) {
        setOverviewSummary({
          past_due_count: Number(summaryRes.data.past_due_count || 0),
          currently_due_count: Number(summaryRes.data.currently_due_count || 0),
          due_to_threshold_count: Number(summaryRes.data.due_to_threshold_count || 0),
          grand_total_pms: Number(summaryRes.data.grand_total_pms || 0),
          total_vehicles_affected: Number(summaryRes.data.total_vehicles_affected || 0)
        });
      }

      if (itemizedRes.data) {
        setFlaggedVehicles(itemizedRes.data.map((item: Record<string, unknown>) => ({
          vehicle_id: String(item.vehicle_id || ''),
          plate_no: String(item.plate_no || 'N/A'),
          current_rdg: Number(item.current_rdg || 0),
          pm_code: String(item.pm_code || ''),
          pm_prev: Number(item.pm_prev || 0),
          pm_current: Number(item.pm_current || 0),
          effective_interval: Number(item.effective_interval || 0),
          threshold_multiplier: Number(item.threshold_multiplier || 0.1),
          trigger_rdg: Number(item.trigger_rdg || 0),
          pm_status: (item.pm_status as 'PAST DUE' | 'CURRENTLY DUE' | 'DUE TO THRESHOLD') || 'DUE TO THRESHOLD'
        })));
      }
    } catch (err: unknown) {
      console.error('Error loading general dashboard metrics via views:', err);
      setErrorMsg('Failed to load dashboard metrics from views. Please check Supabase definitions.');
    }
  }, []);

  const fetchInspectionComplianceData = useCallback(async (targetDate: string) => {
    try {
      setDateLoading(true);

      const { data: activeVehiclesData, error: activeVehiclesErr } = await supabase
        .from('vehicles')
        .select(`vehicle_id, plate_no, service_rdg, is_active`)
        .or('is_active.is.null,is_active.eq.true');

      if (activeVehiclesErr) throw activeVehiclesErr;

      const { data: logsOnDate } = await supabase
        .from('vehicle_daily_logs')
        .select(`
          log_id,
          vehicle_id,
          log_date,
          operations_id,
          operations_status ( operations_id, status_name )
        `)
        .gte('log_date', `${targetDate}T00:00:00`)
        .lte('log_date', `${targetDate}T23:59:59`);

      const logByVehicleMap = new Map<string, { 
        log_id: string; 
        operations_id: string | null; 
        matched_operations_id: string | null;
        status_name: string; 
      }>();

      (logsOnDate || []).forEach(l => {
        const rawStatus = l.operations_status as Record<string, unknown> | Record<string, unknown>[] | null;
        const statusObj = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
        const matchedOpId = statusObj?.operations_id ? String(statusObj.operations_id) : null;
        
        const hasValidOpStatus = Boolean(l.operations_id && matchedOpId);
        const statusName = hasValidOpStatus 
          ? String(statusObj?.status_name || 'No Status Assigned')
          : 'No Status Assigned';

        logByVehicleMap.set(String(l.vehicle_id), {
          log_id: String(l.log_id),
          operations_id: l.operations_id ? String(l.operations_id) : null,
          matched_operations_id: matchedOpId,
          status_name: statusName
        });
      });

      const totalActive = activeVehiclesData?.length || 0;
      let inspectedCount = 0;
      let uninspectedCount = 0;
      let statusCompliantCount = 0;
      let operationalCount = 0;
      let standbyCount = 0;
      let breakdownCount = 0;

      const uninspectedList: UninspectedVehicle[] = [];
      const allFleetList: FleetComplianceInspectRecord[] = [];
      const statusTotalsMap: Record<string, number> = {};

      (activeVehiclesData || []).forEach(v => {
        const vehId = String(v.vehicle_id);
        const plateNo = String(v.plate_no || 'N/A');
        const serviceRdg = Number(v.service_rdg || 0);
        const logEntry = logByVehicleMap.get(vehId);

        let statusName = 'Uninspected';
        let isInspected = false;
        let hasValidStatus = false;

        if (logEntry) {
          inspectedCount++;
          isInspected = true;
          if (logEntry.operations_id && logEntry.matched_operations_id) {
            statusCompliantCount++;
            hasValidStatus = true;
            statusName = logEntry.status_name;
          } else {
            statusName = 'No Status Assigned';
          }
        } else {
          uninspectedCount++;
          uninspectedList.push({
            vehicle_id: vehId,
            plate_no: plateNo,
            service_rdg: serviceRdg
          });
        }

        allFleetList.push({
          vehicle_id: vehId,
          plate_no: plateNo,
          service_rdg: serviceRdg,
          is_inspected: isInspected,
          has_valid_status: hasValidStatus,
          status_name: statusName
        });

        const lowerStatus = statusName.toLowerCase();
        if (lowerStatus.includes('operation')) {
          operationalCount++;
        } else if (lowerStatus.includes('stand') || lowerStatus.includes('standby')) {
          standbyCount++;
        } else if (lowerStatus.includes('breakdown') || lowerStatus.includes('maintenance')) {
          breakdownCount++;
        }

        statusTotalsMap[statusName] = (statusTotalsMap[statusName] || 0) + 1;
      });

      const dynamicSummary = Object.entries(statusTotalsMap)
        .sort((a, b) => b[1] - a[1])
        .map(([sName, sCount]) => `${sCount} ${sName}`)
        .join(', ') || 'No active vehicles';

      const compliancePct = totalActive > 0 ? Number(((inspectedCount / totalActive) * 100).toFixed(2)) : 0;
      const statusCompliancePct = inspectedCount > 0 ? Number(((statusCompliantCount / inspectedCount) * 100).toFixed(2)) : 0;

      setComplianceSummary({
        inspection_date: targetDate,
        total_active_vehicles: totalActive,
        inspected_count: inspectedCount,
        uninspected_count: uninspectedCount,
        status_compliant_count: statusCompliantCount,
        status_compliance_percentage: statusCompliancePct,
        operational_count: operationalCount,
        standby_count: standbyCount,
        breakdown_count: breakdownCount,
        inspection_results_summary: dynamicSummary,
        inspection_compliance_percentage: compliancePct
      });

      setUninspectedVehicles(uninspectedList);
      setFleetComplianceRecords(allFleetList.sort((a, b) => a.plate_no.localeCompare(b.plate_no)));
    } catch (err: unknown) {
      console.error('Error fetching inspection compliance data for date:', err);
    } finally {
      setDateLoading(false);
    }
  }, []);

  const fetchJobOrderPrioritiesData = useCallback(async (requestedDate: string) => {
    try {
      setDateLoading(true);
      const requestedDateObj = new Date(`${requestedDate}T00:00:00`);

      const mapToRegisterRecord = (j: Record<string, unknown>, fallbackStatus: string): WorkOrderRegisterRecord => {
        const rawPrio = j.joborder_priority as Record<string, unknown> | Record<string, unknown>[] | null;
        const prio = Array.isArray(rawPrio) ? rawPrio[0] : rawPrio;

        const rawStat = j.joborder_status as Record<string, unknown> | Record<string, unknown>[] | null;
        const stat = Array.isArray(rawStat) ? rawStat[0] : rawStat;

        const rawEmp = j.employees as Record<string, unknown> | Record<string, unknown>[] | null;
        const emp = Array.isArray(rawEmp) ? rawEmp[0] : rawEmp;

        const rawVeh = j.vehicles as Record<string, unknown> | Record<string, unknown>[] | null;
        const veh = Array.isArray(rawVeh) ? rawVeh[0] : rawVeh;

        const expCompStr = j.expected_completion ? String(j.expected_completion).substring(0, 10) : null;
        const dateCompStr = j.date_completed ? String(j.date_completed).substring(0, 10) : null;

        let daysDelayed = 0;
        if (expCompStr && expCompStr < requestedDate && (!dateCompStr || dateCompStr > requestedDate)) {
          const expCompDate = new Date(`${expCompStr}T00:00:00`);
          const diffTime = requestedDateObj.getTime() - expCompDate.getTime();
          daysDelayed = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        return {
          job_order_id: String(j.job_order_id || ''),
          job_order_date: requestedDate,
          job_order_no: String(j.job_order_no || `JO-${j.job_order_id}`),
          plate_no: String(veh?.plate_no || 'N/A'),
          priority_level: String(prio?.priority_desc || 'Unassigned'),
          current_status: String(stat?.status_name || fallbackStatus),
          date_requested: j.created_at ? String(j.created_at).substring(0, 10) : '—',
          date_started: j.date_started ? String(j.date_started).substring(0, 10) : null,
          expected_completion: expCompStr,
          date_completed: dateCompStr,
          assigned_supervisor: String(emp?.employee_name || 'Unassigned'),
          requestor: String(j.requestor || '—'),
          approver: String(j.approver || '—'),
          odo_rdg: Number(j.odo_rdg || 0),
          labor_cost: Number(j.labor_cost || 0),
          materials_cost: Number(j.materials_cost || 0),
          contract_cost: Number(j.contract_cost || 0),
          total_cost: Number(j.total_cost || 0),
          days_delayed: daysDelayed
        };
      };

      const startOfDay = `${requestedDate}T00:00:00.000Z`;

      const { data: createdRecords, error: createdErr } = await supabase
        .from('joborder_master')
        .select(`
          job_order_id,
          job_order_no,
          vehicle_id,
          created_at,
          date_started,
          expected_completion,
          date_completed,
          assigned_supervisor,
          requestor,
          approver,
          odo_rdg,
          labor_cost,
          materials_cost,
          contract_cost,
          total_cost,
          joborder_priority ( priority_id, priority_desc ),
          joborder_status ( status_id, status_name ),
          employees ( employee_name ),
          vehicles ( vehicle_id, plate_no, is_active )
        `)
        .gte('created_at', startOfDay);

      if (createdErr) throw createdErr;

      const filteredCreatedRecords = (createdRecords || []).filter(j => {
        const rawVeh = j.vehicles as Record<string, unknown> | Record<string, unknown>[] | null;
        const veh = Array.isArray(rawVeh) ? rawVeh[0] : rawVeh;
        return veh === null || veh.is_active === true || veh.is_active === undefined || veh.is_active === null;
      });

      const totalCreated = filteredCreatedRecords.length;
      const uniqueVehicles = new Set(filteredCreatedRecords.map(j => j.vehicle_id)).size;

      setCreatedWorkOrderRegister(
        filteredCreatedRecords.map(j => mapToRegisterRecord(j as Record<string, unknown>, 'Created'))
      );

      const { data: allMasterRaw, error: masterErr } = await supabase
        .from('joborder_master')
        .select(`
          job_order_id,
          job_order_no,
          vehicle_id,
          created_at,
          date_started,
          expected_completion,
          date_completed,
          assigned_supervisor,
          requestor,
          approver,
          odo_rdg,
          labor_cost,
          materials_cost,
          contract_cost,
          total_cost,
          joborder_priority ( priority_id, priority_desc ),
          joborder_status ( status_id, status_name ),
          employees ( employee_name ),
          vehicles ( vehicle_id, plate_no, is_active )
        `);

      if (masterErr) throw masterErr;

      const masterList = (allMasterRaw || []).filter(j => {
        const rawVeh = j.vehicles as Record<string, unknown> | Record<string, unknown>[] | null;
        const veh = Array.isArray(rawVeh) ? rawVeh[0] : rawVeh;
        return veh === null || veh.is_active === true || veh.is_active === undefined || veh.is_active === null;
      });

      // Active / open work orders created on or before target date for Kanban board
      const activeAsOfTargetDate = masterList
        .filter(j => {
          if (!j.created_at) return false;
          const createdDate = String(j.created_at).substring(0, 10);
          const isCreatedBeforeOrOn = createdDate <= requestedDate;
          const isNotCompleted = j.date_completed === null || String(j.date_completed).substring(0, 10) > requestedDate;

          const rawStat = j.joborder_status as Record<string, unknown> | Record<string, unknown>[] | null;
          const stat = Array.isArray(rawStat) ? rawStat[0] : rawStat;
          const statusLower = String(stat?.status_name || '').toLowerCase();
          const isClosedStatus = statusLower === 'completed' || statusLower === 'cancelled';

          return isCreatedBeforeOrOn && isNotCompleted && !isClosedStatus;
        })
        .map(j => mapToRegisterRecord(j as Record<string, unknown>, 'Queued'));

      setAllActiveWorkOrders(activeAsOfTargetDate);

      const completedRecords = masterList.filter(j => {
        if (!j.date_completed) return false;
        return String(j.date_completed).substring(0, 10) === requestedDate;
      });
      const completedCount = completedRecords.length;

      setCompletedWorkOrderRegister(
        completedRecords.map(j => mapToRegisterRecord(j as Record<string, unknown>, 'Completed'))
      );

      // Filtering logic for Not Yet Started Job Orders
      const notYetStartedRecords = masterList.filter(j => {
        if (!j.created_at) return false;
        const createdDate = String(j.created_at).substring(0, 10);
        const isCreatedBeforeOrOn = createdDate <= requestedDate;
        const isNotStarted = j.date_started === null;
        const isNotCompleted = j.date_completed === null || String(j.date_completed).substring(0, 10) > requestedDate;
        return isCreatedBeforeOrOn && isNotStarted && isNotCompleted;
      });
      const notYetStartedCount = notYetStartedRecords.length;

      const completionRate = totalCreated > 0 ? Number(((completedCount / totalCreated) * 100).toFixed(2)) : 0;

      setVolumeSummary({
        job_order_date: requestedDate,
        total_job_orders_created: totalCreated,
        unique_vehicles_serviced: uniqueVehicles,
        completed_count: completedCount,
        not_yet_started_count: notYetStartedCount,
        completion_rate_percentage: completionRate
      });

      // Filtering logic for Ongoing Job Orders (Currently Active & Not Delayed)
      const ongoingRecords = masterList.filter(j => {
        if (!j.created_at || !j.expected_completion) return false;
        const createdDate = String(j.created_at).substring(0, 10);
        const expCompDate = String(j.expected_completion).substring(0, 10);
        
        const isCreatedBeforeOrOn = createdDate <= requestedDate;
        const isStarted = j.date_started !== null;
        const isNotCompleted = j.date_completed === null || String(j.date_completed).substring(0, 10) > requestedDate;
        const isNotDelayed = expCompDate >= requestedDate;

        const rawStat = j.joborder_status as Record<string, unknown> | Record<string, unknown>[] | null;
        const stat = Array.isArray(rawStat) ? rawStat[0] : rawStat;
        const statusName = String(stat?.status_name || '').toLowerCase();
        const isInProgressStatus = statusName.includes('in-progress') || statusName.includes('in progress');

        return isCreatedBeforeOrOn && isStarted && isNotCompleted && isNotDelayed && isInProgressStatus;
      });

      setOngoingWorkOrderRegister(
        ongoingRecords.map(j => mapToRegisterRecord(j as Record<string, unknown>, 'Ongoing'))
      );

      setNotYetStartedRegister(
        notYetStartedRecords.map(j => mapToRegisterRecord(j as Record<string, unknown>, 'Pending'))
      );

      const overdueList: OverdueJobOrderRecord[] = masterList
        .filter(j => {
          if (!j.created_at || !j.expected_completion) return false;
          const createdDate = String(j.created_at).substring(0, 10);
          const expCompDate = String(j.expected_completion).substring(0, 10);
          const isCreatedBefore = createdDate <= requestedDate;
          const isNotCompleted = j.date_completed === null || String(j.date_completed).substring(0, 10) > requestedDate;
          const isOverdue = expCompDate < requestedDate;

          return isCreatedBefore && isNotCompleted && isOverdue;
        })
        .map(j => {
          const expCompDateStr = String(j.expected_completion).substring(0, 10);
          const expCompDate = new Date(`${expCompDateStr}T00:00:00`);
          const diffTime = Math.abs(requestedDateObj.getTime() - expCompDate.getTime());
          const daysDelayed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          const rawPrio = j.joborder_priority as Record<string, unknown> | Record<string, unknown>[] | null;
          const prio = Array.isArray(rawPrio) ? rawPrio[0] : rawPrio;

          const rawStat = j.joborder_status as Record<string, unknown> | Record<string, unknown>[] | null;
          const stat = Array.isArray(rawStat) ? rawStat[0] : rawStat;

          const rawEmp = j.employees as Record<string, unknown> | Record<string, unknown>[] | null;
          const emp = Array.isArray(rawEmp) ? rawEmp[0] : rawEmp;

          const rawVeh = j.vehicles as Record<string, unknown> | Record<string, unknown>[] | null;
          const veh = Array.isArray(rawVeh) ? rawVeh[0] : rawVeh;

          return {
            evaluation_date: requestedDate,
            job_order_no: String(j.job_order_no || `JO-${j.job_order_id}`),
            plate_no: String(veh?.plate_no || 'N/A'),
            priority_level: String(prio?.priority_desc || 'Normal'),
            current_status: String(stat?.status_name || 'Open'),
            date_requested: j.created_at ? String(j.created_at).substring(0, 10) : '—',
            expected_completion: expCompDateStr,
            date_started: j.date_started ? String(j.date_started).substring(0, 10) : null,
            days_delayed: daysDelayed,
            assigned_supervisor: String(emp?.employee_name || 'Unassigned')
          };
        })
        .sort((a, b) => b.days_delayed - a.days_delayed || a.expected_completion.localeCompare(b.expected_completion));

      setOverdueQueue(overdueList);

      const totalDelayedCount = overdueList.length;
      let maxDelayedDays = 0;
      let totalDelayedSum = 0;

      overdueList.forEach(o => {
        if (o.days_delayed > maxDelayedDays) maxDelayedDays = o.days_delayed;
        totalDelayedSum += o.days_delayed;
      });

      setDelayedSummary({
        evaluation_date: requestedDate,
        total_delayed_job_orders: totalDelayedCount,
        max_days_delayed: maxDelayedDays,
        avg_days_delayed: totalDelayedCount > 0 ? Number((totalDelayedSum / totalDelayedCount).toFixed(1)) : 0
      });

    } catch (err: unknown) {
      console.error('Error fetching Job Order Priorities data:', err);
    } finally {
      setDateLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function init() {
      await Promise.all([
        fetchGeneralDashboardData(),
        fetchInspectionComplianceData(selectedInspectionDate),
        fetchJobOrderPrioritiesData(selectedInspectionDate)
      ]);
      if (active) {
        setLoading(false);
      }
    }

    init();

    return () => {
      active = false;
    };
  }, [fetchGeneralDashboardData, fetchInspectionComplianceData, fetchJobOrderPrioritiesData, selectedInspectionDate]);

  const handleDateChange = (newDate: string) => {
    setSelectedInspectionDate(newDate);
    setOngoingJoPage(1);
    setNotStartedJoPage(1);
    setOverdueJoPage(1);
    setComplianceKpiInspectPage(1);
    setJoVolumeKpiInspectPage(1);
    setJoDelayKpiInspectPage(1);
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchGeneralDashboardData(),
      fetchInspectionComplianceData(selectedInspectionDate),
      fetchJobOrderPrioritiesData(selectedInspectionDate)
    ]);
    setRefreshing(false);
  };

  /* --- Kanban Board Grouped Lanes --- */
  const kanbanColumns = useMemo(() => {
    const queued: WorkOrderRegisterRecord[] = [];
    const onHold: WorkOrderRegisterRecord[] = [];
    const inProgress: WorkOrderRegisterRecord[] = [];
    const delayed: WorkOrderRegisterRecord[] = [];

    allActiveWorkOrders.forEach((wo) => {
      const statusLower = wo.current_status.toLowerCase();
      const isOverdue = Boolean(wo.expected_completion && wo.expected_completion < selectedInspectionDate);

      if (isOverdue || statusLower.includes('delay') || statusLower.includes('overdue')) {
        delayed.push(wo);
      } else if (statusLower.includes('hold') || statusLower.includes('pause') || statusLower.includes('suspend')) {
        onHold.push(wo);
      } else if (
        statusLower.includes('progress') ||
        statusLower.includes('ongoing') ||
        statusLower.includes('active') ||
        wo.date_started !== null
      ) {
        inProgress.push(wo);
      } else {
        queued.push(wo);
      }
    });

    delayed.sort((a, b) => b.days_delayed - a.days_delayed);

    return {
      queued,
      onHold,
      inProgress,
      delayed
    };
  }, [allActiveWorkOrders, selectedInspectionDate]);

  /* --- KPI Inspector Derived Datasets --- */

  // 1. PM Priorities KPI Inspector Data
  const pmAffectedVehiclesList = useMemo(() => {
    const map = new Map<
      string,
      {
        vehicle_id: string;
        plate_no: string;
        current_rdg: number;
        pm_codes: string[];
        past_due: number;
        currently_due: number;
        threshold: number;
        total: number;
      }
    >();

    flaggedVehicles.forEach((item) => {
      const existing = map.get(item.vehicle_id) || {
        vehicle_id: item.vehicle_id,
        plate_no: item.plate_no,
        current_rdg: item.current_rdg,
        pm_codes: [],
        past_due: 0,
        currently_due: 0,
        threshold: 0,
        total: 0,
      };
      existing.pm_codes.push(item.pm_code);
      if (item.pm_status === 'PAST DUE') existing.past_due += 1;
      else if (item.pm_status === 'CURRENTLY DUE') existing.currently_due += 1;
      else existing.threshold += 1;
      existing.total += 1;
      map.set(item.vehicle_id, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.past_due - a.past_due || b.total - a.total);
  }, [flaggedVehicles]);

  const pmKpiInspectItems = useMemo(() => {
    if (!selectedPmKpi || selectedPmKpi === 'vehicles') return [];
    if (selectedPmKpi === 'total') return flaggedVehicles;
    if (selectedPmKpi === 'past-due') return flaggedVehicles.filter((i) => i.pm_status === 'PAST DUE');
    if (selectedPmKpi === 'currently-due') return flaggedVehicles.filter((i) => i.pm_status === 'CURRENTLY DUE');
    return flaggedVehicles.filter((i) => i.pm_status === 'DUE TO THRESHOLD');
  }, [selectedPmKpi, flaggedVehicles]);

  const paginatedPmKpiItems = useMemo(() => {
    const start = (pmKpiInspectPage - 1) * pageSize;
    return pmKpiInspectItems.slice(start, start + pageSize);
  }, [pmKpiInspectItems, pmKpiInspectPage]);

  const paginatedPmAffectedVehicles = useMemo(() => {
    const start = (pmKpiInspectPage - 1) * pageSize;
    return pmAffectedVehiclesList.slice(start, start + pageSize);
  }, [pmAffectedVehiclesList, pmKpiInspectPage]);

  // 2. Inspection Compliance KPI Inspector Data
  const complianceKpiInspectItems = useMemo(() => {
    if (!selectedComplianceKpi) return [];
    switch (selectedComplianceKpi) {
      case 'total-fleet':
      case 'compliance-rate':
        return fleetComplianceRecords;
      case 'inspected':
      case 'status-compliance':
        return fleetComplianceRecords.filter((r) => r.is_inspected);
      case 'uninspected':
        return fleetComplianceRecords.filter((r) => !r.is_inspected);
      case 'operational':
        return fleetComplianceRecords.filter((r) => r.status_name.toLowerCase().includes('operation'));
      case 'standby':
        return fleetComplianceRecords.filter((r) => r.status_name.toLowerCase().includes('stand'));
      case 'breakdown':
        return fleetComplianceRecords.filter(
          (r) =>
            r.status_name.toLowerCase().includes('breakdown') ||
            r.status_name.toLowerCase().includes('maintenance')
        );
      default:
        return [];
    }
  }, [selectedComplianceKpi, fleetComplianceRecords]);

  const paginatedComplianceKpiItems = useMemo(() => {
    const start = (complianceKpiInspectPage - 1) * pageSize;
    return complianceKpiInspectItems.slice(start, start + pageSize);
  }, [complianceKpiInspectItems, complianceKpiInspectPage]);

  // 3. Job Order Volume KPI Inspector Data
  const joVolumeKpiInspectItems = useMemo(() => {
    if (!selectedJoVolumeKpi) return [];
    switch (selectedJoVolumeKpi) {
      case 'total-created':
      case 'unique-vehicles':
      case 'completion-rate':
        return createdWorkOrderRegister;
      case 'completed':
        return completedWorkOrderRegister;
      case 'not-started':
        return notYetStartedRegister;
      default:
        return [];
    }
  }, [selectedJoVolumeKpi, createdWorkOrderRegister, completedWorkOrderRegister, notYetStartedRegister]);

  const paginatedJoVolumeKpiItems = useMemo(() => {
    const start = (joVolumeKpiInspectPage - 1) * pageSize;
    return joVolumeKpiInspectItems.slice(start, start + pageSize);
  }, [joVolumeKpiInspectItems, joVolumeKpiInspectPage]);

  // 4. Job Order Delays KPI Inspector Data
  const joDelayKpiInspectItems = useMemo(() => {
    if (!selectedJoDelayKpi) return [];
    if (selectedJoDelayKpi === 'max-delay') {
      return overdueQueue.filter((o) => o.days_delayed === delayedSummary.max_days_delayed);
    }
    return overdueQueue;
  }, [selectedJoDelayKpi, overdueQueue, delayedSummary.max_days_delayed]);

  const paginatedJoDelayKpiItems = useMemo(() => {
    const start = (joDelayKpiInspectPage - 1) * pageSize;
    return joDelayKpiInspectItems.slice(start, start + pageSize);
  }, [joDelayKpiInspectItems, joDelayKpiInspectPage]);

  // Paginated slices for main tables
  const paginatedOngoingJo = useMemo(() => {
    const start = (ongoingJoPage - 1) * pageSize;
    return ongoingWorkOrderRegister.slice(start, start + pageSize);
  }, [ongoingWorkOrderRegister, ongoingJoPage]);

  const paginatedNotStartedJo = useMemo(() => {
    const start = (notStartedJoPage - 1) * pageSize;
    return notYetStartedRegister.slice(start, start + pageSize);
  }, [notYetStartedRegister, notStartedJoPage]);

  const paginatedOverdueJo = useMemo(() => {
    const start = (overdueJoPage - 1) * pageSize;
    return overdueQueue.slice(start, start + pageSize);
  }, [overdueQueue, overdueJoPage]);

  // Pagination Controls component helper
  const renderPagination = (currentPage: number, totalItems: number, onPageChange: (p: number) => void) => {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between pt-2 px-1 text-xs text-(--text-muted)">
        <div>
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 rounded-lg border border-solid border-(--border-main) bg-(--bg-elevated) hover:bg-(--accent-subtle) disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono font-semibold px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1 rounded-lg border border-solid border-(--border-main) bg-(--bg-elevated) hover:bg-(--accent-subtle) disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const handleExportComplianceHtml = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleString();

    const rowsHtml = uninspectedVehicles.map((u, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 10px 12px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${u.plate_no}</td>
        <td style="padding: 10px 12px; font-family: monospace; text-align: right; color: #334155; border-bottom: 1px solid #e2e8f0;">${u.service_rdg.toLocaleString()}</td>
        <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          <span style="padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5;">
            UNINSPECTED
          </span>
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>RC-MRO - Daily Inspection Compliance Report</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 24px; background-color: #ffffff; }
          .header-container { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
          .brand-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
          .brand-subtitle { font-size: 12px; color: #64748b; margin: 0; text-transform: uppercase; font-weight: 600; }
          .meta-box { text-align: right; font-size: 11px; color: #475569; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .summary-card { padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; background-color: #f8fafc; }
          .summary-card-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
          .summary-card-value { font-size: 20px; font-weight: 800; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
          th { background-color: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 10px; font-weight: 700; padding: 10px 12px; text-align: left; }
          th.text-right { text-align: right; }
          th.text-center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div>
            <h1 class="brand-title">Reliability-Centered MRO</h1>
            <p class="brand-subtitle">Daily Fleet Inspection Compliance Report</p>
          </div>
          <div class="meta-box">
            <div><strong>Generated:</strong> ${dateStr}</div>
            <div><strong>Inspection Date:</strong> ${complianceSummary.inspection_date}</div>
          </div>
        </div>
        <div class="summary-grid">
          <div class="summary-card"><div class="summary-card-title">Total Fleet</div><div class="summary-card-value">${complianceSummary.total_active_vehicles}</div></div>
          <div class="summary-card" style="border-color: #a7f3d0; background-color: #ecfdf5;"><div class="summary-card-title" style="color: #047857;">Inspected</div><div class="summary-card-value" style="color: #047857;">${complianceSummary.inspected_count}</div></div>
          <div class="summary-card" style="border-color: #fca5a5; background-color: #fef2f2;"><div class="summary-card-title" style="color: #b91c1c;">Uninspected</div><div class="summary-card-value" style="color: #b91c1c;">${complianceSummary.uninspected_count}</div></div>
          <div class="summary-card" style="border-color: #bfdbfe; background-color: #eff6ff;"><div class="summary-card-title" style="color: #1d4ed8;">Compliance Rate</div><div class="summary-card-value" style="color: #1d4ed8;">${complianceSummary.inspection_compliance_percentage}%</div></div>
        </div>
        <h3>Uninspected Active Fleet (${uninspectedVehicles.length} Vehicles)</h3>
        <table>
          <thead>
            <tr>
              <th>Plate No</th>
              <th class="text-right">Service Reading</th>
              <th class="text-center">Inspection Status</th>
            </tr>
          </thead>
          <tbody>${rowsHtml || '<tr><td colSpan="3" style="text-align: center; padding: 12px; color: #64748b;">All active fleet units were inspected on this date.</td></tr>'}</tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportJobOrdersHtml = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleString();

    let title: string;
    let summaryCardsHtml: string;
    let contentTablesHtml: string;

    if (joSubTab === 'volume') {
      title = 'Daily Job Order Volume & Registers Report';
      summaryCardsHtml = `
        <div class="summary-card"><div class="summary-card-title">Total Created</div><div class="summary-card-value">${volumeSummary.total_job_orders_created}</div></div>
        <div class="summary-card"><div class="summary-card-title">Unique Vehicles</div><div class="summary-card-value">${volumeSummary.unique_vehicles_serviced}</div></div>
        <div class="summary-card" style="border-color: #a7f3d0; background-color: #ecfdf5;"><div class="summary-card-title" style="color: #047857;">Completed</div><div class="summary-card-value" style="color: #047857;">${volumeSummary.completed_count}</div></div>
        <div class="summary-card" style="border-color: #fde68a; background-color: #fffbeb;"><div class="summary-card-title" style="color: #b45309;">Not Yet Started</div><div class="summary-card-value" style="color: #b45309;">${volumeSummary.not_yet_started_count}</div></div>
        <div class="summary-card" style="border-color: #bfdbfe; background-color: #eff6ff;"><div class="summary-card-title" style="color: #1d4ed8;">Completion Rate</div><div class="summary-card-value" style="color: #1d4ed8;">${volumeSummary.completion_rate_percentage}%</div></div>
      `;

      const ongoingRows = ongoingWorkOrderRegister.length === 0
        ? `<tr><td colspan="9" style="text-align: center; padding: 10px; color: #64748b;">No ongoing job orders found.</td></tr>`
        : ongoingWorkOrderRegister.map((r, idx) => `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 6px 8px; font-weight: 700; font-family: monospace; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${r.job_order_no}</td>
            <td style="padding: 6px 8px; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0;">${r.plate_no}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${r.priority_level}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${r.current_status}</td>
            <td style="padding: 6px 8px; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${r.date_requested}</td>
            <td style="padding: 6px 8px; font-family: monospace; color: #047857; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${r.date_started || '—'}</td>
            <td style="padding: 6px 8px; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${r.expected_completion || '—'}</td>
            <td style="padding: 6px 8px; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${r.date_completed || '—'}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${r.assigned_supervisor}</td>
          </tr>
        `).join('');

      const notStartedRows = notYetStartedRegister.length === 0
        ? `<tr><td colspan="9" style="text-align: center; padding: 10px; color: #64748b;">No pending/unstarted job orders found.</td></tr>`
        : notYetStartedRegister.map((r, idx) => `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 6px 8px; font-weight: 700; font-family: monospace; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${r.job_order_no}</td>
            <td style="padding: 6px 8px; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0;">${r.plate_no}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${r.priority_level}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${r.current_status}</td>
            <td style="padding: 6px 8px; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${r.date_requested}</td>
            <td style="padding: 6px 8px; font-family: monospace; color: #b45309; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${r.date_started || '—'}</td>
            <td style="padding: 6px 8px; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${r.expected_completion || '—'}</td>
            <td style="padding: 6px 8px; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${r.date_completed || '—'}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${r.assigned_supervisor}</td>
          </tr>
        `).join('');

      contentTablesHtml = `
        <h3 style="margin: 16px 0 8px 0; font-size: 13px; font-weight: 700; color: #0f172a;">Ongoing Job Orders (${ongoingWorkOrderRegister.length})</h3>
        <table>
          <thead>
            <tr>
              <th>JO Number</th><th>Plate No</th><th>Priority</th><th>Status</th><th>Date Requested</th><th>Date Started</th><th>Expected Comp.</th><th>Date Completed</th><th>Supervisor</th>
            </tr>
          </thead>
          <tbody>${ongoingRows}</tbody>
        </table>

        <h3 style="margin: 24px 0 8px 0; font-size: 13px; font-weight: 700; color: #0f172a;">Not yet Started Job Orders (${notYetStartedRegister.length})</h3>
        <table>
          <thead>
            <tr>
              <th>JO Number</th><th>Plate No</th><th>Priority</th><th>Status</th><th>Date Requested</th><th>Date Started</th><th>Expected Comp.</th><th>Date Completed</th><th>Supervisor</th>
            </tr>
          </thead>
          <tbody>${notStartedRows}</tbody>
        </table>
      `;

    } else if (joSubTab === 'delays') {
      title = 'Overdue Job Orders & Delay Duration Queue Report';
      summaryCardsHtml = `
        <div class="summary-card" style="border-color: #fca5a5; background-color: #fef2f2;"><div class="summary-card-title" style="color: #b91c1c;">Total Overdue Orders</div><div class="summary-card-value" style="color: #b91c1c;">${delayedSummary.total_delayed_job_orders}</div></div>
        <div class="summary-card" style="border-color: #fca5a5; background-color: #fef2f2;"><div class="summary-card-title" style="color: #b91c1c;">Max Delay Duration</div><div class="summary-card-value" style="color: #b91c1c;">${delayedSummary.max_days_delayed} Days</div></div>
        <div class="summary-card" style="border-color: #fde68a; background-color: #fffbeb;"><div class="summary-card-title" style="color: #b45309;">Average Schedule Variance</div><div class="summary-card-value" style="color: #b45309;">${delayedSummary.avg_days_delayed} Days</div></div>
      `;

      const overdueRows = overdueQueue.length === 0
        ? `<tr><td colspan="8" style="text-align: center; padding: 12px; color: #64748b;">No overdue job orders recorded.</td></tr>`
        : overdueQueue.map((r, idx) => `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 8px 10px; font-weight: 700; font-family: monospace; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${r.job_order_no}</td>
            <td style="padding: 8px 10px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${r.plate_no}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${r.priority_level}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${r.current_status}</td>
            <td style="padding: 8px 10px; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${r.date_requested}</td>
            <td style="padding: 8px 10px; font-family: monospace; font-weight: 700; color: #b91c1c; border-bottom: 1px solid #e2e8f0;">${r.expected_completion}</td>
            <td style="padding: 8px 10px; font-family: monospace; font-weight: 800; color: #b91c1c; border-bottom: 1px solid #e2e8f0;">+${r.days_delayed} Days</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${r.assigned_supervisor}</td>
          </tr>
        `).join('');

      contentTablesHtml = `
        <h3 style="margin: 16px 0 8px 0; font-size: 13px; font-weight: 700; color: #0f172a;">Overdue Queue (${overdueQueue.length})</h3>
        <table>
          <thead>
            <tr>
              <th>JO Number</th><th>Plate No</th><th>Priority Level</th><th>Current Status</th><th>Date Requested</th><th>Target Completion</th><th>Days Delayed</th><th>Assigned Supervisor</th>
            </tr>
          </thead>
          <tbody>${overdueRows}</tbody>
        </table>
      `;
    } else {
      title = 'Job Order Kanban Board Status Snapshot';
      summaryCardsHtml = `
        <div class="summary-card"><div class="summary-card-title">Queued</div><div class="summary-card-value">${kanbanColumns.queued.length}</div></div>
        <div class="summary-card" style="border-color: #fde68a; background-color: #fffbeb;"><div class="summary-card-title" style="color: #b45309;">On-Hold</div><div class="summary-card-value" style="color: #b45309;">${kanbanColumns.onHold.length}</div></div>
        <div class="summary-card" style="border-color: #bfdbfe; background-color: #eff6ff;"><div class="summary-card-title" style="color: #1d4ed8;">In-Progress</div><div class="summary-card-value" style="color: #1d4ed8;">${kanbanColumns.inProgress.length}</div></div>
        <div class="summary-card" style="border-color: #fca5a5; background-color: #fef2f2;"><div class="summary-card-title" style="color: #b91c1c;">Delayed</div><div class="summary-card-value" style="color: #b91c1c;">${kanbanColumns.delayed.length}</div></div>
      `;

      const laneRows = [
        ...kanbanColumns.delayed.map(r => ({ lane: `Delayed (+${r.days_delayed}d)`, r })),
        ...kanbanColumns.inProgress.map(r => ({ lane: 'In-Progress', r })),
        ...kanbanColumns.onHold.map(r => ({ lane: 'On-Hold', r })),
        ...kanbanColumns.queued.map(r => ({ lane: 'Queued', r })),
      ];

      const rowsHtml = laneRows.length === 0
        ? `<tr><td colspan="7" style="text-align: center; padding: 12px; color: #64748b;">No active job orders on the board.</td></tr>`
        : laneRows.map(({ lane, r }, idx) => `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 8px 10px; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${lane}</td>
            <td style="padding: 8px 10px; font-weight: 700; font-family: monospace; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${r.job_order_no}</td>
            <td style="padding: 8px 10px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${r.plate_no}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${r.priority_level}</td>
            <td style="padding: 8px 10px; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${r.date_requested}</td>
            <td style="padding: 8px 10px; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${r.expected_completion || '—'}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${r.assigned_supervisor}</td>
          </tr>
        `).join('');

      contentTablesHtml = `
        <table>
          <thead>
            <tr>
              <th>Board Column</th><th>JO Number</th><th>Plate No</th><th>Priority</th><th>Date Requested</th><th>Target Completion</th><th>Supervisor</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>RC-MRO - ${title}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 20px; background-color: #ffffff; }
          .header-container { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .brand-title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
          .brand-subtitle { font-size: 11px; color: #64748b; margin: 0; text-transform: uppercase; font-weight: 600; }
          .meta-box { text-align: right; font-size: 11px; color: #475569; }
          .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 16px; }
          .summary-card { padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; background-color: #f8fafc; }
          .summary-card-title { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
          .summary-card-value { font-size: 18px; font-weight: 800; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
          th { background-color: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 9px; font-weight: 700; padding: 8px 10px; text-align: left; }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div>
            <h1 class="brand-title">Reliability-Centered MRO</h1>
            <p class="brand-subtitle">${title}</p>
          </div>
          <div class="meta-box">
            <div><strong>Generated:</strong> ${dateStr}</div>
            <div><strong>Target Date:</strong> ${selectedInspectionDate}</div>
          </div>
        </div>
        <div class="summary-grid">
          ${summaryCardsHtml}
        </div>
        ${contentTablesHtml}
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getMainTabClass = (tabKey: MainTab) => {
    const isActive = activeTab === tabKey;
    return isActive
      ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) border border-solid border-(--btn-primary-bg) shadow-md ring-2 ring-(--btn-primary-bg)/30'
      : 'bg-(--bg-surface) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--accent-subtle) border border-solid border-(--border-main)';
  };

  const getSubTabClass = (subTabKey: JoSubTab) => {
    const isActive = joSubTab === subTabKey;
    return isActive
      ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) border border-solid border-(--btn-primary-bg) shadow-md ring-2 ring-(--btn-primary-bg)/30'
      : 'bg-(--bg-surface) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--accent-subtle) border border-solid border-(--border-main)';
  };

  const renderPmStatusBadge = (status: FlaggedVehiclePm['pm_status']) => {
    if (status === 'PAST DUE') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-solid border-red-300 dark:border-red-800">
          PAST DUE
        </span>
      );
    }
    if (status === 'CURRENTLY DUE') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-solid border-amber-300 dark:border-amber-800">
          CURRENTLY DUE
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-solid border-blue-300 dark:border-blue-800">
        DUE TO THRESHOLD
      </span>
    );
  };

  const renderPriorityBadge = (priority: string) => {
    const pLower = priority.toLowerCase();
    if (pLower.includes('urgent') || pLower.includes('high') || pLower.includes('critical')) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-solid border-red-500/30">
          {priority}
        </span>
      );
    }
    if (pLower.includes('medium') || pLower.includes('normal')) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-solid border-blue-500/30">
          {priority}
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-(--text-secondary) border border-solid border-(--border-main)">
        {priority}
      </span>
    );
  };

  const renderKanbanCard = (jo: WorkOrderRegisterRecord, lane: KanbanLane) => {
    const isDelayed = lane === 'delayed';
    return (
      <button
        key={jo.job_order_id || jo.job_order_no}
        type="button"
        onClick={() => setSelectedKanbanJo({ record: jo, lane })}
        className={`w-full text-left p-3 rounded-xl border border-solid bg-(--bg-elevated) hover:bg-(--accent-subtle) transition-all cursor-pointer shadow-xs space-y-2 ${
          isDelayed
            ? 'border-red-500/40 hover:border-red-500'
            : lane === 'on-hold'
            ? 'border-amber-500/30 hover:border-amber-500'
            : lane === 'in-progress'
            ? 'border-blue-500/30 hover:border-blue-500'
            : 'border-(--border-main) hover:border-(--text-muted)'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-extrabold text-(--text-primary)">
            {jo.job_order_no}
          </span>
          {renderPriorityBadge(jo.priority_level)}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-(--text-primary)">
            <Car className="w-3.5 h-3.5 text-(--text-muted)" />
            <span>{jo.plate_no}</span>
          </div>
          {isDelayed && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono bg-red-600 text-white shadow-xs">
              +{jo.days_delayed} {jo.days_delayed === 1 ? 'Day' : 'Days'} Delayed
            </span>
          )}
        </div>

        <div className="text-[11px] text-(--text-muted) flex items-center justify-between pt-1 border-t border-(--border-main)">
          <span className="truncate max-w-36" title={jo.assigned_supervisor}>
            Sup: <strong className="text-(--text-secondary)">{jo.assigned_supervisor}</strong>
          </span>
          <span className="font-mono text-[10px]">
            Due: {jo.expected_completion || '—'}
          </span>
        </div>
      </button>
    );
  };

  const pmKpiLabels: Record<PmKpiKey, string> = {
    total: 'Total Flagged PMs',
    vehicles: 'Vehicles Affected',
    'past-due': 'Past Due PMs',
    'currently-due': 'Currently Due PMs',
    threshold: 'Due To Threshold PMs',
  };

  const complianceKpiLabels: Record<ComplianceKpiKey, string> = {
    'total-fleet': 'Total Active Fleet',
    inspected: 'Inspected Units',
    uninspected: 'Uninspected Units',
    'compliance-rate': 'Compliance Rate Breakdown',
    operational: 'Operational Fleet Units',
    standby: 'Standby Fleet Units',
    breakdown: 'Breakdown Fleet Units',
    'status-compliance': 'Status Compliance Breakdown',
  };

  const joVolumeKpiLabels: Record<JoVolumeKpiKey, string> = {
    'total-created': 'Total Created Job Orders',
    'unique-vehicles': 'Unique Vehicles Serviced',
    completed: 'Completed Job Orders',
    'not-started': 'Not Yet Started Job Orders',
    'completion-rate': 'Completion Rate Breakdown',
  };

  const joDelayKpiLabels: Record<JoDelayKpiKey, string> = {
    'total-delayed': 'Total Delayed Job Orders',
    'max-delay': 'Max Delay Duration Job Orders',
    'avg-delay': 'Average Delay Breakdown',
  };

  const kanbanLaneLabels: Record<KanbanLane, { title: string; badgeClass: string }> = {
    queued: {
      title: 'Queued',
      badgeClass: 'bg-slate-500/15 text-(--text-primary) border-(--border-main)',
    },
    'on-hold': {
      title: 'On-Hold',
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    },
    'in-progress': {
      title: 'In-Progress',
      badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    },
    delayed: {
      title: 'Delayed',
      badgeClass: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    },
  };

  return (
    <div className="h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 rounded-xl shadow-xs shrink-0">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">
              Reliability-Centered MRO Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">
              Monitor equipment health, inspection compliance, and job order priorities.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={loading || refreshing || dateLoading}
          className="bg-(--bg-surface) hover:bg-(--accent-subtle) border border-solid border-(--border-main) text-(--text-primary) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          title="Refresh dashboard metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-solid border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-2.5 rounded-lg flex items-center gap-3 text-xs shrink-0">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content Body Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-elevated) border border-solid border-(--border-main) rounded-xl p-4 shadow-xl overflow-hidden space-y-3">
        {/* Primary Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-(--border-main) pb-3 pt-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('todays-priorities')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getMainTabClass('todays-priorities')}`}
          >
            <Clock className={`w-4 h-4 ${activeTab === 'todays-priorities' ? '' : 'text-amber-500'}`} />
            <span>Today's PM Priorities</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inspection-compliance')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getMainTabClass('inspection-compliance')}`}
          >
            <Car className={`w-4 h-4 ${activeTab === 'inspection-compliance' ? '' : 'text-blue-500'}`} />
            <span>Inspection Compliance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('job-order-priorities')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getMainTabClass('job-order-priorities')}`}
          >
            <ClipboardList className={`w-4 h-4 ${activeTab === 'job-order-priorities' ? '' : 'text-emerald-500'}`} />
            <span>Job Order Priorities</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto p-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-(--text-muted)" />
              <p className="text-xs text-(--text-muted)">Loading dashboard analytics...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: TODAY'S PM PRIORITIES */}
              {activeTab === 'todays-priorities' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPmKpi(selectedPmKpi === 'total' ? null : 'total');
                        setPmKpiInspectPage(1);
                      }}
                      className={`w-full p-3 bg-(--bg-surface) border border-solid rounded-xl space-y-1 shadow-xs text-left transition-all cursor-pointer ${
                        selectedPmKpi === 'total'
                          ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-500/5'
                          : 'border-(--border-main) hover:border-(--text-muted)'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase text-(--text-muted)">Total Flagged PMs</div>
                      <div className="text-xl font-extrabold text-(--text-primary)">{overviewSummary.grand_total_pms}</div>
                      <div className="text-[10px] text-(--text-muted)">Click to inspect</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPmKpi(selectedPmKpi === 'vehicles' ? null : 'vehicles');
                        setPmKpiInspectPage(1);
                      }}
                      className={`w-full p-3 bg-(--bg-surface) border border-solid rounded-xl space-y-1 shadow-xs text-left transition-all cursor-pointer ${
                        selectedPmKpi === 'vehicles'
                          ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-indigo-500/5'
                          : 'border-(--border-main) hover:border-indigo-500/50'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase text-(--text-muted)">Vehicles Affected</div>
                      <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{overviewSummary.total_vehicles_affected}</div>
                      <div className="text-[10px] text-(--text-muted)">Click to inspect</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPmKpi(selectedPmKpi === 'past-due' ? null : 'past-due');
                        setPmKpiInspectPage(1);
                      }}
                      className={`w-full p-3 bg-red-500/10 border border-solid rounded-xl space-y-1 shadow-xs text-left transition-all cursor-pointer ${
                        selectedPmKpi === 'past-due'
                          ? 'border-red-500 ring-2 ring-red-500/40'
                          : 'border-red-500/30 hover:border-red-500'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">Past Due</div>
                      <div className="text-xl font-extrabold text-red-600 dark:text-red-400">{overviewSummary.past_due_count}</div>
                      <div className="text-[10px] text-red-600/80 dark:text-red-400/80">Click to inspect</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPmKpi(selectedPmKpi === 'currently-due' ? null : 'currently-due');
                        setPmKpiInspectPage(1);
                      }}
                      className={`w-full p-3 bg-amber-500/10 border border-solid rounded-xl space-y-1 shadow-xs text-left transition-all cursor-pointer ${
                        selectedPmKpi === 'currently-due'
                          ? 'border-amber-500 ring-2 ring-amber-500/40'
                          : 'border-amber-500/30 hover:border-amber-500'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Currently Due</div>
                      <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{overviewSummary.currently_due_count}</div>
                      <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80">Click to inspect</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPmKpi(selectedPmKpi === 'threshold' ? null : 'threshold');
                        setPmKpiInspectPage(1);
                      }}
                      className={`w-full p-3 bg-blue-500/10 border border-solid rounded-xl space-y-1 shadow-xs col-span-2 md:col-span-1 text-left transition-all cursor-pointer ${
                        selectedPmKpi === 'threshold'
                          ? 'border-blue-500 ring-2 ring-blue-500/40'
                          : 'border-blue-500/30 hover:border-blue-500'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">Due To Threshold</div>
                      <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{overviewSummary.due_to_threshold_count}</div>
                      <div className="text-[10px] text-blue-600/80 dark:text-blue-400/80">Click to inspect</div>
                    </button>
                  </div>

                  {/* Clicked PM KPI Inspector */}
                  {selectedPmKpi && (
                    <div className="p-3.5 bg-(--bg-surface) border-2 border-solid border-blue-500/40 rounded-xl space-y-3 shadow-xs animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-blue-600 dark:text-blue-400">
                          <Sparkles className="w-4 h-4" />
                          <span>
                            Inspecting KPI: {pmKpiLabels[selectedPmKpi]} (
                            {selectedPmKpi === 'vehicles'
                              ? `${pmAffectedVehiclesList.length} Vehicles`
                              : `${pmKpiInspectItems.length} Records`}
                            )
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedPmKpi(null)}
                          className="text-xs font-semibold text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
                        >
                          Close Inspector
                        </button>
                      </div>

                      {selectedPmKpi === 'vehicles' ? (
                        <>
                          <div className="overflow-x-auto border border-solid border-(--border-main) rounded-lg bg-(--bg-elevated)">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-(--bg-surface) text-[10px] text-(--text-muted) uppercase border-b border-(--border-main)">
                                <tr>
                                  <th className="p-2.5">Plate No</th>
                                  <th className="p-2.5 text-right">Current Rdg</th>
                                  <th className="p-2.5">Flagged PM Codes</th>
                                  <th className="p-2.5 text-center">Past Due</th>
                                  <th className="p-2.5 text-center">Currently Due</th>
                                  <th className="p-2.5 text-center">Threshold</th>
                                  <th className="p-2.5 text-center">Total PMs</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-(--border-main)">
                                {paginatedPmAffectedVehicles.length === 0 ? (
                                  <tr>
                                    <td colSpan={7} className="p-4 text-center text-(--text-muted) italic">
                                      No affected vehicles found.
                                    </td>
                                  </tr>
                                ) : (
                                  paginatedPmAffectedVehicles.map((v) => (
                                    <tr key={v.vehicle_id} className="hover:bg-(--accent-subtle)">
                                      <td className="p-2.5 font-bold text-(--text-primary)">{v.plate_no}</td>
                                      <td className="p-2.5 text-right font-mono text-(--text-primary)">{v.current_rdg.toLocaleString()}</td>
                                      <td className="p-2.5 font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                        {v.pm_codes.join(', ')}
                                      </td>
                                      <td className="p-2.5 text-center font-mono font-bold text-red-600 dark:text-red-400">{v.past_due}</td>
                                      <td className="p-2.5 text-center font-mono font-bold text-amber-600 dark:text-amber-400">{v.currently_due}</td>
                                      <td className="p-2.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{v.threshold}</td>
                                      <td className="p-2.5 text-center font-mono font-extrabold text-(--text-primary)">{v.total}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                          {renderPagination(pmKpiInspectPage, pmAffectedVehiclesList.length, setPmKpiInspectPage)}
                        </>
                      ) : (
                        <>
                          <div className="overflow-x-auto border border-solid border-(--border-main) rounded-lg bg-(--bg-elevated)">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-(--bg-surface) text-[10px] text-(--text-muted) uppercase border-b border-(--border-main)">
                                <tr>
                                  <th className="p-2.5">Plate No</th>
                                  <th className="p-2.5">PM Code</th>
                                  <th className="p-2.5 text-right">Current Rdg</th>
                                  <th className="p-2.5 text-right">Trigger Rdg</th>
                                  <th className="p-2.5 text-right">Target Rdg</th>
                                  <th className="p-2.5 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-(--border-main)">
                                {paginatedPmKpiItems.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="p-4 text-center text-(--text-muted) italic">
                                      No PM records found for this metric.
                                    </td>
                                  </tr>
                                ) : (
                                  paginatedPmKpiItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-(--accent-subtle)">
                                      <td className="p-2.5 font-bold text-(--text-primary)">{item.plate_no}</td>
                                      <td className="p-2.5 font-mono font-semibold">{item.pm_code}</td>
                                      <td className="p-2.5 text-right font-mono text-(--text-primary)">{item.current_rdg.toLocaleString()}</td>
                                      <td className="p-2.5 text-right font-mono text-blue-600 dark:text-blue-400">{item.trigger_rdg.toLocaleString()}</td>
                                      <td className="p-2.5 text-right font-mono font-semibold">{item.pm_current.toLocaleString()}</td>
                                      <td className="p-2.5 text-center">{renderPmStatusBadge(item.pm_status)}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                          {renderPagination(pmKpiInspectPage, pmKpiInspectItems.length, setPmKpiInspectPage)}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INSPECTION COMPLIANCE */}
              {activeTab === 'inspection-compliance' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-(--bg-surface) border border-solid border-(--border-main) rounded-xl shadow-xs">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-(--text-primary)">
                        Daily Fleet Inspection Compliance
                      </h2>
                      <p className="text-[11px] text-(--text-muted)">
                        Monitor active fleet daily inspections, operational statuses, and uninspected vehicle queues for {selectedInspectionDate}.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-(--bg-elevated) border border-solid border-(--border-main) px-3 py-1.5 rounded-lg shadow-xs">
                        {dateLoading ? (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                        ) : (
                          <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                        <label htmlFor="compliance-date-picker" className="text-xs font-semibold text-(--text-muted)">Inspection Date:</label>
                        <input
                          id="compliance-date-picker"
                          type="date"
                          value={selectedInspectionDate}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className="bg-transparent text-xs font-mono font-bold text-(--text-primary) focus:outline-none cursor-pointer"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleExportComplianceHtml}
                        className="flex items-center gap-1.5 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Export View</span>
                      </button>
                    </div>
                  </div>

                  {/* Top Row KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedComplianceKpi(selectedComplianceKpi === 'total-fleet' ? null : 'total-fleet');
                        setComplianceKpiInspectPage(1);
                      }}
                      className={`w-full p-3 bg-(--bg-surface) border border-solid rounded-xl space-y-1 shadow-xs text-left transition-all cursor-pointer ${
                        selectedComplianceKpi === 'total-fleet'
                          ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-500/5'
                          : 'border-(--border-main) hover:border-(--text-muted)'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase text-(--text-muted)">Total Active Fleet</div>
                      <div className="text-xl font-extrabold text-(--text-primary)">{complianceSummary.total_active_vehicles}</div>
                      <div className="text-[10px] text-(--text-muted)">Click to inspect</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedComplianceKpi(selectedComplianceKpi === 'inspected' ? null : 'inspected');
                        setComplianceKpiInspectPage(1);
                      }}
                      className={`w-full p-3 bg-emerald-500/10 border border-solid rounded-xl space-y-1 shadow-xs text-left transition-all cursor-pointer ${
                        selectedComplianceKpi === 'inspected'
                          ? 'border-emerald-500 ring-2 ring-emerald-500/40'
                          : 'border-emerald-500/30 hover:border-emerald-500'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Inspected Units</div>
                      <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{complianceSummary.inspected_count}</div>
                      <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">Click to inspect</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedComplianceKpi(selectedComplianceKpi === 'uninspected' ? null : 'uninspected');
                        setComplianceKpiInspectPage(1);
                      }}
                      className={`w-full p-3 bg-red-500/10 border border-solid rounded-xl space-y-1 shadow-xs text-left transition-all cursor-pointer ${
                        selectedComplianceKpi === 'uninspected'
                          ? 'border-red-500 ring-2 ring-red-500/40'
                          : 'border-red-500/30 hover:border-red-500'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">Uninspected Units</div>
                      <div className="text-xl font-extrabold text-red-600 dark:text-red-400">{complianceSummary.uninspected_count}</div>
                      <div className="text-[10px] text-red-600/80 dark:text-red-400/80">Click to inspect</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedComplianceKpi(selectedComplianceKpi === 'compliance-rate' ? null : 'compliance-rate');
                        setComplianceKpiInspectPage(1);
                      }}
                      className={`w-full p-3 bg-blue-500/10 border border-solid rounded-xl space-y-1 shadow-xs text-left transition-all cursor-pointer ${
                        selectedComplianceKpi === 'compliance-rate'
                          ? 'border-blue-500 ring-2 ring-blue-500/40'
                          : 'border-blue-500/30 hover:border-blue-500'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">Compliance Rate</div>
                      <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{complianceSummary.inspection_compliance_percentage}%</div>
                      <div className="text-[10px] text-blue-600/80 dark:text-blue-400/80">Click to inspect</div>
                    </button>
                  </div>

                  {/* Second Row KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedComplianceKpi(selectedComplianceKpi === 'operational' ? null : 'operational');
                        setComplianceKpiInspectPage(1);
                      }}
                      className={`w-full p-3 bg-emerald-500/5 border border-solid rounded-xl flex items-center justify-between shadow-xs text-left transition-all cursor-pointer ${
                        selectedComplianceKpi === 'operational'
                          ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/10'
                          : 'border-emerald-500/20 hover:border-emerald-500'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Operational</div>
                        <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{complianceSummary.operational_count}</div>
                        <div className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">Click to inspect</div>
                      </div>
                      <Activity className="w-5 h-5 text-emerald-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedComplianceKpi(selectedComplianceKpi === 'standby' ? null : 'standby');
                        setComplianceKpiInspectPage(1);
                      }}
                      className={`w-full p-3 bg-amber-500/5 border border-solid rounded-xl flex items-center justify-between shadow-xs text-left transition-all cursor-pointer ${
                        selectedComplianceKpi === 'standby'
                          ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-500/10'
                          : 'border-amber-500/20 hover:border-amber-500'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Standby</div>
                        <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{complianceSummary.standby_count}</div>
                        <div className="text-[9px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">Click to inspect</div>
                      </div>
                      <PauseCircle className="w-5 h-5 text-amber-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedComplianceKpi(selectedComplianceKpi === 'breakdown' ? null : 'breakdown');
                        setComplianceKpiInspectPage(1);
                      }}
                      className={`w-full p-3 bg-red-500/5 border border-solid rounded-xl flex items-center justify-between shadow-xs text-left transition-all cursor-pointer ${
                        selectedComplianceKpi === 'breakdown'
                          ? 'border-red-500 ring-2 ring-red-500/40 bg-red-500/10'
                          : 'border-red-500/20 hover:border-red-500'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">Breakdown</div>
                        <div className="text-lg font-extrabold text-red-600 dark:text-red-400">{complianceSummary.breakdown_count}</div>
                        <div className="text-[9px] text-red-600/70 dark:text-red-400/70 mt-0.5">Click to inspect</div>
                      </div>
                      <Wrench className="w-5 h-5 text-red-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedComplianceKpi(selectedComplianceKpi === 'status-compliance' ? null : 'status-compliance');
                        setComplianceKpiInspectPage(1);
                      }}
                      className={`w-full p-3 bg-indigo-500/5 border border-solid rounded-xl flex items-center justify-between shadow-xs text-left transition-all cursor-pointer ${
                        selectedComplianceKpi === 'status-compliance'
                          ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-indigo-500/10'
                          : 'border-indigo-500/20 hover:border-indigo-500'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">Status Compliance</div>
                        <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{complianceSummary.status_compliance_percentage}%</div>
                        <div className="text-[9px] text-indigo-600/70 dark:text-indigo-400/70 mt-0.5">Click to inspect</div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                    </button>
                  </div>

                  {/* Clicked Compliance KPI Inspector */}
                  {selectedComplianceKpi && (
                    <div className="p-3.5 bg-(--bg-surface) border-2 border-solid border-blue-500/40 rounded-xl space-y-3 shadow-xs animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-blue-600 dark:text-blue-400">
                          <Sparkles className="w-4 h-4" />
                          <span>
                            Inspecting KPI: {complianceKpiLabels[selectedComplianceKpi]} ({complianceKpiInspectItems.length} Vehicles on {selectedInspectionDate})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedComplianceKpi(null)}
                          className="text-xs font-semibold text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
                        >
                          Close Inspector
                        </button>
                      </div>

                      <div className="overflow-x-auto border border-solid border-(--border-main) rounded-lg bg-(--bg-elevated)">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-(--bg-surface) text-[10px] text-(--text-muted) uppercase border-b border-(--border-main)">
                            <tr>
                              <th className="p-2.5">Plate No</th>
                              <th className="p-2.5 text-right">Service Rdg</th>
                              <th className="p-2.5 text-center">Inspection Log</th>
                              <th className="p-2.5 text-center">Operational Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-(--border-main)">
                            {paginatedComplianceKpiItems.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-4 text-center text-(--text-muted) italic">
                                  No vehicles found for this metric on {selectedInspectionDate}.
                                </td>
                              </tr>
                            ) : (
                              paginatedComplianceKpiItems.map((rec) => (
                                <tr key={rec.vehicle_id} className="hover:bg-(--accent-subtle)">
                                  <td className="p-2.5 font-bold text-(--text-primary)">{rec.plate_no}</td>
                                  <td className="p-2.5 text-right font-mono text-(--text-primary)">{rec.service_rdg.toLocaleString()}</td>
                                  <td className="p-2.5 text-center">
                                    {rec.is_inspected ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-solid border-emerald-300 dark:border-emerald-800">
                                        INSPECTED
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-solid border-red-300 dark:border-red-800">
                                        UNINSPECTED
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2.5 text-center font-semibold text-(--text-secondary)">
                                    {rec.status_name}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {renderPagination(complianceKpiInspectPage, complianceKpiInspectItems.length, setComplianceKpiInspectPage)}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: JOB ORDER PRIORITIES */}
              {activeTab === 'job-order-priorities' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-(--bg-surface) border border-solid border-(--border-main) rounded-xl shadow-xs">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-(--text-primary)">
                        Job Order Analytics & Priority Control Center
                      </h2>
                      <p className="text-[11px] text-(--text-muted)">
                        Track work order volume, priority distributions, delays, and completion turnaround efficiency.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-(--bg-elevated) border border-solid border-(--border-main) px-3 py-1.5 rounded-lg shadow-xs">
                        {dateLoading ? (
                          <Loader2 className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />
                        ) : (
                          <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        <label htmlFor="jo-date-picker" className="text-xs font-semibold text-(--text-muted)">
                          Target Date:
                        </label>
                        <input
                          id="jo-date-picker"
                          type="date"
                          value={selectedInspectionDate}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className="bg-transparent text-xs font-mono font-bold text-(--text-primary) focus:outline-none cursor-pointer"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleExportJobOrdersHtml}
                        className="flex items-center gap-1.5 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Export View</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-Tab Navigation */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-(--border-main) pb-3 pt-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setJoSubTab('volume')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getSubTabClass('volume')}`}
                    >
                      <ClipboardList className={`w-4 h-4 ${joSubTab === 'volume' ? '' : 'text-emerald-500'}`} />
                      <span>1. Daily Volume & Register</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setJoSubTab('delays')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getSubTabClass('delays')}`}
                    >
                      <AlertOctagon className={`w-4 h-4 ${joSubTab === 'delays' ? '' : 'text-red-500'}`} />
                      <span>2. Delays & Overdue</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setJoSubTab('kanban')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getSubTabClass('kanban')}`}
                    >
                      <Columns3 className={`w-4 h-4 ${joSubTab === 'kanban' ? '' : 'text-blue-500'}`} />
                      <span>3. Kanban Board</span>
                    </button>
                  </div>

                  {/* SUB-VIEW 1: DAILY VOLUME & REGISTER */}
                  {joSubTab === 'volume' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJoVolumeKpi(selectedJoVolumeKpi === 'total-created' ? null : 'total-created');
                            setJoVolumeKpiInspectPage(1);
                          }}
                          className={`w-full p-3 bg-(--bg-surface) border border-solid rounded-xl space-y-1 shadow-xs text-left transition-all cursor-pointer ${
                            selectedJoVolumeKpi === 'total-created'
                              ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-500/5'
                              : 'border-(--border-main) hover:border-(--text-muted)'
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase text-(--text-muted)">Total Created</div>
                          <div className="text-xl font-extrabold text-(--text-primary)">{volumeSummary.total_job_orders_created}</div>
                          <div className="text-[10px] text-(--text-muted)">Click to inspect</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJoVolumeKpi(selectedJoVolumeKpi === 'unique-vehicles' ? null : 'unique-vehicles');
                            setJoVolumeKpiInspectPage(1);
                          }}
                          className={`w-full p-3 bg-(--bg-surface) border border-solid rounded-xl space-y-1 shadow-xs text-left transition-all cursor-pointer ${
                            selectedJoVolumeKpi === 'unique-vehicles'
                              ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-indigo-500/5'
                              : 'border-(--border-main) hover:border-indigo-500/50'
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase text-(--text-muted)">Unique Vehicles</div>
                          <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{volumeSummary.unique_vehicles_serviced}</div>
                          <div className="text-[10px] text-(--text-muted)">Click to inspect</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJoVolumeKpi(selectedJoVolumeKpi === 'completed' ? null : 'completed');
                            setJoVolumeKpiInspectPage(1);
                          }}
                          className={`w-full p-3 bg-emerald-500/10 border border-solid rounded-xl space-y-1 shadow-xs text-left transition-all cursor-pointer ${
                            selectedJoVolumeKpi === 'completed'
                              ? 'border-emerald-500 ring-2 ring-emerald-500/40'
                              : 'border-emerald-500/30 hover:border-emerald-500'
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Completed</div>
                          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{volumeSummary.completed_count}</div>
                          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">Click to inspect</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJoVolumeKpi(selectedJoVolumeKpi === 'not-started' ? null : 'not-started');
                            setJoVolumeKpiInspectPage(1);
                          }}
                          className={`w-full p-3 bg-amber-500/10 border border-solid rounded-xl space-y-1 shadow-xs text-left transition-all cursor-pointer ${
                            selectedJoVolumeKpi === 'not-started'
                              ? 'border-amber-500 ring-2 ring-amber-500/40'
                              : 'border-amber-500/30 hover:border-amber-500'
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Not Yet Started</div>
                          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{volumeSummary.not_yet_started_count}</div>
                          <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80">Click to inspect</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJoVolumeKpi(selectedJoVolumeKpi === 'completion-rate' ? null : 'completion-rate');
                            setJoVolumeKpiInspectPage(1);
                          }}
                          className={`w-full p-3 bg-blue-500/10 border border-solid rounded-xl space-y-1 shadow-xs col-span-2 md:col-span-1 text-left transition-all cursor-pointer ${
                            selectedJoVolumeKpi === 'completion-rate'
                              ? 'border-blue-500 ring-2 ring-blue-500/40'
                              : 'border-blue-500/30 hover:border-blue-500'
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">Completion Rate</div>
                          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{volumeSummary.completion_rate_percentage}%</div>
                          <div className="text-[10px] text-blue-600/80 dark:text-blue-400/80">Click to inspect</div>
                        </button>
                      </div>

                      {/* Clicked JO Volume KPI Inspector */}
                      {selectedJoVolumeKpi && (
                        <div className="p-3.5 bg-(--bg-surface) border-2 border-solid border-emerald-500/40 rounded-xl space-y-3 shadow-xs animate-fadeIn">
                          <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
                              <Sparkles className="w-4 h-4" />
                              <span>
                                Inspecting KPI: {joVolumeKpiLabels[selectedJoVolumeKpi]} ({joVolumeKpiInspectItems.length} Job Orders)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedJoVolumeKpi(null)}
                              className="text-xs font-semibold text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
                            >
                              Close Inspector
                            </button>
                          </div>

                          <div className="overflow-x-auto border border-solid border-(--border-main) rounded-lg bg-(--bg-elevated)">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-(--bg-surface) text-[10px] text-(--text-muted) uppercase border-b border-(--border-main)">
                                <tr>
                                  <th className="p-2.5">Job Order No</th>
                                  <th className="p-2.5">Plate No</th>
                                  <th className="p-2.5">Priority</th>
                                  <th className="p-2.5">Status</th>
                                  <th className="p-2.5">Date Requested</th>
                                  <th className="p-2.5">Date Started</th>
                                  <th className="p-2.5">Expected Comp.</th>
                                  <th className="p-2.5">Date Completed</th>
                                  <th className="p-2.5">Supervisor</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-(--border-main)">
                                {paginatedJoVolumeKpiItems.length === 0 ? (
                                  <tr>
                                    <td colSpan={9} className="p-4 text-center text-(--text-muted) italic">
                                      No job order records found for this metric.
                                    </td>
                                  </tr>
                                ) : (
                                  paginatedJoVolumeKpiItems.map((r, idx) => (
                                    <tr key={idx} className="hover:bg-(--accent-subtle)">
                                      <td className="p-2.5 font-mono font-bold text-(--text-primary)">{r.job_order_no}</td>
                                      <td className="p-2.5 font-semibold text-(--text-primary)">{r.plate_no}</td>
                                      <td className="p-2.5">{r.priority_level}</td>
                                      <td className="p-2.5">{r.current_status}</td>
                                      <td className="p-2.5 font-mono text-(--text-secondary)">{r.date_requested}</td>
                                      <td className="p-2.5 font-mono text-(--text-secondary)">{r.date_started || '—'}</td>
                                      <td className="p-2.5 font-mono text-(--text-secondary)">{r.expected_completion || '—'}</td>
                                      <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{r.date_completed || '—'}</td>
                                      <td className="p-2.5 text-(--text-secondary)">{r.assigned_supervisor}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                          {renderPagination(joVolumeKpiInspectPage, joVolumeKpiInspectItems.length, setJoVolumeKpiInspectPage)}
                        </div>
                      )}

                      {/* Table 1: Ongoing Job Order Register */}
                      <div className="border border-solid border-(--border-main) rounded-xl p-4 bg-(--bg-surface) space-y-3 shadow-xs">
                        <div className="flex items-center justify-between border-b border-(--border-main) pb-3">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                              Ongoing Job Orders ({ongoingWorkOrderRegister.length} Job Orders)
                            </h3>
                          </div>
                        </div>

                        <div className="overflow-x-auto border border-solid border-(--border-main) rounded-lg">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-(--border-main) text-(--text-muted) text-[10px] uppercase bg-(--bg-elevated) sticky top-0 z-10">
                                <th className="p-2.5">Job Order No</th>
                                <th className="p-2.5">Plate No</th>
                                <th className="p-2.5">Priority</th>
                                <th className="p-2.5">Status</th>
                                <th className="p-2.5">Date Requested</th>
                                <th className="p-2.5">Date Started</th>
                                <th className="p-2.5">Expected Comp.</th>
                                <th className="p-2.5">Date Completed</th>
                                <th className="p-2.5">Supervisor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border-main)">
                              {paginatedOngoingJo.length === 0 ? (
                                <tr>
                                  <td colSpan={9} className="p-6 text-center text-(--text-muted) italic">
                                    No ongoing job orders found.
                                  </td>
                                </tr>
                              ) : (
                                paginatedOngoingJo.map((r, idx) => (
                                  <tr key={idx} className="hover:bg-(--accent-subtle) transition-colors">
                                    <td className="p-2.5 font-mono font-bold text-(--text-primary)">{r.job_order_no}</td>
                                    <td className="p-2.5 font-semibold text-(--text-primary)">{r.plate_no}</td>
                                    <td className="p-2.5">{r.priority_level}</td>
                                    <td className="p-2.5">{r.current_status}</td>
                                    <td className="p-2.5 font-mono text-(--text-secondary)">{r.date_requested}</td>
                                    <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{r.date_started || '—'}</td>
                                    <td className="p-2.5 font-mono text-(--text-secondary)">{r.expected_completion || '—'}</td>
                                    <td className="p-2.5 font-mono text-(--text-secondary)">{r.date_completed || '—'}</td>
                                    <td className="p-2.5 text-(--text-secondary)">{r.assigned_supervisor}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        {renderPagination(ongoingJoPage, ongoingWorkOrderRegister.length, setOngoingJoPage)}
                      </div>

                      {/* Table 2: Not yet Started Job Orders */}
                      <div className="border border-solid border-(--border-main) rounded-xl p-4 bg-(--bg-surface) space-y-3 shadow-xs">
                        <div className="flex items-center justify-between border-b border-(--border-main) pb-3">
                          <div className="flex items-center gap-2">
                            <PlayCircle className="w-4 h-4 text-amber-500" />
                            <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                              Not yet Started Job Orders ({notYetStartedRegister.length} Job Orders)
                            </h3>
                          </div>
                        </div>

                        <div className="overflow-x-auto border border-solid border-(--border-main) rounded-lg">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-(--border-main) text-(--text-muted) text-[10px] uppercase bg-(--bg-elevated) sticky top-0 z-10">
                                <th className="p-2.5">Job Order No</th>
                                <th className="p-2.5">Plate No</th>
                                <th className="p-2.5">Priority</th>
                                <th className="p-2.5">Status</th>
                                <th className="p-2.5">Date Requested</th>
                                <th className="p-2.5">Date Started</th>
                                <th className="p-2.5">Expected Comp.</th>
                                <th className="p-2.5">Date Completed</th>
                                <th className="p-2.5">Supervisor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border-main)">
                              {paginatedNotStartedJo.length === 0 ? (
                                <tr>
                                  <td colSpan={9} className="p-6 text-center text-(--text-muted) italic">
                                    No pending/unstarted job orders found.
                                  </td>
                                </tr>
                              ) : (
                                paginatedNotStartedJo.map((r, idx) => (
                                  <tr key={idx} className="hover:bg-(--accent-subtle) transition-colors">
                                    <td className="p-2.5 font-mono font-bold text-(--text-primary)">{r.job_order_no}</td>
                                    <td className="p-2.5 font-semibold text-(--text-primary)">{r.plate_no}</td>
                                    <td className="p-2.5">{r.priority_level}</td>
                                    <td className="p-2.5">{r.current_status}</td>
                                    <td className="p-2.5 font-mono text-(--text-secondary)">{r.date_requested}</td>
                                    <td className="p-2.5 font-mono text-amber-600 dark:text-amber-400 font-semibold">{r.date_started || '—'}</td>
                                    <td className="p-2.5 font-mono text-(--text-secondary)">{r.expected_completion || '—'}</td>
                                    <td className="p-2.5 font-mono text-(--text-secondary)">{r.date_completed || '—'}</td>
                                    <td className="p-2.5 text-(--text-secondary)">{r.assigned_supervisor}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        {renderPagination(notStartedJoPage, notYetStartedRegister.length, setNotStartedJoPage)}
                      </div>
                    </div>
                  )}

                  {/* SUB-VIEW 2: DELAYS & OVERDUE */}
                  {joSubTab === 'delays' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJoDelayKpi(selectedJoDelayKpi === 'total-delayed' ? null : 'total-delayed');
                            setJoDelayKpiInspectPage(1);
                          }}
                          className={`w-full p-4 bg-red-500/10 border border-solid rounded-xl space-y-1 shadow-xs text-left transition-all cursor-pointer ${
                            selectedJoDelayKpi === 'total-delayed'
                              ? 'border-red-500 ring-2 ring-red-500/40'
                              : 'border-red-500/30 hover:border-red-500'
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">Total Delayed Job Orders</div>
                          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400">{delayedSummary.total_delayed_job_orders}</div>
                          <div className="text-[10px] text-red-600/80 dark:text-red-400/80">Click to inspect</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJoDelayKpi(selectedJoDelayKpi === 'max-delay' ? null : 'max-delay');
                            setJoDelayKpiInspectPage(1);
                          }}
                          className={`w-full p-4 bg-red-500/10 border border-solid rounded-xl space-y-1 shadow-xs text-left transition-all cursor-pointer ${
                            selectedJoDelayKpi === 'max-delay'
                              ? 'border-red-500 ring-2 ring-red-500/40'
                              : 'border-red-500/30 hover:border-red-500'
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">Max Delay Duration</div>
                          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400">{delayedSummary.max_days_delayed} Days</div>
                          <div className="text-[10px] text-red-600/80 dark:text-red-400/80">Click to inspect</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJoDelayKpi(selectedJoDelayKpi === 'avg-delay' ? null : 'avg-delay');
                            setJoDelayKpiInspectPage(1);
                          }}
                          className={`w-full p-4 bg-amber-500/10 border border-solid rounded-xl space-y-1 shadow-xs text-left transition-all cursor-pointer ${
                            selectedJoDelayKpi === 'avg-delay'
                              ? 'border-amber-500 ring-2 ring-amber-500/40'
                              : 'border-amber-500/30 hover:border-amber-500'
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Average Delay</div>
                          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{delayedSummary.avg_days_delayed} Days</div>
                          <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80">Click to inspect</div>
                        </button>
                      </div>

                      {/* Clicked JO Delay KPI Inspector */}
                      {selectedJoDelayKpi && (
                        <div className="p-3.5 bg-(--bg-surface) border-2 border-solid border-red-500/40 rounded-xl space-y-3 shadow-xs animate-fadeIn">
                          <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase text-red-600 dark:text-red-400">
                              <Sparkles className="w-4 h-4" />
                              <span>
                                Inspecting KPI: {joDelayKpiLabels[selectedJoDelayKpi]} ({joDelayKpiInspectItems.length} Job Orders)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedJoDelayKpi(null)}
                              className="text-xs font-semibold text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
                            >
                              Close Inspector
                            </button>
                          </div>

                          <div className="overflow-x-auto border border-solid border-(--border-main) rounded-lg bg-(--bg-elevated)">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-(--bg-surface) text-[10px] text-(--text-muted) uppercase border-b border-(--border-main)">
                                <tr>
                                  <th className="p-2.5">Job Order No</th>
                                  <th className="p-2.5">Plate No</th>
                                  <th className="p-2.5">Priority</th>
                                  <th className="p-2.5">Status</th>
                                  <th className="p-2.5">Date Requested</th>
                                  <th className="p-2.5">Target Completion</th>
                                  <th className="p-2.5">Days Delayed</th>
                                  <th className="p-2.5">Supervisor</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-(--border-main)">
                                {paginatedJoDelayKpiItems.length === 0 ? (
                                  <tr>
                                    <td colSpan={8} className="p-4 text-center text-(--text-muted) italic">
                                      No overdue job orders found for this metric.
                                    </td>
                                  </tr>
                                ) : (
                                  paginatedJoDelayKpiItems.map((r, idx) => (
                                    <tr key={idx} className="hover:bg-red-500/10">
                                      <td className="p-2.5 font-mono font-bold text-(--text-primary)">{r.job_order_no}</td>
                                      <td className="p-2.5 font-semibold text-(--text-primary)">{r.plate_no}</td>
                                      <td className="p-2.5 font-semibold text-amber-600 dark:text-amber-400">{r.priority_level}</td>
                                      <td className="p-2.5">{r.current_status}</td>
                                      <td className="p-2.5 font-mono text-(--text-secondary)">{r.date_requested}</td>
                                      <td className="p-2.5 font-mono text-red-600 dark:text-red-400 font-bold">{r.expected_completion}</td>
                                      <td className="p-2.5 font-mono font-extrabold text-red-600 dark:text-red-400">+{r.days_delayed} Days</td>
                                      <td className="p-2.5 text-(--text-secondary)">{r.assigned_supervisor}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                          {renderPagination(joDelayKpiInspectPage, joDelayKpiInspectItems.length, setJoDelayKpiInspectPage)}
                        </div>
                      )}

                      <div className="border border-solid border-(--border-main) rounded-xl p-4 bg-(--bg-surface) space-y-3 shadow-xs">
                        <div className="flex items-center justify-between border-b border-(--border-main) pb-3">
                          <div className="flex items-center gap-2">
                            <AlertOctagon className="w-4 h-4 text-red-500" />
                            <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                              Overdue Job Orders Queue ({overdueQueue.length} Overdue Orders)
                            </h3>
                          </div>
                        </div>

                        <div className="overflow-x-auto border border-solid border-(--border-main) rounded-lg">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-(--border-main) text-(--text-muted) text-[10px] uppercase bg-(--bg-elevated) sticky top-0 z-10">
                                <th className="p-2.5">Job Order No</th>
                                <th className="p-2.5">Plate No</th>
                                <th className="p-2.5">Priority</th>
                                <th className="p-2.5">Status</th>
                                <th className="p-2.5">Date Requested</th>
                                <th className="p-2.5">Target Completion</th>
                                <th className="p-2.5">Days Delayed</th>
                                <th className="p-2.5">Supervisor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border-main)">
                              {paginatedOverdueJo.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="p-6 text-center text-(--text-muted) italic">
                                    No overdue job orders recorded for this evaluation date.
                                  </td>
                                </tr>
                              ) : (
                                paginatedOverdueJo.map((r, idx) => (
                                  <tr key={idx} className="hover:bg-red-500/10 transition-colors">
                                    <td className="p-2.5 font-mono font-bold text-(--text-primary)">{r.job_order_no}</td>
                                    <td className="p-2.5 font-semibold text-(--text-primary)">{r.plate_no}</td>
                                    <td className="p-2.5 font-semibold text-amber-600 dark:text-amber-400">{r.priority_level}</td>
                                    <td className="p-2.5">{r.current_status}</td>
                                    <td className="p-2.5 font-mono text-(--text-secondary)">{r.date_requested}</td>
                                    <td className="p-2.5 font-mono text-red-600 dark:text-red-400 font-bold">{r.expected_completion}</td>
                                    <td className="p-2.5 font-mono font-extrabold text-red-600 dark:text-red-400">+{r.days_delayed} Days</td>
                                    <td className="p-2.5 text-(--text-secondary)">{r.assigned_supervisor}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        {renderPagination(overdueJoPage, overdueQueue.length, setOverdueJoPage)}
                      </div>
                    </div>
                  )}

                  {/* SUB-VIEW 3: KANBAN BOARD */}
                  {joSubTab === 'kanban' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-(--text-muted) px-1">
                        <span>Click any job order card to inspect full details, schedule dates, and cost breakdown.</span>
                        <span>Active Orders: <strong className="text-(--text-primary)">{allActiveWorkOrders.length}</strong></span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-start">
                        {/* Column 1: Queued */}
                        <div className="bg-(--bg-surface) border border-solid border-(--border-main) rounded-xl p-3 space-y-2.5 shadow-xs">
                          <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-500" />
                              <h3 className="text-xs font-bold uppercase text-(--text-primary)">Queued</h3>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-(--bg-elevated) border border-solid border-(--border-main) text-(--text-primary)">
                              {kanbanColumns.queued.length}
                            </span>
                          </div>
                          <div className="space-y-2 max-h-112 overflow-y-auto pr-0.5">
                            {kanbanColumns.queued.length === 0 ? (
                              <div className="text-center py-8 text-xs text-(--text-muted) italic border border-dashed border-(--border-main) rounded-lg">
                                No queued job orders
                              </div>
                            ) : (
                              kanbanColumns.queued.map((jo) => renderKanbanCard(jo, 'queued'))
                            )}
                          </div>
                        </div>

                        {/* Column 2: On-Hold */}
                        <div className="bg-(--bg-surface) border border-solid border-amber-500/30 rounded-xl p-3 space-y-2.5 shadow-xs">
                          <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                            <div className="flex items-center gap-2">
                              <PauseCircle className="w-4 h-4 text-amber-500" />
                              <h3 className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">On-Hold</h3>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-solid border-amber-500/30 text-amber-600 dark:text-amber-400">
                              {kanbanColumns.onHold.length}
                            </span>
                          </div>
                          <div className="space-y-2 max-h-112 overflow-y-auto pr-0.5">
                            {kanbanColumns.onHold.length === 0 ? (
                              <div className="text-center py-8 text-xs text-(--text-muted) italic border border-dashed border-(--border-main) rounded-lg">
                                No job orders on-hold
                              </div>
                            ) : (
                              kanbanColumns.onHold.map((jo) => renderKanbanCard(jo, 'on-hold'))
                            )}
                          </div>
                        </div>

                        {/* Column 3: In-Progress */}
                        <div className="bg-(--bg-surface) border border-solid border-blue-500/30 rounded-xl p-3 space-y-2.5 shadow-xs">
                          <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-blue-500" />
                              <h3 className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">In-Progress</h3>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 border border-solid border-blue-500/30 text-blue-600 dark:text-blue-400">
                              {kanbanColumns.inProgress.length}
                            </span>
                          </div>
                          <div className="space-y-2 max-h-112 overflow-y-auto pr-0.5">
                            {kanbanColumns.inProgress.length === 0 ? (
                              <div className="text-center py-8 text-xs text-(--text-muted) italic border border-dashed border-(--border-main) rounded-lg">
                                No in-progress job orders
                              </div>
                            ) : (
                              kanbanColumns.inProgress.map((jo) => renderKanbanCard(jo, 'in-progress'))
                            )}
                          </div>
                        </div>

                        {/* Column 4: Delayed */}
                        <div className="bg-(--bg-surface) border border-solid border-red-500/30 rounded-xl p-3 space-y-2.5 shadow-xs">
                          <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                            <div className="flex items-center gap-2">
                              <AlertOctagon className="w-4 h-4 text-red-500" />
                              <h3 className="text-xs font-bold uppercase text-red-600 dark:text-red-400">Delayed</h3>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 border border-solid border-red-500/30 text-red-600 dark:text-red-400">
                              {kanbanColumns.delayed.length}
                            </span>
                          </div>
                          <div className="space-y-2 max-h-112 overflow-y-auto pr-0.5">
                            {kanbanColumns.delayed.length === 0 ? (
                              <div className="text-center py-8 text-xs text-(--text-muted) italic border border-dashed border-(--border-main) rounded-lg">
                                No delayed job orders
                              </div>
                            ) : (
                              kanbanColumns.delayed.map((jo) => renderKanbanCard(jo, 'delayed'))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Kanban Job Order Detail Modal */}
      {selectedKanbanJo && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedKanbanJo(null)}
        >
          <div
            className="w-full max-w-lg bg-(--bg-elevated) border border-solid border-(--border-main) rounded-2xl shadow-2xl overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-(--border-main) bg-(--bg-surface)">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold font-mono text-(--text-primary)">
                      {selectedKanbanJo.record.job_order_no}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border border-solid ${
                        kanbanLaneLabels[selectedKanbanJo.lane].badgeClass
                      }`}
                    >
                      {kanbanLaneLabels[selectedKanbanJo.lane].title}
                    </span>
                  </div>
                  <p className="text-xs text-(--text-muted)">
                    Vehicle Plate: <strong className="text-(--text-primary)">{selectedKanbanJo.record.plate_no}</strong> • ODO:{' '}
                    <span className="font-mono">{selectedKanbanJo.record.odo_rdg.toLocaleString()}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedKanbanJo(null)}
                className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle) cursor-pointer"
                aria-label="Close job order details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 text-xs">
              {selectedKanbanJo.lane === 'delayed' && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-solid border-red-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
                    <AlertOctagon className="w-4 h-4 shrink-0" />
                    <span>Schedule Overdue</span>
                  </div>
                  <span className="font-mono font-extrabold text-sm text-red-600 dark:text-red-400">
                    +{selectedKanbanJo.record.days_delayed} {selectedKanbanJo.record.days_delayed === 1 ? 'Day' : 'Days'} Delayed
                  </span>
                </div>
              )}

              {/* Status & Personnel */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-(--bg-surface) border border-solid border-(--border-main) space-y-1">
                  <div className="text-[10px] font-bold uppercase text-(--text-muted)">Priority & DB Status</div>
                  <div className="flex items-center gap-2 pt-0.5">
                    {renderPriorityBadge(selectedKanbanJo.record.priority_level)}
                    <span className="font-semibold text-(--text-primary)">{selectedKanbanJo.record.current_status}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-(--bg-surface) border border-solid border-(--border-main) space-y-1">
                  <div className="text-[10px] font-bold uppercase text-(--text-muted) flex items-center gap-1">
                    <User className="w-3 h-3" /> Assigned Supervisor
                  </div>
                  <div className="font-bold text-(--text-primary) pt-0.5">
                    {selectedKanbanJo.record.assigned_supervisor}
                  </div>
                </div>
              </div>

              {/* Timeline Dates */}
              <div className="p-3 rounded-xl bg-(--bg-surface) border border-solid border-(--border-main) space-y-2">
                <div className="text-[10px] font-bold uppercase text-(--text-muted) flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Schedule Timeline
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <div className="text-[10px] text-(--text-muted)">Requested</div>
                    <div className="font-mono font-semibold text-(--text-primary)">
                      {selectedKanbanJo.record.date_requested}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-(--text-muted)">Date Started</div>
                    <div className="font-mono font-semibold text-(--text-primary)">
                      {selectedKanbanJo.record.date_started || 'Not Started'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-(--text-muted)">Expected Comp.</div>
                    <div
                      className={`font-mono font-bold ${
                        selectedKanbanJo.lane === 'delayed' ? 'text-red-600 dark:text-red-400' : 'text-(--text-primary)'
                      }`}
                    >
                      {selectedKanbanJo.record.expected_completion || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-(--text-muted)">Date Completed</div>
                    <div className="font-mono font-semibold text-(--text-primary)">
                      {selectedKanbanJo.record.date_completed || 'Open'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Requestor & Approver */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-(--bg-surface) border border-solid border-(--border-main)">
                  <div className="text-[10px] font-bold uppercase text-(--text-muted)">Requestor</div>
                  <div className="font-semibold text-(--text-primary) mt-0.5">{selectedKanbanJo.record.requestor}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-(--bg-surface) border border-solid border-(--border-main)">
                  <div className="text-[10px] font-bold uppercase text-(--text-muted)">Approver</div>
                  <div className="font-semibold text-(--text-primary) mt-0.5">{selectedKanbanJo.record.approver}</div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="p-3 rounded-xl bg-(--bg-surface) border border-solid border-(--border-main) space-y-2">
                <div className="text-[10px] font-bold uppercase text-(--text-muted) flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Cost Summary
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
                  <div>
                    <div className="text-[10px] font-sans text-(--text-muted)">Labor</div>
                    <div className="font-semibold text-(--text-primary)">
                      {selectedKanbanJo.record.labor_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-sans text-(--text-muted)">Materials</div>
                    <div className="font-semibold text-(--text-primary)">
                      {selectedKanbanJo.record.materials_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-sans text-(--text-muted)">Contract</div>
                    <div className="font-semibold text-(--text-primary)">
                      {selectedKanbanJo.record.contract_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-sans text-(--text-muted)">Total Cost</div>
                    <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {selectedKanbanJo.record.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-4 py-3 border-t border-(--border-main) bg-(--bg-surface)">
              <button
                type="button"
                onClick={() => setSelectedKanbanJo(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) cursor-pointer transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;