'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { AddPinModal } from '@/components/pins';
import { LocationSearch } from '@/components/maps';

// Define map container style
const containerStyle = {
  width: '100%',
  height: 'calc(100% - 40px)' // Leave room for the search bar
};

// Default center (can be updated based on pins or user location)
const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060 // New York City
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
        setMapCenter({
          lat: data[0].latitude,
          lng: data[0].longitude
        });
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

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true);
  }, []);

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
    // Center the map on the selected place
    setMapCenter({ lat: place.lat, lng: place.lng });
    
    // Create a clicked location that will trigger the add pin modal
    setClickedLocation({ lat: place.lat, lng: place.lng });
    
    // Save place info for when we create the pin
    setPlaceInfo({
      name: place.name,
      place_id: place.place_id,
      address: place.address
    });
    
    setShowAddPinModal(true);
    
    // If the map is loaded, also pan to the location
    if (mapRef.current) {
      mapRef.current.panTo({ lat: place.lat, lng: place.lng });
      mapRef.current.setZoom(15);
    }
  }, []);

  if (!isLoaded) {
    return <div className="h-full flex items-center justify-center text-gray-500">Loading Google Maps...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-3">
        <LocationSearch onPlaceSelected={handlePlaceSelected} isLoaded={isLoaded} />
      </div>
      
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={10}
        onClick={onMapClick}
        onLoad={onMapLoad}
        options={{
          fullscreenControl: false,
          mapTypeControl: true,
          streetViewControl: false,
          zoomControl: true,
        }}
      >
        {pins.map(pin => (
          <Marker
            key={pin.id}
            position={{ lat: pin.latitude, lng: pin.longitude }}
            onClick={() => setSelectedPin(pin)}
          />
        ))}

        {selectedPin && (
          <InfoWindow
            position={{ lat: selectedPin.latitude, lng: selectedPin.longitude }}
            onCloseClick={() => setSelectedPin(null)}
          >
            <div className="min-w-[200px]">
              <h3 className="font-medium text-gray-900">{selectedPin.nickname}</h3>
              {selectedPin.notes && (
                <p className="mt-1 text-sm text-gray-600">{selectedPin.notes}</p>
              )}
              {selectedPin.category && (
                <p className="mt-1 text-xs text-gray-500">Category: {selectedPin.category}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {selectedPin.visited_flag ? 'Visited ✓' : 'Not visited yet'}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

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