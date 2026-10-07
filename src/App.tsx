import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { VehiclePmViewer } from '@/components/VehiclePmViewer';

export function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
        {/* Persistent Sidebar with Heartbeat & Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto p-6 bg-slate-900">
          <Routes>
            {/* Default redirect or dashboard route */}
            <Route path="/" element={<div className="text-slate-100 text-lg font-semibold">Welcome to RBMMS Dashboard</div>} />
            
            {/* Vehicle PM Details Page */}
            <Route path="/vehicles" element={<VehiclePmViewer />} />

            {/* Maintenance Plan Page (using the same view or a custom one) */}
            <Route path="/maintenance-plan" element={<VehiclePmViewer />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;