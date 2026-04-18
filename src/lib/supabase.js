import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[studio] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — studio features disabled.');
}

// createClient with placeholder strings returns a client that will fail on
// every request (expected when env vars are missing), but won't crash at import.
export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
);
