'use client';

import React from 'react';
import Link from 'next/link';
import { format, isValid } from 'date-fns'; // Import date-fns for formatting

// Assuming a Trip type/interface is defined elsewhere, e.g., @/types/trip
// If not, define a basic one here or import it.
interface Trip {
  id: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  // Add other relevant fields if needed for display
}

// Helper function to format the date range nicely
const formatTripDateRange = (start?: string | null, end?: string | null): string => {
  const startDate = start && new Date(start);
  const endDate = end && new Date(end);
  
  const isValidStart = startDate && isValid(startDate);
  const isValidEnd = endDate && isValid(endDate);

  if (isValidStart && isValidEnd) {
    if (format(startDate, 'yyyyMMdd') === format(endDate, 'yyyyMMdd')) {
      // Same start and end date
      return format(startDate, 'MMM d, yyyy');
    } else {
      // Different start and end dates
      return `${format(startDate, 'MMM d, yyyy')} – ${format(endDate, 'MMM d, yyyy')}`;
    }
  } else if (isValidStart) {
    // Only start date
    return `Starts ${format(startDate, 'MMM d, yyyy')}`;
  } else if (isValidEnd) {
    // Only end date (less common, but possible)
    return `Ends ${format(endDate, 'MMM d, yyyy')}`;
  } else {
    // No valid dates
    return 'No dates set';
  }
};

export default function TripList({ trips }: { trips: Trip[] }) {
  // Header Section (Optional - mirrors PinList structure)
  // You can add a title or other info here if desired
  // const Header = (
  //   <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
  //     <h2 className="text-lg font-semibold text-gray-800">Your Trips</h2>
  //     <span className="text-sm text-gray-500">{tripCount} trips</span>
  //   </div>
  // );

  if (!trips || trips.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        You haven&apos;t created any trips yet.
        {/* Optional: Add a button to create a new trip? */}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* {Header} */} 
      <div className="overflow-y-auto flex-grow pr-1"> {/* Add padding-right for scrollbar */} 
        {trips.map((trip) => (
          // Use a div as the list item container, remove li styling
          <div key={trip.id} className="border border-gray-200 rounded-lg p-4 mb-3 bg-white shadow-sm">
            <div className="flex justify-between items-start"> {/* Use items-start for alignment */}
              {/* Left side: Name and Dates */}
              <div className="flex-grow mr-4"> {/* Add margin-right */} 
                <h3 className="text-md font-semibold text-gray-800 mb-1 break-words"> {/* Allow wrapping */} 
                  {trip.name || 'Untitled Trip'}
                </h3>
                <p className="text-xs text-gray-500">
                  {formatTripDateRange(trip.start_date, trip.end_date)}
                </p>
              </div>
              
              {/* Right side: Button */}
              <Link 
                href={`/trips/${trip.id}`}
                className="inline-block flex-shrink-0 mt-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 