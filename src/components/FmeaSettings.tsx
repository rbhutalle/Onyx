import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CheckCircle, 
  ShieldAlert, 
  Sliders, 
  Database,
  Plus,
  Trash2,
  Loader2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  AlertOctagon,
  UserX,
  UserCheck,
  Briefcase,
  Wrench,
  X,
  Filter,
  Check
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface FmeaSeverityRecord {
  sev_id: number;
  sev_description: string | null;
  created_at?: string;
  updated_at?: string | null;
}

interface FmeaOccurenceRecord {
  occ_id: number;
  occ_description: string | null;
  created_at?: string;
  updated_at?: string | null;
}

interface FmeaDetectionRecord {
  det_id: number;
  det_description: string | null;
  created_at?: string;
  updated_at?: string | null;
}

interface FmeaCurrentControlsRecord {
  currentcontrols_id: string;
  currentcontrols_desc: string | null;
  created_at?: string;
  updated_at?: string | null;
}

interface FmeaPotentialEffectsRecord {
  potentialeffects_id: string;
  potentialeffects_desc: string | null;
  created_at?: string;
  updated_at?: string | null;
}

interface EquipmentTaskRecord {
  task_id: string;
  task_name: string;
  task_description?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

interface EquipmentTaskStandardRecord {
  task_standard_id: string;
  task_standard_desc: string;
  task_id?: string;
  system_id?: string;
  component_id?: string;
  standard_time?: number;
  item?: string | null;
  created_at?: string;
}

interface UnsafeConditionsRecord {
  condition_id: string;
  code?: string | null;
  description?: string | null;
  condition_desc?: string | null;
  name?: string | null;
}

interface ConditionDetailsRecord {
  detail_id: string;
  condition_id?: string | null;
  code?: string | null;
  description?: string | null;
}

interface ConditionsFmeaRecord {
  conditionsfmea_id: string;
  condition_id: string | null;
  potentialeffects_id: string | null;
  currentcontrols_id: string | null;
  sev_id: number | null;
  occ_id: number | null;
  det_id: number | null;
  detail_id: string | null;
  computed_rpn?: number | null;
  created_at: string;
}

interface ConditionsFmeaDetRecord {
  conditions_fmea_det_id: string;
  conditionsfmea_id: string;
  task_standard_id: string;
  created_at: string;
}

interface UnsafeActsRecord {
  act_id: string;
  code?: string | null;
  description?: string | null;
  act_desc?: string | null;
  name?: string | null;
}

interface ActDetailsRecord {
  detail_id: string;
  act_id?: string | null;
  code?: string | null;
  description?: string | null;
}

interface ActFmeaRecord {
  actfmea_id: string;
  act_id: string | null;
  potentialeffects_id: string | null;
  currentcontrols_id: string | null;
  sev_id: number | null;
  occ_id: number | null;
  det_id: number | null;
  detail_id: string | null;
  computed_rpn?: number | null;
  created_at: string;
}

interface ActFmeaDetRecord {
  act_fmea_det_id: string;
  actfmea_id: string;
  task_standard_id: string;
  created_at: string;
}

interface PersonalFactorsRecord {
  factor_id: string;
  code?: string | null;
  description?: string | null;
  factor_desc?: string | null;
  name?: string | null;
}

interface FactorDetailsRecord {
  detail_id: string;
  factor_id?: string | null;
  code?: string | null;
  description?: string | null;
}

interface FactorsFmeaRecord {
  conditions_fmea_id?: string | null;
  factor_fmea_id?: string | null;
  factors_fmea_id?: string | null;
  id?: string | null;
  factor_id: string | null;
  potentialeffects_id: string | null;
  created_at: string;
  sev_id: number | null;
  occ_id: number | null;
  det_id: number | null;
  detail_id: string | null;
  currentcontrols_id: string | null;
  computed_rpn?: number | null;
}

interface FactorsFmeaDetRecord {
  factors_fmea_det_id: string;
  factors_fmea_id: string;
  task_standard_id: string;
  created_at: string;
}

interface WorkCausesRecord {
  cause_id: string;
  code?: string | null;
  description?: string | null;
  cause_desc?: string | null;
  name?: string | null;
}

interface CauseDetailsRecord {
  detail_id: string;
  cause_id?: string | null;
  code?: string | null;
  description?: string | null;
}

interface CauseFmeaRecord {
  cause_fmea_id: string;
  cause_id: string | null;
  potentialeffects_id: string | null;
  created_at: string;
  sev_id: number | null;
  occ_id: number | null;
  det_id: number | null;
  currentcontrols_id: string | null;
  computed_rpn?: number | null;
  detail_id: string | null;
}

interface CauseFmeaDetRecord {
  cause_fmea_det_id: string;
  cause_fmea_id: string;
  task_standard_id: string;
  created_at: string;
}

export function FmeaSettings() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Navigation states
  const [mainTab, setMainTab] = useState<'master_fmea' | 'constants' | 'rpn_definitions'>('master_fmea');
  const [masterFmeaSubTab, setMasterFmeaSubTab] = useState<'unsafe_conditions' | 'unsafe_acts' | 'personal_factors' | 'work_related_causes'>('unsafe_conditions');
  const [constantsSubTab, setConstantsSubTab] = useState<'controls' | 'effects'>('controls');
  const [rpnSubTab, setRpnSubTab] = useState<'severity' | 'occurrence' | 'detection'>('severity');

  // Supabase lookup & master lists
  const [severityList, setSeverityList] = useState<FmeaSeverityRecord[]>([]);
  const [occurrenceList, setOccurrenceList] = useState<FmeaOccurenceRecord[]>([]);
  const [detectionList, setDetectionList] = useState<FmeaDetectionRecord[]>([]);
  const [controlsList, setControlsList] = useState<FmeaCurrentControlsRecord[]>([]);
  const [effectsList, setEffectsList] = useState<FmeaPotentialEffectsRecord[]>([]);
  const [equipmentTasksList, setEquipmentTasksList] = useState<EquipmentTaskRecord[]>([]);
  const [taskStandardsList, setTaskStandardsList] = useState<EquipmentTaskStandardRecord[]>([]);

  // Category Masters & Child Lists
  const [conditionsList, setConditionsList] = useState<UnsafeConditionsRecord[]>([]);
  const [conditionDetailsList, setConditionDetailsList] = useState<ConditionDetailsRecord[]>([]);
  const [conditionsFmeaList, setConditionsFmeaList] = useState<ConditionsFmeaRecord[]>([]);
  const [conditionsFmeaDetList, setConditionsFmeaDetList] = useState<ConditionsFmeaDetRecord[]>([]);

  const [actsList, setActsList] = useState<UnsafeActsRecord[]>([]);
  const [actDetailsList, setActDetailsList] = useState<ActDetailsRecord[]>([]);
  const [actFmeaList, setActFmeaList] = useState<ActFmeaRecord[]>([]);
  const [actFmeaDetList, setActFmeaDetList] = useState<ActFmeaDetRecord[]>([]);

  const [factorsList, setFactorsList] = useState<PersonalFactorsRecord[]>([]);
  const [factorDetailsList, setFactorDetailsList] = useState<FactorDetailsRecord[]>([]);
  const [factorsFmeaList, setFactorsFmeaList] = useState<FactorsFmeaRecord[]>([]);
  const [factorsFmeaDetList, setFactorsFmeaDetList] = useState<FactorsFmeaDetRecord[]>([]);

  const [causesList, setCausesList] = useState<WorkCausesRecord[]>([]);
  const [causeDetailsList, setCauseDetailsList] = useState<CauseDetailsRecord[]>([]);
  const [causeFmeaList, setCauseFmeaList] = useState<CauseFmeaRecord[]>([]);
  const [causeFmeaDetList, setCauseFmeaDetList] = useState<CauseFmeaDetRecord[]>([]);

  // Expanded row state for child tables
  const [expandedConditionRowId, setExpandedConditionRowId] = useState<string | null>(null);
  const [expandedActRowId, setExpandedActRowId] = useState<string | null>(null);
  const [expandedFactorRowId, setExpandedFactorRowId] = useState<string | null>(null);
  const [expandedCauseRowId, setExpandedCauseRowId] = useState<string | null>(null);

  // Equipment Task Standards Modal Selector state
  const [isTaskStdSelectorModalOpen, setIsTaskStdSelectorModalOpen] = useState<boolean>(false);
  const [taskStdModalTarget, setTaskStdModalTarget] = useState<{
    type: 'act_add' | 'act_edit' | 'factor_add' | 'factor_edit' | 'cause_add' | 'cause_edit' | 'cond_det_inline' | 'act_det_inline' | 'factor_det_inline' | 'cause_det_inline';
    recordId?: string;
  } | null>(null);

  // Modal Filters
  const [taskStdSearch, setTaskStdSearch] = useState<string>('');
  const [taskFilterId, setTaskFilterId] = useState<string>('');

  // Unsafe Condition Modal Form Search Filters (Effect & Control)
  const [condEffectSearchFilter, setCondEffectSearchFilter] = useState<string>('');
  const [condControlSearchFilter, setCondControlSearchFilter] = useState<string>('');
  const [editCondEffectSearchFilter, setEditCondEffectSearchFilter] = useState<string>('');
  const [editCondControlSearchFilter, setEditCondControlSearchFilter] = useState<string>('');

  // Modals
  const [isConditionModalOpen, setIsConditionModalOpen] = useState<boolean>(false);
  const [isEditConditionModalOpen, setIsEditConditionModalOpen] = useState<boolean>(false);

  const [isActModalOpen, setIsActModalOpen] = useState<boolean>(false);
  const [isEditActModalOpen, setIsEditActModalOpen] = useState<boolean>(false);

  const [isFactorModalOpen, setIsFactorModalOpen] = useState<boolean>(false);
  const [isEditFactorModalOpen, setIsEditFactorModalOpen] = useState<boolean>(false);

  const [isCauseModalOpen, setIsCauseModalOpen] = useState<boolean>(false);
  const [isEditCauseModalOpen, setIsEditCauseModalOpen] = useState<boolean>(false);

  // Constants Modal States
  const [isAddControlModalOpen, setIsAddControlModalOpen] = useState<boolean>(false);
  const [isEditControlModalOpen, setIsEditControlModalOpen] = useState<boolean>(false);
  const [controlModalDesc, setControlModalDesc] = useState<string>('');
  const [editControlRecordId, setEditControlRecordId] = useState<string | null>(null);
  const [controlEditDesc, setControlEditDesc] = useState<string>('');

  const [isAddEffectModalOpen, setIsAddEffectModalOpen] = useState<boolean>(false);
  const [isEditEffectModalOpen, setIsEditEffectModalOpen] = useState<boolean>(false);
  const [effectModalDesc, setEffectModalDesc] = useState<string>('');
  const [editEffectRecordId, setEditEffectRecordId] = useState<string | null>(null);
  const [effectEditDesc, setEffectEditDesc] = useState<string>('');

  // Search states
  const [controlSearch, setControlSearch] = useState<string>('');
  const [effectSearch, setEffectSearch] = useState<string>('');
  const [conditionSearch, setConditionSearch] = useState<string>('');
  const [actSearch, setActSearch] = useState<string>('');
  const [factorSearch, setFactorSearch] = useState<string>('');
  const [causeSearch, setCauseSearch] = useState<string>('');

  // Task Standard Selection State for Act, Factor & Cause Modals
  const [selectedTaskStandardId, setSelectedTaskStandardId] = useState<string>('');
  const [editTaskStandardId, setEditTaskStandardId] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const currentTabKey = `${mainTab}:${masterFmeaSubTab}:${constantsSubTab}:${rpnSubTab}`;
  const [paginationTabKey, setPaginationTabKey] = useState(currentTabKey);
  const pageSize = 6;

  if (paginationTabKey !== currentTabKey) {
    setPaginationTabKey(currentTabKey);
    setCurrentPage(1);
  }

  // Form Fields - Conditions FMEA
  const [modalConditionId, setModalConditionId] = useState<string>('');
  const [modalDetailId, setModalDetailId] = useState<string>('');
  const [modalPotentialEffectId, setModalPotentialEffectId] = useState<string>('');
  const [modalCurrentControlId, setModalCurrentControlId] = useState<string>('');
  const [modalSevId, setModalSevId] = useState<string>('');
  const [modalOccId, setModalOccId] = useState<string>('');
  const [modalDetId, setModalDetId] = useState<string>('');
  const modalComputedRpn = (modalSevId ? Number(modalSevId) : 0) * (modalOccId ? Number(modalOccId) : 0) * (modalDetId ? Number(modalDetId) : 0);

  const [editRecordId, setEditRecordId] = useState<string | null>(null);
  const [editConditionId, setEditConditionId] = useState<string>('');
  const [editDetailId, setEditDetailId] = useState<string>('');
  const [editPotentialEffectId, setEditPotentialEffectId] = useState<string>('');
  const [editCurrentControlId, setEditCurrentControlId] = useState<string>('');
  const [editSevId, setEditSevId] = useState<string>('');
  const [editOccId, setEditOccId] = useState<string>('');
  const [editDetId, setEditDetId] = useState<string>('');
  const editComputedRpn = (editSevId ? Number(editSevId) : 0) * (editOccId ? Number(editOccId) : 0) * (editDetId ? Number(editDetId) : 0);

