import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  ClipboardCheck, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  X,
  Edit2,
  Trash2,
  Layers,
  Wrench,
  Users,
  Search,
  Car,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Upload,
  Briefcase
} from 'lucide-react';

interface JobOrderMasterRecord {
  job_order_id: string;
  job_order_no: number;
  vehicle_id: string;
  status_id: string;
  priority_id: string;
  expected_completion: string;
  date_started: string | null;
  date_completed: string | null;
  assigned_supervisor: string | null;
  requestor: string | null;
  approver: string | null;
  labor_cost: number;
  materials_cost: number;
  total_cost: number;
  has_changes: boolean;
  odo_rdg: number;
  contract_cost: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface JobOrderTaskDetailRecord {
  job_order_task_id: string;
  job_order_id: string;
  task_standard_id: string;
  standard_time: number | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface JobOrderMaterialRecord {
  job_order_matls_id: string;
  job_order_id: string;
  stock_id: string | null;
  stock_code: string | null;
  part_number: string | null;
  qty: number | null;
  unit_price: number | null;
  list_price: number | null;
  unit_of_measure: string | null;
  line_total: number | null;
  reference_total: number | null;
  [key: string]: unknown;
}

interface JobOrderResourceRecord {
  job_order_resource_id: string;
  job_order_task_id: string;
  employee_id: string;
  job_order_id: string;
  charged_time: number;
  ee_rate: number | null;
  ee_sell_rate: number | null;
  ee_line_total: number | null;
  ee_reference_total: number | null;
  task_standard_id: string;
  assigned_date: string;
  [key: string]: unknown;
}

interface JobOrderContractRecord {
  job_order_matls_id: string;
  job_order_id: string;
  qty: number | null;
  contract_decription: string | null;
  unit_price: number | null;
  list_price: number | null;
  line_total: number | null;
  reference_total: number | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

interface VehiclePm {
  plate_no?: string;
  service_rdg?: number | null;
  srv_rdg?: number | null;
  make_name?: string | null;
  model_name?: string | null;
  type_description?: string | null;
  id?: string;
  vehicle_id?: string;
  [key: string]: unknown;
}

interface EmployeeRecord {
  employee_id: string;
  employee_name?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  rate_per_hour?: number;
  sell_rate_per_hour?: number;
  hourly_rate?: number;
  rate?: number;
  is_active?: boolean;
  is_supervisor?: boolean;
  [key: string]: unknown;
}

interface TaskStandardRecord {
  task_standard_id: string;
  task_standard_desc: string;
  standard_time?: number | null;
  std_time?: number | null;
  [key: string]: unknown;
}

// Helper function to validate UUID strings
const isValidUuid = (str: string | null | undefined): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
};

async function fetchVehicleDetails(vId: string | null): Promise<VehiclePm | null> {
  if (!vId) return null;
  try {
    const { data: d1 } = await supabase.from('vw_vehicle_pm_details').select('*').eq('vehicle_id', vId).maybeSingle();
    if (d1) return d1;

    const { data: d2 } = await supabase.from('vw_vehicle_pm_details').select('*').eq('id', vId).maybeSingle();
    if (d2) return d2;

    const { data: d3 } = await supabase.from('vehicles').select('*').eq('vehicle_id', vId).maybeSingle();
    if (d3) return d3;

    const { data: d4 } = await supabase.from('vehicles').select('*').eq('id', vId).maybeSingle();
    if (d4) return d4;

    return null;
  } catch (err) {
    console.error('Error fetching vehicle details:', err);
    return null;
  }
}

export function JobOrder() {
  const [jobOrders, setJobOrders] = useState<JobOrderMasterRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentJobOrder = jobOrders[currentIndex] || null;

  const jobOrderId = currentJobOrder?.job_order_id;
  const vehicleId = currentJobOrder?.vehicle_id;

  const [activeChildTab, setActiveChildTab] = useState<'tasks' | 'materials' | 'resources' | 'contracts'>('tasks');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);

  const [statuses, setStatuses] = useState<{ status_id: string; status_name: string }[]>([]);
  const [priorities, setPriorities] = useState<{ priority_id: string; priority_desc: string }[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [taskStandards, setTaskStandards] = useState<TaskStandardRecord[]>([]);

  const [pickerVehicles, setPickerVehicles] = useState<VehiclePm[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState<boolean>(false);
  const [showVehiclePicker, setShowVehiclePicker] = useState<boolean>(false);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState<string>('');
  const [selectedPickerVehicle, setSelectedPickerVehicle] = useState<VehiclePm | null>(null);

  const [showJobOrderPicker, setShowJobOrderPicker] = useState<boolean>(false);
  const [pickerJobOrders, setPickerJobOrders] = useState<JobOrderMasterRecord[]>([]);
  const [pickerVehicleMap, setPickerVehicleMap] = useState<Record<string, VehiclePm>>({});
  const [loadingJobOrders, setLoadingJobOrders] = useState<boolean>(false);
  const [jobOrderSearchQuery, setJobOrderSearchQuery] = useState<string>('');
  const [jobOrderSearchStatus, setJobOrderSearchStatus] = useState<string>('');

  const [supervisorSearchQuery, setSupervisorSearchQuery] = useState<string>('');
  const [showSupervisorDropdown, setShowSupervisorDropdown] = useState<boolean>(false);
  const supervisorDropdownRef = useRef<HTMLDivElement>(null);

  const [taskStandardSearchQuery, setTaskStandardSearchQuery] = useState<string>('');
  const [showTaskStandardDropdown, setShowTaskStandardDropdown] = useState<boolean>(false);
  const taskStandardDropdownRef = useRef<HTMLDivElement>(null);

  const expectedCompletionRef = useRef<HTMLInputElement>(null);
  const dateStartedRef = useRef<HTMLInputElement>(null);

  const [taskDetails, setTaskDetails] = useState<JobOrderTaskDetailRecord[]>([]);
  const [materials, setMaterials] = useState<JobOrderMaterialRecord[]>([]);
  const [resources, setResources] = useState<JobOrderResourceRecord[]>([]);
  const [contracts, setContracts] = useState<JobOrderContractRecord[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState<boolean>(false);
  const [isHeaderEditing, setIsHeaderEditing] = useState<boolean>(false);
  const [headerForm, setHeaderForm] = useState({
    vehicle_id: '',
    status_id: '',
    priority_id: '',
    expected_completion: '',
    date_started: '',
    date_completed: '',
    assigned_supervisor: '',
    labor_cost: '0',
    materials_cost: '0',
    total_cost: '0',
    has_changes: false,
    odo_rdg: '0',
    contract_cost: '0'
  });

  const [isChildModalOpen, setIsChildModalOpen] = useState<boolean>(false);
  const [childEditingId, setChildEditingId] = useState<string | null>(null);
  const [taskDetailForm, setTaskDetailForm] = useState({ task_standard_id: '', standard_time: '' });
  const [resourceForm, setResourceForm] = useState({ job_order_task_id: '', employee_id: '', charged_time: '0', assigned_date: '' });
  const [contractForm, setContractForm] = useState({ contract_decription: '', qty: '1', unit_price: '0', list_price: '0' });

  // Recalculate and persist labor_cost, materials_cost, contract_cost, and total_cost
  const recalculateAndSaveJobOrderCosts = async (targetJobOrderId: string) => {
    try {
      const [mRes, rRes, cRes, joRes] = await Promise.all([
        supabase.from('joborder_materials').select('*').eq('job_order_id', targetJobOrderId),
        supabase.from('joborder_resources').select('*').eq('job_order_id', targetJobOrderId),
        supabase.from('joborder_contract').select('*').eq('job_order_id', targetJobOrderId),
        supabase.from('joborder_master').select('*').eq('job_order_id', targetJobOrderId).maybeSingle()
      ]);

      const matList = mRes.data || [];
      const resList = rRes.data || [];
      const contractList = cRes.data || [];
      const joRecord = joRes.data;

      if (!joRecord) return;

      const newMaterialsCost = matList.reduce((sum, item) => sum + (Number(item.reference_total) || 0), 0);
      const newLaborCost = resList.reduce((sum, item) => sum + (Number(item.ee_reference_total) || 0), 0);
      const newContractCost = contractList.reduce((sum, item) => sum + (Number(item.reference_total) || 0), 0);
      const newTotalCost = newMaterialsCost + newLaborCost + newContractCost;

      const { data: updatedJoData, error: updateError } = await supabase
        .from('joborder_master')
        .update({
          materials_cost: Number(newMaterialsCost.toFixed(2)),
          labor_cost: Number(newLaborCost.toFixed(2)),
          contract_cost: Number(newContractCost.toFixed(2)),
          total_cost: Number(newTotalCost.toFixed(2))
        })
        .eq('job_order_id', targetJobOrderId)
        .select()
        .maybeSingle();

      if (updateError) throw updateError;

      if (updatedJoData && currentJobOrder && currentJobOrder.job_order_id === targetJobOrderId) {
        const updatedList = [...jobOrders];
        updatedList[currentIndex] = updatedJoData;
        setJobOrders(updatedList);
      }
    } catch (err) {
      console.error('Error recalculating costs:', err);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (supervisorDropdownRef.current && !supervisorDropdownRef.current.contains(event.target as Node)) {
        setShowSupervisorDropdown(false);
      }
      if (taskStandardDropdownRef.current && !taskStandardDropdownRef.current.contains(event.target as Node)) {
        setShowTaskStandardDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadLookups() {
      try {
        const [sRes, pRes, eRes, tsRes] = await Promise.all([
          supabase.from('joborder_status').select('*'),
          supabase.from('joborder_priority').select('*'),
          supabase.from('employees').select('*'),
          supabase.from('equipment_taskstandards').select('*')
        ]);

        if (isMounted) {
          setStatuses(sRes.data || []);
          setPriorities(pRes.data || []);
          setEmployees(eRes.data || []);
          setTaskStandards(tsRes.data || []);
        }
      } catch (err) {
        console.error('Error loading lookup tables:', err);
      }
    }
    loadLookups();
    return () => { isMounted = false; };
  }, []);

  const fetchPickerVehicles = async (queryToRun?: string) => {
    try {
      setLoadingVehicles(true);
      const activeQuery = queryToRun !== undefined ? queryToRun : vehicleSearchQuery;

      let query = supabase
        .from('vw_vehicle_pm_details')
        .select('*')
        .order('plate_no', { ascending: true })
        .limit(50);

      if (activeQuery.trim()) {
        query = query.ilike('plate_no', `%${activeQuery.trim()}%`);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setPickerVehicles(data || []);
    } catch (err: unknown) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadInitialVehicles() {
      try {
        const { data, error: fetchError } = await supabase
          .from('vw_vehicle_pm_details')
          .select('*')
          .order('plate_no', { ascending: true })
          .limit(50);

        if (fetchError) throw fetchError;
        if (isMounted) setPickerVehicles(data || []);
      } catch (err: unknown) {
        if (isMounted) console.error('Error fetching Equipment:', err);
      }
    }
    loadInitialVehicles();
    return () => { isMounted = false; };
  }, []);

  const handleVehicleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchPickerVehicles(vehicleSearchQuery);
  };

  const fetchPickerJobOrders = async (queryToRun?: string, statusToRun?: string) => {
    try {
      setLoadingJobOrders(true);
      const activeQuery = queryToRun !== undefined ? queryToRun : jobOrderSearchQuery;
      const activeStatus = statusToRun !== undefined ? statusToRun : jobOrderSearchStatus;

      const vehicleIds: string[] = [];
      if (activeQuery.trim()) {
        const { data: vData } = await supabase
          .from('vw_vehicle_pm_details')
          .select('id, vehicle_id')
          .ilike('plate_no', `%${activeQuery.trim()}%`);
        
        if (vData) {
          vData.forEach(v => {
            if (v.id) vehicleIds.push(v.id);
            if (v.vehicle_id) vehicleIds.push(v.vehicle_id);
          });
        }
      }

      let query = supabase
        .from('joborder_master')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (activeQuery.trim()) {
        const numVal = Number(activeQuery.trim());
        if (!isNaN(numVal) && vehicleIds.length > 0) {
          query = query.or(`job_order_no.eq.${numVal},vehicle_id.in.(${vehicleIds.join(',')})`);
        } else if (!isNaN(numVal)) {
          query = query.or(`job_order_no.eq.${numVal}`);
        } else if (vehicleIds.length > 0) {
          query = query.in('vehicle_id', vehicleIds);
        } else {
          setPickerJobOrders([]);
          setPickerVehicleMap({});
          setLoadingJobOrders(false);
          return;
        }
      }

      if (activeStatus) {
        query = query.eq('status_id', activeStatus);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      const fetchedJoList = data || [];
      const vIdsToFetch = Array.from(new Set(fetchedJoList.map(jo => jo.vehicle_id).filter(Boolean)));
      const vMap: Record<string, VehiclePm> = {};
      
      if (vIdsToFetch.length > 0) {
        const [res1, res2] = await Promise.all([
          supabase.from('vw_vehicle_pm_details').select('*').in('id', vIdsToFetch),
          supabase.from('vw_vehicle_pm_details').select('*').in('vehicle_id', vIdsToFetch)
        ]);

        const allVehicles = [...(res1.data || []), ...(res2.data || [])];
        allVehicles.forEach(v => {
          if (v.id) vMap[v.id] = v;
          if (v.vehicle_id) vMap[v.vehicle_id] = v;
        });

        for (const jo of fetchedJoList) {
          if (jo.vehicle_id && !vMap[jo.vehicle_id]) {
            const singleV = await fetchVehicleDetails(jo.vehicle_id);
            if (singleV) vMap[jo.vehicle_id] = singleV;
          }
        }
      }

      setPickerVehicleMap(vMap);
      setPickerJobOrders(fetchedJoList);
    } catch (err: unknown) {
      console.error('Error fetching job orders for search:', err);
    } finally {
      setLoadingJobOrders(false);
    }
  };

  const handleOpenJobOrderSearch = async () => {
    const inProgressStatus = statuses.find(s => s.status_name.toLowerCase() === 'in-progress' || s.status_name.toLowerCase() === 'in progress');
    const defaultStatusId = inProgressStatus ? inProgressStatus.status_id : (statuses[0]?.status_id || '');

    setJobOrderSearchStatus(defaultStatusId);
    setJobOrderSearchQuery('');
    setPickerJobOrders([]);
    setPickerVehicleMap({});
    setShowJobOrderPicker(true);
  };

  const handleJobOrderSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchPickerJobOrders(jobOrderSearchQuery, jobOrderSearchStatus);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadChildRecords() {
      if (!jobOrderId) {
        if (isMounted) {
          setTaskDetails([]);
          setMaterials([]);
          setResources([]);
          setContracts([]);
          setSelectedPickerVehicle(null);
        }
        return;
      }

      try {
        const [tdRes, mRes, rRes, cRes, vData] = await Promise.all([
          supabase.from('joborder_task_details').select('*').eq('job_order_id', jobOrderId),
          supabase.from('joborder_materials').select('*').eq('job_order_id', jobOrderId),
          supabase.from('joborder_resources').select('*').eq('job_order_id', jobOrderId),
          supabase.from('joborder_contract').select('*').eq('job_order_id', jobOrderId),
          fetchVehicleDetails(vehicleId || null)
        ]);

        if (isMounted) {
          setTaskDetails(tdRes.data || []);
          setMaterials(mRes.data || []);
          setResources(rRes.data || []);
          setContracts(cRes.data || []);
          setSelectedPickerVehicle(vData);
        }
      } catch (err) {
        console.error('Error fetching child records:', err);
      }
    }

    loadChildRecords();
    return () => { isMounted = false; };
  }, [jobOrderId, vehicleId]);

  const handleOpenAddHeader = () => {
    setIsHeaderEditing(false);
    setSelectedPickerVehicle(null);
    setSupervisorSearchQuery('');
    const defaultStatusId = statuses[0]?.status_id || '';
    const defaultStatus = statuses.find(s => s.status_id === defaultStatusId);
    const isCompleted = defaultStatus?.status_name?.toLowerCase() === 'completed';
    const todayStr = new Date().toISOString().split('T')[0];

    setHeaderForm({
      vehicle_id: '',
      status_id: defaultStatusId,
      priority_id: priorities[0]?.priority_id || '',
      expected_completion: todayStr,
      date_started: '',
      date_completed: isCompleted ? todayStr : '',
      assigned_supervisor: '',
      labor_cost: '0',
      materials_cost: '0',
      total_cost: '0',
      has_changes: false,
      odo_rdg: '0',
      contract_cost: '0'
    });
    setIsHeaderModalOpen(true);
  };

  const handleOpenEditHeader = async () => {
    if (!currentJobOrder) return;
    setIsHeaderEditing(true);

    const vData = await fetchVehicleDetails(currentJobOrder.vehicle_id || null);
    setSelectedPickerVehicle(vData);

    const matchedSup = employees.find(e => e.employee_id === currentJobOrder.assigned_supervisor);
    setSupervisorSearchQuery(
      matchedSup 
        ? (matchedSup.employee_name || matchedSup.name || `${matchedSup.first_name || ''} ${matchedSup.last_name || ''}`) 
        : ''
    );

    const currentStatus = statuses.find(s => s.status_id === currentJobOrder.status_id);
    const isCompleted = currentStatus?.status_name?.toLowerCase() === 'completed';
    const todayStr = new Date().toISOString().split('T')[0];

    setHeaderForm({
      vehicle_id: currentJobOrder.vehicle_id || '',
      status_id: currentJobOrder.status_id || '',
      priority_id: currentJobOrder.priority_id || '',
      expected_completion: currentJobOrder.expected_completion || '',
      date_started: currentJobOrder.date_started || '',
      date_completed: isCompleted ? (currentJobOrder.date_completed || todayStr) : '',
      assigned_supervisor: currentJobOrder.assigned_supervisor || '',
      labor_cost: String(currentJobOrder.labor_cost ?? 0),
      materials_cost: String(currentJobOrder.materials_cost ?? 0),
      total_cost: String(currentJobOrder.total_cost ?? 0),
      has_changes: currentJobOrder.has_changes ?? false,
      odo_rdg: String(currentJobOrder.odo_rdg ?? 0),
      contract_cost: String(currentJobOrder.contract_cost ?? 0)
    });
    setIsHeaderModalOpen(true);
  };

  const handleDeleteHeader = async () => {
    if (!currentJobOrder || !confirm('Are you sure you want to delete this Job Order and all its related details?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('joborder_master').delete().eq('job_order_id', currentJobOrder.job_order_id);
      if (error) throw error;
      setSuccessMsg('Job Order deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      setJobOrders([]);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Error deleting job order:', err);
      setErrorMsg('Failed to delete Job Order.');
    }
  };

  const handleSubmitHeader = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!headerForm.vehicle_id) {
      setErrorMsg('Please select a Equipment for this job order.');
      return;
    }
    setErrorMsg(null);

    try {
      const selectedStatus = statuses.find(s => s.status_id === headerForm.status_id);
      const isCompleted = selectedStatus?.status_name?.toLowerCase() === 'completed';

      const payload = {
        vehicle_id: headerForm.vehicle_id,
        status_id: headerForm.status_id,
        priority_id: headerForm.priority_id,
        expected_completion: headerForm.expected_completion,
        date_started: headerForm.date_started || null,
        date_completed: isCompleted ? (headerForm.date_completed || new Date().toISOString().split('T')[0]) : null,
        assigned_supervisor: headerForm.assigned_supervisor || null,
        labor_cost: Number(headerForm.labor_cost) || 0,
        materials_cost: Number(headerForm.materials_cost) || 0,
        total_cost: Number(headerForm.total_cost) || 0,
        has_changes: headerForm.has_changes,
        odo_rdg: Number(headerForm.odo_rdg) || 0,
        contract_cost: Number(headerForm.contract_cost) || 0
      };

      if (isHeaderEditing && currentJobOrder) {
        const { error, data } = await supabase.from('joborder_master').update(payload).eq('job_order_id', currentJobOrder.job_order_id).select();
        if (error) throw error;
        setSuccessMsg('Job Order updated successfully!');
        if (data && data[0]) {
          const updatedList = [...jobOrders];
          updatedList[currentIndex] = data[0];
          setJobOrders(updatedList);
        }
      } else {
        const { error, data } = await supabase.from('joborder_master').insert([payload]).select();
        if (error) throw error;
        setSuccessMsg('Job Order created successfully!');
        if (data && data[0]) {
          setJobOrders([data[0], ...jobOrders]);
          setCurrentIndex(0);
        }
      }

      setIsHeaderModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error('Error saving job order header:', err);
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message || 'Failed to save Job Order.';
      setErrorMsg(message);
    }
  };

  const handleOpenAddChild = () => {
    if (!currentJobOrder) return;
    setChildEditingId(null);
    setTaskDetailForm({ task_standard_id: '', standard_time: '' });
    setTaskStandardSearchQuery('');

    setResourceForm({ 
      job_order_task_id: taskDetails[0]?.job_order_task_id || '', 
      employee_id: employees[0]?.employee_id || '', 
      charged_time: '0', 
      assigned_date: new Date().toISOString().split('T')[0] 
    });

    setContractForm({
      contract_decription: '',
      qty: '1',
      unit_price: '0',
      list_price: '0'
    });

    setIsChildModalOpen(true);
  };

  const handleOpenEditChild = (item: JobOrderTaskDetailRecord | JobOrderMaterialRecord | JobOrderResourceRecord | JobOrderContractRecord) => {
    setChildEditingId(
      activeChildTab === 'tasks' ? (item as JobOrderTaskDetailRecord).job_order_task_id :
      activeChildTab === 'materials' ? (item as JobOrderMaterialRecord).job_order_matls_id :
      activeChildTab === 'resources' ? (item as JobOrderResourceRecord).job_order_resource_id :
      (item as JobOrderContractRecord).job_order_matls_id
    );

    if (activeChildTab === 'tasks') {
      const rec = item as JobOrderTaskDetailRecord;
      const matchedTs = taskStandards.find(ts => ts.task_standard_id === rec.task_standard_id);
      setTaskDetailForm({ task_standard_id: rec.task_standard_id, standard_time: String(rec.standard_time ?? 0) });
      setTaskStandardSearchQuery(matchedTs ? matchedTs.task_standard_desc : '');
    } else if (activeChildTab === 'resources') {
      const rec = item as JobOrderResourceRecord;
      setResourceForm({
        job_order_task_id: rec.job_order_task_id || '',
        employee_id: rec.employee_id || '',
        charged_time: String(rec.charged_time ?? 0),
        assigned_date: rec.assigned_date || ''
      });
    } else if (activeChildTab === 'contracts') {
      const rec = item as JobOrderContractRecord;
      setContractForm({
        contract_decription: rec.contract_decription || '',
        qty: String(rec.qty ?? 1),
        unit_price: String(rec.unit_price ?? 0),
        list_price: String(rec.list_price ?? 0)
      });
    }
    setIsChildModalOpen(true);
  };

  const handleDeleteChild = async (id: string, tableName: 'joborder_task_details' | 'joborder_materials' | 'joborder_resources' | 'joborder_contract', pkField: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from(tableName).delete().eq(pkField, id);
      if (error) throw error;
      setSuccessMsg('Record deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      if (currentJobOrder) {
        const [tdRes, mRes, rRes, cRes] = await Promise.all([
          supabase.from('joborder_task_details').select('*').eq('job_order_id', currentJobOrder.job_order_id),
          supabase.from('joborder_materials').select('*').eq('job_order_id', currentJobOrder.job_order_id),
          supabase.from('joborder_resources').select('*').eq('job_order_id', currentJobOrder.job_order_id),
          supabase.from('joborder_contract').select('*').eq('job_order_id', currentJobOrder.job_order_id)
        ]);
        setTaskDetails(tdRes.data || []);
        setMaterials(mRes.data || []);
        setResources(rRes.data || []);
        setContracts(cRes.data || []);

        await recalculateAndSaveJobOrderCosts(currentJobOrder.job_order_id);
      }
    } catch (err) {
      console.error('Error deleting child record:', err);
      setErrorMsg('Failed to delete child record.');
    }
  };

  const handleSubmitChildForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentJobOrder) return;
    setErrorMsg(null);

