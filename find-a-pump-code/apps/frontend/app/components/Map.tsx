"use client";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; 

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

        const nearbySearchByType = (
          type: string,
          kind: StationKind,
          defaultName: string
        ): Promise<Station[]> => {
          return new Promise((resolve, reject) => {
            service.nearbySearch(
              {
                location: loc,
                radius: 5000,
                type,
              },
              (results: any[], status: string) => {
                if (status === googleMaps.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                  resolve([]);
                  return;
                }

                if (status !== googleMaps.maps.places.PlacesServiceStatus.OK) {
                  reject(new Error(`Failed to load ${kind} stations`));
                  return;
                }

                const mappedStations = (results || [])
                  .map((place: any, index: number) => {
                    const placeLocation = place.geometry?.location;
                    if (!placeLocation) {
                      return null;
                    }

                    return {
                      id: `${kind}-${place.place_id || `${place.name}-${index}`}`,
                      name: place.name || defaultName,
                      kind,
                      position: {
                        lat: placeLocation.lat(),
                        lng: placeLocation.lng(),
                      },
                    } as Station;
                  })
                  .filter(Boolean) as Station[];

                resolve(mappedStations);
              }
            );
          });
        };

        Promise.allSettled([
          nearbySearchByType("gas_station", "gas", "Gas Station"),
          nearbySearchByType(
            "electric_vehicle_charging_station",
            "ev",
            "EV Charging Station"
          ),
        ]).then(([gasResult, evResult]) => {
          const gasStations = gasResult.status === "fulfilled" ? gasResult.value : [];
          const evStations = evResult.status === "fulfilled" ? evResult.value : [];
          const allStations = [...gasStations, ...evStations];

          setStations(allStations);

          if (gasResult.status === "rejected" && evResult.status === "rejected") {
            setError("Unable to load nearby stations.");
            return;
          }

          if (gasResult.status === "rejected" || evResult.status === "rejected") {
            setError("Some nearby stations could not be loaded.");
            return;
          }

          setError(null);
        });
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
