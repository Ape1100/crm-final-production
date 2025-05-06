import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Validate URL format and remove any trailing slashes
const normalizedUrl = supabaseUrl.replace(/\/+$/, '');
try {
  new URL(normalizedUrl);
} catch (error) {
  throw new Error('Invalid Supabase URL format. Please check your .env file.');
}

export const supabase = createClient<Database>(normalizedUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
    storage: window.localStorage
  },
  global: {
    headers: { 'x-custom-header': 'business-app' },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Enhanced error handling wrapper with specific error types and retry logic
export async function handleSupabaseError<T>(
  promise: Promise<{ data: T | null; error: any }>,
  retries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const { data, error } = await promise;
      
      if (error) {
        // Handle specific Supabase error types
        if (error.message?.includes('Failed to fetch') || error.code === 'NETWORK_ERROR') {
          throw new Error(
            'Network error: Unable to connect to the database. ' +
            'Please check your internet connection and try again in a few moments.'
          );
        }
        
        if (error.code === '401' || error.code === 'UNAUTHENTICATED') {
          // Attempt to refresh the session
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('Your session has expired. Please sign in again.');
          }
          // Retry the original request
          continue;
        }
        
        if (error.code === '403' || error.code === 'FORBIDDEN') {
          throw new Error('Access denied: You don\'t have permission to perform this action.');
        }
        
        if (error.code === 'PGRST301') {
          throw new Error('The requested resource was not found.');
        }
        
        if (error.code?.startsWith('PGRST')) {
          throw new Error(`Database error: ${error.message}`);
        }
        
        if (error.code === '20P0003') {
          throw new Error('Database configuration error. Please try again later.');
        }
        
        if (error.code === '429') {
          const delay = Math.min(baseDelay * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry on rate limit
        }
        
        console.error('Supabase error:', error);
        throw new Error(error.message || 'An unexpected database error occurred.');
      }
      
      if (!data) {
        throw new Error('No data returned from the database.');
      }
      
      return data;
    } catch (error: any) {
      lastError = error;
      
      // Only retry on network errors, rate limits, or auth refresh
      if (
        error.message?.includes('Network error') ||
        error.message?.includes('429') ||
        error.code === 'NETWORK_ERROR' ||
        error.code === '401'
      ) {
        if (attempt < retries - 1) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

// Initialize auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    // Reconnect realtime on auth changes
    const channel = supabase.channel('any')
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Connected to realtime')
      }
    })
  }
});