    try {
      if (activeChildTab === 'tasks') {
        if (!taskDetailForm.task_standard_id) {
          setErrorMsg('Please select a task standard.');
          return;
        }
        const payload = {
          job_order_id: currentJobOrder.job_order_id,
          task_standard_id: taskDetailForm.task_standard_id,
          standard_time: Number(taskDetailForm.standard_time) || 0
        };
        if (childEditingId) {
          const { error } = await supabase.from('joborder_task_details').update(payload).eq('job_order_task_id', childEditingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('joborder_task_details').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Task detail saved successfully!');
      } else if (activeChildTab === 'resources') {
        const matchedTask = taskDetails.find(t => t.job_order_task_id === resourceForm.job_order_task_id);
        const matchedEmp = employees.find(e => e.employee_id === resourceForm.employee_id);

        const chargedTimeVal = Number(resourceForm.charged_time) || 0;
        const ratePerHour = Number(matchedEmp?.rate_per_hour ?? matchedEmp?.hourly_rate ?? matchedEmp?.rate ?? 0);
        const sellRatePerHour = Number(matchedEmp?.sell_rate_per_hour ?? 0);

        const eeLineTotalVal = Number((chargedTimeVal * ratePerHour).toFixed(2));
        const eeReferenceTotalVal = Number((chargedTimeVal * sellRatePerHour).toFixed(2));

        const payload = {
          job_order_id: currentJobOrder.job_order_id,
          job_order_task_id: resourceForm.job_order_task_id,
          employee_id: resourceForm.employee_id,
          task_standard_id: matchedTask ? matchedTask.task_standard_id : taskStandards[0]?.task_standard_id,
          charged_time: chargedTimeVal,
          ee_rate: ratePerHour,
          ee_sell_rate: sellRatePerHour,
          ee_line_total: eeLineTotalVal,
          ee_reference_total: eeReferenceTotalVal,
          assigned_date: resourceForm.assigned_date
        };

        if (childEditingId) {
          const { error } = await supabase.from('joborder_resources').update(payload).eq('job_order_resource_id', childEditingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('joborder_resources').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Resource assignment saved successfully!');
      } else if (activeChildTab === 'contracts') {
        const qtyVal = Number(contractForm.qty) || 0;
        const unitPriceVal = Number(contractForm.unit_price) || 0;
        const listPriceVal = Number(contractForm.list_price) || 0;

        const payload = {
          job_order_id: currentJobOrder.job_order_id,
          contract_decription: contractForm.contract_decription,
          qty: qtyVal,
          unit_price: unitPriceVal,
          list_price: listPriceVal,
          line_total: Number((qtyVal * unitPriceVal).toFixed(2)),
          reference_total: Number((qtyVal * listPriceVal).toFixed(2))
        };

        if (childEditingId) {
          const { error } = await supabase.from('joborder_contract').update(payload).eq('job_order_matls_id', childEditingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('joborder_contract').insert([payload]);
          if (error) throw error;
        }
        setSuccessMsg('Contracted Job saved successfully!');
      }

      setIsChildModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      const [tdRes, mRes, rRes, cRes] = await Promise.all([
        supabase.from('joborder_task_details').select('*').eq('job_order_id', currentJobOrder.job_order_id),
        supabase.from('joborder_materials').select('*').eq('job_order_id', currentJobOrder.job_order_id),
        supabase.from('joborder_resources').select('*').eq('job_order_id', currentJobOrder.job_order_id),
        supabase.from('joborder_contract').select('*').eq('job_order_id', currentJobOrder.job_order_id)
      ]);
      setTaskDetails(tdRes.data || []);
      setMaterials(mRes.data || []);
      setResources(rRes.data || []);
      setContracts(cRes.data || []);

      await recalculateAndSaveJobOrderCosts(currentJobOrder.job_order_id);
    } catch (err) {
      console.error('Error saving child record:', err);
      setErrorMsg('Failed to save record.');
    }
  };

  // NATIVE CSV/TSV UPLOAD HANDLER
  const handleMaterialsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentJobOrder) return;
    setErrorMsg(null);

    try {
      const text = await file.text();
      const lines = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      if (lines.length <= 1) {
        setErrorMsg('Uploaded file is empty or missing data rows.');
        return;
      }

      const headerLine = lines[0];
      const delimiter = headerLine.includes('\t') ? '\t' : headerLine.includes(';') ? ';' : ',';
      const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

      const newMaterials = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length > 0 && cols.some(c => c !== '')) {
          const rowObj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = cols[idx] ?? '';
          });

          const rawStockId = String(rowObj['stock_id'] || '').trim();
          const stock_id = isValidUuid(rawStockId) ? rawStockId : null;
          const stock_code = rowObj['stock_code'] || null;
          const part_number = rowObj['part_number'] || null;
          const qty = Number(rowObj['qty']) || 0;
          const unit_price = Number(rowObj['unit_price']) || 0;
          const list_price = Number(rowObj['list_price']) || 0;
          const unit_of_measure = rowObj['unit_of_measure'] || 'pc';

          newMaterials.push({
            job_order_id: currentJobOrder.job_order_id,
            stock_id,
            stock_code,
            part_number,
            qty,
            unit_price,
            list_price,
            unit_of_measure,
            line_total: Number((qty * unit_price).toFixed(2)),
            reference_total: Number((qty * list_price).toFixed(2))
          });
        }
      }

      if (newMaterials.length === 0) {
        setErrorMsg('No valid material rows found in file.');
        return;
      }

      const { error: delError } = await supabase
        .from('joborder_materials')
        .delete()
        .eq('job_order_id', currentJobOrder.job_order_id);
      if (delError) throw delError;

      const { error: insError } = await supabase
        .from('joborder_materials')
        .insert(newMaterials);
      if (insError) throw insError;

