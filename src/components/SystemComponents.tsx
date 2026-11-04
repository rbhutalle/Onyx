import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Cpu, 
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

interface EquipmentSystemRecord {
  system_id: string;
  system_code: string;
  system_desc: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface EquipmentComponentRecord {
  component_id: string;
  system_id: string;
  component_code: string;
  component_desc: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

type TabType = 'systems' | 'components';

export function SystemComponents() {
  const [activeTab, setActiveTab] = useState<TabType>('systems');

  const [systems, setSystems] = useState<EquipmentSystemRecord[]>([]);
  const [components, setComponents] = useState<EquipmentComponentRecord[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  // Filter & Search state
  const [selectedSystemFilter, setSelectedSystemFilter] = useState<string>('all');
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
  const [systemForm, setSystemForm] = useState({ system_code: '', system_desc: '' });
  const [componentForm, setComponentForm] = useState({ 
    system_id: '', 
    component_code: '', 
    component_desc: '' 
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const systemsRes = await supabase.from('equipment_system').select('*').order('system_code');
      if (systemsRes.error) throw systemsRes.error;
      setSystems(systemsRes.data || []);

      const compsRes = await supabase.from('equipment_component').select('*').order('component_code');
      if (compsRes.error) throw compsRes.error;
      setComponents(compsRes.data || []);
    } catch {
      setErrorMsg(`Failed to load data. Please check table permissions.`);
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
        setSelectedSystemFilter('all');
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
  }, [searchQuery, selectedSystemFilter]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setSystemForm({ system_code: '', system_desc: '' });
    setComponentForm({ 
      system_id: systems[0]?.system_id || '', 
      component_code: '', 
      component_desc: '' 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: EquipmentSystemRecord | EquipmentComponentRecord) => {
    if (activeTab === 'systems') {
      const rec = item as EquipmentSystemRecord;
      setEditingId(rec.system_id);
      setSystemForm({
        system_code: rec.system_code || '',
        system_desc: rec.system_desc || '',
      });
    } else if (activeTab === 'components') {
      const rec = item as EquipmentComponentRecord;
      setEditingId(rec.component_id);
      setComponentForm({
        system_id: rec.system_id || '',
        component_code: rec.component_code || '',
        component_desc: rec.component_desc || '',
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, tableName: 'equipment_system' | 'equipment_component', pkField: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from(tableName).delete().eq(pkField, id);
      if (error) throw error;

      setSuccessMsg('Record deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadData();
    } catch {
      setErrorMsg('Failed to delete record. Check foreign key dependencies.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (activeTab === 'systems') {
        const payload = {
          system_code: systemForm.system_code.trim(),
          system_desc: systemForm.system_desc.trim(),
          updated_at: new Date().toISOString()
        };
        if (editingId) {
          const { error } = await supabase.from('equipment_system').update(payload).eq('system_id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('equipment_system').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Equipment System saved successfully!');
      } else if (activeTab === 'components') {
        const payload = {
          system_id: componentForm.system_id,
          component_code: componentForm.component_code.trim(),
          component_desc: componentForm.component_desc.trim(),
          updated_at: new Date().toISOString()
        };
        if (editingId) {
          const { error } = await supabase.from('equipment_component').update(payload).eq('component_id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('equipment_component').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Equipment Component saved successfully!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadData();
    } catch {
      setErrorMsg('Failed to save record. Please check unique constraints or required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & Search computation
  const filteredSystems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return systems.filter(s => 
      s.system_code.toLowerCase().includes(q) || 
      (s.system_desc || '').toLowerCase().includes(q)
    );
  }, [systems, searchQuery]);

  const filteredComponents = useMemo(() => {
    return components.filter((c) => {
      const matchesSystem = selectedSystemFilter === 'all' || c.system_id === selectedSystemFilter;
      const q = searchQuery.toLowerCase();
      const matchesCode = (c.component_code || '').toLowerCase().includes(q);
      const matchesDesc = (c.component_desc || '').toLowerCase().includes(q);
      return matchesSystem && (matchesCode || matchesDesc);
    });
  }, [components, selectedSystemFilter, searchQuery]);

  const paginatedList = useMemo(() => {
    const list = activeTab === 'systems' ? filteredSystems : filteredComponents;
    const start = (currentPage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [activeTab, filteredSystems, filteredComponents, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    const totalLength = activeTab === 'systems' ? filteredSystems.length : filteredComponents.length;
    return Math.ceil(totalLength / pageSize) || 1;
  }, [activeTab, filteredSystems.length, filteredComponents.length, pageSize]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-(--border-main) pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-(--accent-subtle) text-(--text-primary) rounded-xl">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">System & Components Management</h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">Configure equipment systems and their associated sub-components.</p>
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
          onClick={() => setActiveTab('systems')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'systems'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Equipment Systems</span>
        </button>

        <button
          onClick={() => setActiveTab('components')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'components'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Equipment Components</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-surface) border border-(--border-main) shadow-xs rounded-xl p-4 overflow-hidden space-y-3">
        <div className="shrink-0 flex flex-wrap items-center gap-2">
          {activeTab === 'components' && (
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-(--text-muted)" />
              <select
                value={selectedSystemFilter}
                onChange={(e) => setSelectedSystemFilter(e.target.value)}
                className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
              >
                <option value="all">All Systems (Filter by System)</option>
                {systems.map((sys) => (
                  <option key={sys.system_id} value={sys.system_id}>
                    {sys.system_code} - {sys.system_desc}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-(--text-muted)" />
            <input
              type="text"
              placeholder={activeTab === 'systems' ? 'Filter systems...' : 'Search by component code or description...'}
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
          ) : activeTab === 'systems' ? (
            filteredSystems.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8 text-center text-(--text-muted) text-xs">
                No equipment systems found. Click &quot;Add Record&quot; above.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                    <th className="py-2 px-3">System Code</th>
                    <th className="py-2 px-3">System Description</th>
                    <th className="py-2 px-3 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {paginatedList.map((item) => {
                    const system = item as EquipmentSystemRecord;
                    return (
                      <tr key={system.system_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="py-2 px-3 font-semibold text-(--text-primary)">{system.system_code}</td>
                        <td className="py-2 px-3 text-(--text-muted)">{system.system_desc}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(system)}
                              className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(system.system_id, 'equipment_system', 'system_id')}
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
            filteredComponents.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8 text-center text-(--text-muted) text-xs">
                No equipment components found. Click &quot;Add Record&quot; above.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                    <th className="py-2 px-3">Component Code</th>
                    <th className="py-2 px-3">Component Description</th>
                    <th className="py-2 px-3">System Reference</th>
                    <th className="py-2 px-3 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {paginatedList.map((item) => {
                    const component = item as EquipmentComponentRecord;
                    const matchedSystem = systems.find((s) => s.system_id === component.system_id);
                    return (
                      <tr key={component.component_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="py-2 px-3 font-semibold text-(--text-primary)">{component.component_code}</td>
                        <td className="py-2 px-3 text-(--text-muted)">{component.component_desc}</td>
                        <td className="py-2 px-3 text-(--text-primary) font-medium">
                          {matchedSystem ? `${matchedSystem.system_code} - ${matchedSystem.system_desc}` : '—'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(component)}
                              className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(component.component_id, 'equipment_component', 'component_id')}
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
        {!loading && ((activeTab === 'systems' && filteredSystems.length > 0) || (activeTab === 'components' && filteredComponents.length > 0)) && (
          <div className="shrink-0 flex items-center justify-between pt-2 text-xs text-(--text-muted)">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, activeTab === 'systems' ? filteredSystems.length : filteredComponents.length)} of {activeTab === 'systems' ? filteredSystems.length : filteredComponents.length} entries
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
                {activeTab === 'systems' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        System Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={systemForm.system_code}
                        onChange={(e) => setSystemForm({ ...systemForm, system_code: e.target.value })}
                        placeholder="e.g. ENG, HYD"
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        System Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={systemForm.system_desc}
                        onChange={(e) => setSystemForm({ ...systemForm, system_desc: e.target.value })}
                        placeholder="Describe equipment system..."
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'components' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Equipment System <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={componentForm.system_id}
                        onChange={(e) => setComponentForm({ ...componentForm, system_id: e.target.value })}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
                      >
                        <option value="">Select Equipment System...</option>
                        {systems.map((sys) => (
                          <option key={sys.system_id} value={sys.system_id}>
                            {sys.system_code} - {sys.system_desc}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Component Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={componentForm.component_code}
                        onChange={(e) => setComponentForm({ ...componentForm, component_code: e.target.value })}
                        placeholder="e.g. ENG_TURBO"
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Component Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={componentForm.component_desc}
                        onChange={(e) => setComponentForm({ ...componentForm, component_desc: e.target.value })}
                        placeholder="Describe component details..."
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

export default SystemComponents;