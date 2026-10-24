import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ClipboardList, Search, Calendar, Gauge, FileText, Loader2, CheckCircle, X, AlertCircle, Car, Flag, Plus, Trash2, Layers } from 'lucide-react';

interface VehiclePm {
  plate_no: string;
  service_rdg: number | null;
  make_name: string | null;
  model_name: string | null;
  type_description: string | null;
  id?: string;
  vehicle_id?: string;
  [key: string]: unknown;
}

interface DailyRiskRecord {
  logrisk_id: string;
  log_id: string | null;
  fmea_id: string | null;
  created_at: string;
  updated_at: string;
  detail_code?: string;
  detail_description?: string;
  current_control?: string;
  log_date?: string;
  vehicle_id?: string;
  plate_no?: string;
  [key: string]: unknown;
}

interface DailyLogRecord {
  log_id: string;
  log_date: string;
  vehicle_id: string;
  plate_no?: string;
  [key: string]: unknown;
}

interface FmeaOption {
  fmea_id?: string;
  conditionfmea_id?: string;
  id?: string;
  detail_code?: string;
  detail_description?: string;
  current_control?: string;
  code?: string;
  description?: string;
  [key: string]: unknown;
}

export function DailyInspection() {
  const [activeTab, setActiveTab] = useState<'form' | 'flags'>('form');

  // Inspection Form States
  const [vehicles, setVehicles] = useState<VehiclePm[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState<string>('');
  const [searchCurrentDayOnly, setSearchCurrentDayOnly] = useState<boolean>(false);

  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePm | null>(null);
  const [capturedLogId, setCapturedLogId] = useState<string | null>(null);
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [previousRdgInput, setPreviousRdgInput] = useState<string>('');
  const [currentRdg, setCurrentRdg] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inspection Flags Tab States
  const [dailyRisks, setDailyRisks] = useState<DailyRiskRecord[]>([]);
  const [filteredDailyRisks, setFilteredDailyRisks] = useState<DailyRiskRecord[]>([]);
  const [isAddFlagModalOpen, setIsAddFlagModalOpen] = useState<boolean>(false);

  // Search Flags Modal States
  const [isSearchFlagsModalOpen, setIsSearchFlagsModalOpen] = useState<boolean>(false);
  const [searchFlagDate, setSearchFlagDate] = useState<string>('');
  const [searchFlagVehicleId, setSearchFlagVehicleId] = useState<string>('');
  const [dateFilteredVehicles, setDateFilteredVehicles] = useState<{ vehicle_id: string; plate_no: string }[]>([]);
  
  // Add Flag & Search Vehicle Modal States (for Flags Tab)
  const [showFlagVehiclePicker, setShowFlagVehiclePicker] = useState<boolean>(false);
  const [flagPickerSearch, setFlagPickerSearch] = useState<string>('');
  const [flagVehiclesList, setFlagVehiclesList] = useState<VehiclePm[]>([]);
  const [selectedFlagVehicle, setSelectedFlagVehicle] = useState<VehiclePm | null>(null);
  
  const [dailyLogsList, setDailyLogsList] = useState<DailyLogRecord[]>([]);
  const [fmeaList, setFmeaList] = useState<FmeaOption[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string>('');
  const [selectedFmeaId, setSelectedFmeaId] = useState<string>('');
  const [fmeaSearchQuery, setFmeaSearchQuery] = useState<string>('');

  const todayDateStr = new Date().toISOString().split('T')[0];

  // Computed fields for form
  const previousRdg = selectedVehicle && selectedVehicle.service_rdg !== null && selectedVehicle.service_rdg !== undefined 
    ? Number(selectedVehicle.service_rdg) 
    : 0;

  const numericPrevious = previousRdgInput !== '' ? Number(previousRdgInput) : previousRdg;
  const numericCurrent = Number(currentRdg) || 0;
  const computedIncrement = numericCurrent >= numericPrevious ? numericCurrent - numericPrevious : 0;

  const fetchVehicles = useCallback(async (queryParam?: string, currentDayOnly?: boolean) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const activeQuery = (queryParam !== undefined ? queryParam : pickerSearchQuery) ?? '';
      const isCurrentDayOnly = currentDayOnly !== undefined ? currentDayOnly : searchCurrentDayOnly;

      let targetVehicleIds: string[] = [];

      if (isCurrentDayOnly) {
        const { data: logsData, error: logsError } = await supabase
          .from('vehicle_daily_logs')
          .select('vehicle_id')
          .eq('log_date', todayDateStr);

        if (logsError) throw logsError;
        targetVehicleIds = Array.from(new Set((logsData || []).map(l => l.vehicle_id).filter(Boolean)));

        if (targetVehicleIds.length === 0) {
          setVehicles([]);
          setLoading(false);
          return;
        }
      }

      let query = supabase
        .from('vw_vehicle_pm_details')
        .select('*')
        .order('plate_no', { ascending: true })
        .limit(50);

      if (isCurrentDayOnly && targetVehicleIds.length > 0) {
        query = query.in('vehicle_id', targetVehicleIds);
      }

      if (activeQuery.trim()) {
        query = query.ilike('plate_no', `%${activeQuery.trim()}%`);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setVehicles(data || []);
    } catch {
      setErrorMsg('Failed to load vehicle records. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [pickerSearchQuery, searchCurrentDayOnly, todayDateStr]);

  const fetchDailyRisks = useCallback(async () => {
    try {
      const [risksRes, fmeaRes, logsRes, vehiclesRes] = await Promise.all([
        supabase.from('vehicle_daily_risks').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('vs_fmea_items').select('*'),
        supabase.from('vehicle_daily_logs').select('log_id, log_date, vehicle_id'),
        supabase.from('vw_vehicle_pm_details').select('*')
      ]);

      if (risksRes.error) throw risksRes.error;

      const fmeaMap = new Map();
      (fmeaRes.data || []).forEach(f => {
        const id = f.fmea_id || f.conditionfmea_id || f.id;
        if (id) fmeaMap.set(id, f);
      });

      const logsMap = new Map();
      (logsRes.data || []).forEach(l => {
        if (l.log_id) logsMap.set(l.log_id, l);
      });

      const vehicleMap = new Map();
      (vehiclesRes.data || []).forEach(v => {
        const vId = v.id || v.vehicle_id;
        if (vId) vehicleMap.set(vId, v);
      });

      const formatted = (risksRes.data || []).map(risk => {
        const matchedFmea = fmeaMap.get(risk.fmea_id) || {};
        const matchedLog = logsMap.get(risk.log_id) || {};
        const matchedVehicle = vehicleMap.get(matchedLog.vehicle_id) || {};

        return {
          ...risk,
          detail_code: matchedFmea.detail_code ?? matchedFmea.code ?? '—',
          detail_description: matchedFmea.detail_description ?? matchedFmea.description ?? '—',
          current_control: matchedFmea.current_control ?? '—',
          log_date: matchedLog.log_date ?? '',
          vehicle_id: matchedLog.vehicle_id ?? '',
          plate_no: matchedVehicle.plate_no ?? '—',
        };
      });

      setDailyRisks(formatted);
      setFilteredDailyRisks(formatted.filter(r => r.log_date === todayDateStr));
    } catch {
      // Error handling
    }
  }, [todayDateStr]);

  const fetchVehiclesByDateAndRisks = async (selectedDate: string) => {
    try {
      if (!selectedDate) {
        setDateFilteredVehicles([]);
        return;
      }

      const { data: logsData, error: logsErr } = await supabase
        .from('vehicle_daily_logs')
        .select('log_id, vehicle_id')
        .eq('log_date', selectedDate);

      if (logsErr) throw logsErr;
      if (!logsData || logsData.length === 0) {
        setDateFilteredVehicles([]);
        return;
      }

      const logIdToVehicleMap = new Map();
      const logIds: string[] = [];
      logsData.forEach(l => {
        if (l.log_id && l.vehicle_id) {
          logIdToVehicleMap.set(l.log_id, l.vehicle_id);
          logIds.push(l.log_id);
        }
      });

      if (logIds.length === 0) {
        setDateFilteredVehicles([]);
        return;
      }

      const { data: risksData, error: risksErr } = await supabase
        .from('vehicle_daily_risks')
        .select('log_id')
        .in('log_id', logIds);

      if (risksErr) throw risksErr;
      if (!risksData || risksData.length === 0) {
        setDateFilteredVehicles([]);
        return;
      }

      const validVehicleIds = new Set<string>();
      risksData.forEach(r => {
        const vId = logIdToVehicleMap.get(r.log_id);
        if (vId) validVehicleIds.add(vId);
      });

      if (validVehicleIds.size === 0) {
        setDateFilteredVehicles([]);
        return;
      }

      const { data: vehiclesData, error: vehiclesErr } = await supabase
        .from('vehicles')
        .select('vehicle_id, plate_no')
        .in('vehicle_id', Array.from(validVehicleIds));

      if (vehiclesErr) {
        const { data: pmData, error: pmErr } = await supabase
          .from('vw_vehicle_pm_details')
          .select('vehicle_id, id, plate_no')
          .in('vehicle_id', Array.from(validVehicleIds));

        if (pmErr) throw pmErr;
        const uniqueMap = new Map();
        (pmData || []).forEach(v => {
          const id = v.vehicle_id || v.id;
          if (id && v.plate_no) uniqueMap.set(id, { vehicle_id: id, plate_no: v.plate_no });
        });
        setDateFilteredVehicles(Array.from(uniqueMap.values()));
        return;
      }

      const uniqueMap = new Map();
      (vehiclesData || []).forEach(v => {
        if (v.vehicle_id && v.plate_no) {
          uniqueMap.set(v.vehicle_id, { vehicle_id: v.vehicle_id, plate_no: v.plate_no });
        }
      });

      setDateFilteredVehicles(Array.from(uniqueMap.values()));
    } catch {
      setDateFilteredVehicles([]);
    }
  };

  const fetchCurrentDayLogsForVehicle = async (vehicleId: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_daily_logs')
        .select('log_id, log_date, vehicle_id')
        .eq('vehicle_id', vehicleId)
        .eq('log_date', todayDateStr);

      if (error) throw error;
      setDailyLogsList(data || []);
      if (data && data.length > 0) {
        setSelectedLogId(data[0].log_id);
      } else {
        setSelectedLogId('');
      }
    } catch {
      // Error handling
    }
  };

  const fetchFlagModalOptionsData = async () => {
    try {
      const fmeaRes = await supabase.from('vs_fmea_items').select('*').limit(100);
      setFmeaList(fmeaRes.data || []);
    } catch {
      // Error handling
    }
  };

  const searchVehiclesForFlagsModal = async (searchStr: string) => {
    try {
      setLoading(true);
      const { data: logsData, error: logsErr } = await supabase
        .from('vehicle_daily_logs')
        .select('vehicle_id')
        .eq('log_date', todayDateStr);

      if (logsErr) throw logsErr;
      const targetVehicleIds = Array.from(new Set((logsData || []).map(l => l.vehicle_id).filter(Boolean)));

      if (targetVehicleIds.length === 0) {
        setFlagVehiclesList([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('vw_vehicle_pm_details')
        .select('*')
        .in('vehicle_id', targetVehicleIds);

      if (searchStr.trim()) {
        query = query.ilike('plate_no', `%${searchStr.trim()}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      setFlagVehiclesList(data || []);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    async function initLoad() {
      try {
        const { data, error: fetchError } = await supabase
          .from('vw_vehicle_pm_details')
          .select('*')
          .order('plate_no', { ascending: true })
          .limit(50);

        if (fetchError) throw fetchError;
        if (isMounted) setVehicles(data || []);
      } catch {
        if (isMounted) {
          setErrorMsg('Failed to load vehicle records. Please try again later.');
        }
      }

      if (isMounted) {
        fetchDailyRisks();
      }
    }

    initLoad();

    return () => {
      isMounted = false;
    };
  }, [fetchDailyRisks]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchVehicles(pickerSearchQuery, searchCurrentDayOnly);
  };

  const handleSelectVehicle = async (v: VehiclePm) => {
    setSelectedVehicle(v);
    const resolvedRdg = v.service_rdg !== null && v.service_rdg !== undefined ? String(v.service_rdg) : '0';
    setPreviousRdgInput(resolvedRdg);
    setShowPicker(false);
    setCapturedLogId(null);

    const vehicleId = v.id || v.vehicle_id;
    if (vehicleId) {
      const { data } = await supabase
        .from('vehicle_daily_logs')
        .select('log_id')
        .eq('vehicle_id', vehicleId)
        .eq('log_date', logDate)
        .maybeSingle();

      if (data && data.log_id) {
        setCapturedLogId(data.log_id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedVehicle) {
      setErrorMsg('Please select a vehicle first.');
      return;
    }
    if (!currentRdg || isNaN(Number(currentRdg))) {
      setErrorMsg('Please enter a valid numeric current reading.');
      return;
    }
    if (numericCurrent < numericPrevious) {
      setErrorMsg('Current reading cannot be less than baseline previous reading.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const vehicleId = selectedVehicle.id || selectedVehicle.vehicle_id;
      if (!vehicleId) {
        throw new Error('Vehicle ID is missing from the selected record.');
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc('record_vehicle_daily_log', {
        p_current_rdg: numericCurrent,
        p_daily_increment: computedIncrement,
        p_log_date: logDate,
        p_previous_rdg: numericPrevious,
        p_remarks: remarks.trim() || null,
        p_vehicle_id: vehicleId
      });

      if (rpcError) throw rpcError;
      if (rpcData) {
        setCapturedLogId(rpcData);
      }

      setSuccessMsg(`Daily inspection successfully recorded for plate ${selectedVehicle.plate_no}!`);
      setTimeout(() => setSuccessMsg(null), 3000);

      setCurrentRdg('');
      setRemarks('');
      await fetchVehicles();
    } catch {
      setErrorMsg('Failed to record daily inspection. Please verify your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddFlagModal = () => {
    setSelectedLogId('');
    setSelectedFmeaId('');
    setSelectedFlagVehicle(null);
    setFlagPickerSearch('');
    setFmeaSearchQuery('');
    setDailyLogsList([]);
    fetchFlagModalOptionsData();
    setIsAddFlagModalOpen(true);
  };

  const handleSelectFlagVehicle = async (v: VehiclePm) => {
    setSelectedFlagVehicle(v);
    setShowFlagVehiclePicker(false);
    setSelectedLogId('');
    setDailyLogsList([]);

    const vehicleId = v.id || v.vehicle_id;
    if (vehicleId) {
      await fetchCurrentDayLogsForVehicle(vehicleId);
    }
  };

  const handleSaveFlag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLogId || !selectedFmeaId) {
      alert('Please select both a Daily Log and an FMEA Risk item.');
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from('vehicle_daily_risks').insert([
        { log_id: selectedLogId, fmea_id: selectedFmeaId }
      ]);

      if (error) throw error;

      setIsAddFlagModalOpen(false);
      await fetchDailyRisks();

      setSuccessMsg('Inspection flag added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      alert('Failed to save inspection flag.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFlag = async (logriskId: string) => {
    if (!confirm('Are you sure you want to delete this inspection flag?')) return;
    try {
      const { error } = await supabase.from('vehicle_daily_risks').delete().eq('logrisk_id', logriskId);
      if (error) throw error;
      setDailyRisks(dailyRisks.filter(r => r.logrisk_id !== logriskId));
      setFilteredDailyRisks(filteredDailyRisks.filter(r => r.logrisk_id !== logriskId));
      setSuccessMsg('Inspection flag deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      alert('Failed to delete inspection flag.');
    }
  };

  const handleExecuteSearchFlags = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let result = [...dailyRisks];

    if (searchFlagDate) {
      result = result.filter(r => r.log_date === searchFlagDate);
    }

    if (searchFlagVehicleId) {
      result = result.filter(r => r.vehicle_id === searchFlagVehicleId);
    }

    setFilteredDailyRisks(result);
    setIsSearchFlagsModalOpen(false);
  };

  const handleResetSearchFlags = () => {
    setSearchFlagDate('');
    setSearchFlagVehicleId('');
    setDateFilteredVehicles([]);
    setFilteredDailyRisks(dailyRisks.filter(r => r.log_date === todayDateStr));
    setIsSearchFlagsModalOpen(false);
  };

  const filteredFmeaList = fmeaList.filter(f => {
    const detailCode = f.detail_code ?? f.code ?? '';
    const detailDesc = f.detail_description ?? f.description ?? '';
    const currentCtrl = f.current_control ?? '';
    const combined = `${detailCode} ${detailDesc} ${currentCtrl}`.toLowerCase();
    return combined.includes((fmeaSearchQuery ?? '').toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-(--border-main) pb-3 shrink-0">
        <div className="bg-black text-white p-2 rounded-xl shadow-xs shrink-0">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Daily Inspection & Telemetry</h1>
          <p className="text-xs sm:text-sm text-(--text-muted)">Record daily meter increments and monitor vehicle risk inspection flags.</p>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Main Content Body Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-elevated) border border-(--border-main) rounded-xl p-4 shadow-xl overflow-hidden space-y-3">
        {/* Tab Navigation Header */}
        <div className="flex border-b border-(--border-main) gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeTab === 'form'
                ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
                : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Daily Inspection Form</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('flags');
              fetchDailyRisks();
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeTab === 'flags'
                ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
                : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Inspection Flags</span>
          </button>
        </div>

        {/* TAB 1: DAILY INSPECTION FORM */}
        {activeTab === 'form' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3 overflow-y-auto p-1">
            <form onSubmit={handleSubmit} className="bg-(--bg-surface) border border-(--border-main) rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider flex">
                    Selected Vehicle <span className="text-red-500 ml-1">*</span>
                  </span>
                  {capturedLogId && (
                    <span className="text-[10px] font-semibold bg-(--accent-subtle) text-(--text-primary) px-2.5 py-0.5 rounded-full border border-(--border-main)">
                      Log Recorded
                    </span>
                  )}
                </div>
                
                {selectedVehicle ? (
                  <div className="flex items-center justify-between bg-(--bg-elevated) border border-(--border-main) p-3 rounded-xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-xs">
                      <div>
                        <span className="text-(--text-muted) uppercase text-[10px]">Plate Number</span>
                        <div className="font-bold text-(--text-primary) text-xs">{selectedVehicle.plate_no}</div>
                      </div>
                      <div>
                        <span className="text-(--text-muted) uppercase text-[10px]">Baseline Reading</span>
                        <div className="font-semibold text-(--text-primary)">{previousRdg}</div>
                      </div>
                      <div>
                        <span className="text-(--text-muted) uppercase text-[10px]">Make / Model</span>
                        <div className="font-semibold text-(--text-primary)">{selectedVehicle.make_name || 'N/A'} {selectedVehicle.model_name ? `/ ${selectedVehicle.model_name}` : ''}</div>
                      </div>
                      <div>
                        <span className="text-(--text-muted) uppercase text-[10px]">Type</span>
                        <div className="font-semibold text-(--text-primary)">{selectedVehicle.type_description || 'N/A'}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedVehicle(null); setCapturedLogId(null); setPreviousRdgInput(''); }}
                      className="text-(--text-muted) hover:text-red-600 dark:hover:text-red-400 p-1.5 transition-colors cursor-pointer shrink-0"
                      title="Change vehicle"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) px-4 py-3 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-(--text-primary)" />
                      {vehicles.length > 0 ? `Search / Select Vehicle (${vehicles.length} loaded)...` : 'Search / Select Vehicle...'}
                    </span>
                    <span className="text-xs bg-(--accent-subtle) text-(--text-primary) px-2 py-1 rounded font-semibold">Browse</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-(--text-primary)" />
                    Log Date <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) px-3.5 py-2 rounded-lg text-xs focus:outline-none focus:border-(--text-primary)"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-(--text-primary)" />
                    Previous Reading <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    disabled
                    value={previousRdgInput}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-muted) px-3.5 py-2 rounded-lg text-xs cursor-not-allowed font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-(--text-primary)" />
                    Current Reading <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 52000.00"
                    value={currentRdg}
                    onChange={(e) => setCurrentRdg(e.target.value)}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) px-3.5 py-2 rounded-lg text-xs focus:outline-none focus:border-(--text-primary)"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-(--text-primary)" />
                    Daily Increment
                  </span>
                  <input
                    type="number"
                    disabled
                    value={computedIncrement}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) font-mono font-bold px-3.5 py-2 rounded-lg text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-(--text-primary)" />
                  Remarks / Route Notes
                </span>
                <textarea
                  rows={3}
                  placeholder="e.g. Standard delivery route, minor maintenance check performed..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) px-3.5 py-2 rounded-lg text-xs focus:outline-none focus:border-(--text-primary)"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-(--border-main) shrink-0">
                <button
                  type="submit"
                  disabled={submitting || !selectedVehicle}
                  className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) disabled:opacity-50 text-(--btn-primary-text) px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Record Daily Inspection
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: INSPECTION FLAGS TABLE */}
        {activeTab === 'flags' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3 overflow-hidden">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-(--border-main) pb-3 shrink-0">
              <div>
                <h2 className="text-xs font-bold text-(--text-primary) flex items-center gap-2">
                  <Layers className="w-4 h-4 text-(--text-primary)" />
                  Vehicle Daily Risks & Inspection Flags
                </h2>
                <p className="text-[11px] text-(--text-muted)">Manage flags linked to daily operations logs.</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSearchFlagDate('');
                    setSearchFlagVehicleId('');
                    setDateFilteredVehicles([]);
                    setIsSearchFlagsModalOpen(true);
                  }}
                  className="bg-(--bg-surface) hover:bg-(--accent-subtle) text-(--text-primary) border border-(--border-main) px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5 text-(--text-primary)" />
                  <span>Search Flags</span>
                  {(searchFlagDate || searchFlagVehicleId) && (
                    <span className="w-2 h-2 rounded-full bg-(--text-primary)"></span>
                  )}
                </button>

                <button
                  onClick={handleOpenAddFlagModal}
                  className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Flags</span>
                </button>
              </div>
            </div>

            {/* Scrollable Table Wrapper */}
            <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-surface)">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) text-[11px] uppercase bg-(--bg-elevated) sticky top-0 z-10 font-semibold shadow-xs">
                    <th className="py-2 px-3">Vehicle Plate</th>
                    <th className="py-2 px-3">Log Date</th>
                    <th className="py-2 px-3">Detail Code</th>
                    <th className="py-2 px-3">Detail Description</th>
                    <th className="py-2 px-3">Current Control</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {filteredDailyRisks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 px-3 text-(--text-muted) italic">
                        No inspection risk flags found for the current day.
                      </td>
                    </tr>
                  ) : (
                    filteredDailyRisks.map((risk) => {
                      const isToday = risk.log_date === todayDateStr;
                      return (
                        <tr key={risk.logrisk_id} className="hover:bg-(--accent-subtle) transition-colors">
                          <td className="py-2 px-3 font-bold text-(--text-primary)">{risk.plate_no || '—'}</td>
                          <td className="py-2 px-3">{risk.log_date || '—'}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-(--text-primary)">{risk.detail_code || '—'}</td>
                          <td className="py-2 px-3 text-(--text-secondary)">{risk.detail_description || '—'}</td>
                          <td className="py-2 px-3 text-(--text-muted)">{risk.current_control || '—'}</td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => handleDeleteFlag(risk.logrisk_id)}
                              disabled={!isToday}
                              className={`inline-flex items-center gap-1 font-medium text-xs ${
                                isToday 
                                  ? 'text-red-600 dark:text-red-400 hover:underline cursor-pointer' 
                                  : 'text-(--text-muted) opacity-40 cursor-not-allowed'
                              }`}
                              title={isToday ? 'Delete flag' : 'Cannot delete records from past dates'}
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
            </div>
          </div>
        )}
      </div>

      {/* VEHICLE PICKER MODAL (Form Tab) */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-(--bg-surface) border border-(--border-main) rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-(--border-main) bg-(--bg-elevated) shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">Search Vehicle</h3>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="text-(--text-muted) hover:text-(--text-primary) p-1 rounded-lg hover:bg-(--accent-subtle) cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="p-4 border-b border-(--border-main) bg-(--bg-elevated) space-y-3 shrink-0">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Search by Plate Number..."
                    value={pickerSearchQuery}
                    onChange={(e) => setPickerSearchQuery(e.target.value)}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) pl-9 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:border-(--text-primary)"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Search
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="currentDayOnlyCheckbox"
                  checked={searchCurrentDayOnly}
                  onChange={(e) => setSearchCurrentDayOnly(e.target.checked)}
                  className="rounded border-(--border-main) text-(--text-primary) bg-(--bg-elevated) cursor-pointer"
                />
                <label htmlFor="currentDayOnlyCheckbox" className="text-xs text-(--text-secondary) cursor-pointer select-none">
                  Show vehicles with logs for the current day only
                </label>
              </div>
            </form>

            <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-2">
              {loading ? (
                <div className="py-12 text-center text-(--text-muted) flex items-center justify-center gap-2 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-(--text-primary)" />
                  <span>Loading vehicle records...</span>
                </div>
              ) : vehicles.length === 0 ? (
                <div className="py-12 text-center text-(--text-muted) text-xs italic">
                  No vehicle records found.
                </div>
              ) : (
                vehicles.map((v, index) => (
                  <div
                    key={v.id || v.vehicle_id || index}
                    onClick={() => handleSelectVehicle(v)}
                    className="flex items-center justify-between bg-(--bg-elevated) hover:bg-(--accent-subtle) border border-(--border-main) p-3 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-(--bg-surface) rounded-lg text-(--text-primary) transition-colors">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-(--text-primary) text-xs">{v.plate_no}</div>
                        <div className="text-xs text-(--text-muted)">
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

      {/* SEARCH INSPECTION FLAGS MODAL */}
      {isSearchFlagsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-(--bg-surface) border border-(--border-main) rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-(--border-main) bg-(--bg-elevated) shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">Search Inspection Flags</h3>
              <button
                type="button"
                onClick={() => setIsSearchFlagsModalOpen(false)}
                className="text-(--text-muted) hover:text-(--text-primary) p-1 rounded-lg hover:bg-(--accent-subtle) cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteSearchFlags} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 min-h-0">
                <div className="space-y-1.5">
                  <span className="block font-semibold uppercase text-(--text-secondary)">Select Date</span>
                  <input
                    type="date"
                    value={searchFlagDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setSearchFlagDate(newDate);
                      setSearchFlagVehicleId('');
                      fetchVehiclesByDateAndRisks(newDate);
                    }}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="block font-semibold uppercase text-(--text-secondary)">Select Vehicle (Plate No)</span>
                  <select
                    value={searchFlagVehicleId}
                    onChange={(e) => setSearchFlagVehicleId(e.target.value)}
                    disabled={!searchFlagDate}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-(--text-primary) disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!searchFlagDate ? '— Select date first —' : dateFilteredVehicles.length === 0 ? 'No vehicles with records on this date' : 'Select Vehicle Plate No'}
                    </option>
                    {dateFilteredVehicles.map(v => (
                      <option key={v.vehicle_id} value={v.vehicle_id}>
                        {v.plate_no}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-(--border-main) shrink-0 bg-(--bg-elevated)">
                <button
                  type="button"
                  onClick={handleResetSearchFlags}
                  className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSearchFlagsModalOpen(false)}
                    className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD INSPECTION FLAG MODAL */}
      {isAddFlagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-(--bg-surface) border border-(--border-main) rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-(--border-main) bg-(--bg-elevated) shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">Add Inspection Flag</h3>
              <button
                type="button"
                onClick={() => setIsAddFlagModalOpen(false)}
                className="text-(--text-muted) hover:text-(--text-primary) p-1 rounded-lg hover:bg-(--accent-subtle) cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFlag} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 min-h-0">
                <div className="space-y-1.5">
                  <span className="block font-semibold uppercase text-(--text-secondary)">
                    Search Vehicle (Current Day Logs) <span className="text-red-500">*</span>
                  </span>
                  
                  {selectedFlagVehicle ? (
                    <div className="flex items-center justify-between bg-(--bg-elevated) border border-(--border-main) p-3 rounded-lg">
                      <div>
                        <div className="font-bold text-(--text-primary) text-xs">{selectedFlagVehicle.plate_no}</div>
                        <div className="text-xs text-(--text-muted)">
                          {selectedFlagVehicle.make_name || 'N/A'} {selectedFlagVehicle.model_name ? `/ ${selectedFlagVehicle.model_name}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedFlagVehicle(null); setSelectedLogId(''); setDailyLogsList([]); }}
                        className="text-(--text-muted) hover:text-red-600 dark:hover:text-red-400 p-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setFlagPickerSearch('');
                        searchVehiclesForFlagsModal('');
                        setShowFlagVehiclePicker(true);
                      }}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) px-3.5 py-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-(--text-primary)" />
                        Search vehicle with logs for current day...
                      </span>
                      <span className="text-xs bg-(--accent-subtle) text-(--text-primary) px-2 py-0.5 rounded font-semibold">Search</span>
                    </button>
                  )}
                </div>

                <div>
                  <span className="block font-semibold uppercase text-(--text-secondary) mb-1">Active Log Record (Current Day Only)</span>
                  <select
                    required
                    value={selectedLogId}
                    onChange={(e) => setSelectedLogId(e.target.value)}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                  >
                    <option value="">{dailyLogsList.length === 0 ? '— Select vehicle first —' : 'Select Current Day Log'}</option>
                    {dailyLogsList.map((log) => (
                      <option key={log.log_id} value={log.log_id}>
                        Log Date: {log.log_date}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <span className="block font-semibold uppercase text-(--text-secondary)">
                    Select FMEA Item <span className="text-red-500">*</span>
                  </span>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-(--text-muted)" />
                    <input
                      type="text"
                      placeholder="Filter by detail code, description, or control..."
                      value={fmeaSearchQuery}
                      onChange={(e) => setFmeaSearchQuery(e.target.value)}
                      className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) pl-8 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:border-(--text-primary) mb-1.5"
                    />
                  </div>
                  <select
                    required
                    value={selectedFmeaId}
                    onChange={(e) => setSelectedFmeaId(e.target.value)}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                  >
                    <option value="">Select FMEA Item...</option>
                    {filteredFmeaList.map(f => {
                      const fId = f.fmea_id || f.conditionfmea_id || f.id || '';
                      const dCode = f.detail_code ? `[${f.detail_code}]` : '';
                      const dDesc = f.detail_description || f.description || f.code || 'Item';
                      const cCtrl = f.current_control ? ` | Control: ${f.current_control}` : '';
                      return (
                        <option key={fId} value={fId}>
                          {dCode} {dDesc} {cCtrl}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-(--border-main) shrink-0 bg-(--bg-elevated)">
                <button
                  type="button"
                  onClick={() => setIsAddFlagModalOpen(false)}
                  className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Flag</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLAGS VEHICLE PICKER MODAL */}
      {showFlagVehiclePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-(--bg-surface) border border-(--border-main) rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-(--border-main) bg-(--bg-elevated) shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">Search Vehicle (Current Day Logs)</h3>
              <button
                type="button"
                onClick={() => setShowFlagVehiclePicker(false)}
                className="text-(--text-muted) hover:text-(--text-primary) p-1 rounded-lg hover:bg-(--accent-subtle) cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-(--border-main) bg-(--bg-elevated) shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-(--text-muted)" />
                <input
                  type="text"
                  placeholder="Filter by Plate Number..."
                  value={flagPickerSearch}
                  onChange={(e) => {
                    setFlagPickerSearch(e.target.value);
                    searchVehiclesForFlagsModal(e.target.value);
                  }}
                  className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) pl-9 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:border-(--text-primary)"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-2">
              {loading ? (
                <div className="py-12 text-center text-(--text-muted) flex items-center justify-center gap-2 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-(--text-primary)" />
                  <span>Loading vehicles with current day logs...</span>
                </div>
              ) : flagVehiclesList.length === 0 ? (
                <div className="py-12 text-center text-(--text-muted) text-xs italic">
                  No vehicles found with logs for the current day.
                </div>
              ) : (
                flagVehiclesList.map((v, index) => (
                  <div
                    key={v.id || v.vehicle_id || index}
                    onClick={() => handleSelectFlagVehicle(v)}
                    className="flex items-center justify-between bg-(--bg-elevated) hover:bg-(--accent-subtle) border border-(--border-main) p-3 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-(--bg-surface) rounded-lg text-(--text-primary) transition-colors">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-(--text-primary) text-xs">{v.plate_no}</div>
                        <div className="text-xs text-(--text-muted)">
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
    </div>
  );
}

export default DailyInspection;