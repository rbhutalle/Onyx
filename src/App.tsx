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

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const hasAccess = sessionStorage.getItem('rcmro-access') === 'granted';
  if (!hasAccess) return <Navigate to="/" replace />;
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

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Outer frame and viewport explicitly linked to var(--bg-app) */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="hidden md:flex bg-(--bg-app)] ext-(--text-secondary)] h-screen w-screen overflow-hidden">
                <Sidebar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
                <main className="flex-1 overflow-y-auto bg-(--bg-app)">
                  <Routes>
                    <Route path="/dashboard" element={<div className="p-6 text-xl font-bold text-(--text-primary)">Dashboard Home</div>} />
                    <Route path="/vehicles" element={<VehiclePmViewer />} />
                    <Route path="/daily-inspection" element={<DailyInspection />} />
                    <Route path="/maintenance-plan" element={<div className="p-6 text-xl font-bold text-var(--text-primary)">Maintenance Plan</div>} />
                    <Route path="/component-history" element={<ComponentHistory />} />
                    <Route path="/maintenance-forecast" element={<MaintenanceForecast />} />
                    <Route path="/job-orders" element={<JobOrder />} />
                    <Route path="/job-orders/dashboard" element={<JobOrderDashboard />} />
                    
                    <Route path="/incident-management/incident-report" element={<IncidentReport />} />

                    <Route path="/global-settings/vehicle-registry" element={<VehicleRegistry />} />
                    <Route path="/global-settings/employee-registry" element={<EmployeeRegistry />} />
                    <Route path="/global-settings/component-registry" element={<ComponentRegistry />} />

                    <Route path="/settings" element={<div className="p-6 text-xl font-bold text-var(--text-primary)">Settings</div>} />
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
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter> 
  );
}

export default App;