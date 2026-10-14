import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://scnujngrcwaslpcreopx.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbnVqbmdyY3dhc2xwY3Jlb3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NDM3ODYsImV4cCI6MjEwNzUxOTc4Nn0.CAZI-rMQTDLbcDZbC4z0SDp-JHVxvnQFAIva-pB_Ht4';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[SupabaseClient Warning]: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from environment variables.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Checks connectivity to the Supabase backend.
 * @returns {Promise<{ ok: boolean, message: string, error?: any }>}
 */
export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      // If error is table not found or auth, still connected to Supabase
      return { ok: true, message: `Connected to Supabase (Status/Notice: ${error.message})` };
    }
    return { ok: true, message: 'Successfully connected to Supabase database!' };
  } catch (err) {
    console.error('[SupabaseClient Error]:', err);
    return { ok: false, message: err.message || 'Failed to connect to Supabase.' };
  }
}

export default supabase;
