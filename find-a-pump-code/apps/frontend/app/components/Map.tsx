"use client";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useMemo, useState } from "react";

type LatLng = { lat: number; lng: number };
type StationKind = "gas" | "ev";
type SortOption = "cheapest" | "closest" | "fastest";

type FuelPriceEntry = {
  type: string;
  units: number;
  nanos: number;
  updateTime?: string;
};

type Station = {
  id: string;
  name: string;
  position: LatLng;
  kind: StationKind;
  placeId?: string;
  address?: string;
  rating?: number;
  totalRatings?: number;
  openNow?: boolean;
  fuelPrices?: FuelPriceEntry[];
};

type StationRow = {
  station: Station;
  distanceMiles: number;
  etaMinutes: number;
  lowestPrice: number | null;
  lowestPriceLabel: string;
};

const fallbackCenter: LatLng = {
  lat: 40.2338,
  lng: -111.6585,
};

const averageCityMph = 28;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMiles(a: LatLng, b: LatLng) {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(h));
}

function estimateEtaMinutes(distanceMiles: number) {
  const bufferMinutes = 2;
  const driveMinutes = (distanceMiles / averageCityMph) * 60;
  return Math.max(1, Math.round(driveMinutes + bufferMinutes));
}

function priceToNumber(units?: number, nanos?: number) {
  return (units || 0) + (nanos || 0) / 1_000_000_000;
}

function getLowestFuelPrice(fuelPrices?: FuelPriceEntry[]) {
  if (!fuelPrices || fuelPrices.length === 0) {
    return null;
  }

  const numericPrices = fuelPrices
    .map((fuel) => priceToNumber(fuel.units, fuel.nanos))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (numericPrices.length === 0) {
    return null;
  }

  return Math.min(...numericPrices);
}

function formatFuelPrices(fuelPrices?: FuelPriceEntry[]) {
  if (!fuelPrices || fuelPrices.length === 0) return "No fuel prices available";

  return fuelPrices
    .map((fuel) => {
      const price = priceToNumber(fuel.units, fuel.nanos).toFixed(3);
      return `${fuel.type}: $${price}`;
    })
    .join(" | ");
}

