import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  CheckSquare, 
  Layers, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  X,
  Edit2,
  Trash2,
  Filter
} from 'lucide-react';

interface EquipmentTaskRecord {
  task_id: string;
  task_name: string;
  task_description: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface EquipmentTaskStandardRecord {
  task_standard_id: string;
  task_id: string;
  system_id: string;
  component_id: string;
  task_standard_desc: string;
  standard_time: number;
  item: string | null;
  est_labor_cost: number | null;
  est_materials_cost: number | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface EquipmentSystemRecord {
  system_id: string;
  system_code: string;
  system_desc: string;
  [key: string]: unknown;
}

interface EquipmentComponentRecord {
  component_id: string;
  system_id: string;
  component_code: string;
  component_desc: string;
  [key: string]: unknown;
}

export function TaskStandards() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'standards'>('tasks');

  const [tasks, setTasks] = useState<EquipmentTaskRecord[]>([]);
  const [standards, setStandards] = useState<EquipmentTaskStandardRecord[]>([]);
  const [systems, setSystems] = useState<EquipmentSystemRecord[]>([]);
  const [components, setComponents] = useState<EquipmentComponentRecord[]>([]);

  // Filter state for Standards tab
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>('all');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Forms state
  const [taskForm, setTaskForm] = useState({ task_name: '', task_description: '' });
  const [standardForm, setStandardForm] = useState({ 
    task_id: '', 
    system_id: '', 
    component_id: '', 
    task_standard_desc: '', 
    standard_time: '0', 
    item: '', 
    est_labor_cost: '0', 
    est_materials_cost: '0' 
  });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setErrorMsg(null);
        
        const tasksRes = await supabase.from('equipment_tasks').select('*').order('task_name');
        if (tasksRes.error) throw tasksRes.error;
        if (isMounted) setTasks(tasksRes.data || []);

        const standardsRes = await supabase.from('equipment_taskstandards').select('*');
        if (standardsRes.error) throw standardsRes.error;
        if (isMounted) setStandards(standardsRes.data || []);

        const systemsRes = await supabase.from('equipment_system').select('*').order('system_code');
        if (systemsRes.error) throw systemsRes.error;
        if (isMounted) setSystems(systemsRes.data || []);

        const compsRes = await supabase.from('equipment_component').select('*').order('component_code');
        if (compsRes.error) throw compsRes.error;
        if (isMounted) setComponents(compsRes.data || []);
      } catch (err: unknown) {
        console.error(`Error fetching data for ${activeTab}:`, err);
        if (isMounted) setErrorMsg(`Failed to load data. Please check table permissions or RLS policies.`);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setTaskForm({ task_name: '', task_description: '' });
    setStandardForm({ 
      task_id: tasks[0]?.task_id || '', 
      system_id: systems[0]?.system_id || '', 
      component_id: components[0]?.component_id || '', 
      task_standard_desc: '', 
      standard_time: '0', 
      item: '', 
      est_labor_cost: '0', 
      est_materials_cost: '0' 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: EquipmentTaskRecord | EquipmentTaskStandardRecord) => {
    if (activeTab === 'tasks') {
      const rec = item as EquipmentTaskRecord;
      setEditingId(rec.task_id);
      setTaskForm({
        task_name: rec.task_name || '',
        task_description: rec.task_description || '',
      });
    } else if (activeTab === 'standards') {
      const rec = item as EquipmentTaskStandardRecord;
      setEditingId(rec.task_standard_id);
      setStandardForm({
        task_id: rec.task_id || '',
        system_id: rec.system_id || '',
        component_id: rec.component_id || '',
        task_standard_desc: rec.task_standard_desc || '',
        standard_time: String(rec.standard_time ?? 0),
        item: rec.item || '',
        est_labor_cost: String(rec.est_labor_cost ?? 0),
        est_materials_cost: String(rec.est_materials_cost ?? 0),
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, tableName: 'equipment_tasks' | 'equipment_taskstandards', pkField: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from(tableName).delete().eq(pkField, id);
      if (error) throw error;

      setSuccessMsg('Record deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      window.location.reload();
    } catch (err: unknown) {
      console.error('Error deleting record:', err);
      setErrorMsg('Failed to delete record. Check foreign key dependencies.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      if (activeTab === 'tasks') {
        const payload = {
          task_name: taskForm.task_name,
          task_description: taskForm.task_description || null,
        };
        if (editingId) {
          const { error } = await supabase.from('equipment_tasks').update(payload).eq('task_id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('equipment_tasks').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Equipment Task saved successfully!');
      } else if (activeTab === 'standards') {
        const payload = {
          task_id: standardForm.task_id,
          system_id: standardForm.system_id,
          component_id: standardForm.component_id,
          task_standard_desc: standardForm.task_standard_desc,
          standard_time: Number(standardForm.standard_time) || 0,
          item: standardForm.item || null,
          est_labor_cost: Number(standardForm.est_labor_cost) || 0,
          est_materials_cost: Number(standardForm.est_materials_cost) || 0,
        };
        if (editingId) {
          const { error } = await supabase.from('equipment_taskstandards').update(payload).eq('task_standard_id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('equipment_taskstandards').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Equipment Task Standard saved successfully!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      window.location.reload();
    } catch (err: unknown) {
      console.error('Error saving record:', err);
      setErrorMsg('Failed to save record. Please check unique constraints or required fields.');
    }
  };

  const filteredStandards = selectedTaskFilter === 'all'
    ? standards
    : standards.filter((s) => s.task_id === selectedTaskFilter);

  const availableComponents = components.filter(c => c.system_id === standardForm.system_id);

  return (
    <div className="p-6 w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
          <CheckSquare className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Task Standards Management</h1>
          <p className="text-sm text-slate-400">Configure equipment tasks and their associated engineering standards, labor, and costs.</p>
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
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'tasks'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Equipment Tasks</span>
        </button>

        <button
          onClick={() => setActiveTab('standards')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'standards'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Task Standards</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            {activeTab === 'standards' && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedTaskFilter}
                  onChange={(e) => setSelectedTaskFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Tasks (Filter by Task)</option>
                  {tasks.map((t) => (
                    <option key={t.task_id} value={t.task_id}>
                      {t.task_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow ml-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>

        {/* Scrollable Container with Sticky Table Headers */}
        <div className="overflow-y-auto overflow-x-auto max-h-[calc(100vh-360px)] border border-slate-800/60 rounded-lg">
          {/* TAB 1: EQUIPMENT TASKS */}
          {activeTab === 'tasks' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Task Name</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">No equipment tasks found.</td>
                  </tr>
                ) : (
                  tasks.map((item) => (
                    <tr key={item.task_id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-100">{item.task_name}</td>
                      <td className="p-3 text-slate-400">{item.task_description || '—'}</td>
                      <td className="p-3 text-right space-x-3">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.task_id, 'equipment_tasks', 'task_id')}
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

          {/* TAB 2: TASK STANDARDS */}
          {activeTab === 'standards' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Task</th>
                  <th className="p-3">System / Component</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Std Time (m)</th>
                  <th className="p-3">Labor Cost</th>
                  <th className="p-3">Materials Cost</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredStandards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">No task standards found.</td>
                  </tr>
                ) : (
                  filteredStandards.map((item) => {
                    const matchedTask = tasks.find((t) => t.task_id === item.task_id);
                    const matchedSystem = systems.find((s) => s.system_id === item.system_id);
                    const matchedComp = components.find((c) => c.component_id === item.component_id);
                    return (
                      <tr key={item.task_standard_id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="p-3 font-semibold text-blue-400">{matchedTask ? matchedTask.task_name : '—'}</td>
                        <td className="p-3">
                          <div className="text-slate-100 font-medium">{matchedSystem ? matchedSystem.system_code : '—'}</div>
                          <div className="text-xs text-slate-400">{matchedComp ? matchedComp.component_code : '—'}</div>
                        </td>
                        <td className="p-3 text-slate-300 max-w-xs truncate">{item.task_standard_desc}</td>
                        <td className="p-3 font-mono">{item.standard_time}</td>
                        <td className="p-3 font-mono text-emerald-400">${(item.est_labor_cost ?? 0).toFixed(2)}</td>
                        <td className="p-3 font-mono text-emerald-400">${(item.est_materials_cost ?? 0).toFixed(2)}</td>
                        <td className="p-3 text-right space-x-3">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.task_standard_id, 'equipment_taskstandards', 'task_standard_id')}
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
        </div>
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-6 my-8">
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
              {activeTab === 'tasks' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Task Name</label>
                    <input
                      type="text"
                      required
                      value={taskForm.task_name}
                      onChange={(e) => setTaskForm({ ...taskForm, task_name: e.target.value })}
                      placeholder="e.g. Oil Change & Filter Replacement"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={taskForm.task_description}
                      onChange={(e) => setTaskForm({ ...taskForm, task_description: e.target.value })}
                      placeholder="Task details and instructions..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {activeTab === 'standards' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Equipment Task</label>
                    <select
                      required
                      value={standardForm.task_id}
                      onChange={(e) => setStandardForm({ ...standardForm, task_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Task</option>
                      {tasks.map((t) => (
                        <option key={t.task_id} value={t.task_id}>{t.task_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Equipment System</label>
                      <select
                        required
                        value={standardForm.system_id}
                        onChange={(e) => setStandardForm({ ...standardForm, system_id: e.target.value, component_id: '' })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select System</option>
                        {systems.map((sys) => (
                          <option key={sys.system_id} value={sys.system_id}>{sys.system_code} - {sys.system_desc}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Equipment Component</label>
                      <select
                        required
                        value={standardForm.component_id}
                        onChange={(e) => setStandardForm({ ...standardForm, component_id: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Component</option>
                        {availableComponents.map((c) => (
                          <option key={c.component_id} value={c.component_id}>{c.component_code} - {c.component_desc}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Task Standard Description</label>
                    <textarea
                      rows={2}
                      required
                      value={standardForm.task_standard_desc}
                      onChange={(e) => setStandardForm({ ...standardForm, task_standard_desc: e.target.value })}
                      placeholder="Detailed standard guidelines..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Standard Time (mins)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={standardForm.standard_time}
                        onChange={(e) => setStandardForm({ ...standardForm, standard_time: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Est. Labor Cost ($)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={standardForm.est_labor_cost}
                        onChange={(e) => setStandardForm({ ...standardForm, est_labor_cost: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Est. Materials Cost ($)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={standardForm.est_materials_cost}
                        onChange={(e) => setStandardForm({ ...standardForm, est_materials_cost: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Item / Part No (Optional)</label>
                    <input
                      type="text"
                      value={standardForm.item}
                      onChange={(e) => setStandardForm({ ...standardForm, item: e.target.value })}
                      placeholder="e.g. FLT-01"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskStandards;