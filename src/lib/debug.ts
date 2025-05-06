import { supabase } from './supabase';

export async function debugEmailTracking(invoiceId: string, customerId: string) {
  try {
    // Check tracking status
    const { data: checkResult, error: checkError } = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/debug-email-tracking?action=check_tracking&invoice_id=${invoiceId}`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      }
    ).then(res => res.json());

    if (checkError) throw checkError;

    console.log('Email Tracking Debug Results:', checkResult);

    // Test tracking
    const { data: testResult, error: testError } = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/debug-email-tracking?action=test_tracking&invoice_id=${invoiceId}&customer_id=${customerId}`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      }
    ).then(res => res.json());

    if (testError) throw testError;

    console.log('Test Tracking Result:', testResult);

    // Fix policies if needed
    if (!checkResult?.rls_policies || checkResult.rls_policies.length === 0) {
      const { data: fixResult, error: fixError } = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/debug-email-tracking?action=fix_policies`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      ).then(res => res.json());

      if (fixError) throw fixError;
      console.log('Policy Fix Result:', fixResult);
    }

    return {
      success: true,
      checkResult,
      testResult
    };
  } catch (error) {
    console.error('Debug error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}