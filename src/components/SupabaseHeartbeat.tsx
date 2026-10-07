import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function SupabaseHeartbeat() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [latency, setLatency] = useState<number | null>(null);

  // Reusable check function for both mount/polling and manual retry
  const executeCheck = async (setCheckingState = false) => {
    if (setCheckingState) {
      setStatus('checking');
    }

    const start = performance.now();
    try {
      // Fetching up to 1 row from 'vehicle_pm' to test API reachability under RLS
      const { error } = await supabase.from('vehicle_pm').select('*').limit(1);
      const end = performance.now();

      // If error code is a PostgREST error or network failure, mark disconnected.
      // Note: A 401/403 or RLS denial still means the server is reachable, 
      // but to strictly verify a healthy backend connection, we look for zero communication errors.
      if (error) {
        // If it's just an RLS permission block (PGRST301 or similar), the server is alive. 
        // However, standard handling treats query errors as disconnected.
        setStatus('disconnected');
        setLatency(null);
      } else {
        setStatus('connected');
        setLatency(Math.round(end - start));
      }
    } catch {
      setStatus('disconnected');
      setLatency(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const runCheck = async () => {
      const start = performance.now();
      try {
        const { error } = await supabase.from('vehicle_pm').select('*').limit(1);
        const end = performance.now();

        if (!isMounted) return;

        if (error) {
          setStatus('disconnected');
          setLatency(null);
        } else {
          setStatus('connected');
          setLatency(Math.round(end - start));
        }
      } catch {
        if (!isMounted) return;
        setStatus('disconnected');
        setLatency(null);
      }
    };

    // Initial check on mount
    runCheck();

    // Periodic heartbeat poll every 15 seconds
    const interval = setInterval(runCheck, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 shadow-sm">
      <div className="flex items-center gap-2">
        {status === 'checking' && (
          <>
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
            <span className="font-medium text-slate-300">Checking connection...</span>
          </>
        )}
        {status === 'connected' && (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Wifi className="h-4 w-4 text-emerald-400" />
            <div>
              <span className="font-semibold text-emerald-400">Connected</span>
              {latency !== null && <span className="text-slate-400 ml-1.5">({latency}ms)</span>}
            </div>
          </>
        )}
        {status === 'disconnected' && (
          <>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <WifiOff className="h-4 w-4 text-rose-400" />
            <span className="font-semibold text-rose-400">Disconnected</span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => executeCheck(true)}
        disabled={status === 'checking'}
        className="px-2 py-1 text-[11px] font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition disabled:opacity-50 cursor-pointer"
      >
        {status === 'checking' ? 'Testing...' : 'Re-evaluate'}
      </button>
    </div>
  );
}