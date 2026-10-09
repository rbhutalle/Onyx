import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { VehiclePmViewer } from '@/components/VehiclePmViewer';
import { DailyInspection } from '@/components/DailyInspection';
import { ServiceStandards } from '@/components/ServiceStandards'; 
import { MaintenanceForecast } from '@/components/MaintenanceForecast';
import { SystemComponents } from '@/components/SystemComponents';
import { TaskStandards } from '@/components/TaskStandards';
import { VehicleModels } from '@/components/VehicleModels';
import { JobOrderSettings } from '@/components/JobOrderSettings';
import { JobOrder } from '@/components/JobOrder';
import { JobOrderDashboard } from '@/components/JobOrderDashboard';

export function App() {
  return (
    <BrowserRouter>
      <div className="flex bg-slate-950 min-h-screen text-slate-100 w-full">
        {/* Sidebar is inside BrowserRouter so <Link> and useLocation work */}
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<div className="p-6 text-xl font-bold">Dashboard Home</div>} />
            <Route path="/vehicles" element={<VehiclePmViewer />} />
            <Route path="/daily-inspection" element={<DailyInspection />} />
            <Route path="/maintenance-plan" element={<div className="p-6 text-xl font-bold">Maintenance Plan</div>} />
            <Route path="/maintenance-forecast" element={<MaintenanceForecast />} />
            <Route path="/job-orders" element={<JobOrder />} />
            <Route path="/job-orders/dashboard" element={<JobOrderDashboard />} />
            <Route path="/settings" element={<div className="p-6 text-xl font-bold">Settings</div>} />
            <Route path="/settings/service-standards" element={<ServiceStandards />} />
            <Route path="/settings/system-components" element={<SystemComponents />} />
            <Route path="/settings/task-standards" element={<TaskStandards />} />
            <Route path="/settings/vehicle-models" element={<VehicleModels />} />
            <Route path="/settings/job-order-config" element={<JobOrderSettings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;