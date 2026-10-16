import { useState, useEffect, useRef } from 'react';
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
  ChevronDown as ChevronDownIcon
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
  const [activeTab, setActiveTab] = useState<'vehicles' | 'pm_status' | 'daily_logs'>('vehicles');

  const [searchVehiclesList, setSearchVehiclesList] = useState<VehiclePmViewRecord[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePmViewRecord | null>(null);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pickerLoading, setPickerLoading] = useState<boolean>(false);
  const [isSearchCollapsed, setIsSearchCollapsed] = useState<boolean>(false);

  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [vehiclePms, setVehiclePms] = useState<VehiclePmRecord[]>([]);
  const [vehicleLogs, setVehicleLogs] = useState<VehicleLogRecord[]>([]);

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
      } catch (err) {
        console.error('Error loading dropdown options:', err);
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
      const [vehRes, pmRes, logRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('vehicle_id', vehId),
        supabase.from('vehicle_pm').select('*').eq('vehicle_id', vehId),
        supabase.from('vehicle_daily_logs').select('*').eq('vehicle_id', vehId).order('log_date', { ascending: false })
      ]);

      if (vehRes.error) throw vehRes.error;
      if (pmRes.error) throw pmRes.error;
      if (logRes.error) throw logRes.error;

      setVehicles(vehRes.data || []);
      setVehiclePms(pmRes.data || []);
      setVehicleLogs(logRes.data || []);
    } catch (err: unknown) {
      console.error('Error loading vehicle details:', err);
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
    } catch (err) {
      console.error('Error searching Equipments:', err);
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
      console.error('Error deleting Equipment:', err);
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
    const codeMatch = c.customer_code ? c.customer_code.toLowerCase().includes(q) : false;
    const contactMatch = c.contact_person ? c.contact_person.toLowerCase().includes(q) : false;
    const nameMatch = c.name ? c.name.toLowerCase().includes(q) : false;
    return (codeMatch || contactMatch || nameMatch) && c.is_active !== false;
  });

  const filteredModels = models.filter(m => {
    const q = modelSearchQuery.toLowerCase();
    const modelNameMatch = m.name ? m.name.toLowerCase().includes(q) : false;
    const makeNameMatch = m.make_name ? m.make_name.toLowerCase().includes(q) : false;
    return modelNameMatch || makeNameMatch;
  });

  return (
    <div className="p-6 w-full max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
          <Car className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Equipment Registry & Operations</h1>
          <p className="text-sm text-slate-400">Search an Equipment to inspect its registry, PM schedule, and daily logs.</p>
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

      {/* Collapsible Vehicle Search / Picker Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Search & Selected Vehicle
            </span>
            {selectedVehicle && (
              <span className="ml-2 text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">
                {selectedVehicle.plate_no}
              </span>
            )}
          </div>
          <button 
            type="button" 
            onClick={() => setIsSearchCollapsed(!isSearchCollapsed)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <span>{isSearchCollapsed ? 'Expand' : 'Collapse'}</span>
            {isSearchCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!isSearchCollapsed && (
          <div className="p-4 space-y-2">
            {selectedVehicle ? (
              <div className="flex items-center justify-between bg-slate-950 border border-blue-900/60 p-4 rounded-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-sm">
                  <div>
                    <span className="text-xs text-slate-400 uppercase">Plate Number</span>
                    <div className="font-bold text-blue-400 text-base">{selectedVehicle.plate_no}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase">Service Reading</span>
                    <div className="font-semibold text-slate-100">{selectedVehicle.service_rdg ?? '0'}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase">Make / Model</span>
                    <div className="font-semibold text-slate-100">{selectedVehicle.make_name || 'N/A'} {selectedVehicle.model_name ? `/ ${selectedVehicle.model_name}` : ''}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase">Type</span>
                    <div className="font-semibold text-slate-100">{selectedVehicle.type_description || 'N/A'}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-slate-400 hover:text-red-400 p-2 transition-colors cursor-pointer"
                  title="Clear selection"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowPicker(true);
                  fetchPickerVehicles('');
                }}
                className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500 text-slate-300 px-4 py-3 rounded-xl text-sm flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-400" />
                  Click here to search and select an Equipment...
                </span>
                <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded font-medium">Browse</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'vehicles'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Equipment Details ({vehicles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pm_status')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'pm_status'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Equipment PM Status ({vehiclePms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('daily_logs')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'daily_logs'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Daily Telemetry Logs ({vehicleLogs.length})</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        {activeTab === 'vehicles' && (
          <>
            <div className="flex justify-end items-center gap-4">
              <button
                onClick={handleOpenAdd}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add Equipment</span>
              </button>
            </div>

            <div className="overflow-y-auto overflow-x-auto max-h-[calc(100vh-360px)] border border-slate-800/60 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                    <th className="p-3">Equipment ID </th>
                    <th className="p-3">Model</th>
                    <th className="p-3">Service Reading</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Initialized</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">No Equipment selected or found. Please search an Equipment above.</td>
                    </tr>
                  ) : (
                    vehicles.map((item) => {
                      const matchedModel = models.find(m => m.model_id === item.model_id);
                      return (
                        <tr key={item.vehicle_id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-slate-100">{item.plate_no}</div>
                            {item.conduction_no && <div className="text-xs text-slate-400 font-mono">Cond: {item.conduction_no}</div>}
                          </td>
                          <td className="p-3">
                            <div className="text-slate-200">{matchedModel ? `${matchedModel.make_name || ''} ${matchedModel.name || ''}`.trim() : '—'}</div>
                            {item.year && <div className="text-xs text-slate-400">{item.year}</div>}
                          </td>
                          <td className="p-3 font-mono text-slate-300">{item.service_rdg ?? '0'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.is_active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1 ${item.has_initialized_rdg ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-amber-950/50 text-amber-300 border border-amber-800/50'}`}>
                              {item.has_initialized_rdg ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-3">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.vehicle_id)}
                              className="text-xs text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                            <button
                              onClick={() => handleInitializeVehicle(item)}
                              className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                            >
                              <CheckCheck className="w-3.5 h-3.5" /> Initialize
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'pm_status' && (
          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-280px)] pr-2">
            {vehiclePms.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800">
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
                  <div key={pm.vehicle_pm_id} className="space-y-6 bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
                          <Gauge className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-100">
                            Preventive Maintenance Schedule — <span className="text-blue-400">{selectedVehicle?.plate_no || 'Vehicle'}</span>
                          </h3>
                          <p className="text-xs text-slate-400">Current Reading: <span className="font-mono text-amber-400 font-semibold">{pm.current_rdg ?? '0'}</span></p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenPmEdit(pm)}
                          title="Update PM Schedule"
                          className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow shrink-0 bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Update PM Schedule</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pmLevels.map((pml, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border transition-all ${pml.flag ? 'bg-amber-950/20 border-amber-800/60' : 'bg-slate-900/80 border-slate-800'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-sm text-blue-400">{pml.level}</span>
                            <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${pml.flag ? 'bg-amber-900/40 text-amber-300 border border-amber-700' : 'bg-slate-800 text-slate-400'}`}>
                              {pml.flag ? 'Flagged / Due' : 'Normal'}
                            </span>
                          </div>

                          <div className="space-y-2 text-xs font-mono">
                            <div className="flex justify-between bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800/60">
                              <span className="text-slate-400">Previous:</span>
                              <span className="text-slate-200">{pml.prev ?? '—'}</span>
                            </div>
                            <div className="flex justify-between bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800/60">
                              <span className="text-slate-400">Current:</span>
                              <span className="text-amber-400 font-semibold">{pml.curr ?? '—'}</span>
                            </div>
                            <div className="flex justify-between bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800/60">
                              <span className="text-slate-400">Next Target:</span>
                              <span className="text-blue-400 font-semibold">{pml.next ?? '—'}</span>
                            </div>
                            <div className="flex justify-between bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800/60">
                              <span className="text-slate-400">Completed:</span>
                              <span className="text-emerald-400">{pml.date ? new Date(pml.date).toLocaleDateString() : '—'}</span>
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

        {activeTab === 'daily_logs' && (
          <div className="overflow-y-auto overflow-x-auto max-h-[calc(100vh-360px)] border border-slate-800/60 rounded-lg">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Log Date</th>
                  <th className="p-3">Equipment (Plate)</th>
                  <th className="p-3">Previous Reading</th>
                  <th className="p-3">Daily Increment</th>
                  <th className="p-3">Current Reading</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {vehicleLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No daily logs found for the selected Equipment.</td>
                  </tr>
                ) : (
                  vehicleLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="p-3 font-mono text-xs text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        {log.log_date}
                      </td>
                      <td className="p-3 font-semibold text-slate-100">{selectedVehicle ? selectedVehicle.plate_no : 'Unknown'}</td>
                      <td className="p-3 font-mono text-slate-400">{log.previous_rdg}</td>
                      <td className="p-3 font-mono text-emerald-400">+{log.daily_increment}</td>
                      <td className="p-3 font-mono text-amber-400">{log.current_rdg}</td>
                      <td className="p-3 text-slate-400 text-xs">{log.remarks || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PM Schedule Edit Modal */}
      {isPmModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">
                Update Preventive Maintenance Schedule — <span className="text-blue-400">{selectedVehicle?.plate_no}</span>
              </h3>
              <button 
                onClick={() => setIsPmModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePmForm} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Current Reading (Read-Only)</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={pmForm.current_rdg}
                  className="w-full md:w-1/3 bg-slate-950/50 border border-slate-800/80 rounded-lg px-3 py-2 text-sm text-slate-400 font-mono cursor-not-allowed select-none"
                />
              </div>

              <div className="space-y-4">
                {[
                  { label: 'PM 2', prevKey: 'pm2_previous', currKey: 'pm2_current', nextKey: 'pm2_next', flagKey: 'pm2_flag', dateKey: 'pm2_datecompleted' },
                  { label: 'PM 3', prevKey: 'pm3_previous', currKey: 'pm3_current', nextKey: 'pm3_next', flagKey: 'pm3_flag', dateKey: 'pm3_datecompleted' },
                  { label: 'PM 4', prevKey: 'pm4_previous', currKey: 'pm4_current', nextKey: 'pm4_next', flagKey: 'pm4_flag', dateKey: 'pm4_datecompleted' },
                  { label: 'PM 5', prevKey: 'pm5_previous', currKey: 'pm5_current', nextKey: 'pm5_next', flagKey: 'pm5_flag', dateKey: 'pm5_datecompleted' },
                  { label: 'PM 6', prevKey: 'pm6_previous', currKey: 'pm6_current', nextKey: 'pm6_next', flagKey: 'pm6_flag', dateKey: 'pm6_datecompleted' },
                  { label: 'PM 7', prevKey: 'pm7_previous', currKey: 'pm7_current', nextKey: 'pm7_next', flagKey: 'pm7_flag', dateKey: 'pm7_datecompleted' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-blue-400">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={item.flagKey}
                          checked={Boolean(pmForm[item.flagKey as keyof typeof pmForm])}
                          onChange={(e) => setPmForm({ ...pmForm, [item.flagKey]: e.target.checked })}
                          className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor={item.flagKey} className="text-xs font-semibold text-amber-300 cursor-pointer">Flagged / Due</label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="block text-slate-400 mb-1">Previous</span>
                        <input
                          type="number"
                          step="any"
                          value={String(pmForm[item.prevKey as keyof typeof pmForm] ?? '')}
                          onChange={(e) => setPmForm({ ...pmForm, [item.prevKey]: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <span className="block text-slate-400 mb-1">Current</span>
                        <input
                          type="number"
                          step="any"
                          value={String(pmForm[item.currKey as keyof typeof pmForm] ?? '')}
                          onChange={(e) => setPmForm({ ...pmForm, [item.currKey]: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <span className="block text-slate-400 mb-1">Next Target</span>
                        <input
                          type="number"
                          step="any"
                          value={String(pmForm[item.nextKey as keyof typeof pmForm] ?? '')}
                          onChange={(e) => setPmForm({ ...pmForm, [item.nextKey]: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <span className="block text-slate-400 mb-1">Date Completed</span>
                        <input
                          type="date"
                          value={String(pmForm[item.dateKey as keyof typeof pmForm] ?? '')}
                          onChange={(e) => setPmForm({ ...pmForm, [item.dateKey]: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPmModalOpen(false)}
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
                  <span>Save PM Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950">
              <h3 className="text-lg font-semibold text-slate-100">Select Equipment</h3>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="p-4 border-b border-slate-800 bg-slate-950/50 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by Plate Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
              {pickerLoading ? (
                <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span>Loading Equipment records...</span>
                </div>
              ) : searchVehiclesList.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  No Equipment records found.
                </div>
              ) : (
                searchVehiclesList.map((v, index) => (
                  <div
                    key={v.vehicle_id || index}
                    onClick={() => handleSelectVehicle(v)}
                    className="flex items-center justify-between bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-600/50 p-3 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 rounded-lg group-hover:bg-blue-900/40 text-blue-400 transition-colors">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-blue-400">{v.plate_no}</div>
                        <div className="text-xs text-slate-400">
                          {v.make_name || 'N/A'} {v.model_name ? `/ ${v.model_name}` : ''} ({v.type_description || 'N/A'})
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 uppercase">Service Rdg</span>
                      <div className="text-sm font-semibold text-slate-200">{v.service_rdg ?? '0'}</div>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">
                {editingId ? 'Edit Equipment' : 'Add Equipment'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Dropdown with Active Validation */}
                <div className="relative" ref={customerDropdownRef}>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Customer <span className="text-red-500">*</span></label>
                  <div 
                    onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 flex items-center justify-between cursor-pointer focus:border-blue-500"
                  >
                    <span className={vehicleForm.customer_id ? 'text-slate-100' : 'text-slate-500'}>
                      {(() => {
                        const matched = customers.find(c => c.customer_id === vehicleForm.customer_id);
                        if (matched) return `${matched.customer_code || ''} - ${matched.contact_person || ''}`;
                        return customers.length === 0 ? 'No active customers found' : 'Select Active Customer...';
                      })()}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                  </div>

                  {isCustomerDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="p-2 border-b border-slate-800">
                        <input
                          type="text"
                          placeholder="Search active customer..."
                          value={customerSearchQuery}
                          onChange={(e) => setCustomerSearchQuery(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto p-1 space-y-1">
                        {filteredCustomers.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-500">No active customers found.</div>
                        ) : (
                          filteredCustomers.map((c) => (
                            <div
                              key={c.customer_id}
                              onClick={() => {
                                setVehicleForm({ ...vehicleForm, customer_id: c.customer_id });
                                setCustomerSearchQuery(`${c.customer_code || ''} - ${c.contact_person || ''}`);
                                setIsCustomerDropdownOpen(false);
                              }}
                              className="px-3 py-2 hover:bg-blue-950/40 rounded-lg cursor-pointer text-xs text-slate-200 flex items-center justify-between transition-colors"
                            >
                              <span className="font-semibold text-blue-400 font-mono">{c.customer_code}</span>
                              <span className="text-slate-300">{c.contact_person || 'No Contact'}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Vehicle Model Dropdown with Search & Make Display */}
                <div className="relative" ref={modelDropdownRef}>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Equipment Model <span className="text-red-500">*</span></label>
                  <div 
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 flex items-center justify-between cursor-pointer focus:border-blue-500"
                  >
                    <span className={vehicleForm.model_id ? 'text-slate-100' : 'text-slate-500'}>
                      {(() => {
                        const matched = models.find(m => m.model_id === vehicleForm.model_id);
                        if (matched) return `${matched.make_name || ''} ${matched.name || ''}`.trim();
                        return 'Select Equipment Model...';
                      })()}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                  </div>

                  {isModelDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="p-2 border-b border-slate-800">
                        <input
                          type="text"
                          placeholder="Search make or model..."
                          value={modelSearchQuery}
                          onChange={(e) => setModelSearchQuery(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto p-1 space-y-1">
                        {filteredModels.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-500">No models found.</div>
                        ) : (
                          filteredModels.map((m) => (
                            <div
                              key={m.model_id}
                              onClick={() => {
                                setVehicleForm({ ...vehicleForm, model_id: m.model_id });
                                setModelSearchQuery(`${m.make_name || ''} ${m.name || ''}`.trim());
                                setIsModelDropdownOpen(false);
                              }}
                              className="px-3 py-2 hover:bg-blue-950/40 rounded-lg cursor-pointer text-xs text-slate-200 flex items-center justify-between transition-colors"
                            >
                              <span className="font-semibold text-blue-400">{m.make_name || 'Make'}</span>
                              <span className="text-slate-300">{m.name}</span>
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
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Service Standard <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={vehicleForm.service_standard_id}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, service_standard_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
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
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Equipment ID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.plate_no}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, plate_no: e.target.value })}
                    placeholder="e.g. ABC1234"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Conduction No</label>
                  <input
                    type="text"
                    value={vehicleForm.conduction_no}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, conduction_no: e.target.value })}
                    placeholder="Optional"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Year (1900-2100)</label>
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                    placeholder="e.g. 2024"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Registration Date</label>
                  <input
                    type="date"
                    value={vehicleForm.registration_date}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, registration_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Initial Service Reading</label>
                  <input
                    type="number"
                    step="any"
                    value={vehicleForm.service_rdg}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, service_rdg: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-6 pt-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active_chk"
                      checked={vehicleForm.is_active}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, is_active: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="is_active_chk" className="text-xs font-semibold uppercase text-slate-400 cursor-pointer">Is Active</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="has_init_chk"
                      disabled
                      checked={vehicleForm.has_initialized_rdg}
                      className="rounded bg-slate-950/50 border-slate-800 text-slate-600 focus:ring-0 w-4 h-4 cursor-not-allowed opacity-60"
                    />
                    <label htmlFor="has_init_chk" className="text-xs font-semibold uppercase text-slate-500 cursor-not-allowed">Initialized Reading (Read Only)</label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={vehicleForm.description}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, description: e.target.value })}
                  placeholder="Optional vehicle notes or specifications..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingId)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 flex items-center gap-1.5 cursor-pointer transition-colors"
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