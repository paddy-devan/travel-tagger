'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import LoadingSpinner from '@/components/LoadingSpinner';
import EditPinModal from '@/components/EditPinModal';
import ShareTripModal from '@/components/ShareTripModal';
import Link from 'next/link';
import { format, isValid } from 'date-fns';
import { useTripContext } from '@/lib/TripContext';

// Simplified dnd-kit imports
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

interface PinListProps {
  tripId: string;
  tripName?: string;
  tripStartDate?: string | null;
  tripEndDate?: string | null;
}

// Simplified sortable pin card component
function SortablePinCard({ pin, onEdit }: { pin: Pin; onEdit: (pin: Pin) => void; }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: pin.id });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`border border-gray-200 rounded-lg p-3 mb-3 bg-white shadow-sm ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center flex-grow min-w-0 mr-3">
          <button 
            {...attributes} 
            {...listeners}
            type="button"
            className="flex-shrink-0 p-2 mr-2 text-gray-400 hover:text-gray-600 cursor-grab"
            aria-label="Drag to reorder pin"
          >
             <svg viewBox="0 0 20 20" width="16" fill="currentColor">
               <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
             </svg>
          </button>
          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full text-xs font-medium text-blue-700 mr-2">
            {pin.order + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {pin.nickname}
            </p>
            {pin.category && (
              <p className="text-xs text-gray-500 truncate">{pin.category}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => onEdit(pin)}
          className="flex-shrink-0 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

// Date formatting helper
const formatTripDateRange = (start?: string | null, end?: string | null): string => {
    const startDate = start && new Date(start);
    const endDate = end && new Date(end);
    const isValidStart = startDate && isValid(startDate);
    const isValidEnd = endDate && isValid(endDate);
    if (isValidStart && isValidEnd) {
      return format(startDate, 'yyyyMMdd') === format(endDate, 'yyyyMMdd')
        ? format(startDate, 'MMM d, yyyy')
        : `${format(startDate, 'MMM d, yyyy')} – ${format(endDate, 'MMM d, yyyy')}`;
    } else if (isValidStart) {
      return `Starts ${format(startDate, 'MMM d, yyyy')}`;
    } else if (isValidEnd) {
      return `Ends ${format(endDate, 'MMM d, yyyy')}`;
    }
    return 'No dates set';
};

export default function PinList({ 
  tripId, 
  tripName = 'Trip',
  tripStartDate,
  tripEndDate
}: PinListProps) {
  const { user } = useAuth();
  const { refreshKey } = useTripContext();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Simplified sensor setup - only pointer sensor
  const sensors = useSensors(useSensor(PointerSensor));

  const fetchPins = useCallback(async (skipLoading = false) => {
    if (!user || !tripId) return;
    
    try {
      if (!skipLoading) {
        setLoading(true);
      }
      
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('trip_id', tripId)
        .order('order', { ascending: true });
      
      if (error) throw error;
      
      setPins(data || []);
      setError(null);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setError(err.message || 'Failed to load pins');
      console.error('Error fetching pins:', error);
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  }, [tripId, user]);

  useEffect(() => {
    fetchPins();
  }, [fetchPins, refreshKey]);

  const handleEditPin = (pin: Pin) => {
    setEditingPin(pin);
  };

  const handleCloseEditModal = () => {
    setEditingPin(null);
  };

  const handleSavePin = async (id: string, nickname: string, notes: string | null, category: string | null, visited: boolean) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('pins')
        .update({ nickname, notes, category, visited_flag: visited, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('trip_id', tripId);
      
      if (error) throw error;
      
      fetchPins();
      handleCloseEditModal();
    } catch (error) {
      console.error('Error updating pin:', error);
    }
  };

  const handleAddPinClick = () => {
    console.log("Add Pin button clicked - implement modal opening");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = pins.findIndex((p) => p.id === active.id);
      const newIndex = pins.findIndex((p) => p.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) return;

      // Update UI immediately (optimistic update)
      const updatedPins = arrayMove(pins, oldIndex, newIndex);
      const reorderedPins = updatedPins.map((pin, index) => ({ ...pin, order: index }));
      setPins(reorderedPins);

      // Save to database
      try {
        const { error } = await supabase.rpc('reorder_pin', {
          moved_pin_id: String(active.id),
          new_parent_id: null,
          new_order_index: newIndex
        });
        
        if (error) throw error;
      } catch (rpcError) {
        console.error('Error saving pin order:', rpcError);
        setError('Failed to save new order. Reverting.');
        fetchPins(true); // Revert to server state if there's an error
      }
    }
  };

  const handleShareTrip = () => {
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
  };

  if (loading) {
    return <div className="p-4 flex justify-center"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
           <Link 
             href="/dashboard"
             className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
             </svg>
             Back
           </Link>
           <button 
             onClick={handleAddPinClick} 
             className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-sm"
           >
             + New Pin
           </button>
        </div>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 truncate">{tripName}</h2>
          <button 
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-md hover:bg-gray-50"
            title="Share trip"
            onClick={handleShareTrip}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500">
          {formatTripDateRange(tripStartDate, tripEndDate)}
        </p>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext 
          items={pins.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="overflow-y-auto flex-grow p-4 pr-3">
             {pins.length === 0 ? (
                <p className="text-center text-gray-500 py-6">No pins added to this trip yet.</p>
             ) : (
               pins.map((pin) => (
                  <SortablePinCard key={pin.id} pin={pin} onEdit={handleEditPin} />
                ))
             )}
          </div>
        </SortableContext>
      </DndContext>

      {editingPin && (
        <EditPinModal 
          pin={editingPin} 
          onCancel={handleCloseEditModal} 
          onSave={handleSavePin} 
        />
      )}

      {showShareModal && (
        <ShareTripModal 
          tripId={tripId}
          tripName={tripName}
          isOpen={showShareModal}
          onClose={handleCloseShareModal}
        />
      )}
    </div>
  );
} 