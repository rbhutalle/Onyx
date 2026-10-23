import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  X, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ShieldAlert, 
  UserCheck, 
  Briefcase, 
  Layers, 
  Car, 
  Calendar, 
  User, 
  FileText,
  UserCheck2,
  ChevronDown,
  ChevronUp,
  FolderSearch,
  Lock
} from 'lucide-react';

// Equipment Telemetry View Interface
interface EquipmentPm {
  plate_no: string;
  service_rdg?: number | null;
  make_name?: string | null;
  model_name?: string | null;
  type_description?: string | null;
  vehicle_id?: string;
  equipment_id?: string;
  id?: string;
  [key: string]: unknown;
}

interface EmployeeOption {
  employee_id: string;
  employee_no?: string;
  full_name: string;
  department?: string;
  position?: string;
}

interface StatusOption {
  status_id: string;
  status_name?: string;
  name?: string;
}

interface IncidentRecord {
  incident_id: string;
  incident_refno: string;
  incident_date: string;
  vehicle_id: string;
  vehicle_plate?: string;
  incident_description: string;
  incident_impact: string;
  incident_loss: number;
  incident_severity: 'Low' | 'Medium' | 'High' | 'Critical';
  reported_by: string;
  validated_by: string;
  status_id?: string | null;
  status_name?: string;
  reportcompleted_date?: string | null;
  reported_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Option Reference Interfaces for Dropdowns
interface TaxonomyOption {
  id: string;
  code: string;
  description: string;
}

interface ConditionDetailOption {
  detail_id: string;
  condition_id: string;
  code: string;
  description: string;
}

interface ActDetailOption {
  detail_id: string;
  act_id: string;
  code: string;
  description: string;
}

interface FactorDetailOption {
  detail_id: string;
  factor_id: string;
  code: string;
  description: string;
}

interface CauseDetailOption {
  detail_id: string;
  cause_id: string;
  code: string;
  description: string;
}

// Child Record Interfaces
interface IncidentConditionRecord {
  incident_conditions_id: string;
  incident_id: string;
  condition_id: string;
  detail_id?: string | null;
  remarks: string;
  code?: string;
  description?: string;
  detail_code?: string;
  detail_description?: string;
}

interface IncidentActRecord {
  incident_act_id: string;
  incident_id: string;
  act_id: string;
  detail_id?: string | null;
  remarks: string;
  code?: string;
  description?: string;
  detail_code?: string;
  detail_description?: string;
}

interface IncidentPersonalRecord {
  incident_personal_id: string;
  incident_id: string;
  factor_id: string;
  detail_id?: string | null;
  remarks: string;
  code?: string;
  description?: string;
  detail_code?: string;
  detail_description?: string;
}

interface IncidentWorkRelatedRecord {
  incident_workrelated_id: string;
  incident_id: string;
  cause_id: string;
  detail_id?: string | null;
  remarks: string;
  code?: string;
  description?: string;
  detail_code?: string;
  detail_description?: string;
}

type AnalysisTab = 'conditions' | 'acts' | 'personal' | 'workrelated';

export function IncidentReport() {
  // Collapsible State for 2nd Area (Incident Record Display)
  const [isSecondAreaOpen, setIsSecondAreaOpen] = useState<boolean>(true);

  // Master Incident Data
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null); 
  const [loadingIncidents, setLoadingIncidents] = useState<boolean>(false);

  // Search Modal for Incident Reports
  const [isIncidentSearchOpen, setIsIncidentSearchOpen] = useState<boolean>(false);
  const [incidentSearchQuery, setIncidentSearchQuery] = useState<string>('');

