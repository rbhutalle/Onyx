import { useState, useEffect } from 'react';
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
  Filter
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

export function SystemComponents() {
  const [activeTab, setActiveTab] = useState<'systems' | 'components'>('systems');

  const [systems, setSystems] = useState<EquipmentSystemRecord[]>([]);
  const [components, setComponents] = useState<EquipmentComponentRecord[]>([]);

  // Filter state for Components tab
  const [selectedSystemFilter, setSelectedSystemFilter] = useState<string>('all');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Forms state
  const [systemForm, setSystemForm] = useState({ system_code: '', system_desc: '' });
  const [componentForm, setComponentForm] = useState({ 
    system_id: '', 
    component_code: '', 
    component_desc: '' 
  });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setErrorMsg(null);
        
        // Always load systems for dropdown references
        const systemsRes = await supabase.from('equipment_system').select('*').order('system_code');
        if (systemsRes.error) throw systemsRes.error;
        if (isMounted) setSystems(systemsRes.data || []);

        const compsRes = await supabase.from('equipment_component').select('*').order('component_code');
        if (compsRes.error) throw compsRes.error;
        if (isMounted) setComponents(compsRes.data || []);
      } catch (err: unknown) {
        console.error(`Error fetching data for ${activeTab}:`, err);
        if (isMounted) setErrorMsg(`Failed to load data. Please check table permissions.`);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

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
      if (activeTab === 'systems') {
        const payload = {
          system_code: systemForm.system_code,
          system_desc: systemForm.system_desc,
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
          component_code: componentForm.component_code,
          component_desc: componentForm.component_desc,
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
      window.location.reload();
    } catch (err: unknown) {
      console.error('Error saving record:', err);
      setErrorMsg('Failed to save record. Please check unique constraints or required fields.');
    }
  };

  const filteredComponents = selectedSystemFilter === 'all'
    ? components
    : components.filter((c) => c.system_id === selectedSystemFilter);

  return (
    <div className="p-6 w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
          <Cpu className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">System & Components Management</h1>
          <p className="text-sm text-slate-400">Configure equipment systems and their associated sub-components.</p>
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
          onClick={() => setActiveTab('systems')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'systems'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Equipment Systems</span>
        </button>

        <button
          onClick={() => setActiveTab('components')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'components'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Equipment Components</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            {activeTab === 'components' && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedSystemFilter}
                  onChange={(e) => setSelectedSystemFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
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
          {/* TAB 1: EQUIPMENT SYSTEMS */}
          {activeTab === 'systems' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                  <th className="p-3">System Code</th>
                  <th className="p-3">System Description</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {systems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">No equipment systems found.</td>
                  </tr>
                ) : (
                  systems.map((item) => (
                    <tr key={item.system_id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-100">{item.system_code}</td>
                      <td className="p-3 text-slate-400">{item.system_desc}</td>
                      <td className="p-3 text-right space-x-3">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.system_id, 'equipment_system', 'system_id')}
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

          {/* TAB 2: EQUIPMENT COMPONENTS */}
          {activeTab === 'components' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Component Code</th>
                  <th className="p-3">Component Description</th>
                  <th className="p-3">System Reference</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredComponents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">No equipment components found.</td>
                  </tr>
                ) : (
                  filteredComponents.map((item) => {
                    const matchedSystem = systems.find((s) => s.system_id === item.system_id);
                    return (
                      <tr key={item.component_id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-100">{item.component_code}</td>
                        <td className="p-3 text-slate-400">{item.component_desc}</td>
                        <td className="p-3 text-blue-400 font-medium">
                          {matchedSystem ? `${matchedSystem.system_code} - ${matchedSystem.system_desc}` : '—'}
                        </td>
                        <td className="p-3 text-right space-x-3">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.component_id, 'equipment_component', 'component_id')}
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
              {activeTab === 'systems' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">System Code</label>
                    <input
                      type="text"
                      required
                      value={systemForm.system_code}
                      onChange={(e) => setSystemForm({ ...systemForm, system_code: e.target.value })}
                      placeholder="e.g. ENG, HYD"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">System Description</label>
                    <textarea
                      rows={3}
                      required
                      value={systemForm.system_desc}
                      onChange={(e) => setSystemForm({ ...systemForm, system_desc: e.target.value })}
                      placeholder="Describe equipment system..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {activeTab === 'components' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Equipment System</label>
                    <select
                      required
                      value={componentForm.system_id}
                      onChange={(e) => setComponentForm({ ...componentForm, system_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Equipment System</option>
                      {systems.map((sys) => (
                        <option key={sys.system_id} value={sys.system_id}>
                          {sys.system_code} - {sys.system_desc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Component Code</label>
                    <input
                      type="text"
                      required
                      value={componentForm.component_code}
                      onChange={(e) => setComponentForm({ ...componentForm, component_code: e.target.value })}
                      placeholder="e.g. ENG_TURBO"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Component Description</label>
                    <textarea
                      rows={3}
                      required
                      value={componentForm.component_desc}
                      onChange={(e) => setComponentForm({ ...componentForm, component_desc: e.target.value })}
                      placeholder="Describe component details..."
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

export default SystemComponents;