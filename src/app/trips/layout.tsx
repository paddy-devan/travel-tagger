'use client'; // Layout needs to be client component to use hooks

import React, { useState } from 'react';
import { useParams } from 'next/navigation'; // To check for tripId
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import TripMap from '@/components/TripMap';
import LoadingSpinner from '@/components/LoadingSpinner';
import { TripContextProvider } from '@/lib/TripContext';

export default function TripsLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  
  // Extract tripId, handling potential string array
  const tripIdParam = params?.tripId;
  const tripId = Array.isArray(tripIdParam) ? tripIdParam[0] : tripIdParam;

  // Sign out handler - needed by the Header within the layout
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/'); 
    } catch (error) {
      // Handle sign-out errors if necessary, maybe show a toast
      console.error('Sign out error in layout:', error);
    }
  };

  // Show loading spinner while auth is resolving
  if (authLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      );
  }

  return (
    // Wrap the entire layout content with the context provider
    <TripContextProvider>
      <div className="relative w-screen h-screen overflow-hidden">
        {/* --- MAP LAYER (z-0) --- */}
        <div className="absolute inset-0 z-0">
          {/* Trip pages show map controls and pass the specific tripId */}
          <TripMap 
            showControls={true}
            tripId={tripId} 
          /> 
        </div>

        {/* --- HEADER (z-10) --- */}
        {/* Render the shared header */}
        <Header user={user} onSignOut={handleSignOut} />

        {/* --- SIDEBAR/BOTTOM BAR (z-10) --- */}
        {/* The structure is part of the layout */}
        <aside className={`
          absolute
          md:top-22
          md:right-4 // Keep consistent right positioning
          md:w-[30%]
          md:h-[calc(100%-6.5rem)]

          bottom-4
          left-4
          right-4
          transition-transform duration-300 ease-in-out
          ${isListCollapsed ? 'translate-y-[calc(100%-42px)]' : ''}
          h-[35vh]
          md:bottom-auto
          md:left-auto
          md:transform-none

          bg-white shadow-lg z-10 overflow-visible rounded-lg border border-gray-200
        `}>
          {/* Mobile toggle handle - managed by layout state */} 
          <div className="md:hidden absolute left-1/2 transform -translate-x-1/2 -top-6 z-20">
            <button
              className="h-8 w-20 flex items-center justify-center bg-white rounded-t-lg border border-gray-200 border-b-0 shadow-sm"
              onClick={() => setIsListCollapsed(!isListCollapsed)}
              aria-label={isListCollapsed ? "Expand panel" : "Collapse panel"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-600 transition-transform duration-300 ${isListCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>

          {/* Collapsed header placeholder - Content specific header is in children */}
          {isListCollapsed && (
            <div className="md:hidden px-4 py-2 border-b border-gray-200 flex items-center">
              <h3 className="text-sm font-medium text-gray-700 truncate">
                Trip Details
              </h3>
            </div>
          )}
          
          {/* Render the actual page content (PinList) here */}
          <div className="h-full overflow-hidden flex flex-col">
               {children} 
          </div>
        </aside>
      </div>
    </TripContextProvider>
  );
} 