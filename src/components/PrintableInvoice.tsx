import React from 'react';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import type { Invoice, Customer, InvoiceSettings } from '../types';
import { generatePDF } from '../lib/pdf';

interface PrintableInvoiceProps {
  invoice: Invoice;
  customer: Customer | null;
  settings: InvoiceSettings;
  showDownloadButton?: boolean;
  businessName?: string;
}

export const PrintableInvoice = React.forwardRef<HTMLDivElement, PrintableInvoiceProps>(
  ({ invoice, customer, settings, showDownloadButton = true, businessName }, ref) => {
    const formatCurrency = (value: number | null | undefined): string => {
      return `$${(value ?? 0).toFixed(2)}`;
    };

    const handleDownload = async () => {
      try {
        const pdfBlob = await generatePDF(invoice);
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${invoice.status === 'estimate' ? 'estimate' : 'invoice'}-${invoice.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
      }
    };

    if (!customer) {
      return (
        <div className="p-8 text-center">
          <p className="text-gray-600">Loading customer information...</p>
        </div>
      );
    }

    return (
      <div ref={ref} className="bg-white p-4 sm:p-8 max-w-4xl mx-auto">
        {showDownloadButton && (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleDownload}
              className="flex items-center w-full sm:w-auto px-4 py-2 text-base sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              style={{ minHeight: 48 }}
            >
              <Download size={20} className="mr-2" />
              Download PDF
            </button>
          </div>
        )}

        <div className="print:p-0">
          {/* Business Information */}
          <div className="text-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{businessName || 'Business Name'}</h2>
          </div>

          {/* Invoice Details */}
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {invoice.status === 'estimate' ? 'ESTIMATE' : 'INVOICE'}
              </h2>
              <p className="text-gray-600 mt-1">#{invoice.invoice_number}</p>
              <p className="text-gray-600">
                Date: {format(new Date(invoice.created_at), 'MMM d, yyyy')}
              </p>
              <p className="text-gray-600">
                Due Date: {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : 'N/A'}
              </p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mt-4">
            <h3 className="text-gray-600 font-medium mb-2">Bill To:</h3>
            <div className="text-gray-800">
              <p className="font-medium">
                {customer.first_name} {customer.last_name}
              </p>
              {customer.email && <p>{customer.email}</p>}
              {customer.phone && <p>{customer.phone}</p>}
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-right py-3 px-4">Quantity</th>
                  <th className="text-right py-3 px-4">Rate</th>
                  <th className="text-right py-3 px-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-4 px-4">{item.description || 'N/A'}</td>
                    <td className="text-right py-4 px-4">{item.quantity ?? 0}</td>
                    <td className="text-right py-4 px-4">{formatCurrency(item.rate)}</td>
                    <td className="text-right py-4 px-4">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}></td>
                  <td className="text-right py-4 px-4 font-medium">Subtotal</td>
                  <td className="text-right py-4 px-4">{formatCurrency(invoice.subtotal)}</td>
                </tr>
                {invoice.tax_amount !== undefined && invoice.tax_rate !== undefined && (
                  <tr>
                    <td colSpan={2}></td>
                    <td className="text-right py-4 px-4 font-medium">
                      Tax ({(invoice.tax_rate ?? 0).toFixed(1)}%)
                    </td>
                    <td className="text-right py-4 px-4">{formatCurrency(invoice.tax_amount)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={2}></td>
                  <td className="text-right py-4 px-4 font-bold">Total</td>
                  <td className="text-right py-4 px-4 font-bold">
                    {formatCurrency(invoice.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-2">
              <h3 className="text-gray-600 font-medium mb-2">Notes:</h3>
              <p className="text-gray-800">{invoice.notes}</p>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="mt-2 text-sm text-gray-600">
            <p>Terms and Conditions:</p>
            <p className="mt-2">{settings.terms || 'Standard terms and conditions apply.'}</p>
          </div>
        </div>
      </div>
    );
  }
);

PrintableInvoice.displayName = 'PrintableInvoice';