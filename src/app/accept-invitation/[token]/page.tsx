'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
import AuthModal from '@/components/AuthModal';
import { TripContextProvider } from '@/lib/TripContext';
import Header from '@/components/Header';
import TripMap from '@/components/TripMap';

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

interface InvitationData {
  invitation: {
    id: string;
    trip_id: string;
    expires_at: string;
    created_at: string;
  };
  trip: {
    id: string;
    name: string;
    start_date: string | null;
    end_date: string | null;
    owner: {
      full_name: string | null;
      email: string | null;
    };
  };
  pins: Pin[];
}

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === 'string' ? params.token : '';
  const { user, isLoading: authLoading } = useAuth();
  
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Fetch invitation data
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/invitations/${token}/validate`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to validate invitation');
        }
        
        setInvitationData(data);
      } catch (error: unknown) {
        const err = error as { message?: string };
        setError(err.message || 'Failed to load invitation');
        console.error('Error fetching invitation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  // Close auth modal when user signs in
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [user, showAuthModal]);

  const handleAcceptInvitation = async () => {
    if (!invitationData) return;
    
    // If user is not authenticated, show auth modal
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setAccepting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }
      
      setAccepted(true);
      
      // Redirect to the trip after a short delay
      setTimeout(() => {
        router.push(`/trips/${data.tripId}`);
      }, 2000);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setError(err.message || 'Failed to accept invitation');
      console.error('Error accepting invitation:', error);
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineInvitation = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="p-4 h-full flex flex-col">
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!invitationData) {
    return (
      <div className="p-4 flex justify-center items-center h-full">
        <p className='text-sm text-gray-500'>Loading invitation details...</p>
      </div>
    );
  }

    const handleSignOut = async () => {
    router.push('/');
  };

  return (
    <TripContextProvider>
      <div className="relative w-screen h-screen overflow-hidden">
        {/* --- MAP LAYER (z-0) --- */}
        <div className="absolute inset-0 z-0">
          <TripMap 
            showControls={true}
            tripId={invitationData.trip.id}
            allowUnauthenticated={true}
            initialPins={invitationData.pins}
          /> 
        </div>

        {/* --- HEADER (z-10) --- */}
        <Header user={user} onSignOut={handleSignOut} />

        {/* --- SIDEBAR (z-10) --- */}
        <aside className="
          absolute
          md:top-22
          md:right-4
          md:w-[30%]
          md:h-[calc(100%-6.5rem)]
          bottom-4
          left-4
          right-4
          h-[35vh]
          md:bottom-auto
          md:left-auto
          md:transform-none
          bg-white shadow-lg z-10 overflow-visible rounded-lg border border-gray-200
        ">
          <div className="h-full overflow-hidden flex flex-col">
            {/* Invitation content in sidebar */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">{invitationData.trip.name}</h2>
              <p className="text-xs text-gray-500">
                {invitationData.trip.start_date && invitationData.trip.end_date 
                  ? `${new Date(invitationData.trip.start_date).toLocaleDateString()} - ${new Date(invitationData.trip.end_date).toLocaleDateString()}`
                  : 'No dates set'}
              </p>
            </div>

            {/* Invitation acceptance UI */}
            {accepted ? (
              <div className="flex-grow flex flex-col justify-center p-6 text-center">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-green-800">Invitation Accepted!</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  You've been added as a collaborator
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to the trip...
                </p>
              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-center p-6">
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">Trip Invitation</h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    You've been invited to collaborate on this trip
                  </p>
                  
                  <div className="bg-gray-50 p-3 rounded-md mb-4 text-left">
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="font-medium">Invited by:</span> {invitationData.trip.owner.full_name || invitationData.trip.owner.email}
                      </div>
                      <div>
                        <span className="font-medium">Expires:</span> {new Date(invitationData.invitation.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleDeclineInvitation}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                      disabled={accepting}
                    >
                      Decline
                    </button>
                    <button
                      onClick={handleAcceptInvitation}
                      disabled={accepting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      {accepting ? 'Accepting...' : (user ? 'Accept' : 'Sign in to Accept')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Authentication Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      </div>
    </TripContextProvider>
  );
} 