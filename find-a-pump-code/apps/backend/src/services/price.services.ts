import { prisma } from "../prisma";

export const getAllPrices = async () => {
  // currently unused

  // use prisma (safe) const prices = prisma.fuelPrice.findMany()
  // use raw sql (unsafe but probably fine for the scope of this project)
  //  const prices = prisma.$queryRawUnsafe('SELECT * FROM')

  const prices = {};
  // sql goes here
  return prices;
};

export const getFuelPricesByPlaceId = async (placeId: string) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Missing Google Maps API key");
  }

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,fuelOptions",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Fuel details request failed: ${response.status}`);
  }

  const data = await response.json();
  const rawPrices = data?.fuelOptions?.fuelPrices ?? [];

  const prices = rawPrices.map((fuel: any) => ({
    type: fuel.type ?? "UNKNOWN",
    units: Number(fuel.price?.units ?? 0),
    nanos: Number(fuel.price?.nanos ?? 0),
    updateTime: fuel.updateTime,
  }));

  // Persist to DB in background — don't block the response
  upsertFuelPrices(placeId, prices).catch((err) =>
    console.error("[Prices] DB upsert failed:", err)
  );

  return prices;
};

async function upsertFuelPrices(
  placeId: string,
  prices: { type: string; units: number; nanos: number; updateTime?: string }[]
) {
  const station = await prisma.station.findUnique({ where: { placeId } });
  if (!station) {
    console.log(`[Prices] Station not found in DB for placeId=${placeId}, skipping upsert`);
    return;
  }

  for (const fuel of prices) {
    const fuelType = await prisma.fuelType.upsert({
      where: { name: fuel.type },
      update: {},
      create: { name: fuel.type },
    });

    await prisma.fuelPrice.upsert({
      where: { stationId_fuelTypeId: { stationId: station.id, fuelTypeId: fuelType.id } },
      update: {
        fuelPrice: fuel.units + fuel.nanos / 1_000_000_000,
        createdAt: fuel.updateTime ? new Date(fuel.updateTime) : new Date(),
      },
      create: {
        stationId: station.id,
        fuelTypeId: fuelType.id,
        fuelUnit: "USD_PER_GALLON",
        fuelPrice: fuel.units + fuel.nanos / 1_000_000_000,
        createdAt: fuel.updateTime ? new Date(fuel.updateTime) : new Date(),
      },
    });
  }

//   console.log(`[Prices] Upserted ${prices.length} fuel prices for placeId=${placeId}`);
}
