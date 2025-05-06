import { Plus, Search, Filter, Download, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { CreateInvoiceModal } from '../components/CreateInvoiceModal';
import { ViewInvoiceModal } from '../components/ViewInvoiceModal';
import { EditInvoiceModal } from '../components/EditInvoiceModal';
import type { Invoice } from '../types';
import { useState, useEffect } from 'react';

// Currency formatter
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'paid'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      setError(null);
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, customers(*)')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      setInvoices(invoicesData || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowEditModal(true);
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    estimate: 'bg-yellow-100 text-yellow-700',
    void: 'bg-red-100 text-red-700'
  };

  // Calculate statistics
  const totalOutstanding = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const overdue = invoices
    .filter(inv => {
      const dueDate = inv.due_date ? new Date(inv.due_date) : null;
      return inv.status !== 'paid' && dueDate && dueDate < new Date();
    })
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const dueSoon = invoices
    .filter(inv => {
      const dueDate = inv.due_date ? new Date(inv.due_date) : null;
      if (!dueDate) return false;
      const now = new Date();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      return inv.status !== 'paid' && dueDate > now && (dueDate.getTime() - now.getTime()) <= sevenDays;
    })
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const paidThisMonth = invoices
    .filter(inv => {
      const date = new Date(inv.created_at);
      const now = new Date();
      return inv.status === 'paid' && 
        date.getMonth() === now.getMonth() && 
        date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const stats = [
    { 
      label: 'Total Outstanding', 
      value: currencyFormatter.format(totalOutstanding),
      icon: DollarSign,
      color: 'text-blue-600'
    },
    { 
      label: 'Overdue', 
      value: currencyFormatter.format(overdue),
      icon: AlertCircle,
      color: 'text-red-600'
    },
    { 
      label: 'Due Soon', 
      value: currencyFormatter.format(dueSoon),
      icon: Clock,
      color: 'text-yellow-600'
    },
    { 
      label: 'Paid This Month', 
      value: currencyFormatter.format(paidThisMonth),
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ];

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    try {
      // Ensure we have a valid date string or object
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date:', date);
        return 'Invalid Date';
      }
      return format(dateObj, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', date, error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Invoice Management</h1>
        <div className="flex space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50">
            <Download size={20} />
            <span>Export</span>
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                </div>
                <Icon className={`${stat.color}`} size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="appearance-none bg-white pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="estimate">Estimates</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-[900px] divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No invoices found
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    #{invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.customers?.first_name} {invoice.customers?.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {currencyFormatter.format(invoice.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.due_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[invoice.status]}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleView(invoice)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onInvoiceCreated={() => {}}
          onCreated={(newInvoice: Invoice) => {
            setInvoices([newInvoice, ...invoices]);
            setShowCreateModal(false);
          }}
        />
      )}

      {showViewModal && selectedInvoice && (
        <ViewInvoiceModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowViewModal(false);
            setSelectedInvoice(null);
          }}
          onStatusChange={() => {
            fetchInvoices();
          }}
        />
      )}

      {showEditModal && selectedInvoice && (
        <EditInvoiceModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowEditModal(false);
            setSelectedInvoice(null);
          }}
          onSaved={() => {
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
}