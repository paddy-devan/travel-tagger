'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { AddPinModal } from '@/components/pins';
import { LocationSearch } from '@/components/maps';

// Define map container style
const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%'  // Full height to fill parent container
};

// Default center (can be updated based on pins or user location)
const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060 // New York City
};

// Modern marker SVG template - using a more modern pin design
const createMarkerSVG = (color: string) => {
  // Only try to create a scaled size if Google Maps is loaded
  if (typeof google === 'undefined' || !google.maps) {
    return {
      url: `data:image/svg+xml,${encodeURIComponent(`
        <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0C8.064 0 0 8.064 0 18C0 31.5 18 48 18 48C18 48 36 31.5 36 18C36 8.064 27.936 0 18 0ZM18 24C14.688 24 12 21.312 12 18C12 14.688 14.688 12 18 12C21.312 12 24 14.688 24 18C24 21.312 21.312 24 18 24Z" fill="${color}"/>
          <circle cx="18" cy="18" r="6" fill="white"/>
        </svg>
      `)}`,
    };
  }
  
  return {
    url: `data:image/svg+xml,${encodeURIComponent(`
      <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.064 0 0 8.064 0 18C0 31.5 18 48 18 48C18 48 36 31.5 36 18C36 8.064 27.936 0 18 0ZM18 24C14.688 24 12 21.312 12 18C12 14.688 14.688 12 18 12C21.312 12 24 14.688 24 18C24 21.312 21.312 24 18 24Z" fill="${color}"/>
        <circle cx="18" cy="18" r="6" fill="white"/>
      </svg>
    `)}`,
    scaledSize: new google.maps.Size(30, 40),
    anchor: new google.maps.Point(15, 40),
    labelOrigin: new google.maps.Point(18, 17)
  };
};

// Define category to color mapping
const categoryIcons: Record<string, string> = {
  'Museum': '#4285F4',        // Blue
  'Attraction': '#EA4335',    // Red
  'Hotel': '#9C27B0',         // Purple
  'Food': '#FF9800',          // Orange
  'Bar': '#FBBC05',           // Yellow
  'Park': '#34A853',          // Green
  'Transportation': '#E91E63', // Pink
  'Shopping': '#00B0FF',      // Light blue
  'Entertainment': '#FFEB3B', // Yellow
  // Default color for unknown categories
  'default': '#757575'        // Gray
};

// Companion color map for styling text and backgrounds - using the same colors
const categoryColors: Record<string, string> = {
  'Museum': '#4285F4',        // Blue
  'Attraction': '#EA4335',    // Red
  'Hotel': '#9C27B0',         // Purple
  'Food': '#FF9800',          // Orange
  'Bar': '#FBBC05',           // Yellow
  'Park': '#34A853',          // Green
  'Transportation': '#E91E63', // Pink
  'Shopping': '#00B0FF',      // Light blue
  'Entertainment': '#FFEB3B', // Yellow
  'default': '#757575'        // Gray
};

// Function to get a marker icon based on category
const getMarkerIcon = (category: string | null): google.maps.Icon | google.maps.Symbol => {
  if (!category) return createMarkerSVG(categoryColors['default']);
  return createMarkerSVG(categoryColors[category] || categoryColors['default']);
};

// Function to get a color for styling based on category
const getCategoryColor = (category: string | null): string => {
  if (!category) return categoryColors['default'];
  return categoryColors[category] || categoryColors['default'];
};

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
}

interface TripMapProps {
  tripId: string;
  onPinAdded: () => void;
  refreshTrigger?: number;
}

