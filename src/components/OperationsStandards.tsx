import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Activity, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  X,
  Edit2,
  Trash2,
  Save,
  Loader2
} from 'lucide-react';

interface OperationsStatusRecord {
  operations_id: string;
  status_name?: string;
  description?: string;
  [key: string]: unknown;
}

export function OperationsStandards() {
  const [activeTab, setActiveTab] = useState<'statuses'>('statuses');

  const [statuses, setStatuses] = useState<OperationsStatusRecord[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [statusForm, setStatusForm] = useState({ 
    status_name: '', 
    description: '' 
  });

  // Fetch statuses cleanly inside useEffect to prevent cascading render warnings
  useEffect(() => {
    let isMounted = true;

    async function loadStatuses() {
      try {
        setErrorMsg(null);
        const { data, error } = await supabase
          .from('operations_status')
          .select('*')
          .order('status_name', { ascending: true });

        if (error) throw error;
        if (isMounted) {
          setStatuses(data || []);
        }
      } catch (err: unknown) {
        console.error('Error fetching operations statuses:', err);
        if (isMounted) {
          setErrorMsg('Failed to load operations standards data. Please check table permissions.');
        }
      }
    }

    loadStatuses();

    return () => {
      isMounted = false;
    };
  }, []);

  // Reusable fetch for post-mutation updates without full page reloads
  const refreshStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('operations_status')
        .select('*')
        .order('status_name', { ascending: true });

      if (error) throw error;
      setStatuses(data || []);
    } catch (err) {
      console.error('Error refreshing statuses:', err);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setStatusForm({ status_name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: OperationsStatusRecord) => {
    setEditingId(item.operations_id);
    setStatusForm({
      status_name: item.status_name || '',
      description: item.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this operations standard?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('operations_status')
        .delete()
        .eq('operations_id', id);

      if (error) throw error;

      setSuccessMsg('Operations standard deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      refreshStatuses();
    } catch (err: unknown) {
      console.error('Error deleting record:', err);
      setErrorMsg('Failed to delete record. Check foreign key constraints.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusForm.status_name.trim()) {
      setErrorMsg('Status name is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // NOTE: Ensure your operations_status table has a 'description' column, 
      // or remove description from the payload if your table only contains status_name.
      const payload: { status_name: string; description?: string | null } = { 
        status_name: statusForm.status_name.trim(), 
        description: statusForm.description.trim() || null 
      };

      if (editingId) {
        const { error } = await supabase
          .from('operations_status')
          .update(payload)
          .eq('operations_id', editingId);

        if (error) throw error;
        setSuccessMsg('Operations standard updated successfully!');
      } else {
        const { error } = await supabase
          .from('operations_status')
          .insert([payload]);

        if (error) throw error;
        setSuccessMsg('Operations standard created successfully!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      refreshStatuses();
    } catch (err: unknown) {
      console.error('Error saving record:', err);
      setErrorMsg('Failed to save record. Please check required fields or schema constraints.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
          <Activity className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Operations Standards</h1>
          <p className="text-sm text-slate-400">Configure status definitions and descriptions for daily inspections.</p>
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
          onClick={() => setActiveTab('statuses')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'statuses'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Operations Standards ({statuses.length})</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        {/* Toolbar / Actions */}
        <div className="flex justify-end items-center gap-4">
          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Standard</span>
          </button>
        </div>

        {/* Scrollable Container with Sticky Table Headers */}
        <div className="overflow-y-auto overflow-x-auto max-h-[calc(100vh-360px)] border border-slate-800/60 rounded-lg">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                <th className="p-3">Status Name</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {statuses.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">No operations standards found.</td>
                </tr>
              ) : (
                statuses.map((item) => (
                  <tr key={item.operations_id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="p-3 font-semibold text-slate-100">
                      <span className="inline-block px-2.5 py-1 bg-blue-950 text-blue-300 border border-blue-800/50 rounded-lg text-xs font-semibold">
                        {item.status_name || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{item.description || '—'}</td>
                    <td className="p-3 text-right space-x-3">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.operations_id)}
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
        </div>
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">
                {editingId ? 'Edit Operations Standard' : 'Add Operations Standard'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Status Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={statusForm.status_name}
                  onChange={(e) => setStatusForm({ ...statusForm, status_name: e.target.value })}
                  placeholder="e.g. Active, Standby, Maintenance..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={statusForm.description}
                  onChange={(e) => setStatusForm({ ...statusForm, description: e.target.value })}
                  placeholder="Optional details or operational context..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

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
                  <span>{editingId ? 'Update Standard' : 'Save Standard'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OperationsStandards;