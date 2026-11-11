import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {  
  SlidersHorizontal,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Truck,
  TrendingUp,
  Filter,
  Info,
  CheckCircle2,
  Clock,
  Layers,
  Grid,
  Sparkles,
  HelpCircle,
  Flame,
  Activity,
  BarChart3,
  Shield,
  ChevronRight,
  PieChart as PieIcon,
  ArrowLeft,
  Table as TableIcon,
  Calendar
} from 'lucide-react';

/* --- Interfaces --- */

interface FmeaAnalyticsRecord {
  fmea_id: string;
  risk_source: 'Unsafe Act' | 'Work Cause' | 'Unsafe Condition' | 'Personal Factor';
  category_code: string;
  detail_code: string;
  detail_description: string;
  current_control: string | null;
  potential_effect?: string | null;
  severity: number;
  occurrence: number;
  detection: number;
  computed_rpn: number;
  risk_tier: 'Critical' | 'High' | 'Medium' | 'Low';
  control_status: 'Missing Control' | 'Control Documented';
  potential_effect_status: 'Missing Potential Effect' | 'Potential Effect Documented';
  created_at: string;
}

interface OperationalIncidentRiskRecord {
  ref_id: string;
  ref_no: string;
  source: 'IRS' | 'INS';
  event_date: string;
  vehicle_id: string;
  plate_no: string;
  description: string;
  severity_level: string;
  severity_num?: number;
  occurrence_num?: number;
  fmea_id: string | null;
  root_cause_code: string;
  root_cause_desc: string;
  risk_source?: string;
  incident_loss?: number;
}

interface VehicleBadActorRecord {
  vehicle_id: string;
  plate_no: string;
  customer_name: string;
  make_name: string;
  model_name: string;
  total_maintenance_cost: number;
  bad_actor_score: number;
  risk_tier: string;
  incident_loss: number;
  incident_count: number;
  total_financial_impact: number;
}

interface ComponentReliabilityRecord {
  equipment_component_id: string;
  equipment_component_code: string;
  equipment_component_desc: string;
  system_code: string;
  system_desc: string;
  total_replacements: number;
  avg_service_run: number;
  cumulative_component_cost: number;
  installed_status: boolean;
}

interface JobOrderFlatRecord {
  job_order_id: string;
  vehicle_id: string | null;
  created_at: string | null;
  date_completed: string | null;
  total_cost: number | null;
  labor_cost: number | null;
  materials_cost: number | null;
  contract_cost: number | null;
  plate_no: string | null;
  model_name: string | null;
  make_name: string | null;
}

interface IncidentReportFlatRecord {
  vehicle_id: string;
  incident_date: string;
  incident_loss: number;
}

type MainTab = 'risk' | 'reliability';
type RiskSubTab = 'exec_fmea' | 'op_incidents' | 'rca_breakdown';
type ReliabilitySubTab = 'bad_actors' | 'reliability';

/* Helper utility for Date Range checking */
function isWithinDateRange(dateString?: string | null, dateFrom?: string, dateTo?: string): boolean {
  if (!dateString) return true;
  
  let targetDate: Date;
  if (/^\d{4}-\d{2}$/.test(dateString)) {
    targetDate = new Date(`${dateString}-01T00:00:00`);
  } else {
    targetDate = new Date(dateString);
  }

  if (isNaN(targetDate.getTime())) return true;
  
  if (dateFrom) {
    const fromDate = new Date(`${dateFrom}T00:00:00`);
    if (!isNaN(fromDate.getTime()) && targetDate < fromDate) {
      return false;
    }
  }
  
  if (dateTo) {
    const toDate = new Date(`${dateTo}T23:59:59.999`);
    if (!isNaN(toDate.getTime()) && targetDate > toDate) {
      return false;
    }
  }
  
  return true;
}

/* Helper utility to map textual incident severity level to numeric scale 1-10 */
function mapSeverityToNumber(level?: string): number {
  const normalized = level?.toLowerCase().trim();
  switch (normalized) {
    case 'critical': return 10;
    case 'high': return 8;
    case 'medium': return 5;
    case 'low/moderate':
    case 'low': return 2;
    default: return 5;
  }
}

