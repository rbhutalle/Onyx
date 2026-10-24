import { useState } from 'react';
import { Activity, ShieldAlert } from 'lucide-react';

export function InteractiveFmeaCalculator() {
  const [severity, setSeverity] = useState<number>(5);
  const [occurrence, setOccurrence] = useState<number>(4);
  const [detection, setDetection] = useState<number>(3);

  const rpn = severity * occurrence * detection;

  const getRiskBadge = (score: number) => {
    if (score >= 120) return { label: 'CRITICAL RISK (Action Required)', color: 'bg-red-500/20 text-red-400 border-red-500/40' };
    if (score >= 60) return { label: 'MODERATE RISK (Monitor closely)', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
    return { label: 'LOW RISK (Acceptable)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
  };

  const riskInfo = getRiskBadge(rpn);

  return (
    <div id="how-to-operationalize-fmea" className="bg-linear-to-br from-blue-500/12 to-cyan-500/8 border-l-6 border-blue-500 rounded-2xl p-6 my-8 shadow-xl scroll-mt-20">
      <div className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2">
        <Activity className="w-5 h-5 animate-pulse" /> Interactive FMEA &amp; RPN Risk Calculator
      </div>
      <p className="text-slate-200 text-xs sm:text-sm mb-5 leading-relaxed">
        Test how Severity (S), Occurrence (O), and Detection (D) scores combine to dictate failure risk priority ratings in RC-MRO.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-(--bg-card) p-4 rounded-xl border border-(--border-main)">
          <label className="block text-xs font-bold text-(--text-muted) mb-1">Severity (S: 1–10): {severity}</label>
          <input type="range" min="1" max="10" value={severity} onChange={(e) => setSeverity(Number(e.target.value))} className="w-full accent-blue-500 cursor-pointer" />
          <span className="text-[11px] text-(--text-muted) mt-1 block">Impact on equipment uptime &amp; safety</span>
        </div>
        <div className="bg-(--bg-card) p-4 rounded-xl border border-(--border-main)">
          <label className="block text-xs font-bold text-(--text-muted) mb-1">Occurrence (O: 1–10): {occurrence}</label>
          <input type="range" min="1" max="10" value={occurrence} onChange={(e) => setOccurrence(Number(e.target.value))} className="w-full accent-blue-500 cursor-pointer" />
          <span className="text-[11px] text-(--text-muted) mt-1 block">Likelihood of failure recurrence</span>
        </div>
        <div className="bg-(--bg-card) p-4 rounded-xl border border-(--border-main)">
          <label className="block text-xs font-bold text-(--text-muted) mb-1">Detection (D: 1–10): {detection}</label>
          <input type="range" min="1" max="10" value={detection} onChange={(e) => setDetection(Number(e.target.value))} className="w-full accent-blue-500 cursor-pointer" />
          <span className="text-[11px] text-(--text-muted) mt-1 block">Inability of controls to catch defect</span>
        </div>
      </div>

      <div className="bg-(--bg-surface) p-5 rounded-xl border border-(--border-main) flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-(--text-muted) font-bold">Calculated RPN Score</div>
          <div className="text-3xl font-black text-white font-mono mt-0.5">{severity} × {occurrence} × {detection} = <span className="text-blue-400">{rpn}</span></div>
        </div>
        <div className={`px-4 py-2 rounded-xl text-xs font-bold border ${riskInfo.color} flex items-center gap-2`}>
          <ShieldAlert className="w-4 h-4 shrink-0" />
          {riskInfo.label}
        </div>
      </div>
    </div>
  );
}