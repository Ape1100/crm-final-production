import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const VERIFIED_SENDER = 'portal@crmrapid.com';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const mailerSendApiKey = Deno.env.get('MAILERSEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Validate environment variables
    if (!mailerSendApiKey) {
      throw new Error('MAILERSEND_API_KEY is not configured');
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate request data
    let requestData;
    try {
      const text = await req.text();
      requestData = JSON.parse(text);
    } catch (error) {
      throw new Error('Invalid request format: ' + error.message);
    }

    // Validate required fields
    const requiredFields = [
      'from_name', 'to_email', 'to_name', 'subject', 'html_content',
      'invoice_id', 'customer_id', 'user_id', 'invoice_number', 'invoice_status'
    ];
    
    const missingFields = requiredFields.filter(field => !requestData[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestData.to_email)) {
      throw new Error('Invalid email format');
    }

    // Add tracking pixel to HTML content
    const trackingPixel = `<img src="${supabaseUrl}/functions/v1/track-email-open?invoice_id=${requestData.invoice_id}&customer_id=${requestData.customer_id}" width="1" height="1" style="display:none">`;
    const htmlWithTracking = requestData.html_content + trackingPixel;

    // Send email
    console.log('Sending email via MailerSend...');
    const emailData = {
      from: {
        email: VERIFIED_SENDER,
        name: requestData.from_name
      },
      to: [{
        email: requestData.to_email,
        name: requestData.to_name
      }],
      subject: requestData.subject,
      html: htmlWithTracking,
      tracking: {
        opens: true,
        clicks: true
      }
    };

    const mailResponse = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mailerSendApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!mailResponse.ok) {
      const errorText = await mailResponse.text();
      console.error('MailerSend API error:', errorText);
      throw new Error('Failed to send email: ' + errorText);
    }

    // Update database
    console.log('Updating database...');
    const { error: dbError } = await supabase.rpc('handle_email_sent', {
      p_invoice_id: requestData.invoice_id,
      p_invoice_number: requestData.invoice_number,
      p_customer_email: requestData.to_email,
      p_invoice_status: requestData.invoice_status,
      p_user_id: requestData.user_id
    });

    if (dbError) {
      console.error('Database update error:', dbError);
      // Don't throw here as email was sent successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully'
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
        details: error.stack
      }),
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