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
  User, 
  UserCheck2,
  ChevronDown,
  ChevronUp,
  FolderSearch,
  Lock
} from 'lucide-react';

interface EquipmentPm {
  plate_no: string;
  service_rdg?: number | null;
  make_name?: string | null;
  model_name?: string | null;
  type_description?: string | null;
  vehicle_id?: string;
  equipment_id?: string;
  id?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

interface EmployeeOption {
  employee_id: string;
  employee_no?: string;
  full_name: string;
  department?: string;
  position?: string;
  is_active?: boolean;
  is_supervisor?: boolean;
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

interface TaxonomyOption {
  id: string;
  code: string;
  description: string;
}

interface ConditionFmeaOption {
  conditionsfmea_id: string;
  condition_id: string;
  detail_id?: string | null;
  code?: string;
  description?: string;
  detail_code?: string;
  detail_description?: string;
  computed_rpn?: number | null;
  currentcontrols_desc?: string;
}

interface ActFmeaOption {
  actfmea_id: string;
  act_id: string;
  detail_id?: string | null;
  code?: string;
  description?: string;
  detail_code?: string;
  detail_description?: string;
  computed_rpn?: number | null;
  currentcontrols_desc?: string;
}

interface FactorFmeaOption {
  factors_fmea_id: string;
  factor_id: string;
  detail_id?: string | null;
  code?: string;
  description?: string;
  detail_code?: string;
  detail_description?: string;
  computed_rpn?: number | null;
  currentcontrols_desc?: string;
}

interface CauseFmeaOption {
  cause_fmea_id: string;
  cause_id: string;
  detail_id?: string | null;
  code?: string;
  description?: string;
  detail_code?: string;
  detail_description?: string;
  computed_rpn?: number | null;
  currentcontrols_desc?: string;
}

interface IncidentConditionRecord {
  incident_conditions_id: string;
  incident_id: string;
  condition_id: string;
  detail_id?: string | null;
  conditionsfmea_id?: string | null;
  remarks: string;
  code?: string;
  description?: string;
  detail_code?: string;
  detail_description?: string;
  computed_rpn?: number | null;
  [key: string]: unknown;
}

interface IncidentActRecord {
  incident_act_id: string;
  incident_id: string;
  act_id: string;
  detail_id?: string | null;
  actfmea_id?: string | null;
  remarks: string;
  code?: string;
  description?: string;
  detail_code?: string;
  detail_description?: string;
  computed_rpn?: number | null;
  [key: string]: unknown;
}

interface IncidentPersonalRecord {
  incident_personal_id: string;
  incident_id: string;
  factor_id: string;
  detail_id?: string | null;
  factors_fmea_id?: string | null;
  remarks: string;
  code?: string;
  description?: string;
  detail_code?: string;
  detail_description?: string;
  computed_rpn?: number | null;
  [key: string]: unknown;
}

interface IncidentWorkRelatedRecord {
  incident_workrelated_id: string;
  incident_id: string;
  cause_id: string;
  detail_id?: string | null;
  cause_fmea_id?: string | null;
  remarks: string;
  code?: string;
  description?: string;
  detail_code?: string;
  detail_description?: string;
  computed_rpn?: number | null;
  [key: string]: unknown;
}

type AnalysisTab = 'conditions' | 'acts' | 'personal' | 'workrelated';

export function IncidentReport() {
  const [isSecondAreaOpen, setIsSecondAreaOpen] = useState<boolean>(true);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null); 
  const [loadingIncidents, setLoadingIncidents] = useState<boolean>(false);

  const [isIncidentSearchOpen, setIsIncidentSearchOpen] = useState<boolean>(false);
  const [incidentSearchQuery, setIncidentSearchQuery] = useState<string>('');

