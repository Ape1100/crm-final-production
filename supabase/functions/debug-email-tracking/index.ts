import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const invoiceId = url.searchParams.get('invoice_id');

    if (!action) {
      throw new Error('Action parameter is required');
    }

    let result;

    switch (action) {
      case 'check_tracking':
        // Check if tracking pixel is properly embedded
        const { data: invoice } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .single();

        // Check if email opens exist
        const { data: opens, error: opensError } = await supabase
          .from('email_opens')
          .select('*')
          .eq('invoice_id', invoiceId);

        // Check RLS policies
        const { data: policies } = await supabase
          .rpc('get_policies', { table_name: 'email_opens' });

        result = {
          invoice_exists: !!invoice,
          tracking_data: {
            total_opens: opens?.length || 0,
            opens_details: opens
          },
          rls_policies: policies,
          tracking_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/track-email-open?invoice_id=${invoiceId}`,
          timestamp: new Date().toISOString()
        };
        break;

      case 'test_tracking':
        // Simulate an email open
        const { data: testOpen, error: testError } = await supabase
          .from('email_opens')
          .insert([{
            invoice_id: invoiceId,
            customer_id: url.searchParams.get('customer_id'),
            ip_address: '127.0.0.1',
            user_agent: 'Debug Test'
          }])
          .select()
          .single();

        if (testError) throw testError;

        result = {
          success: true,
          test_record: testOpen,
          timestamp: new Date().toISOString()
        };
        break;

      case 'fix_policies':
        // Recreate policies
        await supabase.rpc('recreate_email_tracking_policies');
        
        result = {
          success: true,
          message: 'Email tracking policies have been reset',
          timestamp: new Date().toISOString()
        };
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});