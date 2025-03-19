'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { TripMap } from '@/components/maps';
import { PinList } from '@/components/pins';
import { LoadingSpinner } from '@/components/ui';
import Link from 'next/link';

interface Trip {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  user_id: string;
}

export default function TripDetail() {
  const params = useParams();
  const tripId = typeof params?.tripId === 'string' ? params.tripId : '';
  const router = useRouter();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshPins, setRefreshPins] = useState(0);
  const [isPinsCollapsed, setIsPinsCollapsed] = useState(false);
  const [pinsCount, setPinsCount] = useState(0);

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!user || !tripId) return;

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (!data) {
          throw new Error('Trip not found or you do not have access to this trip.');
        }

        setTrip(data);
        
        // Fetch pin count
        const { count, error: countError } = await supabase
          .from('pins')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', tripId);
          
        if (!countError && count !== null) {
          setPinsCount(count);
        }
        
      } catch (error: unknown) {
        const err = error as { message?: string };
        setError(err.message || 'Failed to load trip details');
        console.error('Error fetching trip details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId, user, refreshPins]);

  const handlePinAdded = () => {
    setRefreshPins(prev => prev + 1);
  };
  
  const handlePinChanged = () => {
    // Trigger a refresh of pins on both the list and map
    setRefreshPins(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen p-8">
        <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
          Trip not found or you don't have access to this trip.
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* --- MAP LAYER (z-0) --- */}
      <div className="absolute inset-0 z-0">
        <TripMap 
          tripId={trip.id.toString()} 
          onPinAdded={handlePinAdded} 
          refreshTrigger={refreshPins}
        />
      </div>

      {/* --- HEADER (z-10) --- */}
      <header className="absolute top-4 left-4 right-4 h-14 bg-white shadow-md z-10 flex items-center px-4 rounded-lg border border-gray-200">
        <div className="flex-1 flex items-center space-x-4">
          {/* "Back" link on the left */}
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 flex items-center flex-shrink-0"
            title="Back to Trips"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="ml-1 md:inline hidden">Back to Trips</span>
          </Link>
          
          {/* Left-aligned logo */}
          <div className="flex items-center">
            <img 
              src="/images/Logo.svg" 
              alt="Travel Tagger" 
              className="h-8"
              style={{ marginTop: "7px" }} 
            />
          </div>
        </div>
        
        {/* Logged-in user info on the right */}
        <div className="text-gray-600">{user?.email}</div>
      </header>

      {/* --- PIN LIST SIDEBAR/BOTTOM BAR (z-10) --- */}
      <aside className={`
        absolute 
        md:top-22 
        md:right-4 
        md:w-[30%] 
        md:h-[calc(100%-6.5rem)] 
        
        /* Mobile bottom bar styles */
        bottom-4 
        left-4 
        right-4 
        transition-transform duration-300 ease-in-out
        ${isPinsCollapsed ? 'translate-y-[calc(100%-42px)]' : ''}
        h-[35vh] 
        md:bottom-auto 
        md:left-auto
        md:transform-none

        bg-white shadow-lg z-10 overflow-visible rounded-lg border border-gray-200
      `}>
        {/* Mobile toggle handle - visible only on mobile */}
        <div className="md:hidden absolute left-1/2 transform -translate-x-1/2 -top-6 z-20">
          <button 
            className="h-8 w-20 flex items-center justify-center bg-white rounded-t-lg border border-gray-200 border-b-0 shadow-sm"
            onClick={() => setIsPinsCollapsed(!isPinsCollapsed)}
            aria-label={isPinsCollapsed ? "Expand pins panel" : "Collapse pins panel"}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 text-gray-600 transition-transform duration-300 ${isPinsCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {/* Collapsed header bar shown only when collapsed and on mobile */}
        {isPinsCollapsed && (
          <div className="md:hidden px-4 py-2 border-b border-gray-200 flex items-center">
            <h3 className="text-sm font-medium text-gray-700 truncate">
              {trip.name}
            </h3>
            <span className="ml-2 text-xs text-gray-500">
              • {pinsCount} pins
            </span>
          </div>
        )}
        
        <div className="p-4 h-full overflow-auto">
          <PinList 
            tripId={trip.id.toString()} 
            refreshTrigger={refreshPins}
            onPinChanged={handlePinChanged}
            tripName={trip.name}
            tripStartDate={trip.start_date}
            tripEndDate={trip.end_date}
          />
        </div>
      </aside>
    </div>
  );
} 