'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import LoadingSpinner from '@/components/LoadingSpinner';

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

interface BulkEditPinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onSave?: () => void;
}

export default function BulkEditPinsModal({ 
  isOpen, 
  onClose, 
  tripId, 
  onSave 
}: BulkEditPinsModalProps) {
  const { user } = useAuth();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pins when modal opens
  useEffect(() => {
    if (isOpen && user && tripId) {
      fetchPins();
    }
  }, [isOpen, user, tripId]);

  const fetchPins = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('trip_id', tripId)
        .order('order', { ascending: true });
      
      if (error) throw error;
      setPins(data || []);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setError(err.message || 'Failed to load pins');
    } finally {
      setLoading(false);
    }
  };

  const updatePin = (index: number, field: keyof Pin, value: any) => {
    const updatedPins = [...pins];
    updatedPins[index] = { ...updatedPins[index], [field]: value };
    setPins(updatedPins);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Update all pins in batch
      for (const pin of pins) {
        const { error } = await supabase
          .from('pins')
          .update({
            nickname: pin.nickname,
            notes: pin.notes,
            category: pin.category,
            visited_flag: pin.visited_flag,
            updated_at: new Date().toISOString()
          })
          .eq('id', pin.id);
        
        if (error) throw error;
      }

      onSave?.();
      onClose();
    } catch (error: unknown) {
      const err = error as { message?: string };
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden text-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Bulk Edit Pins</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : pins.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No pins found for this trip.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                      #
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                      Category
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                      Notes
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                      Visited
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pins.map((pin, index) => (
                    <tr key={pin.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-600">
                        {pin.order + 1}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={pin.nickname}
                          onChange={(e) => updatePin(index, 'nickname', e.target.value)}
                          className="w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={pin.category || ''}
                          onChange={(e) => updatePin(index, 'category', e.target.value || null)}
                          className="w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Restaurant, Hotel..."
                        />
                      </td>
                      <td className="px-3 py-2">
                        <textarea
                          value={pin.notes || ''}
                          onChange={(e) => updatePin(index, 'notes', e.target.value || null)}
                          className="w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={2}
                          placeholder="Add notes..."
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={pin.visited_flag}
                          onChange={(e) => updatePin(index, 'visited_flag', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || pins.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
} 