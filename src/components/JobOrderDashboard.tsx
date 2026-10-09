import { LayoutGrid } from 'lucide-react';

export function JobOrderDashboard() {
  return (
    <div className="p-6 w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
          <LayoutGrid className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Job Order Dashboard</h1>
          <p className="text-sm text-slate-400">Overview metrics, open requisitions, and work order status indicators.</p>
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="p-8 text-center text-slate-400">
          Job Order Dashboard analytics are ready for connection.
        </div>
      </div>
    </div>
  );
}

export default JobOrderDashboard;