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
      } catch {
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

  const refreshStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('operations_status')
        .select('*')
        .order('status_name', { ascending: true });

      if (error) throw error;
      setStatuses(data || []);
    } catch {
      // Unused error variable handled with ES2019+ catch
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
    } catch {
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
    } catch {
      setErrorMsg('Failed to save record. Please check required fields or schema constraints.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 border-b border-(--border-main) pb-4">
        <div className="p-2.5 bg-(--btn-primary-bg) text-(--btn-primary-text) rounded-xl">
          <Activity className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Operations Standards</h1>
          <p className="text-xs sm:text-sm text-(--text-muted)">Configure status definitions and descriptions for daily inspections.</p>
        </div>
      </div>

      {successMsg && (
        <div className="shrink-0 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="shrink-0 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Clean Tab Navigation */}
      <div className="shrink-0 flex border-b border-(--border-main) gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('statuses')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'statuses'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Operations Standards ({statuses.length})</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-elevated) border border-(--border-main) shadow-xs rounded-xl p-6 space-y-4">
        {/* Toolbar / Actions */}
        <div className="shrink-0 flex justify-end items-center gap-4">
          <button
            onClick={handleOpenAdd}
            className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Standard</span>
          </button>
        </div>

        {/* Scrollable Container with Sticky Table Headers */}
        <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-(--border-main) text-(--text-muted) text-xs uppercase bg-(--bg-surface) sticky top-0 z-10 shadow-xs">
                <th className="p-3">Status Name</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
              {statuses.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-(--text-muted)">No operations standards found.</td>
                </tr>
              ) : (
                statuses.map((item) => (
                  <tr key={item.operations_id} className="hover:bg-(--accent-subtle) transition-colors">
                    <td className="p-3 font-semibold text-(--text-primary)">
                      <span className="inline-block px-2.5 py-1 bg-(--accent-subtle) text-(--text-primary) border border-(--border-main) rounded-lg text-xs font-semibold">
                        {item.status_name || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3 text-(--text-muted)">{item.description || '—'}</td>
                    <td className="p-3 text-right space-x-3">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-xs text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.operations_id)}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
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
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-4 shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">
                {editingId ? 'Edit Operations Standard' : 'Add Operations Standard'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Status Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={statusForm.status_name}
                    onChange={(e) => setStatusForm({ ...statusForm, status_name: e.target.value })}
                    placeholder="e.g. Active, Standby, Maintenance..."
                    className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2.5 text-sm focus:outline-none focus:border-(--text-primary)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={statusForm.description}
                    onChange={(e) => setStatusForm({ ...statusForm, description: e.target.value })}
                    placeholder="Optional details or operational context..."
                    className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2.5 text-sm focus:outline-none focus:border-(--text-primary)"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-(--border-main) shrink-0 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-(--accent-subtle) hover:opacity-80 text-(--text-primary) rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow disabled:opacity-50"
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