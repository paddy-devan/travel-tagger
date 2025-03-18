'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import CreateTripForm from '@/components/trips/CreateTripForm';
import TripList from '@/components/trips/TripList';

export default function Dashboard() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    } else if (user) {
      setUserName(user.email || 'User');
    }
  }, [user, isLoading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      setError('Error signing out. Please try again.');
      console.error('Sign out error:', error);
    }
  };

  const handleCreateTrip = () => {
    setShowCreateForm(true);
    setError(null);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  const handleTripCreated = () => {
    // Increment refresh trigger to cause TripList to reload
    setRefreshTrigger(prev => prev + 1);
    setShowCreateForm(false);
    
    // Force fetch trips on next render
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Travel Tagger</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {userName}</span>
            <button
              onClick={handleSignOut}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {showCreateForm ? (
          <CreateTripForm onCancel={handleCancelCreate} onSuccess={handleTripCreated} />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Your Trips</h2>
              <button 
                onClick={handleCreateTrip}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
              >
                Create New Trip
              </button>
            </div>
            
            <TripList refreshTrigger={refreshTrigger} />
          </div>
        )}
      </main>
    </div>
  );
} 