import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { 
  LayoutDashboard, 
  Wrench, 
  ClipboardList, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  Car,
  Settings,
  ShieldAlert,
  Calendar,
  Cpu,
  CheckSquare,
  Wrench as WrenchIcon,
  ClipboardCheck,
  LayoutGrid,
  Activity,
  Globe,
  Users,
  Layers
} from 'lucide-react';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState<boolean>(
    currentPath === '/daily-inspection' || 
    currentPath === '/vehicles' || 
    currentPath === '/maintenance-forecast'
  );

  const [isJobOrderOpen, setIsJobOrderOpen] = useState<boolean>(
    currentPath.startsWith('/job-orders')
  );

  const [isAppRegistryOpen, setIsAppRegistryOpen] = useState<boolean>(
    currentPath.startsWith('/global-settings')
  );

  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState<boolean>(
    currentPath.startsWith('/settings')
  );

  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    let isMounted = true;

    async function checkDbConnection() {
      try {
        const { error } = await supabase
          .from('vehicles')
          .select('vehicle_id', { count: 'exact', head: true })
          .limit(1);

        if (error) throw error;
        if (isMounted) setDbStatus('connected');
      } catch (err) {
        console.error('Database connection heartbeat failed:', err);
        if (isMounted) setDbStatus('error');
      }
    }

    checkDbConnection();
    const interval = setInterval(checkDbConnection, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen select-none">
      {/* Brand / Logo Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
          <Car className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 tracking-tight text-base">Fleet Management</h1>
          <p className="text-xs text-slate-400">Operations Portal</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <button
          onClick={() => navigate('/')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
            currentPath === '/'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        {/* Maintenance Plan Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => setIsMaintenanceOpen(!isMaintenanceOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Wrench className="w-4 h-4 text-blue-400" />
              <span>Maintenance Plan</span>
            </div>
            {isMaintenanceOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {isMaintenanceOpen && (
            <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-slate-800">
              <button
                onClick={() => navigate('/daily-inspection')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/daily-inspection'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Daily Inspection</span>
              </button>

              <button
                onClick={() => navigate('/vehicles')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/vehicles'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Equipment PM Details</span>
              </button>

              <button
                onClick={() => navigate('/maintenance-forecast')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/maintenance-forecast'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Maintenance Forecast</span>
              </button>
            </div>
          )}
        </div>

        {/* Job Order System Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => setIsJobOrderOpen(!isJobOrderOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-4 h-4 text-blue-400" />
              <span>Job Order System</span>
            </div>
            {isJobOrderOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {isJobOrderOpen && (
            <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-slate-800">
              <button
                onClick={() => navigate('/job-orders/dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/job-orders/dashboard'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => navigate('/job-orders')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/job-orders'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <WrenchIcon className="w-3.5 h-3.5" />
                <span>Job Order</span>
              </button>
            </div>
          )}
        </div>

        {/* App Registry Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => setIsAppRegistryOpen(!isAppRegistryOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>App Registry</span>
            </div>
            {isAppRegistryOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {isAppRegistryOpen && (
            <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-slate-800">
              <button
                onClick={() => navigate('/global-settings/vehicle-registry')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/global-settings/vehicle-registry'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Equipment Registry</span>
              </button>

              <button
                onClick={() => navigate('/global-settings/employee-registry')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/global-settings/employee-registry'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Employee Registry</span>
              </button>

              <button
                onClick={() => navigate('/global-settings/component-registry')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/global-settings/component-registry'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Component Registry</span>
              </button>
            </div>
          )}
        </div>

        {/* App Settings Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => setIsAppSettingsOpen(!isAppSettingsOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-blue-400" />
              <span>App Settings</span>
            </div>
            {isAppSettingsOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {isAppSettingsOpen && (
            <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-slate-800">
              <button
                onClick={() => navigate('/settings/service-standards')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/settings/service-standards'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Service Standards</span>
              </button>

              <button
                onClick={() => navigate('/settings/operations-standards')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/settings/operations-standards'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Operations Standards</span>
              </button>

              <button
                onClick={() => navigate('/settings/vehicle-models')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/settings/vehicle-models'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Equipment Models</span>
              </button>

              <button
                onClick={() => navigate('/settings/system-components')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/settings/system-components'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>System & Components</span>
              </button>

              <button
                onClick={() => navigate('/settings/task-standards')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/settings/task-standards'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Task Standards</span>
              </button>

              <button
                onClick={() => navigate('/settings/job-order-config')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/settings/job-order-config'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <WrenchIcon className="w-3.5 h-3.5" />
                <span>Job Order Config</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Database Status Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Database Status</span>
          <div className="flex items-center gap-2">
            {dbStatus === 'checking' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400">Connecting...</span>
              </>
            )}
            {dbStatus === 'connected' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                <span className="text-emerald-400 font-semibold">Connected</span>
              </>
            )}
            {dbStatus === 'error' && (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-400 font-semibold">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;