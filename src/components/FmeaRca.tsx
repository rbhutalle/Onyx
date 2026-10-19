import React, { useState } from 'react';
import { 
  SearchCheck, 
  GitFork, 
  Plus, 
  ShieldAlert, 
  X 
} from 'lucide-react';

interface FmeaRecord {
  id: string;
  system_component: string;
  failure_mode: string;
  effect: string;
  severity_score: number;
  occurrence_score: number;
  detection_score: number;
  rpn: number;
}

interface RcaRecord {
  id: string;
  incident_ref: string;
  root_cause: string;
  corrective_action: string;
  assigned_to: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export function FmeaRca() {
  const [activeTab, setActiveTab] = useState<'fmea' | 'rca'>('fmea');

  const [fmeaList, setFmeaList] = useState<FmeaRecord[]>([
    {
      id: '1',
      system_component: 'Brake Hydraulics',
      failure_mode: 'Fluid Pressure Leak',
      effect: 'Reduced Braking Efficiency',
      severity_score: 8,
      occurrence_score: 4,
      detection_score: 3,
      rpn: 96
    }
  ]);

  const [rcaList, setRcaList] = useState<RcaRecord[]>([
    {
      id: '1',
      incident_ref: 'INC-2026-001',
      root_cause: 'Worn out master cylinder seal ring due to thermal degradation.',
      corrective_action: 'Replace seal package and mandate high-temp fluid flush every 20k km.',
      assigned_to: 'Tech Lead - Operations',
      status: 'In Progress'
    }
  ]);

  // Modal states
  const [isFmeaModalOpen, setIsFmeaModalOpen] = useState(false);
  const [isRcaModalOpen, setIsRcaModalOpen] = useState(false);

  // Form states
  const [fmeaForm, setFmeaForm] = useState({
    system_component: '',
    failure_mode: '',
    effect: '',
    severity_score: 1,
    occurrence_score: 1,
    detection_score: 1
  });

  const [rcaForm, setRcaForm] = useState({
    incident_ref: '',
    root_cause: '',
    corrective_action: '',
    assigned_to: '',
    status: 'Pending' as RcaRecord['status']
  });

  const handleAddFmea = (e: React.FormEvent) => {
    e.preventDefault();
    const rpn = fmeaForm.severity_score * fmeaForm.occurrence_score * fmeaForm.detection_score;
    const newRecord: FmeaRecord = {
      id: Date.now().toString(),
      system_component: fmeaForm.system_component,
      failure_mode: fmeaForm.failure_mode,
      effect: fmeaForm.effect,
      severity_score: Number(fmeaForm.severity_score),
      occurrence_score: Number(fmeaForm.occurrence_score),
      detection_score: Number(fmeaForm.detection_score),
      rpn
    };

    setFmeaList([newRecord, ...fmeaList]);
    setIsFmeaModalOpen(false);
    setFmeaForm({
      system_component: '',
      failure_mode: '',
      effect: '',
      severity_score: 1,
      occurrence_score: 1,
      detection_score: 1
    });
  };

  const handleAddRca = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: RcaRecord = {
      id: Date.now().toString(),
      incident_ref: rcaForm.incident_ref,
      root_cause: rcaForm.root_cause,
      corrective_action: rcaForm.corrective_action,
      assigned_to: rcaForm.assigned_to,
      status: rcaForm.status
    };

    setRcaList([newRecord, ...rcaList]);
    setIsRcaModalOpen(false);
    setRcaForm({
      incident_ref: '',
      root_cause: '',
      corrective_action: '',
      assigned_to: '',
      status: 'Pending'
    });
  };