  // Form Fields - Unsafe Acts
  const [actModalActId, setActModalActId] = useState<string>('');
  const [actModalDetailId, setActModalDetailId] = useState<string>('');
  const [actModalPotentialEffectId, setActModalPotentialEffectId] = useState<string>('');
  const [actModalCurrentControlId, setActModalCurrentControlId] = useState<string>('');
  const [actModalSevId, setActModalSevId] = useState<string>('');
  const [actModalOccId, setActModalOccId] = useState<string>('');
  const [actModalDetId, setActModalDetId] = useState<string>('');
  const actModalComputedRpn = (actModalSevId ? Number(actModalSevId) : 0) * (actModalOccId ? Number(actModalOccId) : 0) * (actModalDetId ? Number(actModalDetId) : 0);

  const [actEditRecordId, setActEditRecordId] = useState<string | null>(null);
  const [actEditActId, setActEditActId] = useState<string>('');
  const [actEditDetailId, setActEditDetailId] = useState<string>('');
  const [actEditPotentialEffectId, setActEditPotentialEffectId] = useState<string>('');
  const [actEditCurrentControlId, setActEditCurrentControlId] = useState<string>('');
  const [actEditSevId, setActEditSevId] = useState<string>('');
  const [actEditOccId, setActEditOccId] = useState<string>('');
  const [actEditDetId, setActEditDetId] = useState<string>('');
  const actEditComputedRpn = (actEditSevId ? Number(actEditSevId) : 0) * (actEditOccId ? Number(actEditOccId) : 0) * (actEditDetId ? Number(actEditDetId) : 0);

  // Form Fields - Personal Factors
  const [factorModalFactorId, setFactorModalFactorId] = useState<string>('');
  const [factorModalDetailId, setFactorModalDetailId] = useState<string>('');
  const [factorModalPotentialEffectId, setFactorModalPotentialEffectId] = useState<string>('');
  const [factorModalCurrentControlId, setFactorModalCurrentControlId] = useState<string>('');
  const [factorModalSevId, setFactorModalSevId] = useState<string>('');
  const [factorModalOccId, setFactorModalOccId] = useState<string>('');
  const [factorModalDetId, setFactorModalDetId] = useState<string>('');
  const factorModalComputedRpn = (factorModalSevId ? Number(factorModalSevId) : 0) * (factorModalOccId ? Number(factorModalOccId) : 0) * (factorModalDetId ? Number(factorModalDetId) : 0);

  const [factorEditRecordId, setFactorEditRecordId] = useState<string | null>(null);
  const [factorEditRecordPkCol, setFactorEditRecordPkCol] = useState<string>('factors_fmea_id');
  const [factorEditFactorId, setFactorEditFactorId] = useState<string>('');
  const [factorEditDetailId, setFactorEditDetailId] = useState<string>('');
  const [factorEditPotentialEffectId, setFactorEditPotentialEffectId] = useState<string>('');
  const [factorEditCurrentControlId, setFactorEditCurrentControlId] = useState<string>('');
  const [factorEditSevId, setFactorEditSevId] = useState<string>('');
  const [factorEditOccId, setFactorEditOccId] = useState<string>('');
  const [factorEditDetId, setFactorEditDetId] = useState<string>('');
  const factorEditComputedRpn = (factorEditSevId ? Number(factorEditSevId) : 0) * (factorEditOccId ? Number(factorEditOccId) : 0) * (factorEditDetId ? Number(factorEditDetId) : 0);

  // Form Fields - Work Related Causes
  const [causeModalCauseId, setCauseModalCauseId] = useState<string>('');
  const [causeModalDetailId, setCauseModalDetailId] = useState<string>('');
  const [causeModalPotentialEffectId, setCauseModalPotentialEffectId] = useState<string>('');
  const [causeModalCurrentControlId, setCauseModalCurrentControlId] = useState<string>('');
  const [causeModalSevId, setCauseModalSevId] = useState<string>('');
  const [causeModalOccId, setCauseModalOccId] = useState<string>('');
  const [causeModalDetId, setCauseModalDetId] = useState<string>('');
  const causeModalComputedRpn = (causeModalSevId ? Number(causeModalSevId) : 0) * (causeModalOccId ? Number(causeModalOccId) : 0) * (causeModalDetId ? Number(causeModalDetId) : 0);

  const [causeEditRecordId, setCauseEditRecordId] = useState<string | null>(null);
  const [causeEditCauseId, setCauseEditCauseId] = useState<string>('');
  const [causeEditDetailId, setCauseEditDetailId] = useState<string>('');
  const [causeEditPotentialEffectId, setCauseEditPotentialEffectId] = useState<string>('');
  const [causeEditCurrentControlId, setCauseEditCurrentControlId] = useState<string>('');
  const [causeEditSevId, setCauseEditSevId] = useState<string>('');
  const [causeEditOccId, setCauseEditOccId] = useState<string>('');
  const [causeEditDetId, setCauseEditDetId] = useState<string>('');
  const causeEditComputedRpn = (causeEditSevId ? Number(causeEditSevId) : 0) * (causeEditOccId ? Number(causeEditOccId) : 0) * (causeEditDetId ? Number(causeEditDetId) : 0);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;
    await Promise.resolve();
    if (!isMountedRef.current) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [
        sevRes, occRes, detRes, effRes, ctrlRes,
        condRes, condDetailsRes, actsRes, actDetailsRes,
        factorsRes, factorDetailsRes, causesRes, causeDetailsRes,
        taskStdRes, condDetRes, actDetRes, factorDetRes, causeDetRes,
        equipTasksRes
      ] = await Promise.all([
        supabase.from('fmea_severity').select('*').order('sev_id', { ascending: true }),
        supabase.from('fmea_occurence').select('*').order('occ_id', { ascending: true }),
        supabase.from('fmea_detection').select('*').order('det_id', { ascending: true }),
        supabase.from('fmea_potentialeffects').select('*').order('created_at', { ascending: false }),
        supabase.from('fmea_currentcontrols').select('*').order('created_at', { ascending: false }),
        supabase.from('unsafe_conditions').select('*'),
        supabase.from('condition_details').select('*'),
        supabase.from('unsafe_acts').select('*'),
        supabase.from('act_details').select('*'),
        supabase.from('personal_factors').select('*'),
        supabase.from('factor_details').select('*'),
        supabase.from('work_causes').select('*'),
        supabase.from('cause_details').select('*'),
        supabase.from('equipment_taskstandards').select('*').order('task_standard_desc', { ascending: true }),
        supabase.from('conditions_fmea_det').select('*'),
        supabase.from('act_fmea_det').select('*'),
        supabase.from('factors_fmea_det').select('*'),
        supabase.from('cause_fmea_det').select('*'),
        supabase.from('equipment_tasks').select('*').order('task_name', { ascending: true })
      ]);

      if (sevRes.data && isMountedRef.current) setSeverityList(sevRes.data);
      if (occRes.data && isMountedRef.current) setOccurrenceList(occRes.data);
      if (detRes.data && isMountedRef.current) setDetectionList(detRes.data);
      if (effRes.data && isMountedRef.current) setEffectsList(effRes.data);
      if (ctrlRes.data && isMountedRef.current) setControlsList(ctrlRes.data);
      if (condRes.data && isMountedRef.current) setConditionsList(condRes.data);
      if (condDetailsRes.data && isMountedRef.current) setConditionDetailsList(condDetailsRes.data);
      if (actsRes.data && isMountedRef.current) setActsList(actsRes.data);
      if (actDetailsRes.data && isMountedRef.current) setActDetailsList(actDetailsRes.data);
      if (factorsRes.data && isMountedRef.current) setFactorsList(factorsRes.data);
      if (factorDetailsRes.data && isMountedRef.current) setFactorDetailsList(factorDetailsRes.data);
      if (causesRes.data && isMountedRef.current) setCausesList(causesRes.data);
      if (causeDetailsRes.data && isMountedRef.current) setCauseDetailsList(causeDetailsRes.data);
      if (taskStdRes.data && isMountedRef.current) setTaskStandardsList(taskStdRes.data);
      if (condDetRes.data && isMountedRef.current) setConditionsFmeaDetList(condDetRes.data);
      if (actDetRes.data && isMountedRef.current) setActFmeaDetList(actDetRes.data);
      if (factorDetRes.data && isMountedRef.current) setFactorsFmeaDetList(factorDetRes.data);
      if (causeDetRes.data && isMountedRef.current) setCauseFmeaDetList(causeDetRes.data);
      if (equipTasksRes.data && isMountedRef.current) setEquipmentTasksList(equipTasksRes.data);

      if (mainTab === 'master_fmea') {
        if (masterFmeaSubTab === 'unsafe_conditions') {
          const { data, error } = await supabase.from('conditions_fmea').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (isMountedRef.current) setConditionsFmeaList(data || []);
        } else if (masterFmeaSubTab === 'unsafe_acts') {
          const { data, error } = await supabase.from('act_fmea').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (isMountedRef.current) setActFmeaList(data || []);
        } else if (masterFmeaSubTab === 'personal_factors') {
          const { data, error } = await supabase.from('factors_fmea').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (isMountedRef.current) setFactorsFmeaList(data || []);
        } else if (masterFmeaSubTab === 'work_related_causes') {
          const { data, error } = await supabase.from('cause_fmea').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (isMountedRef.current) setCauseFmeaList(data || []);
        }
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        const errObj = err as Record<string, unknown>;
        setErrorMsg(`Failed to load records: ${(errObj?.message as string) || JSON.stringify(err)}`);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [mainTab, masterFmeaSubTab]);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      if (!isMountedRef.current) return;
      await Promise.resolve();
      if (!isMountedRef.current || !isActive) return;

      setLoading(true);
      setErrorMsg(null);

