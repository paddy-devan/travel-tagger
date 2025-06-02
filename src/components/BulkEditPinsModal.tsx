'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import LoadingSpinner from '@/components/LoadingSpinner';
import { PIN_CATEGORIES } from '@/lib/constants';

// Add dnd-kit imports
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// Sortable table row component
function SortableTableRow({ 
  pin, 
  index, 
  updatePin 
}: { 
  pin: Pin; 
  index: number; 
  updatePin: (index: number, field: keyof Pin, value: any) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ 
    id: pin.id 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={`hover:bg-gray-50 ${isDragging ? 'opacity-50 bg-blue-50' : ''}`}
    >
      {/* Drag Handle Column */}
      <td className="px-3 py-2 text-center w-12">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
          type="button"
        >
          <svg viewBox="0 0 20 20" width="16" fill="currentColor">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
          </svg>
        </button>
      </td>
      
      {/* Order Number */}
      <td className="px-3 py-2 text-sm text-gray-600 w-16">
        {pin.order + 1}
      </td>
      
      {/* Name Input */}
      <td className="px-3 py-2">
        <input
          type="text"
          value={pin.nickname}
          onChange={(e) => updatePin(index, 'nickname', e.target.value)}
          className="w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </td>
      
      {/* Category Dropdown */}
      <td className="px-3 py-2">
        <select
          value={pin.category || ''}
          onChange={(e) => updatePin(index, 'category', e.target.value || null)}
          className="w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Select Category --</option>
          {PIN_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </td>
      
      {/* Notes Textarea */}
      <td className="px-3 py-2">
        <textarea
          value={pin.notes || ''}
          onChange={(e) => updatePin(index, 'notes', e.target.value || null)}
          className="w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={2}
          placeholder="Add notes..."
        />
      </td>
      
      {/* Visited Checkbox */}
      <td className="px-3 py-2 text-center w-20">
        <input
          type="checkbox"
          checked={pin.visited_flag}
          onChange={(e) => updatePin(index, 'visited_flag', e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </td>
    </tr>
  );
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

  // Add drag and drop sensor
  const sensors = useSensors(useSensor(PointerSensor));

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

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = pins.findIndex((p) => p.id === active.id);
      const newIndex = pins.findIndex((p) => p.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) return;

      // Optimistic update
      const updatedPins = arrayMove(pins, oldIndex, newIndex);
      const reorderedPins = updatedPins.map((pin, index) => ({ ...pin, order: index }));
      setPins(reorderedPins);

      // Save to database (similar to PinList implementation)
      try {
        const { error } = await supabase.rpc('reorder_pin', {
          moved_pin_id: String(active.id),
          new_parent_id: null,
          new_order_index: newIndex
        });
        
        if (error) throw error;
      } catch (error) {
        console.error('Error saving pin order:', error);
        setError('Failed to save new order. Reverting changes.');
        // Revert on error
        fetchPins();
      }
    }
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
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden text-gray-900">
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase w-12">
                        ⋮⋮
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase w-16">
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
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase w-20">
                        Visited
                      </th>
                    </tr>
                  </thead>
                  <SortableContext 
                    items={pins.map(p => p.id)} 
                    strategy={verticalListSortingStrategy}
                  >
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pins.map((pin, index) => (
                        <SortableTableRow 
                          key={pin.id}
                          pin={pin}
                          index={index}
                          updatePin={updatePin}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </div>
            </DndContext>
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