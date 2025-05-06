import pdfMake from "npm:pdfmake@0.2.7";
import { TDocumentDefinitions } from "npm:pdfmake@0.2.7/interfaces";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Define fonts for pdfmake
const fonts = {
  Roboto: {
    normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf',
    bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf',
    italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-MediumItalic.ttf'
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceData } = await req.json();

    if (!invoiceData) {
      throw new Error('Invoice data is required');
    }

    // Ensure numeric values are valid
    const safeSubtotal = typeof invoiceData.subtotal === 'number' ? invoiceData.subtotal : 0;
    const safeTaxAmount = typeof invoiceData.taxAmount === 'number' ? invoiceData.taxAmount : 0;
    const safeTotal = typeof invoiceData.total === 'number' ? invoiceData.total : 0;

    // Create document definition
    const docDefinition: TDocumentDefinitions = {
      content: [
        // Header
        {
          columns: [
            {
              width: '*',
              text: invoiceData.businessName || 'Business Name',
              style: 'header'
            },
            {
              width: '*',
              text: `Invoice #${invoiceData.invoiceNumber}`,
              style: 'header',
              alignment: 'right'
            }
          ]
        },
        '\n',
        // Customer Information
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'Bill To:', style: 'subheader' },
                invoiceData.customerName || '',
                invoiceData.customerEmail || '',
                invoiceData.customerAddress || ''
              ]
            },
            {
              width: '*',
              stack: [
                { text: 'Invoice Details:', style: 'subheader' },
                `Date: ${invoiceData.date ? new Date(invoiceData.date).toLocaleDateString() : 'N/A'}`,
                `Due Date: ${invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : 'N/A'}`,
                `Status: ${invoiceData.status || 'N/A'}`
              ],
              alignment: 'right'
            }
          ]
        },
        '\n',
        // Items Table
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Description', style: 'tableHeader' },
                { text: 'Quantity', style: 'tableHeader' },
                { text: 'Rate', style: 'tableHeader' },
                { text: 'Amount', style: 'tableHeader' }
              ],
              ...(Array.isArray(invoiceData.items) ? invoiceData.items : []).map(item => [
                item.description || '',
                (typeof item.quantity === 'number' ? item.quantity : 0).toString(),
                `$${(typeof item.rate === 'number' ? item.rate : 0).toFixed(2)}`,
                `$${(typeof item.amount === 'number' ? item.amount : 0).toFixed(2)}`
              ])
            ]
          }
        },
        '\n',
        // Totals
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              stack: [
                { 
                  columns: [
                    { width: '*', text: 'Subtotal:', alignment: 'right' },
                    { width: 'auto', text: `$${safeSubtotal.toFixed(2)}`, alignment: 'right' }
                  ]
                },
                { 
                  columns: [
                    { width: '*', text: 'Tax:', alignment: 'right' },
                    { width: 'auto', text: `$${safeTaxAmount.toFixed(2)}`, alignment: 'right' }
                  ]
                },
                { 
                  columns: [
                    { width: '*', text: 'Total:', alignment: 'right', style: 'total' },
                    { width: 'auto', text: `$${safeTotal.toFixed(2)}`, alignment: 'right', style: 'total' }
                  ]
                }
              ]
            }
          ]
        }
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 0, 0, 5]
        },
        tableHeader: {
          bold: true,
          fillColor: '#f8f9fa'
        },
        total: {
          bold: true,
          fontSize: 14
        }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    // Create PDF
    const pdfDoc = pdfMake.createPdf(docDefinition, null, fonts);
    
    // Get PDF as buffer
    const pdfBuffer = await new Promise<Uint8Array>((resolve, reject) => {
      pdfDoc.getBuffer((buffer) => {
        resolve(buffer);
      });
    });

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.byteLength.toString(),
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(
      JSON.stringify({
        error: 'PDF generation failed',
        message: error.message
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