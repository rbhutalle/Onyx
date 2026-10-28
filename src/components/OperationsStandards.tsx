import { useState, useEffect } from 'react';
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
  Search
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

export function OperationsStandards() {
  const [activeTab, setActiveTab] = useState<'statuses' | 'routes'>('statuses');

  const [statuses, setStatuses] = useState<OperationsStatusRecord[]>([]);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);

  // Search filter state for Routes tab
  const [routeSearchQuery, setRouteSearchQuery] = useState<string>('');

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

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setErrorMsg(null);
        const [statusRes, routeRes] = await Promise.all([
          supabase.from('operations_status').select('*').order('status_name', { ascending: true }),
          supabase.from('routes').select('*').order('route_code', { ascending: true })
        ]);

        if (statusRes.error) throw statusRes.error;
        if (routeRes.error) throw routeRes.error;

        if (isMounted) {
          setStatuses(statusRes.data || []);
          setRoutes(routeRes.data || []);
        }
      } catch {
        if (isMounted) {
          setErrorMsg('Failed to load operations standards data. Please check table permissions.');
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('operations_status')
        .select('*')
        .order('status_name', { ascending: true });

      if (error) throw error;
      setStatuses(data || []);
    } catch {
      // Ignored
    }
  };

  const refreshRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('route_code', { ascending: true });

      if (error) throw error;
      setRoutes(data || []);
    } catch {
      // Ignored
    }
  };

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
      refreshStatuses();
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
      refreshRoutes();
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
        refreshStatuses();
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
        refreshRoutes();
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      setErrorMsg('Failed to save record. Please check required fields or schema constraints.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter routes based on search query matching route_code or route_name
  const filteredRoutes = routes.filter((r) => {
    const q = routeSearchQuery.toLowerCase();
    const codeMatch = (r.route_code || '').toLowerCase().includes(q);
    const nameMatch = (r.route_name || '').toLowerCase().includes(q);
    return codeMatch || nameMatch;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 border-b border-(--border-main) pb-4">
        <div className="p-2.5 bg-(--btn-primary-bg) text-(--btn-primary-text) rounded-xl">
          <Activity className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Operations Standards</h1>
          <p className="text-xs sm:text-sm text-(--text-muted)">Configure status definitions, route fuel metrics, and operations parameters.</p>
        </div>
      </div>

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

      {/* Clean Tab Navigation */}
      <div className="shrink-0 flex border-b border-(--border-main) gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('statuses')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'statuses'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Operations Standards ({statuses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'routes'
              ? 'border-(--text-primary) text-(--text-primary) bg-(--accent-subtle)'
              : 'border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Routes ({routes.length})</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-(--bg-elevated) border border-(--border-main) shadow-xs rounded-xl p-6 space-y-4">
        {/* Toolbar / Actions */}
        <div className="shrink-0 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          {activeTab === 'routes' ? (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-(--text-muted)" />
              <input
                type="text"
                placeholder="Search by Route Code or Route Name..."
                value={routeSearchQuery}
                onChange={(e) => setRouteSearchQuery(e.target.value)}
                className="w-full bg-(--bg-surface) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) pl-9 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:border-(--text-primary)"
              />
            </div>
          ) : (
            <div></div>
          )}

          <button
            onClick={handleOpenAdd}
            className="bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'statuses' ? 'Add Standard' : 'Add Route'}</span>
          </button>
        </div>

        {/* Scrollable Container with Sticky Table Headers */}
        <div className="flex-1 min-h-0 overflow-auto border border-(--border-main) rounded-lg bg-(--bg-elevated)">
          {activeTab === 'statuses' ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-(--border-main) text-(--text-muted) text-xs uppercase bg-(--bg-surface) sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Status Name</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                {statuses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-(--text-muted)">No operations standards found.</td>
                  </tr>
                ) : (
                  statuses.map((item) => (
                    <tr key={item.operations_id} className="hover:bg-(--accent-subtle) transition-colors">
                      <td className="p-3 font-semibold text-(--text-primary)">
                        <span className="inline-block px-2.5 py-1 bg-(--accent-subtle) text-(--text-primary) border border-(--border-main) rounded-lg text-xs font-semibold">
                          {item.status_name || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 text-(--text-muted)">{item.description || '—'}</td>
                      <td className="p-3 text-right space-x-3">
                        <button
                          onClick={() => handleOpenEditStatus(item)}
                          className="text-xs text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStatus(item.operations_id)}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-(--border-main) text-(--text-muted) text-xs uppercase bg-(--bg-surface) sticky top-0 z-10 shadow-xs">
                  <th className="p-3">Route Code / Name</th>
                  <th className="p-3">Origin & Destination</th>
                  <th className="p-3">Distance (km)</th>
                  <th className="p-3">Fuel Standards (L)</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border-main) text-(--text-secondary)">
                {filteredRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-(--text-muted)">No matching routes found.</td>
                  </tr>
                ) : (
                  filteredRoutes.map((item) => (
                    <tr key={item.route_id} className="hover:bg-(--accent-subtle) transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-(--text-primary)">{item.route_name}</div>
                        <div className="text-xs font-mono text-(--text-muted)">{item.route_code}</div>
                      </td>
                      <td className="p-3 text-xs">
                        <span className="font-medium text-(--text-primary)">{item.origin}</span>
                        <span className="mx-1.5 text-(--text-muted)">→</span>
                        <span className="font-medium text-(--text-primary)">{item.destination}</span>
                      </td>
                      <td className="p-3 font-mono text-xs">{item.distance_km} km</td>
                      <td className="p-3 text-xs font-mono">
                        <div className="text-(--text-primary)">Std: {item.standard_fuel_liters}L</div>
                        <div className="text-(--text-muted) text-[11px]">Buffer: {item.buffer_allowance_liters}L</div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Max: {item.max_authorized_liters ?? (Number(item.standard_fuel_liters || 0) + Number(item.buffer_allowance_liters || 0))}L</div>
                      </td>
                      <td className="p-3 text-xs">
                        <div className="text-(--text-primary) font-medium">{item.terrain_type}</div>
                        <div className="text-(--text-muted) text-[11px]">{item.traffic_factor}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${item.is_active ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-(--accent-subtle) text-(--text-muted) border border-(--border-main)'}`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-3">
                        <button
                          onClick={() => handleOpenEditRoute(item)}
                          className="text-xs text-(--text-primary) hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRoute(item.route_id)}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-(--border-main) pb-4 shrink-0">
              <h3 className="text-lg font-bold text-(--text-primary)">
                {editingId 
                  ? (activeTab === 'statuses' ? 'Edit Operations Standard' : 'Edit Route') 
                  : (activeTab === 'statuses' ? 'Add Operations Standard' : 'Add Route')}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto space-y-4 p-1 flex-1">
                {activeTab === 'statuses' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Status Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={statusForm.status_name}
                        onChange={(e) => setStatusForm({ ...statusForm, status_name: e.target.value })}
                        placeholder="e.g. Active, Standby, Maintenance..."
                        className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2.5 text-sm focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={statusForm.description}
                        onChange={(e) => setStatusForm({ ...statusForm, description: e.target.value })}
                        placeholder="Optional details or operational context..."
                        className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2.5 text-sm focus:outline-none focus:border-(--text-primary)"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Route Code <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={routeForm.route_code}
                          onChange={(e) => setRouteForm({ ...routeForm, route_code: e.target.value })}
                          placeholder="e.g. RT-001"
                          className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2 text-sm focus:outline-none focus:border-(--text-primary) font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Route Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={routeForm.route_name}
                          onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })}
                          placeholder="e.g. North Express Line"
                          className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2 text-sm focus:outline-none focus:border-(--text-primary)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Origin <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={routeForm.origin}
                          onChange={(e) => setRouteForm({ ...routeForm, origin: e.target.value })}
                          placeholder="Origin terminal/city"
                          className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2 text-sm focus:outline-none focus:border-(--text-primary)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Destination <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={routeForm.destination}
                          onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                          placeholder="Destination terminal/city"
                          className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2 text-sm focus:outline-none focus:border-(--text-primary)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Distance (km) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={routeForm.distance_km}
                          onChange={(e) => setRouteForm({ ...routeForm, distance_km: e.target.value })}
                          placeholder="e.g. 150.50"
                          className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2 text-sm focus:outline-none focus:border-(--text-primary) font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Terrain Type</label>
                        <input
                          type="text"
                          value={routeForm.terrain_type}
                          onChange={(e) => setRouteForm({ ...routeForm, terrain_type: e.target.value })}
                          placeholder="e.g. FLAT, HILLY"
                          className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2 text-sm focus:outline-none focus:border-(--text-primary)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Traffic Factor</label>
                        <input
                          type="text"
                          value={routeForm.traffic_factor}
                          onChange={(e) => setRouteForm({ ...routeForm, traffic_factor: e.target.value })}
                          placeholder="e.g. HIGHWAY, URBAN"
                          className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3.5 py-2 text-sm focus:outline-none focus:border-(--text-primary)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-(--accent-subtle) p-3.5 rounded-xl border border-(--border-main)">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Standard Fuel (L)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={routeForm.standard_fuel_liters}
                          onChange={(e) => setRouteForm({ ...routeForm, standard_fuel_liters: e.target.value })}
                          placeholder="0.00"
                          className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3 py-1.5 text-sm focus:outline-none focus:border-(--text-primary) font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Buffer Fuel (L)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={routeForm.buffer_allowance_liters}
                          onChange={(e) => setRouteForm({ ...routeForm, buffer_allowance_liters: e.target.value })}
                          placeholder="0.00"
                          className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) placeholder:text-(--text-muted) rounded-lg w-full px-3 py-1.5 text-sm focus:outline-none focus:border-(--text-primary) font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-(--text-muted) mb-1">Max Authorized (L)</label>
                        <div className="bg-(--bg-elevated) border border-(--border-main) rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                          <Fuel className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                          {(Number(routeForm.standard_fuel_liters || 0) + Number(routeForm.buffer_allowance_liters || 0)).toFixed(2)} L
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={routeForm.round_trip}
                          onChange={(e) => setRouteForm({ ...routeForm, round_trip: e.target.checked })}
                          className="rounded border-(--border-main) bg-(--bg-elevated) text-(--text-primary) focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-(--text-primary)">Round Trip</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={routeForm.is_active}
                          onChange={(e) => setRouteForm({ ...routeForm, is_active: e.target.checked })}
                          className="rounded border-(--border-main) bg-(--bg-elevated) text-(--text-primary) focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-(--text-primary)">Is Active</span>
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-(--border-main) shrink-0 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-(--accent-subtle) hover:opacity-80 text-(--text-primary) rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-(--btn-primary-bg) hover:bg-(--btn-hover-bg) text-(--btn-primary-text) rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow disabled:opacity-50"
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