      try {
        const [
          sevRes, occRes, detRes, effRes, ctrlRes,
          condRes, condDetailsRes, actsRes, actDetailsRes,
          factorsRes, factorDetailsRes, causesRes, causeDetailsRes,
          taskStdRes, condDetRes, actDetRes, factorDetRes, causeDetRes,
          equipTasksRes
        ] = await Promise.all([
          supabase.from('fmea_severity').select('*').order('sev_id', { ascending: true }),
          supabase.from('fmea_occurence').select('*').order('occ_id', { ascending: true }),
          supabase.from('fmea_detection').select('*').order('det_id', { ascending: true }),
          supabase.from('fmea_potentialeffects').select('*').order('created_at', { ascending: false }),
          supabase.from('fmea_currentcontrols').select('*').order('created_at', { ascending: false }),
          supabase.from('unsafe_conditions').select('*'),
          supabase.from('condition_details').select('*'),
          supabase.from('unsafe_acts').select('*'),
          supabase.from('act_details').select('*'),
          supabase.from('personal_factors').select('*'),
          supabase.from('factor_details').select('*'),
          supabase.from('work_causes').select('*'),
          supabase.from('cause_details').select('*'),
          supabase.from('equipment_taskstandards').select('*').order('task_standard_desc', { ascending: true }),
          supabase.from('conditions_fmea_det').select('*'),
          supabase.from('act_fmea_det').select('*'),
          supabase.from('factors_fmea_det').select('*'),
          supabase.from('cause_fmea_det').select('*'),
          supabase.from('equipment_tasks').select('*').order('task_name', { ascending: true })
        ]);

        if (!isActive || !isMountedRef.current) return;

        if (sevRes.data) setSeverityList(sevRes.data);
        if (occRes.data) setOccurrenceList(occRes.data);
        if (detRes.data) setDetectionList(detRes.data);
        if (effRes.data) setEffectsList(effRes.data);
        if (ctrlRes.data) setControlsList(ctrlRes.data);
        if (condRes.data) setConditionsList(condRes.data);
        if (condDetailsRes.data) setConditionDetailsList(condDetailsRes.data);
        if (actsRes.data) setActsList(actsRes.data);
        if (actDetailsRes.data) setActDetailsList(actDetailsRes.data);
        if (factorsRes.data) setFactorsList(factorsRes.data);
        if (factorDetailsRes.data) setFactorDetailsList(factorDetailsRes.data);
        if (causesRes.data) setCausesList(causesRes.data);
        if (causeDetailsRes.data) setCauseDetailsList(causeDetailsRes.data);
        if (taskStdRes.data) setTaskStandardsList(taskStdRes.data);
        if (condDetRes.data) setConditionsFmeaDetList(condDetRes.data);
        if (actDetRes.data) setActFmeaDetList(actDetRes.data);
        if (factorDetRes.data) setFactorsFmeaDetList(factorDetRes.data);
        if (causeDetRes.data) setCauseFmeaDetList(causeDetRes.data);
        if (equipTasksRes.data) setEquipmentTasksList(equipTasksRes.data);

        if (mainTab === 'master_fmea' && isActive && isMountedRef.current) {
          if (masterFmeaSubTab === 'unsafe_conditions') {
            const { data, error } = await supabase.from('conditions_fmea').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (isMountedRef.current && isActive) setConditionsFmeaList(data || []);
          } else if (masterFmeaSubTab === 'unsafe_acts') {
            const { data, error } = await supabase.from('act_fmea').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (isMountedRef.current && isActive) setActFmeaList(data || []);
          } else if (masterFmeaSubTab === 'personal_factors') {
            const { data, error } = await supabase.from('factors_fmea').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (isMountedRef.current && isActive) setFactorsFmeaList(data || []);
          } else if (masterFmeaSubTab === 'work_related_causes') {
            const { data, error } = await supabase.from('cause_fmea').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (isMountedRef.current && isActive) setCauseFmeaList(data || []);
          }
        }
      } catch (err: unknown) {
        if (isMountedRef.current && isActive) {
          const errObj = err as Record<string, unknown>;
          setErrorMsg(`Failed to load records: ${(errObj?.message as string) || JSON.stringify(err)}`);
        }
      } finally {
        if (isMountedRef.current && isActive) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isActive = false;
    };
  }, [mainTab, masterFmeaSubTab]);

  // Derived filtered details & lists
  const modalFilteredDetails = conditionDetailsList.filter(d => !modalConditionId || d.condition_id === modalConditionId);
  const editFilteredDetails = conditionDetailsList.filter(d => !editConditionId || d.condition_id === editConditionId);

  const actModalFilteredDetails = actDetailsList.filter(d => !actModalActId || d.act_id === actModalActId);
  const actEditFilteredDetails = actDetailsList.filter(d => !actEditActId || d.act_id === actEditActId);

  const factorModalFilteredDetails = factorDetailsList.filter(d => !factorModalFactorId || d.factor_id === factorModalFactorId);
  const factorEditFilteredDetails = factorDetailsList.filter(d => !factorEditFactorId || d.factor_id === factorEditFactorId);

  const causeModalFilteredDetails = causeDetailsList.filter(d => !causeModalCauseId || d.cause_id === causeModalCauseId);
  const causeEditFilteredDetails = causeDetailsList.filter(d => !causeEditCauseId || d.cause_id === causeEditCauseId);

  // Filtered Potential Effects and Current Controls for Condition Modals
  const filteredModalEffects = effectsList.filter(eff =>
    (eff.potentialeffects_desc || '').toLowerCase().includes(condEffectSearchFilter.toLowerCase())
  );

  const filteredModalControls = controlsList.filter(ctrl =>
    (ctrl.currentcontrols_desc || '').toLowerCase().includes(condControlSearchFilter.toLowerCase())
  );

  const filteredEditModalEffects = effectsList.filter(eff =>
    (eff.potentialeffects_desc || '').toLowerCase().includes(editCondEffectSearchFilter.toLowerCase())
  );

  const filteredEditModalControls = controlsList.filter(ctrl =>
    (ctrl.currentcontrols_desc || '').toLowerCase().includes(editCondControlSearchFilter.toLowerCase())
  );

  // Filtered Equipment Task Standards for Modal Selector
  const filteredModalTaskStandards = taskStandardsList.filter(std => {
    const parentTask = equipmentTasksList.find(t => t.task_id === std.task_id);
    const matchesTaskFilter = !taskFilterId || std.task_id === taskFilterId;
    const matchesSearch = !taskStdSearch || 
      std.task_standard_desc.toLowerCase().includes(taskStdSearch.toLowerCase()) ||
      (std.item || '').toLowerCase().includes(taskStdSearch.toLowerCase()) ||
      (parentTask?.task_name || '').toLowerCase().includes(taskStdSearch.toLowerCase());

    return matchesTaskFilter && matchesSearch;
  });

  const handleSelectTaskStandardFromModal = (stdId: string) => {
    if (!taskStdModalTarget) return;

    const { type, recordId } = taskStdModalTarget;

    if (type === 'act_add' || type === 'factor_add' || type === 'cause_add') {
      setSelectedTaskStandardId(stdId);
    } else if (type === 'act_edit' || type === 'factor_edit' || type === 'cause_edit') {
      setEditTaskStandardId(stdId);
    } else if (type === 'cond_det_inline' && recordId) {
      handleAddCondTaskDet(recordId, stdId);
    } else if (type === 'act_det_inline' && recordId) {
      handleAddActTaskDet(recordId, stdId);
    } else if (type === 'factor_det_inline' && recordId) {
      handleAddFactorTaskDet(recordId, stdId);
    } else if (type === 'cause_det_inline' && recordId) {
      handleAddCauseTaskDet(recordId, stdId);
    }

    setIsTaskStdSelectorModalOpen(false);
    setTaskStdModalTarget(null);
  };

  // Handlers for Linked Task Standards
  const handleAddCondTaskDet = async (conditionsfmea_id: string, task_standard_id: string) => {
    if (!task_standard_id) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('conditions_fmea_det').insert([{
        conditionsfmea_id,
        task_standard_id
      }]);
      if (error) throw error;
      setSuccessMsg('Linked Equipment Task Standard added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to add linked task standard: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteCondTaskDet = async (conditions_fmea_det_id: string) => {
    if (!confirm('Are you sure you want to remove this linked task standard?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('conditions_fmea_det').delete().eq('conditions_fmea_det_id', conditions_fmea_det_id);
      if (error) throw error;
      setSuccessMsg('Linked Equipment Task Standard removed successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to remove linked task standard: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleAddActTaskDet = async (actfmea_id: string, task_standard_id: string) => {
    if (!task_standard_id) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('act_fmea_det').insert([{
        actfmea_id,
        task_standard_id
      }]);
      if (error) throw error;
      setSuccessMsg('Linked Equipment Task Standard added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to add linked task standard: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteActTaskDet = async (act_fmea_det_id: string) => {
    if (!confirm('Are you sure you want to remove this linked task standard?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('act_fmea_det').delete().eq('act_fmea_det_id', act_fmea_det_id);
      if (error) throw error;
      setSuccessMsg('Linked Equipment Task Standard removed successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to remove linked task standard: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleAddFactorTaskDet = async (factors_fmea_id: string, task_standard_id: string) => {
    if (!task_standard_id) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('factors_fmea_det').insert([{
        factors_fmea_id,
        task_standard_id
      }]);
      if (error) throw error;
      setSuccessMsg('Linked Equipment Task Standard added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to add linked task standard: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteFactorTaskDet = async (factors_fmea_det_id: string) => {
    if (!confirm('Are you sure you want to remove this linked task standard?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('factors_fmea_det').delete().eq('factors_fmea_det_id', factors_fmea_det_id);
      if (error) throw error;
      setSuccessMsg('Linked Equipment Task Standard removed successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to remove linked task standard: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleAddCauseTaskDet = async (cause_fmea_id: string, task_standard_id: string) => {
    if (!task_standard_id) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('cause_fmea_det').insert([{
        cause_fmea_id,
        task_standard_id
      }]);
      if (error) throw error;
      setSuccessMsg('Linked Equipment Task Standard added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to add linked task standard: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteCauseTaskDet = async (cause_fmea_det_id: string) => {
    if (!confirm('Are you sure you want to remove this linked task standard?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('cause_fmea_det').delete().eq('cause_fmea_det_id', cause_fmea_det_id);
      if (error) throw error;
      setSuccessMsg('Linked Equipment Task Standard removed successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to remove linked task standard: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  // --- Handlers for Conditions FMEA ---
  const handleAddConditionFmeaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('conditions_fmea').insert([{
        condition_id: modalConditionId || null,
        detail_id: modalDetailId || null,
        potentialeffects_id: modalPotentialEffectId || null,
        currentcontrols_id: modalCurrentControlId || null,
        sev_id: modalSevId ? Number(modalSevId) : null,
        occ_id: modalOccId ? Number(modalOccId) : null,
        det_id: modalDetId ? Number(modalDetId) : null,
        computed_rpn: modalComputedRpn
      }]);
      if (error) throw error;

      setModalConditionId('');
      setModalDetailId('');
      setModalPotentialEffectId('');
      setModalCurrentControlId('');
      setModalSevId('');
      setModalOccId('');
      setModalDetId('');
      setCondEffectSearchFilter('');
      setCondControlSearchFilter('');
      setIsConditionModalOpen(false);
      
      setSuccessMsg('Unsafe Condition record added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to insert record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleUpdateConditionFmeaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecordId) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('conditions_fmea')
        .update({
          condition_id: editConditionId || null,
          detail_id: editDetailId || null,
          potentialeffects_id: editPotentialEffectId || null,
          currentcontrols_id: editCurrentControlId || null,
          sev_id: editSevId ? Number(editSevId) : null,
          occ_id: editOccId ? Number(editOccId) : null,
          det_id: editDetId ? Number(editDetId) : null,
          computed_rpn: editComputedRpn,
          updated_at: new Date().toISOString()
        })
        .eq('conditionsfmea_id', editRecordId);
      if (error) throw error;

      setIsEditConditionModalOpen(false);
      setEditRecordId(null);
      setEditCondEffectSearchFilter('');
      setEditCondControlSearchFilter('');
      setSuccessMsg('Unsafe Condition record updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to update record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteConditionFmea = async (id: string) => {
    if (!confirm('Are you sure you want to delete this condition record?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('conditions_fmea').delete().eq('conditionsfmea_id', id);
      if (error) throw error;
      setSuccessMsg('Unsafe Condition record deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to delete record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  // --- Handlers for Unsafe Acts ---
  const handleAddActFmeaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      const { data, error } = await supabase.from('act_fmea').insert([{
        act_id: actModalActId || null,
        detail_id: actModalDetailId || null,
        potentialeffects_id: actModalPotentialEffectId || null,
        currentcontrols_id: actModalCurrentControlId || null,
        sev_id: actModalSevId ? Number(actModalSevId) : null,
        occ_id: actModalOccId ? Number(actModalOccId) : null,
        det_id: actModalDetId ? Number(actModalDetId) : null,
        computed_rpn: actModalComputedRpn
      }]).select();
      if (error) throw error;

      if (data && data[0] && selectedTaskStandardId) {
        await supabase.from('act_fmea_det').insert([{
          actfmea_id: data[0].actfmea_id,
          task_standard_id: selectedTaskStandardId
        }]);
      }

      setActModalActId('');
      setActModalDetailId('');
      setActModalPotentialEffectId('');
      setActModalCurrentControlId('');
      setActModalSevId('');
      setActModalOccId('');
      setActModalDetId('');
      setSelectedTaskStandardId('');
      setIsActModalOpen(false);

      setSuccessMsg('Unsafe Act record added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to insert record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleUpdateActFmeaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actEditRecordId) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('act_fmea')
        .update({
          act_id: actEditActId || null,
          detail_id: actEditDetailId || null,
          potentialeffects_id: actEditPotentialEffectId || null,
          currentcontrols_id: actEditCurrentControlId || null,
          sev_id: actEditSevId ? Number(actEditSevId) : null,
          occ_id: actEditOccId ? Number(actEditOccId) : null,
          det_id: actEditDetId ? Number(actEditDetId) : null,
          computed_rpn: actEditComputedRpn,
          updated_at: new Date().toISOString()
        })
        .eq('actfmea_id', actEditRecordId);
      if (error) throw error;

      if (editTaskStandardId) {
        await supabase.from('act_fmea_det').delete().eq('actfmea_id', actEditRecordId);
        await supabase.from('act_fmea_det').insert([{
          actfmea_id: actEditRecordId,
          task_standard_id: editTaskStandardId
        }]);
      }

      setIsEditActModalOpen(false);
      setActEditRecordId(null);
      setSuccessMsg('Unsafe Act record updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to update record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteActFmea = async (id: string) => {
    if (!confirm('Are you sure you want to delete this act record?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('act_fmea').delete().eq('actfmea_id', id);
      if (error) throw error;
      setSuccessMsg('Unsafe Act record deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to delete record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  // --- Handlers for Personal Factors ---
  const handleAddFactorFmeaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      const { data, error } = await supabase.from('factors_fmea').insert([{
        factor_id: factorModalFactorId || null,
        detail_id: factorModalDetailId || null,
        potentialeffects_id: factorModalPotentialEffectId || null,
        currentcontrols_id: factorModalCurrentControlId || null,
        sev_id: factorModalSevId ? Number(factorModalSevId) : null,
        occ_id: factorModalOccId ? Number(factorModalOccId) : null,
        det_id: factorModalDetId ? Number(factorModalDetId) : null,
        computed_rpn: factorModalComputedRpn
      }]).select();
      if (error) throw error;

      if (data && data[0] && selectedTaskStandardId) {
        await supabase.from('factors_fmea_det').insert([{
          factors_fmea_id: data[0].factors_fmea_id || data[0].id,
          task_standard_id: selectedTaskStandardId
        }]);
      }

      setFactorModalFactorId('');
      setFactorModalDetailId('');
      setFactorModalPotentialEffectId('');
      setFactorModalCurrentControlId('');
      setFactorModalSevId('');
      setFactorModalOccId('');
      setFactorModalDetId('');
      setSelectedTaskStandardId('');
      setIsFactorModalOpen(false);

      setSuccessMsg('Personal Factor record added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to insert record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleUpdateFactorFmeaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorEditRecordId) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('factors_fmea')
        .update({
          factor_id: factorEditFactorId || null,
          detail_id: factorEditDetailId || null,
          potentialeffects_id: factorEditPotentialEffectId || null,
          currentcontrols_id: factorEditCurrentControlId || null,
          sev_id: factorEditSevId ? Number(factorEditSevId) : null,
          occ_id: factorEditOccId ? Number(factorEditOccId) : null,
          det_id: factorEditDetId ? Number(factorEditDetId) : null,
          computed_rpn: factorEditComputedRpn,
          updated_at: new Date().toISOString()
        })
        .eq(factorEditRecordPkCol, factorEditRecordId);
      if (error) throw error;

      if (editTaskStandardId) {
        await supabase.from('factors_fmea_det').delete().eq('factors_fmea_id', factorEditRecordId);
        await supabase.from('factors_fmea_det').insert([{
          factors_fmea_id: factorEditRecordId,
          task_standard_id: editTaskStandardId
        }]);
      }

      setIsEditFactorModalOpen(false);
      setFactorEditRecordId(null);
      setSuccessMsg('Personal Factor record updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to update record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteFactorFmea = async (item: FactorsFmeaRecord) => {
    if (!confirm('Are you sure you want to delete this personal factor record?')) return;
    const pkCol = item.factors_fmea_id ? 'factors_fmea_id' : item.factor_fmea_id ? 'factor_fmea_id' : 'id';
    const pkVal = item.factors_fmea_id || item.factor_fmea_id || item.id;
    if (!pkVal) return;

    try {
      setErrorMsg(null);
      const { error } = await supabase.from('factors_fmea').delete().eq(pkCol, pkVal);
      if (error) throw error;
      setSuccessMsg('Personal Factor record deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to delete record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  // --- Handlers for Work Related Causes ---
  const handleAddCauseFmeaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      const { data, error } = await supabase.from('cause_fmea').insert([{
        cause_id: causeModalCauseId || null,
        detail_id: causeModalDetailId || null,
        potentialeffects_id: causeModalPotentialEffectId || null,
        currentcontrols_id: causeModalCurrentControlId || null,
        sev_id: causeModalSevId ? Number(causeModalSevId) : null,
        occ_id: causeModalOccId ? Number(causeModalOccId) : null,
        det_id: causeModalDetId ? Number(causeModalDetId) : null,
        computed_rpn: causeModalComputedRpn
      }]).select();
      if (error) throw error;

      if (data && data[0] && selectedTaskStandardId) {
        await supabase.from('cause_fmea_det').insert([{
          cause_fmea_id: data[0].cause_fmea_id,
          task_standard_id: selectedTaskStandardId
        }]);
      }

      setCauseModalCauseId('');
      setCauseModalDetailId('');
      setCauseModalPotentialEffectId('');
      setCauseModalCurrentControlId('');
      setCauseModalSevId('');
      setCauseModalOccId('');
      setCauseModalDetId('');
      setSelectedTaskStandardId('');
      setIsCauseModalOpen(false);

      setSuccessMsg('Work Related Cause record added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to insert record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleUpdateCauseFmeaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!causeEditRecordId) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('cause_fmea')
        .update({
          cause_id: causeEditCauseId || null,
          detail_id: causeEditDetailId || null,
          potentialeffects_id: causeEditPotentialEffectId || null,
          currentcontrols_id: causeEditCurrentControlId || null,
          sev_id: causeEditSevId ? Number(causeEditSevId) : null,
          occ_id: causeEditOccId ? Number(causeEditOccId) : null,
          det_id: causeEditDetId ? Number(causeEditDetId) : null,
          computed_rpn: causeEditComputedRpn,
          updated_at: new Date().toISOString()
        })
        .eq('cause_fmea_id', causeEditRecordId);
      if (error) throw error;

      if (editTaskStandardId) {
        await supabase.from('cause_fmea_det').delete().eq('cause_fmea_id', causeEditRecordId);
        await supabase.from('cause_fmea_det').insert([{
          cause_fmea_id: causeEditRecordId,
          task_standard_id: editTaskStandardId
        }]);
      }

      setIsEditCauseModalOpen(false);
      setCauseEditRecordId(null);
      setSuccessMsg('Work Related Cause record updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to update record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteCauseFmea = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work related cause record?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('cause_fmea').delete().eq('cause_fmea_id', id);
      if (error) throw error;
      setSuccessMsg('Work Related Cause record deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to delete record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  // --- Handlers for FMEA Controls & Effects Constants ---
  const handleAddControl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!controlModalDesc.trim()) return;
    try {
      const { error } = await supabase.from('fmea_currentcontrols').insert([{ currentcontrols_desc: controlModalDesc.trim() }]);
      if (error) throw error;
      setControlModalDesc('');
      setIsAddControlModalOpen(false);
      setSuccessMsg('Current Control added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to add control: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleUpdateControl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editControlRecordId || !controlEditDesc.trim()) return;
    try {
      const { error } = await supabase.from('fmea_currentcontrols').update({ currentcontrols_desc: controlEditDesc.trim(), updated_at: new Date().toISOString() }).eq('currentcontrols_id', editControlRecordId);
      if (error) throw error;
      setIsEditControlModalOpen(false);
      setEditControlRecordId(null);
      setControlEditDesc('');
      setSuccessMsg('Current Control updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to update control: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteControl = async (id: string) => {
    if (!confirm('Are you sure you want to delete this control?')) return;
    try {
      const { error } = await supabase.from('fmea_currentcontrols').delete().eq('currentcontrols_id', id);
      if (error) throw error;
      setSuccessMsg('Control deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to delete control: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleAddEffect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectModalDesc.trim()) return;
    try {
      const { error } = await supabase.from('fmea_potentialeffects').insert([{ potentialeffects_desc: effectModalDesc.trim() }]);
      if (error) throw error;
      setEffectModalDesc('');
      setIsAddEffectModalOpen(false);
      setSuccessMsg('Potential Effect added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to add effect: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleUpdateEffect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEffectRecordId || !effectEditDesc.trim()) return;
    try {
      const { error } = await supabase.from('fmea_potentialeffects').update({ potentialeffects_desc: effectEditDesc.trim(), updated_at: new Date().toISOString() }).eq('potentialeffects_id', editEffectRecordId);
      if (error) throw error;
      setIsEditEffectModalOpen(false);
      setEditEffectRecordId(null);
      setEffectEditDesc('');
      setSuccessMsg('Potential Effect updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to update effect: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteEffect = async (id: string) => {
    if (!confirm('Are you sure you want to delete this effect?')) return;
    try {
      const { error } = await supabase.from('fmea_potentialeffects').delete().eq('potentialeffects_id', id);
      if (error) throw error;
      setSuccessMsg('Effect deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to delete effect: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  // Filtered master records
  const filteredConditions = conditionsFmeaList.filter(item => {
    const matchedDetail = conditionDetailsList.find(d => d.detail_id === item.detail_id);
    const detailText = `${matchedDetail?.code || ''} ${matchedDetail?.description || ''}`;
    const effectMatch = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id)?.potentialeffects_desc || '';
    const controlMatch = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id)?.currentcontrols_desc || '';
    const computedRpnVal = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));

    return (
      detailText.toLowerCase().includes(conditionSearch.toLowerCase()) ||
      effectMatch.toLowerCase().includes(conditionSearch.toLowerCase()) ||
      controlMatch.toLowerCase().includes(conditionSearch.toLowerCase()) ||
      String(item.sev_id || '').includes(conditionSearch) ||
      String(item.occ_id || '').includes(conditionSearch) ||
      String(item.det_id || '').includes(conditionSearch) ||
      String(computedRpnVal).includes(conditionSearch)
    );
  });

  const filteredActs = actFmeaList.filter(item => {
    const matchedDetail = actDetailsList.find(d => d.detail_id === item.detail_id);
    const detailText = `${matchedDetail?.code || ''} ${matchedDetail?.description || ''}`;
    const effectMatch = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id)?.potentialeffects_desc || '';
    const controlMatch = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id)?.currentcontrols_desc || '';
    const computedRpnVal = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));

    return (
      detailText.toLowerCase().includes(actSearch.toLowerCase()) ||
      effectMatch.toLowerCase().includes(actSearch.toLowerCase()) ||
      controlMatch.toLowerCase().includes(actSearch.toLowerCase()) ||
      String(item.sev_id || '').includes(actSearch) ||
      String(item.occ_id || '').includes(actSearch) ||
      String(item.det_id || '').includes(actSearch) ||
      String(computedRpnVal).includes(actSearch)
    );
  });

  const filteredFactors = factorsFmeaList.filter(item => {
    const matchedDetail = factorDetailsList.find(d => d.detail_id === item.detail_id);
    const detailText = `${matchedDetail?.code || ''} ${matchedDetail?.description || ''}`;
    const effectMatch = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id)?.potentialeffects_desc || '';
    const controlMatch = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id)?.currentcontrols_desc || '';
    const computedRpnVal = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));

    return (
      detailText.toLowerCase().includes(factorSearch.toLowerCase()) ||
      effectMatch.toLowerCase().includes(factorSearch.toLowerCase()) ||
      controlMatch.toLowerCase().includes(factorSearch.toLowerCase()) ||
      String(item.sev_id || '').includes(factorSearch) ||
      String(item.occ_id || '').includes(factorSearch) ||
      String(item.det_id || '').includes(factorSearch) ||
      String(computedRpnVal).includes(factorSearch)
    );
  });

  const filteredCauses = causeFmeaList.filter(item => {
    const matchedDetail = causeDetailsList.find(d => d.detail_id === item.detail_id);
    const detailText = `${matchedDetail?.code || ''} ${matchedDetail?.description || ''}`;
    const effectMatch = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id)?.potentialeffects_desc || '';
    const controlMatch = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id)?.currentcontrols_desc || '';
    const computedRpnVal = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));

    return (
      detailText.toLowerCase().includes(causeSearch.toLowerCase()) ||
      effectMatch.toLowerCase().includes(causeSearch.toLowerCase()) ||
      controlMatch.toLowerCase().includes(causeSearch.toLowerCase()) ||
      String(item.sev_id || '').includes(causeSearch) ||
      String(item.occ_id || '').includes(causeSearch) ||
      String(item.det_id || '').includes(causeSearch) ||
      String(computedRpnVal).includes(causeSearch)
    );
  });

  const filteredControls = controlsList.filter(c => (c.currentcontrols_desc || '').toLowerCase().includes(controlSearch.toLowerCase()));
  const filteredEffects = effectsList.filter(e => (e.potentialeffects_desc || '').toLowerCase().includes(effectSearch.toLowerCase()));

  const paginateData = <T,>(list: T[]): T[] => {
    const start = (currentPage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  };

  const renderPagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    return (
      <div className="shrink-0 flex items-center justify-between pt-2 text-xs text-(--text-muted)">
        <span>Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 bg-(--bg-elevated) border border-(--border-main) rounded hover:opacity-80 disabled:opacity-40 cursor-pointer text-(--text-primary)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="p-1 bg-(--bg-elevated) border border-(--border-main) rounded hover:opacity-80 disabled:opacity-40 cursor-pointer text-(--text-primary)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-(--border-main) pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-(--accent-subtle) text-(--text-primary) rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">FMEA Settings</h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">Manage master FMEA records, equipment task standards mappings, constants, and RPN definitions.</p>
          </div>
        </div>
        {loading && <Loader2 className="w-5 h-5 text-(--text-primary) animate-spin" />}
      </div>

      {successMsg && (
        <div className="shrink-0 bg-(--accent-subtle) border border-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="shrink-0 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs">
          <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Tab Bar */}
      <div className="shrink-0 flex border-b border-(--border-main) gap-2 overflow-x-auto">
        <button
          onClick={() => setMainTab('master_fmea')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            mainTab === 'master_fmea' 
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)' 
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Master FMEA</span>
        </button>
        <button
          onClick={() => setMainTab('constants')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            mainTab === 'constants' 
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)' 
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>FMEA Constants</span>
        </button>
        <button
          onClick={() => setMainTab('rpn_definitions')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            mainTab === 'rpn_definitions' 
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)' 
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>RPN Definitions</span>
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-surface) border border-(--border-main) shadow-xs rounded-xl p-4 overflow-hidden space-y-3">
        {mainTab === 'master_fmea' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            {/* Sub Tabs */}
            <div className="shrink-0 flex items-center justify-between gap-2 border-b border-(--border-main) pb-2">
              <div className="flex bg-(--bg-elevated) p-1 rounded-lg border border-(--border-main) gap-1 flex-wrap">
                <button
                  onClick={() => { setMasterFmeaSubTab('unsafe_conditions'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    masterFmeaSubTab === 'unsafe_conditions' 
                      ? 'bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) shadow' 
                      : 'text-(--text-muted) hover:text-(--text-primary)'
                  }`}
                >
                  <AlertOctagon className="w-3.5 h-3.5" /> Unsafe Conditions
                </button>
                <button
                  onClick={() => { setMasterFmeaSubTab('unsafe_acts'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    masterFmeaSubTab === 'unsafe_acts' 
                      ? 'bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) shadow' 
                      : 'text-(--text-muted) hover:text-(--text-primary)'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" /> Unsafe Acts
                </button>
                <button
                  onClick={() => { setMasterFmeaSubTab('personal_factors'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    masterFmeaSubTab === 'personal_factors' 
                      ? 'bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) shadow' 
                      : 'text-(--text-muted) hover:text-(--text-primary)'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" /> Personal Factors
                </button>
                <button
                  onClick={() => { setMasterFmeaSubTab('work_related_causes'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    masterFmeaSubTab === 'work_related_causes' 
                      ? 'bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) shadow' 
                      : 'text-(--text-muted) hover:text-(--text-primary)'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" /> Work Related Causes
                </button>
              </div>
            </div>

            {/* 1. Unsafe Conditions Table */}
            {masterFmeaSubTab === 'unsafe_conditions' && (
              <div className="flex flex-col flex-1 min-h-0 space-y-2">
                <div className="shrink-0 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter records..."
                      value={conditionSearch}
                      onChange={(e) => { setConditionSearch(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary)"
                    />
                  </div>
                  <button onClick={() => setIsConditionModalOpen(true)} className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Add Condition
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                        <th className="py-2 px-2 w-8"></th>
                        <th className="py-2 px-3">Condition Detail</th>
                        <th className="py-2 px-3">Potential Effect</th>
                        <th className="py-2 px-3">Current Control</th>
                        <th className="py-2 px-3 w-12 text-center">Sev</th>
                        <th className="py-2 px-3 w-12 text-center">Occ</th>
                        <th className="py-2 px-3 w-12 text-center">Det</th>
                        <th className="py-2 px-3 w-16 text-center">RPN</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {filteredConditions.length === 0 ? (
                        <tr><td colSpan={9} className="p-4 text-center text-(--text-muted)">No condition FMEA records found.</td></tr>
                      ) : (
                        paginateData(filteredConditions).map((item, idx) => {
                          const matchedDetail = conditionDetailsList.find(d => d.detail_id === item.detail_id);
                          const matchedEffect = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id);
                          const matchedControl = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id);
                          const computedRpn = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));
                          const isExpanded = expandedConditionRowId === item.conditionsfmea_id;

                          const linkedDetRecords = conditionsFmeaDetList.filter(det => det.conditionsfmea_id === item.conditionsfmea_id);

                          return (
                            <React.Fragment key={`cond-fragment-${item.conditionsfmea_id || idx}`}>
                              <tr className="hover:bg-(--accent-subtle) transition-colors">
                                <td className="py-2 px-2 text-center">
                                  <button
                                    onClick={() => setExpandedConditionRowId(isExpanded ? null : item.conditionsfmea_id)}
                                    className="p-1 rounded hover:bg-(--border-main) text-(--text-muted) hover:text-(--text-primary) transition-colors cursor-pointer"
                                    title="Toggle Task Standards"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                </td>
                                <td className="py-2 px-3 text-(--text-primary)">{matchedDetail ? `${matchedDetail.code || ''} - ${matchedDetail.description || ''}` : '—'}</td>
                                <td className="py-2 px-3 text-(--text-primary)">{matchedEffect?.potentialeffects_desc || '—'}</td>
                                <td className="py-2 px-3 text-(--text-primary)">{matchedControl?.currentcontrols_desc || '—'}</td>
                                <td className="py-2 px-3 text-center">{item.sev_id ?? '—'}</td>
                                <td className="py-2 px-3 text-center">{item.occ_id ?? '—'}</td>
                                <td className="py-2 px-3 text-center">{item.det_id ?? '—'}</td>
                                <td className="py-2 px-3 font-mono font-bold text-(--text-primary) text-center">{computedRpn}</td>
                                <td className="py-2 px-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setEditRecordId(item.conditionsfmea_id);
                                        setEditConditionId(item.condition_id || '');
                                        setEditDetailId(item.detail_id || '');
                                        setEditPotentialEffectId(item.potentialeffects_id || '');
                                        setEditCurrentControlId(item.currentcontrols_id || '');
                                        setEditSevId(item.sev_id ? String(item.sev_id) : '');
                                        setEditOccId(item.occ_id ? String(item.occ_id) : '');
                                        setEditDetId(item.det_id ? String(item.det_id) : '');
                                        setIsEditConditionModalOpen(true);
                                      }}
                                      className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteConditionFmea(item.conditionsfmea_id)}
                                      className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-(--accent-subtle)/40">
                                  <td colSpan={9} className="p-3">
                                    <div className="pl-6 pr-4 py-3 bg-(--bg-surface) border border-(--border-main) rounded-lg space-y-3">
                                      <div className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                          <Wrench className="w-3.5 h-3.5" /> Linked Equipment Task Standards
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setTaskStdModalTarget({ type: 'cond_det_inline', recordId: item.conditionsfmea_id });
                                            setIsTaskStdSelectorModalOpen(true);
                                          }}
                                          className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow"
                                        >
                                          <Plus className="w-3.5 h-3.5" /> Select Equipment Task Standard to Link
                                        </button>
                                      </div>

                                      {linkedDetRecords.length === 0 ? (
                                        <p className="text-xs text-(--text-muted) italic">No equipment task standards mapped to this record.</p>
                                      ) : (
                                        <table className="w-full text-left border-collapse text-xs">
                                          <thead>
                                            <tr className="border-b border-(--border-main) text-(--text-muted)">
                                              <th className="py-1 px-2">Task Standard Description</th>
                                              <th className="py-1 px-2">Item</th>
                                              <th className="py-1 px-2 text-center">Standard Time (hrs)</th>
                                              <th className="py-1 px-2 text-right">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-(--border-main)/60 text-(--text-secondary)">
                                            {linkedDetRecords.map((det, sIdx) => {
                                              const std = taskStandardsList.find(ts => ts.task_standard_id === det.task_standard_id);
                                              return (
                                                <tr key={`cond-std-${det.conditions_fmea_det_id || sIdx}`}>
                                                  <td className="py-1.5 px-2 text-(--text-primary)">{std?.task_standard_desc || '—'}</td>
                                                  <td className="py-1.5 px-2 text-(--text-primary)">{std?.item || '—'}</td>
                                                  <td className="py-1.5 px-2 font-mono text-center text-(--text-primary)">{std?.standard_time ?? '0'}</td>
                                                  <td className="py-1.5 px-2 text-right">
                                                    <button
                                                      onClick={() => handleDeleteCondTaskDet(det.conditions_fmea_det_id)}
                                                      className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                    >
                                                      <Trash2 className="w-3 h-3" /> Remove
                                                    </button>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPagination(filteredConditions.length)}
              </div>
            )}

            {/* 2. Unsafe Acts Table */}
            {masterFmeaSubTab === 'unsafe_acts' && (
              <div className="flex flex-col flex-1 min-h-0 space-y-2">
                <div className="shrink-0 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter records..."
                      value={actSearch}
                      onChange={(e) => { setActSearch(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary)"
                    />
                  </div>
                  <button onClick={() => setIsActModalOpen(true)} className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Add Act
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                        <th className="py-2 px-2 w-8"></th>
                        <th className="py-2 px-3">Act Detail</th>
                        <th className="py-2 px-3">Potential Effect</th>
                        <th className="py-2 px-3">Current Control</th>
                        <th className="py-2 px-3 w-12 text-center">Sev</th>
                        <th className="py-2 px-3 w-12 text-center">Occ</th>
                        <th className="py-2 px-3 w-12 text-center">Det</th>
                        <th className="py-2 px-3 w-16 text-center">RPN</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {filteredActs.length === 0 ? (
                        <tr><td colSpan={9} className="p-4 text-center text-(--text-muted)">No act FMEA records found.</td></tr>
                      ) : (
                        paginateData(filteredActs).map((item, idx) => {
                          const matchedDetail = actDetailsList.find(d => d.detail_id === item.detail_id);
                          const matchedEffect = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id);
                          const matchedControl = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id);
                          const computedRpn = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));
                          const isExpanded = expandedActRowId === item.actfmea_id;

                          const linkedDetRecords = actFmeaDetList.filter(det => det.actfmea_id === item.actfmea_id);

                          return (
                            <React.Fragment key={`act-fragment-${item.actfmea_id || idx}`}>
                              <tr className="hover:bg-(--accent-subtle) transition-colors">
                                <td className="py-2 px-2 text-center">
                                  <button
                                    onClick={() => setExpandedActRowId(isExpanded ? null : item.actfmea_id)}
                                    className="p-1 rounded hover:bg-(--border-main) text-(--text-muted) hover:text-(--text-primary) transition-colors cursor-pointer"
                                    title="Toggle Task Standards"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                </td>
                                <td className="py-2 px-3 text-(--text-primary)">{matchedDetail ? `${matchedDetail.code || ''} - ${matchedDetail.description || ''}` : '—'}</td>
                                <td className="py-2 px-3 text-(--text-primary)">{matchedEffect?.potentialeffects_desc || '—'}</td>
                                <td className="py-2 px-3 text-(--text-primary)">{matchedControl?.currentcontrols_desc || '—'}</td>
                                <td className="py-2 px-3 text-center">{item.sev_id ?? '—'}</td>
                                <td className="py-2 px-3 text-center">{item.occ_id ?? '—'}</td>
                                <td className="py-2 px-3 text-center">{item.det_id ?? '—'}</td>
                                <td className="py-2 px-3 font-mono font-bold text-(--text-primary) text-center">{computedRpn}</td>
                                <td className="py-2 px-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setActEditRecordId(item.actfmea_id);
                                        setActEditActId(item.act_id || '');
                                        setActEditDetailId(item.detail_id || '');
                                        setActEditPotentialEffectId(item.potentialeffects_id || '');
                                        setActEditCurrentControlId(item.currentcontrols_id || '');
                                        setActEditSevId(item.sev_id ? String(item.sev_id) : '');
                                        setActEditOccId(item.occ_id ? String(item.occ_id) : '');
                                        setActEditDetId(item.det_id ? String(item.det_id) : '');
                                        const currentLinkedDet = actFmeaDetList.find(d => d.actfmea_id === item.actfmea_id);
                                        setEditTaskStandardId(currentLinkedDet?.task_standard_id || '');
                                        setIsEditActModalOpen(true);
                                      }}
                                      className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteActFmea(item.actfmea_id)}
                                      className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-(--accent-subtle)/40">
                                  <td colSpan={9} className="p-3">
                                    <div className="pl-6 pr-4 py-3 bg-(--bg-surface) border border-(--border-main) rounded-lg space-y-3">
                                      <div className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                          <Wrench className="w-3.5 h-3.5" /> Linked Equipment Task Standards
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setTaskStdModalTarget({ type: 'act_det_inline', recordId: item.actfmea_id });
                                            setIsTaskStdSelectorModalOpen(true);
                                          }}
                                          className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow"
                                        >
                                          <Plus className="w-3.5 h-3.5" /> Select Equipment Task Standard to Link
                                        </button>
                                      </div>

                                      {linkedDetRecords.length === 0 ? (
                                        <p className="text-xs text-(--text-muted) italic">No equipment task standards mapped to this record.</p>
                                      ) : (
                                        <table className="w-full text-left border-collapse text-xs">
                                          <thead>
                                            <tr className="border-b border-(--border-main) text-(--text-muted)">
                                              <th className="py-1 px-2">Task Standard Description</th>
                                              <th className="py-1 px-2">Item</th>
                                              <th className="py-1 px-2 text-center">Standard Time (hrs)</th>
                                              <th className="py-1 px-2 text-right">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-(--border-main)/60 text-(--text-secondary)">
                                            {linkedDetRecords.map((det, sIdx) => {
                                              const std = taskStandardsList.find(ts => ts.task_standard_id === det.task_standard_id);
                                              return (
                                                <tr key={`act-std-${det.act_fmea_det_id || sIdx}`}>
                                                  <td className="py-1.5 px-2 text-(--text-primary)">{std?.task_standard_desc || '—'}</td>
                                                  <td className="py-1.5 px-2 text-(--text-primary)">{std?.item || '—'}</td>
                                                  <td className="py-1.5 px-2 font-mono text-center text-(--text-primary)">{std?.standard_time ?? '0'}</td>
                                                  <td className="py-1.5 px-2 text-right">
                                                    <button
                                                      onClick={() => handleDeleteActTaskDet(det.act_fmea_det_id)}
                                                      className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                    >
                                                      <Trash2 className="w-3 h-3" /> Remove
                                                    </button>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPagination(filteredActs.length)}
              </div>
            )}

            {/* 3. Personal Factors Table */}
            {masterFmeaSubTab === 'personal_factors' && (
              <div className="flex flex-col flex-1 min-h-0 space-y-2">
                <div className="shrink-0 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter records..."
                      value={factorSearch}
                      onChange={(e) => { setFactorSearch(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary)"
                    />
                  </div>
                  <button onClick={() => setIsFactorModalOpen(true)} className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Add Factor
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                        <th className="py-2 px-2 w-8"></th>
                        <th className="py-2 px-3">Factor Detail</th>
                        <th className="py-2 px-3">Potential Effect</th>
                        <th className="py-2 px-3">Current Control</th>
                        <th className="py-2 px-3 w-12 text-center">Sev</th>
                        <th className="py-2 px-3 w-12 text-center">Occ</th>
                        <th className="py-2 px-3 w-12 text-center">Det</th>
                        <th className="py-2 px-3 w-16 text-center">RPN</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {filteredFactors.length === 0 ? (
                        <tr><td colSpan={9} className="p-4 text-center text-(--text-muted)">No factor FMEA records found.</td></tr>
                      ) : (
                        paginateData(filteredFactors).map((item, idx) => {
                          const matchedDetail = factorDetailsList.find(d => d.detail_id === item.detail_id);
                          const matchedEffect = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id);
                          const matchedControl = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id);
                          const computedRpn = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));

                          const recId = item.factors_fmea_id || item.factor_fmea_id || item.conditions_fmea_id || item.id || `factor-${idx}`;
                          const pkCol = item.factors_fmea_id ? 'factors_fmea_id' : item.factor_fmea_id ? 'factor_fmea_id' : 'id';
                          const isExpanded = expandedFactorRowId === recId;

                          const linkedDetRecords = factorsFmeaDetList.filter(det => det.factors_fmea_id === recId);

                          return (
                            <React.Fragment key={`factor-fragment-${recId}-${idx}`}>
                              <tr className="hover:bg-(--accent-subtle) transition-colors">
                                <td className="py-2 px-2 text-center">
                                  <button
                                    onClick={() => setExpandedFactorRowId(isExpanded ? null : recId)}
                                    className="p-1 rounded hover:bg-(--border-main) text-(--text-muted) hover:text-(--text-primary) transition-colors cursor-pointer"
                                    title="Toggle Task Standards"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                </td>
                                <td className="py-2 px-3 text-(--text-primary)">{matchedDetail ? `${matchedDetail.code || ''} - ${matchedDetail.description || ''}` : '—'}</td>
                                <td className="py-2 px-3 text-(--text-primary)">{matchedEffect?.potentialeffects_desc || '—'}</td>
                                <td className="py-2 px-3 text-(--text-primary)">{matchedControl?.currentcontrols_desc || '—'}</td>
                                <td className="py-2 px-3 text-center">{item.sev_id ?? '—'}</td>
                                <td className="py-2 px-3 text-center">{item.occ_id ?? '—'}</td>
                                <td className="py-2 px-3 text-center">{item.det_id ?? '—'}</td>
                                <td className="py-2 px-3 font-mono font-bold text-(--text-primary) text-center">{computedRpn}</td>
                                <td className="py-2 px-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setFactorEditRecordId(recId);
                                        setFactorEditRecordPkCol(pkCol);
                                        setFactorEditFactorId(item.factor_id || '');
                                        setFactorEditDetailId(item.detail_id || '');
                                        setFactorEditPotentialEffectId(item.potentialeffects_id || '');
                                        setFactorEditCurrentControlId(item.currentcontrols_id || '');
                                        setFactorEditSevId(item.sev_id ? String(item.sev_id) : '');
                                        setFactorEditOccId(item.occ_id ? String(item.occ_id) : '');
                                        setFactorEditDetId(item.det_id ? String(item.det_id) : '');
                                        const currentLinkedDet = factorsFmeaDetList.find(d => d.factors_fmea_id === recId);
                                        setEditTaskStandardId(currentLinkedDet?.task_standard_id || '');
                                        setIsEditFactorModalOpen(true);
                                      }}
                                      className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFactorFmea(item)}
                                      className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-(--accent-subtle)/40">
                                  <td colSpan={9} className="p-3">
                                    <div className="pl-6 pr-4 py-3 bg-(--bg-surface) border border-(--border-main) rounded-lg space-y-3">
                                      <div className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                          <Wrench className="w-3.5 h-3.5" /> Linked Equipment Task Standards
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setTaskStdModalTarget({ type: 'factor_det_inline', recordId: recId });
                                            setIsTaskStdSelectorModalOpen(true);
                                          }}
                                          className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow"
                                        >
                                          <Plus className="w-3.5 h-3.5" /> Select Equipment Task Standard to Link
                                        </button>
                                      </div>

                                      {linkedDetRecords.length === 0 ? (
                                        <p className="text-xs text-(--text-muted) italic">No equipment task standards mapped to this record.</p>
                                      ) : (
                                        <table className="w-full text-left border-collapse text-xs">
                                          <thead>
                                            <tr className="border-b border-(--border-main) text-(--text-muted)">
                                              <th className="py-1 px-2">Task Standard Description</th>
                                              <th className="py-1 px-2">Item</th>
                                              <th className="py-1 px-2 text-center">Standard Time (hrs)</th>
                                              <th className="py-1 px-2 text-right">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-(--border-main)/60 text-(--text-secondary)">
                                            {linkedDetRecords.map((det, sIdx) => {
                                              const std = taskStandardsList.find(ts => ts.task_standard_id === det.task_standard_id);
                                              return (
                                                <tr key={`factor-std-${det.factors_fmea_det_id || sIdx}`}>
                                                  <td className="py-1.5 px-2 text-(--text-primary)">{std?.task_standard_desc || '—'}</td>
                                                  <td className="py-1.5 px-2 text-(--text-primary)">{std?.item || '—'}</td>
                                                  <td className="py-1.5 px-2 font-mono text-center text-(--text-primary)">{std?.standard_time ?? '0'}</td>
                                                  <td className="py-1.5 px-2 text-right">
                                                    <button
                                                      onClick={() => handleDeleteFactorTaskDet(det.factors_fmea_det_id)}
                                                      className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                    >
                                                      <Trash2 className="w-3 h-3" /> Remove
                                                    </button>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPagination(filteredFactors.length)}
              </div>
            )}

            {/* 4. Work Related Causes Table */}
            {masterFmeaSubTab === 'work_related_causes' && (
              <div className="flex flex-col flex-1 min-h-0 space-y-2">
                <div className="shrink-0 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter records..."
                      value={causeSearch}
                      onChange={(e) => { setCauseSearch(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary)"
                    />
                  </div>
                  <button onClick={() => setIsCauseModalOpen(true)} className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Add Cause
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                        <th className="py-2 px-2 w-8"></th>
                        <th className="py-2 px-3">Cause Detail</th>
                        <th className="py-2 px-3">Potential Effect</th>
                        <th className="py-2 px-3">Current Control</th>
                        <th className="py-2 px-3 w-12 text-center">Sev</th>
                        <th className="py-2 px-3 w-12 text-center">Occ</th>
                        <th className="py-2 px-3 w-12 text-center">Det</th>
                        <th className="py-2 px-3 w-16 text-center">RPN</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {filteredCauses.length === 0 ? (
                        <tr><td colSpan={9} className="p-4 text-center text-(--text-muted)">No cause FMEA records found.</td></tr>
                      ) : (
                        paginateData(filteredCauses).map((item, idx) => {
                          const matchedDetail = causeDetailsList.find(d => d.detail_id === item.detail_id);
                          const matchedEffect = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id);
                          const matchedControl = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id);
                          const computedRpn = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));
                          const isExpanded = expandedCauseRowId === item.cause_fmea_id;

                          const linkedDetRecords = causeFmeaDetList.filter(det => det.cause_fmea_id === item.cause_fmea_id);

                          return (
                            <React.Fragment key={`cause-fragment-${item.cause_fmea_id || idx}`}>
                              <tr className="hover:bg-(--accent-subtle) transition-colors">
                                <td className="py-2 px-2 text-center">
                                  <button
                                    onClick={() => setExpandedCauseRowId(isExpanded ? null : item.cause_fmea_id)}
                                    className="p-1 rounded hover:bg-(--border-main) text-(--text-muted) hover:text-(--text-primary) transition-colors cursor-pointer"
                                    title="Toggle Task Standards"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                </td>
                                <td className="py-2 px-3 text-(--text-primary)">{matchedDetail ? `${matchedDetail.code || ''} - ${matchedDetail.description || ''}` : '—'}</td>
                                <td className="py-2 px-3 text-(--text-primary)">{matchedEffect?.potentialeffects_desc || '—'}</td>
                                <td className="py-2 px-3 text-(--text-primary)">{matchedControl?.currentcontrols_desc || '—'}</td>
                                <td className="py-2 px-3 text-center">{item.sev_id ?? '—'}</td>
                                <td className="py-2 px-3 text-center">{item.occ_id ?? '—'}</td>
                                <td className="py-2 px-3 text-center">{item.det_id ?? '—'}</td>
                                <td className="py-2 px-3 font-mono font-bold text-(--text-primary) text-center">{computedRpn}</td>
                                <td className="py-2 px-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setCauseEditRecordId(item.cause_fmea_id);
                                        setCauseEditCauseId(item.cause_id || '');
                                        setCauseEditDetailId(item.detail_id || '');
                                        setCauseEditPotentialEffectId(item.potentialeffects_id || '');
                                        setCauseEditCurrentControlId(item.currentcontrols_id || '');
                                        setCauseEditSevId(item.sev_id ? String(item.sev_id) : '');
                                        setCauseEditOccId(item.occ_id ? String(item.occ_id) : '');
                                        setCauseEditDetId(item.det_id ? String(item.det_id) : '');
                                        const currentLinkedDet = causeFmeaDetList.find(d => d.cause_fmea_id === item.cause_fmea_id);
                                        setEditTaskStandardId(currentLinkedDet?.task_standard_id || '');
                                        setIsEditCauseModalOpen(true);
                                      }}
                                      className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCauseFmea(item.cause_fmea_id)}
                                      className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-(--accent-subtle)/40">
                                  <td colSpan={9} className="p-3">
                                    <div className="pl-6 pr-4 py-3 bg-(--bg-surface) border border-(--border-main) rounded-lg space-y-3">
                                      <div className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                          <Wrench className="w-3.5 h-3.5" /> Linked Equipment Task Standards
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setTaskStdModalTarget({ type: 'cause_det_inline', recordId: item.cause_fmea_id });
                                            setIsTaskStdSelectorModalOpen(true);
                                          }}
                                          className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow"
                                        >
                                          <Plus className="w-3.5 h-3.5" /> Select Equipment Task Standard to Link
                                        </button>
                                      </div>

                                      {linkedDetRecords.length === 0 ? (
                                        <p className="text-xs text-(--text-muted) italic">No equipment task standards mapped to this record.</p>
                                      ) : (
                                        <table className="w-full text-left border-collapse text-xs">
                                          <thead>
                                            <tr className="border-b border-(--border-main) text-(--text-muted)">
                                              <th className="py-1 px-2">Task Standard Description</th>
                                              <th className="py-1 px-2">Item</th>
                                              <th className="py-1 px-2 text-center">Standard Time (hrs)</th>
                                              <th className="py-1 px-2 text-right">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-(--border-main)/60 text-(--text-secondary)">
                                            {linkedDetRecords.map((det, sIdx) => {
                                              const std = taskStandardsList.find(ts => ts.task_standard_id === det.task_standard_id);
                                              return (
                                                <tr key={`cause-std-${det.cause_fmea_det_id || sIdx}`}>
                                                  <td className="py-1.5 px-2 text-(--text-primary)">{std?.task_standard_desc || '—'}</td>
                                                  <td className="py-1.5 px-2 text-(--text-primary)">{std?.item || '—'}</td>
                                                  <td className="py-1.5 px-2 font-mono text-center text-(--text-primary)">{std?.standard_time ?? '0'}</td>
                                                  <td className="py-1.5 px-2 text-right">
                                                    <button
                                                      onClick={() => handleDeleteCauseTaskDet(det.cause_fmea_det_id)}
                                                      className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                    >
                                                      <Trash2 className="w-3 h-3" /> Remove
                                                    </button>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPagination(filteredCauses.length)}
              </div>
            )}
          </div>
        )}

        {/* FMEA Constants Tab */}
        {mainTab === 'constants' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            <div className="shrink-0 flex items-center justify-between border-b border-(--border-main) pb-2">
              <div className="flex bg-(--bg-elevated) p-1 rounded-lg border border-(--border-main) gap-1">
                <button
                  onClick={() => setConstantsSubTab('controls')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    constantsSubTab === 'controls' ? 'bg-(--btn-primary-bg) text-(--btn-primary-text)' : 'text-(--text-muted) hover:text-(--text-primary)'
                  }`}
                >
                  Current Controls ({controlsList.length})
                </button>
                <button
                  onClick={() => setConstantsSubTab('effects')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    constantsSubTab === 'effects' ? 'bg-(--btn-primary-bg) text-(--btn-primary-text)' : 'text-(--text-muted) hover:text-(--text-primary)'
                  }`}
                >
                  Potential Effects ({effectsList.length})
                </button>
              </div>
            </div>

            {constantsSubTab === 'controls' ? (
              <div className="flex flex-col flex-1 min-h-0 space-y-2">
                <div className="shrink-0 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search current controls..."
                      value={controlSearch}
                      onChange={(e) => setControlSearch(e.target.value)}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <button onClick={() => setIsAddControlModalOpen(true)} className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Add Control
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {filteredControls.map((c, idx) => (
                        <tr key={`ctrl-${c.currentcontrols_id || idx}`} className="hover:bg-(--accent-subtle)">
                          <td className="py-2 px-3 text-(--text-primary)">{c.currentcontrols_desc}</td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => { setEditControlRecordId(c.currentcontrols_id); setControlEditDesc(c.currentcontrols_desc || ''); setIsEditControlModalOpen(true); }} className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"><Edit2 className="w-3 h-3" /> Edit</button>
                              <button onClick={() => handleDeleteControl(c.currentcontrols_id)} className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"><Trash2 className="w-3 h-3" /> Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0 space-y-2">
                <div className="shrink-0 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search potential effects..."
                      value={effectSearch}
                      onChange={(e) => setEffectSearch(e.target.value)}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <button onClick={() => setIsAddEffectModalOpen(true)} className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Add Effect
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {filteredEffects.map((e, idx) => (
                        <tr key={`eff-${e.potentialeffects_id || idx}`} className="hover:bg-(--accent-subtle)">
                          <td className="py-2 px-3 text-(--text-primary)">{e.potentialeffects_desc}</td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => { setEditEffectRecordId(e.potentialeffects_id); setEffectEditDesc(e.potentialeffects_desc || ''); setIsEditEffectModalOpen(true); }} className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"><Edit2 className="w-3 h-3" /> Edit</button>
                              <button onClick={() => handleDeleteEffect(e.potentialeffects_id)} className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"><Trash2 className="w-3 h-3" /> Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RPN Definitions Tab */}
        {mainTab === 'rpn_definitions' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            <div className="shrink-0 flex items-center justify-between border-b border-(--border-main) pb-2">
              <div className="flex bg-(--bg-elevated) p-1 rounded-lg border border-(--border-main) gap-1">
                <button onClick={() => setRpnSubTab('severity')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${rpnSubTab === 'severity' ? 'bg-(--btn-primary-bg) text-(--btn-primary-text)' : 'text-(--text-muted) hover:text-(--text-primary)'}`}>Severity ({severityList.length})</button>
                <button onClick={() => setRpnSubTab('occurrence')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${rpnSubTab === 'occurrence' ? 'bg-(--btn-primary-bg) text-(--btn-primary-text)' : 'text-(--text-muted) hover:text-(--text-primary)'}`}>Occurrence ({occurrenceList.length})</button>
                <button onClick={() => setRpnSubTab('detection')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${rpnSubTab === 'detection' ? 'bg-(--btn-primary-bg) text-(--btn-primary-text)' : 'text-(--text-muted) hover:text-(--text-primary)'}`}>Detection ({detectionList.length})</button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
              {rpnSubTab === 'severity' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead><tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle)"><th className="py-2 px-3 w-16">ID</th><th className="py-2 px-3">Severity Description</th></tr></thead>
                  <tbody className="divide-y divide-(--border-main)">{severityList.map((s, idx) => (<tr key={`sev-tab-${s.sev_id || idx}`} className="hover:bg-(--accent-subtle)"><td className="py-2 px-3 font-bold font-mono">{s.sev_id}</td><td className="py-2 px-3">{s.sev_description || '—'}</td></tr>))}</tbody>
                </table>
              )}
              {rpnSubTab === 'occurrence' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead><tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle)"><th className="py-2 px-3 w-16">ID</th><th className="py-2 px-3">Occurrence Description</th></tr></thead>
                  <tbody className="divide-y divide-(--border-main)">{occurrenceList.map((o, idx) => (<tr key={`occ-tab-${o.occ_id || idx}`} className="hover:bg-(--accent-subtle)"><td className="py-2 px-3 font-bold font-mono">{o.occ_id}</td><td className="py-2 px-3">{o.occ_description || '—'}</td></tr>))}</tbody>
                </table>
              )}
              {rpnSubTab === 'detection' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead><tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle)"><th className="py-2 px-3 w-16">ID</th><th className="py-2 px-3">Detection Description</th></tr></thead>
                  <tbody className="divide-y divide-(--border-main)">{detectionList.map((d, idx) => (<tr key={`det-tab-${d.det_id || idx}`} className="hover:bg-(--accent-subtle)"><td className="py-2 px-3 font-bold font-mono">{d.det_id}</td><td className="py-2 px-3">{d.det_description || '—'}</td></tr>))}</tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- EQUIPMENT TASK STANDARD SELECTOR MODAL FORM --- */}
      {isTaskStdSelectorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-(--text-primary)" />
                <h3 className="text-lg font-bold text-(--text-primary)">Select Equipment Task Standard</h3>
              </div>
              <button
                onClick={() => {
                  setIsTaskStdSelectorModalOpen(false);
                  setTaskStdModalTarget(null);
                }}
                className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter and Search controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 shrink-0">
              <div>
                <label className="text-xs font-semibold text-(--text-primary) mb-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filter by Equipment Task
                </label>
                <select
                  value={taskFilterId}
                  onChange={(e) => setTaskFilterId(e.target.value)}
                  className="w-full bg-(--bg-surface) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-1.5 text-xs"
                >
                  <option value="">All Equipment Tasks</option>
                  {equipmentTasksList.map((t) => (
                    <option key={t.task_id} value={t.task_id}>
                      {t.task_name} {t.task_description ? `(${t.task_description})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-(--text-primary) mb-1 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5" /> Search Standard / Item
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by description or item..."
                    value={taskStdSearch}
                    onChange={(e) => setTaskStdSearch(e.target.value)}
                    className="w-full bg-(--bg-surface) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs"
                  />
                  <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2" />
                </div>
              </div>
            </div>

            {/* Standards List Table */}
            <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-surface) mt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                    <th className="py-2.5 px-3">Equipment Task</th>
                    <th className="py-2.5 px-3">Task Standard Description</th>
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3 text-center">Std Time (hrs)</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {filteredModalTaskStandards.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-(--text-muted)">
                        No equipment task standards found matching the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredModalTaskStandards.map((std) => {
                      const parentTask = equipmentTasksList.find((t) => t.task_id === std.task_id);
                      return (
                        <tr key={std.task_standard_id} className="hover:bg-(--accent-subtle) transition-colors">
                          <td className="py-2 px-3 text-(--text-primary) font-medium">
                            {parentTask ? parentTask.task_name : '—'}
                          </td>
                          <td className="py-2 px-3 text-(--text-primary)">{std.task_standard_desc}</td>
                          <td className="py-2 px-3 text-(--text-muted)">{std.item || '—'}</td>
                          <td className="py-2 px-3 text-center font-mono text-(--text-primary)">
                            {std.standard_time ?? '0'}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleSelectTaskStandardFromModal(std.task_standard_id)}
                              className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Select
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-(--border-main) shrink-0 mt-4 text-xs text-(--text-muted)">
              <span>Found {filteredModalTaskStandards.length} standard(s)</span>
              <button
                type="button"
                onClick={() => {
                  setIsTaskStdSelectorModalOpen(false);
                  setTaskStdModalTarget(null);
                }}
                className="px-4 py-1.5 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD UNSAFE CONDITION MODAL --- */}
      {isConditionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-(--text-primary)" />
                <h3 className="text-lg font-bold text-(--text-primary)">Add New Unsafe Condition Record</h3>
              </div>
              <button onClick={() => setIsConditionModalOpen(false)} className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddConditionFmeaModal} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Unsafe Condition</label>
                  <select value={modalConditionId} onChange={(e) => { setModalConditionId(e.target.value); setModalDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Condition...</option>
                    {conditionsList.map((cond, idx) => <option key={`cond-opt-${cond.condition_id || idx}`} value={cond.condition_id}>{cond.code || ''} - {cond.description || cond.condition_desc || cond.name || 'Condition'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Condition Detail</label>
                  <select value={modalDetailId} onChange={(e) => setModalDetailId(e.target.value)} disabled={!modalConditionId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{modalConditionId ? 'Select Condition Detail...' : '— Select Unsafe Condition First —'}</option>
                    {modalFilteredDetails.map((det, idx) => <option key={`cond-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>

                {/* Potential Effect with Search/Filter */}
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Search/filter potential effects..."
                        value={condEffectSearchFilter}
                        onChange={(e) => setCondEffectSearchFilter(e.target.value)}
                        className="w-full bg-(--bg-surface) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1 text-xs"
                      />
                    </div>
                    <select value={modalPotentialEffectId} onChange={(e) => setModalPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Potential Effect...</option>
                      {filteredModalEffects.map((eff, idx) => <option key={`cond-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                    </select>
                  </div>
                </div>

                {/* Current Control with Search/Filter */}
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Search/filter current controls..."
                        value={condControlSearchFilter}
                        onChange={(e) => setCondControlSearchFilter(e.target.value)}
                        className="w-full bg-(--bg-surface) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1 text-xs"
                      />
                    </div>
                    <select value={modalCurrentControlId} onChange={(e) => setModalCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Current Control...</option>
                      {filteredModalControls.map((ctrl, idx) => <option key={`cond-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={modalSevId} onChange={(e) => setModalSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`sev-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={modalOccId} onChange={(e) => setModalOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`occ-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={modalDetId} onChange={(e) => setModalDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Det</option>
                      {detectionList.map((d, idx) => <option key={`det-opt-${d.det_id ?? idx}`} value={d.det_id}>{d.det_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-(--border-main) rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{modalComputedRpn}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button type="button" onClick={() => setIsConditionModalOpen(false)} className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT UNSAFE CONDITION MODAL --- */}
      {isEditConditionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-(--text-primary)" />
                <h3 className="text-lg font-bold text-(--text-primary)">Edit Unsafe Condition Record</h3>
              </div>
              <button onClick={() => setIsEditConditionModalOpen(false)} className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateConditionFmeaModal} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Unsafe Condition</label>
                  <select value={editConditionId} onChange={(e) => { setEditConditionId(e.target.value); setEditDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Condition...</option>
                    {conditionsList.map((cond, idx) => <option key={`cond-edit-opt-${cond.condition_id || idx}`} value={cond.condition_id}>{cond.code || ''} - {cond.description || cond.condition_desc || cond.name || 'Condition'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Condition Detail</label>
                  <select value={editDetailId} onChange={(e) => setEditDetailId(e.target.value)} disabled={!editConditionId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{editConditionId ? 'Select Condition Detail...' : '— Select Unsafe Condition First —'}</option>
                    {editFilteredDetails.map((det, idx) => <option key={`cond-edit-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>

                {/* Edit Potential Effect with Search/Filter */}
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Search/filter potential effects..."
                        value={editCondEffectSearchFilter}
                        onChange={(e) => setEditCondEffectSearchFilter(e.target.value)}
                        className="w-full bg-(--bg-surface) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1 text-xs"
                      />
                    </div>
                    <select value={editPotentialEffectId} onChange={(e) => setEditPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Potential Effect...</option>
                      {filteredEditModalEffects.map((eff, idx) => <option key={`cond-edit-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                    </select>
                  </div>
                </div>

                {/* Edit Current Control with Search/Filter */}
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Search/filter current controls..."
                        value={editCondControlSearchFilter}
                        onChange={(e) => setEditCondControlSearchFilter(e.target.value)}
                        className="w-full bg-(--bg-surface) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1 text-xs"
                      />
                    </div>
                    <select value={editCurrentControlId} onChange={(e) => setEditCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Current Control...</option>
                      {filteredEditModalControls.map((ctrl, idx) => <option key={`cond-edit-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={editSevId} onChange={(e) => setEditSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`sev-edit-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={editOccId} onChange={(e) => setEditOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`occ-edit-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={editDetId} onChange={(e) => setEditDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Det</option>
                      {detectionList.map((d, idx) => <option key={`det-edit-opt-${d.det_id ?? idx}`} value={d.det_id}>{d.det_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-(--border-main) rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{editComputedRpn}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button type="button" onClick={() => setIsEditConditionModalOpen(false)} className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Update Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD UNSAFE ACT MODAL --- */}
      {isActModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-(--text-primary)" />
                <h3 className="text-lg font-bold text-(--text-primary)">Add New Unsafe Act Record</h3>
              </div>
              <button onClick={() => setIsActModalOpen(false)} className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddActFmeaModal} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Unsafe Act</label>
                  <select value={actModalActId} onChange={(e) => { setActModalActId(e.target.value); setActModalDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Act...</option>
                    {actsList.map((act, idx) => <option key={`act-opt-${act.act_id || idx}`} value={act.act_id}>{act.code || ''} - {act.description || act.act_desc || act.name || 'Act'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Act Detail</label>
                  <select value={actModalDetailId} onChange={(e) => setActModalDetailId(e.target.value)} disabled={!actModalActId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{actModalActId ? 'Select Act Detail...' : '— Select Unsafe Act First —'}</option>
                    {actModalFilteredDetails.map((det, idx) => <option key={`act-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Equipment Task Standard</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs truncate">
                      {selectedTaskStandardId ? (
                        taskStandardsList.find(ts => ts.task_standard_id === selectedTaskStandardId)?.task_standard_desc || selectedTaskStandardId
                      ) : (
                        <span className="text-(--text-muted)">No standard selected</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTaskStdModalTarget({ type: 'act_add' });
                        setIsTaskStdSelectorModalOpen(true);
                      }}
                      className="bg-(--accent-subtle) hover:bg-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 border border-(--border-main)"
                    >
                      <Search className="w-3.5 h-3.5" /> Browse & Select
                    </button>
                    {selectedTaskStandardId && (
                      <button
                        type="button"
                        onClick={() => setSelectedTaskStandardId('')}
                        className="text-red-500 hover:text-red-700 p-2 text-xs cursor-pointer"
                        title="Clear Selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <select value={actModalPotentialEffectId} onChange={(e) => setActModalPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Potential Effect...</option>
                    {effectsList.map((eff, idx) => <option key={`act-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <select value={actModalCurrentControlId} onChange={(e) => setActModalCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Current Control...</option>
                    {controlsList.map((ctrl, idx) => <option key={`act-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={actModalSevId} onChange={(e) => setActModalSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`sev-act-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={actModalOccId} onChange={(e) => setActModalOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`occ-act-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={actModalDetId} onChange={(e) => setActModalDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Det</option>
                      {detectionList.map((d, idx) => <option key={`det-act-opt-${d.det_id ?? idx}`} value={d.det_id}>{d.det_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-(--border-main) rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{actModalComputedRpn}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button type="button" onClick={() => setIsActModalOpen(false)} className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT UNSAFE ACT MODAL --- */}
      {isEditActModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-(--text-primary)" />
                <h3 className="text-lg font-bold text-(--text-primary)">Edit Unsafe Act Record</h3>
              </div>
              <button onClick={() => setIsEditActModalOpen(false)} className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateActFmeaModal} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Unsafe Act</label>
                  <select value={actEditActId} onChange={(e) => { setActEditActId(e.target.value); setActEditDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Act...</option>
                    {actsList.map((act, idx) => <option key={`act-edit-opt-${act.act_id || idx}`} value={act.act_id}>{act.code || ''} - {act.description || act.act_desc || act.name || 'Act'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Act Detail</label>
                  <select value={actEditDetailId} onChange={(e) => setActEditDetailId(e.target.value)} disabled={!actEditActId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{actEditActId ? 'Select Act Detail...' : '— Select Unsafe Act First —'}</option>
                    {actEditFilteredDetails.map((det, idx) => <option key={`act-edit-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Equipment Task Standard</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs truncate">
                      {editTaskStandardId ? (
                        taskStandardsList.find(ts => ts.task_standard_id === editTaskStandardId)?.task_standard_desc || editTaskStandardId
                      ) : (
                        <span className="text-(--text-muted)">No standard selected</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTaskStdModalTarget({ type: 'act_edit' });
                        setIsTaskStdSelectorModalOpen(true);
                      }}
                      className="bg-(--accent-subtle) hover:bg-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 border border-(--border-main)"
                    >
                      <Search className="w-3.5 h-3.5" /> Browse & Select
                    </button>
                    {editTaskStandardId && (
                      <button
                        type="button"
                        onClick={() => setEditTaskStandardId('')}
                        className="text-red-500 hover:text-red-700 p-2 text-xs cursor-pointer"
                        title="Clear Selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <select value={actEditPotentialEffectId} onChange={(e) => setActEditPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Potential Effect...</option>
                    {effectsList.map((eff, idx) => <option key={`act-edit-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <select value={actEditCurrentControlId} onChange={(e) => setActEditCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Current Control...</option>
                    {controlsList.map((ctrl, idx) => <option key={`act-edit-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={actEditSevId} onChange={(e) => setActEditSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`sev-act-edit-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={actEditOccId} onChange={(e) => setActEditOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`occ-act-edit-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={actEditDetId} onChange={(e) => setActEditDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Det</option>
                      {detectionList.map((d, idx) => <option key={`det-act-edit-opt-${d.det_id ?? idx}`} value={d.det_id}>{d.det_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-(--border-main) rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{actEditComputedRpn}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button type="button" onClick={() => setIsEditActModalOpen(false)} className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Update Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD PERSONAL FACTOR MODAL --- */}
      {isFactorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-(--text-primary)" />
                <h3 className="text-lg font-bold text-(--text-primary)">Add New Personal Factor Record</h3>
              </div>
              <button onClick={() => setIsFactorModalOpen(false)} className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddFactorFmeaModal} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Personal Factor</label>
                  <select value={factorModalFactorId} onChange={(e) => { setFactorModalFactorId(e.target.value); setFactorModalDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Factor...</option>
                    {factorsList.map((f, idx) => <option key={`factor-opt-${f.factor_id || idx}`} value={f.factor_id}>{f.code || ''} - {f.description || f.factor_desc || f.name || 'Factor'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Factor Detail</label>
                  <select value={factorModalDetailId} onChange={(e) => setFactorModalDetailId(e.target.value)} disabled={!factorModalFactorId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{factorModalFactorId ? 'Select Factor Detail...' : '— Select Personal Factor First —'}</option>
                    {factorModalFilteredDetails.map((det, idx) => <option key={`factor-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Equipment Task Standard</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs truncate">
                      {selectedTaskStandardId ? (
                        taskStandardsList.find(ts => ts.task_standard_id === selectedTaskStandardId)?.task_standard_desc || selectedTaskStandardId
                      ) : (
                        <span className="text-(--text-muted)">No standard selected</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTaskStdModalTarget({ type: 'factor_add' });
                        setIsTaskStdSelectorModalOpen(true);
                      }}
                      className="bg-(--accent-subtle) hover:bg-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 border border-(--border-main)"
                    >
                      <Search className="w-3.5 h-3.5" /> Browse & Select
                    </button>
                    {selectedTaskStandardId && (
                      <button
                        type="button"
                        onClick={() => setSelectedTaskStandardId('')}
                        className="text-red-500 hover:text-red-700 p-2 text-xs cursor-pointer"
                        title="Clear Selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <select value={factorModalPotentialEffectId} onChange={(e) => setFactorModalPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Potential Effect...</option>
                    {effectsList.map((eff, idx) => <option key={`factor-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <select value={factorModalCurrentControlId} onChange={(e) => setFactorModalCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Current Control...</option>
                    {controlsList.map((ctrl, idx) => <option key={`factor-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={factorModalSevId} onChange={(e) => setFactorModalSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`sev-factor-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={factorModalOccId} onChange={(e) => setFactorModalOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`occ-factor-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={factorModalDetId} onChange={(e) => setFactorModalDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Det</option>
                      {detectionList.map((d, idx) => <option key={`det-factor-opt-${d.det_id ?? idx}`} value={d.det_id}>{d.det_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-(--border-main) rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{factorModalComputedRpn}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button type="button" onClick={() => setIsFactorModalOpen(false)} className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT PERSONAL FACTOR MODAL --- */}
      {isEditFactorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-(--text-primary)" />
                <h3 className="text-lg font-bold text-(--text-primary)">Edit Personal Factor Record</h3>
              </div>
              <button onClick={() => setIsEditFactorModalOpen(false)} className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateFactorFmeaModal} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Personal Factor</label>
                  <select value={factorEditFactorId} onChange={(e) => { setFactorEditFactorId(e.target.value); setFactorEditDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Factor...</option>
                    {factorsList.map((f, idx) => <option key={`factor-edit-opt-${f.factor_id || idx}`} value={f.factor_id}>{f.code || ''} - {f.description || f.factor_desc || f.name || 'Factor'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Factor Detail</label>
                  <select value={factorEditDetailId} onChange={(e) => setFactorEditDetailId(e.target.value)} disabled={!factorEditFactorId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{factorEditFactorId ? 'Select Factor Detail...' : '— Select Personal Factor First —'}</option>
                    {factorEditFilteredDetails.map((det, idx) => <option key={`factor-edit-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Equipment Task Standard</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs truncate">
                      {editTaskStandardId ? (
                        taskStandardsList.find(ts => ts.task_standard_id === editTaskStandardId)?.task_standard_desc || editTaskStandardId
                      ) : (
                        <span className="text-(--text-muted)">No standard selected</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTaskStdModalTarget({ type: 'factor_edit' });
                        setIsTaskStdSelectorModalOpen(true);
                      }}
                      className="bg-(--accent-subtle) hover:bg-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 border border-(--border-main)"
                    >
                      <Search className="w-3.5 h-3.5" /> Browse & Select
                    </button>
                    {editTaskStandardId && (
                      <button
                        type="button"
                        onClick={() => setEditTaskStandardId('')}
                        className="text-red-500 hover:text-red-700 p-2 text-xs cursor-pointer"
                        title="Clear Selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <select value={factorEditPotentialEffectId} onChange={(e) => setFactorEditPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Potential Effect...</option>
                    {effectsList.map((eff, idx) => <option key={`factor-edit-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <select value={factorEditCurrentControlId} onChange={(e) => setFactorEditCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Current Control...</option>
                    {controlsList.map((ctrl, idx) => <option key={`factor-edit-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={factorEditSevId} onChange={(e) => setFactorEditSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`sev-factor-edit-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={factorEditOccId} onChange={(e) => setFactorEditOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`occ-factor-edit-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={factorEditDetId} onChange={(e) => setFactorEditDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Det</option>
                      {detectionList.map((d, idx) => <option key={`det-factor-edit-opt-${d.det_id ?? idx}`} value={d.det_id}>{d.det_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-(--border-main) rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{factorEditComputedRpn}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button type="button" onClick={() => setIsEditFactorModalOpen(false)} className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Update Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD WORK RELATED CAUSE MODAL --- */}
      {isCauseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-(--text-primary)" />
                <h3 className="text-lg font-bold text-(--text-primary)">Add New Work Related Cause Record</h3>
              </div>
              <button onClick={() => setIsCauseModalOpen(false)} className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddCauseFmeaModal} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Work Cause</label>
                  <select value={causeModalCauseId} onChange={(e) => { setCauseModalCauseId(e.target.value); setCauseModalDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Work Cause...</option>
                    {causesList.map((c, idx) => <option key={`cause-opt-${c.cause_id || idx}`} value={c.cause_id}>{c.code || ''} - {c.description || c.cause_desc || c.name || 'Cause'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Cause Detail</label>
                  <select value={causeModalDetailId} onChange={(e) => setCauseModalDetailId(e.target.value)} disabled={!causeModalCauseId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{causeModalCauseId ? 'Select Cause Detail...' : '— Select Work Cause First —'}</option>
                    {causeModalFilteredDetails.map((det, idx) => <option key={`cause-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Equipment Task Standard</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs truncate">
                      {selectedTaskStandardId ? (
                        taskStandardsList.find(ts => ts.task_standard_id === selectedTaskStandardId)?.task_standard_desc || selectedTaskStandardId
                      ) : (
                        <span className="text-(--text-muted)">No standard selected</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTaskStdModalTarget({ type: 'cause_add' });
                        setIsTaskStdSelectorModalOpen(true);
                      }}
                      className="bg-(--accent-subtle) hover:bg-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 border border-(--border-main)"
                    >
                      <Search className="w-3.5 h-3.5" /> Browse & Select
                    </button>
                    {selectedTaskStandardId && (
                      <button
                        type="button"
                        onClick={() => setSelectedTaskStandardId('')}
                        className="text-red-500 hover:text-red-700 p-2 text-xs cursor-pointer"
                        title="Clear Selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <select value={causeModalPotentialEffectId} onChange={(e) => setCauseModalPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Potential Effect...</option>
                    {effectsList.map((eff, idx) => <option key={`cause-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <select value={causeModalCurrentControlId} onChange={(e) => setCauseModalCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Current Control...</option>
                    {controlsList.map((ctrl, idx) => <option key={`cause-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={causeModalSevId} onChange={(e) => setCauseModalSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`sev-cause-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={causeModalOccId} onChange={(e) => setCauseModalOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`occ-cause-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={causeModalDetId} onChange={(e) => setCauseModalDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Det</option>
                      {detectionList.map((d, idx) => <option key={`det-cause-opt-${d.det_id ?? idx}`} value={d.det_id}>{d.det_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-(--border-main) rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{causeModalComputedRpn}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button type="button" onClick={() => setIsCauseModalOpen(false)} className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT WORK RELATED CAUSE MODAL --- */}
      {isEditCauseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-(--text-primary)" />
                <h3 className="text-lg font-bold text-(--text-primary)">Edit Work Related Cause Record</h3>
              </div>
              <button onClick={() => setIsEditCauseModalOpen(false)} className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateCauseFmeaModal} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Work Cause</label>
                  <select value={causeEditCauseId} onChange={(e) => { setCauseEditCauseId(e.target.value); setCauseEditDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Work Cause...</option>
                    {causesList.map((c, idx) => <option key={`cause-edit-opt-${c.cause_id || idx}`} value={c.cause_id}>{c.code || ''} - {c.description || c.cause_desc || c.name || 'Cause'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Cause Detail</label>
                  <select value={causeEditDetailId} onChange={(e) => setCauseEditDetailId(e.target.value)} disabled={!causeEditCauseId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{causeEditCauseId ? 'Select Cause Detail...' : '— Select Work Cause First —'}</option>
                    {causeEditFilteredDetails.map((det, idx) => <option key={`cause-edit-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Equipment Task Standard</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs truncate">
                      {editTaskStandardId ? (
                        taskStandardsList.find(ts => ts.task_standard_id === editTaskStandardId)?.task_standard_desc || editTaskStandardId
                      ) : (
                        <span className="text-(--text-muted)">No standard selected</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTaskStdModalTarget({ type: 'cause_edit' });
                        setIsTaskStdSelectorModalOpen(true);
                      }}
                      className="bg-(--accent-subtle) hover:bg-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 border border-(--border-main)"
                    >
                      <Search className="w-3.5 h-3.5" /> Browse & Select
                    </button>
                    {editTaskStandardId && (
                      <button
                        type="button"
                        onClick={() => setEditTaskStandardId('')}
                        className="text-red-500 hover:text-red-700 p-2 text-xs cursor-pointer"
                        title="Clear Selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <select value={causeEditPotentialEffectId} onChange={(e) => setCauseEditPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Potential Effect...</option>
                    {effectsList.map((eff, idx) => <option key={`cause-edit-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <select value={causeEditCurrentControlId} onChange={(e) => setCauseEditCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Current Control...</option>
                    {controlsList.map((ctrl, idx) => <option key={`cause-edit-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={causeEditSevId} onChange={(e) => setCauseEditSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`sev-cause-edit-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={causeEditOccId} onChange={(e) => setCauseEditOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`occ-cause-edit-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={causeEditDetId} onChange={(e) => setCauseEditDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Det</option>
                      {detectionList.map((d, idx) => <option key={`det-cause-edit-opt-${d.det_id ?? idx}`} value={d.det_id}>{d.det_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-(--border-main) rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{causeEditComputedRpn}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button type="button" onClick={() => setIsEditConditionModalOpen(false)} className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Update Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD CONTROL CONSTANT MODAL --- */}
      {isAddControlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-(--text-primary) mb-3">Add Current Control</h3>
            <form onSubmit={handleAddControl} className="space-y-4">
              <input
                type="text"
                placeholder="Control description..."
                value={controlModalDesc}
                onChange={(e) => setControlModalDesc(e.target.value)}
                className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddControlModalOpen(false)} className="px-3 py-1.5 bg-(--accent-subtle) text-(--text-primary) rounded-lg text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-(--btn-primary-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold">Save Control</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT CONTROL CONSTANT MODAL --- */}
      {isEditControlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-(--text-primary) mb-3">Edit Current Control</h3>
            <form onSubmit={handleUpdateControl} className="space-y-4">
              <input
                type="text"
                value={controlEditDesc}
                onChange={(e) => setControlEditDesc(e.target.value)}
                className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditControlModalOpen(false)} className="px-3 py-1.5 bg-(--accent-subtle) text-(--text-primary) rounded-lg text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-(--btn-primary-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold">Update Control</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD EFFECT CONSTANT MODAL --- */}
      {isAddEffectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-(--text-primary) mb-3">Add Potential Effect</h3>
            <form onSubmit={handleAddEffect} className="space-y-4">
              <input
                type="text"
                placeholder="Effect description..."
                value={effectModalDesc}
                onChange={(e) => setEffectModalDesc(e.target.value)}
                className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddEffectModalOpen(false)} className="px-3 py-1.5 bg-(--accent-subtle) text-(--text-primary) rounded-lg text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-(--btn-primary-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold">Save Effect</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT EFFECT CONSTANT MODAL --- */}
      {isEditEffectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-(--text-primary) mb-3">Edit Potential Effect</h3>
            <form onSubmit={handleUpdateEffect} className="space-y-4">
              <input
                type="text"
                value={effectEditDesc}
                onChange={(e) => setEffectEditDesc(e.target.value)}
                className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditEffectModalOpen(false)} className="px-3 py-1.5 bg-(--accent-subtle) text-(--text-primary) rounded-lg text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-(--btn-primary-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold">Update Effect</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FmeaSettings;