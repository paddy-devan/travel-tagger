'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

// Date Range Picker imports
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface CreateTripFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

// Helper to format dates for Supabase (YYYY-MM-DD)
const formatDateForSupabase = (date: Date | undefined | null): string | null => {
  if (!date) return null;
  return format(date, 'yyyy-MM-dd');
};

export default function CreateTripForm({ onCancel, onSuccess }: CreateTripFormProps) {
  const { user } = useAuth();
  const [tripName, setTripName] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const datePickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        datePickerRef.current && 
        !datePickerRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    }
    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDatePicker]);

  // Calculate position when picker is shown
  useEffect(() => {
    if (showDatePicker && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      // Estimate width for a SINGLE month picker
      const estimatedPopoverWidth = 300; // Adjust if necessary
      const viewportWidth = window.innerWidth;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      const buffer = 16; // Space from viewport edges

      // Calculate position to align popover's RIGHT edge with button's RIGHT edge
      let leftPosition = buttonRect.right + scrollX - estimatedPopoverWidth;
      
      // Ensure it doesn't overflow the left edge of the viewport
      if (leftPosition < scrollX + buffer) {
          leftPosition = scrollX + buffer;
      }

      // Ensure it doesn't overflow the right edge of the viewport (less likely now)
      if (leftPosition + estimatedPopoverWidth > viewportWidth - buffer) {
          leftPosition = viewportWidth - estimatedPopoverWidth - buffer;
      }

      setPickerPosition({
        top: buttonRect.bottom + scrollY + 4,
        left: leftPosition, // Use the final calculated left position
      });
    } else {
        setPickerPosition(null);
    }
  }, [showDatePicker]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !user.id) {
      setError('You must be logged in to create a trip');
      return;
    }
    if (!tripName.trim()) {
      setError('Trip name is required');
      return;
    }
    
    // Validation for range (optional, DayPicker handles basic logic)
    if (dateRange?.from && dateRange?.to && dateRange.from > dateRange.to) {
        setError('Start date cannot be after end date');
        return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // User existence check remains the same
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (userError || !userData) {
        throw new Error('User not found. Please contact support.');
      }
      
      // Create the trip with formatted dates
      const { error: insertError } = await supabase
        .from('trips')
        .insert([
          { 
            user_id: user.id,
            name: tripName,
            start_date: formatDateForSupabase(dateRange?.from),
            end_date: formatDateForSupabase(dateRange?.to),
          }
        ])
        .select();
      
      if (insertError) {
        throw new Error(`Error creating trip: ${insertError.message}`);
      }
      
      // Clear form and notify parent of success
      setTripName('');
      setDateRange(undefined);
      onSuccess();
      
    } catch (error: unknown) {
      console.error('Error creating trip:', error);
      const err = error as { message?: string };
      setError(err.message || 'Failed to create trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display text for the date range button
  const dateRangeText = () => {
    if (!dateRange?.from) {
      return 'Select Dates (Optional)';
    }
    if (!dateRange.to) {
      return format(dateRange.from, 'LLL dd, yyyy');
    }
    return `${format(dateRange.from, 'LLL dd, yyyy')} – ${format(dateRange.to, 'LLL dd, yyyy')}`;
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
        
        {/* Date Range Picker Input */}
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trip Dates (Optional)
            </label>
             <button
                ref={buttonRef}
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex justify-between items-center bg-white text-gray-700"
                aria-haspopup="true"
                aria-expanded={showDatePicker}
             >
                <span>{dateRangeText()}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
             </button>
            {showDatePicker && pickerPosition && typeof document !== 'undefined' && createPortal(
                <div 
                    ref={datePickerRef}
                    className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2" 
                    style={{ 
                        top: `${pickerPosition.top}px`, 
                        left: `${pickerPosition.left}px`,
                    }} 
                >
                    <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={1}
                        showOutsideDays
                        fixedWeeks
                    />
                </div>,
                document.body
            )}
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
            disabled={isSubmitting || !tripName.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create Trip'}
          </button>
        </div>
      </form>
    </div>
  );
} 