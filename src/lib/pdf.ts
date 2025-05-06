import { supabase } from './supabase';
import type { Invoice } from '../types';

export async function generatePDF(invoice: Invoice): Promise<Blob> {
  try {
    // Get customer data
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', invoice.customer_id)
      .single();

    // Get business settings
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('No authenticated user session');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('id', session.user.id)
      .single();

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber: invoice.invoice_number,
      date: invoice.created_at,
      dueDate: invoice.due_date,
      status: invoice.status,
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount
      })),
      subtotal: invoice.subtotal,
      taxAmount: invoice.tax_amount,
      total: invoice.total,
      customerName: customer ? `${customer.first_name} ${customer.last_name}` : '',
      customerEmail: customer?.email || '',
      customerAddress: customer?.address || '',
      businessName: profile?.business_name || ''
    };

    // Call the generate-pdf edge function
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ invoiceData })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate PDF: ${errorText}`);
    }

    const pdfBlob = await response.blob();
    
    if (pdfBlob.size < 1000) {
      throw new Error('Generated PDF is too small');
    }

    return pdfBlob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}