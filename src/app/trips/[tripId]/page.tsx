'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import PinList from '@/components/PinList';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Trip {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  user_id: string;
}

export default function TripDetailPageContent() {
  const params = useParams();
  const tripId = typeof params?.tripId === 'string' ? params.tripId : '';
  const { user, isLoading: authLoading } = useAuth();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!user || !tripId) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .eq('user_id', user.id)
          .single();

        if (tripError) throw tripError;
        if (!data) {
          throw new Error('Trip not found or you do not have access to this trip.');
        }
        setTrip(data);

      } catch (error: unknown) {
        const err = error as { message?: string };
        const errorMessage = err.message || 'Failed to load trip data';
        setError(errorMessage);
        console.error('Error fetching trip data:', error);
        setTrip(null);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchTripDetails();
    }
  }, [tripId, user, authLoading]);

  if (loading && !authLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 h-full flex flex-col">
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-4 flex justify-center items-center h-full">
        <p className='text-sm text-gray-500'>Loading trip details...</p>
      </div>
    );
  }

  return (
    <PinList 
      tripId={trip.id.toString()} 
      tripName={trip.name}
      tripStartDate={trip.start_date}
      tripEndDate={trip.end_date}
    />
  );
} 