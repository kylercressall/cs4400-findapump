"use client";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useMemo, useState } from "react";

type LatLng = { lat: number; lng: number };
type Station = { id: string; name: string; position: LatLng };

const fallbackCenter: LatLng = {
  lat: 40.2338,
  lng: -111.6585,
};

export default function Map() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const [map, setMap] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [error, setError] = useState<string | null>(null);

  const gasIconUrl = useMemo(
    () => "https://maps.gstatic.com/mapfiles/ms2/micons/gas.png",
    []
  );
  const userIconUrl = useMemo(
    () => "https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png",
    []
  );

  useEffect(() => {
    if (!isLoaded || !map) {
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
        map.panTo(loc);

        const googleMaps = (window as any).google;
        const service = new googleMaps.maps.places.PlacesService(map);

        service.nearbySearch(
          {
            location: loc,
            radius: 5000,
            type: "gas_station",
          },
          (results: any[], status: string) => {
            if (status !== googleMaps.maps.places.PlacesServiceStatus.OK) {
              setError("Unable to load nearby gas stations.");
              return;
            }

            const nextStations = (results || [])
              .map((place: any, index: number) => {
                const placeLocation = place.geometry?.location;
                if (!placeLocation) {
                  return null;
                }
                return {
                  id: place.place_id || `${place.name}-${index}`,
                  name: place.name || "Gas Station",
                  position: {
                    lat: placeLocation.lat(),
                    lng: placeLocation.lng(),
                  },
                } as Station;
              })
              .filter(Boolean) as Station[];

            setStations(nextStations);
          }
        );
      },
      () => {
        setError("Location permission denied. Showing the default area.");
      }
    );
  }, [isLoaded, map]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        Loading map...
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={userLocation || fallbackCenter}
        zoom={userLocation ? 13 : 11}
        onLoad={setMap}
      >
        {userLocation && (
          <Marker position={userLocation} icon={userIconUrl} />
        )}
        {stations.map((station) => (
          <Marker
            key={station.id}
            position={station.position}
            title={station.name}
            icon={gasIconUrl}
          />
        ))}
      </GoogleMap>
      {error && (
        <div className="absolute left-4 top-4 rounded bg-white/90 px-3 py-2 text-sm shadow">
          {error}
        </div>
      )}
    </div>
  );
}