export default function TripMap({ tripId, onPinAdded, refreshTrigger = 0 }: TripMapProps) {
  const { user } = useAuth();
  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [clickedLocation, setClickedLocation] = useState<{lat: number; lng: number} | null>(null);
  const [showAddPinModal, setShowAddPinModal] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [placeInfo, setPlaceInfo] = useState<{
    name: string;
    place_id?: string;
    address?: string;
  } | null>(null);

  // Load Google Maps API with Places library
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  // Fetch pins for the trip
  const fetchPins = useCallback(async () => {
    if (!user || !tripId) return;

    try {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('trip_id', tripId)
        .order('order', { ascending: true });

      if (error) throw error;

      setPins(data || []);

      // If pins exist, center map on the first pin
      if (data && data.length > 0) {
        // Get window width to determine if we need to offset the center
        const windowWidth = window.innerWidth;
        const isMobile = windowWidth < 768; // md breakpoint in Tailwind
        
        // For desktop, offset the center to the left to account for sidebar
        if (!isMobile) {
          // Calculate an offset that's roughly 1/6 of the screen width to the left
          // (This shifts the center point away from the sidebar)
          const offset = windowWidth * 0.15; // 15% of screen width
          
          // Convert offset to longitude degrees (rough approximation)
          // This will vary by latitude and zoom level but provides a decent starting point
          const lngOffset = offset * 0.00001 * 5; // Rough conversion factor
          
          setMapCenter({
            lat: data[0].latitude,
            lng: data[0].longitude - lngOffset // Shift to the left
          });
        } else {
          // On mobile, use the pin location directly
          setMapCenter({
            lat: data[0].latitude,
            lng: data[0].longitude
          });
        }
      }
    } catch (error) {
      console.error('Error fetching pins:', error);
    }
  }, [tripId, user]);

  useEffect(() => {
    if (isLoaded) {
      fetchPins();
    }
  }, [isLoaded, fetchPins, refreshTrigger]);

  // Function to fit map bounds to include all pins
  const fitMapToPins = useCallback(() => {
    if (!mapRef.current || pins.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    
    // Add all pin locations to the bounds
    pins.forEach(pin => {
      bounds.extend({ lat: pin.latitude, lng: pin.longitude });
    });
    
    // Get the current window width to calculate padding
    const windowWidth = window.innerWidth;
    const isMobile = windowWidth < 768; // md breakpoint in Tailwind
    
    // Calculate padding - asymmetric to account for sidebar/bottom bar and header
    // For mobile: standard padding on sides, extra for header and bottom bar
    // For desktop: more padding on the right side for sidebar and top for header
    const padding = {
      top: 80, // Adjusted to match sidebar spacing from header
      bottom: isMobile ? windowWidth / 3 : 50, // Extra bottom padding on mobile for bottom bar
      left: 50,
      right: isMobile ? 50 : windowWidth / 3 + 50 // Add extra padding on right for sidebar on desktop
    };
    
    // Fit the map to the bounds with padding
    mapRef.current.fitBounds(bounds, padding);
    
    // If there's only one pin, zoom out a bit as fitBounds will zoom too close
    if (pins.length === 1) {
      const currentZoom = mapRef.current.getZoom();
      if (currentZoom !== undefined && currentZoom > 15) {
        mapRef.current.setZoom(15);
      }
    }
  }, [pins]);

  // Automatically fit bounds when pins are loaded or changed
  useEffect(() => {
    if (mapLoaded && pins.length > 0) {
      fitMapToPins();
    } else if (mapLoaded && pins.length === 0 && mapRef.current) {
      // Reset to world view when all pins are removed
      mapRef.current.setCenter({ lat: 40, lng: 20 });
      mapRef.current.setZoom(3);
    }
  }, [mapLoaded, pins.length, fitMapToPins]);

  // Add window resize handling to adjust the map
  useEffect(() => {
    const handleResize = () => {
      if (mapLoaded && pins.length > 0) {
        // Delay the fitMapToPins call slightly to ensure DOM has updated
        setTimeout(fitMapToPins, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mapLoaded, pins.length, fitMapToPins]);

  // Add keyboard shortcut for fitting map to pins (Ctrl+F or Cmd+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl+F or Cmd+F is pressed and map is loaded
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && mapLoaded && pins.length > 0) {
        e.preventDefault(); // Prevent browser's find functionality
        fitMapToPins();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fitMapToPins, mapLoaded, pins.length]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true);
    
    // If there are no pins, show a world map view
    if (pins.length === 0) {
      map.setCenter({ lat: 10, lng: 0 }); // Center on equator for better world view
      map.setZoom(2); // Zoom level to show most of the world
    }
  }, [pins.length]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setClickedLocation({ lat, lng });
      setShowAddPinModal(true);
    }
  }, []);

  const handleAddPin = async (name: string, description: string, category: string = '') => {
    if (!user || !tripId || !clickedLocation) return;

    try {
      // First, get the max order value from existing pins
      const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('pins')
        .select('order')
        .eq('trip_id', tripId)
        .order('order', { ascending: false })
        .limit(1);

      if (maxOrderError) throw maxOrderError;
      
      // Calculate next order value (1-based index)
      const nextOrder = maxOrderData && maxOrderData.length > 0 ? 
        (maxOrderData[0].order || 0) + 1 : 1;

      const { error } = await supabase
        .from('pins')
        .insert({
          trip_id: tripId,
          nickname: name, 
          notes: description,
          latitude: clickedLocation.lat,
          longitude: clickedLocation.lng,
          google_maps_id: placeInfo?.place_id || null,
          visited_flag: false,
          category: category || null,
          "order": nextOrder
        });

      if (error) throw error;

      // Refresh pins
      fetchPins();
      // Notify parent component
      onPinAdded();
      // Reset state
      setClickedLocation(null);
      setPlaceInfo(null);
      setShowAddPinModal(false);
    } catch (error) {
      console.error('Error adding pin:', error);
    }
  };

  const handleCloseModal = () => {
    setShowAddPinModal(false);
    setClickedLocation(null);
    setPlaceInfo(null);
  };

  const handlePlaceSelected = useCallback((place: { name: string; lat: number; lng: number; address?: string; place_id?: string }) => {
    // Get window width to determine if we need to offset the center
    const windowWidth = window.innerWidth;
    const isMobile = windowWidth < 768; // md breakpoint in Tailwind
    
    // Create coordinates with potential offset for sidebar or bottom bar
    let centerLng = place.lng;
    let centerLat = place.lat;
    
    if (isMobile) {
      // For mobile, apply an upward offset to account for bottom bar
      centerLat = place.lat + 0.003; // Shift upward so location is visible above bottom bar
    } else {
      // For desktop, apply a leftward offset to center the point in the visible area
      const offset = windowWidth * 0.15; // 15% of screen width
      centerLng = place.lng - (offset * 0.00001 * 5); // Shift to the left
      
      // Apply a slight downward offset to account for the header
      centerLat = place.lat - 0.0004; // Adjusted to match top padding
    }
    
    // Center the map on the selected place with potential offset
    setMapCenter({ 
      lat: centerLat, 
      lng: centerLng 
    });
    
    // Create a clicked location that will trigger the add pin modal
    // (use the original coordinates for the actual pin)
    setClickedLocation({ lat: place.lat, lng: place.lng });
    
    // Save place info for when we create the pin
    setPlaceInfo({
      name: place.name,
      place_id: place.place_id,
      address: place.address
    });
    
    setShowAddPinModal(true);
    
    // If the map is loaded, also pan to the location with offset
    if (mapRef.current) {
      mapRef.current.panTo({ lat: centerLat, lng: centerLng });
      mapRef.current.setZoom(15);
    }
  }, []);

  // Set default zoom based on whether pins exist
  const defaultZoom = pins.length > 0 ? 10 : 2;
  
  // Set initial map center - world view for no pins, first pin location for pins
  const initialMapCenter = useMemo(() => {
    if (pins.length === 0) {
      return { lat: 10, lng: 0 }; // Centered near equator for world view
    }
    return mapCenter; // Use the computed center based on pins
  }, [pins.length, mapCenter]);

  if (!isLoaded) {
    return <div className="h-full flex items-center justify-center text-gray-500">Loading Google Maps...</div>;
  }

  return (
    <div className="h-full w-full relative">
      {/* The Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialMapCenter}
        zoom={defaultZoom}
        onClick={onMapClick}
        onLoad={onMapLoad}
        options={{
          fullscreenControl: false,
          mapTypeControl: true,
          streetViewControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_BOTTOM
          },
          mapTypeControlOptions: {
            position: google.maps.ControlPosition.BOTTOM_LEFT,
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
          }
        }}
      >
        {pins.map(pin => (
          <Marker
            key={pin.id}
            position={{ lat: pin.latitude, lng: pin.longitude }}
            onClick={() => setSelectedPin(pin)}
            icon={getMarkerIcon(pin.category)}
          />
        ))}

        {selectedPin && (
          <InfoWindow
            position={{ lat: selectedPin.latitude, lng: selectedPin.longitude }}
            onCloseClick={() => setSelectedPin(null)}
          >
            <div className="min-w-[200px] p-1">
              <h3 className="font-medium text-gray-900 text-lg">{selectedPin.nickname}</h3>
              
              {/* Category Badge */}
              {selectedPin.category && (
                <div className="mt-2 flex items-center">
                  <div 
                    className="text-xs inline-block px-2 py-1 rounded-full" 
                    style={{ 
                      backgroundColor: getCategoryColor(selectedPin.category),
                      color: 'white',
                      fontWeight: 500
                    }}
                  >
                    {selectedPin.category}
                  </div>
                  
                  {/* Visited Badge */}
                  {selectedPin.visited_flag && (
                    <div className="ml-2 text-xs inline-block px-2 py-1 rounded-full bg-green-100 text-green-800">
                      Visited ✓
                    </div>
                  )}
                </div>
              )}
              
              {/* Notes */}
              {selectedPin.notes && (
                <p className="mt-2 text-sm text-gray-600">{selectedPin.notes}</p>
              )}
              
              {/* Visited Status (if not showing as badge) */}
              {!selectedPin.visited_flag && (
                <p className="mt-2 text-xs text-gray-500">
                  Not visited yet
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Search and Controls as Overlay */}
      <div className="absolute top-20 left-4 z-10 flex items-center space-x-2 max-w-md">
        <div className="flex-1 mr-2 rounded-lg overflow-hidden shadow-md bg-white">
          <LocationSearch onPlaceSelected={handlePlaceSelected} isLoaded={isLoaded} />
        </div>
        
        {pins.length > 0 && (
          <button 
            onClick={fitMapToPins}
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center shadow-md"
            title="Fit map to show all pins (Ctrl+F)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
            <span>Fit</span>
            <span className="ml-1 text-xs text-gray-500 hidden md:inline">(Ctrl+F)</span>
          </button>
        )}
      </div>

      {showAddPinModal && clickedLocation && (
        <AddPinModal
          onAdd={handleAddPin}
          onCancel={handleCloseModal}
          location={clickedLocation}
          suggestedName={placeInfo?.name || ''}
        />
      )}
    </div>
  );
} 