  return (
    <div className="p-6 w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
            <SearchCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">FMEA & Root Cause Analysis</h1>
            <p className="text-sm text-slate-400">Evaluate failure modes, Risk Priority Numbers (RPN), and root cause action plans.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('fmea')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'fmea' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>FMEA Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('rca')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'rca' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>RCA Log</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        {activeTab === 'fmea' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-400" /> Failure Mode & Effects Analysis (FMEA)
              </h2>
              <button
                onClick={() => setIsFmeaModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add FMEA Item</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950">
                    <th className="p-3">Component / System</th>
                    <th className="p-3">Failure Mode</th>
                    <th className="p-3">Potential Effect</th>
                    <th className="p-3 font-mono text-center">Sev (S)</th>
                    <th className="p-3 font-mono text-center">Occ (O)</th>
                    <th className="p-3 font-mono text-center">Det (D)</th>
                    <th className="p-3 font-mono text-center">RPN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {fmeaList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-100">{item.system_component}</td>
                      <td className="p-3 text-amber-400">{item.failure_mode}</td>
                      <td className="p-3 text-slate-400">{item.effect}</td>
                      <td className="p-3 font-mono text-center">{item.severity_score}</td>
                      <td className="p-3 font-mono text-center">{item.occurrence_score}</td>
                      <td className="p-3 font-mono text-center">{item.detection_score}</td>
                      <td className="p-3 font-mono text-center font-bold text-emerald-400">{item.rpn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <GitFork className="w-4 h-4 text-blue-400" /> Root Cause Analysis (RCA) Log
              </h2>
              <button
                onClick={() => setIsRcaModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add RCA Action</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950">
                    <th className="p-3">Incident Ref</th>
                    <th className="p-3">Identified Root Cause</th>
                    <th className="p-3">Corrective / Preventive Action</th>
                    <th className="p-3">Assignee</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {rcaList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-400">{item.incident_ref}</td>
                      <td className="p-3 text-slate-200">{item.root_cause}</td>
                      <td className="p-3 text-slate-400">{item.corrective_action}</td>
                      <td className="p-3 text-slate-300">{item.assigned_to}</td>
                      <td className="p-3">
                        <span className="bg-amber-950/50 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded text-xs font-medium">
                          {item.status}
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

      {/* FMEA Modal */}
      {isFmeaModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950">
              <h3 className="text-lg font-bold text-slate-100">Add FMEA Item</h3>
              <button onClick={() => setIsFmeaModalOpen(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFmea} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Component / System</label>
                <input
                  type="text"
                  required
                  value={fmeaForm.system_component}
                  onChange={(e) => setFmeaForm({ ...fmeaForm, system_component: e.target.value })}
                  placeholder="e.g. Brake Hydraulics"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Failure Mode</label>
                <input
                  type="text"
                  required
                  value={fmeaForm.failure_mode}
                  onChange={(e) => setFmeaForm({ ...fmeaForm, failure_mode: e.target.value })}
                  placeholder="e.g. Fluid Pressure Leak"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Potential Effect</label>
                <input
                  type="text"
                  required
                  value={fmeaForm.effect}
                  onChange={(e) => setFmeaForm({ ...fmeaForm, effect: e.target.value })}
                  placeholder="e.g. Reduced Braking Efficiency"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Severity (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={fmeaForm.severity_score}
                    onChange={(e) => setFmeaForm({ ...fmeaForm, severity_score: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Occurrence (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={fmeaForm.occurrence_score}
                    onChange={(e) => setFmeaForm({ ...fmeaForm, occurrence_score: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Detection (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={fmeaForm.detection_score}
                    onChange={(e) => setFmeaForm({ ...fmeaForm, detection_score: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFmeaModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow"
                >
                  Save FMEA Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RCA Modal */}
      {isRcaModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950">
              <h3 className="text-lg font-bold text-slate-100">Add Root Cause Analysis</h3>
              <button onClick={() => setIsRcaModalOpen(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRca} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Incident Ref #</label>
                <input
                  type="text"
                  required
                  value={rcaForm.incident_ref}
                  onChange={(e) => setRcaForm({ ...rcaForm, incident_ref: e.target.value })}
                  placeholder="e.g. INC-2026-001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Root Cause</label>
                <textarea
                  rows={2}
                  required
                  value={rcaForm.root_cause}
                  onChange={(e) => setRcaForm({ ...rcaForm, root_cause: e.target.value })}
                  placeholder="Identified root cause..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Corrective Action</label>
                <textarea
                  rows={2}
                  required
                  value={rcaForm.corrective_action}
                  onChange={(e) => setRcaForm({ ...rcaForm, corrective_action: e.target.value })}
                  placeholder="Planned preventive action..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Assignee</label>
                  <input
                    type="text"
                    required
                    value={rcaForm.assigned_to}
                    onChange={(e) => setRcaForm({ ...rcaForm, assigned_to: e.target.value })}
                    placeholder="e.g. Operations Lead"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Status</label>
                  <select
                    value={rcaForm.status}
                    onChange={(e) => setRcaForm({ ...rcaForm, status: e.target.value as RcaRecord['status'] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRcaModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow"
                >
                  Save RCA Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FmeaRca;