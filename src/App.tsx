import { useState, useEffect, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import LandingPage from '@/components/LandingPage';
import { VehiclePmViewer } from '@/components/VehiclePmViewer';
import { DailyInspection } from '@/components/DailyInspection';
import { ServiceStandards } from '@/components/ServiceStandards'; 
import { OperationsStandards } from '@/components/OperationsStandards';
import { MaintenanceForecast } from '@/components/MaintenanceForecast';
import { SystemComponents } from '@/components/SystemComponents';
import { TaskStandards } from '@/components/TaskStandards';
import { VehicleModels } from '@/components/VehicleModels';
import { JobOrderSettings } from '@/components/JobOrderSettings';
import { JobOrder } from '@/components/JobOrder';
import { JobOrderDashboard } from '@/components/JobOrderDashboard';
import { VehicleRegistry } from '@/components/VehicleRegistry';
import { EmployeeRegistry } from '@/components/EmployeeRegistry';
import { ComponentRegistry } from '@/components/ComponentRegistry';
import { ComponentHistory } from '@/components/ComponentHistory';
import { IncidentReport } from '@/components/IncidentReport';
import { FmeaSettings } from '@/components/FmeaSettings';
import { RcaSettings } from '@/components/RcaSettings';
import { Smartphone, Monitor } from 'lucide-react';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const hasAccess = sessionStorage.getItem('rcmro-access') === 'granted';
  if (!hasAccess) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Mobile Device Block Notification Component
const MobileBlockNotice = () => {
  return (
    <div className="md:hidden flex flex-col items-center justify-center min-h-screen bg-(--bg-surface) text-(--text-primary) p-6 text-center">
      <div className="bg-(--bg-elevated) border border-(--border-main) rounded-2xl p-6 shadow-xl max-w-sm w-full space-y-4">
        <div className="flex justify-center">
          <div className="bg-(--accent-subtle) text-(--text-primary) p-3 rounded-xl border border-(--border-main) shadow-xs">
            <Smartphone className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-(--text-primary)">Desktop View Required</h2>
          <p className="text-xs sm:text-sm text-(--text-muted)">
            This solution cannot run or open on mobile phones. Please access the application using a desktop or laptop computer for the full experience.
          </p>
        </div>
        <div className="pt-2 border-t border-(--border-main) flex items-center justify-center gap-2 text-[11px] text-(--text-muted)">
          <Monitor className="w-4 h-4 text-blue-500" />
          <span>Only Landing Page and manual.html are supported on mobile.</span>
        </div>
      </div>
    </div>
  );
};

export function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page: Accessible on both Mobile and Desktop */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected App Routes: Hidden on mobile (shows mobile block notification), visible on md+ screens */}
        <Route
          path="/*"
          element={
            <>
              {/* Mobile Notification View */}
              <MobileBlockNotice />

              {/* Desktop App View */}
              <ProtectedRoute>
                <div className="hidden md:flex bg-(--bg-app) text-(--text-secondary) h-screen w-screen overflow-hidden">
                  <Sidebar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
                  <main className="flex-1 overflow-y-auto bg-(--bg-app)">
                    <Routes>
                      <Route path="/dashboard" element={<div className="p-6 text-xl font-bold text-(--text-primary)">Dashboard Home</div>} />
                      <Route path="/vehicles" element={<VehiclePmViewer />} />
                      <Route path="/daily-inspection" element={<DailyInspection />} />
                      <Route path="/maintenance-plan" element={<div className="p-6 text-xl font-bold text-(--text-primary)">Maintenance Plan</div>} />
                      <Route path="/component-history" element={<ComponentHistory />} />
                      <Route path="/maintenance-forecast" element={<MaintenanceForecast />} />
                      <Route path="/job-orders" element={<JobOrder />} />
                      <Route path="/job-orders/dashboard" element={<JobOrderDashboard />} />
                      
                      <Route path="/incident-management/incident-report" element={<IncidentReport />} />

                      <Route path="/global-settings/vehicle-registry" element={<VehicleRegistry />} />
                      <Route path="/global-settings/employee-registry" element={<EmployeeRegistry />} />
                      <Route path="/global-settings/component-registry" element={<ComponentRegistry />} />

                      <Route path="/settings" element={<div className="p-6 text-xl font-bold text-(--text-primary)">Settings</div>} />
                      <Route path="/settings/service-standards" element={<ServiceStandards />} />
                      <Route path="/settings/operations-standards" element={<OperationsStandards />} />
                      <Route path="/settings/system-components" element={<SystemComponents />} />
                      <Route path="/settings/task-standards" element={<TaskStandards />} />
                      <Route path="/settings/vehicle-models" element={<VehicleModels />} />
                      <Route path="/settings/job-order-config" element={<JobOrderSettings />} />
                      <Route path="/settings/rca" element={<RcaSettings />} />
                      <Route path="/settings/fmea" element={<FmeaSettings />} />

                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </main>
                </div>
              </ProtectedRoute>
            </>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter> 
  );
}

export default App;