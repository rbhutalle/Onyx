import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  History, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  X,
  Trash2,
  Save,
  Loader2,
  Search,
  Calendar,
  Layers,
  FileText,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Filter,
  MinusCircle
} from 'lucide-react';

interface ComponentMaintenanceRecord {
  equipment_component_id: string;
  equipment_component_code: string;
  equipment_component_desc?: string | null;
  serial_no?: string | null;
  cost?: number | null;
  srv_rdg?: number | null;
  cost_rdg?: number | null;
  is_scrapped?: boolean;
  system_id?: string;
  component_id?: string;
  make_id?: string | null;
  model_id?: string | null;
  make_name?: string | null;
  model_name?: string | null;
  system_display?: string;
  component_display?: string;
  [key: string]: unknown;
}

interface ComponentHistoryRecord {
  equipment_component_child_id: string;
  equipment_component_id: string;
  vehicle_id?: string | null;
  install_date?: string | null;
  install_srv_rdg?: number | null;
  install_remarks?: string | null;
  remove_date?: string | null;
  remove_srv_rdg?: number | null;
  remove_remarks?: string | null;
  installed_status?: boolean | string | null;
  component_code?: string;
  system_name?: string;
  vehicle_display?: string;
  created_at?: string | null;
  [key: string]: unknown;
}

interface SystemOption {
  system_id: string;
  system_code: string;
  system_desc?: string | null;
  system_name?: string;
  [key: string]: unknown;
}

interface ComponentOption {
  component_id: string;
  system_id: string;
  component_code: string;
  component_desc?: string | null;
  component_name?: string;
  [key: string]: unknown;
}

interface MakeOption {
  make_id?: string;
  id?: string;
  make_code?: string | null;
  make_name?: string | null;
  name?: string | null;
  title?: string | null;
  [key: string]: unknown;
}

interface ModelOption {
  model_id?: string;
  id?: string;
  model_code?: string | null;
  model_name?: string | null;
  name?: string | null;
  title?: string | null;
  [key: string]: unknown;
}

interface VehicleOption {
  vehicle_id: string;
  plate_no?: string;
  equipment_code?: string;
  label?: string;
  name?: string;
  srv_rdg?: number | null;
  service_rdg?: number | null;
  [key: string]: unknown;
}

