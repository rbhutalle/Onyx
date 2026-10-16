import { useState, useEffect } from 'react';
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
    } catch (err: unknown) {
      console.error('Error fetching employees:', err);
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
      } catch (err: unknown) {
        console.error('Error fetching employees:', err);
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
    } catch (err: unknown) {
      console.error('Error deleting record:', err);
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
    } catch (err: unknown) {
      console.error('Error saving record:', err);
      setErrorMsg('Failed to save record. Please check required fields or uniqueness constraints (Code/Name).');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
          <Users className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Employee Registry</h1>
          <p className="text-sm text-slate-400">Manage staff, mechanics, and operational personnel accounts and rates.</p>
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

      <div className="flex border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 border-blue-500 text-blue-400 bg-blue-950/20">
          <Users className="w-4 h-4" />
          <span>Registered Employees ({employees.length})</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex justify-end items-center gap-4">
          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>

        <div className="overflow-y-auto overflow-x-auto max-h-[calc(100vh-360px)] border border-slate-800/60 rounded-lg">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                <th className="p-3">Employee Code</th>
                <th className="p-3">Employee Name</th>
                <th className="p-3">Rate / Hour</th>
                <th className="p-3">Sell Rate / Hour</th>
                <th className="p-3">Status</th>
                <th className="p-3">Supervisor</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">No employees registered.</td>
                </tr>
              ) : (
                employees.map((item) => (
                  <tr key={item.employee_id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="p-3 font-mono text-blue-400">{item.employee_code}</td>
                    <td className="p-3 font-semibold text-slate-100">{item.employee_name}</td>
                    <td className="p-3 font-mono">₱{(item.rate_per_hour ?? 0).toFixed(2)}</td>
                    <td className="p-3 font-mono">₱{(item.sell_rate_per_hour ?? 0).toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${item.is_active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' : 'bg-slate-800 text-slate-400'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      {item.is_supervisor && (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-950 text-blue-300 border border-blue-800/50">
                          Supervisor
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-3">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.employee_id)}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">
                {editingId ? 'Edit Employee' : 'Add Employee'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Employee Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={employeeForm.employee_code}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, employee_code: e.target.value })}
                    placeholder="e.g. EMP-001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Employee Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={employeeForm.employee_name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, employee_name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Rate per Hour (₱)</label>
                  <input
                    type="number"
                    step="any"
                    value={employeeForm.rate_per_hour}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, rate_per_hour: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Sell Rate per Hour (₱)</label>
                  <input
                    type="number"
                    step="any"
                    value={employeeForm.sell_rate_per_hour}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, sell_rate_per_hour: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={employeeForm.is_active}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Active Status</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={employeeForm.is_supervisor}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, is_supervisor: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Is Supervisor</span>
                </label>
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