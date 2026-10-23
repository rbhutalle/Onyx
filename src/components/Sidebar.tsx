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
  Layers,
  History,
  AlertTriangle,
  FileWarning,
  GitFork,
  AlertCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  BookOpen,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';

interface SidebarProps {
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

export function Sidebar({ toggleTheme, isDarkMode = true }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState<boolean>(
    currentPath === '/daily-inspection' || 
    currentPath === '/vehicles' || 
    currentPath === '/component-history' ||
    currentPath === '/maintenance-forecast'
  );

  const [isJobOrderOpen, setIsJobOrderOpen] = useState<boolean>(
    currentPath.startsWith('/job-orders')
  );

  const [isIncidentManagementOpen, setIsIncidentManagementOpen] = useState<boolean>(
    currentPath.startsWith('/incident-management')
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
    <aside className={`relative bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen select-none transition-all duration-300 ${isMinimized ? 'w-20' : 'w-64'}`}>
      {/* Edge Floating Minimize / Expand Button */}
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        title={isMinimized ? "Expand Sidebar" : "Minimize Sidebar"}
        className="absolute -right-3.5 top-8 z-20 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 p-1.5 rounded-full shadow-lg flex items-center justify-center transition-colors cursor-pointer"
      >
        {isMinimized ? (
          <ChevronRightIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        )}
      </button>

      {/* Brand / Logo Header */}
      <div className={`p-6 border-b border-slate-200 dark:border-slate-800 flex items-center ${isMinimized ? 'justify-center p-4' : 'gap-3'}`}>
        <div className="p-2 bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
          <Car className="w-6 h-6" />
        </div>
        {!isMinimized && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="font-bold text-slate-900 dark:text-slate-100 tracking-tight text-base truncate">Product Name Here</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Reliability-Centered MRO</p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
        {/* Dashboard */}
        <button
          onClick={() => navigate('/')}
          title={isMinimized ? "Dashboard" : undefined}
          className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-sm font-medium transition-colors cursor-pointer ${
            currentPath === '/'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          {!isMinimized && <span className="truncate">Dashboard</span>}
        </button>

        {/* Maintenance Plan Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => {
              if (isMinimized) {
                setIsMinimized(false);
                setIsMaintenanceOpen(true);
              } else {
                setIsMaintenanceOpen(!isMaintenanceOpen);
              }
            }}
            title={isMinimized ? "Maintenance Plan" : undefined}
            className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer`}
          >
            <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
              <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              {!isMinimized && <span className="truncate">Maintenance Plan</span>}
            </div>
            {!isMinimized && (
              isMaintenanceOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              )
            )}
          </button>

          {isMaintenanceOpen && !isMinimized && (
            <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => navigate('/daily-inspection')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/daily-inspection'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Daily Inspection</span>
              </button>

              <button
                onClick={() => navigate('/vehicles')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/vehicles'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Equipment PM Details</span>
              </button>

              <button
                onClick={() => navigate('/component-history')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/component-history'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <History className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Component History</span>
              </button>

              <button
                onClick={() => navigate('/maintenance-forecast')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/maintenance-forecast'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
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
            onClick={() => {
              if (isMinimized) {
                setIsMinimized(false);
                setIsJobOrderOpen(true);
              } else {
                setIsJobOrderOpen(!isJobOrderOpen);
              }
            }}
            title={isMinimized ? "Job Order System" : undefined}
            className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer`}
          >
            <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
              <ClipboardCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              {!isMinimized && <span className="truncate">Job Order System</span>}
            </div>
            {!isMinimized && (
              isJobOrderOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              )
            )}
          </button>

          {isJobOrderOpen && !isMinimized && (
            <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => navigate('/job-orders/dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/job-orders/dashboard'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Dashboard</span>
              </button>

              <button
                onClick={() => navigate('/job-orders')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/job-orders'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
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
            onClick={() => {
              if (isMinimized) {
                setIsMinimized(false);
                setIsIncidentManagementOpen(true);
              } else {
                setIsIncidentManagementOpen(!isIncidentManagementOpen);
              }
            }}
            title={isMinimized ? "Incident Mgmt" : undefined}
            className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer`}
          >
            <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
              <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              {!isMinimized && <span className="truncate">Incident Mgmt</span>}
            </div>
            {!isMinimized && (
              isIncidentManagementOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              )
            )}
          </button>

          {isIncidentManagementOpen && !isMinimized && (
            <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => navigate('/incident-management/incident-report')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/incident-management/incident-report'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
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
            onClick={() => {
              if (isMinimized) {
                setIsMinimized(false);
                setIsAppRegistryOpen(true);
              } else {
                setIsAppRegistryOpen(!isAppRegistryOpen);
              }
            }}
            title={isMinimized ? "App Registry" : undefined}
            className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer`}
          >
            <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              {!isMinimized && <span className="truncate">App Registry</span>}
            </div>
            {!isMinimized && (
              isAppRegistryOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              )
            )}
          </button>

          {isAppRegistryOpen && !isMinimized && (
            <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => navigate('/global-settings/vehicle-registry')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/global-settings/vehicle-registry'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <Car className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Equipment Registry</span>
              </button>

              <button
                onClick={() => navigate('/global-settings/employee-registry')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/global-settings/employee-registry'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Employee Registry</span>
              </button>

              <button
                onClick={() => navigate('/global-settings/component-registry')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/global-settings/component-registry'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
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
            onClick={() => {
              if (isMinimized) {
                setIsMinimized(false);
                setIsAppSettingsOpen(true);
              } else {
                setIsAppSettingsOpen(!isAppSettingsOpen);
              }
            }}
            title={isMinimized ? "App Settings" : undefined}
            className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer`}
          >
            <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
              <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              {!isMinimized && <span className="truncate">App Settings</span>}
            </div>
            {!isMinimized && (
              isAppSettingsOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              )
            )}
          </button>

          {isAppSettingsOpen && !isMinimized && (
            <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => navigate('/settings/service-standards')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/settings/service-standards'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Service Standards</span>
              </button>

              <button
                onClick={() => navigate('/settings/operations-standards')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/settings/operations-standards'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Operations Standards</span>
              </button>

              <button
                onClick={() => navigate('/settings/vehicle-models')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/settings/vehicle-models'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <Car className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Equipment Models</span>
              </button>

              <button
                onClick={() => navigate('/settings/system-components')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/settings/system-components'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">System & Components</span>
              </button>

              <button
                onClick={() => navigate('/settings/task-standards')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/settings/task-standards'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Task Standards</span>
              </button>

              <button
                onClick={() => navigate('/settings/job-order-config')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/settings/job-order-config'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <WrenchIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Job Order Config</span>
              </button>

              <button
                onClick={() => navigate('/settings/rca')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/settings/rca'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <GitFork className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">RCA</span>
              </button>

              <button
                onClick={() => navigate('/settings/fmea')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPath === '/settings/fmea'
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">FMEA</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Theme Toggle Button */}
      {toggleTheme && (
        <div className="px-3 pb-2">
          <button
            onClick={toggleTheme}
            title={isMinimized ? (isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode") : undefined}
            className={`w-full flex items-center ${isMinimized ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'} rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm cursor-pointer`}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 shrink-0 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 shrink-0 text-indigo-600" />
            )}
            {!isMinimized && (
              <div className="flex items-center justify-between w-full">
                <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
              </div>
            )}
          </button>
        </div>
      )}

      {/* User Manual External Link */}
      <div className="px-3 pb-2">
        <a
          href="/manual.html"
          target="_blank"
          rel="noopener noreferrer"
          title={isMinimized ? "User Manual & Operations Guide" : undefined}
          className={`w-full flex items-center ${isMinimized ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'} rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/40 transition-colors shadow-sm`}
        >
          <BookOpen className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
          {!isMinimized && (
            <div className="flex items-center justify-between w-full">
              <span>User Manual</span>
              <ExternalLink className="w-3 h-3 text-blue-600/70 dark:text-blue-400/70" />
            </div>
          )}
        </a>
      </div>

      {/* Database Status Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex items-center justify-center text-xs">
          {isMinimized ? (
            <div title={`Database Status: ${dbStatus}`}>
              {dbStatus === 'checking' && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse block" />}
              {dbStatus === 'connected' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] block" />}
              {dbStatus === 'error' && <span className="w-2.5 h-2.5 rounded-full bg-red-500 block" />}
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Database Status</span>
              <div className="flex items-center gap-2">
                {dbStatus === 'checking' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-500 dark:text-amber-400">Connecting...</span>
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


// import { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { supabase } from '@/lib/supabaseClient';
// import { 
//   LayoutDashboard, 
//   Wrench, 
//   ClipboardList, 
//   FileText, 
//   ChevronDown, 
//   ChevronRight, 
//   Car,
//   Settings,
//   ShieldAlert,
//   Calendar,
//   Cpu,
//   CheckSquare,
//   Wrench as WrenchIcon,
//   ClipboardCheck,
//   LayoutGrid,
//   Activity,
//   Globe,
//   Users,
//   Layers,
//   History,
//   AlertTriangle,
//   FileWarning,
//   // SearchCheck,
//   GitFork,
//   AlertCircle,
//   ChevronLeft,
//   ChevronRight as ChevronRightIcon,
//   BookOpen,
//   ExternalLink
// } from 'lucide-react';

// export function Sidebar() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const currentPath = location.pathname;

//   const [isMinimized, setIsMinimized] = useState<boolean>(false);

//   const [isMaintenanceOpen, setIsMaintenanceOpen] = useState<boolean>(
//     currentPath === '/daily-inspection' || 
//     currentPath === '/vehicles' || 
//     currentPath === '/component-history' ||
//     currentPath === '/maintenance-forecast'
//   );

//   const [isJobOrderOpen, setIsJobOrderOpen] = useState<boolean>(
//     currentPath.startsWith('/job-orders')
//   );

//   const [isIncidentManagementOpen, setIsIncidentManagementOpen] = useState<boolean>(
//     currentPath.startsWith('/incident-management')
//   );

//   const [isAppRegistryOpen, setIsAppRegistryOpen] = useState<boolean>(
//     currentPath.startsWith('/global-settings')
//   );

//   const [isAppSettingsOpen, setIsAppSettingsOpen] = useState<boolean>(
//     currentPath.startsWith('/settings')
//   );

//   const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

//   useEffect(() => {
//     let isMounted = true;

//     async function checkDbConnection() {
//       try {
//         const { error } = await supabase
//           .from('vehicles')
//           .select('vehicle_id', { count: 'exact', head: true })
//           .limit(1);

//         if (error) throw error;
//         if (isMounted) setDbStatus('connected');
//       } catch (err) {
//         console.error('Database connection heartbeat failed:', err);
//         if (isMounted) setDbStatus('error');
//       }
//     }

//     checkDbConnection();
//     const interval = setInterval(checkDbConnection, 30000);

//     return () => {
//       isMounted = false;
//       clearInterval(interval);
//     };
//   }, []);

//   return (
//     <aside className={`relative bg-slate-950 border-r border-slate-800 flex flex-col h-screen select-none transition-all duration-300 ${isMinimized ? 'w-20' : 'w-64'}`}>
//       {/* Edge Floating Minimize / Expand Button */}
//       <button
//         onClick={() => setIsMinimized(!isMinimized)}
//         title={isMinimized ? "Expand Sidebar" : "Minimize Sidebar"}
//         className="absolute -right-3.5 top-8 z-20 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 p-1.5 rounded-full shadow-lg flex items-center justify-center transition-colors cursor-pointer"
//       >
//         {isMinimized ? (
//           <ChevronRightIcon className="w-3.5 h-3.5 text-blue-400" />
//         ) : (
//           <ChevronLeft className="w-3.5 h-3.5 text-blue-400" />
//         )}
//       </button>

//       {/* Brand / Logo Header */}
//       <div className={`p-6 border-b border-slate-800 flex items-center ${isMinimized ? 'justify-center p-4' : 'gap-3'}`}>
//         <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl shrink-0">
//           <Car className="w-6 h-6" />
//         </div>
//         {!isMinimized && (
//           <div className="overflow-hidden whitespace-nowrap">
//             <h1 className="font-bold text-slate-100 tracking-tight text-base truncate">Product Name Here</h1>
//             <p className="text-xs text-slate-400 truncate">Reliability-Centered MRO</p>
//           </div>
//         )}
//       </div>

//       {/* Navigation Links */}
//       <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
//         {/* Dashboard */}
//         <button
//           onClick={() => navigate('/')}
//           title={isMinimized ? "Dashboard" : undefined}
//           className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-sm font-medium transition-colors cursor-pointer ${
//             currentPath === '/'
//               ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
//               : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
//           }`}
//         >
//           <LayoutDashboard className="w-4 h-4 shrink-0" />
//           {!isMinimized && <span className="truncate">Dashboard</span>}
//         </button>

//         {/* Maintenance Plan Accordion */}
//         <div className="space-y-1">
//           <button
//             onClick={() => {
//               if (isMinimized) {
//                 setIsMinimized(false);
//                 setIsMaintenanceOpen(true);
//               } else {
//                 setIsMaintenanceOpen(!isMaintenanceOpen);
//               }
//             }}
//             title={isMinimized ? "Maintenance Plan" : undefined}
//             className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-colors cursor-pointer`}
//           >
//             <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
//               <Wrench className="w-4 h-4 text-blue-400 shrink-0" />
//               {!isMinimized && <span className="truncate">Maintenance Plan</span>}
//             </div>
//             {!isMinimized && (
//               isMaintenanceOpen ? (
//                 <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
//               ) : (
//                 <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
//               )
//             )}
//           </button>

//           {isMaintenanceOpen && !isMinimized && (
//             <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-slate-800">
//               <button
//                 onClick={() => navigate('/daily-inspection')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/daily-inspection'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <ClipboardList className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">Daily Inspection</span>
//               </button>

//               <button
//                 onClick={() => navigate('/vehicles')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/vehicles'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <FileText className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">Equipment PM Details</span>
//               </button>

//               <button
//                 onClick={() => navigate('/component-history')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/component-history'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <History className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">Component History</span>
//               </button>

//               <button
//                 onClick={() => navigate('/maintenance-forecast')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/maintenance-forecast'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <Calendar className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">Maintenance Forecast</span>
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Job Order System Accordion */}
//         <div className="space-y-1">
//           <button
//             onClick={() => {
//               if (isMinimized) {
//                 setIsMinimized(false);
//                 setIsJobOrderOpen(true);
//               } else {
//                 setIsJobOrderOpen(!isJobOrderOpen);
//               }
//             }}
//             title={isMinimized ? "Job Order System" : undefined}
//             className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-colors cursor-pointer`}
//           >
//             <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
//               <ClipboardCheck className="w-4 h-4 text-blue-400 shrink-0" />
//               {!isMinimized && <span className="truncate">Job Order System</span>}
//             </div>
//             {!isMinimized && (
//               isJobOrderOpen ? (
//                 <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
//               ) : (
//                 <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
//               )
//             )}
//           </button>

//           {isJobOrderOpen && !isMinimized && (
//             <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-slate-800">
//               <button
//                 onClick={() => navigate('/job-orders/dashboard')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/job-orders/dashboard'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">Dashboard</span>
//               </button>

//               <button
//                 onClick={() => navigate('/job-orders')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/job-orders'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <WrenchIcon className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">Job Order</span>
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Incident Management Accordion */}
//         <div className="space-y-1">
//           <button
//             onClick={() => {
//               if (isMinimized) {
//                 setIsMinimized(false);
//                 setIsIncidentManagementOpen(true);
//               } else {
//                 setIsIncidentManagementOpen(!isIncidentManagementOpen);
//               }
//             }}
//             title={isMinimized ? "Incident Mgmt" : undefined}
//             className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-colors cursor-pointer`}
//           >
//             <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
//               <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0" />
//               {!isMinimized && <span className="truncate">Incident Mgmt</span>}
//             </div>
//             {!isMinimized && (
//               isIncidentManagementOpen ? (
//                 <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
//               ) : (
//                 <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
//               )
//             )}
//           </button>

//           {isIncidentManagementOpen && !isMinimized && (
//             <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-slate-800">
//               <button
//                 onClick={() => navigate('/incident-management/incident-report')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/incident-management/incident-report'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <FileWarning className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">Incident Report</span>
//               </button>

//               {/* <button
//                 onClick={() => navigate('/incident-management/fmea-rca')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/incident-management/fmea-rca'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <SearchCheck className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">FMEA RCA</span>
//               </button> */}
//             </div>
//           )}
//         </div>

//         {/* App Registry Accordion */}
//         <div className="space-y-1">
//           <button
//             onClick={() => {
//               if (isMinimized) {
//                 setIsMinimized(false);
//                 setIsAppRegistryOpen(true);
//               } else {
//                 setIsAppRegistryOpen(!isAppRegistryOpen);
//               }
//             }}
//             title={isMinimized ? "App Registry" : undefined}
//             className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-colors cursor-pointer`}
//           >
//             <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
//               <Globe className="w-4 h-4 text-blue-400 shrink-0" />
//               {!isMinimized && <span className="truncate">App Registry</span>}
//             </div>
//             {!isMinimized && (
//               isAppRegistryOpen ? (
//                 <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
//               ) : (
//                 <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
//               )
//             )}
//           </button>

//           {isAppRegistryOpen && !isMinimized && (
//             <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-slate-800">
//               <button
//                 onClick={() => navigate('/global-settings/vehicle-registry')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/global-settings/vehicle-registry'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <Car className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">Equipment Registry</span>
//               </button>

//               <button
//                 onClick={() => navigate('/global-settings/employee-registry')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/global-settings/employee-registry'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <Users className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">Employee Registry</span>
//               </button>

//               <button
//                 onClick={() => navigate('/global-settings/component-registry')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/global-settings/component-registry'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <Layers className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">Component Registry</span>
//               </button>
//             </div>
//           )}
//         </div>

//         {/* App Settings Accordion */}
//         <div className="space-y-1">
//           <button
//             onClick={() => {
//               if (isMinimized) {
//                 setIsMinimized(false);
//                 setIsAppSettingsOpen(true);
//               } else {
//                 setIsAppSettingsOpen(!isAppSettingsOpen);
//               }
//             }}
//             title={isMinimized ? "App Settings" : undefined}
//             className={`w-full flex items-center ${isMinimized ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-colors cursor-pointer`}
//           >
//             <div className={`flex items-center ${isMinimized ? '' : 'gap-3'}`}>
//               <Settings className="w-4 h-4 text-blue-400 shrink-0" />
//               {!isMinimized && <span className="truncate">App Settings</span>}
//             </div>
//             {!isMinimized && (
//               isAppSettingsOpen ? (
//                 <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
//               ) : (
//                 <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
//               )
//             )}
//           </button>

//           {isAppSettingsOpen && !isMinimized && (
//             <div className="ml-3 pl-2 pr-1 space-y-1 py-1 border-l border-slate-800">
//               <button
//                 onClick={() => navigate('/settings/service-standards')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/settings/service-standards'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">Service Standards</span>
//               </button>

//               <button
//                 onClick={() => navigate('/settings/operations-standards')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/settings/operations-standards'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <Activity className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">Operations Standards</span>
//               </button>

//               <button
//                 onClick={() => navigate('/settings/vehicle-models')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/settings/vehicle-models'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <Car className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">Equipment Models</span>
//               </button>

//               <button
//                 onClick={() => navigate('/settings/system-components')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/settings/system-components'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <Cpu className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">System & Components</span>
//               </button>

//               <button
//                 onClick={() => navigate('/settings/task-standards')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/settings/task-standards'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <CheckSquare className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">Task Standards</span>
//               </button>

//               <button
//                 onClick={() => navigate('/settings/job-order-config')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/settings/job-order-config'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <WrenchIcon className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">Job Order Config</span>
//               </button>

//               <button
//                 onClick={() => navigate('/settings/rca')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/settings/rca'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <GitFork className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">RCA</span>
//               </button>

//               <button
//                 onClick={() => navigate('/settings/fmea')}
//                 className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
//                   currentPath === '/settings/fmea'
//                     ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
//                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
//                 }`}
//               >
//                 <AlertCircle className="w-3.5 h-3.5 shrink-0" />
//                 <span className="truncate">FMEA</span>
//               </button>
//             </div>
//           )}
//         </div>
//       </nav>

//       {/* User Manual External Link */}
//       <div className="px-3 pb-2">
//         <a
//           href="/manual.html"
//           target="_blank"
//           rel="noopener noreferrer"
//           title={isMinimized ? "User Manual & Operations Guide" : undefined}
//           className={`w-full flex items-center ${isMinimized ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'} rounded-xl text-xs font-semibold text-blue-400 bg-blue-950/30 hover:bg-blue-900/40 border border-blue-800/40 transition-colors shadow-sm`}
//         >
//           <BookOpen className="w-4 h-4 shrink-0 text-blue-400" />
//           {!isMinimized && (
//             <div className="flex items-center justify-between w-full">
//               <span>User Manual</span>
//               <ExternalLink className="w-3 h-3 text-blue-400/70" />
//             </div>
//           )}
//         </a>
//       </div>

//       {/* Database Status Footer */}
//       <div className="p-3 border-t border-slate-800">
//         <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-center text-xs">
//           {isMinimized ? (
//             <div title={`Database Status: ${dbStatus}`}>
//               {dbStatus === 'checking' && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse block" />}
//               {dbStatus === 'connected' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] block" />}
//               {dbStatus === 'error' && <span className="w-2.5 h-2.5 rounded-full bg-red-500 block" />}
//             </div>
//           ) : (
//             <div className="w-full flex items-center justify-between">
//               <span className="text-slate-400 font-medium">Database Status</span>
//               <div className="flex items-center gap-2">
//                 {dbStatus === 'checking' && (
//                   <>
//                     <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
//                     <span className="text-amber-400">Connecting...</span>
//                   </>
//                 )}
//                 {dbStatus === 'connected' && (
//                   <>
//                     <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
//                     <span className="text-emerald-400 font-semibold">Connected</span>
//                   </>
//                 )}
//                 {dbStatus === 'error' && (
//                   <>
//                     <span className="w-2 h-2 rounded-full bg-red-500" />
//                     <span className="text-red-400 font-semibold">Offline</span>
//                   </>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </aside>
//   );
// }

// export default Sidebar;