import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { 
  LayoutDashboard, Wrench, ClipboardList, FileText, ChevronDown, ChevronRight, Car,
  Settings, ShieldAlert, Calendar, Cpu, CheckSquare, Wrench as WrenchIcon, ClipboardCheck,
  LayoutGrid, Activity, Globe, Users, Layers, History, AlertTriangle, FileWarning, GitFork,
  AlertCircle, ChevronLeft, ChevronRight as ChevronRightIcon, BookOpen, Sun, Moon, HelpCircle
} from 'lucide-react';

interface SidebarProps {
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

export function Sidebar({ toggleTheme, isDarkMode = false }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState<boolean>(
    currentPath === '/daily-inspection' || currentPath === '/vehicles' || currentPath === '/component-history' || currentPath === '/maintenance-forecast'
  );
  const [isJobOrderOpen, setIsJobOrderOpen] = useState<boolean>(currentPath.startsWith('/job-orders'));
  const [isIncidentManagementOpen, setIsIncidentManagementOpen] = useState<boolean>(currentPath.startsWith('/incident-management'));
  const [isAppRegistryOpen, setIsAppRegistryOpen] = useState<boolean>(currentPath.startsWith('/global-settings'));
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState<boolean>(currentPath.startsWith('/settings'));
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(true);

  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    let isMounted = true;
    async function checkDbConnection() {
      try {
        const { error } = await supabase.from('vehicles').select('vehicle_id', { count: 'exact', head: true }).limit(1);
        if (error) throw error;
        if (isMounted) setDbStatus('connected');
      } catch {
        if (isMounted) setDbStatus('error');
      }
    }
    checkDbConnection();
    const interval = setInterval(checkDbConnection, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  return (
    <aside className={`relative bg-(--bg-surface) border-r border-(--border-main) flex flex-col h-screen select-none transition-all duration-300 ${isMinimized ? 'w-20' : 'w-64'}`}>
      {/* Edge Toggle Button */}
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        title={isMinimized ? "Expand Sidebar" : "Minimize Sidebar"}
        className="absolute -right-3.5 top-8 z-20 bg-(--bg-elevated) hover:bg-(--accent-subtle) text-(--text-secondary) border border-(--border-main) p-1.5 rounded-full shadow-md flex items-center justify-center transition-colors cursor-pointer"
      >
        {isMinimized ? <ChevronRightIcon className="w-3.5 h-3.5 text-(--text-primary)" /> : <ChevronLeft className="w-3.5 h-3.5 text-(--text-primary)" />}
      </button>

      {/* Brand Header */}
      <div className={`p-6 border-b border-(--border-main) flex items-center ${isMinimized ? 'justify-center p-4' : 'gap-3'}`}>
        <div className="p-2 bg-(--btn-primary-bg) text-(--btn-primary-text) rounded-xl shrink-0">
          <Car className="w-6 h-6" />
        </div>
        {!isMinimized && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="font-bold text-(--text-primary) tracking-tight text-base truncate">Product Name Here</h1>
            <p className="text-xs text-(--text-muted) truncate">Reliability-Centered MRO</p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
        {/* Dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-sm font-medium transition-all cursor-pointer ${
            currentPath === '/dashboard'
              ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) shadow-md shadow-black/10 font-semibold'
              : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          {!isMinimized && <span className="truncate">Dashboard</span>}
        </button>

        {/* Maintenance Plan Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => isMinimized ? (setIsMinimized(false), setIsMaintenanceOpen(true)) : setIsMaintenanceOpen(!isMaintenanceOpen)}
            className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--accent-subtle) transition-colors cursor-pointer`}
          >
            <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
              <Wrench className="w-4 h-4 text-(--text-primary) shrink-0" />
              {!isMinimized && <span className="truncate">Maintenance Plan</span>}
            </div>
            {!isMinimized && (isMaintenanceOpen ? <ChevronDown className="w-4 h-4 text-(--text-muted) shrink-0" /> : <ChevronRight className="w-4 h-4 text-(--text-muted) shrink-0" />)}
          </button>

          {isMaintenanceOpen && !isMinimized && (
            <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-(--border-main)">
              <button
                onClick={() => navigate('/daily-inspection')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/daily-inspection'
                    ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm'
                    : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Daily Inspection</span>
              </button>
              <button
                onClick={() => navigate('/vehicles')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/vehicles'
                    ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm'
                    : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Equipment PM Details</span>
              </button>
              <button
                onClick={() => navigate('/component-history')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/component-history'
                    ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm'
                    : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
                }`}
              >
                <History className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Component History</span>
              </button>
              <button
                onClick={() => navigate('/maintenance-forecast')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/maintenance-forecast'
                    ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm'
                    : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Maintenance Forecast</span>
              </button>
            </div>
          )}
        </div>

        {/* Job Order System Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => isMinimized ? (setIsMinimized(false), setIsJobOrderOpen(true)) : setIsJobOrderOpen(!isJobOrderOpen)}
            className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--accent-subtle) transition-colors cursor-pointer`}
          >
            <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
              <ClipboardCheck className="w-4 h-4 text-(--text-primary) shrink-0" />
              {!isMinimized && <span className="truncate">Job Order System</span>}
            </div>
            {!isMinimized && (isJobOrderOpen ? <ChevronDown className="w-4 h-4 text-(--text-muted) shrink-0" /> : <ChevronRight className="w-4 h-4 text-(--text-muted) shrink-0" />)}
          </button>

          {isJobOrderOpen && !isMinimized && (
            <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-(--border-main)">
              <button
                onClick={() => navigate('/job-orders/dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/job-orders/dashboard'
                    ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm'
                    : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Dashboard</span>
              </button>
              <button
                onClick={() => navigate('/job-orders')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/job-orders'
                    ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm'
                    : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
                }`}
              >
                <WrenchIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Job Order</span>
              </button>
            </div>
          )}
        </div>

        {/* Incident Management Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => isMinimized ? (setIsMinimized(false), setIsIncidentManagementOpen(true)) : setIsIncidentManagementOpen(!isIncidentManagementOpen)}
            className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--accent-subtle) transition-colors cursor-pointer`}
          >
            <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
              <AlertTriangle className="w-4 h-4 text-(--text-primary) shrink-0" />
              {!isMinimized && <span className="truncate">Incident Mgmt</span>}
            </div>
            {!isMinimized && (isIncidentManagementOpen ? <ChevronDown className="w-4 h-4 text-(--text-muted) shrink-0" /> : <ChevronRight className="w-4 h-4 text-(--text-muted) shrink-0" />)}
          </button>

          {isIncidentManagementOpen && !isMinimized && (
            <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-(--border-main)">
              <button
                onClick={() => navigate('/incident-management/incident-report')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/incident-management/incident-report'
                    ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm'
                    : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
                }`}
              >
                <FileWarning className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Incident Report</span>
              </button>
            </div>
          )}
        </div>

        {/* App Registry Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => isMinimized ? (setIsMinimized(false), setIsAppRegistryOpen(true)) : setIsAppRegistryOpen(!isAppRegistryOpen)}
            className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--accent-subtle) transition-colors cursor-pointer`}
          >
            <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
              <Globe className="w-4 h-4 text-(--text-primary) shrink-0" />
              {!isMinimized && <span className="truncate">App Registry</span>}
            </div>
            {!isMinimized && (isAppRegistryOpen ? <ChevronDown className="w-4 h-4 text-(--text-muted) shrink-0" /> : <ChevronRight className="w-4 h-4 text-(--text-muted) shrink-0" />)}
          </button>

          {isAppRegistryOpen && !isMinimized && (
            <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-(--border-main)">
              <button
                onClick={() => navigate('/global-settings/vehicle-registry')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/global-settings/vehicle-registry'
                    ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm'
                    : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
                }`}
              >
                <Car className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Equipment Registry</span>
              </button>
              <button
                onClick={() => navigate('/global-settings/employee-registry')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/global-settings/employee-registry'
                    ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm'
                    : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Employee Registry</span>
              </button>
              <button
                onClick={() => navigate('/global-settings/component-registry')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/global-settings/component-registry'
                    ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm'
                    : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Component Registry</span>
              </button>
            </div>
          )}
        </div>

        {/* App Settings Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => isMinimized ? (setIsMinimized(false), setIsAppSettingsOpen(true)) : setIsAppSettingsOpen(!isAppSettingsOpen)}
            className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--accent-subtle) transition-colors cursor-pointer`}
          >
            <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
              <Settings className="w-4 h-4 text-(--text-primary) shrink-0" />
              {!isMinimized && <span className="truncate">App Settings</span>}
            </div>
            {!isMinimized && (isAppSettingsOpen ? <ChevronDown className="w-4 h-4 text-(--text-muted) shrink-0" /> : <ChevronRight className="w-4 h-4 text-(--text-muted) shrink-0" />)}
          </button>

          {isAppSettingsOpen && !isMinimized && (
            <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-(--border-main)">
              <button onClick={() => navigate('/settings/service-standards')} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${currentPath === '/settings/service-standards' ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm' : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'}`}>
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Service Standards</span>
              </button>
              <button onClick={() => navigate('/settings/operations-standards')} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${currentPath === '/settings/operations-standards' ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm' : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'}`}>
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Operations Standards</span>
              </button>
              <button onClick={() => navigate('/settings/vehicle-models')} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${currentPath === '/settings/vehicle-models' ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm' : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'}`}>
                <Car className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Equipment Models</span>
              </button>
              <button onClick={() => navigate('/settings/system-components')} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${currentPath === '/settings/system-components' ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm' : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'}`}>
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">System & Components</span>
              </button>
              <button onClick={() => navigate('/settings/task-standards')} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${currentPath === '/settings/task-standards' ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm' : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'}`}>
                <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Task Standards</span>
              </button>
              <button onClick={() => navigate('/settings/job-order-config')} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${currentPath === '/settings/job-order-config' ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm' : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'}`}>
                <WrenchIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Job Order Config</span>
              </button>
              <button onClick={() => navigate('/settings/rca')} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${currentPath === '/settings/rca' ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm' : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'}`}>
                <GitFork className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">RCA</span>
              </button>
              <button onClick={() => navigate('/settings/fmea')} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${currentPath === '/settings/fmea' ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold shadow-sm' : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle)'}`}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">FMEA</span>
              </button>
            </div>
          )}
        </div>

        {/* Help Menu Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => isMinimized ? (setIsMinimized(false), setIsHelpOpen(true)) : setIsHelpOpen(!isHelpOpen)}
            className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--accent-subtle) transition-colors cursor-pointer`}
          >
            <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
              <HelpCircle className="w-4 h-4 text-(--text-primary) shrink-0" />
              {!isMinimized && <span className="truncate">Help</span>}
            </div>
            {!isMinimized && (isHelpOpen ? <ChevronDown className="w-4 h-4 text-(--text-muted) shrink-0" /> : <ChevronRight className="w-4 h-4 text-(--text-muted) shrink-0" />)}
          </button>

          {isHelpOpen && !isMinimized && (
            <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-(--border-main)">
              {toggleTheme && (
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle) transition-colors cursor-pointer"
                >
                  {isDarkMode ? <Sun className="w-3.5 h-3.5 shrink-0 text-amber-500" /> : <Moon className="w-3.5 h-3.5 shrink-0 text-slate-800" />}
                  <span className="truncate">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                </button>
              )}
                <button
                  onClick={() => window.open('/manual', '_blank')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-(--text-muted) hover:text-(--text-primary) hover:bg-(--accent-subtle) transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0 text-(--text-primary)" />
                  <span className="truncate">User Manual</span>
                </button>
            </div>
          )}
        </div>
      </nav>

      {/* Database Status Footer */}
      <div className="p-3 border-t border-(--border-main)">
        <div className="bg-(--bg-elevated) border border-(--border-main) rounded-lg p-2.5 flex items-center justify-center text-xs">
          {isMinimized ? (
            <div title={`Database Status: ${dbStatus}`}>
              {dbStatus === 'checking' && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse block" />}
              {dbStatus === 'connected' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] block" />}
              {dbStatus === 'error' && <span className="w-2.5 h-2.5 rounded-full bg-red-500 block" />}
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-(--text-muted) font-medium">Database Status</span>
              <div className="flex items-center gap-2">
                {dbStatus === 'checking' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-500 font-medium">Connecting...</span>
                  </>
                )}
                {dbStatus === 'connected' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Connected</span>
                  </>
                )}
                {dbStatus === 'error' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-red-600 dark:text-red-400 font-semibold">Offline</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;