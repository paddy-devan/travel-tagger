'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Pin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string | null;
  trip_id: string;
  created_at: string;
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

  const fetchPins = useCallback(async () => {
    if (!user || !tripId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
        <ul className="space-y-4">
          {pins.map((pin) => (
            <li key={pin.id} className="border rounded-md p-4 hover:bg-gray-50">
              <h3 className="font-medium text-lg">{pin.name}</h3>
              {pin.description && (
                <p className="text-gray-600 mt-1">{pin.description}</p>
              )}
              <div className="mt-2 text-xs text-gray-400">
                Added on {formatDate(pin.created_at)}
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Coordinates: {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 