export function FMEADashboard() {
  // Main Tab & Sub-Tab State
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('risk');
  const [riskSubTab, setRiskSubTab] = useState<RiskSubTab>('exec_fmea');
  const [reliabilitySubTab, setReliabilitySubTab] = useState<ReliabilitySubTab>('bad_actors');

  // Interactive Graph Filter & Drilldown State for 3rd Sub-Tab
  const [rcaSourceFilter, setRcaSourceFilter] = useState<'ALL' | 'IRS' | 'INS'>('ALL');
  const [selectedPillarDrilldown, setSelectedPillarDrilldown] = useState<string | null>(null);
  
  // Selected Month Filters (YYYY-MM format)
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [selectedBadActorMonthKey, setSelectedBadActorMonthKey] = useState<string | null>(null);

  // Date Filters (Default aligned to start of month for 90-day window)
  const defaultEndDate = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  const defaultStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    const alignedDate = new Date(d.getFullYear(), d.getMonth(), 1);
    return alignedDate.toISOString().split('T')[0];
  }, []);

  const [dateTo, setDateTo] = useState<string>(defaultEndDate);
  const [dateFrom, setDateFrom] = useState<string>(defaultStartDate);

  const handleDateToChange = (newDateTo: string) => {
    setDateTo(newDateTo);
    setSelectedMonthKey(null);
    setSelectedBadActorMonthKey(null);
    if (dateFrom && newDateTo) {
      const fromObj = new Date(dateFrom);
      const toObj = new Date(newDateTo);
      if (toObj < fromObj) {
        const adjustedFrom = new Date(toObj.getFullYear(), toObj.getMonth() - 1, 1);
        setDateFrom(adjustedFrom.toISOString().split('T')[0]);
      }
    }
  };

  const handleDateFromChange = (newDateFrom: string) => {
    setDateFrom(newDateFrom);
    setSelectedMonthKey(null);
    setSelectedBadActorMonthKey(null);
    if (dateTo && newDateFrom) {
      const fromObj = new Date(newDateFrom);
      const toObj = new Date(dateTo);
      if (toObj < fromObj) {
        const adjustedFrom = new Date(toObj.getFullYear(), toObj.getMonth() - 1, 1);
        setDateFrom(adjustedFrom.toISOString().split('T')[0]);
      }
    }
  };

  // Loading & Refresh
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Toggle Guides
  const [showMatrixGuide, setShowMatrixGuide] = useState<boolean>(true);
  const [showQuadrantGuide, setShowQuadrantGuide] = useState<boolean>(true);
  const [showBadActorGuide, setShowBadActorGuide] = useState<boolean>(true);

  // Data States
  const [fmeaAnalytics, setFmeaAnalytics] = useState<FmeaAnalyticsRecord[]>([]);
  const [opIncidents, setOpIncidents] = useState<OperationalIncidentRiskRecord[]>([]);
  const [badActors, setBadActors] = useState<VehicleBadActorRecord[]>([]);
  const [jobOrdersFlat, setJobOrdersFlat] = useState<JobOrderFlatRecord[]>([]);
  const [componentReliability, setComponentReliability] = useState<ComponentReliabilityRecord[]>([]);
  const [incidentReportsFlat, setIncidentReportsFlat] = useState<IncidentReportFlatRecord[]>([]);

  // Filter States
  const [filterRiskSource, setFilterRiskSource] = useState<string>('ALL');
  const [filterControlStatus, setFilterControlStatus] = useState<string>('ALL');
  const [filterPotentialEffectStatus, setFilterPotentialEffectStatus] = useState<string>('ALL');
  const [filterSeverityLevel, setFilterSeverityLevel] = useState<string>('ALL');
  const [filterSystemGroup, setFilterSystemGroup] = useState<string>('ALL');

  // Matrix Cell Selection Coordinates
  const [selectedMatrixCell, setSelectedMatrixCell] = useState<{ sev: number; occ: number } | null>(null);
  const [selectedIncidentMatrixCell, setSelectedIncidentMatrixCell] = useState<{ sev: number; occ: number } | null>(null);

  /* --- Fetch Query --- */
  const fetchDashboardData = useCallback(async () => {
    const jobOrderQuery = supabase.from('joborder_master')
      .select(`
        job_order_id, 
        vehicle_id, 
        created_at, 
        date_completed, 
        total_cost, 
        labor_cost, 
        materials_cost, 
        contract_cost, 
        vehicles!inner (
          plate_no,
          vehicle_models (
            name,
            vehicle_makes (
              name
            )
          )
        )
      `);

    const [
      resFmea,
      resIncidents,
      resBadActors,
      resJobOrders,
      resReliability,
      resIncidentReports
    ] = await Promise.all([
      supabase.from('vw_comprehensive_fmea_analytics').select('*'),
      supabase.from('vw_operational_incident_risks').select('*'),
      supabase.from('vw_vehicle_bad_actor_metrics').select('*'),
      jobOrderQuery,
      supabase.from('vw_component_reliability_summary').select('*'),
      supabase.from('incident_report').select('vehicle_id, incident_date, incident_loss')
    ]);

    if (resFmea.error) throw resFmea.error;
    if (resIncidents.error) throw resIncidents.error;
    if (resBadActors.error) throw resBadActors.error;
    if (resJobOrders.error) throw resJobOrders.error;
    if (resReliability.error) throw resReliability.error;
    if (resIncidentReports.error) throw resIncidentReports.error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flattenedJOs: JobOrderFlatRecord[] = (resJobOrders.data || []).map((jo: any) => {
      const veh = jo.vehicles;
      const mod = veh?.vehicle_models;
      const mk = mod?.vehicle_makes;
      return {
        job_order_id: jo.job_order_id,
        vehicle_id: jo.vehicle_id,
        created_at: jo.created_at,
        date_completed: jo.date_completed,
        total_cost: jo.total_cost,
        labor_cost: jo.labor_cost,
        materials_cost: jo.materials_cost,
        contract_cost: jo.contract_cost,
        plate_no: veh?.plate_no || 'N/A',
        model_name: mod?.name || 'N/A',
        make_name: mk?.name || 'N/A'
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedFmea: FmeaAnalyticsRecord[] = (resFmea.data || []).map((f: any) => {
      const hasEffect = Boolean(f.potential_effect && String(f.potential_effect).trim() !== '' && String(f.potential_effect).toLowerCase() !== 'null');
      return {
        ...f,
        potential_effect_status: f.potential_effect_status || (hasEffect ? 'Potential Effect Documented' : 'Missing Potential Effect')
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedIncidents: OperationalIncidentRiskRecord[] = (resIncidents.data || []).map((inc: any) => ({
      ...inc,
      source: inc.source === 'INS' ? 'INS' : 'IRS',
      incident_loss: 0 
    }));

    return {
      fmeaAnalytics: mappedFmea,
      opIncidents: mappedIncidents,
      badActors: (resBadActors.data || []) as VehicleBadActorRecord[],
      jobOrdersFlat: flattenedJOs,
      componentReliability: (resReliability.data || []) as ComponentReliabilityRecord[],
      incidentReportsFlat: (resIncidentReports.data || []) as IncidentReportFlatRecord[]
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadInitialData() {
      try {
        const data = await fetchDashboardData();
        if (!ignore) {
          setErrorMsg(null);
          setFmeaAnalytics(data.fmeaAnalytics);
          setOpIncidents(data.opIncidents);
          setBadActors(data.badActors);
          setJobOrdersFlat(data.jobOrdersFlat);
          setComponentReliability(data.componentReliability);
          setIncidentReportsFlat(data.incidentReportsFlat);
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error('Error fetching dashboard datasets:', err);
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load database views.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    void loadInitialData();
    return () => { ignore = true; };
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setErrorMsg(null);
      const data = await fetchDashboardData();
      setFmeaAnalytics(data.fmeaAnalytics);
      setOpIncidents(data.opIncidents);
      setBadActors(data.badActors);
      setJobOrdersFlat(data.jobOrdersFlat);
      setComponentReliability(data.componentReliability);
      setIncidentReportsFlat(data.incidentReportsFlat);
    } catch (err: unknown) {
      console.error('Error refreshing dashboard datasets:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load database views.');
    } finally {
      setRefreshing(false);
    }
  };

  /* --- Derived Computations --- */
  const filteredFmea = useMemo(() => {
    return fmeaAnalytics.filter(r => {
      if (filterRiskSource !== 'ALL' && r.risk_source !== filterRiskSource) return false;
      if (filterControlStatus !== 'ALL' && r.control_status !== filterControlStatus) return false;
      if (filterPotentialEffectStatus !== 'ALL' && r.potential_effect_status !== filterPotentialEffectStatus) return false;
      return true;
    });
  }, [fmeaAnalytics, filterRiskSource, filterControlStatus, filterPotentialEffectStatus]);

  const activeFmeaMatrixInspector = useMemo(() => {
    if (!selectedMatrixCell) return null;
    const matches = filteredFmea.filter(r => r.severity === selectedMatrixCell.sev && r.occurrence === selectedMatrixCell.occ);
    if (matches.length === 0) return null;
    return {
      sev: selectedMatrixCell.sev,
      occ: selectedMatrixCell.occ,
      items: matches
    };
  }, [selectedMatrixCell, filteredFmea]);

  const fmeaKpis = useMemo(() => {
    const total = filteredFmea.length;
    const highRpn = filteredFmea.filter(r => r.computed_rpn >= 200).length;
    const sev910 = filteredFmea.filter(r => r.severity >= 9).length;
    const missingCtrl = filteredFmea.filter(r => r.control_status === 'Missing Control').length;
    const avgRpn = total > 0 ? Math.round(filteredFmea.reduce((acc, r) => acc + r.computed_rpn, 0) / total) : 0;
    return { total, highRpn, sev910, missingCtrl, avgRpn };
  }, [filteredFmea]);

  const periodIncidents = useMemo(() => {
    return opIncidents.filter(i => isWithinDateRange(i.event_date, dateFrom, dateTo));
  }, [opIncidents, dateFrom, dateTo]);

  const filteredIncidents = useMemo(() => {
    return periodIncidents
      .filter(i => {
        if (filterSeverityLevel !== 'ALL' && i.severity_level !== filterSeverityLevel) return false;
        return true;
      })
      .map(i => {
        const sevNum = i.severity_num ?? mapSeverityToNumber(i.severity_level);
        const occNum = i.occurrence_num ?? 5;
        return {
          ...i,
          severity_num: sevNum,
          occurrence_num: occNum
        };
      });
  }, [periodIncidents, filterSeverityLevel]);

  // Month-on-Month Trend Aggregates for Vertical Bar Chart (INS vs IRS) aligned to month start
  const monthOnMonthIncidentVolume = useMemo(() => {
    const monthMap = new Map<string, { monthKey: string; monthLabel: string; ins: number; irs: number; total: number }>();

    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    const curr = new Date(start.getFullYear(), start.getMonth(), 1);
    
    while (curr <= end) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      const label = curr.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      monthMap.set(key, { monthKey: key, monthLabel: label, ins: 0, irs: 0, total: 0 });
      curr.setMonth(curr.getMonth() + 1);
    }

    filteredIncidents.forEach(inc => {
      if (!inc.event_date) return;
      const mKey = inc.event_date.substring(0, 7);
      if (!mKey || mKey.length < 7) return;

      if (!monthMap.has(mKey)) {
        const d = new Date(`${mKey}-01T00:00:00`);
        const label = isNaN(d.getTime()) ? mKey : d.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthMap.set(mKey, { monthKey: mKey, monthLabel: label, ins: 0, irs: 0, total: 0 });
      }

      const bucket = monthMap.get(mKey)!;
      bucket.total += 1;
      if (inc.source === 'INS') {
        bucket.ins += 1;
      } else if (inc.source === 'IRS') {
        bucket.irs += 1;
      }
    });

    return Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [filteredIncidents, dateFrom, dateTo]);

  // Month-on-Month Fleet Repair Expense vs Incident Financial Loss Aggregates for Bad Actor Scorecard
  const monthOnMonthBadActorMetrics = useMemo(() => {
    const monthMap = new Map<string, { monthKey: string; monthLabel: string; repairCost: number; financialLoss: number }>();

    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    const curr = new Date(start.getFullYear(), start.getMonth(), 1);

    while (curr <= end) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      const label = curr.toLocaleString('default', { month: 'short', year: 'numeric' });

      monthMap.set(key, { monthKey: key, monthLabel: label, repairCost: 0, financialLoss: 0 });
      curr.setMonth(curr.getMonth() + 1);
    }

    // Accumulate repair costs strictly within the date range
    jobOrdersFlat.forEach(j => {
      const dateVal = j.created_at || j.date_completed;
      if (!isWithinDateRange(dateVal, dateFrom, dateTo)) return;
      
      const mKey = dateVal?.substring(0, 7);
      if (!mKey || !monthMap.has(mKey)) return;

      const cost = Number(j.total_cost || 0) || (Number(j.labor_cost || 0) + Number(j.materials_cost || 0) + Number(j.contract_cost || 0));
      const bucket = monthMap.get(mKey)!;
      bucket.repairCost += cost;
    });

    // Accumulate financial losses strictly within the date range
    incidentReportsFlat.forEach(inc => {
      if (!inc.incident_date || !isWithinDateRange(inc.incident_date, dateFrom, dateTo)) return;
      
      const mKey = inc.incident_date.substring(0, 7);
      if (!monthMap.has(mKey)) return;

      const loss = Number(inc.incident_loss || 0);
      const bucket = monthMap.get(mKey)!;
      bucket.financialLoss += loss;
    });

    return Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [jobOrdersFlat, incidentReportsFlat, dateFrom, dateTo]);

  // Incidents dynamically filtered by selected month for the KPI cards & table
  const selectedMonthIncidents = useMemo(() => {
    if (!selectedMonthKey) return filteredIncidents;
    return filteredIncidents.filter(i => i.event_date && i.event_date.substring(0, 7) === selectedMonthKey);
  }, [filteredIncidents, selectedMonthKey]);

  // Aggregated Counts for 3rd Sub-Tab based on Selected Month and Clickable Source Filtering
  const hierarchicalRcaBreakdown = useMemo(() => {
    const totalCount = selectedMonthIncidents.length;
    const irsTotal = selectedMonthIncidents.filter(i => i.source === 'IRS').length;
    const insTotal = selectedMonthIncidents.filter(i => i.source === 'INS').length;

    const sourceFilteredIncidents = selectedMonthIncidents.filter(i => {
      if (rcaSourceFilter === 'ALL') return true;
      return i.source === rcaSourceFilter;
    });

    const filteredTotalCount = sourceFilteredIncidents.length;

    interface CategoryNode {
      code: string;
      desc: string;
      totalCount: number;
      insCount: number;
      irsCount: number;
    }

    interface MainPillarNode {
      pillarName: string;
      totalCount: number;
      insCount: number;
      irsCount: number;
      categories: Map<string, CategoryNode>;
    }

    const pillarMap = new Map<string, MainPillarNode>();
    
    const standardPillars = ['Unsafe Condition', 'Unsafe Act', 'Personal Factor', 'Work-Related Cause'];
    standardPillars.forEach(p => {
      pillarMap.set(p, {
        pillarName: p,
        totalCount: 0,
        insCount: 0,
        irsCount: 0,
        categories: new Map()
      });
    });

    sourceFilteredIncidents.forEach(inc => {
      let pillarName = inc.risk_source;
      if (!pillarName || !pillarMap.has(pillarName)) {
        const code = inc.root_cause_code?.toUpperCase() || '';
        if (code.startsWith('ACT') || code.includes('ACT')) pillarName = 'Unsafe Act';
        else if (code.startsWith('PF') || code.includes('PERS') || code.includes('FACTOR')) pillarName = 'Personal Factor';
        else if (code.startsWith('WRK') || code.includes('WORK') || code.includes('CAUSE')) pillarName = 'Work-Related Cause';
        else pillarName = 'Unsafe Condition';
      }

      if (!pillarMap.has(pillarName)) {
        pillarMap.set(pillarName, {
          pillarName,
          totalCount: 0,
          insCount: 0,
          irsCount: 0,
          categories: new Map()
        });
      }

      const pillar = pillarMap.get(pillarName)!;
      pillar.totalCount += 1;
      if (inc.source === 'INS') pillar.insCount += 1;
      if (inc.source === 'IRS') pillar.irsCount += 1;

      const catCode = inc.root_cause_code || 'GEN';
      const catDesc = inc.root_cause_desc || 'General Hazard';

      if (!pillar.categories.has(catCode)) {
        pillar.categories.set(catCode, {
          code: catCode,
          desc: catDesc,
          totalCount: 0,
          insCount: 0,
          irsCount: 0
        });
      }
      const category = pillar.categories.get(catCode)!;
      category.totalCount += 1;
      if (inc.source === 'INS') category.insCount += 1;
      if (inc.source === 'IRS') category.irsCount += 1;
    });

    const pillars = Array.from(pillarMap.values()).map(p => ({
      ...p,
      categoriesList: Array.from(p.categories.values()).sort((a, b) => b.totalCount - a.totalCount)
    })).sort((a, b) => b.totalCount - a.totalCount);

    return { totalCount, irsTotal, insTotal, filteredTotalCount, pillars };
  }, [selectedMonthIncidents, rcaSourceFilter]);

  const activeIncidentMatrixInspector = useMemo(() => {
    if (!selectedIncidentMatrixCell) return null;
    const matches = filteredIncidents.filter(
      i => i.severity_num === selectedIncidentMatrixCell.sev && i.occurrence_num === selectedIncidentMatrixCell.occ
    );
    if (matches.length === 0) return null;
    return {
      sev: selectedIncidentMatrixCell.sev,
      occ: selectedIncidentMatrixCell.occ,
      items: matches
    };
  }, [selectedIncidentMatrixCell, filteredIncidents]);

  const filteredBadActors = useMemo(() => {
    const filteredJOs = jobOrdersFlat.filter(j => {
      const dateVal = j.created_at || j.date_completed;
      if (!isWithinDateRange(dateVal, dateFrom, dateTo)) return false;
      if (selectedBadActorMonthKey && dateVal && dateVal.substring(0, 7) !== selectedBadActorMonthKey) return false;
      return true;
    });

    const filteredIncidents = incidentReportsFlat.filter(inc => {
      const dateVal = inc.incident_date;
      if (!isWithinDateRange(dateVal, dateFrom, dateTo)) return false;
      if (selectedBadActorMonthKey && dateVal && dateVal.substring(0, 7) !== selectedBadActorMonthKey) return false;
      return true;
    });

    const vehicleMeta = new Map<string, VehicleBadActorRecord>();
    badActors.forEach(ba => vehicleMeta.set(ba.vehicle_id, ba));

    const badActorMap = new Map<string, VehicleBadActorRecord>();

    filteredJOs.forEach(j => {
      if (!j.vehicle_id) return;
      const vId = j.vehicle_id;
      const cost = Number(j.total_cost || 0) || (Number(j.labor_cost || 0) + Number(j.materials_cost || 0) + Number(j.contract_cost || 0));
      
      if (!badActorMap.has(vId)) {
        const meta = vehicleMeta.get(vId) || ({} as Partial<VehicleBadActorRecord>);
        badActorMap.set(vId, {
          vehicle_id: vId,
          plate_no: j.plate_no || meta.plate_no || 'N/A',
          customer_name: meta.customer_name || 'N/A',
          make_name: j.make_name || meta.make_name || 'N/A',
          model_name: j.model_name || meta.model_name || 'N/A',
          total_maintenance_cost: 0,
          incident_loss: 0,
          incident_count: 0,
          total_financial_impact: 0,
          bad_actor_score: 0,
          risk_tier: 'Low Risk'
        });
      }
      const record = badActorMap.get(vId)!;
      record.total_maintenance_cost += cost;
    });

    filteredIncidents.forEach(inc => {
      if (!inc.vehicle_id) return;
      const vId = inc.vehicle_id;
      const loss = Number(inc.incident_loss || 0);

      if (!badActorMap.has(vId)) {
        const meta = vehicleMeta.get(vId) || ({} as Partial<VehicleBadActorRecord>);
        badActorMap.set(vId, {
          vehicle_id: vId,
          plate_no: meta.plate_no || 'N/A',
          customer_name: meta.customer_name || 'N/A',
          make_name: meta.make_name || 'N/A',
          model_name: meta.model_name || 'N/A',
          total_maintenance_cost: 0,
          incident_loss: 0,
          incident_count: 0,
          total_financial_impact: 0,
          bad_actor_score: 0,
          risk_tier: 'Low Risk'
        });
      }
      const record = badActorMap.get(vId)!;
      record.incident_loss += loss;
      record.incident_count += 1;
    });

    const result = Array.from(badActorMap.values()).map(record => {
      record.total_financial_impact = record.total_maintenance_cost + record.incident_loss;
      const score = Math.min(Math.round((record.total_maintenance_cost / 1000) * 10) / 10, 100);
      record.bad_actor_score = score;
      record.risk_tier = record.total_maintenance_cost >= 50000 ? 'High Risk' : record.total_maintenance_cost >= 20000 ? 'Medium Risk' : 'Low Risk';
      return record;
    });

    return result.sort((a, b) => b.total_maintenance_cost - a.total_maintenance_cost);
  }, [badActors, jobOrdersFlat, incidentReportsFlat, dateFrom, dateTo, selectedBadActorMonthKey]);

  const systemAggregates = useMemo(() => {
    const map = new Map<string, { systemDesc: string; totalCost: number; totalReplacements: number; count: number }>();
    componentReliability.forEach(cr => {
      const sysCode = cr.system_code || 'GEN';
      const sysDesc = cr.system_desc || 'General System';
      const cost = Number(cr.cumulative_component_cost || 0);
      const reps = Number(cr.total_replacements || 0);

      if (!map.has(sysCode)) {
        map.set(sysCode, { systemDesc: sysDesc, totalCost: cost, totalReplacements: reps, count: 1 });
      } else {
        const item = map.get(sysCode)!;
        item.totalCost += cost;
        item.totalReplacements += reps;
        item.count += 1;
      }
    });

    const result: { systemCode: string; systemDesc: string; totalCost: number; totalReplacements: number; count: number }[] = [];
    map.forEach((val, key) => { result.push({ systemCode: key, ...val }); });
    return result.sort((a, b) => b.totalCost - a.totalCost);
  }, [componentReliability]);

  const selectedSystemMetrics = useMemo(() => {
    const subset = filterSystemGroup === 'ALL' 
      ? componentReliability 
      : componentReliability.filter(cr => cr.system_code === filterSystemGroup);

    const totalSubComponents = subset.length;
    const totalUninstalled = subset.filter(cr => cr.installed_status === false).length;
    const totalInstalled = subset.filter(cr => cr.installed_status === true).length;
    const totalAcquisitionCost = subset.reduce((acc, cr) => acc + (cr.cumulative_component_cost || 0), 0);

    return { totalSubComponents, totalUninstalled, totalInstalled, totalAcquisitionCost };
  }, [componentReliability, filterSystemGroup]);

  const decoupledComponentReliability = useMemo(() => {
    return componentReliability.filter(cr => {
      if (filterSystemGroup !== 'ALL' && cr.system_code !== filterSystemGroup) return false;
      return true;
    });
  }, [componentReliability, filterSystemGroup]);

  return (
    <div className="h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3 flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 rounded-xl shadow-xs shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">
              Fleet Risk & FMEA Intelligence Suite
            </h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">
              Enterprise risk prioritization, operational hazard mapping, component reliability, and predictive fleet health.
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
        
        {/* Title and Date Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border-main) pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-(--text-primary)">
              {activeMainTab === 'risk' && (
                riskSubTab === 'exec_fmea' ? 'Executive Risk Matrix & FMEA Analytics' :
                riskSubTab === 'op_incidents' ? 'Operational Incident Risk Log' :
                'Incidents Breakdown & RCA Category Chart'
              )}
              {activeMainTab === 'reliability' && (
                reliabilitySubTab === 'bad_actors' ? 'Fleet Bad Actor Scorecard' : 'Component Reliability & System Analytics'
              )}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-(--bg-surface) border border-(--border-main) px-2.5 py-1.5 rounded-lg text-xs shadow-xs">
            <Filter className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase text-(--text-muted)">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="bg-transparent text-(--text-primary) font-medium text-xs focus:outline-none cursor-pointer"
            />
            <span className="text-[10px] font-bold uppercase text-(--text-muted) ml-1">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="bg-transparent text-(--text-primary) font-medium text-xs focus:outline-none cursor-pointer"
            />
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1 bg-(--btn-primary-bg, #0f172a) text-white px-2.5 py-1 rounded-md text-[11px] font-semibold ml-2 hover:opacity-95 transition-opacity cursor-pointer shadow-xs disabled:opacity-50"
              title="Refresh views with period dates"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex border-b border-(--border-main) gap-2 shrink-0 overflow-x-auto">
          {[
            { id: 'risk', label: '1. Risk & Hazards', icon: ShieldAlert },
            { id: 'reliability', label: '2. Asset Reliability & Component Ops', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id as MainTab)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
                    : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-500' : 'text-(--text-muted)'}`} />
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
              <p className="text-xs text-(--text-muted)">Querying operational failure datasets...</p>
            </div>
          ) : (
            <>
              {/* MAIN TAB 1: Risk & Hazards */}
              {activeMainTab === 'risk' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-(--border-main) pb-2 text-xs font-bold overflow-x-auto">
                    <button
                      onClick={() => setRiskSubTab('exec_fmea')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        riskSubTab === 'exec_fmea'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'text-(--text-muted) hover:text-(--text-primary)'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Executive Risk Matrix</span>
                    </button>

                    <button
                      onClick={() => setRiskSubTab('op_incidents')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        riskSubTab === 'op_incidents'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'text-(--text-muted) hover:text-(--text-primary)'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Operational Hazard Log</span>
                    </button>

                    <button
                      onClick={() => setRiskSubTab('rca_breakdown')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        riskSubTab === 'rca_breakdown'
                          ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                          : 'text-(--text-muted) hover:text-(--text-primary)'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>RCA Category & Incident Counts</span>
                    </button>
                  </div>

                  {riskSubTab === 'exec_fmea' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="p-3.5 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs">
                        <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                          <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-rose-500" />
                            <h3 className="text-xs font-extrabold uppercase tracking-wide text-(--text-primary)">
                              Filter Matrix Analytics (Decoupled from Period Dates)
                            </h3>
                          </div>
                          <span className="text-[10px] text-(--text-muted) font-mono">
                            Matching Records: <strong>{filteredFmea.length}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label htmlFor="filterRiskSource" className="text-[10px] font-bold uppercase text-(--text-muted)">Risk Category Source</label>
                            <select
                              id="filterRiskSource"
                              name="filterRiskSource"
                              value={filterRiskSource}
                              onChange={(e) => setFilterRiskSource(e.target.value)}
                              className="w-full mt-1 bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) text-xs rounded-lg px-2.5 py-1.5 focus:outline-none font-medium"
                            >
                              <option value="ALL">All Categories</option>
                              <option value="Unsafe Act">Unsafe Acts</option>
                              <option value="Unsafe Condition">Unsafe Conditions</option>
                              <option value="Work Cause">Work Causes</option>
                              <option value="Personal Factor">Personal Factors</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="filterControlStatus" className="text-[10px] font-bold uppercase text-(--text-muted)">Control Status</label>
                            <select
                              id="filterControlStatus"
                              name="filterControlStatus"
                              value={filterControlStatus}
                              onChange={(e) => setFilterControlStatus(e.target.value)}
                              className="w-full mt-1 bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) text-xs rounded-lg px-2.5 py-1.5 focus:outline-none font-medium"
                            >
                              <option value="ALL">All Controls</option>
                              <option value="Control Documented">Control Documented</option>
                              <option value="Missing Control">Missing Control</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="filterPotentialEffectStatus" className="text-[10px] font-bold uppercase text-(--text-muted)">Potential Effects Status</label>
                            <select
                              id="filterPotentialEffectStatus"
                              name="filterPotentialEffectStatus"
                              value={filterPotentialEffectStatus}
                              onChange={(e) => setFilterPotentialEffectStatus(e.target.value)}
                              className="w-full mt-1 bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) text-xs rounded-lg px-2.5 py-1.5 focus:outline-none font-medium"
                            >
                              <option value="ALL">All Potential Effects</option>
                              <option value="Potential Effect Documented">Potential Effect Documented</option>
                              <option value="Missing Potential Effect">Missing Potential Effect</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-(--border-main)">
                          <div className="p-2.5 bg-(--bg-elevated) border border-(--border-main) rounded-xl">
                            <div className="text-[9px] font-bold uppercase text-(--text-muted)">Total Failure Modes</div>
                            <div className="text-xl font-black text-(--text-primary) font-mono">{fmeaKpis.total}</div>
                          </div>
                          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                            <div className="text-[9px] font-bold uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <Flame className="w-3 h-3 text-rose-500" /> High RPN (&ge;200)
                            </div>
                            <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">{fmeaKpis.highRpn}</div>
                          </div>
                          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <div className="text-[9px] font-bold uppercase text-red-600 dark:text-red-400">Critical Severity (9–10)</div>
                            <div className="text-xl font-black text-red-600 dark:text-red-400 font-mono">{fmeaKpis.sev910}</div>
                          </div>
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <div className="text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400">Missing Controls</div>
                            <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{fmeaKpis.missingCtrl}</div>
                          </div>
                          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <div className="text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400">Average Enterprise RPN</div>
                            <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">{fmeaKpis.avgRpn}</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-(--bg-surface) border border-(--border-main) rounded-xl p-3.5 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-(--text-primary)">
                              FMEA Severity vs. Occurrence Risk Matrix Guide
                            </h3>
                          </div>
                          <button
                            onClick={() => setShowMatrixGuide(!showMatrixGuide)}
                            className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer"
                          >
                            {showMatrixGuide ? 'Collapse Guide' : 'Expand Guide'}
                          </button>
                        </div>

                        {showMatrixGuide && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs border-t border-(--border-main)">
                            <div className="space-y-1 bg-(--bg-elevated) p-2.5 rounded-lg border border-(--border-main)">
                              <div className="font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                Severity Rating (S: 1 – 10)
                              </div>
                              <p className="text-[11px] text-(--text-muted) leading-relaxed">
                                Measures financial, operational, or safety consequences. Rating 10 signifies catastrophic safety loss; Rating 1 indicates negligible impact.
                              </p>
                            </div>

                            <div className="space-y-1 bg-(--bg-elevated) p-2.5 rounded-lg border border-(--border-main)">
                              <div className="font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Occurrence Rating (O: 1 – 10)
                              </div>
                              <p className="text-[11px] text-(--text-muted) leading-relaxed">
                                Reflects expected failure frequency. Rating 10 means frequent occurrence (&gt;1 per week); Rating 1 denotes rare preventive events.
                              </p>
                            </div>

                            <div className="space-y-1 bg-(--bg-elevated) p-2.5 rounded-lg border border-(--border-main)">
                              <div className="font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Risk Priority Number (RPN)
                              </div>
                              <p className="text-[11px] text-(--text-muted) leading-relaxed">
                                Calculated via RPN = Severity &times; Occurrence &times; Detection. Items with RPN &ge; 200 trigger mandatory corrective action.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-(--bg-surface) border border-(--border-main) rounded-xl p-3.5 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Grid className="w-4 h-4 text-purple-500 shrink-0" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-(--text-primary)">
                              Matrix Quadrants & Strategic Action Guide
                            </h3>
                          </div>
                          <button
                            onClick={() => setShowQuadrantGuide(!showQuadrantGuide)}
                            className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer"
                          >
                            {showQuadrantGuide ? 'Collapse Quadrants' : 'Expand Quadrants'}
                          </button>
                        </div>

                        {showQuadrantGuide && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 text-xs border-t border-(--border-main)">
                            <div className="p-2.5 bg-rose-500/10 border-2 border-rose-500/40 rounded-xl space-y-1">
                              <div className="font-black text-rose-600 dark:text-rose-400 uppercase text-[10px] flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Quadrant I: Critical Risk Zone
                              </div>
                              <div className="text-[10px] font-bold text-(--text-primary)">High Severity (6–10) & High Occurrence (6–10)</div>
                              <p className="text-[10px] text-(--text-muted) leading-snug">
                                Catastrophic, recurring failure modes. Triggers mandatory immediate CAPA, engineering redesign, and high-frequency PM checks.
                              </p>
                            </div>

                            <div className="p-2.5 bg-amber-500/10 border-2 border-amber-500/40 rounded-xl space-y-1">
                              <div className="font-black text-amber-600 dark:text-amber-400 uppercase text-[10px] flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Quadrant II: High Impact Zone
                              </div>
                              <div className="text-[10px] font-bold text-(--text-primary)">High Severity (6–10) & Low Occurrence (1–5)</div>
                              <p className="text-[10px] text-(--text-muted) leading-snug">
                                Rare but severe safety or asset loss events. Managed through safety interlocks, emergency procedures, and strict detection controls.
                              </p>
                            </div>

                            <div className="p-2.5 bg-purple-500/10 border-2 border-purple-500/40 rounded-xl space-y-1">
                              <div className="font-black text-purple-600 dark:text-purple-400 uppercase text-[10px] flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Quadrant III: High Nuisance Zone
                              </div>
                              <div className="text-[10px] font-bold text-(--text-primary)">Low Severity (1–5) & High Occurrence (6–10)</div>
                              <p className="text-[10px] text-(--text-muted) leading-snug">
                                Frequent minor defects causing maintenance backlog. Managed by standardizing routine wear-and-tear component swaps.
                              </p>
                            </div>

                            <div className="p-2.5 bg-blue-500/10 border-2 border-blue-500/40 rounded-xl space-y-1">
                              <div className="font-black text-blue-600 dark:text-blue-400 uppercase text-[10px] flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Quadrant IV: Low Risk Zone
                              </div>
                              <div className="text-[10px] font-bold text-(--text-primary)">Low Severity (1–5) & Low Occurrence (1–5)</div>
                              <p className="text-[10px] text-(--text-muted) leading-snug">
                                Acceptable operational noise. Addressed via standard driver inspections and basic PM servicing.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wide text-(--text-primary)">
                            Interactive 4-Quadrant Risk Heatmap (FMEA Modes - Global & Decoupled)
                          </h3>
                          <p className="text-[11px] text-(--text-muted)">
                            Plots global FMEA risk categories across Severity vs Occurrence. Cell backgrounds and borders match panel guide colors.
                          </p>
                        </div>

                        <div className="pt-2 max-w-2xl mx-auto overflow-x-auto">
                          <div className="min-w-120">
                            <div className="grid grid-cols-11 gap-1 mb-1 text-center font-mono text-[10px] text-(--text-muted) font-bold">
                              <div className="text-right pr-2">S \ O</div>
                              {[...Array(10)].map((_, i) => (
                                <div key={i} className={`py-1 rounded border border-(--border-main) ${i >= 5 ? 'bg-rose-500/10 font-black text-rose-600' : 'bg-(--bg-elevated)'}`}>
                                  O{i + 1}
                                </div>
                              ))}
                            </div>

                            {[...Array(10)].map((_, sIdx) => {
                              const sev = 10 - sIdx;
                              const isHighSev = sev >= 6;
                              return (
                                <div key={sev} className="grid grid-cols-11 gap-1 mb-1">
                                  <div className={`text-[10px] font-mono font-bold text-right pr-2 flex items-center justify-end rounded border border-(--border-main) px-1 ${isHighSev ? 'bg-rose-500/10 text-rose-600 font-black' : 'bg-(--bg-elevated) text-(--text-muted)'}`}>
                                    S{sev}
                                  </div>

                                  {[...Array(10)].map((_, oIdx) => {
                                    const occ = oIdx + 1;
                                    const isHighOcc = occ >= 6;
                                    const matches = filteredFmea.filter(r => r.severity === sev && r.occurrence === occ);
                                    const count = matches.length;
                                    const maxRpn = count > 0 ? Math.max(...matches.map(m => m.computed_rpn)) : 0;

                                    const quadrantStyle = 
                                      isHighSev && isHighOcc
                                        ? 'border-2 border-rose-500/50 bg-rose-500/10 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300'
                                        : isHighSev && !isHighOcc
                                        ? 'border-2 border-amber-500/50 bg-amber-500/10 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300'
                                        : !isHighSev && isHighOcc
                                        ? 'border-2 border-purple-500/50 bg-purple-500/10 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300'
                                        : 'border-2 border-blue-500/50 bg-blue-500/10 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300';

                                    let badgeStyle = '';
                                    if (count > 0) {
                                      if (maxRpn >= 200 || sev >= 9) {
                                        badgeStyle = 'bg-rose-600 text-white shadow-md ring-1 ring-rose-400 animate-pulse font-bold';
                                      } else if (maxRpn >= 100) {
                                        badgeStyle = 'bg-amber-600 text-white font-extrabold';
                                      } else {
                                        badgeStyle = 'bg-blue-600 text-white font-semibold';
                                      }
                                    }

                                    const isSelected = selectedMatrixCell?.sev === sev && selectedMatrixCell?.occ === occ;

                                    return (
                                      <button
                                        key={occ}
                                        onClick={() => setSelectedMatrixCell({ sev, occ })}
                                        disabled={count === 0}
                                        title={`S${sev} & O${occ} | Matched Risks: ${count} | Max RPN: ${maxRpn}`}
                                        className={`h-9 rounded-lg flex flex-col items-center justify-center text-[10px] transition-all cursor-pointer ${quadrantStyle} ${
                                          isSelected ? 'ring-2 ring-white scale-110 z-10' : 'hover:scale-105'
                                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                                      >
                                        {count > 0 ? (
                                          <div className={`w-full h-full flex flex-col items-center justify-center rounded-md ${badgeStyle}`}>
                                            <span className="font-extrabold font-mono text-xs">{count}</span>
                                            <span className="text-[8px] opacity-90">RPN {maxRpn}</span>
                                          </div>
                                        ) : (
                                          <span className="text-[9px] font-mono opacity-40 font-bold">{sev}&times;{occ}</span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {activeFmeaMatrixInspector && (
                          <div className="mt-4 p-3.5 bg-(--bg-elevated) border-2 border-rose-500/40 rounded-xl space-y-3 animate-fadeIn">
                            <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase text-rose-600">
                                <Sparkles className="w-4 h-4" />
                                Inspecting Matrix Cell: Severity {activeFmeaMatrixInspector.sev} &times; Occurrence {activeFmeaMatrixInspector.occ}
                              </div>
                              <button
                                onClick={() => setSelectedMatrixCell(null)}
                                className="text-xs font-semibold text-(--text-muted) hover:text-(--text-primary)"
                              >
                                Close Inspector
                              </button>
                            </div>

                            <div className="overflow-x-auto max-h-48">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-(--bg-surface) text-[10px] text-(--text-muted) uppercase sticky top-0">
                                  <tr>
                                    <th className="p-2">Code</th>
                                    <th className="p-2">Risk Source</th>
                                    <th className="p-2">Description</th>
                                    <th className="p-2">Potential Effect</th>
                                    <th className="p-2 text-center">RPN</th>
                                    <th className="p-2 text-center">Risk Tier</th>
                                    <th className="p-2">Control Status</th>
                                    <th className="p-2">Effect Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-(--border-main)">
                                  {activeFmeaMatrixInspector.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-(--accent-subtle)">
                                      <td className="p-2 font-mono font-bold text-rose-600">{item.detail_code}</td>
                                      <td className="p-2 font-semibold">{item.risk_source}</td>
                                      <td className="p-2 text-(--text-secondary)">{item.detail_description}</td>
                                      <td className="p-2 text-(--text-primary) italic">{item.potential_effect || 'None'}</td>
                                      <td className="p-2 text-center font-mono font-bold">{item.computed_rpn}</td>
                                      <td className="p-2 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          item.risk_tier === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' :
                                          item.risk_tier === 'High' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' :
                                          item.risk_tier === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                                          'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                        }`}>
                                          {item.risk_tier}
                                        </span>
                                      </td>
                                      <td className="p-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          item.control_status === 'Missing Control' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                          {item.control_status}
                                        </span>
                                      </td>
                                      <td className="p-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          item.potential_effect_status === 'Missing Potential Effect' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                                        }`}>
                                          {item.potential_effect_status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {riskSubTab === 'op_incidents' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between bg-(--bg-surface) p-3 border border-(--border-main) rounded-xl shadow-xs">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                            Live Incident & Vehicle Hazard Log
                          </h3>
                        </div>
                        <select
                          value={filterSeverityLevel}
                          onChange={(e) => setFilterSeverityLevel(e.target.value)}
                          className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) text-xs rounded-lg px-2.5 py-1 focus:outline-none font-semibold cursor-pointer"
                        >
                          <option value="ALL">
                            All Severities ({periodIncidents.length})
                          </option>
                          <option value="Critical">
                            Critical ({periodIncidents.filter(i => i.severity_level?.toLowerCase() === 'critical').length})
                          </option>
                          <option value="High">
                            High ({periodIncidents.filter(i => i.severity_level?.toLowerCase() === 'high').length})
                          </option>
                          <option value="Medium">
                            Medium ({periodIncidents.filter(i => i.severity_level?.toLowerCase() === 'medium').length})
                          </option>
                          <option value="Low/Moderate">
                            Low/Moderate ({periodIncidents.filter(i => i.severity_level?.toLowerCase() === 'low/moderate' || i.severity_level?.toLowerCase() === 'low').length})
                          </option>
                        </select>
                      </div>

                      <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wide text-(--text-primary)">
                              Interactive 4-Quadrant Risk Heatmap (Vehicle Hazard Log)
                            </h3>
                            <p className="text-[11px] text-(--text-muted)">
                              {filterSeverityLevel === 'ALL'
                                ? 'Plots vehicle hazard logs across Severity vs Occurrence (Filtered by selected Period Dates).'
                                : 'Heatmap matrix is hidden when a specific Severity Filter is active. Select "All Severities" to inspect overall distribution.'}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-(--text-muted)">
                            Period Incidents: <strong>{filteredIncidents.length}</strong>
                          </span>
                        </div>

                        <div className="pt-2 max-w-2xl mx-auto overflow-x-auto">
                          <div className="min-w-120">
                            <div className="grid grid-cols-11 gap-1 mb-1 text-center font-mono text-[10px] text-(--text-muted) font-bold">
                              <div className="text-right pr-2">S \ O</div>
                              {[...Array(10)].map((_, i) => (
                                <div key={i} className={`py-1 rounded border border-(--border-main) ${i >= 5 ? 'bg-amber-500/10 font-black text-amber-600' : 'bg-(--bg-elevated)'}`}>
                                  O{i + 1}
                                </div>
                              ))}
                            </div>

                            {[...Array(10)].map((_, sIdx) => {
                              const sev = 10 - sIdx;
                              const isHighSev = sev >= 6;
                              return (
                                <div key={sev} className="grid grid-cols-11 gap-1 mb-1">
                                  <div className={`text-[10px] font-mono font-bold text-right pr-2 flex items-center justify-end rounded border border-(--border-main) px-1 ${isHighSev ? 'bg-amber-500/10 text-amber-600 font-black' : 'bg-(--bg-elevated) text-(--text-muted)'}`}>
                                    S{sev}
                                  </div>

                                  {[...Array(10)].map((_, oIdx) => {
                                    const occ = oIdx + 1;
                                    const isHighOcc = occ >= 6;
                                    
                                    const matches = filterSeverityLevel === 'ALL'
                                      ? filteredIncidents.filter(i => i.severity_num === sev && i.occurrence_num === occ)
                                      : [];
                                    const count = matches.length;

                                    const quadrantStyle = 
                                      isHighSev && isHighOcc
                                        ? 'border-2 border-rose-500/50 bg-rose-500/10 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300'
                                        : isHighSev && !isHighOcc
                                        ? 'border-2 border-amber-500/50 bg-amber-500/10 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300'
                                        : !isHighSev && isHighOcc
                                        ? 'border-2 border-purple-500/50 bg-purple-500/10 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300'
                                        : 'border-2 border-blue-500/50 bg-blue-500/10 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300';

                                    let badgeStyle = '';
                                    if (count > 0) {
                                      if (sev >= 9) {
                                        badgeStyle = 'bg-red-600 text-white shadow-md ring-1 ring-red-400 animate-pulse font-bold';
                                      } else if (sev >= 6) {
                                        badgeStyle = 'bg-amber-600 text-white font-extrabold';
                                      } else {
                                        badgeStyle = 'bg-blue-600 text-white font-semibold';
                                      }
                                    }

                                    const isSelected = selectedIncidentMatrixCell?.sev === sev && selectedIncidentMatrixCell?.occ === occ;

                                    return (
                                      <button
                                        key={occ}
                                        onClick={() => setSelectedIncidentMatrixCell({ sev, occ })}
                                        disabled={count === 0}
                                        title={`S${sev} & O${occ} | Matched Incidents: ${count}`}
                                        className={`h-9 rounded-lg flex flex-col items-center justify-center text-[10px] transition-all cursor-pointer ${quadrantStyle} ${
                                          isSelected ? 'ring-2 ring-white scale-110 z-10' : 'hover:scale-105'
                                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                                      >
                                        {count > 0 ? (
                                          <div className={`w-full h-full flex flex-col items-center justify-center rounded-md ${badgeStyle}`}>
                                            <span className="font-extrabold font-mono text-xs">{count}</span>
                                            <span className="text-[8px] opacity-90">Incidents</span>
                                          </div>
                                        ) : (
                                          <span className="text-[9px] font-mono opacity-40 font-bold">{sev}&times;{occ}</span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {activeIncidentMatrixInspector && filterSeverityLevel === 'ALL' && (
                          <div className="mt-4 p-3.5 bg-(--bg-elevated) border-2 border-amber-500/40 rounded-xl space-y-3 animate-fadeIn">
                            <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase text-amber-600">
                                <Sparkles className="w-4 h-4" />
                                Inspecting Incident Cell: Severity {activeIncidentMatrixInspector.sev} &times; Occurrence {activeIncidentMatrixInspector.occ}
                              </div>
                              <button
                                onClick={() => setSelectedIncidentMatrixCell(null)}
                                className="text-xs font-semibold text-(--text-muted) hover:text-(--text-primary)"
                              >
                                Close Inspector
                              </button>
                            </div>

                            <div className="overflow-x-auto max-h-48">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-(--bg-surface) text-[10px] text-(--text-muted) uppercase sticky top-0">
                                  <tr>
                                    <th className="p-2">Ref No</th>
                                    <th className="p-2">Plate No</th>
                                    <th className="p-2">Source</th>
                                    <th className="p-2">Date</th>
                                    <th className="p-2">Description</th>
                                    <th className="p-2">Root Cause</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-(--border-main)">
                                  {activeIncidentMatrixInspector.items.map((inc, idx) => (
                                    <tr key={idx} className="hover:bg-(--accent-subtle)">
                                      <td className="p-2 font-mono font-bold text-rose-600">{inc.ref_no}</td>
                                      <td className="p-2 font-bold">{inc.plate_no}</td>
                                      <td className="p-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          inc.source === 'IRS' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                        }`}>
                                          {inc.source}
                                        </span>
                                      </td>
                                      <td className="p-2 font-mono">{inc.event_date}</td>
                                      <td className="p-2 text-(--text-secondary)">{inc.description}</td>
                                      <td className="p-2 font-semibold">[{inc.root_cause_code}] {inc.root_cause_desc}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 3: Month-on-Month Trend Bar Chart & RCA Breakdown */}
                  {riskSubTab === 'rca_breakdown' && (
                    <div className="space-y-4 animate-fadeIn">
                      
                      {/* 1. Month-on-Month Vertical Bar Chart (INS vs IRS) */}
                      <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-main) pb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                              Month-on-Month Incident & Inspection Volume (INS vs IRS)
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block"></span>INS (Inspections)</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-500 rounded-xs inline-block"></span>IRS (Incidents)</span>
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
                            ? `Currently showing data for selected month: ${monthOnMonthIncidentVolume.find(m => m.monthKey === selectedMonthKey)?.monthLabel || selectedMonthKey}. Click the selected bar again to view the entire period range.`
                            : `Click any month bar to filter KPI cards and category details for that specific month (${dateFrom} to ${dateTo}).`}
                        </p>

                        {monthOnMonthIncidentVolume.length === 0 ? (
                          <div className="py-12 text-center text-xs text-(--text-muted)">No monthly volume data available for the selected period.</div>
                        ) : (
                          <div className="pt-2 pb-2 overflow-x-auto">
                            <div className="flex items-end justify-around gap-4 min-w-[320px] h-44 px-2 border-b border-(--border-main) pb-1">
                              {(() => {
                                const maxVolVal = Math.max(
                                  ...monthOnMonthIncidentVolume.map(m => Math.max(m.ins, m.irs)),
                                  1
                                );

                                return monthOnMonthIncidentVolume.map((m, idx) => {
                                  const insHeight = Math.max(4, Math.round((m.ins / maxVolVal) * 120));
                                  const irsHeight = Math.max(4, Math.round((m.irs / maxVolVal) * 120));
                                  const isSelected = selectedMonthKey === m.monthKey;

                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => setSelectedMonthKey(isSelected ? null : m.monthKey)}
                                      className={`flex flex-col items-center flex-1 h-full justify-end group relative transition-all rounded-lg p-1 cursor-pointer ${
                                        isSelected ? 'bg-purple-500/15 ring-2 ring-purple-500' : 'hover:bg-(--accent-subtle)'
                                      }`}
                                    >
                                      <div className="absolute left-1/2 -translate-x-1/2 top-2 hidden group-hover:flex flex-col bg-(--bg-elevated)/90 backdrop-blur-sm border border-(--border-main) p-2 rounded shadow-lg text-[10px] z-30 whitespace-nowrap pointer-events-none space-y-0.5">
                                        <span className="font-bold text-(--text-primary)">{m.monthLabel}</span>
                                        <span className="text-emerald-500">INS (Inspections): {m.ins.toLocaleString()}</span>
                                        <span className="text-purple-500">IRS (Incidents): {m.irs.toLocaleString()}</span>
                                        <span className="text-blue-500 font-bold">Total: {m.total.toLocaleString()}</span>
                                        <span className="text-[9px] text-(--text-muted) italic mt-1">Click to filter KPIs</span>
                                      </div>

                                      <div className="flex items-end justify-center gap-1 w-full max-w-20 h-32 px-1">
                                        <div 
                                          className="w-3.5 bg-emerald-500 rounded-t-sm transition-all duration-300 hover:opacity-90" 
                                          style={{ height: `${insHeight}px` }}
                                          title={`INS: ${m.ins}`}
                                        ></div>
                                        <div 
                                          className="w-3.5 bg-purple-500 rounded-t-sm transition-all duration-300 hover:opacity-90" 
                                          style={{ height: `${irsHeight}px` }}
                                          title={`IRS: ${m.irs}`}
                                        ></div>
                                      </div>

                                      <span className={`text-[10px] font-bold mt-2 truncate w-full text-center ${
                                        isSelected ? 'text-purple-600 dark:text-purple-400 font-black underline' : 'text-(--text-muted)'
                                      }`}>
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

                      {/* 2. Clickable KPI Cards - Dynamically Filtered */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          onClick={() => { setRcaSourceFilter('ALL'); setSelectedPillarDrilldown(null); }}
                          className={`p-3.5 rounded-xl text-left transition-all cursor-pointer shadow-xs border ${
                            rcaSourceFilter === 'ALL'
                              ? 'bg-purple-500/20 border-purple-500 ring-2 ring-purple-500/30'
                              : 'bg-(--bg-surface) border-(--border-main) hover:border-purple-500/50'
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase text-(--text-muted)">
                            Total Recorded Incidents & Risks {selectedMonthKey ? `(${monthOnMonthIncidentVolume.find(m => m.monthKey === selectedMonthKey)?.monthLabel})` : '(Full Period)'}
                          </div>
                          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">
                            {hierarchicalRcaBreakdown.totalCount} Events
                          </div>
                          <div className="text-[10px] text-(--text-muted) mt-1 italic">&larr; Click to view all sources</div>
                        </button>

                        <button
                          onClick={() => { setRcaSourceFilter('IRS'); setSelectedPillarDrilldown(null); }}
                          className={`p-3.5 rounded-xl text-left transition-all cursor-pointer shadow-xs border ${
                            rcaSourceFilter === 'IRS'
                              ? 'bg-purple-500/20 border-purple-500 ring-2 ring-purple-500/30'
                              : 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/50'
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" /> IRS (Incident Reports) {selectedMonthKey ? `(${monthOnMonthIncidentVolume.find(m => m.monthKey === selectedMonthKey)?.monthLabel})` : ''}
                          </div>
                          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">
                            {hierarchicalRcaBreakdown.irsTotal} Incidents
                          </div>
                          <div className="text-[10px] text-purple-600/80 mt-1 italic">&larr; Click to filter IRS only</div>
                        </button>

                        <button
                          onClick={() => { setRcaSourceFilter('INS'); setSelectedPillarDrilldown(null); }}
                          className={`p-3.5 rounded-xl text-left transition-all cursor-pointer shadow-xs border ${
                            rcaSourceFilter === 'INS'
                              ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30'
                              : 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50'
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> INS (Daily Inspections) {selectedMonthKey ? `(${monthOnMonthIncidentVolume.find(m => m.monthKey === selectedMonthKey)?.monthLabel})` : ''}
                          </div>
                          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                            {hierarchicalRcaBreakdown.insTotal} Inspection Risks
                          </div>
                          <div className="text-[10px] text-emerald-600/80 mt-1 italic">&larr; Click to filter INS only</div>
                        </button>
                      </div>

                      {/* 3. RCA 4-Pillar Breakdown & Enterprise Data Table */}
                      <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-4 shadow-xs">
                        <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                          <div className="flex items-center gap-2">
                            <PieIcon className="w-4 h-4 text-purple-500" />
                            <h3 className="text-xs font-extrabold uppercase tracking-wide text-(--text-primary)">
                              RCA 4-Pillar Breakdown & Enterprise Data Table ({rcaSourceFilter === 'ALL' ? 'All Sources' : rcaSourceFilter}) {selectedMonthKey ? `- ${monthOnMonthIncidentVolume.find(m => m.monthKey === selectedMonthKey)?.monthLabel}` : ''}
                            </h3>
                          </div>

                          {selectedPillarDrilldown && (
                            <button
                              onClick={() => setSelectedPillarDrilldown(null)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-(--bg-elevated) border border-(--border-main) text-xs font-bold rounded-lg text-purple-600 hover:opacity-85 cursor-pointer shadow-xs"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Clear Drilldown</span>
                            </button>
                          )}
                        </div>

                        {hierarchicalRcaBreakdown.pillars.length === 0 ? (
                          <div className="p-6 text-center text-xs text-(--text-muted)">
                            No incident or inspection risk records found matching the active filter.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                            {/* Pie Chart View on Left */}
                            <div className="lg:col-span-5 p-4 bg-(--bg-elevated) border border-(--border-main) rounded-xl flex flex-col items-center justify-center space-y-4">
                              <div className="text-xs font-bold uppercase text-(--text-muted) tracking-wider">
                                4 RCA Pillars Distribution Pie Chart
                              </div>

                              {/* CSS Conic Gradient Pie Chart */}
                              {(() => {
                                const subtotal = hierarchicalRcaBreakdown.filteredTotalCount || 1;
                                let cumulative = 0;
                                const colors = ['#f43f5e', '#a855f7', '#3b82f6', '#f59e0b'];

                                const gradientStops = hierarchicalRcaBreakdown.pillars.map((p, idx) => {
                                  const start = cumulative;
                                  const pct = (p.totalCount / subtotal) * 100;
                                  cumulative += pct;
                                  const color = colors[idx % colors.length];
                                  return `${color} ${start}% ${cumulative}%`;
                                }).join(', ');

                                return (
                                  <div className="relative w-44 h-44 rounded-full shadow-inner flex items-center justify-center border-4 border-(--border-main)" style={{ background: `conic-gradient(${gradientStops})` }}>
                                    <div className="w-24 h-24 bg-(--bg-surface) rounded-full flex flex-col items-center justify-center shadow-md">
                                      <span className="text-[10px] uppercase font-bold text-(--text-muted)">{rcaSourceFilter === 'ALL' ? 'Total' : rcaSourceFilter}</span>
                                      <span className="text-lg font-black font-mono text-(--text-primary)">{hierarchicalRcaBreakdown.filteredTotalCount}</span>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Pie Legend & Clickable Slices */}
                              <div className="w-full space-y-1.5 pt-2">
                                {hierarchicalRcaBreakdown.pillars.map((pillar, idx) => {
                                  const subtotal = hierarchicalRcaBreakdown.filteredTotalCount;
                                  const pct = subtotal > 0 
                                    ? Math.round((pillar.totalCount / subtotal) * 100) 
                                    : 0;
                                  const colors = ['bg-rose-500', 'bg-purple-500', 'bg-blue-500', 'bg-amber-500'];
                                  const isSelected = selectedPillarDrilldown === pillar.pillarName;

                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => setSelectedPillarDrilldown(pillar.pillarName)}
                                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all cursor-pointer border ${
                                        isSelected 
                                          ? 'bg-purple-500/20 border-purple-500 font-bold' 
                                          : 'bg-(--bg-surface) border-(--border-main) hover:border-purple-500/50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`}></span>
                                        <span className="text-(--text-primary) text-left truncate max-w-44">{pillar.pillarName}</span>
                                      </div>
                                      <div className="flex items-center gap-2 font-mono">
                                        <span className="text-(--text-muted)">{pillar.totalCount} ({pct}%)</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-purple-500" />
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Enterprise Data Table on Right */}
                            <div className="lg:col-span-7 space-y-3">
                              <div className="p-3 bg-(--bg-elevated) rounded-xl border border-(--border-main) flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <TableIcon className="w-4 h-4 text-purple-500" />
                                  <span className="font-bold text-(--text-primary)">
                                    Category Table View: <strong className="text-purple-600">{selectedPillarDrilldown || 'All Pillars'}</strong>
                                  </span>
                                </div>
                                <span className="font-mono text-[10px] text-(--text-muted)">
                                  Sorted by Frequency
                                </span>
                              </div>

                              <div className="border border-(--border-main) rounded-xl bg-(--bg-elevated) overflow-hidden shadow-xs">
                                <div className="max-h-96 overflow-y-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-(--bg-surface) text-[10px] uppercase text-(--text-muted) sticky top-0 border-b border-(--border-main)">
                                      <tr>
                                        <th className="p-2.5">Pillar / Category</th>
                                        <th className="p-2.5">Description</th>
                                        <th className="p-2.5 text-center">INS</th>
                                        <th className="p-2.5 text-center">IRS</th>
                                        <th className="p-2.5 text-right">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-(--border-main)">
                                      {(() => {
                                        const pillarsToDisplay = selectedPillarDrilldown
                                          ? hierarchicalRcaBreakdown.pillars.filter(p => p.pillarName === selectedPillarDrilldown)
                                          : hierarchicalRcaBreakdown.pillars;

                                        const allRows: { pillarName: string; code: string; desc: string; insCount: number; irsCount: number; totalCount: number }[] = [];
                                        
                                        pillarsToDisplay.forEach(p => {
                                          p.categoriesList.forEach(c => {
                                            allRows.push({
                                              pillarName: p.pillarName,
                                              code: c.code,
                                              desc: c.desc,
                                              insCount: c.insCount,
                                              irsCount: c.irsCount,
                                              totalCount: c.totalCount
                                            });
                                          });
                                        });

                                        if (allRows.length === 0) {
                                          return (
                                            <tr>
                                              <td colSpan={5} className="p-6 text-center text-(--text-muted)">
                                                No category breakdown data available for this selection.
                                              </td>
                                            </tr>
                                          );
                                        }

                                        return allRows.map((row, idx) => (
                                          <tr key={idx} className="hover:bg-(--accent-subtle)">
                                            <td className="p-2.5">
                                              <div className="font-bold text-(--text-primary)">{row.pillarName}</div>
                                              <span className="font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded text-[10px]">
                                                {row.code}
                                              </span>
                                            </td>
                                            <td className="p-2.5 text-(--text-secondary)">{row.desc}</td>
                                            <td className="p-2.5 text-center font-mono text-emerald-600 font-semibold">{row.insCount}</td>
                                            <td className="p-2.5 text-center font-mono text-purple-600 font-semibold">{row.irsCount}</td>
                                            <td className="p-2.5 text-right font-mono font-black text-rose-600">{row.totalCount}</td>
                                          </tr>
                                        ));
                                      })()}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MAIN TAB 2: Asset Reliability & Component Ops */}
              {activeMainTab === 'reliability' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-(--border-main) pb-2 text-xs font-bold overflow-x-auto">
                    <button
                      onClick={() => setReliabilitySubTab('bad_actors')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        reliabilitySubTab === 'bad_actors'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'text-(--text-muted) hover:text-(--text-primary)'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Fleet Bad Actor Scorecard</span>
                    </button>

                    <button
                      onClick={() => setReliabilitySubTab('reliability')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        reliabilitySubTab === 'reliability'
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                          : 'text-(--text-muted) hover:text-(--text-primary)'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Component Reliability & System Analytics</span>
                    </button>
                  </div>

                  {reliabilitySubTab === 'bad_actors' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="bg-(--bg-surface) border border-(--border-main) rounded-xl p-3.5 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-rose-500 shrink-0" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-(--text-primary)">
                              Bad Actor Score Gauge Formula & Guide
                            </h3>
                          </div>
                          <button
                            onClick={() => setShowBadActorGuide(!showBadActorGuide)}
                            className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer"
                          >
                            {showBadActorGuide ? 'Collapse Guide' : 'Expand Guide'}
                          </button>
                        </div>

                        {showBadActorGuide && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs border-t border-(--border-main)">
                            <div className="space-y-1 bg-(--bg-elevated) p-2.5 rounded-lg border border-(--border-main)">
                              <div className="font-extrabold text-(--text-primary)">1. Total Cost Aggregation</div>
                              <p className="text-[11px] text-(--text-muted) leading-relaxed">
                                Sums all maintenance expenses (Labor + Materials + Contract) within your selected period dates.
                              </p>
                            </div>

                            <div className="space-y-1 bg-(--bg-elevated) p-2.5 rounded-lg border border-(--border-main)">
                              <div className="font-extrabold text-rose-600">2. Score Normalization</div>
                              <p className="text-[11px] text-(--text-muted) leading-relaxed">
                                Score = min(Total Cost / 1000, 100). Scales repair expenses per &#8369;1,000 capped at 100 max points.
                              </p>
                            </div>

                            <div className="space-y-1 bg-(--bg-elevated) p-2.5 rounded-lg border border-(--border-main)">
                              <div className="font-extrabold text-amber-600">3. Risk Tiers</div>
                              <p className="text-[11px] text-(--text-muted) leading-relaxed">
                                High Risk (&ge; &#8369;50k cost), Medium Risk (&#8369;20k – &#8369;50k), and Low Risk (&lt; &#8369;20k).
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Month-on-Month Fleet Repair Cost vs Incident Financial Loss Vertical Bar Chart */}
                      <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-main) pb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-500" />
                            <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                              Month-on-Month Fleet Repair Expense vs. Financial Loss
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-500 rounded-xs inline-block"></span>Fleet Repair Expense</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-xs inline-block"></span>Incident Financial Loss</span>
                            {selectedBadActorMonthKey && (
                              <button
                                onClick={() => setSelectedBadActorMonthKey(null)}
                                className="ml-2 px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded font-bold text-[10px] hover:bg-rose-500/20 cursor-pointer"
                              >
                                Clear Month Filter
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-(--text-muted)">
                          {selectedBadActorMonthKey
                            ? `Currently showing bad actor metrics for: ${monthOnMonthBadActorMetrics.find(m => m.monthKey === selectedBadActorMonthKey)?.monthLabel || selectedBadActorMonthKey}. Click the selected bar to clear.`
                            : `Comparing monthly repair expenses against financial losses. Click a bar to filter scorecard.`}
                        </p>

                        {monthOnMonthBadActorMetrics.length === 0 ? (
                          <div className="py-12 text-center text-xs text-(--text-muted)">No bad actor financial data available for the selected period.</div>
                        ) : (
                          <div className="pt-2 pb-2 overflow-x-auto">
                            <div className="flex items-end justify-around gap-4 min-w-[320px] h-44 px-2 border-b border-(--border-main) pb-1">
                              {(() => {
                                const maxCostVal = Math.max(
                                  ...monthOnMonthBadActorMetrics.map(m => Math.max(m.repairCost, m.financialLoss)),
                                  1000
                                );

                                return monthOnMonthBadActorMetrics.map((m, idx) => {
                                  const repairHeight = Math.max(4, Math.round((m.repairCost / maxCostVal) * 120));
                                  const lossHeight = Math.max(4, Math.round((m.financialLoss / maxCostVal) * 120));
                                  const isSelected = selectedBadActorMonthKey === m.monthKey;

                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => setSelectedBadActorMonthKey(isSelected ? null : m.monthKey)}
                                      className={`flex flex-col items-center flex-1 h-full justify-end group relative transition-all rounded-lg p-1 cursor-pointer ${
                                        isSelected ? 'bg-purple-500/15 ring-2 ring-purple-500' : 'hover:bg-(--accent-subtle)'
                                      }`}
                                    >
                                      <div className="absolute left-1/2 -translate-x-1/2 top-2 hidden group-hover:flex flex-col bg-(--bg-elevated)/90 backdrop-blur-sm border border-(--border-main) p-2 rounded shadow-lg text-[10px] z-30 whitespace-nowrap pointer-events-none space-y-0.5">
                                        <span className="font-bold text-(--text-primary)">{m.monthLabel}</span>
                                        <span className="text-purple-500">Repair Cost: &#8369;{m.repairCost.toLocaleString()}</span>
                                        <span className="text-amber-500">Financial Loss: &#8369;{m.financialLoss.toLocaleString()}</span>
                                        <span className="text-[9px] text-(--text-muted) italic mt-1">Click to filter table</span>
                                      </div>

                                      <div className="flex items-end justify-center gap-1 w-full max-w-20 h-32 px-1">
                                        <div 
                                          className="w-3.5 bg-purple-500 rounded-t-sm transition-all duration-300 hover:opacity-90" 
                                          style={{ height: `${repairHeight}px` }}
                                          title={`Repair Expense: ₱${m.repairCost.toLocaleString()}`}
                                        ></div>
                                        <div 
                                          className="w-3.5 bg-amber-500 rounded-t-sm transition-all duration-300 hover:opacity-90" 
                                          style={{ height: `${lossHeight}px` }}
                                          title={`Incident Loss: ₱${m.financialLoss.toLocaleString()}`}
                                        ></div>
                                      </div>

                                      <span className={`text-[10px] font-bold mt-2 truncate w-full text-center ${
                                        isSelected ? 'text-purple-600 dark:text-purple-400 font-black underline' : 'text-(--text-muted)'
                                      }`}>
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

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 bg-(--bg-surface) border border-(--border-main) rounded-xl shadow-xs">
                          <div className="text-[10px] font-bold uppercase text-(--text-muted)">Bad Actor Assets (&ge;70 Score)</div>
                          <div className="text-2xl font-black text-rose-600 font-mono">
                            {filteredBadActors.filter(b => b.bad_actor_score >= 70).length} Vehicles
                          </div>
                        </div>
                        <div className="p-3.5 bg-(--bg-surface) border border-(--border-main) rounded-xl shadow-xs">
                          <div className="text-[10px] font-bold uppercase text-(--text-muted)">
                            Fleet Repair Expense {selectedBadActorMonthKey ? `(${monthOnMonthBadActorMetrics.find(m => m.monthKey === selectedBadActorMonthKey)?.monthLabel})` : '(Period)'}
                          </div>
                          <div className="text-2xl font-black text-(--text-primary) font-mono">
                            &#8369;{filteredBadActors.reduce((acc, b) => acc + (b.total_maintenance_cost || 0), 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3.5 bg-(--bg-surface) border border-(--border-main) rounded-xl shadow-xs">
                          <div className="text-[10px] font-bold uppercase text-(--text-muted)">Total Financial Impact</div>
                          <div className="text-2xl font-black text-amber-600 font-mono">
                            &#8369;{filteredBadActors.reduce((acc, b) => acc + (b.total_financial_impact || 0), 0).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-(--border-main) rounded-xl bg-(--bg-surface) shadow-xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-(--bg-elevated) text-[10px] uppercase text-(--text-muted) border-b border-(--border-main)">
                            <tr>
                              <th className="p-2.5">Plate No</th>
                              <th className="p-2.5">Make / Model</th>
                              <th className="p-2.5 text-center">Bad Actor Score Gauge</th>
                              <th className="p-2.5 text-center">Risk Tier</th>
                              <th className="p-2.5 text-right">Maintenance Cost</th>
                              <th className="p-2.5 text-right">Incident Loss</th>
                              <th className="p-2.5 text-right">Total Financial Impact</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-(--border-main)">
                            {filteredBadActors.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-4 text-center text-(--text-muted)">
                                  No bad actor vehicle maintenance records found within the selected period.
                                </td>
                              </tr>
                            ) : (
                              filteredBadActors.map((ba, idx) => (
                                <tr key={idx} className="hover:bg-(--accent-subtle)">
                                  <td className="p-2.5 font-bold font-mono text-(--text-primary)">{ba.plate_no}</td>
                                  <td className="p-2.5">{ba.make_name} - {ba.model_name}</td>
                                  <td className="p-2.5 text-center">
                                    <div className="flex items-center gap-2 max-w-35 mx-auto">
                                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full ${ba.bad_actor_score >= 70 ? 'bg-rose-600' : 'bg-amber-500'}`}
                                          style={{ width: `${Math.min(ba.bad_actor_score, 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="font-mono text-[10px] font-bold text-rose-600">{ba.bad_actor_score}</span>
                                    </div>
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">
                                      {ba.risk_tier}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-bold text-(--text-primary)">&#8369;{(ba.total_maintenance_cost || 0).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono text-amber-600">&#8369;{(ba.incident_loss || 0).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono font-black text-rose-600">&#8369;{(ba.total_financial_impact || 0).toLocaleString()}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {reliabilitySubTab === 'reliability' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-(--bg-surface) border border-(--border-main) rounded-xl shadow-xs">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-500 shrink-0" />
                          <div>
                            <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                              1st Level System Selector (Global & Unbounded)
                            </h3>
                            <p className="text-[10px] text-(--text-muted)">Select a system group to filter 2nd-level metrics & table</p>
                          </div>
                        </div>

                        <div className="w-full sm:w-auto min-w-72">
                          <select
                            value={filterSystemGroup}
                            onChange={(e) => setFilterSystemGroup(e.target.value)}
                            className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) text-xs rounded-lg px-3 py-2 focus:outline-none font-semibold cursor-pointer shadow-xs"
                          >
                            <option value="ALL">All Systems ({systemAggregates.reduce((acc, s) => acc + s.count, 0)} components)</option>
                            {systemAggregates.map((sys, idx) => (
                              <option key={idx} value={sys.systemCode}>
                                [{sys.systemCode}] {sys.systemDesc} ({sys.count} components)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <h4 className="text-xs font-bold uppercase tracking-wide text-(--text-primary)">
                            2nd Level KPI Metrics {filterSystemGroup !== 'ALL' ? `for System [${filterSystemGroup}]` : '(All Systems Combined)'}
                          </h4>
                          <span className="text-[10px] text-(--text-muted) font-mono">
                            Unbounded by Date Period
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="p-3 bg-(--bg-surface) border border-(--border-main) rounded-xl shadow-xs space-y-0.5">
                            <div className="text-[9px] font-bold uppercase text-(--text-muted)">Active Sub-Components</div>
                            <div className="text-xl font-black text-(--text-primary) font-mono">
                              {selectedSystemMetrics.totalSubComponents}
                            </div>
                          </div>

                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl shadow-xs space-y-0.5">
                            <div className="text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Total Uninstalled
                            </div>
                            <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                              {selectedSystemMetrics.totalUninstalled}
                            </div>
                          </div>

                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-xs space-y-0.5">
                            <div className="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Total Installed
                            </div>
                            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              {selectedSystemMetrics.totalInstalled}
                            </div>
                          </div>

                          <div className="p-3 bg-(--bg-surface) border border-(--border-main) rounded-xl shadow-xs space-y-0.5">
                            <div className="text-[9px] font-bold uppercase text-(--text-muted)">Total Acquisition Cost</div>
                            <div className="text-xl font-black text-rose-600 font-mono">
                              &#8369;{selectedSystemMetrics.totalAcquisitionCost.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between px-1">
                          <h4 className="text-xs font-bold uppercase tracking-wide text-(--text-primary)">
                            Detailed Component Reliability Table (Decoupled from Period Dates)
                          </h4>
                          <span className="text-[10px] text-(--text-muted)">Showing all component inventory items</span>
                        </div>
                        <div className="overflow-x-auto border border-(--border-main) rounded-xl bg-(--bg-surface) shadow-xs">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-(--bg-elevated) text-[10px] uppercase text-(--text-muted) border-b border-(--border-main)">
                              <tr>
                                <th className="p-2.5">Component Code</th>
                                <th className="p-2.5">System</th>
                                <th className="p-2.5">Description</th>
                                <th className="p-2.5 text-center">Status</th>
                                <th className="p-2.5 text-center">Reinstallations</th>
                                <th className="p-2.5 text-center">Avg Run Interval</th>
                                <th className="p-2.5 text-right">Acquisition Cost</th>
                                <th className="p-2.5 text-right">Cost / Avg Run Interval</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border-main)">
                              {decoupledComponentReliability.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="p-4 text-center text-(--text-muted)">
                                    No component reliability records found.
                                  </td>
                                </tr>
                              ) : (
                                decoupledComponentReliability.map((cr, idx) => {
                                  const avgRun = Number(cr.avg_service_run || 0);
                                  const acqCost = Number(cr.cumulative_component_cost || 0);
                                  const costPerRun = avgRun > 0 ? acqCost / avgRun : 0;

                                  return (
                                    <tr key={idx} className="hover:bg-(--accent-subtle)">
                                      <td className="p-2.5 font-bold font-mono text-rose-600">{cr.equipment_component_code}</td>
                                      <td className="p-2.5 font-semibold text-blue-600 dark:text-blue-400">{cr.system_code}</td>
                                      <td className="p-2.5 text-(--text-primary)">{cr.equipment_component_desc}</td>
                                      <td className="p-2.5 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          cr.installed_status ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                          {cr.installed_status ? 'Installed' : 'Uninstalled'}
                                        </span>
                                      </td>
                                      <td className="p-2.5 text-center font-mono font-bold">{cr.total_replacements}</td>
                                      <td className="p-2.5 text-center font-mono">{cr.avg_service_run ?? 0} hrs/km</td>
                                      <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                                        &#8369;{acqCost.toLocaleString()}
                                      </td>
                                      <td className="p-2.5 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                                        &#8369;{costPerRun.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

export default FMEADashboard;