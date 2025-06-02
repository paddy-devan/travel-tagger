'use client';

import { useState, useEffect, useRef } from 'react';

interface LocationSearchProps {
  onPlaceSelected: (place: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
    place_id?: string;
  }) => void;
  isLoaded: boolean;
}

export default function LocationSearch({ onPlaceSelected, isLoaded }: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Ref to store the latest onPlaceSelected callback
  const onPlaceSelectedRef = useRef(onPlaceSelected);

  // Effect to update the ref when the prop changes
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  // Effect to setup Autocomplete - runs only when isLoaded changes
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;
    
    // Initialize Google Places Autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'name', 'formatted_address', 'place_id']
    });
    
    // Add event listener for place_changed
    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      
      if (place && place.geometry && place.geometry.location) {
        const location = place.geometry.location;
        const payload = {
          name: place.name || '',
          lat: location.lat(),
          lng: location.lng(),
          address: place.formatted_address,
          place_id: place.place_id
        };
        onPlaceSelectedRef.current(payload);
        
        // Clear the input after selection
        setSearchTerm('');
      }
    });
    
    // Cleanup function
    return () => {
      if (listener) {
          google.maps.event.removeListener(listener); 
      }
      if (autocompleteRef.current) {
         google.maps.event.clearInstanceListeners(autocompleteRef.current);
      } 
    };
  }, [isLoaded]);
  
  // Add global styles for Google Places autocomplete dropdown
  useEffect(() => {
    if (!isLoaded) return;
    
    const styleEl = document.createElement('style');
    styleEl.setAttribute('id', 'google-places-autocomplete-style');
    
    styleEl.innerHTML = `
      .pac-container {
        margin-top: 0 !important;
        border-top: none !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        border-radius: 0 0 0.375rem 0.375rem !important;
        border: 1px solid #e5e7eb !important;
        border-top: none !important;
        background-color: white !important;
        z-index: 1000 !important;
      }
      .pac-item {
        padding: 8px 12px;
        cursor: pointer;
      }
      .pac-item:hover {
        background-color: #f9fafb;
      }
      .pac-item-selected {
        background-color: #f3f4f6;
      }
    `;
    
    document.head.appendChild(styleEl);
    
    return () => {
      const existingStyle = document.getElementById('google-places-autocomplete-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isLoaded]);
  
  if (!isLoaded) {
    return <div>Loading search...</div>;
  }
  
  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search for a location..."
        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-gray-500"
      />
    </div>
  );
} 