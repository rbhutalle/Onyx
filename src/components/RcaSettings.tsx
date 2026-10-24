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
    } catch {
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
    } catch {
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
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 border-b border-(--border-main) pb-4">
        <div className="p-2.5 bg-(--btn-primary-bg) text-(--btn-primary-text) rounded-xl">
          <GitFork className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Root Cause Analysis (RCA) Settings</h1>
          <p className="text-xs sm:text-sm text-(--text-muted)">Configure master categories and detail breakdowns for incident classification.</p>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="shrink-0 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="shrink-0 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Category Tabs */}
      <div className="shrink-0 flex gap-2 border-b border-(--border-main) overflow-x-auto">
        <button
          onClick={() => { setActiveTab('conditions'); setActiveSubTab('categories'); }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'conditions'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Unsafe Conditions</span>
        </button>

        <button
          onClick={() => { setActiveTab('acts'); setActiveSubTab('categories'); }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'acts'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Unsafe Acts</span>
        </button>

        <button
          onClick={() => { setActiveTab('factors'); setActiveSubTab('categories'); }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'factors'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Personal Factors</span>
        </button>

        <button
          onClick={() => { setActiveTab('causes'); setActiveSubTab('categories'); }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'causes'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Work Related Causes</span>
        </button>
      </div>

      {/* Main Container Body with Sub-Tabs */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-elevated) border border-(--border-main) shadow-xs rounded-xl p-6 overflow-hidden space-y-4">
        {/* Sub-Tab Navigation Bar */}
        <div className="shrink-0 flex items-center justify-between border-b border-(--border-main) pb-3">
          <div className="flex bg-(--bg-surface) p-1 rounded-lg border border-(--border-main) gap-1">
            <button
              onClick={() => setActiveSubTab('categories')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'categories' ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) shadow' : 'text-(--text-muted) hover:text-(--text-primary)'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Categories ({currentConfig.label})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('details')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'details' ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) shadow' : 'text-(--text-muted) hover:text-(--text-primary)'
              }`}
            >
              <ListTree className="w-3.5 h-3.5" />
              <span>Detail Breakdowns ({detailList.length})</span>
            </button>
          </div>
        </div>

        {/* SUB-TAB 1: CATEGORIES (MASTER TABLE) */}
        {activeSubTab === 'categories' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            <div className="shrink-0 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-(--text-muted)" />
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={masterSearch}
                  onChange={(e) => setMasterSearch(e.target.value)}
                  className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) pl-9 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:border-(--text-primary)"
                />
              </div>
              <button
                onClick={() => {
                  setMasterEditingId(null);
                  setMasterForm({ code: '', description: '' });
                  setIsMasterModalOpen(true);
                }}
                className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
              {loadingMaster ? (
                <div className="h-full flex items-center justify-center text-(--text-muted) gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-(--text-primary)" />
                  <span>Loading categories...</span>
                </div>
              ) : filteredMasterList.length === 0 ? (
                <div className="h-full flex items-center justify-center p-8 text-center text-(--text-muted) text-sm">
                  No categories found. Click &quot;Add Category&quot; above.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-(--border-main) text-(--text-muted) text-xs uppercase bg-(--bg-surface) sticky top-0 z-10 shadow-xs">
                      <th className="p-3 w-32">Code</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                    {filteredMasterList.map((item) => (
                      <tr key={item.id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="p-3 font-mono font-bold text-(--text-primary)">{item.code}</td>
                        <td className="p-3 text-(--text-primary)">{item.description}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => {
                                setMasterEditingId(item.id);
                                setMasterForm({ code: item.code, description: item.description });
                                setIsMasterModalOpen(true);
                              }}
                              className="text-xs text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMaster(item.id)}
                              className="text-xs text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
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
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            <div className="shrink-0 flex gap-2 flex-wrap sm:flex-nowrap items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-(--text-muted)" />
                <input
                  type="text"
                  placeholder="Filter detail items..."
                  value={detailSearch}
                  onChange={(e) => setDetailSearch(e.target.value)}
                  className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) pl-9 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:border-(--text-primary)"
                />
              </div>
              <div className="w-full sm:w-64">
                <select
                  value={detailFilterParentId}
                  onChange={(e) => setDetailFilterParentId(e.target.value)}
                  className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) cursor-pointer"
                >
                  <option value="">All Categories (Filter)</option>
                  {masterList.map(m => (
                    <option key={m.id} value={m.id}>{m.code} - {m.description}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleOpenAddDetail}
                className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Detail Item</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
              {loadingDetail ? (
                <div className="h-full flex items-center justify-center text-(--text-muted) gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-(--text-primary)" />
                  <span>Loading detail items...</span>
                </div>
              ) : filteredDetailList.length === 0 ? (
                <div className="h-full flex items-center justify-center p-8 text-center text-(--text-muted) text-sm">
                  No detail items found. Click &quot;Add Detail Item&quot; above.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-(--border-main) text-(--text-muted) text-xs uppercase bg-(--bg-surface) sticky top-0 z-10 shadow-xs">
                      <th className="p-3 w-36">Detail Code</th>
                      <th className="p-3">Parent Category</th>
                      <th className="p-3">Detail Description</th>
                      <th className="p-3 text-right w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                    {filteredDetailList.map((item) => {
                      const parentCat = masterList.find(m => m.id === item.parentId);
                      return (
                        <tr key={item.id} className="hover:bg-(--accent-subtle) transition-colors">
                          <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">{item.code}</td>
                          <td className="p-3 text-(--text-muted) font-mono text-xs">{parentCat ? `${parentCat.code} - ${parentCat.description}` : '—'}</td>
                          <td className="p-3 text-(--text-primary)">{item.description}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleOpenEditDetail(item)}
                                className="text-xs text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDetail(item.id)}
                                className="text-xs text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] flex flex-col space-y-6">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-4 shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">
                {masterEditingId ? 'Edit Category' : 'Add Category'} ({currentConfig.label})
              </h3>
              <button
                onClick={() => setIsMasterModalOpen(false)}
                className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaster} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A1 or COND-01"
                    value={masterForm.code}
                    onChange={(e) => setMasterForm({ ...masterForm, code: e.target.value })}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-(--text-primary)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter category description..."
                    value={masterForm.description}
                    onChange={(e) => setMasterForm({ ...masterForm, description: e.target.value })}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-(--text-primary)"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border-main) shrink-0 mt-4">
                <button
                  type="button"
                  onClick={() => setIsMasterModalOpen(false)}
                  className="px-4 py-2 bg-(--accent-subtle) hover:opacity-80 text-(--text-primary) rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] flex flex-col space-y-6">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-4 shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">
                {detailEditingId ? 'Edit Detail Item' : 'Add Detail Item'}
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetail} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">
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
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-(--text-primary)"
                  >
                    <option value="">Select Parent Category...</option>
                    {masterList.map(m => (
                      <option key={m.id} value={m.id}>{m.code} - {m.description}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">
                    Detail Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A1-001"
                    value={detailForm.code}
                    onChange={handleDetailCodeChange}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-(--text-primary)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">
                    Detail Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter specific breakdown description..."
                    value={detailForm.description}
                    onChange={(e) => setDetailForm({ ...detailForm, description: e.target.value })}
                    className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-(--text-primary)"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border-main) shrink-0 mt-4">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-(--accent-subtle) hover:opacity-80 text-(--text-primary) rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold cursor-pointer shadow"
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