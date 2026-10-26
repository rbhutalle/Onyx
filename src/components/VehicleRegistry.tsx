import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Car, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  X,
  Edit2,
  Trash2,
  Save,
  Loader2,
  Activity,
  Calendar,
  ShieldAlert,
  Search,
  CheckCheck,
  Gauge,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  ChevronDown as ChevronDownIcon,
  Wrench,
  History
} from 'lucide-react';

interface VehiclePmViewRecord {
  vehicle_id: string;
  plate_no: string;
  service_rdg: number | null;
  make_name?: string | null;
  model_name?: string | null;
  type_description?: string | null;
  [key: string]: unknown;
}

interface VehicleRecord {
  vehicle_id: string;
  customer_id: string;
  model_id: string;
  service_standard_id: string;
  plate_no: string;
  conduction_no?: string | null;
  year?: number | null;
  description?: string | null;
  registration_date?: string | null;
  service_rdg: number | null;
  has_initialized_rdg: boolean;
  is_active: boolean;
  [key: string]: unknown;
}

interface VehiclePmRecord {
  vehicle_pm_id: string;
  vehicle_id: string;
  current_rdg: number | null;
  pm2_previous: number | null;
  pm3_previous: number | null;
  pm4_previous: number | null;
  pm5_previous: number | null;
  pm6_previous: number | null;
  pm7_previous: number | null;
  pm2_current: number | null;
  pm3_current: number | null;
  pm4_current: number | null;
  pm5_current: number | null;
  pm6_current: number | null;
  pm7_current: number | null;
  pm2_next: number | null;
  pm3_next: number | null;
  pm4_next: number | null;
  pm5_next: number | null;
  pm6_next: number | null;
  pm7_next: number | null;
  pm2_flag: boolean | null;
  pm3_flag: boolean | null;
  pm4_flag: boolean | null;
  pm5_flag: boolean | null;
  pm6_flag: boolean | null;
  pm7_flag: boolean | null;
  pm2_datecompleted: string | null;
  pm3_datecompleted: string | null;
  pm4_datecompleted: string | null;
  pm5_datecompleted: string | null;
  pm6_datecompleted: string | null;
  pm7_datecompleted: string | null;
  [key: string]: unknown;
}

interface VehicleLogRecord {
  log_id: string;
  vehicle_id: string;
  log_date: string;
  previous_rdg: number;
  daily_increment: number;
  current_rdg: number;
  remarks?: string | null;
  [key: string]: unknown;
}

