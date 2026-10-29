import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  LayoutDashboard, 
  Clock, 
  Car,
  Loader2,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Printer,
  RefreshCw,
  Calendar,
  ClipboardList,
  AlertOctagon,
  Wrench,
  XCircle,
  PauseCircle,
  Activity
} from 'lucide-react';

/* --- Interfaces --- */
interface OverviewSummary {
  past_due_count: number;
  currently_due_count: number;
  due_to_threshold_count: number;
  grand_total_pms: number;
  total_vehicles_affected: number;
}

interface PmCodeSummary {
  pm_code: string;
  past_due_count: number;
  currently_due_count: number;
  due_to_threshold_count: number;
  total_pm_count: number;
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
  inspected_missing_status_count: number;
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

interface JobOrderVolumeSummary {
  job_order_date: string;
  total_job_orders_created: number;
  unique_vehicles_serviced: number;
  completed_count: number;
  open_count: number;
  completion_rate_percentage: number;
}

interface WorkOrderRegisterRecord {
  job_order_date: string;
  job_order_no: string;
  plate_no: string;
  priority_level: string;
  current_status: string;
  date_started: string | null;
  expected_completion: string | null;
  date_completed: string | null;
  assigned_supervisor: string;
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
  expected_completion: string;
  date_started: string | null;
  days_delayed: number;
  assigned_supervisor: string;
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    | 'todays-priorities'
    | 'inspection-compliance'
    | 'job-order-priorities'
  >('todays-priorities');

  const [joSubTab, setJoSubTab] = useState<
    'volume' | 'delays'
  >('volume');

  const [loading, setLoading] = useState<boolean>(true);
  const [dateLoading, setDateLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedInspectionDate, setSelectedInspectionDate] = useState<string>('2026-10-29');

  // Overview / PM Priority state
  const [overviewSummary, setOverviewSummary] = useState<OverviewSummary>({
    past_due_count: 0,
    currently_due_count: 0,
    due_to_threshold_count: 0,
    grand_total_pms: 0,
    total_vehicles_affected: 0,
  });
  const [pmCodeSummaries, setPmCodeSummaries] = useState<PmCodeSummary[]>([]);
  const [flaggedVehicles, setFlaggedVehicles] = useState<FlaggedVehiclePm[]>([]);
  const [selectedPmFilter, setSelectedPmFilter] = useState<string>('ALL');

  // Inspection Compliance State
  const [complianceSummary, setComplianceSummary] = useState<InspectionComplianceSummary>({
    inspection_date: '2026-10-29',
    total_active_vehicles: 0,
    inspected_count: 0,
    uninspected_count: 0,
    inspected_missing_status_count: 0,
    operational_count: 0,
    standby_count: 0,
    breakdown_count: 0,
    inspection_results_summary: 'None',
    inspection_compliance_percentage: 0,
  });
  const [uninspectedVehicles, setUninspectedVehicles] = useState<UninspectedVehicle[]>([]);

  // Job Order Priorities State
  const [volumeSummary, setVolumeSummary] = useState<JobOrderVolumeSummary>({
    job_order_date: '2026-10-29',
    total_job_orders_created: 0,
    unique_vehicles_serviced: 0,
    completed_count: 0,
    open_count: 0,
    completion_rate_percentage: 0
  });
  const [workOrderRegister, setWorkOrderRegister] = useState<WorkOrderRegisterRecord[]>([]);

  const [delayedSummary, setDelayedSummary] = useState<DelayedSummaryMetrics>({
    evaluation_date: '2026-10-29',
    total_delayed_job_orders: 0,
    max_days_delayed: 0,
    avg_days_delayed: 0
  });
  const [overdueQueue, setOverdueQueue] = useState<OverdueJobOrderRecord[]>([]);

