import { LayoutGrid } from 'lucide-react';

export function JobOrderDashboard() {
  return (
    <div className="h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-300 dark:border-slate-800 pb-3 shrink-0">
        <div className="p-2.5 bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
          <LayoutGrid className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Job Order Dashboard</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">Overview metrics, open requisitions, and work order status indicators.</p>
        </div>
      </div>

      {/* Main Content Body Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-slate-50/90 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 shadow-xs overflow-hidden space-y-3">
        <div className="flex flex-col flex-1 min-h-0 space-y-2">
          {/* Inner Surface Panel */}
          <div className="flex-1 min-h-0 overflow-auto border border-slate-300 dark:border-slate-800/60 rounded-lg bg-white dark:bg-slate-950 flex items-center justify-center p-6 text-center text-xs text-slate-600 dark:text-slate-400">
            Job Order Dashboard analytics are ready for connection.
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobOrderDashboard;