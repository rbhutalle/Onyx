import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight
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

type TabType = 'makes' | 'models' | 'types';

export function VehicleModels() {
  const [activeTab, setActiveTab] = useState<TabType>('makes');

  const [models, setModels] = useState<VehicleModelRecord[]>([]);
  const [makes, setMakes] = useState<VehicleMakeRecord[]>([]);
  const [types, setTypes] = useState<VehicleTypeRecord[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  // Filter & Search state
  const [selectedMakeFilter, setSelectedMakeFilter] = useState<string>('all');
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
  const [makeForm, setMakeForm] = useState({ name: '', is_active: true });
  const [typeForm, setTypeForm] = useState({ code: '', description: '', is_active: true });
  const [modelForm, setModelForm] = useState({ 
    make_id: '', 
    type_id: '', 
    name: '', 
    is_active: true 
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const [makesRes, typesRes, modelsRes] = await Promise.all([
        supabase.from('vehicle_makes').select('*').order('name', { ascending: true }),
        supabase.from('vehicle_types').select('*').order('code', { ascending: true }),
        supabase.from('vehicle_models').select('*').order('name', { ascending: true })
      ]);

      if (makesRes.error) throw makesRes.error;
      if (typesRes.error) throw typesRes.error;
      if (modelsRes.error) throw modelsRes.error;

      setMakes(makesRes.data || []);
      setTypes(typesRes.data || []);
      setModels(modelsRes.data || []);
    } catch {
      setErrorMsg('Failed to load vehicle configuration data. Please check table permissions and RLS policies.');
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
        setSelectedMakeFilter('all');
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
  }, [searchQuery, selectedMakeFilter]);

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
      if (activeTab === 'makes') {
        const payload = {
          name: makeForm.name.trim(),
          is_active: makeForm.is_active,
          updated_at: new Date().toISOString()
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
          updated_at: new Date().toISOString()
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
          updated_at: new Date().toISOString()
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
      loadData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      const errorDetail = (errObj?.message as string) || (errObj?.details as string) || JSON.stringify(err);
      setErrorMsg(`Failed to save record: ${errorDetail}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & Search computation
  const filteredMakes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return makes.filter(m => m.name.toLowerCase().includes(q));
  }, [makes, searchQuery]);

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const matchesMake = selectedMakeFilter === 'all' || m.make_id === selectedMakeFilter;
      const q = searchQuery.toLowerCase();
      const matchesName = m.name.toLowerCase().includes(q);
      return matchesMake && matchesName;
    });
  }, [models, selectedMakeFilter, searchQuery]);

  const filteredTypes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return types.filter(t => 
      t.code.toLowerCase().includes(q) || 
      (t.description || '').toLowerCase().includes(q)
    );
  }, [types, searchQuery]);

  const paginatedList = useMemo(() => {
    const list = activeTab === 'makes' ? filteredMakes : activeTab === 'models' ? filteredModels : filteredTypes;
    const start = (currentPage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [activeTab, filteredMakes, filteredModels, filteredTypes, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    const totalLength = activeTab === 'makes' ? filteredMakes.length : activeTab === 'models' ? filteredModels.length : filteredTypes.length;
    return Math.ceil(totalLength / pageSize) || 1;
  }, [activeTab, filteredMakes.length, filteredModels.length, filteredTypes.length, pageSize]);

  const totalCurrentEntries = activeTab === 'makes' ? filteredMakes.length : activeTab === 'models' ? filteredModels.length : filteredTypes.length;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-(--border-main) pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-(--accent-subtle) text-(--text-primary) rounded-xl">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Equipment Models & Configurations</h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">Manage manufacturers (makes), equipment models, and equipment classifications (types).</p>
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

      {/* Clean Tab Navigation */}
      <div className="shrink-0 flex border-b border-(--border-main) gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('makes')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'makes'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Equipment Makes</span>
        </button>

        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'models'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Equipment Models</span>
        </button>

        <button
          onClick={() => setActiveTab('types')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'types'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Equipment Types</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-surface) border border-(--border-main) shadow-xs rounded-xl p-4 overflow-hidden space-y-3">
        <div className="shrink-0 flex flex-wrap items-center gap-2">
          {activeTab === 'models' && (
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-(--text-muted)" />
              <select
                value={selectedMakeFilter}
                onChange={(e) => setSelectedMakeFilter(e.target.value)}
                className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
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

          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-(--text-muted)" />
            <input
              type="text"
              placeholder={activeTab === 'makes' ? 'Filter makes...' : activeTab === 'models' ? 'Filter models...' : 'Filter types...'}
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
          ) : activeTab === 'makes' ? (
            filteredMakes.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8 text-center text-(--text-muted) text-xs">
                No Equipment makes found. Click &quot;Add Record&quot; above.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                    <th className="py-2 px-3">Make Name</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {paginatedList.map((item) => {
                    const make = item as VehicleMakeRecord;
                    return (
                      <tr key={make.make_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="py-2 px-3 font-semibold text-(--text-primary)">{make.name}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${make.is_active ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-(--accent-subtle) text-(--text-muted) border border-(--border-main)'}`}>
                            {make.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(make)}
                              className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(make.make_id, 'vehicle_makes', 'make_id')}
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
          ) : activeTab === 'models' ? (
            filteredModels.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8 text-center text-(--text-muted) text-xs">
                No equipment models found. Click &quot;Add Record&quot; above.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                    <th className="py-2 px-3">Model Name</th>
                    <th className="py-2 px-3">Make</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {paginatedList.map((item) => {
                    const model = item as VehicleModelRecord;
                    const matchedMake = makes.find((m) => m.make_id === model.make_id);
                    const matchedType = types.find((t) => t.type_id === model.type_id);
                    return (
                      <tr key={model.model_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="py-2 px-3 font-semibold text-(--text-primary)">{model.name}</td>
                        <td className="py-2 px-3 text-(--text-primary) font-medium">{matchedMake ? matchedMake.name : '—'}</td>
                        <td className="py-2 px-3 text-(--text-secondary) font-medium">
                          {matchedType ? `${matchedType.code} - ${matchedType.description}` : '—'}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${model.is_active ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-(--accent-subtle) text-(--text-muted) border border-(--border-main)'}`}>
                            {model.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(model)}
                              className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(model.model_id, 'vehicle_models', 'model_id')}
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
            filteredTypes.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8 text-center text-(--text-muted) text-xs">
                No Equipment types found. Click &quot;Add Record&quot; above.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                    <th className="py-2 px-3">Type Code</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {paginatedList.map((item) => {
                    const typeRec = item as VehicleTypeRecord;
                    return (
                      <tr key={typeRec.type_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="py-2 px-3 font-semibold text-(--text-primary)">{typeRec.code}</td>
                        <td className="py-2 px-3 text-(--text-muted)">{typeRec.description}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${typeRec.is_active ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-(--accent-subtle) text-(--text-muted) border border-(--border-main)'}`}>
                            {typeRec.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(typeRec)}
                              className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(typeRec.type_id, 'vehicle_types', 'type_id')}
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
        {!loading && totalCurrentEntries > 0 && (
          <div className="shrink-0 flex items-center justify-between pt-2 text-xs text-(--text-muted)">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCurrentEntries)} of {totalCurrentEntries} entries
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
                {activeTab === 'makes' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Make Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={makeForm.name}
                        onChange={(e) => setMakeForm({ ...makeForm, name: e.target.value })}
                        placeholder="e.g. Toyota, Ford"
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="make_active_chk"
                        checked={makeForm.is_active}
                        onChange={(e) => setMakeForm({ ...makeForm, is_active: e.target.checked })}
                        className="rounded bg-(--bg-elevated) border border-(--border-main) text-(--btn-primary-bg) focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="make_active_chk" className="text-xs font-semibold text-(--text-primary) cursor-pointer">Is Active</label>
                    </div>
                  </>
                )}

                {activeTab === 'models' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Equipment Make <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={modelForm.make_id}
                        onChange={(e) => setModelForm({ ...modelForm, make_id: e.target.value })}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
                      >
                        <option value="">Select Equipment Make...</option>
                        {makes.map((make) => (
                          <option key={make.make_id} value={make.make_id}>
                            {make.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">Equipment Type (Optional)</label>
                      <select
                        value={modelForm.type_id}
                        onChange={(e) => setModelForm({ ...modelForm, type_id: e.target.value })}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
                      >
                        <option value="">Select Equipment Type...</option>
                        {types.map((type) => (
                          <option key={type.type_id} value={type.type_id}>
                            {type.code} - {type.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Model Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={modelForm.name}
                        onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                        placeholder="e.g. Hilux, Ranger"
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="model_active_chk"
                        checked={modelForm.is_active}
                        onChange={(e) => setModelForm({ ...modelForm, is_active: e.target.checked })}
                        className="rounded bg-(--bg-elevated) border border-(--border-main) text-(--btn-primary-bg) focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="model_active_chk" className="text-xs font-semibold text-(--text-primary) cursor-pointer">Is Active</label>
                    </div>
                  </>
                )}

                {activeTab === 'types' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Type Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={typeForm.code}
                        onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                        placeholder="e.g. SUV, Pickup"
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={typeForm.description}
                        onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                        placeholder="Describe Equipment classification..."
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="type_active_chk"
                        checked={typeForm.is_active}
                        onChange={(e) => setTypeForm({ ...typeForm, is_active: e.target.checked })}
                        className="rounded bg-(--bg-elevated) border border-(--border-main) text-(--btn-primary-bg) focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="type_active_chk" className="text-xs font-semibold text-(--text-primary) cursor-pointer">Is Active</label>
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

export default VehicleModels;