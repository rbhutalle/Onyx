import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  GitFork, 
  Plus, 
  Trash2, 
  Edit2, 
  AlertTriangle, 
  UserCheck, 
  Briefcase, 
  ShieldAlert, 
  Search, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Database,
  ListTree
} from 'lucide-react';

interface MasterRecord {
  id: string;
  code: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

interface DetailRecord {
  id: string;
  parentId: string;
  code: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

type TabType = 'conditions' | 'acts' | 'factors' | 'causes';
type SubTabType = 'categories' | 'details';

interface TableMapping {
  masterTable: string;
  detailTable: string;
  masterPk: string;
  detailPk: string;
  foreignKey: string;
  label: string;
}

const TAB_CONFIGS: Record<TabType, TableMapping> = {
  conditions: {
    masterTable: 'unsafe_conditions',
    detailTable: 'condition_details',
    masterPk: 'condition_id',
    detailPk: 'detail_id',
    foreignKey: 'condition_id',
    label: 'Unsafe Conditions'
  },
  acts: {
    masterTable: 'unsafe_acts',
    detailTable: 'act_details',
    masterPk: 'act_id',
    detailPk: 'detail_id',
    foreignKey: 'act_id',
    label: 'Unsafe Acts'
  },
  factors: {
    masterTable: 'personal_factors',
    detailTable: 'factor_details',
    masterPk: 'factor_id',
    detailPk: 'detail_id',
    foreignKey: 'factor_id',
    label: 'Personal Factors'
  },
  causes: {
    masterTable: 'work_causes',
    detailTable: 'cause_details',
    masterPk: 'cause_id',
    detailPk: 'detail_id',
    foreignKey: 'cause_id',
    label: 'Work Related Causes'
  }
};

export function RcaSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('conditions');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('categories');

