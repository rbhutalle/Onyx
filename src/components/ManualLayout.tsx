import { useEffect, useState, useCallback } from 'react';
import { Search, Printer, ExternalLink, Cpu, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StageCard } from './manual/StageCard';
import { InteractiveFmeaCalculator } from './manual/InteractiveFmeaCalculator';
import { LightboxModal } from './manual/LightboxModal';

export function Manual() {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const openLightbox = useCallback((src: string) => {
    setLightboxSrc(src);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxSrc(null);
  }, []);

  // Scroll progress bar & Scrollspy setup
  useEffect(() => {
    const progressBar = document.getElementById('readingProgress');
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      if (progressBar) progressBar.style.width = `${scrolled}%`;

      const btnBackToTop = document.getElementById('btnBackToTop');
      if (btnBackToTop) {
        if (window.scrollY > 400) {
          btnBackToTop.classList.remove('opacity-0', 'invisible');
          btnBackToTop.classList.add('opacity-100', 'visible');
        } else {
          btnBackToTop.classList.remove('opacity-100', 'visible');
          btnBackToTop.classList.add('opacity-0', 'invisible');
        }
      }

      const stages = document.querySelectorAll('section[id^="stage-"], div[id^="how-to-"]');
      const navLinks = document.querySelectorAll('.sidebar-link');
      let currentStageId = '';
      stages.forEach((stage) => {
        const stageTop = (stage as HTMLElement).offsetTop - 120;
        if (window.scrollY >= stageTop) {
          currentStageId = stage.getAttribute('id') || '';
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove('active', 'bg-blue-600/20', 'text-blue-400', 'border-blue-500/30');
        if (link.getAttribute('href') === `#${currentStageId}`) {
          link.classList.add('active', 'bg-blue-600/20', 'text-blue-400', 'border-blue-500/30');
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Live search filter with robust optional chaining & string fallbacks
    const searchInput = document.getElementById('manualSearchInput') as HTMLInputElement;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (searchInput && e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      } else if (e.key === 'Escape') {
        if (document.activeElement === searchInput) searchInput.blur();
        closeLightbox();
      }
    };

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const term = ((e.target as HTMLInputElement)?.value ?? '').toLowerCase().trim();
        const actionSteps = document.querySelectorAll('section, .screenshot-card, article');
        if (!term) {
          actionSteps.forEach((el) => {
            (el as HTMLElement).style.opacity = '1';
            (el as HTMLElement).style.transition = 'opacity 0.3s ease';
          });
          return;
        }
        actionSteps.forEach((el) => {
          const text = ((el as HTMLElement)?.innerText ?? '').toLowerCase();
          (el as HTMLElement).style.transition = 'opacity 0.3s ease';
          if (text.includes(term)) {
            (el as HTMLElement).style.opacity = '1';
          } else {
            (el as HTMLElement).style.opacity = '0.2';
          }
        });
      });
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeLightbox]);

  return (
    <div className="h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3 text-(--text-primary) font-sans antialiased relative overflow-x-hidden scroll-smooth">
      {/* Top Reading Progress Bar */}
      <div id="readingProgress" className="fixed top-16 left-0 h-1 w-0 bg-linear-to-r from-blue-500 via-cyan-400 to-emerald-500 z-55 transition-all duration-150 shadow-[0_0_12px_rgba(59,130,246,0.8)]"></div>

      {/* Top Fixed Header */}
      <header className="shrink-0 fixed top-0 left-0 right-0 h-16 bg-(--bg-surface)/90 backdrop-blur-xl border-b border-(--border-main) z-50 flex items-center justify-between px-7 shadow-lg">
        <Link to="/" className="flex items-center gap-3 no-underline opacity-90 hover:opacity-100 transition-all hover:scale-[1.02]">
          <div className="w-9.5 h-9.5 bg-linear-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.45)] border border-white/20 transition-transform duration-300 hover:rotate-6">
            <Cpu className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-(--text-primary)">Reliability-Centered MRO</div>
            <div className="text-[0.72rem] font-bold text-cyan-400 uppercase tracking-widest">Solutions Manual</div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-(--text-muted) pointer-events-none" />
            <input
              type="text"
              id="manualSearchInput"
              placeholder="Search manual steps..."
              autoComplete="off"
              className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) px-3.5 py-2 pl-9 rounded-xl text-xs w-60 focus:outline-none focus:border-blue-500 focus:w-80 transition-all duration-300 shadow-xs placeholder:text-(--text-muted)"
            />
            <span className="absolute right-2.5 text-[0.7rem] font-mono bg-white/10 text-(--text-muted) px-1.5 py-0.5 rounded border border-white/5 pointer-events-none">/</span>
          </div>

          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 bg-(--bg-elevated) text-(--text-muted) border border-(--border-main) px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-(--accent-subtle) hover:text-(--text-primary) transition-all duration-200 cursor-pointer shadow-xs hover:scale-105 active:scale-95">
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>

          <Link to="/" className="inline-flex items-center gap-1.5 bg-linear-to-br from-blue-600 to-blue-700 text-white border border-white/15 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:from-blue-700 hover:to-blue-800 transition-all duration-200 no-underline hover:scale-105 active:scale-95">
            Launch App
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 pt-16">
        {/* Sidebar Navigation */}
        <aside className="shrink-0 w-80 fixed top-16 bottom-0 left-0 bg-(--bg-surface)/80 backdrop-blur-2xl border-r border-(--border-main) overflow-y-auto p-6 z-40 hidden lg:block shadow-xl">
          <div className="text-[0.7rem] font-extrabold uppercase tracking-widest text-(--text-muted) mb-3 px-2">End-to-End Transaction Flow</div>
          <ul className="list-none flex flex-col gap-1.5">
            <li><a href="#stage-1" className="sidebar-link active flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-white/5 text-xs font-semibold transition-all duration-200 border border-transparent"><span className="stage-badge text-[0.65rem] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">STAGE 1</span> Asset &amp; Staff Onboarding</a></li>
            <li><a href="#stage-2" className="sidebar-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-white/5 text-xs font-semibold transition-all duration-200 border border-transparent"><span className="stage-badge text-[0.65rem] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">STAGE 2</span> Daily Telemetry Capture</a></li>
            <li><a href="#stage-9" className="sidebar-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-white/5 text-xs font-semibold transition-all duration-200 border border-transparent"><span className="stage-badge text-[0.65rem] font-extrabold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">STAGE 9</span> End-to-End Workflow</a></li>
            <li><a href="#stage-3" className="sidebar-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-white/5 text-xs font-semibold transition-all duration-200 border border-transparent"><span className="stage-badge text-[0.65rem] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">STAGE 3</span> Preventive Maintenance PM2–7</a></li>
            <li><a href="#stage-4" className="sidebar-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-white/5 text-xs font-semibold transition-all duration-200 border border-transparent"><span className="stage-badge text-[0.65rem] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">STAGE 4</span> 12-Month Predictive Forecast</a></li>
            <li><a href="#stage-5" className="sidebar-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-white/5 text-xs font-semibold transition-all border border-transparent"><span className="stage-badge text-[0.65rem] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">STAGE 5</span> Job Order &amp; Cost Rollup</a></li>
            <li><a href="#stage-6" className="sidebar-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-white/5 text-xs font-semibold transition-all border border-transparent"><span className="stage-badge text-[0.65rem] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">STAGE 6</span> Component Provenance &amp; Scrap</a></li>
            <li><a href="#stage-7" className="sidebar-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-white/5 text-xs font-semibold transition-all border border-transparent"><span className="stage-badge text-[0.65rem] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">STAGE 7</span> Incident Mgmt &amp; 4-Pillar RCA</a></li>
            <li><a href="#stage-8" className="sidebar-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-white/5 text-xs font-semibold transition-all border border-transparent"><span className="stage-badge text-[0.65rem] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">STAGE 8</span> System Architecture Explainer</a></li>
            <li><a href="#how-to-operationalize-fmea" className="sidebar-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-white/5 text-xs font-semibold transition-all border border-transparent"><span className="stage-badge text-[0.65rem] font-extrabold px-1.5 py-0.5 rounded bg-blue-600/25 text-blue-400 border border-blue-500/40">GUIDE</span> Operationalizing FMEA</a></li>
          </ul>
        </aside>

        {/* Main Content Body */}
        <main className="flex flex-col flex-1 min-h-0 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-y-auto space-y-6 lg:ml-80 scroll-smooth">
          {/* Document Hero */}
          <section className="shrink-0 bg-linear-to-br from-blue-600/15 via-cyan-500/10 to-purple-500/5 border border-slate-700/60 rounded-3xl p-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/40 text-blue-200 rounded-full text-[0.72rem] font-bold uppercase tracking-wider mb-4 shadow-sm animate-pulse">
              Operations Manual • Visual Transaction Workflow
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-(--text-primary) mb-3 leading-tight">End-to-End MRO Transaction Guide</h1>
            <p className="text-(--text-muted) text-base max-w-4xl leading-relaxed">
              This manual follows the exact operational sequence of fleet maintenance, repair, and overhaul in RC-MRO. Each section includes live application screenshots, input specifications, calculation rules, and database procedure mechanics.
            </p>
          </section>

          {/* Visual Transaction Stepper */}
          <nav className="shrink-0 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 bg-(--bg-card)/80 backdrop-blur-md border border-(--border-main) rounded-2xl p-4 shadow-xl">
            {[
              { id: 'stage-1', num: '1', label: 'Asset & Staff' },
              { id: 'stage-2', num: '2', label: 'Daily Telemetry' },
              { id: 'stage-9', num: '9', label: 'Workflow Loop' },
              { id: 'stage-3', num: '3', label: 'PM Monitoring' },
              { id: 'stage-4', num: '4', label: 'Predictive Plan' },
              { id: 'stage-5', num: '5', label: 'Job Costing' },
              { id: 'stage-6', num: '6', label: 'Component Cycle' },
              { id: 'stage-7', num: '7', label: 'Safety & RCA' },
            ].map((st) => (
              <a key={st.id} href={`#${st.id}`} className="transaction-stage bg-(--bg-surface) border border-(--border-main) rounded-xl p-3 text-center no-underline transition-all duration-300 hover:bg-(--bg-card-hover) hover:border-blue-500 hover:-translate-y-1.5 shadow-md flex flex-col items-center gap-1 group">
                <span className="text-[0.65rem] font-extrabold text-blue-400 uppercase tracking-widest group-hover:scale-110 transition-transform">Stage {st.num}</span>
                <span className="text-[0.7rem] font-bold text-(--text-primary) truncate w-full">{st.label}</span>
              </a>
            ))}
          </nav>

          {/* Stage 1 */}
          <StageCard
            id="stage-1"
            badgeText="Stage 1: Foundation Setup"
            title="Asset Onboarding, Staff Registration &amp; Service Standards"
            description="Before conducting maintenance operations, fleet units, technicians with standardized wage rates, and PM interval rules must be established in the master registries."
            roles="Fleet Manager, System Administrator"
            navigation="App Registry > Equipment Registry & Employee Registry"
            tables="vehicles, employees, service_standards"
            output="Active Asset IDs, Verified Wage Rates, Baseline PM Counters"
            screenshotSrc="/src/assets/screenshots/flow_01_vehicle_registry.png"
            screenshotCaption="Figure 1.1: Equipment Registry displaying plate numbers, model details, service standards, and initial baseline mileage setup."
            onOpenLightbox={openLightbox}
          />

          {/* Stage 2 */}
          <StageCard
            id="stage-2"
            badgeText="Stage 2: Shift Operations"
            title="Daily Inspection &amp; Telemetry Capture"
            description="The daily heartbeat of the maintenance system. At the end of every operating shift, inspectors record odometer readings and link any observed defects to FMEA condition risk codes."
            roles="Yard Inspector, Shift Driver, Shop Clerk"
            navigation="Maintenance Plan > Daily Inspection"
            tables="vehicle_daily_logs, log_risks"
            output="Recalculates PM Due Thresholds & Updates Master Reading"
            screenshotSrc="/src/assets/screenshots/flow_04_daily_inspection.png"
            screenshotCaption="Figure 2.1: Daily Inspection Form showing equipment selector, previous reading, current reading input, daily increment, and operator remarks."
            onOpenLightbox={openLightbox}
          />

          {/* Stage 9 */}
          <section id="stage-9" className="mb-20 pt-8 border-t border-white/5 scroll-mt-20">
            <div className="mb-7">
              <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-ping"></span>
                Stage 9: End-to-End Operational Workflow Loop
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-(--text-primary) mb-2">Multirole Lifecycle &amp; Task Allocation Sequence</h2>
              <p className="text-(--text-muted) max-w-4xl text-sm leading-relaxed">
                Detailed multirole progression governing defect reporting, supervisor inspection validation, automated RC-MRO schedule updates, and maintenance manager approvals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-(--bg-card) border border-(--border-main) rounded-2xl p-5 mb-7 shadow-lg">
              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] font-extrabold uppercase tracking-widest text-(--text-muted)">👤 Primary Roles</span>
                <span className="text-xs font-semibold text-(--text-primary)">Operator, Shop Supervisor, System, Manager, Mechanic</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] font-extrabold uppercase tracking-widest text-(--text-muted)">🧭 Source Navigation</span>
                <span className="text-xs font-semibold text-(--text-primary)">Daily Inspection &gt; Job Orders &gt; Approvals</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] font-extrabold uppercase tracking-widest text-(--text-muted)">🗄️ Database Tables</span>
                <span className="text-xs font-semibold text-(--text-primary)"><code>vehicle_daily_logs</code>, <code>job_orders</code>, <code>annual_pm_plan</code></span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] font-extrabold uppercase tracking-widest text-(--text-muted)">⚙️ Transaction Output</span>
                <span className="text-xs font-semibold text-(--text-primary)">Approved Work Orders &amp; PM Schedule Synchronization</span>
              </div>
            </div>

            <div className="bg-(--bg-surface) border border-(--border-main) rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="bg-(--bg-card) border border-(--border-main) p-4 rounded-xl">
                  <div className="text-[0.68rem] font-extrabold text-blue-400 uppercase mb-1">Step 1: Operator</div>
                  <div className="text-xs text-(--text-muted)">Ends shift, reports issues and observational remarks directly to workshop staff.</div>
                </div>
                <div className="bg-(--bg-card) border border-(--border-main) p-4 rounded-xl">
                  <div className="text-[0.68rem] font-extrabold text-blue-400 uppercase mb-1">Step 2: Shop Supervisor</div>
                  <div className="text-xs text-(--text-muted)">Performs inspection, logs telemetry, raises incident reports, and creates Job Orders as necessary.</div>
                </div>
                <div className="bg-(--bg-card) border border-(--border-main) p-4 rounded-xl">
                  <div className="text-[0.68rem] font-extrabold text-blue-400 uppercase mb-1">Step 3: RC-MRO System</div>
                  <div className="text-xs text-(--text-muted)">Flags PM schedule triggers and dynamically updates the Annual PM Plan.</div>
                </div>
                <div className="bg-(--bg-card) border border-(--border-main) p-4 rounded-xl">
                  <div className="text-[0.68rem] font-extrabold text-blue-400 uppercase mb-1">Step 4: Maintenance Manager</div>
                  <div className="text-xs text-(--text-muted)">Receives Job Order, approves execution, assigns mechanic, and handles final sign-off.</div>
                </div>
                <div className="bg-(--bg-card) border border-(--border-main) p-4 rounded-xl">
                  <div className="text-[0.68rem] font-extrabold text-blue-400 uppercase mb-1">Step 5: Supervisor &amp; Mechanic</div>
                  <div className="text-xs text-(--text-muted)">Supervisor instructs mechanic to perform repair, then flags completed Job Order for final approval.</div>
                </div>
              </div>
            </div>
          </section>

          {/* Stage 3 */}
          <StageCard
            id="stage-3"
            badgeText="Stage 3: Preventative Control"
            title="Equipment PM Details &amp; One-Click Completion"
            description="Tracks PM tiers (PM2 through PM7). When accumulated service readings exceed target thresholds, red alert flags highlight the due service. Shop supervisors execute one-click completion upon physical service sign-off."
            roles="Maintenance Supervisor, Shop Foreman"
            navigation="Maintenance Plan > Equipment PM Details"
            tables="rpc('completed_vehicle_pm', { p_pm_level, p_vehicle_id })"
            output="Advances Target Counter, Records Completed Timestamp, Clears Flag"
            screenshotSrc="/src/assets/screenshots/flow_05_pm_equipment_details.png"
            screenshotCaption="Figure 3.1: Equipment PM Details screen showing fleet list, current service readings, and PM schedule breakdown."
            onOpenLightbox={openLightbox}
          />

          {/* Stage 4 */}
          <StageCard
            id="stage-4"
            badgeText="Stage 4: Forward Planning"
            title="12-Month Predictive Maintenance Forecast"
            description="Forecasts PM triggers across a rolling 12-month horizon based on historical average daily usage, enabling bay capacity planning and proactive parts requisitions."
            roles="Fleet Manager, Parts Planner, Maintenance Superintendent"
            navigation="Maintenance Plan > Maintenance Forecast"
            tables="vw_12monthpredictive_maintenance_details"
            output="Monthly bay load schedules, pre-allocated inventory requisitions"
            screenshotSrc="/src/assets/screenshots/flow_06_maintenance_forecast.png"
            screenshotCaption="Figure 4.1: 12-Month Predictive Maintenance Forecast with horizon slider, PM tier filter, and monthly equipment schedule matrix."
            onOpenLightbox={openLightbox}
          />

          {/* Stage 5 */}
          <StageCard
            id="stage-5"
            badgeText="Stage 5: Work Order Management"
            title="Job Order Execution, Labor Tracking &amp; Cost Rollup"
            description="The primary operational and financial workhorse of RC-MRO. Creates work orders, assigns benchmarked task standards, issues bill of materials (BOM), records technician labor hours, logs external machining contracts, and rolls up total maintenance costs."
            roles="Shop Supervisor, Assigned Technicians, Cost Accountant"
            navigation="Job Order System > Job Order & Dashboard"
            tables="job_orders, job_order_tasks, job_order_materials"
            output="Total Cost = Labor Cost + Materials Cost + Contract Cost"
            screenshotSrc="/src/assets/screenshots/flow_08_job_order_dashboard.png"
            screenshotCaption="Figure 5.1: Job Order Dashboard displaying work order throughput metrics and status summaries."
            onOpenLightbox={openLightbox}
          />

          {/* Stage 6 */}
          <StageCard
            id="stage-6"
            badgeText="Stage 6: Asset Lifecycle"
            title="Component History, Teardown &amp; Scrap Governance"
            description="Maintains serialized traceability for critical assemblies (engines, transmissions, differential carriers, hydraulic pumps). Tracks installation, removal, accumulated runtime, and marks condemned parts as scrapped."
            roles="Component Rebuild Specialist, Workshop Supervisor"
            navigation="Maintenance Plan > Component History"
            tables="equipment_components, equipment_component_history"
            output="Net component run-hours, scrap audit status (is_scrapped)"
            screenshotSrc="/src/assets/screenshots/flow_09_component_history.png"
            screenshotCaption="Figure 6.1: Component History screen showing serialized units, vehicle installations, accumulated mileage, and scrap status."
            onOpenLightbox={openLightbox}
          />

          {/* Stage 7 */}
          <StageCard
            id="stage-7"
            badgeText="Stage 7: Reliability &amp; Safety"
            title="Incident Investigation &amp; 4-Pillar Root Cause Analysis"
            description="Closes the reliability loop when field breakdowns or safety incidents occur. Captures financial loss estimates and systematically breaks down causes across Conditions, Acts, Personal Factors, and Work-Related Causes."
            roles="Safety Officer, Reliability Engineer, Quality Auditor"
            navigation="Incident Mgmt > Incident Report"
            tables="incident_reports, rca_pillars, fmea_risks"
            output="Corrective Actions, Incident Loss Tracking, Preventive Rule Adjustments"
            screenshotSrc="/src/assets/screenshots/flow_10_incident_report.png"
            screenshotCaption="Figure 7.1: Incident Report management screen showing incident master records, severity badges, and 4-pillar RCA tabs."
            onOpenLightbox={openLightbox}
          />

          {/* Stage 8: System Architecture Explainer Image */}
          <section id="stage-8" className="mb-20 pt-8 border-t border-white/5 scroll-mt-20">
            <div className="mb-7">
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-500 flex items-center gap-1.5 mb-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Stage 8: Visual Process Explainer</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-(--text-primary) mb-2">End-to-End System Architecture Overview</h2>
              <p className="text-(--text-muted) max-w-4xl">Comprehensive architectural flow diagram tracing system interactions and asset lifecycle governance.</p>
            </div>

            <div className="screenshot-card bg-(--bg-surface) border border-(--border-main) rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-blue-500/50">
              <div className="bg-linear-to-b from-slate-800 to-slate-900 p-3.5 border-b border-white/10 flex items-center justify-between">
                <div className="flex gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="w-3 h-3 rounded-full bg-amber-500"></span><span className="w-3 h-3 rounded-full bg-emerald-500"></span></div>
                <div className="text-xs font-mono text-(--text-muted) bg-(--bg-main) px-4 py-1 rounded-lg border border-white/10">RC-MRO — System Architecture</div>
                <div></div>
              </div>
              <div className="bg-(--bg-main) cursor-zoom-in overflow-hidden group" onClick={() => openLightbox('/src/assets/RC_MRO_Explainer.png')}>
                <img src="/src/assets/RC_MRO_Explainer.png" alt="RC-MRO System Explainer" className="w-full h-auto block transition-transform duration-500 group-hover:scale-102" />
              </div>
              <div className="p-4 bg-(--bg-surface) border-t border-(--border-main) text-xs text-(--text-muted) flex justify-between">
                <span><strong>Figure 8.1:</strong> End-to-End MRO Workflow System Architecture.</span>
                <span className="text-blue-400 font-semibold">Click to expand</span>
              </div>
            </div>
          </section>

          {/* Interactive FMEA Calculator (Moved after Stage 8 per user request) */}
          <InteractiveFmeaCalculator />
        </main>
      </div>

      {/* Lightbox Modal */}
      <LightboxModal isOpen={Boolean(lightboxSrc)} imageSrc={lightboxSrc || ''} onClose={closeLightbox} />

      {/* Back to Top Button */}
      <button id="btnBackToTop" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-7 right-7 w-11.5 h-11.5 rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 text-white border border-white/20 flex items-center justify-center cursor-pointer shadow-2xl opacity-0 invisible transition-all duration-300 z-40 hover:-translate-y-1.5 hover:scale-105 active:scale-95">
        <ArrowLeft className="w-5 h-5 rotate-90" />
      </button>
    </div>
  );
}

export default Manual;