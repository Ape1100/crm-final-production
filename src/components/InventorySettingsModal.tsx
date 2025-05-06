import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { InventoryCategory } from '../types';

interface InventorySettingsModalProps {
  categories: InventoryCategory[];
  onClose: () => void;
  onCategoriesUpdated: () => void;
}

export function InventorySettingsModal({ 
  categories, 
  onClose, 
  onCategoriesUpdated 
}: InventorySettingsModalProps) {
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState('');

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const { error } = await supabase
        .from('inventory_categories')
        .insert([{ name: newCategory.trim() }]);

      if (error) throw error;

      setNewCategory('');
      onCategoriesUpdated();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category. Please try again.');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory.trim() || !selectedCategory) return;

    try {
      const { error } = await supabase
        .from('inventory_categories')
        .update({ name: editingCategory.trim() })
        .eq('id', selectedCategory);

      if (error) throw error;

      setSelectedCategory('');
      setEditingCategory('');
      onCategoriesUpdated();
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Inventory Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Add Category */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Add Category</h3>
          <form onSubmit={handleAddCategory} className="flex space-x-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </form>
        </div>

        {/* Edit Category */}
        <div>
          <h3 className="text-lg font-medium mb-3">Edit Category</h3>
          <form onSubmit={handleUpdateCategory} className="space-y-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                const category = categories.find(c => c.id === e.target.value);
                setEditingCategory(category ? category.name : '');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {selectedCategory && (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={editingCategory}
                  onChange={(e) => setEditingCategory(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}