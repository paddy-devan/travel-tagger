'use client';

import { useState, useEffect } from 'react';
import { PIN_CATEGORIES } from '@/lib/constants';

interface Pin {
  id: string;
  nickname: string;
  latitude: number;
  longitude: number;
  notes: string | null;
  trip_id: string;
  google_maps_id: string | null;
  visited_flag: boolean;
  category: string | null;
  created_at: string;
  order: number;
}

interface EditPinModalProps {
  pin: Pin;
  onSave: (id: string, name: string, description: string, category: string, visited: boolean) => void;
  onCancel: () => void;
}

export default function EditPinModal({ pin, onSave, onCancel }: EditPinModalProps) {
  const [name, setName] = useState(pin.nickname || '');
  const [description, setDescription] = useState(pin.notes || '');
  const [category, setCategory] = useState(pin.category || '');
  const [visited, setVisited] = useState(pin.visited_flag);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Reset form when pin changes
    setName(pin.nickname || '');
    setDescription(pin.notes || '');
    setCategory(pin.category || '');
    setVisited(pin.visited_flag);
  }, [pin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    onSave(pin.id, name, description, category, visited);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Edit Location</h2>
        
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
          <p>Coordinates: {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}</p>
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
          
          <div className="mb-4">
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
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={visited}
                onChange={(e) => setVisited(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Marked as visited</span>
            </label>
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 