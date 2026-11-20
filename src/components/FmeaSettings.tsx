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

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Reusable Custom Dropdown Component
function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = '-- Select --',
  disabled = false,
  className = '',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`w-full bg-(--bg-elevated) border border-slate-300 dark:border-slate-600 text-(--text-primary) px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? 'border-blue-500 dark:border-blue-400 ring-1 ring-blue-500' : 'hover:border-slate-400 dark:hover:border-slate-500'
        }`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-(--text-muted) transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-(--bg-elevated) border border-slate-300 dark:border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto py-1 text-xs">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-(--text-muted) italic text-center">No options available</div>
          ) : (
            options.map(opt => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 cursor-pointer transition-colors truncate ${
                    isSelected 
                      ? 'bg-(--accent-subtle) font-semibold text-(--text-primary)' 
                      : 'text-(--text-secondary) hover:bg-(--accent-subtle) hover:text-(--text-primary)'
                  }`}
                >
                  {opt.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
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

  // RPN Definitions Modal States
  const [isAddRpnModalOpen, setIsAddRpnModalOpen] = useState<boolean>(false);
  const [isEditRpnModalOpen, setIsEditRpnModalOpen] = useState<boolean>(false);
  const [rpnModalId, setRpnModalId] = useState<string>('');
  const [rpnModalDesc, setRpnModalDesc] = useState<string>('');
  const [editRpnRecordId, setEditRpnRecordId] = useState<number | null>(null);
  const [rpnEditDesc, setRpnEditDesc] = useState<string>('');

  // Search states
  const [controlSearch, setControlSearch] = useState<string>('');
  const [effectSearch, setEffectSearch] = useState<string>('');
  const [rpnSearch, setRpnSearch] = useState<string>('');
  const [conditionSearch, setConditionSearch] = useState<string>('');
  const [actSearch, setActSearch] = useState<string>('');
  const [factorSearch, setFactorSearch] = useState<string>('');
  const [causeSearch, setCauseSearch] = useState<string>('');

  // Task Standard Selection State for Act, Factor & Cause Modals
  const [selectedTaskStandardId, setSelectedTaskStandardId] = useState<string>('');
  const [editTaskStandardId, setEditTaskStandardId] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);
  const currentTabKey = `${mainTab}:${masterFmeaSubTab}:${constantsSubTab}:${rpnSubTab}`;
  const [paginationTabKey, setPaginationTabKey] = useState(currentTabKey);

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

  // --- Handlers for RPN Definitions (Severity, Occurrence, Detection) ---
  const handleAddRpnDefinition = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericId = Number(rpnModalId);
    if (!rpnModalId.trim() || Number.isNaN(numericId) || !rpnModalDesc.trim()) {
      setErrorMsg('Please provide a valid numeric Score ID and Description.');
      return;
    }

    try {
      setErrorMsg(null);
      if (rpnSubTab === 'severity') {
        const { error } = await supabase
          .from('fmea_severity')
          .insert([{ sev_id: numericId, sev_description: rpnModalDesc.trim() }]);
        if (error) throw error;
      } else if (rpnSubTab === 'occurrence') {
        const { error } = await supabase
          .from('fmea_occurence')
          .insert([{ occ_id: numericId, occ_description: rpnModalDesc.trim() }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fmea_detection')
          .insert([{ det_id: numericId, det_description: rpnModalDesc.trim() }]);
        if (error) throw error;
      }

      const label = rpnSubTab === 'severity' ? 'Severity' : rpnSubTab === 'occurrence' ? 'Occurrence' : 'Detection';
      setRpnModalId('');
      setRpnModalDesc('');
      setIsAddRpnModalOpen(false);
      setSuccessMsg(`${label} definition added successfully!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to add RPN definition: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleUpdateRpnDefinition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editRpnRecordId === null || !rpnEditDesc.trim()) return;

    try {
      setErrorMsg(null);
      const updatedAt = new Date().toISOString();

      if (rpnSubTab === 'severity') {
        const { error } = await supabase
          .from('fmea_severity')
          .update({ sev_description: rpnEditDesc.trim(), updated_at: updatedAt })
          .eq('sev_id', editRpnRecordId);
        if (error) throw error;
      } else if (rpnSubTab === 'occurrence') {
        const { error } = await supabase
          .from('fmea_occurence')
          .update({ occ_description: rpnEditDesc.trim(), updated_at: updatedAt })
          .eq('occ_id', editRpnRecordId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fmea_detection')
          .update({ det_description: rpnEditDesc.trim(), updated_at: updatedAt })
          .eq('det_id', editRpnRecordId);
        if (error) throw error;
      }

      const label = rpnSubTab === 'severity' ? 'Severity' : rpnSubTab === 'occurrence' ? 'Occurrence' : 'Detection';
      setIsEditRpnModalOpen(false);
      setEditRpnRecordId(null);
      setRpnEditDesc('');
      setSuccessMsg(`${label} definition updated successfully!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to update RPN definition: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteRpnDefinition = async (id: number) => {
    const label = rpnSubTab === 'severity' ? 'Severity' : rpnSubTab === 'occurrence' ? 'Occurrence' : 'Detection';
    if (!confirm(`Are you sure you want to delete this ${label} definition (ID: ${id})?`)) return;

    try {
      setErrorMsg(null);
      if (rpnSubTab === 'severity') {
        const { error } = await supabase.from('fmea_severity').delete().eq('sev_id', id);
        if (error) throw error;
      } else if (rpnSubTab === 'occurrence') {
        const { error } = await supabase.from('fmea_occurence').delete().eq('occ_id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('fmea_detection').delete().eq('det_id', id);
        if (error) throw error;
      }

      setSuccessMsg(`${label} definition deleted successfully!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to delete RPN definition: ${(errObj?.message as string) || JSON.stringify(err)}`);
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
  const filteredSeverity = severityList.filter(s =>
    String(s.sev_id).includes(rpnSearch) ||
    (s.sev_description || '').toLowerCase().includes(rpnSearch.toLowerCase())
  );
  const filteredOccurrence = occurrenceList.filter(o =>
    String(o.occ_id).includes(rpnSearch) ||
    (o.occ_description || '').toLowerCase().includes(rpnSearch.toLowerCase())
  );
  const filteredDetection = detectionList.filter(d =>
    String(d.det_id).includes(rpnSearch) ||
    (d.det_description || '').toLowerCase().includes(rpnSearch.toLowerCase())
  );

  const paginateData = <T,>(list: T[]): T[] => {
    const totalPages = Math.ceil(list.length / pageSize) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  };

  // Unified Tab & Sub-Tab Highlight Helper (matching Dashboard pattern)
  const getTabClass = (isActive: boolean) =>
    isActive
      ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) border border-solid border-(--btn-primary-bg) shadow-md ring-2 ring-(--btn-primary-bg)/30'
      : 'bg-(--bg-surface) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--accent-subtle) border border-solid border-(--border-main)';

  const renderPagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const safePage = Math.min(currentPage, totalPages);
    return (
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-(--text-muted)">
        <div className="flex items-center gap-3">
          <span>
            Showing {totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, totalItems)} of {totalItems} entries
          </span>
          <label className="flex items-center gap-1.5">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Rows per page"
              className="bg-(--bg-elevated) border border-slate-300 dark:border-slate-600 text-(--text-primary) rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value={6}>6</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(safePage - 1, 1))}
            disabled={safePage === 1}
            className="p-1 bg-(--bg-elevated) border border-(--border-main) rounded hover:opacity-80 disabled:opacity-40 cursor-pointer text-(--text-primary)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span>Page {safePage} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(safePage + 1, totalPages))}
            disabled={safePage >= totalPages}
            className="p-1 bg-(--bg-elevated) border border-(--border-main) rounded hover:opacity-80 disabled:opacity-40 cursor-pointer text-(--text-primary)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const currentRpnLabel = rpnSubTab === 'severity' ? 'Severity' : rpnSubTab === 'occurrence' ? 'Occurrence' : 'Detection';

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3 overflow-hidden">
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

      {/* Main Content Body Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-elevated) border border-solid border-(--border-main) rounded-xl p-4 shadow-xl overflow-hidden space-y-3">
        {/* Primary Navigation Tabs */}
        <div className="shrink-0 flex flex-wrap items-center gap-2 border-b border-(--border-main) pb-3 pt-1">
          <button
            type="button"
            onClick={() => setMainTab('master_fmea')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getTabClass(mainTab === 'master_fmea')}`}
          >
            <Database className={`w-4 h-4 ${mainTab === 'master_fmea' ? '' : 'text-blue-500'}`} />
            <span>Master FMEA</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('constants')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getTabClass(mainTab === 'constants')}`}
          >
            <Sliders className={`w-4 h-4 ${mainTab === 'constants' ? '' : 'text-emerald-500'}`} />
            <span>FMEA Constants</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('rpn_definitions')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getTabClass(mainTab === 'rpn_definitions')}`}
          >
            <ShieldAlert className={`w-4 h-4 ${mainTab === 'rpn_definitions' ? '' : 'text-amber-500'}`} />
            <span>RPN Definitions</span>
          </button>
        </div>

        {/* Tab Content Area */}
        {mainTab === 'master_fmea' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            {/* Master FMEA Sub-Tabs */}
            <div className="shrink-0 flex flex-wrap items-center gap-2 border-b border-(--border-main) pb-3 pt-1">
              <button
                type="button"
                onClick={() => { setMasterFmeaSubTab('unsafe_conditions'); setCurrentPage(1); }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getTabClass(masterFmeaSubTab === 'unsafe_conditions')}`}
              >
                <AlertOctagon className={`w-4 h-4 ${masterFmeaSubTab === 'unsafe_conditions' ? '' : 'text-red-500'}`} />
                <span>Unsafe Conditions</span>
              </button>

              <button
                type="button"
                onClick={() => { setMasterFmeaSubTab('unsafe_acts'); setCurrentPage(1); }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getTabClass(masterFmeaSubTab === 'unsafe_acts')}`}
              >
                <UserX className={`w-4 h-4 ${masterFmeaSubTab === 'unsafe_acts' ? '' : 'text-amber-500'}`} />
                <span>Unsafe Acts</span>
              </button>

              <button
                type="button"
                onClick={() => { setMasterFmeaSubTab('personal_factors'); setCurrentPage(1); }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getTabClass(masterFmeaSubTab === 'personal_factors')}`}
              >
                <UserCheck className={`w-4 h-4 ${masterFmeaSubTab === 'personal_factors' ? '' : 'text-indigo-500'}`} />
                <span>Personal Factors</span>
              </button>

              <button
                type="button"
                onClick={() => { setMasterFmeaSubTab('work_related_causes'); setCurrentPage(1); }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getTabClass(masterFmeaSubTab === 'work_related_causes')}`}
              >
                <Briefcase className={`w-4 h-4 ${masterFmeaSubTab === 'work_related_causes' ? '' : 'text-blue-500'}`} />
                <span>Work Related Causes</span>
              </button>
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
                      className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button onClick={() => setIsConditionModalOpen(true)} className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Add Condition
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-surface)">
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
                        paginateData(filteredConditions).map((item, _idx) => {
                          const matchedDetail = conditionDetailsList.find(d => d.detail_id === item.detail_id);
                          const matchedEffect = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id);
                          const matchedControl = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id);
                          const computedRpn = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));
                          const isExpanded = expandedConditionRowId === item.conditionsfmea_id;

                          const linkedDetRecords = conditionsFmeaDetList.filter(det => det.conditionsfmea_id === item.conditionsfmea_id);

                          return (
                            <React.Fragment key={`cond-fragment-${item.conditionsfmea_id || _idx}`}>
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
                                    <div className="pl-6 pr-4 py-3 bg-(--bg-elevated) border border-(--border-main) rounded-lg space-y-3">
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
                                            {linkedDetRecords.map((det, _sIdx) => {
                                              const std = taskStandardsList.find(ts => ts.task_standard_id === det.task_standard_id);
                                              return (
                                                <tr key={`cond-std-${det.conditions_fmea_det_id || _sIdx}`}>
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
                      className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button onClick={() => setIsActModalOpen(true)} className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Add Act
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-surface)">
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
                        paginateData(filteredActs).map((item, _idx) => {
                          const matchedDetail = actDetailsList.find(d => d.detail_id === item.detail_id);
                          const matchedEffect = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id);
                          const matchedControl = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id);
                          const computedRpn = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));
                          const isExpanded = expandedActRowId === item.actfmea_id;

                          const linkedDetRecords = actFmeaDetList.filter(det => det.actfmea_id === item.actfmea_id);

                          return (
                            <React.Fragment key={`act-fragment-${item.actfmea_id || _idx}`}>
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
                                    <div className="pl-6 pr-4 py-3 bg-(--bg-elevated) border border-(--border-main) rounded-lg space-y-3">
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
                                            {linkedDetRecords.map((det, _sIdx) => {
                                              const std = taskStandardsList.find(ts => ts.task_standard_id === det.task_standard_id);
                                              return (
                                                <tr key={`act-std-${det.act_fmea_det_id || _sIdx}`}>
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
                      className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button onClick={() => setIsFactorModalOpen(true)} className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Add Factor
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-surface)">
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
                        paginateData(filteredFactors).map((item, _idx) => {
                          const matchedDetail = factorDetailsList.find(d => d.detail_id === item.detail_id);
                          const matchedEffect = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id);
                          const matchedControl = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id);
                          const computedRpn = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));

                          const recId = item.factors_fmea_id || item.factor_fmea_id || item.conditions_fmea_id || item.id || `factor-${_idx}`;
                          const pkCol = item.factors_fmea_id ? 'factors_fmea_id' : item.factor_fmea_id ? 'factor_fmea_id' : 'id';
                          const isExpanded = expandedFactorRowId === recId;

                          const linkedDetRecords = factorsFmeaDetList.filter(det => det.factors_fmea_id === recId);

                          return (
                            <React.Fragment key={`factor-fragment-${recId}-${_idx}`}>
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
                                    <div className="pl-6 pr-4 py-3 bg-(--bg-elevated) border border-(--border-main) rounded-lg space-y-3">
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
                                            {linkedDetRecords.map((det, _sIdx) => {
                                              const std = taskStandardsList.find(ts => ts.task_standard_id === det.task_standard_id);
                                              return (
                                                <tr key={`factor-std-${det.factors_fmea_det_id || _sIdx}`}>
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
                      className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button onClick={() => setIsCauseModalOpen(true)} className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Add Cause
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-surface)">
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
                        paginateData(filteredCauses).map((item, _idx) => {
                          const matchedDetail = causeDetailsList.find(d => d.detail_id === item.detail_id);
                          const matchedEffect = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id);
                          const matchedControl = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id);
                          const computedRpn = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));
                          const isExpanded = expandedCauseRowId === item.cause_fmea_id;

                          const linkedDetRecords = causeFmeaDetList.filter(det => det.cause_fmea_id === item.cause_fmea_id);

                          return (
                            <React.Fragment key={`cause-fragment-${item.cause_fmea_id || _idx}`}>
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
                                    <div className="pl-6 pr-4 py-3 bg-(--bg-elevated) border border-(--border-main) rounded-lg space-y-3">
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
                                            {linkedDetRecords.map((det, _sIdx) => {
                                              const std = taskStandardsList.find(ts => ts.task_standard_id === det.task_standard_id);
                                              return (
                                                <tr key={`cause-std-${det.cause_fmea_det_id || _sIdx}`}>
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
            {/* Constants Sub-Tabs */}
            <div className="shrink-0 flex flex-wrap items-center gap-2 border-b border-(--border-main) pb-3 pt-1">
              <button
                type="button"
                onClick={() => { setConstantsSubTab('controls'); setCurrentPage(1); }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getTabClass(constantsSubTab === 'controls')}`}
              >
                <ShieldAlert className={`w-4 h-4 ${constantsSubTab === 'controls' ? '' : 'text-emerald-500'}`} />
                <span>Current Controls ({controlsList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => { setConstantsSubTab('effects'); setCurrentPage(1); }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getTabClass(constantsSubTab === 'effects')}`}
              >
                <AlertOctagon className={`w-4 h-4 ${constantsSubTab === 'effects' ? '' : 'text-red-500'}`} />
                <span>Potential Effects ({effectsList.length})</span>
              </button>
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
                      onChange={(e) => { setControlSearch(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button onClick={() => setIsAddControlModalOpen(true)} className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Add Control
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-surface)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {filteredControls.length === 0 ? (
                        <tr><td colSpan={2} className="p-4 text-center text-(--text-muted)">No current controls found.</td></tr>
                      ) : (
                        paginateData(filteredControls).map((c, _idx) => (
                          <tr key={`ctrl-${c.currentcontrols_id || _idx}`} className="hover:bg-(--accent-subtle)">
                            <td className="py-2 px-3 text-(--text-primary)">{c.currentcontrols_desc}</td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => { setEditControlRecordId(c.currentcontrols_id); setControlEditDesc(c.currentcontrols_desc || ''); setIsEditControlModalOpen(true); }} className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"><Edit2 className="w-3 h-3" /> Edit</button>
                                <button onClick={() => handleDeleteControl(c.currentcontrols_id)} className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"><Trash2 className="w-3 h-3" /> Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPagination(filteredControls.length)}
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
                      onChange={(e) => { setEffectSearch(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button onClick={() => setIsAddEffectModalOpen(true)} className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Add Effect
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-surface)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {filteredEffects.length === 0 ? (
                        <tr><td colSpan={2} className="p-4 text-center text-(--text-muted)">No potential effects found.</td></tr>
                      ) : (
                        paginateData(filteredEffects).map((e, _idx) => (
                          <tr key={`eff-${e.potentialeffects_id || _idx}`} className="hover:bg-(--accent-subtle)">
                            <td className="py-2 px-3 text-(--text-primary)">{e.potentialeffects_desc}</td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => { setEditEffectRecordId(e.potentialeffects_id); setEffectEditDesc(e.potentialeffects_desc || ''); setIsEditEffectModalOpen(true); }} className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"><Edit2 className="w-3 h-3" /> Edit</button>
                                <button onClick={() => handleDeleteEffect(e.potentialeffects_id)} className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"><Trash2 className="w-3 h-3" /> Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPagination(filteredEffects.length)}
              </div>
            )}
          </div>
        )}

        {/* RPN Definitions Tab */}
        {mainTab === 'rpn_definitions' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            {/* RPN Sub-Tabs */}
            <div className="shrink-0 flex flex-wrap items-center gap-2 border-b border-(--border-main) pb-3 pt-1">
              <button
                type="button"
                onClick={() => { setRpnSubTab('severity'); setRpnSearch(''); setCurrentPage(1); }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getTabClass(rpnSubTab === 'severity')}`}
              >
                <AlertOctagon className={`w-4 h-4 ${rpnSubTab === 'severity' ? '' : 'text-red-500'}`} />
                <span>Severity ({severityList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => { setRpnSubTab('occurrence'); setRpnSearch(''); setCurrentPage(1); }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getTabClass(rpnSubTab === 'occurrence')}`}
              >
                <Sliders className={`w-4 h-4 ${rpnSubTab === 'occurrence' ? '' : 'text-amber-500'}`} />
                <span>Occurrence ({occurrenceList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => { setRpnSubTab('detection'); setRpnSearch(''); setCurrentPage(1); }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${getTabClass(rpnSubTab === 'detection')}`}
              >
                <Search className={`w-4 h-4 ${rpnSubTab === 'detection' ? '' : 'text-blue-500'}`} />
                <span>Detection ({detectionList.length})</span>
              </button>
            </div>

            {/* RPN Search & Add Bar */}
            <div className="shrink-0 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={`Search ${currentRpnLabel.toLowerCase()} definitions...`}
                  value={rpnSearch}
                  onChange={(e) => { setRpnSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const currentList = rpnSubTab === 'severity' ? severityList : rpnSubTab === 'occurrence' ? occurrenceList : detectionList;
                  const maxId = currentList.reduce((max, item) => {
                    const idVal = 'sev_id' in item ? item.sev_id : 'occ_id' in item ? item.occ_id : item.det_id;
                    return Math.max(max, Number(idVal) || 0);
                  }, 0);
                  setRpnModalId(String(maxId + 1));
                  setRpnModalDesc('');
                  setIsAddRpnModalOpen(true);
                }}
                className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Add {currentRpnLabel}
              </button>
            </div>

            {rpnSubTab === 'severity' && (
              <div className="flex flex-col flex-1 min-h-0 space-y-2">
                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-surface)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                        <th className="py-2 px-3 w-16">ID</th>
                        <th className="py-2 px-3">Severity Description</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {filteredSeverity.length === 0 ? (
                        <tr><td colSpan={3} className="p-4 text-center text-(--text-muted)">No severity definitions found.</td></tr>
                      ) : (
                        paginateData(filteredSeverity).map((s, _idx) => (
                          <tr key={`sev-tab-${s.sev_id || _idx}`} className="hover:bg-(--accent-subtle)">
                            <td className="py-2 px-3 font-bold font-mono text-(--text-primary)">{s.sev_id}</td>
                            <td className="py-2 px-3 text-(--text-primary)">{s.sev_description || '—'}</td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditRpnRecordId(s.sev_id);
                                    setRpnEditDesc(s.sev_description || '');
                                    setIsEditRpnModalOpen(true);
                                  }}
                                  className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteRpnDefinition(s.sev_id)}
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
                {renderPagination(filteredSeverity.length)}
              </div>
            )}

            {rpnSubTab === 'occurrence' && (
              <div className="flex flex-col flex-1 min-h-0 space-y-2">
                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-surface)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                        <th className="py-2 px-3 w-16">ID</th>
                        <th className="py-2 px-3">Occurrence Description</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {filteredOccurrence.length === 0 ? (
                        <tr><td colSpan={3} className="p-4 text-center text-(--text-muted)">No occurrence definitions found.</td></tr>
                      ) : (
                        paginateData(filteredOccurrence).map((o, _idx) => (
                          <tr key={`occ-tab-${o.occ_id || _idx}`} className="hover:bg-(--accent-subtle)">
                            <td className="py-2 px-3 font-bold font-mono text-(--text-primary)">{o.occ_id}</td>
                            <td className="py-2 px-3 text-(--text-primary)">{o.occ_description || '—'}</td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditRpnRecordId(o.occ_id);
                                    setRpnEditDesc(o.occ_description || '');
                                    setIsEditRpnModalOpen(true);
                                  }}
                                  className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteRpnDefinition(o.occ_id)}
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
                {renderPagination(filteredOccurrence.length)}
              </div>
            )}

            {rpnSubTab === 'detection' && (
              <div className="flex flex-col flex-1 min-h-0 space-y-2">
                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-surface)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10">
                        <th className="py-2 px-3 w-16">ID</th>
                        <th className="py-2 px-3">Detection Description</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {filteredDetection.length === 0 ? (
                        <tr><td colSpan={3} className="p-4 text-center text-(--text-muted)">No detection definitions found.</td></tr>
                      ) : (
                        paginateData(filteredDetection).map((d, _idx) => (
                          <tr key={`det-tab-${d.det_id || _idx}`} className="hover:bg-(--accent-subtle)">
                            <td className="py-2 px-3 font-bold font-mono text-(--text-primary)">{d.det_id}</td>
                            <td className="py-2 px-3 text-(--text-primary)">{d.det_description || '—'}</td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditRpnRecordId(d.det_id);
                                    setRpnEditDesc(d.det_description || '');
                                    setIsEditRpnModalOpen(true);
                                  }}
                                  className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteRpnDefinition(d.det_id)}
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
                {renderPagination(filteredDetection.length)}
              </div>
            )}
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
                <CustomDropdown
                  value={taskFilterId}
                  onChange={(val) => setTaskFilterId(val)}
                  placeholder="All Equipment Tasks"
                  options={[
                    { value: '', label: 'All Equipment Tasks' },
                    ...equipmentTasksList.map((t) => ({
                      value: t.task_id,
                      label: `${t.task_name} ${t.task_description ? `(${t.task_description})` : ''}`,
                    }))
                  ]}
                />
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
                    className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs"
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
                  <CustomDropdown
                    value={modalConditionId}
                    onChange={(val) => {
                      setModalConditionId(val);
                      setModalDetailId('');
                    }}
                    placeholder="Select Condition..."
                    options={[
                      { value: '', label: 'Select Condition...' },
                      ...conditionsList.map((cond) => ({
                        value: cond.condition_id,
                        label: `${cond.code || ''} - ${cond.description || cond.condition_desc || cond.name || 'Condition'}`,
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Condition Detail</label>
                  <CustomDropdown
                    value={modalDetailId}
                    onChange={(val) => setModalDetailId(val)}
                    disabled={!modalConditionId}
                    placeholder={modalConditionId ? 'Select Condition Detail...' : '— Select Unsafe Condition First —'}
                    options={[
                      { value: '', label: modalConditionId ? 'Select Condition Detail...' : '— Select Unsafe Condition First —' },
                      ...modalFilteredDetails.map((det) => ({
                        value: det.detail_id,
                        label: `${det.code || ''} - ${det.description || ''}`,
                      }))
                    ]}
                  />
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
                        className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-8 pr-3 py-1 text-xs"
                      />
                    </div>
                    <CustomDropdown
                      value={modalPotentialEffectId}
                      onChange={(val) => setModalPotentialEffectId(val)}
                      placeholder="Select Potential Effect..."
                      options={[
                        { value: '', label: 'Select Potential Effect...' },
                        ...filteredModalEffects.map((eff) => ({
                          value: eff.potentialeffects_id,
                          label: eff.potentialeffects_desc || '',
                        }))
                      ]}
                    />
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
                        className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-8 pr-3 py-1 text-xs"
                      />
                    </div>
                    <CustomDropdown
                      value={modalCurrentControlId}
                      onChange={(val) => setModalCurrentControlId(val)}
                      placeholder="Select Current Control..."
                      options={[
                        { value: '', label: 'Select Current Control...' },
                        ...filteredModalControls.map((ctrl) => ({
                          value: ctrl.currentcontrols_id,
                          label: ctrl.currentcontrols_desc || '',
                        }))
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <CustomDropdown
                      value={modalSevId}
                      onChange={(val) => setModalSevId(val)}
                      placeholder="Sev"
                      options={[
                        { value: '', label: 'Sev' },
                        ...severityList.map((s) => ({
                          value: String(s.sev_id),
                          label: String(s.sev_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <CustomDropdown
                      value={modalOccId}
                      onChange={(val) => setModalOccId(val)}
                      placeholder="Occ"
                      options={[
                        { value: '', label: 'Occ' },
                        ...occurrenceList.map((o) => ({
                          value: String(o.occ_id),
                          label: String(o.occ_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <CustomDropdown
                      value={modalDetId}
                      onChange={(val) => setModalDetId(val)}
                      placeholder="Det"
                      options={[
                        { value: '', label: 'Det' },
                        ...detectionList.map((d) => ({
                          value: String(d.det_id),
                          label: String(d.det_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{modalComputedRpn}</div>
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
                  <CustomDropdown
                    value={editConditionId}
                    onChange={(val) => {
                      setEditConditionId(val);
                      setEditDetailId('');
                    }}
                    placeholder="Select Condition..."
                    options={[
                      { value: '', label: 'Select Condition...' },
                      ...conditionsList.map((cond) => ({
                        value: cond.condition_id,
                        label: `${cond.code || ''} - ${cond.description || cond.condition_desc || cond.name || 'Condition'}`,
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Condition Detail</label>
                  <CustomDropdown
                    value={editDetailId}
                    onChange={(val) => setEditDetailId(val)}
                    disabled={!editConditionId}
                    placeholder={editConditionId ? 'Select Condition Detail...' : '— Select Unsafe Condition First —'}
                    options={[
                      { value: '', label: editConditionId ? 'Select Condition Detail...' : '— Select Unsafe Condition First —' },
                      ...editFilteredDetails.map((det) => ({
                        value: det.detail_id,
                        label: `${det.code || ''} - ${det.description || ''}`,
                      }))
                    ]}
                  />
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
                        className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-8 pr-3 py-1 text-xs"
                      />
                    </div>
                    <CustomDropdown
                      value={editPotentialEffectId}
                      onChange={(val) => setEditPotentialEffectId(val)}
                      placeholder="Select Potential Effect..."
                      options={[
                        { value: '', label: 'Select Potential Effect...' },
                        ...filteredEditModalEffects.map((eff) => ({
                          value: eff.potentialeffects_id,
                          label: eff.potentialeffects_desc || '',
                        }))
                      ]}
                    />
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
                        className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-8 pr-3 py-1 text-xs"
                      />
                    </div>
                    <CustomDropdown
                      value={editCurrentControlId}
                      onChange={(val) => setEditCurrentControlId(val)}
                      placeholder="Select Current Control..."
                      options={[
                        { value: '', label: 'Select Current Control...' },
                        ...filteredEditModalControls.map((ctrl) => ({
                          value: ctrl.currentcontrols_id,
                          label: ctrl.currentcontrols_desc || '',
                        }))
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <CustomDropdown
                      value={editSevId}
                      onChange={(val) => setEditSevId(val)}
                      placeholder="Sev"
                      options={[
                        { value: '', label: 'Sev' },
                        ...severityList.map((s) => ({
                          value: String(s.sev_id),
                          label: String(s.sev_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <CustomDropdown
                      value={editOccId}
                      onChange={(val) => setEditOccId(val)}
                      placeholder="Occ"
                      options={[
                        { value: '', label: 'Occ' },
                        ...occurrenceList.map((o) => ({
                          value: String(o.occ_id),
                          label: String(o.occ_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <CustomDropdown
                      value={editDetId}
                      onChange={(val) => setEditDetId(val)}
                      placeholder="Det"
                      options={[
                        { value: '', label: 'Det' },
                        ...detectionList.map((d) => ({
                          value: String(d.det_id),
                          label: String(d.det_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{editComputedRpn}</div>
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
                  <CustomDropdown
                    value={actModalActId}
                    onChange={(val) => {
                      setActModalActId(val);
                      setActModalDetailId('');
                    }}
                    placeholder="Select Act..."
                    options={[
                      { value: '', label: 'Select Act...' },
                      ...actsList.map((act) => ({
                        value: act.act_id,
                        label: `${act.code || ''} - ${act.description || act.act_desc || act.name || 'Act'}`,
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Act Detail</label>
                  <CustomDropdown
                    value={actModalDetailId}
                    onChange={(val) => setActModalDetailId(val)}
                    disabled={!actModalActId}
                    placeholder={actModalActId ? 'Select Act Detail...' : '— Select Unsafe Act First —'}
                    options={[
                      { value: '', label: actModalActId ? 'Select Act Detail...' : '— Select Unsafe Act First —' },
                      ...actModalFilteredDetails.map((det) => ({
                        value: det.detail_id,
                        label: `${det.code || ''} - ${det.description || ''}`,
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Equipment Task Standard</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-(--bg-elevated) border border-slate-300 dark:border-slate-600 text-(--text-primary) rounded-lg px-3 py-2 text-xs truncate">
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
                      className="bg-(--accent-subtle) hover:bg-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 border border-slate-300 dark:border-slate-600"
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
                  <CustomDropdown
                    value={actModalPotentialEffectId}
                    onChange={(val) => setActModalPotentialEffectId(val)}
                    placeholder="Select Potential Effect..."
                    options={[
                      { value: '', label: 'Select Potential Effect...' },
                      ...effectsList.map((eff) => ({
                        value: eff.potentialeffects_id,
                        label: eff.potentialeffects_desc || '',
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <CustomDropdown
                    value={actModalCurrentControlId}
                    onChange={(val) => setActModalCurrentControlId(val)}
                    placeholder="Select Current Control..."
                    options={[
                      { value: '', label: 'Select Current Control...' },
                      ...controlsList.map((ctrl) => ({
                        value: ctrl.currentcontrols_id,
                        label: ctrl.currentcontrols_desc || '',
                      }))
                    ]}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <CustomDropdown
                      value={actModalSevId}
                      onChange={(val) => setActModalSevId(val)}
                      placeholder="Sev"
                      options={[
                        { value: '', label: 'Sev' },
                        ...severityList.map((s) => ({
                          value: String(s.sev_id),
                          label: String(s.sev_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <CustomDropdown
                      value={actModalOccId}
                      onChange={(val) => setActModalOccId(val)}
                      placeholder="Occ"
                      options={[
                        { value: '', label: 'Occ' },
                        ...occurrenceList.map((o) => ({
                          value: String(o.occ_id),
                          label: String(o.occ_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <CustomDropdown
                      value={actModalDetId}
                      onChange={(val) => setActModalDetId(val)}
                      placeholder="Det"
                      options={[
                        { value: '', label: 'Det' },
                        ...detectionList.map((d) => ({
                          value: String(d.det_id),
                          label: String(d.det_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{actModalComputedRpn}</div>
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
                  <CustomDropdown
                    value={actEditActId}
                    onChange={(val) => {
                      setActEditActId(val);
                      setActEditDetailId('');
                    }}
                    placeholder="Select Act..."
                    options={[
                      { value: '', label: 'Select Act...' },
                      ...actsList.map((act) => ({
                        value: act.act_id,
                        label: `${act.code || ''} - ${act.description || act.act_desc || act.name || 'Act'}`,
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Act Detail</label>
                  <CustomDropdown
                    value={actEditDetailId}
                    onChange={(val) => setActEditDetailId(val)}
                    disabled={!actEditActId}
                    placeholder={actEditActId ? 'Select Act Detail...' : '— Select Unsafe Act First —'}
                    options={[
                      { value: '', label: actEditActId ? 'Select Act Detail...' : '— Select Unsafe Act First —' },
                      ...actEditFilteredDetails.map((det) => ({
                        value: det.detail_id,
                        label: `${det.code || ''} - ${det.description || ''}`,
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Equipment Task Standard</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-(--bg-elevated) border border-slate-300 dark:border-slate-600 text-(--text-primary) rounded-lg px-3 py-2 text-xs truncate">
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
                      className="bg-(--accent-subtle) hover:bg-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 border border-slate-300 dark:border-slate-600"
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
                  <CustomDropdown
                    value={actEditPotentialEffectId}
                    onChange={(val) => setActEditPotentialEffectId(val)}
                    placeholder="Select Potential Effect..."
                    options={[
                      { value: '', label: 'Select Potential Effect...' },
                      ...effectsList.map((eff) => ({
                        value: eff.potentialeffects_id,
                        label: eff.potentialeffects_desc || '',
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <CustomDropdown
                    value={actEditCurrentControlId}
                    onChange={(val) => setActEditCurrentControlId(val)}
                    placeholder="Select Current Control..."
                    options={[
                      { value: '', label: 'Select Current Control...' },
                      ...controlsList.map((ctrl) => ({
                        value: ctrl.currentcontrols_id,
                        label: ctrl.currentcontrols_desc || '',
                      }))
                    ]}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <CustomDropdown
                      value={actEditSevId}
                      onChange={(val) => setActEditSevId(val)}
                      placeholder="Sev"
                      options={[
                        { value: '', label: 'Sev' },
                        ...severityList.map((s) => ({
                          value: String(s.sev_id),
                          label: String(s.sev_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <CustomDropdown
                      value={actEditOccId}
                      onChange={(val) => setActEditOccId(val)}
                      placeholder="Occ"
                      options={[
                        { value: '', label: 'Occ' },
                        ...occurrenceList.map((o) => ({
                          value: String(o.occ_id),
                          label: String(o.occ_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <CustomDropdown
                      value={actEditDetId}
                      onChange={(val) => setActEditDetId(val)}
                      placeholder="Det"
                      options={[
                        { value: '', label: 'Det' },
                        ...detectionList.map((d) => ({
                          value: String(d.det_id),
                          label: String(d.det_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{actEditComputedRpn}</div>
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
                  <CustomDropdown
                    value={factorModalFactorId}
                    onChange={(val) => {
                      setFactorModalFactorId(val);
                      setFactorModalDetailId('');
                    }}
                    placeholder="Select Factor..."
                    options={[
                      { value: '', label: 'Select Factor...' },
                      ...factorsList.map((f) => ({
                        value: f.factor_id,
                        label: `${f.code || ''} - ${f.description || f.factor_desc || f.name || 'Factor'}`,
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Factor Detail</label>
                  <CustomDropdown
                    value={factorModalDetailId}
                    onChange={(val) => setFactorModalDetailId(val)}
                    disabled={!factorModalFactorId}
                    placeholder={factorModalFactorId ? 'Select Factor Detail...' : '— Select Personal Factor First —'}
                    options={[
                      { value: '', label: factorModalFactorId ? 'Select Factor Detail...' : '— Select Personal Factor First —' },
                      ...factorModalFilteredDetails.map((det) => ({
                        value: det.detail_id,
                        label: `${det.code || ''} - ${det.description || ''}`,
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Equipment Task Standard</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-(--bg-elevated) border border-slate-300 dark:border-slate-600 text-(--text-primary) rounded-lg px-3 py-2 text-xs truncate">
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
                      className="bg-(--accent-subtle) hover:bg-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 border border-slate-300 dark:border-slate-600"
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
                  <CustomDropdown
                    value={factorModalPotentialEffectId}
                    onChange={(val) => setFactorModalPotentialEffectId(val)}
                    placeholder="Select Potential Effect..."
                    options={[
                      { value: '', label: 'Select Potential Effect...' },
                      ...effectsList.map((eff) => ({
                        value: eff.potentialeffects_id,
                        label: eff.potentialeffects_desc || '',
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <CustomDropdown
                    value={factorModalCurrentControlId}
                    onChange={(val) => setFactorModalCurrentControlId(val)}
                    placeholder="Select Current Control..."
                    options={[
                      { value: '', label: 'Select Current Control...' },
                      ...controlsList.map((ctrl) => ({
                        value: ctrl.currentcontrols_id,
                        label: ctrl.currentcontrols_desc || '',
                      }))
                    ]}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <CustomDropdown
                      value={factorModalSevId}
                      onChange={(val) => setFactorModalSevId(val)}
                      placeholder="Sev"
                      options={[
                        { value: '', label: 'Sev' },
                        ...severityList.map((s) => ({
                          value: String(s.sev_id),
                          label: String(s.sev_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <CustomDropdown
                      value={factorModalOccId}
                      onChange={(val) => setFactorModalOccId(val)}
                      placeholder="Occ"
                      options={[
                        { value: '', label: 'Occ' },
                        ...occurrenceList.map((o) => ({
                          value: String(o.occ_id),
                          label: String(o.occ_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <CustomDropdown
                      value={factorModalDetId}
                      onChange={(val) => setFactorModalDetId(val)}
                      placeholder="Det"
                      options={[
                        { value: '', label: 'Det' },
                        ...detectionList.map((d) => ({
                          value: String(d.det_id),
                          label: String(d.det_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{factorModalComputedRpn}</div>
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
                  <CustomDropdown
                    value={factorEditFactorId}
                    onChange={(val) => {
                      setFactorEditFactorId(val);
                      setFactorEditDetailId('');
                    }}
                    placeholder="Select Factor..."
                    options={[
                      { value: '', label: 'Select Factor...' },
                      ...factorsList.map((f) => ({
                        value: f.factor_id,
                        label: `${f.code || ''} - ${f.description || f.factor_desc || f.name || 'Factor'}`,
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Factor Detail</label>
                  <CustomDropdown
                    value={factorEditDetailId}
                    onChange={(val) => setFactorEditDetailId(val)}
                    disabled={!factorEditFactorId}
                    placeholder={factorEditFactorId ? 'Select Factor Detail...' : '— Select Personal Factor First —'}
                    options={[
                      { value: '', label: factorEditFactorId ? 'Select Factor Detail...' : '— Select Personal Factor First —' },
                      ...factorEditFilteredDetails.map((det) => ({
                        value: det.detail_id,
                        label: `${det.code || ''} - ${det.description || ''}`,
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Equipment Task Standard</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-(--bg-elevated) border border-slate-300 dark:border-slate-600 text-(--text-primary) rounded-lg px-3 py-2 text-xs truncate">
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
                      className="bg-(--accent-subtle) hover:bg-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 border border-slate-300 dark:border-slate-600"
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
                  <CustomDropdown
                    value={factorEditPotentialEffectId}
                    onChange={(val) => setFactorEditPotentialEffectId(val)}
                    placeholder="Select Potential Effect..."
                    options={[
                      { value: '', label: 'Select Potential Effect...' },
                      ...effectsList.map((eff) => ({
                        value: eff.potentialeffects_id,
                        label: eff.potentialeffects_desc || '',
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <CustomDropdown
                    value={factorEditCurrentControlId}
                    onChange={(val) => setFactorEditCurrentControlId(val)}
                    placeholder="Select Current Control..."
                    options={[
                      { value: '', label: 'Select Current Control...' },
                      ...controlsList.map((ctrl) => ({
                        value: ctrl.currentcontrols_id,
                        label: ctrl.currentcontrols_desc || '',
                      }))
                    ]}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <CustomDropdown
                      value={factorEditSevId}
                      onChange={(val) => setFactorEditSevId(val)}
                      placeholder="Sev"
                      options={[
                        { value: '', label: 'Sev' },
                        ...severityList.map((s) => ({
                          value: String(s.sev_id),
                          label: String(s.sev_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <CustomDropdown
                      value={factorEditOccId}
                      onChange={(val) => setFactorEditOccId(val)}
                      placeholder="Occ"
                      options={[
                        { value: '', label: 'Occ' },
                        ...occurrenceList.map((o) => ({
                          value: String(o.occ_id),
                          label: String(o.occ_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <CustomDropdown
                      value={factorEditDetId}
                      onChange={(val) => setFactorEditDetId(val)}
                      placeholder="Det"
                      options={[
                        { value: '', label: 'Det' },
                        ...detectionList.map((d) => ({
                          value: String(d.det_id),
                          label: String(d.det_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{factorEditComputedRpn}</div>
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
                  <CustomDropdown
                    value={causeModalCauseId}
                    onChange={(val) => {
                      setCauseModalCauseId(val);
                      setCauseModalDetailId('');
                    }}
                    placeholder="Select Work Cause..."
                    options={[
                      { value: '', label: 'Select Work Cause...' },
                      ...causesList.map((c) => ({
                        value: c.cause_id,
                        label: `${c.code || ''} - ${c.description || c.cause_desc || c.name || 'Cause'}`,
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Cause Detail</label>
                  <CustomDropdown
                    value={causeModalDetailId}
                    onChange={(val) => setCauseModalDetailId(val)}
                    disabled={!causeModalCauseId}
                    placeholder={causeModalCauseId ? 'Select Cause Detail...' : '— Select Work Cause First —'}
                    options={[
                      { value: '', label: causeModalCauseId ? 'Select Cause Detail...' : '— Select Work Cause First —' },
                      ...causeModalFilteredDetails.map((det) => ({
                        value: det.detail_id,
                        label: `${det.code || ''} - ${det.description || ''}`,
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Equipment Task Standard</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-(--bg-elevated) border border-slate-300 dark:border-slate-600 text-(--text-primary) rounded-lg px-3 py-2 text-xs truncate">
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
                      className="bg-(--accent-subtle) hover:bg-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 border border-slate-300 dark:border-slate-600"
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
                  <CustomDropdown
                    value={causeModalPotentialEffectId}
                    onChange={(val) => setCauseModalPotentialEffectId(val)}
                    placeholder="Select Potential Effect..."
                    options={[
                      { value: '', label: 'Select Potential Effect...' },
                      ...effectsList.map((eff) => ({
                        value: eff.potentialeffects_id,
                        label: eff.potentialeffects_desc || '',
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <CustomDropdown
                    value={causeModalCurrentControlId}
                    onChange={(val) => setCauseModalCurrentControlId(val)}
                    placeholder="Select Current Control..."
                    options={[
                      { value: '', label: 'Select Current Control...' },
                      ...controlsList.map((ctrl) => ({
                        value: ctrl.currentcontrols_id,
                        label: ctrl.currentcontrols_desc || '',
                      }))
                    ]}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <CustomDropdown
                      value={causeModalSevId}
                      onChange={(val) => setCauseModalSevId(val)}
                      placeholder="Sev"
                      options={[
                        { value: '', label: 'Sev' },
                        ...severityList.map((s) => ({
                          value: String(s.sev_id),
                          label: String(s.sev_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <CustomDropdown
                      value={causeModalOccId}
                      onChange={(val) => setCauseModalOccId(val)}
                      placeholder="Occ"
                      options={[
                        { value: '', label: 'Occ' },
                        ...occurrenceList.map((o) => ({
                          value: String(o.occ_id),
                          label: String(o.occ_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <CustomDropdown
                      value={causeModalDetId}
                      onChange={(val) => setCauseModalDetId(val)}
                      placeholder="Det"
                      options={[
                        { value: '', label: 'Det' },
                        ...detectionList.map((d) => ({
                          value: String(d.det_id),
                          label: String(d.det_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{causeModalComputedRpn}</div>
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
                  <CustomDropdown
                    value={causeEditCauseId}
                    onChange={(val) => {
                      setCauseEditCauseId(val);
                      setCauseEditDetailId('');
                    }}
                    placeholder="Select Work Cause..."
                    options={[
                      { value: '', label: 'Select Work Cause...' },
                      ...causesList.map((c) => ({
                        value: c.cause_id,
                        label: `${c.code || ''} - ${c.description || c.cause_desc || c.name || 'Cause'}`,
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Cause Detail</label>
                  <CustomDropdown
                    value={causeEditDetailId}
                    onChange={(val) => setCauseEditDetailId(val)}
                    disabled={!causeEditCauseId}
                    placeholder={causeEditCauseId ? 'Select Cause Detail...' : '— Select Work Cause First —'}
                    options={[
                      { value: '', label: causeEditCauseId ? 'Select Cause Detail...' : '— Select Work Cause First —' },
                      ...causeEditFilteredDetails.map((det) => ({
                        value: det.detail_id,
                        label: `${det.code || ''} - ${det.description || ''}`,
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Equipment Task Standard</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-(--bg-elevated) border border-slate-300 dark:border-slate-600 text-(--text-primary) rounded-lg px-3 py-2 text-xs truncate">
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
                      className="bg-(--accent-subtle) hover:bg-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 border border-slate-300 dark:border-slate-600"
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
                  <CustomDropdown
                    value={causeEditPotentialEffectId}
                    onChange={(val) => setCauseEditPotentialEffectId(val)}
                    placeholder="Select Potential Effect..."
                    options={[
                      { value: '', label: 'Select Potential Effect...' },
                      ...effectsList.map((eff) => ({
                        value: eff.potentialeffects_id,
                        label: eff.potentialeffects_desc || '',
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <CustomDropdown
                    value={causeEditCurrentControlId}
                    onChange={(val) => setCauseEditCurrentControlId(val)}
                    placeholder="Select Current Control..."
                    options={[
                      { value: '', label: 'Select Current Control...' },
                      ...controlsList.map((ctrl) => ({
                        value: ctrl.currentcontrols_id,
                        label: ctrl.currentcontrols_desc || '',
                      }))
                    ]}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <CustomDropdown
                      value={causeEditSevId}
                      onChange={(val) => setCauseEditSevId(val)}
                      placeholder="Sev"
                      options={[
                        { value: '', label: 'Sev' },
                        ...severityList.map((s) => ({
                          value: String(s.sev_id),
                          label: String(s.sev_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <CustomDropdown
                      value={causeEditOccId}
                      onChange={(val) => setCauseEditOccId(val)}
                      placeholder="Occ"
                      options={[
                        { value: '', label: 'Occ' },
                        ...occurrenceList.map((o) => ({
                          value: String(o.occ_id),
                          label: String(o.occ_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <CustomDropdown
                      value={causeEditDetId}
                      onChange={(val) => setCauseEditDetId(val)}
                      placeholder="Det"
                      options={[
                        { value: '', label: 'Det' },
                        ...detectionList.map((d) => ({
                          value: String(d.det_id),
                          label: String(d.det_id),
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{causeEditComputedRpn}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button type="button" onClick={() => setIsEditCauseModalOpen(false)} className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
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
                className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddControlModalOpen(false)} className="px-3 py-1.5 bg-(--accent-subtle) text-(--text-primary) rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-(--btn-primary-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Save Control</button>
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
                className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditControlModalOpen(false)} className="px-3 py-1.5 bg-(--accent-subtle) text-(--text-primary) rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-(--btn-primary-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Update Control</button>
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
                className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddEffectModalOpen(false)} className="px-3 py-1.5 bg-(--accent-subtle) text-(--text-primary) rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-(--btn-primary-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Save Effect</button>
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
                className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditEffectModalOpen(false)} className="px-3 py-1.5 bg-(--accent-subtle) text-(--text-primary) rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-(--btn-primary-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Update Effect</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD RPN DEFINITION MODAL --- */}
      {isAddRpnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 mb-4">
              <h3 className="text-lg font-bold text-(--text-primary)">Add {currentRpnLabel} Definition</h3>
              <button
                type="button"
                onClick={() => setIsAddRpnModalOpen(false)}
                className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddRpnDefinition} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-(--text-primary) mb-1">Score ID</label>
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="e.g., 1"
                  value={rpnModalId}
                  onChange={(e) => setRpnModalId(e.target.value)}
                  className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-(--text-primary) mb-1">{currentRpnLabel} Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder={`Enter ${currentRpnLabel.toLowerCase()} criteria description...`}
                  value={rpnModalDesc}
                  onChange={(e) => setRpnModalDesc(e.target.value)}
                  className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRpnModalOpen(false)}
                  className="px-3 py-1.5 bg-(--accent-subtle) text-(--text-primary) rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow"
                >
                  Save {currentRpnLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT RPN DEFINITION MODAL --- */}
      {isEditRpnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 mb-4">
              <h3 className="text-lg font-bold text-(--text-primary)">Edit {currentRpnLabel} Definition</h3>
              <button
                type="button"
                onClick={() => setIsEditRpnModalOpen(false)}
                className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateRpnDefinition} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-(--text-primary) mb-1">Score ID</label>
                <input
                  type="number"
                  disabled
                  value={editRpnRecordId ?? ''}
                  className="w-full bg-(--accent-subtle) border border-slate-300 dark:border-slate-600 text-(--text-muted) rounded-lg px-3 py-2 text-xs font-mono cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-(--text-primary) mb-1">{currentRpnLabel} Description</label>
                <textarea
                  rows={3}
                  required
                  value={rpnEditDesc}
                  onChange={(e) => setRpnEditDesc(e.target.value)}
                  className="w-full bg-(--bg-surface) border border-slate-300 dark:border-slate-600 text-(--text-primary) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditRpnModalOpen(false)}
                  className="px-3 py-1.5 bg-(--accent-subtle) text-(--text-primary) rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow"
                >
                  Update {currentRpnLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FmeaSettings;