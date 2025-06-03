'use client';

import { useState, useEffect } from 'react';
import { PIN_CATEGORIES } from '@/lib/constants';

interface AddPinModalProps {
  onAdd: (name: string, description: string, category: string) => void;
  onCancel: () => void;
  location: { lat: number; lng: number };
  suggestedName?: string;
}

export default function AddPinModal({ onAdd, onCancel, location, suggestedName = '' }: AddPinModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use suggestedName if provided
  useEffect(() => {
    if (suggestedName) {
      setName(suggestedName);
    }
  }, [suggestedName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    onAdd(name, description, category);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Add New Location</h2>
        
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
          <p>Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Location Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Eiffel Tower, Our Hotel, etc."
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category (Optional)
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Category --</option>
              {PIN_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add notes about this location..."
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Adding...' : 'Add Pin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 