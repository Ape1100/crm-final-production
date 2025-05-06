import { supabase } from './supabase';
import type { InvoiceSettings } from '../types';

const defaultInvoiceSettings: InvoiceSettings = {
  tax: {
    enabled: true,
    rate: 10,
    label: 'Sales Tax'
  },
  currency: 'USD',
  terms: 'Payment is due within 30 days'
};

export async function initializeSettings() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  // Check if settings exist
  const { data: existingSettings } = await supabase
    .from('settings')
    .select('*')
    .eq('type', 'invoice')
    .eq('user_id', session.user.id)
    .single();

  if (!existingSettings) {
    // Create default settings
    const { data, error } = await supabase
      .from('settings')
      .insert([{
        user_id: session.user.id,
        type: 'invoice',
        settings: defaultInvoiceSettings
      }])
      .select()
      .single();

    if (error) {
      console.error('Error initializing settings:', error);
      return defaultInvoiceSettings;
    }

    return data.settings;
  }

  return existingSettings.settings;
}

export async function getInvoiceSettings(): Promise<InvoiceSettings> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return defaultInvoiceSettings;

  const { data, error } = await supabase
    .from('settings')
    .select('settings')
    .eq('type', 'invoice')
    .eq('user_id', session.user.id)
    .single();

  if (error || !data) {
    return await initializeSettings() || defaultInvoiceSettings;
  }

  return data.settings;
}

export async function updateInvoiceSettings(settings: InvoiceSettings) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('No user session');

  const { error } = await supabase
    .from('settings')
    .update({ settings })
    .eq('type', 'invoice')
    .eq('user_id', session.user.id);

  if (error) throw error;
}