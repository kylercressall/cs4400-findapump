import { prisma } from '../prisma';

export const getStationsWithPrices = async () => {
  return prisma.station.findMany({
    include: {
      location: true,
      stationBrand: true,
      FuelPrice: {
        include: { fuelType: true },
        orderBy: { fuelPrice: "asc" }
      }
    }
  });
};

export const getStationById = async (stationId: string) => {
  return prisma.station.findUnique({
    where: { id: stationId },
    include: {
      location: true,
      stationBrand: true,
      FuelPrice: {
        include: { fuelType: true },
        orderBy: { fuelPrice: "asc" }
      }
    }
  });
};

export const getStationsByLocation = async (
  latitude: number,
  longitude: number,
  radiusMiles: number = 10
) => {
  const latDelta = radiusMiles / 69;
  const lonDelta = radiusMiles / (69 * Math.cos((latitude * Math.PI) / 180));

  return prisma.station.findMany({
    where: {
      location: {
        lat: {
          gte: latitude - latDelta,
          lte: latitude + latDelta
        },
        long: {
          gte: longitude - lonDelta,
          lte: longitude + lonDelta
        }
      }
    },
    include: {
      location: true,
      stationBrand: true,
      FuelPrice: {
        include: { fuelType: true },
        orderBy: { fuelPrice: "asc" }
      }
    }
  });
};
