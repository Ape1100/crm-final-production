import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Users, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Invoice, InvoiceItem, Customer } from '../types';

interface EditInvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSaved: () => void;
}

interface FormData {
  status: 'draft' | 'sent' | 'paid' | 'void' | 'estimate';
  due_date: string;
  notes: string;
  items: InvoiceItem[];
  customer_id: string;
}

export function EditInvoiceModal({ invoice, onClose, onSaved }: EditInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState<FormData>({
    status: invoice.status,
    due_date: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '',
    notes: invoice.notes || '',
    items: invoice.items || [],
    customer_id: invoice.customer_id
  });

  useEffect(() => {
    if (showCustomerSelect) {
      fetchCustomers();
    }
  }, [showCustomerSelect]);

  async function fetchCustomers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }

  const formatCurrency = (value: number): string => {
    return value.toFixed(2);
  };

  const parseCurrency = (value: string): number => {
    const cleanValue = value.replace(/[^\d.]/g, '');
    const parts = cleanValue.split('.');
    const formattedValue = parts[0] + (parts.length > 1 ? '.' + parts[1].slice(0, 2) : '');
    const numberValue = parseFloat(formattedValue);
    return isNaN(numberValue) ? 0 : numberValue;
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          let updatedItem = { ...item };
          
          if (field === 'rate') {
            const numericValue = typeof value === 'string' ? parseCurrency(value) : value;
            updatedItem = {
              ...updatedItem,
              rate: numericValue,
              amount: numericValue * item.quantity
            };
          } else if (field === 'quantity') {
            const quantity = typeof value === 'string' ? parseInt(value) || 0 : value;
            updatedItem = {
              ...updatedItem,
              quantity,
              amount: quantity * item.rate
            };
          } else {
            updatedItem[field] = value as never;
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0
      }]
    }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTax = () => {
    return invoice.tax_rate ? calculateSubtotal() * (invoice.tax_rate / 100) : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const total = calculateTotal();

      const { error } = await supabase
        .from('invoices')
        .update({
          status: formData.status,
          due_date: formData.due_date,
          notes: formData.notes,
          items: formData.items,
          subtotal,
          tax_amount: tax,
          total,
          amount: total,
          customer_id: formData.customer_id
        })
        .eq('id', invoice.id);

      if (error) throw error;
      onSaved();
      onClose();
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Failed to update invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (error) throw error;
      onSaved();
      onClose();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Edit {invoice.type === 'estimate' ? 'Estimate' : 'Invoice'} #{invoice.invoice_number}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as FormData['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="void">Void</option>
                <option value="estimate">Estimate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Customer
              </label>
              <button
                type="button"
                onClick={() => setShowCustomerSelect(!showCustomerSelect)}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <Users size={16} className="mr-1" />
                Change Customer
              </button>
            </div>
            {showCustomerSelect && (
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 mb-4"
              >
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            {formData.items.map((item) => (
              <div key={item.id} className="flex items-start space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                    required
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      value={item.rate.toString()}
                      onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                      onBlur={(e) => updateItem(item.id, 'rate', formatCurrency(parseCurrency(e.target.value)))}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                      required
                    />
                  </div>
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      value={formatCurrency(item.amount)}
                      className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-right"
                      disabled
                    />
                  </div>
                </div>
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="mt-7 text-red-600 hover:text-red-800"
                  >
                    <Minus size={20} />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <Plus size={20} className="mr-1" />
              Add Another Item
            </button>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-end items-center space-x-4">
                <span className="text-gray-700">Subtotal:</span>
                <span className="text-lg font-medium">${formatCurrency(calculateSubtotal())}</span>
              </div>

              {invoice.tax_rate && (
                <div className="flex justify-end items-center space-x-4">
                  <span className="text-gray-700">Tax ({invoice.tax_rate}%):</span>
                  <span className="text-lg font-medium">${formatCurrency(calculateTax())}</span>
                </div>
              )}

              <div className="flex justify-end items-center space-x-4 pt-2 border-t">
                <span className="text-gray-700 font-medium">Total:</span>
                <span className="text-xl font-bold">${formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-between space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              <Trash2 size={18} className="mr-2" />
              Delete {invoice.type === 'estimate' ? 'Estimate' : 'Invoice'}
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full m-4">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {invoice.type === 'estimate' ? 'estimate' : 'invoice'}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}