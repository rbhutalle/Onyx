import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Checks both VITE_SUPABASE_ANON_KEY or a VITE variant of the publishable key
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const isValidUrl = 
  typeof supabaseUrl === 'string' && 
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));

const finalUrl = isValidUrl ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = typeof supabaseKey === 'string' && supabaseKey.trim().length > 0 
  ? supabaseKey 
  : 'placeholder-key';

if (!isValidUrl || finalKey === 'placeholder-key') {
  console.warn(
    '⚠️ Supabase configuration is missing or invalid in your .env file. Heartbeat will show as Disconnected.'
  );
}

export const supabase = createClient(finalUrl, finalKey);