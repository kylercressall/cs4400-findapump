import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app";
import * as stationService from "../../src/services/station.service";
import * as priceService from "../../src/services/price.services";

vi.mock("../../src/services/station.service", () => ({
  getStationsWithPrices: vi.fn(),
  getStationById: vi.fn(),
  getStationsByLocation: vi.fn(),
}));

vi.mock("../../src/services/price.services", () => ({
  getAllPrices: vi.fn(),
}));

describe("FN-BB backend route tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("FN-BB-ROOT-001: GET / returns 200", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text.toLowerCase()).toContain("hello");
  });

  it("FN-BB-ST-001: GET /api/stations returns station list", async () => {
    vi.mocked(stationService.getStationsWithPrices).mockResolvedValueOnce([
      { id: "station-1", location: {}, stationBrand: {}, FuelPrice: [] },
    ] as any);

    const response = await request(app).get("/api/stations");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].id).toBe("station-1");
  });

  it("FN-BB-ST-101: GET /api/stations/:id returns station when found", async () => {
    vi.mocked(stationService.getStationById).mockResolvedValueOnce({
      id: "station-2",
      location: {},
      stationBrand: {},
      FuelPrice: [],
    } as any);

    const response = await request(app).get("/api/stations/station-2");

    expect(response.status).toBe(200);
    expect(response.body.id).toBe("station-2");
  });

  it("FN-BB-ST-102: GET /api/stations/:id returns 404 when not found", async () => {
    vi.mocked(stationService.getStationById).mockResolvedValueOnce(null as any);

    const response = await request(app).get("/api/stations/missing");

    expect(response.status).toBe(404);
    expect(response.body.error).toContain("Station not found");
  });

  it("FN-BB-ST-201: GET /api/stations/nearby returns stations", async () => {
    vi.mocked(stationService.getStationsByLocation).mockResolvedValueOnce([
      { id: "nearby-1", location: {}, stationBrand: {}, FuelPrice: [] },
    ] as any);

    const response = await request(app).get(
      "/api/stations/nearby?latitude=40.23&longitude=-111.65&radius=5"
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe("nearby-1");
  });

  it("FN-BB-PR-001: GET /api/prices returns payload", async () => {
    vi.mocked(priceService.getAllPrices).mockResolvedValueOnce({
      prices: [],
    } as any);

    const response = await request(app).get("/api/prices");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ prices: [] });
  });
});
