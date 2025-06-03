'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import AddPinModal from '@/components/AddPinModal';
import LocationSearch from '@/components/LocationSearch';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTripContext } from '@/lib/TripContext';
import { CATEGORY_COLORS, getCategoryColor } from '@/lib/constants';

// Define map container style
const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%'
};

// Default center
const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060 // New York City
};

// Simplified marker creation
const createMarkerSVG = (color: string) => {
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
  tripId?: string;
  refreshTrigger?: number;
  showControls?: boolean;
}

interface TemporarySelectedPlace {
  location: { lat: number; lng: number };
  name: string;
  place_id?: string;
  address?: string;
}

interface MapMouseEventWithPlaceId extends google.maps.MapMouseEvent {
  placeId?: string;
}

export default function TripMap({
  tripId,
  refreshTrigger = 0,
  showControls = true,
}: TripMapProps) {
  const { user } = useAuth();
  const { triggerPinListRefresh } = useTripContext();
  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [clickedLocation, setClickedLocation] = useState<{lat: number; lng: number} | null>(null);
  const [showAddPinModal, setShowAddPinModal] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [placeInfo, setPlaceInfo] = useState<{
    name: string;
    place_id?: string;
    address?: string;
  } | null>(null);
  const [temporarySelectedPlace, setTemporarySelectedPlace] = useState<TemporarySelectedPlace | null>(null);

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
    version: 'weekly'
  });

  // Fetch pins for the trip
  const fetchPins = useCallback(async () => {
    if (!user || !tripId) {
        setPins([]);
        return;
    }

    try {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('trip_id', tripId)
        .order('order', { ascending: true });

      if (error) throw error;
      setPins(data || []);
    } catch (error) {
      console.error('Error fetching pins:', error);
      setPins([]);
    }
  }, [tripId, user]);

  useEffect(() => {
    if (isLoaded) {
      fetchPins();
    }
  }, [isLoaded, fetchPins, refreshTrigger]);

  // Fit map to show all pins
  const fitMapToPins = useCallback(() => {
    if (!mapRef.current || pins.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    pins.forEach(pin => {
      bounds.extend({ lat: pin.latitude, lng: pin.longitude });
    });
    
    const windowWidth = window.innerWidth;
    const isMobile = windowWidth < 768;
    
    const padding = {
      top: 80,
      bottom: isMobile ? windowWidth / 3 : 50,
      left: 50,
      right: isMobile ? 50 : windowWidth / 3 + 50
    };
    
    mapRef.current.fitBounds(bounds, padding);
    
    if (pins.length === 1) {
      const currentZoom = mapRef.current.getZoom();
      if (currentZoom !== undefined && currentZoom > 15) {
        mapRef.current.setZoom(15);
      }
    }
  }, [pins]);

  // Handle map load
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true);
  }, []);

  // Handle map click
  const onMapClick = useCallback((event: MapMouseEventWithPlaceId) => {
    if (!event.latLng || !tripId) return;

    const location = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };

    setClickedLocation(location);
    setPlaceInfo(null);
    setTemporarySelectedPlace(null);
    setShowAddPinModal(true);
  }, [tripId]);

  // Handle adding a pin
  const handleAddPin = async (nickname: string, notes: string | null, category: string | null) => {
    if (!user || !clickedLocation || !tripId) return;
    
    try {
      const { count, error: countError } = await supabase
        .from('pins')
        .select('count', { count: 'exact', head: true })
        .eq('trip_id', tripId);

      if (countError) throw countError;
      const nextOrder = count ?? 0;

      const { data, error } = await supabase
        .from('pins')
        .insert({
          nickname: nickname,
          notes: notes,
          latitude: clickedLocation.lat,
          longitude: clickedLocation.lng,
          trip_id: tripId,
          category: category,
          google_maps_id: placeInfo?.place_id ?? null,
          order: nextOrder
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPins(prevPins => [...prevPins, data as Pin]);
        triggerPinListRefresh();
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error adding pin:', error);
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setShowAddPinModal(false);
    setClickedLocation(null);
    setPlaceInfo(null);
  };

  // Handle location selection from search
  const handleLocationSelect = useCallback((place: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
    place_id?: string;
  }) => {
    if (!tripId) return;
    
    const location = { lat: place.lat, lng: place.lng };
    setClickedLocation(location);
    setPlaceInfo({
      name: place.name,
      place_id: place.place_id,
      address: place.address
    });
    
    setTemporarySelectedPlace({
      location: location,
      name: place.name,
      place_id: place.place_id,
      address: place.address
    });

    if (mapRef.current) {
      mapRef.current.panTo(location);
      mapRef.current.setZoom(15);
    }
  }, [tripId]);

  const handleConfirmAddPinFromSearch = useCallback(() => {
    if (!temporarySelectedPlace) return;
    setShowAddPinModal(true);
    setTemporarySelectedPlace(null);
  }, [temporarySelectedPlace]);

  // Auto-fit when pins change
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    if (tripId && pins.length > 0) {
      const timer = setTimeout(() => {
        fitMapToPins();
      }, 150);
      return () => clearTimeout(timer);
    } else if (!tripId) {
      mapRef.current.panTo(defaultCenter);
      mapRef.current.setZoom(3);
    }
  }, [mapLoaded, pins, tripId, fitMapToPins]);

  // Map restriction to prevent panning to poles
  const mapRestriction: google.maps.MapRestriction = {
    latLngBounds: {
      north: 85,
      south: -85,
      west: -180,
      east: 180,
    },
    strictBounds: false,
  };

  const getMarkerIcon = (category: string | null) => {
    return createMarkerSVG(getCategoryColor(category));
  };

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <div style={containerStyle} className="relative">
      {/* Search Control */}
      {isLoaded && tripId && showControls && (
        <div className="absolute top-20 left-4 z-20 w-64 md:w-80">
          <LocationSearch 
            onPlaceSelected={handleLocationSelect} 
            isLoaded={isLoaded} 
          />
        </div>
      )}
      
      {/* Fit Button */}
      {showControls && pins.length > 0 && tripId && (
        <div className="absolute top-32 left-4 z-20">
          <button 
            onClick={fitMapToPins}
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center shadow-md"
            title="Fit map to show all pins"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
            <span>Fit</span>
          </button>
        </div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        onLoad={onMapLoad}
        onClick={showControls ? onMapClick : undefined}
        options={{
          disableDefaultUI: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          keyboardShortcuts: showControls,
          gestureHandling: 'greedy',
          clickableIcons: true,
          restriction: mapRestriction,
        }}
      >
        {pins.map(pin => (
          <Marker
            key={pin.id}
            position={{ lat: pin.latitude, lng: pin.longitude }}
            onClick={() => {
                setSelectedPin(pin);
                setTemporarySelectedPlace(null);
            }}
            icon={getMarkerIcon(pin.category)}
          />
        ))}

        {selectedPin && (
          <InfoWindow
            position={{ lat: selectedPin.latitude, lng: selectedPin.longitude }}
            onCloseClick={() => setSelectedPin(null)}
          >
            <div className="p-2">
              <h4 className="font-medium text-gray-800">{selectedPin.nickname}</h4>
              {selectedPin.category && (
                <p className="text-xs text-gray-500 mt-1">{selectedPin.category}</p>
              )}
              {selectedPin.notes && (
                <p className="text-sm text-gray-600 mt-1">{selectedPin.notes}</p>
              )}
            </div>
          </InfoWindow>
        )}

        {temporarySelectedPlace && (
           <InfoWindow
             position={temporarySelectedPlace.location}
             onCloseClick={() => setTemporarySelectedPlace(null)}
           >
              <div className="p-1">
                 <h4 className="font-medium text-gray-800">{temporarySelectedPlace.name}</h4>
                 {temporarySelectedPlace.address && (
                     <p className="text-xs text-gray-500 mt-1">{temporarySelectedPlace.address}</p>
                 )}
                 <button 
                   onClick={handleConfirmAddPinFromSearch}
                   className="mt-3 w-full px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                 >
                    Add Pin to List
                 </button>
              </div>
           </InfoWindow>
        )}
      </GoogleMap>

      {showAddPinModal && clickedLocation && tripId && showControls && (
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