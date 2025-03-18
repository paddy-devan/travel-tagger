'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface CreateTripFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CreateTripForm({ onCancel, onSuccess }: CreateTripFormProps) {
  const { user } = useAuth();
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!user || !user.id) {
      setError('You must be logged in to create a trip');
      return;
    }
    
    if (!tripName.trim()) {
      setError('Trip name is required');
      return;
    }
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // First, verify that the user exists in the database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
      
      // If user doesn't exist, show error and don't proceed
      if (userError || !userData) {
        throw new Error('User not found. Please contact support.');
      }
      
      // Create the trip
      const { error } = await supabase
        .from('trips')
        .insert([
          { 
            user_id: user.id,
            name: tripName,
            start_date: startDate || null,
            end_date: endDate || null,
          }
        ])
        .select();
      
      if (error) {
        throw new Error(`Error creating trip: ${error.message}`);
      }
      
      // Clear form and notify parent of success
      setTripName('');
      setStartDate('');
      setEndDate('');
      onSuccess();
      
    } catch (error: unknown) {
      console.error('Error creating trip:', error);
      const err = error as { message?: string };
      setError(err.message || 'Failed to create trip');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Create New Trip</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 mb-1">
            Trip Name <span className="text-red-500">*</span>
          </label>
          <input
            id="tripName"
            type="text"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Summer Vacation 2024"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date (Optional)
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date (Optional)
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Trip'}
          </button>
        </div>
      </form>
    </div>
  );
} 