      setSuccessMsg(`Successfully imported ${newMaterials.length} materials from ${file.name}!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setIsChildModalOpen(false);

      const mRes = await supabase
        .from('joborder_materials')
        .select('*')
        .eq('job_order_id', currentJobOrder.job_order_id);
      setMaterials(mRes.data || []);

      await recalculateAndSaveJobOrderCosts(currentJobOrder.job_order_id);
    } catch (err) {
      console.error('Error processing upload:', err);
      setErrorMsg('Failed to process and save uploaded materials.');
    }
  };

  const matchedStatus = statuses.find(s => s.status_id === currentJobOrder?.status_id);
  const matchedPriority = priorities.find(p => p.priority_id === currentJobOrder?.priority_id);
  const matchedSupervisor = employees.find(e => e.employee_id === currentJobOrder?.assigned_supervisor);

  const statusNameLower = matchedStatus?.status_name?.toLowerCase() || '';
  const isStatusCompleted = statusNameLower === 'completed';
  const isStatusCancelled = statusNameLower === 'cancelled';

  const filteredSupervisors = employees.filter(emp => {
    if (!emp.is_active || !emp.is_supervisor) return false;
    const name = emp.employee_name || emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`;
    return name.toLowerCase().includes(supervisorSearchQuery.toLowerCase());
  });

  const filteredTaskStandards = taskStandards.filter(ts => 
    ts.task_standard_desc.toLowerCase().includes(taskStandardSearchQuery.toLowerCase())
  );

  return (
    <div className="p-6 w-full max-w-7xl mx-auto space-y-6 max-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
            <ClipboardCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Job Order Management</h1>
            <p className="text-sm text-slate-400">Manage Job Order and associated Tasks, Materials, Resources, and Contracted Jobs.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddHeader}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            <span>New Job Order</span>
          </button>
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

      {/* HEADER CARD (Collapsible Single Record Viewer - Main Panel) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold uppercase tracking-wider text-blue-400 bg-blue-950/50 border border-blue-800/60 px-4 py-1.5 rounded-xl shadow-inner">
              {currentJobOrder ? `JO #${currentJobOrder.job_order_no}` : 'No JO Selected'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenJobOrderSearch}
              className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg"
            >
              <Search className="w-3.5 h-3.5" /> Search Job Order
            </button>
            <button
              onClick={handleOpenEditHeader}
              disabled={!currentJobOrder || isStatusCompleted || isStatusCancelled}
              className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Job Order
            </button>
            <button
              onClick={handleDeleteHeader}
              disabled={!currentJobOrder || isStatusCompleted}
              className="text-xs text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Job Order
            </button>
            {currentJobOrder && (
              <button
                onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1 cursor-pointer bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
                title={isHeaderCollapsed ? "Expand Header" : "Collapse Header"}
              >
                {isHeaderCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                <span>{isHeaderCollapsed ? "Expand" : "Collapse"}</span>
              </button>
            )}
          </div>
        </div>

        {!currentJobOrder ? (
          <div className="p-12 text-center text-slate-500">No job order loaded. Click "Search Job Order" above or create a new one to begin.</div>
        ) : !isHeaderCollapsed ? (
          <div className="space-y-4 pt-2">
            {/* ALIGNED 4-COLUMN DETAILS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm items-start">
              <div className="space-y-1">
                <span className="block text-xs font-semibold uppercase text-slate-500">Equipment</span>
                <span className="text-blue-400 font-bold block">
                  {selectedPickerVehicle?.plate_no || '—'}
                </span>
                <span className="text-xs text-slate-400 block">
                  {selectedPickerVehicle 
                    ? `${selectedPickerVehicle.make_name || ''} ${selectedPickerVehicle.model_name ? `/ ${selectedPickerVehicle.model_name}` : ''} (${selectedPickerVehicle.type_description || 'N/A'})` 
                    : '—'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="block text-xs font-semibold uppercase text-slate-500">Status</span>
                <span className="text-emerald-400 font-medium block">{matchedStatus ? matchedStatus.status_name : '—'}</span>
              </div>

              <div className="space-y-1">
                <span className="block text-xs font-semibold uppercase text-slate-500">Priority</span>
                <span className="text-amber-400 font-medium block">{matchedPriority ? matchedPriority.priority_desc : '—'}</span>
              </div>

              <div className="space-y-1">
                <span className="block text-xs font-semibold uppercase text-slate-500">Expected Completion</span>
                <span className="text-slate-200 font-mono block">{currentJobOrder.expected_completion || '—'}</span>
              </div>

              <div className="space-y-1">
                <span className="block text-xs font-semibold uppercase text-slate-500">Supervisor</span>
                <span className="text-slate-200 block">
                  {matchedSupervisor ? (matchedSupervisor.employee_name || matchedSupervisor.name || `${matchedSupervisor.first_name || ''} ${matchedSupervisor.last_name || ''}`) : '—'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="block text-xs font-semibold uppercase text-slate-500">Odometer Reading</span>
                <span className="text-slate-200 font-mono block">{currentJobOrder.odo_rdg ?? 0}</span>
              </div>

              <div className="space-y-1">
                <span className="block text-xs font-semibold uppercase text-slate-500">Dates (Started / Completed)</span>
                <span className="text-slate-200 font-mono block">{currentJobOrder.date_started || '—'} / {currentJobOrder.date_completed || '—'}</span>
              </div>

              <div className="space-y-1">
                <span className="block text-xs font-bold uppercase text-emerald-400">Total Cost</span>
                <span className="text-emerald-400 font-mono text-base font-bold block">₱{(currentJobOrder.total_cost ?? 0).toFixed(2)}</span>
              </div>
            </div>

            {/* ALIGNED GROUPED COST AREA */}
            <div className="pt-3 border-t border-slate-800/80">
              <span className="block text-xs font-semibold uppercase text-slate-400 mb-2.5 tracking-wider">Cost Summary</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 items-center">
                <div className="space-y-1">
                  <span className="block text-xs font-semibold uppercase text-slate-500">Labor Cost</span>
                  <span className="text-slate-200 font-mono block">₱{(currentJobOrder.labor_cost ?? 0).toFixed(2)}</span>
                </div>

                <div className="space-y-1">
                  <span className="block text-xs font-semibold uppercase text-slate-500">Materials Cost</span>
                  <span className="text-slate-200 font-mono block">₱{(currentJobOrder.materials_cost ?? 0).toFixed(2)}</span>
                </div>

                <div className="space-y-1">
                  <span className="block text-xs font-semibold uppercase text-slate-500">Contract Cost</span>
                  <span className="text-slate-200 font-mono block">₱{(currentJobOrder.contract_cost ?? 0).toFixed(2)}</span>
                </div>

                <div className="space-y-1">
                  <span className="block text-xs font-bold uppercase text-emerald-400">Total Cost</span>
                  <span className="text-emerald-400 font-mono text-base font-bold block">₱{(currentJobOrder.total_cost ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* CHILD TABS SECTION */}
      {currentJobOrder && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveChildTab('tasks')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeChildTab === 'tasks' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Task Details ({taskDetails.length})</span>
              </button>

              <button
                onClick={() => setActiveChildTab('materials')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeChildTab === 'materials' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Materials ({materials.length})</span>
              </button>

              <button
                onClick={() => setActiveChildTab('resources')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeChildTab === 'resources' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Resources ({resources.length})</span>
              </button>

              <button
                onClick={() => setActiveChildTab('contracts')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeChildTab === 'contracts' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Contracted Jobs ({contracts.length})</span>
              </button>
            </div>

            <button
              onClick={handleOpenAddChild}
              disabled={!currentJobOrder || isStatusCompleted || isStatusCancelled}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Details</span>
            </button>
          </div>

          {/* Scrollable Container with Sticky Table Headers */}
          <div className="overflow-y-auto overflow-x-auto max-h-[calc(100vh-360px)] border border-slate-800/60 rounded-lg">
            {/* CHILD TAB 1: TASK DETAILS */}
            {activeChildTab === 'tasks' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                    <th className="p-3">Task Standard Description</th>
                    <th className="p-3">Standard Time (m)</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {taskDetails.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-500">No task details found for this job order.</td>
                    </tr>
                  ) : (
                    taskDetails.map((item) => {
                      const matchedStd = taskStandards.find(ts => ts.task_standard_id === item.task_standard_id);
                      return (
                        <tr key={item.job_order_task_id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="p-3 font-semibold text-slate-100">{matchedStd ? matchedStd.task_standard_desc : 'Task'}</td>
                          <td className="p-3 font-mono">{item.standard_time ?? '—'}</td>
                          <td className="p-3 text-right space-x-3">
                            <button
                              onClick={() => handleOpenEditChild(item)}
                              disabled={isStatusCompleted || isStatusCancelled}
                              className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteChild(item.job_order_task_id, 'joborder_task_details', 'job_order_task_id')}
                              disabled={isStatusCompleted || isStatusCancelled}
                              className="text-xs text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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

            {/* CHILD TAB 2: MATERIALS */}
            {activeChildTab === 'materials' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                    <th className="p-3">Stock Code</th>
                    <th className="p-3">Part Number</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3">List Price</th>
                    <th className="p-3">Line Total</th>
                    <th className="p-3">Reference Total</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">No materials recorded for this job order. Use "Add Details" above to upload materials via CSV.</td>
                    </tr>
                  ) : (
                    materials.map((item) => (
                      <tr key={item.job_order_matls_id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-100">{item.stock_code || '—'}</td>
                        <td className="p-3 text-slate-400">{item.part_number || '—'}</td>
                        <td className="p-3 font-mono">{item.qty ?? 0} {item.unit_of_measure || ''}</td>
                        <td className="p-3 font-mono">₱{(item.unit_price ?? 0).toFixed(2)}</td>
                        <td className="p-3 font-mono">₱{(item.list_price ?? 0).toFixed(2)}</td>
                        <td className="p-3 font-mono text-emerald-400">₱{(item.line_total ?? 0).toFixed(2)}</td>
                        <td className="p-3 font-mono text-blue-400">₱{(item.reference_total ?? 0).toFixed(2)}</td>
                        <td className="p-3 text-right space-x-3">
                          <button
                            onClick={() => handleDeleteChild(item.job_order_matls_id, 'joborder_materials', 'job_order_matls_id')}
                            disabled={isStatusCompleted || isStatusCancelled}
                            className="text-xs text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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

            {/* CHILD TAB 3: RESOURCES */}
            {activeChildTab === 'resources' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Assigned Date</th>
                    <th className="p-3">Charged Time (h)</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3">Sell Rate</th>
                    <th className="p-3">Line Total</th>
                    <th className="p-3">Reference Total</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {resources.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">No resources assigned to this job order.</td>
                    </tr>
                  ) : (
                    resources.map((item) => {
                      const matchedEmp = employees.find(e => e.employee_id === item.employee_id);
                      return (
                        <tr key={item.job_order_resource_id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="p-3 font-semibold text-slate-100">{matchedEmp ? (matchedEmp.employee_name || matchedEmp.name || `${matchedEmp.first_name || ''} ${matchedEmp.last_name || ''}`) : 'Employee'}</td>
                          <td className="p-3 font-mono text-slate-400">{item.assigned_date}</td>
                          <td className="p-3 font-mono">{item.charged_time}</td>
                          <td className="p-3 font-mono">₱{(item.ee_rate ?? 0).toFixed(2)}</td>
                          <td className="p-3 font-mono">₱{(item.ee_sell_rate ?? 0).toFixed(2)}</td>
                          <td className="p-3 font-mono text-emerald-400">₱{(item.ee_line_total ?? 0).toFixed(2)}</td>
                          <td className="p-3 font-mono text-blue-400">₱{(item.ee_reference_total ?? 0).toFixed(2)}</td>
                          <td className="p-3 text-right space-x-3">
                            <button
                              onClick={() => handleOpenEditChild(item)}
                              disabled={isStatusCompleted || isStatusCancelled}
                              className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteChild(item.job_order_resource_id, 'joborder_resources', 'job_order_resource_id')}
                              disabled={isStatusCompleted || isStatusCancelled}
                              className="text-xs text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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

            {/* CHILD TAB 4: CONTRACTED JOBS */}
            {activeChildTab === 'contracts' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                    <th className="p-3">Contract Description</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3">List Price</th>
                    <th className="p-3">Line Total</th>
                    <th className="p-3">Reference Total</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {contracts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">No contracted jobs added yet. Click "Add Details" above to add one.</td>
                    </tr>
                  ) : (
                    contracts.map((item) => (
                      <tr key={item.job_order_matls_id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-100">{item.contract_decription || '—'}</td>
                        <td className="p-3 font-mono">{item.qty ?? 0}</td>
                        <td className="p-3 font-mono">₱{(item.unit_price ?? 0).toFixed(2)}</td>
                        <td className="p-3 font-mono">₱{(item.list_price ?? 0).toFixed(2)}</td>
                        <td className="p-3 font-mono text-emerald-400">₱{(item.line_total ?? 0).toFixed(2)}</td>
                        <td className="p-3 font-mono text-blue-400">₱{(item.reference_total ?? 0).toFixed(2)}</td>
                        <td className="p-3 text-right space-x-3">
                          <button
                            onClick={() => handleOpenEditChild(item)}
                            disabled={isStatusCompleted || isStatusCancelled}
                            className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteChild(item.job_order_matls_id, 'joborder_contract', 'job_order_matls_id')}
                            disabled={isStatusCompleted || isStatusCancelled}
                            className="text-xs text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
      )}

      {/* JOB ORDER SEARCH PICKER MODAL */}
      {showJobOrderPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
              <h3 className="text-lg font-semibold text-slate-100">Search Job Order</h3>
              <button
                type="button"
                onClick={() => setShowJobOrderPicker(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJobOrderSearchSubmit} className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Job Order No or Plate Number..."
                  value={jobOrderSearchQuery}
                  onChange={(e) => setJobOrderSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                required
                value={jobOrderSearchStatus}
                onChange={(e) => setJobOrderSearchStatus(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map(s => (
                  <option key={s.status_id} value={s.status_id}>{s.status_name}</option>
                ))}
              </select>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {loadingJobOrders ? (
                <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span>Loading job orders...</span>
                </div>
              ) : pickerJobOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  {jobOrderSearchQuery.trim() ? 'No job orders found matching your criteria.' : 'Enter a search term and click Search to find job orders.'}
                </div>
              ) : (
                pickerJobOrders.map((jo, index) => {
                  const sObj = statuses.find(s => s.status_id === jo.status_id);
                  const vInfo = pickerVehicleMap[jo.vehicle_id];
                  return (
                    <div
                      key={jo.job_order_id || index}
                      onClick={() => {
                        setJobOrders([jo]);
                        setCurrentIndex(0);
                        setShowJobOrderPicker(false);
                      }}
                      className="flex items-center justify-between bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-600/50 p-3 rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 rounded-lg group-hover:bg-blue-900/40 text-blue-400 transition-colors">
                          <ClipboardCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-blue-400 flex items-center gap-2">
                            <span>JO #{jo.job_order_no}</span>
                            {vInfo && (
                              <span className="text-xs bg-slate-900 text-slate-200 px-2 py-0.5 rounded font-mono border border-slate-800">
                                {vInfo.plate_no}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-300 mt-0.5">
                            {vInfo 
                              ? `${vInfo.make_name || ''} ${vInfo.model_name ? `/ ${vInfo.model_name}` : ''} (${vInfo.type_description || 'N/A'})` 
                              : '—'}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Expected: {jo.expected_completion} {sObj ? `• Status: ${sObj.status_name}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 uppercase">Total Cost</span>
                        <div className="text-sm font-semibold text-emerald-400">₱{(jo.total_cost ?? 0).toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER FORM MODAL */}
      {isHeaderModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-slate-950">
              <h3 className="text-lg font-bold text-slate-100">
                {isHeaderEditing ? `Edit Job Order #${currentJobOrder?.job_order_no}` : 'New Job Order'}
              </h3>
              <button onClick={() => setIsHeaderModalOpen(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitHeader} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Selected Equipment <span className="text-red-500">*</span>
                  </label>
                  {selectedPickerVehicle ? (
                    <div className="flex items-center justify-between bg-slate-950 border border-blue-900/60 p-3 rounded-xl">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full text-xs">
                        <div>
                          <span className="text-slate-400 uppercase">Plate Number</span>
                          <div className="font-bold text-blue-400 text-sm">{selectedPickerVehicle.plate_no}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase">Make / Model</span>
                          <div className="font-semibold text-slate-100">{selectedPickerVehicle.make_name || 'N/A'} {selectedPickerVehicle.model_name ? `/ ${selectedPickerVehicle.model_name}` : ''}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase">Type</span>
                          <div className="font-semibold text-slate-100">{selectedPickerVehicle.type_description || 'N/A'}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPickerVehicle(null);
                          setHeaderForm({ ...headerForm, vehicle_id: '', odo_rdg: '0' });
                        }}
                        className="text-slate-400 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                        title="Change Equipment"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowVehiclePicker(true)}
                      className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500 text-slate-300 px-4 py-3 rounded-xl text-sm flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-blue-400" />
                        {pickerVehicles.length > 0 ? 'Click here to search and select a Equipment...' : 'Click here to select a Equipment...'}
                      </span>
                      <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded font-medium">Browse</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Status</label>
                    <select
                      required
                      value={headerForm.status_id}
                      onChange={(e) => {
                        const selectedStatusId = e.target.value;
                        const selectedStatus = statuses.find(s => s.status_id === selectedStatusId);
                        const isCompleted = selectedStatus?.status_name?.toLowerCase() === 'completed';
                        const todayStr = new Date().toISOString().split('T')[0];

                        setHeaderForm(prev => ({
                          ...prev,
                          status_id: selectedStatusId,
                          date_completed: isCompleted ? (prev.date_completed || todayStr) : ''
                        }));
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Status</option>
                      {statuses.map(s => (
                        <option key={s.status_id} value={s.status_id}>{s.status_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Priority</label>
                    <select
                      required
                      value={headerForm.priority_id}
                      onChange={(e) => setHeaderForm({ ...headerForm, priority_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Priority</option>
                      {priorities.map(p => (
                        <option key={p.priority_id} value={p.priority_id}>{p.priority_desc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative" ref={supervisorDropdownRef}>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Assigned Supervisor</label>
                    <div 
                      onClick={() => setShowSupervisorDropdown(true)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 flex items-center justify-between cursor-pointer focus-within:border-blue-500"
                    >
                      <input
                        type="text"
                        placeholder="Search or select supervisor..."
                        value={supervisorSearchQuery}
                        onChange={(e) => {
                          setSupervisorSearchQuery(e.target.value);
                          setShowSupervisorDropdown(true);
                        }}
                        onFocus={() => setShowSupervisorDropdown(true)}
                        className="bg-transparent w-full focus:outline-none text-slate-200 text-sm cursor-pointer"
                      />
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    </div>

                    {showSupervisorDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto">
                        <div 
                          onClick={() => {
                            setHeaderForm({ ...headerForm, assigned_supervisor: '' });
                            setSupervisorSearchQuery('');
                            setShowSupervisorDropdown(false);
                          }}
                          className="px-4 py-2.5 text-xs text-slate-400 hover:bg-slate-900 cursor-pointer border-b border-slate-800"
                        >
                          -- Clear Selection --
                        </div>
                        {filteredSupervisors.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-slate-500 text-center">No active supervisors found.</div>
                        ) : (
                          filteredSupervisors.map(emp => {
                            const empName = emp.employee_name || emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`;
                            return (
                              <div
                                key={emp.employee_id}
                                onClick={() => {
                                  setHeaderForm({ ...headerForm, assigned_supervisor: emp.employee_id });
                                  setSupervisorSearchQuery(empName);
                                  setShowSupervisorDropdown(false);
                                }}
                                className="px-4 py-2.5 text-sm text-slate-200 hover:bg-blue-950/40 hover:text-blue-400 cursor-pointer transition-colors"
                              >
                                {empName}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Expected Completion</label>
                    <div className="relative">
                      <input
                        ref={expectedCompletionRef}
                        type="date"
                        required
                        value={headerForm.expected_completion || ''}
                        onChange={(e) => setHeaderForm({ ...headerForm, expected_completion: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (expectedCompletionRef.current) {
                            const input = expectedCompletionRef.current as HTMLInputElement & { showPicker?: () => void };
                            if (typeof input.showPicker === 'function') {
                              input.showPicker();
                            } else {
                              input.focus();
                            }
                          }
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Date Started</label>
                    <div className="relative">
                      <input
                        ref={dateStartedRef}
                        type="date"
                        value={headerForm.date_started || ''}
                        onChange={(e) => setHeaderForm({ ...headerForm, date_started: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (dateStartedRef.current) {
                            const input = dateStartedRef.current as HTMLInputElement & { showPicker?: () => void };
                            if (typeof input.showPicker === 'function') {
                              input.showPicker();
                            } else {
                              input.focus();
                            }
                          }
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Date Completed</label>
                    <input
                      type="date"
                      readOnly
                      value={headerForm.date_completed || ''}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Odometer Reading</label>
                    <input
                      type="number"
                      readOnly
                      value={headerForm.odo_rdg}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-950">
                <button
                  type="button"
                  onClick={() => setIsHeaderModalOpen(false)}
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

      {/* VEHICLE PICKER MODAL */}
      {showVehiclePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
              <h3 className="text-lg font-semibold text-slate-100">Select Equipment</h3>
              <button
                type="button"
                onClick={() => setShowVehiclePicker(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVehicleSearchSubmit} className="p-4 border-b border-slate-800 bg-slate-950/50 flex gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by Plate Number..."
                  value={vehicleSearchQuery}
                  onChange={(e) => setVehicleSearchQuery(e.target.value)}
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

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {loadingVehicles ? (
                <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span>Loading Equipment records...</span>
                </div>
              ) : pickerVehicles.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  No Equipment records found.
                </div>
              ) : (
                pickerVehicles.map((v, index) => (
                  <div
                    key={v.id || v.vehicle_id || index}
                    onClick={() => {
                      setSelectedPickerVehicle(v);
                      const odoReading = v.service_rdg ?? v.srv_rdg ?? 0;
                      setHeaderForm(prev => ({ 
                        ...prev, 
                        vehicle_id: v.id || v.vehicle_id || '',
                        odo_rdg: String(odoReading)
                      }));
                      setShowVehiclePicker(false);
                    }}
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
                      <div className="text-sm font-semibold text-slate-200">{v.service_rdg ?? v.srv_rdg ?? '0'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHILD FORM MODAL */}
      {isChildModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-visible">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-slate-950 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-100">
                {childEditingId ? 'Edit Details' : 'Add Details'} ({activeChildTab === 'contracts' ? 'Contracted Job' : activeChildTab})
              </h3>
              <button onClick={() => setIsChildModalOpen(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitChildForm} className="flex flex-col flex-1 overflow-visible">
              <div className="p-6 overflow-visible space-y-4 flex-1">
                {activeChildTab === 'tasks' && (
                  <>
                    <div className="relative" ref={taskStandardDropdownRef}>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Task Standard</label>
                      <div 
                        onClick={() => setShowTaskStandardDropdown(true)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 flex items-center justify-between cursor-pointer focus-within:border-blue-500"
                      >
                        <input
                          type="text"
                          placeholder="Type to search..."
                          value={taskStandardSearchQuery}
                          onChange={(e) => {
                            setTaskStandardSearchQuery(e.target.value);
                            setShowTaskStandardDropdown(true);
                            if (!e.target.value) {
                              setTaskDetailForm({ task_standard_id: '', standard_time: '' });
                            }
                          }}
                          onFocus={() => setShowTaskStandardDropdown(true)}
                          className="bg-transparent w-full focus:outline-none text-slate-200 text-sm cursor-pointer"
                        />
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      </div>

                      {showTaskStandardDropdown && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto">
                          <div 
                            onClick={() => {
                              setTaskDetailForm({ task_standard_id: '', standard_time: '' });
                              setTaskStandardSearchQuery('');
                              setShowTaskStandardDropdown(false);
                            }}
                            className="px-4 py-2.5 text-xs text-slate-400 hover:bg-slate-900 cursor-pointer border-b border-slate-800"
                          >
                            -- Clear Selection --
                          </div>
                          {filteredTaskStandards.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-slate-500 text-center">No task standards found.</div>
                          ) : (
                            filteredTaskStandards.map(ts => (
                              <div
                                key={ts.task_standard_id}
                                onClick={() => {
                                  const timeVal = ts.standard_time ?? ts.std_time ?? 0;
                                  setTaskDetailForm({
                                    task_standard_id: ts.task_standard_id,
                                    standard_time: String(timeVal)
                                  });
                                  setTaskStandardSearchQuery(ts.task_standard_desc);
                                  setShowTaskStandardDropdown(false);
                                }}
                                className="px-4 py-2.5 text-sm text-slate-200 hover:bg-blue-950/40 hover:text-blue-400 cursor-pointer transition-colors"
                              >
                                {ts.task_standard_desc}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Standard Time (mins)</label>
                      <input
                        type="number"
                        readOnly
                        value={taskDetailForm.standard_time}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {activeChildTab === 'materials' && (
                  <div className="space-y-4">
                    <div className="bg-slate-950 border border-dashed border-slate-700 p-6 rounded-xl text-center space-y-3">
                      <div className="mx-auto w-10 h-10 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">Upload Materials File</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Upload a CSV or TSV file containing header columns: <code className="text-blue-400">stock_id, stock_code, part_number, qty, unit_price, list_price, unit_of_measure</code>.
                        </p>
                      </div>
                      <div>
                        <input
                          type="file"
                          accept=".csv, .tsv, .txt"
                          onChange={handleMaterialsFileUpload}
                          className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeChildTab === 'resources' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Associated Task</label>
                      <select
                        required
                        value={resourceForm.job_order_task_id}
                        onChange={(e) => setResourceForm({ ...resourceForm, job_order_task_id: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Task Detail</option>
                        {taskDetails.map(td => {
                          const tsObj = taskStandards.find(s => s.task_standard_id === td.task_standard_id);
                          return (
                            <option key={td.job_order_task_id} value={td.job_order_task_id}>
                              {tsObj ? tsObj.task_standard_desc : 'Task'}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Employee</label>
                      <select
                        required
                        value={resourceForm.employee_id}
                        onChange={(e) => {
                          setResourceForm({ ...resourceForm, employee_id: e.target.value });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.employee_name || emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Assigned Date</label>
                        <input
                          type="date"
                          required
                          value={resourceForm.assigned_date}
                          onChange={(e) => setResourceForm({ ...resourceForm, assigned_date: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Charged Time (h)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={resourceForm.charged_time}
                          onChange={(e) => setResourceForm({ ...resourceForm, charged_time: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeChildTab === 'contracts' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Contract Description</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Enter contracted job description..."
                        value={contractForm.contract_decription}
                        onChange={(e) => setContractForm({ ...contractForm, contract_decription: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Qty</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={contractForm.qty}
                          onChange={(e) => setContractForm({ ...contractForm, qty: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Unit Price (₱)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={contractForm.unit_price}
                          onChange={(e) => setContractForm({ ...contractForm, unit_price: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">List Price (₱)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={contractForm.list_price}
                          onChange={(e) => setContractForm({ ...contractForm, list_price: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {activeChildTab !== 'materials' && (
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-950 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => setIsChildModalOpen(false)}
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
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobOrder;






// import { useState, useEffect, useRef } from 'react';
// import { supabase } from '@/lib/supabaseClient';
// import { 
//   ClipboardCheck, 
//   Plus, 
//   CheckCircle, 
//   AlertCircle, 
//   X,
//   Edit2,
//   Trash2,
//   Layers,
//   Wrench,
//   Users,
//   Search,
//   Car,
//   Loader2,
//   ChevronDown,
//   ChevronUp,
//   Calendar,
//   Upload
// } from 'lucide-react';

// interface JobOrderMasterRecord {
//   job_order_id: string;
//   job_order_no: number;
//   vehicle_id: string;
//   status_id: string;
//   priority_id: string;
//   expected_completion: string;
//   date_started: string | null;
//   date_completed: string | null;
//   assigned_supervisor: string | null;
//   requestor: string | null;
//   approver: string | null;
//   labor_cost: number;
//   materials_cost: number;
//   total_cost: number;
//   has_changes: boolean;
//   odo_rdg: number;
//   contract_cost: number;
//   created_at: string;
//   updated_at: string;
//   [key: string]: unknown;
// }

// interface JobOrderTaskDetailRecord {
//   job_order_task_id: string;
//   job_order_id: string;
//   task_standard_id: string;
//   standard_time: number | null;
//   created_at: string;
//   updated_at: string;
//   [key: string]: unknown;
// }

// interface JobOrderMaterialRecord {
//   job_order_matls_id: string;
//   job_order_id: string;
//   stock_id: string | null;
//   stock_code: string | null;
//   part_number: string | null;
//   qty: number | null;
//   unit_price: number | null;
//   list_price: number | null;
//   unit_of_measure: string | null;
//   line_total: number | null;
//   reference_total: number | null;
//   [key: string]: unknown;
// }

// interface JobOrderResourceRecord {
//   job_order_resource_id: string;
//   job_order_task_id: string;
//   employee_id: string;
//   job_order_id: string;
//   charged_time: number;
//   ee_rate: number | null;
//   ee_sell_rate: number | null;
//   ee_line_total: number | null;
//   ee_reference_total: number | null;
//   task_standard_id: string;
//   assigned_date: string;
//   [key: string]: unknown;
// }

// interface VehiclePm {
//   plate_no?: string;
//   service_rdg?: number | null;
//   make_name?: string | null;
//   model_name?: string | null;
//   type_description?: string | null;
//   id?: string;
//   vehicle_id?: string;
//   [key: string]: unknown;
// }

// interface EmployeeRecord {
//   employee_id: string;
//   employee_name?: string;
//   name?: string;
//   first_name?: string;
//   last_name?: string;
//   rate_per_hour?: number;
//   sell_rate_per_hour?: number;
//   hourly_rate?: number;
//   rate?: number;
//   is_active?: boolean;
//   is_supervisor?: boolean;
//   [key: string]: unknown;
// }

// interface TaskStandardRecord {
//   task_standard_id: string;
//   task_standard_desc: string;
//   standard_time?: number | null;
//   std_time?: number | null;
//   [key: string]: unknown;
// }

// // Helper function to validate UUID strings
// const isValidUuid = (str: string | null | undefined): boolean => {
//   if (!str) return false;
//   return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
// };

// async function fetchVehicleDetails(vId: string | null): Promise<VehiclePm | null> {
//   if (!vId) return null;
//   try {
//     const { data: d1 } = await supabase.from('vw_vehicle_pm_details').select('*').eq('vehicle_id', vId).maybeSingle();
//     if (d1) return d1;

//     const { data: d2 } = await supabase.from('vw_vehicle_pm_details').select('*').eq('id', vId).maybeSingle();
//     if (d2) return d2;

//     const { data: d3 } = await supabase.from('vehicles').select('*').eq('vehicle_id', vId).maybeSingle();
//     if (d3) return d3;

//     const { data: d4 } = await supabase.from('vehicles').select('*').eq('id', vId).maybeSingle();
//     if (d4) return d4;

//     return null;
//   } catch (err) {
//     console.error('Error fetching vehicle details:', err);
//     return null;
//   }
// }

// export function JobOrder() {
//   const [jobOrders, setJobOrders] = useState<JobOrderMasterRecord[]>([]);
//   const [currentIndex, setCurrentIndex] = useState<number>(0);
//   const currentJobOrder = jobOrders[currentIndex] || null;

//   const jobOrderId = currentJobOrder?.job_order_id;
//   const vehicleId = currentJobOrder?.vehicle_id;

//   const [activeChildTab, setActiveChildTab] = useState<'tasks' | 'materials' | 'resources'>('tasks');
//   const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);

//   const [statuses, setStatuses] = useState<{ status_id: string; status_name: string }[]>([]);
//   const [priorities, setPriorities] = useState<{ priority_id: string; priority_desc: string }[]>([]);
//   const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
//   const [taskStandards, setTaskStandards] = useState<TaskStandardRecord[]>([]);

//   const [pickerVehicles, setPickerVehicles] = useState<VehiclePm[]>([]);
//   const [loadingVehicles, setLoadingVehicles] = useState<boolean>(false);
//   const [showVehiclePicker, setShowVehiclePicker] = useState<boolean>(false);
//   const [vehicleSearchQuery, setVehicleSearchQuery] = useState<string>('');
//   const [selectedPickerVehicle, setSelectedPickerVehicle] = useState<VehiclePm | null>(null);

//   const [showJobOrderPicker, setShowJobOrderPicker] = useState<boolean>(false);
//   const [pickerJobOrders, setPickerJobOrders] = useState<JobOrderMasterRecord[]>([]);
//   const [pickerVehicleMap, setPickerVehicleMap] = useState<Record<string, VehiclePm>>({});
//   const [loadingJobOrders, setLoadingJobOrders] = useState<boolean>(false);
//   const [jobOrderSearchQuery, setJobOrderSearchQuery] = useState<string>('');
//   const [jobOrderSearchStatus, setJobOrderSearchStatus] = useState<string>('');

//   const [supervisorSearchQuery, setSupervisorSearchQuery] = useState<string>('');
//   const [showSupervisorDropdown, setShowSupervisorDropdown] = useState<boolean>(false);
//   const supervisorDropdownRef = useRef<HTMLDivElement>(null);

//   const [taskStandardSearchQuery, setTaskStandardSearchQuery] = useState<string>('');
//   const [showTaskStandardDropdown, setShowTaskStandardDropdown] = useState<boolean>(false);
//   const taskStandardDropdownRef = useRef<HTMLDivElement>(null);

//   const expectedCompletionRef = useRef<HTMLInputElement>(null);
//   const dateStartedRef = useRef<HTMLInputElement>(null);

//   const [taskDetails, setTaskDetails] = useState<JobOrderTaskDetailRecord[]>([]);
//   const [materials, setMaterials] = useState<JobOrderMaterialRecord[]>([]);
//   const [resources, setResources] = useState<JobOrderResourceRecord[]>([]);

//   const [errorMsg, setErrorMsg] = useState<string | null>(null);
//   const [successMsg, setSuccessMsg] = useState<string | null>(null);

//   const [isHeaderModalOpen, setIsHeaderModalOpen] = useState<boolean>(false);
//   const [isHeaderEditing, setIsHeaderEditing] = useState<boolean>(false);
//   const [headerForm, setHeaderForm] = useState({
//     vehicle_id: '',
//     status_id: '',
//     priority_id: '',
//     expected_completion: '',
//     date_started: '',
//     date_completed: '',
//     assigned_supervisor: '',
//     labor_cost: '0',
//     materials_cost: '0',
//     total_cost: '0',
//     has_changes: false,
//     odo_rdg: '0',
//     contract_cost: '0'
//   });

//   const [isChildModalOpen, setIsChildModalOpen] = useState<boolean>(false);
//   const [childEditingId, setChildEditingId] = useState<string | null>(null);
//   const [taskDetailForm, setTaskDetailForm] = useState({ task_standard_id: '', standard_time: '' });
//   const [resourceForm, setResourceForm] = useState({ job_order_task_id: '', employee_id: '', charged_time: '0', assigned_date: '' });

//   // Recalculate and persist labor_cost, materials_cost, and total_cost
//   const recalculateAndSaveJobOrderCosts = async (targetJobOrderId: string) => {
//     try {
//       const [mRes, rRes, joRes] = await Promise.all([
//         supabase.from('joborder_materials').select('*').eq('job_order_id', targetJobOrderId),
//         supabase.from('joborder_resources').select('*').eq('job_order_id', targetJobOrderId),
//         supabase.from('joborder_master').select('*').eq('job_order_id', targetJobOrderId).maybeSingle()
//       ]);

//       const matList = mRes.data || [];
//       const resList = rRes.data || [];
//       const joRecord = joRes.data;

//       if (!joRecord) return;

//       const newMaterialsCost = matList.reduce((sum, item) => sum + (Number(item.reference_total) || 0), 0);
//       const newLaborCost = resList.reduce((sum, item) => sum + (Number(item.ee_reference_total) || 0), 0);
//       const contractCost = Number(joRecord.contract_cost) || 0;
//       const newTotalCost = newMaterialsCost + newLaborCost + contractCost;

//       const { data: updatedJoData, error: updateError } = await supabase
//         .from('joborder_master')
//         .update({
//           materials_cost: Number(newMaterialsCost.toFixed(2)),
//           labor_cost: Number(newLaborCost.toFixed(2)),
//           total_cost: Number(newTotalCost.toFixed(2))
//         })
//         .eq('job_order_id', targetJobOrderId)
//         .select()
//         .maybeSingle();

//       if (updateError) throw updateError;

//       if (updatedJoData && currentJobOrder && currentJobOrder.job_order_id === targetJobOrderId) {
//         const updatedList = [...jobOrders];
//         updatedList[currentIndex] = updatedJoData;
//         setJobOrders(updatedList);
//       }
//     } catch (err) {
//       console.error('Error recalculating costs:', err);
//     }
//   };

//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (supervisorDropdownRef.current && !supervisorDropdownRef.current.contains(event.target as Node)) {
//         setShowSupervisorDropdown(false);
//       }
//       if (taskStandardDropdownRef.current && !taskStandardDropdownRef.current.contains(event.target as Node)) {
//         setShowTaskStandardDropdown(false);
//       }
//     }
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   useEffect(() => {
//     let isMounted = true;
//     async function loadLookups() {
//       try {
//         const [sRes, pRes, eRes, tsRes] = await Promise.all([
//           supabase.from('joborder_status').select('*'),
//           supabase.from('joborder_priority').select('*'),
//           supabase.from('employees').select('*'),
//           supabase.from('equipment_taskstandards').select('*')
//         ]);

//         if (isMounted) {
//           setStatuses(sRes.data || []);
//           setPriorities(pRes.data || []);
//           setEmployees(eRes.data || []);
//           setTaskStandards(tsRes.data || []);
//         }
//       } catch (err) {
//         console.error('Error loading lookup tables:', err);
//       }
//     }
//     loadLookups();
//     return () => { isMounted = false; };
//   }, []);

//   const fetchPickerVehicles = async (queryToRun?: string) => {
//     try {
//       setLoadingVehicles(true);
//       const activeQuery = queryToRun !== undefined ? queryToRun : vehicleSearchQuery;

//       let query = supabase
//         .from('vw_vehicle_pm_details')
//         .select('*')
//         .order('plate_no', { ascending: true })
//         .limit(50);

//       if (activeQuery.trim()) {
//         query = query.ilike('plate_no', `%${activeQuery.trim()}%`);
//       }

//       const { data, error: fetchError } = await query;
//       if (fetchError) throw fetchError;
//       setPickerVehicles(data || []);
//     } catch (err: unknown) {
//       console.error('Error fetching vehicles:', err);
//     } finally {
//       setLoadingVehicles(false);
//     }
//   };

//   useEffect(() => {
//     let isMounted = true;
//     async function loadInitialVehicles() {
//       try {
//         const { data, error: fetchError } = await supabase
//           .from('vw_vehicle_pm_details')
//           .select('*')
//           .order('plate_no', { ascending: true })
//           .limit(50);

//         if (fetchError) throw fetchError;
//         if (isMounted) setPickerVehicles(data || []);
//       } catch (err: unknown) {
//         if (isMounted) console.error('Error fetching Equipment:', err);
//       }
//     }
//     loadInitialVehicles();
//     return () => { isMounted = false; };
//   }, []);

//   const handleVehicleSearchSubmit = (e: React.SubmitEvent) => {
//     e.preventDefault();
//     fetchPickerVehicles(vehicleSearchQuery);
//   };

//   const fetchPickerJobOrders = async (queryToRun?: string, statusToRun?: string) => {
//     try {
//       setLoadingJobOrders(true);
//       const activeQuery = queryToRun !== undefined ? queryToRun : jobOrderSearchQuery;
//       const activeStatus = statusToRun !== undefined ? statusToRun : jobOrderSearchStatus;

//       const vehicleIds: string[] = [];
//       if (activeQuery.trim()) {
//         const { data: vData } = await supabase
//           .from('vw_vehicle_pm_details')
//           .select('id, vehicle_id')
//           .ilike('plate_no', `%${activeQuery.trim()}%`);
        
//         if (vData) {
//           vData.forEach(v => {
//             if (v.id) vehicleIds.push(v.id);
//             if (v.vehicle_id) vehicleIds.push(v.vehicle_id);
//           });
//         }
//       }

//       let query = supabase
//         .from('joborder_master')
//         .select('*')
//         .order('created_at', { ascending: false })
//         .limit(50);

//       if (activeQuery.trim()) {
//         const numVal = Number(activeQuery.trim());
//         if (!isNaN(numVal) && vehicleIds.length > 0) {
//           query = query.or(`job_order_no.eq.${numVal},vehicle_id.in.(${vehicleIds.join(',')})`);
//         } else if (!isNaN(numVal)) {
//           query = query.or(`job_order_no.eq.${numVal}`);
//         } else if (vehicleIds.length > 0) {
//           query = query.in('vehicle_id', vehicleIds);
//         } else {
//           setPickerJobOrders([]);
//           setPickerVehicleMap({});
//           setLoadingJobOrders(false);
//           return;
//         }
//       }

//       if (activeStatus) {
//         query = query.eq('status_id', activeStatus);
//       }

//       const { data, error: fetchError } = await query;
//       if (fetchError) throw fetchError;
      
//       const fetchedJoList = data || [];
//       const vIdsToFetch = Array.from(new Set(fetchedJoList.map(jo => jo.vehicle_id).filter(Boolean)));
//       const vMap: Record<string, VehiclePm> = {};
      
//       if (vIdsToFetch.length > 0) {
//         const [res1, res2] = await Promise.all([
//           supabase.from('vw_vehicle_pm_details').select('*').in('id', vIdsToFetch),
//           supabase.from('vw_vehicle_pm_details').select('*').in('vehicle_id', vIdsToFetch)
//         ]);

//         const allVehicles = [...(res1.data || []), ...(res2.data || [])];
//         allVehicles.forEach(v => {
//           if (v.id) vMap[v.id] = v;
//           if (v.vehicle_id) vMap[v.vehicle_id] = v;
//         });

//         for (const jo of fetchedJoList) {
//           if (jo.vehicle_id && !vMap[jo.vehicle_id]) {
//             const singleV = await fetchVehicleDetails(jo.vehicle_id);
//             if (singleV) vMap[jo.vehicle_id] = singleV;
//           }
//         }
//       }

//       setPickerVehicleMap(vMap);
//       setPickerJobOrders(fetchedJoList);
//     } catch (err: unknown) {
//       console.error('Error fetching job orders for search:', err);
//     } finally {
//       setLoadingJobOrders(false);
//     }
//   };

//   const handleOpenJobOrderSearch = async () => {
//     const inProgressStatus = statuses.find(s => s.status_name.toLowerCase() === 'in-progress' || s.status_name.toLowerCase() === 'in progress');
//     const defaultStatusId = inProgressStatus ? inProgressStatus.status_id : (statuses[0]?.status_id || '');

//     setJobOrderSearchStatus(defaultStatusId);
//     setJobOrderSearchQuery('');
//     setPickerJobOrders([]);
//     setPickerVehicleMap({});
//     setShowJobOrderPicker(true);
//   };

//   const handleJobOrderSearchSubmit = (e: React.SubmitEvent) => {
//     e.preventDefault();
//     fetchPickerJobOrders(jobOrderSearchQuery, jobOrderSearchStatus);
//   };

//   useEffect(() => {
//     let isMounted = true;

//     async function loadChildRecords() {
//       if (!jobOrderId) {
//         if (isMounted) {
//           setTaskDetails([]);
//           setMaterials([]);
//           setResources([]);
//           setSelectedPickerVehicle(null);
//         }
//         return;
//       }

//       try {
//         const [tdRes, mRes, rRes, vData] = await Promise.all([
//           supabase.from('joborder_task_details').select('*').eq('job_order_id', jobOrderId),
//           supabase.from('joborder_materials').select('*').eq('job_order_id', jobOrderId),
//           supabase.from('joborder_resources').select('*').eq('job_order_id', jobOrderId),
//           fetchVehicleDetails(vehicleId || null)
//         ]);

//         if (isMounted) {
//           setTaskDetails(tdRes.data || []);
//           setMaterials(mRes.data || []);
//           setResources(rRes.data || []);
//           setSelectedPickerVehicle(vData);
//         }
//       } catch (err) {
//         console.error('Error fetching child records:', err);
//       }
//     }

//     loadChildRecords();
//     return () => { isMounted = false; };
//   }, [jobOrderId, vehicleId]);

//   const handleOpenAddHeader = () => {
//     setIsHeaderEditing(false);
//     setSelectedPickerVehicle(null);
//     setSupervisorSearchQuery('');
//     setHeaderForm({
//       vehicle_id: '',
//       status_id: statuses[0]?.status_id || '',
//       priority_id: priorities[0]?.priority_id || '',
//       expected_completion: new Date().toISOString().split('T')[0],
//       date_started: '',
//       date_completed: '',
//       assigned_supervisor: '',
//       labor_cost: '0',
//       materials_cost: '0',
//       total_cost: '0',
//       has_changes: false,
//       odo_rdg: '0',
//       contract_cost: '0'
//     });
//     setIsHeaderModalOpen(true);
//   };

//   const handleOpenEditHeader = async () => {
//     if (!currentJobOrder) return;
//     setIsHeaderEditing(true);

//     const vData = await fetchVehicleDetails(currentJobOrder.vehicle_id || null);
//     setSelectedPickerVehicle(vData);

//     const matchedSup = employees.find(e => e.employee_id === currentJobOrder.assigned_supervisor);
//     setSupervisorSearchQuery(
//       matchedSup 
//         ? (matchedSup.employee_name || matchedSup.name || `${matchedSup.first_name || ''} ${matchedSup.last_name || ''}`) 
//         : ''
//     );

//     setHeaderForm({
//       vehicle_id: currentJobOrder.vehicle_id || '',
//       status_id: currentJobOrder.status_id || '',
//       priority_id: currentJobOrder.priority_id || '',
//       expected_completion: currentJobOrder.expected_completion || '',
//       date_started: currentJobOrder.date_started || '',
//       date_completed: currentJobOrder.date_completed || '',
//       assigned_supervisor: currentJobOrder.assigned_supervisor || '',
//       labor_cost: String(currentJobOrder.labor_cost ?? 0),
//       materials_cost: String(currentJobOrder.materials_cost ?? 0),
//       total_cost: String(currentJobOrder.total_cost ?? 0),
//       has_changes: currentJobOrder.has_changes ?? false,
//       odo_rdg: String(currentJobOrder.odo_rdg ?? 0),
//       contract_cost: String(currentJobOrder.contract_cost ?? 0)
//     });
//     setIsHeaderModalOpen(true);
//   };

//   const handleDeleteHeader = async () => {
//     if (!currentJobOrder || !confirm('Are you sure you want to delete this Job Order and all its related details?')) return;
//     try {
//       setErrorMsg(null);
//       const { error } = await supabase.from('joborder_master').delete().eq('job_order_id', currentJobOrder.job_order_id);
//       if (error) throw error;
//       setSuccessMsg('Job Order deleted successfully!');
//       setTimeout(() => setSuccessMsg(null), 3000);
//       setJobOrders([]);
//       setCurrentIndex(0);
//     } catch (err) {
//       console.error('Error deleting job order:', err);
//       setErrorMsg('Failed to delete Job Order.');
//     }
//   };

//   const handleSubmitHeader = async (e: React.SubmitEvent) => {
//     e.preventDefault();
//     if (!headerForm.vehicle_id) {
//       setErrorMsg('Please select a Equipment for this job order.');
//       return;
//     }
//     setErrorMsg(null);

//     try {
//       const payload = {
//         vehicle_id: headerForm.vehicle_id,
//         status_id: headerForm.status_id,
//         priority_id: headerForm.priority_id,
//         expected_completion: headerForm.expected_completion,
//         date_started: headerForm.date_started || null,
//         date_completed: headerForm.date_completed || null,
//         assigned_supervisor: headerForm.assigned_supervisor || null,
//         labor_cost: Number(headerForm.labor_cost) || 0,
//         materials_cost: Number(headerForm.materials_cost) || 0,
//         total_cost: Number(headerForm.total_cost) || 0,
//         has_changes: headerForm.has_changes,
//         odo_rdg: Number(headerForm.odo_rdg) || 0,
//         contract_cost: Number(headerForm.contract_cost) || 0
//       };

//       if (isHeaderEditing && currentJobOrder) {
//         const { error, data } = await supabase.from('joborder_master').update(payload).eq('job_order_id', currentJobOrder.job_order_id).select();
//         if (error) throw error;
//         setSuccessMsg('Job Order updated successfully!');
//         if (data && data[0]) {
//           const updatedList = [...jobOrders];
//           updatedList[currentIndex] = data[0];
//           setJobOrders(updatedList);
//         }
//       } else {
//         const { error, data } = await supabase.from('joborder_master').insert([payload]).select();
//         if (error) throw error;
//         setSuccessMsg('Job Order created successfully!');
//         if (data && data[0]) {
//           setJobOrders([data[0], ...jobOrders]);
//           setCurrentIndex(0);
//         }
//       }

//       setIsHeaderModalOpen(false);
//       setTimeout(() => setSuccessMsg(null), 4000);
//     } catch (err) {
//       console.error('Error saving job order header:', err);
//       setErrorMsg('Failed to save Job Order header.');
//     }
//   };

//   const handleOpenAddChild = () => {
//     if (!currentJobOrder) return;
//     setChildEditingId(null);
//     setTaskDetailForm({ task_standard_id: '', standard_time: '' });
//     setTaskStandardSearchQuery('');

//     setResourceForm({ 
//       job_order_task_id: taskDetails[0]?.job_order_task_id || '', 
//       employee_id: employees[0]?.employee_id || '', 
//       charged_time: '0', 
//       assigned_date: new Date().toISOString().split('T')[0] 
//     });
//     setIsChildModalOpen(true);
//   };

//   const handleOpenEditChild = (item: JobOrderTaskDetailRecord | JobOrderMaterialRecord | JobOrderResourceRecord) => {
//     setChildEditingId(
//       activeChildTab === 'tasks' ? (item as JobOrderTaskDetailRecord).job_order_task_id :
//       activeChildTab === 'materials' ? (item as JobOrderMaterialRecord).job_order_matls_id :
//       (item as JobOrderResourceRecord).job_order_resource_id
//     );

//     if (activeChildTab === 'tasks') {
//       const rec = item as JobOrderTaskDetailRecord;
//       const matchedTs = taskStandards.find(ts => ts.task_standard_id === rec.task_standard_id);
//       setTaskDetailForm({ task_standard_id: rec.task_standard_id, standard_time: String(rec.standard_time ?? 0) });
//       setTaskStandardSearchQuery(matchedTs ? matchedTs.task_standard_desc : '');
//     } else if (activeChildTab === 'resources') {
//       const rec = item as JobOrderResourceRecord;
//       setResourceForm({
//         job_order_task_id: rec.job_order_task_id || '',
//         employee_id: rec.employee_id || '',
//         charged_time: String(rec.charged_time ?? 0),
//         assigned_date: rec.assigned_date || ''
//       });
//     }
//     setIsChildModalOpen(true);
//   };

//   const handleDeleteChild = async (id: string, tableName: 'joborder_task_details' | 'joborder_materials' | 'joborder_resources', pkField: string) => {
//     if (!confirm('Are you sure you want to delete this record?')) return;
//     try {
//       setErrorMsg(null);
//       const { error } = await supabase.from(tableName).delete().eq(pkField, id);
//       if (error) throw error;
//       setSuccessMsg('Record deleted successfully!');
//       setTimeout(() => setSuccessMsg(null), 3000);
//       if (currentJobOrder) {
//         const [tdRes, mRes, rRes] = await Promise.all([
//           supabase.from('joborder_task_details').select('*').eq('job_order_id', currentJobOrder.job_order_id),
//           supabase.from('joborder_materials').select('*').eq('job_order_id', currentJobOrder.job_order_id),
//           supabase.from('joborder_resources').select('*').eq('job_order_id', currentJobOrder.job_order_id)
//         ]);
//         setTaskDetails(tdRes.data || []);
//         setMaterials(mRes.data || []);
//         setResources(rRes.data || []);

//         await recalculateAndSaveJobOrderCosts(currentJobOrder.job_order_id);
//       }
//     } catch (err) {
//       console.error('Error deleting child record:', err);
//       setErrorMsg('Failed to delete child record.');
//     }
//   };

//   const handleSubmitChildForm = async (e: React.SubmitEvent) => {
//     e.preventDefault();
//     if (!currentJobOrder) return;
//     setErrorMsg(null);

//     try {
//       if (activeChildTab === 'tasks') {
//         if (!taskDetailForm.task_standard_id) {
//           setErrorMsg('Please select a task standard.');
//           return;
//         }
//         const payload = {
//           job_order_id: currentJobOrder.job_order_id,
//           task_standard_id: taskDetailForm.task_standard_id,
//           standard_time: Number(taskDetailForm.standard_time) || 0
//         };
//         if (childEditingId) {
//           const { error } = await supabase.from('joborder_task_details').update(payload).eq('job_order_task_id', childEditingId);
//           if (error) throw error;
//         } else {
//           const { error } = await supabase.from('joborder_task_details').insert([payload]);
//           if (error) throw error;
//         }
//         setSuccessMsg('Task detail saved successfully!');
//       } else if (activeChildTab === 'resources') {
//         const matchedTask = taskDetails.find(t => t.job_order_task_id === resourceForm.job_order_task_id);
//         const matchedEmp = employees.find(e => e.employee_id === resourceForm.employee_id);

//         const chargedTimeVal = Number(resourceForm.charged_time) || 0;
//         const ratePerHour = Number(matchedEmp?.rate_per_hour ?? matchedEmp?.hourly_rate ?? matchedEmp?.rate ?? 0);
//         const sellRatePerHour = Number(matchedEmp?.sell_rate_per_hour ?? 0);

//         const eeLineTotalVal = Number((chargedTimeVal * ratePerHour).toFixed(2));
//         const eeReferenceTotalVal = Number((chargedTimeVal * sellRatePerHour).toFixed(2));

//         const payload = {
//           job_order_id: currentJobOrder.job_order_id,
//           job_order_task_id: resourceForm.job_order_task_id,
//           employee_id: resourceForm.employee_id,
//           task_standard_id: matchedTask ? matchedTask.task_standard_id : taskStandards[0]?.task_standard_id,
//           charged_time: chargedTimeVal,
//           ee_rate: ratePerHour,
//           ee_sell_rate: sellRatePerHour,
//           ee_line_total: eeLineTotalVal,
//           ee_reference_total: eeReferenceTotalVal,
//           assigned_date: resourceForm.assigned_date
//         };

//         if (childEditingId) {
//           const { error } = await supabase.from('joborder_resources').update(payload).eq('job_order_resource_id', childEditingId);
//           if (error) throw error;
//         } else {
//           const { error } = await supabase.from('joborder_resources').insert([payload]);
//           if (error) throw error;
//         }
//         setSuccessMsg('Resource assignment saved successfully!');
//       }

//       setIsChildModalOpen(false);
//       setTimeout(() => setSuccessMsg(null), 4000);
//       const [tdRes, mRes, rRes] = await Promise.all([
//         supabase.from('joborder_task_details').select('*').eq('job_order_id', currentJobOrder.job_order_id),
//         supabase.from('joborder_materials').select('*').eq('job_order_id', currentJobOrder.job_order_id),
//         supabase.from('joborder_resources').select('*').eq('job_order_id', currentJobOrder.job_order_id)
//       ]);
//       setTaskDetails(tdRes.data || []);
//       setMaterials(mRes.data || []);
//       setResources(rRes.data || []);

//       await recalculateAndSaveJobOrderCosts(currentJobOrder.job_order_id);
//     } catch (err) {
//       console.error('Error saving child record:', err);
//       setErrorMsg('Failed to save record.');
//     }
//   };

//   // NATIVE CSV/TSV UPLOAD HANDLER
//   const handleMaterialsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file || !currentJobOrder) return;
//     setErrorMsg(null);

//     try {
//       const text = await file.text();
//       const lines = text
//         .replace(/\r\n/g, '\n')
//         .replace(/\r/g, '\n')
//         .split('\n')
//         .map(l => l.trim())
//         .filter(l => l.length > 0);

//       if (lines.length <= 1) {
//         setErrorMsg('Uploaded file is empty or missing data rows.');
//         return;
//       }

//       const headerLine = lines[0];
//       const delimiter = headerLine.includes('\t') ? '\t' : headerLine.includes(';') ? ';' : ',';
//       const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

//       const newMaterials = [];
//       for (let i = 1; i < lines.length; i++) {
//         const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
//         if (cols.length > 0 && cols.some(c => c !== '')) {
//           const rowObj: Record<string, string> = {};
//           headers.forEach((h, idx) => {
//             rowObj[h] = cols[idx] ?? '';
//           });

//           const rawStockId = String(rowObj['stock_id'] || '').trim();
//           const stock_id = isValidUuid(rawStockId) ? rawStockId : null;
//           const stock_code = rowObj['stock_code'] || null;
//           const part_number = rowObj['part_number'] || null;
//           const qty = Number(rowObj['qty']) || 0;
//           const unit_price = Number(rowObj['unit_price']) || 0;
//           const list_price = Number(rowObj['list_price']) || 0;
//           const unit_of_measure = rowObj['unit_of_measure'] || 'pc';

//           newMaterials.push({
//             job_order_id: currentJobOrder.job_order_id,
//             stock_id,
//             stock_code,
//             part_number,
//             qty,
//             unit_price,
//             list_price,
//             unit_of_measure,
//             line_total: Number((qty * unit_price).toFixed(2)),
//             reference_total: Number((qty * list_price).toFixed(2))
//           });
//         }
//       }

//       if (newMaterials.length === 0) {
//         setErrorMsg('No valid material rows found in file.');
//         return;
//       }

//       const { error: delError } = await supabase
//         .from('joborder_materials')
//         .delete()
//         .eq('job_order_id', currentJobOrder.job_order_id);
//       if (delError) throw delError;

//       const { error: insError } = await supabase
//         .from('joborder_materials')
//         .insert(newMaterials);
//       if (insError) throw insError;

//       setSuccessMsg(`Successfully imported ${newMaterials.length} materials from ${file.name}!`);
//       setTimeout(() => setSuccessMsg(null), 4000);
//       setIsChildModalOpen(false);

//       const mRes = await supabase
//         .from('joborder_materials')
//         .select('*')
//         .eq('job_order_id', currentJobOrder.job_order_id);
//       setMaterials(mRes.data || []);

//       await recalculateAndSaveJobOrderCosts(currentJobOrder.job_order_id);
//     } catch (err) {
//       console.error('Error processing upload:', err);
//       setErrorMsg('Failed to process and save uploaded materials.');
//     }
//   };

//   const matchedStatus = statuses.find(s => s.status_id === currentJobOrder?.status_id);
//   const matchedPriority = priorities.find(p => p.priority_id === currentJobOrder?.priority_id);
//   const matchedSupervisor = employees.find(e => e.employee_id === currentJobOrder?.assigned_supervisor);

//   const statusNameLower = matchedStatus?.status_name?.toLowerCase() || '';
//   const isStatusCompleted = statusNameLower === 'completed';
//   const isStatusCancelled = statusNameLower === 'cancelled';

//   const filteredSupervisors = employees.filter(emp => {
//     if (!emp.is_active || !emp.is_supervisor) return false;
//     const name = emp.employee_name || emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`;
//     return name.toLowerCase().includes(supervisorSearchQuery.toLowerCase());
//   });

//   const filteredTaskStandards = taskStandards.filter(ts => 
//     ts.task_standard_desc.toLowerCase().includes(taskStandardSearchQuery.toLowerCase())
//   );

//   return (
//     <div className="p-6 w-full max-w-7xl mx-auto space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between border-b border-slate-800 pb-4">
//         <div className="flex items-center gap-3">
//           <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
//             <ClipboardCheck className="w-7 h-7" />
//           </div>
//           <div>
//             <h1 className="text-2xl font-bold tracking-tight text-slate-100">Job Order Management</h1>
//             <p className="text-sm text-slate-400">Manage job order headers and associated tasks, materials, and labor resources.</p>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           <button
//             onClick={handleOpenAddHeader}
//             className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
//           >
//             <Plus className="w-4 h-4" />
//             <span>New Job Order</span>
//           </button>
//         </div>
//       </div>

//       {successMsg && (
//         <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
//           <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
//           <span>{successMsg}</span>
//         </div>
//       )}

//       {errorMsg && (
//         <div className="bg-red-950/50 border border-red-800 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
//           <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
//           <span>{errorMsg}</span>
//         </div>
//       )}

//       {/* HEADER CARD (Collapsible Single Record Viewer) */}
//       <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
//         <div className="flex items-center justify-between border-b border-slate-800 pb-4">
//           <div className="flex items-center gap-4">
//             <span className="text-sm font-bold uppercase tracking-wider text-blue-400 bg-blue-950/50 border border-blue-800/60 px-4 py-1.5 rounded-xl shadow-inner">
//               {currentJobOrder ? `JO #${currentJobOrder.job_order_no}` : 'No JO Selected'}
//             </span>
//           </div>

//           <div className="flex items-center gap-3">
//             <button
//               onClick={handleOpenJobOrderSearch}
//               className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg"
//             >
//               <Search className="w-3.5 h-3.5" /> Search Job Order
//             </button>
//             <button
//               onClick={handleOpenEditHeader}
//               disabled={!currentJobOrder || isStatusCompleted || isStatusCancelled}
//               className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
//             >
//               <Edit2 className="w-3.5 h-3.5" /> Edit Job Order
//             </button>
//             <button
//               onClick={handleDeleteHeader}
//               disabled={!currentJobOrder || isStatusCompleted}
//               className="text-xs text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
//             >
//               <Trash2 className="w-3.5 h-3.5" /> Delete Job Order
//             </button>
//             {currentJobOrder && (
//               <button
//                 onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
//                 className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1 cursor-pointer bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
//                 title={isHeaderCollapsed ? "Expand Header" : "Collapse Header"}
//               >
//                 {isHeaderCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
//                 <span>{isHeaderCollapsed ? "Expand" : "Collapse"}</span>
//               </button>
//             )}
//           </div>
//         </div>

//         {!currentJobOrder ? (
//           <div className="p-12 text-center text-slate-500">No job order loaded. Click "Search Job Order" above or create a new one to begin.</div>
//         ) : !isHeaderCollapsed ? (
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm pt-2">
//             <div>
//               <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">Equipment</span>
//               <span className="text-blue-400 font-bold block">
//                 {selectedPickerVehicle?.plate_no || '—'}
//               </span>
//               <span className="text-xs text-slate-400 block mt-0.5">
//                 {selectedPickerVehicle 
//                   ? `${selectedPickerVehicle.make_name || ''} ${selectedPickerVehicle.model_name ? `/ ${selectedPickerVehicle.model_name}` : ''} (${selectedPickerVehicle.type_description || 'N/A'})` 
//                   : '—'}
//               </span>
//             </div>

//             <div>
//               <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">Status</span>
//               <span className="text-emerald-400 font-medium">{matchedStatus ? matchedStatus.status_name : '—'}</span>
//             </div>

//             <div>
//               <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">Priority</span>
//               <span className="text-amber-400 font-medium">{matchedPriority ? matchedPriority.priority_desc : '—'}</span>
//             </div>

//             <div>
//               <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">Expected Completion</span>
//               <span className="text-slate-200 font-mono">{currentJobOrder.expected_completion}</span>
//             </div>

//             <div>
//               <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">Supervisor</span>
//               <span className="text-slate-200">
//                 {matchedSupervisor ? (matchedSupervisor.employee_name || matchedSupervisor.name || `${matchedSupervisor.first_name || ''} ${matchedSupervisor.last_name || ''}`) : '—'}
//               </span>
//             </div>

//             <div>
//               <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">Odometer Reading</span>
//               <span className="text-slate-200 font-mono">{currentJobOrder.odo_rdg}</span>
//             </div>

//             <div>
//               <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">Dates (Started / Completed)</span>
//               <span className="text-slate-200 font-mono">{currentJobOrder.date_started || '—'} / {currentJobOrder.date_completed || '—'}</span>
//             </div>

//             <div>
//               <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">Costs (Labor / Mat / Total)</span>
//               <span className="font-mono text-emerald-400">
//                 ₱{currentJobOrder.labor_cost.toFixed(2)} / ₱{currentJobOrder.materials_cost.toFixed(2)} / ₱{currentJobOrder.total_cost.toFixed(2)}
//               </span>
//             </div>
//           </div>
//         ) : null}
//       </div>

//       {/* CHILD TABS SECTION */}
//       {currentJobOrder && (
//         <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
//           <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-4">
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setActiveChildTab('tasks')}
//                 className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
//                   activeChildTab === 'tasks' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
//                 }`}
//               >
//                 <Wrench className="w-3.5 h-3.5" />
//                 <span>Task Details ({taskDetails.length})</span>
//               </button>

//               <button
//                 onClick={() => setActiveChildTab('materials')}
//                 className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
//                   activeChildTab === 'materials' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
//                 }`}
//               >
//                 <Layers className="w-3.5 h-3.5" />
//                 <span>Materials ({materials.length})</span>
//               </button>

//               <button
//                 onClick={() => setActiveChildTab('resources')}
//                 className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
//                   activeChildTab === 'resources' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
//                 }`}
//               >
//                 <Users className="w-3.5 h-3.5" />
//                 <span>Resources ({resources.length})</span>
//               </button>
//             </div>

//             <button
//               onClick={handleOpenAddChild}
//               disabled={!currentJobOrder || isStatusCompleted || isStatusCancelled}
//               className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
//             >
//               <Plus className="w-4 h-4" />
//               <span>Add Details</span>
//             </button>
//           </div>

//           {/* Scrollable Container with Sticky Table Headers */}
//           <div className="overflow-y-auto overflow-x-auto max-h-[calc(100vh-360px)] border border-slate-800/60 rounded-lg">
//             {/* CHILD TAB 1: TASK DETAILS */}
//             {activeChildTab === 'tasks' && (
//               <table className="w-full text-left border-collapse text-sm">
//                 <thead>
//                   <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
//                     <th className="p-3">Task Standard Description</th>
//                     <th className="p-3">Standard Time (m)</th>
//                     <th className="p-3 text-right">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-800 text-slate-300">
//                   {taskDetails.length === 0 ? (
//                     <tr>
//                       <td colSpan={3} className="p-8 text-center text-slate-500">No task details found for this job order.</td>
//                     </tr>
//                   ) : (
//                     taskDetails.map((item) => {
//                       const matchedStd = taskStandards.find(ts => ts.task_standard_id === item.task_standard_id);
//                       return (
//                         <tr key={item.job_order_task_id} className="hover:bg-slate-950/40 transition-colors">
//                           <td className="p-3 font-semibold text-slate-100">{matchedStd ? matchedStd.task_standard_desc : 'Task'}</td>
//                           <td className="p-3 font-mono">{item.standard_time ?? '—'}</td>
//                           <td className="p-3 text-right space-x-3">
//                             <button
//                               onClick={() => handleOpenEditChild(item)}
//                               disabled={isStatusCompleted || isStatusCancelled}
//                               className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
//                             >
//                               <Edit2 className="w-3.5 h-3.5" /> Edit
//                             </button>
//                             <button
//                               onClick={() => handleDeleteChild(item.job_order_task_id, 'joborder_task_details', 'job_order_task_id')}
//                               disabled={isStatusCompleted || isStatusCancelled}
//                               className="text-xs text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
//                             >
//                               <Trash2 className="w-3.5 h-3.5" /> Delete
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })
//                   )}
//                 </tbody>
//               </table>
//             )}

//             {/* CHILD TAB 2: MATERIALS */}
//             {activeChildTab === 'materials' && (
//               <table className="w-full text-left border-collapse text-sm">
//                 <thead>
//                   <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
//                     <th className="p-3">Stock Code</th>
//                     <th className="p-3">Part Number</th>
//                     <th className="p-3">Qty</th>
//                     <th className="p-3">Unit Price</th>
//                     <th className="p-3">List Price</th>
//                     <th className="p-3">Line Total</th>
//                     <th className="p-3">Reference Total</th>
//                     <th className="p-3 text-right">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-800 text-slate-300">
//                   {materials.length === 0 ? (
//                     <tr>
//                       <td colSpan={8} className="p-8 text-center text-slate-500">No materials recorded for this job order. Use "Add Details" above to upload materials via CSV.</td>
//                     </tr>
//                   ) : (
//                     materials.map((item) => (
//                       <tr key={item.job_order_matls_id} className="hover:bg-slate-950/40 transition-colors">
//                         <td className="p-3 font-semibold text-slate-100">{item.stock_code || '—'}</td>
//                         <td className="p-3 text-slate-400">{item.part_number || '—'}</td>
//                         <td className="p-3 font-mono">{item.qty ?? 0} {item.unit_of_measure || ''}</td>
//                         <td className="p-3 font-mono">₱{(item.unit_price ?? 0).toFixed(2)}</td>
//                         <td className="p-3 font-mono">₱{(item.list_price ?? 0).toFixed(2)}</td>
//                         <td className="p-3 font-mono text-emerald-400">₱{(item.line_total ?? 0).toFixed(2)}</td>
//                         <td className="p-3 font-mono text-blue-400">₱{(item.reference_total ?? 0).toFixed(2)}</td>
//                         <td className="p-3 text-right space-x-3">
//                           <button
//                             onClick={() => handleDeleteChild(item.job_order_matls_id, 'joborder_materials', 'job_order_matls_id')}
//                             disabled={isStatusCompleted || isStatusCancelled}
//                             className="text-xs text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
//                           >
//                             <Trash2 className="w-3.5 h-3.5" /> Delete
//                           </button>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             )}

//             {/* CHILD TAB 3: RESOURCES */}
//             {activeChildTab === 'resources' && (
//               <table className="w-full text-left border-collapse text-sm">
//                 <thead>
//                   <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
//                     <th className="p-3">Employee</th>
//                     <th className="p-3">Assigned Date</th>
//                     <th className="p-3">Charged Time (h)</th>
//                     <th className="p-3">Rate</th>
//                     <th className="p-3">Sell Rate</th>
//                     <th className="p-3">Line Total</th>
//                     <th className="p-3">Reference Total</th>
//                     <th className="p-3 text-right">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-800 text-slate-300">
//                   {resources.length === 0 ? (
//                     <tr>
//                       <td colSpan={8} className="p-8 text-center text-slate-500">No resources assigned to this job order.</td>
//                     </tr>
//                   ) : (
//                     resources.map((item) => {
//                       const matchedEmp = employees.find(e => e.employee_id === item.employee_id);
//                       return (
//                         <tr key={item.job_order_resource_id} className="hover:bg-slate-950/40 transition-colors">
//                           <td className="p-3 font-semibold text-slate-100">{matchedEmp ? (matchedEmp.employee_name || matchedEmp.name || `${matchedEmp.first_name || ''} ${matchedEmp.last_name || ''}`) : 'Employee'}</td>
//                           <td className="p-3 font-mono text-slate-400">{item.assigned_date}</td>
//                           <td className="p-3 font-mono">{item.charged_time}</td>
//                           <td className="p-3 font-mono">₱{(item.ee_rate ?? 0).toFixed(2)}</td>
//                           <td className="p-3 font-mono">₱{(item.ee_sell_rate ?? 0).toFixed(2)}</td>
//                           <td className="p-3 font-mono text-emerald-400">₱{(item.ee_line_total ?? 0).toFixed(2)}</td>
//                           <td className="p-3 font-mono text-blue-400">₱{(item.ee_reference_total ?? 0).toFixed(2)}</td>
//                           <td className="p-3 text-right space-x-3">
//                             <button
//                               onClick={() => handleOpenEditChild(item)}
//                               disabled={isStatusCompleted || isStatusCancelled}
//                               className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
//                             >
//                               <Edit2 className="w-3.5 h-3.5" /> Edit
//                             </button>
//                             <button
//                               onClick={() => handleDeleteChild(item.job_order_resource_id, 'joborder_resources', 'job_order_resource_id')}
//                               disabled={isStatusCompleted || isStatusCancelled}
//                               className="text-xs text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
//                             >
//                               <Trash2 className="w-3.5 h-3.5" /> Delete
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })
//                   )}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         </div>
//       )}

//       {/* JOB ORDER SEARCH PICKER MODAL */}
//       {showJobOrderPicker && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
//           <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
//             <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
//               <h3 className="text-lg font-semibold text-slate-100">Search Job Order</h3>
//               <button
//                 type="button"
//                 onClick={() => setShowJobOrderPicker(false)}
//                 className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <form onSubmit={handleJobOrderSearchSubmit} className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row gap-2 shrink-0">
//               <div className="relative flex-1">
//                 <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
//                 <input
//                   type="text"
//                   placeholder="Search Job Order No or Plate Number..."
//                   value={jobOrderSearchQuery}
//                   onChange={(e) => setJobOrderSearchQuery(e.target.value)}
//                   className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <select
//                 required
//                 value={jobOrderSearchStatus}
//                 onChange={(e) => setJobOrderSearchStatus(e.target.value)}
//                 className="bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 {statuses.map(s => (
//                   <option key={s.status_id} value={s.status_id}>{s.status_name}</option>
//                 ))}
//               </select>

//               <button
//                 type="submit"
//                 className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
//               >
//                 Search
//               </button>
//             </form>

//             <div className="p-4 overflow-y-auto space-y-2 flex-1">
//               {loadingJobOrders ? (
//                 <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
//                   <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
//                   <span>Loading job orders...</span>
//                 </div>
//               ) : pickerJobOrders.length === 0 ? (
//                 <div className="py-12 text-center text-slate-400">
//                   {jobOrderSearchQuery.trim() ? 'No job orders found matching your criteria.' : 'Enter a search term and click Search to find job orders.'}
//                 </div>
//               ) : (
//                 pickerJobOrders.map((jo, index) => {
//                   const sObj = statuses.find(s => s.status_id === jo.status_id);
//                   const vInfo = pickerVehicleMap[jo.vehicle_id];
//                   return (
//                     <div
//                       key={jo.job_order_id || index}
//                       onClick={() => {
//                         setJobOrders([jo]);
//                         setCurrentIndex(0);
//                         setShowJobOrderPicker(false);
//                       }}
//                       className="flex items-center justify-between bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-600/50 p-3 rounded-lg transition-colors cursor-pointer group"
//                     >
//                       <div className="flex items-center gap-3">
//                         <div className="p-2 bg-slate-900 rounded-lg group-hover:bg-blue-900/40 text-blue-400 transition-colors">
//                           <ClipboardCheck className="w-4 h-4" />
//                         </div>
//                         <div>
//                           <div className="font-bold text-blue-400 flex items-center gap-2">
//                             <span>JO #{jo.job_order_no}</span>
//                             {vInfo && (
//                               <span className="text-xs bg-slate-900 text-slate-200 px-2 py-0.5 rounded font-mono border border-slate-800">
//                                 {vInfo.plate_no}
//                               </span>
//                             )}
//                           </div>
//                           <div className="text-xs text-slate-300 mt-0.5">
//                             {vInfo 
//                               ? `${vInfo.make_name || ''} ${vInfo.model_name ? `/ ${vInfo.model_name}` : ''} (${vInfo.type_description || 'N/A'})` 
//                               : '—'}
//                           </div>
//                           <div className="text-xs text-slate-400 mt-0.5">
//                             Expected: {jo.expected_completion} {sObj ? `• Status: ${sObj.status_name}` : ''}
//                           </div>
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <span className="text-xs text-slate-400 uppercase">Total Cost</span>
//                         <div className="text-sm font-semibold text-emerald-400">₱{(jo.total_cost ?? 0).toFixed(2)}</div>
//                       </div>
//                     </div>
//                   );
//                 })
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* HEADER FORM MODAL */}
//       {isHeaderModalOpen && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
//           <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
//             <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-slate-950">
//               <h3 className="text-lg font-bold text-slate-100">
//                 {isHeaderEditing ? `Edit Job Order #${currentJobOrder?.job_order_no}` : 'New Job Order Header'}
//               </h3>
//               <button onClick={() => setIsHeaderModalOpen(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <form onSubmit={handleSubmitHeader} className="flex flex-col flex-1 overflow-hidden">
//               <div className="p-6 overflow-y-auto space-y-4 flex-1">
//                 <div className="space-y-2">
//                   <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
//                     Selected Equipment <span className="text-red-500">*</span>
//                   </label>
//                   {selectedPickerVehicle ? (
//                     <div className="flex items-center justify-between bg-slate-950 border border-blue-900/60 p-3 rounded-xl">
//                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full text-xs">
//                         <div>
//                           <span className="text-slate-400 uppercase">Plate Number</span>
//                           <div className="font-bold text-blue-400 text-sm">{selectedPickerVehicle.plate_no}</div>
//                         </div>
//                         <div>
//                           <span className="text-slate-400 uppercase">Make / Model</span>
//                           <div className="font-semibold text-slate-100">{selectedPickerVehicle.make_name || 'N/A'} {selectedPickerVehicle.model_name ? `/ ${selectedPickerVehicle.model_name}` : ''}</div>
//                         </div>
//                         <div>
//                           <span className="text-slate-400 uppercase">Type</span>
//                           <div className="font-semibold text-slate-100">{selectedPickerVehicle.type_description || 'N/A'}</div>
//                         </div>
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() => {
//                           setSelectedPickerVehicle(null);
//                           setHeaderForm({ ...headerForm, vehicle_id: '' });
//                         }}
//                         className="text-slate-400 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
//                         title="Change Equipment"
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                     </div>
//                   ) : (
//                     <button
//                       type="button"
//                       onClick={() => setShowVehiclePicker(true)}
//                       className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500 text-slate-300 px-4 py-3 rounded-xl text-sm flex items-center justify-between transition-colors cursor-pointer"
//                     >
//                       <span className="flex items-center gap-2">
//                         <Search className="w-4 h-4 text-blue-400" />
//                         {pickerVehicles.length > 0 ? 'Click here to search and select a Equipment...' : 'Click here to select a Equipment...'}
//                       </span>
//                       <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded font-medium">Browse</span>
//                     </button>
//                   )}
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Status</label>
//                     <select
//                       required
//                       value={headerForm.status_id}
//                       onChange={(e) => setHeaderForm({ ...headerForm, status_id: e.target.value })}
//                       className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
//                     >
//                       <option value="">Select Status</option>
//                       {statuses.map(s => (
//                         <option key={s.status_id} value={s.status_id}>{s.status_name}</option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Priority</label>
//                     <select
//                       required
//                       value={headerForm.priority_id}
//                       onChange={(e) => setHeaderForm({ ...headerForm, priority_id: e.target.value })}
//                       className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
//                     >
//                       <option value="">Select Priority</option>
//                       {priorities.map(p => (
//                         <option key={p.priority_id} value={p.priority_id}>{p.priority_desc}</option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div className="relative" ref={supervisorDropdownRef}>
//                     <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Assigned Supervisor</label>
//                     <div 
//                       onClick={() => setShowSupervisorDropdown(true)}
//                       className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 flex items-center justify-between cursor-pointer focus-within:border-blue-500"
//                     >
//                       <input
//                         type="text"
//                         placeholder="Search or select supervisor..."
//                         value={supervisorSearchQuery}
//                         onChange={(e) => {
//                           setSupervisorSearchQuery(e.target.value);
//                           setShowSupervisorDropdown(true);
//                         }}
//                         onFocus={() => setShowSupervisorDropdown(true)}
//                         className="bg-transparent w-full focus:outline-none text-slate-200 text-sm cursor-pointer"
//                       />
//                       <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
//                     </div>

//                     {showSupervisorDropdown && (
//                       <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto">
//                         <div 
//                           onClick={() => {
//                             setHeaderForm({ ...headerForm, assigned_supervisor: '' });
//                             setSupervisorSearchQuery('');
//                             setShowSupervisorDropdown(false);
//                           }}
//                           className="px-4 py-2.5 text-xs text-slate-400 hover:bg-slate-900 cursor-pointer border-b border-slate-800"
//                         >
//                           -- Clear Selection --
//                         </div>
//                         {filteredSupervisors.length === 0 ? (
//                           <div className="px-4 py-3 text-xs text-slate-500 text-center">No active supervisors found.</div>
//                         ) : (
//                           filteredSupervisors.map(emp => {
//                             const empName = emp.employee_name || emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`;
//                             return (
//                               <div
//                                 key={emp.employee_id}
//                                 onClick={() => {
//                                   setHeaderForm({ ...headerForm, assigned_supervisor: emp.employee_id });
//                                   setSupervisorSearchQuery(empName);
//                                   setShowSupervisorDropdown(false);
//                                 }}
//                                 className="px-4 py-2.5 text-sm text-slate-200 hover:bg-blue-950/40 hover:text-blue-400 cursor-pointer transition-colors"
//                               >
//                                 {empName}
//                               </div>
//                             );
//                           })
//                         )}
//                       </div>
//                     )}
//                   </div>

//                   <div>
//                     <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Expected Completion</label>
//                     <div className="relative">
//                       <input
//                         ref={expectedCompletionRef}
//                         type="date"
//                         required
//                         value={headerForm.expected_completion || ''}
//                         onChange={(e) => setHeaderForm({ ...headerForm, expected_completion: e.target.value })}
//                         className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => {
//                           if (expectedCompletionRef.current) {
//                             const input = expectedCompletionRef.current as HTMLInputElement & { showPicker?: () => void };
//                             if (typeof input.showPicker === 'function') {
//                               input.showPicker();
//                             } else {
//                               input.focus();
//                             }
//                           }
//                         }}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 cursor-pointer"
//                       >
//                         <Calendar className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Date Started</label>
//                     <div className="relative">
//                       <input
//                         ref={dateStartedRef}
//                         type="date"
//                         value={headerForm.date_started || ''}
//                         onChange={(e) => setHeaderForm({ ...headerForm, date_started: e.target.value })}
//                         className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => {
//                           if (dateStartedRef.current) {
//                             const input = dateStartedRef.current as HTMLInputElement & { showPicker?: () => void };
//                             if (typeof input.showPicker === 'function') {
//                               input.showPicker();
//                             } else {
//                               input.focus();
//                             }
//                           }
//                         }}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 cursor-pointer"
//                       >
//                         <Calendar className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </div>
//                   <div>
//                     <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Date Completed</label>
//                     <input
//                       type="date"
//                       readOnly
//                       value={headerForm.date_completed || ''}
//                       className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed focus:outline-none"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
//                   <div>
//                     <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Odometer Reading</label>
//                     <input
//                       type="number"
//                       value={headerForm.odo_rdg}
//                       onChange={(e) => setHeaderForm({ ...headerForm, odo_rdg: e.target.value })}
//                       className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
//                   <div>
//                     <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Labor Cost (₱)</label>
//                     <input
//                       type="number"
//                       step="any"
//                       readOnly
//                       value={headerForm.labor_cost}
//                       className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed focus:outline-none"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Materials Cost (₱)</label>
//                     <input
//                       type="number"
//                       step="any"
//                       readOnly
//                       value={headerForm.materials_cost}
//                       className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed focus:outline-none"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Total Cost (₱)</label>
//                     <input
//                       type="number"
//                       step="any"
//                       readOnly
//                       value={headerForm.total_cost}
//                       className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed focus:outline-none"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Contract Cost (₱)</label>
//                     <input
//                       type="number"
//                       step="any"
//                       readOnly
//                       value={headerForm.contract_cost}
//                       className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed focus:outline-none"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-950">
//                 <button
//                   type="button"
//                   onClick={() => setIsHeaderModalOpen(false)}
//                   className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow"
//                 >
//                   Save Changes
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* VEHICLE PICKER MODAL */}
//       {showVehiclePicker && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
//           <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
//             <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
//               <h3 className="text-lg font-semibold text-slate-100">Select Equipment</h3>
//               <button
//                 type="button"
//                 onClick={() => setShowVehiclePicker(false)}
//                 className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <form onSubmit={handleVehicleSearchSubmit} className="p-4 border-b border-slate-800 bg-slate-950/50 flex gap-2 shrink-0">
//               <div className="relative flex-1">
//                 <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
//                 <input
//                   type="text"
//                   placeholder="Filter by Plate Number..."
//                   value={vehicleSearchQuery}
//                   onChange={(e) => setVehicleSearchQuery(e.target.value)}
//                   className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <button
//                 type="submit"
//                 className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
//               >
//                 Search
//               </button>
//             </form>

//             <div className="p-4 overflow-y-auto space-y-2 flex-1">
//               {loadingVehicles ? (
//                 <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
//                   <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
//                   <span>Loading Equipment records...</span>
//                 </div>
//               ) : pickerVehicles.length === 0 ? (
//                 <div className="py-12 text-center text-slate-400">
//                   No Equipment records found.
//                 </div>
//               ) : (
//                 pickerVehicles.map((v, index) => (
//                   <div
//                     key={v.id || v.vehicle_id || index}
//                     onClick={() => {
//                       setSelectedPickerVehicle(v);
//                       setHeaderForm({ ...headerForm, vehicle_id: v.id || v.vehicle_id || '' });
//                       setShowVehiclePicker(false);
//                     }}
//                     className="flex items-center justify-between bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-600/50 p-3 rounded-lg transition-colors cursor-pointer group"
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="p-2 bg-slate-900 rounded-lg group-hover:bg-blue-900/40 text-blue-400 transition-colors">
//                         <Car className="w-4 h-4" />
//                       </div>
//                       <div>
//                         <div className="font-bold text-blue-400">{v.plate_no}</div>
//                         <div className="text-xs text-slate-400">
//                           {v.make_name || 'N/A'} {v.model_name ? `/ ${v.model_name}` : ''} ({v.type_description || 'N/A'})
//                         </div>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <span className="text-xs text-slate-400 uppercase">Service Rdg</span>
//                       <div className="text-sm font-semibold text-slate-200">{v.service_rdg ?? '0'}</div>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* CHILD FORM MODAL */}
//       {isChildModalOpen && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
//           <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
//             <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-slate-950">
//               <h3 className="text-lg font-bold text-slate-100">
//                 {childEditingId ? 'Edit Details' : 'Add Details'} ({activeChildTab})
//               </h3>
//               <button onClick={() => setIsChildModalOpen(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <form onSubmit={handleSubmitChildForm} className="flex flex-col flex-1 overflow-hidden">
//               <div className="p-6 overflow-y-auto space-y-4 flex-1">
//                 {activeChildTab === 'tasks' && (
//                   <>
//                     <div className="relative" ref={taskStandardDropdownRef}>
//                       <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Task Standard</label>
//                       <div 
//                         onClick={() => setShowTaskStandardDropdown(true)}
//                         className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 flex items-center justify-between cursor-pointer focus-within:border-blue-500"
//                       >
//                         <input
//                           type="text"
//                           placeholder="Type to search..."
//                           value={taskStandardSearchQuery}
//                           onChange={(e) => {
//                             setTaskStandardSearchQuery(e.target.value);
//                             setShowTaskStandardDropdown(true);
//                             if (!e.target.value) {
//                               setTaskDetailForm({ task_standard_id: '', standard_time: '' });
//                             }
//                           }}
//                           onFocus={() => setShowTaskStandardDropdown(true)}
//                           className="bg-transparent w-full focus:outline-none text-slate-200 text-sm cursor-pointer"
//                         />
//                         <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
//                       </div>

//                       {showTaskStandardDropdown && (
//                         <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto">
//                           <div 
//                             onClick={() => {
//                               setTaskDetailForm({ task_standard_id: '', standard_time: '' });
//                               setTaskStandardSearchQuery('');
//                               setShowTaskStandardDropdown(false);
//                             }}
//                             className="px-4 py-2.5 text-xs text-slate-400 hover:bg-slate-900 cursor-pointer border-b border-slate-800"
//                           >
//                             -- Clear Selection --
//                           </div>
//                           {filteredTaskStandards.length === 0 ? (
//                             <div className="px-4 py-3 text-xs text-slate-500 text-center">No task standards found.</div>
//                           ) : (
//                             filteredTaskStandards.map(ts => (
//                               <div
//                                 key={ts.task_standard_id}
//                                 onClick={() => {
//                                   const timeVal = ts.standard_time ?? ts.std_time ?? 0;
//                                   setTaskDetailForm({
//                                     task_standard_id: ts.task_standard_id,
//                                     standard_time: String(timeVal)
//                                   });
//                                   setTaskStandardSearchQuery(ts.task_standard_desc);
//                                   setShowTaskStandardDropdown(false);
//                                 }}
//                                 className="px-4 py-2.5 text-sm text-slate-200 hover:bg-blue-950/40 hover:text-blue-400 cursor-pointer transition-colors"
//                               >
//                                 {ts.task_standard_desc}
//                               </div>
//                             ))
//                           )}
//                         </div>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Standard Time (mins)</label>
//                       <input
//                         type="number"
//                         readOnly
//                         value={taskDetailForm.standard_time}
//                         className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed focus:outline-none"
//                       />
//                     </div>
//                   </>
//                 )}

//                 {activeChildTab === 'materials' && (
//                   <div className="space-y-4">
//                     <div className="bg-slate-950 border border-dashed border-slate-700 p-6 rounded-xl text-center space-y-3">
//                       <div className="mx-auto w-10 h-10 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center">
//                         <Upload className="w-5 h-5" />
//                       </div>
//                       <div>
//                         <h4 className="text-sm font-semibold text-slate-200">Upload Materials File</h4>
//                         <p className="text-xs text-slate-400 mt-1">
//                           Upload a CSV or TSV file containing header columns: <code className="text-blue-400">stock_id, stock_code, part_number, qty, unit_price, list_price, unit_of_measure</code>.
//                         </p>
//                       </div>
//                       <div>
//                         <input
//                           type="file"
//                           accept=".csv, .tsv, .txt"
//                           onChange={handleMaterialsFileUpload}
//                           className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {activeChildTab === 'resources' && (
//                   <>
//                     <div>
//                       <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Associated Task</label>
//                       <select
//                         required
//                         value={resourceForm.job_order_task_id}
//                         onChange={(e) => setResourceForm({ ...resourceForm, job_order_task_id: e.target.value })}
//                         className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
//                       >
//                         <option value="">Select Task Detail</option>
//                         {taskDetails.map(td => {
//                           const tsObj = taskStandards.find(s => s.task_standard_id === td.task_standard_id);
//                           return (
//                             <option key={td.job_order_task_id} value={td.job_order_task_id}>
//                               {tsObj ? tsObj.task_standard_desc : 'Task'}
//                             </option>
//                           );
//                         })}
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Employee</label>
//                       <select
//                         required
//                         value={resourceForm.employee_id}
//                         onChange={(e) => {
//                           setResourceForm({ ...resourceForm, employee_id: e.target.value });
//                         }}
//                         className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
//                       >
//                         <option value="">Select Employee</option>
//                         {employees.map(emp => (
//                           <option key={emp.employee_id} value={emp.employee_id}>
//                             {emp.employee_name || emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Assigned Date</label>
//                         <input
//                           type="date"
//                           required
//                           value={resourceForm.assigned_date}
//                           onChange={(e) => setResourceForm({ ...resourceForm, assigned_date: e.target.value })}
//                           className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Charged Time (h)</label>
//                         <input
//                           type="number"
//                           step="any"
//                           required
//                           value={resourceForm.charged_time}
//                           onChange={(e) => setResourceForm({ ...resourceForm, charged_time: e.target.value })}
//                           className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
//                         />
//                       </div>
//                     </div>
//                   </>
//                 )}
//               </div>

//               {activeChildTab !== 'materials' && (
//                 <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-950">
//                   <button
//                     type="button"
//                     onClick={() => setIsChildModalOpen(false)}
//                     className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow"
//                   >
//                     Save Changes
//                   </button>
//                 </div>
//               )}
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default JobOrder;