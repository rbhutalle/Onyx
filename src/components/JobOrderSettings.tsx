import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Wrench, 
  AlertCircle, 
  Plus, 
  CheckCircle, 
  X,
  Edit2,
  Trash2,
  CheckSquare,
  Layers,
  Save,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface JobOrderTypeRecord {
  type_id: string;
  type_desc: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface JobOrderPriorityRecord {
  priority_id: string;
  priority_desc: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface JobOrderStatusRecord {
  status_id: string;
  status_name: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

type TabType = 'types' | 'priorities' | 'statuses';

export function JobOrderSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('types');

  const [types, setTypes] = useState<JobOrderTypeRecord[]>([]);
  const [priorities, setPriorities] = useState<JobOrderPriorityRecord[]>([]);
  const [statuses, setStatuses] = useState<JobOrderStatusRecord[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Search and Pagination States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Forms state
  const [typeForm, setTypeForm] = useState({ type_desc: '' });
  const [priorityForm, setPriorityForm] = useState({ priority_desc: '' });
  const [statusForm, setStatusForm] = useState({ status_name: '' });

  const loadTabData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      if (activeTab === 'types') {
        const { data, error } = await supabase.from('joborder_type').select('*').order('type_desc');
        if (error) throw error;
        setTypes(data || []);
      } else if (activeTab === 'priorities') {
        const { data, error } = await supabase.from('joborder_priority').select('*').order('priority_desc');
        if (error) throw error;
        setPriorities(data || []);
      } else if (activeTab === 'statuses') {
        const { data, error } = await supabase.from('joborder_status').select('*').order('status_name');
        if (error) throw error;
        setStatuses(data || []);
      }
    } catch {
      setErrorMsg(`Failed to load ${activeTab} data. Please check table permissions.`);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Combined effect safely wrapping tab switches, resetters, and data fetching inside microtasks
  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setCurrentPage(1);
        setSearchQuery('');
        loadTabData();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeTab, loadTabData]);

  // Reset pagination when search query changes
  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) setCurrentPage(1);
    });
    return () => { isMounted = false; };
  }, [searchQuery]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setTypeForm({ type_desc: '' });
    setPriorityForm({ priority_desc: '' });
    setStatusForm({ status_name: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: JobOrderTypeRecord | JobOrderPriorityRecord | JobOrderStatusRecord) => {
    if (activeTab === 'types') {
      const rec = item as JobOrderTypeRecord;
      setEditingId(rec.type_id);
      setTypeForm({ type_desc: rec.type_desc || '' });
    } else if (activeTab === 'priorities') {
      const rec = item as JobOrderPriorityRecord;
      setEditingId(rec.priority_id);
      setPriorityForm({ priority_desc: rec.priority_desc || '' });
    } else if (activeTab === 'statuses') {
      const rec = item as JobOrderStatusRecord;
      setEditingId(rec.status_id);
      setStatusForm({ status_name: rec.status_name || '' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, tableName: 'joborder_type' | 'joborder_priority' | 'joborder_status', pkField: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from(tableName).delete().eq(pkField, id);
      if (error) throw error;

      setSuccessMsg('Record deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadTabData();
    } catch {
      setErrorMsg('Failed to delete record. Check foreign key constraints.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (activeTab === 'types') {
        const payload = { type_desc: typeForm.type_desc.trim(), updated_at: new Date().toISOString() };
        if (editingId) {
          const { error } = await supabase.from('joborder_type').update(payload).eq('type_id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('joborder_type').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Job Order Type saved successfully!');
      } else if (activeTab === 'priorities') {
        const payload = { priority_desc: priorityForm.priority_desc.trim(), updated_at: new Date().toISOString() };
        if (editingId) {
          const { error } = await supabase.from('joborder_priority').update(payload).eq('priority_id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('joborder_priority').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Job Order Priority saved successfully!');
      } else if (activeTab === 'statuses') {
        const payload = { status_name: statusForm.status_name.trim(), updated_at: new Date().toISOString() };
        if (editingId) {
          const { error } = await supabase.from('joborder_status').update(payload).eq('status_id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('joborder_status').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Job Order Status saved successfully!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadTabData();
    } catch {
      setErrorMsg('Failed to save record. Please check required fields or constraints.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered and Paginated records calculation
  const filteredList = useMemo(() => {
    if (activeTab === 'types') {
      return types.filter(item => item.type_desc.toLowerCase().includes(searchQuery.toLowerCase()));
    } else if (activeTab === 'priorities') {
      return priorities.filter(item => item.priority_desc.toLowerCase().includes(searchQuery.toLowerCase()));
    } else {
      return statuses.filter(item => item.status_name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
  }, [activeTab, types, priorities, statuses, searchQuery]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-(--border-main) pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-(--accent-subtle) text-(--text-primary) rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Job Order Configuration</h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">Configure job order types, priority levels, and workflow statuses.</p>
          </div>
        </div>
      </div>

      {/* Messages */}
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

      {/* Main Tab Navigation */}
      <div className="shrink-0 flex border-b border-(--border-main) gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('types')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'types'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Job Order Types</span>
        </button>

        <button
          onClick={() => setActiveTab('priorities')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'priorities'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Job Order Priorities</span>
        </button>

        <button
          onClick={() => setActiveTab('statuses')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'statuses'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Job Order Statuses</span>
        </button>
      </div>

      {/* Main Container Body */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-surface) border border-(--border-main) shadow-xs rounded-xl p-4 overflow-hidden space-y-3">
        <div className="shrink-0 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-(--text-muted)" />
            <input
              type="text"
              placeholder={`Filter ${activeTab === 'types' ? 'types' : activeTab === 'priorities' ? 'priorities' : 'statuses'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-(--text-primary)"
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
          {loading ? (
            <div className="h-full flex items-center justify-center text-(--text-muted) gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-(--text-primary)" />
              <span>Loading records...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="h-full flex items-center justify-center p-8 text-center text-(--text-muted) text-xs">
              No records found. Click &quot;Add Record&quot; above.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                  <th className="py-2 px-3">
                    {activeTab === 'types' ? 'Type Description' : activeTab === 'priorities' ? 'Priority Description' : 'Status Name'}
                  </th>
                  <th className="py-2 px-3 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                {paginatedList.map((item) => {
                  const recordId = activeTab === 'types' 
                    ? (item as JobOrderTypeRecord).type_id 
                    : activeTab === 'priorities' 
                    ? (item as JobOrderPriorityRecord).priority_id 
                    : (item as JobOrderStatusRecord).status_id;
                  
                  const displayText = activeTab === 'types' 
                    ? (item as JobOrderTypeRecord).type_desc 
                    : activeTab === 'priorities' 
                    ? (item as JobOrderPriorityRecord).priority_desc 
                    : (item as JobOrderStatusRecord).status_name;

                  const tableName = activeTab === 'types' ? 'joborder_type' : activeTab === 'priorities' ? 'joborder_priority' : 'joborder_status';
                  const pkField = activeTab === 'types' ? 'type_id' : activeTab === 'priorities' ? 'priority_id' : 'status_id';

                  return (
                    <tr key={recordId} className="hover:bg-(--accent-subtle) transition-colors">
                      <td className="py-2 px-3 font-medium text-(--text-primary)">{displayText}</td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(recordId, tableName, pkField)}
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
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredList.length > 0 && (
          <div className="shrink-0 flex items-center justify-between pt-2 text-xs text-(--text-muted)">
            <span>Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredList.length)} of {filteredList.length} entries</span>
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
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[92vh] flex flex-col">
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
                {activeTab === 'types' && (
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                      Type Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Corrective, Preventive"
                      value={typeForm.type_desc}
                      onChange={(e) => setTypeForm({ ...typeForm, type_desc: e.target.value })}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                    />
                  </div>
                )}

                {activeTab === 'priorities' && (
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                      Priority Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. High, Medium, Low"
                      value={priorityForm.priority_desc}
                      onChange={(e) => setPriorityForm({ ...priorityForm, priority_desc: e.target.value })}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                    />
                  </div>
                )}

                {activeTab === 'statuses' && (
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                      Status Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Open, In Progress, Closed"
                      value={statusForm.status_name}
                      onChange={(e) => setStatusForm({ ...statusForm, status_name: e.target.value })}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                    />
                  </div>
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

export default JobOrderSettings;