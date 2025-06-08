'use client';

import { useEffect, useState, useCallback } from 'react';
// Keep useRouter if needed for redirects, but not for layout
// import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
// Remove Map/Header imports
// import { TripMap } from '@/components/maps';
// import { Header } from '@/components/layout/Header';
import TripList from '@/components/TripList';
import CreateTripForm from '@/components/CreateTripForm';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Trip {
  id: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  user_id: string;
}

// This component now *only* renders the content for the sidebar panel
export default function DashboardPageContent() {
  const { user, isLoading: authLoading } = useAuth(); // Keep auth check
  // Remove router if only used for redirect/signout (handled in layout)
  // const router = useRouter();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true); // Loading state for trips
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch Trips (including both owned and collaborative trips)
  const fetchTrips = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Get owned trips
      const { data: ownedTrips, error: ownedError } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id);
      
      if (ownedError) throw ownedError;

      // Get collaborative trips
      const { data: collaborativeTrips, error: collaborativeError } = await supabase
        .from('trips')
        .select(`
          *,
          trip_collaborators!inner(
            user_id,
            role
          )
        `)
        .eq('trip_collaborators.user_id', user.id);
      
      if (collaborativeError) throw collaborativeError;

      // Combine and deduplicate trips
      const allTrips = [...(ownedTrips || []), ...(collaborativeTrips || [])];
      const uniqueTrips = allTrips.filter((trip, index, self) => 
        index === self.findIndex(t => t.id === trip.id)
      );

      // Sort by created_at descending
      uniqueTrips.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTrips(uniqueTrips);
    } catch (err: unknown) {
      const fetchError = err as { message?: string };
      const errorMessage = fetchError.message || 'Failed to load trips';
      setError(errorMessage);
      console.error('Error fetching trips:', err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Effect to fetch trips when user is available
  useEffect(() => {
    // Basic redirect logic can remain here, or be fully handled by layout/middleware
    // if (!authLoading && !user) {
    //   router.push('/signin'); 
    // } else
     if (!authLoading && user) {
      fetchTrips();
    }
  }, [user, authLoading, fetchTrips]);

  // Handlers for form toggle and creation success (remain the same)
  const handleShowCreateForm = () => {
    setShowCreateForm(true);
    setError(null);
    // No need to handle collapse state here, layout does it
  };
  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };
  const handleTripCreated = () => {
    setShowCreateForm(false);
    fetchTrips(); // Re-fetch after creation
  };

  // Loading state specific to fetching trips (after auth)
  if (authLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (loading && user) { // Show loading only if auth is done but trips aren't loaded
      return (
         <div className="p-4 flex justify-center items-center h-full">
           <LoadingSpinner />
         </div>
       );
   }

  // Render only the panel content
  return (
    <div className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
           <h2 className="text-lg font-semibold text-gray-800">
              {showCreateForm ? 'Create New Trip' : 'Your Trips'}
            </h2>
            {!showCreateForm && (
              <button 
                onClick={handleShowCreateForm}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-sm"
              >
                + New Trip
              </button>
            )}
        </div>

        {error && (
           <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex-shrink-0">
              Error loading trips: {error}
            </div>
          )}

        <div className="flex-grow overflow-auto min-h-0"> {/* Ensure scrollable area takes space */} 
          {showCreateForm ? (
            <CreateTripForm onCancel={handleCancelCreate} onSuccess={handleTripCreated} />
          ) : (
            <TripList trips={trips} />
          )}
        </div>
    </div>
  );
} 