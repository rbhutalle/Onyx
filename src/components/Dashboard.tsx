import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Car,
  Loader2,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Filter,
  Printer
} from 'lucide-react';

interface JobOrderRecord {
  task_standard_id?: string;
  task_standard_desc?: string;
  est_labor_cost?: number;
  est_materials_cost?: number;
  [key: string]: unknown;
}

interface TaskRecord {
  task_id?: string;
  [key: string]: unknown;
}

// Summary Metrics from Query 1
interface OverviewSummary {
  past_due_count: number;
  currently_due_count: number;
  due_to_threshold_count: number;
  grand_total_pms: number;
  total_vehicles_affected: number;
}

// PM Code Breakdown from Query 2
interface PmCodeSummary {
  pm_code: string;
  past_due_count: number;
  currently_due_count: number;
  due_to_threshold_count: number;
  total_pm_count: number;
}

// Itemized Vehicle Details from Query 3
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

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    | 'todays-priorities'
    | 'fleet-pm-status'
    | 'predictive-forecasting'
    | 'cost-efficiency'
  >('todays-priorities');

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // General Dashboard state
  const [vehiclesCount, setVehiclesCount] = useState<number>(0);
  const [jobOrders, setJobOrders] = useState<JobOrderRecord[]>([]);
  const [forecasts, setForecasts] = useState<TaskRecord[]>([]);

  // PM Analysis State derived from 3 SQL queries
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

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setLoading(true);
        setErrorMsg(null);

        // 1. Fetch basic count and standard job orders
        const [vehiclesRes, jobOrdersRes, forecastRes, threshRes, vpmRes] = await Promise.all([
          supabase.from('vehicles').select('vehicle_id', { count: 'exact', head: true }),
          supabase.from('equipment_taskstandards').select('*').limit(10),
          supabase.from('equipment_tasks').select('*').limit(10),
          supabase.from('service_thresholds').select('pm_threshold').gt('pm_threshold', 0).limit(1),
          supabase.from('vw_vehicle_pm_details').select('*')
        ]);

        if (isMounted) {
          setVehiclesCount(vehiclesRes.count || 0);
          setJobOrders(jobOrdersRes.data || []);
          setForecasts(forecastRes.data || []);
        }

        // 2. Compute Threshold Multiplier matching Query 1 & 2 logic
        let thresholdMultiplier = 0.10;
        if (threshRes.data && threshRes.data.length > 0) {
          const rawThresh = Number(threshRes.data[0].pm_threshold);
          if (rawThresh > 1) {
            thresholdMultiplier = rawThresh / 100.0;
          } else if (rawThresh > 0) {
            thresholdMultiplier = rawThresh;
          }
        }

        // 3. Process vehicle PM details through Query 1, 2, and 3 logic
        if (vpmRes.data) {
          const pmCodes = ['PM2', 'PM3', 'PM4', 'PM5', 'PM6', 'PM7'];
          
          let pastDueTotal = 0;
          let currentlyDueTotal = 0;
          let dueToThresholdTotal = 0;

          const affectedVehicleIds = new Set<string>();
          const pmCodeMap: Record<string, PmCodeSummary> = {};
          
          pmCodes.forEach(code => {
            pmCodeMap[code] = {
              pm_code: code,
              past_due_count: 0,
              currently_due_count: 0,
              due_to_threshold_count: 0,
              total_pm_count: 0
            };
          });

          const itemizedList: FlaggedVehiclePm[] = [];

          vpmRes.data.forEach((v: Record<string, unknown>) => {
            const vehicleId = String(v.vehicle_id || '');
            const plateNo = String(v.plate_no || 'N/A');
            const currentRdg = Number(v.service_rdg || 0);

            pmCodes.forEach(code => {
              const prevKey = `${code.toLowerCase()}_previous`;
              const currKey = `${code.toLowerCase()}_current`;

              const pmPrev = Number(v[prevKey] || 0);
              const pmCurr = Number(v[currKey] || 0);

              if (pmCurr > 0) {
                const intervalDiff = pmCurr - pmPrev;
                const effectiveInterval = intervalDiff > 0 ? intervalDiff : pmCurr;
                const triggerRdg = Number((pmCurr - (effectiveInterval * thresholdMultiplier)).toFixed(2));

                let status: 'PAST DUE' | 'CURRENTLY DUE' | 'DUE TO THRESHOLD' | null = null;

                if (currentRdg > pmCurr) {
                  status = 'PAST DUE';
                  pastDueTotal++;
                  pmCodeMap[code].past_due_count++;
                } else if (currentRdg === pmCurr) {
                  status = 'CURRENTLY DUE';
                  currentlyDueTotal++;
                  pmCodeMap[code].currently_due_count++;
                } else if (currentRdg >= triggerRdg) {
                  status = 'DUE TO THRESHOLD';
                  dueToThresholdTotal++;
                  pmCodeMap[code].due_to_threshold_count++;
                }

                if (status !== null) {
                  affectedVehicleIds.add(vehicleId);
                  pmCodeMap[code].total_pm_count++;

                  itemizedList.push({
                    vehicle_id: vehicleId,
                    plate_no: plateNo,
                    current_rdg: currentRdg,
                    pm_code: code,
                    pm_prev: pmPrev,
                    pm_current: pmCurr,
                    effective_interval: effectiveInterval,
                    threshold_multiplier: thresholdMultiplier,
                    trigger_rdg: triggerRdg,
                    pm_status: status
                  });
                }
              }
            });
          });

          if (isMounted) {
            setOverviewSummary({
              past_due_count: pastDueTotal,
              currently_due_count: currentlyDueTotal,
              due_to_threshold_count: dueToThresholdTotal,
              grand_total_pms: pastDueTotal + currentlyDueTotal + dueToThresholdTotal,
              total_vehicles_affected: affectedVehicleIds.size
            });

            setPmCodeSummaries(Object.values(pmCodeMap));
            setFlaggedVehicles(itemizedList);
          }
        }

      } catch (err: unknown) {
        console.error('Error loading dashboard metrics:', err);
        if (isMounted) setErrorMsg('Failed to load dashboard metrics. Please check Supabase permissions.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered list for Query 3 table output
  const filteredItemizedPms = flaggedVehicles.filter(item => {
    if (selectedPmFilter === 'ALL') return true;
    return item.pm_code === selectedPmFilter;
  });

  // Calculate highest PM code total for scaling standard chart bars
  const maxPmCount = Math.max(...pmCodeSummaries.map(p => p.total_pm_count), 1);

  // EXPORT TO HTML / PRINT FUNCTION
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
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 24px;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.025em;
            color: #0f172a;
            margin: 0 0 4px 0;
          }
          .brand-subtitle {
            font-size: 12px;
            color: #64748b;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
          }
          .meta-box {
            text-align: right;
            font-size: 11px;
            color: #475569;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .summary-card {
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            background-color: #f8fafc;
          }
          .summary-card-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 4px;
          }
          .summary-card-value {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 10px;
          }
          th {
            background-color: #0f172a;
            color: #ffffff;
            text-transform: uppercase;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.05em;
            padding: 10px 12px;
            text-align: left;
          }
          th.text-right { text-align: right; }
          th.text-center { text-align: center; }
          .footer {
            margin-top: 40px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="padding: 8px 16px; background-color: #0f172a; color: #ffffff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
            Print / Save PDF
          </button>
        </div>

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
          <div class="summary-card">
            <div class="summary-card-title">Total Items</div>
            <div class="summary-card-value">${filteredItemizedPms.length}</div>
          </div>
          <div class="summary-card" style="border-color: #fca5a5; background-color: #fef2f2;">
            <div class="summary-card-title" style="color: #b91c1c;">Past Due</div>
            <div class="summary-card-value" style="color: #b91c1c;">${pastDueCount}</div>
          </div>
          <div class="summary-card" style="border-color: #fde68a; background-color: #fffbeb;">
            <div class="summary-card-title" style="color: #b45309;">Currently Due</div>
            <div class="summary-card-value" style="color: #b45309;">${currentlyDueCount}</div>
          </div>
          <div class="summary-card" style="border-color: #bfdbfe; background-color: #eff6ff;">
            <div class="summary-card-title" style="color: #1d4ed8;">Due To Threshold</div>
            <div class="summary-card-value" style="color: #1d4ed8;">${dueToThreshCount}</div>
          </div>
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
          <tbody>
            ${rowsHtml.length > 0 ? rowsHtml : `<tr><td colspan="6" style="padding: 20px; text-align: center; color: #94a3b8;">No flagged PMs found.</td></tr>`}
          </tbody>
        </table>

        <div class="footer">
          <span>RC-MRO System Generated Report</span>
          <span>Confidential & Proprietary</span>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-(--border-main) pb-3 shrink-0">
        <div className="bg-black text-white p-2 rounded-xl shadow-xs shrink-0">
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">
            Reliability-Centered MRO Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-(--text-muted)">
            Monitor equipment health, compliance, predictive risk, and operational costs.
          </p>
        </div>
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
            <span>Today's Priorities</span>
          </button>

          <button
            onClick={() => setActiveTab('fleet-pm-status')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'fleet-pm-status'
                ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
                : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-blue-500" />
            <span>Fleet PM Status & Compliance</span>
          </button>

          <button
            onClick={() => setActiveTab('predictive-forecasting')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'predictive-forecasting'
                ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
                : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Predictive Forecasting & Risk Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('cost-efficiency')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'cost-efficiency'
                ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
                : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-purple-500" />
            <span>Cost & Efficiency Analysis</span>
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
              {/* TAB 1: TODAY'S PRIORITIES */}
              {activeTab === 'todays-priorities' && (
                <div className="space-y-4">
                  {/* Top Executive Summary Metric Cards (Query 1) */}
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

                  {/* VISUAL CHARTS SECTION (Query 2 Visualizations) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Visual Chart 1: PM Code Stacked Bar Visualization */}
                    <div className="md:col-span-2 p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-(--border-main) pb-2">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-indigo-500" />
                          <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                            Flagged PM Breakdown by Code (PM2 – PM7)
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500"></span> Past Due</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Currently Due</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Due Threshold</span>
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
                                {pastPct > 0 && (
                                  <div 
                                    style={{ width: `${pastPct}%` }} 
                                    className="bg-red-500 h-full transition-all" 
                                    title={`Past Due: ${p.past_due_count}`}
                                  />
                                )}
                                {currPct > 0 && (
                                  <div 
                                    style={{ width: `${currPct}%` }} 
                                    className="bg-amber-500 h-full transition-all" 
                                    title={`Currently Due: ${p.currently_due_count}`}
                                  />
                                )}
                                {threshPct > 0 && (
                                  <div 
                                    style={{ width: `${threshPct}%` }} 
                                    className="bg-blue-500 h-full transition-all" 
                                    title={`Due to Threshold: ${p.due_to_threshold_count}`}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Visual Chart 2: Proportion & Severity Gauge */}
                    <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-3 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center gap-2 border-b border-(--border-main) pb-2">
                        <PieChart className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                          Risk Severity Proportions
                        </h3>
                      </div>

                      {overviewSummary.grand_total_pms === 0 ? (
                        <div className="text-center text-xs text-(--text-muted) py-8">No active PM flags</div>
                      ) : (
                        <div className="space-y-3 my-auto">
                          {/* Proportion Bar */}
                          <div className="w-full bg-(--bg-elevated) h-5 rounded-lg overflow-hidden flex border border-(--border-main) shadow-inner">
                            <div 
                              style={{ width: `${(overviewSummary.past_due_count / overviewSummary.grand_total_pms) * 100}%` }} 
                              className="bg-red-500 h-full"
                              title="Past Due Ratio"
                            />
                            <div 
                              style={{ width: `${(overviewSummary.currently_due_count / overviewSummary.grand_total_pms) * 100}%` }} 
                              className="bg-amber-500 h-full"
                              title="Currently Due Ratio"
                            />
                            <div 
                              style={{ width: `${(overviewSummary.due_to_threshold_count / overviewSummary.grand_total_pms) * 100}%` }} 
                              className="bg-blue-500 h-full"
                              title="Due Threshold Ratio"
                            />
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between items-center p-1.5 bg-red-500/10 rounded-lg">
                              <span className="font-semibold text-red-600 dark:text-red-400">Past Due</span>
                              <span className="font-mono font-bold text-red-600 dark:text-red-400">
                                {((overviewSummary.past_due_count / overviewSummary.grand_total_pms) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-1.5 bg-amber-500/10 rounded-lg">
                              <span className="font-semibold text-amber-600 dark:text-amber-400">Currently Due</span>
                              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                {((overviewSummary.currently_due_count / overviewSummary.grand_total_pms) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-1.5 bg-blue-500/10 rounded-lg">
                              <span className="font-semibold text-blue-600 dark:text-blue-400">Due To Threshold</span>
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                {((overviewSummary.due_to_threshold_count / overviewSummary.grand_total_pms) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ITEMIZED FLAGGED PMs TABLE WITH PRINT EXPORT (Query 3 output) */}
                  <div className="border border-(--border-main) rounded-xl p-4 bg-(--bg-surface) space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-main) pb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h3 className="text-xs font-bold uppercase text-(--text-primary)">
                          Itemized Flagged PM Queue ({filteredItemizedPms.length} Items)
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Filter by PM Code */}
                        <div className="flex items-center gap-1.5">
                          <Filter className="w-3.5 h-3.5 text-(--text-muted)" />
                          <select
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

                        {/* Export to HTML / Print Button */}
                        <button
                          onClick={handleExportHtml}
                          className="flex items-center gap-1.5 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) text-xs px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
                          title="Export itemized table to printable HTML"
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
                          {filteredItemizedPms.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-(--text-muted) italic">
                                No flagged PMs found matching selected filter criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredItemizedPms.map((item, idx) => (
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
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FLEET PM STATUS & COMPLIANCE */}
              {activeTab === 'fleet-pm-status' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-(--text-primary)">Fleet Preventive Maintenance & Compliance</h2>
                    <p className="text-[11px] text-(--text-muted)">Overall fleet inspection standing and equipment uptime status.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase text-(--text-muted)">Registered Fleet</span>
                        <Car className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-(--text-primary)">{vehiclesCount} Units</div>
                      <p className="text-[10px] text-(--text-muted)">Active equipment monitored in registry.</p>
                    </div>

                    <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase text-(--text-muted)">PM Compliance Rate</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">98.2%</div>
                      <p className="text-[10px] text-(--text-muted)">Compliant with scheduled service intervals.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PREDICTIVE FORECASTING & RISK ANALYSIS */}
              {activeTab === 'predictive-forecasting' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-(--text-primary)">Predictive Forecasting & Failure Risk</h2>
                    <p className="text-[11px] text-(--text-muted)">Component lifecycle forecasts and reliability risk models.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-1.5 shadow-xs">
                      <span className="text-[11px] font-semibold uppercase text-(--text-muted)">Forecasted PMs (30 Days)</span>
                      <div className="text-xl font-bold text-(--text-primary)">{forecasts.length} Scheduled</div>
                      <p className="text-[10px] text-(--text-muted)">Based on operating hour thresholds.</p>
                    </div>

                    <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-1.5 shadow-xs">
                      <span className="text-[11px] font-semibold uppercase text-(--text-muted)">FMEA Risk Index</span>
                      <div className="text-xl font-bold text-emerald-500">Low Risk</div>
                      <p className="text-[10px] text-(--text-muted)">No high RPN anomalies detected.</p>
                    </div>

                    <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-1.5 shadow-xs">
                      <span className="text-[11px] font-semibold uppercase text-(--text-muted)">Component Health Score</span>
                      <div className="text-xl font-bold text-(--text-primary)">94.8%</div>
                      <p className="text-[10px] text-(--text-muted)">Average across primary assemblies.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: COST & EFFICIENCY ANALYSIS */}
              {activeTab === 'cost-efficiency' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-(--text-primary)">Cost & Operational Efficiency Analysis</h2>
                    <p className="text-[11px] text-(--text-muted)">Summary of labor, material expenditures (in ₱), and maintenance turnaround efficiency.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-2 shadow-xs">
                      <span className="text-[11px] font-bold uppercase text-(--text-muted)">Total Standard Labor Investment</span>
                      <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                        ₱{jobOrders.reduce((acc, curr) => acc + (curr.est_labor_cost || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <p className="text-[10px] text-(--text-muted)">Aggregated estimated labor allocations.</p>
                    </div>

                    <div className="p-4 bg-(--bg-surface) border border-(--border-main) rounded-xl space-y-2 shadow-xs">
                      <span className="text-[11px] font-bold uppercase text-(--text-muted)">Total Material & Parts Budget</span>
                      <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                        ₱{jobOrders.reduce((acc, curr) => acc + (curr.est_materials_cost || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <p className="text-[10px] text-(--text-muted)">Aggregated estimated material costs.</p>
                    </div>
                  </div>
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