import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { getInvoiceSettings } from '../lib/settings';
import type { Customer, InvoiceItem, InvoiceSettings } from '../types';

interface CreateInvoiceModalProps {
  onClose: () => void;
  onInvoiceCreated: () => void;
}

export function CreateInvoiceModal({ onClose, onInvoiceCreated }: CreateInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null);

  useEffect(() => {
    fetchCustomers();
    fetchInvoiceSettings();
  }, []);

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

  async function fetchInvoiceSettings() {
    try {
      const settings = await getInvoiceSettings();
      setInvoiceSettings(settings);
    } catch (error) {
      console.error('Error fetching invoice settings:', error);
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
    setItems(prevItems => 
      prevItems.map(item => {
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
    );
  };

  const addItem = () => {
    setItems(prevItems => [
      ...prevItems,
      {
        id: uuidv4(),
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0
      }
    ]);
  };

  const removeItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTax = () => {
    return invoiceSettings?.tax.enabled ? calculateSubtotal() * (invoiceSettings.tax.rate / 100) : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    setLoading(true);

    try {
      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const total = calculateTotal();

      const { error } = await supabase
        .from('invoices')
        .insert({
          customer_id: selectedCustomer.id,
          invoice_number: `INV-${Date.now()}`,
          type: 'service',
          status: 'draft',
          amount: total,
          tax_rate: invoiceSettings?.tax.rate,
          tax_amount: tax,
          subtotal,
          total,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          items,
          notes: ''
        });

      if (error) throw error;
      onInvoiceCreated();
      onClose();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Create New Invoice</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const customer = customers.find(c => c.id === e.target.value);
                setSelectedCustomer(customer || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.first_name} {customer.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-start space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="w-32">
                  <input
                    type="text"
                    value={formatCurrency(item.rate)}
                    onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="w-32 text-right">
                  <span className="text-gray-700">{formatCurrency(item.amount)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Minus size={20} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <Plus size={20} className="mr-1" />
              Add Item
            </button>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
            </div>
            {invoiceSettings?.tax.enabled && (
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Tax ({invoiceSettings.tax.rate}%):</span>
                <span className="font-medium">{formatCurrency(calculateTax())}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCustomer || items.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}