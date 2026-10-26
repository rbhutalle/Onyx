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
  ChevronDown,
  ChevronUp,
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
  srv_run?: number | null;
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
  make_name?: string;
  model_name?: string;
  srv_rdg?: number | null;
  service_rdg?: number | null;
  [key: string]: unknown;
}

export function ComponentHistory() {
  const [componentList, setComponentList] = useState<ComponentMaintenanceRecord[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<ComponentMaintenanceRecord | null>(null);
  
  // Component Collapsible Summary State
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState<boolean>(false);

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
    const strStatus = String(status ?? '').toLowerCase();
    if (status === true || strStatus === 'true' || strStatus === 'installed') {
      return true;
    }
    if (status === false || strStatus === 'false' || strStatus === 'removed') {
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
    return sys ? (sys.system_desc ?? sys.system_name ?? sys.system_code ?? '—') : '—';
  };

  const getComponentDisplay = (comp: ComponentMaintenanceRecord | null): string => {
    if (!comp) return '—';
    if (comp.component_display && typeof comp.component_display === 'string') return comp.component_display;
    const c = baseComponents.find(item => item.component_id === comp.component_id);
    return c ? (c.component_desc ?? c.component_name ?? c.component_code ?? '—') : '—';
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
        const val = foundMake.make_name ?? foundMake.name ?? foundMake.make_code ?? foundMake.title;
        makeStr = typeof val === 'string' ? val : null;
      }
    }

    if (!modelStr && comp.model_id) {
      const foundModel = models.find(m => m.model_id === comp.model_id || m.id === comp.model_id);
      if (foundModel) {
        const val = foundModel.model_name ?? foundModel.name ?? foundModel.model_code ?? foundModel.title;
        modelStr = typeof val === 'string' ? val : null;
      }
    }

    if (!makeStr && !modelStr) return '—';
    if (makeStr && modelStr) return `${makeStr} / ${modelStr}`;
    return makeStr || modelStr || '—';
  };

  // Helper to format vehicle label with Plate No and Make/Model
  const formatVehicleLabel = (veh: VehicleOption): string => {
    const plate = veh.plate_no || veh.equipment_code || 'No Plate';
    const make = veh.make_name || '';
    const model = veh.model_name || '';
    const makeModelStr = make && model ? `${make} ${model}` : (make || model);
    const label = veh.label || veh.name || '';

    const parts = [plate];
    if (makeModelStr) parts.push(makeModelStr);
    if (label && label !== plate) parts.push(`(${label})`);

    return parts.join(' — ');
  };

  // Helper to get formatted vehicle display name
  const getVehicleDisplay = (vehicleId?: string | null): string => {
    if (!vehicleId) return '—';
    const veh = vehicles.find(v => v.vehicle_id === vehicleId);
    if (!veh) return 'Vehicle Record';
    return formatVehicleLabel(veh);
  };

  // Safe helper badge color renderer for Installed Status
  const renderStatusBadge = (status?: unknown) => {
    if (status === null || status === undefined || status === '') {
      return <span className="text-(--text-muted)">—</span>;
    }
    
    const strStatus = String(status ?? '').toLowerCase();
    const isBoolTrue = status === true || strStatus === 'true' || strStatus === 'installed';
    const isBoolFalse = status === false || strStatus === 'false' || strStatus === 'removed';

    if (isBoolTrue) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 inline-flex items-center gap-1">
          Installed
        </span>
      );
    }
    if (isBoolFalse) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 inline-flex items-center gap-1">
          Removed
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-(--accent-subtle) text-(--text-primary) border border-(--border-main)">
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
      } catch {
        // Error handling
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
      const trimmedQuery = (textQuery ?? '').trim();

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
    } catch {
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
      } catch {
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
      } catch {
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
        return {
          ...prev,
          vehicle_id: newVehicleId,
          remove_srv_rdg: readingValue || prev.remove_srv_rdg,
        };
      } else {
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
    } catch {
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
      const statusValue = editingId ? false : true;
      const installRdgNum = historyForm.install_srv_rdg !== '' ? Number(historyForm.install_srv_rdg) : 0;
      const removeRdgNum = historyForm.remove_srv_rdg !== '' ? Number(historyForm.remove_srv_rdg) : 0;
      const computedSrvRun = editingId && removeRdgNum >= installRdgNum ? removeRdgNum - installRdgNum : null;

      const payload = {
        equipment_component_id: selectedComponent.equipment_component_id,
        vehicle_id: historyForm.vehicle_id,
        install_date: historyForm.install_date || null,
        install_srv_rdg: historyForm.install_srv_rdg !== '' ? installRdgNum : null,
        install_remarks: historyForm.install_remarks.trim() || null,
        remove_date: historyForm.remove_date || null,
        remove_srv_rdg: historyForm.remove_srv_rdg !== '' ? removeRdgNum : null,
        remove_remarks: historyForm.remove_remarks.trim() || null,
        srv_run: computedSrvRun,
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
    } catch {
      setErrorMsg('Failed to save history record.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabFilteredComponents = baseComponents.filter(c => {
    return searchSystemId ? c.system_id === searchSystemId : true;
  });

  const filteredVehicles = vehicles.filter(v => {
    const q = (vehicleSearchQuery ?? '').toLowerCase();
    const plate = (v.plate_no ?? v.equipment_code ?? '').toLowerCase();
    const label = (v.label ?? v.name ?? '').toLowerCase();
    const make = (v.make_name ?? '').toLowerCase();
    const model = (v.model_name ?? '').toLowerCase();
    return plate.includes(q) || label.includes(q) || make.includes(q) || model.includes(q);
  });

  const totalItems = historyRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const displayedHistory = historyRecords.slice(startIndex, endIndex);

  return (
    <div className="h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3 flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-(--border-main) pb-3 shrink-0">
        <div className="bg-black text-white p-2 rounded-xl shadow-xs shrink-0">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Component History & Lifecycle</h1>
          <p className="text-xs sm:text-sm text-(--text-muted)">Track equipment component installation, removal metrics, SRV Run, and service readings.</p>
        </div>
      </div>

      {/* Alert Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-3.5 py-2 rounded-lg flex items-center gap-3 text-xs shrink-0">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 px-3.5 py-2 rounded-lg flex items-center gap-3 text-xs shrink-0">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Selected Component Target Container (Collapsible) */}
      <div className="space-y-1.5 shrink-0">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-(--text-secondary) uppercase tracking-wider">
            Selected Component Target <span className="text-red-500">*</span>
          </label>
          
          {selectedComponent && (
            <button
              type="button"
              onClick={() => setIsSummaryCollapsed(prev => !prev)}
              className="text-xs text-(--text-primary) hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              {isSummaryCollapsed ? (
                <>
                  <span>Expand Details</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Collapse</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
        
        {selectedComponent ? (
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-xl p-3 shadow-xs transition-all">
            {/* Header Summary Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                {/* Displays Component Code when collapsed */}
                <span className="font-bold text-(--text-primary)">
                  {selectedComponent.equipment_component_code}
                </span>
                {selectedComponent.equipment_component_desc && (
                  <span className="text-(--text-secondary) hidden sm:inline">
                    — {selectedComponent.equipment_component_desc}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedComponent(null);
                    setHistoryRecords([]);
                  }}
                  className="text-(--text-muted) hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors cursor-pointer shrink-0"
                  title="Clear component selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expandable Details Grid */}
            {!isSummaryCollapsed && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 w-full text-xs pt-3 mt-2 border-t border-(--border-main)">
                <div>
                  <span className="text-[10px] text-(--text-muted) uppercase block">Component Code</span>
                  <div className="font-bold text-(--text-primary) text-xs">{selectedComponent.equipment_component_code}</div>
                </div>
                <div>
                  <span className="text-[10px] text-(--text-muted) uppercase block">Serial No.</span>
                  <div className="font-mono text-(--text-secondary)">{selectedComponent.serial_no || '—'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-(--text-muted) uppercase block">Description</span>
                  <div className="font-semibold text-(--text-secondary) truncate" title={selectedComponent.equipment_component_desc || '—'}>
                    {selectedComponent.equipment_component_desc || '—'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-(--text-muted) uppercase block">System / Component</span>
                  <div className="font-semibold text-(--text-secondary)">
                    {getSystemDisplay(selectedComponent)} / {getComponentDisplay(selectedComponent)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-(--text-muted) uppercase block">Make / Model</span>
                  <div className="font-semibold text-(--text-secondary)">
                    {getMakeModelDisplay(selectedComponent)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-(--text-muted) uppercase block">Cost</span>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">₱{Number(selectedComponent.cost ?? 0).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-[10px] text-(--text-muted) uppercase block">Service Rdg</span>
                  <div className="font-mono text-(--text-secondary)">{selectedComponent.srv_rdg ?? 0}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) px-4 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-(--text-primary)" />
              {componentList.length > 0 ? `Click here to select an active component (${componentList.length} loaded)...` : 'Click here to search and select a component...'}
            </span>
            <span className="bg-(--accent-subtle) text-(--text-primary) px-2 py-0.5 rounded text-xs font-semibold">Browse</span>
          </button>
        )}
      </div>

      {/* Main Content Body Container */}
      <div className="bg-(--bg-elevated) border border-(--border-main) rounded-xl p-4 shadow-xl overflow-hidden space-y-3 flex flex-col flex-1 min-h-0">
        
        {/* Action Controls Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-b border-(--border-main) pb-3 gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-(--text-primary)">
            <Layers className="w-4 h-4 text-(--text-primary)" />
            <span>Installed Components & Telemetry Performance</span>
          </div>

          <div className="flex items-center gap-2">
            {!selectedComponent && (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="bg-(--bg-surface) hover:bg-(--accent-subtle) text-(--text-primary) border border-(--border-main) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Search className="w-3.5 h-3.5 text-(--text-primary)" />
                <span>Select Component</span>
              </button>
            )}

            <button
              onClick={handleOpenAdd}
              disabled={isInstallDisabled}
              title={isInstallDisabled ? 'Component is currently installed or not selected.' : 'Record a new installation'}
              className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Installation</span>
            </button>

            <button
              onClick={handleOpenRemoval}
              disabled={isRemovalDisabled}
              title={isRemovalDisabled ? 'Component is not currently installed.' : 'Record component removal'}
              className="bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Record Removal</span>
            </button>
          </div>
        </div>

        {/* Sub-tab content panel & Scrollable Table Wrapper */}
        <div className="flex flex-col flex-1 min-h-0 space-y-2">
          <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-surface)">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-(--border-main) bg-(--bg-elevated) text-(--text-muted) text-[11px] uppercase tracking-wider font-semibold sticky top-0 z-10 shadow-xs">
                  <th className="py-2 px-3">Vehicle</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 font-mono">Install Date</th>
                  <th className="py-2 px-3 font-mono">Install Service Rdg</th>
                  <th className="py-2 px-3 font-mono">Remove Date</th>
                  <th className="py-2 px-3 font-mono">Remove Service Rdg</th>
                  <th className="py-2 px-3 font-mono">SRV Run</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                {loadingHistory ? (
                  <tr>
                    <td colSpan={8} className="py-8 px-3 text-center text-(--text-muted)">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-(--text-primary)" />
                        <span>Loading telemetry records for selected component...</span>
                      </div>
                    </td>
                  </tr>
                ) : !selectedComponent ? (
                  <tr>
                    <td colSpan={8} className="py-8 px-3 text-center text-(--text-muted) text-xs italic">
                      Please select an active component above to view its installation lifecycle history.
                    </td>
                  </tr>
                ) : displayedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 px-3 text-center text-(--text-muted) text-xs italic">
                      No installation history records found for this component. Click "Record Installation" above to add one.
                    </td>
                  </tr>
                ) : (
                  displayedHistory.map((item) => (
                    <tr key={item.equipment_component_child_id} className="hover:bg-(--accent-subtle) transition-colors">
                      <td className="py-2 px-3 font-medium text-(--text-primary)">
                        {getVehicleDisplay(item.vehicle_id)}
                      </td>
                      <td className="py-2 px-3">
                        {renderStatusBadge(item.installed_status)}
                      </td>
                      <td className="py-2 px-3 font-mono text-(--text-secondary)">
                        {item.install_date || '—'}
                      </td>
                      <td className="py-2 px-3 font-mono text-(--text-secondary)">
                        {item.install_srv_rdg ?? 0}
                      </td>
                      <td className="py-2 px-3 font-mono text-(--text-secondary)">
                        {item.remove_date || '—'}
                      </td>
                      <td className="py-2 px-3 font-mono text-(--text-secondary)">
                        {item.remove_srv_rdg !== null && item.remove_srv_rdg !== undefined ? item.remove_srv_rdg : '—'}
                      </td>
                      <td className="py-2 px-3 font-mono text-(--text-primary) font-semibold">
                        {item.srv_run !== null && item.srv_run !== undefined ? item.srv_run : '—'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleDelete(item.equipment_component_child_id)}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-(--border-main) text-xs text-(--text-muted) shrink-0">
              <div className="flex items-center gap-3">
                <span>
                  Showing <strong className="text-(--text-primary)">{startIndex + 1}</strong> to{' '}
                  <strong className="text-(--text-primary)">{endIndex}</strong> of{' '}
                  <strong className="text-(--text-primary)">{totalItems}</strong> records
                </span>

                <div className="flex items-center gap-1.5 ml-2">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded px-2 py-1 focus:outline-none focus:border-(--text-primary) cursor-pointer"
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
                  className="px-2.5 py-1 rounded-lg border border-(--border-main) bg-(--bg-elevated) text-(--text-secondary) hover:bg-(--accent-subtle) disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="px-3 py-1 font-mono text-(--text-secondary)">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="px-2.5 py-1 rounded-lg border border-(--border-main) bg-(--bg-elevated) text-(--text-secondary) hover:bg-(--accent-subtle) disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COMPONENT SEARCH PICKER MODAL */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-(--bg-surface) border border-(--border-main) rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-(--border-main) bg-(--bg-elevated) shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary) flex items-center gap-2">
                <Cpu className="w-4 h-4 text-(--text-primary)" /> Search & Select Component
              </h3>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="text-(--text-muted) hover:text-(--text-primary) p-1 rounded-lg hover:bg-(--accent-subtle) cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filter Form Controls */}
            <div className="p-4 border-b border-(--border-main) bg-(--bg-elevated) space-y-2.5 shrink-0 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold uppercase text-(--text-secondary) mb-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-(--text-primary)" /> System
                  </label>
                  <select
                    value={searchSystemId}
                    onChange={(e) => {
                      const sysId = e.target.value;
                      setSearchSystemId(sysId);
                      setSearchComponentId('');
                      fetchComponents(searchQuery, sysId, '');
                    }}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
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
                  <label className="text-[11px] font-semibold uppercase text-(--text-secondary) mb-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-(--text-primary)" /> Component Type
                  </label>
                  <select
                    value={searchComponentId}
                    onChange={(e) => {
                      const compId = e.target.value;
                      setSearchComponentId(compId);
                      fetchComponents(searchQuery, searchSystemId, compId);
                    }}
                    disabled={!searchSystemId && tabFilteredComponents.length === 0}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer disabled:opacity-50"
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
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Filter by Component Code or Serial No..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-(--text-primary)"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1 min-h-0">
              {loadingComponents ? (
                <div className="py-12 text-center text-(--text-muted) flex items-center justify-center gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-(--text-primary)" />
                  <span>Loading active component records...</span>
                </div>
              ) : componentList.length === 0 ? (
                <div className="py-12 text-center text-(--text-muted) text-xs italic">
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
                    className="flex items-center justify-between bg-(--bg-elevated) hover:bg-(--accent-subtle) border border-(--border-main) p-3 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-(--bg-surface) rounded-lg text-(--text-primary) transition-colors">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-(--text-primary) text-xs">{comp.equipment_component_code}</div>
                        {comp.equipment_component_desc && (
                          <div className="text-xs text-(--text-secondary)">{comp.equipment_component_desc}</div>
                        )}
                        {comp.serial_no && (
                          <div className="text-xs text-(--text-muted) font-mono">S/N: {comp.serial_no}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-(--text-muted) uppercase block">Service Rdg</span>
                      <div className="text-xs font-semibold text-(--text-secondary) font-mono">{comp.srv_rdg ?? '0'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* RECORD INSTALLATION / REMOVAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-(--bg-surface) border border-(--border-main) rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-(--border-main) bg-(--bg-elevated) shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">
                {editingId ? 'Record Component Removal' : 'Record Component Installation'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-(--text-muted) hover:text-(--text-primary) p-1 rounded-lg hover:bg-(--accent-subtle) cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 min-h-0">
                <div className="bg-(--bg-elevated) p-3 rounded-lg border border-(--border-main) space-y-1">
                  <div className="text-(--text-muted) uppercase text-[10px] font-semibold">Active Component Target</div>
                  <div className="font-bold text-(--text-primary) text-xs">
                    {selectedComponent?.equipment_component_code}
                    {selectedComponent?.serial_no && ` (S/N: ${selectedComponent.serial_no})`}
                  </div>
                  {selectedComponent?.equipment_component_desc && (
                    <div className="text-(--text-secondary) text-xs">{selectedComponent.equipment_component_desc}</div>
                  )}
                </div>

                {/* Vehicle Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-(--text-secondary)">
                    Vehicle {editingId ? '(Read-only)' : <span className="text-red-500">*</span>}
                  </label>
                  
                  {!editingId && (
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-(--text-muted)" />
                      <input
                        type="text"
                        placeholder="Type to filter vehicles by plate, make, model, or label..."
                        value={vehicleSearchQuery}
                        onChange={(e) => setVehicleSearchQuery(e.target.value)}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                  )}

                  <select
                    required
                    disabled={Boolean(editingId)}
                    value={historyForm.vehicle_id}
                    onChange={handleVehicleChange}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-(--text-primary) disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Select Target Vehicle --</option>
                    {(editingId ? vehicles : filteredVehicles).map((v) => (
                      <option key={v.vehicle_id} value={v.vehicle_id}>
                        {formatVehicleLabel(v)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Installed Status */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-(--text-secondary)">Installed Status</label>
                  <input
                    type="text"
                    disabled
                    value={editingId ? 'Removed' : 'Installed'}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-secondary) font-semibold rounded-lg px-3.5 py-2 text-xs cursor-not-allowed"
                  />
                </div>

                {/* Installation Information Section */}
                <div className="bg-(--bg-elevated) border border-(--border-main) p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold uppercase text-(--text-primary) tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Installation Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-(--text-secondary) mb-1">Install Date</label>
                      <input
                        type="date"
                        disabled={Boolean(editingId)}
                        value={historyForm.install_date}
                        onChange={(e) => setHistoryForm({ ...historyForm, install_date: e.target.value })}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary) font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-secondary) mb-1">Install Service Reading (Read-only)</label>
                      <input
                        type="number"
                        step="any"
                        disabled={true}
                        value={historyForm.install_srv_rdg}
                        onChange={(e) => setHistoryForm({ ...historyForm, install_srv_rdg: e.target.value })}
                        placeholder="0"
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-muted) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary) font-mono cursor-not-allowed opacity-75"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-secondary) mb-1">Install Remarks</label>
                    <input
                      type="text"
                      disabled={Boolean(editingId)}
                      value={historyForm.install_remarks}
                      onChange={(e) => setHistoryForm({ ...historyForm, install_remarks: e.target.value })}
                      placeholder="Optional remarks on installation..."
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary) disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Removal Information Section */}
                <div className="bg-(--bg-elevated) border border-(--border-main) p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold uppercase text-(--text-primary) tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Removal Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-(--text-secondary) mb-1">Remove Date</label>
                      <input
                        type="date"
                        disabled={!editingId}
                        value={historyForm.remove_date}
                        onChange={(e) => setHistoryForm({ ...historyForm, remove_date: e.target.value })}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary) font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-secondary) mb-1">Remove Service Reading (Read-only)</label>
                      <input
                        type="number"
                        step="any"
                        disabled={true}
                        value={historyForm.remove_srv_rdg}
                        onChange={(e) => setHistoryForm({ ...historyForm, remove_srv_rdg: e.target.value })}
                        placeholder="0"
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-muted) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary) font-mono cursor-not-allowed opacity-75"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-secondary) mb-1">Removal Remarks</label>
                    <input
                      type="text"
                      disabled={!editingId}
                      value={historyForm.remove_remarks}
                      onChange={(e) => setHistoryForm({ ...historyForm, remove_remarks: e.target.value })}
                      placeholder="Reason for removal or replacement..."
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary) disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-(--border-main) shrink-0 bg-(--bg-elevated)">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-(--accent-subtle) text-(--text-primary) hover:opacity-85 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
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