import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  Plus,
  CheckCircle,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Wrench,
  ClipboardList,
  Truck,
  AlertTriangle,
  Calendar
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface EmployeeRecord {
  employee_id: string;
  employee_code: string;
  employee_name: string;
  rate_per_hour: number;
  sell_rate_per_hour: number;
  is_active: boolean;
  is_supervisor: boolean;
  is_driver: boolean;
  [key: string]: unknown;
}

interface SupervisorJobOrderRecord {
  job_order_id: string;
  job_order_no: number;
  vehicle_id: string;
  plate_no: string;
  expected_completion: string;
  date_started: string | null;
  date_completed: string | null;
  requestor: string | null;
  approver: string | null;
  labor_cost: number;
  materials_cost: number;
  contract_cost: number;
  total_cost: number;
  created_at: string;
}

interface ResourceTaskRecord {
  job_order_resource_id: string;
  job_order_id: string;
  job_order_no: number | null;
  plate_no: string;
  task_standard_desc: string;
  standard_time: number;
  charged_time: number;
  ee_rate: number;
  ee_sell_rate: number;
  ee_line_total: number;
  ee_reference_total: number;
  assigned_date: string;
}

interface TripAssignmentRecord {
  trip_id: string;
  trip_date: string;
  vehicle_id: string | null;
  plate_no: string;
  total_standard_fuel: number;
  total_buffer_fuel: number;
  total_fuel_allotted: number;
  total_actual_fuel: number;
  leg_count: number;
}

interface EmployeeIncidentRecord {
  incident_id: string;
  incident_refno: string;
  incident_date: string;
  vehicle_id: string;
  plate_no: string;
  incident_description: string | null;
  incident_impact: string | null;
  incident_loss: number;
  incident_severity: string | null;
  reported_by: string | null;
  validated_by: string | null;
  role_in_incident: string;
}

type MainRegistryTab = 'registry' | 'search_records';
type RecordCategoryTab = 'resources' | 'supervisor_jos' | 'trips' | 'incidents';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const actualPages = Math.max(1, totalPages);

  return (
    <div className="shrink-0 flex items-center justify-between px-3 py-2 border-t border-(--border-main) bg-(--bg-surface) text-xs">
      <div className="text-(--text-muted)">
        Showing <span className="font-semibold text-(--text-primary)">{startItem}</span> to{' '}
        <span className="font-semibold text-(--text-primary)">{endItem}</span> of{' '}
        <span className="font-semibold text-(--text-primary)">{totalItems}</span> entries
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-(--border-main) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: actualPages }, (_, i) => i + 1).map((page) => {
            const isCurrent = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-(--accent-subtle) border-(--text-primary) text-(--text-primary)'
                    : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= actualPages}
          className="p-1.5 rounded-lg border border-(--border-main) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function isWithinOptionalDateRange(dateVal?: string | null, dateFrom?: string, dateTo?: string): boolean {
  if (!dateVal) return true;
  const normalized = dateVal.substring(0, 10);
  if (dateFrom && normalized < dateFrom) return false;
  if (dateTo && normalized > dateTo) return false;
  return true;
}

