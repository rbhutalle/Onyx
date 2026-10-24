import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Users, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  X,
  Edit2,
  Trash2,
  Save,
  Loader2
} from 'lucide-react';

interface EmployeeRecord {
  employee_id: string;
  employee_code: string;
  employee_name: string;
  rate_per_hour: number;
  sell_rate_per_hour: number;
  is_active: boolean;
  is_supervisor: boolean;
  [key: string]: unknown;
}

export function EmployeeRegistry() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [employeeForm, setEmployeeForm] = useState({ 
    employee_code: '', 
    employee_name: '', 
    rate_per_hour: '0', 
    sell_rate_per_hour: '0', 
    is_active: true,
    is_supervisor: false
  });

  const loadEmployees = async () => {
    try {
      setErrorMsg(null);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('employee_name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch {
      setErrorMsg('Failed to load employee registry data. Please check table permissions.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function initFetch() {
      try {
        setErrorMsg(null);
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .order('employee_name', { ascending: true });

        if (error) throw error;
        if (isMounted) {
          setEmployees(data || []);
        }
      } catch {
        if (isMounted) {
          setErrorMsg('Failed to load employee registry data. Please check table permissions.');
        }
      }
    }
    initFetch();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setEmployeeForm({ 
      employee_code: '', 
      employee_name: '', 
      rate_per_hour: '0', 
      sell_rate_per_hour: '0', 
      is_active: true,
      is_supervisor: false 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: EmployeeRecord) => {
    setEditingId(item.employee_id);
    setEmployeeForm({
      employee_code: item.employee_code || '',
      employee_name: item.employee_name || '',
      rate_per_hour: String(item.rate_per_hour ?? 0),
      sell_rate_per_hour: String(item.sell_rate_per_hour ?? 0),
      is_active: Boolean(item.is_active),
      is_supervisor: Boolean(item.is_supervisor),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('employee_id', id);

      if (error) throw error;

      setSuccessMsg('Employee deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadEmployees();
    } catch {
      setErrorMsg('Failed to delete record. Check foreign key constraints.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.employee_code.trim() || !employeeForm.employee_name.trim()) {
      setErrorMsg('Employee Code and Employee Name are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = { 
        employee_code: employeeForm.employee_code.trim(), 
        employee_name: employeeForm.employee_name.trim(),
        rate_per_hour: Number(employeeForm.rate_per_hour) || 0,
        sell_rate_per_hour: Number(employeeForm.sell_rate_per_hour) || 0,
        is_active: employeeForm.is_active,
        is_supervisor: employeeForm.is_supervisor
      };

      if (editingId) {
        const { error } = await supabase
          .from('employees')
          .update(payload)
          .eq('employee_id', editingId);

        if (error) throw error;
        setSuccessMsg('Employee updated successfully!');
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([payload]);

        if (error) throw error;
        setSuccessMsg('Employee registered successfully!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadEmployees(); 
    } catch {
      setErrorMsg('Failed to save record. Please check required fields or uniqueness constraints (Code/Name).');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
      {/* Page Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-(--border-main) pb-3">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 rounded-xl shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Employee Registry</h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">Manage staff, mechanics, and operational personnel accounts and rates.</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="shrink-0 bg-(--accent-subtle) border border-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs animate-fade-in">
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

      {/* Tab bar header */}
      <div className="shrink-0 flex border-b border-(--border-main) gap-2">
        <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 border-(--text-primary) text-(--text-primary) bg-(--accent-subtle) rounded-t-lg">
          <Users className="w-3.5 h-3.5" />
          <span>Registered Employees ({employees.length})</span>
        </div>
      </div>

      {/* Main Container Body */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-surface) border border-(--border-main) shadow-xs rounded-xl p-4 overflow-hidden space-y-3">
        <div className="shrink-0 flex justify-end items-center">
          <button
            onClick={handleOpenAdd}
            className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
        </div>

        {/* Individual sub-tab content panel & table container */}
        <div className="flex flex-col flex-1 min-h-0 space-y-2">
          <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                  <th className="py-2 px-3">Employee Code</th>
                  <th className="py-2 px-3">Employee Name</th>
                  <th className="py-2 px-3">Rate / Hour</th>
                  <th className="py-2 px-3">Sell Rate / Hour</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Supervisor</th>
                  <th className="py-2 px-3 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-(--text-muted) text-xs">No employees registered.</td>
                  </tr>
                ) : (
                  employees.map((item) => (
                    <tr key={item.employee_id} className="hover:bg-(--accent-subtle) transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-(--text-primary)">{item.employee_code ?? ''}</td>
                      <td className="py-2 px-3 font-semibold text-(--text-primary)">{item.employee_name ?? ''}</td>
                      <td className="py-2 px-3 font-mono text-(--text-secondary)">₱{(Number(item.rate_per_hour ?? 0)).toFixed(2)}</td>
                      <td className="py-2 px-3 font-mono text-(--text-secondary)">₱{(Number(item.sell_rate_per_hour ?? 0)).toFixed(2)}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${item.is_active ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50' : 'bg-(--accent-subtle) text-(--text-muted)'}`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {item.is_supervisor && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-(--accent-subtle) text-(--text-primary) border border-(--border-main)">
                            Supervisor
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.employee_id)}
                            className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">
                {editingId ? 'Edit Employee' : 'Add Employee'}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Employee Code <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={employeeForm.employee_code}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, employee_code: e.target.value })}
                      placeholder="e.g. EMP-001"
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Employee Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={employeeForm.employee_name}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, employee_name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Rate per Hour (₱)</label>
                    <input
                      type="number"
                      step="any"
                      value={employeeForm.rate_per_hour}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, rate_per_hour: e.target.value })}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Sell Rate per Hour (₱)</label>
                    <input
                      type="number"
                      step="any"
                      value={employeeForm.sell_rate_per_hour}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, sell_rate_per_hour: e.target.value })}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-(--text-muted) font-semibold">
                    <input
                      type="checkbox"
                      checked={employeeForm.is_active}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-(--border-main) bg-(--bg-elevated) text-(--text-primary) focus:ring-0 cursor-pointer"
                    />
                    <span>Active Status</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-(--text-muted) font-semibold">
                    <input
                      type="checkbox"
                      checked={employeeForm.is_supervisor}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, is_supervisor: e.target.checked })}
                      className="w-4 h-4 rounded border-(--border-main) bg-(--bg-elevated) text-(--text-primary) focus:ring-0 cursor-pointer"
                    />
                    <span>Is Supervisor</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingId ? 'Update Employee' : 'Save Employee'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeRegistry;