import { useState, useEffect } from 'react';
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
  Loader2
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

export function JobOrderSettings() {
  const [activeTab, setActiveTab] = useState<'types' | 'priorities' | 'statuses'>('types');

  const [types, setTypes] = useState<JobOrderTypeRecord[]>([]);
  const [priorities, setPriorities] = useState<JobOrderPriorityRecord[]>([]);
  const [statuses, setStatuses] = useState<JobOrderStatusRecord[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Forms state
  const [typeForm, setTypeForm] = useState({ type_desc: '' });
  const [priorityForm, setPriorityForm] = useState({ priority_desc: '' });
  const [statusForm, setStatusForm] = useState({ status_name: '' });

  // Define loadTabData directly inside useEffect to prevent cascading render warnings
  useEffect(() => {
    let isMounted = true;

    async function loadTabData() {
      try {
        setErrorMsg(null);
        if (activeTab === 'types') {
          const { data, error } = await supabase.from('joborder_type').select('*').order('type_desc');
          if (error) throw error;
          if (isMounted) setTypes(data || []);
        } else if (activeTab === 'priorities') {
          const { data, error } = await supabase.from('joborder_priority').select('*').order('priority_desc');
          if (error) throw error;
          if (isMounted) setPriorities(data || []);
        } else if (activeTab === 'statuses') {
          const { data, error } = await supabase.from('joborder_status').select('*').order('status_name');
          if (error) throw error;
          if (isMounted) setStatuses(data || []);
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

  // Reusable refresh handler for mutations
  const refreshTabData = async () => {
    try {
      if (activeTab === 'types') {
        const { data } = await supabase.from('joborder_type').select('*').order('type_desc');
        if (data) setTypes(data);
      } else if (activeTab === 'priorities') {
        const { data } = await supabase.from('joborder_priority').select('*').order('priority_desc');
        if (data) setPriorities(data);
      } else if (activeTab === 'statuses') {
        const { data } = await supabase.from('joborder_status').select('*').order('status_name');
        if (data) setStatuses(data);
      }
    } catch (err) {
      console.error('Error refreshing tab data:', err);
    }
  };

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
      refreshTabData();
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
      if (activeTab === 'types') {
        const payload = { type_desc: typeForm.type_desc };
        if (editingId) {
          const { error } = await supabase.from('joborder_type').update(payload).eq('type_id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('joborder_type').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Job Order Type saved successfully!');
      } else if (activeTab === 'priorities') {
        const payload = { priority_desc: priorityForm.priority_desc };
        if (editingId) {
          const { error } = await supabase.from('joborder_priority').update(payload).eq('priority_id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('joborder_priority').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Job Order Priority saved successfully!');
      } else if (activeTab === 'statuses') {
        const payload = { status_name: statusForm.status_name };
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
      refreshTabData();
    } catch (err: unknown) {
      console.error('Error saving record:', err);
      setErrorMsg('Failed to save record. Please check required fields or constraints.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
          <Wrench className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Job Order Configuration</h1>
          <p className="text-sm text-slate-400">Configure job order types, priority levels, and workflow statuses.</p>
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
          onClick={() => setActiveTab('types')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'types'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Job Order Types</span>
        </button>

        <button
          onClick={() => setActiveTab('priorities')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'priorities'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Job Order Priorities</span>
        </button>

        <button
          onClick={() => setActiveTab('statuses')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'statuses'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Job Order Statuses</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex justify-end">
          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>

        <div className="overflow-y-auto overflow-x-auto max-h-[calc(100vh-360px)] border border-slate-800/60 rounded-lg">
          {/* TAB 1: JOB ORDER TYPES */}
          {activeTab === 'types' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Type Description</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {types.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-slate-500">No job order types found.</td>
                  </tr>
                ) : (
                  types.map((item) => (
                    <tr key={item.type_id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-100">{item.type_desc}</td>
                      <td className="p-3 text-right space-x-3">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.type_id, 'joborder_type', 'type_id')}
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

          {/* TAB 2: JOB ORDER PRIORITIES */}
          {activeTab === 'priorities' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Priority Description</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {priorities.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-slate-500">No job order priorities found.</td>
                  </tr>
                ) : (
                  priorities.map((item) => (
                    <tr key={item.priority_id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-100">{item.priority_desc}</td>
                      <td className="p-3 text-right space-x-3">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.priority_id, 'joborder_priority', 'priority_id')}
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

          {/* TAB 3: JOB ORDER STATUSES */}
          {activeTab === 'statuses' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Status Name</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {statuses.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-slate-500">No job order statuses found.</td>
                  </tr>
                ) : (
                  statuses.map((item) => (
                    <tr key={item.status_id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-100">{item.status_name}</td>
                      <td className="p-3 text-right space-x-3">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.status_id, 'joborder_status', 'status_id')}
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
              {activeTab === 'types' && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Type Description</label>
                  <input
                    type="text"
                    required
                    value={typeForm.type_desc}
                    onChange={(e) => setTypeForm({ ...typeForm, type_desc: e.target.value })}
                    placeholder="e.g. Corrective, Preventive"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {activeTab === 'priorities' && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Priority Description</label>
                  <input
                    type="text"
                    required
                    value={priorityForm.priority_desc}
                    onChange={(e) => setPriorityForm({ ...priorityForm, priority_desc: e.target.value })}
                    placeholder="e.g. High, Medium, Low"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {activeTab === 'statuses' && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Status Name</label>
                  <input
                    type="text"
                    required
                    value={statusForm.status_name}
                    onChange={(e) => setStatusForm({ ...statusForm, status_name: e.target.value })}
                    placeholder="e.g. Open, In Progress, Closed"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow disabled:opacity-50"
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