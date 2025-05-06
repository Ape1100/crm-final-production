import { createClient } from '@supabase/supabase-js';

// Supabase configuration
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Email configuration
export async function getEmailConfig() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('settings')
      .select('settings')
      .eq('type', 'email')
      .eq('user_id', session.user.id)
      .single();

    if (error) throw error;
    return data?.settings;
  } catch (error) {
    console.error('Error fetching email configuration:', error);
    throw error;
  }
}