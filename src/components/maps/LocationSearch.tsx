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

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;
    
    // Initialize Google Places Autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'name', 'formatted_address', 'place_id']
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
          address: place.formatted_address,
          place_id: place.place_id
        });
        
        // Clear the input after selection
        setSearchTerm('');
      }
    });
    
    // Add custom styles for the Google autocomplete dropdown
    const styleFixInterval = setInterval(() => {
      // Target the autocomplete dropdown container
      const pacContainers = document.querySelectorAll('.pac-container');
      pacContainers.forEach(container => {
        // Apply styles directly to fix the appearance
        if (container instanceof HTMLElement) {
          container.style.marginTop = '0';
          container.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          container.style.borderRadius = '0 0 0.375rem 0.375rem';
          container.style.border = '1px solid #e5e7eb';
          container.style.borderTop = 'none';
          container.style.zIndex = '1000';
        }
      });
    }, 100); // Check every 100ms
    
    return () => {
      // Clean up Google Maps event listeners when component unmounts
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      // Clear the interval
      clearInterval(styleFixInterval);
    };
  }, [isLoaded, onPlaceSelected, searchTerm]);
  
  // Add global styles for Google Places autocomplete dropdown
  useEffect(() => {
    if (!isLoaded) return;
    
    // Create a style element
    const styleEl = document.createElement('style');
    styleEl.setAttribute('id', 'google-places-autocomplete-style');
    
    // Add CSS rules to fix the dropdown appearance
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
    
    // Append the style element to the document head
    document.head.appendChild(styleEl);
    
    // Clean up function
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