export function EmployeeRegistry() {
  const [activeTab, setActiveTab] = useState<MainRegistryTab>('registry');

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [employeeForm, setEmployeeForm] = useState({
    employee_code: '',
    employee_name: '',
    rate_per_hour: '0',
    sell_rate_per_hour: '0',
    is_active: true,
    is_supervisor: false,
    is_driver: false
  });

  // Search Employee Records Tab State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [recordDateFrom, setRecordDateFrom] = useState<string>('');
  const [recordDateTo, setRecordDateTo] = useState<string>('');
  const [recordCategoryTab, setRecordCategoryTab] = useState<RecordCategoryTab>('resources');
  const [recordsLoading, setRecordsLoading] = useState<boolean>(false);
  const [recordsPage, setRecordsPage] = useState<number>(1);

  const [supervisorJOs, setSupervisorJOs] = useState<SupervisorJobOrderRecord[]>([]);
  const [resourceTasks, setResourceTasks] = useState<ResourceTaskRecord[]>([]);
  const [tripAssignments, setTripAssignments] = useState<TripAssignmentRecord[]>([]);
  const [employeeIncidents, setEmployeeIncidents] = useState<EmployeeIncidentRecord[]>([]);

  const loadEmployees = async () => {
    try {
      setErrorMsg(null);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('employee_name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch {
      setErrorMsg('Failed to load employee registry data. Please check table permissions.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function initFetch() {
      try {
        setErrorMsg(null);
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .order('employee_name', { ascending: true });

        if (error) throw error;
        if (isMounted) {
          const list = data || [];
          setEmployees(list);
          if (list.length > 0) {
            setSelectedEmployeeId((prev) => prev || list[0].employee_id);
          }
        }
      } catch {
        if (isMounted) {
          setErrorMsg('Failed to load employee registry data. Please check table permissions.');
        }
      }
    }
    initFetch();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered employee options for Search Tab
  const matchingEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (emp) =>
        emp.employee_code.toLowerCase().includes(q) ||
        emp.employee_name.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.employee_id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]
  );

  // Fetch transactional records when selected employee changes
  useEffect(() => {
    if (activeTab !== 'search_records' || !selectedEmployee) return;

    let isMounted = true;
    const empId = selectedEmployee.employee_id;
    const empName = selectedEmployee.employee_name.trim();
    const empCode = selectedEmployee.employee_code.trim();

    async function fetchEmployeeTransactions() {
      setRecordsLoading(true);
      setErrorMsg(null);
      try {
        const safeName = empName.replace(/,/g, ' ');
        const safeCode = empCode.replace(/,/g, ' ');

        const [resSupJOs, resResources, resTrips, resIncidents] = await Promise.all([
          // 1. Job Orders where employee is assigned_supervisor
          supabase
            .from('joborder_master')
            .select(`
              job_order_id,
              job_order_no,
              vehicle_id,
              expected_completion,
              date_started,
              date_completed,
              requestor,
              approver,
              labor_cost,
              materials_cost,
              contract_cost,
              total_cost,
              created_at,
              vehicles ( plate_no )
            `)
            .eq('assigned_supervisor', empId)
            .order('created_at', { ascending: false }),

          // 2. Job Order Resources where employee worked on tasks
          supabase
            .from('joborder_resources')
            .select(`
              job_order_resource_id,
              job_order_id,
              charged_time,
              ee_rate,
              ee_sell_rate,
              ee_line_total,
              ee_reference_total,
              assigned_date,
              joborder_master (
                job_order_no,
                vehicles ( plate_no )
              ),
              joborder_task_details (
                standard_time,
                equipment_taskstandards (
                  task_standard_desc,
                  standard_time
                )
              )
            `)
            .eq('employee_id', empId)
            .order('assigned_date', { ascending: false }),

          // 3. Trip Assignments where employee is driver_id
          supabase
            .from('trip_assignments')
            .select(`
              trip_id,
              trip_date,
              vehicle_id,
              total_standard_fuel,
              total_buffer_fuel,
              total_fuel_allotted,
              total_actual_fuel,
              vehicles ( plate_no ),
              trip_assignment_details ( trip_iddet )
            `)
            .eq('driver_id', empId)
            .order('trip_date', { ascending: false }),

          // 4. Incident Reports where reported_by or validated_by matches employee name or code
          supabase
            .from('incident_report')
            .select(`
              incident_id,
              incident_refno,
              incident_date,
              vehicle_id,
              incident_description,
              incident_impact,
              incident_loss,
              incident_severity,
              reported_by,
              validated_by,
              vehicles ( plate_no )
            `)
            .or(
              `reported_by.ilike.%${safeName}%,validated_by.ilike.%${safeName}%,reported_by.ilike.%${safeCode}%,validated_by.ilike.%${safeCode}%`
            )
            .order('incident_date', { ascending: false })
        ]);

        if (resSupJOs.error) throw resSupJOs.error;
        if (resResources.error) throw resResources.error;
        if (resTrips.error) throw resTrips.error;
        if (resIncidents.error) throw resIncidents.error;

        if (!isMounted) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedSupJOs: SupervisorJobOrderRecord[] = (resSupJOs.data || []).map((jo: any) => ({
          job_order_id: jo.job_order_id,
          job_order_no: jo.job_order_no,
          vehicle_id: jo.vehicle_id,
          plate_no: jo.vehicles?.plate_no || 'N/A',
          expected_completion: jo.expected_completion,
          date_started: jo.date_started,
          date_completed: jo.date_completed,
          requestor: jo.requestor,
          approver: jo.approver,
          labor_cost: Number(jo.labor_cost || 0),
          materials_cost: Number(jo.materials_cost || 0),
          contract_cost: Number(jo.contract_cost || 0),
          total_cost: Number(jo.total_cost || 0),
          created_at: jo.created_at
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedResources: ResourceTaskRecord[] = (resResources.data || []).map((r: any) => {
          const jo = r.joborder_master;
          const td = r.joborder_task_details;
          const ts = td?.equipment_taskstandards;
          return {
            job_order_resource_id: r.job_order_resource_id,
            job_order_id: r.job_order_id,
            job_order_no: jo?.job_order_no ?? null,
            plate_no: jo?.vehicles?.plate_no || 'N/A',
            task_standard_desc: ts?.task_standard_desc || 'Standard Task',
            standard_time: Number(td?.standard_time ?? ts?.standard_time ?? 0),
            charged_time: Number(r.charged_time || 0),
            ee_rate: Number(r.ee_rate || 0),
            ee_sell_rate: Number(r.ee_sell_rate || 0),
            ee_line_total: Number(r.ee_line_total || 0),
            ee_reference_total: Number(r.ee_reference_total || 0),
            assigned_date: r.assigned_date
          };
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedTrips: TripAssignmentRecord[] = (resTrips.data || []).map((t: any) => ({
          trip_id: t.trip_id,
          trip_date: t.trip_date,
          vehicle_id: t.vehicle_id,
          plate_no: t.vehicles?.plate_no || 'N/A',
          total_standard_fuel: Number(t.total_standard_fuel || 0),
          total_buffer_fuel: Number(t.total_buffer_fuel || 0),
          total_fuel_allotted: Number(t.total_fuel_allotted || 0),
          total_actual_fuel: Number(t.total_actual_fuel || 0),
          leg_count: Array.isArray(t.trip_assignment_details) ? t.trip_assignment_details.length : 0
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedIncidents: EmployeeIncidentRecord[] = (resIncidents.data || []).map((inc: any) => {
          const rep = (inc.reported_by || '').toLowerCase();
          const val = (inc.validated_by || '').toLowerCase();
          const nameLower = empName.toLowerCase();
          const codeLower = empCode.toLowerCase();

          const isReporter = rep.includes(nameLower) || rep.includes(codeLower);
          const isValidator = val.includes(nameLower) || val.includes(codeLower);

          let role = 'Referenced';
          if (isReporter && isValidator) role = 'Reported & Validated';
          else if (isReporter) role = 'Reported By';
          else if (isValidator) role = 'Validated By';

          return {
            incident_id: inc.incident_id,
            incident_refno: inc.incident_refno,
            incident_date: inc.incident_date,
            vehicle_id: inc.vehicle_id,
            plate_no: inc.vehicles?.plate_no || 'N/A',
            incident_description: inc.incident_description,
            incident_impact: inc.incident_impact,
            incident_loss: Number(inc.incident_loss || 0),
            incident_severity: inc.incident_severity,
            reported_by: inc.reported_by,
            validated_by: inc.validated_by,
            role_in_incident: role
          };
        });

        setSupervisorJOs(mappedSupJOs);
        setResourceTasks(mappedResources);
        setTripAssignments(mappedTrips);
        setEmployeeIncidents(mappedIncidents);
        setRecordsPage(1);
      } catch {
        if (isMounted) {
          setErrorMsg('Failed to fetch transactional records for the selected employee.');
        }
      } finally {
        if (isMounted) {
          setRecordsLoading(false);
        }
      }
    }

    fetchEmployeeTransactions();
    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedEmployee]);

  // Date-filtered slices for Search Employee Records
  const filteredResourceTasks = useMemo(
    () =>
      resourceTasks.filter((r) =>
        isWithinOptionalDateRange(r.assigned_date, recordDateFrom, recordDateTo)
      ),
    [resourceTasks, recordDateFrom, recordDateTo]
  );

  const filteredSupervisorJOs = useMemo(
    () =>
      supervisorJOs.filter((jo) =>
        isWithinOptionalDateRange(jo.date_started || jo.created_at, recordDateFrom, recordDateTo)
      ),
    [supervisorJOs, recordDateFrom, recordDateTo]
  );

  const filteredTripAssignments = useMemo(
    () =>
      tripAssignments.filter((t) =>
        isWithinOptionalDateRange(t.trip_date, recordDateFrom, recordDateTo)
      ),
    [tripAssignments, recordDateFrom, recordDateTo]
  );

  const filteredEmployeeIncidents = useMemo(
    () =>
      employeeIncidents.filter((inc) =>
        isWithinOptionalDateRange(inc.incident_date, recordDateFrom, recordDateTo)
      ),
    [employeeIncidents, recordDateFrom, recordDateTo]
  );

  // Active sub-table items & pagination
  const activeRecordsCount = useMemo(() => {
    switch (recordCategoryTab) {
      case 'resources':
        return filteredResourceTasks.length;
      case 'supervisor_jos':
        return filteredSupervisorJOs.length;
      case 'trips':
        return filteredTripAssignments.length;
      case 'incidents':
        return filteredEmployeeIncidents.length;
    }
  }, [
    recordCategoryTab,
    filteredResourceTasks.length,
    filteredSupervisorJOs.length,
    filteredTripAssignments.length,
    filteredEmployeeIncidents.length
  ]);

  const recordsTotalPages = Math.ceil(activeRecordsCount / ITEMS_PER_PAGE);

  const paginatedResourceTasks = useMemo(
    () =>
      filteredResourceTasks.slice(
        (recordsPage - 1) * ITEMS_PER_PAGE,
        recordsPage * ITEMS_PER_PAGE
      ),
    [filteredResourceTasks, recordsPage]
  );

  const paginatedSupervisorJOs = useMemo(
    () =>
      filteredSupervisorJOs.slice(
        (recordsPage - 1) * ITEMS_PER_PAGE,
        recordsPage * ITEMS_PER_PAGE
      ),
    [filteredSupervisorJOs, recordsPage]
  );

  const paginatedTripAssignments = useMemo(
    () =>
      filteredTripAssignments.slice(
        (recordsPage - 1) * ITEMS_PER_PAGE,
        recordsPage * ITEMS_PER_PAGE
      ),
    [filteredTripAssignments, recordsPage]
  );

  const paginatedEmployeeIncidents = useMemo(
    () =>
      filteredEmployeeIncidents.slice(
        (recordsPage - 1) * ITEMS_PER_PAGE,
        recordsPage * ITEMS_PER_PAGE
      ),
    [filteredEmployeeIncidents, recordsPage]
  );

  // Registry Tab Pagination
  const totalPages = Math.ceil(employees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = employees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleOpenAdd = () => {
    setEditingId(null);
    setEmployeeForm({
      employee_code: '',
      employee_name: '',
      rate_per_hour: '0',
      sell_rate_per_hour: '0',
      is_active: true,
      is_supervisor: false,
      is_driver: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: EmployeeRecord) => {
    setEditingId(item.employee_id);
    setEmployeeForm({
      employee_code: item.employee_code || '',
      employee_name: item.employee_name || '',
      rate_per_hour: String(item.rate_per_hour ?? 0),
      sell_rate_per_hour: String(item.sell_rate_per_hour ?? 0),
      is_active: Boolean(item.is_active),
      is_supervisor: Boolean(item.is_supervisor),
      is_driver: Boolean(item.is_driver)
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('employee_id', id);

      if (error) throw error;

      setSuccessMsg('Employee deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadEmployees();

      // Reset page if deleting the last item on current page
      if (paginatedEmployees.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch {
      setErrorMsg('Failed to delete record. Check foreign key constraints.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.employee_code.trim() || !employeeForm.employee_name.trim()) {
      setErrorMsg('Employee Code and Employee Name are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        employee_code: employeeForm.employee_code.trim(),
        employee_name: employeeForm.employee_name.trim(),
        rate_per_hour: Number(employeeForm.rate_per_hour) || 0,
        sell_rate_per_hour: Number(employeeForm.sell_rate_per_hour) || 0,
        is_active: employeeForm.is_active,
        is_supervisor: employeeForm.is_supervisor,
        is_driver: employeeForm.is_driver
      };

      if (editingId) {
        const { error } = await supabase
          .from('employees')
          .update(payload)
          .eq('employee_id', editingId);

        if (error) throw error;
        setSuccessMsg('Employee updated successfully!');
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([payload]);

        if (error) throw error;
        setSuccessMsg('Employee registered successfully!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadEmployees();
    } catch {
      setErrorMsg('Failed to save record. Please check required fields or uniqueness constraints (Code/Name).');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspectEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setRecordsPage(1);
    setActiveTab('search_records');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
      {/* Page Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-(--border-main) pb-3">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 rounded-xl shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Employee Registry</h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">Manage staff, mechanics, drivers, and operational personnel accounts and rates.</p>
          </div>
        </div>
      </div>

      {/* Messages */}
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

      {/* Tab bar header */}
      <div className="shrink-0 flex border-b border-(--border-main) gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('registry')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'registry'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Registered Employees ({employees.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('search_records')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'search_records'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search Employee Records</span>
        </button>
      </div>

      {/* TAB 1: Registered Employees */}
      {activeTab === 'registry' && (
        <div className="flex flex-col flex-1 min-h-0 bg-(--bg-surface) border border-(--border-main) shadow-xs rounded-xl p-4 overflow-hidden space-y-3">
          <div className="shrink-0 flex justify-end items-center">
            <button
              onClick={handleOpenAdd}
              className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          </div>

          {/* Table container & Pagination */}
          <div className="flex flex-col flex-1 min-h-0 space-y-2">
            <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                    <th className="py-2 px-3">Employee Code</th>
                    <th className="py-2 px-3">Employee Name</th>
                    <th className="py-2 px-3">Rate / Hour</th>
                    <th className="py-2 px-3">Sell Rate / Hour</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Roles</th>
                    <th className="py-2 px-3 text-right w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-(--text-muted) text-xs">No employees registered.</td>
                    </tr>
                  ) : (
                    paginatedEmployees.map((item) => (
                      <tr key={item.employee_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-(--text-primary)">{item.employee_code ?? ''}</td>
                        <td className="py-2 px-3 font-semibold text-(--text-primary)">{item.employee_name ?? ''}</td>
                        <td className="py-2 px-3 font-mono text-(--text-secondary)">₱{(Number(item.rate_per_hour ?? 0)).toFixed(2)}</td>
                        <td className="py-2 px-3 font-mono text-(--text-secondary)">₱{(Number(item.sell_rate_per_hour ?? 0)).toFixed(2)}</td>
                        <td className="py-2 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${item.is_active ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50' : 'bg-(--accent-subtle) text-(--text-muted)'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Driver (Violet) / Shop (Blue) Badge First */}
                            {item.is_driver ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-800/50">
                                Driver
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800/50">
                                Shop
                              </span>
                            )}

                            {/* Supervisor Badge Second (Yellow Highlight) */}
                            {item.is_supervisor && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800/50">
                                Supervisor
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleInspectEmployee(item.employee_id)}
                              className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                              title="Search operational records for this employee"
                            >
                              <Search className="w-3 h-3" /> Records
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.employee_id)}
                              className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={employees.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* TAB 2: Search Employee Records */}
      {activeTab === 'search_records' && (
        <div className="flex flex-col flex-1 min-h-0 bg-(--bg-surface) border border-(--border-main) shadow-xs rounded-xl p-4 overflow-hidden space-y-3">
          {/* Filter & Search Bar */}
          <div className="shrink-0 grid grid-cols-1 md:grid-cols-12 gap-2.5 bg-(--bg-elevated) border border-(--border-main) p-3 rounded-xl">
            {/* Keyword Search */}
            <div className="md:col-span-4">
              <label className="block text-[10px] uppercase text-(--text-muted) font-bold mb-1">
                Filter Employee List
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    const q = val.trim().toLowerCase();
                    if (q) {
                      const firstMatch = employees.find(
                        (emp) =>
                          emp.employee_code.toLowerCase().includes(q) ||
                          emp.employee_name.toLowerCase().includes(q)
                      );
                      if (firstMatch) {
                        setSelectedEmployeeId(firstMatch.employee_id);
                      }
                    }
                  }}
                  placeholder="Type code or name..."
                  className="w-full bg-(--bg-surface) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-2.5 py-1.5 text-xs focus:outline-none focus:border-(--text-primary)"
                />
              </div>
            </div>

            {/* Employee Selector Dropdown */}
            <div className="md:col-span-4">
              <label className="block text-[10px] uppercase text-(--text-muted) font-bold mb-1">
                Selected Employee ({matchingEmployees.length})
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => {
                  setSelectedEmployeeId(e.target.value);
                  setRecordsPage(1);
                }}
                className="w-full bg-(--bg-surface) border border-(--border-main) text-(--text-primary) rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-(--text-primary) cursor-pointer"
              >
                {matchingEmployees.length === 0 ? (
                  <option value="">No matching employees</option>
                ) : (
                  matchingEmployees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      [{emp.employee_code}] {emp.employee_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Optional Date Range */}
            <div className="md:col-span-4">
              <label className="block text-[10px] uppercase text-(--text-muted) font-bold mb-1">
                Activity Date Range (Optional)
              </label>
              <div className="flex items-center gap-1.5 bg-(--bg-surface) border border-(--border-main) rounded-lg px-2 py-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-(--text-muted) shrink-0" />
                <input
                  type="date"
                  value={recordDateFrom}
                  onChange={(e) => {
                    setRecordDateFrom(e.target.value);
                    setRecordsPage(1);
                  }}
                  className="bg-transparent text-(--text-primary) text-xs focus:outline-none w-full cursor-pointer"
                  title="From Date"
                />
                <span className="text-(--text-muted)">–</span>
                <input
                  type="date"
                  value={recordDateTo}
                  onChange={(e) => {
                    setRecordDateTo(e.target.value);
                    setRecordsPage(1);
                  }}
                  className="bg-transparent text-(--text-primary) text-xs focus:outline-none w-full cursor-pointer"
                  title="To Date"
                />
                {(recordDateFrom || recordDateTo) && (
                  <button
                    type="button"
                    onClick={() => {
                      setRecordDateFrom('');
                      setRecordDateTo('');
                      setRecordsPage(1);
                    }}
                    className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
                    title="Clear date filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Category Sub-Tabs (Transaction Tables) */}
          <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setRecordCategoryTab('resources');
                setRecordsPage(1);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                recordCategoryTab === 'resources'
                  ? 'bg-blue-500/15 border-blue-500 text-(--text-primary)'
                  : 'bg-(--bg-elevated) border-(--border-main) text-(--text-secondary) hover:border-blue-500/50'
              }`}
            >
              <div>
                <div className="text-[10px] font-bold uppercase text-(--text-muted) flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-blue-500" /> Task Labor
                </div>
                <div className="text-base font-black font-mono text-(--text-primary)">
                  {filteredResourceTasks.length}
                </div>
              </div>
              <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">
                {filteredResourceTasks.reduce((sum, r) => sum + r.charged_time, 0).toFixed(1)} hrs
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRecordCategoryTab('supervisor_jos');
                setRecordsPage(1);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                recordCategoryTab === 'supervisor_jos'
                  ? 'bg-amber-500/15 border-amber-500 text-(--text-primary)'
                  : 'bg-(--bg-elevated) border-(--border-main) text-(--text-secondary) hover:border-amber-500/50'
              }`}
            >
              <div>
                <div className="text-[10px] font-bold uppercase text-(--text-muted) flex items-center gap-1">
                  <ClipboardList className="w-3 h-3 text-amber-500" /> Supervised JOs
                </div>
                <div className="text-base font-black font-mono text-(--text-primary)">
                  {filteredSupervisorJOs.length}
                </div>
              </div>
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                ₱{filteredSupervisorJOs.reduce((sum, j) => sum + j.total_cost, 0).toLocaleString()}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRecordCategoryTab('trips');
                setRecordsPage(1);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                recordCategoryTab === 'trips'
                  ? 'bg-violet-500/15 border-violet-500 text-(--text-primary)'
                  : 'bg-(--bg-elevated) border-(--border-main) text-(--text-secondary) hover:border-violet-500/50'
              }`}
            >
              <div>
                <div className="text-[10px] font-bold uppercase text-(--text-muted) flex items-center gap-1">
                  <Truck className="w-3 h-3 text-violet-500" /> Trip Assignments
                </div>
                <div className="text-base font-black font-mono text-(--text-primary)">
                  {filteredTripAssignments.length}
                </div>
              </div>
              <span className="text-[10px] font-mono text-violet-600 dark:text-violet-400">
                {filteredTripAssignments.reduce((sum, t) => sum + t.total_actual_fuel, 0).toFixed(1)} L
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRecordCategoryTab('incidents');
                setRecordsPage(1);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                recordCategoryTab === 'incidents'
                  ? 'bg-rose-500/15 border-rose-500 text-(--text-primary)'
                  : 'bg-(--bg-elevated) border-(--border-main) text-(--text-secondary) hover:border-rose-500/50'
              }`}
            >
              <div>
                <div className="text-[10px] font-bold uppercase text-(--text-muted) flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-500" /> Incident Reports
                </div>
                <div className="text-base font-black font-mono text-(--text-primary)">
                  {filteredEmployeeIncidents.length}
                </div>
              </div>
              <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400">
                ₱{filteredEmployeeIncidents.reduce((sum, i) => sum + i.incident_loss, 0).toLocaleString()}
              </span>
            </button>
          </div>

          {/* Records Table & Pagination */}
          <div className="flex flex-col flex-1 min-h-0 space-y-2">
            <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
              {recordsLoading ? (
                <div className="flex items-center justify-center h-48 gap-2 text-xs text-(--text-muted)">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading employee transaction records...</span>
                </div>
              ) : !selectedEmployee ? (
                <div className="py-10 text-center text-xs text-(--text-muted)">
                  Select an employee above to view their operational records.
                </div>
              ) : (
                <>
                  {/* 1. Task Labor (joborder_resources + joborder_task_details + equipment_taskstandards) */}
                  {recordCategoryTab === 'resources' && (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                          <th className="py-2 px-3">Assigned Date</th>
                          <th className="py-2 px-3">JO #</th>
                          <th className="py-2 px-3">Plate No</th>
                          <th className="py-2 px-3">Task Standard</th>
                          <th className="py-2 px-3 text-right">Std Hrs</th>
                          <th className="py-2 px-3 text-right">Charged Hrs</th>
                          <th className="py-2 px-3 text-right">EE Rate</th>
                          <th className="py-2 px-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                        {paginatedResourceTasks.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-6 text-center text-(--text-muted)">
                              No job order task labor records found for {selectedEmployee.employee_name}.
                            </td>
                          </tr>
                        ) : (
                          paginatedResourceTasks.map((rec) => (
                            <tr key={rec.job_order_resource_id} className="hover:bg-(--accent-subtle) transition-colors">
                              <td className="py-2 px-3 font-mono">{rec.assigned_date}</td>
                              <td className="py-2 px-3 font-mono font-bold text-(--text-primary)">
                                {rec.job_order_no ? `JO-${rec.job_order_no}` : 'N/A'}
                              </td>
                              <td className="py-2 px-3 font-mono font-semibold text-(--text-primary)">{rec.plate_no}</td>
                              <td className="py-2 px-3 text-(--text-primary)">{rec.task_standard_desc}</td>
                              <td className="py-2 px-3 text-right font-mono">{rec.standard_time.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                                {rec.charged_time.toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono">₱{rec.ee_rate.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-(--text-primary)">
                                ₱{rec.ee_line_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* 2. Supervisor Job Orders (joborder_master) */}
                  {recordCategoryTab === 'supervisor_jos' && (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                          <th className="py-2 px-3">JO #</th>
                          <th className="py-2 px-3">Plate No</th>
                          <th className="py-2 px-3">Date Started</th>
                          <th className="py-2 px-3">Expected / Completed</th>
                          <th className="py-2 px-3">Requestor</th>
                          <th className="py-2 px-3 text-right">Labor</th>
                          <th className="py-2 px-3 text-right">Materials</th>
                          <th className="py-2 px-3 text-right">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                        {paginatedSupervisorJOs.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-6 text-center text-(--text-muted)">
                              No supervised job orders found for {selectedEmployee.employee_name}.
                            </td>
                          </tr>
                        ) : (
                          paginatedSupervisorJOs.map((jo) => (
                            <tr key={jo.job_order_id} className="hover:bg-(--accent-subtle) transition-colors">
                              <td className="py-2 px-3 font-mono font-bold text-(--text-primary)">JO-{jo.job_order_no}</td>
                              <td className="py-2 px-3 font-mono font-semibold text-(--text-primary)">{jo.plate_no}</td>
                              <td className="py-2 px-3 font-mono">{jo.date_started || 'Not Started'}</td>
                              <td className="py-2 px-3 font-mono">
                                {jo.date_completed ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{jo.date_completed}</span>
                                ) : (
                                  <span>Due: {jo.expected_completion}</span>
                                )}
                              </td>
                              <td className="py-2 px-3">{jo.requestor || '—'}</td>
                              <td className="py-2 px-3 text-right font-mono">₱{jo.labor_cost.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right font-mono">₱{jo.materials_cost.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-(--text-primary)">
                                ₱{jo.total_cost.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* 3. Trip Assignments (trip_assignments + trip_assignment_details) */}
                  {recordCategoryTab === 'trips' && (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                          <th className="py-2 px-3">Trip Date</th>
                          <th className="py-2 px-3">Vehicle Plate</th>
                          <th className="py-2 px-3 text-center">Route Legs</th>
                          <th className="py-2 px-3 text-right">Std Fuel (L)</th>
                          <th className="py-2 px-3 text-right">Buffer (L)</th>
                          <th className="py-2 px-3 text-right">Allotted (L)</th>
                          <th className="py-2 px-3 text-right">Actual Fuel (L)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                        {paginatedTripAssignments.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-(--text-muted)">
                              No trip assignments found for {selectedEmployee.employee_name}.
                            </td>
                          </tr>
                        ) : (
                          paginatedTripAssignments.map((trip) => (
                            <tr key={trip.trip_id} className="hover:bg-(--accent-subtle) transition-colors">
                              <td className="py-2 px-3 font-mono font-bold text-(--text-primary)">{trip.trip_date}</td>
                              <td className="py-2 px-3 font-mono font-semibold text-(--text-primary)">{trip.plate_no}</td>
                              <td className="py-2 px-3 text-center font-mono">{trip.leg_count}</td>
                              <td className="py-2 px-3 text-right font-mono">{trip.total_standard_fuel.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-mono">{trip.total_buffer_fuel.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-mono font-semibold text-violet-600 dark:text-violet-400">
                                {trip.total_fuel_allotted.toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-(--text-primary)">
                                {trip.total_actual_fuel.toFixed(2)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* 4. Incident Reports (incident_report) */}
                  {recordCategoryTab === 'incidents' && (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                          <th className="py-2 px-3">Ref No</th>
                          <th className="py-2 px-3">Incident Date</th>
                          <th className="py-2 px-3">Plate No</th>
                          <th className="py-2 px-3">Involvement</th>
                          <th className="py-2 px-3">Severity</th>
                          <th className="py-2 px-3">Description</th>
                          <th className="py-2 px-3 text-right">Incident Loss</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                        {paginatedEmployeeIncidents.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-(--text-muted)">
                              No incident reports referencing {selectedEmployee.employee_name}.
                            </td>
                          </tr>
                        ) : (
                          paginatedEmployeeIncidents.map((inc) => (
                            <tr key={inc.incident_id} className="hover:bg-(--accent-subtle) transition-colors">
                              <td className="py-2 px-3 font-mono font-bold text-rose-600">{inc.incident_refno}</td>
                              <td className="py-2 px-3 font-mono">{inc.incident_date}</td>
                              <td className="py-2 px-3 font-mono font-semibold text-(--text-primary)">{inc.plate_no}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50">
                                  {inc.role_in_incident}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-semibold">{inc.incident_severity || 'N/A'}</td>
                              <td className="py-2 px-3 max-w-xs truncate" title={inc.incident_description || ''}>
                                {inc.incident_description || '—'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                                ₱{inc.incident_loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>

            <PaginationControls
              currentPage={recordsPage}
              totalPages={recordsTotalPages}
              totalItems={activeRecordsCount}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setRecordsPage}
            />
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">
                {editingId ? 'Edit Employee' : 'Add Employee'}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Employee Code <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={employeeForm.employee_code}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, employee_code: e.target.value })}
                      placeholder="e.g. EMP-001"
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Employee Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={employeeForm.employee_name}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, employee_name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Rate per Hour (₱)</label>
                    <input
                      type="number"
                      step="any"
                      value={employeeForm.rate_per_hour}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, rate_per_hour: e.target.value })}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-(--text-muted) font-semibold mb-1">Sell Rate per Hour (₱)</label>
                    <input
                      type="number"
                      step="any"
                      value={employeeForm.sell_rate_per_hour}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, sell_rate_per_hour: e.target.value })}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-(--text-muted) font-semibold">
                    <input
                      type="checkbox"
                      checked={employeeForm.is_active}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-(--border-main) bg-(--bg-elevated) text-(--text-primary) focus:ring-0 cursor-pointer"
                    />
                    <span>Active Status</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-(--text-muted) font-semibold">
                    <input
                      type="checkbox"
                      checked={employeeForm.is_supervisor}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, is_supervisor: e.target.checked })}
                      className="w-4 h-4 rounded border-(--border-main) bg-(--bg-elevated) text-(--text-primary) focus:ring-0 cursor-pointer"
                    />
                    <span>Is Supervisor</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-(--text-muted) font-semibold">
                    <input
                      type="checkbox"
                      checked={employeeForm.is_driver}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, is_driver: e.target.checked })}
                      className="w-4 h-4 rounded border-(--border-main) bg-(--bg-elevated) text-(--text-primary) focus:ring-0 cursor-pointer"
                    />
                    <span>Is Driver</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingId ? 'Update Employee' : 'Save Employee'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeRegistry;