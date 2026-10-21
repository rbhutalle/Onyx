import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  ShieldAlert, 
  Clock, 
  Sliders, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  X,
  Edit2,
  Trash2,
  Save,
  Loader2,
  Filter
} from 'lucide-react';

interface StandardRecord {
  service_standard_id: string;
  code: string;
  description: string;
  [key: string]: unknown;
}

interface IntervalRecord {
  service_interval_id: string;
  service_standard_id: string;
  code: string;
  interval: number | null;
  description: string | null;
  is_active: boolean;
  [key: string]: unknown;
}

interface ThresholdRecord {
  thresholds_id: string;
  pm_threshold: number | null;
  pm_hrs_converter: number | null;
  pm_calendar_converter: number | null;
  average_lookback: number | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

const PM_CODES = ['PM2', 'PM3', 'PM4', 'PM5', 'PM6', 'PM7'];

export function ServiceStandards() {
  const [activeTab, setActiveTab] = useState<'standards' | 'intervals' | 'thresholds'>('standards');

  const [standards, setStandards] = useState<StandardRecord[]>([]);
  const [intervals, setIntervals] = useState<IntervalRecord[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdRecord[]>([]);

  // Filter state for Service Intervals
  const [selectedStandardFilter, setSelectedStandardFilter] = useState<string>('all');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [standardForm, setStandardForm] = useState({ code: '', description: '' });
  const [intervalForm, setIntervalForm] = useState({ 
    service_standard_id: '', 
    code: 'PM2', 
    interval: '', 
    description: '', 
    is_active: true 
  });
  const [thresholdForm, setThresholdForm] = useState({ 
    pm_threshold: '', 
    pm_hrs_converter: '', 
    pm_calendar_converter: '', 
    average_lookback: '' 
  });

  // Define loadTabData locally or include it properly
  useEffect(() => {
    let isMounted = true;

    async function loadTabData() {
      try {
        setErrorMsg(null);
        const stdRes = await supabase.from('service_standards').select('*');
        if (stdRes.error) throw stdRes.error;
        if (isMounted) setStandards(stdRes.data || []);

        if (activeTab === 'intervals') {
          const { data, error } = await supabase.from('service_intervals').select('*');
          if (error) throw error;
          if (isMounted) setIntervals(data || []);
        } else if (activeTab === 'thresholds') {
          const { data, error } = await supabase.from('service_thresholds').select('*');
          if (error) throw error;
          if (isMounted) setThresholds(data || []);
        }
      } catch (err: unknown) {
        console.error(`Error fetching data for ${activeTab}:`, err);
        if (isMounted) setErrorMsg(`Failed to load ${activeTab} data. Please check table permissions.`);
      }
    }

    loadTabData();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // Reusable refresh trigger for post-mutation actions
  const refreshCurrentData = async () => {
    try {
      const stdRes = await supabase.from('service_standards').select('*');
      if (stdRes.data) setStandards(stdRes.data);

      if (activeTab === 'intervals') {
        const { data } = await supabase.from('service_intervals').select('*');
        if (data) setIntervals(data);
      } else if (activeTab === 'thresholds') {
        const { data } = await supabase.from('service_thresholds').select('*');
        if (data) setThresholds(data);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setStandardForm({ code: '', description: '' });
    setIntervalForm({ 
      service_standard_id: standards[0]?.service_standard_id || '', 
      code: 'PM2', 
      interval: '', 
      description: '', 
      is_active: true 
    });
    setThresholdForm({ 
      pm_threshold: '', 
      pm_hrs_converter: '', 
      pm_calendar_converter: '', 
      average_lookback: '' 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: StandardRecord | IntervalRecord | ThresholdRecord) => {
    if (activeTab === 'standards') {
      const rec = item as StandardRecord;
      setEditingId(rec.service_standard_id);
      setStandardForm({
        code: rec.code || '',
        description: rec.description || '',
      });
    } else if (activeTab === 'intervals') {
      const rec = item as IntervalRecord;
      setEditingId(rec.service_interval_id);
      setIntervalForm({
        service_standard_id: rec.service_standard_id || '',
        code: rec.code || 'PM2',
        interval: rec.interval !== null ? String(rec.interval) : '',
        description: rec.description || '',
        is_active: rec.is_active ?? true,
      });
    } else if (activeTab === 'thresholds') {
      const rec = item as ThresholdRecord;
      setEditingId(rec.thresholds_id);
      setThresholdForm({
        pm_threshold: rec.pm_threshold !== null ? String(rec.pm_threshold) : '',
        pm_hrs_converter: rec.pm_hrs_converter !== null ? String(rec.pm_hrs_converter) : '',
        pm_calendar_converter: rec.pm_calendar_converter !== null ? String(rec.pm_calendar_converter) : '',
        average_lookback: rec.average_lookback !== null && rec.average_lookback !== undefined ? String(rec.average_lookback) : '',
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, tableName: 'service_standards' | 'service_intervals') => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      setErrorMsg(null);
      let pkField = 'service_standard_id';
      if (tableName === 'service_intervals') pkField = 'service_interval_id';

      const { error } = await supabase.from(tableName).delete().eq(pkField, id);
      if (error) throw error;

      setSuccessMsg('Record deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      refreshCurrentData();
    } catch (err: unknown) {
      console.error('Error deleting record:', err);
      setErrorMsg('Failed to delete record. Check foreign key constraints.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (activeTab === 'standards') {
        const payload = { 
          code: standardForm.code, 
          description: standardForm.description 
        };
        if (editingId) {
          const { error } = await supabase.from('service_standards').update(payload).eq('service_standard_id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('service_standards').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Service Standard saved successfully!');
      } else if (activeTab === 'intervals') {
        const payload = { 
          service_standard_id: intervalForm.service_standard_id, 
          code: intervalForm.code,
          interval: intervalForm.interval !== '' ? Number(intervalForm.interval) : null,
          description: intervalForm.description || null,
          is_active: intervalForm.is_active
        };
        if (editingId) {
          const { error } = await supabase.from('service_intervals').update(payload).eq('service_interval_id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('service_intervals').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Service Interval saved successfully!');
      } else if (activeTab === 'thresholds') {
        const payload = { 
          pm_threshold: thresholdForm.pm_threshold !== '' ? Number(thresholdForm.pm_threshold) : 0,
          pm_hrs_converter: thresholdForm.pm_hrs_converter !== '' ? Number(thresholdForm.pm_hrs_converter) : null,
          pm_calendar_converter: thresholdForm.pm_calendar_converter !== '' ? Number(thresholdForm.pm_calendar_converter) : null,
          average_lookback: thresholdForm.average_lookback !== '' ? Number(thresholdForm.average_lookback) : null,
        };
        if (editingId) {
          const { error } = await supabase.from('service_thresholds').update(payload).eq('thresholds_id', editingId);
          if (error) throw error;
        }
        setSuccessMsg('Service Threshold updated successfully!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      refreshCurrentData();
    } catch (err: unknown) {
      console.error('Error saving record:', err);
      setErrorMsg('Failed to save record. Please check required fields or constraints.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter intervals based on selected service standard
  const filteredIntervals = selectedStandardFilter === 'all'
    ? intervals
    : intervals.filter((item) => item.service_standard_id === selectedStandardFilter);

  return (
    <div className="p-6 w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Service Standards Management</h1>
          <p className="text-sm text-slate-400">Configure preventive maintenance standards, intervals, and operational thresholds.</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-950/50 border border-red-800 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Clean Tab Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('standards')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'standards'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Service Standards</span>
        </button>

        <button
          onClick={() => setActiveTab('intervals')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'intervals'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Service Intervals</span>
        </button>

        <button
          onClick={() => setActiveTab('thresholds')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'thresholds'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Service Thresholds</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        {/* Toolbar / Actions */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            {activeTab === 'intervals' && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedStandardFilter}
                  onChange={(e) => setSelectedStandardFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Standards (Filter by Code)</option>
                  {standards.map((std) => (
                    <option key={std.service_standard_id} value={std.service_standard_id}>
                      {std.code} {std.description ? `- ${std.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Add Record Button hidden for Thresholds tab */}
          {activeTab !== 'thresholds' && (
            <button
              onClick={handleOpenAdd}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow ml-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
          )}
        </div>

        {/* Scrollable Container with Sticky Table Headers */}
        <div className="overflow-y-auto overflow-x-auto max-h-[calc(100vh-360px)] border border-slate-800/60 rounded-lg">
          {/* TAB 1: STANDARDS */}
          {activeTab === 'standards' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Code</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {standards.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">No service standards found.</td>
                  </tr>
                ) : (
                  standards.map((item) => (
                    <tr key={item.service_standard_id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-100">{item.code}</td>
                      <td className="p-3 text-slate-400">{item.description}</td>
                      <td className="p-3 text-right space-x-3">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.service_standard_id, 'service_standards')}
                          className="text-xs text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 2: INTERVALS */}
          {activeTab === 'intervals' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Standard Code</th>
                  <th className="p-3">PM Code</th>
                  <th className="p-3">Interval</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredIntervals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No service intervals found for this filter.</td>
                  </tr>
                ) : (
                  filteredIntervals.map((item) => {
                    const matchedStandard = standards.find(s => s.service_standard_id === item.service_standard_id);
                    return (
                      <tr key={item.service_interval_id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="p-3 font-semibold text-blue-400">{matchedStandard ? matchedStandard.code : '—'}</td>
                        <td className="p-3 font-semibold text-emerald-400">{item.code}</td>
                        <td className="p-3 font-semibold">{item.interval ?? 'N/A'}</td>
                        <td className="p-3 text-slate-400">{item.description || '—'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.is_active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-3">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.service_interval_id, 'service_intervals')}
                            className="text-xs text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* TAB 3: THRESHOLDS (Edit only) */}
          {activeTab === 'thresholds' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                  <th className="p-3">PM Threshold</th>
                  <th className="p-3">PM Hrs Converter</th>
                  <th className="p-3">PM Calendar Converter</th>
                  <th className="p-3">Average Lookback</th>
                  <th className="p-3">Updated At</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {thresholds.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No service thresholds found.</td>
                  </tr>
                ) : (
                  thresholds.map((item) => (
                    <tr key={item.thresholds_id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="p-3 font-semibold text-amber-400">{item.pm_threshold ?? '0'}</td>
                      <td className="p-3 text-slate-300">{item.pm_hrs_converter ?? '—'}</td>
                      <td className="p-3 text-slate-300">{item.pm_calendar_converter ?? '—'}</td>
                      <td className="p-3 text-slate-300">{item.average_lookback ?? '—'}</td>
                      <td className="p-3 font-mono text-xs text-slate-400">
                        {item.updated_at ? new Date(item.updated_at).toLocaleString() : '—'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">
                {editingId ? 'Edit Record' : 'Add New Record'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {activeTab === 'standards' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Standard Code</label>
                    <input
                      type="text"
                      required
                      value={standardForm.code}
                      onChange={(e) => setStandardForm({ ...standardForm, code: e.target.value })}
                      placeholder="e.g. PM_STD_01"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      value={standardForm.description}
                      onChange={(e) => setStandardForm({ ...standardForm, description: e.target.value })}
                      placeholder="Describe maintenance standard..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {activeTab === 'intervals' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Service Standard Reference</label>
                    <select
                      required
                      value={intervalForm.service_standard_id}
                      onChange={(e) => setIntervalForm({ ...intervalForm, service_standard_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Service Standard</option>
                      {standards.map((std) => (
                        <option key={std.service_standard_id} value={std.service_standard_id}>
                          {std.code} {std.description ? `- ${std.description.substring(0, 40)}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Code (Fixed PM Value)</label>
                    <select
                      required
                      value={intervalForm.code}
                      onChange={(e) => setIntervalForm({ ...intervalForm, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      {PM_CODES.map((pmCode) => (
                        <option key={pmCode} value={pmCode}>{pmCode}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Interval</label>
                    <input
                      type="number"
                      min="0"
                      value={intervalForm.interval}
                      onChange={(e) => setIntervalForm({ ...intervalForm, interval: e.target.value })}
                      placeholder="e.g. 5000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={intervalForm.description || ''}
                      onChange={(e) => setIntervalForm({ ...intervalForm, description: e.target.value })}
                      placeholder="Optional details..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="is_active_chk"
                      checked={intervalForm.is_active}
                      onChange={(e) => setIntervalForm({ ...intervalForm, is_active: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="is_active_chk" className="text-xs font-semibold uppercase text-slate-400 cursor-pointer">Is Active</label>
                  </div>
                </>
              )}

              {activeTab === 'thresholds' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">PM Threshold</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={thresholdForm.pm_threshold}
                      onChange={(e) => setThresholdForm({ ...thresholdForm, pm_threshold: e.target.value })}
                      placeholder="e.g. 1000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">PM Hrs Converter</label>
                    <input
                      type="number"
                      step="any"
                      value={thresholdForm.pm_hrs_converter}
                      onChange={(e) => setThresholdForm({ ...thresholdForm, pm_hrs_converter: e.target.value })}
                      placeholder="e.g. 1.0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">PM Calendar Converter</label>
                    <input
                      type="number"
                      step="any"
                      value={thresholdForm.pm_calendar_converter}
                      onChange={(e) => setThresholdForm({ ...thresholdForm, pm_calendar_converter: e.target.value })}
                      placeholder="e.g. 30"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Average Lookback</label>
                    <input
                      type="number"
                      step="any"
                      value={thresholdForm.average_lookback}
                      onChange={(e) => setThresholdForm({ ...thresholdForm, average_lookback: e.target.value })}
                      placeholder="e.g. 30"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingId ? 'Update Record' : 'Save Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceStandards;