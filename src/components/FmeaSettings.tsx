import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CheckCircle, 
  ShieldAlert, 
  Sliders, 
  Layers,
  Settings,
  Activity,
  Eye,
  AlertTriangle,
  Database,
  Plus,
  Trash2,
  Loader2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertOctagon,
  UserX,
  UserCheck,
  Briefcase,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface FmeaSeverityRecord {
  sev_id: number;
  sev_description: string | null;
  created_at: string;
  updated_at: string | null;
}

interface FmeaOccurenceRecord {
  occ_id: number;
  occ_description: string | null;
  created_at: string;
  updated_at: string | null;
}

interface FmeaDetectionRecord {
  det_id: number;
  det_description: string | null;
  created_at: string;
  updated_at: string | null;
}

interface FmeaCurrentControlsRecord {
  currentcontrols_id: string;
  currentcontrols_desc: string | null;
  created_at: string;
  updated_at: string | null;
}

interface FmeaPotentialEffectsRecord {
  potentialeffects_id: string;
  potentialeffects_desc: string | null;
  created_at: string;
  updated_at: string | null;
}

interface UnsafeConditionsRecord {
  condition_id: string;
  code?: string | null;
  description?: string | null;
  condition_desc?: string | null;
  name?: string | null;
  created_at: string;
}

interface ConditionDetailsRecord {
  detail_id: string;
  condition_id?: string | null;
  code?: string | null;
  description?: string | null;
  created_at: string;
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
  updated_at: string | null;
}

interface UnsafeActsRecord {
  act_id: string;
  code?: string | null;
  description?: string | null;
  act_desc?: string | null;
  name?: string | null;
  created_at: string;
}

interface ActDetailsRecord {
  detail_id: string;
  act_id?: string | null;
  code?: string | null;
  description?: string | null;
  created_at: string;
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
  updated_at: string | null;
}

interface PersonalFactorsRecord {
  factor_id: string;
  code?: string | null;
  description?: string | null;
  factor_desc?: string | null;
  name?: string | null;
  created_at: string;
}

interface FactorDetailsRecord {
  detail_id: string;
  factor_id?: string | null;
  code?: string | null;
  description?: string | null;
  created_at: string;
}

interface FactorsFmeaRecord {
  conditions_fmea_id?: string | null;
  factor_fmea_id?: string | null;
  factors_fmea_id?: string | null;
  id?: string | null;
  factor_id: string | null;
  potentialeffects_id: string | null;
  created_at: string;
  updated_at: string | null;
  sev_id: number | null;
  occ_id: number | null;
  det_id: number | null;
  detail_id: string | null;
  currentcontrols_id: string | null;
  computed_rpn?: number | null;
}

interface WorkCausesRecord {
  cause_id: string;
  code?: string | null;
  description?: string | null;
  cause_desc?: string | null;
  name?: string | null;
  created_at: string;
}

interface CauseDetailsRecord {
  detail_id: string;
  cause_id?: string | null;
  code?: string | null;
  description?: string | null;
  created_at: string;
}

interface CauseFmeaRecord {
  cause_fmea_id: string;
  cause_id: string | null;
  potentialeffects_id: string | null;
  created_at: string;
  updated_at: string | null;
  sev_id: number | null;
  occ_id: number | null;
  det_id: number | null;
  currentcontrols_id: string | null;
  computed_rpn?: number | null;
  detail_id: string | null;
}

