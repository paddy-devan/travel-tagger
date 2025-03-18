'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import AddPinModal from '@/components/pins/AddPinModal';
import LocationSearch from '@/components/maps/LocationSearch';

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
  name: string;
  lat: number;
  lng: number;
  description: string | null;
  trip_id: string;
}

interface TripMapProps {
  tripId: string;
  onPinAdded: () => void;
}

export default function TripMap({ tripId, onPinAdded }: TripMapProps) {
  const { user } = useAuth();
  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [clickedLocation, setClickedLocation] = useState<{lat: number; lng: number} | null>(null);
  const [showAddPinModal, setShowAddPinModal] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

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
        .order('created_at', { ascending: true });

      if (error) throw error;

      setPins(data || []);

      // If pins exist, center map on the first pin
      if (data && data.length > 0) {
        setMapCenter({
          lat: data[0].lat,
          lng: data[0].lng
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
  }, [isLoaded, fetchPins]);

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

  const handleAddPin = async (name: string, description: string) => {
    if (!user || !tripId || !clickedLocation) return;

    try {
      const { error } = await supabase
        .from('pins')
        .insert({
          trip_id: tripId,
          name,
          description,
          lat: clickedLocation.lat,
          lng: clickedLocation.lng
        });

      if (error) throw error;

      // Refresh pins
      fetchPins();
      // Notify parent component
      onPinAdded();
      // Reset state
      setClickedLocation(null);
      setShowAddPinModal(false);
    } catch (error) {
      console.error('Error adding pin:', error);
    }
  };

  const handleCloseModal = () => {
    setShowAddPinModal(false);
    setClickedLocation(null);
  };

  const handlePlaceSelected = useCallback((place: { name: string; lat: number; lng: number; address?: string }) => {
    // Center the map on the selected place
    setMapCenter({ lat: place.lat, lng: place.lng });
    
    // Create a clicked location that will trigger the add pin modal
    setClickedLocation({ lat: place.lat, lng: place.lng });
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
            position={{ lat: pin.lat, lng: pin.lng }}
            onClick={() => setSelectedPin(pin)}
          />
        ))}

        {selectedPin && (
          <InfoWindow
            position={{ lat: selectedPin.lat, lng: selectedPin.lng }}
            onCloseClick={() => setSelectedPin(null)}
          >
            <div className="min-w-[200px]">
              <h3 className="font-medium text-gray-900">{selectedPin.name}</h3>
              {selectedPin.description && (
                <p className="mt-1 text-sm text-gray-600">{selectedPin.description}</p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {showAddPinModal && clickedLocation && (
        <AddPinModal
          onAdd={handleAddPin}
          onCancel={handleCloseModal}
          location={clickedLocation}
        />
      )}
    </div>
  );
} 