  const fetchGeneralDashboardData = useCallback(async () => {
    try {
      setErrorMsg(null);

      const [summaryRes, codeSummaryRes, itemizedRes] = await Promise.all([
        supabase.from('vw_pm_fleet_summary_metrics').select('*').single(),
        supabase.from('vw_pm_code_breakdown_summary').select('*'),
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

      if (codeSummaryRes.data) {
        setPmCodeSummaries(codeSummaryRes.data.map(c => ({
          pm_code: String(c.pm_code),
          past_due_count: Number(c.past_due_count || 0),
          currently_due_count: Number(c.currently_due_count || 0),
          due_to_threshold_count: Number(c.due_to_threshold_count || 0),
          total_pm_count: Number(c.total_pm_count || 0)
        })));
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
      let inspectedMissingStatusCount = 0;
      let operationalCount = 0;
      let standbyCount = 0;
      let breakdownCount = 0;

      const uninspectedList: UninspectedVehicle[] = [];
      const statusTotalsMap: Record<string, number> = {};

      (activeVehiclesData || []).forEach(v => {
        const vehId = String(v.vehicle_id);
        const logEntry = logByVehicleMap.get(vehId);

        let statusName = 'Uninspected';

        if (logEntry) {
          inspectedCount++;
          if (!logEntry.operations_id || !logEntry.matched_operations_id) {
            inspectedMissingStatusCount++;
            statusName = 'No Status Assigned';
          } else {
            statusName = logEntry.status_name;
          }
        } else {
          uninspectedCount++;
          uninspectedList.push({
            vehicle_id: vehId,
            plate_no: String(v.plate_no || 'N/A'),
            service_rdg: Number(v.service_rdg || 0)
          });
        }

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

      setComplianceSummary({
        inspection_date: targetDate,
        total_active_vehicles: totalActive,
        inspected_count: inspectedCount,
        uninspected_count: uninspectedCount,
        inspected_missing_status_count: inspectedMissingStatusCount,
        operational_count: operationalCount,
        standby_count: standbyCount,
        breakdown_count: breakdownCount,
        inspection_results_summary: dynamicSummary,
        inspection_compliance_percentage: compliancePct
      });

      setUninspectedVehicles(uninspectedList);
    } catch (err: unknown) {
      console.error('Error fetching inspection compliance data for date:', err);
    } finally {
      setDateLoading(false);
    }
  }, []);

  const fetchJobOrderPrioritiesData = useCallback(async (requestedDate: string) => {
    try {
      setDateLoading(true);

      const startOfDay = `${requestedDate}T00:00:00.000Z`;
      const endOfDay = `${requestedDate}T23:59:59.999Z`;

      const { data: rawRecords, error: joErr } = await supabase
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
          joborder_priority ( priority_id, priority_desc ),
          joborder_status ( status_id, status_name ),
          employees ( employee_name ),
          vehicles ( vehicle_id, plate_no, is_active )
        `)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: false });

      if (joErr) throw joErr;

      const targetDateRecords = (rawRecords || []).filter(j => {
        const rawVeh = j.vehicles as Record<string, unknown> | Record<string, unknown>[] | null;
        const veh = Array.isArray(rawVeh) ? rawVeh[0] : rawVeh;
        return veh === null || veh.is_active === true || veh.is_active === undefined || veh.is_active === null;
      });

      const totalCreated = targetDateRecords.length;
      const uniqueVehicles = new Set(targetDateRecords.map(j => j.vehicle_id)).size;
      const completedCount = targetDateRecords.filter(j => j.date_completed !== null).length;
      const openCount = targetDateRecords.filter(j => j.date_completed === null).length;
      const completionRate = totalCreated > 0 ? Number(((completedCount / totalCreated) * 100).toFixed(2)) : 0;

      setVolumeSummary({
        job_order_date: requestedDate,
        total_job_orders_created: totalCreated,
        unique_vehicles_serviced: uniqueVehicles,
        completed_count: completedCount,
        open_count: openCount,
        completion_rate_percentage: completionRate
      });

      const registerList: WorkOrderRegisterRecord[] = targetDateRecords.map(j => {
        const rawPrio = j.joborder_priority as Record<string, unknown> | Record<string, unknown>[] | null;
        const prio = Array.isArray(rawPrio) ? rawPrio[0] : rawPrio;

        const rawStat = j.joborder_status as Record<string, unknown> | Record<string, unknown>[] | null;
        const stat = Array.isArray(rawStat) ? rawStat[0] : rawStat;

        const rawEmp = j.employees as Record<string, unknown> | Record<string, unknown>[] | null;
        const emp = Array.isArray(rawEmp) ? rawEmp[0] : rawEmp;

        const rawVeh = j.vehicles as Record<string, unknown> | Record<string, unknown>[] | null;
        const veh = Array.isArray(rawVeh) ? rawVeh[0] : rawVeh;

        return {
          job_order_date: requestedDate,
          job_order_no: String(j.job_order_no || `JO-${j.job_order_id}`),
          plate_no: String(veh?.plate_no || 'N/A'),
          priority_level: String(prio?.priority_desc || 'Unassigned'),
          current_status: String(stat?.status_name || 'Open'),
          date_started: j.date_started ? String(j.date_started).substring(0, 10) : null,
          expected_completion: j.expected_completion ? String(j.expected_completion).substring(0, 10) : null,
          date_completed: j.date_completed ? String(j.date_completed).substring(0, 10) : null,
          assigned_supervisor: String(emp?.employee_name || 'Unassigned')
        };
      });

      setWorkOrderRegister(registerList);

      const { data: allMaster } = await supabase
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
          joborder_priority ( priority_id, priority_desc ),
          joborder_status ( status_id, status_name ),
          employees ( employee_name ),
          vehicles ( vehicle_id, plate_no, is_active )
        `);

      const masterList = (allMaster || []).filter(j => {
        const rawVeh = j.vehicles as Record<string, unknown> | Record<string, unknown>[] | null;
        const veh = Array.isArray(rawVeh) ? rawVeh[0] : rawVeh;
        return veh === null || veh.is_active === true || veh.is_active === undefined || veh.is_active === null;
      });

      const requestedDateObj = new Date(requestedDate);

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
          const expCompDate = new Date(expCompDateStr);
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

  const filteredItemizedPms = flaggedVehicles.filter(item => {
    if (selectedPmFilter === 'ALL') return true;
    return item.pm_code === selectedPmFilter;
  });

  const maxPmCount = Math.max(...pmCodeSummaries.map(p => p.total_pm_count), 1);

  const handleExportHtml = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleString();
    const pastDueCount = filteredItemizedPms.filter(i => i.pm_status === 'PAST DUE').length;
    const currentlyDueCount = filteredItemizedPms.filter(i => i.pm_status === 'CURRENTLY DUE').length;
    const dueToThreshCount = filteredItemizedPms.filter(i => i.pm_status === 'DUE TO THRESHOLD').length;

    const rowsHtml = filteredItemizedPms.map((item, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 10px 12px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${item.plate_no}</td>
        <td style="padding: 10px 12px; font-family: monospace; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${item.pm_code}</td>
        <td style="padding: 10px 12px; font-family: monospace; text-align: right; color: #334155; border-bottom: 1px solid #e2e8f0;">${item.current_rdg.toLocaleString()}</td>
        <td style="padding: 10px 12px; font-family: monospace; text-align: right; color: #2563eb; border-bottom: 1px solid #e2e8f0;">${item.trigger_rdg.toLocaleString()}</td>
        <td style="padding: 10px 12px; font-family: monospace; text-align: right; font-weight: 600; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${item.pm_current.toLocaleString()}</td>
        <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          <span style="
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 10px; 
            font-weight: 700; 
            letter-spacing: 0.05em;
            display: inline-block;
            ${item.pm_status === 'PAST DUE' ? 'background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5;' : ''}
            ${item.pm_status === 'CURRENTLY DUE' ? 'background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a;' : ''}
            ${item.pm_status === 'DUE TO THRESHOLD' ? 'background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;' : ''}
          ">
            ${item.pm_status}
          </span>
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>RC-MRO - Flagged PM Queue Report</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 24px; background-color: #ffffff; }
          .header-container { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
          .brand-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
          .brand-subtitle { font-size: 12px; color: #64748b; margin: 0; text-transform: uppercase; font-weight: 600; }
          .meta-box { text-align: right; font-size: 11px; color: #475569; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
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
            <p class="brand-subtitle">Itemized Flagged PM Queue Report</p>
          </div>
          <div class="meta-box">
            <div><strong>Generated:</strong> ${dateStr}</div>
            <div><strong>Filter:</strong> ${selectedPmFilter === 'ALL' ? 'All PM Codes' : selectedPmFilter}</div>
          </div>
        </div>
        <div class="summary-grid">
          <div class="summary-card"><div class="summary-card-title">Total Items</div><div class="summary-card-value">${filteredItemizedPms.length}</div></div>
          <div class="summary-card" style="border-color: #fca5a5; background-color: #fef2f2;"><div class="summary-card-title" style="color: #b91c1c;">Past Due</div><div class="summary-card-value" style="color: #b91c1c;">${pastDueCount}</div></div>
          <div class="summary-card" style="border-color: #fde68a; background-color: #fffbeb;"><div class="summary-card-title" style="color: #b45309;">Currently Due</div><div class="summary-card-value" style="color: #b45309;">${currentlyDueCount}</div></div>
          <div class="summary-card" style="border-color: #bfdbfe; background-color: #eff6ff;"><div class="summary-card-title" style="color: #1d4ed8;">Due To Threshold</div><div class="summary-card-value" style="color: #1d4ed8;">${dueToThreshCount}</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Plate No</th>
              <th>PM Code</th>
              <th class="text-right">Current Rdg</th>
              <th class="text-right">Trigger Rdg</th>
              <th class="text-right">Target Rdg</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
    let tableHeadersHtml: string;
    let tableRowsHtml: string;

    if (joSubTab === 'volume') {
      title = 'Daily Job Order Creation Volume & Register Report';
      summaryCardsHtml = `
        <div class="summary-card"><div class="summary-card-title">Total Created</div><div class="summary-card-value">${volumeSummary.total_job_orders_created}</div></div>
        <div class="summary-card"><div class="summary-card-title">Unique Vehicles</div><div class="summary-card-value">${volumeSummary.unique_vehicles_serviced}</div></div>
        <div class="summary-card" style="border-color: #a7f3d0; background-color: #ecfdf5;"><div class="summary-card-title" style="color: #047857;">Completed</div><div class="summary-card-value" style="color: #047857;">${volumeSummary.completed_count}</div></div>
        <div class="summary-card" style="border-color: #fde68a; background-color: #fffbeb;"><div class="summary-card-title" style="color: #b45309;">Open Orders</div><div class="summary-card-value" style="color: #b45309;">${volumeSummary.open_count}</div></div>
        <div class="summary-card" style="border-color: #bfdbfe; background-color: #eff6ff;"><div class="summary-card-title" style="color: #1d4ed8;">Completion Rate</div><div class="summary-card-value" style="color: #1d4ed8;">${volumeSummary.completion_rate_percentage}%</div></div>
      `;
      tableHeadersHtml = `
        <tr>
          <th>JO Number</th>
          <th>Plate No</th>
          <th>Priority Level</th>
          <th>Current Status</th>
          <th>Date Started</th>
          <th>Expected Comp.</th>
          <th>Date Completed</th>
          <th>Supervisor</th>
        </tr>
      `;
      tableRowsHtml = workOrderRegister.length === 0 
        ? `<tr><td colspan="8" style="text-align: center; padding: 12px; color: #64748b;">No job orders created on this date.</td></tr>`
        : workOrderRegister.map((r, idx) => `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 8px 10px; font-weight: 700; font-family: monospace; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${r.job_order_no}</td>
            <td style="padding: 8px 10px; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0;">${r.plate_no}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${r.priority_level}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${r.current_status}</td>
            <td style="padding: 8px 10px; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${r.date_started || '—'}</td>
            <td style="padding: 8px 10px; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${r.expected_completion || '—'}</td>
            <td style="padding: 8px 10px; font-family: monospace; font-weight: 600; color: #047857; border-bottom: 1px solid #e2e8f0;">${r.date_completed || '—'}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${r.assigned_supervisor}</td>
          </tr>
        `).join('');

    } else {
      title = 'Overdue Job Orders & Delay Duration Queue Report';
      summaryCardsHtml = `
        <div class="summary-card" style="border-color: #fca5a5; background-color: #fef2f2;"><div class="summary-card-title" style="color: #b91c1c;">Total Overdue Orders</div><div class="summary-card-value" style="color: #b91c1c;">${delayedSummary.total_delayed_job_orders}</div></div>
        <div class="summary-card" style="border-color: #fca5a5; background-color: #fef2f2;"><div class="summary-card-title" style="color: #b91c1c;">Max Delay Duration</div><div class="summary-card-value" style="color: #b91c1c;">${delayedSummary.max_days_delayed} Days</div></div>
        <div class="summary-card" style="border-color: #fde68a; background-color: #fffbeb;"><div class="summary-card-title" style="color: #b45309;">Average Schedule Variance</div><div class="summary-card-value" style="color: #b45309;">${delayedSummary.avg_days_delayed} Days</div></div>
      `;
      tableHeadersHtml = `
        <tr>
          <th>JO Number</th>
          <th>Plate No</th>
          <th>Priority Level</th>
          <th>Current Status</th>
          <th>Target Completion</th>
          <th>Days Delayed</th>
          <th>Assigned Supervisor</th>
        </tr>
      `;
      tableRowsHtml = overdueQueue.length === 0
        ? `<tr><td colspan="7" style="text-align: center; padding: 12px; color: #64748b;">No overdue job orders recorded.</td></tr>`
        : overdueQueue.map((r, idx) => `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 8px 10px; font-weight: 700; font-family: monospace; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${r.job_order_no}</td>
            <td style="padding: 8px 10px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${r.plate_no}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${r.priority_level}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${r.current_status}</td>
            <td style="padding: 8px 10px; font-family: monospace; font-weight: 700; color: #b91c1c; border-bottom: 1px solid #e2e8f0;">${r.expected_completion}</td>
            <td style="padding: 8px 10px; font-family: monospace; font-weight: 800; color: #b91c1c; border-bottom: 1px solid #e2e8f0;">+${r.days_delayed} Days</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${r.assigned_supervisor}</td>
          </tr>
        `).join('');
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
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
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
        <table>
          <thead>
            ${tableHeadersHtml}
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
          onClick={handleManualRefresh}
          disabled={loading || refreshing || dateLoading}
          className="bg-(--bg-surface) hover:bg-(--accent-subtle) border border-(--border-main) text-(--text-primary) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          title="Refresh dashboard metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
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
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-elevated) border border-(--border-main) rounded-xl p-4 shadow-xl overflow-hidden space-y-3">
        {/* Tab Navigation Header */}
        <div className="flex border-b border-(--border-main) gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('todays-priorities')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'todays-priorities'
                ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
                : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Today's PM Priorities</span>
          </button>

          <button
            onClick={() => setActiveTab('inspection-compliance')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'inspection-compliance'
                ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
                : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-blue-500" />
            <span>Inspection Compliance</span>
          </button>

          <button
            onClick={() => setActiveTab('job-order-priorities')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'job-order-priorities'
                ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
                : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
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
                    <div className="p-3 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-(--text-muted)">Total Flagged PMs</div>
                      <div className="text-xl font-extrabold text-(--text-primary)">{overviewSummary.grand_total_pms}</div>
                      <div className="text-[10px] text-(--text-muted)">Across active fleet</div>
                    </div>

                    <div className="p-3 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-(--text-muted)">Vehicles Affected</div>
                      <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{overviewSummary.total_vehicles_affected}</div>
                      <div className="text-[10px] text-(--text-muted)">Require service attention</div>
                    </div>

                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">Past Due</div>
                      <div className="text-xl font-extrabold text-red-600 dark:text-red-400">{overviewSummary.past_due_count}</div>
                      <div className="text-[10px] text-red-600/80 dark:text-red-400/80">Immediate action needed</div>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Currently Due</div>
                      <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{overviewSummary.currently_due_count}</div>
                      <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80">At exact service target</div>
                    </div>

                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-1 shadow-xs col-span-2 md:col-span-1">
                      <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">Due To Threshold</div>
                      <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{overviewSummary.due_to_threshold_count}</div>
                      <div className="text-[10px] text-blue-600/80 dark:text-blue-400/80">Approaching limit window</div>
                    </div>
                  </div>

                  {/* Breakdown Chart */}
                  <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-500" />
                        <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                          Flagged PM Breakdown by Code (PM2 – PM7)
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {pmCodeSummaries.map((p) => {
                        const pastPct = p.total_pm_count > 0 ? (p.past_due_count / maxPmCount) * 100 : 0;
                        const currPct = p.total_pm_count > 0 ? (p.currently_due_count / maxPmCount) * 100 : 0;
                        const threshPct = p.total_pm_count > 0 ? (p.due_to_threshold_count / maxPmCount) * 100 : 0;

                        return (
                          <div key={p.pm_code} className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-bold text-(--text-primary)">{p.pm_code}</span>
                              <span className="font-mono text-(--text-muted)">
                                {p.total_pm_count} Flagged
                              </span>
                            </div>
                            <div className="w-full bg-(--bg-elevated) h-3.5 rounded-md overflow-hidden flex border border-(--border-main)">
                              {pastPct > 0 && <div style={{ width: `${pastPct}%` }} className="bg-red-500 h-full" title={`Past Due: ${p.past_due_count}`} />}
                              {currPct > 0 && <div style={{ width: `${currPct}%` }} className="bg-amber-500 h-full" title={`Currently Due: ${p.currently_due_count}`} />}
                              {threshPct > 0 && <div style={{ width: `${threshPct}%` }} className="bg-blue-500 h-full" title={`Due to Threshold: ${p.due_to_threshold_count}`} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <div className="border border-(--border-main) rounded-xl p-4 bg-(--bg-surface) space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-main) pb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                          Itemized Flagged PM Queue ({filteredItemizedPms.length} Items)
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <label htmlFor="pm-code-filter-select" className="text-xs text-(--text-secondary) font-medium">Filter PM Code:</label>
                          <select
                            id="pm-code-filter-select"
                            value={selectedPmFilter}
                            onChange={(e) => setSelectedPmFilter(e.target.value)}
                            className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) text-xs rounded-lg px-2.5 py-1 focus:outline-none"
                          >
                            <option value="ALL">All PM Codes</option>
                            <option value="PM2">PM2 Only</option>
                            <option value="PM3">PM3 Only</option>
                            <option value="PM4">PM4 Only</option>
                            <option value="PM5">PM5 Only</option>
                            <option value="PM6">PM6 Only</option>
                            <option value="PM7">PM7 Only</option>
                          </select>
                        </div>

                        <button
                          onClick={handleExportHtml}
                          className="flex items-center gap-1.5 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) text-xs px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Export / Print</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-72 overflow-y-auto border border-(--border-main) rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-(--border-main) text-(--text-muted) text-[10px] uppercase bg-(--bg-elevated) sticky top-0 z-10 shadow-xs">
                            <th className="p-2.5">Plate No</th>
                            <th className="p-2.5">PM Code</th>
                            <th className="p-2.5 text-right">Current Rdg</th>
                            <th className="p-2.5 text-right">Trigger Rdg</th>
                            <th className="p-2.5 text-right">Target Rdg</th>
                            <th className="p-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-main)">
                          {filteredItemizedPms.map((item, idx) => (
                            <tr key={idx} className="hover:bg-(--accent-subtle) transition-colors">
                              <td className="p-2.5 font-bold text-(--text-primary)">{item.plate_no}</td>
                              <td className="p-2.5 font-mono font-semibold">{item.pm_code}</td>
                              <td className="p-2.5 text-right font-mono text-(--text-primary)">{item.current_rdg.toLocaleString()}</td>
                              <td className="p-2.5 text-right font-mono text-blue-600 dark:text-blue-400">{item.trigger_rdg.toLocaleString()}</td>
                              <td className="p-2.5 text-right font-mono font-semibold">{item.pm_current.toLocaleString()}</td>
                              <td className="p-2.5 text-center">
                                {item.pm_status === 'PAST DUE' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
                                    PAST DUE
                                  </span>
                                )}
                                {item.pm_status === 'CURRENTLY DUE' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                    CURRENTLY DUE
                                  </span>
                                )}
                                {item.pm_status === 'DUE TO THRESHOLD' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                    DUE TO THRESHOLD
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INSPECTION COMPLIANCE */}
              {activeTab === 'inspection-compliance' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-(--bg-surface) border border-(--border-main) rounded-xl shadow-xs">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-(--text-primary)">
                        Daily Fleet Inspection Compliance Analytics
                      </h2>
                      <p className="text-[11px] text-(--text-muted)">
                        Monitor active fleet daily inspections, operational statuses, and uninspected vehicle queues for {selectedInspectionDate}.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-(--bg-elevated) border border-(--border-main) px-3 py-1.5 rounded-lg shadow-xs">
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
                        onClick={handleExportComplianceHtml}
                        className="flex items-center gap-1.5 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Export View</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-(--text-muted)">Total Active Fleet</div>
                      <div className="text-xl font-extrabold text-(--text-primary)">{complianceSummary.total_active_vehicles}</div>
                      <div className="text-[10px] text-(--text-muted)">Active fleet units</div>
                    </div>

                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Inspected Units</div>
                      <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{complianceSummary.inspected_count}</div>
                      <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">Logs recorded on {selectedInspectionDate}</div>
                    </div>

                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">Uninspected Units</div>
                      <div className="text-xl font-extrabold text-red-600 dark:text-red-400">{complianceSummary.uninspected_count}</div>
                      <div className="text-[10px] text-red-600/80 dark:text-red-400/80">Missing log entry</div>
                    </div>

                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-1 shadow-xs">
                      <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">Compliance Rate</div>
                      <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{complianceSummary.inspection_compliance_percentage}%</div>
                      <div className="text-[10px] text-blue-600/80 dark:text-blue-400/80">Fleet inspection ratio</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between shadow-xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Operational</div>
                        <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{complianceSummary.operational_count}</div>
                      </div>
                      <Activity className="w-5 h-5 text-emerald-500" />
                    </div>

                    <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between shadow-xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Standby</div>
                        <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{complianceSummary.standby_count}</div>
                      </div>
                      <PauseCircle className="w-5 h-5 text-amber-500" />
                    </div>

                    <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-between shadow-xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">Breakdown</div>
                        <div className="text-lg font-extrabold text-red-600 dark:text-red-400">{complianceSummary.breakdown_count}</div>
                      </div>
                      <Wrench className="w-5 h-5 text-red-500" />
                    </div>

                    <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl flex items-center justify-between shadow-xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400">Missing Status</div>
                        <div className="text-lg font-extrabold text-purple-600 dark:text-purple-400">{complianceSummary.inspected_missing_status_count}</div>
                      </div>
                      <AlertCircle className="w-5 h-5 text-purple-500" />
                    </div>
                  </div>

                  <div className="border border-(--border-main) rounded-xl p-4 bg-(--bg-surface) space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-(--border-main) pb-3">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                          Uninspected Active Fleet Queue ({uninspectedVehicles.length} Vehicles)
                        </h3>
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-72 overflow-y-auto border border-(--border-main) rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-(--border-main) text-(--text-muted) text-[10px] uppercase bg-(--bg-elevated) sticky top-0 z-10 shadow-xs">
                            <th className="p-2.5">Plate No</th>
                            <th className="p-2.5 text-right">Service Rdg</th>
                            <th className="p-2.5 text-center">Inspection Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-main)">
                          {uninspectedVehicles.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="p-6 text-center text-emerald-600 dark:text-emerald-400 font-semibold italic">
                                100% Compliance! All active fleet units have been inspected for {selectedInspectionDate}.
                              </td>
                            </tr>
                          ) : (
                            uninspectedVehicles.map((u, idx) => (
                              <tr key={idx} className="hover:bg-red-500/5 transition-colors">
                                <td className="p-2.5 font-bold text-(--text-primary)">{u.plate_no}</td>
                                <td className="p-2.5 text-right font-mono text-(--text-primary)">{u.service_rdg.toLocaleString()}</td>
                                <td className="p-2.5 text-center">
                                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
                                    UNINSPECTED
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: JOB ORDER PRIORITIES */}
              {activeTab === 'job-order-priorities' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-(--bg-surface) border border-(--border-main) rounded-xl shadow-xs">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-(--text-primary)">
                        Job Order Analytics & Priority Control Center
                      </h2>
                      <p className="text-[11px] text-(--text-muted)">
                        Track work order volume, priority distributions, delays, and completion turnaround efficiency.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-(--bg-elevated) border border-(--border-main) px-3 py-1.5 rounded-lg shadow-xs">
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
                        onClick={handleExportJobOrdersHtml}
                        className="flex items-center gap-1.5 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Export Sub-Tab View</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-b border-(--border-main) pb-2 text-xs font-bold overflow-x-auto">
                    <button
                      onClick={() => setJoSubTab('volume')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        joSubTab === 'volume'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'text-(--text-muted) hover:text-(--text-primary)'
                      }`}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>1. Daily Volume & Register</span>
                    </button>

                    <button
                      onClick={() => setJoSubTab('delays')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        joSubTab === 'delays'
                          ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                          : 'text-(--text-muted) hover:text-(--text-primary)'
                      }`}
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>2. Delays & Overdue</span>
                    </button>
                  </div>

                  {/* SUB-VIEW 1: DAILY VOLUME & REGISTER */}
                  {joSubTab === 'volume' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="p-3 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-1 shadow-xs">
                          <div className="text-[10px] font-bold uppercase text-(--text-muted)">Total Created</div>
                          <div className="text-xl font-extrabold text-(--text-primary)">{volumeSummary.total_job_orders_created}</div>
                          <div className="text-[10px] text-(--text-muted)">Created on {volumeSummary.job_order_date}</div>
                        </div>

                        <div className="p-3 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-1 shadow-xs">
                          <div className="text-[10px] font-bold uppercase text-(--text-muted)">Unique Vehicles</div>
                          <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{volumeSummary.unique_vehicles_serviced}</div>
                          <div className="text-[10px] text-(--text-muted)">Serviced in batch</div>
                        </div>

                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1 shadow-xs">
                          <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Completed</div>
                          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{volumeSummary.completed_count}</div>
                          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">Closed on target date</div>
                        </div>

                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 shadow-xs">
                          <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Open Jobs</div>
                          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{volumeSummary.open_count}</div>
                          <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80">Pending completion</div>
                        </div>

                        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-1 shadow-xs col-span-2 md:col-span-1">
                          <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">Completion Rate</div>
                          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{volumeSummary.completion_rate_percentage}%</div>
                          <div className="text-[10px] text-blue-600/80 dark:text-blue-400/80">Throughput ratio</div>
                        </div>
                      </div>

                      <div className="border border-(--border-main) rounded-xl p-4 bg-(--bg-surface) space-y-3 shadow-xs">
                        <div className="flex items-center justify-between border-b border-(--border-main) pb-3">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                              Daily Work Order Register ({workOrderRegister.length} Job Orders)
                            </h3>
                          </div>
                        </div>

                        <div className="overflow-x-auto max-h-80 overflow-y-auto border border-(--border-main) rounded-lg">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-(--border-main) text-(--text-muted) text-[10px] uppercase bg-(--bg-elevated) sticky top-0 z-10">
                                <th className="p-2.5">Job Order No</th>
                                <th className="p-2.5">Plate No</th>
                                <th className="p-2.5">Priority</th>
                                <th className="p-2.5">Status</th>
                                <th className="p-2.5">Date Started</th>
                                <th className="p-2.5">Expected Comp.</th>
                                <th className="p-2.5">Date Completed</th>
                                <th className="p-2.5">Supervisor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border-main)">
                              {workOrderRegister.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="p-6 text-center text-(--text-muted) italic">
                                    No job orders created on this date.
                                  </td>
                                </tr>
                              ) : (
                                workOrderRegister.map((r, idx) => (
                                  <tr key={idx} className="hover:bg-(--accent-subtle) transition-colors">
                                    <td className="p-2.5 font-mono font-bold text-(--text-primary)">{r.job_order_no}</td>
                                    <td className="p-2.5 font-semibold text-(--text-primary)">{r.plate_no}</td>
                                    <td className="p-2.5">{r.priority_level}</td>
                                    <td className="p-2.5">{r.current_status}</td>
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
                      </div>
                    </div>
                  )}

                  {/* SUB-VIEW 2: DELAYS & OVERDUE */}
                  {joSubTab === 'delays' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1 shadow-xs">
                          <div className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">Total Delayed Job Orders</div>
                          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400">{delayedSummary.total_delayed_job_orders}</div>
                          <div className="text-[10px] text-red-600/80 dark:text-red-400/80">Exceeding expected completion</div>
                        </div>

                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1 shadow-xs">
                          <div className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">Max Delay Duration</div>
                          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400">{delayedSummary.max_days_delayed} Days</div>
                          <div className="text-[10px] text-red-600/80 dark:text-red-400/80">Longest overdue job</div>
                        </div>

                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 shadow-xs">
                          <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Average Delay</div>
                          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{delayedSummary.avg_days_delayed} Days</div>
                          <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80">Mean schedule variance</div>
                        </div>
                      </div>

                      <div className="border border-(--border-main) rounded-xl p-4 bg-(--bg-surface) space-y-3 shadow-xs">
                        <div className="flex items-center justify-between border-b border-(--border-main) pb-3">
                          <div className="flex items-center gap-2">
                            <AlertOctagon className="w-4 h-4 text-red-500" />
                            <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                              Overdue Job Orders Queue ({overdueQueue.length} Overdue Orders)
                            </h3>
                          </div>
                        </div>

                        <div className="overflow-x-auto max-h-80 overflow-y-auto border border-(--border-main) rounded-lg">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-(--border-main) text-(--text-muted) text-[10px] uppercase bg-(--bg-elevated) sticky top-0 z-10">
                                <th className="p-2.5">Job Order No</th>
                                <th className="p-2.5">Plate No</th>
                                <th className="p-2.5">Priority</th>
                                <th className="p-2.5">Status</th>
                                <th className="p-2.5">Target Completion</th>
                                <th className="p-2.5">Days Delayed</th>
                                <th className="p-2.5">Supervisor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border-main)">
                              {overdueQueue.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="p-6 text-center text-(--text-muted) italic">
                                    No overdue job orders recorded for this evaluation date.
                                  </td>
                                </tr>
                              ) : (
                                overdueQueue.map((r, idx) => (
                                  <tr key={idx} className="hover:bg-red-500/10 transition-colors">
                                    <td className="p-2.5 font-mono font-bold text-(--text-primary)">{r.job_order_no}</td>
                                    <td className="p-2.5 font-semibold text-(--text-primary)">{r.plate_no}</td>
                                    <td className="p-2.5 font-semibold text-amber-600 dark:text-amber-400">{r.priority_level}</td>
                                    <td className="p-2.5">{r.current_status}</td>
                                    <td className="p-2.5 font-mono text-red-600 dark:text-red-400 font-bold">{r.expected_completion}</td>
                                    <td className="p-2.5 font-mono font-extrabold text-red-600 dark:text-red-400">+{r.days_delayed} Days</td>
                                    <td className="p-2.5 text-(--text-secondary)">{r.assigned_supervisor}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
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
    </div>
  );
}

export default Dashboard;