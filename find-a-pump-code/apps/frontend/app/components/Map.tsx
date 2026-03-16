"use client";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useMemo, useState } from "react";

type LatLng = { lat: number; lng: number };
type StationKind = "gas" | "ev";
type Station = { id: string; name: string; position: LatLng; kind: StationKind };

const fallbackCenter: LatLng = {
  lat: 40.2338,
  lng: -111.6585,
};

export default function Map() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [map, setMap] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [error, setError] = useState<string | null>(null);

  const gasIconUrl = useMemo(
    () => "https://maps.gstatic.com/mapfiles/ms2/micons/gas.png",
    []
  );
  const evIconUrl = useMemo(
    () =>
      `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><text x="22" y="31" text-anchor="middle" font-size="30">⚡</text></svg>'
      )}`,
    []
  );
  const userIconUrl = useMemo(
    () => "https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png",
    []
  );

  // Fire geolocation + API calls immediately on mount
  useEffect(() => {
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

        const base = `http://localhost:3001/api/maps/nearby`;
        const params = `lat=${loc.lat}&lng=${loc.lng}&radius=5000`;

        type ApiStation = { place_id: string; name: string; kind: StationKind; lat: number; lng: number };
        const toStation = (s: ApiStation): Station => ({
          id: `${s.kind}-${s.place_id}`,
          name: s.name,
          kind: s.kind,
          position: { lat: s.lat, lng: s.lng },
        });

        // Load cached DB stations immediately
        fetch(`${base}/cached?${params}`)
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((data: ApiStation[]) => {
            if (data.length > 0) setStations(data.map(toStation));
          })
          .catch(() => {});

        // Load live Google Maps stations and replace
        fetch(`${base}?${params}`)
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((data: ApiStation[]) => {
            setStations(data.map(toStation));
            setError(null);
          })
          .catch(() => setError("Unable to load nearby stations."));
      },
      () => {
        setError("Location permission denied. Showing the default area.");
      }
    );
  }, []);

  // Pan to user location once the map is ready
  useEffect(() => {
    if (map && userLocation) {
      map.panTo(userLocation);
    }
  }, [map, userLocation]);

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
            icon={station.kind === "ev" ? evIconUrl : gasIconUrl}
          />
        ))}
      </GoogleMap>
      <div className="absolute right-4 top-4 rounded bg-white/90 px-3 py-2 text-sm text-black shadow">
        <div className="mb-1 font-semibold">Legend</div>
        <div className="flex items-center gap-2">
          <img src={gasIconUrl} alt="Gas station marker" className="h-5 w-5" />
          <span>Gas Station</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-2xl leading-none">⚡</span>
          <span>EV Charging Station</span>
        </div>
      </div>
      {error && (
        <div className="absolute left-4 top-4 rounded bg-white/90 px-3 py-2 text-sm shadow">
          {error}
        </div>
      )}
    </div>
  );
}
