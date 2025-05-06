import { supabase } from './supabase';
import type { Invoice, Customer } from '../types';

interface SendEmailParams {
  invoice: Invoice;
  customer: Customer;
  invoice_id: string;
  customer_id: string;
}

export async function sendInvoiceEmail({ 
  invoice, 
  customer, 
  invoice_id, 
  customer_id
}: SendEmailParams) {
  try {
    if (!customer.email) {
      throw new Error('Customer email is required');
    }

    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User session not found');
    }

    // Get the business profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) throw new Error('Business profile not found');

    // Format currency
    const formatCurrency = (value: number): string => {
      return value.toFixed(2);
    };

    // Create tracking pixel URL
    const trackingPixelUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-email-open?invoice_id=${invoice_id}&customer_id=${customer_id}`;

    // Prepare email HTML content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          ${profile.logo_url ? `<img src="${profile.logo_url}" alt="${profile.business_name}" style="max-height: 100px; margin-bottom: 20px;">` : ''}
          <h2 style="color: #333; margin: 0;">${profile.business_name}</h2>
        </div>

        <p style="color: #555; font-size: 16px;">Dear ${customer.first_name},</p>
        
        <p style="color: #555; font-size: 16px;">Please find your ${invoice.type === 'estimate' ? 'estimate' : 'invoice'} details below:</p>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">${invoice.type === 'estimate' ? 'Estimate' : 'Invoice'} #${invoice.invoice_number}</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="border-bottom: 1px solid #dee2e6;">
              <th style="text-align: left; padding: 8px; background-color: #f1f3f5;">Description</th>
              <th style="text-align: right; padding: 8px; background-color: #f1f3f5;">Quantity</th>
              <th style="text-align: right; padding: 8px; background-color: #f1f3f5;">Rate</th>
              <th style="text-align: right; padding: 8px; background-color: #f1f3f5;">Amount</th>
            </tr>
            ${invoice.items.map(item => `
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px;">${item.description}</td>
                <td style="text-align: right; padding: 8px;">${item.quantity}</td>
                <td style="text-align: right; padding: 8px;">$${formatCurrency(item.rate)}</td>
                <td style="text-align: right; padding: 8px;">$${formatCurrency(item.amount)}</td>
              </tr>
            `).join('')}
            <tr>
              <td colspan="3" style="text-align: right; padding: 8px; font-weight: bold;">Subtotal:</td>
              <td style="text-align: right; padding: 8px;">$${formatCurrency(invoice.subtotal)}</td>
            </tr>
            ${invoice.tax_amount ? `
              <tr>
                <td colspan="3" style="text-align: right; padding: 8px; font-weight: bold;">Tax (${invoice.tax_rate}%):</td>
                <td style="text-align: right; padding: 8px;">$${formatCurrency(invoice.tax_amount)}</td>
              </tr>
            ` : ''}
            <tr>
              <td colspan="3" style="text-align: right; padding: 8px; font-weight: bold;">Total:</td>
              <td style="text-align: right; padding: 8px; font-weight: bold;">$${formatCurrency(invoice.total)}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 20px; color: #666;">
          <p style="margin: 5px 0;">Due Date: ${new Date(invoice.due_date).toLocaleDateString()}</p>
          ${invoice.notes ? `<p style="margin: 5px 0;">Notes: ${invoice.notes}</p>` : ''}
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
          <p style="margin: 0;">Best regards,</p>
          <p style="margin: 5px 0;"><strong>${profile.business_name}</strong></p>
          ${profile.address ? `<p style="margin: 5px 0;">${profile.address}</p>` : ''}
          ${profile.business_email ? `<p style="margin: 5px 0;">${profile.business_email}</p>` : ''}
          ${profile.website ? `<p style="margin: 5px 0;"><a href="${profile.website}" style="color: #1a73e8;">${profile.website}</a></p>` : ''}
        </div>
        <img 
          src="${trackingPixelUrl}" 
          alt="" 
          width="1" 
          height="1" 
          style="display:none; visibility:hidden;" 
        />
      </div>
    `;

    // Send email using Edge Function
    console.log('Sending email...');
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;
    
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from_name: profile.business_name || 'Your Business',
          to_email: customer.email,
          to_name: `${customer.first_name} ${customer.last_name}`,
          subject: `${invoice.type === 'estimate' ? 'Estimate' : 'Invoice'} #${invoice.invoice_number} from ${profile.business_name}`,
          html_content: emailHtml,
          invoice_id,
          customer_id,
          user_id: session.user.id,
          invoice_number: invoice.invoice_number,
          invoice_status: invoice.type
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error response:', errorText);
        throw new Error(`Edge function error: ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }
      
      console.log('Email sent successfully');
      return result;
    } catch (fetchError) {
      if (fetchError instanceof Error) {
        throw new Error(`Failed to send email: ${fetchError.message}`);
      } else {
        throw new Error('Failed to send email: Unknown error');
      }
    }
  } catch (error) {
    console.error('Error in sendInvoiceEmail:', error);
    throw error;
  }
}