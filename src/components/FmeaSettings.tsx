import React, { useState } from 'react';
import { 
  CheckCircle, 
  Save, 
  ShieldAlert, 
  Sliders, 
  Layers 
} from 'lucide-react';

interface RpnThreshold {
  id: string;
  label: string;
  min_rpn: number;
  max_rpn: number;
  color_code: string;
  action_required: string;
}

interface SeverityScale {
  rating: number;
  definition: string;
  impact_level: string;
}

export function FmeaSettings() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [thresholds, setThresholds] = useState<RpnThreshold[]>([
    {
      id: '1',
      label: 'Critical Risk',
      min_rpn: 150,
      max_rpn: 1000,
      color_code: 'red',
      action_required: 'Immediate mandatory redesign & immediate RCA investigation'
    },
    {
      id: '2',
      label: 'High Risk',
      min_rpn: 80,
      max_rpn: 149,
      color_code: 'amber',
      action_required: 'Scheduled preventive maintenance & design review'
    },
    {
      id: '3',
      label: 'Low / Acceptable Risk',
      min_rpn: 1,
      max_rpn: 79,
      color_code: 'emerald',
      action_required: 'Standard inspection cycle'
    }
  ]);

  const [severityScales, setSeverityScales] = useState<SeverityScale[]>([
    { rating: 10, definition: 'Hazardous without warning (Safety / Regulatory violation)', impact_level: 'Critical' },
    { rating: 8, definition: 'Primary function completely loss / Vehicle breakdown', impact_level: 'High' },
    { rating: 5, definition: 'Reduced performance / Minor operational delay', impact_level: 'Medium' },
    { rating: 2, definition: 'Slight customer annoyance / No functional impact', impact_level: 'Low' }
  ]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('FMEA settings and RPN thresholds saved successfully!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleUpdateThreshold = (id: string, field: keyof RpnThreshold, value: string | number) => {
    setThresholds(thresholds.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleUpdateSeverityScale = (rating: number, field: keyof SeverityScale, value: string | number) => {
    setSeverityScales(severityScales.map(s => s.rating === rating ? { ...s, [field]: value } : s));
  };

  return (
    <div className="p-6 w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">FMEA Settings</h1>
            <p className="text-sm text-slate-400">Configure Risk Priority Number (RPN) thresholds, severity scales, and risk action rules.</p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow"
        >
          <Save className="w-4 h-4" />
          <span>Save Configuration</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* RPN Threshold Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sliders className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-slate-100">Risk Priority Number (RPN) Rating Thresholds</h2>
        </div>

        <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950">
                <th className="p-3">Risk Level Label</th>
                <th className="p-3">Min RPN</th>
                <th className="p-3">Max RPN</th>
                <th className="p-3">Action Standard Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {thresholds.map((item) => (
                <tr key={item.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="p-3 font-semibold text-slate-100">{item.label}</td>
                  <td className="p-3 w-32">
                    <input
                      type="number"
                      value={item.min_rpn}
                      onChange={(e) => handleUpdateThreshold(item.id, 'min_rpn', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="p-3 w-32">
                    <input
                      type="number"
                      value={item.max_rpn}
                      onChange={(e) => handleUpdateThreshold(item.id, 'max_rpn', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.action_required}
                      onChange={(e) => handleUpdateThreshold(item.id, 'action_required', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Severity Scale Reference Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Layers className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-slate-100">Standard Severity Scale Reference Definitions</h2>
        </div>

        <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950">
                <th className="p-3 text-center w-24">Rating</th>
                <th className="p-3 w-48">Impact Level</th>
                <th className="p-3">Definition & Criteria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {severityScales.map((scale) => (
                <tr key={scale.rating} className="hover:bg-slate-950/40 transition-colors">
                  <td className="p-3 text-center font-bold font-mono text-blue-400">{scale.rating}</td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={scale.impact_level}
                      onChange={(e) => handleUpdateSeverityScale(scale.rating, 'impact_level', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={scale.definition}
                      onChange={(e) => handleUpdateSeverityScale(scale.rating, 'definition', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FmeaSettings;