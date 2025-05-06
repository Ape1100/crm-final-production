import { useRef } from 'react';
import { Printer, ArrowDownToLine, X, CheckCircle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '../lib/supabase';
import { generatePDF } from '../lib/pdf';
import type { Invoice } from '../types';

interface ViewInvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
  onStatusChange: () => void;
}

export function ViewInvoiceModal({ invoice, onClose, onStatusChange }: ViewInvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice_${invoice.invoice_number}`,
    onAfterPrint: () => {
    },
  });

  async function handleMarkAsPaid() {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid', paid_date: new Date().toISOString() })
        .eq('id', invoice.id);

      if (error) throw error;
      onStatusChange();
      onClose();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      alert('Failed to mark invoice as paid. Please try again.');
    }
  }

  async function handleDownload() {
    try {
      const pdfBlob = await generatePDF(invoice);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Invoice #{invoice.invoice_number}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div ref={printRef} className="space-y-6">
          {/* Invoice content */}
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Printer size={20} className="inline-block mr-2" />
            Print
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowDownToLine size={20} className="inline-block mr-2" />
            Download
          </button>
          {invoice.status !== 'paid' && (
            <button
              type="button"
              onClick={handleMarkAsPaid}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircle size={20} className="inline-block mr-2" />
              Mark as Paid
            </button>
          )}
        </div>
      </div>
    </div>
  );
}