import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../src/prisma";
import {
  getStationById,
  getStationsByLocation,
  getStationsWithPrices,
} from "../../src/services/station.service";

vi.mock("../../src/prisma", () => ({
  prisma: {
    station: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe("FN-WB station.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("FN-WB-SS-001: getStationsWithPrices includes relations", async () => {
    vi.mocked(prisma.station.findMany).mockResolvedValueOnce([] as any);

    await getStationsWithPrices();

    expect(prisma.station.findMany).toHaveBeenCalledTimes(1);
    const args = vi.mocked(prisma.station.findMany).mock.calls[0][0] as any;
    expect(args.include.location).toBe(true);
    expect(args.include.stationBrand).toBe(true);
    expect(args.include.FuelPrice.include.fuelType).toBe(true);
    expect(args.include.FuelPrice.orderBy.fuelPrice).toBe("asc");
  });

  it("FN-WB-SS-002: getStationById queries by id and includes sorting", async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValueOnce(null as any);

    await getStationById("station-123");

    expect(prisma.station.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "station-123" },
      })
    );
  });

  it("FN-WB-SS-003: getStationsByLocation computes expected bounds", async () => {
    vi.mocked(prisma.station.findMany).mockResolvedValueOnce([] as any);

    const latitude = 40;
    const longitude = -111;
    const radius = 10;

    await getStationsByLocation(latitude, longitude, radius);

    const args = vi.mocked(prisma.station.findMany).mock.calls[0][0] as any;
    const latBounds = args.where.location.lat;
    const lonBounds = args.where.location.long;

    expect(latBounds.gte).toBeLessThan(latitude);
    expect(latBounds.lte).toBeGreaterThan(latitude);
    expect(lonBounds.gte).toBeLessThan(longitude);
    expect(lonBounds.lte).toBeGreaterThan(longitude);
  });
});