export function FmeaSettings() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Main and Sub tab state management
  const [mainTab, setMainTab] = useState<'master_fmea' | 'constants' | 'rpn_definitions'>('master_fmea');
  const [masterFmeaSubTab, setMasterFmeaSubTab] = useState<'unsafe_conditions' | 'unsafe_acts' | 'personal_factors' | 'work_related_causes'>('unsafe_conditions');
  const [constantsSubTab, setConstantsSubTab] = useState<'controls' | 'effects'>('controls');
  const [rpnSubTab, setRpnSubTab] = useState<'severity' | 'occurrence' | 'detection'>('severity');

  // Supabase lookup & list states
  const [severityList, setSeverityList] = useState<FmeaSeverityRecord[]>([]);
  const [occurrenceList, setOccurrenceList] = useState<FmeaOccurenceRecord[]>([]);
  const [detectionList, setDetectionList] = useState<FmeaDetectionRecord[]>([]);
  const [controlsList, setControlsList] = useState<FmeaCurrentControlsRecord[]>([]);
  const [effectsList, setEffectsList] = useState<FmeaPotentialEffectsRecord[]>([]);

  // Conditions
  const [conditionsList, setConditionsList] = useState<UnsafeConditionsRecord[]>([]);
  const [conditionDetailsList, setConditionDetailsList] = useState<ConditionDetailsRecord[]>([]);
  const [conditionsFmeaList, setConditionsFmeaList] = useState<ConditionsFmeaRecord[]>([]);

  // Acts
  const [actsList, setActsList] = useState<UnsafeActsRecord[]>([]);
  const [actDetailsList, setActDetailsList] = useState<ActDetailsRecord[]>([]);
  const [actFmeaList, setActFmeaList] = useState<ActFmeaRecord[]>([]);

  // Personal Factors
  const [factorsList, setFactorsList] = useState<PersonalFactorsRecord[]>([]);
  const [factorDetailsList, setFactorDetailsList] = useState<FactorDetailsRecord[]>([]);
  const [factorsFmeaList, setFactorsFmeaList] = useState<FactorsFmeaRecord[]>([]);

  // Work Related Causes
  const [causesList, setCausesList] = useState<WorkCausesRecord[]>([]);
  const [causeDetailsList, setCauseDetailsList] = useState<CauseDetailsRecord[]>([]);
  const [causeFmeaList, setCauseFmeaList] = useState<CauseFmeaRecord[]>([]);

  // Modal States
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

  // Filter & Pagination states
  const [controlSearch, setControlSearch] = useState<string>('');
  const [effectSearch, setEffectSearch] = useState<string>('');
  const [conditionSearch, setConditionSearch] = useState<string>('');
  const [actSearch, setActSearch] = useState<string>('');
  const [factorSearch, setFactorSearch] = useState<string>('');
  const [causeSearch, setCauseSearch] = useState<string>('');

  // Dropdown search queries
  const [modalEffectQuery, setModalEffectQuery] = useState<string>('');
  const [modalControlQuery, setModalControlQuery] = useState<string>('');
  const [editEffectQuery, setEditEffectQuery] = useState<string>('');
  const [editControlQuery, setEditControlQuery] = useState<string>('');

  const [actModalEffectQuery, setActModalEffectQuery] = useState<string>('');
  const [actModalControlQuery, setActModalControlQuery] = useState<string>('');
  const [actEditEffectQuery, setActEditEffectQuery] = useState<string>('');
  const [actEditControlQuery, setActEditControlQuery] = useState<string>('');

  const [factorModalEffectQuery, setFactorModalEffectQuery] = useState<string>('');
  const [factorModalControlQuery, setFactorModalControlQuery] = useState<string>('');
  const [factorEditEffectQuery, setFactorEditEffectQuery] = useState<string>('');
  const [factorEditControlQuery, setFactorEditControlQuery] = useState<string>('');

  const [causeModalEffectQuery, setCauseModalEffectQuery] = useState<string>('');
  const [causeModalControlQuery, setCauseModalControlQuery] = useState<string>('');
  const [causeEditEffectQuery, setCauseEditEffectQuery] = useState<string>('');
  const [causeEditControlQuery, setCauseEditControlQuery] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // New item input states
  const [newSevId, setNewSevId] = useState<string>('');
  const [newSevDesc, setNewSevDesc] = useState<string>('');
  const [newOccId, setNewOccId] = useState<string>('');
  const [newOccDesc, setNewOccDesc] = useState<string>('');
  const [newDetId, setNewDetId] = useState<string>('');
  const [newDetDesc, setNewDetDesc] = useState<string>('');

  // Conditions FMEA Form Fields
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

  // Unsafe Acts FMEA Form Fields
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

  // Personal Factors FMEA Form Fields
  const [factorModalFactorId, setFactorModalFactorId] = useState<string>('');
  const [factorModalDetailId, setFactorModalDetailId] = useState<string>('');
  const [factorModalPotentialEffectId, setFactorModalPotentialEffectId] = useState<string>('');
  const [factorModalCurrentControlId, setFactorModalCurrentControlId] = useState<string>('');
  const [factorModalSevId, setFactorModalSevId] = useState<string>('');
  const [factorModalOccId, setFactorModalOccId] = useState<string>('');
  const [factorModalDetId, setFactorModalDetId] = useState<string>('');
  const factorModalComputedRpn = (factorModalSevId ? Number(factorModalSevId) : 0) * (factorModalOccId ? Number(factorModalOccId) : 0) * (factorModalDetId ? Number(factorModalDetId) : 0);

  const [factorEditRecordId, setFactorEditRecordId] = useState<string | null>(null);
  const [factorEditRecordPkCol, setFactorEditRecordPkCol] = useState<string>('conditions_fmea_id');
  const [factorEditFactorId, setFactorEditFactorId] = useState<string>('');
  const [factorEditDetailId, setFactorEditDetailId] = useState<string>('');
  const [factorEditPotentialEffectId, setFactorEditPotentialEffectId] = useState<string>('');
  const [factorEditCurrentControlId, setFactorEditCurrentControlId] = useState<string>('');
  const [factorEditSevId, setFactorEditSevId] = useState<string>('');
  const [factorEditOccId, setFactorEditOccId] = useState<string>('');
  const [factorEditDetId, setFactorEditDetId] = useState<string>('');
  const factorEditComputedRpn = (factorEditSevId ? Number(factorEditSevId) : 0) * (factorEditOccId ? Number(factorEditOccId) : 0) * (factorEditDetId ? Number(factorEditDetId) : 0);

  // Work Related Causes FMEA Form Fields
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

  // Editing state tracking for RPN definitions
  const [editingSevId, setEditingSevId] = useState<number | null>(null);
  const [editingSevText, setEditingSevText] = useState<string>('');
  const [editingOccId, setEditingOccId] = useState<number | null>(null);
  const [editingOccText, setEditingOccText] = useState<string>('');
  const [editingDetId, setEditingDetId] = useState<number | null>(null);
  const [editingDetText, setEditingDetText] = useState<string>('');

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [mainTab, masterFmeaSubTab, constantsSubTab, rpnSubTab]);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [
        sevRes, 
        occRes, 
        detRes, 
        effRes, 
        ctrlRes, 
        condRes, 
        condDetailsRes,
        actsRes,
        actDetailsRes,
        factorsRes,
        factorDetailsRes,
        causesRes,
        causeDetailsRes
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
        supabase.from('cause_details').select('*')
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
      } else if (mainTab === 'constants') {
        if (constantsSubTab === 'controls') {
          const { data, error } = await supabase.from('fmea_currentcontrols').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (isMountedRef.current) setControlsList(data || []);
        } else if (constantsSubTab === 'effects') {
          const { data, error } = await supabase.from('fmea_potentialeffects').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (isMountedRef.current) setEffectsList(data || []);
        }
      } else if (mainTab === 'rpn_definitions') {
        if (rpnSubTab === 'severity') {
          const { data, error } = await supabase.from('fmea_severity').select('*').order('sev_id', { ascending: true });
          if (error) throw error;
          if (isMountedRef.current) setSeverityList(data || []);
        } else if (rpnSubTab === 'occurrence') {
          const { data, error } = await supabase.from('fmea_occurence').select('*').order('occ_id', { ascending: true });
          if (error) throw error;
          if (isMountedRef.current) setOccurrenceList(data || []);
        } else if (rpnSubTab === 'detection') {
          const { data, error } = await supabase.from('fmea_detection').select('*').order('det_id', { ascending: true });
          if (error) throw error;
          if (isMountedRef.current) setDetectionList(data || []);
        }
      }
    } catch (err: unknown) {
          if (isMountedRef.current) {
            const errObj = err as Record<string, unknown>;
            setErrorMsg(`Failed to load records: ${(errObj?.message as string) || JSON.stringify(err)}`);
          }
        } finally {
          if (isMountedRef.current) {
            setLoading(false);
          }
    }  }, [mainTab, masterFmeaSubTab, constantsSubTab, rpnSubTab]);

  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(() => {
      if (!isCancelled) {
        fetchData();
      }
    }, 0);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [fetchData]);

  // Derived filtered details & lists with robust null/undefined safety
  const modalFilteredDetails = conditionDetailsList.filter(d => !modalConditionId || d.condition_id === modalConditionId);
  const editFilteredDetails = conditionDetailsList.filter(d => !editConditionId || d.condition_id === editConditionId);

  const actModalFilteredDetails = actDetailsList.filter(d => !actModalActId || d.act_id === actModalActId);
  const actEditFilteredDetails = actDetailsList.filter(d => !actEditActId || d.act_id === actEditActId);

  const factorModalFilteredDetails = factorDetailsList.filter(d => !factorModalFactorId || d.factor_id === factorModalFactorId);
  const factorEditFilteredDetails = factorDetailsList.filter(d => !factorEditFactorId || d.factor_id === factorEditFactorId);

  const causeModalFilteredDetails = causeDetailsList.filter(d => !causeModalCauseId || d.cause_id === causeModalCauseId);
  const causeEditFilteredDetails = causeDetailsList.filter(d => !causeEditCauseId || d.cause_id === causeEditCauseId);

  const modalFilteredEffects = effectsList.filter(eff => ((eff?.potentialeffects_desc ?? '')).toLowerCase().includes(modalEffectQuery.toLowerCase()));
  const modalFilteredControls = controlsList.filter(ctrl => ((ctrl?.currentcontrols_desc ?? '')).toLowerCase().includes(modalControlQuery.toLowerCase()));

  const editFilteredEffects = effectsList.filter(eff => ((eff?.potentialeffects_desc ?? '')).toLowerCase().includes(editEffectQuery.toLowerCase()));
  const editFilteredControls = controlsList.filter(ctrl => ((ctrl?.currentcontrols_desc ?? '')).toLowerCase().includes(editControlQuery.toLowerCase()));

  const actModalFilteredEffects = effectsList.filter(eff => ((eff?.potentialeffects_desc ?? '')).toLowerCase().includes(actModalEffectQuery.toLowerCase()));
  const actModalFilteredControls = controlsList.filter(ctrl => ((ctrl?.currentcontrols_desc ?? '')).toLowerCase().includes(actModalControlQuery.toLowerCase()));

  const actEditFilteredEffects = effectsList.filter(eff => ((eff?.potentialeffects_desc ?? '')).toLowerCase().includes(actEditEffectQuery.toLowerCase()));
  const actEditFilteredControls = controlsList.filter(ctrl => ((ctrl?.currentcontrols_desc ?? '')).toLowerCase().includes(actEditControlQuery.toLowerCase()));

  const factorModalFilteredEffects = effectsList.filter(eff => ((eff?.potentialeffects_desc ?? '')).toLowerCase().includes(factorModalEffectQuery.toLowerCase()));
  const factorModalFilteredControls = controlsList.filter(ctrl => ((ctrl?.currentcontrols_desc ?? '')).toLowerCase().includes(factorModalControlQuery.toLowerCase()));

  const factorEditFilteredEffects = effectsList.filter(eff => ((eff?.potentialeffects_desc ?? '')).toLowerCase().includes(factorEditEffectQuery.toLowerCase()));
  const factorEditFilteredControls = controlsList.filter(ctrl => ((ctrl?.currentcontrols_desc ?? '')).toLowerCase().includes(factorEditControlQuery.toLowerCase()));

  const causeModalFilteredEffects = effectsList.filter(eff => ((eff?.potentialeffects_desc ?? '')).toLowerCase().includes(causeModalEffectQuery.toLowerCase()));
  const causeModalFilteredControls = controlsList.filter(ctrl => ((ctrl?.currentcontrols_desc ?? '')).toLowerCase().includes(causeModalControlQuery.toLowerCase()));

  const causeEditFilteredEffects = effectsList.filter(eff => ((eff?.potentialeffects_desc ?? '')).toLowerCase().includes(causeEditEffectQuery.toLowerCase()));
  const causeEditFilteredControls = controlsList.filter(ctrl => ((ctrl?.currentcontrols_desc ?? '')).toLowerCase().includes(causeEditControlQuery.toLowerCase()));

  // --- Conditions FMEA Handlers ---
  const handleAddConditionFmeaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('conditions_fmea').insert([{
        condition_id: modalConditionId ? modalConditionId : null,
        detail_id: modalDetailId ? modalDetailId : null,
        potentialeffects_id: modalPotentialEffectId ? modalPotentialEffectId : null,
        currentcontrols_id: modalCurrentControlId ? modalCurrentControlId : null,
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
      setModalEffectQuery('');
      setModalControlQuery('');
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
          condition_id: editConditionId ? editConditionId : null,
          detail_id: editDetailId ? editDetailId : null,
          potentialeffects_id: editPotentialEffectId ? editPotentialEffectId : null,
          currentcontrols_id: editCurrentControlId ? editCurrentControlId : null,
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

  // --- Unsafe Acts FMEA Handlers ---
  const handleAddActFmeaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('act_fmea').insert([{
        act_id: actModalActId ? actModalActId : null,
        detail_id: actModalDetailId ? actModalDetailId : null,
        potentialeffects_id: actModalPotentialEffectId ? actModalPotentialEffectId : null,
        currentcontrols_id: actModalCurrentControlId ? actModalCurrentControlId : null,
        sev_id: actModalSevId ? Number(actModalSevId) : null,
        occ_id: actModalOccId ? Number(actModalOccId) : null,
        det_id: actModalDetId ? Number(actModalDetId) : null,
        computed_rpn: actModalComputedRpn
      }]);
      if (error) throw error;

      setActModalActId('');
      setActModalDetailId('');
      setActModalPotentialEffectId('');
      setActModalCurrentControlId('');
      setActModalSevId('');
      setActModalOccId('');
      setActModalDetId('');
      setActModalEffectQuery('');
      setActModalControlQuery('');
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
          act_id: actEditActId ? actEditActId : null,
          detail_id: actEditDetailId ? actEditDetailId : null,
          potentialeffects_id: actEditPotentialEffectId ? actEditPotentialEffectId : null,
          currentcontrols_id: actEditCurrentControlId ? actEditCurrentControlId : null,
          sev_id: actEditSevId ? Number(actEditSevId) : null,
          occ_id: actEditOccId ? Number(actEditOccId) : null,
          det_id: actEditDetId ? Number(actEditDetId) : null,
          computed_rpn: actEditComputedRpn,
          updated_at: new Date().toISOString()
        })
        .eq('actfmea_id', actEditRecordId);
      if (error) throw error;

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

  // --- Personal Factors FMEA Handlers ---
  const handleAddFactorFmeaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('factors_fmea').insert([{
        factor_id: factorModalFactorId ? factorModalFactorId : null,
        detail_id: factorModalDetailId ? factorModalDetailId : null,
        potentialeffects_id: factorModalPotentialEffectId ? factorModalPotentialEffectId : null,
        currentcontrols_id: factorModalCurrentControlId ? factorModalCurrentControlId : null,
        sev_id: factorModalSevId ? Number(factorModalSevId) : null,
        occ_id: factorModalOccId ? Number(factorModalOccId) : null,
        det_id: factorModalDetId ? Number(factorModalDetId) : null,
        computed_rpn: factorModalComputedRpn
      }]);
      if (error) throw error;

      setFactorModalFactorId('');
      setFactorModalDetailId('');
      setFactorModalPotentialEffectId('');
      setFactorModalCurrentControlId('');
      setFactorModalSevId('');
      setFactorModalOccId('');
      setFactorModalDetId('');
      setFactorModalEffectQuery('');
      setFactorModalControlQuery('');
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
          factor_id: factorEditFactorId ? factorEditFactorId : null,
          detail_id: factorEditDetailId ? factorEditDetailId : null,
          potentialeffects_id: factorEditPotentialEffectId ? factorEditPotentialEffectId : null,
          currentcontrols_id: factorEditCurrentControlId ? factorEditCurrentControlId : null,
          sev_id: factorEditSevId ? Number(factorEditSevId) : null,
          occ_id: factorEditOccId ? Number(factorEditOccId) : null,
          det_id: factorEditDetId ? Number(factorEditDetId) : null,
          computed_rpn: factorEditComputedRpn,
          updated_at: new Date().toISOString()
        })
        .eq(factorEditRecordPkCol, factorEditRecordId);
      if (error) throw error;

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
    const pkCol = item.conditions_fmea_id ? 'conditions_fmea_id' : item.factor_fmea_id ? 'factor_fmea_id' : item.factors_fmea_id ? 'factors_fmea_id' : 'id';
    const pkVal = item.conditions_fmea_id || item.factor_fmea_id || item.factors_fmea_id || item.id;
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

  // --- Work Related Causes FMEA Handlers ---
  const handleAddCauseFmeaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('cause_fmea').insert([{
        cause_id: causeModalCauseId ? causeModalCauseId : null,
        detail_id: causeModalDetailId ? causeModalDetailId : null,
        potentialeffects_id: causeModalPotentialEffectId ? causeModalPotentialEffectId : null,
        currentcontrols_id: causeModalCurrentControlId ? causeModalCurrentControlId : null,
        sev_id: causeModalSevId ? Number(causeModalSevId) : null,
        occ_id: causeModalOccId ? Number(causeModalOccId) : null,
        det_id: causeModalDetId ? Number(causeModalDetId) : null,
        computed_rpn: causeModalComputedRpn
      }]);
      if (error) throw error;

      setCauseModalCauseId('');
      setCauseModalDetailId('');
      setCauseModalPotentialEffectId('');
      setCauseModalCurrentControlId('');
      setCauseModalSevId('');
      setCauseModalOccId('');
      setCauseModalDetId('');
      setCauseModalEffectQuery('');
      setCauseModalControlQuery('');
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
          cause_id: causeEditCauseId ? causeEditCauseId : null,
          detail_id: causeEditDetailId ? causeEditDetailId : null,
          potentialeffects_id: causeEditPotentialEffectId ? causeEditPotentialEffectId : null,
          currentcontrols_id: causeEditCurrentControlId ? causeEditCurrentControlId : null,
          sev_id: causeEditSevId ? Number(causeEditSevId) : null,
          occ_id: causeEditOccId ? Number(causeEditOccId) : null,
          det_id: causeEditDetId ? Number(causeEditDetId) : null,
          computed_rpn: causeEditComputedRpn,
          updated_at: new Date().toISOString()
        })
        .eq('cause_fmea_id', causeEditRecordId);
      if (error) throw error;

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

  // --- Constants & RPN Handlers ---
  const handleAddControlModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!controlModalDesc.trim()) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('fmea_currentcontrols').insert([{ currentcontrols_desc: controlModalDesc.trim() }]);
      if (error) throw error;
      setControlModalDesc('');
      setIsAddControlModalOpen(false);
      setSuccessMsg('Control added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to insert record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleUpdateControlModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editControlRecordId || !controlEditDesc.trim()) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('fmea_currentcontrols').update({ currentcontrols_desc: controlEditDesc.trim(), updated_at: new Date().toISOString() }).eq('currentcontrols_id', editControlRecordId);
      if (error) throw error;
      setIsEditControlModalOpen(false);
      setEditControlRecordId(null);
      setControlEditDesc('');
      setSuccessMsg('Control updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to update record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteControl = async (id: string) => {
    if (!confirm('Are you sure you want to delete this control record?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('fmea_currentcontrols').delete().eq('currentcontrols_id', id);
      if (error) throw error;
      setSuccessMsg('Control deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to delete record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleAddEffectModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectModalDesc.trim()) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('fmea_potentialeffects').insert([{ potentialeffects_desc: effectModalDesc.trim() }]);
      if (error) throw error;
      setEffectModalDesc('');
      setIsAddEffectModalOpen(false);
      setSuccessMsg('Effect added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to insert record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleUpdateEffectModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEffectRecordId || !effectEditDesc.trim()) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('fmea_potentialeffects').update({ potentialeffects_desc: effectEditDesc.trim(), updated_at: new Date().toISOString() }).eq('potentialeffects_id', editEffectRecordId);
      if (error) throw error;
      setIsEditEffectModalOpen(false);
      setEditEffectRecordId(null);
      setEffectEditDesc('');
      setSuccessMsg('Effect updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to update record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteEffect = async (id: string) => {
    if (!confirm('Are you sure you want to delete this effect record?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('fmea_potentialeffects').delete().eq('potentialeffects_id', id);
      if (error) throw error;
      setSuccessMsg('Effect deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to delete record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleAddSeverity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSevId || !newSevDesc.trim()) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('fmea_severity').insert([{ sev_id: Number(newSevId), sev_description: newSevDesc.trim() }]);
      if (error) throw error;
      setNewSevId('');
      setNewSevDesc('');
      setSuccessMsg('Severity definition added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to insert record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleUpdateSeverity = async (sev_id: number) => {
    if (!editingSevText.trim()) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('fmea_severity').update({ sev_description: editingSevText.trim(), updated_at: new Date().toISOString() }).eq('sev_id', sev_id);
      if (error) throw error;
      setEditingSevId(null);
      setEditingSevText('');
      setSuccessMsg('Severity record updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to update record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteSeverity = async (sev_id: number) => {
    if (!confirm('Are you sure you want to delete this severity record?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('fmea_severity').delete().eq('sev_id', sev_id);
      if (error) throw error;
      setSuccessMsg('Severity record deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to delete record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleAddOccurrence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOccId || !newOccDesc.trim()) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('fmea_occurence').insert([{ occ_id: Number(newOccId), occ_description: newOccDesc.trim() }]);
      if (error) throw error;
      setNewOccId('');
      setNewOccDesc('');
      setSuccessMsg('Occurrence definition added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to insert record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleUpdateOccurrence = async (occ_id: number) => {
    if (!editingOccText.trim()) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('fmea_occurence').update({ occ_description: editingOccText.trim(), updated_at: new Date().toISOString() }).eq('occ_id', occ_id);
      if (error) throw error;
      setEditingOccId(null);
      setEditingOccText('');
      setSuccessMsg('Occurrence record updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to update record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteOccurrence = async (occ_id: number) => {
    if (!confirm('Are you sure you want to delete this occurrence record?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('fmea_occurence').delete().eq('occ_id', occ_id);
      if (error) throw error;
      setSuccessMsg('Occurrence record deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to delete record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleAddDetection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDetId || !newDetDesc.trim()) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('fmea_detection').insert([{ det_id: Number(newDetId), det_description: newDetDesc.trim() }]);
      if (error) throw error;
      setNewDetId('');
      setNewDetDesc('');
      setSuccessMsg('Detection definition added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to insert record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleUpdateDetection = async (det_id: number) => {
    if (!editingDetText.trim()) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('fmea_detection').update({ det_description: editingDetText.trim(), updated_at: new Date().toISOString() }).eq('det_id', det_id);
      if (error) throw error;
      setEditingDetId(null);
      setEditingDetText('');
      setSuccessMsg('Detection record updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to update record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  const handleDeleteDetection = async (det_id: number) => {
    if (!confirm('Are you sure you want to delete this detection record?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase.from('fmea_detection').delete().eq('det_id', det_id);
      if (error) throw error;
      setSuccessMsg('Detection record deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchData();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setErrorMsg(`Failed to delete record: ${(errObj?.message as string) || JSON.stringify(err)}`);
    }
  };

  // Filtered lists with robust null/undefined safety
  const filteredControls = controlsList.filter(item => ((item?.currentcontrols_desc ?? '')).toLowerCase().includes(controlSearch.toLowerCase()));
  const filteredEffects = effectsList.filter(item => ((item?.potentialeffects_desc ?? '')).toLowerCase().includes(effectSearch.toLowerCase()));

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
      {/* Main Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-(--border-main) pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-(--accent-subtle) text-(--text-primary) rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">FMEA Settings</h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">Configure master records, FMEA constants, RPN definitions, and risk action rules.</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="shrink-0 bg-(--accent-subtle) border border-(--border-main) text-(--text-primary) px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="shrink-0 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Tab Navigation */}
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
          <Settings className="w-3.5 h-3.5" />
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
          <Sliders className="w-3.5 h-3.5" />
          <span>RPN Definitions</span>
        </button>
      </div>

      {/* Tab Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-surface) border border-(--border-main) shadow-xs rounded-xl p-4 overflow-hidden space-y-3">
        {mainTab === 'master_fmea' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            {/* Master FMEA Sub-Tab Bar */}
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

            {/* Unsafe Conditions */}
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

                {loading ? (
                  <div className="flex-1 flex items-center justify-center text-(--text-muted) gap-2 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-(--text-primary)" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
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
                          <tr><td colSpan={8} className="p-4 text-center text-(--text-muted)">No condition FMEA records found.</td></tr>
                        ) : (
                          paginateData(filteredConditions).map((item, idx) => {
                            const matchedDetail = conditionDetailsList.find(d => d.detail_id === item.detail_id);
                            const matchedEffect = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id);
                            const matchedControl = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id);
                            const computedRpn = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));

                            return (
                              <tr key={`cond-fmea-row-${item.conditionsfmea_id || idx}`} className="hover:bg-(--accent-subtle) transition-colors">
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
                                        setEditEffectQuery('');
                                        setEditControlQuery('');
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
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {renderPagination(filteredConditions.length)}
              </div>
            )}

            {/* Unsafe Acts */}
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

                {loading ? (
                  <div className="flex-1 flex items-center justify-center text-(--text-muted) gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-(--text-primary)" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
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
                          <tr><td colSpan={8} className="p-4 text-center text-(--text-muted)">No act FMEA records found.</td></tr>
                        ) : (
                          paginateData(filteredActs).map((item, idx) => {
                            const matchedDetail = actDetailsList.find(d => d.detail_id === item.detail_id);
                            const matchedEffect = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id);
                            const matchedControl = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id);
                            const computedRpn = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));

                            return (
                              <tr key={`act-fmea-row-${item.actfmea_id || idx}`} className="hover:bg-(--accent-subtle) transition-colors">
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
                                        setActEditEffectQuery('');
                                        setActEditControlQuery('');
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
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {renderPagination(filteredActs.length)}
              </div>
            )}

            {/* Personal Factors */}
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

                {loading ? (
                  <div className="flex-1 flex items-center justify-center text-(--text-muted) gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-(--text-primary)" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
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
                          <tr><td colSpan={8} className="p-4 text-center text-(--text-muted)">No factor FMEA records found.</td></tr>
                        ) : (
                          paginateData(filteredFactors).map((item, idx) => {
                            const matchedDetail = factorDetailsList.find(d => d.detail_id === item.detail_id);
                            const matchedEffect = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id);
                            const matchedControl = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id);
                            const computedRpn = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));

                            const recId = item.conditions_fmea_id || item.factor_fmea_id || item.factors_fmea_id || item.id || `factor-${idx}`;
                            const pkCol = item.conditions_fmea_id ? 'conditions_fmea_id' : item.factor_fmea_id ? 'factor_fmea_id' : item.factors_fmea_id ? 'factors_fmea_id' : 'id';

                            return (
                              <tr key={`factor-fmea-row-${recId}-${idx}`} className="hover:bg-(--accent-subtle) transition-colors">
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
                                        setFactorEditEffectQuery('');
                                        setFactorEditControlQuery('');
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
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {renderPagination(filteredFactors.length)}
              </div>
            )}

            {/* Work Related Causes */}
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

                {loading ? (
                  <div className="flex-1 flex items-center justify-center text-(--text-muted) gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-(--text-primary)" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
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
                          <tr><td colSpan={8} className="p-4 text-center text-(--text-muted)">No cause FMEA records found.</td></tr>
                        ) : (
                          paginateData(filteredCauses).map((item, idx) => {
                            const matchedDetail = causeDetailsList.find(d => d.detail_id === item.detail_id);
                            const matchedEffect = effectsList.find(e => e.potentialeffects_id === item.potentialeffects_id);
                            const matchedControl = controlsList.find(c => c.currentcontrols_id === item.currentcontrols_id);
                            const computedRpn = item.computed_rpn ?? ((item.sev_id || 0) * (item.occ_id || 0) * (item.det_id || 0));

                            return (
                              <tr key={`cause-fmea-row-${item.cause_fmea_id || idx}`} className="hover:bg-(--accent-subtle) transition-colors">
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
                                        setCauseEditEffectQuery('');
                                        setCauseEditControlQuery('');
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
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
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
                <button onClick={() => { setConstantsSubTab('controls'); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${constantsSubTab === 'controls' ? 'bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) shadow' : 'text-(--text-muted) hover:text-(--text-primary)'}`}>Controls</button>
                <button onClick={() => { setConstantsSubTab('effects'); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${constantsSubTab === 'effects' ? 'bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) shadow' : 'text-(--text-muted) hover:text-(--text-primary)'}`}>Effects</button>
              </div>
            </div>

            {constantsSubTab === 'controls' && (
              <div className="flex flex-col flex-1 min-h-0 space-y-2">
                <div className="shrink-0 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter controls..."
                      value={controlSearch}
                      onChange={(e) => { setControlSearch(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary)"
                    />
                  </div>
                  <button onClick={() => { setControlModalDesc(''); setIsAddControlModalOpen(true); }} className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Add Control
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                        <th className="py-2 px-3">Control Description</th>
                        <th className="py-2 px-3 w-32">Created At</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {filteredControls.length === 0 ? (
                        <tr><td colSpan={3} className="p-4 text-center text-(--text-muted)">No control records found.</td></tr>
                      ) : (
                        paginateData(filteredControls).map((item, idx) => (
                          <tr key={`ctrl-row-${item.currentcontrols_id || idx}`} className="hover:bg-(--accent-subtle) transition-colors">
                            <td className="py-2 px-3 text-(--text-primary)">{item.currentcontrols_desc || '—'}</td>
                            <td className="py-2 px-3 font-mono text-(--text-muted)">{new Date(item.created_at).toLocaleDateString()}</td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditControlRecordId(item.currentcontrols_id);
                                    setControlEditDesc(item.currentcontrols_desc || '');
                                    setIsEditControlModalOpen(true);
                                  }}
                                  className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteControl(item.currentcontrols_id)}
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
                {renderPagination(filteredControls.length)}
              </div>
            )}

            {constantsSubTab === 'effects' && (
              <div className="flex flex-col flex-1 min-h-0 space-y-2">
                <div className="shrink-0 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter effects..."
                      value={effectSearch}
                      onChange={(e) => { setEffectSearch(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary)"
                    />
                  </div>
                  <button onClick={() => { setEffectModalDesc(''); setIsAddEffectModalOpen(true); }} className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Add Effect
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                        <th className="py-2 px-3">Effect Description</th>
                        <th className="py-2 px-3 w-32">Created At</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {filteredEffects.length === 0 ? (
                        <tr><td colSpan={3} className="p-4 text-center text-(--text-muted)">No effect records found.</td></tr>
                      ) : (
                        paginateData(filteredEffects).map((item, idx) => (
                          <tr key={`eff-row-${item.potentialeffects_id || idx}`} className="hover:bg-(--accent-subtle) transition-colors">
                            <td className="py-2 px-3 text-(--text-primary)">{item.potentialeffects_desc || '—'}</td>
                            <td className="py-2 px-3 font-mono text-(--text-muted)">{new Date(item.created_at).toLocaleDateString()}</td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditEffectRecordId(item.potentialeffects_id);
                                    setEffectEditDesc(item.potentialeffects_desc || '');
                                    setIsEditEffectModalOpen(true);
                                  }}
                                  className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteEffect(item.potentialeffects_id)}
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
                {renderPagination(filteredEffects.length)}
              </div>
            )}
          </div>
        )}

        {/* RPN Definitions Tab */}
        {mainTab === 'rpn_definitions' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            <div className="shrink-0 border-b border-(--border-main) pb-2">
              <div className="flex bg-(--bg-elevated) p-1 rounded-lg border border-(--border-main) w-fit gap-1">
                <button onClick={() => { setRpnSubTab('severity'); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${rpnSubTab === 'severity' ? 'bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) shadow' : 'text-(--text-muted) hover:text-(--text-primary)'}`}><AlertTriangle className="w-3.5 h-3.5" />Severity</button>
                <button onClick={() => { setRpnSubTab('occurrence'); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${rpnSubTab === 'occurrence' ? 'bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) shadow' : 'text-(--text-muted) hover:text-(--text-primary)'}`}><Activity className="w-3.5 h-3.5" />Occurrence</button>
                <button onClick={() => { setRpnSubTab('detection'); setCurrentPage(1); }} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${rpnSubTab === 'detection' ? 'bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) shadow' : 'text-(--text-muted) hover:text-(--text-primary)'}`}><Eye className="w-3.5 h-3.5" />Detection</button>
              </div>
            </div>

            {rpnSubTab === 'severity' && (
              <div className="flex flex-col flex-1 min-h-0 space-y-2">
                <form onSubmit={handleAddSeverity} className="shrink-0 flex gap-2">
                  <input type="number" placeholder="ID" value={newSevId} onChange={(e) => setNewSevId(e.target.value)} className="w-20 bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-(--text-primary)" />
                  <input type="text" placeholder="Description..." value={newSevDesc} onChange={(e) => setNewSevDesc(e.target.value)} className="flex-1 bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary)" />
                  <button type="submit" className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"><Plus className="w-3.5 h-3.5" /> Add</button>
                </form>
                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                        <th className="py-2 px-3 w-16">ID</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 w-32">Created At</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {severityList.length === 0 ? (
                        <tr><td colSpan={4} className="p-4 text-center text-(--text-muted)">No severity records found.</td></tr>
                      ) : (
                        paginateData(severityList).map((item, idx) => (
                          <tr key={`sev-def-row-${item.sev_id ?? idx}`} className="hover:bg-(--accent-subtle) transition-colors">
                            <td className="py-2 px-3 font-mono text-(--text-primary) font-semibold">{item.sev_id}</td>
                            <td className="py-2 px-3 text-(--text-primary)">
                              {editingSevId === item.sev_id ? (
                                <input type="text" value={editingSevText} onChange={(e) => setEditingSevText(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--text-primary) rounded px-2 py-1 text-xs text-(--text-primary) focus:outline-none" />
                              ) : (item.sev_description || '—')}
                            </td>
                            <td className="py-2 px-3 font-mono text-(--text-muted)">{new Date(item.created_at).toLocaleDateString()}</td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {editingSevId === item.sev_id ? (
                                  <>
                                    <button onClick={() => handleUpdateSeverity(item.sev_id)} className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer">Save</button>
                                    <button onClick={() => { setEditingSevId(null); setEditingSevText(''); }} className="text-(--text-muted) hover:underline cursor-pointer">Cancel</button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => { setEditingSevId(item.sev_id); setEditingSevText(item.sev_description || ''); }} className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"><Edit2 className="w-3 h-3" /> Edit</button>
                                    <button onClick={() => handleDeleteSeverity(item.sev_id)} className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"><Trash2 className="w-3 h-3" /> Delete</button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPagination(severityList.length)}
              </div>
            )}

            {rpnSubTab === 'occurrence' && (
              <div className="flex flex-col flex-1 min-h-0 space-y-2">
                <form onSubmit={handleAddOccurrence} className="shrink-0 flex gap-2">
                  <input type="number" placeholder="ID" value={newOccId} onChange={(e) => setNewOccId(e.target.value)} className="w-20 bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-(--text-primary)" />
                  <input type="text" placeholder="Description..." value={newOccDesc} onChange={(e) => setNewOccDesc(e.target.value)} className="flex-1 bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary)" />
                  <button type="submit" className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"><Plus className="w-3.5 h-3.5" /> Add</button>
                </form>
                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                        <th className="py-2 px-3 w-16">ID</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 w-32">Created At</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {occurrenceList.length === 0 ? (
                        <tr><td colSpan={4} className="p-4 text-center text-(--text-muted)">No occurrence records found.</td></tr>
                      ) : (
                        paginateData(occurrenceList).map((item, idx) => (
                          <tr key={`occ-def-row-${item.occ_id ?? idx}`} className="hover:bg-(--accent-subtle) transition-colors">
                            <td className="py-2 px-3 font-mono text-(--text-primary) font-semibold">{item.occ_id}</td>
                            <td className="py-2 px-3 text-(--text-primary)">
                              {editingOccId === item.occ_id ? (
                                <input type="text" value={editingOccText} onChange={(e) => setEditingOccText(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--text-primary) rounded px-2 py-1 text-xs text-(--text-primary) focus:outline-none" />
                              ) : (item.occ_description || '—')}
                            </td>
                            <td className="py-2 px-3 font-mono text-(--text-muted)">{new Date(item.created_at).toLocaleDateString()}</td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {editingOccId === item.occ_id ? (
                                  <>
                                    <button onClick={() => handleUpdateOccurrence(item.occ_id)} className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer">Save</button>
                                    <button onClick={() => { setEditingOccId(null); setEditingOccText(''); }} className="text-(--text-muted) hover:underline cursor-pointer">Cancel</button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => { setEditingOccId(item.occ_id); setEditingOccText(item.occ_description || ''); }} className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"><Edit2 className="w-3 h-3" /> Edit</button>
                                    <button onClick={() => handleDeleteOccurrence(item.occ_id)} className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"><Trash2 className="w-3 h-3" /> Delete</button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPagination(occurrenceList.length)}
              </div>
            )}

            {rpnSubTab === 'detection' && (
              <div className="flex flex-col flex-1 min-h-0 space-y-2">
                <form onSubmit={handleAddDetection} className="shrink-0 flex gap-2">
                  <input type="number" placeholder="ID" value={newDetId} onChange={(e) => setNewDetId(e.target.value)} className="w-20 bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-(--text-primary)" />
                  <input type="text" placeholder="Description..." value={newDetDesc} onChange={(e) => setNewDetDesc(e.target.value)} className="flex-1 bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary)" />
                  <button type="submit" className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"><Plus className="w-3.5 h-3.5" /> Add</button>
                </form>
                <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                        <th className="py-2 px-3 w-16">ID</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 w-32">Created At</th>
                        <th className="py-2 px-3 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                      {detectionList.length === 0 ? (
                        <tr><td colSpan={4} className="p-4 text-center text-(--text-muted)">No detection records found.</td></tr>
                      ) : (
                        paginateData(detectionList).map((item, idx) => (
                          <tr key={`det-def-row-${item.det_id ?? idx}`} className="hover:bg-(--accent-subtle) transition-colors">
                            <td className="py-2 px-3 font-mono text-(--text-primary) font-semibold">{item.det_id}</td>
                            <td className="py-2 px-3 text-(--text-primary)">
                              {editingDetId === item.det_id ? (
                                <input type="text" value={editingDetText} onChange={(e) => setEditingDetText(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--text-primary) rounded px-2 py-1 text-xs text-(--text-primary) focus:outline-none" />
                              ) : (item.det_description || '—')}
                            </td>
                            <td className="py-2 px-3 font-mono text-(--text-muted)">{new Date(item.created_at).toLocaleDateString()}</td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {editingDetId === item.det_id ? (
                                  <>
                                    <button onClick={() => handleUpdateDetection(item.det_id)} className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer">Save</button>
                                    <button onClick={() => { setEditingDetId(null); setEditingDetText(''); }} className="text-(--text-muted) hover:underline cursor-pointer">Cancel</button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => { setEditingDetId(item.det_id); setEditingDetText(item.det_description || ''); }} className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"><Edit2 className="w-3 h-3" /> Edit</button>
                                    <button onClick={() => handleDeleteDetection(item.det_id)} className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"><Trash2 className="w-3 h-3" /> Delete</button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPagination(detectionList.length)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- MODALS FOR CONSTANTS --- */}

      {/* Add Control Modal */}
      {isAddControlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-(--text-primary)" />
                <h3 className="text-lg font-bold text-(--text-primary)">Add Current Control Definition</h3>
              </div>
              <button onClick={() => setIsAddControlModalOpen(false)} className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddControlModalSubmit} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Control Description</label>
                  <textarea
                    rows={3}
                    placeholder="Enter control description..."
                    value={controlModalDesc}
                    onChange={(e) => setControlModalDesc(e.target.value)}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button type="button" onClick={() => setIsAddControlModalOpen(false)} className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Save Control</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Control Modal */}
      {isEditControlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-(--text-primary)" />
                <h3 className="text-lg font-bold text-(--text-primary)">Edit Current Control Definition</h3>
              </div>
              <button onClick={() => setIsEditControlModalOpen(false)} className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateControlModalSubmit} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Control Description</label>
                  <textarea
                    rows={3}
                    placeholder="Enter control description..."
                    value={controlEditDesc}
                    onChange={(e) => setControlEditDesc(e.target.value)}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button type="button" onClick={() => setIsEditControlModalOpen(false)} className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Update Control</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Effect Modal */}
      {isAddEffectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-(--text-primary)" />
                <h3 className="text-lg font-bold text-(--text-primary)">Add Potential Effect Definition</h3>
              </div>
              <button onClick={() => setIsAddEffectModalOpen(false)} className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddEffectModalSubmit} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Effect Description</label>
                  <textarea
                    rows={3}
                    placeholder="Enter potential effect description..."
                    value={effectModalDesc}
                    onChange={(e) => setEffectModalDesc(e.target.value)}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button type="button" onClick={() => setIsAddEffectModalOpen(false)} className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Save Effect</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Effect Modal */}
      {isEditEffectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-(--text-primary)" />
                <h3 className="text-lg font-bold text-(--text-primary)">Edit Potential Effect Definition</h3>
              </div>
              <button onClick={() => setIsEditEffectModalOpen(false)} className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateEffectModalSubmit} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Effect Description</label>
                  <textarea
                    rows={3}
                    placeholder="Enter potential effect description..."
                    value={effectEditDesc}
                    onChange={(e) => setEffectEditDesc(e.target.value)}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button type="button" onClick={() => setIsEditEffectModalOpen(false)} className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow">Update Effect</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MASTER FMEA MODALS --- */}

      {/* Modal Dialog for Adding Unsafe Condition Record */}
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
                  <select value={modalConditionId} onChange={(e) => { setModalConditionId(e.target.value); setModalDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Condition...</option>
                    {conditionsList.map((cond, idx) => <option key={`cond-opt-${cond.condition_id || idx}`} value={cond.condition_id}>{cond.code || ''} - {cond.description || cond.condition_desc || cond.name || 'Condition'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Condition Detail</label>
                  <select value={modalDetailId} onChange={(e) => setModalDetailId(e.target.value)} disabled={!modalConditionId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{modalConditionId ? 'Select Condition Detail...' : '— Select Unsafe Condition First —'}</option>
                    {modalFilteredDetails.map((det, idx) => <option key={`cond-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search potential effects..." value={modalEffectQuery} onChange={(e) => setModalEffectQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={modalPotentialEffectId} onChange={(e) => setModalPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Potential Effect...</option>
                      {modalFilteredEffects.map((eff, idx) => <option key={`cond-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search current controls..." value={modalControlQuery} onChange={(e) => setModalControlQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={modalCurrentControlId} onChange={(e) => setModalCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Current Control...</option>
                      {modalFilteredControls.map((ctrl, idx) => <option key={`cond-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={modalSevId} onChange={(e) => setModalSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`sev-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={modalOccId} onChange={(e) => setModalOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`occ-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={modalDetId} onChange={(e) => setModalDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
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

      {/* Modal Dialog for Editing Unsafe Condition Record */}
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
                  <select value={editConditionId} onChange={(e) => { setEditConditionId(e.target.value); setEditDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Condition...</option>
                    {conditionsList.map((cond, idx) => <option key={`cond-edit-opt-${cond.condition_id || idx}`} value={cond.condition_id}>{cond.code || ''} - {cond.description || cond.condition_desc || cond.name || 'Condition'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Condition Detail</label>
                  <select value={editDetailId} onChange={(e) => setEditDetailId(e.target.value)} disabled={!editConditionId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{editConditionId ? 'Select Condition Detail...' : '— Select Unsafe Condition First —'}</option>
                    {editFilteredDetails.map((det, idx) => <option key={`cond-edit-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search potential effects..." value={editEffectQuery} onChange={(e) => setEditEffectQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={editPotentialEffectId} onChange={(e) => setEditPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Potential Effect...</option>
                      {editFilteredEffects.map((eff, idx) => <option key={`cond-edit-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search current controls..." value={editControlQuery} onChange={(e) => setEditControlQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={editCurrentControlId} onChange={(e) => setEditCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Current Control...</option>
                      {editFilteredControls.map((ctrl, idx) => <option key={`cond-edit-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={editSevId} onChange={(e) => setEditSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`sev-edit-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={editOccId} onChange={(e) => setEditOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`occ-edit-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={editDetId} onChange={(e) => setEditDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
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

      {/* Modal Dialog for Adding Unsafe Act Record */}
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
                  <select value={actModalActId} onChange={(e) => { setActModalActId(e.target.value); setActModalDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Act...</option>
                    {actsList.map((act, idx) => <option key={`act-opt-${act.act_id || idx}`} value={act.act_id}>{act.code || ''} - {act.description || act.act_desc || act.name || 'Act'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Act Detail</label>
                  <select value={actModalDetailId} onChange={(e) => setActModalDetailId(e.target.value)} disabled={!actModalActId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{actModalActId ? 'Select Act Detail...' : '— Select Unsafe Act First —'}</option>
                    {actModalFilteredDetails.map((det, idx) => <option key={`act-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search potential effects..." value={actModalEffectQuery} onChange={(e) => setActModalEffectQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={actModalPotentialEffectId} onChange={(e) => setActModalPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Potential Effect...</option>
                      {actModalFilteredEffects.map((eff, idx) => <option key={`act-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search current controls..." value={actModalControlQuery} onChange={(e) => setActModalControlQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={actModalCurrentControlId} onChange={(e) => setActModalCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Current Control...</option>
                      {actModalFilteredControls.map((ctrl, idx) => <option key={`act-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={actModalSevId} onChange={(e) => setActModalSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`act-sev-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={actModalOccId} onChange={(e) => setActModalOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`act-occ-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={actModalDetId} onChange={(e) => setActModalDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Det</option>
                      {detectionList.map((d, idx) => <option key={`act-det-opt-${d.det_id ?? idx}`} value={d.det_id}>{d.det_id}</option>)}
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

      {/* Modal Dialog for Editing Unsafe Act Record */}
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
                  <select value={actEditActId} onChange={(e) => { setActEditActId(e.target.value); setActEditDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Act...</option>
                    {actsList.map((act, idx) => <option key={`act-edit-opt-${act.act_id || idx}`} value={act.act_id}>{act.code || ''} - {act.description || act.act_desc || act.name || 'Act'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Act Detail</label>
                  <select value={actEditDetailId} onChange={(e) => setActEditDetailId(e.target.value)} disabled={!actEditActId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{actEditActId ? 'Select Act Detail...' : '— Select Unsafe Act First —'}</option>
                    {actEditFilteredDetails.map((det, idx) => <option key={`act-edit-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search potential effects..." value={actEditEffectQuery} onChange={(e) => setActEditEffectQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={actEditPotentialEffectId} onChange={(e) => setActEditPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Potential Effect...</option>
                      {actEditFilteredEffects.map((eff, idx) => <option key={`act-edit-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search current controls..." value={actEditControlQuery} onChange={(e) => setActEditControlQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={actEditCurrentControlId} onChange={(e) => setActEditCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Current Control...</option>
                      {actEditFilteredControls.map((ctrl, idx) => <option key={`act-edit-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={actEditSevId} onChange={(e) => setActEditSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`act-sev-edit-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={actEditOccId} onChange={(e) => setActEditOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`act-occ-edit-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={actEditDetId} onChange={(e) => setActEditDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Det</option>
                      {detectionList.map((d, idx) => <option key={`act-det-edit-opt-${d.det_id ?? idx}`} value={d.det_id}>{d.det_id}</option>)}
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

      {/* Modal Dialog for Adding Personal Factor Record */}
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
                  <select value={factorModalFactorId} onChange={(e) => { setFactorModalFactorId(e.target.value); setFactorModalDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Factor...</option>
                    {factorsList.map((factor, idx) => <option key={`factor-opt-${factor.factor_id || idx}`} value={factor.factor_id}>{factor.code || ''} - {factor.description || factor.factor_desc || factor.name || 'Factor'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Factor Detail</label>
                  <select value={factorModalDetailId} onChange={(e) => setFactorModalDetailId(e.target.value)} disabled={!factorModalFactorId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{factorModalFactorId ? 'Select Factor Detail...' : '— Select Personal Factor First —'}</option>
                    {factorModalFilteredDetails.map((det, idx) => <option key={`factor-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search potential effects..." value={factorModalEffectQuery} onChange={(e) => setFactorModalEffectQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={factorModalPotentialEffectId} onChange={(e) => setFactorModalPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Potential Effect...</option>
                      {factorModalFilteredEffects.map((eff, idx) => <option key={`factor-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search current controls..." value={factorModalControlQuery} onChange={(e) => setFactorModalControlQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={factorModalCurrentControlId} onChange={(e) => setFactorModalCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Current Control...</option>
                      {factorModalFilteredControls.map((ctrl, idx) => <option key={`factor-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={factorModalSevId} onChange={(e) => setFactorModalSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`factor-sev-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={factorModalOccId} onChange={(e) => setFactorModalOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`factor-occ-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={factorModalDetId} onChange={(e) => setFactorModalDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Det</option>
                      {detectionList.map((d, idx) => <option key={`factor-det-opt-${d.det_id ?? idx}`} value={d.det_id}>{d.det_id}</option>)}
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

      {/* Modal Dialog for Editing Personal Factor Record */}
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
                  <select value={factorEditFactorId} onChange={(e) => { setFactorEditFactorId(e.target.value); setFactorEditDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Factor...</option>
                    {factorsList.map((factor, idx) => <option key={`factor-edit-opt-${factor.factor_id || idx}`} value={factor.factor_id}>{factor.code || ''} - {factor.description || factor.factor_desc || factor.name || 'Factor'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Factor Detail</label>
                  <select value={factorEditDetailId} onChange={(e) => setFactorEditDetailId(e.target.value)} disabled={!factorEditFactorId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{factorEditFactorId ? 'Select Factor Detail...' : '— Select Personal Factor First —'}</option>
                    {factorEditFilteredDetails.map((det, idx) => <option key={`factor-edit-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search potential effects..." value={factorEditEffectQuery} onChange={(e) => setFactorEditEffectQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={factorEditPotentialEffectId} onChange={(e) => setFactorEditPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Potential Effect...</option>
                      {factorEditFilteredEffects.map((eff, idx) => <option key={`factor-edit-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search current controls..." value={factorEditControlQuery} onChange={(e) => setFactorEditControlQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={factorEditCurrentControlId} onChange={(e) => setFactorEditCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Current Control...</option>
                      {factorEditFilteredControls.map((ctrl, idx) => <option key={`factor-edit-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={factorEditSevId} onChange={(e) => setFactorEditSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`factor-sev-edit-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={factorEditOccId} onChange={(e) => setFactorEditOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`factor-occ-edit-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={factorEditDetId} onChange={(e) => setFactorEditDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Det</option>
                      {detectionList.map((d, idx) => <option key={`factor-det-edit-opt-${d.det_id ?? idx}`} value={d.det_id}>{d.det_id}</option>)}
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

      {/* Modal Dialog for Adding Work Related Cause Record */}
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
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Work Related Cause</label>
                  <select value={causeModalCauseId} onChange={(e) => { setCauseModalCauseId(e.target.value); setCauseModalDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Cause...</option>
                    {causesList.map((cause, idx) => <option key={`cause-opt-${cause.cause_id || idx}`} value={cause.cause_id}>{cause.code || ''} - {cause.description || cause.cause_desc || cause.name || 'Cause'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Cause Detail</label>
                  <select value={causeModalDetailId} onChange={(e) => setCauseModalDetailId(e.target.value)} disabled={!causeModalCauseId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{causeModalCauseId ? 'Select Cause Detail...' : '— Select Work Related Cause First —'}</option>
                    {causeModalFilteredDetails.map((det, idx) => <option key={`cause-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search potential effects..." value={causeModalEffectQuery} onChange={(e) => setCauseModalEffectQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={causeModalPotentialEffectId} onChange={(e) => setCauseModalPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Potential Effect...</option>
                      {causeModalFilteredEffects.map((eff, idx) => <option key={`cause-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search current controls..." value={causeModalControlQuery} onChange={(e) => setCauseModalControlQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={causeModalCurrentControlId} onChange={(e) => setCauseModalCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Current Control...</option>
                      {causeModalFilteredControls.map((ctrl, idx) => <option key={`cause-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={causeModalSevId} onChange={(e) => setCauseModalSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`cause-sev-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={causeModalOccId} onChange={(e) => setCauseModalOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`cause-occ-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={causeModalDetId} onChange={(e) => setCauseModalDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Det</option>
                      {detectionList.map((d, idx) => <option key={`cause-det-opt-${d.det_id ?? idx}`} value={d.det_id}>{d.det_id}</option>)}
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

      {/* Modal Dialog for Editing Work Related Cause Record */}
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
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Work Related Cause</label>
                  <select value={causeEditCauseId} onChange={(e) => { setCauseEditCauseId(e.target.value); setCauseEditDetailId(''); }} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                    <option value="">Select Cause...</option>
                    {causesList.map((cause, idx) => <option key={`cause-edit-opt-${cause.cause_id || idx}`} value={cause.cause_id}>{cause.code || ''} - {cause.description || cause.cause_desc || cause.name || 'Cause'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Cause Detail</label>
                  <select value={causeEditDetailId} onChange={(e) => setCauseEditDetailId(e.target.value)} disabled={!causeEditCauseId} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs disabled:opacity-50">
                    <option value="">{causeEditCauseId ? 'Select Cause Detail...' : '— Select Work Related Cause First —'}</option>
                    {causeEditFilteredDetails.map((det, idx) => <option key={`cause-edit-det-opt-${det.detail_id || idx}`} value={det.detail_id}>{det.code || ''} - {det.description || ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Potential Effect</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search potential effects..." value={causeEditEffectQuery} onChange={(e) => setCauseEditEffectQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={causeEditPotentialEffectId} onChange={(e) => setCauseEditPotentialEffectId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Potential Effect...</option>
                      {causeEditFilteredEffects.map((eff, idx) => <option key={`cause-edit-eff-opt-${eff.potentialeffects_id || idx}`} value={eff.potentialeffects_id}>{eff.potentialeffects_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-(--text-primary) mb-1">Current Control</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-2.5 top-2.5" />
                      <input type="text" placeholder="Search current controls..." value={causeEditControlQuery} onChange={(e) => setCauseEditControlQuery(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg pl-8 pr-3 py-1.5 text-xs" />
                    </div>
                    <select value={causeEditCurrentControlId} onChange={(e) => setCauseEditCurrentControlId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Select Current Control...</option>
                      {causeEditFilteredControls.map((ctrl, idx) => <option key={`cause-edit-ctrl-opt-${ctrl.currentcontrols_id || idx}`} value={ctrl.currentcontrols_id}>{ctrl.currentcontrols_desc}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Severity</label>
                    <select value={causeEditSevId} onChange={(e) => setCauseEditSevId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Sev</option>
                      {severityList.map((s, idx) => <option key={`cause-sev-edit-opt-${s.sev_id ?? idx}`} value={s.sev_id}>{s.sev_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Occurrence</label>
                    <select value={causeEditOccId} onChange={(e) => setCauseEditOccId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Occ</option>
                      {occurrenceList.map((o, idx) => <option key={`cause-occ-edit-opt-${o.occ_id ?? idx}`} value={o.occ_id}>{o.occ_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">Detection</label>
                    <select value={causeEditDetId} onChange={(e) => setCauseEditDetId(e.target.value)} className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-primary) rounded-lg px-3 py-2 text-xs">
                      <option value="">Det</option>
                      {detectionList.map((d, idx) => <option key={`cause-det-edit-opt-${d.det_id ?? idx}`} value={d.det_id}>{d.det_id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--text-primary) mb-1">RPN</label>
                    <div className="w-full bg-(--accent-subtle) border border-(--border-main) rounded-lg px-3 py-2 text-xs font-mono font-bold text-(--text-primary) text-center">{causeEditComputedRpn}</div>
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
    </div>
  );
}

export default FmeaSettings;