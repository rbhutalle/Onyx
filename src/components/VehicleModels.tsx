import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Car, 
  Tag, 
  Layers, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  X,
  Edit2,
  Trash2,
  Filter,
  Save,
  Loader2
} from 'lucide-react';

interface VehicleMakeRecord {
  make_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface VehicleTypeRecord {
  type_id: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface VehicleModelRecord {
  model_id: string;
  make_id: string;
  type_id: string | null;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export function VehicleModels() {
  const [activeTab, setActiveTab] = useState<'makes' | 'models' | 'types'>('makes');

  const [models, setModels] = useState<VehicleModelRecord[]>([]);
  const [makes, setMakes] = useState<VehicleMakeRecord[]>([]);
  const [types, setTypes] = useState<VehicleTypeRecord[]>([]);

  // Filter state for Models tab
  const [selectedMakeFilter, setSelectedMakeFilter] = useState<string>('all');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Forms state
  const [makeForm, setMakeForm] = useState({ name: '', is_active: true });
  const [typeForm, setTypeForm] = useState({ code: '', description: '', is_active: true });
  const [modelForm, setModelForm] = useState({ 
    make_id: '', 
    type_id: '', 
    name: '', 
    is_active: true 
  });

  // Load all reference data together on mount (matching OperationsStandards pattern)
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setErrorMsg(null);
        
        const [makesRes, typesRes, modelsRes] = await Promise.all([
          supabase.from('vehicle_makes').select('*').order('name', { ascending: true }),
          supabase.from('vehicle_types').select('*').order('code', { ascending: true }),
          supabase.from('vehicle_models').select('*').order('name', { ascending: true })
        ]);

        if (makesRes.error) throw makesRes.error;
        if (typesRes.error) throw typesRes.error;
        if (modelsRes.error) throw modelsRes.error;

        if (isMounted) {
          setMakes(makesRes.data || []);
          setTypes(typesRes.data || []);
          setModels(modelsRes.data || []);
        }
      } catch {
        if (isMounted) {
          setErrorMsg('Failed to load vehicle configuration data. Please check table permissions and RLS policies.');
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshData = async () => {
    try {
      const [makesRes, typesRes, modelsRes] = await Promise.all([
        supabase.from('vehicle_makes').select('*').order('name', { ascending: true }),
        supabase.from('vehicle_types').select('*').order('code', { ascending: true }),
        supabase.from('vehicle_models').select('*').order('name', { ascending: true })
      ]);

      if (makesRes.data) setMakes(makesRes.data);
      if (typesRes.data) setTypes(typesRes.data);
      if (modelsRes.data) setModels(modelsRes.data);
    } catch {
      // Ignored
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setMakeForm({ name: '', is_active: true });
    setTypeForm({ code: '', description: '', is_active: true });
    setModelForm({ 
      make_id: makes[0]?.make_id || '', 
      type_id: '', 
      name: '', 
      is_active: true 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: VehicleModelRecord | VehicleMakeRecord | VehicleTypeRecord) => {
    if (activeTab === 'makes') {
      const rec = item as VehicleMakeRecord;
      setEditingId(rec.make_id);
      setMakeForm({
        name: rec.name || '',
        is_active: rec.is_active ?? true,
      });
    } else if (activeTab === 'models') {
      const rec = item as VehicleModelRecord;
      setEditingId(rec.model_id);
      setModelForm({
        make_id: rec.make_id || '',
        type_id: rec.type_id || '',
        name: rec.name || '',
        is_active: rec.is_active ?? true,
      });
    } else if (activeTab === 'types') {
      const rec = item as VehicleTypeRecord;
      setEditingId(rec.type_id);
      setTypeForm({
        code: rec.code || '',
        description: rec.description || '',
        is_active: rec.is_active ?? true,
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, tableName: 'vehicle_models' | 'vehicle_makes' | 'vehicle_types', pkField: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from(tableName).delete().eq(pkField, id);
      if (error) throw error;

      setSuccessMsg('Record deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      refreshData();
    } catch {
      setErrorMsg('Failed to delete record. Check foreign key dependencies.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (activeTab === 'makes') {
        const payload = {
          name: makeForm.name.trim(),
          is_active: makeForm.is_active,
        };
        if (editingId) {
          const { error } = await supabase.from('vehicle_makes').update(payload).eq('make_id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('vehicle_makes').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Equipment Make saved successfully!');
      } else if (activeTab === 'models') {
        const payload = {
          make_id: modelForm.make_id,
          type_id: modelForm.type_id && modelForm.type_id.trim() !== '' ? modelForm.type_id : null,
          name: modelForm.name.trim(),
          is_active: modelForm.is_active,
        };
        if (editingId) {
          const { error } = await supabase.from('vehicle_models').update(payload).eq('model_id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('vehicle_models').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Equipment Model saved successfully!');
      } else if (activeTab === 'types') {
        const payload = {
          code: typeForm.code.trim(),
          description: typeForm.description.trim(),
          is_active: typeForm.is_active,
        };
        if (editingId) {
          const { error } = await supabase.from('vehicle_types').update(payload).eq('type_id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('vehicle_types').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Equipment Type saved successfully!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      refreshData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      const errorDetail = (errObj?.message as string) || (errObj?.details as string) || JSON.stringify(err);
      setErrorMsg(`Failed to save record: ${errorDetail}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredModels = selectedMakeFilter === 'all'
    ? models
    : models.filter((m) => m.make_id === selectedMakeFilter);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 border-b border-(--border-main) pb-4">
        <div className="p-2.5 bg-(--btn-primary-bg) text-(--btn-primary-text) rounded-xl">
          <Car className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Equipment Models & Configurations</h1>
          <p className="text-xs sm:text-sm text-(--text-muted)">Manage manufacturers (makes), equipment models, and equipment classifications (types).</p>
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
          onClick={() => setActiveTab('makes')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'makes'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Equipment Makes</span>
        </button>

        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'models'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Equipment Models</span>
        </button>

        <button
          onClick={() => setActiveTab('types')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'types'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Equipment Types</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-elevated) border border-(--border-main) shadow-xs rounded-xl p-6 space-y-4">
        <div className="shrink-0 flex flex-wrap justify-between items-center gap-4">
          <div>
            {activeTab === 'models' && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-(--text-muted)" />
                <select
                  value={selectedMakeFilter}
                  onChange={(e) => setSelectedMakeFilter(e.target.value)}
                  className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
                >
                  <option value="all">All Makes (Filter by Make)</option>
                  {makes.map((make) => (
                    <option key={make.make_id} value={make.make_id}>
                      {make.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow ml-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>

        {/* Scrollable Container with Sticky Table Headers */}
        <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
          {/* TAB 1: VEHICLE MAKES */}
          {activeTab === 'makes' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-(--border-main) text-(--text-muted) text-xs uppercase bg-(--bg-surface) sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Make Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                {makes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-(--text-muted)">No Equipment makes found.</td>
                  </tr>
                ) : (
                  makes.map((item) => (
                    <tr key={item.make_id} className="hover:bg-(--accent-subtle) transition-colors">
                      <td className="p-3 font-semibold text-(--text-primary)">{item.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.is_active ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-(--accent-subtle) text-(--text-muted) border border-(--border-main)'}`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-3">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-xs text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.make_id, 'vehicle_makes', 'make_id')}
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
          )}

          {/* TAB 2: VEHICLE MODELS */}
          {activeTab === 'models' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-(--border-main) text-(--text-muted) text-xs uppercase bg-(--bg-surface) sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Model Name</th>
                  <th className="p-3">Make</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                {filteredModels.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-(--text-muted)">No equipment models found.</td>
                  </tr>
                ) : (
                  filteredModels.map((item) => {
                    const matchedMake = makes.find((m) => m.make_id === item.make_id);
                    const matchedType = types.find((t) => t.type_id === item.type_id);
                    return (
                      <tr key={item.model_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="p-3 font-semibold text-(--text-primary)">{item.name}</td>
                        <td className="p-3 text-(--text-primary) font-medium">{matchedMake ? matchedMake.name : '—'}</td>
                        <td className="p-3 text-(--text-secondary) font-medium">
                          {matchedType ? `${matchedType.code} - ${matchedType.description}` : '—'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.is_active ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-(--accent-subtle) text-(--text-muted) border border-(--border-main)'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-3">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="text-xs text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.model_id, 'vehicle_models', 'model_id')}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
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

          {/* TAB 3: VEHICLE TYPES */}
          {activeTab === 'types' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-(--border-main) text-(--text-muted) text-xs uppercase bg-(--bg-surface) sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Type Code</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                {types.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-(--text-muted)">No Equipment types found.</td>
                  </tr>
                ) : (
                  types.map((item) => (
                    <tr key={item.type_id} className="hover:bg-(--accent-subtle) transition-colors">
                      <td className="p-3 font-semibold text-(--text-primary)">{item.code}</td>
                      <td className="p-3 text-(--text-muted)">{item.description}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.is_active ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-(--accent-subtle) text-(--text-muted) border border-(--border-main)'}`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-3">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-xs text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.type_id, 'vehicle_types', 'type_id')}
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
          )}
        </div>
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-4 shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">
                {editingId ? 'Edit Record' : 'Add New Record'}
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
                {activeTab === 'makes' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Make Name</label>
                      <input
                        type="text"
                        required
                        value={makeForm.name}
                        onChange={(e) => setMakeForm({ ...makeForm, name: e.target.value })}
                        placeholder="e.g. Toyota, Ford"
                        className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2.5 text-sm focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="make_active_chk"
                        checked={makeForm.is_active}
                        onChange={(e) => setMakeForm({ ...makeForm, is_active: e.target.checked })}
                        className="rounded bg-(--bg-elevated) border border-(--border-main) text-(--btn-primary-bg) focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="make_active_chk" className="text-xs font-semibold uppercase text-(--text-muted) cursor-pointer">Is Active</label>
                    </div>
                  </>
                )}

                {activeTab === 'models' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Equipment Make</label>
                      <select
                        required
                        value={modelForm.make_id}
                        onChange={(e) => setModelForm({ ...modelForm, make_id: e.target.value })}
                        className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2.5 text-sm focus:outline-none focus:border-(--text-primary)"
                      >
                        <option value="">Select Equipment Make</option>
                        {makes.map((make) => (
                          <option key={make.make_id} value={make.make_id}>
                            {make.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Equipment Type (Optional)</label>
                      <select
                        value={modelForm.type_id}
                        onChange={(e) => setModelForm({ ...modelForm, type_id: e.target.value })}
                        className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2.5 text-sm focus:outline-none focus:border-(--text-primary)"
                      >
                        <option value="">Select Equipment Type</option>
                        {types.map((type) => (
                          <option key={type.type_id} value={type.type_id}>
                            {type.code} - {type.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Model Name</label>
                      <input
                        type="text"
                        required
                        value={modelForm.name}
                        onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                        placeholder="e.g. Hilux, Ranger"
                        className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2.5 text-sm focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="model_active_chk"
                        checked={modelForm.is_active}
                        onChange={(e) => setModelForm({ ...modelForm, is_active: e.target.checked })}
                        className="rounded bg-(--bg-elevated) border border-(--border-main) text-(--btn-primary-bg) focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="model_active_chk" className="text-xs font-semibold uppercase text-(--text-muted) cursor-pointer">Is Active</label>
                    </div>
                  </>
                )}

                {activeTab === 'types' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Type Code</label>
                      <input
                        type="text"
                        required
                        value={typeForm.code}
                        onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                        placeholder="e.g. SUV, Pickup"
                        className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2.5 text-sm focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Description</label>
                      <textarea
                        rows={3}
                        required
                        value={typeForm.description}
                        onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                        placeholder="Describe Equipment classification..."
                        className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2.5 text-sm focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="type_active_chk"
                        checked={typeForm.is_active}
                        onChange={(e) => setTypeForm({ ...typeForm, is_active: e.target.checked })}
                        className="rounded bg-(--bg-elevated) border border-(--border-main) text-(--btn-primary-bg) focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="type_active_chk" className="text-xs font-semibold uppercase text-(--text-muted) cursor-pointer">Is Active</label>
                    </div>
                  </>
                )}
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

export default VehicleModels;