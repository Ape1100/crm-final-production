import { useState, useEffect } from 'react';
import { Plus, Search, Filter, AlertCircle, Package, BarChart, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AddInventoryModal } from '../components/AddInventoryModal';
import { InventorySettingsModal } from '../components/InventorySettingsModal';
import type { InventoryItem, InventoryCategory } from '../types';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, []);

  useEffect(() => {
    const low = items.filter(item => item.stock_quantity <= item.reorder_point);
    setLowStockItems(low);
  }, [items]);

  async function fetchInventory() {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        inventory_categories (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventory:', error);
      return;
    }

    setItems(data || []);
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    setCategories(data || []);
  }

  const stats = [
    {
      label: 'Total Items',
      value: items.length,
      icon: Package,
      color: 'text-blue-600'
    },
    {
      label: 'Low Stock Items',
      value: lowStockItems.length,
      icon: AlertCircle,
      color: 'text-red-600'
    },
    {
      label: 'Categories',
      value: categories.length,
      icon: Filter,
      color: 'text-green-600'
    },
    {
      label: 'Total Value',
      value: `$${items.reduce((sum, item) => sum + (item.price * item.stock_quantity), 0).toFixed(2)}`,
      icon: BarChart,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            <span>Add Item</span>
          </button>
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-200"
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </div>
      </div>

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
                <Icon className={stat.color} size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <h2 className="text-lg font-semibold flex items-center text-red-700 mb-2">
            <AlertCircle size={20} className="mr-2" />
            Low Stock Alerts
          </h2>
          <div className="space-y-2">
            {lowStockItems.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-md">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-600 font-medium">{item.stock_quantity} in stock</p>
                  <p className="text-sm text-gray-500">Reorder at: {item.reorder_point}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-white pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-[800px] divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
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
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  {item.batch_tracking && item.expiration_date && (
                    <div className="text-xs text-gray-500">
                      Expires: {new Date(item.expiration_date).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {categories.find(c => c.id === item.category_id)?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${item.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.stock_quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.stock_quantity <= item.reorder_point
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item.stock_quantity <= item.reorder_point ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                  <button className="text-blue-600 hover:text-blue-800">History</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <AddInventoryModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onItemAdded={() => {
            fetchInventory();
            setShowAddModal(false);
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <InventorySettingsModal
          categories={categories}
          onClose={() => setShowSettingsModal(false)}
          onCategoriesUpdated={() => {
            fetchCategories();
            fetchInventory();
          }}
        />
      )}
    </div>
  );
}