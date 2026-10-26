import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  ArrowRight, 
  Activity, 
  Layers, 
  Wrench, 
  BarChart3 
} from 'lucide-react';

import explainerImg from '@/assets/RC_MRO_Explainer.png';
import overviewImg from '@/assets/RC_MRO_Overview.png';
import rcmroVideo from '@/assets/RCMRO.mp4';

export function LandingPage() {
  const navigate = useNavigate();
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // 1. Create a function to set session access and navigate
  const handleLaunchApp = () => {
    sessionStorage.setItem('rcmro-access', 'granted');
    navigate('/dashboard');
  };

  return (
    <div className="w-full h-screen overflow-y-auto snap-y snap-mandatory bg-(--bg-main) text-(--text-main) flex flex-col selection:bg-blue-600 selection:text-white scroll-smooth">
      
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-(--bg-header) backdrop-blur-md border-b border-(--border-color) px-6 lg:px-16 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <span className="font-bold text-(--text-heading) text-base tracking-tight">RBMMS Portal</span>
        </div>
        <div className="flex items-center gap-4">
          {/* 2. Apply handler */}
          <button
            onClick={handleLaunchApp}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            Launch RC-MRO App
          </button>
        </div>
      </nav>

      {/* Main Scroll Content Container */}
      <div className="flex-1">
        
        {/* 1. HERO SECTION */}
        <section className="min-h-[calc(100vh-65px)] snap-start flex items-center justify-center px-6 lg:px-16 py-12 pt-20">
          <header className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-(--text-heading) leading-[1.15] pt-2">
                Maximize Equipment Uptime & Precision Maintenance
              </h1>
              <p className="text-base sm:text-lg text-(--text-muted) leading-relaxed">
                Empower your operations team with real-time equipment tracking, automated daily inspections, and predictive maintenance forecasting built for high-performance fleets.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                {/* 3. Apply handler */}
                <button
                  onClick={handleLaunchApp}
                  className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <span>Launch RC-MRO App</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hero Explainer Image & Video Toggle Container */}
            <div className="relative rounded-2xl overflow-hidden border border-(--border-color) bg-slate-900 shadow-2xl group min-h-65">
              {!isPlayingVideo ? (
                <div className="relative w-full h-full min-h-65 flex items-center justify-center bg-slate-900">
                  <img
                    src={explainerImg}
                    alt="RC MRO Explainer"
                    className="w-full h-auto max-h-95 object-contain block mx-auto group-hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
                  
                  <button
                    onClick={() => setIsPlayingVideo(true)}
                    title="Play Explainer Video"
                    className="absolute z-10 w-16 h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-600/60 transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Play className="w-6 h-6 ml-1 fill-current" />
                  </button>
                </div>
              ) : (
                <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                  <video
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    src={rcmroVideo}
                  />
                </div>
              )}
            </div>
          </header>
        </section>

        {/* 2. OVERVIEW SHOWCASE SECTION */}
        <section className="min-h-screen snap-start flex items-center justify-center px-6 lg:px-16 py-16">
          <div className="max-w-7xl mx-auto w-full bg-(--bg-surface) border border-(--border-color) rounded-3xl p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center shadow-xl">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide uppercase">
                <span>Enterprise Architecture</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-(--text-heading)">Complete System Overview</h2>
              <p className="text-sm sm:text-base text-(--text-muted) leading-relaxed">
                Designed around Reliability-Centered Maintenance principles. Monitor failure modes, structural hierarchies, and service intervals through an integrated operational view.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden border border-(--border-color) bg-slate-950 p-2 shadow-lg">
              <img 
                src={overviewImg} 
                alt="RC MRO Overview" 
                className="w-full h-auto rounded-xl object-contain hover:scale-102 transition-transform duration-500"
              />
            </div>
          </div>
        </section>

        {/* 3. FEATURE HIGHLIGHTS GRID SECTION */}
        <section className="min-h-screen snap-start flex items-center justify-center px-6 lg:px-16 py-16">
          <div className="max-w-7xl mx-auto w-full space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-(--text-heading) leading-tight">
                Engineered for Total Reliability
              </h2>
              <p className="text-sm sm:text-base text-(--text-muted)">
                Everything your maintenance team needs to prevent failures before they occur and maintain strict equipment registries.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 bg-(--bg-card) border border-(--border-color) rounded-2xl space-y-3 shadow-sm hover:border-blue-500/50 transition-colors">
                <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl w-fit">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-(--text-heading)">Reliability-Centered</h3>
                <p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">
                  Optimize component lifecycles with advanced failure mode analysis (FMEA) and root cause analysis (RCA) tracking.
                </p>
              </div>

              <div className="p-5 bg-(--bg-card) border border-(--border-color) rounded-2xl space-y-3 shadow-sm hover:border-emerald-500/50 transition-colors">
                <div className="p-2.5 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-(--text-heading)">Streamlined Inspections</h3>
                <p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">
                  Digital daily checklists, equipment PM details, and instant anomaly reporting minimize unexpected breakdowns.
                </p>
              </div>

              <div className="p-5 bg-(--bg-card) border border-(--border-color) rounded-2xl space-y-3 shadow-sm hover:border-purple-500/50 transition-colors">
                <div className="p-2.5 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-xl w-fit">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-(--text-heading)">Smart Forecasting</h3>
                <p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">
                  Predictive maintenance schedules driven by historical component metrics and automated service thresholds.
                </p>
              </div>

              <div className="p-5 bg-(--bg-card) border border-(--border-color) rounded-2xl space-y-3 shadow-sm hover:border-amber-500/50 transition-colors">
                <div className="p-2.5 bg-amber-600/10 text-amber-600 dark:text-amber-400 rounded-xl w-fit">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-(--text-heading)">Job Order System</h3>
                <p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">
                  Centralized work order dashboards, priority tracking, and technician task assignments to accelerate turnaround times.
                </p>
              </div>

              <div className="p-5 bg-(--bg-card) border border-(--border-color) rounded-2xl space-y-3 shadow-sm hover:border-cyan-500/50 transition-colors">
                <div className="p-2.5 bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 rounded-xl w-fit">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-(--text-heading)">Comprehensive Registries</h3>
                <p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">
                  Maintain detailed equipment, employee, and component inventories with rapid lookup and filter controls.
                </p>
              </div>

              <div className="p-5 bg-(--bg-card) border border-(--border-color) rounded-2xl space-y-3 shadow-sm hover:border-indigo-500/50 transition-colors">
                <div className="p-2.5 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-(--text-heading)">Real-Time Analytics</h3>
                <p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">
                  Monitor live database connection heartbeats, operational standards, and performance metrics instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. CALL TO ACTION & FOOTER SECTION */}
        <section className="min-h-screen snap-start flex flex-col justify-between px-6 lg:px-16 py-12 max-w-7xl mx-auto w-full">
          <div className="my-auto bg-blue-600 text-white py-14 px-6 lg:px-16 text-center rounded-3xl shadow-xl w-full">
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Ready to Transform Your Maintenance Workflow?</h2>
              <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto">
                Log in to the management portal now to access your job orders, equipment registries, and predictive maintenance schedules.
              </p>
              {/* 4. Apply handler */}
              <button
                onClick={handleLaunchApp}
                className="px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-xl shadow-xl transition-transform hover:scale-105 cursor-pointer"
              >
                Launch RC-MRO App
              </button>
            </div>
          </div>

          <footer className="pt-6 border-t border-(--border-color) bg-(--bg-surface) text-xs text-(--text-dim) rounded-t-2xl px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
              <p>&copy; {new Date().getFullYear()} Reliability-Centered MRO Portal. All rights reserved.</p>
            </div>
          </footer>
        </section>

      </div>
    </div>
  );
}

export default LandingPage;