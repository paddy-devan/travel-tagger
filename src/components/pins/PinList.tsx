'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { LoadingSpinner } from '@/components/ui';

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
              <div className="flex justify-between">
                <h3 className="font-medium text-lg">{pin.nickname}</h3>
                {pin.visited_flag && (
                  <span className="text-green-600 text-sm font-medium">✓ Visited</span>
                )}
              </div>
              
              {pin.category && (
                <div className="mt-1 text-sm text-blue-600">
                  Category: {pin.category}
                </div>
              )}
              
              {pin.notes && (
                <p className="text-gray-600 mt-2">{pin.notes}</p>
              )}
              
              <div className="mt-2 text-xs text-gray-400">
                Added on {formatDate(pin.created_at)}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                Coordinates: {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 