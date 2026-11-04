import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Filter,
  Save,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight
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

type TabType = 'tasks' | 'standards';

export function TaskStandards() {
  const [activeTab, setActiveTab] = useState<TabType>('tasks');

  const [tasks, setTasks] = useState<EquipmentTaskRecord[]>([]);
  const [standards, setStandards] = useState<EquipmentTaskStandardRecord[]>([]);
  const [systems, setSystems] = useState<EquipmentSystemRecord[]>([]);
  const [components, setComponents] = useState<EquipmentComponentRecord[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  // Filter & Search state for Standards tab & Tasks tab
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const tasksRes = await supabase.from('equipment_tasks').select('*').order('task_name');
      if (tasksRes.error) throw tasksRes.error;
      setTasks(tasksRes.data || []);

      const standardsRes = await supabase.from('equipment_taskstandards').select('*');
      if (standardsRes.error) throw standardsRes.error;
      setStandards(standardsRes.data || []);

      const systemsRes = await supabase.from('equipment_system').select('*').order('system_code');
      if (systemsRes.error) throw systemsRes.error;
      setSystems(systemsRes.data || []);

      const compsRes = await supabase.from('equipment_component').select('*').order('component_code');
      if (compsRes.error) throw compsRes.error;
      setComponents(compsRes.data || []);
    } catch (err: unknown) {
      console.error(`Error fetching data:`, err);
      setErrorMsg(`Failed to load data. Please check table permissions or RLS policies.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setCurrentPage(1);
        setSearchQuery('');
        setSelectedTaskFilter('all');
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
  }, [searchQuery, selectedTaskFilter]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setTaskForm({ task_name: '', task_description: '' });
    setStandardForm({ 
      task_id: tasks[0]?.task_id || '', 
      system_id: systems[0]?.system_id || '', 
      component_id: '', 
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
      loadData();
    } catch (err: unknown) {
      console.error('Error deleting record:', err);
      setErrorMsg('Failed to delete record. Check foreign key dependencies.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (activeTab === 'tasks') {
        const payload = {
          task_name: taskForm.task_name.trim(),
          task_description: taskForm.task_description.trim() || null,
          updated_at: new Date().toISOString()
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
        if (!standardForm.component_id) {
          setErrorMsg('Equipment Component is required.');
          setSubmitting(false);
          return;
        }

        const payload = {
          task_id: standardForm.task_id,
          system_id: standardForm.system_id,
          component_id: standardForm.component_id,
          task_standard_desc: standardForm.task_standard_desc.trim(),
          standard_time: Number(standardForm.standard_time) || 0,
          item: standardForm.item ? standardForm.item.trim() : null,
          est_labor_cost: Number(standardForm.est_labor_cost) || 0,
          est_materials_cost: Number(standardForm.est_materials_cost) || 0,
          updated_at: new Date().toISOString()
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
      loadData();
    } catch (err: unknown) {
      console.error('Error saving record:', err);
      setErrorMsg('Failed to save record. Please check unique constraints or required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & Search computation
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      t.task_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.task_description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  const filteredStandards = useMemo(() => {
    return standards.filter((s) => {
      const matchesTask = selectedTaskFilter === 'all' || s.task_id === selectedTaskFilter;
      const q = searchQuery.toLowerCase();
      const matchesDesc = (s.task_standard_desc || '').toLowerCase().includes(q);
      const matchesItem = (s.item || '').toLowerCase().includes(q);
      return matchesTask && (matchesDesc || matchesItem);
    });
  }, [standards, selectedTaskFilter, searchQuery]);

  const paginatedList = useMemo(() => {
    const list = activeTab === 'tasks' ? filteredTasks : filteredStandards;
    const start = (currentPage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [activeTab, filteredTasks, filteredStandards, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    const totalLength = activeTab === 'tasks' ? filteredTasks.length : filteredStandards.length;
    return Math.ceil(totalLength / pageSize) || 1;
  }, [activeTab, filteredTasks.length, filteredStandards.length, pageSize]);

  const availableComponents = components.filter(c => c.system_id === standardForm.system_id);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
      
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-(--border-main) pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-(--accent-subtle) text-(--text-primary) rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Task Standards Management</h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">Configure equipment tasks and their associated engineering standards, labor, and costs.</p>
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

      {/* Tab Navigation */}
      <div className="shrink-0 flex border-b border-(--border-main) gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'tasks'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Equipment Tasks</span>
        </button>

        <button
          onClick={() => setActiveTab('standards')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'standards'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Task Standards</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-surface) border border-(--border-main) shadow-xs rounded-xl p-4 overflow-hidden space-y-3">
        <div className="shrink-0 flex flex-wrap items-center gap-2">
          {activeTab === 'standards' && (
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-(--text-muted)" />
              <select
                value={selectedTaskFilter}
                onChange={(e) => setSelectedTaskFilter(e.target.value)}
                className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
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

          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-(--text-muted)" />
            <input
              type="text"
              placeholder={activeTab === 'tasks' ? 'Filter tasks...' : 'Search by description or item...'}
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

        {/* Scrollable Container with Sticky Table Headers */}
        <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
          {loading ? (
            <div className="h-full flex items-center justify-center text-(--text-muted) gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-(--text-primary)" />
              <span>Loading records...</span>
            </div>
          ) : activeTab === 'tasks' ? (
            filteredTasks.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8 text-center text-(--text-muted) text-xs">
                No equipment tasks found. Click &quot;Add Record&quot; above.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                    <th className="py-2 px-3">Task Name</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {paginatedList.map((item) => {
                    const task = item as EquipmentTaskRecord;
                    return (
                      <tr key={task.task_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="py-2 px-3 font-semibold text-(--text-primary)">{task.task_name}</td>
                        <td className="py-2 px-3 text-(--text-muted)">{task.task_description || '—'}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(task)}
                              className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(task.task_id, 'equipment_tasks', 'task_id')}
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
            filteredStandards.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8 text-center text-(--text-muted) text-xs">
                No task standards found. Click &quot;Add Record&quot; above.
              </div>
            ) : (
              <table className="w-full min-w-187.5 text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                    <th className="py-2 px-3">Task</th>
                    <th className="py-2 px-3">System / Component</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3">Std. Time</th>
                    <th className="py-2 px-3">Labor Cost</th>
                    <th className="py-2 px-3">Materials Cost</th>
                    <th className="py-2 px-3 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {paginatedList.map((item) => {
                    const standard = item as EquipmentTaskStandardRecord;
                    const matchedTask = tasks.find((t) => t.task_id === standard.task_id);
                    const matchedSystem = systems.find((s) => s.system_id === standard.system_id);
                    const matchedComp = components.find((c) => c.component_id === standard.component_id);
                    return (
                      <tr key={standard.task_standard_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="py-2 px-3 font-semibold text-(--text-primary)">{matchedTask ? matchedTask.task_name : '—'}</td>
                        <td className="py-2 px-3">
                          <div className="text-(--text-primary) font-medium">{matchedSystem ? matchedSystem.system_code : '—'}</div>
                          <div className="text-[10px] text-(--text-muted)">{matchedComp ? matchedComp.component_code : '—'}</div>
                        </td>
                        <td className="py-2 px-3 text-(--text-secondary) max-w-50 truncate">{standard.task_standard_desc}</td>
                        <td className="py-2 px-3 font-mono whitespace-nowrap">{standard.standard_time} HR</td>
                        <td className="py-2 px-3 font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">₱{(standard.est_labor_cost ?? 0).toFixed(2)}</td>
                        <td className="py-2 px-3 font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">₱{(standard.est_materials_cost ?? 0).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(standard)}
                              className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(standard.task_standard_id, 'equipment_taskstandards', 'task_standard_id')}
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
          )}
        </div>

        {/* Pagination */}
        {!loading && ((activeTab === 'tasks' && filteredTasks.length > 0) || (activeTab === 'standards' && filteredStandards.length > 0)) && (
          <div className="shrink-0 flex items-center justify-between pt-2 text-xs text-(--text-muted)">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, activeTab === 'tasks' ? filteredTasks.length : filteredStandards.length)} of {activeTab === 'tasks' ? filteredTasks.length : filteredStandards.length} entries
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
                {activeTab === 'tasks' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Task Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={taskForm.task_name}
                        onChange={(e) => setTaskForm({ ...taskForm, task_name: e.target.value })}
                        placeholder="e.g. Oil Change & Filter Replacement"
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={taskForm.task_description}
                        onChange={(e) => setTaskForm({ ...taskForm, task_description: e.target.value })}
                        placeholder="Task details and instructions..."
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'standards' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Equipment Task <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={standardForm.task_id}
                        onChange={(e) => setStandardForm({ ...standardForm, task_id: e.target.value })}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
                      >
                        <option value="">Select Task...</option>
                        {tasks.map((t) => (
                          <option key={t.task_id} value={t.task_id}>{t.task_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                          Equipment System <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={standardForm.system_id}
                          onChange={(e) => setStandardForm({ ...standardForm, system_id: e.target.value, component_id: '' })}
                          className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
                        >
                          <option value="">Select System...</option>
                          {systems.map((sys) => (
                            <option key={sys.system_id} value={sys.system_id}>{sys.system_code} - {sys.system_desc}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                          Equipment Component <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={standardForm.component_id}
                          onChange={(e) => setStandardForm({ ...standardForm, component_id: e.target.value })}
                          className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
                        >
                          <option value="">Select Component...</option>
                          {availableComponents.map((c) => (
                            <option key={c.component_id} value={c.component_id}>{c.component_code} - {c.component_desc}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Task Standard Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={standardForm.task_standard_desc}
                        onChange={(e) => setStandardForm({ ...standardForm, task_standard_desc: e.target.value })}
                        placeholder="Detailed standard guidelines..."
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-(--text-primary) mb-1">Std. Time (HR)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          min="0"
                          value={standardForm.standard_time}
                          onChange={(e) => setStandardForm({ ...standardForm, standard_time: e.target.value })}
                          className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-(--text-primary) mb-1">Est. Labor Cost (₱)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={standardForm.est_labor_cost}
                          onChange={(e) => setStandardForm({ ...standardForm, est_labor_cost: e.target.value })}
                          className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-(--text-primary) mb-1">Est. Materials Cost (₱)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={standardForm.est_materials_cost}
                          onChange={(e) => setStandardForm({ ...standardForm, est_materials_cost: e.target.value })}
                          className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">Item / Part No (Optional)</label>
                      <input
                        type="text"
                        value={standardForm.item}
                        onChange={(e) => setStandardForm({ ...standardForm, item: e.target.value })}
                        placeholder="e.g. FLT-01"
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

export default TaskStandards;