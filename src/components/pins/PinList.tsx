'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { LoadingSpinner } from '@/components/ui';
import { EditPinModal } from '@/components/pins';

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
}

export default function PinList({ tripId, refreshTrigger = 0 }: PinListProps) {
  const { user } = useAuth();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    } catch (error) {
      console.error('Error deleting pin:', error);
    } finally {
      setIsDeleting(false);
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
      <h2 className="text-xl font-semibold mb-4">Saved Locations</h2>
      
      {pins.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <p>No pins added yet.</p>
          <p className="mt-2 text-sm">Click anywhere on the map to add a pin!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {pins.map((pin) => (
            <li key={pin.id} className="border rounded-md p-3 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex">
                  <div className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full mr-3 flex-shrink-0">
                    <span className="text-sm font-medium text-blue-700">{pin.order}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{pin.nickname}</h3>
                    {pin.category && (
                      <p className="text-xs text-gray-600">{pin.category}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditPin(pin)}
                    className="text-gray-500 hover:text-blue-600"
                    title="Edit pin"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeletePin(pin.id)}
                    className="text-gray-500 hover:text-red-600"
                    title="Delete pin"
                    disabled={isDeleting}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
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