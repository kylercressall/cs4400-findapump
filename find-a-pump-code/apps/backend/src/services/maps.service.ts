import { appendFileSync } from "fs";
import { join } from "path";

export type StationKind = "gas" | "ev";

export interface NearbyStation {
  place_id: string;
  name: string;
  kind: StationKind;
  lat: number;
  lng: number;
  vicinity: string;
}

const PLACES_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const LOG_PATH = join(process.cwd(), "google-maps-api.log");

function log(label: string, data: unknown) {
  const entry = `[${new Date().toISOString()}] ${label}\n${JSON.stringify(data, null, 2)}\n\n`;
  appendFileSync(LOG_PATH, entry);
}

async function searchNearby(
  lat: number,
  lng: number,
  radius: number,
  type: string,
  kind: StationKind
): Promise<NearbyStation[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_MAPS_API_KEY is not set in the backend .env file");
  }
  const url = `${PLACES_URL}?location=${lat},${lng}&radius=${radius}&type=${type}&key=${key}`;

  console.log(`[Maps] Calling Places API: type=${type} lat=${lat} lng=${lng} radius=${radius}`);
  const res = await fetch(url);
  const json = await res.json();
  console.log(`[Maps] Response: type=${type} status=${json.status} results=${json.results?.length ?? 0}`);

  log(`nearbySearch type=${type} lat=${lat} lng=${lng} radius=${radius}`, json);

  if (json.status === "ZERO_RESULTS") {
    console.log(`[Maps] Zero results for type=${type}`);
    return [];
  }

  if (json.status !== "OK") {
    console.error(`[Maps] Places API error: type=${type} status=${json.status}`);
    throw new Error(`Places API error: ${json.status}`);
  }

  return (json.results as any[])
    .filter((p) => p.geometry?.location)
    .map((p) => ({
      place_id: p.place_id,
      name: p.name,
      kind,
      lat: p.geometry.location.lat,
      lng: p.geometry.location.lng,
      vicinity: p.vicinity ?? "",
    }));
}

export async function getNearbyStations(
  lat: number,
  lng: number,
  radius: number
): Promise<NearbyStation[]> {
  const [gasResults, evResults] = await Promise.allSettled([
    searchNearby(lat, lng, radius, "gas_station", "gas"),
    searchNearby(lat, lng, radius, "electric_vehicle_charging_station", "ev"),
  ]);

  const gas = gasResults.status === "fulfilled" ? gasResults.value : [];
  const ev = evResults.status === "fulfilled" ? evResults.value : [];
  return [...gas, ...ev];
}
