import { useState, useEffect, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // 👈 Added BrowserRouter back here
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
import { Monitor, Tablet } from 'lucide-react';

// 🔒 ProtectedRoute blocks direct external access
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const hasAccess = sessionStorage.getItem('rcmro-access') === 'granted';
  
  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
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

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <BrowserRouter> {/* 👈 Restored BrowserRouter here */}
      {/* 📱 Mobile Guard Screen */}
      <div className="flex md:hidden fixed inset-0 z-50 bg-(--bg-main) text-(--text-main) p-6 flex-col items-center justify-center text-center">
        <div className="bg-(--bg-surface) border border-(--border-color) p-6 rounded-2xl max-w-sm w-full shadow-2xl space-y-4">
          <div className="flex justify-center gap-3 text-blue-600 dark:text-blue-400 mb-1">
            <Monitor className="w-9 h-9" />
            <Tablet className="w-9 h-9" />
          </div>
          <h2 className="text-base font-bold text-(--text-heading)">Laptop or Tablet Required</h2>
          <p className="text-xs text-(--text-muted) leading-relaxed">
            This dashboard and management system contains dense data tables and controls optimized for larger screens. Please access this application from a laptop, desktop, or tablet device.
          </p>
        </div>
      </div>

      <Routes>
        {/* Standalone Landing Page Route */}
        <Route path="/" element={<LandingPage />} />

        {/* Main Dashboard Layout with Sidebar - 🔒 Wrapped in ProtectedRoute */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="hidden md:flex bg-(--bg-main) h-screen w-screen overflow-hidden text-(--text-main)">
                <Sidebar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
                <main className="flex-1 overflow-y-auto bg-(--bg-main)">
                  <Routes>
                    <Route path="/dashboard" element={<div className="p-6 text-xl font-bold text-(--text-heading)">Dashboard Home</div>} />
                    <Route path="/vehicles" element={<VehiclePmViewer />} />
                    <Route path="/daily-inspection" element={<DailyInspection />} />
                    <Route path="/maintenance-plan" element={<div className="p-6 text-xl font-bold text-(--text-heading)">Maintenance Plan</div>} />
                    <Route path="/component-history" element={<ComponentHistory />} />
                    <Route path="/maintenance-forecast" element={<MaintenanceForecast />} />
                    <Route path="/job-orders" element={<JobOrder />} />
                    <Route path="/job-orders/dashboard" element={<JobOrderDashboard />} />
                    
                    {/* Incident Management Routes */}
                    <Route path="/incident-management/incident-report" element={<IncidentReport />} />

                    {/* Global Settings / Registry Routes */}
                    <Route path="/global-settings/vehicle-registry" element={<VehicleRegistry />} />
                    <Route path="/global-settings/employee-registry" element={<EmployeeRegistry />} />
                    <Route path="/global-settings/component-registry" element={<ComponentRegistry />} />

                    {/* Settings Routes */}
                    <Route path="/settings" element={<div className="p-6 text-xl font-bold text-(--text-heading)">Settings</div>} />
                    <Route path="/settings/service-standards" element={<ServiceStandards />} />
                    <Route path="/settings/operations-standards" element={<OperationsStandards />} />
                    <Route path="/settings/system-components" element={<SystemComponents />} />
                    <Route path="/settings/task-standards" element={<TaskStandards />} />
                    <Route path="/settings/vehicle-models" element={<VehicleModels />} />
                    <Route path="/settings/job-order-config" element={<JobOrderSettings />} />
                    <Route path="/settings/rca" element={<RcaSettings />} />
                    <Route path="/settings/fmea" element={<FmeaSettings />} />

                    {/* Fallback route for unknown dashboard paths */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Global Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter> 
  );
}

export default App;