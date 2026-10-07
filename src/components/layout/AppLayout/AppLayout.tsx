import React from 'react';
import { LayoutDashboard, Truck, Wrench, FileText, Package, Settings, LogOut } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  activeModule?: string;
  onNavigate?: (module: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activeModule = 'dashboard', onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'fleet', label: 'Fleet & Assets', icon: Truck },
    { id: 'maintenance', label: 'Preventive Maint.', icon: Wrench },
    { id: 'work-orders', label: 'Work Orders', icon: FileText },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'setup', label: 'Setup & Admin', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            O
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">onyxproject</h1>
            <p className="text-xs text-slate-400">RBMMS Platform</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => onNavigate?.('logout')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-xs">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold capitalize tracking-tight text-slate-800">
              {activeModule.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-medium text-slate-700">
              RB
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};