export default function Map() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const [map, setMap] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("cheapest");
  const [kindFilter, setKindFilter] = useState<"all" | StationKind>("all");
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
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

  const stationRows = useMemo<StationRow[]>(() => {
    if (!userLocation) {
      return [];
    }

    const filteredStations =
      kindFilter === "all"
        ? stations
        : stations.filter((station) => station.kind === kindFilter);

    const computedRows = filteredStations.map((station) => {
      const distanceMiles = getDistanceMiles(userLocation, station.position);
      const etaMinutes = estimateEtaMinutes(distanceMiles);
      const lowestPrice = getLowestFuelPrice(station.fuelPrices);

      return {
        station,
        distanceMiles,
        etaMinutes,
        lowestPrice,
        lowestPriceLabel: lowestPrice === null ? "N/A" : `$${lowestPrice.toFixed(3)}`,
      };
    });

    computedRows.sort((a, b) => {
      if (sortBy === "closest") {
        return a.distanceMiles - b.distanceMiles;
      }

      if (sortBy === "fastest") {
        return a.etaMinutes - b.etaMinutes;
      }

      const aPrice = a.lowestPrice ?? Number.POSITIVE_INFINITY;
      const bPrice = b.lowestPrice ?? Number.POSITIVE_INFINITY;

      if (aPrice !== bPrice) {
        return aPrice - bPrice;
      }

      return a.distanceMiles - b.distanceMiles;
    });

    return computedRows;
  }, [kindFilter, sortBy, stations, userLocation]);

  async function fetchFuelOptions(placeId: string): Promise<FuelPriceEntry[]> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/prices/fuel?placeId=${placeId}`
    );

    if (!response.ok) {
      throw new Error(`Fuel details request failed: ${response.status}`);
    }

    return response.json();
  }

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
                      placeId: place.place_id,
                      name: place.name || defaultName,
                      kind,
                      address: place.vicinity || place.formatted_address,
                      rating: typeof place.rating === "number" ? place.rating : undefined,
                      totalRatings:
                        typeof place.user_ratings_total === "number"
                          ? place.user_ratings_total
                          : undefined,
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
        ]).then(async ([gasResult, evResult]) => {
          const gasStations = gasResult.status === "fulfilled" ? gasResult.value : [];
          const evStations = evResult.status === "fulfilled" ? evResult.value : [];

          const enrichedGasStations = await Promise.all(
            gasStations.map(async (station) => {
              if (!station.placeId) return station;

              try {
                const fuelPrices = await fetchFuelOptions(station.placeId);
                return { ...station, fuelPrices };
              } catch (err) {
                console.error(`Could not load fuel prices for ${station.name}`, err);
                return station;
              }
            })
          );

          const allStations = [...enrichedGasStations, ...evStations];
          setStations(allStations);
          if (allStations.length > 0) {
            setSelectedStationId(allStations[0].id);
          }

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

  const selectedStationRow = stationRows.find((row) => row.station.id === selectedStationId);

  function focusStation(stationId: string) {
    const target = stationRows.find((row) => row.station.id === stationId);
    if (!target) {
      return;
    }

    setSelectedStationId(stationId);
    map?.panTo(target.station.position);
    map?.setZoom?.(14);
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={userLocation || fallbackCenter}
        zoom={userLocation ? 13 : 11}
        onLoad={setMap}
      >
        {userLocation && <Marker position={userLocation} icon={userIconUrl} />}

        {stations.map((station) => (
          <Marker
            key={station.id}
            position={station.position}
            onClick={() => {
              setSelectedStationId(station.id);
              setIsPanelCollapsed(false);
            }}
            title={
              station.kind === "gas"
                ? `${station.name} - ${formatFuelPrices(station.fuelPrices)}`
                : station.name
            }
            icon={station.kind === "ev" ? evIconUrl : gasIconUrl}
          />
        ))}
      </GoogleMap>

      <div
        data-testid="station-panel"
        className={`absolute left-0 top-0 z-20 h-full bg-white/95 text-black shadow-xl transition-all duration-300 ${
          isPanelCollapsed ? "w-14" : "w-[min(22rem,85vw)]"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-black/10 px-3 py-3">
            <button
              type="button"
              onClick={() => setIsPanelCollapsed((prev) => !prev)}
              className="rounded border border-black/20 bg-white px-2 py-1 text-xs font-semibold hover:bg-black/5"
              aria-label={isPanelCollapsed ? "Expand station panel" : "Collapse station panel"}
            >
              {isPanelCollapsed ? "»" : "«"}
            </button>

            {!isPanelCollapsed && (
              <div className="mt-3 space-y-3">
                <div>
                  <h2 className="text-base font-bold">Nearby Stations</h2>
                  <p className="text-xs text-black/70">Compare price, distance, and ETA</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-black/70">Sort</span>
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value as SortOption)}
                      className="rounded border border-black/20 bg-white px-2 py-1"
                    >
                      <option value="cheapest">Cheapest</option>
                      <option value="closest">Closest</option>
                      <option value="fastest">Fastest ETA</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-black/70">Type</span>
                    <select
                      value={kindFilter}
                      onChange={(event) =>
                        setKindFilter(event.target.value as "all" | StationKind)
                      }
                      className="rounded border border-black/20 bg-white px-2 py-1"
                    >
                      <option value="all">All</option>
                      <option value="gas">Gas</option>
                      <option value="ev">EV</option>
                    </select>
                  </label>
                </div>
              </div>
            )}
          </div>

          {!isPanelCollapsed && (
            <>
              <div className="max-h-[56%] flex-1 space-y-2 overflow-y-auto p-3">
                {stationRows.length === 0 && (
                  <div className="rounded border border-dashed border-black/20 bg-black/[0.03] p-3 text-sm text-black/70">
                    No stations to show yet.
                  </div>
                )}

                {stationRows.map((row) => {
                  const isSelected = row.station.id === selectedStationId;

                  return (
                    <button
                      key={row.station.id}
                      data-testid="station-row"
                      type="button"
                      onClick={() => focusStation(row.station.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-black/15 bg-white hover:bg-black/[0.03]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold leading-tight">{row.station.name}</div>
                          <div className="mt-1 text-xs text-black/65">
                            {row.station.kind === "gas" ? "Gas station" : "EV charging"}
                          </div>
                        </div>
                        <div className="rounded bg-black px-2 py-1 text-xs font-semibold text-white">
                          {row.lowestPriceLabel}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-black/75">
                        <span>{row.distanceMiles.toFixed(1)} mi</span>
                        <span>{row.etaMinutes} min</span>
                        {typeof row.station.openNow === "boolean" && (
                          <span>{row.station.openNow ? "Open now" : "Closed"}</span>
                        )}
                      </div>

                      {row.station.address && (
                        <div className="mt-2 text-xs text-black/65">{row.station.address}</div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedStationRow && (
                <div className="border-t border-black/10 bg-black/[0.03] p-3 text-xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-black/60">
                    Selected Station
                  </div>
                  <div className="mt-1 text-sm font-bold">{selectedStationRow.station.name}</div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded bg-white p-2">
                      <div className="text-[11px] text-black/60">Distance</div>
                      <div className="font-semibold">
                        {selectedStationRow.distanceMiles.toFixed(2)} miles
                      </div>
                    </div>
                    <div className="rounded bg-white p-2">
                      <div className="text-[11px] text-black/60">ETA</div>
                      <div className="font-semibold">{selectedStationRow.etaMinutes} min</div>
                    </div>
                    <div className="rounded bg-white p-2">
                      <div className="text-[11px] text-black/60">Best Price</div>
                      <div className="font-semibold">{selectedStationRow.lowestPriceLabel}</div>
                    </div>
                    <div className="rounded bg-white p-2">
                      <div className="text-[11px] text-black/60">Rating</div>
                      <div className="font-semibold">
                        {typeof selectedStationRow.station.rating === "number"
                          ? `${selectedStationRow.station.rating.toFixed(1)}${
                              selectedStationRow.station.totalRatings
                                ? ` (${selectedStationRow.station.totalRatings})`
                                : ""
                            }`
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  {selectedStationRow.station.kind === "gas" && (
                    <div className="mt-3 rounded bg-white p-2">
                      <div className="text-[11px] text-black/60">Fuel Prices</div>
                      <div className="mt-1 text-xs leading-relaxed text-black/80">
                        {formatFuelPrices(selectedStationRow.station.fuelPrices)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
        <div className="absolute left-16 top-4 z-30 rounded bg-white/90 px-3 py-2 text-sm shadow">
          {error}
        </div>
      )}
    </div>
  );
}