  // Master Data
  const [masterList, setMasterList] = useState<MasterRecord[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const [loadingMaster, setLoadingMaster] = useState<boolean>(false);

  // Detail Data
  const [detailList, setDetailList] = useState<DetailRecord[]>([]);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Search/Filter State
  const [masterSearch, setMasterSearch] = useState<string>('');
  const [detailSearch, setDetailSearch] = useState<string>('');
  const [detailFilterParentId, setDetailFilterParentId] = useState<string>('');

  // Status Messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal States - Master
  const [isMasterModalOpen, setIsMasterModalOpen] = useState<boolean>(false);
  const [masterEditingId, setMasterEditingId] = useState<string | null>(null);
  const [masterForm, setMasterForm] = useState({ code: '', description: '' });

  // Modal States - Detail
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [detailEditingId, setDetailEditingId] = useState<string | null>(null);
  const [detailFormParentId, setDetailFormParentId] = useState<string>('');
  const [detailForm, setDetailForm] = useState({ code: '', description: '' });

  const currentConfig = TAB_CONFIGS[activeTab];

  // Fetch Master List
  const fetchMasterList = useCallback(async () => {
    try {
      setLoadingMaster(true);
      setErrorMsg(null);
      const { data, error } = await supabase
        .from(currentConfig.masterTable)
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;

      const formatted: MasterRecord[] = (data || []).map((row: Record<string, unknown>) => ({
        id: String(row[currentConfig.masterPk]),
        code: String(row.code || ''),
        description: String(row.description || ''),
        created_at: String(row.created_at || ''),
        updated_at: String(row.updated_at || '')
      }));

      setMasterList(formatted);
      if (formatted.length > 0 && !selectedMasterId) {
        setSelectedMasterId(formatted[0].id);
      } else if (formatted.length === 0) {
        setSelectedMasterId(null);
      }
    } catch (err: unknown) {
      console.error(`Error loading ${currentConfig.masterTable}:`, err);
      setErrorMsg(`Failed to load ${currentConfig.label} category records.`);
    } finally {
      setLoadingMaster(false);
    }
  }, [currentConfig, selectedMasterId]);

  // Fetch All Details across all categories for the tab
  const fetchAllDetails = useCallback(async () => {
    try {
      setLoadingDetail(true);
      setErrorMsg(null);
      const { data, error } = await supabase
        .from(currentConfig.detailTable)
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;

      const formatted: DetailRecord[] = (data || []).map((row: Record<string, unknown>) => ({
        id: String(row[currentConfig.detailPk]),
        parentId: String(row[currentConfig.foreignKey]),
        code: String(row.code || ''),
        description: String(row.description || ''),
        created_at: String(row.created_at || ''),
        updated_at: String(row.updated_at || '')
      }));

      setDetailList(formatted);
    } catch (err: unknown) {
      console.error(`Error loading ${currentConfig.detailTable}:`, err);
      setErrorMsg(`Failed to load detail items for ${currentConfig.label}.`);
    } finally {
      setLoadingDetail(false);
    }
  }, [currentConfig]);

  // Initial Load on Tab Change
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      await fetchMasterList();
      await fetchAllDetails();
    };
    queueMicrotask(() => {
      if (isMounted) loadData();
    });
    return () => { isMounted = false; };
  }, [activeTab, fetchMasterList, fetchAllDetails]);

  // Save/Update Master Category
  const handleSaveMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterForm.code.trim() || !masterForm.description.trim()) {
      setErrorMsg('Code and Description are required.');
      return;
    }

    try {
      setErrorMsg(null);
      const payload = {
        code: masterForm.code.trim().toUpperCase(),
        description: masterForm.description.trim(),
        updated_at: new Date().toISOString()
      };

      if (masterEditingId) {
        const { error } = await supabase
          .from(currentConfig.masterTable)
          .update(payload)
          .eq(currentConfig.masterPk, masterEditingId);
        if (error) throw error;
        setSuccessMsg(`${currentConfig.label} category updated successfully.`);
      } else {
        const { error } = await supabase
          .from(currentConfig.masterTable)
          .insert([payload]);
        if (error) throw error;
        setSuccessMsg(`${currentConfig.label} category created successfully.`);
      }

      setIsMasterModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchMasterList();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save record.';
      setErrorMsg(msg);
    }
  };

  // Delete Master Category
  const handleDeleteMaster = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category and all associated detail items?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from(currentConfig.masterTable)
        .delete()
        .eq(currentConfig.masterPk, id);
      if (error) throw error;

      setSuccessMsg('Category deleted successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchMasterList();
      await fetchAllDetails();
    } catch {
      setErrorMsg('Failed to delete category record.');
    }
  };

  // Open Detail Modal
  const handleOpenAddDetail = () => {
    setDetailEditingId(null);
    const defaultParent = detailFilterParentId || selectedMasterId || (masterList[0]?.id ?? '');
    setDetailFormParentId(defaultParent);
    const parentRec = masterList.find(m => m.id === defaultParent);
    const prefix = parentRec ? `${parentRec.code}-` : '';
    setDetailForm({ code: prefix, description: '' });
    setIsDetailModalOpen(true);
  };

  const handleOpenEditDetail = (item: DetailRecord) => {
    setDetailEditingId(item.id);
    setDetailFormParentId(item.parentId);
    setDetailForm({ code: item.code, description: item.description });
    setIsDetailModalOpen(true);
  };

  // Enforce Prefix on Detail Code Change
  const handleDetailCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parentRec = masterList.find(m => m.id === detailFormParentId);
    const prefix = parentRec ? `${parentRec.code}-` : '';
    const val = e.target.value;
    if (val.startsWith(prefix)) {
      setDetailForm({ ...detailForm, code: val });
    } else {
      setDetailForm({ ...detailForm, code: prefix });
    }
  };

  // Save/Update Detail Item
  const handleSaveDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailFormParentId) {
      setErrorMsg('Please select a parent category.');
      return;
    }
    if (!detailForm.code.trim() || !detailForm.description.trim()) {
      setErrorMsg('Code and Description are required.');
      return;
    }

    try {
      setErrorMsg(null);
      const payload = {
        [currentConfig.foreignKey]: detailFormParentId,
        code: detailForm.code.trim().toUpperCase(),
        description: detailForm.description.trim(),
        updated_at: new Date().toISOString()
      };

      if (detailEditingId) {
        const { error } = await supabase
          .from(currentConfig.detailTable)
          .update(payload)
          .eq(currentConfig.detailPk, detailEditingId);
        if (error) throw error;
        setSuccessMsg('Detail item updated successfully.');
      } else {
        const { error } = await supabase
          .from(currentConfig.detailTable)
          .insert([payload]);
        if (error) throw error;
        setSuccessMsg('Detail item created successfully.');
      }

      setIsDetailModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchAllDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save detail item.';
      setErrorMsg(msg);
    }
  };

  // Delete Detail Item
  const handleDeleteDetail = async (id: string) => {
    if (!confirm('Are you sure you want to delete this detail item?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from(currentConfig.detailTable)
        .delete()
        .eq(currentConfig.detailPk, id);
      if (error) throw error;

      setSuccessMsg('Detail item deleted successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchAllDetails();
    } catch {
      setErrorMsg('Failed to delete detail record.');
    }
  };

  // Filtered Lists
  const filteredMasterList = masterList.filter(item => 
    item.code.toLowerCase().includes(masterSearch.toLowerCase()) ||
    item.description.toLowerCase().includes(masterSearch.toLowerCase())
  );

  const filteredDetailList = detailList.filter(item => {
    const matchesSearch = 
      item.code.toLowerCase().includes(detailSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(detailSearch.toLowerCase());
    const matchesParent = !detailFilterParentId || item.parentId === detailFilterParentId;
    return matchesSearch && matchesParent;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
      {/* Page Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-slate-300 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <GitFork className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Root Cause Analysis (RCA) Settings</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">Configure master categories and detail breakdowns for incident classification.</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="shrink-0 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs">
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

      {/* Main Category Tabs */}
      <div className="shrink-0 flex gap-2 border-b border-slate-300 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('conditions'); setActiveSubTab('categories'); }}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'conditions'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Unsafe Conditions</span>
        </button>

        <button
          onClick={() => { setActiveTab('acts'); setActiveSubTab('categories'); }}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'acts'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Unsafe Acts</span>
        </button>

        <button
          onClick={() => { setActiveTab('factors'); setActiveSubTab('categories'); }}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'factors'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-800'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Personal Factors</span>
        </button>

        <button
          onClick={() => { setActiveTab('causes'); setActiveSubTab('categories'); }}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'causes'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-800'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Work Related Causes</span>
        </button>
      </div>

      {/* Main Container Body with Sub-Tabs */}
      <div className="flex flex-col flex-1 min-h-0 bg-slate-50/90 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-xs rounded-xl p-4 overflow-hidden space-y-3">
        {/* Sub-Tab Navigation Bar */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-300 dark:border-slate-800 pb-2">
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-300 dark:border-slate-800 gap-1">
            <button
              onClick={() => setActiveSubTab('categories')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'categories' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Categories ({currentConfig.label})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('details')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'details' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ListTree className="w-3.5 h-3.5" />
              <span>Detail Breakdowns ({detailList.length})</span>
            </button>
          </div>
        </div>

        {/* SUB-TAB 1: CATEGORIES (MASTER TABLE) */}
        {activeSubTab === 'categories' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-2">
            <div className="shrink-0 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={masterSearch}
                  onChange={(e) => setMasterSearch(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  setMasterEditingId(null);
                  setMasterForm({ code: '', description: '' });
                  setIsMasterModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950">
              {loadingMaster ? (
                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Loading categories...</span>
                </div>
              ) : filteredMasterList.length === 0 ? (
                <div className="h-full flex items-center justify-center p-4 text-center text-slate-500 text-xs">
                  No categories found. Click &quot;Add Category&quot; above.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-900 sticky top-0 z-10">
                      <th className="py-2 px-3 w-28">Code</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredMasterList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{item.code}</td>
                        <td className="py-2 px-3 text-slate-900 dark:text-slate-100">{item.description}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setMasterEditingId(item.id);
                                setMasterForm({ code: item.code, description: item.description });
                                setIsMasterModalOpen(true);
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMaster(item.id)}
                              className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* SUB-TAB 2: DETAIL BREAKDOWNS TABLE */}
        {activeSubTab === 'details' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-2">
            <div className="shrink-0 flex gap-2 flex-wrap sm:flex-nowrap items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter detail items..."
                  value={detailSearch}
                  onChange={(e) => setDetailSearch(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="w-full sm:w-64">
                <select
                  value={detailFilterParentId}
                  onChange={(e) => setDetailFilterParentId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Categories (Filter)</option>
                  {masterList.map(m => (
                    <option key={m.id} value={m.id}>{m.code} - {m.description}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleOpenAddDetail}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Detail Item</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950">
              {loadingDetail ? (
                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Loading detail items...</span>
                </div>
              ) : filteredDetailList.length === 0 ? (
                <div className="h-full flex items-center justify-center p-4 text-center text-slate-500 text-xs">
                  No detail items found. Click &quot;Add Detail Item&quot; above.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-900 sticky top-0 z-10">
                      <th className="py-2 px-3 w-32">Detail Code</th>
                      <th className="py-2 px-3">Parent Category</th>
                      <th className="py-2 px-3">Detail Description</th>
                      <th className="py-2 px-3 text-right w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredDetailList.map((item) => {
                      const parentCat = masterList.find(m => m.id === item.parentId);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">{item.code}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">{parentCat ? `${parentCat.code} - ${parentCat.description}` : '—'}</td>
                          <td className="py-2 px-3 text-slate-900 dark:text-slate-100">{item.description}</td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditDetail(item)}
                                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDetail(item.id)}
                                className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MASTER FORM MODAL */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 pb-3 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {masterEditingId ? 'Edit Category' : 'Add Category'} ({currentConfig.label})
              </h3>
              <button
                onClick={() => setIsMasterModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaster} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A1 or COND-01"
                    value={masterForm.code}
                    onChange={(e) => setMasterForm({ ...masterForm, code: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter category description..."
                    value={masterForm.description}
                    onChange={(e) => setMasterForm({ ...masterForm, description: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-300 dark:border-slate-800 shrink-0 mt-4">
                <button
                  type="button"
                  onClick={() => setIsMasterModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL FORM MODAL */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 pb-3 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {detailEditingId ? 'Edit Detail Item' : 'Add Detail Item'}
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetail} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Parent Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={detailFormParentId}
                    onChange={(e) => {
                      const newParentId = e.target.value;
                      setDetailFormParentId(newParentId);
                      const parentRec = masterList.find(m => m.id === newParentId);
                      const prefix = parentRec ? `${parentRec.code}-` : '';
                      setDetailForm(prev => ({ ...prev, code: prefix }));
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Parent Category...</option>
                    {masterList.map(m => (
                      <option key={m.id} value={m.id}>{m.code} - {m.description}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Detail Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A1-001"
                    value={detailForm.code}
                    onChange={handleDetailCodeChange}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Detail Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter specific breakdown description..."
                    value={detailForm.description}
                    onChange={(e) => setDetailForm({ ...detailForm, description: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-300 dark:border-slate-800 shrink-0 mt-4">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow"
                >
                  Save Detail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RcaSettings;









// import React, { useState, useEffect, useCallback } from 'react';
// import { supabase } from '@/lib/supabaseClient';
// import { 
//   GitFork, 
//   Plus, 
//   Trash2, 
//   Edit2, 
//   AlertTriangle, 
//   UserCheck, 
//   Briefcase, 
//   ShieldAlert, 
//   Search, 
//   X, 
//   CheckCircle, 
//   AlertCircle, 
//   Loader2, 
//   Layers 
// } from 'lucide-react';

// // Common Record Types
// interface MasterRecord {
//   id: string;
//   code: string;
//   description: string;
//   created_at?: string;
//   updated_at?: string;
// }

// interface DetailRecord {
//   id: string;
//   parentId: string;
//   code: string;
//   description: string;
//   created_at?: string;
//   updated_at?: string;
// }

// type TabType = 'conditions' | 'acts' | 'factors' | 'causes';

// interface TableMapping {
//   masterTable: string;
//   detailTable: string;
//   masterPk: string;
//   detailPk: string;
//   foreignKey: string;
//   label: string;
// }

// const TAB_CONFIGS: Record<TabType, TableMapping> = {
//   conditions: {
//     masterTable: 'unsafe_conditions',
//     detailTable: 'condition_details',
//     masterPk: 'condition_id',
//     detailPk: 'detail_id',
//     foreignKey: 'condition_id',
//     label: 'Unsafe Conditions'
//   },
//   acts: {
//     masterTable: 'unsafe_acts',
//     detailTable: 'act_details',
//     masterPk: 'act_id',
//     detailPk: 'detail_id',
//     foreignKey: 'act_id',
//     label: 'Unsafe Acts'
//   },
//   factors: {
//     masterTable: 'personal_factors',
//     detailTable: 'factor_details',
//     masterPk: 'factor_id',
//     detailPk: 'detail_id',
//     foreignKey: 'factor_id',
//     label: 'Personal Factors'
//   },
//   causes: {
//     masterTable: 'work_causes',
//     detailTable: 'cause_details',
//     masterPk: 'cause_id',
//     detailPk: 'detail_id',
//     foreignKey: 'cause_id',
//     label: 'Work Related Causes'
//   }
// };

// export function RcaSettings() {
//   const [activeTab, setActiveTab] = useState<TabType>('conditions');

//   // Master Data
//   const [masterList, setMasterList] = useState<MasterRecord[]>([]);
//   const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
//   const [loadingMaster, setLoadingMaster] = useState<boolean>(false);

//   // Detail Data
//   const [detailList, setDetailList] = useState<DetailRecord[]>([]);
//   const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

//   // Search/Filter State
//   const [masterSearch, setMasterSearch] = useState<string>('');
//   const [detailSearch, setDetailSearch] = useState<string>('');

//   // Status Messages
//   const [errorMsg, setErrorMsg] = useState<string | null>(null);
//   const [successMsg, setSuccessMsg] = useState<string | null>(null);

//   // Modal States - Master
//   const [isMasterModalOpen, setIsMasterModalOpen] = useState<boolean>(false);
//   const [masterEditingId, setMasterEditingId] = useState<string | null>(null);
//   const [masterForm, setMasterForm] = useState({ code: '', description: '' });

//   // Modal States - Detail
//   const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
//   const [detailEditingId, setDetailEditingId] = useState<string | null>(null);
//   const [detailForm, setDetailForm] = useState({ code: '', description: '' });

//   const currentConfig = TAB_CONFIGS[activeTab];
//   const selectedMasterRecord = masterList.find(m => m.id === selectedMasterId);

//   // Manual re-fetch handler for Master Records after mutations
//   const fetchMasterList = useCallback(async () => {
//     try {
//       setLoadingMaster(true);
//       setErrorMsg(null);
//       const { data, error } = await supabase
//         .from(currentConfig.masterTable)
//         .select('*')
//         .order('code', { ascending: true });

//       if (error) throw error;

//       const formatted: MasterRecord[] = (data || []).map((row: Record<string, unknown>) => ({
//         id: String(row[currentConfig.masterPk]),
//         code: String(row.code || ''),
//         description: String(row.description || ''),
//         created_at: String(row.created_at || ''),
//         updated_at: String(row.updated_at || '')
//       }));

//       setMasterList(formatted);
//       if (formatted.length > 0) {
//         setSelectedMasterId(formatted[0].id);
//       } else {
//         setSelectedMasterId(null);
//       }
//     } catch (err: unknown) {
//       console.error(`Error loading ${currentConfig.masterTable}:`, err);
//       setErrorMsg(`Failed to load ${currentConfig.label} category records.`);
//     } finally {
//       setLoadingMaster(false);
//     }
//   }, [currentConfig]);

//   // Manual re-fetch handler for Detail Records after mutations
//   const fetchDetailList = useCallback(async (parentId: string) => {
//     try {
//       setLoadingDetail(true);
//       setErrorMsg(null);
//       const { data, error } = await supabase
//         .from(currentConfig.detailTable)
//         .select('*')
//         .eq(currentConfig.foreignKey, parentId)
//         .order('code', { ascending: true });

//       if (error) throw error;

//       const formatted: DetailRecord[] = (data || []).map((row: Record<string, unknown>) => ({
//         id: String(row[currentConfig.detailPk]),
//         parentId: String(row[currentConfig.foreignKey]),
//         code: String(row.code || ''),
//         description: String(row.description || ''),
//         created_at: String(row.created_at || ''),
//         updated_at: String(row.updated_at || '')
//       }));

//       setDetailList(formatted);
//     } catch (err: unknown) {
//       console.error(`Error loading ${currentConfig.detailTable}:`, err);
//       setErrorMsg(`Failed to load details for ${currentConfig.label}.`);
//     } finally {
//       setLoadingDetail(false);
//     }
//   }, [currentConfig]);

//   // Fetch Master List on Tab Change
//   useEffect(() => {
//     let isMounted = true;

//     const loadMaster = async () => {
//       try {
//         setLoadingMaster(true);
//         const { data, error } = await supabase
//           .from(currentConfig.masterTable)
//           .select('*')
//           .order('code', { ascending: true });

//         if (error) throw error;

//         if (isMounted) {
//           const formatted: MasterRecord[] = (data || []).map((row: Record<string, unknown>) => ({
//             id: String(row[currentConfig.masterPk]),
//             code: String(row.code || ''),
//             description: String(row.description || ''),
//             created_at: String(row.created_at || ''),
//             updated_at: String(row.updated_at || '')
//           }));

//           setMasterList(formatted);
//           if (formatted.length > 0) {
//             setSelectedMasterId(formatted[0].id);
//           } else {
//             setSelectedMasterId(null);
//           }
//         }
//       } catch (err: unknown) {
//         console.error(`Error loading ${currentConfig.masterTable}:`, err);
//         if (isMounted) {
//           setErrorMsg(`Failed to load ${currentConfig.label} category records.`);
//         }
//       } finally {
//         if (isMounted) {
//           setLoadingMaster(false);
//         }
//       }
//     };

//     queueMicrotask(() => {
//       if (isMounted) {
//         loadMaster();
//       }
//     });

//     return () => {
//       isMounted = false;
//     };
//   }, [activeTab, currentConfig]);

//   // Fetch Details when Selected Master Record Changes
//   useEffect(() => {
//     let isMounted = true;

//     const loadDetail = async () => {
//       if (!selectedMasterId) {
//         if (isMounted) {
//           setDetailList([]);
//         }
//         return;
//       }

//       try {
//         setLoadingDetail(true);
//         const { data, error } = await supabase
//           .from(currentConfig.detailTable)
//           .select('*')
//           .eq(currentConfig.foreignKey, selectedMasterId)
//           .order('code', { ascending: true });

//         if (error) throw error;

//         if (isMounted) {
//           const formatted: DetailRecord[] = (data || []).map((row: Record<string, unknown>) => ({
//             id: String(row[currentConfig.detailPk]),
//             parentId: String(row[currentConfig.foreignKey]),
//             code: String(row.code || ''),
//             description: String(row.description || ''),
//             created_at: String(row.created_at || ''),
//             updated_at: String(row.updated_at || '')
//           }));

//           setDetailList(formatted);
//         }
//       } catch (err: unknown) {
//         console.error(`Error loading ${currentConfig.detailTable}:`, err);
//         if (isMounted) {
//           setErrorMsg(`Failed to load details for ${currentConfig.label}.`);
//         }
//       } finally {
//         if (isMounted) {
//           setLoadingDetail(false);
//         }
//       }
//     };

//     queueMicrotask(() => {
//       if (isMounted) {
//         loadDetail();
//       }
//     });

//     return () => {
//       isMounted = false;
//     };
//   }, [selectedMasterId, currentConfig]);

//   // Handle Master Save/Update
//   const handleSaveMaster = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!masterForm.code.trim() || !masterForm.description.trim()) {
//       setErrorMsg('Code and Description are required.');
//       return;
//     }

//     try {
//       setErrorMsg(null);
//       const payload = {
//         code: masterForm.code.trim().toUpperCase(),
//         description: masterForm.description.trim(),
//         updated_at: new Date().toISOString()
//       };

//       if (masterEditingId) {
//         const { error } = await supabase
//           .from(currentConfig.masterTable)
//           .update(payload)
//           .eq(currentConfig.masterPk, masterEditingId);

//         if (error) throw error;
//         setSuccessMsg(`${currentConfig.label} record updated successfully.`);
//       } else {
//         const { error } = await supabase
//           .from(currentConfig.masterTable)
//           .insert([payload]);

//         if (error) throw error;
//         setSuccessMsg(`${currentConfig.label} record created successfully.`);
//       }

//       setIsMasterModalOpen(false);
//       setTimeout(() => setSuccessMsg(null), 3000);
//       await fetchMasterList();
//     } catch (err: unknown) {
//       console.error('Error saving master record:', err);
//       const msg = err instanceof Error ? err.message : 'Failed to save record.';
//       setErrorMsg(msg);
//     }
//   };

//   // Handle Master Delete
//   const handleDeleteMaster = async (id: string) => {
//     if (!confirm(`Are you sure you want to delete this category and all associated detail items?`)) return;

//     try {
//       setErrorMsg(null);
//       const { error } = await supabase
//         .from(currentConfig.masterTable)
//         .delete()
//         .eq(currentConfig.masterPk, id);

//       if (error) throw error;

//       setSuccessMsg('Category deleted successfully.');
//       setTimeout(() => setSuccessMsg(null), 3000);
//       await fetchMasterList();
//     } catch (err: unknown) {
//       console.error('Error deleting master record:', err);
//       setErrorMsg('Failed to delete category record.');
//     }
//   };

//   // Open Add Detail Modal with Prefix
//   const handleOpenAddDetail = () => {
//     if (!selectedMasterRecord) return;
//     setDetailEditingId(null);
//     const prefix = `${selectedMasterRecord.code}-`;
//     setDetailForm({ code: prefix, description: '' });
//     setIsDetailModalOpen(true);
//   };

//   // Open Edit Detail Modal
//   const handleOpenEditDetail = (item: DetailRecord) => {
//     setDetailEditingId(item.id);
//     setDetailForm({ code: item.code, description: item.description });
//     setIsDetailModalOpen(true);
//   };

//   // Handle Detail Code Input Change with Prefix Enforcement
//   const handleDetailCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const prefix = selectedMasterRecord ? `${selectedMasterRecord.code}-` : '';
//     const val = e.target.value;

//     if (val.startsWith(prefix)) {
//       setDetailForm({ ...detailForm, code: val });
//     } else {
//       setDetailForm({ ...detailForm, code: prefix });
//     }
//   };

//   // Handle Detail Save/Update
//   const handleSaveDetail = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedMasterId) return;
//     if (!detailForm.code.trim() || !detailForm.description.trim()) {
//       setErrorMsg('Code and Description are required.');
//       return;
//     }

//     try {
//       setErrorMsg(null);
//       const payload = {
//         [currentConfig.foreignKey]: selectedMasterId,
//         code: detailForm.code.trim().toUpperCase(),
//         description: detailForm.description.trim(),
//         updated_at: new Date().toISOString()
//       };

//       if (detailEditingId) {
//         const { error } = await supabase
//           .from(currentConfig.detailTable)
//           .update(payload)
//           .eq(currentConfig.detailPk, detailEditingId);

//         if (error) throw error;
//         setSuccessMsg('Detail item updated successfully.');
//       } else {
//         const { error } = await supabase
//           .from(currentConfig.detailTable)
//           .insert([payload]);

//         if (error) throw error;
//         setSuccessMsg('Detail item created successfully.');
//       }

//       setIsDetailModalOpen(false);
//       setTimeout(() => setSuccessMsg(null), 3000);
//       await fetchDetailList(selectedMasterId);
//     } catch (err: unknown) {
//       console.error('Error saving detail record:', err);
//       const msg = err instanceof Error ? err.message : 'Failed to save detail item.';
//       setErrorMsg(msg);
//     }
//   };

//   // Handle Detail Delete
//   const handleDeleteDetail = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this detail item?')) return;

//     try {
//       setErrorMsg(null);
//       const { error } = await supabase
//         .from(currentConfig.detailTable)
//         .delete()
//         .eq(currentConfig.detailPk, id);

//       if (error) throw error;

//       setSuccessMsg('Detail item deleted successfully.');
//       setTimeout(() => setSuccessMsg(null), 3000);
//       if (selectedMasterId) await fetchDetailList(selectedMasterId);
//     } catch (err: unknown) {
//       console.error('Error deleting detail record:', err);
//       setErrorMsg('Failed to delete detail record.');
//     }
//   };

//   // Filtered lists
//   const filteredMasterList = masterList.filter(item => 
//     item.code.toLowerCase().includes(masterSearch.toLowerCase()) ||
//     item.description.toLowerCase().includes(masterSearch.toLowerCase())
//   );

//   const filteredDetailList = detailList.filter(item => 
//     item.code.toLowerCase().includes(detailSearch.toLowerCase()) ||
//     item.description.toLowerCase().includes(detailSearch.toLowerCase())
//   );

//   return (
//     <div className="p-6 w-full max-w-7xl mx-auto space-y-6">
//       {/* Page Header */}
//       <div className="flex items-center justify-between border-b border-slate-800 pb-4">
//         <div className="flex items-center gap-3">
//           <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
//             <GitFork className="w-7 h-7" />
//           </div>
//           <div>
//             <h1 className="text-2xl font-bold tracking-tight text-slate-100">Root Cause Analysis (RCA) Settings</h1>
//             <p className="text-sm text-slate-400">Configure master-detail taxonomies for RCA incident classification.</p>
//           </div>
//         </div>
//       </div>

//       {/* Messages */}
//       {successMsg && (
//         <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm shadow-inner">
//           <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
//           <span>{successMsg}</span>
//         </div>
//       )}

//       {errorMsg && (
//         <div className="bg-red-950/50 border border-red-800 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm shadow-inner">
//           <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
//           <span>{errorMsg}</span>
//         </div>
//       )}

//       {/* 4 Main Tabs */}
//       <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
//         <button
//           onClick={() => setActiveTab('conditions')}
//           className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
//             activeTab === 'conditions'
//               ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
//               : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
//           }`}
//         >
//           <AlertTriangle className="w-4 h-4" />
//           <span>Unsafe Conditions</span>
//         </button>

//         <button
//           onClick={() => setActiveTab('acts')}
//           className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
//             activeTab === 'acts'
//               ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
//               : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
//           }`}
//         >
//           <ShieldAlert className="w-4 h-4" />
//           <span>Unsafe Acts</span>
//         </button>

//         <button
//           onClick={() => setActiveTab('factors')}
//           className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
//             activeTab === 'factors'
//               ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
//               : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
//           }`}
//         >
//           <UserCheck className="w-4 h-4" />
//           <span>Personal Factors</span>
//         </button>

//         <button
//           onClick={() => setActiveTab('causes')}
//           className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
//             activeTab === 'causes'
//               ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
//               : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
//           }`}
//         >
//           <Briefcase className="w-4 h-4" />
//           <span>Work Related Causes</span>
//         </button>
//       </div>

//       {/* Master-Detail Split Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//         {/* Left Side: Master Table Panel */}
//         <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
//           <div className="flex items-center justify-between border-b border-slate-800 pb-3">
//             <div className="flex items-center gap-2">
//               <Layers className="w-4 h-4 text-blue-400" />
//               <h2 className="text-sm font-bold text-slate-100">{currentConfig.label} (Categories)</h2>
//             </div>
//             <button
//               onClick={() => {
//                 setMasterEditingId(null);
//                 setMasterForm({ code: '', description: '' });
//                 setIsMasterModalOpen(true);
//               }}
//               className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow"
//             >
//               <Plus className="w-3.5 h-3.5" />
//               <span>Add Category</span>
//             </button>
//           </div>

//           {/* Master Search */}
//           <div className="relative">
//             <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
//             <input
//               type="text"
//               placeholder="Filter categories..."
//               value={masterSearch}
//               onChange={(e) => setMasterSearch(e.target.value)}
//               className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500"
//             />
//           </div>

//           {/* Scrollable Master Table Container with Sticky Header */}
//           <div className="overflow-y-auto overflow-x-auto max-h-[calc(100vh-360px)] border border-slate-800/60 rounded-lg">
//             {loadingMaster ? (
//               <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
//                 <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
//                 <span>Loading categories...</span>
//               </div>
//             ) : filteredMasterList.length === 0 ? (
//               <div className="p-8 text-center text-slate-500 text-xs">
//                 No categories found. Click "Add Category" above.
//               </div>
//             ) : (
//               <table className="w-full text-left border-collapse text-xs">
//                 <thead>
//                   <tr className="border-b border-slate-800 text-slate-400 uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
//                     <th className="p-2.5">Code</th>
//                     <th className="p-2.5">Description</th>
//                     <th className="p-2.5 text-right">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-800 text-slate-300">
//                   {filteredMasterList.map((item) => {
//                     const isSelected = item.id === selectedMasterId;
//                     return (
//                       <tr
//                         key={item.id}
//                         onClick={() => setSelectedMasterId(item.id)}
//                         className={`cursor-pointer transition-colors ${
//                           isSelected
//                             ? 'bg-blue-950/60 text-blue-200 font-medium border-l-2 border-l-blue-500'
//                             : 'hover:bg-slate-950/40'
//                         }`}
//                       >
//                         <td className="p-2.5 font-mono font-bold text-blue-400">{item.code}</td>
//                         <td className="p-2.5 text-slate-200">{item.description}</td>
//                         <td className="p-2.5 text-right space-x-2 shrink-0">
//                           <button
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               setMasterEditingId(item.id);
//                               setMasterForm({ code: item.code, description: item.description });
//                               setIsMasterModalOpen(true);
//                             }}
//                             className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-slate-800 cursor-pointer"
//                             title="Edit Category"
//                           >
//                             <Edit2 className="w-3.5 h-3.5" />
//                           </button>
//                           <button
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               handleDeleteMaster(item.id);
//                             }}
//                             className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-slate-800 cursor-pointer"
//                             title="Delete Category"
//                           >
//                             <Trash2 className="w-3.5 h-3.5" />
//                           </button>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         </div>

//         {/* Right Side: Detail Table Panel */}
//         <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
//           <div className="flex items-center justify-between border-b border-slate-800 pb-3">
//             <div>
//               <h2 className="text-sm font-bold text-slate-100">
//                 Detail Breakdown
//                 {selectedMasterRecord && (
//                   <span className="text-blue-400 font-mono text-xs ml-2">
//                     ({selectedMasterRecord.code})
//                   </span>
//                 )}
//               </h2>
//               <p className="text-xs text-slate-400">
//                 {selectedMasterRecord ? selectedMasterRecord.description : 'Select a category from the left to view details.'}
//               </p>
//             </div>
//             <button
//               disabled={!selectedMasterId}
//               onClick={handleOpenAddDetail}
//               className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow"
//             >
//               <Plus className="w-3.5 h-3.5" />
//               <span>Add Detail Item</span>
//             </button>
//           </div>

//           {/* Detail Search */}
//           <div className="relative">
//             <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
//             <input
//               type="text"
//               disabled={!selectedMasterId}
//               placeholder="Filter detail items..."
//               value={detailSearch}
//               onChange={(e) => setDetailSearch(e.target.value)}
//               className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
//             />
//           </div>

//           {/* Scrollable Detail Table Container with Sticky Header */}
//           <div className="overflow-y-auto overflow-x-auto max-h-[calc(100vh-360px)] border border-slate-800/60 rounded-lg">
//             {loadingDetail ? (
//               <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
//                 <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
//                 <span>Loading detail records...</span>
//               </div>
//             ) : !selectedMasterId ? (
//               <div className="p-12 text-center text-slate-500 text-xs">
//                 Select a category on the left to display its breakdown details.
//               </div>
//             ) : filteredDetailList.length === 0 ? (
//               <div className="p-12 text-center text-slate-500 text-xs">
//                 No detail items found for this category. Click "Add Detail Item" to add one.
//               </div>
//             ) : (
//               <table className="w-full text-left border-collapse text-xs">
//                 <thead>
//                   <tr className="border-b border-slate-800 text-slate-400 uppercase bg-slate-950 sticky top-0 z-10 shadow-xs">
//                     <th className="p-2.5 w-28">Detail Code</th>
//                     <th className="p-2.5">Detail Description</th>
//                     <th className="p-2.5 text-right w-24">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-800 text-slate-300">
//                   {filteredDetailList.map((item) => (
//                     <tr key={item.id} className="hover:bg-slate-950/40 transition-colors">
//                       <td className="p-2.5 font-mono font-bold text-amber-400">{item.code}</td>
//                       <td className="p-2.5 text-slate-200">{item.description}</td>
//                       <td className="p-2.5 text-right space-x-2 shrink-0">
//                         <button
//                           onClick={() => handleOpenEditDetail(item)}
//                           className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-slate-800 cursor-pointer"
//                           title="Edit Detail"
//                         >
//                           <Edit2 className="w-3.5 h-3.5" />
//                         </button>
//                         <button
//                           onClick={() => handleDeleteDetail(item.id)}
//                           className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-slate-800 cursor-pointer"
//                           title="Delete Detail"
//                         >
//                           <Trash2 className="w-3.5 h-3.5" />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* MASTER FORM MODAL */}
//       {isMasterModalOpen && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
//           <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
//             <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950">
//               <h3 className="text-sm font-bold text-slate-100">
//                 {masterEditingId ? 'Edit Category' : 'Add Category'} ({currentConfig.label})
//               </h3>
//               <button
//                 onClick={() => setIsMasterModalOpen(false)}
//                 className="text-slate-400 hover:text-slate-100 cursor-pointer"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>

//             <form onSubmit={handleSaveMaster} className="p-6 space-y-4">
//               <div>
//                 <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
//                   Code <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   placeholder="e.g. A1 or COND-01"
//                   value={masterForm.code}
//                   onChange={(e) => setMasterForm({ ...masterForm, code: e.target.value })}
//                   className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
//                   Description <span className="text-red-500">*</span>
//                 </label>
//                 <textarea
//                   rows={3}
//                   required
//                   placeholder="Enter category description..."
//                   value={masterForm.description}
//                   onChange={(e) => setMasterForm({ ...masterForm, description: e.target.value })}
//                   className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
//                 />
//               </div>

//               <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
//                 <button
//                   type="button"
//                   onClick={() => setIsMasterModalOpen(false)}
//                   className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow"
//                 >
//                   Save Category
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* DETAIL FORM MODAL */}
//       {isDetailModalOpen && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
//           <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
//             <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950">
//               <h3 className="text-sm font-bold text-slate-100">
//                 {detailEditingId ? 'Edit Detail Item' : 'Add Detail Item'} ({selectedMasterRecord?.code})
//               </h3>
//               <button
//                 onClick={() => setIsDetailModalOpen(false)}
//                 className="text-slate-400 hover:text-slate-100 cursor-pointer"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>

//             <form onSubmit={handleSaveDetail} className="p-6 space-y-4">
//               <div>
//                 <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
//                   Parent Category Code
//                 </label>
//                 <input
//                   type="text"
//                   readOnly
//                   value={selectedMasterRecord?.code || ''}
//                   className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-400 cursor-not-allowed focus:outline-none"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
//                   Detail Code <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   placeholder={`e.g. ${selectedMasterRecord?.code || 'A1'}-001`}
//                   value={detailForm.code}
//                   onChange={handleDetailCodeChange}
//                   className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
//                   Detail Description <span className="text-red-500">*</span>
//                 </label>
//                 <textarea
//                   rows={3}
//                   required
//                   placeholder="Enter specific breakdown description..."
//                   value={detailForm.description}
//                   onChange={(e) => setDetailForm({ ...detailForm, description: e.target.value })}
//                   className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
//                 />
//               </div>

//               <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
//                 <button
//                   type="button"
//                   onClick={() => setIsDetailModalOpen(false)}
//                   className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow"
//                 >
//                   Save Detail
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default RcaSettings;