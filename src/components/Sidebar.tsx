import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wrench, Car, Settings } from 'lucide-react';
import { SupabaseHeartbeat } from '@/components/SupabaseHeartbeat';

export function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen p-4 justify-between">
      {/* Top Brand / Logo Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 px-2">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Car className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-100 text-base tracking-tight">RBMMS Dashboard</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1">
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isActive('/') 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>

          <Link
            to="/vehicles"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isActive('/vehicles') 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Car className="w-4 h-4" />
            Vehicle PM Details
          </Link>

          {/* NEW MAINTENANCE PLAN MENU */}
          <Link
            to="/maintenance-plan"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isActive('/maintenance-plan') 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Maintenance Plan
          </Link>

          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isActive('/settings') 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </nav>
      </div>

      {/* Bottom Section: Supabase Heartbeat Widget */}
      <div className="pt-4 border-t border-slate-800/80">
        <SupabaseHeartbeat />
      </div>
    </aside>
  );
}