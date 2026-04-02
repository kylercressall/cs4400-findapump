import { appendFileSync } from "fs";
import { join } from "path";
import { prisma } from "../prisma";

export type StationKind = "gas" | "ev";

export interface FuelPriceEntry {
  type: string;
  units: number;
  nanos: number;
  updateTime?: string;
}

export interface NearbyStation {
  place_id: string;
  name: string;
  kind: StationKind;
  lat: number;
  lng: number;
  vicinity: string;
  fuelPrices?: FuelPriceEntry[];
}

const PLACES_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const LOG_PATH = join(process.cwd(), "google-maps-api.log");

function log(label: string, data: unknown) {
  const entry = `[${new Date().toISOString()}] ${label}\n${JSON.stringify(data, null, 2)}\n\n`;
  appendFileSync(LOG_PATH, entry);
}

function parseVicinity(vicinity: string): { street: string; city: string } {
  const commaIndex = vicinity.lastIndexOf(",");
  if (commaIndex === -1) return { street: vicinity, city: "" };
  return {
    street: vicinity.slice(0, commaIndex).trim(),
    city: vicinity.slice(commaIndex + 1).trim(),
  };
}

async function upsertAllStations(stations: NearbyStation[]) {
  // Upsert all unique brand names first (serially) to avoid race conditions
  const uniqueNames = [...new Set(stations.map((s) => s.name).filter(Boolean))];
  const brandMap = new Map<string, string>(); // name -> id
  for (const name of uniqueNames) {
    const brand = await prisma.stationBrand.upsert({
      where: { brandName: name },
      update: {},
      create: { brandName: name },
    });
    brandMap.set(name, brand.id);
  }

  // Upsert each station now that brands are settled
  let upserted = 0;
  for (const station of stations) {
    try {
      const { street, city } = parseVicinity(station.vicinity);
      const brandId = brandMap.get(station.name) ?? null;

      const existing = await prisma.station.findUnique({
        where: { placeId: station.place_id },
      });

      if (existing) {
        await prisma.location.update({
          where: { id: existing.locationId },
          data: { lat: station.lat, long: station.lng, street, city },
        });
        if (brandId && !existing.stationBrandId) {
          await prisma.station.update({
            where: { id: existing.id },
            data: { stationBrandId: brandId },
          });
        }
      } else {
        const location = await prisma.location.create({
          data: { lat: station.lat, long: station.lng, street, city },
        });
        await prisma.station.create({
          data: {
            placeId: station.place_id,
            kind: station.kind,
            locationId: location.id,
            stationBrandId: brandId,
          },
        });
      }
      upserted++;
    } catch (err) {
      console.error(`[Maps] Failed to upsert station ${station.place_id} (${station.name}):`, err);
    }
  }
  console.log(`[Maps] Upserted ${upserted}/${stations.length} stations to DB`);
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

function dbStationsToNearby(stations: any[]): NearbyStation[] {
  return stations
    .filter((s) => s.location?.lat && s.location?.long)
    .map((s) => {
      const fuelPrices: FuelPriceEntry[] = (s.FuelPrice ?? []).map((fp: any) => {
        const price = fp.fuelPrice ?? 0;
        const units = Math.floor(price);
        const nanos = Math.round((price - units) * 1_000_000_000);
        return {
          type: fp.fuelType?.name ?? "UNKNOWN",
          units,
          nanos,
          updateTime: fp.createdAt?.toISOString(),
        };
      });

      return {
        place_id: s.placeId ?? "",
        name: s.stationBrand?.brandName ?? "Unknown",
        kind: (s.kind as StationKind) ?? "gas",
        lat: s.location.lat,
        lng: s.location.long,
        vicinity: [s.location.street, s.location.city].filter(Boolean).join(", "),
        fuelPrices: fuelPrices.length > 0 ? fuelPrices : undefined,
      };
    });
}

export async function getCachedNearbyStations(
  lat: number,
  lng: number,
  radius: number
): Promise<NearbyStation[]> {
  const radiusMiles = radius / 1609;
  const latDelta = radiusMiles / 69;
  const lonDelta = radiusMiles / (69 * Math.cos((lat * Math.PI) / 180));

  const dbStations = await prisma.station.findMany({
    where: {
      location: {
        lat: { gte: lat - latDelta, lte: lat + latDelta },
        long: { gte: lng - lonDelta, lte: lng + lonDelta },
      },
    },
    include: {
      location: true,
      stationBrand: true,
      FuelPrice: { include: { fuelType: true } },
    },
  });

  console.log(`[Maps] DB cache returned ${dbStations.length} stations`);
  return dbStationsToNearby(dbStations);
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
  const stations = [...gas, ...ev];

  // Persist to DB in the background — don't await so the response isn't delayed
  upsertAllStations(stations).catch((err) =>
    console.error("[Maps] DB upsert failed:", err)
  );

  return stations;
}
