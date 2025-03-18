'use client';

import { useState, useEffect, useRef } from 'react';

interface LocationSearchProps {
  onPlaceSelected: (place: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
  }) => void;
  isLoaded: boolean;
}

export default function LocationSearch({ onPlaceSelected, isLoaded }: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;
    
    // Initialize Google Places Autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'name', 'formatted_address']
    });
    
    // Add event listener for place_changed
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      
      if (place && place.geometry && place.geometry.location) {
        const location = place.geometry.location;
        onPlaceSelected({
          name: place.name || searchTerm,
          lat: location.lat(),
          lng: location.lng(),
          address: place.formatted_address
        });
        
        // Clear the input after selection
        setSearchTerm('');
      }
    });
    
    return () => {
      // Clean up Google Maps event listeners when component unmounts
      google.maps.event.clearInstanceListeners(autocompleteRef.current!);
    };
  }, [isLoaded, onPlaceSelected, searchTerm]);
  
  if (!isLoaded) {
    return <div>Loading search...</div>;
  }
  
  return (
    <div className="mb-4 relative">
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search for a location..."
        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
} 