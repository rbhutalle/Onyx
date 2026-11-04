import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
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

type TabType = 'standards' | 'intervals' | 'thresholds';

const PM_CODES = ['PM2', 'PM3', 'PM4', 'PM5', 'PM6', 'PM7'];

export function ServiceStandards() {
  const [activeTab, setActiveTab] = useState<TabType>('standards');

  const [standards, setStandards] = useState<StandardRecord[]>([]);
  const [intervals, setIntervals] = useState<IntervalRecord[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdRecord[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  // Filter & Search state
  const [selectedStandardFilter, setSelectedStandardFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const stdRes = await supabase.from('service_standards').select('*').order('code');
      if (stdRes.error) throw stdRes.error;
      setStandards(stdRes.data || []);

      if (activeTab === 'intervals') {
        const { data, error } = await supabase.from('service_intervals').select('*').order('code');
        if (error) throw error;
        setIntervals(data || []);
      } else if (activeTab === 'thresholds') {
        const { data, error } = await supabase.from('service_thresholds').select('*');
        if (error) throw error;
        setThresholds(data || []);
      }
    } catch {
      setErrorMsg(`Failed to load ${activeTab} data. Please check table permissions.`);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setCurrentPage(1);
        setSearchQuery('');
        setSelectedStandardFilter('all');
        loadData();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeTab, loadData]);

  // Reset pagination when search query or filter changes
  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) setCurrentPage(1);
    });
    return () => { isMounted = false; };
  }, [searchQuery, selectedStandardFilter]);

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
      loadData();
    } catch {
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
          code: standardForm.code.trim(), 
          description: standardForm.description.trim() 
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
          description: intervalForm.description ? intervalForm.description.trim() : null,
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
          updated_at: new Date().toISOString()
        };
        if (editingId) {
          const { error } = await supabase.from('service_thresholds').update(payload).eq('thresholds_id', editingId);
          if (error) throw error;
        }
        setSuccessMsg('Service Threshold updated successfully!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadData();
    } catch {
      setErrorMsg('Failed to save record. Please check required fields or constraints.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & Search computation
  const filteredStandards = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return standards.filter((s) => 
      s.code.toLowerCase().includes(q) || 
      (s.description || '').toLowerCase().includes(q)
    );
  }, [standards, searchQuery]);

  const filteredIntervals = useMemo(() => {
    return intervals.filter((item) => {
      const matchesStandard = selectedStandardFilter === 'all' || item.service_standard_id === selectedStandardFilter;
      const q = searchQuery.toLowerCase();
      const codeMatch = (item.code || '').toLowerCase().includes(q);
      const descMatch = (item.description || '').toLowerCase().includes(q);
      return matchesStandard && (codeMatch || descMatch);
    });
  }, [intervals, selectedStandardFilter, searchQuery]);

  const filteredThresholds = useMemo(() => {
    return thresholds;
  }, [thresholds]);

  const paginatedList = useMemo(() => {
    const list = activeTab === 'standards' ? filteredStandards : activeTab === 'intervals' ? filteredIntervals : filteredThresholds;
    const start = (currentPage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [activeTab, filteredStandards, filteredIntervals, filteredThresholds, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    const totalLength = activeTab === 'standards' ? filteredStandards.length : activeTab === 'intervals' ? filteredIntervals.length : filteredThresholds.length;
    return Math.ceil(totalLength / pageSize) || 1;
  }, [activeTab, filteredStandards.length, filteredIntervals.length, filteredThresholds.length, pageSize]);

  const totalCurrentEntries = activeTab === 'standards' ? filteredStandards.length : activeTab === 'intervals' ? filteredIntervals.length : filteredThresholds.length;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-(--border-main) pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-(--accent-subtle) text-(--text-primary) rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Service Standards Management</h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">Configure preventive maintenance standards, intervals, and operational thresholds.</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="shrink-0 bg-(--accent-subtle) border border-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="shrink-0 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Clean Tab Navigation */}
      <div className="shrink-0 flex border-b border-(--border-main) gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('standards')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'standards'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Service Standards</span>
        </button>

        <button
          onClick={() => setActiveTab('intervals')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'intervals'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Service Intervals</span>
        </button>

        <button
          onClick={() => setActiveTab('thresholds')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'thresholds'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Service Thresholds</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-surface) border border-(--border-main) shadow-xs rounded-xl p-4 overflow-hidden space-y-3">
        {/* Toolbar / Actions */}
        <div className="shrink-0 flex flex-wrap items-center gap-2">
          {activeTab === 'intervals' && (
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-(--text-muted)" />
              <select
                value={selectedStandardFilter}
                onChange={(e) => setSelectedStandardFilter(e.target.value)}
                className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
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

          {activeTab !== 'thresholds' ? (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-(--text-muted)" />
              <input
                type="text"
                placeholder={activeTab === 'standards' ? 'Filter standards...' : 'Search by PM Code or description...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-(--text-primary)"
              />
            </div>
          ) : (
            <div className="flex-1"></div>
          )}

          {activeTab !== 'thresholds' && (
            <button
              onClick={handleOpenAdd}
              className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record</span>
            </button>
          )}
        </div>

        {/* Scrollable Container with Sticky Table Headers */}
        <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
          {loading ? (
            <div className="h-full flex items-center justify-center text-(--text-muted) gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-(--text-primary)" />
              <span>Loading records...</span>
            </div>
          ) : activeTab === 'standards' ? (
            filteredStandards.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8 text-center text-(--text-muted) text-xs">
                No service standards found. Click &quot;Add Record&quot; above.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {paginatedList.map((item) => {
                    const std = item as StandardRecord;
                    return (
                      <tr key={std.service_standard_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="py-2 px-3 font-semibold text-(--text-primary)">{std.code}</td>
                        <td className="py-2 px-3 text-(--text-muted)">{std.description}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(std)}
                              className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(std.service_standard_id, 'service_standards')}
                              className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : activeTab === 'intervals' ? (
            filteredIntervals.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8 text-center text-(--text-muted) text-xs">
                No service intervals found. Click &quot;Add Record&quot; above.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                    <th className="py-2 px-3">Standard Code</th>
                    <th className="py-2 px-3">PM Code</th>
                    <th className="py-2 px-3">Interval</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {paginatedList.map((item) => {
                    const intervalRec = item as IntervalRecord;
                    const matchedStandard = standards.find(s => s.service_standard_id === intervalRec.service_standard_id);
                    return (
                      <tr key={intervalRec.service_interval_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="py-2 px-3 font-semibold text-(--text-primary)">{matchedStandard ? matchedStandard.code : '—'}</td>
                        <td className="py-2 px-3 font-semibold text-emerald-600 dark:text-emerald-400">{intervalRec.code}</td>
                        <td className="py-2 px-3 font-semibold text-(--text-primary)">{intervalRec.interval ?? 'N/A'}</td>
                        <td className="py-2 px-3 text-(--text-muted)">{intervalRec.description || '—'}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${intervalRec.is_active ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-(--accent-subtle) text-(--text-muted) border border-(--border-main)'}`}>
                            {intervalRec.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(intervalRec)}
                              className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(intervalRec.service_interval_id, 'service_intervals')}
                              className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : (
            filteredThresholds.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8 text-center text-(--text-muted) text-xs">
                No service thresholds found.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                    <th className="py-2 px-3">PM Threshold</th>
                    <th className="py-2 px-3">PM Hrs Converter</th>
                    <th className="py-2 px-3">PM Calendar Converter</th>
                    <th className="py-2 px-3">Average Lookback</th>
                    <th className="py-2 px-3">Updated At</th>
                    <th className="py-2 px-3 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {paginatedList.map((item) => {
                    const thresholdRec = item as ThresholdRecord;
                    return (
                      <tr key={thresholdRec.thresholds_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="py-2 px-3 font-semibold text-amber-600 dark:text-amber-400">{thresholdRec.pm_threshold ?? '0'}</td>
                        <td className="py-2 px-3 text-(--text-secondary)">{thresholdRec.pm_hrs_converter ?? '—'}</td>
                        <td className="py-2 px-3 text-(--text-secondary)">{thresholdRec.pm_calendar_converter ?? '—'}</td>
                        <td className="py-2 px-3 text-(--text-secondary)">{thresholdRec.average_lookback ?? '—'}</td>
                        <td className="py-2 px-3 font-mono text-[10px] text-(--text-muted)">
                          {thresholdRec.updated_at ? new Date(thresholdRec.updated_at).toLocaleString() : '—'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleOpenEdit(thresholdRec)}
                            className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* Pagination */}
        {!loading && totalCurrentEntries > 0 && (
          <div className="shrink-0 flex items-center justify-between pt-2 text-xs text-(--text-muted)">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCurrentEntries)} of {totalCurrentEntries} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 bg-(--bg-elevated) border border-(--border-main) rounded hover:opacity-80 disabled:opacity-40 cursor-pointer text-(--text-primary)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="p-1 bg-(--bg-elevated) border border-(--border-main) rounded hover:opacity-80 disabled:opacity-40 cursor-pointer text-(--text-primary)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">
                {editingId ? 'Edit Record' : 'Add New Record'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                {activeTab === 'standards' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Standard Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={standardForm.code}
                        onChange={(e) => setStandardForm({ ...standardForm, code: e.target.value })}
                        placeholder="e.g. PM_STD_01"
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={standardForm.description}
                        onChange={(e) => setStandardForm({ ...standardForm, description: e.target.value })}
                        placeholder="Describe maintenance standard..."
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'intervals' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Service Standard Reference <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={intervalForm.service_standard_id}
                        onChange={(e) => setIntervalForm({ ...intervalForm, service_standard_id: e.target.value })}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
                      >
                        <option value="">Select Service Standard...</option>
                        {standards.map((std) => (
                          <option key={std.service_standard_id} value={std.service_standard_id}>
                            {std.code} {std.description ? `- ${std.description.substring(0, 40)}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Code (Fixed PM Value) <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={intervalForm.code}
                        onChange={(e) => setIntervalForm({ ...intervalForm, code: e.target.value })}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
                      >
                        {PM_CODES.map((pmCode) => (
                          <option key={pmCode} value={pmCode}>{pmCode}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">Interval</label>
                      <input
                        type="number"
                        min="0"
                        value={intervalForm.interval}
                        onChange={(e) => setIntervalForm({ ...intervalForm, interval: e.target.value })}
                        placeholder="e.g. 5000"
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">Description</label>
                      <input
                        type="text"
                        value={intervalForm.description || ''}
                        onChange={(e) => setIntervalForm({ ...intervalForm, description: e.target.value })}
                        placeholder="Optional details..."
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="is_active_chk"
                        checked={intervalForm.is_active}
                        onChange={(e) => setIntervalForm({ ...intervalForm, is_active: e.target.checked })}
                        className="rounded bg-(--bg-elevated) border border-(--border-main) text-(--btn-primary-bg) focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="is_active_chk" className="text-xs font-semibold text-(--text-primary) cursor-pointer">Is Active</label>
                    </div>
                  </>
                )}

                {activeTab === 'thresholds' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        PM Threshold <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={thresholdForm.pm_threshold}
                        onChange={(e) => setThresholdForm({ ...thresholdForm, pm_threshold: e.target.value })}
                        placeholder="e.g. 1000"
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">PM Hrs Converter</label>
                      <input
                        type="number"
                        step="any"
                        value={thresholdForm.pm_hrs_converter}
                        onChange={(e) => setThresholdForm({ ...thresholdForm, pm_hrs_converter: e.target.value })}
                        placeholder="e.g. 1.0"
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">PM Calendar Converter</label>
                      <input
                        type="number"
                        step="any"
                        value={thresholdForm.pm_calendar_converter}
                        onChange={(e) => setThresholdForm({ ...thresholdForm, pm_calendar_converter: e.target.value })}
                        placeholder="e.g. 30"
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">Average Lookback</label>
                      <input
                        type="number"
                        step="any"
                        value={thresholdForm.average_lookback}
                        onChange={(e) => setThresholdForm({ ...thresholdForm, average_lookback: e.target.value })}
                        placeholder="e.g. 30"
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Changes</span>
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