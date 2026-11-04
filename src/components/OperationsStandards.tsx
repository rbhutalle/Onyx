import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Activity, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  X,
  Edit2,
  Trash2,
  Save,
  Loader2,
  MapPin,
  Fuel,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface OperationsStatusRecord {
  operations_id: string;
  status_name?: string;
  description?: string;
  [key: string]: unknown;
}

interface RouteRecord {
  route_id: string;
  route_code: string;
  route_name: string;
  origin: string;
  destination: string;
  distance_km: number;
  round_trip: boolean;
  terrain_type?: string;
  traffic_factor?: string;
  standard_fuel_liters: number;
  buffer_allowance_liters: number;
  max_authorized_liters?: number;
  is_active: boolean;
  [key: string]: unknown;
}

type TabType = 'statuses' | 'routes';

export function OperationsStandards() {
  const [activeTab, setActiveTab] = useState<TabType>('statuses');

  const [statuses, setStatuses] = useState<OperationsStatusRecord[]>([]);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  // Search filter state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Status Form State
  const [statusForm, setStatusForm] = useState({ 
    status_name: '', 
    description: '' 
  });

  // Route Form State
  const [routeForm, setRouteForm] = useState({
    route_code: '',
    route_name: '',
    origin: '',
    destination: '',
    distance_km: '',
    round_trip: false,
    terrain_type: 'FLAT',
    traffic_factor: 'HIGHWAY',
    standard_fuel_liters: '',
    buffer_allowance_liters: '',
    is_active: true
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [statusRes, routeRes] = await Promise.all([
        supabase.from('operations_status').select('*').order('status_name', { ascending: true }),
        supabase.from('routes').select('*').order('route_code', { ascending: true })
      ]);

      if (statusRes.error) throw statusRes.error;
      if (routeRes.error) throw routeRes.error;

      setStatuses(statusRes.data || []);
      setRoutes(routeRes.data || []);
    } catch {
      setErrorMsg('Failed to load operations standards data. Please check table permissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setCurrentPage(1);
        setSearchQuery('');
        loadData();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeTab, loadData]);

  // Reset pagination when search query changes
  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) setCurrentPage(1);
    });
    return () => { isMounted = false; };
  }, [searchQuery]);

  const handleOpenAdd = () => {
    setEditingId(null);
    if (activeTab === 'statuses') {
      setStatusForm({ status_name: '', description: '' });
    } else {
      setRouteForm({
        route_code: '',
        route_name: '',
        origin: '',
        destination: '',
        distance_km: '',
        round_trip: false,
        terrain_type: 'FLAT',
        traffic_factor: 'HIGHWAY',
        standard_fuel_liters: '',
        buffer_allowance_liters: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenEditStatus = (item: OperationsStatusRecord) => {
    setEditingId(item.operations_id);
    setStatusForm({
      status_name: item.status_name || '',
      description: item.description || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditRoute = (item: RouteRecord) => {
    setEditingId(item.route_id);
    setRouteForm({
      route_code: item.route_code || '',
      route_name: item.route_name || '',
      origin: item.origin || '',
      destination: item.destination || '',
      distance_km: item.distance_km !== undefined ? String(item.distance_km) : '',
      round_trip: item.round_trip ?? false,
      terrain_type: item.terrain_type || 'FLAT',
      traffic_factor: item.traffic_factor || 'HIGHWAY',
      standard_fuel_liters: item.standard_fuel_liters !== undefined ? String(item.standard_fuel_liters) : '',
      buffer_allowance_liters: item.buffer_allowance_liters !== undefined ? String(item.buffer_allowance_liters) : '',
      is_active: item.is_active ?? true
    });
    setIsModalOpen(true);
  };

  const handleDeleteStatus = async (id: string) => {
    if (!confirm('Are you sure you want to delete this operations standard?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('operations_status')
        .delete()
        .eq('operations_id', id);

      if (error) throw error;

      setSuccessMsg('Operations standard deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadData();
    } catch {
      setErrorMsg('Failed to delete record. Check foreign key constraints.');
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return;
    try {
      setErrorMsg(null);
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('route_id', id);

      if (error) throw error;

      setSuccessMsg('Route deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadData();
    } catch {
      setErrorMsg('Failed to delete route. Check foreign key constraints.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (activeTab === 'statuses') {
        if (!statusForm.status_name.trim()) {
          setErrorMsg('Status name is required.');
          setSubmitting(false);
          return;
        }

        const payload = { 
          status_name: statusForm.status_name.trim(), 
          description: statusForm.description.trim() || null 
        };

        if (editingId) {
          const { error } = await supabase
            .from('operations_status')
            .update(payload)
            .eq('operations_id', editingId);

          if (error) throw error;
          setSuccessMsg('Operations standard updated successfully!');
        } else {
          const { error } = await supabase
            .from('operations_status')
            .insert([payload]);

          if (error) throw error;
          setSuccessMsg('Operations standard created successfully!');
        }
      } else {
        if (!routeForm.route_code.trim() || !routeForm.route_name.trim() || !routeForm.origin.trim() || !routeForm.destination.trim() || !routeForm.distance_km) {
          setErrorMsg('Route code, name, origin, destination, and distance are required.');
          setSubmitting(false);
          return;
        }

        const payload = {
          route_code: routeForm.route_code.trim(),
          route_name: routeForm.route_name.trim(),
          origin: routeForm.origin.trim(),
          destination: routeForm.destination.trim(),
          distance_km: Number(routeForm.distance_km),
          round_trip: routeForm.round_trip,
          terrain_type: routeForm.terrain_type,
          traffic_factor: routeForm.traffic_factor,
          standard_fuel_liters: routeForm.standard_fuel_liters !== '' ? Number(routeForm.standard_fuel_liters) : 0,
          buffer_allowance_liters: routeForm.buffer_allowance_liters !== '' ? Number(routeForm.buffer_allowance_liters) : 0,
          is_active: routeForm.is_active
        };

        if (editingId) {
          const { error } = await supabase
            .from('routes')
            .update(payload)
            .eq('route_id', editingId);

          if (error) throw error;
          setSuccessMsg('Route updated successfully!');
        } else {
          const { error } = await supabase
            .from('routes')
            .insert([payload]);

          if (error) throw error;
          setSuccessMsg('Route created successfully!');
        }
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadData();
    } catch {
      setErrorMsg('Failed to save record. Please check required fields or schema constraints.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter computations
  const filteredStatuses = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return statuses.filter((s) => {
      const nameMatch = (s.status_name || '').toLowerCase().includes(q);
      const descMatch = (s.description || '').toLowerCase().includes(q);
      return nameMatch || descMatch;
    });
  }, [statuses, searchQuery]);

  const filteredRoutes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return routes.filter((r) => {
      const codeMatch = (r.route_code || '').toLowerCase().includes(q);
      const nameMatch = (r.route_name || '').toLowerCase().includes(q);
      const originMatch = (r.origin || '').toLowerCase().includes(q);
      const destMatch = (r.destination || '').toLowerCase().includes(q);
      return codeMatch || nameMatch || originMatch || destMatch;
    });
  }, [routes, searchQuery]);

  const paginatedList = useMemo(() => {
    const list = activeTab === 'statuses' ? filteredStatuses : filteredRoutes;
    const start = (currentPage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [activeTab, filteredStatuses, filteredRoutes, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    const totalLength = activeTab === 'statuses' ? filteredStatuses.length : filteredRoutes.length;
    return Math.ceil(totalLength / pageSize) || 1;
  }, [activeTab, filteredStatuses.length, filteredRoutes.length, pageSize]);

  const totalCurrentEntries = activeTab === 'statuses' ? filteredStatuses.length : filteredRoutes.length;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-(--border-main) pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-(--accent-subtle) text-(--text-primary) rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Operations Standards</h1>
            <p className="text-xs sm:text-sm text-(--text-muted)">Configure status definitions, route fuel metrics, and operations parameters.</p>
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
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Clean Tab Navigation */}
      <div className="shrink-0 flex border-b border-(--border-main) gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('statuses')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'statuses'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Operations Standards</span>
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'routes'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Routes</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-surface) border border-(--border-main) shadow-xs rounded-xl p-4 overflow-hidden space-y-3">
        <div className="shrink-0 flex flex-wrap items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-(--text-muted)" />
            <input
              type="text"
              placeholder={activeTab === 'statuses' ? 'Filter standards...' : 'Search by Route Code, Name, Origin or Destination...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-(--text-primary)"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{activeTab === 'statuses' ? 'Add Standard' : 'Add Route'}</span>
          </button>
        </div>

        {/* Scrollable Container with Sticky Table Headers */}
        <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
          {loading ? (
            <div className="h-full flex items-center justify-center text-(--text-muted) gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-(--text-primary)" />
              <span>Loading records...</span>
            </div>
          ) : activeTab === 'statuses' ? (
            filteredStatuses.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8 text-center text-(--text-muted) text-xs">
                No operations standards found. Click &quot;Add Standard&quot; above.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                    <th className="py-2 px-3">Status Name</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {paginatedList.map((item) => {
                    const statusRec = item as OperationsStatusRecord;
                    return (
                      <tr key={statusRec.operations_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="py-2 px-3 font-semibold text-(--text-primary)">
                          <span className="inline-block px-2 py-0.5 bg-(--accent-subtle) text-(--text-primary) border border-(--border-main) rounded text-xs font-semibold">
                            {statusRec.status_name || 'N/A'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-(--text-muted)">{statusRec.description || '—'}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditStatus(statusRec)}
                              className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStatus(statusRec.operations_id)}
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
            )
          ) : (
            filteredRoutes.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8 text-center text-(--text-muted) text-xs">
                No matching routes found. Click &quot;Add Route&quot; above.
              </div>
            ) : (
              <table className="w-full min-w-187.5 text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border-main) text-(--text-muted) uppercase bg-(--accent-subtle) sticky top-0 z-10 shadow-xs">
                    <th className="py-2 px-3">Route Code / Name</th>
                    <th className="py-2 px-3">Origin & Destination</th>
                    <th className="py-2 px-3">Distance</th>
                    <th className="py-2 px-3">Fuel Standards</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                  {paginatedList.map((item) => {
                    const route = item as RouteRecord;
                    return (
                      <tr key={route.route_id} className="hover:bg-(--accent-subtle) transition-colors">
                        <td className="py-2 px-3">
                          <div className="font-semibold text-(--text-primary)">{route.route_name}</div>
                          <div className="text-[10px] font-mono text-(--text-muted)">{route.route_code}</div>
                        </td>
                        <td className="py-2 px-3 text-xs">
                          <span className="font-medium text-(--text-primary)">{route.origin}</span>
                          <span className="mx-1.5 text-(--text-muted)">→</span>
                          <span className="font-medium text-(--text-primary)">{route.destination}</span>
                        </td>
                        <td className="py-2 px-3 font-mono">{route.distance_km} km</td>
                        <td className="py-2 px-3 font-mono text-xs">
                          <div className="text-(--text-primary)">Std: {route.standard_fuel_liters}L</div>
                          <div className="text-(--text-muted) text-[10px]">Buf: {route.buffer_allowance_liters}L</div>
                          <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Max: {route.max_authorized_liters ?? (Number(route.standard_fuel_liters || 0) + Number(route.buffer_allowance_liters || 0))}L</div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="text-(--text-primary) font-medium">{route.terrain_type}</div>
                          <div className="text-(--text-muted) text-[10px]">{route.traffic_factor}</div>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${route.is_active ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-(--accent-subtle) text-(--text-muted) border border-(--border-main)'}`}>
                            {route.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditRoute(route)}
                              className="text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRoute(route.route_id)}
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
            )
          )}
        </div>

        {/* Pagination */}
        {!loading && totalCurrentEntries > 0 && (
          <div className="shrink-0 flex items-center justify-between pt-2 text-xs text-(--text-muted)">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCurrentEntries)} of {totalCurrentEntries} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 bg-(--bg-elevated) border border-(--border-main) rounded hover:opacity-80 disabled:opacity-40 cursor-pointer text-(--text-primary)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="p-1 bg-(--bg-elevated) border border-(--border-main) rounded hover:opacity-80 disabled:opacity-40 cursor-pointer text-(--text-primary)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-3 shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">
                {editingId 
                  ? (activeTab === 'statuses' ? 'Edit Operations Standard' : 'Edit Route') 
                  : (activeTab === 'statuses' ? 'Add Operations Standard' : 'Add Route')}
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
                {activeTab === 'statuses' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                        Status Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={statusForm.status_name}
                        onChange={(e) => setStatusForm({ ...statusForm, status_name: e.target.value })}
                        placeholder="e.g. Active, Standby, Maintenance..."
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--text-primary) mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={statusForm.description}
                        onChange={(e) => setStatusForm({ ...statusForm, description: e.target.value })}
                        placeholder="Optional details or operational context..."
                        className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                          Route Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={routeForm.route_code}
                          onChange={(e) => setRouteForm({ ...routeForm, route_code: e.target.value })}
                          placeholder="e.g. RT-001"
                          className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                          Route Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={routeForm.route_name}
                          onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })}
                          placeholder="e.g. North Express Line"
                          className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                          Origin <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={routeForm.origin}
                          onChange={(e) => setRouteForm({ ...routeForm, origin: e.target.value })}
                          placeholder="Origin terminal/city"
                          className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                          Destination <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={routeForm.destination}
                          onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                          placeholder="Destination terminal/city"
                          className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-(--text-primary) mb-1">
                          Distance (km) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={routeForm.distance_km}
                          onChange={(e) => setRouteForm({ ...routeForm, distance_km: e.target.value })}
                          placeholder="e.g. 150.50"
                          className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary) font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-(--text-primary) mb-1">Terrain Type</label>
                        <input
                          type="text"
                          value={routeForm.terrain_type}
                          onChange={(e) => setRouteForm({ ...routeForm, terrain_type: e.target.value })}
                          placeholder="e.g. FLAT, HILLY"
                          className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-(--text-primary) mb-1">Traffic Factor</label>
                        <input
                          type="text"
                          value={routeForm.traffic_factor}
                          onChange={(e) => setRouteForm({ ...routeForm, traffic_factor: e.target.value })}
                          placeholder="e.g. HIGHWAY, URBAN"
                          className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-(--text-primary)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-(--accent-subtle) p-3 rounded-xl border border-(--border-main)">
                      <div>
                        <label className="block text-xs font-semibold text-(--text-primary) mb-1">Standard Fuel (L)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={routeForm.standard_fuel_liters}
                          onChange={(e) => setRouteForm({ ...routeForm, standard_fuel_liters: e.target.value })}
                          placeholder="0.00"
                          className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary) font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-(--text-primary) mb-1">Buffer Fuel (L)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={routeForm.buffer_allowance_liters}
                          onChange={(e) => setRouteForm({ ...routeForm, buffer_allowance_liters: e.target.value })}
                          placeholder="0.00"
                          className="w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-(--text-primary) font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-(--text-primary) mb-1">Max Authorized (L)</label>
                        <div className="bg-(--bg-elevated) border border-(--border-main) rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                          <Fuel className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                          {(Number(routeForm.standard_fuel_liters || 0) + Number(routeForm.buffer_allowance_liters || 0)).toFixed(2)} L
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={routeForm.round_trip}
                          onChange={(e) => setRouteForm({ ...routeForm, round_trip: e.target.checked })}
                          className="rounded bg-(--bg-elevated) border border-(--border-main) text-(--btn-primary-bg) focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-(--text-primary)">Round Trip</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={routeForm.is_active}
                          onChange={(e) => setRouteForm({ ...routeForm, is_active: e.target.checked })}
                          className="rounded bg-(--bg-elevated) border border-(--border-main) text-(--btn-primary-bg) focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-(--text-primary)">Is Active</span>
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--border-main) shrink-0 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-(--accent-subtle) text-(--text-primary) hover:opacity-80 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingId ? (activeTab === 'statuses' ? 'Update Standard' : 'Update Route') : (activeTab === 'statuses' ? 'Save Standard' : 'Save Route')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OperationsStandards;