interface ComponentHistoryRecord {
  equipment_component_child_id: string;
  equipment_component_id: string;
  vehicle_id: string;
  install_date: string | null;
  install_srv_rdg: number | null;
  install_remarks: string | null;
  remove_date: string | null;
  remove_srv_rdg: number | null;
  remove_remarks: string | null;
  cost_per_srv_rdg: number | null;
  created_at?: string;
  updated_at?: string;
  installed_status: boolean | null;
  srv_run: number | null;
  component_maintenance?: {
    equipment_component_id?: string;
    equipment_component_code?: string | null;
    component_name?: string | null;
    description?: string | null;
    code?: string | null;
    [key: string]: unknown;
  } | null;
  vehicles?: {
    vehicle_id?: string;
    plate_no?: string;
    vehicle_models?: {
      name?: string;
      vehicle_makes?: {
        name?: string;
      } | null;
    } | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

interface CustomerOption {
  customer_id: string;
  customer_code?: string;
  contact_person?: string;
  name?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

interface ModelOption {
  model_id: string;
  name?: string;
  make_name?: string;
  [key: string]: unknown;
}

interface StandardOption {
  service_standard_id: string;
  code?: string;
  description?: string;
  [key: string]: unknown;
}

export function VehicleRegistry() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'pm_status' | 'installed_components' | 'component_history' | 'daily_logs'>('vehicles');

  const [searchVehiclesList, setSearchVehiclesList] = useState<VehiclePmViewRecord[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePmViewRecord | null>(null);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pickerLoading, setPickerLoading] = useState<boolean>(false);
  const [isSearchCollapsed, setIsSearchCollapsed] = useState<boolean>(false);

  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [vehiclePms, setVehiclePms] = useState<VehiclePmRecord[]>([]);
  const [vehicleLogs, setVehicleLogs] = useState<VehicleLogRecord[]>([]);
  const [componentHistory, setComponentHistory] = useState<ComponentHistoryRecord[]>([]);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [standards, setStandards] = useState<StandardOption[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Customer dropdown search filter states for modal
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Vehicle Model dropdown search filter states for modal
  const [modelSearchQuery, setModelSearchQuery] = useState<string>('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // PM Schedule Edit Modal state
  const [isPmModalOpen, setIsPmModalOpen] = useState<boolean>(false);
  const [editingPmId, setEditingPmId] = useState<string | null>(null);
  const [pmForm, setPmForm] = useState({
    current_rdg: '',
    pm2_previous: '', pm2_current: '', pm2_next: '', pm2_flag: false, pm2_datecompleted: '',
    pm3_previous: '', pm3_current: '', pm3_next: '', pm3_flag: false, pm3_datecompleted: '',
    pm4_previous: '', pm4_current: '', pm4_next: '', pm4_flag: false, pm4_datecompleted: '',
    pm5_previous: '', pm5_current: '', pm5_next: '', pm5_flag: false, pm5_datecompleted: '',
    pm6_previous: '', pm6_current: '', pm6_next: '', pm6_flag: false, pm6_datecompleted: '',
    pm7_previous: '', pm7_current: '', pm7_next: '', pm7_flag: false, pm7_datecompleted: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    customer_id: '',
    model_id: '',
    service_standard_id: '',
    plate_no: '',
    conduction_no: '',
    year: '',
    description: '',
    registration_date: '',
    service_rdg: '',
    has_initialized_rdg: false,
    is_active: true,
  });

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load dropdown options on mount
  useEffect(() => {
    let isMounted = true;

    async function loadDropdowns() {
      try {
        const [custRes, modRes, stdRes] = await Promise.all([
          supabase.from('customers').select('*'),
          supabase.from('vehicle_models').select('*, vehicle_makes(name)'),
          supabase.from('service_standards').select('*')
        ]);

        if (isMounted) {
          const rawCustomers = custRes.data || [];
          const formattedModels = (modRes.data || []).map((m: Record<string, unknown>) => ({
            ...m,
            make_name: (m.vehicle_makes as Record<string, unknown>)?.name || m.make_name || ''
          })) as ModelOption[];

          setCustomers(rawCustomers);
          setModels(formattedModels);
          setStandards(stdRes.data || []);
        }
      } catch {
        // Ignored unneeded error binding
      }
    }

    loadDropdowns();
    return () => {
      isMounted = false;
    };
  }, []);

  // Explicit fetch function called on-demand
  const fetchVehicleData = async (vehId: string) => {
    try {
      setErrorMsg(null);
      const [vehRes, pmRes, logRes, compRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('vehicle_id', vehId),
        supabase.from('vehicle_pm').select('*').eq('vehicle_id', vehId),
        supabase.from('vehicle_daily_logs').select('*').eq('vehicle_id', vehId).order('log_date', { ascending: false }),
        supabase.from('component_history').select('*, component_maintenance(*), vehicles(*, vehicle_models(*, vehicle_makes(*)))').eq('vehicle_id', vehId).order('install_date', { ascending: false })
      ]);

      if (vehRes.error) throw vehRes.error;
      if (pmRes.error) throw pmRes.error;
      if (logRes.error) throw logRes.error;

      setVehicles(vehRes.data || []);
      setVehiclePms(pmRes.data || []);
      setVehicleLogs(logRes.data || []);
      setComponentHistory(compRes.data || []);
    } catch {
      setErrorMsg('Failed to load records for the selected Equipment.');
    }
  };

  const handleSelectVehicle = (v: VehiclePmViewRecord) => {
    setSelectedVehicle(v);
    fetchVehicleData(v.vehicle_id);
    setShowPicker(false);
  };

  const handleClearSelection = () => {
    setSelectedVehicle(null);
    setVehicles([]);
    setVehiclePms([]);
    setVehicleLogs([]);
    setComponentHistory([]);
  };

  const fetchPickerVehicles = async (queryToRun?: string) => {
    try {
      setPickerLoading(true);
      const activeQuery = queryToRun !== undefined ? queryToRun : searchQuery;

      let query = supabase
        .from('vw_vehicle_pm_details')
        .select('*')
        .order('plate_no', { ascending: true })
        .limit(50);

      if (activeQuery.trim()) {
        query = query.ilike('plate_no', `%${activeQuery.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSearchVehiclesList(data || []);
    } catch {
      // Ignored unneeded error binding
    } finally {
      setPickerLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    fetchPickerVehicles(searchQuery);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setCustomerSearchQuery('');
    setModelSearchQuery('');
    setVehicleForm({
      customer_id: '',
      model_id: '',
      service_standard_id: standards[0]?.service_standard_id || '',
      plate_no: '',
      conduction_no: '',
      year: new Date().getFullYear().toString(),
      description: '',
      registration_date: '',
      service_rdg: '0',
      has_initialized_rdg: false,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: VehicleRecord) => {
    setEditingId(item.vehicle_id);
    const matchedCust = customers.find(c => c.customer_id === item.customer_id);
    setCustomerSearchQuery(matchedCust ? `${matchedCust.customer_code || ''} - ${matchedCust.contact_person || ''}` : '');

    const matchedModel = models.find(m => m.model_id === item.model_id);
    setModelSearchQuery(matchedModel ? `${matchedModel.make_name || ''} ${matchedModel.name || ''}`.trim() : '');

    setVehicleForm({
      customer_id: item.customer_id || '',
      model_id: item.model_id || '',
      service_standard_id: item.service_standard_id || '',
      plate_no: item.plate_no || '',
      conduction_no: item.conduction_no || '',
      year: item.year ? String(item.year) : '',
      description: item.description || '',
      registration_date: item.registration_date || '',
      service_rdg: item.service_rdg !== null ? String(item.service_rdg) : '0',
      has_initialized_rdg: item.has_initialized_rdg ?? false,
      is_active: item.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleInitializeVehicle = async (item: VehicleRecord) => {
    if (!confirm(`Are you sure you want to initialize readings for vehicle ${item.plate_no}?`)) return;
    try {
      setErrorMsg(null);

      const { error } = await supabase.rpc('initialize_vehicle_pm_readings', {
        p_vehicle_id: item.vehicle_id
      });

      if (error) throw error;

      setSuccessMsg(`Vehicle ${item.plate_no} successfully initialized via RPC!`);
      setTimeout(() => setSuccessMsg(null), 3000);

      if (selectedVehicle) {
        fetchVehicleData(selectedVehicle.vehicle_id);
      }
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      const errorDetail = (errObj?.message as string) || (errObj?.details as string) || JSON.stringify(err);
      setErrorMsg(`Failed to initialize Equipment: ${errorDetail}`);
    }
  };

  const handleOpenPmEdit = (pm: VehiclePmRecord) => {
    setEditingPmId(pm.vehicle_pm_id);
    setPmForm({
      current_rdg: pm.current_rdg !== null ? String(pm.current_rdg) : '',
      pm2_previous: pm.pm2_previous !== null ? String(pm.pm2_previous) : '',
      pm2_current: pm.pm2_current !== null ? String(pm.pm2_current) : '',
      pm2_next: pm.pm2_next !== null ? String(pm.pm2_next) : '',
      pm2_flag: pm.pm2_flag ?? false,
      pm2_datecompleted: pm.pm2_datecompleted ? pm.pm2_datecompleted.split('T')[0] : '',

      pm3_previous: pm.pm3_previous !== null ? String(pm.pm3_previous) : '',
      pm3_current: pm.pm3_current !== null ? String(pm.pm3_current) : '',
      pm3_next: pm.pm3_next !== null ? String(pm.pm3_next) : '',
      pm3_flag: pm.pm3_flag ?? false,
      pm3_datecompleted: pm.pm3_datecompleted ? pm.pm3_datecompleted.split('T')[0] : '',

      pm4_previous: pm.pm4_previous !== null ? String(pm.pm4_previous) : '',
      pm4_current: pm.pm4_current !== null ? String(pm.pm4_current) : '',
      pm4_next: pm.pm4_next !== null ? String(pm.pm4_next) : '',
      pm4_flag: pm.pm4_flag ?? false,
      pm4_datecompleted: pm.pm4_datecompleted ? pm.pm4_datecompleted.split('T')[0] : '',

      pm5_previous: pm.pm5_previous !== null ? String(pm.pm5_previous) : '',
      pm5_current: pm.pm5_current !== null ? String(pm.pm5_current) : '',
      pm5_next: pm.pm5_next !== null ? String(pm.pm5_next) : '',
      pm5_flag: pm.pm5_flag ?? false,
      pm5_datecompleted: pm.pm5_datecompleted ? pm.pm5_datecompleted.split('T')[0] : '',

      pm6_previous: pm.pm6_previous !== null ? String(pm.pm6_previous) : '',
      pm6_current: pm.pm6_current !== null ? String(pm.pm6_current) : '',
      pm6_next: pm.pm6_next !== null ? String(pm.pm6_next) : '',
      pm6_flag: pm.pm6_flag ?? false,
      pm6_datecompleted: pm.pm6_datecompleted ? pm.pm6_datecompleted.split('T')[0] : '',

      pm7_previous: pm.pm7_previous !== null ? String(pm.pm7_previous) : '',
      pm7_current: pm.pm7_current !== null ? String(pm.pm7_current) : '',
      pm7_next: pm.pm7_next !== null ? String(pm.pm7_next) : '',
      pm7_flag: pm.pm7_flag ?? false,
      pm7_datecompleted: pm.pm7_datecompleted ? pm.pm7_datecompleted.split('T')[0] : '',
    });
    setIsPmModalOpen(true);
  };

  const handleSavePmForm = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!editingPmId) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        pm2_previous: pmForm.pm2_previous !== '' ? Number(pmForm.pm2_previous) : null,
        pm2_current: pmForm.pm2_current !== '' ? Number(pmForm.pm2_current) : null,
        pm2_next: pmForm.pm2_next !== '' ? Number(pmForm.pm2_next) : null,
        pm2_flag: pmForm.pm2_flag,
        pm2_datecompleted: pmForm.pm2_datecompleted || null,

        pm3_previous: pmForm.pm3_previous !== '' ? Number(pmForm.pm3_previous) : null,
        pm3_current: pmForm.pm3_current !== '' ? Number(pmForm.pm3_current) : null,
        pm3_next: pmForm.pm3_next !== '' ? Number(pmForm.pm3_next) : null,
        pm3_flag: pmForm.pm3_flag,
        pm3_datecompleted: pmForm.pm3_datecompleted || null,

        pm4_previous: pmForm.pm4_previous !== '' ? Number(pmForm.pm4_previous) : null,
        pm4_current: pmForm.pm4_current !== '' ? Number(pmForm.pm4_current) : null,
        pm4_next: pmForm.pm4_next !== '' ? Number(pmForm.pm4_next) : null,
        pm4_flag: pmForm.pm4_flag,
        pm4_datecompleted: pmForm.pm4_datecompleted || null,

        pm5_previous: pmForm.pm5_previous !== '' ? Number(pmForm.pm5_previous) : null,
        pm5_current: pmForm.pm5_current !== '' ? Number(pmForm.pm5_current) : null,
        pm5_next: pmForm.pm5_next !== '' ? Number(pmForm.pm5_next) : null,
        pm5_flag: pmForm.pm5_flag,
        pm5_datecompleted: pmForm.pm5_datecompleted || null,

        pm6_previous: pmForm.pm6_previous !== '' ? Number(pmForm.pm6_previous) : null,
        pm6_current: pmForm.pm6_current !== '' ? Number(pmForm.pm6_current) : null,
        pm6_next: pmForm.pm6_next !== '' ? Number(pmForm.pm6_next) : null,
        pm6_flag: pmForm.pm6_flag,
        pm6_datecompleted: pmForm.pm6_datecompleted || null,

        pm7_previous: pmForm.pm7_previous !== '' ? Number(pmForm.pm7_previous) : null,
        pm7_current: pmForm.pm7_current !== '' ? Number(pmForm.pm7_current) : null,
        pm7_next: pmForm.pm7_next !== '' ? Number(pmForm.pm7_next) : null,
        pm7_flag: pmForm.pm7_flag,
        pm7_datecompleted: pmForm.pm7_datecompleted || null,
      };

      const { error } = await supabase
        .from('vehicle_pm')
        .update(payload)
        .eq('vehicle_pm_id', editingPmId);

      if (error) throw error;

      setSuccessMsg('PM Schedule updated successfully!');
      setIsPmModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);

      if (selectedVehicle) {
        const pmRes = await supabase.from('vehicle_pm').select('*').eq('vehicle_id', selectedVehicle.vehicle_id);
        setVehiclePms(pmRes.data || []);
      }
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      const errorDetail = (errObj?.message as string) || (errObj?.details as string) || JSON.stringify(err);
      setErrorMsg(`Failed to update PM schedule: ${errorDetail}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Equipment?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('vehicle_id', id);

      if (error) throw error;

      setSuccessMsg('Equipment deleted successfully!');
      setIsModalOpen(false);
      handleClearSelection();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      const errorDetail = (errObj?.message as string) || (errObj?.details as string) || JSON.stringify(err);
      setErrorMsg(`Failed to delete record: ${errorDetail}`);
    }
  };

  const handleSubmitForm = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!vehicleForm.plate_no.trim() || !vehicleForm.customer_id || !vehicleForm.model_id || !vehicleForm.service_standard_id) {
      setErrorMsg('Plate number, customer, model, and service standard are required.');
      return;
    }

    // Validate that selected customer is active = true
    const selectedCustomer = customers.find(c => c.customer_id === vehicleForm.customer_id);
    if (!selectedCustomer || selectedCustomer.is_active === false) {
      setErrorMsg('Validation failed: Selected customer is inactive or invalid.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        customer_id: vehicleForm.customer_id,
        model_id: vehicleForm.model_id,
        service_standard_id: vehicleForm.service_standard_id,
        plate_no: vehicleForm.plate_no.trim(),
        conduction_no: vehicleForm.conduction_no.trim() || null,
        year: vehicleForm.year ? Number(vehicleForm.year) : null,
        description: vehicleForm.description.trim() || null,
        registration_date: vehicleForm.registration_date || null,
        service_rdg: vehicleForm.service_rdg !== '' ? Number(vehicleForm.service_rdg) : 0,
        is_active: vehicleForm.is_active,
      };

      let error = null;
      let savedRecord = null;

      if (editingId) {
        const res = await supabase
          .from('vehicles')
          .update(payload)
          .eq('vehicle_id', editingId)
          .select();
        error = res.error;
        savedRecord = res.data?.[0];
      } else {
        const res = await supabase
          .from('vehicles')
          .insert([payload])
          .select();
        error = res.error;
        savedRecord = res.data?.[0];
      }

      if (error) throw error;

      setSuccessMsg(editingId ? 'Equipment updated successfully!' : 'Equipment registered successfully!');
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);

      if (savedRecord) {
        handleSelectVehicle(savedRecord as VehiclePmViewRecord);
      }
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      const errorDetail = (errObj?.message as string) || (errObj?.details as string) || JSON.stringify(err);
      setErrorMsg(`Failed to save record: ${errorDetail}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const q = customerSearchQuery.toLowerCase();
    const codeMatch = (c.customer_code ?? '').toLowerCase().includes(q);
    const contactMatch = (c.contact_person ?? '').toLowerCase().includes(q);
    const nameMatch = (c.name ?? '').toLowerCase().includes(q);
    return (codeMatch || contactMatch || nameMatch) && c.is_active !== false;
  });

  const filteredModels = models.filter(m => {
    const q = modelSearchQuery.toLowerCase();
    const modelNameMatch = (m.name ?? '').toLowerCase().includes(q);
    const makeNameMatch = (m.make_name ?? '').toLowerCase().includes(q);
    return modelNameMatch || makeNameMatch;
  });

  const installedComponents = componentHistory.filter(c => c.installed_status === true);
  const historicalComponents = componentHistory.filter(c => c.installed_status === false);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-(--border-main) pb-3">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 rounded-xl shadow-xs">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Equipment Registry & Operations</h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">Search an Equipment to inspect its registry, PM schedule, and daily logs.</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="shrink-0 bg-(--accent-subtle) border border-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs animate-fade-in">
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

      {/* Collapsible Vehicle Search / Picker Section */}
      <div className="shrink-0 bg-(--bg-surface) border border-(--border-main) shadow-xs rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-(--accent-subtle) border-b border-(--border-main) flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-(--text-primary)" />
            <span className="text-xs font-semibold text-(--text-primary) uppercase tracking-wider">
              Search & Selected Vehicle
            </span>
            {selectedVehicle && (
              <span className="ml-2 text-xs bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) px-2 py-0.5 rounded font-mono font-bold">
                {selectedVehicle.plate_no}
              </span>
            )}
          </div>
          <button 
            type="button" 
            onClick={() => setIsSearchCollapsed(!isSearchCollapsed)}
            className="flex items-center gap-1.5 text-xs text-(--text-muted) hover:text-(--text-primary) bg-(--bg-elevated) border border-(--border-main) px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <span>{isSearchCollapsed ? 'Expand' : 'Collapse'}</span>
            {isSearchCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!isSearchCollapsed && (
          <div className="p-3">
            {selectedVehicle ? (
              <div className="flex items-center justify-between bg-(--bg-elevated) border border-(--border-main) p-3 rounded-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full text-xs">
                  <div>
                    <span className="text-[11px] text-(--text-muted) uppercase">Plate Number</span>
                    <div className="font-bold text-(--text-primary) text-sm">{selectedVehicle.plate_no}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-(--text-muted) uppercase">Service Reading</span>
                    <div className="font-semibold text-(--text-secondary)">{selectedVehicle.service_rdg ?? '0'}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-(--text-muted) uppercase">Make / Model</span>
                    <div className="font-semibold text-(--text-secondary)">{selectedVehicle.make_name || 'N/A'} {selectedVehicle.model_name ? `/ ${selectedVehicle.model_name}` : ''}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-(--text-muted) uppercase">Type</span>
                    <div className="font-semibold text-(--text-secondary)">{selectedVehicle.type_description || 'N/A'}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-(--text-muted) hover:text-red-600 dark:hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowPicker(true);
                  fetchPickerVehicles('');
                }}
                className="w-full bg-(--bg-elevated) border border-(--border-main) hover:border-(--text-primary) text-(--text-secondary) px-3 py-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-(--text-primary)" />
                  Click here to search and select an Equipment...
                </span>
                <span className="text-[11px] bg-(--accent-subtle) text-(--text-primary) px-2 py-0.5 rounded font-medium border border-(--border-main)">Browse</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="shrink-0 flex border-b border-(--border-main) gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer rounded-t-lg whitespace-nowrap ${
            activeTab === 'vehicles'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Equipment Details ({vehicles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pm_status')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer rounded-t-lg whitespace-nowrap ${
            activeTab === 'pm_status'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Equipment PM Status ({vehiclePms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('installed_components')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer rounded-t-lg whitespace-nowrap ${
            activeTab === 'installed_components'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Installed Components ({installedComponents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('component_history')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer rounded-t-lg whitespace-nowrap ${
            activeTab === 'component_history'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Component History ({historicalComponents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('daily_logs')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer rounded-t-lg whitespace-nowrap ${
            activeTab === 'daily_logs'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Daily Telemetry Logs ({vehicleLogs.length})</span>
        </button>
      </div>

      {/* Main Container Body */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-surface) border border-(--border-main) shadow-xs rounded-xl p-4 overflow-hidden space-y-3">
        {activeTab === 'vehicles' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-2">
            <div className="shrink-0 flex justify-end items-center">
              <button
                onClick={handleOpenAdd}
                className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Equipment</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                    <th className="py-2 px-3">Equipment ID</th>
                    <th className="py-2 px-3">Model</th>
                    <th className="py-2 px-3">Service Reading</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Initialized</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-(--text-muted) text-xs">No Equipment selected or found. Please search an Equipment above.</td>
                    </tr>
                  ) : (
                    vehicles.map((item) => {
                      const matchedModel = models.find(m => m.model_id === item.model_id);
                      return (
                        <tr key={item.vehicle_id} className="hover:bg-(--accent-subtle) transition-colors">
                          <td className="py-2 px-3">
                            <div className="font-semibold text-(--text-primary)">{item.plate_no}</div>
                            {item.conduction_no && <div className="text-[11px] text-(--text-muted) font-mono">Cond: {item.conduction_no}</div>}
                          </td>
                          <td className="py-2 px-3">
                            <div className="text-(--text-secondary)">{matchedModel ? `${matchedModel.make_name || ''} ${matchedModel.name || ''}`.trim() : '—'}</div>
                            {item.year && <div className="text-[11px] text-(--text-muted)">{item.year}</div>}
                          </td>
                          <td className="py-2 px-3 font-mono text-(--text-secondary)">{item.service_rdg ?? '0'}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${item.is_active ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-(--accent-subtle) text-(--text-muted)'}`}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium inline-flex items-center gap-1 ${item.has_initialized_rdg ? 'bg-(--accent-subtle) text-(--text-primary) border border-(--border-main)' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50'}`}>
                              {item.has_initialized_rdg ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="text-xs text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(item.vehicle_id)}
                                className="text-xs text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                              <button
                                onClick={() => handleInitializeVehicle(item)}
                                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                              >
                                <CheckCheck className="w-3 h-3" /> Initialize
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
          </div>
        )}

        {activeTab === 'pm_status' && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-2">
            {vehiclePms.length === 0 ? (
              <div className="py-12 text-center text-(--text-muted) text-xs bg-(--bg-elevated) rounded-xl border border-(--border-main)">
                No PM schedule records found for the selected Equipment.
              </div>
            ) : (
              vehiclePms.map((pm) => {
                const pmLevels = [
                  { level: 'PM 2', prev: pm.pm2_previous, curr: pm.pm2_current, next: pm.pm2_next, flag: pm.pm2_flag, date: pm.pm2_datecompleted },
                  { level: 'PM 3', prev: pm.pm3_previous, curr: pm.pm3_current, next: pm.pm3_next, flag: pm.pm3_flag, date: pm.pm3_datecompleted },
                  { level: 'PM 4', prev: pm.pm4_previous, curr: pm.pm4_current, next: pm.pm4_next, flag: pm.pm4_flag, date: pm.pm4_datecompleted },
                  { level: 'PM 5', prev: pm.pm5_previous, curr: pm.pm5_current, next: pm.pm5_next, flag: pm.pm5_flag, date: pm.pm5_datecompleted },
                  { level: 'PM 6', prev: pm.pm6_previous, curr: pm.pm6_current, next: pm.pm6_next, flag: pm.pm6_flag, date: pm.pm6_datecompleted },
                  { level: 'PM 7', prev: pm.pm7_previous, curr: pm.pm7_current, next: pm.pm7_next, flag: pm.pm7_flag, date: pm.pm7_datecompleted },
                ];

                return (
                  <div key={pm.vehicle_pm_id} className="space-y-4 bg-(--bg-elevated) border border-(--border-main) p-4 rounded-xl shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-(--border-main) pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-black text-white rounded-xl shadow-xs">
                          <Gauge className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-(--text-primary)">
                            Preventive Maintenance Schedule — <span className="text-(--text-primary)">{selectedVehicle?.plate_no || 'Vehicle'}</span>
                          </h3>
                          <p className="text-xs text-(--text-muted)">Current Reading: <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{pm.current_rdg ?? '0'}</span></p>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleOpenPmEdit(pm)}
                        title="Update PM Schedule"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Update PM Schedule</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {pmLevels.map((pml, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border transition-all ${pml.flag ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60' : 'bg-(--accent-subtle) border-(--border-main)'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs text-(--text-primary)">{pml.level}</span>
                            <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${pml.flag ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700' : 'bg-(--bg-elevated) text-(--text-secondary) border border-(--border-main)'}`}>
                              {pml.flag ? 'Flagged / Due' : 'Normal'}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs font-mono">
                            <div className="flex justify-between bg-(--bg-elevated) px-2 py-1 rounded border border-(--border-main)">
                              <span className="text-(--text-muted) text-[11px]">Previous:</span>
                              <span className="text-(--text-secondary)">{pml.prev ?? '—'}</span>
                            </div>
                            <div className="flex justify-between bg-(--bg-elevated) px-2 py-1 rounded border border-(--border-main)">
                              <span className="text-(--text-muted) text-[11px]">Current:</span>
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">{pml.curr ?? '—'}</span>
                            </div>
                            <div className="flex justify-between bg-(--bg-elevated) px-2 py-1 rounded border border-(--border-main)">
                              <span className="text-(--text-muted) text-[11px]">Next Target:</span>
                              <span className="text-(--text-primary) font-semibold">{pml.next ?? '—'}</span>
                            </div>
                            <div className="flex justify-between bg-(--bg-elevated) px-2 py-1 rounded border border-(--border-main)">
                              <span className="text-(--text-muted) text-[11px]">Completed:</span>
                              <span className="text-emerald-600 dark:text-emerald-400">{pml.date ? new Date(pml.date).toLocaleDateString() : '—'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'installed_components' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-2">
            <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                    <th className="py-2 px-3">Component</th>
                    <th className="py-2 px-3">Install Date</th>
                    <th className="py-2 px-3">Install Service Rdg</th>
                    <th className="py-2 px-3">Install Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {installedComponents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-(--text-muted) text-xs">No installed components found for the selected Equipment.</td>
                    </tr>
                  ) : (
                    installedComponents.map((item, idx) => {
                      const compCode = item.component_maintenance?.equipment_component_code || item.component_maintenance?.code || item.component_maintenance?.component_name || '—';

                      return (
                        <tr key={item.equipment_component_child_id || idx} className="hover:bg-(--accent-subtle) transition-colors">
                          <td className="py-2 px-3 font-semibold text-(--text-primary)">{compCode}</td>
                          <td className="py-2 px-3 font-mono text-(--text-muted)">{item.install_date || '—'}</td>
                          <td className="py-2 px-3 font-mono text-(--text-secondary)">{item.install_srv_rdg ?? '—'}</td>
                          <td className="py-2 px-3 text-(--text-muted)">{item.install_remarks || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'component_history' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-2">
            <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                    <th className="py-2 px-3">Component</th>
                    <th className="py-2 px-3">Install Date</th>
                    <th className="py-2 px-3">Vehicle Install Rdg</th>
                    <th className="py-2 px-3">Remove Date</th>
                    <th className="py-2 px-3">Vehicle Remove Rdg</th>
                    <th className="py-2 px-3">Component (Srv Run)</th>
                    <th className="py-2 px-3">Remove Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {historicalComponents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-(--text-muted) text-xs">No component history found for the selected Equipment.</td>
                    </tr>
                  ) : (
                    historicalComponents.map((item, idx) => {
                      const compCode = item.component_maintenance?.equipment_component_code || item.component_maintenance?.code || item.component_maintenance?.component_name || '—';

                      return (
                        <tr key={item.equipment_component_child_id || idx} className="hover:bg-(--accent-subtle) transition-colors">
                          <td className="py-2 px-3 font-semibold text-(--text-primary)">{compCode}</td>
                          <td className="py-2 px-3 font-mono text-(--text-muted)">{item.install_date || '—'}</td>
                          <td className="py-2 px-3 font-mono text-(--text-secondary)">{item.install_srv_rdg ?? '—'}</td>
                          <td className="py-2 px-3 font-mono text-(--text-muted)">{item.remove_date || '—'}</td>
                          <td className="py-2 px-3 font-mono text-(--text-secondary)">{item.remove_srv_rdg ?? '—'}</td>
                          <td className="py-2 px-3 font-mono text-amber-600 dark:text-amber-400">{item.srv_run ?? '—'}</td>
                          <td className="py-2 px-3 text-(--text-muted)">{item.remove_remarks || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'daily_logs' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-2">
            <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                    <th className="py-2 px-3">Log Date</th>
                    <th className="py-2 px-3">Equipment (Plate)</th>
                    <th className="py-2 px-3">Previous Reading</th>
                    <th className="py-2 px-3">Daily Increment</th>
                    <th className="py-2 px-3">Current Reading</th>
                    <th className="py-2 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {vehicleLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-(--text-muted) text-xs">No daily logs found for the selected Equipment.</td>
                    </tr>
                  ) : (
                    vehicleLogs.map((log) => (
                      <tr key={log.log_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="py-2 px-3 font-mono text-[11px] text-(--text-muted) flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-(--text-primary)" />
                          {log.log_date}
                        </td>
                        <td className="py-2 px-3 font-semibold text-(--text-primary)">{selectedVehicle ? selectedVehicle.plate_no : 'Unknown'}</td>
                        <td className="py-2 px-3 font-mono text-(--text-muted)">{log.previous_rdg}</td>
                        <td className="py-2 px-3 font-mono text-emerald-600 dark:text-emerald-400">+{log.daily_increment}</td>
                        <td className="py-2 px-3 font-mono text-amber-600 dark:text-amber-400">{log.current_rdg}</td>
                        <td className="py-2 px-3 text-(--text-muted) text-xs">{log.remarks || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* PM Schedule Edit Modal */}
      {isPmModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-(--border-main) px-6 py-4 shrink-0 bg-(--bg-surface)">
              <h3 className="text-lg font-bold text-(--text-primary)">
                Update Preventive Maintenance Schedule — <span className="text-(--text-primary)">{selectedVehicle?.plate_no ?? ''}</span>
              </h3>
              <button 
                onClick={() => setIsPmModalOpen(false)}
                className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePmForm} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                  <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Current Reading (Read-Only)</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={pmForm.current_rdg}
                    className="w-full md:w-1/3 bg-(--bg-elevated) border border-(--border-main) rounded-lg px-3 py-2 text-xs text-(--text-muted) font-mono cursor-not-allowed select-none"
                  />
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'PM 2', prevKey: 'pm2_previous', currKey: 'pm2_current', nextKey: 'pm2_next', flagKey: 'pm2_flag', dateKey: 'pm2_datecompleted' },
                    { label: 'PM 3', prevKey: 'pm3_previous', currKey: 'pm3_current', nextKey: 'pm3_next', flagKey: 'pm3_flag', dateKey: 'pm3_datecompleted' },
                    { label: 'PM 4', prevKey: 'pm4_previous', currKey: 'pm4_current', nextKey: 'pm4_next', flagKey: 'pm4_flag', dateKey: 'pm4_datecompleted' },
                    { label: 'PM 5', prevKey: 'pm5_previous', currKey: 'pm5_current', nextKey: 'pm5_next', flagKey: 'pm5_flag', dateKey: 'pm5_datecompleted' },
                    { label: 'PM 6', prevKey: 'pm6_previous', currKey: 'pm6_current', nextKey: 'pm6_next', flagKey: 'pm6_flag', dateKey: 'pm6_datecompleted' },
                    { label: 'PM 7', prevKey: 'pm7_previous', currKey: 'pm7_current', nextKey: 'pm7_next', flagKey: 'pm7_flag', dateKey: 'pm7_datecompleted' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-(--bg-surface) border border-(--border-main) p-3.5 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-(--text-primary)">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={item.flagKey}
                            checked={Boolean(pmForm[item.flagKey as keyof typeof pmForm])}
                            onChange={(e) => setPmForm({ ...pmForm, [item.flagKey]: e.target.checked })}
                            className="rounded border-(--border-main) bg-(--bg-elevated) text-(--text-primary) focus:ring-0 w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor={item.flagKey} className="text-xs font-semibold text-amber-700 dark:text-amber-300 cursor-pointer">Flagged / Due</label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
                        <div>
                          <span className="block text-(--text-muted) mb-1 text-[11px] font-semibold">Previous</span>
                          <input
                            type="number"
                            step="any"
                            value={String(pmForm[item.prevKey as keyof typeof pmForm] ?? '')}
                            onChange={(e) => setPmForm({ ...pmForm, [item.prevKey]: e.target.value })}
                            className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded px-2.5 py-1.5 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <span className="block text-(--text-muted) mb-1 text-[11px] font-semibold">Current</span>
                          <input
                            type="number"
                            step="any"
                            value={String(pmForm[item.currKey as keyof typeof pmForm] ?? '')}
                            onChange={(e) => setPmForm({ ...pmForm, [item.currKey]: e.target.value })}
                            className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded px-2.5 py-1.5 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <span className="block text-(--text-muted) mb-1 text-[11px] font-semibold">Next Target</span>
                          <input
                            type="number"
                            step="any"
                            value={String(pmForm[item.nextKey as keyof typeof pmForm] ?? '')}
                            onChange={(e) => setPmForm({ ...pmForm, [item.nextKey]: e.target.value })}
                            className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded px-2.5 py-1.5 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <span className="block text-(--text-muted) mb-1 text-[11px] font-semibold">Date Completed</span>
                          <input
                            type="date"
                            value={String(pmForm[item.dateKey as keyof typeof pmForm] ?? '')}
                            onChange={(e) => setPmForm({ ...pmForm, [item.dateKey]: e.target.value })}
                            className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded px-2.5 py-1.5 font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-(--border-main) shrink-0 bg-(--bg-surface)">
                <button
                  type="button"
                  onClick={() => setIsPmModalOpen(false)}
                  className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save PM Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-(--border-main) bg-(--bg-surface) shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">Select Equipment</h3>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="text-(--text-muted) hover:text-(--text-primary) p-1 rounded-lg hover:bg-(--accent-subtle) cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="p-3 border-b border-(--border-main) bg-(--bg-surface) flex gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-(--text-muted)" />
                <input
                  type="text"
                  placeholder="Filter by Plate Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) pl-9 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-(--text-primary)"
                />
              </div>
              <button
                type="submit"
                className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs"
              >
                Search
              </button>
            </form>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {pickerLoading ? (
                <div className="py-12 text-center text-(--text-muted) flex items-center justify-center gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-(--text-primary)" />
                  <span>Loading Equipment records...</span>
                </div>
              ) : searchVehiclesList.length === 0 ? (
                <div className="py-12 text-center text-(--text-muted) text-xs">
                  No Equipment records found.
                </div>
              ) : (
                searchVehiclesList.map((v, index) => (
                  <div
                    key={v.vehicle_id || index}
                    onClick={() => handleSelectVehicle(v)}
                    className="flex items-center justify-between bg-(--bg-elevated) hover:bg-(--accent-subtle) border border-(--border-main) p-2.5 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-black text-white rounded-lg shadow-xs transition-colors">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-(--text-primary) text-xs">{v.plate_no}</div>
                        <div className="text-[11px] text-(--text-muted)">
                          {v.make_name || 'N/A'} {v.model_name ? `/ ${v.model_name}` : ''} ({v.type_description || 'N/A'})
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-(--text-muted) uppercase">Service Rdg</span>
                      <div className="text-xs font-semibold text-(--text-secondary)">{v.service_rdg ?? '0'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-(--border-main) px-6 py-4 shrink-0 bg-(--bg-surface)">
              <h3 className="text-lg font-bold text-(--text-primary)">
                {editingId ? 'Edit Equipment' : 'Add Equipment'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Dropdown with Active Validation */}
                  <div className="relative" ref={customerDropdownRef}>
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Customer <span className="text-red-500">*</span></label>
                    <div 
                      onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) rounded-lg px-3 py-2 text-xs text-(--text-primary) flex items-center justify-between cursor-pointer focus:border-(--text-primary)"
                    >
                      <span className={vehicleForm.customer_id ? 'text-(--text-primary)' : 'text-(--text-muted)'}>
                        {(() => {
                          const matched = customers.find(c => c.customer_id === vehicleForm.customer_id);
                          if (matched) return `${matched.customer_code || ''} - ${matched.contact_person || ''}`;
                          return customers.length === 0 ? 'No active customers found' : 'Select Active Customer...';
                        })()}
                      </span>
                      <ChevronDownIcon className="w-4 h-4 text-(--text-muted)" />
                    </div>

                    {isCustomerDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-(--bg-elevated) border border-(--border-main) rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-2 border-b border-(--border-main)">
                          <input
                            type="text"
                            placeholder="Search active customer..."
                            value={customerSearchQuery}
                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                            className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-(--text-primary)"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1 space-y-1">
                          {filteredCustomers.length === 0 ? (
                            <div className="py-3 text-center text-xs text-(--text-muted)">No active customers found.</div>
                          ) : (
                            filteredCustomers.map((c) => (
                              <div
                                key={c.customer_id}
                                onClick={() => {
                                  setVehicleForm({ ...vehicleForm, customer_id: c.customer_id });
                                  setCustomerSearchQuery(`${c.customer_code || ''} - ${c.contact_person || ''}`);
                                  setIsCustomerDropdownOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-(--accent-subtle) rounded-lg cursor-pointer text-xs text-(--text-secondary) flex items-center justify-between transition-colors"
                              >
                                <span className="font-semibold text-(--text-primary) font-mono">{c.customer_code}</span>
                                <span className="text-(--text-muted)">{c.contact_person || 'No Contact'}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vehicle Model Dropdown with Search & Make Display */}
                  <div className="relative" ref={modelDropdownRef}>
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Equipment Model <span className="text-red-500">*</span></label>
                    <div 
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) rounded-lg px-3 py-2 text-xs text-(--text-primary) flex items-center justify-between cursor-pointer focus:border-(--text-primary)"
                    >
                      <span className={vehicleForm.model_id ? 'text-(--text-primary)' : 'text-(--text-muted)'}>
                        {(() => {
                          const matched = models.find(m => m.model_id === vehicleForm.model_id);
                          if (matched) return `${matched.make_name || ''} ${matched.name || ''}`.trim();
                          return 'Select Equipment Model...';
                        })()}
                      </span>
                      <ChevronDownIcon className="w-4 h-4 text-(--text-muted)" />
                    </div>

                    {isModelDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-(--bg-elevated) border border-(--border-main) rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-2 border-b border-(--border-main)">
                          <input
                            type="text"
                            placeholder="Search make or model..."
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                            className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-(--text-primary)"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1 space-y-1">
                          {filteredModels.length === 0 ? (
                            <div className="py-3 text-center text-xs text-(--text-muted)">No models found.</div>
                          ) : (
                            filteredModels.map((m) => (
                              <div
                                key={m.model_id}
                                onClick={() => {
                                  setVehicleForm({ ...vehicleForm, model_id: m.model_id });
                                  setModelSearchQuery(`${m.make_name || ''} ${m.name || ''}`.trim());
                                  setIsModelDropdownOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-(--accent-subtle) rounded-lg cursor-pointer text-xs text-(--text-secondary) flex items-center justify-between transition-colors"
                              >
                                <span className="font-semibold text-(--text-primary)">{m.make_name || 'Make'}</span>
                                <span className="text-(--text-muted)">{m.name}</span>
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
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Service Standard <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={vehicleForm.service_standard_id}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, service_standard_id: e.target.value })}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
                    >
                      <option value="">Select Service Standard</option>
                      {standards.map((s) => (
                        <option key={s.service_standard_id} value={s.service_standard_id}>
                          {s.code} {s.description ? `- ${s.description.substring(0, 30)}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Equipment ID <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={vehicleForm.plate_no}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, plate_no: e.target.value })}
                      placeholder="e.g. ABC1234"
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Conduction No</label>
                    <input
                      type="text"
                      value={vehicleForm.conduction_no}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, conduction_no: e.target.value })}
                      placeholder="Optional"
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Year (1900-2100)</label>
                    <input
                      type="number"
                      min="1900"
                      max="2100"
                      value={vehicleForm.year}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                      placeholder="e.g. 2024"
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Registration Date</label>
                    <input
                      type="date"
                      value={vehicleForm.registration_date}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, registration_date: e.target.value })}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Initial Service Reading</label>
                    <input
                      type="number"
                      step="any"
                      value={vehicleForm.service_rdg}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, service_rdg: e.target.value })}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-6 pt-5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_active_chk"
                        checked={vehicleForm.is_active}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, is_active: e.target.checked })}
                        className="rounded border-(--border-main) bg-(--bg-elevated) text-(--text-primary) focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="is_active_chk" className="text-xs uppercase text-(--text-muted) font-semibold cursor-pointer">Is Active</label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="has_init_chk"
                        disabled
                        checked={vehicleForm.has_initialized_rdg}
                        className="rounded border-(--border-main) bg-(--bg-elevated) text-(--text-muted) w-4 h-4 cursor-not-allowed opacity-60"
                      />
                      <label htmlFor="has_init_chk" className="text-xs uppercase text-(--text-muted) font-semibold cursor-not-allowed">Initialized (Read Only)</label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={vehicleForm.description}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, description: e.target.value })}
                    placeholder="Optional vehicle notes or specifications..."
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-(--border-main) shrink-0 bg-(--bg-surface)">
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingId)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-950/80 hover:bg-red-100 dark:hover:bg-red-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Record</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{editingId ? 'Update Equipment' : 'Save Equipment'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleRegistry;