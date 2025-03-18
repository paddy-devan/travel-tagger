'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { LoadingSpinner } from '@/components/ui';
import { EditPinModal } from '@/components/pins';

// Import dnd-kit components
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
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

interface PinListProps {
  tripId: string;
  refreshTrigger?: number;
  onPinChanged?: () => void;
}

// Sortable pin item component
function SortablePinItem({ 
  pin, 
  onEdit, 
  onDelete, 
  isDeleting 
}: { 
  pin: Pin; 
  onEdit: (pin: Pin) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: pin.id });

  // Use the standard CSS.Transform utility for reliable dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 'auto',
    backgroundColor: isDragging ? '#f9fafb' : undefined,
    boxShadow: isDragging ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : undefined,
  };

  return (
    <li 
      ref={setNodeRef} 
      style={style} 
      className={`border rounded-md p-4 ${isDragging ? 'border-blue-300' : 'hover:bg-gray-50'}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex">
          {/* Drag handle */}
          <div 
            className="mr-2 flex items-center justify-center w-6 h-full cursor-grab active:cursor-grabbing bg-gray-50 hover:bg-gray-100 rounded p-1" 
            {...attributes} 
            {...listeners}
            title="Drag to reorder"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          
          <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mr-3 flex-shrink-0">
            <span className="text-sm font-medium text-blue-700">{pin.order}</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{pin.nickname}</h3>
            {pin.category && (
              <p className="text-xs text-gray-600">{pin.category}</p>
            )}
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => onEdit(pin)}
            className="text-gray-500 hover:text-blue-600 p-1 rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
            title="Edit pin"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(pin.id)}
            className="text-gray-500 hover:text-red-600 p-1 rounded border border-gray-200 hover:border-red-300 hover:bg-red-50"
            title="Delete pin"
            disabled={isDeleting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </li>
  );
}

export default function PinList({ tripId, refreshTrigger = 0, onPinChanged }: PinListProps) {
  const { user } = useAuth();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Set up sensors for drag and drop with minimal constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Simpler activation constraints
      activationConstraint: {
        distance: 1, // Minimal distance to start dragging
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchPins = useCallback(async () => {
    if (!user || !tripId) return;
    
    try {
      setLoading(true);
      
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
      console.error('Error fetching pins:', error);
    } finally {
      setLoading(false);
    }
  }, [tripId, user]);

  useEffect(() => {
    fetchPins();
  }, [fetchPins, refreshTrigger]);

  const handleEditPin = (pin: Pin) => {
    setEditingPin(pin);
  };

  const handleSavePin = async (id: string, name: string, description: string, category: string, visited: boolean) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('pins')
        .update({
          nickname: name,
          notes: description,
          category: category || null,
          visited_flag: visited
        })
        .eq('id', id)
        .eq('trip_id', tripId);
      
      if (error) throw error;
      
      // Refresh the pins list
      fetchPins();
      // Notify parent component about the change
      if (onPinChanged) onPinChanged();
      // Close the edit modal
      setEditingPin(null);
    } catch (error) {
      console.error('Error updating pin:', error);
    }
  };

  const handleDeletePin = async (id: string) => {
    if (!user || isDeleting) return;
    
    if (!confirm('Are you sure you want to delete this pin?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('pins')
        .delete()
        .eq('id', id)
        .eq('trip_id', tripId);
      
      if (error) throw error;
      
      // Refresh the pins list
      fetchPins();
      // Notify parent component about the change
      if (onPinChanged) onPinChanged();
    } catch (error) {
      console.error('Error deleting pin:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle the drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Find the indices of the dragged item and the item it's dropped over
      const oldIndex = pins.findIndex((item) => item.id === active.id);
      const newIndex = pins.findIndex((item) => item.id === over.id);
      
      // Update pins state first to show immediate visual feedback
      const updatedPinsArray = arrayMove([...pins], oldIndex, newIndex);
      
      // Update order values for all items
      const reorderedPins = updatedPinsArray.map((pin, index) => ({
        ...pin,
        order: index + 1 // Update the order starting from 1
      }));
      
      // Set the updated pins with new orders
      setPins(reorderedPins);
      
      // Update order values in database
      if (user) {
        try {
          setIsSaving(true);
          
          // Perform individual updates rather than bulk upsert
          // This is more reliable for updating order values
          for (const pin of reorderedPins) {
            const { error } = await supabase
              .from('pins')
              .update({ order: pin.order })
              .eq('id', pin.id)
              .eq('trip_id', tripId);
            
            if (error) {
              console.error('Supabase update error:', error);
              throw error;
            }
          }

          console.log('Successfully updated pin orders');
          // Notify parent component about the change
          if (onPinChanged) onPinChanged();
        } catch (error) {
          console.error('Error updating pin order:', error);
          // Log more detailed error information
          if (error instanceof Error) {
            console.error('Error details:', error.message);
          } else {
            console.error('Unknown error type:', error);
          }
          
          // If there's an error, revert back to the original order
          fetchPins();
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  if (loading && pins.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        Error loading pins: {error}
        <button 
          onClick={fetchPins}
          className="ml-2 text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Pins</h2>
      
      {pins.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <p>No pins added yet.</p>
          <p className="mt-2 text-sm">Click anywhere on the map to add a pin!</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          // Only use restrictToVerticalAxis to keep it simple
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={pins.map(pin => pin.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-3">
              {pins.map((pin) => (
                <SortablePinItem
                  key={pin.id}
                  pin={pin}
                  onEdit={handleEditPin}
                  onDelete={handleDeletePin}
                  isDeleting={isDeleting}
                />
              ))}
            </ul>
          </SortableContext>

          {isSaving && (
            <div className="mt-3 text-sm text-blue-600 flex items-center">
              <LoadingSpinner size="small" />
              <span className="ml-2">Saving order...</span>
            </div>
          )}
        </DndContext>
      )}
      
      {editingPin && (
        <EditPinModal
          pin={editingPin}
          onSave={handleSavePin}
          onCancel={() => setEditingPin(null)}
        />
      )}
    </div>
  );
} 