  const [equipmentList, setEquipmentList] = useState<EquipmentPm[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentPm | null>(null);
  const [showEquipmentPicker, setShowEquipmentPicker] = useState<boolean>(false);
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState<string>('');
  const [loadingEquipment, setLoadingEquipment] = useState<boolean>(false);

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [statuses, setStatuses] = useState<StatusOption[]>([]);

  const [conditionOptions, setConditionOptions] = useState<TaxonomyOption[]>([]);
  const [conditionFmeaList, setConditionFmeaList] = useState<ConditionFmeaOption[]>([]);

  const [actOptions, setActOptions] = useState<TaxonomyOption[]>([]);
  const [actFmeaList, setActFmeaList] = useState<ActFmeaOption[]>([]);

  const [factorOptions, setFactorOptions] = useState<TaxonomyOption[]>([]);
  const [factorFmeaList, setFactorFmeaList] = useState<FactorFmeaOption[]>([]);

  const [causeOptions, setCauseOptions] = useState<TaxonomyOption[]>([]);
  const [causeFmeaList, setCauseFmeaList] = useState<CauseFmeaOption[]>([]);

  const [activeAnalysisTab, setActiveAnalysisTab] = useState<AnalysisTab>('conditions');

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [incidentConditions, setIncidentConditions] = useState<IncidentConditionRecord[]>([]);
  const [incidentActs, setIncidentActs] = useState<IncidentActRecord[]>([]);
  const [incidentPersonal, setIncidentPersonal] = useState<IncidentPersonalRecord[]>([]);
  const [incidentWorkRelated, setIncidentWorkRelated] = useState<IncidentWorkRelatedRecord[]>([]);
  const [loadingChild, setLoadingChild] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState<boolean>(false);
  const [employeeModalTarget, setEmployeeModalTarget] = useState<'reported_by' | 'validated_by' | null>(null);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState<string>('');

  const [isChildModalOpen, setIsChildModalOpen] = useState<boolean>(false);
  const [childEditingId, setChildEditingId] = useState<string | null>(null);
  const [childForm, setChildForm] = useState({
    selectedOptionId: '',
    selectedFmeaId: '',
    remarks: ''
  });

  const conditionMap = useMemo(() => new Map(conditionOptions.map(c => [c.id, c])), [conditionOptions]);
  const conditionFmeaMap = useMemo(() => new Map(conditionFmeaList.map(f => [f.conditionsfmea_id, f])) as Map<string, ConditionFmeaOption>, [conditionFmeaList]);

  const actMap = useMemo(() => new Map(actOptions.map(a => [a.id, a])), [actOptions]);
  const actFmeaMap = useMemo(() => new Map(actFmeaList.map(f => [f.actfmea_id, f])) as Map<string, ActFmeaOption>, [actFmeaList]);

  const factorMap = useMemo(() => new Map(factorOptions.map(f => [f.id, f])), [factorOptions]);
  const factorFmeaMap = useMemo(() => new Map(factorFmeaList.map(f => [f.factors_fmea_id, f])) as Map<string, FactorFmeaOption>, [factorFmeaList]);

  const causeMap = useMemo(() => new Map(causeOptions.map(c => [c.id, c])), [causeOptions]);
  const causeFmeaMap = useMemo(() => new Map(causeFmeaList.map(f => [f.cause_fmea_id, f])) as Map<string, CauseFmeaOption>, [causeFmeaList]);

  const fetchEquipmentList = useCallback(async (queryToRun?: string) => {
    try {
      setLoadingEquipment(true);
      const activeQuery = queryToRun !== undefined ? queryToRun : equipmentSearchQuery;

      let equipmentQuery = supabase
        .from('vw_vehicle_pm_details')
        .select('*')
        .eq('is_active', true)
        .order('plate_no', { ascending: true })
        .limit(50);

      if (activeQuery.trim()) {
        equipmentQuery = equipmentQuery.ilike('plate_no', `%${activeQuery.trim()}%`);
      }

      const { data, error } = await equipmentQuery;

      if (error || !data) {
        const { data: vehData } = await supabase
          .from('vehicles')
          .select('*')
          .eq('is_active', true)
          .ilike('plate_no', `%${activeQuery.trim()}%`)
          .limit(50);

        setEquipmentList((vehData || []).map((v: Record<string, unknown>) => ({
          vehicle_id: String(v.vehicle_id),
          plate_no: String(v.plate_no || v.vehicle_plate || 'N/A'),
          make_name: String(v.make_name || v.make || ''),
          model_name: String(v.model_name || v.model || ''),
          type_description: String(v.type_description || v.type || ''),
          is_active: Boolean(v.is_active ?? true)
        })));
      } else {
        setEquipmentList((data || []).filter((e: EquipmentPm) => e.is_active !== false));
      }
    } catch {
      // Handled silently
    } finally {
      setLoadingEquipment(false);
    }
  }, [equipmentSearchQuery]);

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

      const empList: EmployeeOption[] = (empRes.data || []).map((e: Record<string, unknown>) => {
        const fname = String(e.first_name || '');
        const lname = String(e.last_name || '');
        const constructedName = `${fname} ${lname}`.trim();
        return {
          employee_id: String(e.employee_id),
          employee_no: String(e.employee_no || e.code || ''),
          full_name: String(e.full_name || constructedName || e.employee_name || 'Unknown Employee'),
          department: String(e.department || ''),
          position: String(e.position || e.job_title || ''),
          is_active: Boolean(e.is_active ?? true),
          is_supervisor: Boolean(e.is_supervisor ?? false)
        };
      });
      setEmployees(empList);

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
    } catch {
      setErrorMsg('Failed to load incident reports from database.');
    } finally {
      setLoadingIncidents(false);
    }
  }, []);

  const fetchTaxonomyOptions = useCallback(async () => {
    try {
      const [
        condRes, condFmeaRes, 
        actRes, actFmeaRes, 
        factorRes, factorFmeaRes, 
        causeRes, causeFmeaRes
      ] = await Promise.all([
        supabase.from('unsafe_conditions').select('*').order('code'),
        supabase.from('conditions_fmea').select('*, unsafe_conditions(code, description), condition_details(code, description), fmea_currentcontrols(currentcontrols_desc)').order('computed_rpn', { ascending: false }),
        supabase.from('unsafe_acts').select('*').order('code'),
        supabase.from('act_fmea').select('*, unsafe_acts(code, description), act_details(code, description), fmea_currentcontrols(currentcontrols_desc)').order('computed_rpn', { ascending: false }),
        supabase.from('personal_factors').select('*').order('code'),
        supabase.from('factors_fmea').select('*, personal_factors(code, description), factor_details(code, description), fmea_currentcontrols(currentcontrols_desc)').order('computed_rpn', { ascending: false }),
        supabase.from('work_causes').select('*').order('code'),
        supabase.from('cause_fmea').select('*, work_causes(code, description), cause_details(code, description), fmea_currentcontrols(currentcontrols_desc)').order('computed_rpn', { ascending: false })
      ]);

      if (condRes.data) {
        setConditionOptions(condRes.data.map((r: Record<string, unknown>) => ({
          id: String(r.condition_id),
          code: String(r.code || ''),
          description: String(r.description || '')
        })));
      }
      if (condFmeaRes.data) {
        setConditionFmeaList(condFmeaRes.data.map((r: Record<string, unknown>) => {
          const parentObj = r.unsafe_conditions as Record<string, unknown> | null;
          const detailObj = r.condition_details as Record<string, unknown> | null;
          const controlObj = r.fmea_currentcontrols as Record<string, unknown> | null;
          return {
            conditionsfmea_id: String(r.conditionsfmea_id),
            condition_id: String(r.condition_id),
            detail_id: r.detail_id ? String(r.detail_id) : null,
            code: String(parentObj?.code || ''),
            description: String(parentObj?.description || ''),
            detail_code: String(detailObj?.code || ''),
            detail_description: String(detailObj?.description || ''),
            computed_rpn: r.computed_rpn ? Number(r.computed_rpn) : null,
            currentcontrols_desc: String(controlObj?.currentcontrols_desc || '—')
          };
        }));
      }

      if (actRes.data) {
        setActOptions(actRes.data.map((r: Record<string, unknown>) => ({
          id: String(r.act_id),
          code: String(r.code || ''),
          description: String(r.description || '')
        })));
      }
      if (actFmeaRes.data) {
        setActFmeaList(actFmeaRes.data.map((r: Record<string, unknown>) => {
          const parentObj = r.unsafe_acts as Record<string, unknown> | null;
          const detailObj = r.act_details as Record<string, unknown> | null;
          const controlObj = r.fmea_currentcontrols as Record<string, unknown> | null;
          return {
            actfmea_id: String(r.actfmea_id),
            act_id: String(r.act_id),
            detail_id: r.detail_id ? String(r.detail_id) : null,
            code: String(parentObj?.code || ''),
            description: String(parentObj?.description || ''),
            detail_code: String(detailObj?.code || ''),
            detail_description: String(detailObj?.description || ''),
            computed_rpn: r.computed_rpn ? Number(r.computed_rpn) : null,
            currentcontrols_desc: String(controlObj?.currentcontrols_desc || '—')
          };
        }));
      }

      if (factorRes.data) {
        setFactorOptions(factorRes.data.map((r: Record<string, unknown>) => ({
          id: String(r.factor_id),
          code: String(r.code || ''),
          description: String(r.description || '')
        })));
      }
      if (factorFmeaRes.data) {
        setFactorFmeaList(factorFmeaRes.data.map((r: Record<string, unknown>) => {
          const parentObj = r.personal_factors as Record<string, unknown> | null;
          const detailObj = r.factor_details as Record<string, unknown> | null;
          const controlObj = r.fmea_currentcontrols as Record<string, unknown> | null;
          return {
            factors_fmea_id: String(r.factors_fmea_id),
            factor_id: String(r.factor_id),
            detail_id: r.detail_id ? String(r.detail_id) : null,
            code: String(parentObj?.code || ''),
            description: String(parentObj?.description || ''),
            detail_code: String(detailObj?.code || ''),
            detail_description: String(detailObj?.description || ''),
            computed_rpn: r.computed_rpn ? Number(r.computed_rpn) : null,
            currentcontrols_desc: String(controlObj?.currentcontrols_desc || '—')
          };
        }));
      }

      if (causeRes.data) {
        setCauseOptions(causeRes.data.map((r: Record<string, unknown>) => ({
          id: String(r.cause_id),
          code: String(r.code || ''),
          description: String(r.description || '')
        })));
      }
      if (causeFmeaRes.data) {
        setCauseFmeaList(causeFmeaRes.data.map((r: Record<string, unknown>) => {
          const parentObj = r.work_causes as Record<string, unknown> | null;
          const detailObj = r.cause_details as Record<string, unknown> | null;
          const controlObj = r.fmea_currentcontrols as Record<string, unknown> | null;
          return {
            cause_fmea_id: String(r.cause_fmea_id),
            cause_id: String(r.cause_id),
            detail_id: r.detail_id ? String(r.detail_id) : null,
            code: String(parentObj?.code || ''),
            description: String(parentObj?.description || ''),
            detail_code: String(detailObj?.code || ''),
            detail_description: String(detailObj?.description || ''),
            computed_rpn: r.computed_rpn ? Number(r.computed_rpn) : null,
            currentcontrols_desc: String(controlObj?.currentcontrols_desc || '—')
          };
        }));
      }
    } catch {
      // Handled silently
    }
  }, []);

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
        const matchedFmea = conditionFmeaMap.get(String(row.conditionsfmea_id || row.fmea_id)) ?? ({} as ConditionFmeaOption);
        const matchedCond = conditionMap.get(String(row.condition_id || matchedFmea.condition_id));
        return {
          incident_conditions_id: String(row.incident_conditions_id),
          incident_id: String(row.incident_id),
          condition_id: String(row.condition_id || matchedFmea.condition_id || ''),
          detail_id: row.detail_id ? String(row.detail_id) : matchedFmea.detail_id,
          conditionsfmea_id: row.conditionsfmea_id ? String(row.conditionsfmea_id) : null,
          remarks: String(row.remarks || ''),
          code: matchedCond?.code || matchedFmea.code,
          description: matchedCond?.description || matchedFmea.description,
          detail_code: matchedFmea.detail_code,
          detail_description: matchedFmea.detail_description,
          computed_rpn: matchedFmea.computed_rpn ?? null
        };
      }));

      setIncidentActs((actRes.data || []).map((row: Record<string, unknown>) => {
        const matchedFmea = actFmeaMap.get(String(row.actfmea_id || row.fmea_id)) || ({} as Partial<ActFmeaOption>);
        const matchedAct = actMap.get(String(row.act_id || matchedFmea.act_id));
        return {
          incident_act_id: String(row.incident_act_id),
          incident_id: String(row.incident_id),
          act_id: String(row.act_id || matchedFmea.act_id || ''),
          detail_id: row.detail_id ? String(row.detail_id) : matchedFmea.detail_id,
          actfmea_id: row.actfmea_id ? String(row.actfmea_id) : null,
          remarks: String(row.remarks || ''),
          code: matchedAct?.code || matchedFmea.code,
          description: matchedAct?.description || matchedFmea.description,
          detail_code: matchedFmea.detail_code,
          detail_description: matchedFmea.detail_description,
          computed_rpn: matchedFmea.computed_rpn ?? null
        };
      }));

      setIncidentPersonal((factorRes.data || []).map((row: Record<string, unknown>) => {
        const matchedFmea = factorFmeaMap.get(String(row.factors_fmea_id || row.fmea_id)) || ({} as Partial<FactorFmeaOption>);
        const matchedFactor = factorMap.get(String(row.factor_id || matchedFmea.factor_id));
        return {
          incident_personal_id: String(row.incident_personal_id),
          incident_id: String(row.incident_id),
          factor_id: String(row.factor_id || matchedFmea.factor_id || ''),
          detail_id: row.detail_id ? String(row.detail_id) : matchedFmea.detail_id,
          factors_fmea_id: row.factors_fmea_id ? String(row.factors_fmea_id) : null,
          remarks: String(row.remarks || ''),
          code: matchedFactor?.code || matchedFmea.code,
          description: matchedFactor?.description || matchedFmea.description,
          detail_code: matchedFmea.detail_code,
          detail_description: matchedFmea.detail_description,
          computed_rpn: matchedFmea.computed_rpn ?? null
        };
      }));

      setIncidentWorkRelated((causeRes.data || []).map((row: Record<string, unknown>) => {
        const matchedFmea = causeFmeaMap.get(String(row.cause_fmea_id || row.fmea_id)) || ({} as Partial<CauseFmeaOption>);
        const matchedCause = causeMap.get(String(row.cause_id || matchedFmea.cause_id));
        return {
          incident_workrelated_id: String(row.incident_workrelated_id),
          incident_id: String(row.incident_id),
          cause_id: String(row.cause_id || matchedFmea.cause_id || ''),
          detail_id: row.detail_id ? String(row.detail_id) : matchedFmea.detail_id,
          cause_fmea_id: row.cause_fmea_id ? String(row.cause_fmea_id) : null,
          remarks: String(row.remarks || ''),
          code: matchedCause?.code || matchedFmea.code,
          description: matchedCause?.description || matchedFmea.description,
          detail_code: matchedFmea.detail_code,
          detail_description: matchedFmea.detail_description,
          computed_rpn: matchedFmea.computed_rpn ?? null
        };
      }));

    } catch {
      // Handled silently
    } finally {
      setLoadingChild(false);
    }
  }, [conditionMap, conditionFmeaMap, actMap, actFmeaMap, factorMap, factorFmeaMap, causeMap, causeFmeaMap]);

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        fetchTaxonomyOptions();
        fetchEquipmentList();
        fetchIncidentList();
      }
    });
    return () => { isMounted = false; };
  }, [fetchIncidentList, fetchEquipmentList, fetchTaxonomyOptions]);

  useEffect(() => {
    let isMounted = true;
    if (selectedIncidentId) {
      queueMicrotask(() => {
        if (isMounted) {
          fetchChildRecords(selectedIncidentId);
        }
      });
    }
    return () => { isMounted = false; };
  }, [selectedIncidentId, fetchChildRecords]);

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
      setErrorMsg('Please select a valid active equipment.');
      return;
    }
    if (!formData.reported_by.trim()) {
      setErrorMsg('Please select a valid active employee for "Reported by".');
      return;
    }
    if (!formData.validated_by.trim()) {
      setErrorMsg('Please select a valid active supervisor for "Validated by".');
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
    } catch {
      setErrorMsg('Failed to delete incident report.');
    }
  };

  const handleOpenEmployeeModal = (target: 'reported_by' | 'validated_by') => {
    setEmployeeModalTarget(target);
    setEmployeeSearchQuery('');
    setIsEmployeeModalOpen(true);
  };

  const handleSelectEmployee = (emp: EmployeeOption) => {
    if (employeeModalTarget === 'reported_by') {
      if (emp.is_active === false) {
        alert('Selected employee is inactive.');
        return;
      }
      setFormData(prev => ({ ...prev, reported_by: emp.full_name }));
    } else if (employeeModalTarget === 'validated_by') {
      if (emp.is_active === false || !emp.is_supervisor) {
        alert('Validated by must be an active employee and a supervisor (is_supervisor = true).');
        return;
      }
      setFormData(prev => ({ ...prev, validated_by: emp.full_name }));
    }
    setIsEmployeeModalOpen(false);
  };

  const handleOpenAddChild = () => {
    if (!selectedIncidentId) return;
    if (selectedIncidentRecord?.status_name === 'Completed' || selectedIncidentRecord?.status_name === 'Cancelled') return;
    setChildEditingId(null);

    let defaultOptionId = '';
    let defaultFmeaId = '';

    if (activeAnalysisTab === 'conditions') {
      defaultOptionId = conditionOptions[0]?.id || '';
      const matchedFmeas = conditionFmeaList.filter(f => f.condition_id === defaultOptionId);
      defaultFmeaId = matchedFmeas[0]?.conditionsfmea_id || '';
    } else if (activeAnalysisTab === 'acts') {
      defaultOptionId = actOptions[0]?.id || '';
      const matchedFmeas = actFmeaList.filter(f => f.act_id === defaultOptionId);
      defaultFmeaId = matchedFmeas[0]?.actfmea_id || '';
    } else if (activeAnalysisTab === 'personal') {
      defaultOptionId = factorOptions[0]?.id || '';
      const matchedFmeas = factorFmeaList.filter(f => f.factor_id === defaultOptionId);
      defaultFmeaId = matchedFmeas[0]?.factors_fmea_id || '';
    } else if (activeAnalysisTab === 'workrelated') {
      defaultOptionId = causeOptions[0]?.id || '';
      const matchedFmeas = causeFmeaList.filter(f => f.cause_id === defaultOptionId);
      defaultFmeaId = matchedFmeas[0]?.cause_fmea_id || '';
    }

    setChildForm({
      selectedOptionId: defaultOptionId,
      selectedFmeaId: defaultFmeaId,
      remarks: ''
    });
    setIsChildModalOpen(true);
  };

  const handleOpenEditChild = (rowId: string, optionId: string, remarks: string, fmeaId?: string | null) => {
    if (selectedIncidentRecord?.status_name === 'Completed' || selectedIncidentRecord?.status_name === 'Cancelled') return;
    setChildEditingId(rowId);
    setChildForm({
      selectedOptionId: optionId,
      selectedFmeaId: fmeaId || '',
      remarks: remarks || ''
    });
    setIsChildModalOpen(true);
  };

  const handleSubmitChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentId || !childForm.selectedOptionId || !childForm.selectedFmeaId) return;

    try {
      setErrorMsg(null);
      let tableName = '';
      let pkField = '';
      let payload: Record<string, unknown> = {};

      if (activeAnalysisTab === 'conditions') {
        tableName = 'incident_conditions';
        pkField = 'incident_conditions_id';
        const selectedFmea = conditionFmeaMap.get(childForm.selectedFmeaId);
        payload = {
          incident_id: selectedIncidentId,
          condition_id: childForm.selectedOptionId,
          detail_id: selectedFmea?.detail_id || null,
          conditionsfmea_id: childForm.selectedFmeaId,
          remarks: childForm.remarks.trim(),
          updated_at: new Date().toISOString()
        };
      } else if (activeAnalysisTab === 'acts') {
        tableName = 'incident_acts';
        pkField = 'incident_act_id';
        const selectedFmea = actFmeaMap.get(childForm.selectedFmeaId);
        payload = {
          incident_id: selectedIncidentId,
          act_id: childForm.selectedOptionId,
          detail_id: selectedFmea?.detail_id || null,
          actfmea_id: childForm.selectedFmeaId,
          remarks: childForm.remarks.trim(),
          updated_at: new Date().toISOString()
        };
      } else if (activeAnalysisTab === 'personal') {
        tableName = 'incident_personal';
        pkField = 'incident_personal_id';
        const selectedFmea = factorFmeaMap.get(childForm.selectedFmeaId);
        payload = {
          incident_id: selectedIncidentId,
          factor_id: childForm.selectedOptionId,
          detail_id: selectedFmea?.detail_id || null,
          factors_fmea_id: childForm.selectedFmeaId,
          remarks: childForm.remarks.trim(),
          updated_at: new Date().toISOString()
        };
      } else if (activeAnalysisTab === 'workrelated') {
        tableName = 'incident_workrelated';
        pkField = 'incident_workrelated_id';
        const selectedFmea = causeFmeaMap.get(childForm.selectedFmeaId);
        payload = {
          incident_id: selectedIncidentId,
          cause_id: childForm.selectedOptionId,
          detail_id: selectedFmea?.detail_id || null,
          cause_fmea_id: childForm.selectedFmeaId,
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
    } catch {
      setErrorMsg('Failed to remove analysis record.');
    }
  };

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
    return employees.filter(e => {
      if (e.is_active === false) return false;
      if (employeeModalTarget === 'validated_by' && !e.is_supervisor) {
        return false;
      }
      if (!query) return true;

      return (
        (e.full_name ?? '').toLowerCase().includes(query) ||
        (e.employee_no ?? '').toLowerCase().includes(query) ||
        (e.department ?? '').toLowerCase().includes(query) ||
        (e.position ?? '').toLowerCase().includes(query)
      );
    });
  }, [employees, employeeSearchQuery, employeeModalTarget]);

  const selectedIncidentRecord = incidents.find(inc => inc.incident_id === selectedIncidentId) || null;
  const isLockedRecord = selectedIncidentRecord?.status_name === 'Completed' || selectedIncidentRecord?.status_name === 'Cancelled';

  // Helper renderer for paginated tables
  const renderPaginatedTable = (
    dataList: Array<IncidentConditionRecord | IncidentActRecord | IncidentPersonalRecord | IncidentWorkRelatedRecord>, 
    idKey: string, 
    fmeaIdKey: string, 
    parentIdKey: string
  ) => {
    const totalRecords = dataList.length;
    const paginatedItems = dataList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-(--accent-subtle) text-(--text-muted) uppercase border-b border-(--border-main) sticky top-0 z-10 shadow-xs">
                <th className="py-2 px-3 w-32">Detail Code</th>
                <th className="py-2 px-3">Detail Description</th>
                <th className="py-2 px-3">RPN</th>
                <th className="py-2 px-3">Investigation Remarks</th>
                <th className="py-2 px-3 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
              {totalRecords === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-(--text-muted) text-xs italic">
                    No records found for this category. Click &quot;Add Analysis Item&quot; above to begin.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((row) => (
                  <tr key={String(row[idKey])} className="hover:bg-(--accent-subtle) transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">{String(row.detail_code || '—')}</td>
                    <td className="py-2 px-3 text-(--text-primary) font-medium">{String(row.detail_description || '—')}</td>
                    <td className="py-2 px-3 font-mono font-bold">{row.computed_rpn ?? '—'}</td>
                    <td className="py-2 px-3 text-(--text-muted)">{String(row.remarks || '—')}</td>
                    <td className="py-2 px-3 text-right space-x-2 shrink-0">
                      <button 
                        disabled={isLockedRecord} 
                        onClick={() => handleOpenEditChild(String(row[idKey]), String(row[parentIdKey]), String(row.remarks || ''), String(row[fmeaIdKey] || ''))} 
                        className={`p-1 rounded ${isLockedRecord ? 'text-(--text-muted) cursor-not-allowed' : 'text-(--text-primary) hover:bg-(--accent-subtle) cursor-pointer'}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        disabled={isLockedRecord} 
                        onClick={() => handleDeleteChild(String(row[idKey]))} 
                        className={`p-1 rounded ${isLockedRecord ? 'text-(--text-muted) cursor-not-allowed' : 'text-red-600 dark:text-red-400 hover:bg-(--accent-subtle) cursor-pointer'}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-2 px-1 shrink-0 text-xs text-(--text-secondary)">
          <div className="flex items-center gap-2">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-(--bg-elevated) border border-(--border-main) rounded px-2 py-1 text-xs text-(--text-primary)"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            <span>
              Showing {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} entries
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || totalRecords === 0}
              className="px-2.5 py-1 bg-(--bg-elevated) border border-(--border-main) rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-mono">
              Page {totalRecords === 0 ? 0 : currentPage} of {Math.max(Math.ceil(totalRecords / pageSize), 1)}
            </span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage * pageSize >= totalRecords || totalRecords === 0}
              className="px-2.5 py-1 bg-(--bg-elevated) border border-(--border-main) rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-(--border-main) pb-3 shrink-0">
        <div className="bg-black text-white p-2 rounded-xl shadow-xs shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">
            Incident Reports & Cause Analysis
          </h1>
          <p className="text-xs sm:text-sm text-(--text-muted)">
            Log equipment incidents and analyze root causes from FMEA taxonomy tables.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-2.5 rounded-lg flex items-center gap-3 text-xs shrink-0">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-2.5 rounded-lg flex items-center gap-3 text-xs shrink-0">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="shrink-0 bg-(--bg-surface) border border-(--border-main) shadow-xs rounded-xl p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border-main) pb-2.5">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold whitespace-nowrap">
              {selectedIncidentRecord ? (
                <span className="flex items-center gap-1.5">
                  <span className="text-(--text-primary) font-mono font-bold">
                    {selectedIncidentRecord.incident_refno}
                  </span>
                  <span className="text-(--text-muted) font-normal">
                    ({selectedIncidentRecord.incident_severity} Severity)
                  </span>
                </span>
              ) : (
                <span className="text-(--text-muted) font-normal">No Incident Selected</span>
              )}
            </div>

            <button
              onClick={() => {
                setIncidentSearchQuery('');
                setIsIncidentSearchOpen(true);
              }}
              className="bg-(--bg-elevated) hover:opacity-80 text-(--text-primary) border border-(--border-main) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-(--text-primary)" />
              <span>Search Incident Reports...</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateModal}
              className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Incident Report</span>
            </button>

            <button
              onClick={() => setIsSecondAreaOpen(!isSecondAreaOpen)}
              className="px-2.5 py-1.5 bg-(--accent-subtle) hover:opacity-80 text-(--text-primary) border border-(--border-main) rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
            >
              {isSecondAreaOpen ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Expand</span>
                </>
              )}
            </button>
          </div>
        </div>

        {isSecondAreaOpen && (
          <div className="max-h-[25vh] overflow-y-auto pr-1 space-y-2.5">
            {loadingIncidents ? (
              <div className="py-4 text-center text-(--text-muted) flex items-center justify-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-(--text-primary)" />
                <span>Loading incident report details...</span>
              </div>
            ) : !selectedIncidentRecord ? (
              <div className="py-3 text-center text-(--text-muted) space-y-1">
                <FolderSearch className="w-6 h-6 text-(--text-muted) mx-auto" />
                <p className="text-xs">No Incident Report selected.</p>
                <button
                  onClick={() => {
                    setIncidentSearchQuery('');
                    setIsIncidentSearchOpen(true);
                  }}
                  className="mt-1 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Browse & Select Incident</span>
                </button>
              </div>
            ) : (
              <div className="bg-(--bg-elevated) border border-(--border-main) rounded-xl p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-main) pb-2">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-(--text-muted) block">Incident Ref #</span>
                    <div className="text-sm font-bold text-(--text-primary) font-mono flex items-center gap-2">
                      {selectedIncidentRecord.incident_refno}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        selectedIncidentRecord.incident_severity === 'Critical' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800' :
                        selectedIncidentRecord.incident_severity === 'High' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800' :
                        selectedIncidentRecord.incident_severity === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800' :
                        'bg-(--accent-subtle) text-(--text-secondary) border border-(--border-main)'
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
                        isLockedRecord ? 'bg-(--accent-subtle) text-(--text-muted) border border-(--border-main) cursor-not-allowed opacity-60' : 'bg-(--accent-subtle) hover:opacity-80 text-(--text-primary) border border-(--border-main) cursor-pointer'
                      }`}
                    >
                      {isLockedRecord ? <Lock className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                      <span>Edit</span>
                    </button>
                    <button
                      disabled={isLockedRecord}
                      onClick={() => handleDeleteMaster(selectedIncidentRecord.incident_id, selectedIncidentRecord.status_name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                        isLockedRecord ? 'bg-(--accent-subtle) text-(--text-muted) border border-(--border-main) cursor-not-allowed opacity-60' : 'bg-(--accent-subtle) hover:opacity-80 text-red-600 dark:text-red-400 border border-(--border-main) cursor-pointer'
                      }`}
                    >
                      {isLockedRecord ? <Lock className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-(--text-muted) uppercase block">Incident Date</span>
                    <span className="font-semibold text-(--text-primary) font-mono">{selectedIncidentRecord.incident_date}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-(--text-muted) uppercase block">Equipment Vehicle</span>
                    <span className="font-bold text-(--text-primary)">{selectedIncidentRecord.vehicle_plate}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-(--text-muted) uppercase block">Estimated Loss</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                      ₱{(selectedIncidentRecord.incident_loss || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-(--text-muted) uppercase block">Status</span>
                    <span className="font-semibold text-(--text-primary) bg-(--accent-subtle) px-2 py-0.5 rounded border border-(--border-main) inline-block">
                      {selectedIncidentRecord.status_name || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-(--text-muted) uppercase block">Completed Date</span>
                    <span className="font-semibold text-(--text-primary) font-mono">
                      {selectedIncidentRecord.reportcompleted_date || '—'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-(--border-main)">
                  <span className="text-[11px] text-(--text-muted) uppercase block mb-1">Description</span>
                  <p className="text-xs text-(--text-secondary) leading-relaxed bg-(--bg-surface) p-2.5 rounded-lg border border-(--border-main)">
                    {selectedIncidentRecord.incident_description || 'No description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-(--border-main)">
                  <div className="bg-(--bg-surface) p-2 rounded-lg border border-(--border-main) flex items-center gap-2.5">
                    <div className="p-1.5 bg-black text-white rounded-lg shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-(--text-muted) uppercase font-semibold block">Reported By</span>
                      <span className="text-xs font-bold text-(--text-primary)">{selectedIncidentRecord.reported_by || '—'}</span>
                    </div>
                  </div>

                  <div className="bg-(--bg-surface) p-2 rounded-lg border border-(--border-main) flex items-center gap-2.5">
                    <div className="p-1.5 bg-black text-white rounded-lg shrink-0">
                      <UserCheck2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-(--text-muted) uppercase font-semibold block">Validated By</span>
                      <span className="text-xs font-bold text-(--text-primary)">{selectedIncidentRecord.validated_by || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-surface) border border-(--border-main) rounded-xl p-3 shadow-xs overflow-hidden space-y-2">
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-(--border-main) pb-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-(--text-primary) flex items-center gap-2">
              <Layers className="w-4 h-4 text-(--text-primary)" />
              Incident Cause Breakdown & Analysis
              {selectedIncidentRecord && (
                <span className="text-xs text-(--text-primary) font-mono">
                  ({selectedIncidentRecord.incident_refno})
                </span>
              )}
            </h2>
          </div>

          <button
            disabled={!selectedIncidentId || isLockedRecord}
            onClick={handleOpenAddChild}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 ${
              !selectedIncidentId || isLockedRecord ? 'bg-(--accent-subtle) text-(--text-muted) opacity-50 cursor-not-allowed' : 'bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) cursor-pointer'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Analysis Item</span>
          </button>
        </div>

        <div className="shrink-0 flex gap-2 border-b border-(--border-main) pb-2 overflow-x-auto">
          <button
            onClick={() => { setActiveAnalysisTab('conditions'); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap border ${
              activeAnalysisTab === 'conditions' ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)' : 'bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) border-(--border-main)'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Unsafe Conditions ({incidentConditions.length})</span>
          </button>

          <button
            onClick={() => { setActiveAnalysisTab('acts'); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap border ${
              activeAnalysisTab === 'acts' ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)' : 'bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) border-(--border-main)'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Unsafe Acts ({incidentActs.length})</span>
          </button>

          <button
            onClick={() => { setActiveAnalysisTab('personal'); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap border ${
              activeAnalysisTab === 'personal' ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)' : 'bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) border-(--border-main)'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Personal Factors ({incidentPersonal.length})</span>
          </button>

          <button
            onClick={() => { setActiveAnalysisTab('workrelated'); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap border ${
              activeAnalysisTab === 'workrelated' ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)' : 'bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) border-(--border-main)'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Work Related Causes ({incidentWorkRelated.length})</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {loadingChild ? (
            <div className="p-8 text-center text-(--text-muted) flex items-center justify-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-(--text-primary)" />
              <span>Loading cause analysis items...</span>
            </div>
          ) : !selectedIncidentId ? (
            <div className="p-12 text-center text-(--text-muted) text-xs">
              Select or search an Incident Report to view or add root cause items.
            </div>
          ) : (
            <>
              {activeAnalysisTab === 'conditions' && renderPaginatedTable(incidentConditions, 'incident_conditions_id', 'conditionsfmea_id', 'condition_id')}
              {activeAnalysisTab === 'acts' && renderPaginatedTable(incidentActs, 'incident_act_id', 'actfmea_id', 'act_id')}
              {activeAnalysisTab === 'personal' && renderPaginatedTable(incidentPersonal, 'incident_personal_id', 'factors_fmea_id', 'factor_id')}
              {activeAnalysisTab === 'workrelated' && renderPaginatedTable(incidentWorkRelated, 'incident_workrelated_id', 'cause_fmea_id', 'cause_id')}
            </>
          )}
        </div>
      </div>

      {isIncidentSearchOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-(--border-main) px-6 py-4 bg-(--accent-subtle) shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary) flex items-center gap-2">
                <Search className="w-4 h-4 text-(--text-primary)" />
                Search & Select Incident Report
              </h3>
              <button onClick={() => setIsIncidentSearchOpen(false)} className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-3 border-b border-(--border-main) bg-(--bg-surface) shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-(--text-muted)" />
                <input type="text" autoFocus placeholder="Filter ref #, plate, reporter name..." value={incidentSearchQuery} onChange={(e) => setIncidentSearchQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary)" />
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {filteredIncidents.length === 0 ? (
                <div className="text-center text-(--text-muted) text-xs py-8">No incident reports match your query.</div>
              ) : (
                filteredIncidents.map(inc => (
                  <div key={inc.incident_id} onClick={() => { setSelectedIncidentId(inc.incident_id); setIsIncidentSearchOpen(false); }} className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between group ${inc.incident_id === selectedIncidentId ? 'bg-(--accent-subtle) border-(--text-primary) text-(--text-primary)' : 'bg-(--bg-elevated) hover:bg-(--accent-subtle) border-(--border-main)'}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-(--text-primary) text-xs">{inc.incident_refno}</span>
                        <span className="text-[11px] text-(--text-muted)">({inc.incident_date})</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-(--accent-subtle) text-(--text-secondary)">{inc.incident_severity}</span>
                      </div>
                      <div className="text-xs text-(--text-secondary)">Equipment: <strong>{inc.vehicle_plate}</strong> | Reported by: {inc.reported_by || '—'}</div>
                    </div>
                    <span className="text-xs text-(--text-primary) group-hover:underline font-semibold shrink-0">Select</span>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-(--border-main) bg-(--accent-subtle) text-right shrink-0">
              <button onClick={() => setIsIncidentSearchOpen(false)} className="px-4 py-1.5 bg-(--accent-subtle) text-(--text-primary) rounded-lg text-xs font-semibold cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-(--border-main) px-6 py-4 bg-(--accent-subtle) shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary) flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {editingId ? 'Edit Incident Report' : 'Create Incident Report'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitMaster} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider">Selected Active Equipment <span className="text-red-500">*</span></label>
                  {selectedEquipment ? (
                    <div className="flex items-center justify-between bg-(--bg-surface) border border-(--border-main) p-3.5 rounded-xl">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full text-xs">
                        <div><span className="text-[11px] text-(--text-muted) uppercase block">Plate No</span><div className="font-bold text-(--text-primary) text-sm font-mono">{selectedEquipment.plate_no}</div></div>
                        <div><span className="text-[11px] text-(--text-muted) uppercase block">Current Reading</span><div className="font-semibold text-(--text-primary)">{selectedEquipment.service_rdg ?? '0'}</div></div>
                        <div><span className="text-[11px] text-(--text-muted) uppercase block">Make / Model</span><div className="font-semibold text-(--text-primary)">{selectedEquipment.make_name || 'N/A'} {selectedEquipment.model_name ? `/ ${selectedEquipment.model_name}` : ''}</div></div>
                        <div><span className="text-[11px] text-(--text-muted) uppercase block">Type</span><div className="font-semibold text-(--text-primary)">{selectedEquipment.type_description || 'N/A'}</div></div>
                      </div>
                      <button type="button" onClick={() => { setSelectedEquipment(null); setFormData(prev => ({ ...prev, vehicle_id: '', vehicle_plate: '' })); }} className="text-(--text-muted) hover:text-red-500 p-2 cursor-pointer shrink-0"><X className="w-5 h-5" /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setShowEquipmentPicker(true); fetchEquipmentList(); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-secondary) px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer">
                      <span className="flex items-center gap-2"><Search className="w-4 h-4 text-(--text-primary)" /> Click here to select an active equipment...</span>
                      <span className="text-xs bg-(--accent-subtle) text-(--text-primary) px-2 py-0.5 rounded font-medium">Browse</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Incident Ref # <span className="text-red-500">*</span></label>
                    <input type="text" required value={formData.incident_refno} onChange={(e) => setFormData({ ...formData, incident_refno: e.target.value })} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-(--text-primary)" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Incident Date <span className="text-red-500">*</span></label>
                    <input type="date" required value={formData.incident_date} onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Severity Level</label>
                    <select value={formData.incident_severity} onChange={(e) => setFormData({ ...formData, incident_severity: e.target.value as IncidentRecord['incident_severity'] })} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Estimated Loss (₱) <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" required value={formData.incident_loss} onChange={(e) => setFormData({ ...formData, incident_loss: parseFloat(e.target.value) || 0 })} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs font-mono" />
                    {Number(formData.incident_loss) === 0 && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3 shrink-0" /> Notice: Estimated Loss is currently set to ₱0.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Status</label>
                    <select value={formData.status_id} onChange={(e) => handleStatusChange(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Status...</option>
                      {statuses.map(st => (<option key={st.status_id} value={st.status_id}>{st.status_name}</option>))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Incident Description <span className="text-red-500">*</span></label>
                  <textarea rows={3} required value={formData.incident_description} onChange={(e) => setFormData({ ...formData, incident_description: e.target.value })} placeholder="Describe what occurred..." className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3.5 py-2 text-xs" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Reported By (Active Employee) <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <input type="text" required readOnly value={formData.reported_by} placeholder="Select active employee..." className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs cursor-pointer" onClick={() => handleOpenEmployeeModal('reported_by')} />
                      <button type="button" onClick={() => handleOpenEmployeeModal('reported_by')} className="bg-(--accent-subtle) text-(--text-primary) border border-(--border-main) px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"><Search className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Validated By (Supervisor) <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <input type="text" required readOnly value={formData.validated_by} placeholder="Select active supervisor..." className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs cursor-pointer" onClick={() => handleOpenEmployeeModal('validated_by')} />
                      <button type="button" onClick={() => handleOpenEmployeeModal('validated_by')} className="bg-(--accent-subtle) text-(--text-primary) border border-(--border-main) px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"><Search className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-(--border-main) bg-(--accent-subtle) shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-(--btn-primary-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow-xs">Save Incident Report</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEquipmentPicker && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-(--border-main) bg-(--accent-subtle)">
              <h3 className="text-lg font-bold text-(--text-primary)">Select Active Equipment</h3>
              <button type="button" onClick={() => setShowEquipmentPicker(false)} className="text-(--text-muted) cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); fetchEquipmentList(equipmentSearchQuery); }} className="p-3 border-b border-(--border-main) bg-(--bg-surface) flex gap-2">
              <input type="text" placeholder="Filter by Make, Model, or Plate No..." value={equipmentSearchQuery} onChange={(e) => setEquipmentSearchQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-1.5 text-xs" />
              <button type="submit" className="bg-(--btn-primary-bg) text-(--btn-primary-text) px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer">Search</button>
            </form>
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {loadingEquipment ? (
                <div className="py-12 text-center text-(--text-muted)"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
              ) : equipmentList.length === 0 ? (
                <div className="py-12 text-center text-(--text-muted) text-xs">No active equipment found.</div>
              ) : equipmentList.map((eq, index) => {
                const vehId = String(eq.vehicle_id || eq.equipment_id || eq.id || '');
                return (
                  <div key={vehId || index} onClick={() => { setSelectedEquipment(eq); setFormData(prev => ({ ...prev, vehicle_id: vehId, vehicle_plate: eq.plate_no })); setShowEquipmentPicker(false); }} className="flex items-center justify-between bg-(--bg-elevated) hover:bg-(--accent-subtle) border border-(--border-main) p-2.5 rounded-lg cursor-pointer">
                    <div>
                      <div className="font-bold text-(--text-primary) text-xs font-mono">{eq.plate_no}</div>
                      <div className="text-[11px] text-(--text-muted)">{eq.make_name || 'N/A'} {eq.model_name ? `/ ${eq.model_name}` : ''} ({eq.type_description || 'N/A'})</div>
                    </div>
                    <div className="text-xs font-semibold text-(--text-secondary)">Rdg: {eq.service_rdg ?? '0'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-60">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-(--border-main) px-6 py-4 bg-(--accent-subtle)">
              <h3 className="text-lg font-bold text-(--text-primary)">
                {employeeModalTarget === 'validated_by' ? 'Select Active Supervisor' : 'Select Active Employee'}
              </h3>
              <button onClick={() => setIsEmployeeModalOpen(false)} className="text-(--text-muted) cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-3 border-b border-(--border-main) bg-(--bg-surface)">
              <input type="text" autoFocus placeholder="Search employee name, department, position..." value={employeeSearchQuery} onChange={(e) => setEmployeeSearchQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-1.5 text-xs" />
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {filteredEmployees.length === 0 ? (
                <div className="text-center text-(--text-muted) text-xs py-8">No matching active employees found.</div>
              ) : (
                filteredEmployees.map(emp => (
                  <div key={emp.employee_id} onClick={() => handleSelectEmployee(emp)} className="p-3 bg-(--bg-elevated) hover:bg-(--accent-subtle) border border-(--border-main) rounded-xl cursor-pointer flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-(--text-primary) flex items-center gap-2">
                        {emp.full_name}
                        {emp.is_supervisor && (
                          <span className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[10px] px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800 font-semibold">Supervisor</span>
                        )}
                      </div>
                      <div className="text-[11px] text-(--text-muted)">{emp.position || 'Employee'} {emp.department ? `• ${emp.department}` : ''}</div>
                    </div>
                    <span className="text-xs font-semibold text-(--text-primary)">Select</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isChildModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-(--border-main) px-5 py-3 bg-(--accent-subtle) shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary) uppercase tracking-wide">
                {childEditingId ? 'Edit' : 'Add'} {
                  activeAnalysisTab === 'conditions' ? 'Unsafe Condition' :
                  activeAnalysisTab === 'acts' ? 'Unsafe Act' :
                  activeAnalysisTab === 'personal' ? 'Personal Factor' : 'Work Related Cause'
                }
              </h3>
              <button onClick={() => setIsChildModalOpen(false)} className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitChild} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-(--text-muted) mb-1">Incident Ref</label>
                  <input type="text" readOnly value={`${selectedIncidentRecord?.incident_refno} (${selectedIncidentRecord?.vehicle_plate})`} className="w-full bg-(--bg-surface) border border-(--border-main) rounded-lg px-3 py-1.5 text-xs text-(--text-muted) cursor-not-allowed" />
                </div>

                {activeAnalysisTab === 'conditions' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-(--text-muted) mb-1">
                        Unsafe Condition Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={childForm.selectedOptionId}
                        onChange={(e) => {
                          const newCondId = e.target.value;
                          const matchingFmeas = conditionFmeaList.filter(f => f.condition_id === newCondId);
                          setChildForm(prev => ({
                            ...prev,
                            selectedOptionId: newCondId,
                            selectedFmeaId: matchingFmeas[0]?.conditionsfmea_id || ''
                          }));
                        }}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      >
                        <option value="">Select Condition Category...</option>
                        {conditionOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>[{opt.code}] {opt.description}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-(--text-muted) mb-1">
                        Condition FMEA Detail <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={childForm.selectedFmeaId}
                        onChange={(e) => {
                          const selectedFmeaId = e.target.value;
                          const matchedFmea = conditionFmeaList.find(f => f.conditionsfmea_id === selectedFmeaId);
                          setChildForm(prev => ({
                            ...prev,
                            selectedFmeaId: selectedFmeaId,
                            selectedOptionId: matchedFmea ? matchedFmea.condition_id : prev.selectedOptionId
                          }));
                        }}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      >
                        <option value="">Select Condition FMEA Detail...</option>
                        {conditionFmeaList
                          .filter(f => !childForm.selectedOptionId || f.condition_id === childForm.selectedOptionId)
                          .map(fmea => (
                            <option key={fmea.conditionsfmea_id} value={fmea.conditionsfmea_id}>
                              [{fmea.detail_code || '—'}] {fmea.detail_description || '—'} {fmea.computed_rpn ? `(RPN: ${fmea.computed_rpn})` : ''}
                            </option>
                          ))}
                      </select>
                    </div>
                  </>
                )}

                {activeAnalysisTab === 'acts' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-(--text-muted) mb-1">
                        Unsafe Act Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={childForm.selectedOptionId}
                        onChange={(e) => {
                          const newActId = e.target.value;
                          const matchingFmeas = actFmeaList.filter(f => f.act_id === newActId);
                          setChildForm(prev => ({
                            ...prev,
                            selectedOptionId: newActId,
                            selectedFmeaId: matchingFmeas[0]?.actfmea_id || ''
                          }));
                        }}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      >
                        <option value="">Select Unsafe Act Category...</option>
                        {actOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>[{opt.code}] {opt.description}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-(--text-muted) mb-1">
                        Act FMEA Detail <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={childForm.selectedFmeaId}
                        onChange={(e) => {
                          const selectedFmeaId = e.target.value;
                          const matchedFmea = actFmeaList.find(f => f.actfmea_id === selectedFmeaId);
                          setChildForm(prev => ({
                            ...prev,
                            selectedFmeaId: selectedFmeaId,
                            selectedOptionId: matchedFmea ? matchedFmea.act_id : prev.selectedOptionId
                          }));
                        }}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      >
                        <option value="">Select Act FMEA Detail...</option>
                        {actFmeaList
                          .filter(f => !childForm.selectedOptionId || f.act_id === childForm.selectedOptionId)
                          .map(fmea => (
                            <option key={fmea.actfmea_id} value={fmea.actfmea_id}>
                              [{fmea.detail_code || '—'}] {fmea.detail_description || '—'} {fmea.computed_rpn ? `(RPN: ${fmea.computed_rpn})` : ''}
                            </option>
                          ))}
                      </select>
                    </div>
                  </>
                )}

                {activeAnalysisTab === 'personal' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-(--text-muted) mb-1">
                        Personal Factor Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={childForm.selectedOptionId}
                        onChange={(e) => {
                          const newFactorId = e.target.value;
                          const matchingFmeas = factorFmeaList.filter(f => f.factor_id === newFactorId);
                          setChildForm(prev => ({
                            ...prev,
                            selectedOptionId: newFactorId,
                            selectedFmeaId: matchingFmeas[0]?.factors_fmea_id || ''
                          }));
                        }}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      >
                        <option value="">Select Personal Factor Category...</option>
                        {factorOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>[{opt.code}] {opt.description}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-(--text-muted) mb-1">
                        Factor FMEA Detail <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={childForm.selectedFmeaId}
                        onChange={(e) => {
                          const selectedFmeaId = e.target.value;
                          const matchedFmea = factorFmeaList.find(f => f.factors_fmea_id === selectedFmeaId);
                          setChildForm(prev => ({
                            ...prev,
                            selectedFmeaId: selectedFmeaId,
                            selectedOptionId: matchedFmea ? matchedFmea.factor_id : prev.selectedOptionId
                          }));
                        }}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      >
                        <option value="">Select Factor FMEA Detail...</option>
                        {factorFmeaList
                          .filter(f => !childForm.selectedOptionId || f.factor_id === childForm.selectedOptionId)
                          .map(fmea => (
                            <option key={fmea.factors_fmea_id} value={fmea.factors_fmea_id}>
                              [{fmea.detail_code || '—'}] {fmea.detail_description || '—'} {fmea.computed_rpn ? `(RPN: ${fmea.computed_rpn})` : ''}
                            </option>
                          ))}
                      </select>
                    </div>
                  </>
                )}

                {activeAnalysisTab === 'workrelated' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-(--text-muted) mb-1">
                        Work Related Cause Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={childForm.selectedOptionId}
                        onChange={(e) => {
                          const newCauseId = e.target.value;
                          const matchingFmeas = causeFmeaList.filter(f => f.cause_id === newCauseId);
                          setChildForm(prev => ({
                            ...prev,
                            selectedOptionId: newCauseId,
                            selectedFmeaId: matchingFmeas[0]?.cause_fmea_id || ''
                          }));
                        }}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      >
                        <option value="">Select Work Cause Category...</option>
                        {causeOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>[{opt.code}] {opt.description}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-(--text-muted) mb-1">
                        Cause FMEA Detail <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={childForm.selectedFmeaId}
                        onChange={(e) => {
                          const selectedFmeaId = e.target.value;
                          const matchedFmea = causeFmeaList.find(f => f.cause_fmea_id === selectedFmeaId);
                          setChildForm(prev => ({
                            ...prev,
                            selectedFmeaId: selectedFmeaId,
                            selectedOptionId: matchedFmea ? matchedFmea.cause_id : prev.selectedOptionId
                          }));
                        }}
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      >
                        <option value="">Select Cause FMEA Detail...</option>
                        {causeFmeaList
                          .filter(f => !childForm.selectedOptionId || f.cause_id === childForm.selectedOptionId)
                          .map(fmea => (
                            <option key={fmea.cause_fmea_id} value={fmea.cause_fmea_id}>
                              [{fmea.detail_code || '—'}] {fmea.detail_description || '—'} {fmea.computed_rpn ? `(RPN: ${fmea.computed_rpn})` : ''}
                            </option>
                          ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-(--text-muted) mb-1">
                    Investigation Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={childForm.remarks}
                    onChange={(e) => setChildForm({ ...childForm, remarks: e.target.value })}
                    placeholder="Enter specific investigation notes or observations..."
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary)"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 px-5 py-3 border-t border-(--border-main) shrink-0 bg-(--accent-subtle)">
                <button
                  type="button"
                  onClick={() => setIsChildModalOpen(false)}
                  className="px-3.5 py-1.5 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
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