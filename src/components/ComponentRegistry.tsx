import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Layers, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  X,
  Edit2,
  Trash2,
  Save,
  Loader2,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Filter
} from 'lucide-react';

interface ComponentMaintenanceRecord {
  equipment_component_id: string;
  system_id: string;
  component_id: string;
  make_id?: string | null;
  model_id?: string | null;
  equipment_component_code: string;
  equipment_component_desc?: string | null;
  serial_no?: string | null;
  is_active: boolean;
  cost?: number | null;
  srv_rdg?: number | null;
  cost_rdg?: number | null;
  is_scrapped?: boolean;
  system_display?: string;
  component_display?: string;
  make_name?: string;
  model_name?: string;
  [key: string]: unknown;
}

interface SystemOption {
  system_id: string;
  system_code: string;
  system_desc?: string | null;
  [key: string]: unknown;
}

interface ComponentOption {
  component_id: string;
  system_id: string;
  component_code: string;
  component_desc?: string | null;
  [key: string]: unknown;
}

interface MakeOption {
  make_id: string;
  name?: string;
  [key: string]: unknown;
}

interface ModelOption {
  model_id: string;
  make_id: string;
  name?: string;
  [key: string]: unknown;
}

export function ComponentRegistry() {
  const [components, setComponents] = useState<ComponentMaintenanceRecord[]>([]);
  
  // Foreign Key reference options
  const [systems, setSystems] = useState<SystemOption[]>([]);
  const [baseComponents, setBaseComponents] = useState<ComponentOption[]>([]);
  const [makes, setMakes] = useState<MakeOption[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);

  // Search & Filter States
  const [searchSystemId, setSearchSystemId] = useState<string>('');
  const [searchComponentId, setSearchComponentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [selectedComponent, setSelectedComponent] = useState<ComponentMaintenanceRecord | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Dropdown search & visibility states for the Add/Edit form modal
  const [systemSearchQuery, setSystemSearchQuery] = useState<string>('');
  const [isSystemDropdownOpen, setIsSystemDropdownOpen] = useState<boolean>(false);
  const systemDropdownRef = useRef<HTMLDivElement>(null);

  const [baseComponentSearchQuery, setBaseComponentSearchQuery] = useState<string>('');
  const [isBaseComponentDropdownOpen, setIsBaseComponentDropdownOpen] = useState<boolean>(false);
  const baseComponentDropdownRef = useRef<HTMLDivElement>(null);

  const [makeSearchQuery, setMakeSearchQuery] = useState<string>('');
  const [isMakeDropdownOpen, setIsMakeDropdownOpen] = useState<boolean>(false);
  const makeDropdownRef = useRef<HTMLDivElement>(null);

  const [modelSearchQuery, setModelSearchQuery] = useState<string>('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  const [componentForm, setComponentForm] = useState({
    system_id: '',
    component_id: '',
    make_id: '',
    model_id: '',
    equipment_component_code: '',
    equipment_component_desc: '',
    serial_no: '',
    is_active: true,
    cost: '0',
    srv_rdg: '0',
    cost_rdg: '0',
  });

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (systemDropdownRef.current && !systemDropdownRef.current.contains(event.target as Node)) {
        setIsSystemDropdownOpen(false);
      }
      if (baseComponentDropdownRef.current && !baseComponentDropdownRef.current.contains(event.target as Node)) {
        setIsBaseComponentDropdownOpen(false);
      }
      if (makeDropdownRef.current && !makeDropdownRef.current.contains(event.target as Node)) {
        setIsMakeDropdownOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Onload: Load relation lookup options
  useEffect(() => {
    let isMounted = true;

    async function loadRelationOptions() {
      try {
        setErrorMsg(null);
        const [sysRes, compRes, makeRes, modRes] = await Promise.all([
          supabase.from('equipment_system').select('*').order('system_code', { ascending: true }),
          supabase.from('equipment_component').select('*').order('component_code', { ascending: true }),
          supabase.from('vehicle_makes').select('*').order('name', { ascending: true }),
          supabase.from('vehicle_models').select('*').order('name', { ascending: true }),
        ]);

        if (sysRes.error) throw sysRes.error;
        if (compRes.error) throw compRes.error;
        if (makeRes.error) throw makeRes.error;
        if (modRes.error) throw modRes.error;

        if (isMounted) {
          setSystems(sysRes.data || []);
          setBaseComponents(compRes.data || []);
          setMakes(makeRes.data || []);
          setModels(modRes.data || []);
        }
      } catch (err: unknown) {
        console.error('Error fetching relation options:', err);
        if (isMounted) {
          setErrorMsg('Failed to load system and component options.');
        }
      }
    }

    loadRelationOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  // Query component_maintenance based on filters
  const fetchComponentRegistryData = async (
    textQuery: string = searchQuery,
    sysId: string = searchSystemId,
    compId: string = searchComponentId
  ) => {
    try {
      setLoadingData(true);
      setErrorMsg(null);
      setHasSearched(true);
      setCurrentPage(1);
      const trimmedQuery = textQuery.trim();

      let maintQuery = supabase
        .from('component_maintenance')
        .select(`
          *,
          equipment_system:system_id(system_code, system_desc),
          equipment_component:component_id(component_code, component_desc),
          vehicle_makes:make_id(name),
          vehicle_models:model_id(name)
        `)
        .eq('is_scrapped', false)
        .order('equipment_component_code', { ascending: true });

      if (sysId) {
        maintQuery = maintQuery.eq('system_id', sysId);
      }

      if (compId) {
        maintQuery = maintQuery.eq('component_id', compId);
      }

      if (trimmedQuery) {
        maintQuery = maintQuery.or(`equipment_component_code.ilike.%${trimmedQuery}%,serial_no.ilike.%${trimmedQuery}%,equipment_component_desc.ilike.%${trimmedQuery}%`);
      }

      const { data, error } = await maintQuery;
      if (error) throw error;

      const formatted = (data || []).map((item: Record<string, unknown>) => {
        const sysObj = item.equipment_system as Record<string, unknown> | null;
        const compObj = item.equipment_component as Record<string, unknown> | null;
        const makeObj = item.vehicle_makes as Record<string, unknown> | null;
        const modelObj = item.vehicle_models as Record<string, unknown> | null;

        return {
          ...item,
          system_display: sysObj ? `${sysObj.system_code ?? ''}${sysObj.system_desc ? ` - ${sysObj.system_desc}` : ''}` : '—',
          component_display: compObj ? `${compObj.component_code ?? ''}${compObj.component_desc ? ` - ${compObj.component_desc}` : ''}` : '—',
          make_name: (makeObj?.name as string) || '—',
          model_name: (modelObj?.name as string) || '—',
        };
      }) as ComponentMaintenanceRecord[];

      setComponents(formatted);
    } catch (err: unknown) {
      console.error('Error fetching component maintenance records:', err);
      setErrorMsg('Failed to fetch component maintenance records.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSystemId = e.target.value;
    setSearchSystemId(newSystemId);
    setSearchComponentId('');
    fetchComponentRegistryData(searchQuery, newSystemId, '');
  };

  const handleComponentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newComponentId = e.target.value;
    setSearchComponentId(newComponentId);
    fetchComponentRegistryData(searchQuery, searchSystemId, newComponentId);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComponentRegistryData(searchQuery, searchSystemId, searchComponentId);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setSystemSearchQuery('');
    setBaseComponentSearchQuery('');
    setMakeSearchQuery('');
    setModelSearchQuery('');
    setComponentForm({
      system_id: '',
      component_id: '',
      make_id: '',
      model_id: '',
      equipment_component_code: '',
      equipment_component_desc: '',
      serial_no: '',
      is_active: true,
      cost: '0',
      srv_rdg: '0',
      cost_rdg: '0',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ComponentMaintenanceRecord) => {
    setEditingId(item.equipment_component_id);

    const matchedSys = systems.find(s => s.system_id === item.system_id);
    setSystemSearchQuery(matchedSys ? `${matchedSys.system_code} ${matchedSys.system_desc ?? ''}`.trim() : '');

    const matchedBaseComp = baseComponents.find(c => c.component_id === item.component_id);
    setBaseComponentSearchQuery(matchedBaseComp ? `${matchedBaseComp.component_code} ${matchedBaseComp.component_desc ?? ''}`.trim() : '');

    const matchedMake = makes.find(m => m.make_id === item.make_id);
    setMakeSearchQuery(matchedMake?.name || '');

    const matchedModel = models.find(m => m.model_id === item.model_id);
    setModelSearchQuery(matchedModel?.name || '');

    setComponentForm({
      system_id: item.system_id || '',
      component_id: item.component_id || '',
      make_id: item.make_id || '',
      model_id: item.model_id || '',
      equipment_component_code: item.equipment_component_code || '',
      equipment_component_desc: item.equipment_component_desc || '',
      serial_no: item.serial_no || '',
      is_active: item.is_active ?? true,
      cost: item.cost !== null && item.cost !== undefined ? String(item.cost) : '0',
      srv_rdg: item.srv_rdg !== null && item.srv_rdg !== undefined ? String(item.srv_rdg) : '0',
      cost_rdg: item.cost_rdg !== null && item.cost_rdg !== undefined ? String(item.cost_rdg) : '0',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this equipment component record?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('component_maintenance')
        .delete()
        .eq('equipment_component_id', id);

      if (error) throw error;

      setSuccessMsg('Component record deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchComponentRegistryData(searchQuery, searchSystemId, searchComponentId);
    } catch (err: unknown) {
      console.error('Error deleting record:', err);
      setErrorMsg('Failed to delete record. Check foreign key constraints.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentForm.equipment_component_code.trim() || !componentForm.system_id || !componentForm.component_id) {
      setErrorMsg('Component Code, System, and Component type are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        system_id: componentForm.system_id,
        component_id: componentForm.component_id,
        make_id: componentForm.make_id || null,
        model_id: componentForm.model_id || null,
        equipment_component_code: componentForm.equipment_component_code.trim(),
        equipment_component_desc: componentForm.equipment_component_desc.trim() || null,
        serial_no: componentForm.serial_no.trim() || null,
        is_active: componentForm.is_active,
        cost: componentForm.cost !== '' ? Number(componentForm.cost) : 0,
        srv_rdg: componentForm.srv_rdg !== '' ? Number(componentForm.srv_rdg) : 0,
        cost_rdg: componentForm.cost_rdg !== '' ? Number(componentForm.cost_rdg) : 0,
      };

      if (editingId) {
        const { error } = await supabase
          .from('component_maintenance')
          .update(payload)
          .eq('equipment_component_id', editingId);

        if (error) throw error;
        setSuccessMsg('Component maintenance record updated successfully!');
      } else {
        const { error } = await supabase
          .from('component_maintenance')
          .insert([payload]);

        if (error) throw error;
        setSuccessMsg('Component maintenance record registered successfully!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchComponentRegistryData(componentForm.equipment_component_code.trim(), componentForm.system_id, componentForm.component_id);
    } catch (err: unknown) {
      console.error('Error saving record:', err);
      setErrorMsg('Failed to save record. Please check unique code constraints or required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabFilteredComponents = baseComponents.filter(c => {
    return searchSystemId ? c.system_id === searchSystemId : true;
  });

  const filteredSystems = systems.filter(s => {
    const q = systemSearchQuery.toLowerCase();
    return (s.system_code ?? '').toLowerCase().includes(q) || (s.system_desc ?? '').toLowerCase().includes(q);
  });

  const filteredBaseComponents = baseComponents.filter(c => {
    const matchesSystem = componentForm.system_id ? c.system_id === componentForm.system_id : true;
    const q = baseComponentSearchQuery.toLowerCase();
    const matchesSearch = (c.component_code ?? '').toLowerCase().includes(q) || (c.component_desc ?? '').toLowerCase().includes(q);
    return matchesSystem && matchesSearch;
  });

  const filteredMakes = makes.filter(m => (m.name ?? '').toLowerCase().includes(makeSearchQuery.toLowerCase()));

  const filteredModels = models.filter(m => {
    const matchesMake = componentForm.make_id ? m.make_id === componentForm.make_id : true;
    const matchesSearch = (m.name ?? '').toLowerCase().includes(modelSearchQuery.toLowerCase());
    return matchesMake && matchesSearch;
  });

  const totalItems = components.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const displayedComponents = components.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3 shrink-0">
        <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">Component Maintenance Registry</h1>
          <p className="text-xs text-slate-400">Manage equipment systems, component assemblies, serial numbers, and maintenance metrics.</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-200 px-3.5 py-2.5 rounded-lg flex items-center gap-3 text-xs animate-fade-in shrink-0">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-950/50 border border-red-800 text-red-200 px-3.5 py-2.5 rounded-lg flex items-center gap-3 text-xs shrink-0">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Container Card Body */}
      <div className="flex flex-col flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl overflow-hidden space-y-3">
        
        {/* Header Bar with Title & Add Action */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-slate-950 border border-slate-800 p-3 gap-3 shrink-0 rounded-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Search & Select Component</span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow shrink-0 justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Component</span>
          </button>
        </div>

        {/* Compact Search & Filter Controls Panel */}
        <div className="p-3 border border-slate-800 bg-slate-950/40 space-y-2.5 shrink-0 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Dropdown 1: System */}
            <div>
              <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-blue-400" /> System
              </label>
              <select
                value={searchSystemId}
                onChange={handleSystemChange}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">-- All Systems --</option>
                {systems.map((s) => (
                  <option key={s.system_id} value={s.system_id}>
                    {s.system_code} {s.system_desc ? `- ${s.system_desc}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown 2: Component Type */}
            <div>
              <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-blue-400" /> Component Type
              </label>
              <select
                value={searchComponentId}
                onChange={handleComponentChange}
                disabled={!searchSystemId && tabFilteredComponents.length === 0}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
              >
                <option value="">-- All Component Types --</option>
                {tabFilteredComponents.map((c) => (
                  <option key={c.component_id} value={c.component_id}>
                    {c.component_code} {c.component_desc ? `- ${c.component_desc}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Text Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by Component Code, Serial, or Description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>

        {/* Selected Component Banner */}
        {selectedComponent && (
          <div className="px-4 py-2 bg-blue-950/20 border border-slate-800 rounded-lg flex items-center justify-between text-xs text-slate-300 shrink-0">
            <span className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Selected Target Component: <strong className="text-blue-400">{selectedComponent.equipment_component_code}</strong> ({selectedComponent.system_display})</span>
            </span>
            <button 
              onClick={() => setSelectedComponent(null)}
              className="text-slate-400 hover:text-red-400 p-1 cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Results Table Panel */}
        <div className="flex flex-col flex-1 min-h-0 space-y-2">
          <div className="flex-1 min-h-0 overflow-auto border border-slate-800/60 rounded-lg bg-slate-950">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase bg-slate-950 sticky top-0 z-10">
                  <th className="py-2 px-3">Component Code / Serial</th>
                  <th className="py-2 px-3">System / Component</th>
                  <th className="py-2 px-3">Make / Model</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 font-mono">Cost & Readings</th>
                  <th className="py-2 px-3 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loadingData ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span>Loading component maintenance records...</span>
                      </div>
                    </td>
                  </tr>
                ) : !hasSearched ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                      Select a System or Component Type from the dropdowns above to search and populate records.
                    </td>
                  </tr>
                ) : displayedComponents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                      No active component maintenance records found.
                    </td>
                  </tr>
                ) : (
                  displayedComponents.map((item) => {
                    const isSelected = selectedComponent?.equipment_component_id === item.equipment_component_id;
                    return (
                      <tr 
                        key={item.equipment_component_id} 
                        onClick={() => setSelectedComponent(item)}
                        className={`hover:bg-slate-900/50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-950/30 border-l-2 border-l-blue-500' : ''
                        }`}
                      >
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-100">{item.equipment_component_code}</div>
                          {item.serial_no && <div className="text-[11px] text-slate-400 font-mono">S/N: {item.serial_no}</div>}
                        </td>
                        <td className="py-2 px-3">
                          <div className="text-slate-200 font-medium">{item.system_display}</div>
                          <div className="text-[11px] text-slate-400">{item.component_display}</div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="text-slate-200">{item.make_name}</div>
                          <div className="text-[11px] text-slate-400">{item.model_name}</div>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${item.is_active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px]">
                          <div className="text-slate-200">Cost: ${Number(item.cost ?? 0).toLocaleString()}</div>
                          <div className="text-slate-400">Srv Rdg: {item.srv_rdg ?? 0} | Cost Rdg: {item.cost_rdg ?? 0}</div>
                        </td>
                        <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.equipment_component_id)}
                              className="text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          {hasSearched && totalItems > 0 && (
            <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span>
                  Showing <strong className="text-slate-200">{startIndex + 1}</strong> to{' '}
                  <strong className="text-slate-200">{endIndex}</strong> of{' '}
                  <strong className="text-slate-200">{totalItems}</strong> components
                </span>

                <div className="flex items-center gap-1.5 ml-2">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 bg-slate-950 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="p-1 bg-slate-950 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-slate-950">
              <h3 className="text-base font-bold text-slate-100">
                {editingId ? 'Edit Component Maintenance' : 'Add Component Maintenance'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* System Dropdown Search (Parent) */}
                  <div className="relative" ref={systemDropdownRef}>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">System <span className="text-red-500">*</span></label>
                    <div 
                      onClick={() => setIsSystemDropdownOpen(!isSystemDropdownOpen)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 flex items-center justify-between cursor-pointer focus:border-blue-500"
                    >
                      <span className={componentForm.system_id ? 'text-slate-100' : 'text-slate-500'}>
                        {(() => {
                          const s = systems.find(sys => sys.system_id === componentForm.system_id);
                          return s ? `${s.system_code}${s.system_desc ? ` - ${s.system_desc}` : ''}` : 'Select System...';
                        })()}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>

                    {isSystemDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-2 border-b border-slate-800">
                          <input
                            type="text"
                            placeholder="Search system code/desc..."
                            value={systemSearchQuery}
                            onChange={(e) => setSystemSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1 space-y-1">
                          {filteredSystems.length === 0 ? (
                            <div className="py-3 text-center text-xs text-slate-500">No systems found.</div>
                          ) : (
                            filteredSystems.map((s) => (
                              <div
                                key={s.system_id}
                                onClick={() => {
                                  const newlySelectedSysId = s.system_id;
                                  const currentComp = baseComponents.find(bc => bc.component_id === componentForm.component_id);
                                  const resetComp = currentComp && currentComp.system_id !== newlySelectedSysId;

                                  setComponentForm({ 
                                    ...componentForm, 
                                    system_id: newlySelectedSysId,
                                    component_id: resetComp ? '' : componentForm.component_id 
                                  });
                                  if (resetComp) {
                                    setBaseComponentSearchQuery('');
                                  }
                                  setSystemSearchQuery(`${s.system_code}${s.system_desc ? ` - ${s.system_desc}` : ''}`);
                                  setIsSystemDropdownOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-blue-950/40 rounded-lg cursor-pointer text-xs text-slate-200 transition-colors"
                              >
                                <span className="font-semibold font-mono text-blue-400">{s.system_code}</span> {s.system_desc ? `- ${s.system_desc}` : ''}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Base Component Dropdown Search (Child of System) */}
                  <div className="relative" ref={baseComponentDropdownRef}>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Component Type <span className="text-red-500">*</span></label>
                    <div 
                      onClick={() => {
                        if (!componentForm.system_id) {
                          setErrorMsg('Please select a System first.');
                          return;
                        }
                        setErrorMsg(null);
                        setIsBaseComponentDropdownOpen(!isBaseComponentDropdownOpen);
                      }}
                      className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 flex items-center justify-between cursor-pointer focus:border-blue-500 ${!componentForm.system_id ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <span className={componentForm.component_id ? 'text-slate-100' : 'text-slate-500'}>
                        {(() => {
                          const c = baseComponents.find(comp => comp.component_id === componentForm.component_id);
                          return c ? `${c.component_code}${c.component_desc ? ` - ${c.component_desc}` : ''}` : (componentForm.system_id ? 'Select Component Type...' : 'Select System First');
                        })()}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>

                    {isBaseComponentDropdownOpen && componentForm.system_id && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-2 border-b border-slate-800">
                          <input
                            type="text"
                            placeholder="Search component code/desc..."
                            value={baseComponentSearchQuery}
                            onChange={(e) => setBaseComponentSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1 space-y-1">
                          {filteredBaseComponents.length === 0 ? (
                            <div className="py-3 text-center text-xs text-slate-500">No components found for this system.</div>
                          ) : (
                            filteredBaseComponents.map((c) => (
                              <div
                                key={c.component_id}
                                onClick={() => {
                                  setComponentForm({ ...componentForm, component_id: c.component_id });
                                  setBaseComponentSearchQuery(`${c.component_code}${c.component_desc ? ` - ${c.component_desc}` : ''}`);
                                  setIsBaseComponentDropdownOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-blue-950/40 rounded-lg cursor-pointer text-xs text-slate-200 transition-colors"
                              >
                                <span className="font-semibold font-mono text-blue-400">{c.component_code}</span> {c.component_desc ? `- ${c.component_desc}` : ''}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Make Dropdown Search */}
                  <div className="relative" ref={makeDropdownRef}>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Make (Optional)</label>
                    <div 
                      onClick={() => setIsMakeDropdownOpen(!isMakeDropdownOpen)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 flex items-center justify-between cursor-pointer focus:border-blue-500"
                    >
                      <span className={componentForm.make_id ? 'text-slate-100' : 'text-slate-500'}>
                        {makes.find(m => m.make_id === componentForm.make_id)?.name || 'Select Make...'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>

                    {isMakeDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-2 border-b border-slate-800">
                          <input
                            type="text"
                            placeholder="Search make..."
                            value={makeSearchQuery}
                            onChange={(e) => setMakeSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1 space-y-1">
                          <div
                            onClick={() => {
                              setComponentForm({ ...componentForm, make_id: '', model_id: '' });
                              setMakeSearchQuery('');
                              setModelSearchQuery('');
                              setIsMakeDropdownOpen(false);
                            }}
                            className="px-3 py-2 hover:bg-slate-900 rounded-lg cursor-pointer text-xs text-slate-400 italic transition-colors"
                          >
                            None / Clear
                          </div>
                          {filteredMakes.map((m) => (
                            <div
                              key={m.make_id}
                              onClick={() => {
                                const newlySelectedMakeId = m.make_id;
                                const currentModel = models.find(mod => mod.model_id === componentForm.model_id);
                                const resetModel = currentModel && currentModel.make_id !== newlySelectedMakeId;

                                setComponentForm({ 
                                  ...componentForm, 
                                  make_id: newlySelectedMakeId,
                                  model_id: resetModel ? '' : componentForm.model_id 
                                });
                                if (resetModel) {
                                  setModelSearchQuery('');
                                }
                                setMakeSearchQuery(m.name || '');
                                setIsMakeDropdownOpen(false);
                              }}
                              className="px-3 py-2 hover:bg-blue-950/40 rounded-lg cursor-pointer text-xs text-slate-200 transition-colors"
                            >
                              {m.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Model Dropdown Search */}
                  <div className="relative" ref={modelDropdownRef}>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Model (Optional)</label>
                    <div 
                      onClick={() => {
                        if (!componentForm.make_id) {
                          setErrorMsg('Please select a Make first.');
                          return;
                        }
                        setErrorMsg(null);
                        setIsModelDropdownOpen(!isModelDropdownOpen);
                      }}
                      className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 flex items-center justify-between cursor-pointer focus:border-blue-500 ${!componentForm.make_id ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <span className={componentForm.model_id ? 'text-slate-100' : 'text-slate-500'}>
                        {models.find(m => m.model_id === componentForm.model_id)?.name || (componentForm.make_id ? 'Select Model...' : 'Select Make First')}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>

                    {isModelDropdownOpen && componentForm.make_id && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-2 border-b border-slate-800">
                          <input
                            type="text"
                            placeholder="Search model..."
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1 space-y-1">
                          <div
                            onClick={() => {
                              setComponentForm({ ...componentForm, model_id: '' });
                              setModelSearchQuery('');
                              setIsModelDropdownOpen(false);
                            }}
                            className="px-3 py-2 hover:bg-slate-900 rounded-lg cursor-pointer text-xs text-slate-400 italic transition-colors"
                          >
                            None / Clear
                          </div>
                          {filteredModels.length === 0 ? (
                            <div className="py-3 text-center text-xs text-slate-500">No models found for this make.</div>
                          ) : (
                            filteredModels.map((m) => (
                              <div
                                key={m.model_id}
                                onClick={() => {
                                  setComponentForm({ ...componentForm, model_id: m.model_id });
                                  setModelSearchQuery(m.name || '');
                                  setIsModelDropdownOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-blue-950/40 rounded-lg cursor-pointer text-xs text-slate-200 transition-colors"
                              >
                                {m.name}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Equipment Component Code <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={componentForm.equipment_component_code}
                      onChange={(e) => setComponentForm({ ...componentForm, equipment_component_code: e.target.value })}
                      placeholder="e.g. ENG-ALT-001"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Serial Number</label>
                    <input
                      type="text"
                      value={componentForm.serial_no}
                      onChange={(e) => setComponentForm({ ...componentForm, serial_no: e.target.value })}
                      placeholder="Optional serial number"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Cost & Read-Only Readings Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Cost ($)</label>
                    <input
                      type="number"
                      step="any"
                      value={componentForm.cost}
                      onChange={(e) => setComponentForm({ ...componentForm, cost: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Service Reading (Srv Rdg)</label>
                    <input
                      type="number"
                      step="any"
                      value={componentForm.srv_rdg}
                      readOnly
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-2 text-xs text-slate-400 focus:outline-none font-mono opacity-75 cursor-not-allowed select-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Cost Reading (Cost Rdg)</label>
                    <input
                      type="number"
                      step="any"
                      value={componentForm.cost_rdg}
                      readOnly
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-2 text-xs text-slate-400 focus:outline-none font-mono opacity-75 cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active_chk"
                    checked={componentForm.is_active}
                    onChange={(e) => setComponentForm({ ...componentForm, is_active: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="is_active_chk" className="text-xs font-semibold uppercase text-slate-400 cursor-pointer">Is Active</label>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={componentForm.equipment_component_desc}
                    onChange={(e) => setComponentForm({ ...componentForm, equipment_component_desc: e.target.value })}
                    placeholder="Optional component maintenance details..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-950">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingId ? 'Update Component' : 'Save Component'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComponentRegistry;








// import React, { useState, useEffect, useRef } from 'react';
// import { supabase } from '@/lib/supabaseClient';
// import { 
//   Layers, 
//   Plus, 
//   CheckCircle, 
//   AlertCircle, 
//   X,
//   Edit2,
//   Trash2,
//   Save,
//   Loader2,
//   Search,
//   ChevronDown,
//   ChevronLeft,
//   ChevronRight,
//   Cpu,
//   Filter
// } from 'lucide-react';

// interface ComponentMaintenanceRecord {
//   equipment_component_id: string;
//   system_id: string;
//   component_id: string;
//   make_id?: string | null;
//   model_id?: string | null;
//   equipment_component_code: string;
//   equipment_component_desc?: string | null;
//   serial_no?: string | null;
//   is_active: boolean;
//   cost?: number | null;
//   srv_rdg?: number | null;
//   cost_rdg?: number | null;
//   is_scrapped?: boolean;
//   system_display?: string;
//   component_display?: string;
//   make_name?: string;
//   model_name?: string;
//   [key: string]: unknown;
// }

// interface SystemOption {
//   system_id: string;
//   system_code: string;
//   system_desc?: string | null;
//   [key: string]: unknown;
// }

// interface ComponentOption {
//   component_id: string;
//   system_id: string;
//   component_code: string;
//   component_desc?: string | null;
//   [key: string]: unknown;
// }

// interface MakeOption {
//   make_id: string;
//   name?: string;
//   [key: string]: unknown;
// }

// interface ModelOption {
//   model_id: string;
//   make_id: string;
//   name?: string;
//   [key: string]: unknown;
// }

// export function ComponentRegistry() {
//   const [components, setComponents] = useState<ComponentMaintenanceRecord[]>([]);
  
//   // Foreign Key reference options
//   const [systems, setSystems] = useState<SystemOption[]>([]);
//   const [baseComponents, setBaseComponents] = useState<ComponentOption[]>([]);
//   const [makes, setMakes] = useState<MakeOption[]>([]);
//   const [models, setModels] = useState<ModelOption[]>([]);

//   // Search & Filter States
//   const [searchSystemId, setSearchSystemId] = useState<string>('');
//   const [searchComponentId, setSearchComponentId] = useState<string>('');
//   const [searchQuery, setSearchQuery] = useState<string>('');

//   // Pagination States
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [pageSize, setPageSize] = useState<number>(10);

//   const [loadingData, setLoadingData] = useState<boolean>(false);
//   const [hasSearched, setHasSearched] = useState<boolean>(false);
//   const [selectedComponent, setSelectedComponent] = useState<ComponentMaintenanceRecord | null>(null);

//   const [errorMsg, setErrorMsg] = useState<string | null>(null);
//   const [successMsg, setSuccessMsg] = useState<string | null>(null);
//   const [submitting, setSubmitting] = useState<boolean>(false);

//   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
//   const [editingId, setEditingId] = useState<string | null>(null);

//   // Dropdown search & visibility states for the Add/Edit form modal
//   const [systemSearchQuery, setSystemSearchQuery] = useState<string>('');
//   const [isSystemDropdownOpen, setIsSystemDropdownOpen] = useState<boolean>(false);
//   const systemDropdownRef = useRef<HTMLDivElement>(null);

//   const [baseComponentSearchQuery, setBaseComponentSearchQuery] = useState<string>('');
//   const [isBaseComponentDropdownOpen, setIsBaseComponentDropdownOpen] = useState<boolean>(false);
//   const baseComponentDropdownRef = useRef<HTMLDivElement>(null);

//   const [makeSearchQuery, setMakeSearchQuery] = useState<string>('');
//   const [isMakeDropdownOpen, setIsMakeDropdownOpen] = useState<boolean>(false);
//   const makeDropdownRef = useRef<HTMLDivElement>(null);

//   const [modelSearchQuery, setModelSearchQuery] = useState<string>('');
//   const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
//   const modelDropdownRef = useRef<HTMLDivElement>(null);

//   const [componentForm, setComponentForm] = useState({
//     system_id: '',
//     component_id: '',
//     make_id: '',
//     model_id: '',
//     equipment_component_code: '',
//     equipment_component_desc: '',
//     serial_no: '',
//     is_active: true,
//     cost: '0',
//     srv_rdg: '0',
//     cost_rdg: '0',
//   });

//   // Close dropdowns on outside click
//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (systemDropdownRef.current && !systemDropdownRef.current.contains(event.target as Node)) {
//         setIsSystemDropdownOpen(false);
//       }
//       if (baseComponentDropdownRef.current && !baseComponentDropdownRef.current.contains(event.target as Node)) {
//         setIsBaseComponentDropdownOpen(false);
//       }
//       if (makeDropdownRef.current && !makeDropdownRef.current.contains(event.target as Node)) {
//         setIsMakeDropdownOpen(false);
//       }
//       if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
//         setIsModelDropdownOpen(false);
//       }
//     }
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Onload: Load relation lookup options
//   useEffect(() => {
//     let isMounted = true;

//     async function loadRelationOptions() {
//       try {
//         setErrorMsg(null);
//         const [sysRes, compRes, makeRes, modRes] = await Promise.all([
//           supabase.from('equipment_system').select('*').order('system_code', { ascending: true }),
//           supabase.from('equipment_component').select('*').order('component_code', { ascending: true }),
//           supabase.from('vehicle_makes').select('*').order('name', { ascending: true }),
//           supabase.from('vehicle_models').select('*').order('name', { ascending: true }),
//         ]);

//         if (sysRes.error) throw sysRes.error;
//         if (compRes.error) throw compRes.error;
//         if (makeRes.error) throw makeRes.error;
//         if (modRes.error) throw modRes.error;

//         if (isMounted) {
//           setSystems(sysRes.data || []);
//           setBaseComponents(compRes.data || []);
//           setMakes(makeRes.data || []);
//           setModels(modRes.data || []);
//         }
//       } catch (err: unknown) {
//         console.error('Error fetching relation options:', err);
//         if (isMounted) {
//           setErrorMsg('Failed to load system and component options.');
//         }
//       }
//     }

//     loadRelationOptions();

//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   // Query component_maintenance based on filters
//   const fetchComponentRegistryData = async (
//     textQuery: string = searchQuery,
//     sysId: string = searchSystemId,
//     compId: string = searchComponentId
//   ) => {
//     try {
//       setLoadingData(true);
//       setErrorMsg(null);
//       setHasSearched(true);
//       setCurrentPage(1); // Reset page to 1 on new query
//       const trimmedQuery = textQuery.trim();

//       let maintQuery = supabase
//         .from('component_maintenance')
//         .select(`
//           *,
//           equipment_system:system_id(system_code, system_desc),
//           equipment_component:component_id(component_code, component_desc),
//           vehicle_makes:make_id(name),
//           vehicle_models:model_id(name)
//         `)
//         .eq('is_scrapped', false)
//         .order('equipment_component_code', { ascending: true });

//       if (sysId) {
//         maintQuery = maintQuery.eq('system_id', sysId);
//       }

//       if (compId) {
//         maintQuery = maintQuery.eq('component_id', compId);
//       }

//       if (trimmedQuery) {
//         maintQuery = maintQuery.or(`equipment_component_code.ilike.%${trimmedQuery}%,serial_no.ilike.%${trimmedQuery}%,equipment_component_desc.ilike.%${trimmedQuery}%`);
//       }

//       const { data, error } = await maintQuery;
//       if (error) throw error;

//       const formatted = (data || []).map((item: Record<string, unknown>) => {
//         const sysObj = item.equipment_system as Record<string, unknown> | null;
//         const compObj = item.equipment_component as Record<string, unknown> | null;
//         const makeObj = item.vehicle_makes as Record<string, unknown> | null;
//         const modelObj = item.vehicle_models as Record<string, unknown> | null;

//         return {
//           ...item,
//           system_display: sysObj ? `${sysObj.system_code}${sysObj.system_desc ? ` - ${sysObj.system_desc}` : ''}` : '—',
//           component_display: compObj ? `${compObj.component_code}${compObj.component_desc ? ` - ${compObj.component_desc}` : ''}` : '—',
//           make_name: makeObj?.name || '—',
//           model_name: modelObj?.name || '—',
//         };
//       }) as ComponentMaintenanceRecord[];

//       setComponents(formatted);
//     } catch (err: unknown) {
//       console.error('Error fetching component maintenance records:', err);
//       setErrorMsg('Failed to fetch component maintenance records.');
//     } finally {
//       setLoadingData(false);
//     }
//   };

//   // Trigger search on System dropdown change
//   const handleSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const newSystemId = e.target.value;
//     setSearchSystemId(newSystemId);
//     setSearchComponentId(''); // Reset child component dropdown
//     fetchComponentRegistryData(searchQuery, newSystemId, '');
//   };

//   // Trigger search on Component dropdown change
//   const handleComponentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const newComponentId = e.target.value;
//     setSearchComponentId(newComponentId);
//     fetchComponentRegistryData(searchQuery, searchSystemId, newComponentId);
//   };

//   const handleSearchSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     fetchComponentRegistryData(searchQuery, searchSystemId, searchComponentId);
//   };

//   const handleOpenAdd = () => {
//     setEditingId(null);
//     setSystemSearchQuery('');
//     setBaseComponentSearchQuery('');
//     setMakeSearchQuery('');
//     setModelSearchQuery('');
//     setComponentForm({
//       system_id: '',
//       component_id: '',
//       make_id: '',
//       model_id: '',
//       equipment_component_code: '',
//       equipment_component_desc: '',
//       serial_no: '',
//       is_active: true,
//       cost: '0',
//       srv_rdg: '0',
//       cost_rdg: '0',
//     });
//     setIsModalOpen(true);
//   };

//   const handleOpenEdit = (item: ComponentMaintenanceRecord) => {
//     setEditingId(item.equipment_component_id);

//     const matchedSys = systems.find(s => s.system_id === item.system_id);
//     setSystemSearchQuery(matchedSys ? `${matchedSys.system_code} ${matchedSys.system_desc || ''}`.trim() : '');

//     const matchedBaseComp = baseComponents.find(c => c.component_id === item.component_id);
//     setBaseComponentSearchQuery(matchedBaseComp ? `${matchedBaseComp.component_code} ${matchedBaseComp.component_desc || ''}`.trim() : '');

//     const matchedMake = makes.find(m => m.make_id === item.make_id);
//     setMakeSearchQuery(matchedMake?.name || '');

//     const matchedModel = models.find(m => m.model_id === item.model_id);
//     setModelSearchQuery(matchedModel?.name || '');

//     setComponentForm({
//       system_id: item.system_id || '',
//       component_id: item.component_id || '',
//       make_id: item.make_id || '',
//       model_id: item.model_id || '',
//       equipment_component_code: item.equipment_component_code || '',
//       equipment_component_desc: item.equipment_component_desc || '',
//       serial_no: item.serial_no || '',
//       is_active: item.is_active ?? true,
//       cost: item.cost !== null && item.cost !== undefined ? String(item.cost) : '0',
//       srv_rdg: item.srv_rdg !== null && item.srv_rdg !== undefined ? String(item.srv_rdg) : '0',
//       cost_rdg: item.cost_rdg !== null && item.cost_rdg !== undefined ? String(item.cost_rdg) : '0',
//     });
//     setIsModalOpen(true);
//   };

//   const handleDelete = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this equipment component record?')) return;
//     try {
//       setErrorMsg(null);
//       const { error } = await supabase
//         .from('component_maintenance')
//         .delete()
//         .eq('equipment_component_id', id);

//       if (error) throw error;

//       setSuccessMsg('Component record deleted successfully!');
//       setTimeout(() => setSuccessMsg(null), 3000);
//       fetchComponentRegistryData(searchQuery, searchSystemId, searchComponentId);
//     } catch (err: unknown) {
//       console.error('Error deleting record:', err);
//       setErrorMsg('Failed to delete record. Check foreign key constraints.');
//     }
//   };

//   const handleSubmitForm = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!componentForm.equipment_component_code.trim() || !componentForm.system_id || !componentForm.component_id) {
//       setErrorMsg('Component Code, System, and Component type are required.');
//       return;
//     }

//     setSubmitting(true);
//     setErrorMsg(null);

//     try {
//       const payload = {
//         system_id: componentForm.system_id,
//         component_id: componentForm.component_id,
//         make_id: componentForm.make_id || null,
//         model_id: componentForm.model_id || null,
//         equipment_component_code: componentForm.equipment_component_code.trim(),
//         equipment_component_desc: componentForm.equipment_component_desc.trim() || null,
//         serial_no: componentForm.serial_no.trim() || null,
//         is_active: componentForm.is_active,
//         cost: componentForm.cost !== '' ? Number(componentForm.cost) : 0,
//         srv_rdg: componentForm.srv_rdg !== '' ? Number(componentForm.srv_rdg) : 0,
//         cost_rdg: componentForm.cost_rdg !== '' ? Number(componentForm.cost_rdg) : 0,
//       };

//       if (editingId) {
//         const { error } = await supabase
//           .from('component_maintenance')
//           .update(payload)
//           .eq('equipment_component_id', editingId);

//         if (error) throw error;
//         setSuccessMsg('Component maintenance record updated successfully!');
//       } else {
//         const { error } = await supabase
//           .from('component_maintenance')
//           .insert([payload]);

//         if (error) throw error;
//         setSuccessMsg('Component maintenance record registered successfully!');
//       }

//       setIsModalOpen(false);
//       setTimeout(() => setSuccessMsg(null), 4000);
//       fetchComponentRegistryData(componentForm.equipment_component_code.trim(), componentForm.system_id, componentForm.component_id);
//     } catch (err: unknown) {
//       console.error('Error saving record:', err);
//       setErrorMsg('Failed to save record. Please check unique code constraints or required fields.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Filtered child components for Search Controls (Parent-Child with searchSystemId)
//   const tabFilteredComponents = baseComponents.filter(c => {
//     return searchSystemId ? c.system_id === searchSystemId : true;
//   });

//   // Filtered options for Add/Edit Form
//   const filteredSystems = systems.filter(s => {
//     const q = systemSearchQuery.toLowerCase();
//     return s.system_code?.toLowerCase().includes(q) || s.system_desc?.toLowerCase().includes(q);
//   });

//   const filteredBaseComponents = baseComponents.filter(c => {
//     const matchesSystem = componentForm.system_id ? c.system_id === componentForm.system_id : true;
//     const q = baseComponentSearchQuery.toLowerCase();
//     const matchesSearch = c.component_code?.toLowerCase().includes(q) || c.component_desc?.toLowerCase().includes(q);
//     return matchesSystem && matchesSearch;
//   });

//   const filteredMakes = makes.filter(m => m.name?.toLowerCase().includes(makeSearchQuery.toLowerCase()));

//   const filteredModels = models.filter(m => {
//     const matchesMake = componentForm.make_id ? m.make_id === componentForm.make_id : true;
//     const matchesSearch = m.name?.toLowerCase().includes(modelSearchQuery.toLowerCase());
//     return matchesMake && matchesSearch;
//   });

//   // Pagination calculations
//   const totalItems = components.length;
//   const totalPages = Math.ceil(totalItems / pageSize) || 1;
//   const startIndex = (currentPage - 1) * pageSize;
//   const endIndex = Math.min(startIndex + pageSize, totalItems);
//   const displayedComponents = components.slice(startIndex, endIndex);

//   return (
//     <div className="p-4 md:p-6 w-full max-w-7xl mx-auto space-y-4 flex flex-col min-h-[calc(100vh-80px)]">
//       <div className="flex items-center gap-3 border-b border-slate-800 pb-3 shrink-0">
//         <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
//           <Layers className="w-6 h-6" />
//         </div>
//         <div>
//           <h1 className="text-xl font-bold tracking-tight text-slate-100">Component Maintenance Registry</h1>
//           <p className="text-xs text-slate-400">Manage equipment systems, component assemblies, serial numbers, and maintenance metrics.</p>
//         </div>
//       </div>

//       {successMsg && (
//         <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-200 px-3.5 py-2.5 rounded-lg flex items-center gap-3 text-xs animate-fade-in shrink-0">
//           <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
//           <span>{successMsg}</span>
//         </div>
//       )}

//       {errorMsg && (
//         <div className="bg-red-950/50 border border-red-800 text-red-200 px-3.5 py-2.5 rounded-lg flex items-center gap-3 text-xs shrink-0">
//           <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
//           <span>{errorMsg}</span>
//         </div>
//       )}

//       {/* Main Container Card */}
//       <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col flex-1 min-h-0">
        
//         {/* Header Bar with Title & Add Action */}
//         <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-slate-950 border-b border-slate-800 p-3 gap-3 shrink-0">
//           <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
//             <Cpu className="w-4 h-4 text-blue-400" />
//             <span>Search & Select Component</span>
//           </div>

//           <button
//             onClick={handleOpenAdd}
//             className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow shrink-0 justify-center"
//           >
//             <Plus className="w-3.5 h-3.5" />
//             <span>Add Component</span>
//           </button>
//         </div>

//         {/* Compact Search & Filter Controls Panel */}
//         <div className="p-3 border-b border-slate-800 bg-slate-950/40 space-y-2.5 shrink-0">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
//             {/* Dropdown 1: System */}
//             <div>
//               <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
//                 <Filter className="w-3 h-3 text-blue-400" /> System
//               </label>
//               <select
//                 value={searchSystemId}
//                 onChange={handleSystemChange}
//                 className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
//               >
//                 <option value="">-- All Systems --</option>
//                 {systems.map((s) => (
//                   <option key={s.system_id} value={s.system_id}>
//                     {s.system_code} {s.system_desc ? `- ${s.system_desc}` : ''}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Dropdown 2: Component Type (Child of System) */}
//             <div>
//               <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
//                 <Filter className="w-3 h-3 text-blue-400" /> Component Type
//               </label>
//               <select
//                 value={searchComponentId}
//                 onChange={handleComponentChange}
//                 disabled={!searchSystemId && tabFilteredComponents.length === 0}
//                 className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
//               >
//                 <option value="">-- All Component Types --</option>
//                 {tabFilteredComponents.map((c) => (
//                   <option key={c.component_id} value={c.component_id}>
//                     {c.component_code} {c.component_desc ? `- ${c.component_desc}` : ''}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           {/* Text Search Bar */}
//           <form onSubmit={handleSearchSubmit} className="flex gap-2">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
//               <input
//                 type="text"
//                 placeholder="Filter by Component Code, Serial, or Description..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             <button
//               type="submit"
//               className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
//             >
//               Search
//             </button>
//           </form>
//         </div>

//         {/* Selected Component Banner */}
//         {selectedComponent && (
//           <div className="px-4 py-2 bg-blue-950/20 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0">
//             <span className="flex items-center gap-2">
//               <Cpu className="w-3.5 h-3.5 text-blue-400" />
//               <span>Selected Target Component: <strong className="text-blue-400">{selectedComponent.equipment_component_code}</strong> ({selectedComponent.system_display})</span>
//             </span>
//             <button 
//               onClick={() => setSelectedComponent(null)}
//               className="text-slate-400 hover:text-red-400 p-1 cursor-pointer"
//               title="Clear selection"
//             >
//               <X className="w-3.5 h-3.5" />
//             </button>
//           </div>
//         )}

//         {/* Results Table Panel */}
//         <div className="p-3 md:p-4 flex flex-col flex-1 min-h-0">
//           <div className="overflow-y-auto overflow-x-auto flex-1 border border-slate-800/60 rounded-lg max-h-[calc(100vh-420px)]">
//             <table className="w-full text-left border-collapse text-sm">
//               <thead>
//                 <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
//                   <th className="p-3">Component Code / Serial</th>
//                   <th className="p-3">System / Component</th>
//                   <th className="p-3">Make / Model</th>
//                   <th className="p-3">Status</th>
//                   <th className="p-3 font-mono">Cost & Readings</th>
//                   <th className="p-3 text-right">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-800 text-slate-300">
//                 {loadingData ? (
//                   <tr>
//                     <td colSpan={6} className="p-6 text-center text-slate-400">
//                       <div className="flex items-center justify-center gap-2">
//                         <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
//                         <span>Loading component maintenance records...</span>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : !hasSearched ? (
//                   <tr>
//                     <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
//                       Select a System or Component Type from the dropdowns above to search and populate records.
//                     </td>
//                   </tr>
//                 ) : displayedComponents.length === 0 ? (
//                   <tr>
//                     <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
//                       No active component maintenance records found.
//                     </td>
//                   </tr>
//                 ) : (
//                   displayedComponents.map((item) => {
//                     const isSelected = selectedComponent?.equipment_component_id === item.equipment_component_id;
//                     return (
//                       <tr 
//                         key={item.equipment_component_id} 
//                         onClick={() => setSelectedComponent(item)}
//                         className={`hover:bg-slate-950/40 transition-colors cursor-pointer ${
//                           isSelected ? 'bg-blue-950/30 border-l-2 border-l-blue-500' : ''
//                         }`}
//                       >
//                         <td className="p-3">
//                           <div className="font-semibold text-slate-100">{item.equipment_component_code}</div>
//                           {item.serial_no && <div className="text-xs text-slate-400 font-mono">S/N: {item.serial_no}</div>}
//                         </td>
//                         <td className="p-3">
//                           <div className="text-slate-200 font-medium">{item.system_display}</div>
//                           <div className="text-xs text-slate-400">{item.component_display}</div>
//                         </td>
//                         <td className="p-3">
//                           <div className="text-slate-200">{item.make_name}</div>
//                           <div className="text-xs text-slate-400">{item.model_name}</div>
//                         </td>
//                         <td className="p-3">
//                           <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.is_active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`}>
//                             {item.is_active ? 'Active' : 'Inactive'}
//                           </span>
//                         </td>
//                         <td className="p-3 font-mono text-xs">
//                           <div className="text-slate-200">Cost: ${Number(item.cost ?? 0).toLocaleString()}</div>
//                           <div className="text-slate-400">Srv Rdg: {item.srv_rdg ?? 0} | Cost Rdg: {item.cost_rdg ?? 0}</div>
//                         </td>
//                         <td className="p-3 text-right space-x-3" onClick={(e) => e.stopPropagation()}>
//                           <button
//                             onClick={() => handleOpenEdit(item)}
//                             className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
//                           >
//                             <Edit2 className="w-3.5 h-3.5" /> Edit
//                           </button>
//                           <button
//                             onClick={() => handleDelete(item.equipment_component_id)}
//                             className="text-xs text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
//                           >
//                             <Trash2 className="w-3.5 h-3.5" /> Delete
//                           </button>
//                         </td>
//                       </tr>
//                     );
//                   })
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Pagination Toolbar */}
//           {hasSearched && totalItems > 0 && (
//             <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 shrink-0">
//               <div className="flex items-center gap-3">
//                 <span>
//                   Showing <strong className="text-slate-200">{startIndex + 1}</strong> to{' '}
//                   <strong className="text-slate-200">{endIndex}</strong> of{' '}
//                   <strong className="text-slate-200">{totalItems}</strong> components
//                 </span>

//                 <div className="flex items-center gap-1.5 ml-2">
//                   <span>Per page:</span>
//                   <select
//                     value={pageSize}
//                     onChange={(e) => {
//                       setPageSize(Number(e.target.value));
//                       setCurrentPage(1);
//                     }}
//                     className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
//                   >
//                     <option value={5}>5</option>
//                     <option value={10}>10</option>
//                     <option value={20}>20</option>
//                     <option value={50}>50</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="flex items-center gap-1">
//                 <button
//                   type="button"
//                   onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                   disabled={currentPage === 1}
//                   className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
//                 >
//                   <ChevronLeft className="w-3.5 h-3.5" />
//                   <span>Prev</span>
//                 </button>

//                 <span className="px-3 py-1 font-mono text-slate-300">
//                   Page {currentPage} of {totalPages}
//                 </span>

//                 <button
//                   type="button"
//                   onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//                   disabled={currentPage >= totalPages}
//                   className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
//                 >
//                   <span>Next</span>
//                   <ChevronRight className="w-3.5 h-3.5" />
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Add / Edit Form Modal */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
//           <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
//             <div className="flex items-center justify-between border-b border-slate-800 pb-4">
//               <h3 className="text-lg font-bold text-slate-100">
//                 {editingId ? 'Edit Component Maintenance' : 'Add Component Maintenance'}
//               </h3>
//               <button 
//                 onClick={() => setIsModalOpen(false)}
//                 className="text-slate-400 hover:text-slate-100 cursor-pointer"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <form onSubmit={handleSubmitForm} className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* System Dropdown Search (Parent) */}
//                 <div className="relative" ref={systemDropdownRef}>
//                   <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">System <span className="text-red-500">*</span></label>
//                   <div 
//                     onClick={() => setIsSystemDropdownOpen(!isSystemDropdownOpen)}
//                     className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 flex items-center justify-between cursor-pointer focus:border-blue-500"
//                   >
//                     <span className={componentForm.system_id ? 'text-slate-100' : 'text-slate-500'}>
//                       {(() => {
//                         const s = systems.find(sys => sys.system_id === componentForm.system_id);
//                         return s ? `${s.system_code}${s.system_desc ? ` - ${s.system_desc}` : ''}` : 'Select System...';
//                       })()}
//                     </span>
//                     <ChevronDown className="w-4 h-4 text-slate-400" />
//                   </div>

//                   {isSystemDropdownOpen && (
//                     <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
//                       <div className="p-2 border-b border-slate-800">
//                         <input
//                           type="text"
//                           placeholder="Search system code/desc..."
//                           value={systemSearchQuery}
//                           onChange={(e) => setSystemSearchQuery(e.target.value)}
//                           className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
//                           autoFocus
//                         />
//                       </div>
//                       <div className="max-h-48 overflow-y-auto p-1 space-y-1">
//                         {filteredSystems.length === 0 ? (
//                           <div className="py-3 text-center text-xs text-slate-500">No systems found.</div>
//                         ) : (
//                           filteredSystems.map((s) => (
//                             <div
//                               key={s.system_id}
//                               onClick={() => {
//                                 const newlySelectedSysId = s.system_id;
//                                 const currentComp = baseComponents.find(bc => bc.component_id === componentForm.component_id);
//                                 const resetComp = currentComp && currentComp.system_id !== newlySelectedSysId;

//                                 setComponentForm({ 
//                                   ...componentForm, 
//                                   system_id: newlySelectedSysId,
//                                   component_id: resetComp ? '' : componentForm.component_id 
//                                 });
//                                 if (resetComp) {
//                                   setBaseComponentSearchQuery('');
//                                 }
//                                 setSystemSearchQuery(`${s.system_code}${s.system_desc ? ` - ${s.system_desc}` : ''}`);
//                                 setIsSystemDropdownOpen(false);
//                               }}
//                               className="px-3 py-2 hover:bg-blue-950/40 rounded-lg cursor-pointer text-xs text-slate-200 transition-colors"
//                             >
//                               <span className="font-semibold font-mono text-blue-400">{s.system_code}</span> {s.system_desc ? `- ${s.system_desc}` : ''}
//                             </div>
//                           ))
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Base Component Dropdown Search (Child of System) */}
//                 <div className="relative" ref={baseComponentDropdownRef}>
//                   <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Component Type <span className="text-red-500">*</span></label>
//                   <div 
//                     onClick={() => {
//                       if (!componentForm.system_id) {
//                         setErrorMsg('Please select a System first.');
//                         return;
//                       }
//                       setErrorMsg(null);
//                       setIsBaseComponentDropdownOpen(!isBaseComponentDropdownOpen);
//                     }}
//                     className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 flex items-center justify-between cursor-pointer focus:border-blue-500 ${!componentForm.system_id ? 'opacity-60 cursor-not-allowed' : ''}`}
//                   >
//                     <span className={componentForm.component_id ? 'text-slate-100' : 'text-slate-500'}>
//                       {(() => {
//                         const c = baseComponents.find(comp => comp.component_id === componentForm.component_id);
//                         return c ? `${c.component_code}${c.component_desc ? ` - ${c.component_desc}` : ''}` : (componentForm.system_id ? 'Select Component Type...' : 'Select System First');
//                       })()}
//                     </span>
//                     <ChevronDown className="w-4 h-4 text-slate-400" />
//                   </div>

//                   {isBaseComponentDropdownOpen && componentForm.system_id && (
//                     <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
//                       <div className="p-2 border-b border-slate-800">
//                         <input
//                           type="text"
//                           placeholder="Search component code/desc..."
//                           value={baseComponentSearchQuery}
//                           onChange={(e) => setBaseComponentSearchQuery(e.target.value)}
//                           className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
//                           autoFocus
//                         />
//                       </div>
//                       <div className="max-h-48 overflow-y-auto p-1 space-y-1">
//                         {filteredBaseComponents.length === 0 ? (
//                           <div className="py-3 text-center text-xs text-slate-500">No components found for this system.</div>
//                         ) : (
//                           filteredBaseComponents.map((c) => (
//                             <div
//                               key={c.component_id}
//                               onClick={() => {
//                                 setComponentForm({ ...componentForm, component_id: c.component_id });
//                                 setBaseComponentSearchQuery(`${c.component_code}${c.component_desc ? ` - ${c.component_desc}` : ''}`);
//                                 setIsBaseComponentDropdownOpen(false);
//                               }}
//                               className="px-3 py-2 hover:bg-blue-950/40 rounded-lg cursor-pointer text-xs text-slate-200 transition-colors"
//                             >
//                               <span className="font-semibold font-mono text-blue-400">{c.component_code}</span> {c.component_desc ? `- ${c.component_desc}` : ''}
//                             </div>
//                           ))
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* Make Dropdown Search (Parent) */}
//                 <div className="relative" ref={makeDropdownRef}>
//                   <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Make (Optional)</label>
//                   <div 
//                     onClick={() => setIsMakeDropdownOpen(!isMakeDropdownOpen)}
//                     className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 flex items-center justify-between cursor-pointer focus:border-blue-500"
//                   >
//                     <span className={componentForm.make_id ? 'text-slate-100' : 'text-slate-500'}>
//                       {makes.find(m => m.make_id === componentForm.make_id)?.name || 'Select Make...'}
//                     </span>
//                     <ChevronDown className="w-4 h-4 text-slate-400" />
//                   </div>

//                   {isMakeDropdownOpen && (
//                     <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
//                       <div className="p-2 border-b border-slate-800">
//                         <input
//                           type="text"
//                           placeholder="Search make..."
//                           value={makeSearchQuery}
//                           onChange={(e) => setMakeSearchQuery(e.target.value)}
//                           className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
//                           autoFocus
//                         />
//                       </div>
//                       <div className="max-h-48 overflow-y-auto p-1 space-y-1">
//                         <div
//                           onClick={() => {
//                             setComponentForm({ ...componentForm, make_id: '', model_id: '' });
//                             setMakeSearchQuery('');
//                             setModelSearchQuery('');
//                             setIsMakeDropdownOpen(false);
//                           }}
//                           className="px-3 py-2 hover:bg-slate-900 rounded-lg cursor-pointer text-xs text-slate-400 italic transition-colors"
//                         >
//                           None / Clear
//                         </div>
//                         {filteredMakes.map((m) => (
//                           <div
//                             key={m.make_id}
//                             onClick={() => {
//                               const newlySelectedMakeId = m.make_id;
//                               const currentModel = models.find(mod => mod.model_id === componentForm.model_id);
//                               const resetModel = currentModel && currentModel.make_id !== newlySelectedMakeId;

//                               setComponentForm({ 
//                                 ...componentForm, 
//                                 make_id: newlySelectedMakeId,
//                                 model_id: resetModel ? '' : componentForm.model_id 
//                               });
//                               if (resetModel) {
//                                 setModelSearchQuery('');
//                               }
//                               setMakeSearchQuery(m.name || '');
//                               setIsMakeDropdownOpen(false);
//                             }}
//                             className="px-3 py-2 hover:bg-blue-950/40 rounded-lg cursor-pointer text-xs text-slate-200 transition-colors"
//                           >
//                             {m.name}
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Model Dropdown Search (Child of Make) */}
//                 <div className="relative" ref={modelDropdownRef}>
//                   <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Model (Optional)</label>
//                   <div 
//                     onClick={() => {
//                       if (!componentForm.make_id) {
//                         setErrorMsg('Please select a Make first.');
//                         return;
//                       }
//                       setErrorMsg(null);
//                       setIsModelDropdownOpen(!isModelDropdownOpen);
//                     }}
//                     className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 flex items-center justify-between cursor-pointer focus:border-blue-500 ${!componentForm.make_id ? 'opacity-60 cursor-not-allowed' : ''}`}
//                   >
//                     <span className={componentForm.model_id ? 'text-slate-100' : 'text-slate-500'}>
//                       {models.find(m => m.model_id === componentForm.model_id)?.name || (componentForm.make_id ? 'Select Model...' : 'Select Make First')}
//                     </span>
//                     <ChevronDown className="w-4 h-4 text-slate-400" />
//                   </div>

//                   {isModelDropdownOpen && componentForm.make_id && (
//                     <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
//                       <div className="p-2 border-b border-slate-800">
//                         <input
//                           type="text"
//                           placeholder="Search model..."
//                           value={modelSearchQuery}
//                           onChange={(e) => setModelSearchQuery(e.target.value)}
//                           className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
//                           autoFocus
//                         />
//                       </div>
//                       <div className="max-h-48 overflow-y-auto p-1 space-y-1">
//                         <div
//                           onClick={() => {
//                             setComponentForm({ ...componentForm, model_id: '' });
//                             setModelSearchQuery('');
//                             setIsModelDropdownOpen(false);
//                           }}
//                           className="px-3 py-2 hover:bg-slate-900 rounded-lg cursor-pointer text-xs text-slate-400 italic transition-colors"
//                         >
//                           None / Clear
//                         </div>
//                         {filteredModels.length === 0 ? (
//                           <div className="py-3 text-center text-xs text-slate-500">No models found for this make.</div>
//                         ) : (
//                           filteredModels.map((m) => (
//                             <div
//                               key={m.model_id}
//                               onClick={() => {
//                                 setComponentForm({ ...componentForm, model_id: m.model_id });
//                                 setModelSearchQuery(m.name || '');
//                                 setIsModelDropdownOpen(false);
//                               }}
//                               className="px-3 py-2 hover:bg-blue-950/40 rounded-lg cursor-pointer text-xs text-slate-200 transition-colors"
//                             >
//                               {m.name}
//                             </div>
//                           ))
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Equipment Component Code <span className="text-red-500">*</span></label>
//                   <input
//                     type="text"
//                     required
//                     value={componentForm.equipment_component_code}
//                     onChange={(e) => setComponentForm({ ...componentForm, equipment_component_code: e.target.value })}
//                     placeholder="e.g. ENG-ALT-001"
//                     className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Serial Number</label>
//                   <input
//                     type="text"
//                     value={componentForm.serial_no}
//                     onChange={(e) => setComponentForm({ ...componentForm, serial_no: e.target.value })}
//                     placeholder="Optional serial number"
//                     className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
//                   />
//                 </div>
//               </div>

//               {/* Cost & Read-Only Readings Section */}
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div>
//                   <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Cost ($)</label>
//                   <input
//                     type="number"
//                     step="any"
//                     value={componentForm.cost}
//                     onChange={(e) => setComponentForm({ ...componentForm, cost: e.target.value })}
//                     className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Service Reading (Srv Rdg)</label>
//                   <input
//                     type="number"
//                     step="any"
//                     value={componentForm.srv_rdg}
//                     readOnly
//                     className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-2 text-sm text-slate-400 focus:outline-none font-mono opacity-75 cursor-not-allowed select-none"
//                     title="Read-only field"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Cost Reading (Cost Rdg)</label>
//                   <input
//                     type="number"
//                     step="any"
//                     value={componentForm.cost_rdg}
//                     readOnly
//                     className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-2 text-sm text-slate-400 focus:outline-none font-mono opacity-75 cursor-not-allowed select-none"
//                     title="Read-only field"
//                   />
//                 </div>
//               </div>

//               <div className="flex items-center gap-2 pt-2">
//                 <input
//                   type="checkbox"
//                   id="is_active_chk"
//                   checked={componentForm.is_active}
//                   onChange={(e) => setComponentForm({ ...componentForm, is_active: e.target.checked })}
//                   className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
//                 />
//                 <label htmlFor="is_active_chk" className="text-xs font-semibold uppercase text-slate-400 cursor-pointer">Is Active</label>
//               </div>

//               <div>
//                 <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description</label>
//                 <textarea
//                   rows={2}
//                   value={componentForm.equipment_component_desc}
//                   onChange={(e) => setComponentForm({ ...componentForm, equipment_component_desc: e.target.value })}
//                   placeholder="Optional component maintenance details..."
//                   className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
//                 />
//               </div>

//               <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
//                 <button
//                   type="button"
//                   onClick={() => setIsModalOpen(false)}
//                   className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={submitting}
//                   className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
//                 >
//                   {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
//                   <span>{editingId ? 'Update Component' : 'Save Component'}</span>
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default ComponentRegistry;