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
  const { tripId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshPins, setRefreshPins] = useState(0);

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
      } catch (error: unknown) {
        const err = error as { message?: string };
        setError(err.message || 'Failed to load trip details');
        console.error('Error fetching trip details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId, user]);

  const handlePinAdded = () => {
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="mr-3 text-blue-600 hover:text-blue-800 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Trips
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{trip.name}</h1>
              {trip.start_date && trip.end_date && (
                <p className="text-sm text-gray-500">
                  {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Map Section - Takes 60% on large screens */}
          <div className="w-full lg:w-3/5">
            <div className="bg-white p-4 rounded-lg shadow h-[600px]">
              <TripMap tripId={trip.id.toString()} onPinAdded={handlePinAdded} />
            </div>
          </div>

          {/* Pins List Section - Takes 40% on large screens */}
          <div className="w-full lg:w-2/5">
            <div className="bg-white p-4 rounded-lg shadow h-[600px] overflow-auto">
              <PinList tripId={trip.id.toString()} refreshTrigger={refreshPins} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 