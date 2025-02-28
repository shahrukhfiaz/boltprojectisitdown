import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Using fallback data.');
}

// Create the Supabase client with error handling
export const supabase = createClient<Database>(
  supabaseUrl || 'https://example.supabase.co', // Fallback URL if not provided
  supabaseAnonKey || 'public-anon-key', // Fallback key if not provided
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      // Add fetch options to handle network errors better
      fetch: (...args) => {
        return fetch(...args).catch(err => {
          console.error('Supabase fetch error:', err);
          throw err;
        });
      }
    }
  }
);

// Check if Supabase connection is working
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('websites').select('count').limit(1).single();
    if (error) {
      console.warn('Supabase connection check failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase connection check failed with exception:', err);
    return false;
  }
};

// Initialize connection check
export const isSupabaseConnected = checkSupabaseConnection()
  .then(connected => {
    if (!connected) {
      console.warn('Supabase connection is not available. Using fallback data.');
    } else {
      console.log('Supabase connection established successfully.');
    }
    return connected;
  })
  .catch(() => {
    console.warn('Supabase connection check threw an exception. Using fallback data.');
    return false;
  });