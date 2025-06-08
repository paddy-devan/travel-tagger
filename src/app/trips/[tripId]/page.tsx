'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import PinList from '@/components/PinList';
import LoadingSpinner from '@/components/LoadingSpinner';
import BulkEditPinsModal from '@/components/BulkEditPinsModal';

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
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!user || !tripId) return;
      setLoading(true);
      setError(null);
      try {
        console.log('Checking trip access for user:', user.id, 'trip:', tripId);
        
        // Check if user owns the trip
        const { data: ownedTrip } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .eq('user_id', user.id)
          .single();

        if (ownedTrip) {
          console.log('User owns the trip');
          setTrip(ownedTrip);
          return;
        }

        // Check if user is a collaborator
        const { data: collaboration } = await supabase
          .from('trip_collaborators')
          .select('trip_id')
          .eq('trip_id', tripId)
          .eq('user_id', user.id)
          .single();

        console.log('Collaboration check:', collaboration);

        if (!collaboration) {
          throw new Error('Trip not found or you do not have access to this trip.');
        }

        // User is a collaborator, get trip details
        const { data: collaborativeTrip, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single();

        if (tripError || !collaborativeTrip) {
          throw new Error('Trip not found.');
        }

        console.log('User is collaborator, got trip:', collaborativeTrip.name);
        setTrip(collaborativeTrip);

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
    <>
      <PinList 
        tripId={trip.id.toString()} 
        tripName={trip.name}
        tripStartDate={trip.start_date}
        tripEndDate={trip.end_date}
      />
      
      {/* Floating test button for bulk edit - positioned in bottom right */}
      <button
        onClick={() => setShowBulkEdit(true)}
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium z-40 transition-colors"
        title="Test Bulk Edit (Development)"
      >
        📝 Bulk Edit
      </button>

      {/* Bulk Edit Modal */}
      <BulkEditPinsModal
        isOpen={showBulkEdit}
        onClose={() => setShowBulkEdit(false)}
        tripId={tripId}
        onSave={() => {
          console.log('Bulk edit completed!');
          // Optionally refresh the page or trigger a re-fetch
          window.location.reload();
        }}
      />
    </>
  );
} 