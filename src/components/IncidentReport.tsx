import React, { useState, useEffect, useCallback } from 'react';
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
  DollarSign, 
  Calendar, 
  User, 
  FileText 
} from 'lucide-react';

// Header & Vehicles Interfaces
interface VehicleOption {
  vehicle_id: string;
  plate_no?: string;
  vehicle_plate?: string;
  model_name?: string;
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

// Child Record Interfaces
interface IncidentConditionRecord {
  incident_conditions_id: string;
  incident_id: string;
  condition_id: string;
  remarks: string;
  code?: string;
  description?: string;
}

interface IncidentActRecord {
  incident_act_id: string;
  incident_id: string;
  act_id: string;
  remarks: string;
  code?: string;
  description?: string;
}

interface IncidentPersonalRecord {
  incident_personal_id: string;
  incident_id: string;
  factor_id: string;
  remarks: string;
  code?: string;
  description?: string;
}

interface IncidentWorkRelatedRecord {
  incident_workrelated_id: string;
  incident_id: string;
  cause_id: string;
  remarks: string;
  code?: string;
  description?: string;
}

type AnalysisTab = 'conditions' | 'acts' | 'personal' | 'workrelated';

export function IncidentReport() {
  // Master Incident Data
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [loadingIncidents, setLoadingIncidents] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dropdown References
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [conditionOptions, setConditionOptions] = useState<TaxonomyOption[]>([]);
  const [actOptions, setActOptions] = useState<TaxonomyOption[]>([]);
  const [factorOptions, setFactorOptions] = useState<TaxonomyOption[]>([]);
  const [causeOptions, setCauseOptions] = useState<TaxonomyOption[]>([]);

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

  // Master Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    incident_refno: '',
    incident_date: new Date().toISOString().split('T')[0],
    vehicle_id: '',
    incident_severity: 'Low' as IncidentRecord['incident_severity'],
    incident_description: '',
    incident_impact: '',
    incident_loss: 0,
    reported_by: '',
    validated_by: ''
  });

  // Child Modal State
  const [isChildModalOpen, setIsChildModalOpen] = useState<boolean>(false);
  const [childEditingId, setChildEditingId] = useState<string | null>(null);
  const [childForm, setChildForm] = useState({
    selectedOptionId: '',
    remarks: ''
  });

  // Fetch Incident List
  const fetchIncidentList = useCallback(async () => {
    try {
      setLoadingIncidents(true);
      setErrorMsg(null);

      const { data: incData, error: incError } = await supabase
        .from('incident_report')
        .select('*')
        .order('created_at', { ascending: false });

      if (incError) throw incError;

      const { data: vehData } = await supabase.from('vehicles').select('*');
      const vehList: VehicleOption[] = (vehData || []).map((v: Record<string, unknown>) => ({
        vehicle_id: String(v.vehicle_id),
        plate_no: String(v.plate_no || v.vehicle_plate || 'N/A'),
        model_name: String(v.model_name || '')
      }));
      setVehicles(vehList);

      const formatted: IncidentRecord[] = (incData || []).map((row: Record<string, unknown>) => {
        const matchedVeh = vehList.find(v => v.vehicle_id === String(row.vehicle_id));
        return {
          incident_id: String(row.incident_id),
          incident_refno: String(row.incident_refno || ''),
          incident_date: String(row.incident_date || ''),
          vehicle_id: String(row.vehicle_id),
          vehicle_plate: matchedVeh?.plate_no || 'Unknown Plate',
          incident_description: String(row.incident_description || ''),
          incident_impact: String(row.incident_impact || ''),
          incident_loss: Number(row.incident_loss || 0),
          incident_severity: (row.incident_severity as IncidentRecord['incident_severity']) || 'Low',
          reported_by: String(row.reported_by || ''),
          validated_by: String(row.validated_by || ''),
          reported_at: String(row.reported_at || ''),
          created_at: String(row.created_at || ''),
          updated_at: String(row.updated_at || '')
        };
      });

      setIncidents(formatted);
      if (formatted.length > 0 && !selectedIncidentId) {
        setSelectedIncidentId(formatted[0].incident_id);
      }
    } catch (err: unknown) {
      console.error('Error fetching incident_report:', err);
      setErrorMsg('Failed to load incident reports from database.');
    } finally {
      setLoadingIncidents(false);
    }
  }, [selectedIncidentId]);

  // Fetch Taxonomy Options for Child Forms
  const fetchTaxonomyOptions = useCallback(async () => {
    try {
      const [condRes, actRes, factorRes, causeRes] = await Promise.all([
        supabase.from('unsafe_conditions').select('*').order('code'),
        supabase.from('act_details').select('*').order('code'),
        supabase.from('personal_factors').select('*').order('code'),
        supabase.from('work_causes').select('*').order('code')
      ]);

      if (condRes.data) {
        setConditionOptions(condRes.data.map((r: Record<string, unknown>) => ({
          id: String(r.condition_id),
          code: String(r.code || ''),
          description: String(r.description || '')
        })));
      }
      if (actRes.data) {
        setActOptions(actRes.data.map((r: Record<string, unknown>) => ({
          id: String(r.detail_id),
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
      if (causeRes.data) {
        setCauseOptions(causeRes.data.map((r: Record<string, unknown>) => ({
          id: String(r.cause_id),
          code: String(r.code || ''),
          description: String(r.description || '')
        })));
      }
    } catch (err) {
      console.error('Error loading taxonomy options:', err);
    }
  }, []);

  // Fetch Child Records for Selected Incident
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
        const matched = conditionOptions.find(c => c.id === String(row.condition_id));
        return {
          incident_conditions_id: String(row.incident_conditions_id),
          incident_id: String(row.incident_id),
          condition_id: String(row.condition_id),
          remarks: String(row.remarks || ''),
          code: matched?.code,
          description: matched?.description
        };
      }));

      setIncidentActs((actRes.data || []).map((row: Record<string, unknown>) => {
        const matched = actOptions.find(a => a.id === String(row.act_id));
        return {
          incident_act_id: String(row.incident_act_id),
          incident_id: String(row.incident_id),
          act_id: String(row.act_id),
          remarks: String(row.remarks || ''),
          code: matched?.code,
          description: matched?.description
        };
      }));

      setIncidentPersonal((factorRes.data || []).map((row: Record<string, unknown>) => {
        const matched = factorOptions.find(f => f.id === String(row.factor_id));
        return {
          incident_personal_id: String(row.incident_personal_id),
          incident_id: String(row.incident_id),
          factor_id: String(row.factor_id),
          remarks: String(row.remarks || ''),
          code: matched?.code,
          description: matched?.description
        };
      }));

      setIncidentWorkRelated((causeRes.data || []).map((row: Record<string, unknown>) => {
        const matched = causeOptions.find(c => c.id === String(row.cause_id));
        return {
          incident_workrelated_id: String(row.incident_workrelated_id),
          incident_id: String(row.incident_id),
          cause_id: String(row.cause_id),
          remarks: String(row.remarks || ''),
          code: matched?.code,
          description: matched?.description
        };
      }));

    } catch (err: unknown) {
      console.error('Error fetching child records:', err);
    } finally {
      setLoadingChild(false);
    }
  }, [conditionOptions, actOptions, factorOptions, causeOptions]);

  // Initial Load Effect
  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (isMounted) {
        fetchTaxonomyOptions();
        fetchIncidentList();
      }
    });

    return () => {
      isMounted = false;
    };
  }, [fetchIncidentList, fetchTaxonomyOptions]);

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
    const nextRefNo = `INC-${new Date().getFullYear()}-${String(incidents.length + 1).padStart(3, '0')}`;
    setFormData({
      incident_refno: nextRefNo,
      incident_date: new Date().toISOString().split('T')[0],
      vehicle_id: vehicles[0]?.vehicle_id || '',
      incident_severity: 'Low',
      incident_description: '',
      incident_impact: '',
      incident_loss: 0,
      reported_by: '',
      validated_by: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (inc: IncidentRecord) => {
    setEditingId(inc.incident_id);
    setFormData({
      incident_refno: inc.incident_refno,
      incident_date: inc.incident_date,
      vehicle_id: inc.vehicle_id,
      incident_severity: inc.incident_severity,
      incident_description: inc.incident_description,
      incident_impact: inc.incident_impact,
      incident_loss: inc.incident_loss,
      reported_by: inc.reported_by,
      validated_by: inc.validated_by
    });
    setIsModalOpen(true);
  };

  const handleSubmitMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_id) {
      setErrorMsg('Please select a valid vehicle.');
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
        const { error } = await supabase
          .from('incident_report')
          .insert([payload]);

        if (error) throw error;
        setSuccessMsg('Incident Report created successfully.');
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

  const handleDeleteMaster = async (id: string) => {
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

  // Child Breakdown Handlers
  const handleOpenAddChild = () => {
    if (!selectedIncidentId) return;
    setChildEditingId(null);

    let defaultOptionId = '';
    if (activeAnalysisTab === 'conditions') defaultOptionId = conditionOptions[0]?.id || '';
    if (activeAnalysisTab === 'acts') defaultOptionId = actOptions[0]?.id || '';
    if (activeAnalysisTab === 'personal') defaultOptionId = factorOptions[0]?.id || '';
    if (activeAnalysisTab === 'workrelated') defaultOptionId = causeOptions[0]?.id || '';

    setChildForm({
      selectedOptionId: defaultOptionId,
      remarks: ''
    });
    setIsChildModalOpen(true);
  };

  const handleOpenEditChild = (rowId: string, optionId: string, remarks: string) => {
    setChildEditingId(rowId);
    setChildForm({
      selectedOptionId: optionId,
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
      let fkField = '';

      if (activeAnalysisTab === 'conditions') {
        tableName = 'incident_conditions';
        pkField = 'incident_conditions_id';
        fkField = 'condition_id';
      } else if (activeAnalysisTab === 'acts') {
        tableName = 'incident_acts';
        pkField = 'incident_act_id';
        fkField = 'act_id';
      } else if (activeAnalysisTab === 'personal') {
        tableName = 'incident_personal';
        pkField = 'incident_personal_id';
        fkField = 'factor_id';
      } else if (activeAnalysisTab === 'workrelated') {
        tableName = 'incident_workrelated';
        pkField = 'incident_workrelated_id';
        fkField = 'cause_id';
      }

      const payload = {
        incident_id: selectedIncidentId,
        [fkField]: childForm.selectedOptionId,
        remarks: childForm.remarks.trim(),
        updated_at: new Date().toISOString()
      };

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

  // Filtered master list
  const filteredIncidents = incidents.filter(inc => 
    inc.incident_refno.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inc.vehicle_plate && inc.vehicle_plate.toLowerCase().includes(searchQuery.toLowerCase())) ||
    inc.reported_by.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inc.incident_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedIncidentRecord = incidents.find(inc => inc.incident_id === selectedIncidentId);

  return (
    <div className="p-6 w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600/20 text-red-400 rounded-xl">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Incident Reports & Cause Analysis</h1>
            <p className="text-sm text-slate-400">Log equipment incidents and analyze root causes across unsafe conditions, acts, factors, and causes.</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
        >
          <Plus className="w-4 h-4" />
          <span>New Incident Report</span>
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm shadow-inner">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-950/50 border border-red-800 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm shadow-inner">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Master Incident List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ref #, plate number, or reporter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-9 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
          <span className="text-xs text-slate-400">
            Total Incident Records: <strong className="text-slate-200">{filteredIncidents.length}</strong>
          </span>
        </div>

        {/* Scrollable Container with Sticky Table Headers */}
        <div className="overflow-y-auto overflow-x-auto max-h-[calc(100vh-500px)] border border-slate-800/60 rounded-lg">
          {loadingIncidents ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading incident reports...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Incident Ref #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Equipment Plate</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3 text-right">Est. Loss ($)</th>
                  <th className="p-3">Reported By</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">No incident reports found.</td>
                  </tr>
                ) : (
                  filteredIncidents.map((inc) => {
                    const isSelected = inc.incident_id === selectedIncidentId;
                    return (
                      <tr
                        key={inc.incident_id}
                        onClick={() => setSelectedIncidentId(inc.incident_id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-950/60 text-blue-200 border-l-2 border-l-blue-500 font-medium'
                            : 'hover:bg-slate-950/40'
                        }`}
                      >
                        <td className="p-3 font-semibold text-blue-400 font-mono">{inc.incident_refno}</td>
                        <td className="p-3 font-mono text-slate-400">{inc.incident_date}</td>
                        <td className="p-3 font-bold text-slate-200">{inc.vehicle_plate}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            inc.incident_severity === 'Critical' ? 'bg-red-950 text-red-400 border border-red-800' :
                            inc.incident_severity === 'High' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                            inc.incident_severity === 'Medium' ? 'bg-yellow-950 text-yellow-400 border border-yellow-800' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {inc.incident_severity}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-200">
                          ${inc.incident_loss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-slate-300">{inc.reported_by || '—'}</td>
                        <td className="p-3 text-slate-400 truncate max-w-xs">{inc.incident_description}</td>
                        <td className="p-3 text-right space-x-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(inc);
                            }}
                            className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1 text-xs"
                            title="Edit Incident"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMaster(inc.incident_id);
                            }}
                            className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1 text-xs"
                            title="Delete Incident"
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
        </div>
      </div>

      {/* Child Analysis Tabs Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
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
                : 'Select an incident from the table above to view and assign detailed RCA classifications.'}
            </p>
          </div>

          <button
            disabled={!selectedIncidentId}
            onClick={handleOpenAddChild}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Analysis Item</span>
          </button>
        </div>

        {/* 4 Child Breakdown Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveAnalysisTab('conditions')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
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
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
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
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
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
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeAnalysisTab === 'workrelated'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Work Related Causes ({incidentWorkRelated.length})</span>
          </button>
        </div>

        {/* Scrollable Container with Sticky Table Headers for Child Tabs */}
        <div className="overflow-y-auto overflow-x-auto max-h-[calc(100vh-500px)] border border-slate-800/60 rounded-lg">
          {loadingChild ? (
            <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Loading cause analysis items...</span>
            </div>
          ) : !selectedIncidentId ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              Select an Incident Report from the top table to view or add root cause items.
            </div>
          ) : (
            <>
              {/* TAB 1: UNSAFE CONDITIONS */}
              {activeAnalysisTab === 'conditions' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
                      <th className="p-2.5 w-32">Condition Code</th>
                      <th className="p-2.5">Category / Description</th>
                      <th className="p-2.5">Investigation Remarks</th>
                      <th className="p-2.5 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {incidentConditions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">No unsafe conditions recorded for this incident.</td>
                      </tr>
                    ) : (
                      incidentConditions.map((row) => (
                        <tr key={row.incident_conditions_id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="p-2.5 font-mono font-bold text-amber-400">{row.code || '—'}</td>
                          <td className="p-2.5 text-slate-200">{row.description || '—'}</td>
                          <td className="p-2.5 text-slate-400">{row.remarks || '—'}</td>
                          <td className="p-2.5 text-right space-x-2 shrink-0">
                            <button
                              onClick={() => handleOpenEditChild(row.incident_conditions_id, row.condition_id, row.remarks)}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-slate-800 cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteChild(row.incident_conditions_id)}
                              className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-slate-800 cursor-pointer"
                              title="Delete"
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
                      <th className="p-2.5 w-32">Act Code</th>
                      <th className="p-2.5">Act Detail Description</th>
                      <th className="p-2.5">Investigation Remarks</th>
                      <th className="p-2.5 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {incidentActs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">No unsafe acts recorded for this incident.</td>
                      </tr>
                    ) : (
                      incidentActs.map((row) => (
                        <tr key={row.incident_act_id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="p-2.5 font-mono font-bold text-amber-400">{row.code || '—'}</td>
                          <td className="p-2.5 text-slate-200">{row.description || '—'}</td>
                          <td className="p-2.5 text-slate-400">{row.remarks || '—'}</td>
                          <td className="p-2.5 text-right space-x-2 shrink-0">
                            <button
                              onClick={() => handleOpenEditChild(row.incident_act_id, row.act_id, row.remarks)}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-slate-800 cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteChild(row.incident_act_id)}
                              className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-slate-800 cursor-pointer"
                              title="Delete"
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
                      <th className="p-2.5 w-32">Factor Code</th>
                      <th className="p-2.5">Factor Description</th>
                      <th className="p-2.5">Investigation Remarks</th>
                      <th className="p-2.5 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {incidentPersonal.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">No personal factors recorded for this incident.</td>
                      </tr>
                    ) : (
                      incidentPersonal.map((row) => (
                        <tr key={row.incident_personal_id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="p-2.5 font-mono font-bold text-amber-400">{row.code || '—'}</td>
                          <td className="p-2.5 text-slate-200">{row.description || '—'}</td>
                          <td className="p-2.5 text-slate-400">{row.remarks || '—'}</td>
                          <td className="p-2.5 text-right space-x-2 shrink-0">
                            <button
                              onClick={() => handleOpenEditChild(row.incident_personal_id, row.factor_id, row.remarks)}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-slate-800 cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteChild(row.incident_personal_id)}
                              className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-slate-800 cursor-pointer"
                              title="Delete"
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
                      <th className="p-2.5 w-32">Cause Code</th>
                      <th className="p-2.5">Cause Description</th>
                      <th className="p-2.5">Investigation Remarks</th>
                      <th className="p-2.5 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {incidentWorkRelated.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">No work-related causes recorded for this incident.</td>
                      </tr>
                    ) : (
                      incidentWorkRelated.map((row) => (
                        <tr key={row.incident_workrelated_id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="p-2.5 font-mono font-bold text-amber-400">{row.code || '—'}</td>
                          <td className="p-2.5 text-slate-200">{row.description || '—'}</td>
                          <td className="p-2.5 text-slate-400">{row.remarks || '—'}</td>
                          <td className="p-2.5 text-right space-x-2 shrink-0">
                            <button
                              onClick={() => handleOpenEditChild(row.incident_workrelated_id, row.cause_id, row.remarks)}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-slate-800 cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteChild(row.incident_workrelated_id)}
                              className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-slate-800 cursor-pointer"
                              title="Delete"
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

      {/* MASTER FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                {editingId ? 'Edit Incident Report' : 'Create Incident Report'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMaster} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Incident Ref # <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.incident_refno}
                    onChange={(e) => setFormData({ ...formData, incident_refno: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Equipment Vehicle <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Car className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <select
                      required
                      value={formData.vehicle_id}
                      onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Equipment Vehicle</option>
                      {vehicles.map((v) => (
                        <option key={v.vehicle_id} value={v.vehicle_id}>
                          {v.plate_no} {v.model_name ? `(${v.model_name})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Incident Severity Level
                  </label>
                  <select
                    value={formData.incident_severity}
                    onChange={(e) => setFormData({ ...formData, incident_severity: e.target.value as IncidentRecord['incident_severity'] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
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

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Estimated Loss ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.incident_loss}
                      onChange={(e) => setFormData({ ...formData, incident_loss: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Reported By
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.reported_by}
                      onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
                      placeholder="e.g. Driver John Doe"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Validated By
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.validated_by}
                      onChange={(e) => setFormData({ ...formData, validated_by: e.target.value })}
                      placeholder="e.g. Safety Mgr. Smith"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
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

      {/* CHILD ANALYSIS FORM MODAL */}
      {isChildModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950">
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

            <form onSubmit={handleSubmitChild} className="p-6 space-y-4">
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

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Select Classification Option <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={childForm.selectedOptionId}
                  onChange={(e) => setChildForm({ ...childForm, selectedOptionId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Option...</option>
                  {activeAnalysisTab === 'conditions' && conditionOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>[{opt.code}] {opt.description}</option>
                  ))}
                  {activeAnalysisTab === 'acts' && actOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>[{opt.code}] {opt.description}</option>
                  ))}
                  {activeAnalysisTab === 'personal' && factorOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>[{opt.code}] {opt.description}</option>
                  ))}
                  {activeAnalysisTab === 'workrelated' && causeOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>[{opt.code}] {opt.description}</option>
                  ))}
                </select>
              </div>

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

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
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