  // Equipment Picker Modal State
  const [equipmentList, setEquipmentList] = useState<EquipmentPm[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentPm | null>(null);
  const [showEquipmentPicker, setShowEquipmentPicker] = useState<boolean>(false);
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState<string>('');
  const [loadingEquipment, setLoadingEquipment] = useState<boolean>(false);

  // References
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [conditionOptions, setConditionOptions] = useState<TaxonomyOption[]>([]);
  const [conditionDetailOptions, setConditionDetailOptions] = useState<ConditionDetailOption[]>([]);
  const [actOptions, setActOptions] = useState<TaxonomyOption[]>([]);
  const [actDetailOptions, setActDetailOptions] = useState<ActDetailOption[]>([]);
  const [factorOptions, setFactorOptions] = useState<TaxonomyOption[]>([]);
  const [factorDetailOptions, setFactorDetailOptions] = useState<FactorDetailOption[]>([]);
  const [causeOptions, setCauseOptions] = useState<TaxonomyOption[]>([]);
  const [causeDetailOptions, setCauseDetailOptions] = useState<CauseDetailOption[]>([]);

  // Search query states within Details pickers
  const [conditionDetailSearchQuery, setConditionDetailSearchQuery] = useState<string>('');
  const [actDetailSearchQuery, setActDetailSearchQuery] = useState<string>('');
  const [factorDetailSearchQuery, setFactorDetailSearchQuery] = useState<string>('');
  const [causeDetailSearchQuery, setCauseDetailSearchQuery] = useState<string>('');

  // Active Analysis Tab for Child Tables
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<AnalysisTab>('conditions');

  // Child Data Lists
  const [incidentConditions, setIncidentConditions] = useState<IncidentConditionRecord[]>([]);
  const [incidentActs, setIncidentActs] = useState<IncidentActRecord[]>([]);
  const [incidentPersonal, setIncidentPersonal] = useState<IncidentPersonalRecord[]>([]);
  const [incidentWorkRelated, setIncidentWorkRelated] = useState<IncidentWorkRelatedRecord[]>([]);
  const [loadingChild, setLoadingChild] = useState<boolean>(false);

  // Status Msgs
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Master Incident Form Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    incident_refno: '',
    incident_date: new Date().toISOString().split('T')[0],
    vehicle_id: '',
    vehicle_plate: '',
    incident_severity: 'Low' as IncidentRecord['incident_severity'],
    incident_description: '',
    incident_impact: '',
    incident_loss: 0,
    reported_by: '',
    validated_by: '',
    status_id: '',
    reportcompleted_date: ''
  });

  // Employee Modal Search States
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState<boolean>(false);
  const [employeeModalTarget, setEmployeeModalTarget] = useState<'reported_by' | 'validated_by' | null>(null);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState<string>('');

  // Child Analysis Form Modal State
  const [isChildModalOpen, setIsChildModalOpen] = useState<boolean>(false);
  const [childEditingId, setChildEditingId] = useState<string | null>(null);
  const [childForm, setChildForm] = useState({
    selectedOptionId: '',
    selectedDetailId: '',
    remarks: ''
  });

  // O(1) Lookup Maps
  const conditionMap = useMemo(() => new Map(conditionOptions.map(c => [c.id, c])), [conditionOptions]);
  const conditionDetailMap = useMemo(() => new Map(conditionDetailOptions.map(d => [d.detail_id, d])), [conditionDetailOptions]);
  const actMap = useMemo(() => new Map(actOptions.map(a => [a.id, a])), [actOptions]);
  const actDetailMap = useMemo(() => new Map(actDetailOptions.map(d => [d.detail_id, d])), [actDetailOptions]);
  const factorMap = useMemo(() => new Map(factorOptions.map(f => [f.id, f])), [factorOptions]);
  const factorDetailMap = useMemo(() => new Map(factorDetailOptions.map(d => [d.detail_id, d])), [factorDetailOptions]);
  const causeMap = useMemo(() => new Map(causeOptions.map(c => [c.id, c])), [causeOptions]);
  const causeDetailMap = useMemo(() => new Map(causeDetailOptions.map(d => [d.detail_id, d])), [causeDetailOptions]);

  // Fetch Equipment List for Modal Picker
  const fetchEquipmentList = useCallback(async (queryToRun?: string) => {
    try {
      setLoadingEquipment(true);
      const activeQuery = queryToRun !== undefined ? queryToRun : equipmentSearchQuery;

      let equipmentQuery = supabase
        .from('vw_vehicle_pm_details')
        .select('*')
        .order('plate_no', { ascending: true })
        .limit(50);

      if (activeQuery.trim()) {
        equipmentQuery = equipmentQuery.ilike('plate_no', `%${activeQuery.trim()}%`);
      }

      const { data, error } = await equipmentQuery;

      if (error) {
        const { data: vehData } = await supabase
          .from('vehicles')
          .select('*')
          .ilike('plate_no', `%${activeQuery.trim()}%`)
          .limit(50);

        setEquipmentList((vehData || []).map((v: Record<string, unknown>) => ({
          vehicle_id: String(v.vehicle_id),
          plate_no: String(v.plate_no || v.vehicle_plate || 'N/A'),
          make_name: String(v.make_name || v.make || ''),
          model_name: String(v.model_name || v.model || ''),
          type_description: String(v.type_description || v.type || '')
        })));
      } else {
        setEquipmentList(data || []);
      }
    } catch (err: unknown) {
      console.error('Error loading equipment:', err);
    } finally {
      setLoadingEquipment(false);
    }
  }, [equipmentSearchQuery]);

  // Fetch Incident List and Statuses
  const fetchIncidentList = useCallback(async () => {
    try {
      setLoadingIncidents(true);
      setErrorMsg(null);

      const [incRes, empRes, statusRes] = await Promise.all([
        supabase.from('incident_report').select('*, joborder_status(status_id, status_name)').order('created_at', { ascending: false }),
        supabase.from('employees').select('*'),
        supabase.from('joborder_status').select('*')
      ]);

      if (incRes.error) throw incRes.error;

      if (statusRes.data) {
        setStatuses(statusRes.data.map((s: Record<string, unknown>) => ({
          status_id: String(s.status_id),
          status_name: String(s.status_name || s.name || 'Active')
        })));
      }

      // Employees Lookup
      const empList: EmployeeOption[] = (empRes.data || []).map((e: Record<string, unknown>) => {
        const fname = String(e.first_name || '');
        const lname = String(e.last_name || '');
        const constructedName = `${fname} ${lname}`.trim();
        return {
          employee_id: String(e.employee_id),
          employee_no: String(e.employee_no || e.code || ''),
          full_name: String(e.full_name || constructedName || e.employee_name || 'Unknown Employee'),
          department: String(e.department || ''),
          position: String(e.position || e.job_title || '')
        };
      });
      setEmployees(empList);

      // Formatted Master Incidents
      const formatted: IncidentRecord[] = (incRes.data || []).map((row: Record<string, unknown>) => {
        const statusObj = row.joborder_status as Record<string, unknown> | null;
        return {
          incident_id: String(row.incident_id),
          incident_refno: String(row.incident_refno || ''),
          incident_date: String(row.incident_date || ''),
          vehicle_id: String(row.vehicle_id),
          vehicle_plate: String(row.vehicle_plate || row.plate_no || 'Assigned Vehicle'),
          incident_description: String(row.incident_description || ''),
          incident_impact: String(row.incident_impact || ''),
          incident_loss: Number(row.incident_loss || 0),
          incident_severity: (row.incident_severity as IncidentRecord['incident_severity']) || 'Low',
          reported_by: String(row.reported_by || ''),
          validated_by: String(row.validated_by || ''),
          status_id: row.status_id ? String(row.status_id) : null,
          status_name: String(statusObj?.status_name || '—'),
          reportcompleted_date: row.reportcompleted_date ? String(row.reportcompleted_date) : null,
          reported_at: String(row.reported_at || ''),
          created_at: String(row.created_at || ''),
          updated_at: String(row.updated_at || '')
        };
      });

      setIncidents(formatted);
    } catch (err: unknown) {
      console.error('Error fetching incident_report:', err);
      setErrorMsg('Failed to load incident reports from database.');
    } finally {
      setLoadingIncidents(false);
    }
  }, []);

  // Fetch Taxonomy Options and Details
  const fetchTaxonomyOptions = useCallback(async () => {
    try {
      const [condRes, condDetailRes, actRes, actDetailRes, factorRes, factorDetailRes, causeRes, causeDetailRes] = await Promise.all([
        supabase.from('unsafe_conditions').select('*').order('code'),
        supabase.from('condition_details').select('*').order('code'),
        supabase.from('unsafe_acts').select('*').order('code'),
        supabase.from('act_details').select('*').order('code'),
        supabase.from('personal_factors').select('*').order('code'),
        supabase.from('factor_details').select('*').order('code'),
        supabase.from('work_causes').select('*').order('code'),
        supabase.from('cause_details').select('*').order('code')
      ]);

      if (condRes.data) {
        setConditionOptions(condRes.data.map((r: Record<string, unknown>) => ({
          id: String(r.condition_id),
          code: String(r.code || ''),
          description: String(r.description || '')
        })));
      }
      if (condDetailRes.data) {
        setConditionDetailOptions(condDetailRes.data.map((r: Record<string, unknown>) => ({
          detail_id: String(r.detail_id),
          condition_id: String(r.condition_id),
          code: String(r.code || ''),
          description: String(r.description || '')
        })));
      }
      if (actRes.data) {
        setActOptions(actRes.data.map((r: Record<string, unknown>) => ({
          id: String(r.act_id),
          code: String(r.code || ''),
          description: String(r.description || '')
        })));
      }
      if (actDetailRes.data) {
        setActDetailOptions(actDetailRes.data.map((r: Record<string, unknown>) => ({
          detail_id: String(r.detail_id),
          act_id: String(r.act_id),
          code: String(r.code || ''),
          description: String(r.description || '')
        })));
      }
      if (factorRes.data) {
        setFactorOptions(factorRes.data.map((r: Record<string, unknown>) => ({
          id: String(r.factor_id),
          code: String(r.code || ''),
          description: String(r.description || '')
        })));
      }
      if (factorDetailRes.data) {
        setFactorDetailOptions(factorDetailRes.data.map((r: Record<string, unknown>) => ({
          detail_id: String(r.detail_id),
          factor_id: String(r.factor_id),
          code: String(r.code || ''),
          description: String(r.description || '')
        })));
      }
      if (causeRes.data) {
        setCauseOptions(causeRes.data.map((r: Record<string, unknown>) => ({
          id: String(r.cause_id),
          code: String(r.code || ''),
          description: String(r.description || '')
        })));
      }
      if (causeDetailRes.data) {
        setCauseDetailOptions(causeDetailRes.data.map((r: Record<string, unknown>) => ({
          detail_id: String(r.detail_id),
          cause_id: String(r.cause_id),
          code: String(r.code || ''),
          description: String(r.description || '')
        })));
      }
    } catch (err) {
      console.error('Error loading taxonomy options:', err);
    }
  }, []);

  // Fetch Child Records with O(1) Lookup Maps
  const fetchChildRecords = useCallback(async (incId: string) => {
    try {
      setLoadingChild(true);
      const [condRes, actRes, factorRes, causeRes] = await Promise.all([
        supabase.from('incident_conditions').select('*').eq('incident_id', incId),
        supabase.from('incident_acts').select('*').eq('incident_id', incId),
        supabase.from('incident_personal').select('*').eq('incident_id', incId),
        supabase.from('incident_workrelated').select('*').eq('incident_id', incId)
      ]);

      setIncidentConditions((condRes.data || []).map((row: Record<string, unknown>) => {
        const matchedCond = conditionMap.get(String(row.condition_id));
        const matchedDetail = conditionDetailMap.get(String(row.detail_id));
        return {
          incident_conditions_id: String(row.incident_conditions_id),
          incident_id: String(row.incident_id),
          condition_id: String(row.condition_id),
          detail_id: row.detail_id ? String(row.detail_id) : null,
          remarks: String(row.remarks || ''),
          code: matchedCond?.code,
          description: matchedCond?.description,
          detail_code: matchedDetail?.code,
          detail_description: matchedDetail?.description
        };
      }));

      setIncidentActs((actRes.data || []).map((row: Record<string, unknown>) => {
        const matchedAct = actMap.get(String(row.act_id));
        const matchedDetail = actDetailMap.get(String(row.detail_id));
        return {
          incident_act_id: String(row.incident_act_id),
          incident_id: String(row.incident_id),
          act_id: String(row.act_id),
          detail_id: row.detail_id ? String(row.detail_id) : null,
          remarks: String(row.remarks || ''),
          code: matchedAct?.code,
          description: matchedAct?.description,
          detail_code: matchedDetail?.code,
          detail_description: matchedDetail?.description
        };
      }));

      setIncidentPersonal((factorRes.data || []).map((row: Record<string, unknown>) => {
        const matchedFactor = factorMap.get(String(row.factor_id));
        const matchedDetail = factorDetailMap.get(String(row.detail_id));
        return {
          incident_personal_id: String(row.incident_personal_id),
          incident_id: String(row.incident_id),
          factor_id: String(row.factor_id),
          detail_id: row.detail_id ? String(row.detail_id) : null,
          remarks: String(row.remarks || ''),
          code: matchedFactor?.code,
          description: matchedFactor?.description,
          detail_code: matchedDetail?.code,
          detail_description: matchedDetail?.description
        };
      }));

      setIncidentWorkRelated((causeRes.data || []).map((row: Record<string, unknown>) => {
        const matchedCause = causeMap.get(String(row.cause_id));
        const matchedDetail = causeDetailMap.get(String(row.detail_id));
        return {
          incident_workrelated_id: String(row.incident_workrelated_id),
          incident_id: String(row.incident_id),
          cause_id: String(row.cause_id),
          detail_id: row.detail_id ? String(row.detail_id) : null,
          remarks: String(row.remarks || ''),
          code: matchedCause?.code,
          description: matchedCause?.description,
          detail_code: matchedDetail?.code,
          detail_description: matchedDetail?.description
        };
      }));

    } catch (err: unknown) {
      console.error('Error fetching child records:', err);
    } finally {
      setLoadingChild(false);
    }
  }, [conditionMap, conditionDetailMap, actMap, actDetailMap, factorMap, factorDetailMap, causeMap, causeDetailMap]);

  // Initial Load Effect
  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (isMounted) {
        fetchTaxonomyOptions();
        fetchEquipmentList();
        fetchIncidentList();
      }
    });

    return () => {
      isMounted = false;
    };
  }, [fetchIncidentList, fetchEquipmentList, fetchTaxonomyOptions]);

  // Selected Incident Child Load Effect
  useEffect(() => {
    let isMounted = true;

    if (selectedIncidentId) {
      queueMicrotask(() => {
        if (isMounted) {
          fetchChildRecords(selectedIncidentId);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [selectedIncidentId, fetchChildRecords]);

  // Master Incident Handlers
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setSelectedEquipment(null);
    const nextRefNo = `INC-${new Date().getFullYear()}-${String(incidents.length + 1).padStart(3, '0')}`;
    setFormData({
      incident_refno: nextRefNo,
      incident_date: new Date().toISOString().split('T')[0],
      vehicle_id: '',
      vehicle_plate: '',
      incident_severity: 'Low',
      incident_description: '',
      incident_impact: '',
      incident_loss: 0,
      reported_by: '',
      validated_by: '',
      status_id: statuses[0]?.status_id || '',
      reportcompleted_date: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (inc: IncidentRecord) => {
    if (inc.status_name === 'Completed' || inc.status_name === 'Cancelled') return;
    setEditingId(inc.incident_id);
    const matchedEq = equipmentList.find(e => (e.vehicle_id || e.equipment_id || e.id) === inc.vehicle_id);
    setSelectedEquipment(matchedEq || {
      plate_no: inc.vehicle_plate || 'Assigned Equipment',
      vehicle_id: inc.vehicle_id
    });
    setFormData({
      incident_refno: inc.incident_refno,
      incident_date: inc.incident_date,
      vehicle_id: inc.vehicle_id,
      vehicle_plate: inc.vehicle_plate || '',
      incident_severity: inc.incident_severity,
      incident_description: inc.incident_description,
      incident_impact: inc.incident_impact,
      incident_loss: inc.incident_loss,
      reported_by: inc.reported_by,
      validated_by: inc.validated_by,
      status_id: inc.status_id || '',
      reportcompleted_date: inc.reportcompleted_date || ''
    });
    setIsModalOpen(true);
  };

  const handleStatusChange = (statusIdVal: string) => {
    const selectedStatusObj = statuses.find(s => s.status_id === statusIdVal);
    const currentStatusName = selectedStatusObj?.status_name;
    
    if (currentStatusName === 'Completed') {
      const todayStr = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, status_id: statusIdVal, reportcompleted_date: todayStr }));
    } else {
      setFormData(prev => ({ ...prev, status_id: statusIdVal, reportcompleted_date: '' }));
    }
  };

  const handleSubmitMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_id) {
      setErrorMsg('Please select a valid equipment vehicle.');
      return;
    }

    try {
      setErrorMsg(null);
      const payload = {
        incident_refno: formData.incident_refno.trim(),
        incident_date: formData.incident_date,
        vehicle_id: formData.vehicle_id,
        incident_severity: formData.incident_severity,
        incident_description: formData.incident_description.trim(),
        incident_impact: formData.incident_impact.trim(),
        incident_loss: Number(formData.incident_loss || 0),
        reported_by: formData.reported_by.trim(),
        validated_by: formData.validated_by.trim(),
        status_id: formData.status_id ? formData.status_id : null,
        reportcompleted_date: formData.reportcompleted_date ? formData.reportcompleted_date : null,
        reported_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingId) {
        const { error } = await supabase
          .from('incident_report')
          .update(payload)
          .eq('incident_id', editingId);

        if (error) throw error;
        setSuccessMsg('Incident Report updated successfully.');
      } else {
        const { data, error } = await supabase
          .from('incident_report')
          .insert([payload])
          .select();

        if (error) throw error;
        setSuccessMsg('Incident Report created successfully.');
        if (data && data.length > 0) {
          setSelectedIncidentId(String(data[0].incident_id));
        }
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchIncidentList();
    } catch (err: unknown) {
      console.error('Error saving incident report:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save Incident Report.';
      setErrorMsg(msg);
    }
  };

  const handleDeleteMaster = async (id: string, statusName?: string) => {
    if (statusName === 'Completed' || statusName === 'Cancelled') return;
    if (!confirm('Are you sure you want to delete this incident report and all associated analysis records?')) return;

    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('incident_report')
        .delete()
        .eq('incident_id', id);

      if (error) throw error;

      setSuccessMsg('Incident report deleted successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      if (selectedIncidentId === id) setSelectedIncidentId(null);
      await fetchIncidentList();
    } catch (err: unknown) {
      console.error('Error deleting incident report:', err);
      setErrorMsg('Failed to delete incident report.');
    }
  };

  // Employee Modal Lookup Handler
  const handleOpenEmployeeModal = (target: 'reported_by' | 'validated_by') => {
    setEmployeeModalTarget(target);
    setEmployeeSearchQuery('');
    setIsEmployeeModalOpen(true);
  };

  const handleSelectEmployee = (emp: EmployeeOption) => {
    if (employeeModalTarget === 'reported_by') {
      setFormData(prev => ({ ...prev, reported_by: emp.full_name }));
    } else if (employeeModalTarget === 'validated_by') {
      setFormData(prev => ({ ...prev, validated_by: emp.full_name }));
    }
    setIsEmployeeModalOpen(false);
  };

  // Child Breakdown Handlers
  const handleOpenAddChild = () => {
    if (!selectedIncidentId) return;
    if (selectedIncidentRecord?.status_name === 'Completed' || selectedIncidentRecord?.status_name === 'Cancelled') return;
    setChildEditingId(null);
    setConditionDetailSearchQuery('');
    setActDetailSearchQuery('');
    setFactorDetailSearchQuery('');
    setCauseDetailSearchQuery('');

    let defaultOptionId = '';
    let defaultDetailId = '';

    if (activeAnalysisTab === 'conditions') {
      defaultOptionId = conditionOptions[0]?.id || '';
      const matchedDetails = conditionDetailOptions.filter(d => d.condition_id === defaultOptionId);
      defaultDetailId = matchedDetails[0]?.detail_id || '';
    } else if (activeAnalysisTab === 'acts') {
      defaultOptionId = actOptions[0]?.id || '';
      const matchedDetails = actDetailOptions.filter(d => d.act_id === defaultOptionId);
      defaultDetailId = matchedDetails[0]?.detail_id || '';
    } else if (activeAnalysisTab === 'personal') {
      defaultOptionId = factorOptions[0]?.id || '';
      const matchedDetails = factorDetailOptions.filter(d => d.factor_id === defaultOptionId);
      defaultDetailId = matchedDetails[0]?.detail_id || '';
    } else if (activeAnalysisTab === 'workrelated') {
      defaultOptionId = causeOptions[0]?.id || '';
      const matchedDetails = causeDetailOptions.filter(d => d.cause_id === defaultOptionId);
      defaultDetailId = matchedDetails[0]?.detail_id || '';
    }

    setChildForm({
      selectedOptionId: defaultOptionId,
      selectedDetailId: defaultDetailId,
      remarks: ''
    });
    setIsChildModalOpen(true);
  };

  const handleOpenEditChild = (rowId: string, optionId: string, remarks: string, detailId?: string | null) => {
    if (selectedIncidentRecord?.status_name === 'Completed' || selectedIncidentRecord?.status_name === 'Cancelled') return;
    setChildEditingId(rowId);
    setConditionDetailSearchQuery('');
    setActDetailSearchQuery('');
    setFactorDetailSearchQuery('');
    setCauseDetailSearchQuery('');
    setChildForm({
      selectedOptionId: optionId,
      selectedDetailId: detailId || '',
      remarks: remarks || ''
    });
    setIsChildModalOpen(true);
  };

  const handleSubmitChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentId || !childForm.selectedOptionId) return;

    try {
      setErrorMsg(null);
      let tableName = '';
      let pkField = '';
      let payload: Record<string, unknown> = {};

      if (activeAnalysisTab === 'conditions') {
        tableName = 'incident_conditions';
        pkField = 'incident_conditions_id';
        payload = {
          incident_id: selectedIncidentId,
          condition_id: childForm.selectedOptionId,
          detail_id: childForm.selectedDetailId || null,
          remarks: childForm.remarks.trim(),
          updated_at: new Date().toISOString()
        };
      } else if (activeAnalysisTab === 'acts') {
        tableName = 'incident_acts';
        pkField = 'incident_act_id';
        payload = {
          incident_id: selectedIncidentId,
          act_id: childForm.selectedOptionId,
          detail_id: childForm.selectedDetailId || null,
          remarks: childForm.remarks.trim(),
          updated_at: new Date().toISOString()
        };
      } else if (activeAnalysisTab === 'personal') {
        tableName = 'incident_personal';
        pkField = 'incident_personal_id';
        payload = {
          incident_id: selectedIncidentId,
          factor_id: childForm.selectedOptionId,
          detail_id: childForm.selectedDetailId || null,
          remarks: childForm.remarks.trim(),
          updated_at: new Date().toISOString()
        };
      } else if (activeAnalysisTab === 'workrelated') {
        tableName = 'incident_workrelated';
        pkField = 'incident_workrelated_id';
        payload = {
          incident_id: selectedIncidentId,
          cause_id: childForm.selectedOptionId,
          detail_id: childForm.selectedDetailId || null,
          remarks: childForm.remarks.trim(),
          updated_at: new Date().toISOString()
        };
      }

      if (childEditingId) {
        const { error } = await supabase
          .from(tableName)
          .update(payload)
          .eq(pkField, childEditingId);

        if (error) throw error;
        setSuccessMsg('Analysis record updated successfully.');
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert([payload]);

        if (error) throw error;
        setSuccessMsg('Analysis record added successfully.');
      }

      setIsChildModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchChildRecords(selectedIncidentId);
    } catch (err: unknown) {
      console.error('Error saving child record:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save record.';
      setErrorMsg(msg);
    }
  };

  const handleDeleteChild = async (rowId: string) => {
    if (selectedIncidentRecord?.status_name === 'Completed' || selectedIncidentRecord?.status_name === 'Cancelled') return;
    if (!confirm('Are you sure you want to remove this analysis record?')) return;

    try {
      setErrorMsg(null);
      let tableName = '';
      let pkField = '';

      if (activeAnalysisTab === 'conditions') {
        tableName = 'incident_conditions';
        pkField = 'incident_conditions_id';
      } else if (activeAnalysisTab === 'acts') {
        tableName = 'incident_acts';
        pkField = 'incident_act_id';
      } else if (activeAnalysisTab === 'personal') {
        tableName = 'incident_personal';
        pkField = 'incident_personal_id';
      } else if (activeAnalysisTab === 'workrelated') {
        tableName = 'incident_workrelated';
        pkField = 'incident_workrelated_id';
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(pkField, rowId);

      if (error) throw error;

      setSuccessMsg('Analysis record removed successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      if (selectedIncidentId) await fetchChildRecords(selectedIncidentId);
    } catch (err: unknown) {
      console.error('Error deleting child record:', err);
      setErrorMsg('Failed to remove analysis record.');
    }
  };

  // Memoized Search Filter Computations with Robust Optional Chaining
  const filteredIncidents = useMemo(() => {
    const query = incidentSearchQuery.toLowerCase().trim();
    if (!query) return incidents;
    return incidents.filter(inc => 
      (inc.incident_refno ?? '').toLowerCase().includes(query) ||
      (inc.vehicle_plate ?? '').toLowerCase().includes(query) ||
      (inc.reported_by ?? '').toLowerCase().includes(query) ||
      (inc.incident_description ?? '').toLowerCase().includes(query)
    );
  }, [incidents, incidentSearchQuery]);

  const filteredEmployees = useMemo(() => {
    const query = employeeSearchQuery.toLowerCase().trim();
    if (!query) return employees;
    return employees.filter(e => 
      (e.full_name ?? '').toLowerCase().includes(query) ||
      (e.employee_no ?? '').toLowerCase().includes(query) ||
      (e.department ?? '').toLowerCase().includes(query) ||
      (e.position ?? '').toLowerCase().includes(query)
    );
  }, [employees, employeeSearchQuery]);

  const filteredConditionDetails = useMemo(() => {
    const query = conditionDetailSearchQuery.toLowerCase().trim();
    return conditionDetailOptions.filter(d => {
      const matchesCategory = !childForm.selectedOptionId || d.condition_id === childForm.selectedOptionId;
      const matchesQuery = !query || 
        (d.code ?? '').toLowerCase().includes(query) ||
        (d.description ?? '').toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [conditionDetailOptions, childForm.selectedOptionId, conditionDetailSearchQuery]);

  const filteredActDetails = useMemo(() => {
    const query = actDetailSearchQuery.toLowerCase().trim();
    return actDetailOptions.filter(d => {
      const matchesCategory = !childForm.selectedOptionId || d.act_id === childForm.selectedOptionId;
      const matchesQuery = !query || 
        (d.code ?? '').toLowerCase().includes(query) ||
        (d.description ?? '').toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [actDetailOptions, childForm.selectedOptionId, actDetailSearchQuery]);

  const filteredFactorDetails = useMemo(() => {
    const query = factorDetailSearchQuery.toLowerCase().trim();
    return factorDetailOptions.filter(d => {
      const matchesCategory = !childForm.selectedOptionId || d.factor_id === childForm.selectedOptionId;
      const matchesQuery = !query || 
        (d.code ?? '').toLowerCase().includes(query) ||
        (d.description ?? '').toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [factorDetailOptions, childForm.selectedOptionId, factorDetailSearchQuery]);

  const filteredCauseDetails = useMemo(() => {
    const query = causeDetailSearchQuery.toLowerCase().trim();
    return causeDetailOptions.filter(d => {
      const matchesCategory = !childForm.selectedOptionId || d.cause_id === childForm.selectedOptionId;
      const matchesQuery = !query || 
        (d.code ?? '').toLowerCase().includes(query) ||
        (d.description ?? '').toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [causeDetailOptions, childForm.selectedOptionId, causeDetailSearchQuery]);

  const selectedIncidentRecord = incidents.find(inc => inc.incident_id === selectedIncidentId) || null;
  const isLockedRecord = selectedIncidentRecord?.status_name === 'Completed' || selectedIncidentRecord?.status_name === 'Cancelled';

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
      {/* Main Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600/20 text-red-400 rounded-xl">
            <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-100">Incident Reports & Cause Analysis</h1>
            <p className="text-xs text-slate-400">Log equipment incidents and analyze root causes across unsafe conditions, acts, factors, and causes.</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Incident Report</span>
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="shrink-0 bg-emerald-950/50 border border-emerald-800 text-emerald-200 px-3.5 py-2.5 rounded-lg flex items-center gap-3 text-xs shadow-inner">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="shrink-0 bg-red-950/50 border border-red-800 text-red-200 px-3.5 py-2.5 rounded-lg flex items-center gap-3 text-xs shadow-inner">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* AREA 2: COLLAPSIBLE SINGLE INCIDENT RECORD DISPLAY */}
      <div className="shrink-0 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            {/* Dynamic Incident Ref Number & Severity */}
            <div className="text-xs font-semibold whitespace-nowrap">
              {selectedIncidentRecord ? (
                <span className="flex items-center gap-1.5">
                  <span className="text-blue-400 font-mono font-bold">
                    {selectedIncidentRecord.incident_refno}
                  </span>
                  <span className="text-slate-400 font-normal">
                    ({selectedIncidentRecord.incident_severity} Severity)
                  </span>
                </span>
              ) : (
                <span className="text-slate-500 font-normal">No Incident Selected</span>
              )}
            </div>

            <button
              onClick={() => {
                setIncidentSearchQuery('');
                setIsIncidentSearchOpen(true);
              }}
              className="bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span>Search Incident Reports...</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSecondAreaOpen(!isSecondAreaOpen)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
              title={isSecondAreaOpen ? "Collapse Incident Record Display" : "Expand Incident Record Display"}
            >
              {isSecondAreaOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Body of Area 2 with Internal Scrollable Accordion */}
        {isSecondAreaOpen && (
          <div className="max-h-[35vh] overflow-y-auto pr-1 space-y-3">
            {loadingIncidents ? (
              <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>Loading incident report details...</span>
              </div>
            ) : !selectedIncidentRecord ? (
              <div className="py-6 text-center text-slate-400 space-y-2">
                <FolderSearch className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs">No Incident Report selected.</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Use the search button above to load an incident record or click &quot;New Incident Report&quot; to create a record.
                </p>
                <button
                  onClick={() => {
                    setIncidentSearchQuery('');
                    setIsIncidentSearchOpen(true);
                  }}
                  className="mt-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Browse & Select Incident</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Incident Ref #</span>
                    <div className="text-sm font-bold text-blue-400 font-mono flex items-center gap-2">
                      {selectedIncidentRecord.incident_refno}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        selectedIncidentRecord.incident_severity === 'Critical' ? 'bg-red-950 text-red-400 border border-red-800' :
                        selectedIncidentRecord.incident_severity === 'High' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        selectedIncidentRecord.incident_severity === 'Medium' ? 'bg-yellow-950 text-yellow-400 border border-yellow-800' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {selectedIncidentRecord.incident_severity} Severity
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={isLockedRecord}
                      onClick={() => handleOpenEditModal(selectedIncidentRecord)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                        isLockedRecord 
                          ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-60' 
                          : 'bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 cursor-pointer'
                      }`}
                      title={isLockedRecord ? `Cannot edit because status is "${selectedIncidentRecord.status_name}"` : 'Edit Record'}
                    >
                      {isLockedRecord ? <Lock className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                      <span>Edit</span>
                    </button>
                    <button
                      disabled={isLockedRecord}
                      onClick={() => handleDeleteMaster(selectedIncidentRecord.incident_id, selectedIncidentRecord.status_name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                        isLockedRecord 
                          ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-60' 
                          : 'bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-700 cursor-pointer'
                      }`}
                      title={isLockedRecord ? `Cannot delete because status is "${selectedIncidentRecord.status_name}"` : 'Delete'}
                    >
                      {isLockedRecord ? <Lock className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Top Row Grid details */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase block">Incident Date</span>
                    <span className="font-semibold text-slate-200 font-mono">{selectedIncidentRecord.incident_date}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase block">Equipment Vehicle</span>
                    <span className="font-bold text-slate-100">{selectedIncidentRecord.vehicle_plate}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase block">Estimated Loss</span>
                    <span className="font-semibold text-emerald-400 font-mono">
                      ₱{(selectedIncidentRecord.incident_loss || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase block">Status</span>
                    <span className="font-semibold text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900 inline-block">
                      {selectedIncidentRecord.status_name || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase block">Completed Date</span>
                    <span className="font-semibold text-slate-200 font-mono">
                      {selectedIncidentRecord.reportcompleted_date || '—'}
                    </span>
                  </div>
                </div>

                {/* Description Block */}
                <div className="pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-400 uppercase block mb-1">Description</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    {selectedIncidentRecord.incident_description || 'No description provided.'}
                  </p>
                </div>

                {/* Separate Reported By and Validated By Below Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80 flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-950/60 text-blue-400 rounded-lg shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Reported By</span>
                      <span className="text-xs font-bold text-slate-100">{selectedIncidentRecord.reported_by || '—'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80 flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-950/60 text-emerald-400 rounded-lg shrink-0">
                      <UserCheck2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Validated By</span>
                      <span className="text-xs font-bold text-slate-100">{selectedIncidentRecord.validated_by || '—'}</span>
                    </div>
                  </div>
                </div>

                {selectedIncidentRecord.incident_impact && (
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase block mb-1">Impact Summary</span>
                    <p className="text-xs text-slate-400">{selectedIncidentRecord.incident_impact}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Child Analysis Tabs Section */}
      <div className="flex flex-col flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl overflow-hidden space-y-3">
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Incident Cause Breakdown & Analysis
              {selectedIncidentRecord && (
                <span className="text-xs text-blue-400 font-mono">
                  ({selectedIncidentRecord.incident_refno} - {selectedIncidentRecord.vehicle_plate})
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {selectedIncidentRecord 
                ? `Manage environmental conditions, unsafe acts, personal factors, and work-related causes.`
                : 'Select an incident report using search above to view and assign root cause items.'}
            </p>
          </div>

          <button
            disabled={!selectedIncidentId || isLockedRecord}
            onClick={handleOpenAddChild}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow shrink-0 ${
              !selectedIncidentId || isLockedRecord 
                ? 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
            }`}
            title={isLockedRecord ? 'Analysis items cannot be added because the incident is Completed or Cancelled' : 'Add Analysis Item'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Analysis Item</span>
          </button>
        </div>

        {/* 4 Child Breakdown Tabs */}
        <div className="shrink-0 flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveAnalysisTab('conditions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeAnalysisTab === 'conditions'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Unsafe Conditions ({incidentConditions.length})</span>
          </button>

          <button
            onClick={() => setActiveAnalysisTab('acts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeAnalysisTab === 'acts'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Unsafe Acts ({incidentActs.length})</span>
          </button>

          <button
            onClick={() => setActiveAnalysisTab('personal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeAnalysisTab === 'personal'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Personal Factors ({incidentPersonal.length})</span>
          </button>

          <button
            onClick={() => setActiveAnalysisTab('workrelated')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeAnalysisTab === 'workrelated'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Work Related Causes ({incidentWorkRelated.length})</span>
          </button>
        </div>

        {/* Scrollable Container for Child Tabs */}
        <div className="flex-1 min-h-0 overflow-auto border border-slate-800/60 rounded-lg bg-slate-950">
          {loadingChild ? (
            <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Loading cause analysis items...</span>
            </div>
          ) : !selectedIncidentId ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              Select or search an Incident Report to view or add root cause items.
            </div>
          ) : (
            <>
              {/* TAB 1: UNSAFE CONDITIONS */}
              {activeAnalysisTab === 'conditions' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                      <th className="py-2 px-3 w-32">Condition Code</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Condition Detail</th>
                      <th className="py-2 px-3">Investigation Remarks</th>
                      <th className="py-2 px-3 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {incidentConditions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">No unsafe conditions recorded for this incident.</td>
                      </tr>
                    ) : (
                      incidentConditions.map((row) => (
                        <tr key={row.incident_conditions_id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-amber-400">{row.detail_code || row.code || '—'}</td>
                          <td className="py-2 px-3 text-slate-200">{row.description || '—'}</td>
                          <td className="py-2 px-3 text-slate-300 font-medium">{row.detail_description || '—'}</td>
                          <td className="py-2 px-3 text-slate-400">{row.remarks || '—'}</td>
                          <td className="py-2 px-3 text-right space-x-2 shrink-0">
                            <button
                              disabled={isLockedRecord}
                              onClick={() => handleOpenEditChild(row.incident_conditions_id, row.condition_id, row.remarks, row.detail_id)}
                              className={`p-1 rounded ${isLockedRecord ? 'text-slate-700 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300 hover:bg-slate-800 cursor-pointer'}`}
                              title={isLockedRecord ? 'Locked' : 'Edit'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={isLockedRecord}
                              onClick={() => handleDeleteChild(row.incident_conditions_id)}
                              className={`p-1 rounded ${isLockedRecord ? 'text-slate-700 cursor-not-allowed' : 'text-red-400 hover:text-red-300 hover:bg-slate-800 cursor-pointer'}`}
                              title={isLockedRecord ? 'Locked' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* TAB 2: UNSAFE ACTS */}
              {activeAnalysisTab === 'acts' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                      <th className="py-2 px-3 w-32">Act Code</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Act Detail</th>
                      <th className="py-2 px-3">Investigation Remarks</th>
                      <th className="py-2 px-3 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {incidentActs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">No unsafe acts recorded for this incident.</td>
                      </tr>
                    ) : (
                      incidentActs.map((row) => (
                        <tr key={row.incident_act_id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-amber-400">{row.detail_code || row.code || '—'}</td>
                          <td className="py-2 px-3 text-slate-200">{row.description || '—'}</td>
                          <td className="py-2 px-3 text-slate-300 font-medium">{row.detail_description || '—'}</td>
                          <td className="py-2 px-3 text-slate-400">{row.remarks || '—'}</td>
                          <td className="py-2 px-3 text-right space-x-2 shrink-0">
                            <button
                              disabled={isLockedRecord}
                              onClick={() => handleOpenEditChild(row.incident_act_id, row.act_id, row.remarks, row.detail_id)}
                              className={`p-1 rounded ${isLockedRecord ? 'text-slate-700 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300 hover:bg-slate-800 cursor-pointer'}`}
                              title={isLockedRecord ? 'Locked' : 'Edit'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={isLockedRecord}
                              onClick={() => handleDeleteChild(row.incident_act_id)}
                              className={`p-1 rounded ${isLockedRecord ? 'text-slate-700 cursor-not-allowed' : 'text-red-400 hover:text-red-300 hover:bg-slate-800 cursor-pointer'}`}
                              title={isLockedRecord ? 'Locked' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* TAB 3: PERSONAL FACTORS */}
              {activeAnalysisTab === 'personal' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                      <th className="py-2 px-3 w-32">Factor Code</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Factor Detail</th>
                      <th className="py-2 px-3">Investigation Remarks</th>
                      <th className="py-2 px-3 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {incidentPersonal.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">No personal factors recorded for this incident.</td>
                      </tr>
                    ) : (
                      incidentPersonal.map((row) => (
                        <tr key={row.incident_personal_id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-amber-400">{row.detail_code || row.code || '—'}</td>
                          <td className="py-2 px-3 text-slate-200">{row.description || '—'}</td>
                          <td className="py-2 px-3 text-slate-300 font-medium">{row.detail_description || '—'}</td>
                          <td className="py-2 px-3 text-slate-400">{row.remarks || '—'}</td>
                          <td className="py-2 px-3 text-right space-x-2 shrink-0">
                            <button
                              disabled={isLockedRecord}
                              onClick={() => handleOpenEditChild(row.incident_personal_id, row.factor_id, row.remarks, row.detail_id)}
                              className={`p-1 rounded ${isLockedRecord ? 'text-slate-700 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300 hover:bg-slate-800 cursor-pointer'}`}
                              title={isLockedRecord ? 'Locked' : 'Edit'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={isLockedRecord}
                              onClick={() => handleDeleteChild(row.incident_personal_id)}
                              className={`p-1 rounded ${isLockedRecord ? 'text-slate-700 cursor-not-allowed' : 'text-red-400 hover:text-red-300 hover:bg-slate-800 cursor-pointer'}`}
                              title={isLockedRecord ? 'Locked' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* TAB 4: WORK RELATED CAUSES */}
              {activeAnalysisTab === 'workrelated' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                      <th className="py-2 px-3 w-32">Cause Code</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Cause Detail</th>
                      <th className="py-2 px-3">Investigation Remarks</th>
                      <th className="py-2 px-3 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {incidentWorkRelated.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">No work-related causes recorded for this incident.</td>
                      </tr>
                    ) : (
                      incidentWorkRelated.map((row) => (
                        <tr key={row.incident_workrelated_id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-amber-400">{row.detail_code || row.code || '—'}</td>
                          <td className="py-2 px-3 text-slate-200">{row.description || '—'}</td>
                          <td className="py-2 px-3 text-slate-300 font-medium">{row.detail_description || '—'}</td>
                          <td className="py-2 px-3 text-slate-400">{row.remarks || '—'}</td>
                          <td className="py-2 px-3 text-right space-x-2 shrink-0">
                            <button
                              disabled={isLockedRecord}
                              onClick={() => handleOpenEditChild(row.incident_workrelated_id, row.cause_id, row.remarks, row.detail_id)}
                              className={`p-1 rounded ${isLockedRecord ? 'text-slate-700 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300 hover:bg-slate-800 cursor-pointer'}`}
                              title={isLockedRecord ? 'Locked' : 'Edit'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={isLockedRecord}
                              onClick={() => handleDeleteChild(row.incident_workrelated_id)}
                              className={`p-1 rounded ${isLockedRecord ? 'text-slate-700 cursor-not-allowed' : 'text-red-400 hover:text-red-300 hover:bg-slate-800 cursor-pointer'}`}
                              title={isLockedRecord ? 'Locked' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      </div>

      {/* INCIDENT REPORT SEARCH MODAL */}
      {isIncidentSearchOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950 shrink-0">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-400" />
                Search & Select Incident Report
              </h3>
              <button onClick={() => setIsIncidentSearchOpen(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-800 bg-slate-950/40 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Filter ref #, plate, reporter name, or description..."
                  value={incidentSearchQuery}
                  onChange={(e) => setIncidentSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {filteredIncidents.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-8">
                  No incident reports match your query.
                </div>
              ) : (
                filteredIncidents.map(inc => (
                  <div
                    key={inc.incident_id}
                    onClick={() => {
                      setSelectedIncidentId(inc.incident_id);
                      setIsIncidentSearchOpen(false);
                    }}
                    className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                      inc.incident_id === selectedIncidentId
                        ? 'bg-blue-950/80 border-blue-500 text-slate-100'
                        : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-400 text-xs">{inc.incident_refno}</span>
                        <span className="text-[11px] text-slate-400">({inc.incident_date})</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {inc.incident_severity}
                        </span>
                        {inc.status_name && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-900">
                            {inc.status_name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-200">
                        Equipment: <strong>{inc.vehicle_plate}</strong> | Reported by: {inc.reported_by || '—'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-lg">
                        {inc.incident_description}
                      </div>
                    </div>
                    <span className="text-xs text-blue-400 group-hover:underline font-semibold shrink-0">Select</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 text-right shrink-0">
              <button
                onClick={() => setIsIncidentSearchOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950 shrink-0">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                {editingId ? 'Edit Incident Report' : 'Create Incident Report'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMaster} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {/* Equipment Selector Section */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Selected Equipment <span className="text-red-500">*</span>
                  </label>
                  
                  {selectedEquipment ? (
                    <div className="flex items-center justify-between bg-slate-950 border border-blue-900/60 p-3.5 rounded-xl">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full text-xs">
                        <div>
                          <span className="text-[11px] text-slate-400 uppercase block">Plate Number / ID</span>
                          <div className="font-bold text-blue-400 text-sm font-mono">{selectedEquipment.plate_no}</div>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 uppercase block">Current Reading</span>
                          <div className="font-semibold text-slate-100">{selectedEquipment.service_rdg ?? '0'}</div>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 uppercase block">Make / Model</span>
                          <div className="font-semibold text-slate-100">{selectedEquipment.make_name || 'N/A'} {selectedEquipment.model_name ? `/ ${selectedEquipment.model_name}` : ''}</div>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 uppercase block">Type</span>
                          <div className="font-semibold text-slate-100">{selectedEquipment.type_description || 'N/A'}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEquipment(null);
                          setFormData(prev => ({ ...prev, vehicle_id: '', vehicle_plate: '' }));
                        }}
                        className="text-slate-400 hover:text-red-400 p-2 transition-colors cursor-pointer shrink-0"
                        title="Change equipment"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowEquipmentPicker(true);
                        fetchEquipmentList();
                      }}
                      className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500 text-slate-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-blue-400" />
                        {equipmentList.length > 0 ? `Click here to select an equipment (${equipmentList.length} loaded)...` : 'Click here to select an equipment...'}
                      </span>
                      <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded font-medium">Browse</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                      Incident Ref # <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.incident_refno}
                      onChange={(e) => setFormData({ ...formData, incident_refno: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                      Incident Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="date"
                        required
                        value={formData.incident_date}
                        onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                      Incident Severity Level
                    </label>
                    <select
                      value={formData.incident_severity}
                      onChange={(e) => setFormData({ ...formData, incident_severity: e.target.value as IncidentRecord['incident_severity'] })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                      Estimated Loss (₱)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-400">₱</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.incident_loss}
                        onChange={(e) => setFormData({ ...formData, incident_loss: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status_id}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Status...</option>
                      {statuses.map(st => (
                        <option key={st.status_id} value={st.status_id}>{st.status_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Read Only Completed Date Field */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Completed Date (Read-only)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="date"
                      readOnly
                      value={formData.reportcompleted_date}
                      placeholder="Automatically set when status is Completed"
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg pl-9 pr-3.5 py-2 text-xs font-mono text-slate-400 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Incident Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.incident_description}
                    onChange={(e) => setFormData({ ...formData, incident_description: e.target.value })}
                    placeholder="Describe what occurred during the equipment incident..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Incident Impact Summary
                  </label>
                  <input
                    type="text"
                    value={formData.incident_impact}
                    onChange={(e) => setFormData({ ...formData, incident_impact: e.target.value })}
                    placeholder="e.g. Downtime 4 hrs, minor bumper damage"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Reported By Employee Picker */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                      Reported By
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={formData.reported_by}
                          onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
                          placeholder="Select or enter reporter name..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenEmployeeModal('reported_by')}
                        className="bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Validated By Employee Picker */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                      Validated By
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <UserCheck2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={formData.validated_by}
                          onChange={(e) => setFormData({ ...formData, validated_by: e.target.value })}
                          placeholder="Select or enter validator name..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenEmployeeModal('validated_by')}
                        className="bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-950">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow"
                >
                  Save Incident Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EQUIPMENT PICKER MODAL */}
      {showEquipmentPicker && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-400" />
                Select Equipment
              </h3>
              <button
                type="button"
                onClick={() => setShowEquipmentPicker(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchEquipmentList(equipmentSearchQuery);
              }}
              className="p-3 border-b border-slate-800 bg-slate-950/50 flex gap-2 shrink-0"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by Equipment Plate / ID..."
                  value={equipmentSearchQuery}
                  onChange={(e) => setEquipmentSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-9 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {loadingEquipment ? (
                <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span>Loading equipment records...</span>
                </div>
              ) : equipmentList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No equipment records found.
                </div>
              ) : (
                equipmentList.map((eq, index) => {
                  const vehId = String(eq.vehicle_id || eq.equipment_id || eq.id || '');
                  return (
                    <div
                      key={vehId || index}
                      onClick={() => {
                        setSelectedEquipment(eq);
                        setFormData(prev => ({
                          ...prev,
                          vehicle_id: vehId,
                          vehicle_plate: eq.plate_no
                        }));
                        setShowEquipmentPicker(false);
                      }}
                      className="flex items-center justify-between bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-600/50 p-2.5 rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 rounded-lg group-hover:bg-blue-900/40 text-blue-400 transition-colors">
                          <Car className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-blue-400 text-xs font-mono">{eq.plate_no}</div>
                          <div className="text-[11px] text-slate-400">
                            {eq.make_name || 'N/A'} {eq.model_name ? `/ ${eq.model_name}` : ''} ({eq.type_description || 'N/A'})
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block">Service Rdg</span>
                        <div className="text-xs font-semibold text-slate-200">{eq.service_rdg ?? '0'}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE SEARCH MODAL */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950 shrink-0">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                Select Employee ({employeeModalTarget === 'reported_by' ? 'Reported By' : 'Validated By'})
              </h3>
              <button onClick={() => setIsEmployeeModalOpen(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-800 bg-slate-950/40 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search employee name, ID, or department..."
                  value={employeeSearchQuery}
                  onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {filteredEmployees.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-8">
                  No employee records found matching your query.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredEmployees.map(emp => (
                    <div
                      key={emp.employee_id}
                      onClick={() => handleSelectEmployee(emp)}
                      className="p-3 bg-slate-950 hover:bg-blue-950/60 border border-slate-800/80 hover:border-blue-600/50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 group-hover:bg-blue-600/20 text-slate-300 group-hover:text-blue-400 rounded-lg">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100">{emp.full_name}</div>
                          <div className="text-[11px] text-slate-400">
                            {emp.employee_no && <span className="font-mono text-blue-400 mr-2">{emp.employee_no}</span>}
                            {emp.position && <span>{emp.position}</span>}
                            {emp.department && <span className="text-slate-500"> ({emp.department})</span>}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-blue-400 group-hover:underline font-semibold">Select</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 text-right shrink-0">
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHILD ANALYSIS FORM MODAL */}
      {isChildModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950 shrink-0">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                {childEditingId ? 'Edit' : 'Add'} {
                  activeAnalysisTab === 'conditions' ? 'Unsafe Condition' :
                  activeAnalysisTab === 'acts' ? 'Unsafe Act' :
                  activeAnalysisTab === 'personal' ? 'Personal Factor' : 'Work Related Cause'
                }
              </h3>
              <button onClick={() => setIsChildModalOpen(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitChild} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Incident Ref
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${selectedIncidentRecord?.incident_refno} (${selectedIncidentRecord?.vehicle_plate})`}
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-3.5 py-2 text-xs text-slate-400 cursor-not-allowed focus:outline-none"
                  />
                </div>

                {/* UNSAFE CONDITIONS CUSTOM SEARCH & PICKER */}
                {activeAnalysisTab === 'conditions' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                        Unsafe Condition Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={childForm.selectedOptionId}
                        onChange={(e) => {
                          const newCondId = e.target.value;
                          const matchingDetails = conditionDetailOptions.filter(d => d.condition_id === newCondId);
                          setChildForm(prev => ({
                            ...prev,
                            selectedOptionId: newCondId,
                            selectedDetailId: matchingDetails[0]?.detail_id || ''
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Condition Category...</option>
                        {conditionOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>[{opt.code}] {opt.description}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                        Search Condition Detail (<span className="text-blue-400 font-mono">condition_details</span>)
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search detail code or description..."
                          value={conditionDetailSearchQuery}
                          onChange={(e) => setConditionDetailSearchQuery(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="border border-slate-800 rounded-xl max-h-40 overflow-y-auto bg-slate-950 divide-y divide-slate-800/60">
                        {filteredConditionDetails.length === 0 ? (
                          <div className="p-3 text-center text-slate-500 text-xs">
                            No matching condition details found.
                          </div>
                        ) : (
                          filteredConditionDetails.map(det => {
                            const isSelected = childForm.selectedDetailId === det.detail_id;
                            return (
                              <div
                                key={det.detail_id}
                                onClick={() => {
                                  setChildForm(prev => ({
                                    ...prev,
                                    selectedDetailId: det.detail_id,
                                    selectedOptionId: det.condition_id
                                  }));
                                }}
                                className={`p-2.5 cursor-pointer text-xs transition-colors flex items-center justify-between ${
                                  isSelected ? 'bg-blue-950/80 border-l-2 border-blue-500 text-blue-200' : 'hover:bg-slate-900 text-slate-300'
                                }`}
                              >
                                <div>
                                  <span className="font-mono font-bold text-amber-400 mr-2">[{det.code}]</span>
                                  <span>{det.description}</span>
                                </div>
                                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* UNSAFE ACTS CUSTOM SEARCH & PICKER */}
                {activeAnalysisTab === 'acts' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                        Unsafe Act Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={childForm.selectedOptionId}
                        onChange={(e) => {
                          const newActId = e.target.value;
                          const matchingDetails = actDetailOptions.filter(d => d.act_id === newActId);
                          setChildForm(prev => ({
                            ...prev,
                            selectedOptionId: newActId,
                            selectedDetailId: matchingDetails[0]?.detail_id || ''
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Unsafe Act Category...</option>
                        {actOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>[{opt.code}] {opt.description}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                        Search Act Detail (<span className="text-blue-400 font-mono">act_details</span>)
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search detail code or description..."
                          value={actDetailSearchQuery}
                          onChange={(e) => setActDetailSearchQuery(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="border border-slate-800 rounded-xl max-h-40 overflow-y-auto bg-slate-950 divide-y divide-slate-800/60">
                        {filteredActDetails.length === 0 ? (
                          <div className="p-3 text-center text-slate-500 text-xs">
                            No matching act details found.
                          </div>
                        ) : (
                          filteredActDetails.map(det => {
                            const isSelected = childForm.selectedDetailId === det.detail_id;
                            return (
                              <div
                                key={det.detail_id}
                                onClick={() => {
                                  setChildForm(prev => ({
                                    ...prev,
                                    selectedDetailId: det.detail_id,
                                    selectedOptionId: det.act_id
                                  }));
                                }}
                                className={`p-2.5 cursor-pointer text-xs transition-colors flex items-center justify-between ${
                                  isSelected ? 'bg-blue-950/80 border-l-2 border-blue-500 text-blue-200' : 'hover:bg-slate-900 text-slate-300'
                                }`}
                              >
                                <div>
                                  <span className="font-mono font-bold text-amber-400 mr-2">[{det.code}]</span>
                                  <span>{det.description}</span>
                                </div>
                                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* PERSONAL FACTORS CUSTOM SEARCH & PICKER */}
                {activeAnalysisTab === 'personal' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                        Personal Factor Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={childForm.selectedOptionId}
                        onChange={(e) => {
                          const newFactorId = e.target.value;
                          const matchingDetails = factorDetailOptions.filter(d => d.factor_id === newFactorId);
                          setChildForm(prev => ({
                            ...prev,
                            selectedOptionId: newFactorId,
                            selectedDetailId: matchingDetails[0]?.detail_id || ''
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Personal Factor Category...</option>
                        {factorOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>[{opt.code}] {opt.description}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                        Search Factor Detail (<span className="text-blue-400 font-mono">factor_details</span>)
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search detail code or description..."
                          value={factorDetailSearchQuery}
                          onChange={(e) => setFactorDetailSearchQuery(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="border border-slate-800 rounded-xl max-h-40 overflow-y-auto bg-slate-950 divide-y divide-slate-800/60">
                        {filteredFactorDetails.length === 0 ? (
                          <div className="p-3 text-center text-slate-500 text-xs">
                            No matching factor details found.
                          </div>
                        ) : (
                          filteredFactorDetails.map(det => {
                            const isSelected = childForm.selectedDetailId === det.detail_id;
                            return (
                              <div
                                key={det.detail_id}
                                onClick={() => {
                                  setChildForm(prev => ({
                                    ...prev,
                                    selectedDetailId: det.detail_id,
                                    selectedOptionId: det.factor_id
                                  }));
                                }}
                                className={`p-2.5 cursor-pointer text-xs transition-colors flex items-center justify-between ${
                                  isSelected ? 'bg-blue-950/80 border-l-2 border-blue-500 text-blue-200' : 'hover:bg-slate-900 text-slate-300'
                                }`}
                              >
                                <div>
                                  <span className="font-mono font-bold text-amber-400 mr-2">[{det.code}]</span>
                                  <span>{det.description}</span>
                                </div>
                                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* WORK RELATED CAUSES CUSTOM SEARCH & PICKER */}
                {activeAnalysisTab === 'workrelated' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                        Work Related Cause Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={childForm.selectedOptionId}
                        onChange={(e) => {
                          const newCauseId = e.target.value;
                          const matchingDetails = causeDetailOptions.filter(d => d.cause_id === newCauseId);
                          setChildForm(prev => ({
                            ...prev,
                            selectedOptionId: newCauseId,
                            selectedDetailId: matchingDetails[0]?.detail_id || ''
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Work Cause Category...</option>
                        {causeOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>[{opt.code}] {opt.description}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                        Search Cause Detail (<span className="text-blue-400 font-mono">cause_details</span>)
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search detail code or description..."
                          value={causeDetailSearchQuery}
                          onChange={(e) => setCauseDetailSearchQuery(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="border border-slate-800 rounded-xl max-h-40 overflow-y-auto bg-slate-950 divide-y divide-slate-800/60">
                        {filteredCauseDetails.length === 0 ? (
                          <div className="p-3 text-center text-slate-500 text-xs">
                            No matching cause details found.
                          </div>
                        ) : (
                          filteredCauseDetails.map(det => {
                            const isSelected = childForm.selectedDetailId === det.detail_id;
                            return (
                              <div
                                key={det.detail_id}
                                onClick={() => {
                                  setChildForm(prev => ({
                                    ...prev,
                                    selectedDetailId: det.detail_id,
                                    selectedOptionId: det.cause_id
                                  }));
                                }}
                                className={`p-2.5 cursor-pointer text-xs transition-colors flex items-center justify-between ${
                                  isSelected ? 'bg-blue-950/80 border-l-2 border-blue-500 text-blue-200' : 'hover:bg-slate-900 text-slate-300'
                                }`}
                              >
                                <div>
                                  <span className="font-mono font-bold text-amber-400 mr-2">[{det.code}]</span>
                                  <span>{det.description}</span>
                                </div>
                                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Investigation Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={childForm.remarks}
                    onChange={(e) => setChildForm({ ...childForm, remarks: e.target.value })}
                    placeholder="Enter specific investigation notes or observations..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-950">
                <button
                  type="button"
                  onClick={() => setIsChildModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default IncidentReport;