export function ComponentHistory() {
  const [componentList, setComponentList] = useState<ComponentMaintenanceRecord[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<ComponentMaintenanceRecord | null>(null);
  
  // Component Lookup Filter States
  const [systems, setSystems] = useState<SystemOption[]>([]);
  const [baseComponents, setBaseComponents] = useState<ComponentOption[]>([]);
  const [makes, setMakes] = useState<MakeOption[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  
  const [searchSystemId, setSearchSystemId] = useState<string>('');
  const [searchComponentId, setSearchComponentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [loadingComponents, setLoadingComponents] = useState<boolean>(false);

  // History Lifecycle Records & Pagination
  const [historyRecords, setHistoryRecords] = useState<ComponentHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  
  // Alerts & Submission States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal Form States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState<string>('');

  const [historyForm, setHistoryForm] = useState({
    vehicle_id: '',
    install_date: '',
    install_srv_rdg: '',
    install_remarks: '',
    remove_date: '',
    remove_srv_rdg: '',
    remove_remarks: '',
    installed_status: 'Installed',
  });

  // Dynamically determine the true newest record based on created_at timestamp
  const latestRecord = useMemo(() => {
    if (historyRecords.length === 0) return null;
    return [...historyRecords].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    })[0];
  }, [historyRecords]);

  // Normalize installed_status from latest record to boolean | null
  const latestInstalledStatus = useMemo(() => {
    if (!latestRecord) return null;
    const status = latestRecord.installed_status;
    if (status === true || String(status).toLowerCase() === 'true' || String(status).toLowerCase() === 'installed') {
      return true;
    }
    if (status === false || String(status).toLowerCase() === 'false' || String(status).toLowerCase() === 'removed') {
      return false;
    }
    return null;
  }, [latestRecord]);

  // Button Enable / Disable Rules
  const isInstallDisabled = !selectedComponent || Boolean(selectedComponent.is_scrapped) || latestInstalledStatus === true;
  const isRemovalDisabled = !selectedComponent || Boolean(selectedComponent.is_scrapped) || latestInstalledStatus !== true;

  // Helpers to resolve display names for System & Component
  const getSystemDisplay = (comp: ComponentMaintenanceRecord | null): string => {
    if (!comp) return '—';
    if (comp.system_display && typeof comp.system_display === 'string') return comp.system_display;
    const sys = systems.find(s => s.system_id === comp.system_id);
    return sys ? (sys.system_desc || sys.system_name || sys.system_code || '—') : '—';
  };

  const getComponentDisplay = (comp: ComponentMaintenanceRecord | null): string => {
    if (!comp) return '—';
    if (comp.component_display && typeof comp.component_display === 'string') return comp.component_display;
    const c = baseComponents.find(item => item.component_id === comp.component_id);
    return c ? (c.component_desc || c.component_name || c.component_code || '—') : '—';
  };

  // Helper to resolve Make / Model Display
  const getMakeModelDisplay = (comp: ComponentMaintenanceRecord | null): string => {
    if (!comp) return '—';
    
    let makeStr: string | null = (typeof comp.make_name === 'string' ? comp.make_name : null) || 
                                 (typeof comp.make_desc === 'string' ? comp.make_desc : null);
    let modelStr: string | null = (typeof comp.model_name === 'string' ? comp.model_name : null) || 
                                  (typeof comp.model_desc === 'string' ? comp.model_desc : null);

    if (!makeStr && comp.make_id) {
      const foundMake = makes.find(m => m.make_id === comp.make_id || m.id === comp.make_id);
      if (foundMake) {
        const val = foundMake.make_name || foundMake.name || foundMake.make_code || foundMake.title;
        makeStr = typeof val === 'string' ? val : null;
      }
    }

    if (!modelStr && comp.model_id) {
      const foundModel = models.find(m => m.model_id === comp.model_id || m.id === comp.model_id);
      if (foundModel) {
        const val = foundModel.model_name || foundModel.name || foundModel.model_code || foundModel.title;
        modelStr = typeof val === 'string' ? val : null;
      }
    }

    if (!makeStr && !modelStr) return '—';
    if (makeStr && modelStr) return `${makeStr} / ${modelStr}`;
    return makeStr || modelStr || '—';
  };

  // Helper to get formatted vehicle display name
  const getVehicleDisplay = (vehicleId?: string | null): string => {
    if (!vehicleId) return '—';
    const veh = vehicles.find(v => v.vehicle_id === vehicleId);
    if (!veh) return 'Vehicle Record';
    const plate = veh.plate_no || veh.equipment_code || 'No Plate';
    const label = veh.label || veh.name || '';
    return label ? `${plate} (${label})` : plate;
  };

  // Safe helper badge color renderer for Installed Status
  const renderStatusBadge = (status?: unknown) => {
    if (status === null || status === undefined || status === '') {
      return <span className="text-slate-500">—</span>;
    }
    
    const isBoolTrue = status === true || String(status).toLowerCase() === 'true' || String(status).toLowerCase() === 'installed';
    const isBoolFalse = status === false || String(status).toLowerCase() === 'false' || String(status).toLowerCase() === 'removed';

    if (isBoolTrue) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
          Installed
        </span>
      );
    }
    if (isBoolFalse) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950 text-amber-400 border border-amber-800/60">
          Removed
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
        {String(status)}
      </span>
    );
  };

  // Onload: Fetch relation options
  useEffect(() => {
    let isMounted = true;
    async function loadRelationOptions() {
      try {
        const [sysRes, compRes, makeRes, modelRes, vehRes] = await Promise.all([
          supabase.from('equipment_system').select('*'),
          supabase.from('equipment_component').select('*'),
          supabase.from('vehicle_makes').select('*'),
          supabase.from('vehicle_models').select('*'),
          supabase.from('vehicles').select('*').eq('is_active', true),
        ]);

        if (isMounted) {
          setSystems(sysRes.data || []);
          setBaseComponents(compRes.data || []);
          setMakes(makeRes.data || []);
          setModels(modelRes.data || []);
          setVehicles(vehRes.data || []);
        }
      } catch (err) {
        console.error('Error fetching relation options:', err);
      }
    }
    loadRelationOptions();
    return () => { isMounted = false; };
  }, []);

  // Fetch active component maintenance records for selection
  const fetchComponents = async (
    textQuery: string = searchQuery,
    sysId: string = searchSystemId,
    compId: string = searchComponentId
  ) => {
    try {
      setLoadingComponents(true);
      setErrorMsg(null);
      const trimmedQuery = textQuery.trim();

      let query = supabase
        .from('component_maintenance')
        .select('*')
        .eq('is_scrapped', false)
        .limit(100);

      if (sysId) query = query.eq('system_id', sysId);
      if (compId) query = query.eq('component_id', compId);
      if (trimmedQuery) {
        query = query.or(`equipment_component_code.ilike.%${trimmedQuery}%,serial_no.ilike.%${trimmedQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setComponentList((data || []) as ComponentMaintenanceRecord[]);
    } catch (err) {
      console.error('Error fetching components:', err);
      setErrorMsg('Failed to load active component records.');
    } finally {
      setLoadingComponents(false);
    }
  };

  // Initial load
  useEffect(() => {
    let isMounted = true;
    async function initLoad() {
      try {
        setLoadingComponents(true);
        const { data, error } = await supabase
          .from('component_maintenance')
          .select('*')
          .eq('is_scrapped', false)
          .limit(50);

        if (error) throw error;
        if (isMounted && data) {
          setComponentList(data as ComponentMaintenanceRecord[]);
        }
      } catch (err) {
        console.error('Error loading initial component records:', err);
        if (isMounted) setErrorMsg('Failed to load active component records.');
      } finally {
        if (isMounted) setLoadingComponents(false);
      }
    }
    initLoad();
    return () => { isMounted = false; };
  }, []);

  // Fetch history records ordered by created_at DESC to get the latest record first
  useEffect(() => {
    const compId = selectedComponent?.equipment_component_id;
    if (!compId) {
      return;
    }

    let isMounted = true;

    async function loadHistoryForComponent() {
      try {
        setLoadingHistory(true);
        setErrorMsg(null);
        setCurrentPage(1);

        const { data, error } = await supabase
          .from('component_history')
          .select('*')
          .eq('equipment_component_id', compId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (isMounted && data) {
          setHistoryRecords(data as ComponentHistoryRecord[]);
        }
      } catch (err) {
        console.error('Error loading installation history:', err);
        if (isMounted) setErrorMsg('Failed to load installation history for selected component.');
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    }

    loadHistoryForComponent();
    return () => { isMounted = false; };
  }, [selectedComponent?.equipment_component_id]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchComponents(searchQuery, searchSystemId, searchComponentId);
  };

  // Dynamic service reading selection handler
  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVehicleId = e.target.value;
    const selectedVeh = vehicles.find(v => v.vehicle_id === newVehicleId);
    
    // Check both srv_rdg and service_rdg schema columns
    const readingValue = selectedVeh && selectedVeh.srv_rdg !== null && selectedVeh.srv_rdg !== undefined
      ? String(selectedVeh.srv_rdg)
      : (selectedVeh && selectedVeh.service_rdg !== null && selectedVeh.service_rdg !== undefined ? String(selectedVeh.service_rdg) : '');

    setHistoryForm(prev => {
      if (editingId) {
        // Removal Modal: update Remove Service Reading
        return {
          ...prev,
          vehicle_id: newVehicleId,
          remove_srv_rdg: readingValue || prev.remove_srv_rdg,
        };
      } else {
        // Installation Modal: update Install Service Reading
        return {
          ...prev,
          vehicle_id: newVehicleId,
          install_srv_rdg: readingValue || prev.install_srv_rdg,
        };
      }
    });
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setVehicleSearchQuery('');
    const defaultVehicle = vehicles.length > 0 ? vehicles[0] : null;
    const defaultReading = defaultVehicle 
      ? String(defaultVehicle.srv_rdg ?? defaultVehicle.service_rdg ?? 0)
      : '0';

    setHistoryForm({
      vehicle_id: defaultVehicle ? defaultVehicle.vehicle_id : '',
      install_date: new Date().toISOString().split('T')[0],
      install_srv_rdg: defaultReading,
      install_remarks: '',
      remove_date: '',
      remove_srv_rdg: '',
      remove_remarks: '',
      installed_status: 'Installed',
    });
    setIsModalOpen(true);
  };

  // Handler for Record Removal
  const handleOpenRemoval = () => {
    setVehicleSearchQuery('');
    
    const activeRecord = latestRecord || historyRecords[0];

    if (activeRecord) {
      setEditingId(activeRecord.equipment_component_child_id);
      
      const currentVeh = vehicles.find(v => v.vehicle_id === activeRecord.vehicle_id);
      const currentRdg = currentVeh 
        ? String(currentVeh.srv_rdg ?? currentVeh.service_rdg ?? '') 
        : '';

      setHistoryForm({
        vehicle_id: activeRecord.vehicle_id || '',
        install_date: activeRecord.install_date ? String(activeRecord.install_date).split('T')[0] : '',
        install_srv_rdg: activeRecord.install_srv_rdg !== null && activeRecord.install_srv_rdg !== undefined ? String(activeRecord.install_srv_rdg) : '',
        install_remarks: activeRecord.install_remarks || '',
        remove_date: activeRecord.remove_date ? String(activeRecord.remove_date).split('T')[0] : new Date().toISOString().split('T')[0],
        remove_srv_rdg: activeRecord.remove_srv_rdg !== null && activeRecord.remove_srv_rdg !== undefined ? String(activeRecord.remove_srv_rdg) : currentRdg,
        remove_remarks: activeRecord.remove_remarks || '',
        installed_status: 'Removed',
      });
    } else {
      setEditingId(null);
      const defaultVehicle = vehicles.length > 0 ? vehicles[0] : null;
      const defaultReading = defaultVehicle 
        ? String(defaultVehicle.srv_rdg ?? defaultVehicle.service_rdg ?? 0)
        : '0';

      setHistoryForm({
        vehicle_id: defaultVehicle ? defaultVehicle.vehicle_id : '',
        install_date: '',
        install_srv_rdg: '',
        install_remarks: '',
        remove_date: new Date().toISOString().split('T')[0],
        remove_srv_rdg: defaultReading,
        remove_remarks: '',
        installed_status: 'Removed',
      });
    }

    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this installation history record?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('component_history')
        .delete()
        .eq('equipment_component_child_id', id);

      if (error) throw error;
      setSuccessMsg('History record deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      setHistoryRecords(prev => prev.filter(r => r.equipment_component_child_id !== id));
    } catch (err) {
      console.error('Error deleting record:', err);
      setErrorMsg('Failed to delete history record.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedComponent?.equipment_component_id) {
      setErrorMsg('Selected Component is required.');
      return;
    }
    if (!historyForm.vehicle_id) {
      setErrorMsg('Vehicle selection is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // Force status to true/false based on modal context
      const statusValue = editingId ? false : true;

      const payload = {
        equipment_component_id: selectedComponent.equipment_component_id,
        vehicle_id: historyForm.vehicle_id,
        install_date: historyForm.install_date || null,
        install_srv_rdg: historyForm.install_srv_rdg !== '' ? Number(historyForm.install_srv_rdg) : null,
        install_remarks: historyForm.install_remarks.trim() || null,
        remove_date: historyForm.remove_date || null,
        remove_srv_rdg: historyForm.remove_srv_rdg !== '' ? Number(historyForm.remove_srv_rdg) : null,
        remove_remarks: historyForm.remove_remarks.trim() || null,
        installed_status: statusValue,
      };

      if (editingId) {
        const { error } = await supabase
          .from('component_history')
          .update(payload)
          .eq('equipment_component_child_id', editingId);

        if (error) throw error;
        setSuccessMsg('Component removal recorded successfully!');
      } else {
        const { error } = await supabase
          .from('component_history')
          .insert([payload]);

        if (error) throw error;
        setSuccessMsg('Component installed and logged successfully!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
      
      const { data: refreshedData } = await supabase
        .from('component_history')
        .select('*')
        .eq('equipment_component_id', selectedComponent.equipment_component_id)
        .order('created_at', { ascending: false });

      if (refreshedData) {
        setHistoryRecords(refreshedData as ComponentHistoryRecord[]);
      }
    } catch (err) {
      console.error('Error saving history record:', err);
      setErrorMsg('Failed to save history record.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabFilteredComponents = baseComponents.filter(c => {
    return searchSystemId ? c.system_id === searchSystemId : true;
  });

  const filteredVehicles = vehicles.filter(v => {
    const q = vehicleSearchQuery.toLowerCase();
    const plate = (v.plate_no || v.equipment_code || '').toLowerCase();
    const label = (v.label || v.name || '').toLowerCase();
    return plate.includes(q) || label.includes(q);
  });

  const totalItems = historyRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const displayedHistory = historyRecords.slice(startIndex, endIndex);

  return (
    <div className="p-4 md:p-6 w-full max-w-7xl mx-auto space-y-4 flex flex-col min-h-[calc(100vh-80px)]">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3 shrink-0">
        <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">Component History & Installation Lifecycle</h1>
          <p className="text-xs text-slate-400">Track equipment component installation, removal metrics, and service readings.</p>
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

      {/* Selected Component Summary Banner */}
      <div className="space-y-1.5 shrink-0">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Selected Component Target <span className="text-red-500">*</span>
        </label>
        
        {selectedComponent ? (
          <div className="flex items-center justify-between bg-slate-900 border border-blue-900/60 p-3.5 rounded-xl shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-7 gap-3 w-full text-xs">
              <div>
                <span className="text-[11px] text-slate-400 uppercase">Component Code</span>
                <div className="font-bold text-blue-400 text-sm">{selectedComponent.equipment_component_code}</div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase">Serial No.</span>
                <div className="font-mono text-slate-200">{selectedComponent.serial_no || '—'}</div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase">Description</span>
                <div className="font-semibold text-slate-200 truncate" title={selectedComponent.equipment_component_desc || '—'}>
                  {selectedComponent.equipment_component_desc || '—'}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase">System / Component</span>
                <div className="font-semibold text-slate-200">
                  {getSystemDisplay(selectedComponent)} / {getComponentDisplay(selectedComponent)}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase">Make / Model</span>
                <div className="font-semibold text-slate-200">
                  {getMakeModelDisplay(selectedComponent)}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase">Cost</span>
                <div className="font-semibold text-emerald-400 font-mono">₱{Number(selectedComponent.cost ?? 0).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase">Service Rdg</span>
                <div className="font-mono text-slate-300">{selectedComponent.srv_rdg ?? 0}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedComponent(null);
                setHistoryRecords([]);
              }}
              className="text-slate-400 hover:text-red-400 p-1.5 transition-colors cursor-pointer shrink-0 ml-2"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="w-full bg-slate-900 border border-slate-700 hover:border-blue-500 text-slate-300 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-blue-400" />
              {componentList.length > 0 ? `Click here to select an active component (${componentList.length} loaded)...` : 'Click here to search and select a component...'}
            </span>
            <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded font-medium">Browse</span>
          </button>
        )}
      </div>

      {/* Main Container Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col flex-1 min-h-0">
        
        {/* Header Bar with Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-slate-950 border-b border-slate-800 p-3 gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
            <Layers className="w-4 h-4" />
            <span>Installed Components & Telemetry Performance</span>
          </div>

          <div className="flex items-center gap-2">
            {!selectedComponent && (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span>Select Component</span>
              </button>
            )}

            <button
              onClick={handleOpenAdd}
              disabled={isInstallDisabled}
              title={isInstallDisabled ? 'Component is currently installed or not selected.' : 'Record a new installation'}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow shrink-0 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Installation</span>
            </button>

            <button
              onClick={handleOpenRemoval}
              disabled={isRemovalDisabled}
              title={isRemovalDisabled ? 'Component is not currently installed.' : 'Record component removal'}
              className="bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow shrink-0 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Record Removal</span>
            </button>
          </div>
        </div>

        {/* Results Table Panel */}
        <div className="p-3 md:p-4 flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto overflow-x-auto flex-1 border border-slate-800/60 rounded-lg max-h-[calc(100vh-420px)]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 font-mono">Install Date</th>
                  <th className="p-3 font-mono">Install Service Rdg</th>
                  <th className="p-3 font-mono">Remove Date</th>
                  <th className="p-3 font-mono">Remove Service Rdg</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {loadingHistory ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span>Loading telemetry records for selected component...</span>
                      </div>
                    </td>
                  </tr>
                ) : !selectedComponent ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500 text-xs">
                      Please select an active component above to view its installation lifecycle history.
                    </td>
                  </tr>
                ) : displayedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500 text-xs">
                      No installation history records found for this component. Click "Record Installation" above to add one.
                    </td>
                  </tr>
                ) : (
                  displayedHistory.map((item) => (
                    <tr key={item.equipment_component_child_id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="p-3 font-medium text-xs text-slate-200">
                        {getVehicleDisplay(item.vehicle_id)}
                      </td>
                      <td className="p-3 text-xs">
                        {renderStatusBadge(item.installed_status)}
                      </td>
                      <td className="p-3 font-mono text-xs text-slate-300">
                        {item.install_date || '—'}
                      </td>
                      <td className="p-3 font-mono text-xs text-slate-300">
                        {item.install_srv_rdg ?? 0}
                      </td>
                      <td className="p-3 font-mono text-xs text-slate-300">
                        {item.remove_date || '—'}
                      </td>
                      <td className="p-3 font-mono text-xs text-slate-300">
                        {item.remove_srv_rdg !== null && item.remove_srv_rdg !== undefined ? item.remove_srv_rdg : '—'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDelete(item.equipment_component_child_id)}
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

          {/* Pagination Toolbar */}
          {selectedComponent && totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 shrink-0">
              <div className="flex items-center gap-3">
                <span>
                  Showing <strong className="text-slate-200">{startIndex + 1}</strong> to{' '}
                  <strong className="text-slate-200">{endIndex}</strong> of{' '}
                  <strong className="text-slate-200">{totalItems}</strong> records
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

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="px-3 py-1 font-mono text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Component Modal Search Picker Form */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" /> Search & Select Component
              </h3>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filter Form Controls */}
            <div className="p-3 border-b border-slate-800 bg-slate-950/40 space-y-2.5 shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-blue-400" /> System
                  </label>
                  <select
                    value={searchSystemId}
                    onChange={(e) => {
                      const sysId = e.target.value;
                      setSearchSystemId(sysId);
                      setSearchComponentId('');
                      fetchComponents(searchQuery, sysId, '');
                    }}
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

                <div>
                  <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-blue-400" /> Component Type
                  </label>
                  <select
                    value={searchComponentId}
                    onChange={(e) => {
                      const compId = e.target.value;
                      setSearchComponentId(compId);
                      fetchComponents(searchQuery, searchSystemId, compId);
                    }}
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

              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter by Component Code or Serial No..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
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

            <div className="p-3 overflow-y-auto space-y-2 flex-1">
              {loadingComponents ? (
                <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Loading active component records...</span>
                </div>
              ) : componentList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No active component records found.
                </div>
              ) : (
                componentList.map((comp) => (
                  <div
                    key={comp.equipment_component_id}
                    onClick={() => {
                      setSelectedComponent(comp);
                      setShowPicker(false);
                    }}
                    className="flex items-center justify-between bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-600/50 p-3 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 rounded-lg group-hover:bg-blue-900/40 text-blue-400 transition-colors">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-blue-400 text-xs">{comp.equipment_component_code}</div>
                        {comp.equipment_component_desc && (
                          <div className="text-xs text-slate-300">{comp.equipment_component_desc}</div>
                        )}
                        {comp.serial_no && (
                          <div className="text-xs text-slate-400 font-mono">S/N: {comp.serial_no}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 uppercase block">Service Rdg</span>
                      <div className="text-xs font-semibold text-slate-200 font-mono">{comp.srv_rdg ?? '0'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Installation / Record Component Removal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">
                {editingId ? 'Record Component Removal' : 'Record Component Installation'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400 uppercase font-semibold">Active Component Target</div>
                <div className="font-bold text-blue-400 text-sm">
                  {selectedComponent?.equipment_component_code}
                  {selectedComponent?.serial_no && ` (S/N: ${selectedComponent.serial_no})`}
                </div>
                {selectedComponent?.equipment_component_desc && (
                  <div className="text-slate-300 text-xs">{selectedComponent.equipment_component_desc}</div>
                )}
              </div>

              {/* Vehicle Field (Read-only on Removal modal with current value) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase text-slate-400">
                  Vehicle {editingId ? '(Read-only)' : <span className="text-red-500">*</span>}
                </label>
                
                {!editingId && (
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type to filter vehicles by plate or label..."
                      value={vehicleSearchQuery}
                      onChange={(e) => setVehicleSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <select
                  required
                  disabled={Boolean(editingId)}
                  value={historyForm.vehicle_id}
                  onChange={handleVehicleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="">-- Select Target Vehicle --</option>
                  {(editingId ? vehicles : filteredVehicles).map((v) => {
                    const plate = v.plate_no || v.equipment_code || 'No Plate';
                    const label = v.label || v.name || v.vehicle_id;
                    return (
                      <option key={v.vehicle_id} value={v.vehicle_id}>
                        {plate} ({label})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Installed Status Field (Read-only / Fixed to "Installed" on Installation modal) */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-400">Installed Status</label>
                <input
                  type="text"
                  disabled
                  value={editingId ? 'Removed' : 'Installed'}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-300 font-semibold cursor-not-allowed"
                />
              </div>

              {/* Installation Section - Read only on Removal modal */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase text-blue-400 tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Installation Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Install Date</label>
                    <input
                      type="date"
                      disabled={Boolean(editingId)}
                      value={historyForm.install_date}
                      onChange={(e) => setHistoryForm({ ...historyForm, install_date: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Install Service Reading (Read-only)</label>
                    <input
                      type="number"
                      step="any"
                      disabled={true}
                      value={historyForm.install_srv_rdg}
                      onChange={(e) => setHistoryForm({ ...historyForm, install_srv_rdg: e.target.value })}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 focus:outline-none focus:border-blue-500 font-mono cursor-not-allowed opacity-75"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Install Remarks</label>
                  <input
                    type="text"
                    disabled={Boolean(editingId)}
                    value={historyForm.install_remarks}
                    onChange={(e) => setHistoryForm({ ...historyForm, install_remarks: e.target.value })}
                    placeholder="Optional remarks on installation..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Removal Section - Read only on Record Installation modal */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Removal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Remove Date</label>
                    <input
                      type="date"
                      disabled={!editingId}
                      value={historyForm.remove_date}
                      onChange={(e) => setHistoryForm({ ...historyForm, remove_date: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Remove Service Reading (Read-only)</label>
                    <input
                      type="number"
                      step="any"
                      disabled={true}
                      value={historyForm.remove_srv_rdg}
                      onChange={(e) => setHistoryForm({ ...historyForm, remove_srv_rdg: e.target.value })}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 focus:outline-none focus:border-blue-500 font-mono cursor-not-allowed opacity-75"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Removal Remarks</label>
                  <input
                    type="text"
                    disabled={!editingId}
                    value={historyForm.remove_remarks}
                    onChange={(e) => setHistoryForm({ ...historyForm, remove_remarks: e.target.value })}
                    placeholder="Reason for removal or replacement..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
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
                  <span>{editingId ? 'Save Removal' : 'Save History'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComponentHistory;