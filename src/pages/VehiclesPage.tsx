import { VehiclePmViewer } from '@/components/VehiclePmViewer';
import { SupabaseHeartbeat } from '@/components/SupabaseHeartbeat';

export function VehiclesPage() {
  return (
    <div className="flex flex-col h-screen bg-slate-950 p-6 gap-6 overflow-hidden">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Vehicle Management</h1>
          <p className="text-xs text-slate-400">Monitor preventive maintenance records and database health.</p>
        </div>
        
        {/* Heartbeat Monitor in the header or sidebar */}
        <div className="w-full sm:w-72">
          <SupabaseHeartbeat />
        </div>
      </div>

      {/* Main Vehicle PM Table & Search Viewer */}
      <div className="flex-1 min-h-0">
        <VehiclePmViewer />
      </div>
    </div>
  );
}